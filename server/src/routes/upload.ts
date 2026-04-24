import { Router, Request, Response } from 'express';
import * as path from 'path';
import * as fs from 'fs';
import { upload } from '../middleware/multerConfig';
import { uploadLimiter } from '../middleware/rateLimiter';
import { detectTemplate } from '../services/templateDetector';
import { parseCifText } from '../services/cifParser';
import { parseExcel } from '../services/excelParser';
import { setSession } from '../utils/sessionStore';
import { extractCatalogFromZip } from '../utils/zipExtractor';
import { v4 as uuidv4 } from 'uuid';

const router = Router();
const uploadDir = process.env.UPLOAD_DIR ?? './uploads';

router.post('/', uploadLimiter, upload.single('file'), async (req: Request, res: Response) => {
  if (!req.file) {
    res.status(400).json({ error: 'No file uploaded' });
    return;
  }

  const sessionId = uuidv4();
  let filePath = req.file.path;
  let originalname = req.file.originalname;
  let size = req.file.size;

  const ext = path.extname(originalname).toLowerCase();
  if (ext === '.zip') {
    try {
      const extracted = extractCatalogFromZip(filePath, uploadDir);
      fs.unlinkSync(filePath);
      filePath = extracted.extractedPath;
      originalname = extracted.originalName;
      size = extracted.size;
    } catch (err) {
      fs.unlink(filePath, () => {});
      res.status(400).json({
        error: err instanceof Error ? err.message : 'Failed to extract ZIP file',
      });
      return;
    }
  }

  const detection = detectTemplate(filePath, originalname);

  let catalog;
  if (detection.templateType === 'CIF_TEXT') {
    catalog = parseCifText(filePath, sessionId);
  } else if (detection.templateType === 'CIF30_EXCEL' || detection.templateType === 'CMS_REALMS') {
    catalog = parseExcel(filePath, detection.templateType, sessionId);
  } else {
    try {
      catalog = parseExcel(filePath, 'CIF30_EXCEL', sessionId);
    } catch {
      res.status(422).json({
        error: 'Could not parse file. Please upload a CIF 3.0 Excel (.xls), CMS Realms Excel (.xlsx), or CIF text (.cif) file.',
        detection,
      });
      return;
    }
  }

  setSession(sessionId, { catalog, filePath, createdAt: Date.now() });

  res.json({
    sessionId,
    fileName: originalname,
    fileSize: size,
    detection,
  });
});

export default router;
