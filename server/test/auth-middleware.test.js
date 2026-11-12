import test from 'node:test';
import assert from 'node:assert/strict';
import { authenticate, authorizeRoles, checkOwnership } from '../src/middleware/auth.js';
import { signToken } from '../src/utils/token.js';
import { ApiError } from '../src/utils/ApiError.js';

test('authenticate middleware - rejects missing or malformed token', () => {
  const reqNoHeader = { headers: {} };
  let errorNoHeader = null;
  authenticate(reqNoHeader, {}, (err) => { errorNoHeader = err; });
  assert.ok(errorNoHeader instanceof ApiError);
  assert.strictEqual(errorNoHeader.statusCode, 401);
  assert.strictEqual(errorNoHeader.message, 'Bearer token required.');

  const reqMalformed = { headers: { authorization: 'Basic 12345' } };
  let errorMalformed = null;
  authenticate(reqMalformed, {}, (err) => { errorMalformed = err; });
  assert.ok(errorMalformed instanceof ApiError);
  assert.strictEqual(errorMalformed.statusCode, 401);
});

test('authenticate middleware - rejects invalid or expired token', () => {
  const reqInvalid = { headers: { authorization: 'Bearer invalid.token.value' } };
  let errorInvalid = null;
  authenticate(reqInvalid, {}, (err) => { errorInvalid = err; });
  assert.ok(errorInvalid instanceof ApiError);
  assert.strictEqual(errorInvalid.statusCode, 401);
  assert.strictEqual(errorInvalid.message, 'Invalid or expired token.');
});

test('authenticate middleware - accepts valid token from Authorization header', () => {
  const token = signToken({ id: 'user-123', role: 'student', email: 'test@example.com' });
  const req = { headers: { authorization: `Bearer ${token}` } };
  let calledNext = false;

  authenticate(req, {}, (err) => {
    assert.strictEqual(err, undefined);
    calledNext = true;
  });

  assert.strictEqual(calledNext, true);
  assert.strictEqual(req.user.id, 'user-123');
  assert.strictEqual(req.user.role, 'student');
  assert.strictEqual(req.user.email, 'test@example.com');
});

test('authenticate middleware - accepts valid token from cookie fallback', () => {
  const token = signToken({ id: 'instructor-456', role: 'instructor', email: 'inst@example.com' });
  const req = { headers: {}, cookies: { token } };
  let calledNext = false;

  authenticate(req, {}, (err) => {
    assert.strictEqual(err, undefined);
    calledNext = true;
  });

  assert.strictEqual(calledNext, true);
  assert.strictEqual(req.user.id, 'instructor-456');
  assert.strictEqual(req.user.role, 'instructor');
});

test('authorizeRoles middleware - enforces required roles', () => {
  const middleware = authorizeRoles('instructor', 'admin');

  // No user attached
  let errNoUser = null;
  middleware({}, {}, (err) => { errNoUser = err; });
  assert.strictEqual(errNoUser.statusCode, 401);

  // Student role - forbidden
  const reqStudent = { user: { id: 'u1', role: 'student' } };
  let errForbidden = null;
  middleware(reqStudent, {}, (err) => { errForbidden = err; });
  assert.strictEqual(errForbidden.statusCode, 403);
  assert.strictEqual(errForbidden.message, 'You do not have permission to access this resource.');

  // Instructor role - allowed
  const reqInstructor = { user: { id: 'u2', role: 'instructor' } };
  let calledInstructor = false;
  middleware(reqInstructor, {}, (err) => {
    assert.strictEqual(err, undefined);
    calledInstructor = true;
  });
  assert.strictEqual(calledInstructor, true);

  // Admin role - allowed
  const reqAdmin = { user: { id: 'u3', role: 'admin' } };
  let calledAdmin = false;
  middleware(reqAdmin, {}, (err) => {
    assert.strictEqual(err, undefined);
    calledAdmin = true;
  });
  assert.strictEqual(calledAdmin, true);
});

test('checkOwnership middleware - validates resource owner or allows admin', async () => {
  const ownershipMiddleware = checkOwnership();

  // Non-owner instructor - rejected (403)
  const reqDifferentOwner = {
    user: { id: 'inst-1', role: 'instructor' },
    params: { instructorId: 'inst-2' }
  };
  let errNotOwner = null;
  await ownershipMiddleware(reqDifferentOwner, {}, (err) => { errNotOwner = err; });
  assert.strictEqual(errNotOwner.statusCode, 403);
  assert.strictEqual(errNotOwner.message, 'Access denied: You do not have permission to modify this resource.');

  // Matching owner - allowed
  const reqOwner = {
    user: { id: 'inst-1', role: 'instructor' },
    params: { instructorId: 'inst-1' }
  };
  let calledOwner = false;
  await ownershipMiddleware(reqOwner, {}, (err) => {
    assert.strictEqual(err, undefined);
    calledOwner = true;
  });
  assert.strictEqual(calledOwner, true);

  // Admin - always allowed regardless of ownership
  const reqAdmin = {
    user: { id: 'admin-99', role: 'admin' },
    params: { instructorId: 'inst-1' }
  };
  let calledAdmin = false;
  await ownershipMiddleware(reqAdmin, {}, (err) => {
    assert.strictEqual(err, undefined);
    calledAdmin = true;
  });
  assert.strictEqual(calledAdmin, true);

  // Custom owner resolver function
  const customMiddleware = checkOwnership((req) => req.course.authorId);
  const reqCustom = {
    user: { id: 'inst-1', role: 'instructor' },
    course: { authorId: 'inst-1' }
  };
  let calledCustom = false;
  await customMiddleware(reqCustom, {}, (err) => {
    assert.strictEqual(err, undefined);
    calledCustom = true;
  });
  assert.strictEqual(calledCustom, true);
});
