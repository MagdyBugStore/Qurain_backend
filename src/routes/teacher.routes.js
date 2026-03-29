import express from 'express';
import { 
  getTeachers, 
  getTeacherById, 
  getTeacherSlots,
  getTeacherAvailability,
  getMyProfile,
  submitApplication,
  getMyApplication,
  saveMyApplicationStep1,
  saveMyApplicationStep2,
  submitMyApplication,
  updateMyProfile,
  updatePricing,
  getQualifications,
  saveQualifications,
  getIjazahs,
  saveIjazah,
  updateIjazah,
  deleteIjazah,
  getMyCertificates,
  uploadMyCertificates,
  deleteMyCertificate,
  getAvailability,
  saveAvailability,
  createSlot,
  updateSlot,
  deleteSlot,
  getMySessions,
  getCompletedSessionsCount,
  startSession,
  markAttendance
} from '../controllers/teacher.controller.js';
import { authenticate, authorize, authorizeTeacherApplication } from '../middleware/auth.js';
import { uploadCertificate, handleUploadError } from '../middleware/upload.js';

const router = express.Router();

// Public routes
router.get('/', getTeachers);
router.get('/:teacherId([0-9a-fA-F]{24})', getTeacherById);
router.get('/:teacherId([0-9a-fA-F]{24})/availability', getTeacherAvailability);
router.get('/:teacherId([0-9a-fA-F]{24})/slots', getTeacherSlots);

// Protected routes - require authentication
router.use(authenticate);

// Teacher-specific routes - require teacher role
router.get('/me/profile', authorize('teacher', 'admin'), getMyProfile);
// Teacher application endpoints - allow users with Teacher record even if role not set in JWT
router.get('/me/application', authorizeTeacherApplication, getMyApplication);
router.patch('/me/application/step1', authorizeTeacherApplication, saveMyApplicationStep1);
router.patch('/me/application/step2', authorizeTeacherApplication, saveMyApplicationStep2);
router.post('/me/application/submit', authorizeTeacherApplication, submitMyApplication);
router.post('/me/submit-application', authorize('teacher', 'admin'), submitApplication);
router.patch('/me/profile', authorize('teacher', 'admin'), updateMyProfile);
router.patch('/me/pricing', authorize('teacher', 'admin'), updatePricing);
router.get('/me/qualifications', authorize('teacher', 'admin'), getQualifications);
router.post('/me/qualifications', authorize('teacher', 'admin'), saveQualifications);
router.get('/me/certificates', authorize('teacher', 'admin'), getMyCertificates);
router.post(
  '/me/certificates',
  authorize('teacher', 'admin'),
  uploadCertificate.array('certificates', parseInt(process.env.MAX_CERTIFICATE_FILES) || 10),
  handleUploadError,
  uploadMyCertificates
);
router.delete('/me/certificates/:certificateId', authorize('teacher', 'admin'), deleteMyCertificate);
router.get('/me/ijazahs', authorize('teacher', 'admin'), getIjazahs);
router.post('/me/ijazahs', authorize('teacher', 'admin'), saveIjazah);
router.patch('/me/ijazahs/:ijazahId', authorize('teacher', 'admin'), updateIjazah);
router.delete('/me/ijazahs/:ijazahId', authorize('teacher', 'admin'), deleteIjazah);
router.get('/me/availability', authorize('teacher', 'admin'), getAvailability);
router.post('/me/availability', authorize('teacher', 'admin'), saveAvailability);
router.post('/me/slots', authorize('teacher', 'admin'), createSlot);
router.patch('/me/slots/:slotId', authorize('teacher', 'admin'), updateSlot);
router.delete('/me/slots/:slotId', authorize('teacher', 'admin'), deleteSlot);
router.get('/me/sessions', authorize('teacher', 'admin'), getMySessions);
router.get('/me/sessions/completed-count', authorize('teacher', 'admin'), getCompletedSessionsCount);
router.post('/me/sessions/:sessionId/start', authorize('teacher', 'admin'), startSession);
router.post('/me/sessions/:sessionId/attendance', authorize('teacher', 'admin'), markAttendance);

export default router;
