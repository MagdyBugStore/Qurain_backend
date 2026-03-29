import express from 'express';
import { createRoom, joinRoom, leaveRoom, getRoomInfo } from '../controllers/room.controller.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// POST /api/v1/rooms/create
router.post('/create', createRoom);

// POST /api/v1/rooms/:roomId/join
router.post('/:roomId/join', joinRoom);

// POST /api/v1/rooms/:roomId/leave
router.post('/:roomId/leave', leaveRoom);

// GET /api/v1/rooms/:roomId
router.get('/:roomId', getRoomInfo);

export default router;
