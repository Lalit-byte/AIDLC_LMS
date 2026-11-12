import test from 'node:test';
import assert from 'node:assert/strict';
import { User } from '../src/models/User.js';
import { signToken, verifyToken } from '../src/utils/token.js';
import { createApp } from '../src/app.js';

test('Password hashing and comparison works properly', async () => {
  const plain = 'superSecret123';
  const hash = await User.hashPassword(plain);

  assert.notEqual(plain, hash);
  assert.ok(hash.startsWith('$2')); // bcrypt salt identifier

  const userInstance = new User({
    name: 'Test User',
    email: 'test@example.com',
    passwordHash: hash
  });

  const isValid = await userInstance.comparePassword('superSecret123');
  assert.equal(isValid, true);

  const isInvalid = await userInstance.comparePassword('wrongPassword');
  assert.equal(isInvalid, false);
});

test('signToken and verifyToken lifecycle', () => {
  const payload = { id: 'usr_123', role: 'student', email: 'student@example.com' };
  const token = signToken(payload);

  assert.ok(token);
  assert.equal(typeof token, 'string');

  const decoded = verifyToken(token);
  assert.equal(decoded.id, 'usr_123');
  assert.equal(decoded.role, 'student');
  assert.equal(decoded.email, 'student@example.com');
});

test('POST /api/auth/register validates required fields and password length', async () => {
  const app = createApp();
  const server = app.listen(0);
  const { port } = server.address();

  try {
    // Missing fields
    const res1 = await fetch(`http://127.0.0.1:${port}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'bad@test.com' })
    });
    assert.equal(res1.status, 400);
    const body1 = await res1.json();
    assert.equal(body1.success, false);

    // Password too short
    const res2 = await fetch(`http://127.0.0.1:${port}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Shorty', email: 'short@test.com', password: '123' })
    });
    assert.equal(res2.status, 400);
    const body2 = await res2.json();
    assert.equal(body2.error.message, 'Password must be at least 6 characters long.');
  } finally {
    server.close();
  }
});

test('POST /api/auth/login validates required email and password', async () => {
  const app = createApp();
  const server = app.listen(0);
  const { port } = server.address();

  try {
    const res = await fetch(`http://127.0.0.1:${port}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    });
    assert.equal(res.status, 400);
    const body = await res.json();
    assert.equal(body.success, false);
    assert.equal(body.error.message, 'Email and password are required.');
  } finally {
    server.close();
  }
});
