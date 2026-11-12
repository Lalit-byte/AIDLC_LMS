import express from 'express';
import cors from 'cors';
import helmet from 'helmet';

export function createApp() {
  const app = express();

  // Security headers & CORS
  app.use(helmet());
  app.use(cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true
  }));

  // JSON request body parser
  app.use(express.json());

  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      service: 'AIDLC LMS API',
      timestamp: new Date().toISOString()
    });
  });

  // 404 handler
  app.use((req, res) => {
    res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: `Route ${req.method} ${req.url} not found` }
    });
  });

  return app;
}
