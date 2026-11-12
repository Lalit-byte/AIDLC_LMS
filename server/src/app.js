import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { requestLogger } from './middleware/logger.js';
import { notFoundHandler, errorHandler } from './middleware/errorHandler.js';
import authRoutes from './routes/authRoutes.js';
import courseRoutes from './routes/courseRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import { getCategories } from './controllers/courseController.js';

export function createApp(configureRoutes = null) {
  const app = express();

  // Security headers & CORS
  app.use(helmet());
  app.use(cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true
  }));

  // JSON request body parser
  app.use(express.json());

  // Request logger (skip in automated test environment to keep logs clean)
  if (process.env.NODE_ENV !== 'test') {
    app.use(requestLogger);
  }

  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      service: 'AIDLC LMS API',
      timestamp: new Date().toISOString()
    });
  });

  // Core API routes
  app.use('/api/auth', authRoutes);
  app.use('/api/courses', courseRoutes);
  app.use('/api/admin', adminRoutes);
  app.use('/api/payments', paymentRoutes);
  app.get('/api/categories', getCategories);

  // Mount custom routes or feature routers if provided
  if (typeof configureRoutes === 'function') {
    configureRoutes(app);
  }

  // 404 Not Found handler
  app.use(notFoundHandler);

  // Centralized Error handler
  app.use(errorHandler);

  return app;
}
