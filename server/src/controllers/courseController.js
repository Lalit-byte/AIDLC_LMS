import mongoose from 'mongoose';
import { Course, slugify } from '../models/Course.js';
import { Category } from '../models/Category.js';
import { Enrollment } from '../models/Enrollment.js';
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

    let isEnrolled = false;
    if (req.user) {
      isEnrolled = Boolean(
        await Enrollment.exists({
          user: req.user.id,
          course: course._id,
          status: { $in: ['active', 'completed'] }
        })
      );
    }

    const canViewAll = req.user && (
      req.user.role === 'admin' ||
      req.user.id?.toString() === course.instructor?._id?.toString() ||
      isEnrolled
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

export async function createCourse(req, res, next) {
  try {
    const { title, description, category, price, currency, thumbnail } = req.body;

    if (!title || !title.trim()) {
      throw ApiError.badRequest('Course title is required.');
    }
    if (!description || !description.trim()) {
      throw ApiError.badRequest('Course description is required.');
    }
    if (!category || !category.trim()) {
      throw ApiError.badRequest('Category is required.');
    }

    const parsedPrice = price !== undefined ? Number(price) : 0;
    if (isNaN(parsedPrice) || parsedPrice < 0) {
      throw ApiError.badRequest('Course price must be a non-negative number.');
    }

    const baseSlug = slugify(title);
    let slug = baseSlug;
    let counter = 1;
    while (await Course.exists({ slug })) {
      slug = `${baseSlug}-${counter++}`;
    }

    const course = await Course.create({
      title: title.trim(),
      slug,
      description: description.trim(),
      category: category.trim(),
      price: parsedPrice,
      currency: currency || 'INR',
      thumbnail: thumbnail ? thumbnail.trim() : '',
      status: 'draft',
      instructor: req.user.id,
      instructorName: req.user.name || ''
    });

    res.status(201).json({
      success: true,
      data: {
        course
      }
    });
  } catch (err) {
    next(err);
  }
}

export async function updateCourse(req, res, next) {
  try {
    const { id } = req.params;
    const course = req.course || await Course.findById(id);
    if (!course) {
      throw ApiError.notFound('Course not found.');
    }

    // Double check ownership if middleware wasn't invoked
    if (req.user.role !== 'admin' && course.instructor.toString() !== req.user.id.toString()) {
      throw ApiError.forbidden('Access denied: You do not own this course.');
    }

    const { title, description, category, price, currency, thumbnail } = req.body;

    if (title !== undefined) {
      if (!title.trim()) {
        throw ApiError.badRequest('Course title cannot be empty.');
      }
      course.title = title.trim();
      const baseSlug = slugify(title);
      let slug = baseSlug;
      let counter = 1;
      while (await Course.exists({ slug, _id: { $ne: course._id } })) {
        slug = `${baseSlug}-${counter++}`;
      }
      course.slug = slug;
    }

    if (description !== undefined) {
      if (!description.trim()) {
        throw ApiError.badRequest('Course description cannot be empty.');
      }
      course.description = description.trim();
    }

    if (category !== undefined) {
      if (!category.trim()) {
        throw ApiError.badRequest('Category cannot be empty.');
      }
      course.category = category.trim();
    }

    if (price !== undefined) {
      const parsedPrice = Number(price);
      if (isNaN(parsedPrice) || parsedPrice < 0) {
        throw ApiError.badRequest('Course price must be a non-negative number.');
      }
      course.price = parsedPrice;
    }

    if (currency !== undefined) {
      course.currency = currency;
    }

    if (thumbnail !== undefined) {
      course.thumbnail = thumbnail.trim();
    }

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

export async function getInstructorCourses(req, res, next) {
  try {
    const courses = await Course.find({ instructor: req.user.id }).sort({ createdAt: -1 });

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

export async function addSection(req, res, next) {
  try {
    const course = req.course || await Course.findById(req.params.id);
    if (!course) {
      throw ApiError.notFound('Course not found.');
    }

    const { title, order } = req.body;
    if (!title || !title.trim()) {
      throw ApiError.badRequest('Section title is required.');
    }

    const newSection = {
      _id: new mongoose.Types.ObjectId(),
      title: title.trim(),
      order: order !== undefined ? Number(order) : (course.sections?.length || 0),
      lessons: []
    };

    if (!course.sections) {
      course.sections = [];
    }
    course.sections.push(newSection);
    await course.save();

    const createdSection = course.sections[course.sections.length - 1];
    res.status(201).json({
      success: true,
      data: {
        section: createdSection,
        sections: course.sections
      }
    });
  } catch (err) {
    next(err);
  }
}

export async function updateSection(req, res, next) {
  try {
    const course = req.course || await Course.findById(req.params.id);
    if (!course) {
      throw ApiError.notFound('Course not found.');
    }

    const section = course.sections?.find((s) => s._id.toString() === req.params.sectionId);
    if (!section) {
      throw ApiError.notFound('Section not found.');
    }

    const { title, order } = req.body;
    if (title !== undefined) {
      if (!title.trim()) {
        throw ApiError.badRequest('Section title cannot be empty.');
      }
      section.title = title.trim();
    }
    if (order !== undefined) {
      section.order = Number(order);
    }

    await course.save();

    res.json({
      success: true,
      data: {
        section,
        sections: course.sections
      }
    });
  } catch (err) {
    next(err);
  }
}

export async function deleteSection(req, res, next) {
  try {
    const course = req.course || await Course.findById(req.params.id);
    if (!course) {
      throw ApiError.notFound('Course not found.');
    }

    const exists = course.sections?.some((s) => s._id.toString() === req.params.sectionId);
    if (!exists) {
      throw ApiError.notFound('Section not found.');
    }

    course.sections = course.sections.filter((s) => s._id.toString() !== req.params.sectionId);
    await course.save();

    res.json({
      success: true,
      data: {
        message: 'Section removed successfully.',
        sections: course.sections,
        totalLessons: course.totalLessons
      }
    });
  } catch (err) {
    next(err);
  }
}

export async function addLesson(req, res, next) {
  try {
    const course = req.course || await Course.findById(req.params.id);
    if (!course) {
      throw ApiError.notFound('Course not found.');
    }

    const section = course.sections?.find((s) => s._id.toString() === req.params.sectionId);
    if (!section) {
      throw ApiError.notFound('Section not found.');
    }

    const { title, duration, type, embedUrl, content, isPreview, order } = req.body;
    if (!title || !title.trim()) {
      throw ApiError.badRequest('Lesson title is required.');
    }

    const lessonType = type === 'text' ? 'text' : 'video';
    const newLesson = {
      _id: new mongoose.Types.ObjectId(),
      title: title.trim(),
      duration: duration ? duration.trim() : '',
      type: lessonType,
      embedUrl: embedUrl ? embedUrl.trim() : '',
      content: content ? content.trim() : '',
      isPreview: Boolean(isPreview),
      order: order !== undefined ? Number(order) : (section.lessons?.length || 0)
    };

    if (!section.lessons) {
      section.lessons = [];
    }
    section.lessons.push(newLesson);
    await course.save();

    const createdLesson = section.lessons[section.lessons.length - 1];
    res.status(201).json({
      success: true,
      data: {
        lesson: createdLesson,
        totalLessons: course.totalLessons
      }
    });
  } catch (err) {
    next(err);
  }
}

export async function updateLesson(req, res, next) {
  try {
    const course = req.course || await Course.findById(req.params.id);
    if (!course) {
      throw ApiError.notFound('Course not found.');
    }

    const section = course.sections?.find((s) => s._id.toString() === req.params.sectionId);
    if (!section) {
      throw ApiError.notFound('Section not found.');
    }

    const lesson = section.lessons?.find((l) => l._id.toString() === req.params.lessonId);
    if (!lesson) {
      throw ApiError.notFound('Lesson not found.');
    }

    const { title, duration, type, embedUrl, content, isPreview, order } = req.body;
    if (title !== undefined) {
      if (!title.trim()) {
        throw ApiError.badRequest('Lesson title cannot be empty.');
      }
      lesson.title = title.trim();
    }
    if (duration !== undefined) {
      lesson.duration = duration.trim();
    }
    if (type !== undefined) {
      if (!['video', 'text'].includes(type)) {
        throw ApiError.badRequest("Lesson type must be 'video' or 'text'.");
      }
      lesson.type = type;
    }
    if (embedUrl !== undefined) {
      lesson.embedUrl = embedUrl.trim();
    }
    if (content !== undefined) {
      lesson.content = content.trim();
    }
    if (isPreview !== undefined) {
      lesson.isPreview = Boolean(isPreview);
    }
    if (order !== undefined) {
      lesson.order = Number(order);
    }

    await course.save();

    res.json({
      success: true,
      data: {
        lesson,
        totalLessons: course.totalLessons
      }
    });
  } catch (err) {
    next(err);
  }
}

export async function deleteLesson(req, res, next) {
  try {
    const course = req.course || await Course.findById(req.params.id);
    if (!course) {
      throw ApiError.notFound('Course not found.');
    }

    const section = course.sections?.find((s) => s._id.toString() === req.params.sectionId);
    if (!section) {
      throw ApiError.notFound('Section not found.');
    }

    const exists = section.lessons?.some((l) => l._id.toString() === req.params.lessonId);
    if (!exists) {
      throw ApiError.notFound('Lesson not found.');
    }

    section.lessons = section.lessons.filter((l) => l._id.toString() !== req.params.lessonId);
    await course.save();

    res.json({
      success: true,
      data: {
        message: 'Lesson removed successfully.',
        totalLessons: course.totalLessons
      }
    });
  } catch (err) {
    next(err);
  }
}
