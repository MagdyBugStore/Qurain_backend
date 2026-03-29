import mongoose from 'mongoose';

const teacherLanguageSchema = new mongoose.Schema(
  {
    teacherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Teacher',
      required: true,
    },
    languageCode: {
      type: String,
      enum: ['ar', 'en'],
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Unique constraint: one language per teacher
teacherLanguageSchema.index({ teacherId: 1, languageCode: 1 }, { unique: true });

const TeacherLanguage = mongoose.model('TeacherLanguage', teacherLanguageSchema);

export default TeacherLanguage;
