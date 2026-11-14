import mongoose from 'mongoose';
import { Course } from '../models/Course.js';
import { User } from '../models/User.js';
import { ApiError } from '../utils/ApiError.js';

export async function getAdminOverview(req, res, next) {
  try {
    const [pendingCount, publishedCount, totalCourses, totalUsers, allCourses] = await Promise.all([
      Course.countDocuments({ status: 'pending_review' }),
      Course.countDocuments({ status: 'published' }),
      Course.countDocuments(),
      User.countDocuments(),
      Course.find().sort({ updatedAt: -1 }).populate('instructor', 'name email').lean()
    ]);

    res.json({
      success: true,
      data: {
        stats: {
          pendingCount,
          publishedCount,
          totalCourses,
          totalUsers
        },
        courses: allCourses
      }
    });
  } catch (err) {
    next(err);
  }
}

export async function getPendingCourses(req, res, next) {
  try {
    const courses = await Course.find({ status: 'pending_review' })
      .sort({ updatedAt: -1 })
      .populate('instructor', 'name email')
      .lean();

    res.json({
      success: true,
      data: {
        courses
      }
    });
  } catch (err) {
    next(err);
  }
}

export async function approveCourse(req, res, next) {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw ApiError.badRequest('Invalid course ID.');
    }

    const course = await Course.findById(id);
    if (!course) {
      throw ApiError.notFound('Course not found.');
    }

    course.status = 'published';
    course.rejectionReason = '';
    await course.save();

    res.json({
      success: true,
      data: {
        course
      }
    });
  } catch (err) {
    next(err);
  }
}

export async function rejectCourse(req, res, next) {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    if (!reason || !reason.trim()) {
      throw ApiError.badRequest('A rejection reason is required.');
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw ApiError.badRequest('Invalid course ID.');
    }

    const course = await Course.findById(id);
    if (!course) {
      throw ApiError.notFound('Course not found.');
    }

    course.status = 'rejected';
    course.rejectionReason = reason.trim();
    await course.save();

    res.json({
      success: true,
      data: {
        course
      }
    });
  } catch (err) {
    next(err);
  }
}
