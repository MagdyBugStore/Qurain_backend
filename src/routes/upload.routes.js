import express from 'express';
import { uploadImage, uploadVideo, streamVideo } from '../controllers/upload.controller.js';
import { authenticate } from '../middleware/auth.js';
import * as uploadMiddleware from '../middleware/upload.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// POST /api/v1/uploads/image
router.post('/image', uploadMiddleware.uploadImage.single('image'), uploadMiddleware.handleUploadError, uploadImage);

// POST /api/v1/uploads/video
router.post('/video', uploadMiddleware.uploadVideo.single('video'), uploadMiddleware.handleUploadError, uploadVideo);

// GET /api/v1/uploads/stream/:videoId
router.get('/stream/:videoId', streamVideo);

export default router;
