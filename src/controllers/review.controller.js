import { Review, Teacher, Session } from '../models/index.js';

/**
 * Submit review for a session
 */
export const submitReview = async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    const { stars, comment } = req.body;

    if (!stars || stars < 1 || stars > 5) {
      return res.status(400).json({
        success: false,
        data: null,
        error: { code: 'VALIDATION_ERROR', message: 'Stars must be between 1 and 5' },
        meta: {},
      });
    }

    const session = await Session.findById(sessionId)
      .populate('studentId', 'userId')
      .populate('teacherId', 'userId');

    if (!session) {
      return res.status(404).json({
        success: false,
        data: null,
        error: { code: 'SESSION_NOT_FOUND', message: 'Session not found' },
        meta: {},
      });
    }

    // Check if user is the student
    const student = await import('../models/index.js').then(m => 
      m.Student.findOne({ userId: req.user.id })
    );
    
    if (!student || session.studentId._id.toString() !== student._id.toString()) {
      return res.status(403).json({
        success: false,
        data: null,
        error: { code: 'FORBIDDEN', message: 'Only the student can review this session' },
        meta: {},
      });
    }

    // Check if review already exists
    const existingReview = await Review.findOne({ sessionId: session._id });
    if (existingReview) {
      return res.status(400).json({
        success: false,
        data: null,
        error: { code: 'REVIEW_EXISTS', message: 'Review already exists for this session' },
        meta: {},
      });
    }

    const review = new Review({
      sessionId: session._id,
      studentId: student._id,
      teacherId: session.teacherId._id,
      stars,
      comment,
    });
    await review.save();

    // Update teacher rating
    await updateTeacherRating(session.teacherId._id);

    res.status(201).json({
      success: true,
      data: { review },
      error: null,
      meta: {},
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get teacher reviews
 */
export const getTeacherReviews = async (req, res, next) => {
  try {
    const { teacherId } = req.params;
    const { limit } = req.query;

    const teacher = await Teacher.findById(teacherId);
    if (!teacher) {
      return res.status(404).json({
        success: false,
        data: null,
        error: { code: 'TEACHER_NOT_FOUND', message: 'Teacher not found' },
        meta: {},
      });
    }

    const reviews = await Review.find({ teacherId: teacher._id })
      .populate('studentId', 'userId')
      .populate({ path: 'studentId', populate: { path: 'userId' } })
      .sort({ createdAt: -1 })
      .limit(parseInt(limit) || 50)
      .lean();

    res.json({
      success: true,
      data: { reviews },
      error: null,
      meta: {},
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get teacher rating
 */
export const getTeacherRating = async (req, res, next) => {
  try {
    const { teacherId } = req.params;

    const teacher = await Teacher.findById(teacherId);
    if (!teacher) {
      return res.status(404).json({
        success: false,
        data: null,
        error: { code: 'TEACHER_NOT_FOUND', message: 'Teacher not found' },
        meta: {},
      });
    }

    const reviews = await Review.find({ teacherId: teacher._id }).lean();
    const count = reviews.length;

    if (count === 0) {
      return res.json({
        success: true,
        data: {
          rating: { rating: 0, count: 0 },
        },
        error: null,
        meta: {},
      });
    }

    const avgRating = reviews.reduce((sum, r) => sum + r.stars, 0) / count;

    res.json({
      success: true,
      data: {
        rating: {
          rating: parseFloat(avgRating.toFixed(2)),
          count,
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
 * Helper function to update teacher rating
 */
async function updateTeacherRating(teacherId) {
  const reviews = await Review.find({ teacherId }).lean();
  const count = reviews.length;

  if (count === 0) {
    await Teacher.findByIdAndUpdate(teacherId, {
      ratingAvg: 0,
      ratingCount: 0,
    });
    return;
  }

  const avgRating = reviews.reduce((sum, r) => sum + r.stars, 0) / count;

  await Teacher.findByIdAndUpdate(teacherId, {
    ratingAvg: parseFloat(avgRating.toFixed(2)),
    ratingCount: count,
  });
}
