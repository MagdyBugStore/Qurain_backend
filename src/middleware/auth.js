import jwt from 'jsonwebtoken';
import { User, Teacher } from '../models/index.js';

/**
 * Authentication middleware
 * Verifies JWT token from Authorization header
 */
export const authenticate = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        data: null,
        error: {
          code: 'AUTH_UNAUTHORIZED',
          message: 'No token provided',
        },
        meta: {},
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
      req.user = decoded;
      next();
    } catch (error) {
      return res.status(401).json({
        success: false,
        data: null,
        error: {
          code: 'AUTH_INVALID_TOKEN',
          message: 'Invalid or expired token',
        },
        meta: {},
      });
    }
  } catch (error) {
    next(error);
  }
};

/**
 * Role-based authorization middleware
 * Checks JWT token role first, then falls back to database if needed
 */
export const authorize = (...roles) => {
  return async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        data: null,
        error: {
          code: 'AUTH_UNAUTHORIZED',
          message: 'Authentication required',
        },
        meta: {},
      });
    }

    // First check JWT token role
    if (req.user.role && roles.includes(req.user.role)) {
      return next();
    }

    // If JWT role doesn't match, check database for updated role
    try {
      const user = await User.findById(req.user.id).lean();
      if (user && user.role && roles.includes(user.role)) {
        // Update req.user with database role for consistency
        req.user.role = user.role;
        return next();
      }
    } catch (error) {
      // If database check fails, continue to permission check
      console.error('Error checking user role from database:', error);
    }

    // If still no match, return forbidden
    return res.status(403).json({
      success: false,
      data: null,
      error: {
        code: 'AUTH_FORBIDDEN',
        message: 'Insufficient permissions',
      },
      meta: {},
    });
  };
};

/**
 * Authorization middleware for teacher application endpoints
 * Allows access if user has 'teacher' or 'admin' role, OR has a Teacher record
 * This allows users who are applying to be teachers to access these endpoints
 * even if their JWT token doesn't have the 'teacher' role yet
 */
export const authorizeTeacherApplication = async (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      data: null,
      error: {
        code: 'AUTH_UNAUTHORIZED',
        message: 'Authentication required',
      },
      meta: {},
    });
  }

  // Check JWT token role first
  if (req.user.role === 'teacher' || req.user.role === 'admin') {
    return next();
  }

  // If JWT role doesn't match, check database
  try {
    const user = await User.findById(req.user.id).lean();
    
    // Check if user has teacher or admin role in database
    if (user && (user.role === 'teacher' || user.role === 'admin')) {
      req.user.role = user.role;
      return next();
    }

    // Check if user has a Teacher record (meaning they're applying)
    const teacher = await Teacher.findOne({ userId: req.user.id }).lean();
    if (teacher) {
      // User has a Teacher record, allow access
      return next();
    }
  } catch (error) {
    console.error('Error checking teacher authorization:', error);
  }

  // No permission
  return res.status(403).json({
    success: false,
    data: null,
    error: {
      code: 'AUTH_FORBIDDEN',
      message: 'Insufficient permissions',
    },
    meta: {},
  });
};
