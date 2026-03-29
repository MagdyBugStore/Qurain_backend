import express from 'express';
import { 
  getPendingTeachers,
  getAllTeachers,
  approveTeacher, 
  rejectTeacher,
  suspendUser,
  getStudents,
  getAllUsers,
  deleteUser,
  getPayments,
  getSubscriptions,
  updateSubscriptionStatus,
  deleteSubscription,
  getSummaryReport,
  getRevenueReport,
  getSessionsReport
} from '../controllers/admin.controller.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

// All routes require admin role
router.use(authenticate);
router.use(authorize('admin'));

// Teacher management
router.get('/teachers/pending', getPendingTeachers);
router.get('/teachers/all', getAllTeachers);
router.post('/teachers/:teacherId/approve', approveTeacher);
router.post('/teachers/:teacherId/reject', rejectTeacher);

// User management
router.post('/users/:userId/suspend', suspendUser);
router.delete('/users/:userId', deleteUser);
router.get('/students', getStudents);
router.get('/users', getAllUsers);

// Payment management
router.get('/payments', getPayments);
router.get('/subscriptions', getSubscriptions);
router.patch('/subscriptions/:subscriptionId', updateSubscriptionStatus);
router.delete('/subscriptions/:subscriptionId', deleteSubscription);

// Reports
router.get('/reports/summary', getSummaryReport);
router.get('/reports/revenue', getRevenueReport);
router.get('/reports/sessions', getSessionsReport);

export default router;
