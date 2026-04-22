import * as XLSX from 'xlsx';
import { v4 as uuidv4 } from 'uuid';
import {
  CatalogItem, CatalogImage, CatalogAttachment,
  CifHeaderConfig, ClassificationCode, ParsedCatalog,
  PriceConfiguration, RelatedItem, RelatedItemType, TemplateType,
} from '../types/catalog';
import { CIF30_COLUMN_MAP, CMS_COLUMN_MAP, normalizeHeader } from '../utils/columnMapper';

export function parseExcel(filePath: string, templateType: TemplateType, sessionId?: string): ParsedCatalog {
  const id = sessionId ?? uuidv4();
  const workbook = XLSX.readFile(filePath, { cellText: false, cellDates: false, raw: false });
  const warnings: string[] = [];

  if (templateType === 'CIF30_EXCEL') {
    return parseCif30Excel(workbook, id, warnings);
  } else {
    return parseCmsExcel(workbook, id, warnings);
  }
}

// ─── CIF 3.0 Excel Parser ────────────────────────────────────────────────────

function parseCif30Excel(workbook: XLSX.WorkBook, sessionId: string, warnings: string[]): ParsedCatalog {
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const range = XLSX.utils.decode_range(sheet['!ref'] ?? 'A1:A1');

  const header: CifHeaderConfig = {
    charset: 'UTF-8',
    codeFormat: 'CIF_I_V3.0',
    loadMode: 'F',
    supplierIdDomain: 'NetworkID',
    itemCount: 0,
    unuom: true,
    currency: 'USD',
  };

  let fieldNamesRow = -1;
  let dataStartRow = -1;
  const columnMap: Record<number, keyof CatalogItem> = {};

  // Scan rows for header config and FIELDNAMES
  for (let r = range.s.r; r <= Math.min(range.e.r, 30); r++) {
    const cellA = getCellValue(sheet, r, 0);
    const upperA = cellA.toUpperCase().trim();

    if (upperA === 'CIF_I_V3.0') continue;
    if (upperA === 'DATA') { dataStartRow = r + 1; break; }

    // Check for FIELDNAMES row (could be a header key or the actual row)
    if (upperA === 'FIELDNAMES' || upperA.startsWith('FIELDNAMES:')) {
      fieldNamesRow = r;
      // When cell A contains "FIELDNAMES: Supplier ID", extract the field name
      // after the colon and map it to column 0 (data rows have Supplier ID there)
      if (upperA.startsWith('FIELDNAMES:')) {
        const col0FieldName = normalizeHeader(cellA.slice(cellA.indexOf(':') + 1).trim());
        if (col0FieldName) {
          const mapped = CIF30_COLUMN_MAP[col0FieldName];
          if (mapped) columnMap[0] = mapped;
        }
      }
      for (let c = 1; c <= range.e.c; c++) {
        const fieldName = normalizeHeader(getCellValue(sheet, r, c));
        if (fieldName) {
          const mapped = CIF30_COLUMN_MAP[fieldName];
          if (mapped) columnMap[c] = mapped;
        }
      }
      continue;
    }

    // Parse config key: value from column A
    const colonIdx = upperA.indexOf(':');
    if (colonIdx !== -1) {
      const key = upperA.slice(0, colonIdx).trim();
      // Value could be in same cell after colon OR in next column
      let value = cellA.slice(colonIdx + 1).trim();
      if (!value) value = getCellValue(sheet, r, 1).trim();

      switch (key) {
        case 'CHARSET': header.charset = value; break;
        case 'CODEFORMAT': header.codeFormat = value; break;
        case 'LOADMODE': header.loadMode = value.toUpperCase() === 'I' ? 'I' : 'F'; break;
        case 'SUPPLIERID_DOMAIN': header.supplierIdDomain = value; break;
        case 'ITEMCOUNT': header.itemCount = parseInt(value, 10) || 0; break;
        case 'UNUOM': header.unuom = value.toUpperCase() === 'TRUE'; break;
        case 'CURRENCY': header.currency = value.toUpperCase(); break;
        case 'COMMENTS': header.comments = value; break;
      }
    }
  }

  // If no explicit column map found, try reading row 1 as headers
  if (Object.keys(columnMap).length === 0 && fieldNamesRow === -1) {
    for (let c = 0; c <= range.e.c; c++) {
      const fieldName = normalizeHeader(getCellValue(sheet, 0, c));
      if (fieldName) {
        const mapped = CIF30_COLUMN_MAP[fieldName];
        if (mapped) columnMap[c] = mapped;
      }
    }
    dataStartRow = 1;
  }

  if (dataStartRow === -1) dataStartRow = (fieldNamesRow !== -1 ? fieldNamesRow : 0) + 1;

  const items: CatalogItem[] = [];
  for (let r = dataStartRow; r <= range.e.r; r++) {
    const cellA = getCellValue(sheet, r, 0).toUpperCase().trim();
    if (cellA === 'ENDOFDATA') break;

    const record: Record<string, string> = {};
    for (const [colStr, field] of Object.entries(columnMap)) {
      const col = parseInt(colStr, 10);
      record[field] = sanitize(getCellValue(sheet, r, col));
    }

    const item = buildItemFromRecord(record);
    if (item) items.push(item);
  }

  header.itemCount = items.length;
  return { sessionId, templateType: 'CIF30_EXCEL', header, items, parseWarnings: warnings };
}

// ─── CMS Realms Excel Parser ─────────────────────────────────────────────────

function parseCmsExcel(workbook: XLSX.WorkBook, sessionId: string, warnings: string[]): ParsedCatalog {
  // Parse Headers sheet for config
  const header: CifHeaderConfig = {
    charset: 'UTF-8',
    codeFormat: 'CIF_I_V3.0',
    loadMode: 'F',
    supplierIdDomain: 'NetworkID',
    itemCount: 0,
    unuom: true,
    currency: 'USD',
  };

  const headersSheetName = workbook.SheetNames.find(n => n.toLowerCase().trim() === 'headers');
  if (headersSheetName) {
    const headersSheet = workbook.Sheets[headersSheetName];
    const hRange = XLSX.utils.decode_range(headersSheet['!ref'] ?? 'A1:B20');
    for (let r = hRange.s.r; r <= hRange.e.r; r++) {
      const key = getCellValue(headersSheet, r, 0).toUpperCase().trim();
      const value = getCellValue(headersSheet, r, 1).trim() ||
                    getCellValue(headersSheet, r, 2).trim();
      switch (key) {
        case 'LOADMODE': header.loadMode = value.toUpperCase() === 'I' ? 'I' : 'F'; break;
        case 'SUPPLIERID_DOMAIN': header.supplierIdDomain = value; break;
        case 'UNUOM': header.unuom = value.toUpperCase() === 'TRUE'; break;
        case 'CURRENCY': if (value) header.currency = value.toUpperCase(); break;
        case 'COMMENTS': header.comments = value; break;
      }
    }
  }

  // Parse Items sheet
  const itemsSheetName = workbook.SheetNames.find(n => n.toLowerCase().trim() === 'items');
  if (!itemsSheetName) {
    warnings.push('CMS Items sheet not found');
    return { sessionId, templateType: 'CMS_REALMS', header, items: [], parseWarnings: warnings };
  }

  const itemsSheet = workbook.Sheets[itemsSheetName];
  const iRange = XLSX.utils.decode_range(itemsSheet['!ref'] ?? 'A1:A1');

  // Build composite column key map from rows 0 and 1 (group + sub-field)
  const colKeyMap: Record<number, string> = {};
  for (let c = iRange.s.c; c <= iRange.e.c; c++) {
    const row0 = getCellValue(itemsSheet, 0, c).trim();
    const row1 = getCellValue(itemsSheet, 1, c).trim();
    if (!row0 && !row1) continue;
    // Use row0 as group name if row1 is a sub-field, else just row0
    colKeyMap[c] = row1 ? `${row0}.${row1}` : row0;
  }

  const items: CatalogItem[] = [];
  const dataStartRow = 2; // Rows 0 and 1 are header rows

  for (let r = dataStartRow; r <= iRange.e.r; r++) {
    // Skip empty rows
    const firstCell = getCellValue(itemsSheet, r, iRange.s.c);
    if (!firstCell.trim()) continue;

    const item = parseCmsRow(itemsSheet, r, iRange.e.c, colKeyMap, warnings);
    if (item) items.push(item);
  }

  header.itemCount = items.length;
  return { sessionId, templateType: 'CMS_REALMS', header, items, parseWarnings: warnings };
}

function parseCmsRow(
  sheet: XLSX.WorkSheet,
  rowIdx: number,
  maxCol: number,
  colKeyMap: Record<number, string>,
  _warnings: string[],
): CatalogItem | null {
  const record: Record<string, string> = {};

  for (let c = 0; c <= maxCol; c++) {
    const key = colKeyMap[c];
    if (!key) continue;
    record[key.toLowerCase()] = sanitize(getCellValue(sheet, rowIdx, c));
  }

  // Map simple fields
  const baseItem: Partial<CatalogItem> = {};

  for (const [rawKey, value] of Object.entries(record)) {
    const normalKey = normalizeHeader(rawKey.replace(/\.\w+$/, '')); // strip sub-field for simple lookup
    const mapped = CMS_COLUMN_MAP[normalKey];
    if (mapped && !value) continue;

    switch (normalKey) {
      case 'supplier id': baseItem.supplierId = value; break;
      case 'supplier part id': baseItem.supplierPartId = value; break;
      case 'manufacturer part id': baseItem.manufacturerPartId = value || undefined; break;
      case 'item description': baseItem.itemDescription = value; break;
      case 'unspsc': baseItem.unspscCode = value; break;
      case 'unit price': baseItem.unitPrice = parseFloat(value.replace(/[^\d.-]/g, '')) || 0; break;
      case 'unit of measure': baseItem.unitOfMeasure = value; break;
      case 'currency': baseItem.currency = value.toUpperCase() || 'USD'; break;
      case 'lead time': baseItem.leadTime = parseInt(value, 10) || undefined; break;
      case 'manufacturer name': baseItem.manufacturerName = value || undefined; break;
      case 'supplier url': baseItem.supplierUrl = value || undefined; break;
      case 'manufacturer url': baseItem.manufacturerUrl = value || undefined; break;
      case 'market price': baseItem.marketPrice = value ? (parseFloat(value.replace(/[^\d.-]/g, '')) || undefined) : undefined; break;
      case 'supplier part auxiliary id': baseItem.supplierPartAuxiliaryId = value || undefined; break;
      case 'language': baseItem.language = value || undefined; break;
      case 'short name': baseItem.shortName = value || undefined; break;
      case 'item spec': baseItem.itemSpec = value || undefined; break;
      case 'keywords': baseItem.keywords = value || undefined; break;
      case 'punchout enabled': baseItem.punchOutEnabled = value.toLowerCase() === 'true' || undefined; break;
      case 'punchout level':
      case 'punchoutlevel': baseItem.punchOutLevel = value || undefined; break;
      case 'territory available': baseItem.territoryAvailable = value || undefined; break;
      case 'start date': baseItem.startDate = value || undefined; break;
      case 'end date': baseItem.endDate = value || undefined; break;
      case 'effective date': baseItem.effectiveDate = value || undefined; break;
      case 'expiration date': baseItem.expirationDate = value || undefined; break;
      case 'is preferred item':
      case 'ispreferred': baseItem.isPreferredItem = value.toLowerCase() === 'true' || undefined; break;
      case 'promotion rank': baseItem.promotionRank = parseInt(value, 10) || undefined; break;
      case 'hazardousmaterials':
      case 'hazardous materials': baseItem.hazardousMaterials = value || undefined; break;
      case 'green': baseItem.green = value || undefined; break;
      case 'delete': baseItem.delete = value.toLowerCase() === 'true' || undefined; break;
      case 'parametric name': baseItem.parametricName = value || undefined; break;
      case 'parametric data': baseItem.parametricData = value || undefined; break;
    }
  }

  if (!baseItem.supplierId && !baseItem.supplierPartId) return null;

  // Parse complex repeating groups
  baseItem.classificationCodes = parseCmsClassificationCodes(record);
  baseItem.images = parseCmsImages(record);
  baseItem.attachments = parseCmsAttachments(record);
  baseItem.priceConfigurations = parseCmsPriceConfigs(record);
  baseItem.relatedItems = parseCmsRelatedItems(record);

  // Ensure required fields have defaults
  return {
    supplierId: baseItem.supplierId ?? '',
    supplierPartId: baseItem.supplierPartId ?? '',
    itemDescription: baseItem.itemDescription ?? '',
    unspscCode: baseItem.unspscCode ?? '',
    unitPrice: baseItem.unitPrice ?? 0,
    unitOfMeasure: baseItem.unitOfMeasure ?? '',
    currency: baseItem.currency ?? 'USD',
    ...baseItem,
  } as CatalogItem;
}

function parseCmsClassificationCodes(record: Record<string, string>): ClassificationCode[] | undefined {
  const codes: ClassificationCode[] = [];
  for (let i = 1; i <= 5; i++) {
    const domain = record[`classification codes-${i}.domain`] ?? record[`classification codes.domain`] ?? '';
    const value = record[`classification codes-${i}.value`] ?? record[`classification codes.value`] ?? '';
    if (domain && value) codes.push({ domain, value });
  }
  // Also check primary UNSPSC as classification
  const unspsc = record['unspsc'] ?? '';
  if (unspsc && !codes.some(c => c.domain.toLowerCase() === 'unspsc')) {
    codes.unshift({ domain: 'UNSPSC', value: unspsc });
  }
  return codes.length > 0 ? codes : undefined;
}

function parseCmsImages(record: Record<string, string>): CatalogImage[] | undefined {
  const images: CatalogImage[] = [];

  // Primary image
  const primaryNormal = record['image.normal'] ?? record['image'] ?? '';
  const primaryThumb = record['image.thumbnail'] ?? '';
  const primaryDetail = record['image.detailed'] ?? '';
  if (primaryNormal || primaryThumb || primaryDetail) {
    images.push({ normal: primaryNormal || undefined, thumbnail: primaryThumb || undefined, detailed: primaryDetail || undefined });
  }

  for (let i = 1; i <= 3; i++) {
    const normal = record[`image-${i}.normal`] ?? '';
    const thumb = record[`image-${i}.thumbnail`] ?? '';
    const detail = record[`image-${i}.detailed`] ?? '';
    if (normal || thumb || detail) {
      images.push({ setIndex: i, normal: normal || undefined, thumbnail: thumb || undefined, detailed: detail || undefined });
    }
  }

  return images.length > 0 ? images : undefined;
}

function parseCmsAttachments(record: Record<string, string>): CatalogAttachment[] | undefined {
  const attachments: CatalogAttachment[] = [];
  for (let i = 1; i <= 3; i++) {
    const source = record[`attachments-${i}.source`] ?? record[`attachment-${i}.source`] ?? '';
    const desc = record[`attachments-${i}.description`] ?? record[`attachment-${i}.description`] ?? '';
    if (source) attachments.push({ setIndex: i, source, description: desc || undefined });
  }
  return attachments.length > 0 ? attachments : undefined;
}

function parseCmsPriceConfigs(record: Record<string, string>): PriceConfiguration[] | undefined {
  const configs: PriceConfiguration[] = [];
  for (let i = 1; i <= 3; i++) {
    const amount = record[`priceconfiguration-${i}.amount`] ?? record[`price configuration-${i}.amount`] ?? '';
    if (!amount) continue;
    configs.push({
      setIndex: i,
      amount: parseFloat(amount.replace(/[^\d.-]/g, '')) || undefined,
      priceCurrency: record[`priceconfiguration-${i}.pricecurrency`] ?? record[`price configuration-${i}.pricecurrency`] ?? undefined,
      priceFactor: parseFloatOrUndef(record[`priceconfiguration-${i}.pricefactor`] ?? ''),
      startDate: record[`priceconfiguration-${i}.startdate`] ?? undefined,
      endDate: record[`priceconfiguration-${i}.enddate`] ?? undefined,
      priceKey: record[`priceconfiguration-${i}.pricekey`] ?? undefined,
      lowerBound: parseFloatOrUndef(record[`priceconfiguration-${i}.lowerbound`] ?? ''),
    });
  }
  return configs.length > 0 ? configs : undefined;
}

function parseCmsRelatedItems(record: Record<string, string>): RelatedItem[] | undefined {
  const items: RelatedItem[] = [];
  const validTypes = new Set<RelatedItemType>(['accessories', 'mandatory', 'followup', 'sparepart', 'similar']);
  for (let i = 1; i <= 3; i++) {
    const type = (record[`relateditems-${i}.type`] ?? record[`related items-${i}.type`] ?? '').toLowerCase() as RelatedItemType;
    const partId = record[`relateditems-${i}.supplierpartid`] ?? record[`related items-${i}.supplier part id`] ?? '';
    if (validTypes.has(type) && partId) {
      items.push({ setIndex: i, type, supplierPartId: partId });
    }
  }
  return items.length > 0 ? items : undefined;
}

function getCellValue(sheet: XLSX.WorkSheet, row: number, col: number): string {
  const cell = sheet[XLSX.utils.encode_cell({ r: row, c: col })];
  if (!cell) return '';
  if (cell.t === 'n') return String(cell.v ?? '');
  if (cell.t === 'd') return (cell.v as Date).toISOString().split('T')[0];
  return String(cell.v ?? cell.w ?? '').trim();
}

function sanitize(val: string): string {
  return val.replace(/\0/g, '').trim();
}

function parseFloatOrUndef(val: string): number | undefined {
  const n = parseFloat(val.replace(/[^\d.-]/g, ''));
  return isNaN(n) ? undefined : n;

}

function buildItemFromRecord(record: Record<string, string>): CatalogItem | null {
  const supplierId = sanitize(record['supplierId'] ?? '');
  const supplierPartId = sanitize(record['supplierPartId'] ?? '');
  const itemDescription = sanitize(record['itemDescription'] ?? '');

  if (!supplierId && !supplierPartId && !itemDescription) return null;

  return {
    supplierId,
    supplierPartId,
    itemDescription,
    unspscCode: sanitize(record['unspscCode'] ?? ''),
    unitPrice: parseFloat((record['unitPrice'] ?? '0').replace(/[^\d.-]/g, '')) || 0,
    unitOfMeasure: sanitize(record['unitOfMeasure'] ?? ''),
    currency: sanitize(record['currency'] ?? 'USD').toUpperCase() || 'USD',
    manufacturerPartId: sanitize(record['manufacturerPartId'] ?? '') || undefined,
    manufacturerName: sanitize(record['manufacturerName'] ?? '') || undefined,
    supplierUrl: sanitize(record['supplierUrl'] ?? '') || undefined,
    manufacturerUrl: sanitize(record['manufacturerUrl'] ?? '') || undefined,
    marketPrice: record['marketPrice'] ? (parseFloat(record['marketPrice'].replace(/[^\d.-]/g, '')) || undefined) : undefined,
    supplierPartAuxiliaryId: sanitize(record['supplierPartAuxiliaryId'] ?? '') || undefined,
    language: sanitize(record['language'] ?? '') || undefined,
    leadTime: record['leadTime'] ? (parseInt(record['leadTime'], 10) || undefined) : undefined,
    shortName: sanitize(record['shortName'] ?? '') || undefined,
    imageUrl: sanitize(record['imageUrl'] ?? '') || undefined,
    thumbnailUrl: sanitize(record['thumbnailUrl'] ?? '') || undefined,
    priceUnitQuantity: record['priceUnitQuantity'] ? (parseFloat(record['priceUnitQuantity'].replace(/[^\d.-]/g, '')) || undefined) : undefined,
    priceUnit: sanitize(record['priceUnit'] ?? '') || undefined,
    unitConversion: record['unitConversion'] ? (parseFloat(record['unitConversion'].replace(/[^\d.-]/g, '')) || undefined) : undefined,
    pricingDescription: sanitize(record['pricingDescription'] ?? '') || undefined,
  };
}
