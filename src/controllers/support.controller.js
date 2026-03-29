import { SupportTicket } from '../models/index.js';

/**
 * Get support tickets
 */
export const getSupportTickets = async (req, res, next) => {
  try {
    const { limit } = req.query;
    const tickets = await SupportTicket.find({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .limit(parseInt(limit) || 10)
      .lean();

    res.json({
      success: true,
      data: { tickets },
      error: null,
      meta: {},
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get single support ticket
 */
export const getSupportTicket = async (req, res, next) => {
  try {
    const { ticketId } = req.params;
    const ticket = await SupportTicket.findOne({
      _id: ticketId,
      userId: req.user.id,
    }).lean();

    if (!ticket) {
      return res.status(404).json({
        success: false,
        data: null,
        error: { code: 'TICKET_NOT_FOUND', message: 'Support ticket not found' },
        meta: {},
      });
    }

    res.json({
      success: true,
      data: { ticket },
      error: null,
      meta: {},
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create support ticket
 */
export const createSupportTicket = async (req, res, next) => {
  try {
    const { subject, message, category, priority } = req.body;

    if (!subject || !message) {
      return res.status(400).json({
        success: false,
        data: null,
        error: { code: 'VALIDATION_ERROR', message: 'Subject and message are required' },
        meta: {},
      });
    }

    // Get user info
    const user = await import('../models/index.js').then(m => m.User.findById(req.user.id));
    if (!user) {
      return res.status(404).json({
        success: false,
        data: null,
        error: { code: 'USER_NOT_FOUND', message: 'User not found' },
        meta: {},
      });
    }

    const ticket = new SupportTicket({
      userId: req.user.id,
      userName: user.fullName,
      subject,
      message,
      category: category || 'other',
      priority: priority || 'medium',
      status: 'open',
      replies: [],
    });
    await ticket.save();

    res.status(201).json({
      success: true,
      data: { ticket },
      error: null,
      meta: {},
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Add reply to ticket
 */
export const addTicketReply = async (req, res, next) => {
  try {
    const { ticketId } = req.params;
    const { message, sender, senderName } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({
        success: false,
        data: null,
        error: { code: 'VALIDATION_ERROR', message: 'Message cannot be empty' },
        meta: {},
      });
    }

    const ticket = await SupportTicket.findById(ticketId);
    if (!ticket) {
      return res.status(404).json({
        success: false,
        data: null,
        error: { code: 'TICKET_NOT_FOUND', message: 'Support ticket not found' },
        meta: {},
      });
    }

    // Check if user owns the ticket or is admin
    if (ticket.userId.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        data: null,
        error: { code: 'FORBIDDEN', message: 'Access denied' },
        meta: {},
      });
    }

    ticket.replies.push({
      message,
      sender: sender || (req.user.role === 'admin' ? 'admin' : 'user'),
      senderName: senderName || req.user.fullName,
    });

    if (ticket.status === 'open') {
      ticket.status = 'in_progress';
    }

    await ticket.save();

    res.json({
      success: true,
      data: { ticket },
      error: null,
      meta: {},
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update ticket status
 */
export const updateTicketStatus = async (req, res, next) => {
  try {
    const { ticketId } = req.params;
    const { status } = req.body;

    const ticket = await SupportTicket.findById(ticketId);
    if (!ticket) {
      return res.status(404).json({
        success: false,
        data: null,
        error: { code: 'TICKET_NOT_FOUND', message: 'Support ticket not found' },
        meta: {},
      });
    }

    // Check permissions
    if (ticket.userId.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        data: null,
        error: { code: 'FORBIDDEN', message: 'Access denied' },
        meta: {},
      });
    }

    ticket.status = status;
    await ticket.save();

    res.json({
      success: true,
      data: { ticket },
      error: null,
      meta: {},
    });
  } catch (error) {
    next(error);
  }
};
