import * as XLSX from 'xlsx';
import * as fs from 'fs';
import { DetectionResult, TemplateType } from '../types/catalog';

const CIF30_HEADER_SIGNALS = new Set([
  'charset', 'codeformat', 'cif_i_v3.0', 'loadmode', 'supplierid_domain',
  'itemcount', 'unuom', 'fieldnames', 'endofdata', 'data',
]);

const CMS_SHEET_NAMES = ['instructions', 'headers', 'items', 'sample formats'];

export function detectTemplate(filePath: string, originalFileName: string): DetectionResult {
  const ext = originalFileName.split('.').pop()?.toLowerCase() ?? '';
  const features: string[] = [];
  const warnings: string[] = [];

  // Fast path for .cif text files
  if (ext === 'cif') {
    const sample = fs.readFileSync(filePath, 'utf-8').slice(0, 4096).toLowerCase();
    if (sample.includes('charset:') || sample.includes('codeformat:') || sample.includes('cif_i_v3.0')) {
      features.push('extension_cif', 'cif_header_found');
      return { templateType: 'CIF_TEXT', confidence: 'HIGH', detectedFeatures: features, warnings };
    }
    return { templateType: 'UNKNOWN', confidence: 'LOW', detectedFeatures: features, warnings: ['CIF file header not found'] };
  }

  if (!['xls', 'xlsx', 'csv'].includes(ext)) {
    // Try reading as text for pipe-delimited or tab-delimited CIF
    try {
      const sample = fs.readFileSync(filePath, 'utf-8').slice(0, 4096).toLowerCase();
      if (sample.includes('cif_i_v3.0') || sample.includes('charset:')) {
        features.push('text_cif_detected');
        return { templateType: 'CIF_TEXT', confidence: 'MEDIUM', detectedFeatures: features, warnings };
      }
    } catch { /* ignore */ }
    return { templateType: 'UNKNOWN', confidence: 'LOW', detectedFeatures: features, warnings: ['Unsupported file type'] };
  }

  // Read workbook (just sheet names first)
  let workbook: XLSX.WorkBook;
  try {
    workbook = XLSX.readFile(filePath, { bookSheets: true });
  } catch (e) {
    warnings.push('Failed to open workbook: ' + String(e));
    return { templateType: 'UNKNOWN', confidence: 'LOW', detectedFeatures: features, warnings };
  }

  const sheetNames = workbook.SheetNames.map(s => s.toLowerCase().trim());
  const scores: Record<TemplateType, number> = { CIF30_EXCEL: 0, CMS_REALMS: 0, CIF_TEXT: 0, UNKNOWN: 0 };

  // Sheet-name signals
  const matchedCmsSheets = CMS_SHEET_NAMES.filter(n => sheetNames.includes(n));
  if (matchedCmsSheets.length >= 3) {
    scores.CMS_REALMS += matchedCmsSheets.length * 2;
    features.push(`cms_sheets_matched: ${matchedCmsSheets.join(',')}`);
  }
  if (sheetNames.length >= 4) {
    scores.CMS_REALMS += 1;
    features.push('sheet_count_4+');
  }
  if (sheetNames.length === 1) {
    scores.CIF30_EXCEL += 3;
    features.push('single_sheet');
  }

  // Load full workbook for content inspection
  try {
    workbook = XLSX.readFile(filePath, { cellText: true, cellDates: false });
  } catch (e) {
    warnings.push('Full workbook read failed: ' + String(e));
  }

  if (scores.CMS_REALMS > scores.CIF30_EXCEL) {
    // Inspect Items sheet
    const itemsSheetName = workbook.SheetNames.find(n => n.toLowerCase().trim() === 'items');
    if (itemsSheetName) {
      const sheet = workbook.Sheets[itemsSheetName];
      const range = XLSX.utils.decode_range(sheet['!ref'] ?? 'A1:A1');
      const colCount = range.e.c - range.s.c + 1;
      if (colCount > 80) {
        scores.CMS_REALMS += 3;
        features.push(`items_sheet_cols_${colCount}`);
      }
      // Check row 1 headers for CMS-specific fields
      const cmsSignals = ['priceconfiguration', 'relateditems', 'classification codes', 'punchout'];
      for (let c = range.s.c; c <= Math.min(range.e.c, range.s.c + 50); c++) {
        const cell = sheet[XLSX.utils.encode_cell({ r: 0, c })];
        const val = (cell?.v ?? '').toString().toLowerCase();
        for (const sig of cmsSignals) {
          if (val.includes(sig)) {
            scores.CMS_REALMS += 3;
            features.push(`cms_column: ${val}`);
            break;
          }
        }
      }
    }
  } else {
    // Inspect first sheet for CIF30 signals
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    if (sheet) {
      const range = XLSX.utils.decode_range(sheet['!ref'] ?? 'A1:A1');
      const maxRow = Math.min(range.e.r, 20);
      for (let r = range.s.r; r <= maxRow; r++) {
        const cellA = sheet[XLSX.utils.encode_cell({ r, c: 0 })];
        const val = (cellA?.v ?? '').toString().toLowerCase().trim();
        if (val === 'cif_i_v3.0') {
          scores.CIF30_EXCEL += 5;
          features.push('cif_version_header');
        }
        if (val.startsWith('codeformat:') || val === 'codeformat') {
          scores.CIF30_EXCEL += 5;
          features.push('codeformat_found');
        }
        if (val.startsWith('charset:') || val === 'charset') {
          scores.CIF30_EXCEL += 2;
          features.push('charset_found');
        }
        if (val === 'fieldnames' || val.startsWith('fieldnames:')) {
          scores.CIF30_EXCEL += 3;
          features.push('fieldnames_found');
        }
      }
    }
  }

  const winner = (Object.entries(scores) as [TemplateType, number][])
    .filter(([t]) => t !== 'UNKNOWN' && t !== 'CIF_TEXT')
    .sort(([, a], [, b]) => b - a)[0];

  if (!winner || winner[1] === 0) {
    return { templateType: 'UNKNOWN', confidence: 'LOW', detectedFeatures: features, warnings: ['Could not determine template type'] };
  }

  const confidence = winner[1] >= 10 ? 'HIGH' : winner[1] >= 5 ? 'MEDIUM' : 'LOW';
  return { templateType: winner[0], confidence, detectedFeatures: features, warnings };
}
