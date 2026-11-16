import mongoose from 'mongoose';
import { Course, slugify } from '../models/Course.js';
import { Category } from '../models/Category.js';
import { User } from '../models/User.js';
import { Enrollment } from '../models/Enrollment.js';
import { Payment } from '../models/Payment.js';
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

export async function getAdminCategories(req, res, next) {
  try {
    const categories = await Category.find().sort({ name: 1 }).lean();
    const categoriesWithCount = await Promise.all(
      categories.map(async (cat) => {
        const courseCount = await Course.countDocuments({
          category: new RegExp(`^${cat.name}$`, 'i')
        });
        return {
          ...cat,
          courseCount
        };
      })
    );

    res.json({
      success: true,
      data: {
        categories: categoriesWithCount
      }
    });
  } catch (err) {
    next(err);
  }
}

export async function createCategory(req, res, next) {
  try {
    const { name, description, isActive } = req.body;
    if (!name || !name.trim()) {
      throw ApiError.badRequest('Category name is required.');
    }

    const trimmedName = name.trim();
    const slug = slugify(trimmedName);
    if (!slug) {
      throw ApiError.badRequest('Category name must contain valid alphanumeric characters.');
    }

    const existing = await Category.findOne({
      $or: [
        { name: new RegExp(`^${trimmedName}$`, 'i') },
        { slug }
      ]
    });
    if (existing) {
      throw ApiError.badRequest(`Category "${trimmedName}" already exists.`);
    }

    const category = await Category.create({
      name: trimmedName,
      slug,
      description: description ? description.trim() : '',
      isActive: isActive !== undefined ? Boolean(isActive) : true
    });

    res.status(201).json({
      success: true,
      data: {
        category
      }
    });
  } catch (err) {
    next(err);
  }
}

export async function updateCategory(req, res, next) {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw ApiError.badRequest('Invalid category ID.');
    }

    const category = await Category.findById(id);
    if (!category) {
      throw ApiError.notFound('Category not found.');
    }

    const { name, description, isActive } = req.body;
    const oldName = category.name;

    if (name !== undefined) {
      const trimmedName = name.trim();
      if (!trimmedName) {
        throw ApiError.badRequest('Category name cannot be empty.');
      }

      if (trimmedName.toLowerCase() !== category.name.toLowerCase()) {
        const slug = slugify(trimmedName);
        const existing = await Category.findOne({
          _id: { $ne: id },
          $or: [
            { name: new RegExp(`^${trimmedName}$`, 'i') },
            { slug }
          ]
        });
        if (existing) {
          throw ApiError.badRequest(`Category "${trimmedName}" already exists.`);
        }
        category.name = trimmedName;
        category.slug = slug;
      }
    }

    if (description !== undefined) {
      category.description = description.trim();
    }

    if (isActive !== undefined) {
      category.isActive = Boolean(isActive);
    }

    await category.save();

    if (name !== undefined && category.name !== oldName) {
      await Course.updateMany(
        { category: new RegExp(`^${oldName}$`, 'i') },
        { $set: { category: category.name } }
      );
    }

    res.json({
      success: true,
      data: {
        category
      }
    });
  } catch (err) {
    next(err);
  }
}

export async function deleteCategory(req, res, next) {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw ApiError.badRequest('Invalid category ID.');
    }

    const category = await Category.findById(id);
    if (!category) {
      throw ApiError.notFound('Category not found.');
    }

    const courseCount = await Course.countDocuments({
      category: new RegExp(`^${category.name}$`, 'i')
    });
    if (courseCount > 0) {
      throw ApiError.badRequest(
        `Cannot delete category "${category.name}" because it is currently assigned to ${courseCount} course(s). Deactivate it instead.`
      );
    }

    await Category.findByIdAndDelete(id);

    res.json({
      success: true,
      message: `Category "${category.name}" deleted successfully.`
    });
  } catch (err) {
    next(err);
  }
}

export async function getAdminUsers(req, res, next) {
  try {
    const users = await User.find().sort({ createdAt: -1 }).lean();

    const usersWithStats = await Promise.all(
      users.map(async (u) => {
        let coursesAuthored = 0;
        let coursesEnrolled = 0;
        if (u.role === 'instructor' || u.role === 'admin') {
          coursesAuthored = await Course.countDocuments({ instructor: u._id });
        }
        if (u.role === 'student') {
          coursesEnrolled = await Enrollment.countDocuments({ user: u._id });
        }
        return {
          _id: u._id,
          id: u._id,
          name: u.name,
          email: u.email,
          role: u.role,
          isActive: u.isActive !== false,
          coursesAuthored,
          coursesEnrolled,
          createdAt: u.createdAt
        };
      })
    );

    res.json({
      success: true,
      data: {
        users: usersWithStats
      }
    });
  } catch (err) {
    next(err);
  }
}

export async function createAdminUser(req, res, next) {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !name.trim()) {
      throw ApiError.badRequest('User name is required.');
    }
    if (!email || !email.trim()) {
      throw ApiError.badRequest('User email is required.');
    }
    const emailRegex = /^\S+@\S+\.\S+$/;
    if (!emailRegex.test(email.trim())) {
      throw ApiError.badRequest('Please provide a valid email address.');
    }
    if (!password || password.length < 6) {
      throw ApiError.badRequest('Password must be at least 6 characters.');
    }

    const assignedRole =
      role && ['student', 'instructor', 'admin'].includes(role.toLowerCase())
        ? role.toLowerCase()
        : 'student';

    const normalizedEmail = email.trim().toLowerCase();
    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) {
      throw ApiError.badRequest(`A user with email "${normalizedEmail}" already exists.`);
    }

    const passwordHash = await User.hashPassword(password);
    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      passwordHash,
      role: assignedRole,
      isActive: true
    });

    res.status(201).json({
      success: true,
      data: {
        user: {
          _id: user._id,
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          isActive: user.isActive,
          createdAt: user.createdAt
        }
      }
    });
  } catch (err) {
    next(err);
  }
}

export async function deleteAdminUser(req, res, next) {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw ApiError.badRequest('Invalid user ID.');
    }

    if (req.user && req.user.id?.toString() === id.toString()) {
      throw ApiError.badRequest('You cannot delete your own admin account.');
    }

    const targetUser = await User.findById(id);
    if (!targetUser) {
      throw ApiError.notFound('User not found.');
    }

    const authoredCoursesCount = await Course.countDocuments({ instructor: id });
    if (authoredCoursesCount > 0) {
      throw ApiError.badRequest(
        `Cannot delete instructor "${targetUser.name}" because they have ${authoredCoursesCount} course(s). Reassign or delete their courses first, or deactivate the user.`
      );
    }

    await Enrollment.deleteMany({ user: id });
    await User.findByIdAndDelete(id);

    res.json({
      success: true,
      message: `User "${targetUser.name}" (${targetUser.role}) deleted successfully.`
    });
  } catch (err) {
    next(err);
  }
}

export async function getAdminPayments(req, res, next) {
  try {
    const payments = await Payment.find()
      .sort({ createdAt: -1 })
      .populate('user', 'name email')
      .populate('course', 'title price slug')
      .lean();

    const summary = payments.reduce(
      (acc, p) => {
        if (p.status === 'paid') {
          acc.totalRevenue += p.amount || 0;
          acc.successfulPayments += 1;
        } else if (p.status === 'failed') {
          acc.failedPayments += 1;
        } else {
          acc.pendingPayments += 1;
        }
        return acc;
      },
      { totalRevenue: 0, successfulPayments: 0, pendingPayments: 0, failedPayments: 0 }
    );

    res.json({
      success: true,
      data: {
        summary,
        payments
      }
    });
  } catch (err) {
    next(err);
  }
}
