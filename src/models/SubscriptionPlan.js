import mongoose from 'mongoose';

const subscriptionPlanSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    planId: {
      type: String,
      required: true,
      unique: true,
      enum: ['starter', 'premium', 'elite'],
    },
    sessionsPerPeriod: {
      type: Number,
      required: true,
      min: 1,
    },
    periodType: {
      type: String,
      enum: ['monthly'],
      required: true,
    },
    price: {
      type: mongoose.Schema.Types.Decimal128,
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    durationMinutes: {
      type: Number,
      default: 60,
    },
  },
  {
    timestamps: true,
  }
);

subscriptionPlanSchema.index({ planId: 1, isActive: 1 });

const SubscriptionPlan = mongoose.model('SubscriptionPlan', subscriptionPlanSchema);

export default SubscriptionPlan;
