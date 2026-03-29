/**
 * Get pending teachers
 */
export const getPendingTeachers = async (req, res, next) => {
  try {
    const Teacher = (await import('../models/index.js')).Teacher;
    const User = (await import('../models/index.js')).User;

    // Fetch pending teachers
    const teachers = await Teacher.find({ approvalStatus: 'pending' })
      .populate({
        path: 'userId',
        select: 'fullName email phone avatar createdAt',
      })
      .sort({ createdAt: -1 })
      .lean();
    // Transform to match frontend format
    const transformedTeachers = teachers.map(teacher => {
      const user = teacher.userId || {};
      return {
        id: teacher._id.toString(),
        userId: user._id?.toString() || '',
        fullName: user.fullName || 'Unknown',
        email: user.email || '',
        phone: user.phone || '',
        avatar: user.avatar || '',
        subjects: [], // Subjects come from embedded languages array
        status: teacher.approvalStatus,
        createdAt: teacher.createdAt || user.createdAt || new Date(),
        isIncomplete: false,
      };
    });

    res.json({
      success: true,
      data: {
        teachers: transformedTeachers,
      },
      error: null,
      meta: {},
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all teachers (for admin)
 */
export const getAllTeachers = async (req, res, next) => {
  try {
    const Teacher = (await import('../models/index.js')).Teacher;
    const User = (await import('../models/index.js')).User;

    // Fetch all teachers
    const teachers = await Teacher.find({})
      .populate({
        path: 'userId',
        select: 'fullName email phone avatar createdAt',
      })
      .sort({ createdAt: -1 })
      .lean();

    // Transform to match frontend format
    const transformedTeachers = teachers.map(teacher => {
      const user = teacher.userId || {};
      const teacherId = teacher._id.toString();
      // Map language codes to readable names from embedded languages array
      const subjects = (teacher.languages || []).map(lang => 
        lang === 'ar' ? 'Arabic' : lang === 'en' ? 'English' : lang
      );

      return {
        id: teacherId,
        userId: user._id?.toString() || '',
        fullName: user.fullName || 'Unknown',
        email: user.email || '',
        phone: user.phone || '',
        avatar: user.avatar || '',
        subjects: subjects,
        status: teacher.approvalStatus,
        createdAt: teacher.createdAt || user.createdAt || new Date(),
        isIncomplete: false,
      };
    });

    res.json({
      success: true,
      data: {
        teachers: transformedTeachers,
      },
      error: null,
      meta: {},
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Approve teacher
 */
export const approveTeacher = async (req, res, next) => {
  try {
    const { teacherId } = req.params;

    const Teacher = (await import('../models/index.js')).Teacher;
    const User = (await import('../models/index.js')).User;

    // Try to find teacher by Teacher ID first, then by userId (frontend may send userId)
    let teacher = await Teacher.findById(teacherId).populate({
      path: 'userId',
      select: 'fullName email phone avatar createdAt',
    });

    // If not found by Teacher ID, try finding by userId
    if (!teacher) {
      teacher = await Teacher.findOne({ userId: teacherId }).populate({
        path: 'userId',
        select: 'fullName email phone avatar createdAt',
      });
    }

    if (!teacher) {
      return res.status(404).json({
        success: false,
        data: null,
        error: { code: 'TEACHER_NOT_FOUND', message: 'Teacher not found' },
        meta: {},
      });
    }

    // Update teacher status to approved
    teacher.approvalStatus = 'approved';
    teacher.approvedBy = req.user?.id || null;
    teacher.approvedAt = new Date();
    await teacher.save();

    const user = teacher.userId || {};

    // TODO: Send notification (email / in-app) if needed

    res.json({
      success: true,
      data: {
        teacher: {
          id: teacher._id.toString(),
          userId: user._id?.toString() || '',
          fullName: user.fullName || 'Unknown',
          email: user.email || '',
          phone: user.phone || '',
          avatar: user.avatar || '',
          subjects: (teacher.languages || []).map(lang =>
            lang === 'ar' ? 'Arabic' : lang === 'en' ? 'English' : lang
          ),
          status: teacher.approvalStatus,
          createdAt: teacher.createdAt || user.createdAt || new Date(),
          isIncomplete: false,
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
 * Reject teacher
 */
export const rejectTeacher = async (req, res, next) => {
  try {
    const { teacherId } = req.params;
    const { reason } = req.body;

    const Teacher = (await import('../models/index.js')).Teacher;
    const User = (await import('../models/index.js')).User;

    // Try to find teacher by Teacher ID first, then by userId (frontend may send userId)
    let teacher = await Teacher.findById(teacherId).populate({
      path: 'userId',
      select: 'fullName email phone avatar createdAt',
    });

    // If not found by Teacher ID, try finding by userId
    if (!teacher) {
      teacher = await Teacher.findOne({ userId: teacherId }).populate({
        path: 'userId',
        select: 'fullName email phone avatar createdAt',
      });
    }

    if (!teacher) {
      return res.status(404).json({
        success: false,
        data: null,
        error: { code: 'TEACHER_NOT_FOUND', message: 'Teacher not found' },
        meta: {},
      });
    }

    // Update teacher status to rejected
    teacher.approvalStatus = 'rejected';
    await teacher.save();

    const user = teacher.userId || {};

    // TODO: Send notification with reason (email / in-app) if needed

    res.json({
      success: true,
      data: {
        teacher: {
          id: teacher._id.toString(),
          userId: user._id?.toString() || '',
          fullName: user.fullName || 'Unknown',
          email: user.email || '',
          phone: user.phone || '',
          avatar: user.avatar || '',
          subjects: (teacher.languages || []).map(lang =>
            lang === 'ar' ? 'Arabic' : lang === 'en' ? 'English' : lang
          ),
          status: teacher.approvalStatus,
          createdAt: teacher.createdAt || user.createdAt || new Date(),
          isIncomplete: false,
          reason,
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
 * Suspend user
 */
export const suspendUser = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { reason } = req.body;

    // TODO: Update user status to suspended
    // TODO: Send notification

    res.json({
      success: true,
      data: {
        user: {
          id: userId,
          status: 'suspended',
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
 * Get students
 */
export const getStudents = async (req, res, next) => {
  try {
    const Student = (await import('../models/index.js')).Student;
    const User = (await import('../models/index.js')).User;

    // Fetch all students with populated user data
    const students = await Student.find({})
      .populate({
        path: 'userId',
        select: 'fullName email phone role avatar preferredLanguage createdAt updatedAt',
      })
      .sort({ createdAt: -1 })
      .lean();

    // Transform to match frontend format
    const transformedStudents = students.map(student => {
      const user = student.userId || {};
      return {
        uid: user._id?.toString() || '',
        displayName: user.fullName || 'Unknown',
        firstName: user.fullName?.split(' ')[0] || '',
        lastName: user.fullName?.split(' ').slice(1).join(' ') || '',
        email: user.email || '',
        phone: user.phone || '',
        accountType: 'student',
        role: user.role || 'student',
        avatar: user.avatar || null,
        photoURL: user.avatar || null,
        preferredLanguage: user.preferredLanguage || 'ar',
        createdAt: user.createdAt || student.createdAt || new Date(),
        updatedAt: user.updatedAt || student.updatedAt || new Date(),
        // Student-specific fields
        timezone: student.timezone || null,
        notes: student.notes || null,
        tasks: student.tasks || [],
        activities: student.activities || [],
        memorizationLogs: student.memorizationLogs || [],
      };
    });

    res.json({
      success: true,
      data: {
        students: transformedStudents,
      },
      error: null,
      meta: {},
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all users with related data (students, teachers, admins)
 */
export const getAllUsers = async (req, res, next) => {
  try {
    const User = (await import('../models/index.js')).User;
    const Student = (await import('../models/index.js')).Student;
    const Teacher = (await import('../models/index.js')).Teacher;

    // Fetch all users
    const users = await User.find({})
      .select('-passwordHash') // Exclude password hash
      .sort({ createdAt: -1 })
      .lean();

    // Fetch all students and teachers to map relationships
    const [students, teachers] = await Promise.all([
      Student.find({}).populate('userId').lean(),
      Teacher.find({}).populate('userId').lean(),
    ]);

    // Create maps for quick lookup
    const studentMap = new Map();
    students.forEach(student => {
      if (student.userId?._id) {
        studentMap.set(student.userId._id.toString(), student);
      }
    });

    const teacherMap = new Map();
    teachers.forEach(teacher => {
      if (teacher.userId?._id) {
        teacherMap.set(teacher.userId._id.toString(), teacher);
      }
    });

    // Transform users with related data
    const transformedUsers = users.map(user => {
      const userId = user._id.toString();
      const studentData = studentMap.get(userId);
      const teacherData = teacherMap.get(userId);
      
      // Determine role - prioritize actual data in related tables
      let role = null;
      
      // If user has teacher data, they are a teacher
      if (teacherData) {
        role = 'teacher';
      } 
      // If user has student data, they are a student
      else if (studentData) {
        role = 'student';
      }
      // If user has explicit role in User table, use it
      else if (user.role) {
        role = user.role;
      }
      // If no role and no related data, mark as 'incomplete' or 'pending'
      else {
        role = 'pending'; // User exists but hasn't completed profile setup
      }

      // Calculate profile completion
      let completedFields = 0;
      const totalFields = 8;

      if (user.fullName) completedFields++;
      if (user.email) completedFields++;
      if (user.phone) completedFields++;
      if (user.avatar) completedFields++;
      if (user.preferredLanguage) completedFields++;

      // Role-specific fields
      if (studentData) {
        if (studentData.tasks && Array.isArray(studentData.tasks) && studentData.tasks.length > 0) completedFields++;
        if (studentData.memorizationLogs && Array.isArray(studentData.memorizationLogs) && studentData.memorizationLogs.length > 0) completedFields++;
        if (studentData.timezone) completedFields++;
      } else if (teacherData) {
        if (teacherData.bio) completedFields++;
        if (teacherData.qualifications && Array.isArray(teacherData.qualifications) && teacherData.qualifications.length > 0) completedFields++;
        if (teacherData.approvalStatus === 'approved') completedFields++;
      } else if (role === 'admin') {
        // Admins are considered complete
        completedFields = totalFields;
      } else if (role === 'pending') {
        // Users with no role and no related data have lower completion
        // They only have basic user fields
      }

      const profileCompletion = Math.round((completedFields / totalFields) * 100);

      // Build user object
      const userObj = {
        uid: userId,
        id: userId,
        displayName: user.fullName || 'Unknown',
        firstName: user.fullName?.split(' ')[0] || '',
        lastName: user.fullName?.split(' ').slice(1).join(' ') || '',
        email: user.email || '',
        phone: user.phone || '',
        accountType: role,
        role: role,
        avatar: user.avatar || null,
        photoURL: user.avatar || null,
        preferredLanguage: user.preferredLanguage || 'ar',
        isActive: user.isActive !== false,
        createdAt: user.createdAt || new Date(),
        updatedAt: user.updatedAt || new Date(),
        profileCompletion: profileCompletion,
      };

      // Add role-specific data
      if (studentData) {
        userObj.timezone = studentData.timezone || null;
        userObj.notes = studentData.notes || null;
        userObj.tasks = studentData.tasks || [];
        userObj.activities = studentData.activities || [];
        userObj.memorizationLogs = studentData.memorizationLogs || [];
      }

      if (teacherData) {
        userObj.approvalStatus = teacherData.approvalStatus || 'pending';
        userObj.bio = teacherData.bio || null;
        userObj.experienceYears = teacherData.experienceYears || null;
        userObj.ratingAvg = teacherData.ratingAvg || 0;
        userObj.ratingCount = teacherData.ratingCount || 0;
        userObj.qualifications = teacherData.qualifications || [];
        userObj.ijazahs = teacherData.ijazahs || [];
        userObj.languages = teacherData.languages || [];
        userObj.sessionPrice = teacherData.sessionPrice ? parseFloat(teacherData.sessionPrice.toString()) : null;
      }

      return userObj;
    });

    res.json({
      success: true,
      data: {
        users: transformedUsers,
      },
      error: null,
      meta: {
        total: transformedUsers.length,
        students: transformedUsers.filter(u => u.role === 'student').length,
        teachers: transformedUsers.filter(u => u.role === 'teacher').length,
        admins: transformedUsers.filter(u => u.role === 'admin').length,
        pending: transformedUsers.filter(u => u.role === 'pending').length,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete user and all related data (admin only)
 * Deletes: User, Student/Teacher profile, Sessions, Subscriptions, Applications, etc.
 */
export const deleteUser = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const models = await import('../models/index.js');
    const { User, Student, Teacher, Session, Subscription, TeacherApplication, Payment } = models;

    // Find user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        data: null,
        error: { code: 'USER_NOT_FOUND', message: 'User not found' },
        meta: {},
      });
    }

    // Prevent deleting admin users (safety check)
    if (user.role === 'admin') {
      return res.status(403).json({
        success: false,
        data: null,
        error: { code: 'CANNOT_DELETE_ADMIN', message: 'Cannot delete admin users' },
        meta: {},
      });
    }

    // Delete all related data in parallel
    await Promise.all([
      // Delete student profile if exists
      Student.findOneAndDelete({ userId }),
      // Delete teacher profile if exists
      Teacher.findOneAndDelete({ userId }),
      // Delete teacher application if exists
      TeacherApplication.findOneAndDelete({ userId }),
      // Delete all sessions (as student or teacher)
      Session.deleteMany({ $or: [{ studentId: userId }, { teacherId: userId }] }),
      // Delete all subscriptions (as student or teacher)
      Subscription.deleteMany({ $or: [{ studentId: userId }, { teacherId: userId }] }),
      // Delete all payments
      Payment.deleteMany({ $or: [{ studentId: userId }, { teacherId: userId }] }),
    ]);

    // Finally delete the user
    await User.findByIdAndDelete(userId);

    res.json({
      success: true,
      data: {
        message: 'User and all related data deleted successfully',
      },
      error: null,
      meta: {},
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get payments
 */
export const getPayments = async (req, res, next) => {
  try {
    // TODO: Fetch payments with filters

    res.json({
      success: true,
      data: {
        payments: [],
      },
      error: null,
      meta: {},
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get subscriptions
 */
export const getSubscriptions = async (req, res, next) => {
  try {
    const { status, teacherId, studentId } = req.query;
    const Subscription = (await import('../models/index.js')).Subscription;
    const SubscriptionPlan = (await import('../models/index.js')).SubscriptionPlan;
    const Student = (await import('../models/index.js')).Student;
    const Teacher = (await import('../models/index.js')).Teacher;
    const User = (await import('../models/index.js')).User;

    // Build query
    const query = {};
    if (status) {
      // Map frontend status to backend status
      if (status === 'pending') {
        // Backend doesn't have 'pending' status, so we'll filter by active subscriptions that haven't started
        query.status = 'active';
        query.startedAt = { $gt: new Date() };
      } else if (status === 'cancelled') {
        query.status = 'cancelled';
      } else if (status === 'active') {
        query.status = 'active';
        query.startedAt = { $lte: new Date() };
        query.expiresAt = { $gte: new Date() };
      }
    }
    if (teacherId) {
      const teacher = await Teacher.findOne({ userId: teacherId });
      if (teacher) {
        query.teacherId = teacher._id;
      } else {
        // Teacher not found, return empty array
        return res.json({
          success: true,
          data: {
            subscriptions: [],
          },
          error: null,
          meta: {},
        });
      }
    }
    if (studentId) {
      const student = await Student.findOne({ userId: studentId });
      if (student) {
        query.studentId = student._id;
      } else {
        // Student not found, return empty array
        return res.json({
          success: true,
          data: {
            subscriptions: [],
          },
          error: null,
          meta: {},
        });
      }
    }

    // Fetch subscriptions with populated data
    const subscriptions = await Subscription.find(query)
      .populate('planId')
      .populate({
        path: 'teacherId',
        populate: {
          path: 'userId',
          select: 'fullName email phone',
        },
      })
      .populate({
        path: 'studentId',
        populate: {
          path: 'userId',
          select: 'fullName email phone',
        },
      })
      .sort({ createdAt: -1 })
      .lean();

    // Transform subscriptions to match frontend format
    const transformedSubscriptions = subscriptions.map(subscription => {
      const teacherUser = subscription.teacherId?.userId || {};
      const studentUser = subscription.studentId?.userId || {};
      const plan = subscription.planId || {};

      // Convert Decimal128 to number
      const monthlyPrice = subscription.monthlyPrice
        ? (typeof subscription.monthlyPrice === 'object' && subscription.monthlyPrice.toString)
          ? parseFloat(subscription.monthlyPrice.toString())
          : subscription.monthlyPrice
        : 0;

      // Map backend status to frontend status
      let frontendStatus = subscription.status;
      if (subscription.status === 'active' && subscription.startedAt && new Date(subscription.startedAt) > new Date()) {
        frontendStatus = 'pending';
      } else if (subscription.status === 'expired') {
        frontendStatus = 'cancelled';
      }

      return {
        id: subscription._id.toString(),
        studentId: subscription.studentId?._id?.toString() || subscription.studentId?.toString() || '',
        studentName: studentUser.fullName || 'Unknown Student',
        studentEmail: studentUser.email || '',
        teacherId: subscription.teacherId?._id?.toString() || subscription.teacherId?.toString() || '',
        teacherName: teacherUser.fullName || 'Unknown Teacher',
        planId: plan.planId || 'starter',
        planLabel: plan.name || 'الباقة الأساسية',
        sessionsPerMonth: subscription.sessionsTotal || plan.sessionsPerPeriod || 0,
        weeklyFrequency: subscription.weeklySlots?.length ? `${subscription.weeklySlots.length} times/week` : 'N/A',
        durationMinutes: plan.durationMinutes || 60,
        weeklySlots: subscription.weeklySlots || [],
        monthlyPrice: monthlyPrice,
        currency: subscription.currency || 'USD',
        status: frontendStatus,
        startDate: subscription.startedAt || new Date(),
        nextRenewalDate: subscription.expiresAt || null,
        createdAt: subscription.createdAt || new Date(),
        updatedAt: subscription.updatedAt || new Date(),
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
 * Get summary report
 */
export const getSummaryReport = async (req, res, next) => {
  try {
    // TODO: Calculate summary metrics

    res.json({
      success: true,
      data: {
        summary: {
          totalSessions: 0,
          totalRevenue: 0,
          activeTeachers: 0,
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
 * Get revenue report
 */
export const getRevenueReport = async (req, res, next) => {
  try {
    const { from, to } = req.query;

    // TODO: Calculate revenue by period

    res.json({
      success: true,
      data: {
        revenue: [],
      },
      error: null,
      meta: {},
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update subscription status (admin)
 */
export const updateSubscriptionStatus = async (req, res, next) => {
  try {
    const { subscriptionId } = req.params;
    const { status } = req.body;
    const Subscription = (await import('../models/index.js')).Subscription;

    // Map frontend status to backend status
    // Frontend: 'pending', 'active', 'cancelled'
    // Backend: 'active', 'expired', 'cancelled'
    let backendStatus = status;
    if (status === 'pending') {
      // 'pending' in frontend means active but not started yet - keep as 'active'
      backendStatus = 'active';
    } else if (status === 'active') {
      backendStatus = 'active';
    } else if (status === 'cancelled') {
      backendStatus = 'cancelled';
    }

    // Validate backend status
    const validStatuses = ['active', 'expired', 'cancelled'];
    if (!validStatuses.includes(backendStatus)) {
      return res.status(400).json({
        success: false,
        data: null,
        error: { code: 'INVALID_STATUS', message: `Status must be one of: pending, active, cancelled` },
        meta: {},
      });
    }

    // Find and update subscription
    const subscription = await Subscription.findById(subscriptionId);
    if (!subscription) {
      return res.status(404).json({
        success: false,
        data: null,
        error: { code: 'SUBSCRIPTION_NOT_FOUND', message: 'Subscription not found' },
        meta: {},
      });
    }

    subscription.status = backendStatus;
    await subscription.save();

    res.json({
      success: true,
      data: {
        subscription: {
          id: subscription._id.toString(),
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
 * Delete subscription (admin)
 */
export const deleteSubscription = async (req, res, next) => {
  try {
    const { subscriptionId } = req.params;
    const Subscription = (await import('../models/index.js')).Subscription;

    // Find subscription
    const subscription = await Subscription.findById(subscriptionId);
    if (!subscription) {
      return res.status(404).json({
        success: false,
        data: null,
        error: { code: 'SUBSCRIPTION_NOT_FOUND', message: 'Subscription not found' },
        meta: {},
      });
    }

    // Delete subscription
    await Subscription.findByIdAndDelete(subscriptionId);

    res.json({
      success: true,
      data: {
        message: 'Subscription deleted successfully',
      },
      error: null,
      meta: {},
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get sessions report
 */
export const getSessionsReport = async (req, res, next) => {
  try {
    const { status, teacherId, studentId } = req.query;
    const Session = (await import('../models/index.js')).Session;
    const Student = (await import('../models/index.js')).Student;
    const Teacher = (await import('../models/index.js')).Teacher;
    const User = (await import('../models/index.js')).User;

    // Build query
    const query = {};
    if (status) {
      query.status = status;
    }
    if (teacherId) {
      const teacher = await Teacher.findOne({ userId: teacherId });
      if (teacher) {
        query.teacherId = teacher._id;
      } else {
        // Teacher not found, return empty array
        return res.json({
          success: true,
          data: {
            sessions: [],
          },
          error: null,
          meta: {},
        });
      }
    }
    if (studentId) {
      const student = await Student.findOne({ userId: studentId });
      if (student) {
        query.studentId = student._id;
      } else {
        // Student not found, return empty array
        return res.json({
          success: true,
          data: {
            sessions: [],
          },
          error: null,
          meta: {},
        });
      }
    }

    // Fetch sessions with populated data
    const sessions = await Session.find(query)
      .populate({
        path: 'teacherId',
        populate: {
          path: 'userId',
          select: 'fullName email phone',
        },
      })
      .populate({
        path: 'studentId',
        populate: {
          path: 'userId',
          select: 'fullName email phone',
        },
      })
      .sort({ scheduledStart: -1 })
      .lean();

    // Transform sessions to match frontend format
    const transformedSessions = sessions.map(session => {
      const teacherUser = session.teacherId?.userId || {};
      const studentUser = session.studentId?.userId || {};

      // Calculate duration in minutes
      const duration = session.scheduledEnd && session.scheduledStart
        ? Math.round((new Date(session.scheduledEnd) - new Date(session.scheduledStart)) / (1000 * 60))
        : 60; // Default to 60 minutes

      return {
        id: session._id.toString(),
        studentId: session.studentId?._id?.toString() || session.studentId?.toString() || '',
        teacherId: session.teacherId?._id?.toString() || session.teacherId?.toString() || '',
        teacherName: teacherUser.fullName || 'Unknown Teacher',
        teacherPhoto: teacherUser.photoURL || '',
        title: session.title || 'Session',
        description: session.description || null,
        scheduledDate: session.scheduledStart || new Date(),
        duration: duration,
        status: session.status === 'started' ? 'in_progress' :
          session.status === 'completed' ? 'completed' :
            session.status === 'cancelled' ? 'cancelled' : 'scheduled',
        sessionType: session.sessionType || 'memorization',
        subscriptionId: session.subscriptionId?.toString() || null,
        meetingLink: session.videoJoinUrlStudent || session.videoJoinUrlTeacher || null,
        notes: null, // Notes field not in Session model yet
        createdAt: session.createdAt || new Date(),
        updatedAt: session.updatedAt || new Date(),
      };
    });

    res.json({
      success: true,
      data: {
        sessions: transformedSessions,
      },
      error: null,
      meta: {},
    });
  } catch (error) {
    next(error);
  }
};
