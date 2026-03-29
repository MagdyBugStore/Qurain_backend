import mongoose from 'mongoose';

const studentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    timezone: {
      type: String,
      maxlength: 64,
      default: null,
    },
    notes: {
      type: String,
      default: null,
    },
    goals: {
      type: [String],
      default: [],
    },
    ageGroup: {
      type: String,
      enum: ['child', 'youth', 'adult'],
      default: null,
    },
    level: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced'],
      default: null,
    },
    learningGoal: {
      type: [String],
      default: [],
    },
    completed: {
      type: Boolean,
      default: false,
    },
    profileCompletedAt: {
      type: Date,
      default: null,
    },
    tasks: {
      type: [
        {
          title: {
            type: String,
            required: true,
          },
          description: {
            type: String,
            default: null,
          },
          status: {
            type: String,
            enum: ['pending', 'in_progress', 'completed', 'cancelled'],
            default: 'pending',
          },
          dueDate: {
            type: Date,
            required: true,
          },
          completedAt: {
            type: Date,
            default: null,
          },
          priority: {
            type: String,
            enum: ['low', 'medium', 'high'],
            default: 'medium',
          },
        },
      ],
      default: [],
    },
    activities: {
      type: [
        {
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
      ],
      default: [],
    },
    memorizationLogs: {
      type: [
        {
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
      ],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

// Note: userId already has unique index from unique: true

const Student = mongoose.model('Student', studentSchema);

export default Student;
