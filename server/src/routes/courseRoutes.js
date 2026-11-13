import mongoose from 'mongoose';
import { Router } from 'express';
import {
  getPublicCourses,
  getCourseDetails,
  getCategories,
  submitCourseForReview,
  createCourse,
  updateCourse,
  getInstructorCourses
} from '../controllers/courseController.js';
import { authenticate, optionalAuthenticate, authorizeRoles, checkOwnership } from '../middleware/auth.js';
import { Course } from '../models/Course.js';
import { ApiError } from '../utils/ApiError.js';

const router = Router();

// Categories catalogue endpoint
router.get('/categories', getCategories);

// Instructor courses listing (must be before :slugOrId)
router.get('/instructor/my-courses', authenticate, authorizeRoles('instructor', 'admin'), getInstructorCourses);

// Create new course in draft mode
router.post('/', authenticate, authorizeRoles('instructor', 'admin'), createCourse);

// Update existing course details with ownership enforcement
router.put(
  '/:id',
  authenticate,
  authorizeRoles('instructor', 'admin'),
  checkOwnership(async (req) => {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      throw ApiError.badRequest('Invalid course ID.');
    }
    const course = await Course.findById(req.params.id);
    if (!course) {
      throw ApiError.notFound('Course not found.');
    }
    req.course = course;
    return course.instructor;
  }),
  updateCourse
);

// Submit draft course for admin review (instructor/admin)
router.patch('/:id/submit', authenticate, authorizeRoles('instructor', 'admin'), submitCourseForReview);

// Public courses listing
router.get('/', getPublicCourses);

// Public course detail (with preview masking for guests)
router.get('/:slugOrId', optionalAuthenticate, getCourseDetails);

export default router;
