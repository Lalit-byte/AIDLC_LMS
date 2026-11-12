import mongoose from 'mongoose';

/**
 * Strips password from mongo connection string for safe log output
 */
export function sanitizeMongoUri(uri) {
  if (!uri) return '';
  return uri.replace(/(mongodb(\+srv)?:\/\/[^:]+:)([^@]+)(@.+)/, '$1*****$4');
}

export async function connectDB(uri) {
  const safeUri = sanitizeMongoUri(uri);

  mongoose.connection.on('connected', () => {
    console.log(`📦 MongoDB connected to ${safeUri}`);
  });

  mongoose.connection.on('error', (err) => {
    console.error(`❌ MongoDB connection error: ${err.message}`);
  });

  mongoose.connection.on('disconnected', () => {
    console.warn('⚠️ MongoDB disconnected.');
  });

  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000 // fail fast if server is unreachable
    });
    return conn;
  } catch (err) {
    console.error(`❌ Initial MongoDB connection failed: ${err.message}`);
    throw err;
  }
}

export async function disconnectDB() {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
    console.log('📦 MongoDB connection closed gracefully.');
  }
}
