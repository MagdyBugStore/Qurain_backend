import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
    },
    sessionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Session',
      default: null,
    },
    subscriptionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subscription',
      default: null,
    },
    paymentModel: {
      type: String,
      enum: ['pay_per_session', 'monthly_subscription'],
      required: true,
    },
    amount: {
      type: mongoose.Schema.Types.Decimal128,
      required: true,
    },
    currency: {
      type: String,
      default: 'USD',
      maxlength: 3,
    },
    gateway: {
      type: String,
      required: true,
      maxlength: 64,
    },
    gatewayTransactionId: {
      type: String,
      required: true,
      unique: true,
      maxlength: 255,
    },
    status: {
      type: String,
      enum: ['pending', 'succeeded', 'failed', 'refunded', 'partially_refunded'],
      required: true,
      default: 'pending',
    },
    paidAt: {
      type: Date,
      default: null,
    },
    clientSecret: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Validation: one of sessionId or subscriptionId must be present
paymentSchema.pre('validate', function(next) {
  if (!this.sessionId && !this.subscriptionId) {
    next(new Error('Either sessionId or subscriptionId is required'));
  } else {
    next();
  }
});

// Indexes
// Note: gatewayTransactionId already has unique index from unique: true
paymentSchema.index({ studentId: 1, createdAt: -1 });
paymentSchema.index({ sessionId: 1 });
paymentSchema.index({ subscriptionId: 1 });
paymentSchema.index({ status: 1 });

const Payment = mongoose.model('Payment', paymentSchema);

export default Payment;
