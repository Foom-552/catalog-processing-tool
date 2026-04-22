import { Router, Request, Response } from 'express';
import { getSession, updateSession } from '../utils/sessionStore';
import { validateCatalog } from '../services/validator';
import { loadBuyerRules } from '../services/buyerRulesLoader';

const BUYER_NAME_RE = /^[a-zA-Z0-9 &.\-']+$/;

const router = Router();

router.post('/', async (req: Request, res: Response) => {
  const { sessionId, buyer } = req.body as { sessionId: string; buyer?: string };
  if (!sessionId) { res.status(400).json({ error: 'sessionId is required' }); return; }

  const session = getSession(sessionId);
  if (!session) { res.status(404).json({ error: 'Session not found or expired' }); return; }

  const buyerRules = (buyer && BUYER_NAME_RE.test(buyer) && !buyer.includes('..') && !buyer.includes('/'))
    ? await loadBuyerRules(buyer)
    : undefined;

  const validation = validateCatalog(sessionId, session.catalog.header, session.catalog.items, buyerRules);
  updateSession(sessionId, { validation });

  res.json({ sessionId, validation });
});

export default router;
