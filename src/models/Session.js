import mongoose from 'mongoose';

const sessionSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
    },
    teacherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Teacher',
      required: true,
    },
    slotId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AvailabilitySlot',
      default: null,
      unique: true,
      sparse: true,
    },
    status: {
      type: String,
      enum: ['scheduled', 'started', 'completed', 'cancelled', 'rescheduled', 'no_show'],
      default: 'scheduled',
    },
    scheduledStart: {
      type: Date,
      required: true,
    },
    scheduledEnd: {
      type: Date,
      required: true,
    },
    actualStart: {
      type: Date,
      default: null,
    },
    actualEnd: {
      type: Date,
      default: null,
    },
    videoProvider: {
      type: String,
      maxlength: 64,
      default: null,
    },
    videoMeetingId: {
      type: String,
      maxlength: 255,
      default: null,
    },
    videoJoinUrlStudent: {
      type: String,
      default: null,
    },
    videoJoinUrlTeacher: {
      type: String,
      default: null,
    },
    sessionType: {
      type: String,
      default: 'memorization',
    },
    title: {
      type: String,
      default: null,
    },
    description: {
      type: String,
      default: null,
    },
    subscriptionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subscription',
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Validation: scheduledEnd must be after scheduledStart
sessionSchema.pre('validate', function(next) {
  if (this.scheduledEnd <= this.scheduledStart) {
    next(new Error('scheduledEnd must be after scheduledStart'));
  } else {
    next();
  }
});

// Indexes
sessionSchema.index({ studentId: 1, scheduledStart: 1 });
sessionSchema.index({ teacherId: 1, scheduledStart: 1 });
sessionSchema.index({ status: 1 });
sessionSchema.index({ subscriptionId: 1 });

const Session = mongoose.model('Session', sessionSchema);

export default Session;
