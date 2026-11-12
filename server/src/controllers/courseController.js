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
