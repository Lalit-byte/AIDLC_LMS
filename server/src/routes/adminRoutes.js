import { Router } from 'express';
import {
  getPendingCourses,
  approveCourse,
  rejectCourse,
  getAdminOverview,
  getAdminCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  getAdminUsers,
  createAdminUser,
  deleteAdminUser,
  getAdminPayments
} from '../controllers/adminController.js';
import { authenticate, authorizeRoles } from '../middleware/auth.js';

const router = Router();

// All admin routes require authentication and admin role
router.use(authenticate, authorizeRoles('admin'));

router.get('/overview', getAdminOverview);
router.get('/courses/pending', getPendingCourses);
router.patch('/courses/:id/approve', approveCourse);
router.patch('/courses/:id/reject', rejectCourse);

// Category Management
router.get('/categories', getAdminCategories);
router.post('/categories', createCategory);
router.patch('/categories/:id', updateCategory);
router.delete('/categories/:id', deleteCategory);

// User Management (Students & Instructors)
router.get('/users', getAdminUsers);
router.post('/users', createAdminUser);
router.delete('/users/:id', deleteAdminUser);

// Payment & Revenue Ledger
router.get('/payments', getAdminPayments);

export default router;
