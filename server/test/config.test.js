import test from 'node:test';
import assert from 'node:assert/strict';
import { validateEnv } from '../src/config/env.js';
import { sanitizeMongoUri } from '../src/config/db.js';

test('validateEnv returns defaults in development', () => {
  const config = validateEnv({});
  assert.equal(config.PORT, 5000);
  assert.equal(config.NODE_ENV, 'development');
  assert.equal(config.CLIENT_URL, 'http://localhost:5173');
  assert.equal(config.MONGO_URI, 'mongodb://localhost:27017/aidlc_lms');
});

test('validateEnv throws in production if JWT_SECRET is unset or default', () => {
  assert.throws(
    () => validateEnv({ NODE_ENV: 'production', MONGO_URI: 'mongodb://localhost:27017' }),
    /JWT_SECRET must be securely set in production/
  );
});

test('sanitizeMongoUri masks credentials cleanly', () => {
  const raw = 'mongodb://user:super_secret_password@cluster0.abc.mongodb.net/dbname';
  const masked = sanitizeMongoUri(raw);
  assert.equal(masked, 'mongodb://user:*****@cluster0.abc.mongodb.net/dbname');
  assert.ok(!masked.includes('super_secret_password'));
});
