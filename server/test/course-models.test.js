import test from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import { Course, Section, Lesson, slugify } from '../src/models/Course.js';
import { Category } from '../src/models/Category.js';

test('slugify utility generates url-friendly slugs', () => {
  assert.strictEqual(slugify('Modern Full-Stack Web Development!'), 'modern-full-stack-web-development');
  assert.strictEqual(slugify('  React 19 & Node.js   '), 'react-19-node-js');
  assert.strictEqual(slugify('AWS & Cloud Architecture'), 'aws-cloud-architecture');
});

test('Category model validates required fields', async () => {
  const invalidCategory = new Category({});
  let err = null;
  try {
    await invalidCategory.validate();
  } catch (e) {
    err = e;
  }
  assert.ok(err);
  assert.ok(err.errors.name);
  assert.ok(err.errors.slug);

  const validCategory = new Category({
    name: 'Development',
    slug: 'development',
    description: 'Software development courses'
  });
  let validErr = null;
  try {
    await validCategory.validate();
  } catch (e) {
    validErr = e;
  }
  assert.strictEqual(validErr, null);
  assert.strictEqual(validCategory.isActive, true);
});

test('Course model validates required fields and price constraints', async () => {
  const invalidCourse = new Course({});
  let err = null;
  try {
    await invalidCourse.validate();
  } catch (e) {
    err = e;
  }
  assert.ok(err);
  assert.ok(err.errors.title);
  assert.ok(err.errors.description);
  assert.ok(err.errors.instructor);
  assert.ok(err.errors.category);

  // Negative price should be rejected
  const negativePriceCourse = new Course({
    title: 'Test Course',
    slug: 'test-course',
    description: 'A course for testing',
    instructor: new mongoose.Types.ObjectId(),
    category: 'Development',
    price: -10
  });
  let priceErr = null;
  try {
    await negativePriceCourse.validate();
  } catch (e) {
    priceErr = e;
  }
  assert.ok(priceErr);
  assert.ok(priceErr.errors.price);

  // Invalid status should be rejected
  const invalidStatusCourse = new Course({
    title: 'Test Course',
    slug: 'test-course',
    description: 'A course for testing',
    instructor: new mongoose.Types.ObjectId(),
    category: 'Development',
    price: 0,
    status: 'unapproved_custom_status'
  });
  let statusErr = null;
  try {
    await invalidStatusCourse.validate();
  } catch (e) {
    statusErr = e;
  }
  assert.ok(statusErr);
  assert.ok(statusErr.errors.status);
});

test('Course model virtual isFree and embedded sections/lessons', async () => {
  const instructorId = new mongoose.Types.ObjectId();
  const freeCourse = new Course({
    title: 'Free Intro',
    slug: 'free-intro',
    description: 'Free course intro',
    instructor: instructorId,
    category: 'Design',
    price: 0,
    status: 'published',
    sections: [
      {
        title: 'Section 1',
        lessons: [
          {
            title: 'Welcome',
            type: 'video',
            embedUrl: 'https://youtube.com/embed/123',
            isPreview: true
          },
          {
            title: 'Reading',
            type: 'text',
            content: 'Sample lesson text',
            isPreview: false
          }
        ]
      }
    ]
  });

  let err = null;
  try {
    await freeCourse.validate();
  } catch (e) {
    err = e;
  }
  assert.strictEqual(err, null);
  assert.strictEqual(freeCourse.isFree, true);
  assert.strictEqual(freeCourse.currency, 'INR');
  assert.strictEqual(freeCourse.sections.length, 1);
  assert.strictEqual(freeCourse.sections[0].lessons.length, 2);
  assert.strictEqual(freeCourse.sections[0].lessons[0].isPreview, true);

  const paidCourse = new Course({
    title: 'Paid Advanced',
    slug: 'paid-advanced',
    description: 'Paid course',
    instructor: instructorId,
    category: 'Development',
    price: 1999
  });
  assert.strictEqual(paidCourse.isFree, false);
});
