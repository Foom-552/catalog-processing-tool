import { Router } from 'express';
import uploadRouter from './upload';
import validateRouter from './validate';
import convertRouter from './convert';
import reportRouter from './report';
import downloadRouter from './download';
import docsRouter from './docs';

const router = Router();

router.use('/upload', uploadRouter);
router.use('/validate', validateRouter);
router.use('/convert', convertRouter);
router.use('/report', reportRouter);
router.use('/download', downloadRouter);
router.use('/docs', docsRouter);

export default router;

