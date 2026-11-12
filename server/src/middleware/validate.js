import { ApiError } from '../utils/ApiError.js';

export function validate(validatorFn) {
  return (req, res, next) => {
    try {
      const errors = validatorFn(req);
      if (errors && Object.keys(errors).length > 0) {
        return next(ApiError.badRequest('Validation failed', errors));
      }
      next();
    } catch (err) {
      next(err);
    }
  };
}
