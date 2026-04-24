import AdmZip from 'adm-zip';
import * as path from 'path';
import * as fs from 'fs';
import * as crypto from 'crypto';

const CATALOG_EXTENSIONS = new Set(['.cif', '.xls', '.xlsx', '.csv', '.txt']);

interface ExtractedFile {
  extractedPath: string;
  originalName: string;
  size: number;
}

export function extractCatalogFromZip(zipPath: string, uploadDir: string): ExtractedFile {
  const zip = new AdmZip(zipPath);
  const entries = zip.getEntries();

  const match = entries.find(entry => {
    if (entry.isDirectory) return false;
    const name = entry.entryName;
    if (name.startsWith('__MACOSX') || path.basename(name).startsWith('.')) return false;
    return CATALOG_EXTENSIONS.has(path.extname(name).toLowerCase());
  });

  if (!match) {
    throw new Error('No catalog file found in ZIP. Expected .cif, .xls, .xlsx, or .csv inside the archive.');
  }

  const ext = path.extname(match.entryName).toLowerCase();
  const uniqueName = crypto.randomBytes(8).toString('hex') + ext;
  const extractedPath = path.join(uploadDir, uniqueName);

  fs.writeFileSync(extractedPath, match.getData());

  return {
    extractedPath,
    originalName: path.basename(match.entryName),
    size: match.header.size,
  };
}
