import { Router } from 'express';
import { getPublicCourses, getCourseDetails, getCategories } from '../controllers/courseController.js';
import { optionalAuthenticate } from '../middleware/auth.js';

const router = Router();

// Categories catalogue endpoint
router.get('/categories', getCategories);

// Public courses listing
router.get('/', getPublicCourses);

// Public course detail (with preview masking for guests)
router.get('/:slugOrId', optionalAuthenticate, getCourseDetails);

export default router;
