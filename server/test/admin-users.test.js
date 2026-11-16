import test from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import { createApp } from '../src/app.js';
import { User } from '../src/models/User.js';
import { Course } from '../src/models/Course.js';
import { Enrollment } from '../src/models/Enrollment.js';
import { signToken } from '../src/utils/token.js';

test('GET /api/admin/users enforces admin role and returns users with activity stats', async () => {
  const originalFind = User.find;
  const originalCourseCount = Course.countDocuments;
  const originalEnrollmentCount = Enrollment.countDocuments;

  const adminToken = signToken({ id: 'admin_1', role: 'admin', email: 'admin@platform.com' });
  const studentToken = signToken({ id: 'student_1', role: 'student', email: 'student@test.com' });

  const mockUsers = [
    { _id: new mongoose.Types.ObjectId(), name: 'Jane Instructor', email: 'jane@test.com', role: 'instructor', isActive: true },
    { _id: new mongoose.Types.ObjectId(), name: 'Bob Student', email: 'bob@test.com', role: 'student', isActive: true }
  ];

  User.find = () => ({
    sort: () => ({
      lean: async () => mockUsers
    })
  });

  Course.countDocuments = async () => 4;
  Enrollment.countDocuments = async () => 2;

  const app = createApp();
  const server = app.listen(0);
  const { port } = server.address();

  try {
    // 1. Non-admin -> 403
    const resForbidden = await fetch(`http://127.0.0.1:${port}/api/admin/users`, {
      headers: { Authorization: `Bearer ${studentToken}` }
    });
    assert.strictEqual(resForbidden.status, 403);

    // 2. Admin -> 200
    const resAdmin = await fetch(`http://127.0.0.1:${port}/api/admin/users`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert.strictEqual(resAdmin.status, 200);
    const body = await resAdmin.json();
    assert.strictEqual(body.success, true);
    assert.strictEqual(body.data.users.length, 2);
    assert.strictEqual(body.data.users[0].name, 'Jane Instructor');
    assert.strictEqual(body.data.users[0].coursesAuthored, 4);
    assert.strictEqual(body.data.users[1].name, 'Bob Student');
    assert.strictEqual(body.data.users[1].coursesEnrolled, 2);
  } finally {
    User.find = originalFind;
    Course.countDocuments = originalCourseCount;
    Enrollment.countDocuments = originalEnrollmentCount;
    server.close();
  }
});

test('POST /api/admin/users validates fields and creates new student or instructor', async () => {
  const originalFindOne = User.findOne;
  const originalCreate = User.create;
  const originalHash = User.hashPassword;
  const adminToken = signToken({ id: 'admin_1', role: 'admin', email: 'admin@platform.com' });

  const app = createApp();
  const server = app.listen(0);
  const { port } = server.address();

  try {
    // 1. Invalid short password -> 400
    const resShortPass = await fetch(`http://127.0.0.1:${port}/api/admin/users`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ name: 'Alex', email: 'alex@test.com', password: '123' })
    });
    assert.strictEqual(resShortPass.status, 400);

    // 2. Duplicate email -> 400
    User.findOne = async () => ({ _id: 'u_existing', email: 'alex@test.com' });
    const resDup = await fetch(`http://127.0.0.1:${port}/api/admin/users`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ name: 'Alex', email: 'alex@test.com', password: 'password123', role: 'instructor' })
    });
    assert.strictEqual(resDup.status, 400);
    const dupBody = await resDup.json();
    assert.match(dupBody.error.message, /already exists/);

    // 3. Valid creation -> 201
    User.findOne = async () => null;
    User.hashPassword = async () => 'mock_hashed_pw';
    User.create = async (doc) => ({
      _id: new mongoose.Types.ObjectId(),
      ...doc
    });

    const resValid = await fetch(`http://127.0.0.1:${port}/api/admin/users`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: 'Sarah Professor',
        email: 'sarah@test.com',
        password: 'securepassword123',
        role: 'instructor'
      })
    });

    assert.strictEqual(resValid.status, 201);
    const validBody = await resValid.json();
    assert.strictEqual(validBody.success, true);
    assert.strictEqual(validBody.data.user.name, 'Sarah Professor');
    assert.strictEqual(validBody.data.user.role, 'instructor');
  } finally {
    User.findOne = originalFindOne;
    User.create = originalCreate;
    User.hashPassword = originalHash;
    server.close();
  }
});

test('DELETE /api/admin/users/:id prevents self-deletion & deleting instructors with courses', async () => {
  const originalFindById = User.findById;
  const originalCount = Course.countDocuments;
  const originalDeleteEnrollments = Enrollment.deleteMany;
  const originalDeleteUser = User.findByIdAndDelete;

  const adminId = new mongoose.Types.ObjectId().toString();
  const adminToken = signToken({ id: adminId, role: 'admin', email: 'admin@platform.com' });
  const instructorId = new mongoose.Types.ObjectId().toString();
  const studentId = new mongoose.Types.ObjectId().toString();

  const app = createApp();
  const server = app.listen(0);
  const { port } = server.address();

  try {
    // 1. Admin deleting themselves -> 400
    const resSelf = await fetch(`http://127.0.0.1:${port}/api/admin/users/${adminId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert.strictEqual(resSelf.status, 400);
    const selfBody = await resSelf.json();
    assert.match(selfBody.error.message, /cannot delete your own admin account/);

    // 2. Instructor with active courses -> 400
    User.findById = async (id) => {
      if (id === instructorId) {
        return { _id: instructorId, name: 'Lead Instructor', role: 'instructor' };
      }
      return { _id: studentId, name: 'Enrolled Student', role: 'student' };
    };
    Course.countDocuments = async () => 2; // has 2 courses

    const resBlocked = await fetch(`http://127.0.0.1:${port}/api/admin/users/${instructorId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert.strictEqual(resBlocked.status, 400);
    const blockedBody = await resBlocked.json();
    assert.match(blockedBody.error.message, /they have 2 course/);

    // 3. Student deletion -> 200 (cleans enrollments & deletes user)
    Course.countDocuments = async () => 0;
    let enrollmentsCleaned = false;
    Enrollment.deleteMany = async () => { enrollmentsCleaned = true; return { deletedCount: 3 }; };
    let userDeleted = false;
    User.findByIdAndDelete = async () => { userDeleted = true; return { _id: studentId }; };

    const resOk = await fetch(`http://127.0.0.1:${port}/api/admin/users/${studentId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert.strictEqual(resOk.status, 200);
    assert.strictEqual(enrollmentsCleaned, true);
    assert.strictEqual(userDeleted, true);
  } finally {
    User.findById = originalFindById;
    Course.countDocuments = originalCount;
    Enrollment.deleteMany = originalDeleteEnrollments;
    User.findByIdAndDelete = originalDeleteUser;
    server.close();
  }
});
