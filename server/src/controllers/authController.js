import { User } from '../models/User.js';
import { ApiError } from '../utils/ApiError.js';
import { signToken } from '../utils/token.js';

export async function register(req, res, next) {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      throw ApiError.badRequest('Name, email, and password are required.');
    }

    if (password.length < 6) {
      throw ApiError.badRequest('Password must be at least 6 characters long.');
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      throw ApiError.badRequest('An account with this email address already exists.');
    }

    const passwordHash = await User.hashPassword(password);
    
    // Default role is student; allow instructor if chosen at signup, reject admin self-assignment
    const assignedRole = role === 'instructor' ? 'instructor' : 'student';

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      passwordHash,
      role: assignedRole
    });

    const token = signToken({ id: user._id, role: user.role, email: user.email });

    res.status(201).json({
      success: true,
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role
        },
        token
      }
    });
  } catch (err) {
    next(err);
  }
}

export async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      throw ApiError.badRequest('Email and password are required.');
    }

    const user = await User.findOne({ email: email.toLowerCase() }).select('+passwordHash');
    if (!user) {
      throw ApiError.unauthorized('Invalid email or password.');
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      throw ApiError.unauthorized('Invalid email or password.');
    }

    if (!user.isActive) {
      throw ApiError.forbidden('This account has been deactivated. Please contact support.');
    }

    const token = signToken({ id: user._id, role: user.role, email: user.email });

    res.json({
      success: true,
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role
        },
        token
      }
    });
  } catch (err) {
    next(err);
  }
}

export async function getMe(req, res, next) {
  try {
    if (!req.user?.id) {
      throw ApiError.unauthorized('Authentication required.');
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      throw ApiError.notFound('User not found.');
    }

    res.json({
      success: true,
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role
        }
      }
    });
  } catch (err) {
    next(err);
  }
}
