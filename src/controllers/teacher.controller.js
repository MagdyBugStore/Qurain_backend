import { 
  Teacher, 
  User, 
  TeacherApplication,
  Availability, 
  AvailabilitySlot,
  Session,
  Review
} from '../models/index.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const resolveFrontendBaseUrl = () =>
  process.env.FRONTEND_URL || process.env.CORS_ORIGIN || 'http://localhost:5173';
const buildRoomJoinUrl = (sessionId, role) => {
  const base = resolveFrontendBaseUrl().replace(/\/+$/, '');
  const query = role ? `?role=${encodeURIComponent(role)}` : '';
  return `${base}/room-call/${encodeURIComponent(sessionId)}${query}`;
};

function validateStep1(payload) {
  const errors = [];

  const fullName = (payload?.fullName || '').trim();
  if (!fullName || fullName.length < 3) errors.push('FULL_NAME_REQUIRED');

  const phone = (payload?.phone || '').toString().replace(/\s/g, '');
  if (!/^\d{7,15}$/.test(phone)) errors.push('PHONE_INVALID');

  if (!payload?.countryCode) errors.push('COUNTRY_CODE_REQUIRED');
  if (!payload?.gender) errors.push('GENDER_REQUIRED');
  if (!payload?.nationality) errors.push('NATIONALITY_REQUIRED');

  const years = payload?.yearsOfExperience;
  if (years === undefined || years === null || Number.isNaN(Number(years)) || Number(years) < 0) {
    errors.push('YEARS_OF_EXPERIENCE_INVALID');
  }

  const languages = Array.isArray(payload?.languages) ? payload.languages : [];
  if (languages.length === 0) errors.push('LANGUAGES_REQUIRED');

  return errors;
}

// Strict validation used when submitting the application
function validateStep2(payload) {
  const errors = [];

  if (!payload?.educationLevel) errors.push('EDUCATION_LEVEL_REQUIRED');

  const hourlyRate = Number(payload?.hourlyRate || 0);
  if (!hourlyRate || hourlyRate <= 0) errors.push('HOURLY_RATE_REQUIRED');
  if (hourlyRate > 500) errors.push('HOURLY_RATE_TOO_HIGH');

  const subjects = Array.isArray(payload?.subjects) ? payload.subjects : [];
  if (subjects.length === 0) errors.push('SUBJECTS_REQUIRED');

  const bio = (payload?.bio || '').trim();
  if (!bio || bio.length < 30) errors.push('BIO_TOO_SHORT');

  return errors;
}

// Draft validation used when saving step2 as a draft (allows partial saves)
function validateStep2Draft(payload) {
  const errors = [];

  // Validate only provided fields (do not require all)
  if (payload?.educationLevel !== undefined) {
    if (!payload.educationLevel) errors.push('EDUCATION_LEVEL_REQUIRED');
  }

  if (payload?.hourlyRate !== undefined) {
    const hourlyRate = Number(payload.hourlyRate || 0);
    if (!hourlyRate || hourlyRate <= 0) errors.push('HOURLY_RATE_REQUIRED');
    if (hourlyRate > 500) errors.push('HOURLY_RATE_TOO_HIGH');
  }

  if (payload?.subjects !== undefined) {
    const subjects = Array.isArray(payload.subjects) ? payload.subjects : [];
    if (subjects.length === 0) errors.push('SUBJECTS_REQUIRED');
  }

  if (payload?.bio !== undefined) {
    const bio = (payload.bio || '').trim();
    if (bio && bio.length < 30) errors.push('BIO_TOO_SHORT');
    if (!bio) errors.push('BIO_TOO_SHORT');
  }

  return errors;
}

/**
 * Get my teacher application draft (multi-step)
 */
export const getMyApplication = async (req, res, next) => {
  try {
    const app = await TeacherApplication.findOne({ userId: req.user.id }).lean();

    res.json({
      success: true,
      data: { application: app || null },
      error: null,
      meta: {},
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Save step1 (validate + store)
 */
export const saveMyApplicationStep1 = async (req, res, next) => {
  try {
    const payload = req.body || {};
    const errors = validateStep1(payload);
    if (errors.length) {
      return res.status(400).json({
        success: false,
        data: null,
        error: { code: 'VALIDATION_ERROR', message: 'Step1 validation failed', details: errors },
        meta: {},
      });
    }

    const updated = await TeacherApplication.findOneAndUpdate(
      { userId: req.user.id },
      {
        $set: {
          userId: req.user.id,
          currentStep: 'step2',
          step1: {
            fullName: payload.fullName || '',
            email: payload.email || '',
            phone: payload.phone || '',
            countryCode: payload.countryCode || '',
            gender: payload.gender || '',
            nationality: payload.nationality || '',
            yearsOfExperience: Number(payload.yearsOfExperience || 0),
            languages: Array.isArray(payload.languages) ? payload.languages : [],
            title: payload.title || '',
          },
        },
      },
      { upsert: true, new: true }
    ).lean();

    res.json({
      success: true,
      data: { application: updated },
      error: null,
      meta: {},
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Save step2 (validate + store)
 */
export const saveMyApplicationStep2 = async (req, res, next) => {
  try {
    const payload = req.body || {};
    const errors = validateStep2Draft(payload);
    if (errors.length) {
      return res.status(400).json({
        success: false,
        data: null,
        error: { code: 'VALIDATION_ERROR', message: 'Step2 validation failed', details: errors },
        meta: {},
      });
    }

    // Get existing application to preserve fields that aren't being updated
    const existing = await TeacherApplication.findOne({ userId: req.user.id });
    
    // Build update object - only update fields that are provided in payload
    const updateFields = {
      userId: req.user.id,
      currentStep: 'review',
    };
    
    // Only update step2 fields that are provided, preserve existing ones
    if (existing?.step2) {
      updateFields['step2'] = { ...existing.step2 };
    } else {
      updateFields['step2'] = {};
    }
    
    // Update only provided fields
    if (payload.educationLevel !== undefined) updateFields['step2'].educationLevel = payload.educationLevel || '';
    if (payload.certificatesCount !== undefined) updateFields['step2'].certificatesCount = Number(payload.certificatesCount || 0);
    if (payload.bio !== undefined) updateFields['step2'].bio = payload.bio || '';
    if (payload.introVideo !== undefined) updateFields['step2'].introVideo = payload.introVideo || '';
    if (payload.subjects !== undefined) updateFields['step2'].subjects = Array.isArray(payload.subjects) ? payload.subjects : [];
    if (payload.hourlyRate !== undefined) updateFields['step2'].hourlyRate = Number(payload.hourlyRate || 0);
    if (payload.currency !== undefined) updateFields['step2'].currency = payload.currency || 'USD';
    if (payload.teachingStyle !== undefined) updateFields['step2'].teachingStyle = payload.teachingStyle || '';
    if (payload.sessionContent !== undefined) updateFields['step2'].sessionContent = payload.sessionContent || '';
    if (payload.ijazahs !== undefined) updateFields['step2'].ijazahs = Array.isArray(payload.ijazahs) ? payload.ijazahs : [];
    
    const updated = await TeacherApplication.findOneAndUpdate(
      { userId: req.user.id },
      { $set: updateFields },
      { upsert: true, new: true }
    ).lean();

    res.json({
      success: true,
      data: { application: updated },
      error: null,
      meta: {}, 
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Submit application (validate all + mark submitted + set Teacher.approvalStatus => pending)
 */
export const submitMyApplication = async (req, res, next) => {
  try {
    const app = await TeacherApplication.findOne({ userId: req.user.id });
    if (!app) {
      return res.status(404).json({
        success: false,
        data: null,
        error: { code: 'APPLICATION_NOT_FOUND', message: 'Application not found' },
        meta: {},
      });
    }

    const step1Errors = validateStep1(app.step1);
    const step2Errors = validateStep2(app.step2);
    const errors = [...step1Errors, ...step2Errors];
    if (errors.length) {
      return res.status(400).json({
        success: false,
        data: null,
        error: { code: 'VALIDATION_ERROR', message: 'Application validation failed', details: errors },
        meta: {},
      });
    }

    app.currentStep = 'submitted';
    app.submittedAt = new Date();
    await app.save();

    // Sync submitted application data into the teacher profile source used by public endpoints.
    const teacher = await Teacher.findOne({ userId: req.user.id });
    if (teacher) {
      const step1 = app.step1 || {};
      const step2 = app.step2 || {};

      teacher.bio = step2.bio || teacher.bio;
      teacher.experienceYears = Number(step1.yearsOfExperience || teacher.experienceYears || 0);
      teacher.sessionPrice = Number(step2.hourlyRate || teacher.sessionPrice || 0);
      teacher.teachingStyle = step2.teachingStyle || teacher.teachingStyle;
      teacher.sessionContent = step2.sessionContent || teacher.sessionContent;
      teacher.introVideo = step2.introVideo || teacher.introVideo;
      teacher.languages = Array.isArray(step1.languages) ? step1.languages : teacher.languages;

      // Ensure teacher status goes to pending after submit
      if (teacher.approvalStatus === 'incomplete') {
        teacher.approvalStatus = 'pending';
      }
      await teacher.save();
    }

    res.json({
      success: true,
      data: { application: app.toObject(), teacher: teacher ? { approvalStatus: teacher.approvalStatus } : null },
      error: null,
      meta: {},
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all approved teachers with filters
 */
export const getTeachers = async (req, res, next) => {
  try {
    const { language, min_price, max_price, min_rating, available_from, available_to } = req.query;

    const query = { approvalStatus: 'approved' };
    
    if (min_rating) {
      query.ratingAvg = { $gte: parseFloat(min_rating) };
    }

    const teachers = await Teacher.find(query)
      .populate('userId')
      .lean();

    // Filter by language if provided
    let filteredTeachers = teachers;
    if (language) {
      filteredTeachers = teachers.filter(t => 
        (t.languages || []).includes(language)
      );
    }

    // Filter by price if provided
    if (min_price || max_price) {
      filteredTeachers = filteredTeachers.filter(t => {
        const price = parseFloat(t.sessionPrice?.toString() || '0');
        if (min_price && price < parseFloat(min_price)) return false;
        if (max_price && price > parseFloat(max_price)) return false;
        return true;
      });
    }

    res.json({
      success: true,
      data: {
        teachers: filteredTeachers,
        total: filteredTeachers.length,
      },
      error: null,
      meta: {
        filters: { language, min_price, max_price, min_rating },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get teacher by ID
 */
export const getTeacherById = async (req, res, next) => {
  try {
    const { teacherId } = req.params;
    let teacher = null;

    // Support both Teacher._id and User._id in route param because the frontend
    // may navigate with either identifier depending on data source.
    if (teacherId && teacherId.match(/^[0-9a-fA-F]{24}$/)) {
      teacher = await Teacher.findById(teacherId).populate('userId').lean();
      if (!teacher) {
        teacher = await Teacher.findOne({ userId: teacherId }).populate('userId').lean();
      }
    }

    if (!teacher) {
      return res.status(404).json({
        success: false,
        data: null,
        error: { code: 'TEACHER_NOT_FOUND', message: 'Teacher not found' },
        meta: {},
      });
    }

    const isEmptyValue = (value) =>
      value === null ||
      value === undefined ||
      (typeof value === 'string' && value.trim() === '') ||
      (Array.isArray(value) && value.length === 0);

    // Fallback to submitted application data when profile fields were not synced
    // from TeacherApplication to Teacher yet.
    const teacherUserId =
      typeof teacher.userId === 'object' && teacher.userId?._id
        ? teacher.userId._id
        : teacher.userId;
    const application = await TeacherApplication.findOne({ userId: teacherUserId }).lean();
    const step1 = application?.step1 || {};
    const step2 = application?.step2 || {};
    const enrichedTeacher = { ...teacher };

    if (isEmptyValue(enrichedTeacher.bio) && !isEmptyValue(step2.bio)) {
      enrichedTeacher.bio = step2.bio;
    }
    if (isEmptyValue(enrichedTeacher.experienceYears) && step1.yearsOfExperience !== undefined) {
      enrichedTeacher.experienceYears = Number(step1.yearsOfExperience || 0);
    }
    if (isEmptyValue(enrichedTeacher.sessionPrice) && step2.hourlyRate !== undefined) {
      enrichedTeacher.sessionPrice = Number(step2.hourlyRate || 0);
    }
    if (isEmptyValue(enrichedTeacher.teachingStyle) && !isEmptyValue(step2.teachingStyle)) {
      enrichedTeacher.teachingStyle = step2.teachingStyle;
    }
    if (isEmptyValue(enrichedTeacher.sessionContent) && !isEmptyValue(step2.sessionContent)) {
      enrichedTeacher.sessionContent = step2.sessionContent;
    }
    if (isEmptyValue(enrichedTeacher.introVideo) && !isEmptyValue(step2.introVideo)) {
      enrichedTeacher.introVideo = step2.introVideo;
    }
    if (isEmptyValue(enrichedTeacher.languages) && Array.isArray(step1.languages)) {
      enrichedTeacher.languages = step1.languages;
    }

    // Get rating
    const reviews = await Review.find({ teacherId: teacher._id }).lean();
    const rating = reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.stars, 0) / reviews.length
      : 0;

    res.json({
      success: true,
      data: {
        teacher: {
          ...enrichedTeacher,
          rating: parseFloat(rating.toFixed(2)),
          reviewsCount: reviews.length,
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
 * Get teacher available slots
 */
export const getTeacherSlots = async (req, res, next) => {
  try {
    const { teacherId } = req.params;

    const slots = await AvailabilitySlot.find({
      teacherId,
      status: 'available',
      startTime: { $gte: new Date() },
    })
      .sort({ startTime: 1 })
      .lean();

    res.json({
      success: true,
      data: { slots },
      error: null,
      meta: {},
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get teacher weekly availability (public)
 */
export const getTeacherAvailability = async (req, res, next) => {
  try {
    const { teacherId } = req.params;
    let teacher = null;

    if (teacherId && teacherId.match(/^[0-9a-fA-F]{24}$/)) {
      teacher = await Teacher.findById(teacherId).lean();
      if (!teacher) {
        teacher = await Teacher.findOne({ userId: teacherId }).lean();
      }
    }

    if (!teacher) {
      return res.status(404).json({
        success: false,
        data: null,
        error: { code: 'TEACHER_NOT_FOUND', message: 'Teacher not found' },
        meta: {},
      });
    }

    const availability = await Availability.findOne({ teacherId: teacher._id }).lean();

    res.json({
      success: true,
      data: {
        availability: availability || null,
      },
      error: null,
      meta: {},
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get my teacher profile
 */
export const getMyProfile = async (req, res, next) => {
  try {
    const teacher = await Teacher.findOne({ userId: req.user.id })
      .populate('userId')
      .lean();

    if (!teacher) {
      return res.status(404).json({
        success: false,
        data: null,
        error: { code: 'TEACHER_NOT_FOUND', message: 'Teacher profile not found' },
        meta: {},
      });
    }

    res.json({
      success: true,
      data: { profile: teacher },
      error: null,
      meta: {},
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Submit teacher application (complete personal-info)
 * Sets approvalStatus to 'pending' when teacher completes their application
 */
export const submitApplication = async (req, res, next) => {
  try {
    const teacher = await Teacher.findOne({ userId: req.user.id });
    if (!teacher) {
      return res.status(404).json({
        success: false,
        data: null,
        error: { code: 'TEACHER_NOT_FOUND', message: 'Teacher profile not found' },
        meta: {},
      });
    }

    // Update approvalStatus to 'pending' when they complete personal-info
    if (teacher.approvalStatus === 'incomplete') {
      teacher.approvalStatus = 'pending';
      await teacher.save();
    }

    res.json({
      success: true,
      data: { 
        profile: teacher,
        message: 'Application submitted successfully. Your application is now pending review.',
      },
      error: null,
      meta: {},
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update teacher profile
 */
export const updateMyProfile = async (req, res, next) => {
  try {
    const { bio, experienceYears, teachingStyle, sessionContent, introVideo } = req.body;

    const teacher = await Teacher.findOne({ userId: req.user.id });
    if (!teacher) {
      return res.status(404).json({
        success: false,
        data: null,
        error: { code: 'TEACHER_NOT_FOUND', message: 'Teacher profile not found' },
        meta: {},
      });
    }

    if (bio !== undefined) teacher.bio = bio;
    if (experienceYears !== undefined) teacher.experienceYears = experienceYears;
    if (teachingStyle !== undefined) teacher.teachingStyle = teachingStyle;
    if (sessionContent !== undefined) teacher.sessionContent = sessionContent;
    if (introVideo !== undefined) teacher.introVideo = introVideo;

    await teacher.save();

    res.json({
      success: true,
      data: { profile: teacher },
      error: null,
      meta: {},
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update teacher pricing
 */
export const updatePricing = async (req, res, next) => {
  try {
    const { sessionPrice } = req.body;

    const teacher = await Teacher.findOne({ userId: req.user.id });
    if (!teacher) {
      return res.status(404).json({
        success: false,
        data: null,
        error: { code: 'TEACHER_NOT_FOUND', message: 'Teacher profile not found' },
        meta: {},
      });
    }

    teacher.sessionPrice = sessionPrice;
    await teacher.save();

    res.json({
      success: true,
      data: {
        pricing: {
          sessionPrice: teacher.sessionPrice,
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
 * Get qualifications
 */
export const getQualifications = async (req, res, next) => {
  try {
    const teacher = await Teacher.findOne({ userId: req.user.id });
    if (!teacher) {
      return res.status(404).json({
        success: false,
        data: null,
        error: { code: 'TEACHER_NOT_FOUND', message: 'Teacher profile not found' },
        meta: {},
      });
    }

    const qualifications = teacher.qualifications || [];

    res.json({
      success: true,
      data: { qualifications },
      error: null,
      meta: {},
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Save qualifications
 */
export const saveQualifications = async (req, res, next) => {
  try {
    const { qualifications } = req.body;

    const teacher = await Teacher.findOne({ userId: req.user.id });
    if (!teacher) {
      return res.status(404).json({
        success: false,
        data: null,
        error: { code: 'TEACHER_NOT_FOUND', message: 'Teacher profile not found' },
        meta: {},
      });
    }

    // Update embedded qualifications array
    teacher.qualifications = qualifications || [];
    await teacher.save();

    res.json({
      success: true,
      data: { message: 'Qualifications saved successfully' },
      error: null,
      meta: {},
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get ijazahs
 */
export const getIjazahs = async (req, res, next) => {
  try {
    const teacher = await Teacher.findOne({ userId: req.user.id });
    if (!teacher) {
      return res.status(404).json({
        success: false,
        data: null,
        error: { code: 'TEACHER_NOT_FOUND', message: 'Teacher profile not found' },
        meta: {},
      });
    }

    const ijazahs = teacher.ijazahs || [];

    res.json({
      success: true,
      data: { ijazahs },
      error: null,
      meta: {},
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Save ijazah
 */
export const saveIjazah = async (req, res, next) => {
  try {
    const { title, issuer, issuedYear, certificateUrl, description } = req.body;

    const teacher = await Teacher.findOne({ userId: req.user.id });
    if (!teacher) {
      return res.status(404).json({
        success: false,
        data: null,
        error: { code: 'TEACHER_NOT_FOUND', message: 'Teacher profile not found' },
        meta: {},
      });
    }

    // Add new ijazah to embedded array
    const newIjazah = {
      title,
      issuer,
      issuedYear,
      certificateUrl,
      description,
    };
    
    teacher.ijazahs = teacher.ijazahs || [];
    teacher.ijazahs.push(newIjazah);
    await teacher.save();

    // Get the newly added ijazah (last item in array)
    const savedIjazah = teacher.ijazahs[teacher.ijazahs.length - 1];

    res.status(201).json({
      success: true,
      data: { ijazah: savedIjazah },
      error: null,
      meta: {},
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update ijazah
 */
export const updateIjazah = async (req, res, next) => {
  try {
    const { ijazahId } = req.params;
    const updateData = req.body;

    const teacher = await Teacher.findOne({ userId: req.user.id });
    if (!teacher) {
      return res.status(404).json({
        success: false,
        data: null,
        error: { code: 'TEACHER_NOT_FOUND', message: 'Teacher profile not found' },
        meta: {},
      });
    }

    // Find ijazah in embedded array by _id
    const ijazahs = teacher.ijazahs || [];
    const ijazahIndex = ijazahs.findIndex(
      ij => ij._id && ij._id.toString() === ijazahId
    );

    if (ijazahIndex === -1) {
      return res.status(404).json({
        success: false,
        data: null,
        error: { code: 'IJAZAH_NOT_FOUND', message: 'Ijazah not found' },
        meta: {},
      });
    }

    // Update the ijazah
    Object.assign(ijazahs[ijazahIndex], updateData);
    teacher.ijazahs = ijazahs;
    await teacher.save();

    res.json({
      success: true,
      data: { ijazah: ijazahs[ijazahIndex] },
      error: null,
      meta: {},
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete ijazah
 */
export const deleteIjazah = async (req, res, next) => {
  try {
    const { ijazahId } = req.params;

    const teacher = await Teacher.findOne({ userId: req.user.id });
    if (!teacher) {
      return res.status(404).json({
        success: false,
        data: null,
        error: { code: 'TEACHER_NOT_FOUND', message: 'Teacher profile not found' },
        meta: {},
      });
    }

    // Find ijazah in embedded array by _id
    const ijazahs = teacher.ijazahs || [];
    const ijazahIndex = ijazahs.findIndex(
      ij => ij._id && ij._id.toString() === ijazahId
    );

    if (ijazahIndex === -1) {
      return res.status(404).json({
        success: false,
        data: null,
        error: { code: 'IJAZAH_NOT_FOUND', message: 'Ijazah not found' },
        meta: {},
      });
    }

    // Remove ijazah from array
    ijazahs.splice(ijazahIndex, 1);
    teacher.ijazahs = ijazahs;
    await teacher.save();

    res.json({
      success: true,
      data: { message: 'Ijazah deleted successfully' },
      error: null,
      meta: {},
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get availability
 */
export const getAvailability = async (req, res, next) => {
  try {
    const teacher = await Teacher.findOne({ userId: req.user.id });
    if (!teacher) {
      return res.status(404).json({
        success: false,
        data: null,
        error: { code: 'TEACHER_NOT_FOUND', message: 'Teacher profile not found' },
        meta: {},
      });
    }

    const availability = await Availability.findOne({ teacherId: teacher._id }).lean();

    res.json({
      success: true,
      data: { availability: availability || null },
      error: null,
      meta: {},
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Save availability
 */
export const saveAvailability = async (req, res, next) => {
  try {
    const { schedule } = req.body;

    const teacher = await Teacher.findOne({ userId: req.user.id });
    if (!teacher) {
      return res.status(404).json({
        success: false,
        data: null,
        error: { code: 'TEACHER_NOT_FOUND', message: 'Teacher profile not found' },
        meta: {},
      });
    }

    let availability = await Availability.findOne({ teacherId: teacher._id });

    if (availability) {
      // Merge schedules - preserve booked slots
      const currentSchedule = availability.schedule;
      const mergedSchedule = schedule.map((day, dayIndex) =>
        day.map((slot, timeIndex) => {
          const currentSlot = currentSchedule[dayIndex]?.[timeIndex];
          // Preserve booked slots
          if (currentSlot === 'booked') return 'booked';
          return slot;
        })
      );
      availability.schedule = mergedSchedule;
    } else {
      availability = new Availability({
        teacherId: teacher._id,
        schedule,
      });
    }

    await availability.save();

    res.json({
      success: true,
      data: { availability },
      error: null,
      meta: {},
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create availability slot
 */
export const createSlot = async (req, res, next) => {
  try {
    const { day, time, duration } = req.body;

    const teacher = await Teacher.findOne({ userId: req.user.id });
    if (!teacher) {
      return res.status(404).json({
        success: false,
        data: null,
        error: { code: 'TEACHER_NOT_FOUND', message: 'Teacher profile not found' },
        meta: {},
      });
    }

    // Calculate start and end times
    const startTime = new Date(`${day}T${time}`);
    const endTime = new Date(startTime);
    endTime.setMinutes(endTime.getMinutes() + (duration || 60));

    const slot = new AvailabilitySlot({
      teacherId: teacher._id,
      startTime,
      endTime,
      status: 'available',
    });
    await slot.save();

    res.status(201).json({
      success: true,
      data: { slot },
      error: null,
      meta: {},
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update slot
 */
export const updateSlot = async (req, res, next) => {
  try {
    const { slotId } = req.params;
    const { day, time, status } = req.body;

    const slot = await AvailabilitySlot.findById(slotId);
    if (!slot) {
      return res.status(404).json({
        success: false,
        data: null,
        error: { code: 'SLOT_NOT_FOUND', message: 'Slot not found' },
        meta: {},
      });
    }

    if (day && time) {
      slot.startTime = new Date(`${day}T${time}`);
      slot.endTime = new Date(slot.startTime);
      slot.endTime.setMinutes(slot.endTime.getMinutes() + 60);
    }
    if (status) slot.status = status;

    await slot.save();

    res.json({
      success: true,
      data: { slot },
      error: null,
      meta: {},
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete slot
 */
export const deleteSlot = async (req, res, next) => {
  try {
    const { slotId } = req.params;

    const slot = await AvailabilitySlot.findById(slotId);
    if (!slot) {
      return res.status(404).json({
        success: false,
        data: null,
        error: { code: 'SLOT_NOT_FOUND', message: 'Slot not found' },
        meta: {},
      });
    }

    if (slot.status === 'booked') {
      return res.status(400).json({
        success: false,
        data: null,
        error: { code: 'SLOT_BOOKED', message: 'Cannot delete booked slot' },
        meta: {},
      });
    }

    await AvailabilitySlot.findByIdAndDelete(slotId);

    res.json({
      success: true,
      data: { message: 'Slot deleted successfully' },
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
    const teacher = await Teacher.findOne({ userId: req.user.id });
    if (!teacher) {
      return res.status(404).json({
        success: false,
        data: null,
        error: { code: 'TEACHER_NOT_FOUND', message: 'Teacher profile not found' },
        meta: {},
      });
    }

    const sessions = await Session.find({ teacherId: teacher._id })
      .populate('studentId', 'userId')
      .populate({ path: 'studentId', populate: { path: 'userId' } })
      .sort({ scheduledStart: -1 })
      .lean();

    res.json({
      success: true,
      data: { sessions },
      error: null,
      meta: {},
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get my uploaded certificates
 */
export const getMyCertificates = async (req, res, next) => {
  try {
    const teacher = await Teacher.findOne({ userId: req.user.id }).lean();
    if (!teacher) {
      return res.status(404).json({
        success: false,
        data: null,
        error: { code: 'TEACHER_NOT_FOUND', message: 'Teacher profile not found' },
        meta: {},
      });
    }

    res.json({
      success: true,
      data: { certificates: teacher.certificates || [] },
      error: null,
      meta: {},
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Upload certificates (PDF/images)
 */
export const uploadMyCertificates = async (req, res, next) => {
  try {
    const teacher = await Teacher.findOne({ userId: req.user.id });
    if (!teacher) {
      return res.status(404).json({
        success: false,
        data: null,
        error: { code: 'TEACHER_NOT_FOUND', message: 'Teacher profile not found' },
        meta: {},
      });
    }

    const files = Array.isArray(req.files) ? req.files : [];
    if (files.length === 0) {
      return res.status(400).json({
        success: false,
        data: null,
        error: { code: 'UPLOAD_NO_FILE', message: 'No certificate files provided' },
        meta: {},
      });
    }

    const created = files.map((file) => {
      const url = `/uploads/certificates/${req.user.id}/${file.filename}`;
      return {
        filename: file.filename,
        originalName: file.originalname,
        size: file.size,
        mimeType: file.mimetype,
        url,
        uploadedAt: new Date(),
      };
    });

    teacher.certificates = teacher.certificates || [];
    teacher.certificates.push(...created);
    await teacher.save();

    // Return the just-added items (last N)
    const saved = teacher.certificates.slice(-created.length);

    res.status(201).json({
      success: true,
      data: { certificates: saved },
      error: null,
      meta: {},
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a certificate
 */
export const deleteMyCertificate = async (req, res, next) => {
  try {
    const { certificateId } = req.params;

    const teacher = await Teacher.findOne({ userId: req.user.id });
    if (!teacher) {
      return res.status(404).json({
        success: false,
        data: null,
        error: { code: 'TEACHER_NOT_FOUND', message: 'Teacher profile not found' },
        meta: {},
      });
    }

    const certificates = teacher.certificates || [];
    const idx = certificates.findIndex((c) => c._id && c._id.toString() === certificateId);
    if (idx === -1) {
      return res.status(404).json({
        success: false,
        data: null,
        error: { code: 'CERTIFICATE_NOT_FOUND', message: 'Certificate not found' },
        meta: {},
      });
    }

    const cert = certificates[idx];

    // Remove from DB first
    certificates.splice(idx, 1);
    teacher.certificates = certificates;
    await teacher.save();

    // Best-effort delete from disk
    const filePath = path.join(__dirname, '../../uploads/certificates', req.user.id, cert.filename);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    res.json({
      success: true,
      data: { message: 'Certificate deleted successfully' },
      error: null,
      meta: {},
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Start session
 */
export const startSession = async (req, res, next) => {
  try {
    const { sessionId } = req.params;

    const teacher = await Teacher.findOne({ userId: req.user.id });
    if (!teacher) {
      return res.status(404).json({
        success: false,
        data: null,
        error: { code: 'TEACHER_NOT_FOUND', message: 'Teacher profile not found' },
        meta: {},
      });
    }

    const session = await Session.findById(sessionId);
    if (!session) {
      return res.status(404).json({
        success: false,
        data: null,
        error: { code: 'SESSION_NOT_FOUND', message: 'Session not found' },
        meta: {},
      });
    }

    if (session.teacherId.toString() !== teacher._id.toString()) {
      return res.status(403).json({
        success: false,
        data: null,
        error: {
          code: 'SESSION_ACCESS_DENIED',
          message: 'You do not have permission to start this session',
        },
        meta: {},
      });
    }

    if (session.status === 'completed' || session.status === 'cancelled') {
      return res.status(409).json({
        success: false,
        data: null,
        error: {
          code: 'SESSION_INVALID_STATUS',
          message: `Cannot start session in status "${session.status}"`,
        },
        meta: {},
      });
    }

    session.status = 'started';
    if (!session.actualStart) {
      session.actualStart = new Date();
    }

    const teacherJoinUrl = buildRoomJoinUrl(session._id.toString(), 'teacher');
    const studentJoinUrl = buildRoomJoinUrl(session._id.toString(), 'student');
    session.videoProvider = session.videoProvider || 'internal_webrtc';
    session.videoMeetingId = session.videoMeetingId || session._id.toString();
    session.videoJoinUrlTeacher = teacherJoinUrl;
    session.videoJoinUrlStudent = studentJoinUrl;
    await session.save();

    res.json({
      success: true,
      data: {
        session: {
          id: session._id,
          status: session.status,
          joinUrl: teacherJoinUrl,
          teacherJoinUrl,
          studentJoinUrl,
          videoProvider: session.videoProvider,
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
 * Mark student attendance
 */
export const markAttendance = async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    const { studentId, attended } = req.body;

    const { AttendanceRecord } = await import('../models/index.js');
    
    let attendance = await AttendanceRecord.findOne({ sessionId });
    if (!attendance) {
      attendance = new AttendanceRecord({
        sessionId,
        markedBy: req.user.id,
        markedAt: new Date(),
      });
    }

    attendance.studentAttendance = attended ? 'present' : 'absent';
    await attendance.save();

    res.json({
      success: true,
      data: { attendance },
      error: null,
      meta: {},
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get completed sessions count
 */
export const getCompletedSessionsCount = async (req, res, next) => {
  try {
    const teacher = await Teacher.findOne({ userId: req.user.id });
    if (!teacher) {
      return res.status(404).json({
        success: false,
        data: null,
        error: { code: 'TEACHER_NOT_FOUND', message: 'Teacher profile not found' },
        meta: {},
      });
    }

    const count = await Session.countDocuments({
      teacherId: teacher._id,
      status: 'completed',
    });

    res.json({
      success: true,
      data: { count },
      error: null,
      meta: {},
    });
  } catch (error) {
    next(error);
  }
};
