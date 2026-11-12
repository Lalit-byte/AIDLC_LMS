export function validateEnv(env = process.env) {
  const errors = [];

  const config = {
    PORT: Number(env.PORT) || 5000,
    NODE_ENV: env.NODE_ENV || 'development',
    CLIENT_URL: env.CLIENT_URL || 'http://localhost:5173',
    MONGO_URI: env.MONGO_URI || 'mongodb://localhost:27017/aidlc_lms',
    JWT_SECRET: env.JWT_SECRET || 'dev_secret_only_change_in_production',
    JWT_EXPIRES_IN: env.JWT_EXPIRES_IN || '7d'
  };

  // In production, enforce non-default secrets
  if (config.NODE_ENV === 'production') {
    if (!env.JWT_SECRET || env.JWT_SECRET === 'dev_secret_only_change_in_production') {
      errors.push('JWT_SECRET must be securely set in production.');
    }
    if (!env.MONGO_URI) {
      errors.push('MONGO_URI is required in production.');
    }
  }

  if (errors.length > 0) {
    throw new Error(`Environment validation failed:\n- ${errors.join('\n- ')}`);
  }

  return config;
}
