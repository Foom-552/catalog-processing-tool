import { Router, Request, Response } from 'express';
import { getSession, updateSession } from '../utils/sessionStore';
import { validateCatalog } from '../services/validator';

const router = Router();

router.post('/', async (req: Request, res: Response) => {
  const { sessionId } = req.body as { sessionId: string };
  if (!sessionId) { res.status(400).json({ error: 'sessionId is required' }); return; }

  const session = getSession(sessionId);
  if (!session) { res.status(404).json({ error: 'Session not found or expired' }); return; }

  const validation = validateCatalog(sessionId, session.catalog.header, session.catalog.items);
  updateSession(sessionId, { validation });

  res.json({ sessionId, validation });
});

export default router;
