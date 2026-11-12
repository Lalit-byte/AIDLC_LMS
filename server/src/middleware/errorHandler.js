import { ApiError } from '../utils/ApiError.js';

export function notFoundHandler(req, res, next) {
  next(ApiError.notFound(`Cannot ${req.method} ${req.originalUrl}`));
}

export function errorHandler(err, req, res, next) {
  let statusCode = err.statusCode || 500;
  let code = err.code || 'INTERNAL_SERVER_ERROR';
  let message = err.message || 'An unexpected error occurred';
  let details = err.details || null;

  // Handle Mongoose / Mongo specific errors
  if (err.name === 'ValidationError') {
    statusCode = 400;
    code = 'VALIDATION_ERROR';
    details = Object.values(err.errors || {}).map((e) => e.message);
  } else if (err.code === 11000) {
    statusCode = 409;
    code = 'DUPLICATE_KEY';
    message = 'A resource with this key already exists.';
    details = err.keyValue;
  } else if (err.name === 'CastError') {
    statusCode = 400;
    code = 'INVALID_ID';
    message = `Invalid format for field ${err.path}`;
  }

  const isDev = (process.env.NODE_ENV || 'development') === 'development';

  const response = {
    success: false,
    error: {
      message,
      code,
      details,
      ...(isDev && err.stack ? { stack: err.stack } : {})
    }
  };

  res.status(statusCode).json(response);
}
