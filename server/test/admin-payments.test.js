import test from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import { createApp } from '../src/app.js';
import { Payment } from '../src/models/Payment.js';
import { signToken } from '../src/utils/token.js';

test('GET /api/admin/payments enforces admin role and aggregates revenue summary', async () => {
  const originalFind = Payment.find;

  const adminToken = signToken({ id: 'admin_1', role: 'admin', email: 'admin@platform.com' });
  const studentToken = signToken({ id: 'student_1', role: 'student', email: 'student@test.com' });

  const mockPayments = [
    {
      _id: new mongoose.Types.ObjectId(),
      orderId: 'order_1001',
      paymentId: 'pay_1001',
      amount: 499,
      currency: 'INR',
      status: 'paid',
      user: { name: 'Alice Student', email: 'alice@test.com' },
      course: { title: 'Fullstack Next.js', price: 499, slug: 'fullstack-nextjs' },
      createdAt: new Date('2026-11-15T10:00:00Z')
    },
    {
      _id: new mongoose.Types.ObjectId(),
      orderId: 'order_1002',
      paymentId: 'pay_1002',
      amount: 999,
      currency: 'INR',
      status: 'paid',
      user: { name: 'Bob Learner', email: 'bob@test.com' },
      course: { title: 'AI Engineering Masterclass', price: 999, slug: 'ai-masterclass' },
      createdAt: new Date('2026-11-15T11:00:00Z')
    },
    {
      _id: new mongoose.Types.ObjectId(),
      orderId: 'order_1003',
      paymentId: '',
      amount: 1499,
      currency: 'INR',
      status: 'created',
      user: { name: 'Charlie', email: 'charlie@test.com' },
      course: { title: 'Cloud Architecture', price: 1499, slug: 'cloud-arch' },
      createdAt: new Date('2026-11-15T12:00:00Z')
    },
    {
      _id: new mongoose.Types.ObjectId(),
      orderId: 'order_1004',
      paymentId: 'pay_fail_1',
      amount: 499,
      currency: 'INR',
      status: 'failed',
      user: { name: 'Dave', email: 'dave@test.com' },
      course: { title: 'Fullstack Next.js', price: 499, slug: 'fullstack-nextjs' },
      createdAt: new Date('2026-11-15T13:00:00Z')
    }
  ];

  Payment.find = () => ({
    sort: () => ({
      populate: () => ({
        populate: () => ({
          lean: async () => mockPayments
        })
      })
    })
  });

  const app = createApp();
  const server = app.listen(0);
  const { port } = server.address();

  try {
    // 1. Non-admin forbidden
    const resForbidden = await fetch(`http://127.0.0.1:${port}/api/admin/payments`, {
      headers: { Authorization: `Bearer ${studentToken}` }
    });
    assert.strictEqual(resForbidden.status, 403);

    // 2. Admin authorized and returns aggregated summary
    const resAdmin = await fetch(`http://127.0.0.1:${port}/api/admin/payments`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert.strictEqual(resAdmin.status, 200);

    const body = await resAdmin.json();
    assert.strictEqual(body.success, true);
    assert.strictEqual(body.data.payments.length, 4);

    // Revenue calculations: 499 + 999 = 1498
    assert.strictEqual(body.data.summary.totalRevenue, 1498);
    assert.strictEqual(body.data.summary.successfulPayments, 2);
    assert.strictEqual(body.data.summary.pendingPayments, 1);
    assert.strictEqual(body.data.summary.failedPayments, 1);
  } finally {
    Payment.find = originalFind;
    server.close();
  }
});
