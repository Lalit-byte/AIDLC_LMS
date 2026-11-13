import mongoose from 'mongoose';
import { Enrollment } from '../models/Enrollment.js';
import { Course } from '../models/Course.js';
import { ApiError } from '../utils/ApiError.js';

async function resolveCourse(slugOrId) {
  const query = {};
  if (mongoose.Types.ObjectId.isValid(slugOrId)) {
    query.$or = [{ _id: slugOrId }, { slug: slugOrId }];
  } else {
    query.slug = slugOrId;
  }
  return Course.findOne(query);
}

export async function getMyCourses(req, res, next) {
  try {
    const enrollments = await Enrollment.find({
      user: req.user.id,
      status: { $in: ['active', 'completed'] }
    })
      .populate('course', 'title slug description category price currency thumbnail totalLessons instructor instructorName sections')
      .sort({ enrolledAt: -1 })
      .lean();

    res.json({
      success: true,
      data: {
        enrollments,
        courses: enrollments.map((e) => ({
          ...e.course,
          enrollmentId: e._id,
          progressPercent: e.progressPercent,
          completedLessons: e.completedLessons,
          enrolledAt: e.enrolledAt,
          enrollmentStatus: e.status
        }))
      }
    });
  } catch (err) {
    next(err);
  }
}

export async function enrollFreeCourse(req, res, next) {
  try {
    const { courseId } = req.params;
    const course = await resolveCourse(courseId);

    if (!course) {
      throw ApiError.notFound('Course not found.');
    }

    if (course.status !== 'published') {
      throw ApiError.badRequest('Cannot enroll in an unpublished course.');
    }

    if (course.price !== 0) {
      throw ApiError.badRequest('This course is not free. Payment is required to enroll.');
    }

    const existing = await Enrollment.findOne({
      user: req.user.id,
      course: course._id,
      status: { $in: ['active', 'completed'] }
    });

    if (existing) {
      return res.json({
        success: true,
        message: 'Already enrolled in this course.',
        data: {
          enrollment: existing
        }
      });
    }

    const enrollment = await Enrollment.findOneAndUpdate(
      { user: req.user.id, course: course._id },
      {
        user: req.user.id,
        course: course._id,
        status: 'active',
        progressPercent: 0,
        completedLessons: [],
        enrolledAt: new Date()
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    res.status(201).json({
      success: true,
      data: {
        enrollment
      }
    });
  } catch (err) {
    next(err);
  }
}

export async function updateLessonProgress(req, res, next) {
  try {
    const { courseId } = req.params;
    const { lessonId } = req.body;

    if (!lessonId) {
      throw ApiError.badRequest('lessonId is required.');
    }

    const course = await resolveCourse(courseId);
    if (!course) {
      throw ApiError.notFound('Course not found.');
    }

    const enrollment = await Enrollment.findOne({
      user: req.user.id,
      course: course._id,
      status: { $in: ['active', 'completed'] }
    });

    if (!enrollment) {
      throw ApiError.forbidden('Access denied: You must be enrolled in this course to track progress.');
    }

    const lessonIdStr = lessonId.toString();
    let completed = [...(enrollment.completedLessons || [])];

    if (completed.includes(lessonIdStr)) {
      completed = completed.filter((id) => id !== lessonIdStr);
    } else {
      completed.push(lessonIdStr);
    }

    enrollment.completedLessons = completed;
    const totalLessons = course.totalLessons || course.sections?.reduce((sum, s) => sum + (s.lessons?.length || 0), 0) || 1;
    enrollment.progressPercent = Math.min(100, Math.round((completed.length / totalLessons) * 100));

    if (enrollment.progressPercent === 100) {
      enrollment.status = 'completed';
    } else if (enrollment.status === 'completed') {
      enrollment.status = 'active';
    }

    await enrollment.save();

    res.json({
      success: true,
      data: {
        completedLessons: enrollment.completedLessons,
        progressPercent: enrollment.progressPercent,
        status: enrollment.status,
        enrollment
      }
    });
  } catch (err) {
    next(err);
  }
}

export async function getCourseProgress(req, res, next) {
  try {
    const { courseId } = req.params;
    const course = await resolveCourse(courseId);

    if (!course) {
      throw ApiError.notFound('Course not found.');
    }

    const enrollment = await Enrollment.findOne({
      user: req.user.id,
      course: course._id,
      status: { $in: ['active', 'completed'] }
    });

    if (!enrollment) {
      return res.json({
        success: true,
        data: {
          isEnrolled: false,
          completedLessons: [],
          progressPercent: 0
        }
      });
    }

    res.json({
      success: true,
      data: {
        isEnrolled: true,
        completedLessons: enrollment.completedLessons,
        progressPercent: enrollment.progressPercent,
        status: enrollment.status
      }
    });
  } catch (err) {
    next(err);
  }
}
