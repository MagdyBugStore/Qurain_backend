import express from 'express';
import { getProfile, updateProfile } from '../controllers/user.controller.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// GET /api/v1/users/me
router.get('/me', getProfile);

// PATCH /api/v1/users/me
router.patch('/me', updateProfile);

export default router;
