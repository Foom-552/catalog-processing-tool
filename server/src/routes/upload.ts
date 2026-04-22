import { Router, Request, Response } from 'express';
import { upload } from '../middleware/multerConfig';
import { detectTemplate } from '../services/templateDetector';
import { parseCifText } from '../services/cifParser';
import { parseExcel } from '../services/excelParser';
import { setSession } from '../utils/sessionStore';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

router.post('/', upload.single('file'), async (req: Request, res: Response) => {
  if (!req.file) {
    res.status(400).json({ error: 'No file uploaded' });
    return;
  }

  const sessionId = uuidv4();
  const { path: filePath, originalname, size } = req.file;
  const detection = detectTemplate(filePath, originalname);

  let catalog;
  if (detection.templateType === 'CIF_TEXT') {
    catalog = parseCifText(filePath, sessionId);
  } else if (detection.templateType === 'CIF30_EXCEL' || detection.templateType === 'CMS_REALMS') {
    catalog = parseExcel(filePath, detection.templateType, sessionId);
  } else {
    // Still parse as CIF30 as fallback attempt
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
