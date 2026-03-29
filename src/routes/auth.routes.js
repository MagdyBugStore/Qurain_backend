import express from 'express';
import { body } from 'express-validator';
import {
  registerStudent,
  registerTeacher,
  login,
  forgotPassword,
  resetPassword,
  loginWithGoogle,
} from '../controllers/auth.controller.js';
import { validateRequest } from '../middleware/validateRequest.js';

const router = express.Router();

// POST /api/v1/auth/register/student
router.post(
  '/register/student',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 6 }),
    body('fullName').trim().notEmpty(),
  ],
  validateRequest,
  registerStudent
);

// POST /api/v1/auth/register/teacher
router.post(
  '/register/teacher',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 6 }),
    body('fullName').trim().notEmpty(),
  ],
  validateRequest,
  registerTeacher
);

// POST /api/v1/auth/login
router.post(
  '/login',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty(),
  ],
  validateRequest,
  login
);

// POST /api/v1/auth/login/google
router.post(
  '/login/google',
  [
    body('email').isEmail().normalizeEmail(),
    body('fullName').optional().trim().notEmpty(),
    body('photoURL').optional().isString(),
  ],
  validateRequest,
  loginWithGoogle
);

// POST /api/v1/auth/forgot-password
router.post(
  '/forgot-password',
  [body('email').isEmail().normalizeEmail()],
  validateRequest,
  forgotPassword
);

// POST /api/v1/auth/reset-password
router.post(
  '/reset-password',
  [
    body('token').notEmpty(),
    body('password').isLength({ min: 6 }),
  ],
  validateRequest,
  resetPassword
);

export default router;
