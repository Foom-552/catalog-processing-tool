import 'express-async-errors';
import * as dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import * as path from 'path';
import * as fs from 'fs';
import { corsMiddleware } from './middleware/cors';
import { errorHandler } from './middleware/errorHandler';
import apiRouter from './routes/index';

const app = express();
const PORT = parseInt(process.env.PORT ?? '3001', 10);

// Ensure uploads directory exists
const uploadDir = process.env.UPLOAD_DIR ?? './uploads';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

app.use(corsMiddleware);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// API routes
app.use('/api', apiRouter);

// cXML version endpoint under /api/cxml/version is handled in convert router
// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', uptime: process.uptime(), timestamp: new Date().toISOString() });
});

// Serve static client in production
if (process.env.NODE_ENV === 'production') {
  const clientDist = path.resolve(__dirname, '../../client/dist');
  if (fs.existsSync(clientDist)) {
    app.use(express.static(clientDist));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(clientDist, 'index.html'));
    });
  }
}

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Catalog Processing Tool server running on http://localhost:${PORT}`);
});

export default app;
