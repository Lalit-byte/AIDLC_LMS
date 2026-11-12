import { Router } from 'express';
import { createPaymentOrder, verifyCheckout, getRazorpayKey } from '../controllers/paymentController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// Public test key endpoint for frontend checkout modal
router.get('/key', getRazorpayKey);

// Authenticated payment operations
router.post('/create-order', authenticate, createPaymentOrder);
router.post('/verify-checkout', authenticate, verifyCheckout);

export default router;
