import express from 'express';
import { authenticate } from '../middleware/auth.js';
import {
  getStudentTasks,
  getWeeklyTasks,
  createTask,
  updateTaskStatus,
  getUpcomingSession,
  getStudentSessions,
  getMemorizationLogs,
  createMemorizationLog,
  getStudentActivities,
  createActivity,
  getStudentStats,
} from '../controllers/student.controller.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Tasks
router.get('/tasks', getStudentTasks);
router.get('/tasks/weekly', getWeeklyTasks);
router.post('/tasks', createTask);
router.patch('/tasks/:taskId/status', updateTaskStatus);

// Sessions
router.get('/sessions/upcoming', getUpcomingSession);
router.get('/sessions', getStudentSessions);

// Memorization logs
router.get('/memorization-logs', getMemorizationLogs);
router.post('/memorization-logs', createMemorizationLog);

// Activities
router.get('/activities', getStudentActivities);
router.post('/activities', createActivity);

// Stats
router.get('/stats', getStudentStats);

export default router;
