import { Router, Request, Response } from 'express';
import { getSession } from '../utils/sessionStore';
import { generateExcelReport, generatePdfReport } from '../services/reportGenerator';

const router = Router();

router.get('/:sessionId/excel', async (req: Request, res: Response) => {
  const { sessionId } = req.params;
  const session = getSession(sessionId);
  if (!session?.validation) { res.status(404).json({ error: 'Validation not found. Run validation first.' }); return; }

  const buf = await generateExcelReport(session.validation);
  res.set({
    'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'Content-Disposition': `attachment; filename="validation-report-${sessionId.slice(0, 8)}.xlsx"`,
    'Content-Length': String(buf.length),
  });
  res.send(buf);
});

router.get('/:sessionId/pdf', async (req: Request, res: Response) => {
  const { sessionId } = req.params;
  const session = getSession(sessionId);
  if (!session?.validation) { res.status(404).json({ error: 'Validation not found. Run validation first.' }); return; }

  const buf = await generatePdfReport(session.validation);
  res.set({
    'Content-Type': 'application/pdf',
    'Content-Disposition': `attachment; filename="validation-report-${sessionId.slice(0, 8)}.pdf"`,
    'Content-Length': String(buf.length),
  });
  res.send(buf);
});

export default router;
