import mongoose from 'mongoose';

const subscriptionSchema = new mongoose.Schema(
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
    planId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SubscriptionPlan',
      required: true,
    },
    status: {
      type: String,
      enum: ['active', 'expired', 'cancelled'],
      default: 'active',
    },
    startedAt: {
      type: Date,
      required: true,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    sessionsTotal: {
      type: Number,
      required: true,
      min: 1,
    },
    sessionsUsed: {
      type: Number,
      default: 0,
      min: 0,
    },
    autoRenew: {
      type: Boolean,
      default: false,
    },
    weeklySlots: [{
      dayIndex: {
        type: Number,
        min: 0,
        max: 6,
      },
      time: {
        type: String,
      },
    }],
    monthlyPrice: {
      type: mongoose.Schema.Types.Decimal128,
      required: true,
    },
    currency: {
      type: String,
      default: 'USD',
      maxlength: 3,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
subscriptionSchema.index({ studentId: 1, status: 1, expiresAt: 1 });
subscriptionSchema.index({ teacherId: 1 });
subscriptionSchema.index({ status: 1 });

const Subscription = mongoose.model('Subscription', subscriptionSchema);

export default Subscription;
