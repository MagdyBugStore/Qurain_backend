import express from 'express';
import { 
  getPaymentOptions, 
  createPaymentIntent, 
  createSubscription,
  getTeacherBookedSlots,
  getTeacherSubscriptions,
  getMySubscriptions,
  renewSubscription,
  processWebhook,
  refundPayment
} from '../controllers/payment.controller.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// GET /api/v1/payments/options (public)
router.get('/options', getPaymentOptions);

// Webhook route (no auth - uses signature verification)
router.post('/webhook/:gateway', processWebhook);

// All other routes require authentication
router.use(authenticate);

// POST /api/v1/payments/session
router.post('/session', createPaymentIntent);

// POST /api/v1/payments/subscriptions
router.post('/subscriptions', createSubscription);

// GET /api/v1/payments/subscriptions/teacher/:teacherId/booked-slots
router.get('/subscriptions/teacher/:teacherId/booked-slots', getTeacherBookedSlots);

// GET /api/v1/payments/subscriptions/teacher/:teacherId
router.get('/subscriptions/teacher/:teacherId', getTeacherSubscriptions);

// GET /api/v1/payments/subscriptions/me
router.get('/subscriptions/me', getMySubscriptions);

// POST /api/v1/payments/subscriptions/:subscriptionId/renew
router.post('/subscriptions/:subscriptionId/renew', renewSubscription);

// POST /api/v1/payments/:paymentId/refund
router.post('/:paymentId/refund', refundPayment);

export default router;
