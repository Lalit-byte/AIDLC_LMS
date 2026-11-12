import { Router } from 'express';
import { register, login, getMe } from '../controllers/authController.js';
import { verifyToken } from '../utils/token.js';
import { ApiError } from '../utils/ApiError.js';

const router = Router();

// Middleware to extract token for /me route
function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(ApiError.unauthorized('Bearer token required.'));
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = verifyToken(token);
    req.user = decoded;
    next();
  } catch (err) {
    next(ApiError.unauthorized('Invalid or expired token.'));
  }
}

router.post('/register', register);
router.post('/login', login);
router.get('/me', requireAuth, getMe);

export default router;
