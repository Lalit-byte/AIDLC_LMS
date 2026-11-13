import test from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import { createApp } from '../src/app.js';
import { Course } from '../src/models/Course.js';
import { Category } from '../src/models/Category.js';
import { signToken } from '../src/utils/token.js';

test('GET /api/categories returns active categories', async () => {
  const originalFind = Category.find;
  Category.find = () => ({
    sort: () => ({
      lean: async () => [
        { name: 'Development', slug: 'development', isActive: true },
        { name: 'Design', slug: 'design', isActive: true }
      ]
    })
  });

  const app = createApp();
  const server = app.listen(0);
  const { port } = server.address();

  try {
    const res = await fetch(`http://127.0.0.1:${port}/api/categories`);
    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.success, true);
    assert.strictEqual(body.data.categories.length, 2);
    assert.strictEqual(body.data.categories[0].name, 'Development');
  } finally {
    Category.find = originalFind;
    server.close();
  }
});

test('GET /api/courses returns paginated courses and applies filter query', async () => {
  const originalFind = Course.find;
  const originalCount = Course.countDocuments;

  let capturedFilter = null;
  Course.countDocuments = async (filter) => {
    capturedFilter = filter;
    return 1;
  };

  Course.find = (filter) => ({
    sort: () => ({
      skip: () => ({
        limit: () => ({
          select: () => ({
            populate: () => ({
              lean: async () => [
                {
                  _id: 'crs_1',
                  title: 'React Fundamentals',
                  slug: 'react-fundamentals',
                  price: 0,
                  category: 'Development',
                  status: 'published'
                }
              ]
            })
          })
        })
      })
    })
  });

  const app = createApp();
  const server = app.listen(0);
  const { port } = server.address();

  try {
    const res = await fetch(`http://127.0.0.1:${port}/api/courses?category=Development&price=free&page=1&limit=10`);
    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.success, true);
    assert.strictEqual(body.data.courses.length, 1);
    assert.strictEqual(body.data.total, 1);
    assert.strictEqual(body.data.page, 1);
    assert.strictEqual(body.data.totalPages, 1);

    // Verify filter parameters
    assert.strictEqual(capturedFilter.status, 'published');
    assert.strictEqual(capturedFilter.price, 0);
  } finally {
    Course.find = originalFind;
    Course.countDocuments = originalCount;
    server.close();
  }
});

test('GET /api/courses/:slugOrId masks non-preview lessons for guests', async () => {
  const originalFindOne = Course.findOne;

  const mockCourseData = {
    _id: '507f1f77bcf86cd799439011',
    title: 'Modern Full-Stack',
    slug: 'modern-full-stack',
    status: 'published',
    instructor: { _id: '507f1f77bcf86cd799439012', name: 'Instructor Jane' },
    sections: [
      {
        _id: 'sec_1',
        title: 'Section 1',
        lessons: [
          {
            _id: 'lsn_1',
            title: 'Intro Video',
            duration: '10 min',
            type: 'video',
            embedUrl: 'https://youtube.com/embed/demo',
            content: '',
            isPreview: true
          },
          {
            _id: 'lsn_2',
            title: 'Deep Dive Architecture',
            duration: '25 min',
            type: 'text',
            embedUrl: 'https://youtube.com/embed/secret',
            content: 'Confidential student course content',
            isPreview: false
          }
        ]
      }
    ],
    toObject() {
      return JSON.parse(JSON.stringify(this));
    }
  };

  Course.findOne = () => ({
    populate: async () => mockCourseData
  });

  const app = createApp();
  const server = app.listen(0);
  const { port } = server.address();

  try {
    // Unauthenticated guest request
    const res = await fetch(`http://127.0.0.1:${port}/api/courses/modern-full-stack`);
    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.success, true);

    const lessons = body.data.course.sections[0].lessons;
    // Preview lesson keeps embedUrl
    assert.strictEqual(lessons[0].title, 'Intro Video');
    assert.strictEqual(lessons[0].embedUrl, 'https://youtube.com/embed/demo');
    assert.strictEqual(lessons[0].isPreview, true);

    // Non-preview lesson has secret content and embedUrl stripped
    assert.strictEqual(lessons[1].title, 'Deep Dive Architecture');
    assert.strictEqual(lessons[1].isPreview, false);
    assert.strictEqual(lessons[1].content, undefined);
    assert.strictEqual(lessons[1].embedUrl, undefined);
  } finally {
    Course.findOne = originalFindOne;
    server.close();
  }
});

test('GET /api/courses/:slugOrId returns 404 when course is not found', async () => {
  const originalFindOne = Course.findOne;
  Course.findOne = () => ({
    populate: async () => null
  });

  const app = createApp();
  const server = app.listen(0);
  const { port } = server.address();

  try {
    const res = await fetch(`http://127.0.0.1:${port}/api/courses/non-existent-course`);
    assert.strictEqual(res.status, 404);
    const body = await res.json();
    assert.strictEqual(body.success, false);
    assert.strictEqual(body.error.code, 'NOT_FOUND');
  } finally {
    Course.findOne = originalFindOne;
    server.close();
  }
});

test('POST /api/courses creates course in draft status with instructor ownership', async () => {
  const originalCreate = Course.create;
  const originalExists = Course.exists;

  const instructorId = new mongoose.Types.ObjectId().toString();
  const instructorToken = signToken({ id: instructorId, role: 'instructor', name: 'Professor Oak', email: 'oak@test.com' });
  const studentToken = signToken({ id: 'stu_1', role: 'student', email: 'stu@test.com' });

  Course.exists = async () => false;
  Course.create = async (doc) => ({
    _id: new mongoose.Types.ObjectId().toString(),
    ...doc,
    createdAt: new Date().toISOString()
  });

  const app = createApp();
  const server = app.listen(0);
  const { port } = server.address();

  try {
    // 1. Student cannot create course (403)
    const res1 = await fetch(`http://127.0.0.1:${port}/api/courses`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${studentToken}`
      },
      body: JSON.stringify({ title: 'Course 1', description: 'Desc', category: 'Dev' })
    });
    assert.strictEqual(res1.status, 403);

    // 2. Instructor missing required title (400)
    const res2 = await fetch(`http://127.0.0.1:${port}/api/courses`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${instructorToken}`
      },
      body: JSON.stringify({ description: 'Desc', category: 'Dev' })
    });
    assert.strictEqual(res2.status, 400);

    // 3. Valid course creation
    const res3 = await fetch(`http://127.0.0.1:${port}/api/courses`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${instructorToken}`
      },
      body: JSON.stringify({
        title: 'Node.js Masterclass',
        description: 'Comprehensive Node.js guide',
        category: 'Development',
        price: 999,
        thumbnail: 'https://img.example.com/node.png'
      })
    });
    assert.strictEqual(res3.status, 201);
    const body = await res3.json();
    assert.strictEqual(body.success, true);
    assert.strictEqual(body.data.course.title, 'Node.js Masterclass');
    assert.strictEqual(body.data.course.status, 'draft');
    assert.strictEqual(body.data.course.instructor, instructorId);
    assert.strictEqual(body.data.course.instructorName, 'Professor Oak');
    assert.strictEqual(body.data.course.slug, 'node-js-masterclass');
    assert.strictEqual(body.data.course.price, 999);
  } finally {
    Course.create = originalCreate;
    Course.exists = originalExists;
    server.close();
  }
});

test('PUT /api/courses/:id allows owner to update details and rejects non-owners', async () => {
  const originalFindById = Course.findById;
  const originalExists = Course.exists;

  const ownerId = new mongoose.Types.ObjectId().toString();
  const otherInstructorId = new mongoose.Types.ObjectId().toString();
  const courseId = new mongoose.Types.ObjectId().toString();

  const ownerToken = signToken({ id: ownerId, role: 'instructor', email: 'owner@test.com' });
  const otherToken = signToken({ id: otherInstructorId, role: 'instructor', email: 'other@test.com' });

  const mockCourse = {
    _id: courseId,
    title: 'Original Title',
    slug: 'original-title',
    description: 'Original description',
    category: 'Development',
    price: 0,
    currency: 'INR',
    thumbnail: '',
    instructor: ownerId,
    status: 'draft',
    save: async function () { return this; }
  };

  Course.findById = async (id) => (id === courseId ? mockCourse : null);
  Course.exists = async () => false;

  const app = createApp();
  const server = app.listen(0);
  const { port } = server.address();

  try {
    // 1. Non-owner instructor receives 403 Forbidden
    const res1 = await fetch(`http://127.0.0.1:${port}/api/courses/${courseId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${otherToken}`
      },
      body: JSON.stringify({ title: 'Hacked Title' })
    });
    assert.strictEqual(res1.status, 403);

    // 2. Owner can update details
    const res2 = await fetch(`http://127.0.0.1:${port}/api/courses/${courseId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${ownerToken}`
      },
      body: JSON.stringify({
        title: 'Updated Title',
        description: 'Updated Description',
        category: 'Design',
        price: 499,
        thumbnail: 'https://img.example.com/updated.png'
      })
    });
    assert.strictEqual(res2.status, 200);
    const body = await res2.json();
    assert.strictEqual(body.success, true);
    assert.strictEqual(body.data.course.title, 'Updated Title');
    assert.strictEqual(body.data.course.slug, 'updated-title');
    assert.strictEqual(body.data.course.category, 'Design');
    assert.strictEqual(body.data.course.price, 499);
    assert.strictEqual(body.data.course.thumbnail, 'https://img.example.com/updated.png');
  } finally {
    Course.findById = originalFindById;
    Course.exists = originalExists;
    server.close();
  }
});

test('GET /api/courses/instructor/my-courses returns all courses for instructor', async () => {
  const originalFind = Course.find;

  const instructorId = new mongoose.Types.ObjectId().toString();
  const instructorToken = signToken({ id: instructorId, role: 'instructor', email: 'inst@test.com' });
  const studentToken = signToken({ id: 'student_1', role: 'student', email: 'stu@test.com' });

  Course.find = (filter) => ({
    sort: async () => [
      {
        _id: 'c1',
        title: 'Draft Course',
        status: 'draft',
        instructor: filter.instructor
      },
      {
        _id: 'c2',
        title: 'Published Course',
        status: 'published',
        instructor: filter.instructor
      }
    ]
  });

  const app = createApp();
  const server = app.listen(0);
  const { port } = server.address();

  try {
    // 1. Student role rejected (403)
    const res1 = await fetch(`http://127.0.0.1:${port}/api/courses/instructor/my-courses`, {
      headers: { Authorization: `Bearer ${studentToken}` }
    });
    assert.strictEqual(res1.status, 403);

    // 2. Instructor gets all courses (all statuses)
    const res2 = await fetch(`http://127.0.0.1:${port}/api/courses/instructor/my-courses`, {
      headers: { Authorization: `Bearer ${instructorToken}` }
    });
    assert.strictEqual(res2.status, 200);
    const body = await res2.json();
    assert.strictEqual(body.success, true);
    assert.strictEqual(body.data.courses.length, 2);
    assert.strictEqual(body.data.courses[0].status, 'draft');
    assert.strictEqual(body.data.courses[1].status, 'published');
  } finally {
    Course.find = originalFind;
    server.close();
  }
});

test('Curriculum management: sections and lessons CRUD with ownership & lesson count sync', async () => {
  const originalFindById = Course.findById;

  const ownerId = new mongoose.Types.ObjectId().toString();
  const otherInstructorId = new mongoose.Types.ObjectId().toString();
  const courseId = new mongoose.Types.ObjectId().toString();

  const ownerToken = signToken({ id: ownerId, role: 'instructor', email: 'owner@test.com' });
  const otherToken = signToken({ id: otherInstructorId, role: 'instructor', email: 'other@test.com' });

  const mockCourse = {
    _id: courseId,
    title: 'Full Stack Masterclass',
    slug: 'full-stack-masterclass',
    instructor: ownerId,
    status: 'draft',
    sections: [],
    totalLessons: 0,
    save: async function () {
      this.totalLessons = this.sections.reduce((sum, s) => sum + (s.lessons ? s.lessons.length : 0), 0);
      return this;
    }
  };

  Course.findById = async (id) => (id.toString() === courseId ? mockCourse : null);

  const app = createApp();
  const server = app.listen(0);
  const { port } = server.address();

  try {
    // 1. Non-owner cannot add section (403)
    const res1 = await fetch(`http://127.0.0.1:${port}/api/courses/${courseId}/sections`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${otherToken}` },
      body: JSON.stringify({ title: 'Unauthorized Section' })
    });
    assert.strictEqual(res1.status, 403);

    // 2. Owner adds section
    const res2 = await fetch(`http://127.0.0.1:${port}/api/courses/${courseId}/sections`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${ownerToken}` },
      body: JSON.stringify({ title: 'Module 1: Getting Started' })
    });
    assert.strictEqual(res2.status, 201);
    const body2 = await res2.json();
    assert.strictEqual(body2.success, true);
    assert.strictEqual(body2.data.section.title, 'Module 1: Getting Started');
    const sectionId = body2.data.section._id.toString();

    // 3. Owner updates section title
    const res3 = await fetch(`http://127.0.0.1:${port}/api/courses/${courseId}/sections/${sectionId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${ownerToken}` },
      body: JSON.stringify({ title: 'Module 1: Basics & Setup', order: 1 })
    });
    assert.strictEqual(res3.status, 200);
    const body3 = await res3.json();
    assert.strictEqual(body3.data.section.title, 'Module 1: Basics & Setup');
    assert.strictEqual(body3.data.section.order, 1);

    // 4. Owner adds lesson to section (totalLessons becomes 1)
    const res4 = await fetch(`http://127.0.0.1:${port}/api/courses/${courseId}/sections/${sectionId}/lessons`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${ownerToken}` },
      body: JSON.stringify({
        title: 'Installing Tools',
        duration: '12 min',
        type: 'video',
        embedUrl: 'https://youtube.com/embed/tools',
        isPreview: true
      })
    });
    assert.strictEqual(res4.status, 201);
    const body4 = await res4.json();
    assert.strictEqual(body4.data.lesson.title, 'Installing Tools');
    assert.strictEqual(body4.data.lesson.isPreview, true);
    assert.strictEqual(body4.data.totalLessons, 1);
    const lessonId = body4.data.lesson._id.toString();

    // 5. Owner updates lesson
    const res5 = await fetch(`http://127.0.0.1:${port}/api/courses/${courseId}/sections/${sectionId}/lessons/${lessonId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${ownerToken}` },
      body: JSON.stringify({
        title: 'Installing Node & Git',
        duration: '15 min'
      })
    });
    assert.strictEqual(res5.status, 200);
    const body5 = await res5.json();
    assert.strictEqual(body5.data.lesson.title, 'Installing Node & Git');
    assert.strictEqual(body5.data.lesson.duration, '15 min');

    // 6. Owner deletes lesson (totalLessons drops to 0)
    const res6 = await fetch(`http://127.0.0.1:${port}/api/courses/${courseId}/sections/${sectionId}/lessons/${lessonId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${ownerToken}` }
    });
    assert.strictEqual(res6.status, 200);
    const body6 = await res6.json();
    assert.strictEqual(body6.data.totalLessons, 0);

    // 7. Owner deletes section
    const res7 = await fetch(`http://127.0.0.1:${port}/api/courses/${courseId}/sections/${sectionId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${ownerToken}` }
    });
    assert.strictEqual(res7.status, 200);
    const body7 = await res7.json();
    assert.strictEqual(body7.data.sections.length, 0);
    assert.strictEqual(body7.data.totalLessons, 0);
  } finally {
    Course.findById = originalFindById;
    server.close();
  }
});
