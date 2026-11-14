import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import { createApp } from './app.js';
import { validateEnv } from './config/env.js';
import { connectDB, disconnectDB } from './config/db.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const config = validateEnv();
const app = createApp();

let server;

function listenWithFallback(port, host = '0.0.0.0', maxAttempts = 5) {
  return new Promise((resolve, reject) => {
    const s = app.listen(port, host, () => {
      console.log(`🚀 LMS Server running on http://localhost:${port}`);
      console.log(`🩺 Health check ready at http://localhost:${port}/api/health`);
      resolve(s);
    });

    s.on('error', (err) => {
      if ((err.code === 'EACCES' || err.code === 'EADDRINUSE') && maxAttempts > 1) {
        console.warn(`⚠️ Port ${port} unavailable (${err.code}). Attempting port ${port + 1}...`);
        s.close(() => {
          listenWithFallback(port + 1, host, maxAttempts - 1).then(resolve).catch(reject);
        });
      } else {
        console.error(`❌ Failed to start server on port ${port}:`, err.message);
        reject(err);
      }
    });
  });
}

async function start() {
  try {
    await connectDB(config.MONGO_URI);
  } catch (err) {
    console.warn('⚠️ Starting server without persistent database connection (dev fallback).');
  }

  try {
    server = await listenWithFallback(config.PORT);
  } catch (err) {
    console.error('❌ Server startup failed:', err.message);
    process.exit(1);
  }
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
