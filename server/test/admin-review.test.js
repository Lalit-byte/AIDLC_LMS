import test from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import { createApp } from '../src/app.js';
import { Course } from '../src/models/Course.js';
import { signToken } from '../src/utils/token.js';

test('PATCH /api/courses/:id/submit validates authorization and curriculum', async () => {
  const originalFindById = Course.findById;

  const instructorId = new mongoose.Types.ObjectId().toString();
  const studentToken = signToken({ id: 'student_1', role: 'student', email: 'stu@test.com' });
  const otherInstructorToken = signToken({ id: 'instructor_2', role: 'instructor', email: 'other@test.com' });
  const ownerInstructorToken = signToken({ id: instructorId, role: 'instructor', email: 'owner@test.com' });

  const courseId = new mongoose.Types.ObjectId().toString();

  const emptyCourse = {
    _id: courseId,
    title: 'Empty Draft',
    status: 'draft',
    instructor: instructorId,
    sections: [],
    save: async function () { return this; }
  };

  const validCourse = {
    _id: courseId,
    title: 'Valid Draft',
    status: 'draft',
    instructor: instructorId,
    sections: [
      {
        title: 'Section 1',
        lessons: [{ title: 'Lesson 1', type: 'video' }]
      }
    ],
    save: async function () { return this; }
  };

  const app = createApp();
  const server = app.listen(0);
  const { port } = server.address();

  try {
    // 1. Student role - 403 Forbidden
    const res1 = await fetch(`http://127.0.0.1:${port}/api/courses/${courseId}/submit`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${studentToken}` }
    });
    assert.strictEqual(res1.status, 403);

    // 2. Non-owner instructor - 403 Forbidden
    Course.findById = async () => emptyCourse;
    const res2 = await fetch(`http://127.0.0.1:${port}/api/courses/${courseId}/submit`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${otherInstructorToken}` }
    });
    assert.strictEqual(res2.status, 403);

    // 3. Owner instructor submits empty course - 400 Bad Request
    Course.findById = async () => emptyCourse;
    const res3 = await fetch(`http://127.0.0.1:${port}/api/courses/${courseId}/submit`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${ownerInstructorToken}` }
    });
    assert.strictEqual(res3.status, 400);
    const body3 = await res3.json();
    assert.strictEqual(body3.error.message, 'A course must contain at least one section and one lesson before submitting for review.');

    // 4. Owner instructor submits valid course - 200 OK
    Course.findById = async () => validCourse;
    const res4 = await fetch(`http://127.0.0.1:${port}/api/courses/${courseId}/submit`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${ownerInstructorToken}` }
    });
    assert.strictEqual(res4.status, 200);
    const body4 = await res4.json();
    assert.strictEqual(body4.success, true);
    assert.strictEqual(body4.data.course.status, 'pending_review');
  } finally {
    Course.findById = originalFindById;
    server.close();
  }
});

test('GET /api/admin/courses/pending enforces admin role', async () => {
  const originalFind = Course.find;
  const adminToken = signToken({ id: 'admin_1', role: 'admin', email: 'admin@test.com' });
  const instructorToken = signToken({ id: 'inst_1', role: 'instructor', email: 'inst@test.com' });

  Course.find = () => ({
    sort: () => ({
      populate: () => ({
        lean: async () => [
          { _id: 'c1', title: 'Pending Review Course', status: 'pending_review' }
        ]
      })
    })
  });

  const app = createApp();
  const server = app.listen(0);
  const { port } = server.address();

  try {
    // Instructor trying to access admin endpoint -> 403
    const resForbidden = await fetch(`http://127.0.0.1:${port}/api/admin/courses/pending`, {
      headers: { Authorization: `Bearer ${instructorToken}` }
    });
    assert.strictEqual(resForbidden.status, 403);

    // Admin accessing -> 200
    const resAdmin = await fetch(`http://127.0.0.1:${port}/api/admin/courses/pending`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert.strictEqual(resAdmin.status, 200);
    const body = await resAdmin.json();
    assert.strictEqual(body.success, true);
    assert.strictEqual(body.data.courses.length, 1);
  } finally {
    Course.find = originalFind;
    server.close();
  }
});

test('PATCH /api/admin/courses/:id/approve and reject transitions status', async () => {
  const originalFindById = Course.findById;
  const adminToken = signToken({ id: 'admin_1', role: 'admin', email: 'admin@test.com' });
  const courseId = new mongoose.Types.ObjectId().toString();

  const mockCourse = {
    _id: courseId,
    title: 'Course for Review',
    status: 'pending_review',
    rejectionReason: '',
    save: async function () { return this; }
  };

  Course.findById = async () => mockCourse;

  const app = createApp();
  const server = app.listen(0);
  const { port } = server.address();

  try {
    // 1. Approve course
    const resApprove = await fetch(`http://127.0.0.1:${port}/api/admin/courses/${courseId}/approve`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert.strictEqual(resApprove.status, 200);
    const bodyApprove = await resApprove.json();
    assert.strictEqual(bodyApprove.data.course.status, 'published');

    // 2. Reject course without reason -> 400
    const resRejectNoReason = await fetch(`http://127.0.0.1:${port}/api/admin/courses/${courseId}/reject`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({})
    });
    assert.strictEqual(resRejectNoReason.status, 400);

    // 3. Reject course with reason -> 200
    const resReject = await fetch(`http://127.0.0.1:${port}/api/admin/courses/${courseId}/reject`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ reason: 'Needs higher resolution preview video' })
    });
    assert.strictEqual(resReject.status, 200);
    const bodyReject = await resReject.json();
    assert.strictEqual(bodyReject.data.course.status, 'rejected');
    assert.strictEqual(bodyReject.data.course.rejectionReason, 'Needs higher resolution preview video');
  } finally {
    Course.findById = originalFindById;
    server.close();
  }
});
