import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User, Student, Teacher } from '../models/index.js';

/**
 * Register a new student
 */
export const registerStudent = async (req, res, next) => {
  try {
    const { email, password, fullName, phone } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [
        ...(email ? [{ email }] : []),
        ...(phone ? [{ phone }] : []),
      ],
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        data: null,
        error: {
          code: 'USER_ALREADY_EXISTS',
          message: 'User with this email or phone already exists',
        },
        meta: {},
      });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user
    const user = new User({
      email,
      phone,
      fullName,
      passwordHash,
    });
    await user.save();

    // Create student record
    const student = new Student({
      userId: user._id,
    });
    await student.save();

    // Generate JWT token
    const token = jwt.sign(
      { id: user._id.toString(), email: user.email, role: user.role },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: process.env.JWT_EXPIRE || '7d' }
    );

    res.status(201).json({
      success: true,
      data: {
        user: {
          id: user._id.toString(),
          email: user.email,
          phone: user.phone,
          fullName: user.fullName,
          role: user.role,
        },
        token,
      },
      error: null,
      meta: {},
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Register a new teacher
 */
export const registerTeacher = async (req, res, next) => {
  try {
    const { email, password, fullName, phone } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [
        ...(email ? [{ email }] : []),
        ...(phone ? [{ phone }] : []),
      ],
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        data: null,
        error: {
          code: 'USER_ALREADY_EXISTS',
          message: 'User with this email or phone already exists',
        },
        meta: {},
      });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user
    const user = new User({
      email,
      phone,
      fullName,
      passwordHash,
      role: 'teacher',
    });
    await user.save();

    // Create teacher record with 'incomplete' status
    // approvalStatus will be set to 'pending' when they complete personal-info
    const teacher = new Teacher({
      userId: user._id,
      approvalStatus: 'incomplete',
    });
    await teacher.save();

    // Generate JWT token
    const token = jwt.sign(
      { id: user._id.toString(), email: user.email, role: user.role },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: process.env.JWT_EXPIRE || '7d' }
    );

    res.status(201).json({
      success: true,
      data: {
        user: {
          id: user._id.toString(),
          email: user.email,
          phone: user.phone,
          fullName: user.fullName,
          role: user.role,
          status: teacher.approvalStatus,
        },
        token,
      },
      error: null,
      meta: {},
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Login user
 */
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Find user by email or phone
    const user = await User.findOne({
      $or: [
        { email },
        { phone: email }, // Allow login with phone number too
      ],
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        data: null,
        error: {
          code: 'AUTH_INVALID_CREDENTIALS',
          message: 'Invalid email or password',
        },
        meta: {},
      });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        data: null,
        error: {
          code: 'AUTH_INVALID_CREDENTIALS',
          message: 'Invalid email or password',
        },
        meta: {},
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        data: null,
        error: {
          code: 'AUTH_ACCOUNT_SUSPENDED',
          message: 'Account is suspended',
        },
        meta: {},
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user._id.toString(), email: user.email, role: user.role },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: process.env.JWT_EXPIRE || '7d' }
    );

    res.json({
      success: true,
      data: {
        user: {
          id: user._id.toString(),
          email: user.email,
          phone: user.phone,
          fullName: user.fullName,
          role: user.role,
        },
        token,
      },
      error: null,
      meta: {},
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Request password reset
 */
export const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    // TODO: Find user by email
    // TODO: Generate reset token
    // TODO: Send reset email

    res.json({
      success: true,
      data: {
        message: 'Password reset email sent',
      },
      error: null,
      meta: {},
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Reset password
 */
export const resetPassword = async (req, res, next) => {
  try {
    const { token, password } = req.body;

    // TODO: Verify reset token
    // TODO: Hash new password
    // TODO: Update user password

    res.json({
      success: true,
      data: {
        message: 'Password reset successfully',
      },
      error: null,
      meta: {},
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Login or register user via Google (email + profile from Firebase client)
 * This endpoint trusts that Firebase has already verified the Google account.
 */
export const loginWithGoogle = async (req, res, next) => {
  try {
    const { email, fullName, photoURL } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        data: null,
        error: {
          code: 'AUTH_GOOGLE_EMAIL_REQUIRED',
          message: 'Email is required for Google login',
        },
        meta: {},
      });
    }

    // Find existing user by email
    let user = await User.findOne({ email });

    if (!user) {
      // Create a new user without role or student/teacher record
      // Role and student/teacher records will be created when user selects account type
      const nameToUse = fullName || email.split('@')[0] || 'User';
      const randomPassword = await bcrypt.hash(
        Math.random().toString(36).slice(-10),
        10
      );

      user = new User({
        email,
        fullName: nameToUse,
        passwordHash: randomPassword,
        avatar: photoURL || null,
        role: null, // No role assigned until user selects account type
      });
      await user.save();

      // Do NOT create Student or Teacher record here
      // Records will be created when user selects account type in AccountTypeSelection
    } else {
      // Update avatar/fullName if provided
      let changed = false;
      if (fullName && user.fullName !== fullName) {
        user.fullName = fullName;
        changed = true;
      }
      if (photoURL && user.avatar !== photoURL) {
        user.avatar = photoURL;
        changed = true;
      }
      if (changed) {
        await user.save();
      }
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        data: null,
        error: {
          code: 'AUTH_ACCOUNT_SUSPENDED',
          message: 'Account is suspended',
        },
        meta: {},
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user._id.toString(), email: user.email, role: user.role },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: process.env.JWT_EXPIRE || '7d' }
    );

    res.json({
      success: true,
      data: {
        user: {
          id: user._id.toString(),
          email: user.email,
          phone: user.phone,
          fullName: user.fullName,
          role: user.role,
        },
        token,
      },
      error: null,
      meta: {},
    });
  } catch (error) {
    next(error);
  }
};