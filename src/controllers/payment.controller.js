import mongoose from 'mongoose';
import { Student, Teacher, SubscriptionPlan, Subscription, Session } from '../models/index.js';

const PLAN_DEFAULTS = {
  starter: { name: 'الباقة الأساسية', sessionsPerPeriod: 8, durationMinutes: 60 },
  premium: { name: 'الباقة المميزة', sessionsPerPeriod: 12, durationMinutes: 60 },
  elite: { name: 'باقة النخبة', sessionsPerPeriod: 16, durationMinutes: 60 },
};

const toPositiveNumberOrNull = (value) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return null;
  return parsed;
};

const normalizeCurrency = (value) => {
  if (!value || typeof value !== 'string') return 'SAR';
  return value.trim().toUpperCase().slice(0, 3) || 'SAR';
};

const resolveTeacherByIdOrUserId = async (teacherId) => {
  if (!teacherId || typeof teacherId !== 'string') return null;

  if (mongoose.isValidObjectId(teacherId)) {
    const byTeacherId = await Teacher.findById(teacherId);
    if (byTeacherId) return byTeacherId;

    const byUserId = await Teacher.findOne({ userId: teacherId });
    if (byUserId) return byUserId;
    return null;
  }

  return null;
};

/**
 * Get payment options
 */
export const getPaymentOptions = async (req, res, next) => {
  try {
    // TODO: Fetch enabled payment models from configuration

    res.json({
      success: true,
      data: {
        paymentModels: ['pay_per_session', 'monthly_subscription'],
      },
      error: null,
      meta: {},
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create payment intent for session
 */
export const createPaymentIntent = async (req, res, next) => {
  try {
    const { sessionId, amount, currency } = req.body;

    // TODO: Create payment intent with payment gateway
    // TODO: Store payment record in database

    res.status(201).json({
      success: true,
      data: {
        payment: {
          id: 'payment-id',
          sessionId,
          amount,
          currency,
          status: 'pending',
          clientSecret: 'payment-client-secret',
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
 * Create subscription
 */
export const createSubscription = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        data: null,
        error: {
          code: 'AUTH_UNAUTHORIZED',
          message: 'Authentication required',
        },
        meta: {},
      });
    }

    const {
      planId,
      teacherId,
      weeklySlots = [],
      monthlyPrice,
      currency,
      startDate,
      nextRenewalDate,
      autoRenew,
    } = req.body;

    if (!planId || !['starter', 'premium', 'elite'].includes(planId)) {
      return res.status(400).json({
        success: false,
        data: null,
        error: {
          code: 'INVALID_PLAN_ID',
          message: 'planId is required and must be one of: starter, premium, elite',
        },
        meta: {},
      });
    }

    if (!teacherId || typeof teacherId !== 'string') {
      return res.status(400).json({
        success: false,
        data: null,
        error: {
          code: 'INVALID_TEACHER_ID',
          message: 'teacherId is required',
        },
        meta: {},
      });
    }

    const student = await Student.findOne({ userId });
    if (!student) {
      return res.status(404).json({
        success: false,
        data: null,
        error: {
          code: 'STUDENT_NOT_FOUND',
          message: 'Student profile not found',
        },
        meta: {},
      });
    }

    const teacher = await resolveTeacherByIdOrUserId(teacherId);
    if (!teacher) {
      return res.status(404).json({
        success: false,
        data: null,
        error: {
          code: 'TEACHER_NOT_FOUND',
          message: 'Teacher not found',
        },
        meta: {},
      });
    }

    if (teacher.userId?.toString() === userId) {
      return res.status(400).json({
        success: false,
        data: null,
        error: {
          code: 'BOOKING_NOT_ALLOWED',
          message: 'Teachers cannot subscribe to themselves',
        },
        meta: {},
      });
    }

    const existingActive = await Subscription.findOne({
      studentId: student._id,
      teacherId: teacher._id,
      status: 'active',
      expiresAt: { $gt: new Date() },
    }).lean();

    if (existingActive) {
      return res.json({
        success: true,
        data: {
          subscription: {
            id: existingActive._id.toString(),
            planId,
            teacherId: teacher._id.toString(),
            status: existingActive.status,
          },
          alreadyExists: true,
        },
        error: null,
        meta: {},
      });
    }

    const parsedPrice = toPositiveNumberOrNull(monthlyPrice);
    if (!parsedPrice) {
      return res.status(400).json({
        success: false,
        data: null,
        error: {
          code: 'INVALID_MONTHLY_PRICE',
          message: 'monthlyPrice must be a positive number',
        },
        meta: {},
      });
    }

    const parsedStartDate = startDate ? new Date(startDate) : new Date();
    const fallbackExpiry = new Date(parsedStartDate);
    fallbackExpiry.setDate(fallbackExpiry.getDate() + 30);
    const parsedExpiryDate = nextRenewalDate ? new Date(nextRenewalDate) : fallbackExpiry;

    if (Number.isNaN(parsedStartDate.getTime()) || Number.isNaN(parsedExpiryDate.getTime())) {
      return res.status(400).json({
        success: false,
        data: null,
        error: {
          code: 'INVALID_SUBSCRIPTION_DATES',
          message: 'startDate/nextRenewalDate are invalid',
        },
        meta: {},
      });
    }

    if (parsedExpiryDate <= parsedStartDate) {
      return res.status(400).json({
        success: false,
        data: null,
        error: {
          code: 'INVALID_SUBSCRIPTION_RANGE',
          message: 'nextRenewalDate must be after startDate',
        },
        meta: {},
      });
    }

    let plan = await SubscriptionPlan.findOne({ planId, isActive: true });
    if (!plan) {
      const defaults = PLAN_DEFAULTS[planId];
      plan = await SubscriptionPlan.create({
        name: defaults.name,
        planId,
        sessionsPerPeriod: defaults.sessionsPerPeriod,
        periodType: 'monthly',
        price: parsedPrice,
        isActive: true,
        durationMinutes: defaults.durationMinutes,
      });
    }

    const normalizedSlots = Array.isArray(weeklySlots)
      ? weeklySlots
          .map((slot) => ({
            dayIndex: Number(slot?.dayIndex),
            time: typeof slot?.time === 'string' ? slot.time : '',
          }))
          .filter(
            (slot) =>
              Number.isInteger(slot.dayIndex) &&
              slot.dayIndex >= 0 &&
              slot.dayIndex <= 6 &&
              Boolean(slot.time)
          )
      : [];

    const subscription = await Subscription.create({
      studentId: student._id,
      teacherId: teacher._id,
      planId: plan._id,
      status: 'active',
      startedAt: parsedStartDate,
      expiresAt: parsedExpiryDate,
      sessionsTotal: plan.sessionsPerPeriod,
      sessionsUsed: 0,
      autoRenew: typeof autoRenew === 'boolean' ? autoRenew : true,
      weeklySlots: normalizedSlots,
      monthlyPrice: parsedPrice,
      currency: normalizeCurrency(currency),
    });

    // Generate sessions for the subscription period based on weekly slots
    const availabilityIndexToJsDay = (availabilityIndex) => {
      const map = { 0: 6, 1: 0, 2: 1, 3: 2, 4: 3, 5: 4, 6: 5 };
      return map[availabilityIndex] ?? 0;
    };

    const parseTimeLabelToHHMM = (label) => {
      // Expected Arabic labels like '٠٨:٠٠ ص' or '٠٤:٠٠ م'
      // Fallback: try to extract digits in any form
      try {
        const easternToWestern = (s) =>
          s
            .replace(/٠/g, '0')
            .replace(/١/g, '1')
            .replace(/٢/g, '2')
            .replace(/٣/g, '3')
            .replace(/٤/g, '4')
            .replace(/٥/g, '5')
            .replace(/٦/g, '6')
            .replace(/٧/g, '7')
            .replace(/٨/g, '8')
            .replace(/٩/g, '9');
        const plain = easternToWestern(String(label || '')).trim();
        const isPM = /م\b|PM\b|pm\b/.test(plain);
        const isAM = /ص\b|AM\b|am\b/.test(plain);
        const m = plain.match(/(\d{1,2})\s*[:٫.]\s*(\d{2})/); // handles ':' or Arabic decimal '٫'
        if (!m) return { h: 8, min: 0 }; // default 08:00
        let h = parseInt(m[1], 10);
        const min = parseInt(m[2], 10);
        if (isPM && h < 12) h += 12;
        if (isAM && h === 12) h = 0;
        return { h, min };
      } catch {
        return { h: 8, min: 0 };
      }
    };

    const computeFirstOccurrence = (start, targetJsDay, h, min) => {
      const first = new Date(start);
      // Set time first to avoid DST edge issues
      first.setHours(h, min, 0, 0);
      const delta =
        (targetJsDay - first.getDay() + 7) % 7;
      if (delta === 0 && first < start) {
        // today but earlier than start time -> move a week
        first.setDate(first.getDate() + 7);
      } else if (delta > 0) {
        first.setDate(first.getDate() + delta);
      }
      return first;
    };

    const sessionsToCreate = [];
    const durationMinutes = plan.durationMinutes || 60;
    for (const slot of normalizedSlots) {
      const jsDay = availabilityIndexToJsDay(slot.dayIndex);
      const { h, min } = parseTimeLabelToHHMM(slot.time);
      let current = computeFirstOccurrence(parsedStartDate, jsDay, h, min);
      while (current <= parsedExpiryDate && sessionsToCreate.length < plan.sessionsPerPeriod) {
        const startAt = new Date(current);
        const endAt = new Date(current);
        endAt.setMinutes(endAt.getMinutes() + durationMinutes);
        sessionsToCreate.push({
          studentId: student._id,
          teacherId: teacher._id,
          status: 'scheduled',
          scheduledStart: startAt,
          scheduledEnd: endAt,
          sessionType: 'memorization',
          title: `${plan.name}`,
          subscriptionId: subscription._id,
        });
        // Next week
        current = new Date(current);
        current.setDate(current.getDate() + 7);
      }
    }

    if (sessionsToCreate.length > 0) {
      // Cap to sessionsTotal to match plan
      const capped = sessionsToCreate.slice(0, plan.sessionsPerPeriod);
      await Session.insertMany(capped);
    }

    res.status(201).json({
      success: true,
      data: {
        subscription: {
          id: subscription._id.toString(),
          planId,
          teacherId: teacher._id.toString(),
          status: subscription.status,
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
 * Get booked weekly slots for a teacher from active subscriptions
 */
export const getTeacherBookedSlots = async (req, res, next) => {
  try {
    const { teacherId } = req.params;
    const { month } = req.query; // optional YYYY-MM

    if (!teacherId || typeof teacherId !== 'string') {
      return res.status(400).json({
        success: false,
        data: null,
        error: {
          code: 'INVALID_TEACHER_ID',
          message: 'teacherId is required',
        },
        meta: {},
      });
    }

    const teacher = await resolveTeacherByIdOrUserId(teacherId);
    if (!teacher) {
      return res.status(404).json({
        success: false,
        data: null,
        error: {
          code: 'TEACHER_NOT_FOUND',
          message: 'Teacher not found',
        },
        meta: {},
      });
    }

    // If month filter provided: include subs overlapping that month range
    let dateFilter = { expiresAt: { $gt: new Date() } };
    if (typeof month === 'string' && /^\d{4}-\d{2}$/.test(month)) {
      const [y, m] = month.split('-').map((v) => parseInt(v, 10));
      const start = new Date(y, m - 1, 1, 0, 0, 0, 0);
      const end = new Date(y, m, 0, 23, 59, 59, 999); // last day of month
      dateFilter = {
        // overlaps month window
        $and: [{ startedAt: { $lte: end } }, { expiresAt: { $gte: start } }],
      };
    }

    const activeSubscriptions = await Subscription.find({
      teacherId: teacher._id,
      status: 'active',
      ...dateFilter,
    })
      .select('weeklySlots')
      .lean();

    const bookedSlotKeys = new Set();
    for (const subscription of activeSubscriptions) {
      const slots = Array.isArray(subscription.weeklySlots) ? subscription.weeklySlots : [];
      for (const slot of slots) {
        if (
          Number.isInteger(slot?.dayIndex) &&
          slot.dayIndex >= 0 &&
          slot.dayIndex <= 6 &&
          typeof slot?.time === 'string' &&
          slot.time
        ) {
          bookedSlotKeys.add(`${slot.dayIndex}_${slot.time}`);
        }
      }
    }

    res.json({
      success: true,
      data: {
        teacherId: teacher._id.toString(),
        bookedSlots: Array.from(bookedSlotKeys),
      },
      error: null,
      meta: {},
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all (active) subscriptions for a specific teacher
 * Optional query param: month=YYYY-MM to return only subs overlapping that month.
 */
export const getTeacherSubscriptions = async (req, res, next) => {
  try {
    const { teacherId } = req.params;
    const { month } = req.query; // optional YYYY-MM

    if (!teacherId || typeof teacherId !== 'string') {
      return res.status(400).json({
        success: false,
        data: null,
        error: {
          code: 'INVALID_TEACHER_ID',
          message: 'teacherId is required',
        },
        meta: {},
      });
    }

    const teacher = await resolveTeacherByIdOrUserId(teacherId);
    if (!teacher) {
      return res.status(404).json({
        success: false,
        data: null,
        error: {
          code: 'TEACHER_NOT_FOUND',
          message: 'Teacher not found',
        },
        meta: {},
      });
    }

    let dateFilter = { expiresAt: { $gt: new Date() } };
    if (typeof month === 'string' && /^\d{4}-\d{2}$/.test(month)) {
      const [y, m] = month.split('-').map((v) => parseInt(v, 10));
      const start = new Date(y, m - 1, 1, 0, 0, 0, 0);
      const end = new Date(y, m, 0, 23, 59, 59, 999);
      dateFilter = {
        $and: [{ startedAt: { $lte: end } }, { expiresAt: { $gte: start } }],
      };
    }

    const subs = await Subscription.find({
      teacherId: teacher._id,
      status: 'active',
      ...dateFilter,
    })
      .populate({
        path: 'studentId',
        populate: { path: 'userId', select: 'fullName email photoUrl profileImage avatar' },
      })
      .populate('planId')
      .lean();

    const transformed = subs.map((s) => ({
      id: s._id.toString(),
      studentId: s.studentId?._id?.toString() || '',
      studentName: s.studentId?.userId?.fullName || 'طالب',
      studentEmail: s.studentId?.userId?.email || '',
      studentAvatar:
        s.studentId?.userId?.photoUrl ||
        s.studentId?.userId?.profileImage ||
        s.studentId?.userId?.avatar ||
        '',
      teacherId: teacher._id.toString(),
      teacherName: '',
      planId: s.planId?.planId || 'starter',
      planLabel: s.planId?.name || 'الباقة',
      sessionsPerMonth: s.sessionsTotal || s.planId?.sessionsPerPeriod || 0,
      weeklyFrequency: Array.isArray(s.weeklySlots) ? `${s.weeklySlots.length} times/week` : 'N/A',
      durationMinutes: s.planId?.durationMinutes || 60,
      weeklySlots: s.weeklySlots || [],
      monthlyPrice: s.monthlyPrice ? Number(s.monthlyPrice) : 0,
      currency: s.currency || 'SAR',
      status: s.status,
      startDate: s.startedAt,
      nextRenewalDate: s.expiresAt,
      createdAt: s.createdAt,
      updatedAt: s.updatedAt,
    }));

    res.json({
      success: true,
      data: { subscriptions: transformed },
      error: null,
      meta: {},
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get my subscriptions
 */
export const getMySubscriptions = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        data: null,
        error: {
          code: 'AUTH_UNAUTHORIZED',
          message: 'Authentication required',
        },
        meta: {},
      });
    }

    const student = await Student.findOne({ userId });
    if (!student) {
      return res.json({
        success: true,
        data: {
          subscriptions: [],
        },
        error: null,
        meta: {},
      });
    }

    const subscriptions = await Subscription.find({ studentId: student._id })
      .populate('planId')
      .populate({
        path: 'teacherId',
        populate: {
          path: 'userId',
          select: 'fullName email phone',
        },
      })
      .sort({ createdAt: -1 })
      .lean();

    const transformedSubscriptions = subscriptions.map((subscription) => {
      const teacherUser = subscription.teacherId?.userId || {};
      const plan = subscription.planId || {};
      const monthlyPriceNumber = subscription.monthlyPrice
        ? parseFloat(subscription.monthlyPrice.toString())
        : 0;

      return {
        id: subscription._id.toString(),
        studentId: student._id.toString(),
        teacherId: subscription.teacherId?._id?.toString() || '',
        teacherName: teacherUser.fullName || 'Unknown Teacher',
        studentName: '',
        studentEmail: '',
        planId: plan.planId || 'starter',
        planLabel: plan.name || 'الباقة الأساسية',
        sessionsPerMonth: subscription.sessionsTotal || plan.sessionsPerPeriod || 0,
        weeklyFrequency: subscription.weeklySlots?.length
          ? `${subscription.weeklySlots.length} times/week`
          : 'N/A',
        durationMinutes: plan.durationMinutes || 60,
        weeklySlots: subscription.weeklySlots || [],
        monthlyPrice: monthlyPriceNumber,
        currency: subscription.currency || 'SAR',
        status: subscription.status,
        startDate: subscription.startedAt,
        nextRenewalDate: subscription.expiresAt,
        createdAt: subscription.createdAt,
        updatedAt: subscription.updatedAt,
      };
    });

    res.json({
      success: true,
      data: {
        subscriptions: transformedSubscriptions,
      },
      error: null,
      meta: {},
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Renew subscription
 */
export const renewSubscription = async (req, res, next) => {
  try {
    const { subscriptionId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        data: null,
        error: {
          code: 'AUTH_UNAUTHORIZED',
          message: 'Authentication required',
        },
        meta: {},
      });
    }

    if (!mongoose.isValidObjectId(subscriptionId)) {
      return res.status(400).json({
        success: false,
        data: null,
        error: {
          code: 'INVALID_SUBSCRIPTION_ID',
          message: 'Invalid subscriptionId',
        },
        meta: {},
      });
    }

    const student = await Student.findOne({ userId });
    if (!student) {
      return res.status(404).json({
        success: false,
        data: null,
        error: {
          code: 'STUDENT_NOT_FOUND',
          message: 'Student profile not found',
        },
        meta: {},
      });
    }

    const subscription = await Subscription.findOne({
      _id: subscriptionId,
      studentId: student._id,
    });
    if (!subscription) {
      return res.status(404).json({
        success: false,
        data: null,
        error: {
          code: 'SUBSCRIPTION_NOT_FOUND',
          message: 'Subscription not found',
        },
        meta: {},
      });
    }

    const now = new Date();
    const renewalBase =
      subscription.expiresAt && subscription.expiresAt > now ? new Date(subscription.expiresAt) : now;
    renewalBase.setDate(renewalBase.getDate() + 30);

    subscription.status = 'active';
    subscription.expiresAt = renewalBase;
    subscription.sessionsUsed = 0;
    await subscription.save();

    res.json({
      success: true,
      data: {
        subscription: {
          id: subscriptionId,
          status: subscription.status,
          nextRenewalDate: subscription.expiresAt,
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
 * Process payment webhook
 */
export const processWebhook = async (req, res, next) => {
  try {
    const { gateway } = req.params;

    // TODO: Verify webhook signature
    // TODO: Update payment/subscription status in database

    res.json({
      success: true,
      data: {
        message: 'Webhook processed',
      },
      error: null,
      meta: {},
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Refund payment
 */
export const refundPayment = async (req, res, next) => {
  try {
    const { paymentId } = req.params;

    // TODO: Check refund policy
    // TODO: Process refund with payment gateway
    // TODO: Update payment status

    res.json({
      success: true,
      data: {
        refund: {
          id: 'refund-id',
          paymentId,
          status: 'processed',
        },
      },
      error: null,
      meta: {},
    });
  } catch (error) {
    next(error);
  }
};
