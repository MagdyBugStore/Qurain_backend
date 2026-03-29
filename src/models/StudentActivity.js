import mongoose from 'mongoose';

const studentActivitySchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
    },
    type: {
      type: String,
      enum: ['session_completed', 'task_completed', 'memorization_logged', 'session_scheduled', 'other'],
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      default: null,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

studentActivitySchema.index({ studentId: 1, createdAt: -1 });
studentActivitySchema.index({ type: 1 });

const StudentActivity = mongoose.model('StudentActivity', studentActivitySchema);

export default StudentActivity;
