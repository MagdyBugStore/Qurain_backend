import { validationResult } from 'express-validator';

/**
 * Validation middleware
 * Checks for validation errors and returns formatted response
 */
export const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      data: null,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Validation failed',
        details: errors.array(),
      },
      meta: {},
    });
  }
  
  next();
};
