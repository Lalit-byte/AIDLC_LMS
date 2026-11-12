import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'crypto';
import mongoose from 'mongoose';
import { createApp } from '../src/app.js';
import { Course } from '../src/models/Course.js';
import { Payment } from '../src/models/Payment.js';
import { Enrollment } from '../src/models/Enrollment.js';
import { setRazorpayClient, verifyCheckoutSignature } from '../src/config/razorpay.js';
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
