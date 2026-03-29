import { User, Student, Teacher } from '../models/index.js';

/**
 * Get current user profile
 */
export const getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select('-passwordHash').lean();

    if (!user) {
      return res.status(404).json({
        success: false,
        data: null,
        error: { code: 'USER_NOT_FOUND', message: 'User not found' },
        meta: {},
      });
    }

    let studentProfile = null;
    if (user.role === 'student') {
      studentProfile = await Student.findOne({ userId: user._id })
        .select('goals ageGroup level learningGoal completed profileCompletedAt')
        .lean();
    }

    // Normalize Mongo _id to id for frontend
    const { _id, ...rest } = user;
    const safeUser = {
      id: _id.toString(),
      ...rest,
      ...(studentProfile
        ? {
            goals: studentProfile.goals || [],
            ageGroup: studentProfile.ageGroup || null,
            level: studentProfile.level || null,
            learningGoal: studentProfile.learningGoal || [],
            completed: studentProfile.completed || false,
            profileCompletedAt: studentProfile.profileCompletedAt || null,
          }
        : {}),
    };

    res.json({
      success: true,
      data: { user: safeUser },
      error: null,
      meta: {},
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update user profile
 */
export const updateProfile = async (req, res, next) => {
  try {
    const {
      fullName,
      phone,
      preferredLanguage,
      avatar,
      role,
      goals,
      ageGroup,
      level,
      learningGoal,
      completed,
      profileCompletedAt,
    } = req.body;

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        data: null,
        error: { code: 'USER_NOT_FOUND', message: 'User not found' },
        meta: {},
      });
    }

    if (fullName !== undefined) user.fullName = fullName;
    if (phone !== undefined) user.phone = phone;
    if (preferredLanguage !== undefined) user.preferredLanguage = preferredLanguage;
    if (avatar !== undefined) user.avatar = avatar;
    
    // Allow updating role in a controlled way
    // When role is set for the first time, create corresponding Student or Teacher record
    if (role !== undefined && ['student', 'teacher', 'admin'].includes(role)) {
      const previousRole = user.role;
      user.role = role;
      
      // Create Student or Teacher record only if role is being set for the first time
      // and the role is student or teacher (not admin)
      if (!previousRole && (role === 'student' || role === 'teacher')) {
        if (role === 'student') {
          // Check if student record already exists
          const existingStudent = await Student.findOne({ userId: user._id });
          if (!existingStudent) {
            const student = new Student({
              userId: user._id,
            });
            await student.save();
          }
        } else if (role === 'teacher') {
          // Check if teacher record already exists
          const existingTeacher = await Teacher.findOne({ userId: user._id });
          if (!existingTeacher) {
            // Create teacher record with 'incomplete' status
            // approvalStatus will be set to 'pending' when they complete personal-info
            const teacher = new Teacher({
              userId: user._id,
              approvalStatus: 'incomplete',
            });
            await teacher.save();
          }
        }
      }
    }

    await user.save();

    let studentProfile = null;
    const shouldUpdateStudentProfile =
      user.role === 'student' &&
      (
        goals !== undefined ||
        ageGroup !== undefined ||
        level !== undefined ||
        learningGoal !== undefined ||
        completed !== undefined ||
        profileCompletedAt !== undefined
      );

    if (user.role === 'student') {
      studentProfile = await Student.findOne({ userId: user._id });
      if (!studentProfile) {
        studentProfile = new Student({ userId: user._id });
      }

      if (shouldUpdateStudentProfile) {
        if (goals !== undefined) studentProfile.goals = Array.isArray(goals) ? goals : [];
        if (ageGroup !== undefined) studentProfile.ageGroup = ageGroup || null;
        if (level !== undefined) studentProfile.level = level || null;
        if (learningGoal !== undefined) {
          studentProfile.learningGoal = Array.isArray(learningGoal) ? learningGoal : [];
        }
        if (completed !== undefined) {
          studentProfile.completed = Boolean(completed);
          if (studentProfile.completed && !studentProfile.profileCompletedAt) {
            studentProfile.profileCompletedAt = new Date();
          }
        }
        if (profileCompletedAt !== undefined) {
          studentProfile.profileCompletedAt = profileCompletedAt || null;
        }
      }

      await studentProfile.save();
    }

    const userData = user.toObject();
    delete userData.passwordHash;

    // Normalize Mongo _id to id for frontend
    const { _id, ...rest } = userData;
    const safeUser = {
      id: _id.toString(),
      ...rest,
      ...(studentProfile
        ? {
            goals: studentProfile.goals || [],
            ageGroup: studentProfile.ageGroup || null,
            level: studentProfile.level || null,
            learningGoal: studentProfile.learningGoal || [],
            completed: studentProfile.completed || false,
            profileCompletedAt: studentProfile.profileCompletedAt || null,
          }
        : {}),
    };

    res.json({
      success: true,
      data: { user: safeUser },
      error: null,
      meta: {},
    });
  } catch (error) {
    next(error);
  }
};
