import express from 'express';
import { authenticate } from '../middleware/auth.js';
import {
  submitReview,
  getTeacherReviews,
  getTeacherRating,
} from '../controllers/review.controller.js';

const router = express.Router();

// Submit review (requires auth)
router.post('/sessions/:sessionId/review', authenticate, submitReview);

// Public routes
router.get('/teachers/:teacherId/reviews', getTeacherReviews);
router.get('/teachers/:teacherId/rating', getTeacherRating);

export default router;
