import test from 'node:test';
import assert from 'node:assert/strict';
import { createApp } from '../src/app.js';
import { Course } from '../src/models/Course.js';
import { Category } from '../src/models/Category.js';

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
