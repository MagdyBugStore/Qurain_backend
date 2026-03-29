import express from 'express';
import { 
  bookSession, 
  getSession, 
  getMySessions, 
  rescheduleSession, 
  cancelSession,
  joinSession
} from '../controllers/session.controller.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// POST /api/v1/sessions/book
router.post('/book', bookSession);

// GET /api/v1/sessions/me
router.get('/me', getMySessions);

// GET /api/v1/sessions/:sessionId
router.get('/:sessionId', getSession);

// POST /api/v1/sessions/:sessionId/reschedule
router.post('/:sessionId/reschedule', rescheduleSession);

// POST /api/v1/sessions/:sessionId/cancel
router.post('/:sessionId/cancel', cancelSession);

// POST /api/v1/sessions/:sessionId/join
router.post('/:sessionId/join', joinSession);

export default router;
