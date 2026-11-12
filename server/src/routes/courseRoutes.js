import { Router } from 'express';
import { getPublicCourses, getCourseDetails, getCategories, submitCourseForReview } from '../controllers/courseController.js';
import { authenticate, optionalAuthenticate, authorizeRoles } from '../middleware/auth.js';

const router = Router();

// Categories catalogue endpoint
router.get('/categories', getCategories);

// Submit draft course for admin review (instructor/admin)
router.patch('/:id/submit', authenticate, authorizeRoles('instructor', 'admin'), submitCourseForReview);

// Public courses listing
router.get('/', getPublicCourses);

// Public course detail (with preview masking for guests)
router.get('/:slugOrId', optionalAuthenticate, getCourseDetails);

export default router;
