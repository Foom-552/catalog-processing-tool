import { ParsedCatalog } from '../types/catalog';

// Standard CIF 3.0 field names — matches example reference (comma-separated)
// PunchOut Enabled + PunchOut Level placed after Currency per the example
const CIF_FIELD_ORDER = [
  'Supplier ID', 'Supplier Part ID', 'Manufacturer Part ID', 'Item Description',
  'SPSC Code', 'Unit Price', 'Unit of Measure', 'Lead Time', 'Manufacturer Name',
  'Supplier URL', 'Manufacturer URL', 'Market Price', 'Currency',
  'PunchOut Enabled', 'PunchOut Level', 'Short Name', 'Image', 'Thumbnail',
  'Supplier Part Auxiliary ID', 'Language', 'Price Unit Quantity', 'Price Unit', 'Unit Conversion',
];

// RFC 4180 CSV escape: wrap in quotes if the value contains a comma, quote, or newline
function csvEscape(value: string): string {
  const v = value.replace(/\r\n|\r|\n/g, ' ');
  if (v.includes(',') || v.includes('"')) {
    return '"' + v.replace(/"/g, '""') + '"';
  }
  return v;
}

function todayISO(): string {
  return new Date().toISOString().split('T')[0];
}

export function generateCifText(catalog: ParsedCatalog): { cifText: string; log: string[] } {
  const { header, items } = catalog;
  const log: string[] = [];
  const lines: string[] = [];

  lines.push('CIF_I_V3.0');
  lines.push(`CHARSET: ${header.charset ?? 'UTF-8'}`);
  lines.push(`CODEFORMAT: ${header.codeFormat ?? 'UNSPSC_V13.5'}`);
  lines.push(`LOADMODE: ${header.loadMode ?? 'F'}`);
  lines.push(`SUPPLIERID_DOMAIN: ${header.supplierIdDomain ?? 'NetworkID'}`);
  lines.push(`CURRENCY: ${header.currency ?? 'USD'}`);
  lines.push(`UNUOM: ${header.unuom !== false ? 'TRUE' : 'FALSE'}`);
  lines.push(`ITEMCOUNT: ${items.length}`);
  lines.push(`TIMESTAMP: ${todayISO()}`);
  if (header.comments) lines.push(`COMMENTS: ${header.comments}`);
  lines.push(`FIELDNAMES: ${CIF_FIELD_ORDER.join(',')}`);
  lines.push('DATA');

  let cmsDropped = false;

  for (const item of items) {
    if (!cmsDropped) {
      if (item.priceConfigurations?.length) { log.push('INFO: PriceConfiguration fields dropped (not supported in CIF 3.0 text format)'); cmsDropped = true; }
      if (item.relatedItems?.length) { log.push('INFO: RelatedItems fields dropped (not supported in CIF 3.0 text format)'); cmsDropped = true; }
      if (item.attachments?.length) { log.push('INFO: Attachments dropped (not supported in CIF 3.0 text format)'); cmsDropped = true; }
      if (item.parametricData) { log.push('INFO: ParametricData dropped (not supported in CIF 3.0 text format)'); cmsDropped = true; }
      if (item.images && item.images.length > 1) { log.push('INFO: Multiple Images reduced to first image URL'); }
    }

    // Resolve image URL: prefer flat imageUrl, fall back to first item in images array
    const imageUrl = item.imageUrl ?? item.images?.[0]?.normal ?? '';
    const thumbnailUrl = item.thumbnailUrl ?? item.images?.[0]?.thumbnail ?? '';

    const row = [
      item.supplierId ?? '',
      item.supplierPartId ?? '',
      item.manufacturerPartId ?? '',
      item.itemDescription ?? '',
      item.unspscCode ?? '',
      item.unitPrice !== undefined ? String(item.unitPrice) : '',
      item.unitOfMeasure ?? '',
      item.leadTime !== undefined ? String(item.leadTime) : '',
      item.manufacturerName ?? '',
      item.supplierUrl ?? '',
      item.manufacturerUrl ?? '',
      item.marketPrice !== undefined ? String(item.marketPrice) : '',
      item.currency ?? '',
      item.punchOutEnabled !== undefined ? String(item.punchOutEnabled).toUpperCase() : '',
      item.punchOutLevel ?? '',
      item.shortName ?? '',
      imageUrl,
      thumbnailUrl,
      item.supplierPartAuxiliaryId ?? '',
      item.language ?? '',
      item.priceUnitQuantity !== undefined ? String(item.priceUnitQuantity) : '',
      item.priceUnit ?? '',
      item.unitConversion !== undefined ? String(item.unitConversion) : '',
    ].map(csvEscape);

    lines.push(row.join(','));
  }

  lines.push('ENDOFDATA');

  const cifText = lines.join('\r\n');
  return { cifText, log };
}
