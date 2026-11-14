import { Router } from 'express';
import { getPendingCourses, approveCourse, rejectCourse, getAdminOverview } from '../controllers/adminController.js';
import { authenticate, authorizeRoles } from '../middleware/auth.js';

const router = Router();

// All admin routes require authentication and admin role
router.use(authenticate, authorizeRoles('admin'));

router.get('/overview', getAdminOverview);
router.get('/courses/pending', getPendingCourses);
router.patch('/courses/:id/approve', approveCourse);
router.patch('/courses/:id/reject', rejectCourse);

export default router;
