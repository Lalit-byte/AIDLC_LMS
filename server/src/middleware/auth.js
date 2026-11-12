import { verifyToken } from '../utils/token.js';
import { ApiError } from '../utils/ApiError.js';

/**
 * Authenticates requests using JWT from Authorization header or cookie.
 * Populates req.user with decoded token payload ({ id, role, email }).
 */
export function authenticate(req, res, next) {
  let token = null;

  const authHeader = req.headers?.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  } else if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }

  if (!token) {
    return next(ApiError.unauthorized('Bearer token required.'));
  }

  try {
    const decoded = verifyToken(token);
    req.user = decoded;
    next();
  } catch (err) {
    next(ApiError.unauthorized('Invalid or expired token.'));
  }
}

/**
 * Optional authentication - extracts user if valid token present, but does not block guests.
 */
export function optionalAuthenticate(req, res, next) {
  let token = null;

  const authHeader = req.headers?.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  } else if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }

  if (token) {
    try {
      req.user = verifyToken(token);
    } catch {
      // Invalid/expired token ignored in optional mode; proceed as guest
    }
  }
  next();
}

/**
 * Authorizes request if req.user has one of the allowed roles.
 * Usage: authorizeRoles('admin', 'instructor')
 */
export function authorizeRoles(...roles) {
  const allowed = roles.flat();
  return (req, res, next) => {
    if (!req.user) {
      return next(ApiError.unauthorized('Authentication required.'));
    }
    if (!allowed.includes(req.user.role)) {
      return next(ApiError.forbidden('You do not have permission to access this resource.'));
    }
    next();
  };
}

/**
 * Verifies that the authenticated user owns the resource, or is an admin.
 * @param {Function|string} [getOwnerId] - Optional resolver function (req) => id, or parameter name
 */
export function checkOwnership(getOwnerId) {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return next(ApiError.unauthorized('Authentication required.'));
      }

      // Admin role bypasses ownership checks
      if (req.user.role === 'admin') {
        return next();
      }

      let ownerId = null;
      if (typeof getOwnerId === 'function') {
        ownerId = await getOwnerId(req);
      } else if (typeof getOwnerId === 'string') {
        ownerId = req.params[getOwnerId] || req.body?.[getOwnerId];
      } else {
        ownerId = req.params.userId || req.params.instructorId || req.params.id;
      }

      if (!ownerId) {
        return next(ApiError.badRequest('Unable to verify resource ownership.'));
      }

      if (ownerId.toString() !== req.user.id.toString()) {
        return next(ApiError.forbidden('Access denied: You do not have permission to modify this resource.'));
      }

      next();
    } catch (err) {
      next(err);
    }
  };
}
