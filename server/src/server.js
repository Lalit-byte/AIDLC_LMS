import dotenv from 'dotenv';
import { createApp } from './app.js';
import { validateEnv } from './config/env.js';
import { connectDB, disconnectDB } from './config/db.js';

dotenv.config();

const config = validateEnv();
const app = createApp();

let server;

async function start() {
  try {
    await connectDB(config.MONGO_URI);
  } catch (err) {
    console.warn('⚠️ Starting server without persistent database connection (dev fallback).');
  }

  server = app.listen(config.PORT, () => {
    console.log(`🚀 LMS Server running on http://localhost:${config.PORT}`);
    console.log(`🩺 Health check ready at http://localhost:${config.PORT}/api/health`);
  });
}

// Graceful shutdown
async function shutdown(signal) {
  console.log(`\n🛑 Received ${signal}. Shutting down gracefully...`);
  if (server) {
    server.close(() => {
      console.log('🔌 HTTP server closed.');
    });
  }
  await disconnectDB();
  process.exit(0);
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

start();
