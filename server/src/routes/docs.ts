import { Router, Request, Response } from 'express';
import fs from 'fs';
import path from 'path';

const router = Router();

const INCLUDED_EXTENSIONS = new Set(['.pdf', '.xlsx', '.csv']);
const EXCLUDED_EXTENSIONS = new Set(['.zip', '.docx', '.pptx', '.jpg', '.jpeg', '.png', '.txt']);
const BUYER_NAME_RE = /^[a-zA-Z0-9 &.\-']+$/;

type DocCategory = 'guide' | 'template' | 'commodity' | 'uom' | 'other';

interface DocFile {
  id: string;
  name: string;
  folder: string;
  size: number;
  category: DocCategory;
  extension: string;
}

function getDocsBasePath(): string | null {
  return process.env.CATALOG_DOCS_PATH || null;
}

function categorize(fileName: string, ext: string): DocCategory {
  if (ext === '.pdf') return 'guide';
  const lower = fileName.toLowerCase().replace(/[^a-z0-9]/g, '');
  if (lower.includes('template')) return 'template';
  if (lower.includes('commodity') || lower.includes('commoditycode') || lower.includes('unspsc')) return 'commodity';
  if (lower.includes('unitofmeasure') || lower.includes('uom')) return 'uom';
  return 'other';
}

function scanBuyerDir(buyerDir: string, subDir: string, results: DocFile[]): void {
  let entries: fs.Dirent[];
  try {
    entries = fs.readdirSync(buyerDir, { withFileTypes: true });
  } catch {
    return;
  }

  for (const entry of entries) {
    if (entry.name.startsWith('keepRunning')) continue;

    const fullPath = path.join(buyerDir, entry.name);

    if (entry.isDirectory()) {
      scanBuyerDir(fullPath, entry.name, results);
      continue;
    }

    const ext = path.extname(entry.name).toLowerCase();
    if (EXCLUDED_EXTENSIONS.has(ext) || !INCLUDED_EXTENSIONS.has(ext)) continue;

    const relativePath = subDir ? `${subDir}/${entry.name}` : entry.name;
    const id = Buffer.from(relativePath).toString('base64url');

    let size = 0;
    try {
      size = fs.statSync(fullPath).size;
    } catch {
      // leave 0
    }

    results.push({
      id,
      name: entry.name,
      folder: subDir,
      size,
      category: categorize(entry.name, ext),
      extension: ext.slice(1),
    });
  }
}

// GET /api/docs/buyers
router.get('/buyers', (_req: Request, res: Response) => {
  const basePath = getDocsBasePath();
  if (!basePath) {
    res.json([]);
    return;
  }

  let entries: fs.Dirent[];
  try {
    entries = fs.readdirSync(basePath, { withFileTypes: true });
  } catch {
    res.json([]);
    return;
  }

  const buyers = entries
    .filter(e => e.isDirectory() && !e.name.startsWith('.'))
    .map(e => e.name)
    .sort((a, b) => a.localeCompare(b));

  res.json(buyers);
});

// GET /api/docs/buyers/:buyer/files
router.get('/buyers/:buyer/files', (req: Request, res: Response) => {
  const { buyer } = req.params;

  if (!BUYER_NAME_RE.test(buyer) || buyer.includes('..') || buyer.includes('/')) {
    res.status(400).json({ error: 'Invalid buyer name' });
    return;
  }

  const basePath = getDocsBasePath();
  if (!basePath) {
    res.json([]);
    return;
  }

  const buyerDir = path.resolve(basePath, buyer);
  if (!buyerDir.startsWith(path.resolve(basePath))) {
    res.status(400).json({ error: 'Invalid buyer name' });
    return;
  }

  if (!fs.existsSync(buyerDir)) {
    res.status(404).json({ error: 'Buyer not found' });
    return;
  }

  const files: DocFile[] = [];
  scanBuyerDir(buyerDir, '', files);
  res.json(files);
});

// GET /api/docs/buyers/:buyer/files/:fileId
router.get('/buyers/:buyer/files/:fileId', (req: Request, res: Response) => {
  const { buyer, fileId } = req.params;

  if (!BUYER_NAME_RE.test(buyer) || buyer.includes('..') || buyer.includes('/')) {
    res.status(400).json({ error: 'Invalid buyer name' });
    return;
  }

  const basePath = getDocsBasePath();
  if (!basePath) {
    res.status(503).json({ error: 'Docs path not configured' });
    return;
  }

  let relativePath: string;
  try {
    relativePath = Buffer.from(fileId, 'base64url').toString('utf-8');
  } catch {
    res.status(400).json({ error: 'Invalid file ID' });
    return;
  }

  // Prevent path traversal
  if (relativePath.includes('..')) {
    res.status(400).json({ error: 'Invalid file ID' });
    return;
  }

  const buyerDir = path.resolve(basePath, buyer);
  const filePath = path.resolve(buyerDir, relativePath);

  if (!buyerDir.startsWith(path.resolve(basePath)) || !filePath.startsWith(buyerDir)) {
    res.status(400).json({ error: 'Invalid file ID' });
    return;
  }

  if (!fs.existsSync(filePath)) {
    res.status(404).json({ error: 'File not found' });
    return;
  }

  const ext = path.extname(filePath).toLowerCase();
  const fileName = path.basename(filePath);

  if (ext === '.pdf') {
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${fileName}"`);
  } else if (ext === '.xlsx') {
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
  } else if (ext === '.csv') {
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
  } else {
    res.status(400).json({ error: 'Unsupported file type' });
    return;
  }

  res.sendFile(filePath);
});

export default router;
