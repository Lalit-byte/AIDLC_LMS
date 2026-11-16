import test from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import { createApp } from '../src/app.js';
import { Category } from '../src/models/Category.js';
import { Course } from '../src/models/Course.js';
import { signToken } from '../src/utils/token.js';

test('GET /api/admin/categories enforces admin role and returns categories with course counts', async () => {
  const originalFind = Category.find;
  const originalCount = Course.countDocuments;

  const adminToken = signToken({ id: 'admin_1', role: 'admin', email: 'admin@test.com' });
  const studentToken = signToken({ id: 'student_1', role: 'student', email: 'stu@test.com' });

  const mockCategories = [
    { _id: new mongoose.Types.ObjectId(), name: 'Design', slug: 'design', description: 'UI/UX', isActive: true },
    { _id: new mongoose.Types.ObjectId(), name: 'Development', slug: 'development', description: 'Coding', isActive: true }
  ];

  Category.find = () => ({
    sort: () => ({
      lean: async () => mockCategories
    })
  });

  Course.countDocuments = async (query) => {
    if (query?.category?.test?.('Development')) return 5;
    return 2;
  };

  const app = createApp();
  const server = app.listen(0);
  const { port } = server.address();

  try {
    // Non-admin -> 403
    const resForbidden = await fetch(`http://127.0.0.1:${port}/api/admin/categories`, {
      headers: { Authorization: `Bearer ${studentToken}` }
    });
    assert.strictEqual(resForbidden.status, 403);

    // Admin -> 200
    const resAdmin = await fetch(`http://127.0.0.1:${port}/api/admin/categories`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert.strictEqual(resAdmin.status, 200);
    const body = await resAdmin.json();
    assert.strictEqual(body.success, true);
    assert.strictEqual(body.data.categories.length, 2);
    assert.strictEqual(body.data.categories[1].name, 'Development');
    assert.strictEqual(body.data.categories[1].courseCount, 5);
  } finally {
    Category.find = originalFind;
    Course.countDocuments = originalCount;
    server.close();
  }
});

test('POST /api/admin/categories creates category and validates unique name', async () => {
  const originalFindOne = Category.findOne;
  const originalCreate = Category.create;
  const adminToken = signToken({ id: 'admin_1', role: 'admin', email: 'admin@test.com' });

  const app = createApp();
  const server = app.listen(0);
  const { port } = server.address();

  try {
    // 1. Missing name -> 400
    const resEmpty = await fetch(`http://127.0.0.1:${port}/api/admin/categories`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ name: '   ' })
    });
    assert.strictEqual(resEmpty.status, 400);

    // 2. Duplicate name -> 400
    Category.findOne = async () => ({ _id: 'cat_existing', name: 'Cloud' });
    const resDup = await fetch(`http://127.0.0.1:${port}/api/admin/categories`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ name: 'Cloud' })
    });
    assert.strictEqual(resDup.status, 400);
    const dupBody = await resDup.json();
    assert.match(dupBody.error.message, /already exists/);

    // 3. Valid creation -> 201
    Category.findOne = async () => null;
    Category.create = async (doc) => ({
      _id: new mongoose.Types.ObjectId(),
      ...doc
    });

    const resValid = await fetch(`http://127.0.0.1:${port}/api/admin/categories`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ name: 'Artificial Intelligence', description: 'AI & ML courses' })
    });
    assert.strictEqual(resValid.status, 201);
    const validBody = await resValid.json();
    assert.strictEqual(validBody.success, true);
    assert.strictEqual(validBody.data.category.name, 'Artificial Intelligence');
    assert.strictEqual(validBody.data.category.slug, 'artificial-intelligence');
  } finally {
    Category.findOne = originalFindOne;
    Category.create = originalCreate;
    server.close();
  }
});

test('PATCH /api/admin/categories/:id updates category and renames linked courses', async () => {
  const originalFindById = Category.findById;
  const originalFindOne = Category.findOne;
  const originalUpdateMany = Course.updateMany;
  const adminToken = signToken({ id: 'admin_1', role: 'admin', email: 'admin@test.com' });
  const categoryId = new mongoose.Types.ObjectId().toString();

  const mockCategory = {
    _id: categoryId,
    name: 'DevOps',
    slug: 'devops',
    description: 'DevOps engineering',
    isActive: true,
    save: async function () { return this; }
  };

  Category.findById = async () => mockCategory;
  Category.findOne = async () => null;

  let coursesRenamed = false;
  Course.updateMany = async (filter, update) => {
    coursesRenamed = true;
    return { modifiedCount: 3 };
  };

  const app = createApp();
  const server = app.listen(0);
  const { port } = server.address();

  try {
    const res = await fetch(`http://127.0.0.1:${port}/api/admin/categories/${categoryId}`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: 'DevOps & SRE',
        description: 'Updated description',
        isActive: false
      })
    });

    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.success, true);
    assert.strictEqual(body.data.category.name, 'DevOps & SRE');
    assert.strictEqual(body.data.category.slug, 'devops-sre');
    assert.strictEqual(body.data.category.isActive, false);
    assert.strictEqual(coursesRenamed, true);
  } finally {
    Category.findById = originalFindById;
    Category.findOne = originalFindOne;
    Course.updateMany = originalUpdateMany;
    server.close();
  }
});

test('DELETE /api/admin/categories/:id prevents deletion when courses use category', async () => {
  const originalFindById = Category.findById;
  const originalCount = Course.countDocuments;
  const originalDelete = Category.findByIdAndDelete;
  const adminToken = signToken({ id: 'admin_1', role: 'admin', email: 'admin@test.com' });
  const categoryId = new mongoose.Types.ObjectId().toString();

  const mockCategory = {
    _id: categoryId,
    name: 'Development'
  };

  Category.findById = async () => mockCategory;

  const app = createApp();
  const server = app.listen(0);
  const { port } = server.address();

  try {
    // 1. Used in 3 courses -> 400
    Course.countDocuments = async () => 3;
    const resBlocked = await fetch(`http://127.0.0.1:${port}/api/admin/categories/${categoryId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert.strictEqual(resBlocked.status, 400);
    const bodyBlocked = await resBlocked.json();
    assert.match(bodyBlocked.error.message, /currently assigned to 3 course/);

    // 2. Unused -> 200
    Course.countDocuments = async () => 0;
    Category.findByIdAndDelete = async () => mockCategory;
    const resOk = await fetch(`http://127.0.0.1:${port}/api/admin/categories/${categoryId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert.strictEqual(resOk.status, 200);
    const bodyOk = await resOk.json();
    assert.strictEqual(bodyOk.success, true);
  } finally {
    Category.findById = originalFindById;
    Course.countDocuments = originalCount;
    Category.findByIdAndDelete = originalDelete;
    server.close();
  }
});
