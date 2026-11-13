import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'crypto';
import mongoose from 'mongoose';
import { createApp } from '../src/app.js';
import { Course } from '../src/models/Course.js';
import { Payment } from '../src/models/Payment.js';
import { Enrollment } from '../src/models/Enrollment.js';
import { WebhookEvent } from '../src/models/WebhookEvent.js';
import { setRazorpayClient, verifyCheckoutSignature, verifyWebhookSignature } from '../src/config/razorpay.js';
import { signToken } from '../src/utils/token.js';

test('verifyCheckoutSignature validates HMAC signatures reliably', () => {
  const secret = 'test_secret_12345';
  const orderId = 'order_987654';
  const paymentId = 'pay_123456';
  const validSignature = crypto
    .createHmac('sha256', secret)
    .update(`${orderId}|${paymentId}`)
    .digest('hex');

  // Valid signature
  assert.strictEqual(
    verifyCheckoutSignature({ orderId, paymentId, signature: validSignature, secret }),
    true
  );

  // Tampered signature
  assert.strictEqual(
    verifyCheckoutSignature({ orderId, paymentId, signature: 'invalid_tampered_sig', secret }),
    false
  );

  // Missing fields
  assert.strictEqual(verifyCheckoutSignature({ orderId: '', paymentId, signature: validSignature, secret }), false);
});

test('GET /api/payments/key returns Razorpay public key', async () => {
  const app = createApp();
  const server = app.listen(0);
  const { port } = server.address();

  try {
    const res = await fetch(`http://127.0.0.1:${port}/api/payments/key`);
    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.success, true);
    assert.ok(body.data.keyId);
  } finally {
    server.close();
  }
});

test('POST /api/payments/create-order creates order from database course price', async () => {
  const originalFindCourse = Course.findById;
  const originalFindEnrollment = Enrollment.findOne;
  const originalCreatePayment = Payment.create;

  const studentId = new mongoose.Types.ObjectId().toString();
  const courseId = new mongoose.Types.ObjectId().toString();
  const token = signToken({ id: studentId, role: 'student', email: 'stu@example.com' });

  // Mock Razorpay orders.create
  setRazorpayClient({
    orders: {
      create: async (opts) => ({
        id: 'order_mock_test_123',
        amount: opts.amount,
        currency: opts.currency
      })
    }
  });

  Course.findById = async () => ({
    _id: courseId,
    title: 'Full Stack Masterclass',
    price: 1999,
    currency: 'INR',
    status: 'published'
  });

  Enrollment.findOne = async () => null; // Not yet enrolled
  Payment.create = async (doc) => doc;

  const app = createApp();
  const server = app.listen(0);
  const { port } = server.address();

  try {
    const res = await fetch(`http://127.0.0.1:${port}/api/payments/create-order`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ courseId })
    });

    assert.strictEqual(res.status, 201);
    const body = await res.json();
    assert.strictEqual(body.success, true);
    assert.strictEqual(body.data.orderId, 'order_mock_test_123');
    // Amount in paise: 1999 * 100 = 199900
    assert.strictEqual(body.data.amount, 199900);
    assert.strictEqual(body.data.course.price, 1999);
  } finally {
    Course.findById = originalFindCourse;
    Enrollment.findOne = originalFindEnrollment;
    Payment.create = originalCreatePayment;
    setRazorpayClient(null);
    server.close();
  }
});

test('POST /api/payments/verify-checkout validates signature and activates enrollment', async () => {
  const originalFindPayment = Payment.findOne;
  const originalUpdatePayment = Payment.findOneAndUpdate;
  const originalUpdateEnrollment = Enrollment.findOneAndUpdate;

  const secret = process.env.RAZORPAY_KEY_SECRET || 'rzp_test_secret_placeholder';
  const orderId = 'order_valid_test_789';
  const paymentId = 'pay_valid_test_456';
  const signature = crypto
    .createHmac('sha256', secret)
    .update(`${orderId}|${paymentId}`)
    .digest('hex');

  const studentId = new mongoose.Types.ObjectId().toString();
  const courseId = new mongoose.Types.ObjectId().toString();
  const token = signToken({ id: studentId, role: 'student', email: 'stu@example.com' });

  const mockPayment = {
    orderId,
    user: studentId,
    course: courseId,
    amount: 1999,
    status: 'created',
    save: async function () { return this; }
  };

  Payment.findOne = async () => mockPayment;
  Enrollment.findOneAndUpdate = async (filter, update) => ({
    _id: new mongoose.Types.ObjectId().toString(),
    ...update,
    status: 'active'
  });

  const app = createApp();
  const server = app.listen(0);
  const { port } = server.address();

  try {
    // 1. Invalid signature returns 400
    Payment.findOneAndUpdate = async () => null;
    const resInvalid = await fetch(`http://127.0.0.1:${port}/api/payments/verify-checkout`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ orderId, paymentId, signature: 'bad_tampered_sig' })
    });
    assert.strictEqual(resInvalid.status, 400);

    // 2. Valid signature activates enrollment -> 200
    const resValid = await fetch(`http://127.0.0.1:${port}/api/payments/verify-checkout`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ orderId, paymentId, signature })
    });
    assert.strictEqual(resValid.status, 200);
    const bodyValid = await resValid.json();
    assert.strictEqual(bodyValid.success, true);
    assert.strictEqual(mockPayment.status, 'paid');
    assert.ok(bodyValid.data.enrollmentId);
  } finally {
    Payment.findOne = originalFindPayment;
    Payment.findOneAndUpdate = originalUpdatePayment;
    Enrollment.findOneAndUpdate = originalUpdateEnrollment;
    server.close();
  }
});

test('verifyWebhookSignature validates raw payload signatures reliably', () => {
  const secret = 'webhook_secret_xyz_123';
  const rawBody = JSON.stringify({ event: 'payment.captured', id: 'evt_123' });
  const validSignature = crypto
    .createHmac('sha256', secret)
    .update(rawBody)
    .digest('hex');

  // Valid
  assert.strictEqual(
    verifyWebhookSignature({ rawBody, signature: validSignature, secret }),
    true
  );

  // Tampered payload
  const tamperedBody = JSON.stringify({ event: 'payment.captured', id: 'evt_999' });
  assert.strictEqual(
    verifyWebhookSignature({ rawBody: tamperedBody, signature: validSignature, secret }),
    false
  );

  // Tampered signature
  assert.strictEqual(
    verifyWebhookSignature({ rawBody, signature: 'bad_signature_abc', secret }),
    false
  );

  // Missing fields
  assert.strictEqual(verifyWebhookSignature({ rawBody: '', signature: validSignature, secret }), false);
  assert.strictEqual(verifyWebhookSignature({ rawBody, signature: '', secret }), false);
});

test('POST /api/payments/webhook rejects missing or invalid signatures with 400', async () => {
  const app = createApp();
  const server = app.listen(0);
  const { port } = server.address();

  try {
    // 1. Missing signature header
    const resMissing = await fetch(`http://127.0.0.1:${port}/api/payments/webhook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event: 'payment.captured' })
    });
    assert.strictEqual(resMissing.status, 400);

    // 2. Invalid signature header
    const resInvalid = await fetch(`http://127.0.0.1:${port}/api/payments/webhook`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-razorpay-signature': 'invalid_signature_hex'
      },
      body: JSON.stringify({ event: 'payment.captured' })
    });
    assert.strictEqual(resInvalid.status, 400);
  } finally {
    server.close();
  }
});

test('POST /api/payments/webhook processes payment.captured, updates payment, and activates enrollment', async () => {
  const originalFindPayment = Payment.findOne;
  const originalUpdateEnrollment = Enrollment.findOneAndUpdate;
  const originalFindWebhookEvent = WebhookEvent.findOne;
  const originalCreateWebhookEvent = WebhookEvent.create;

  const secret = process.env.RAZORPAY_WEBHOOK_SECRET || 'rzp_webhook_secret_placeholder';
  const orderId = 'order_hook_test_101';
  const paymentId = 'pay_hook_test_202';
  const eventId = 'evt_test_success_303';

  const studentId = new mongoose.Types.ObjectId().toString();
  const courseId = new mongoose.Types.ObjectId().toString();

  const mockPayment = {
    orderId,
    user: studentId,
    course: courseId,
    amount: 1999,
    status: 'created',
    save: async function () { return this; }
  };

  Payment.findOne = async () => mockPayment;
  Enrollment.findOneAndUpdate = async (filter, update) => ({
    _id: new mongoose.Types.ObjectId().toString(),
    ...update,
    status: 'active'
  });
  WebhookEvent.findOne = async () => null; // Not previously processed
  WebhookEvent.create = async (doc) => doc;

  const payload = {
    entity: 'event',
    event: 'payment.captured',
    id: eventId,
    payload: {
      payment: {
        entity: {
          id: paymentId,
          order_id: orderId,
          amount: 199900,
          status: 'captured'
        }
      }
    }
  };

  const rawBody = JSON.stringify(payload);
  const signature = crypto
    .createHmac('sha256', secret)
    .update(rawBody)
    .digest('hex');

  const app = createApp();
  const server = app.listen(0);
  const { port } = server.address();

  try {
    const res = await fetch(`http://127.0.0.1:${port}/api/payments/webhook`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-razorpay-signature': signature,
        'x-razorpay-event-id': eventId
      },
      body: rawBody
    });

    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.success, true);
    assert.strictEqual(mockPayment.status, 'paid');
    assert.strictEqual(mockPayment.paymentId, paymentId);
    assert.strictEqual(body.data.eventId, eventId);
  } finally {
    Payment.findOne = originalFindPayment;
    Enrollment.findOneAndUpdate = originalUpdateEnrollment;
    WebhookEvent.findOne = originalFindWebhookEvent;
    WebhookEvent.create = originalCreateWebhookEvent;
    server.close();
  }
});

test('POST /api/payments/webhook idempotently deduplicates repeated events', async () => {
  const originalFindWebhookEvent = WebhookEvent.findOne;
  const originalUpdateEnrollment = Enrollment.findOneAndUpdate;

  const secret = process.env.RAZORPAY_WEBHOOK_SECRET || 'rzp_webhook_secret_placeholder';
  const eventId = 'evt_duplicate_replay_505';

  let enrollmentCalls = 0;
  Enrollment.findOneAndUpdate = async () => {
    enrollmentCalls++;
    return {};
  };

  // Mock: event was already processed previously
  WebhookEvent.findOne = async ({ eventId: id }) => {
    if (id === eventId) {
      return { eventId, status: 'processed' };
    }
    return null;
  };

  const payload = {
    entity: 'event',
    event: 'payment.captured',
    id: eventId,
    payload: {
      payment: {
        entity: {
          id: 'pay_duplicate_777',
          order_id: 'order_duplicate_888',
          amount: 199900
        }
      }
    }
  };

  const rawBody = JSON.stringify(payload);
  const signature = crypto
    .createHmac('sha256', secret)
    .update(rawBody)
    .digest('hex');

  const app = createApp();
  const server = app.listen(0);
  const { port } = server.address();

  try {
    const res = await fetch(`http://127.0.0.1:${port}/api/payments/webhook`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-razorpay-signature': signature,
        'x-razorpay-event-id': eventId
      },
      body: rawBody
    });

    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.success, true);
    assert.match(body.data.message, /already processed/i);
    // Verified: No redundant enrollment mutation on duplicate delivery
    assert.strictEqual(enrollmentCalls, 0);
  } finally {
    WebhookEvent.findOne = originalFindWebhookEvent;
    Enrollment.findOneAndUpdate = originalUpdateEnrollment;
    server.close();
  }
});
