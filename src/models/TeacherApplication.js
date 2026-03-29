import mongoose from 'mongoose';

const teacherApplicationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    currentStep: {
      type: String,
      enum: ['step1', 'step2', 'review', 'submitted'],
      default: 'step1',
    },
    step1: {
      fullName: { type: String, default: '' },
      email: { type: String, default: '' },
      phone: { type: String, default: '' },
      countryCode: { type: String, default: '' },
      gender: { type: String, default: '' },
      nationality: { type: String, default: '' },
      yearsOfExperience: { type: Number, default: 0, min: 0 },
      languages: { type: [String], default: [] },
      title: { type: String, default: '' },
    },
    step2: {
      educationLevel: { type: String, default: '' },
      certificatesCount: { type: Number, default: 0, min: 0 },
      bio: { type: String, default: '' },
      introVideo: { type: String, default: '' },
      subjects: { type: [String], default: [] },
      hourlyRate: { type: Number, default: 0, min: 0 },
      currency: { type: String, default: 'USD' },
      teachingStyle: { type: String, default: '' }, // JSON string for benefits
      sessionContent: { type: String, default: '' }, // JSON string for session content items
      ijazahs: {
        type: [
          {
            title: { type: String, default: '' },
            description: { type: String, default: '' },
            image: { type: String, default: '' }, // URL (optional)
          },
        ],
        default: [],
      },
    },
    submittedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

teacherApplicationSchema.index({ currentStep: 1, updatedAt: -1 });

const TeacherApplication = mongoose.model('TeacherApplication', teacherApplicationSchema);

export default TeacherApplication;

