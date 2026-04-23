import { Router } from 'express';
import { apiLimiter } from '../middleware/rateLimiter';
import uploadRouter from './upload';
import validateRouter from './validate';
import convertRouter from './convert';
import reportRouter from './report';
import downloadRouter from './download';

const router = Router();

router.use('/upload', uploadRouter);
router.use('/validate', apiLimiter, validateRouter);
router.use('/convert', apiLimiter, convertRouter);
router.use('/report', reportRouter);
router.use('/download', downloadRouter);

export default router;

