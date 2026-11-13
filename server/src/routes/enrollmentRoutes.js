import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import {
  getMyCourses,
  enrollFreeCourse,
  updateLessonProgress,
  getCourseProgress
} from '../controllers/enrollmentController.js';

const router = Router();

// All enrollment operations require authentication
router.use(authenticate);

// Student enrolled courses list
router.get('/my-courses', getMyCourses);

// Enroll in free course directly
router.post('/:courseId/free', enrollFreeCourse);

// Get and update lesson progress
router.get('/:courseId/progress', getCourseProgress);
router.post('/:courseId/progress', updateLessonProgress);

export default router;
