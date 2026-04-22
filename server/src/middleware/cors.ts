import cors from 'cors';

const origin = process.env.CORS_ORIGIN ?? '*';

export const corsMiddleware = cors({
  origin,
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
});
