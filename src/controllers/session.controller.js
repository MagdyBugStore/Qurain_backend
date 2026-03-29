import jwt from 'jsonwebtoken';
import { Session } from '../models/index.js';

const resolveFrontendBaseUrl = () =>
  process.env.FRONTEND_URL || process.env.CORS_ORIGIN || 'http://localhost:5173';

const buildRoomJoinUrl = (sessionId, role) => {
  const base = resolveFrontendBaseUrl().replace(/\/+$/, '');
  const query = role ? `?role=${encodeURIComponent(role)}` : '';
  return `${base}/room-call/${encodeURIComponent(sessionId)}${query}`;
};

const createJoinToken = ({ sessionId, userId, role }) => {
  const secret = process.env.JWT_SECRET || 'your-secret-key';
  return jwt.sign(
    {
      type: 'room_join',
      sessionId: sessionId.toString(),
      userId: userId.toString(),
      role,
    },
    secret,
    { expiresIn: '2h' }
  );
};

/**
 * Book a session
 */
export const bookSession = async (req, res, next) => {
  try {
    const { teacherId, slotId, sessionType } = req.body;

    // TODO: Validate slot availability
    // TODO: Create session in database
    // TODO: Process payment if needed

    res.status(201).json({
      success: true,
      data: {
        session: {
          id: 'session-id',
          teacherId,
          slotId,
          status: 'scheduled',
        },
      },
      error: null,
      meta: {},
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get session by ID
 */
export const getSession = async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    const session = await Session.findById(sessionId)
      .populate({
        path: 'teacherId',
        select: 'userId approvalStatus',
        populate: { path: 'userId', select: 'fullName avatar' },
      })
      .populate({
        path: 'studentId',
        select: 'userId',
        populate: { path: 'userId', select: 'fullName avatar' },
      })
      .lean();

    if (!session) {
      return res.status(404).json({
        success: false,
        data: null,
        error: { code: 'SESSION_NOT_FOUND', message: 'Session not found' },
        meta: {},
      });
    }

    const currentUserId = req.user.id?.toString?.() || '';
    const teacherUserId = session?.teacherId?.userId?._id?.toString?.() || '';
    const studentUserId = session?.studentId?.userId?._id?.toString?.() || '';
    const isAdmin = req.user.role === 'admin';
    const hasAccess = isAdmin || currentUserId === teacherUserId || currentUserId === studentUserId;

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        data: null,
        error: { code: 'SESSION_ACCESS_DENIED', message: 'You do not have access to this session' },
        meta: {},
      });
    }

    res.json({
      success: true,
      data: {
        session,
      },
      error: null,
      meta: {},
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get my sessions
 */
export const getMySessions = async (req, res, next) => {
  try {
    const { status, from, to } = req.query;

    // TODO: Fetch user sessions with filters

    res.json({
      success: true,
      data: {
        sessions: [],
      },
      error: null,
      meta: {},
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Reschedule session
 */
export const rescheduleSession = async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    const { newSlotId } = req.body;

    // TODO: Validate new slot availability
    // TODO: Update session slot

    res.json({
      success: true,
      data: {
        session: {
          id: sessionId,
          slotId: newSlotId,
        },
      },
      error: null,
      meta: {},
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Cancel session
 */
export const cancelSession = async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    const { adminAction } = req.body;
    const Session = (await import('../models/index.js')).Session;
    const AvailabilitySlot = (await import('../models/index.js')).AvailabilitySlot;

    // Find session
    const session = await Session.findById(sessionId);
    if (!session) {
      return res.status(404).json({
        success: false,
        data: null,
        error: { code: 'SESSION_NOT_FOUND', message: 'Session not found' },
        meta: {},
      });
    }

    // If admin action, skip permission checks
    if (!adminAction) {
      // TODO: Check if user has permission to cancel this session
      // TODO: Check cancellation policy
      // TODO: Process refund if applicable
    }

    // Update session status
    session.status = 'cancelled';
    await session.save();

    // If session has a slot, mark it as available again
    if (session.slotId) {
      await AvailabilitySlot.findByIdAndUpdate(session.slotId, {
        status: 'available',
      });
    }

    res.json({
      success: true,
      data: {
        message: 'Session cancelled successfully',
        session: {
          id: session._id.toString(),
          status: session.status,
        },
      },
      error: null,
      meta: {},
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Join session
 */
export const joinSession = async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    const session = await Session.findById(sessionId)
      .populate({ path: 'teacherId', select: 'userId' })
      .populate({ path: 'studentId', select: 'userId' });

    if (!session) {
      return res.status(404).json({
        success: false,
        data: null,
        error: { code: 'SESSION_NOT_FOUND', message: 'Session not found' },
        meta: {},
      });
    }

    const currentUserId = req.user.id?.toString?.() || '';
    const teacherUserId = session?.teacherId?.userId?.toString?.() || '';
    const studentUserId = session?.studentId?.userId?.toString?.() || '';

    let roleInSession = null;
    if (currentUserId === teacherUserId) roleInSession = 'teacher';
    if (currentUserId === studentUserId) roleInSession = 'student';

    if (!roleInSession && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        data: null,
        error: { code: 'SESSION_ACCESS_DENIED', message: 'You do not have access to this session' },
        meta: {},
      });
    }

    if (session.status !== 'started') {
      return res.status(409).json({
        success: false,
        data: null,
        error: { code: 'SESSION_NOT_STARTED', message: 'Session has not started yet' },
        meta: {},
      });
    }

    const effectiveRole = roleInSession || req.user.role || 'participant';
    const joinUrl =
      effectiveRole === 'teacher'
        ? session.videoJoinUrlTeacher || buildRoomJoinUrl(session._id, 'teacher')
        : session.videoJoinUrlStudent || buildRoomJoinUrl(session._id, 'student');
    const token = createJoinToken({
      sessionId: session._id,
      userId: req.user.id,
      role: effectiveRole,
    });

    res.json({
      success: true,
      data: {
        joinUrl,
        token,
        session: {
          id: session._id.toString(),
          status: session.status,
          role: effectiveRole,
        },
      },
      error: null,
      meta: {},
    });
  } catch (error) {
    next(error);
  }
};
