import * as fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { CatalogItem, CifHeaderConfig, ParsedCatalog } from '../types/catalog';
import { normalizeHeader } from '../utils/columnMapper';

export function parseCifText(filePath: string, sessionId?: string): ParsedCatalog {
  const id = sessionId ?? uuidv4();
  const text = fs.readFileSync(filePath, 'utf-8');
  const lines = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
  const warnings: string[] = [];

  const header: CifHeaderConfig = {
    charset: 'UTF-8',
    codeFormat: 'CIF_I_V3.0',
    loadMode: 'F',
    supplierIdDomain: 'NetworkID',
    itemCount: 0,
    unuom: true,
    currency: 'USD',
  };

  let fieldNames: string[] = [];
  let separator: ',' | '\t' = '\t';
  let inData = false;
  const items: CatalogItem[] = [];
  let lineIdx = 0;

  for (const line of lines) {
    lineIdx++;
    const trimmed = line.trim();
    if (!trimmed) continue;

    if (trimmed.toUpperCase() === 'CIF_I_V3.0') continue;

    if (trimmed.toUpperCase() === 'DATA') {
      inData = true;
      continue;
    }

    if (trimmed.toUpperCase() === 'ENDOFDATA') {
      inData = false;
      continue;
    }

    if (!inData) {
      const colonIdx = trimmed.indexOf(':');
      if (colonIdx === -1) continue;
      const key = trimmed.slice(0, colonIdx).trim().toUpperCase();
      const value = trimmed.slice(colonIdx + 1).trim();

      switch (key) {
        case 'CHARSET': header.charset = value; break;
        case 'CODEFORMAT': header.codeFormat = value; break;
        case 'LOADMODE': header.loadMode = (value.toUpperCase() === 'I' ? 'I' : 'F'); break;
        case 'SUPPLIERID_DOMAIN': header.supplierIdDomain = value; break;
        case 'ITEMCOUNT': header.itemCount = parseInt(value, 10) || 0; break;
        case 'UNUOM': header.unuom = value.toUpperCase() === 'TRUE'; break;
        case 'CURRENCY': header.currency = value.toUpperCase(); break;
        case 'COMMENTS': header.comments = value; break;
        case 'FIELDNAMES': {
          // Detect separator from whether the value contains tabs
          separator = value.includes('\t') ? '\t' : ',';
          fieldNames = separator === '\t'
            ? value.split('\t').map(f => f.trim())
            : parseCSVLine(value).map(f => f.trim());
          break;
        }
      }
    } else {
      if (fieldNames.length === 0) {
        warnings.push(`Line ${lineIdx}: Data row found before FIELDNAMES`);
        continue;
      }
      const fields = separator === '\t' ? line.split('\t') : parseCSVLine(line);
      const item = parseDataRow(fields, fieldNames, warnings, lineIdx);
      if (item) items.push(item);
    }
  }

  header.itemCount = items.length;
  return { sessionId: id, templateType: 'CIF_TEXT', header, items, parseWarnings: warnings };
}

// RFC 4180-compatible CSV parser (handles quoted fields with embedded commas/quotes)
function parseCSVLine(line: string): string[] {
  const fields: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (line[i + 1] === '"') { current += '"'; i++; }
        else inQuotes = false;
      } else {
        current += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ',') {
        fields.push(current);
        current = '';
      } else {
        current += ch;
      }
    }
  }
  fields.push(current);
  return fields;
}

function parseDataRow(
  fields: string[],
  fieldNames: string[],
  warnings: string[],
  lineIdx: number,
): CatalogItem | null {
  const record: Record<string, string> = {};
  for (let i = 0; i < fieldNames.length; i++) {
    record[normalizeHeader(fieldNames[i])] = (fields[i] ?? '').trim();
  }

  const supplierId = record['supplier id'] ?? record['supplierid'] ?? '';
  const supplierPartId = record['supplier part id'] ?? record['supplierpartid'] ?? '';
  const itemDescription = record['item description'] ?? record['itemdescription'] ?? '';

  if (!supplierId && !supplierPartId && !itemDescription) return null;

  const unspscRaw = record['spsc code'] ?? record['unspsc code'] ?? record['spsccode'] ?? record['unspsccode'] ?? '';
  const unitPriceRaw = record['unit price'] ?? record['unitprice'] ?? '0';
  const unitOfMeasure = record['unit of measure'] ?? record['unitofmeasure'] ?? '';
  const currency = record['currency'] ?? 'USD';
  const marketPriceRaw = record['market price'] ?? record['marketprice'] ?? '';
  const leadTimeRaw = record['lead time'] ?? record['leadtime'] ?? '';
  const priceUnitQuantityRaw = record['price unit quantity'] ?? record['priceunitquantity'] ?? '';
  const unitConversionRaw = record['unit conversion'] ?? record['unitconversion'] ?? '';
  const punchOutEnabledRaw = record['punchout enabled'] ?? record['punchoutenabled'] ?? '';
  const punchOutLevelRaw = sanitize(record['punchout level'] ?? record['punchoutlevel'] ?? '');

  return {
    supplierId: sanitize(supplierId),
    supplierPartId: sanitize(supplierPartId),
    itemDescription: sanitize(itemDescription),
    unspscCode: sanitize(unspscRaw),
    unitPrice: parseFloat(unitPriceRaw.replace(/[^\d.-]/g, '')) || 0,
    unitOfMeasure: sanitize(unitOfMeasure),
    currency: sanitize(currency).toUpperCase() || 'USD',
    manufacturerPartId: sanitize(record['manufacturer part id'] ?? record['manufacturerpartid'] ?? '') || undefined,
    manufacturerName: sanitize(record['manufacturer name'] ?? record['manufacturername'] ?? '') || undefined,
    supplierUrl: sanitize(record['supplier url'] ?? record['supplierurl'] ?? '') || undefined,
    manufacturerUrl: sanitize(record['manufacturer url'] ?? record['manufacturerurl'] ?? '') || undefined,
    marketPrice: marketPriceRaw ? (parseFloat(marketPriceRaw.replace(/[^\d.-]/g, '')) || undefined) : undefined,
    supplierPartAuxiliaryId: sanitize(record['supplier part auxiliary id'] ?? record['supplierpartauxiliaryid'] ?? '') || undefined,
    language: sanitize(record['language'] ?? '') || undefined,
    leadTime: leadTimeRaw ? (parseInt(leadTimeRaw, 10) || undefined) : undefined,
    shortName: sanitize(record['short name'] ?? record['shortname'] ?? '') || undefined,
    imageUrl: sanitize(record['image'] ?? '') || undefined,
    thumbnailUrl: sanitize(record['thumbnail'] ?? '') || undefined,
    priceUnitQuantity: priceUnitQuantityRaw ? (parseFloat(priceUnitQuantityRaw.replace(/[^\d.-]/g, '')) || undefined) : undefined,
    priceUnit: sanitize(record['price unit'] ?? record['priceunit'] ?? '') || undefined,
    unitConversion: unitConversionRaw ? (parseFloat(unitConversionRaw.replace(/[^\d.-]/g, '')) || undefined) : undefined,
    pricingDescription: sanitize(record['pricing description'] ?? record['pricingdescription'] ?? '') || undefined,
    punchOutEnabled: punchOutEnabledRaw.toUpperCase() === 'TRUE' ? true : (punchOutEnabledRaw ? false : undefined),
    punchOutLevel: punchOutLevelRaw || undefined,
  };
}

function sanitize(val: string): string {
  return val.replace(/\0/g, '').trim();
}
