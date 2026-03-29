import mongoose from 'mongoose';

const memorizationLogSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
    },
    juz: {
      type: Number,
      min: 1,
      max: 30,
      default: null,
    },
    surah: {
      type: String,
      default: null,
    },
    verses: {
      type: String,
      default: null,
    },
    notes: {
      type: String,
      default: null,
    },
    loggedDate: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

memorizationLogSchema.index({ studentId: 1, loggedDate: -1 });

const MemorizationLog = mongoose.model('MemorizationLog', memorizationLogSchema);

export default MemorizationLog;
