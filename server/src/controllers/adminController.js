import mongoose from 'mongoose';
import { Course } from '../models/Course.js';
import { ApiError } from '../utils/ApiError.js';

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
