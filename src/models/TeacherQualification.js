import mongoose from 'mongoose';

const teacherQualificationSchema = new mongoose.Schema(
  {
    teacherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Teacher',
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 255,
    },
    issuer: {
      type: String,
      trim: true,
      maxlength: 255,
      default: null,
    },
    issuedYear: {
      type: Number,
      min: 1900,
      max: new Date().getFullYear(),
      default: null,
    },
    certificateUrl: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

teacherQualificationSchema.index({ teacherId: 1 });

const TeacherQualification = mongoose.model('TeacherQualification', teacherQualificationSchema);

export default TeacherQualification;
