import mongoose from 'mongoose';

const attendanceRecordSchema = new mongoose.Schema(
  {
    sessionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Session',
      required: true,
      unique: true,
    },
    studentAttendance: {
      type: String,
      enum: ['present', 'absent', 'late'],
      default: null,
    },
    teacherAttendance: {
      type: String,
      enum: ['present', 'absent', 'late'],
      default: null,
    },
    markedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    markedAt: {
      type: Date,
      required: true,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Note: sessionId already has unique index from unique: true

const AttendanceRecord = mongoose.model('AttendanceRecord', attendanceRecordSchema);

export default AttendanceRecord;
