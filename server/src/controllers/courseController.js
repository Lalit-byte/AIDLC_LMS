import mongoose from 'mongoose';
import { Course } from '../models/Course.js';
import { Category } from '../models/Category.js';
import { ApiError } from '../utils/ApiError.js';

export async function getPublicCourses(req, res, next) {
  try {
    const { search, category, price } = req.query;
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 12));
    const skip = (page - 1) * limit;

    const filter = { status: 'published' };

    if (category && category.toLowerCase() !== 'all') {
      filter.category = new RegExp(`^${category.trim()}$`, 'i');
    }

    if (price === 'free') {
      filter.price = 0;
    } else if (price === 'paid') {
      filter.price = { $gt: 0 };
    }

    if (search && search.trim()) {
      const sanitizedSearch = search.trim();
      filter.$or = [
        { title: new RegExp(sanitizedSearch, 'i') },
        { description: new RegExp(sanitizedSearch, 'i') }
      ];
    }

    const [total, courses] = await Promise.all([
      Course.countDocuments(filter),
      Course.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .select('title slug description instructor instructorName category price currency thumbnail totalLessons createdAt')
        .populate('instructor', 'name email')
        .lean()
    ]);

    const totalPages = Math.ceil(total / limit) || 1;

    res.json({
      success: true,
      data: {
        courses,
        total,
        page,
        limit,
        totalPages
      }
    });
  } catch (err) {
    next(err);
  }
}

export async function getCourseDetails(req, res, next) {
  try {
    const { slugOrId } = req.params;

    const query = { status: 'published' };
    if (mongoose.Types.ObjectId.isValid(slugOrId)) {
      query.$or = [{ _id: slugOrId }, { slug: slugOrId }];
    } else {
      query.slug = slugOrId;
    }

    const course = await Course.findOne(query).populate('instructor', 'name email');
    if (!course) {
      throw ApiError.notFound('Course not found.');
    }

    const canViewAll = req.user && (
      req.user.role === 'admin' ||
      req.user.id?.toString() === course.instructor?._id?.toString()
    );

    const courseObj = course.toObject();

    // Sanitize non-preview lesson contents for visitors / un-enrolled guests
    if (!canViewAll) {
      courseObj.sections = (courseObj.sections || []).map(section => ({
        ...section,
        lessons: (section.lessons || []).map(lesson => {
          if (lesson.isPreview) {
            return lesson;
          }
          return {
            _id: lesson._id,
            title: lesson.title,
            duration: lesson.duration,
            type: lesson.type,
            order: lesson.order,
            isPreview: false
          };
        })
      }));
    }

    res.json({
      success: true,
      data: {
        course: courseObj
      }
    });
  } catch (err) {
    next(err);
  }
}

export async function getCategories(req, res, next) {
  try {
    const categories = await Category.find({ isActive: true }).sort({ name: 1 }).lean();
    res.json({
      success: true,
      data: {
        categories
      }
    });
  } catch (err) {
    next(err);
  }
}

export async function submitCourseForReview(req, res, next) {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw ApiError.badRequest('Invalid course ID.');
    }

    const course = await Course.findById(id);
    if (!course) {
      throw ApiError.notFound('Course not found.');
    }

    // Ensure user is the instructor or an admin
    if (req.user.role !== 'admin' && course.instructor.toString() !== req.user.id.toString()) {
      throw ApiError.forbidden('Access denied: You do not own this course.');
    }

    if (course.status === 'published') {
      throw ApiError.badRequest('Course is already published.');
    }

    // Must have at least one section and at least one lesson
    const hasSections = course.sections && course.sections.length > 0;
    const totalLessons = hasSections
      ? course.sections.reduce((sum, s) => sum + (s.lessons ? s.lessons.length : 0), 0)
      : 0;

    if (!hasSections || totalLessons === 0) {
      throw ApiError.badRequest('A course must contain at least one section and one lesson before submitting for review.');
    }

    course.status = 'pending_review';
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
