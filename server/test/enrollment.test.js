import test from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import { createApp } from '../src/app.js';
import { Course } from '../src/models/Course.js';
import { Enrollment } from '../src/models/Enrollment.js';
import { signToken } from '../src/utils/token.js';

test('GET /api/enrollments/my-courses returns student active enrollments', async () => {
  const originalFind = Enrollment.find;

  const studentId = new mongoose.Types.ObjectId().toString();
  const token = signToken({ id: studentId, role: 'student', email: 'stu@test.com' });

  const mockEnrollments = [
    {
      _id: 'enr_1',
      user: studentId,
      status: 'active',
      progressPercent: 50,
      completedLessons: ['l1'],
      course: {
        _id: 'c1',
        title: 'React Fundamentals',
        price: 0,
        thumbnail: 'thumb.png'
      }
    }
  ];

  Enrollment.find = (filter) => ({
    populate: () => ({
      sort: () => ({
        lean: async () => mockEnrollments.filter((e) => e.user === filter.user)
      })
    })
  });

  const app = createApp();
  const server = app.listen(0);
  const { port } = server.address();

  try {
    // 1. Unauthenticated request rejected (401)
    const resUnauth = await fetch(`http://127.0.0.1:${port}/api/enrollments/my-courses`);
    assert.strictEqual(resUnauth.status, 401);

    // 2. Authenticated student receives their courses
    const resAuth = await fetch(`http://127.0.0.1:${port}/api/enrollments/my-courses`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    assert.strictEqual(resAuth.status, 200);
    const body = await resAuth.json();
    assert.strictEqual(body.success, true);
    assert.strictEqual(body.data.courses.length, 1);
    assert.strictEqual(body.data.courses[0].title, 'React Fundamentals');
    assert.strictEqual(body.data.courses[0].progressPercent, 50);
  } finally {
    Enrollment.find = originalFind;
    server.close();
  }
});

test('POST /api/enrollments/:courseId/free enrolls student in free course and rejects paid/unpublished', async () => {
  const originalFindOneCourse = Course.findOne;
  const originalFindOneEnrollment = Enrollment.findOne;
  const originalFindOneAndUpdate = Enrollment.findOneAndUpdate;

  const studentId = new mongoose.Types.ObjectId().toString();
  const token = signToken({ id: studentId, role: 'student', email: 'stu@test.com' });

  const freeCourseId = new mongoose.Types.ObjectId().toString();
  const paidCourseId = new mongoose.Types.ObjectId().toString();
  const draftCourseId = new mongoose.Types.ObjectId().toString();

  Course.findOne = async (query) => {
    const id = query.$or ? query.$or[0]._id : query._id;
    if (id === freeCourseId) {
      return { _id: freeCourseId, price: 0, status: 'published' };
    }
    if (id === paidCourseId) {
      return { _id: paidCourseId, price: 999, status: 'published' };
    }
    if (id === draftCourseId) {
      return { _id: draftCourseId, price: 0, status: 'draft' };
    }
    return null;
  };

  Enrollment.findOne = async () => null;
  Enrollment.findOneAndUpdate = async (filter, update) => ({
    _id: 'enr_new',
    ...update,
    status: 'active'
  });

  const app = createApp();
  const server = app.listen(0);
  const { port } = server.address();

  try {
    // 1. Paid course rejected (400)
    const resPaid = await fetch(`http://127.0.0.1:${port}/api/enrollments/${paidCourseId}/free`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` }
    });
    assert.strictEqual(resPaid.status, 400);

    // 2. Draft course rejected (400)
    const resDraft = await fetch(`http://127.0.0.1:${port}/api/enrollments/${draftCourseId}/free`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` }
    });
    assert.strictEqual(resDraft.status, 400);

    // 3. Free published course successfully enrolled (201)
    const resFree = await fetch(`http://127.0.0.1:${port}/api/enrollments/${freeCourseId}/free`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` }
    });
    assert.strictEqual(resFree.status, 201);
    const body = await resFree.json();
    assert.strictEqual(body.success, true);
    assert.strictEqual(body.data.enrollment.status, 'active');
  } finally {
    Course.findOne = originalFindOneCourse;
    Enrollment.findOne = originalFindOneEnrollment;
    Enrollment.findOneAndUpdate = originalFindOneAndUpdate;
    server.close();
  }
});

test('POST /api/enrollments/:courseId/progress updates lesson progress percentage', async () => {
  const originalFindOneCourse = Course.findOne;
  const originalFindOneEnrollment = Enrollment.findOne;

  const studentId = new mongoose.Types.ObjectId().toString();
  const token = signToken({ id: studentId, role: 'student', email: 'stu@test.com' });
  const courseId = new mongoose.Types.ObjectId().toString();

  Course.findOne = async () => ({
    _id: courseId,
    totalLessons: 2,
    sections: []
  });

  const mockEnrollment = {
    _id: 'enr_123',
    user: studentId,
    course: courseId,
    status: 'active',
    completedLessons: [],
    progressPercent: 0,
    save: async function () { return this; }
  };

  Enrollment.findOne = async (filter) => {
    if (filter.user === studentId) return mockEnrollment;
    return null;
  };

  const app = createApp();
  const server = app.listen(0);
  const { port } = server.address();

  try {
    // 1. Missing lessonId returns 400
    const resMissing = await fetch(`http://127.0.0.1:${port}/api/enrollments/${courseId}/progress`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({})
    });
    assert.strictEqual(resMissing.status, 400);

    // 2. Mark lesson 1 completed (50%)
    const res1 = await fetch(`http://127.0.0.1:${port}/api/enrollments/${courseId}/progress`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ lessonId: 'l1' })
    });
    assert.strictEqual(res1.status, 200);
    const body1 = await res1.json();
    assert.strictEqual(body1.success, true);
    assert.deepStrictEqual(body1.data.completedLessons, ['l1']);
    assert.strictEqual(body1.data.progressPercent, 50);

    // 3. Mark lesson 2 completed (100% and status completed)
    const res2 = await fetch(`http://127.0.0.1:${port}/api/enrollments/${courseId}/progress`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ lessonId: 'l2' })
    });
    assert.strictEqual(res2.status, 200);
    const body2 = await res2.json();
    assert.strictEqual(body2.data.progressPercent, 100);
    assert.strictEqual(body2.data.status, 'completed');

    // 4. Toggle lesson 1 off (back to 50% and status active)
    const res3 = await fetch(`http://127.0.0.1:${port}/api/enrollments/${courseId}/progress`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ lessonId: 'l1' })
    });
    assert.strictEqual(res3.status, 200);
    const body3 = await res3.json();
    assert.strictEqual(body3.data.progressPercent, 50);
    assert.strictEqual(body3.data.status, 'active');
  } finally {
    Course.findOne = originalFindOneCourse;
    Enrollment.findOne = originalFindOneEnrollment;
    server.close();
  }
});

test('GET /api/courses/:slugOrId unlocks protected content for enrolled students', async () => {
  const originalFindOneCourse = Course.findOne;
  const originalExistsEnrollment = Enrollment.exists;

  const enrolledStudentId = new mongoose.Types.ObjectId().toString();
  const guestStudentId = new mongoose.Types.ObjectId().toString();
  const courseId = new mongoose.Types.ObjectId().toString();

  const enrolledToken = signToken({ id: enrolledStudentId, role: 'student', email: 'enrolled@test.com' });
  const guestToken = signToken({ id: guestStudentId, role: 'student', email: 'guest@test.com' });

  const mockCourseData = {
    _id: courseId,
    title: 'Secret Video Architecture',
    slug: 'secret-video-architecture',
    status: 'published',
    instructor: { _id: 'inst_1', name: 'Dan Abramov' },
    sections: [
      {
        _id: 'sec_1',
        title: 'Core Architecture',
        lessons: [
          {
            _id: 'lsn_1',
            title: 'Intro Video',
            type: 'video',
            embedUrl: 'https://youtube.com/embed/intro',
            isPreview: true
          },
          {
            _id: 'lsn_2',
            title: 'Paid Exclusive Deep Dive',
            type: 'video',
            embedUrl: 'https://youtube.com/embed/exclusive-paid',
            content: 'Super secret student tutorial',
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

  Enrollment.exists = async (filter) => filter.user === enrolledStudentId;

  const app = createApp();
  const server = app.listen(0);
  const { port } = server.address();

  try {
    // 1. Non-enrolled student: non-preview content is masked
    const resGuest = await fetch(`http://127.0.0.1:${port}/api/courses/${courseId}`, {
      headers: { Authorization: `Bearer ${guestToken}` }
    });
    assert.strictEqual(resGuest.status, 200);
    const bodyGuest = await resGuest.json();
    const guestLessons = bodyGuest.data.course.sections[0].lessons;
    assert.strictEqual(guestLessons[0].embedUrl, 'https://youtube.com/embed/intro');
    assert.strictEqual(guestLessons[1].embedUrl, undefined);
    assert.strictEqual(guestLessons[1].content, undefined);

    // 2. Enrolled student: non-preview content is UNLOCKED
    const resEnrolled = await fetch(`http://127.0.0.1:${port}/api/courses/${courseId}`, {
      headers: { Authorization: `Bearer ${enrolledToken}` }
    });
    assert.strictEqual(resEnrolled.status, 200);
    const bodyEnrolled = await resEnrolled.json();
    const enrolledLessons = bodyEnrolled.data.course.sections[0].lessons;
    assert.strictEqual(enrolledLessons[0].embedUrl, 'https://youtube.com/embed/intro');
    assert.strictEqual(enrolledLessons[1].embedUrl, 'https://youtube.com/embed/exclusive-paid');
    assert.strictEqual(enrolledLessons[1].content, 'Super secret student tutorial');
  } finally {
    Course.findOne = originalFindOneCourse;
    Enrollment.exists = originalExistsEnrollment;
    server.close();
  }
});
