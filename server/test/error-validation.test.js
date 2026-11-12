import test from 'node:test';
import assert from 'node:assert/strict';
import { ApiError } from '../src/utils/ApiError.js';
import { validate } from '../src/middleware/validate.js';
import { createApp } from '../src/app.js';

test('ApiError generates consistent status and codes', () => {
  const badReq = ApiError.badRequest('Invalid email', { email: 'Must be valid' });
  assert.equal(badReq.statusCode, 400);
  assert.equal(badReq.code, 'BAD_REQUEST');
  assert.deepEqual(badReq.details, { email: 'Must be valid' });

  const unauth = ApiError.unauthorized();
  assert.equal(unauth.statusCode, 401);
  assert.equal(unauth.code, 'UNAUTHORIZED');

  const forbidden = ApiError.forbidden();
  assert.equal(forbidden.statusCode, 403);
  assert.equal(forbidden.code, 'FORBIDDEN');
});

test('validate middleware catches invalid input and returns 400', async () => {
  const dummyValidator = (req) => {
    if (!req.body?.title) return { title: 'Title is required' };
    return null;
  };

  const app = createApp((router) => {
    router.post('/api/test-validate', validate(dummyValidator), (req, res) => {
      res.json({ success: true });
    });
  });

  const server = app.listen(0);
  const { port } = server.address();

  try {
    const res = await fetch(`http://127.0.0.1:${port}/api/test-validate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    });

    assert.equal(res.status, 400);
    const body = await res.json();
    assert.equal(body.success, false);
    assert.equal(body.error.code, 'BAD_REQUEST');
    assert.deepEqual(body.error.details, { title: 'Title is required' });
  } finally {
    server.close();
  }
});
