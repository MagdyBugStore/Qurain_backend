import express from 'express';
import { authenticate } from '../middleware/auth.js';
import {
  getSupportTickets,
  getSupportTicket,
  createSupportTicket,
  addTicketReply,
  updateTicketStatus,
} from '../controllers/support.controller.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

router.get('/', getSupportTickets);
router.get('/:ticketId', getSupportTicket);
router.post('/', createSupportTicket);
router.post('/:ticketId/replies', addTicketReply);
router.patch('/:ticketId/status', updateTicketStatus);

export default router;
