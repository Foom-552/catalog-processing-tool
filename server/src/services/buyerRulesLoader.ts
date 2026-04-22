import fs from 'fs';
import path from 'path';
import * as xlsx from 'xlsx';
import { BuyerValidationRules } from '../types/catalog';

const INCLUDED_EXTS = new Set(['.csv', '.xlsx', '.xls']);

// Cache entries expire after 5 minutes
const cache = new Map<string, { rules: BuyerValidationRules; loadedAt: number }>();
const CACHE_TTL = 5 * 60 * 1000;

function normalizeKey(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]/g, '');
}

function isCommodityFile(name: string): boolean {
  const n = normalizeKey(name);
  return n.includes('commodity') || n.includes('commoditycode') || n.includes('unspsc');
}

function isUomFile(name: string): boolean {
  const n = normalizeKey(name);
  return n.includes('unitofmeasure') || (n.includes('uom') && !n.includes('unspsc'));
}

function findFiles(dir: string, results: { filePath: string; isComm: boolean; isUom: boolean }[]): void {
  let entries: fs.Dirent[];
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      findFiles(fullPath, results);
      continue;
    }
    const ext = path.extname(entry.name).toLowerCase();
    if (!INCLUDED_EXTS.has(ext)) continue;
    const isComm = isCommodityFile(entry.name);
    const isUom = isUomFile(entry.name);
    if (isComm || isUom) {
      results.push({ filePath: fullPath, isComm, isUom });
    }
  }
}

function parseFile(filePath: string): string[][] {
  try {
    const wb = xlsx.readFile(filePath, { type: 'file', raw: false });
    const sheetName = wb.SheetNames[0];
    if (!sheetName) return [];
    const sheet = wb.Sheets[sheetName];
    const rows = xlsx.utils.sheet_to_json<string[]>(sheet, { header: 1, defval: '' }) as string[][];
    return rows;
  } catch (err) {
    console.warn(`[buyerRulesLoader] Failed to parse ${filePath}: ${err}`);
    return [];
  }
}

function findHeaderRow(rows: string[][]): { rowIdx: number; headers: string[] } | null {
  for (let i = 0; i < Math.min(6, rows.length); i++) {
    const normalized = rows[i].map(c => normalizeKey(String(c)));
    if (normalized.includes('uniquename')) {
      return { rowIdx: i, headers: normalized };
    }
  }
  return null;
}

function parseCommodityCodes(rows: string[][]): Set<string> {
  const codes = new Set<string>();
  const header = findHeaderRow(rows);
  if (!header) return codes;

  const { rowIdx, headers } = header;
  const domainIdx = headers.indexOf('domain');
  const nameIdx = headers.indexOf('uniquename');
  const enabledIdx = headers.indexOf('enabled');

  if (nameIdx === -1) return codes;

  for (let i = rowIdx + 1; i < rows.length; i++) {
    const row = rows[i];
    const uniqueName = String(row[nameIdx] ?? '').trim();
    if (!uniqueName) continue;

    // Only include UNSPSC domain (if domain column exists)
    if (domainIdx !== -1) {
      const domain = String(row[domainIdx] ?? '').trim().toLowerCase();
      if (domain && domain !== 'unspsc') continue;
    }

    // Only include enabled codes (if enabled column exists)
    if (enabledIdx !== -1) {
      const enabled = String(row[enabledIdx] ?? '').trim().toLowerCase();
      if (enabled && enabled !== 'yes') continue;
    }

    codes.add(uniqueName.toUpperCase());
  }
  return codes;
}

function parseUomCodes(rows: string[][]): Set<string> {
  const codes = new Set<string>();
  const header = findHeaderRow(rows);
  if (!header) return codes;

  const { rowIdx, headers } = header;
  const nameIdx = headers.indexOf('uniquename');
  if (nameIdx === -1) return codes;

  for (let i = rowIdx + 1; i < rows.length; i++) {
    const row = rows[i];
    const uniqueName = String(row[nameIdx] ?? '').trim();
    if (!uniqueName) continue;
    codes.add(uniqueName.toUpperCase());
  }
  return codes;
}

export async function loadBuyerRules(buyer: string): Promise<BuyerValidationRules> {
  const cached = cache.get(buyer);
  if (cached && Date.now() - cached.loadedAt < CACHE_TTL) {
    return cached.rules;
  }

  const basePath = process.env.CATALOG_DOCS_PATH;
  const empty: BuyerValidationRules = {
    buyer,
    commodityCodes: new Set(),
    uomCodes: new Set(),
    hasCommodityFile: false,
    hasUomFile: false,
  };

  if (!basePath) return empty;

  const buyerDir = path.resolve(basePath, buyer);
  if (!buyerDir.startsWith(path.resolve(basePath)) || !fs.existsSync(buyerDir)) {
    return empty;
  }

  const found: { filePath: string; isComm: boolean; isUom: boolean }[] = [];
  findFiles(buyerDir, found);

  const commodityCodes = new Set<string>();
  const uomCodes = new Set<string>();
  let hasCommodityFile = false;
  let hasUomFile = false;

  for (const { filePath, isComm, isUom } of found) {
    const rows = parseFile(filePath);
    if (rows.length === 0) continue;

    if (isComm) {
      const codes = parseCommodityCodes(rows);
      if (codes.size > 0) {
        hasCommodityFile = true;
        for (const c of codes) commodityCodes.add(c);
      }
    }

    if (isUom) {
      const codes = parseUomCodes(rows);
      if (codes.size > 0) {
        hasUomFile = true;
        for (const c of codes) uomCodes.add(c);
      }
    }
  }

  const rules: BuyerValidationRules = { buyer, commodityCodes, uomCodes, hasCommodityFile, hasUomFile };
  cache.set(buyer, { rules, loadedAt: Date.now() });
  return rules;
}
