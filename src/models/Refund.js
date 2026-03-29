import mongoose from 'mongoose';

const refundSchema = new mongoose.Schema(
  {
    paymentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Payment',
      required: true,
    },
    amount: {
      type: mongoose.Schema.Types.Decimal128,
      required: true,
    },
    reason: {
      type: String,
      default: null,
    },
    status: {
      type: String,
      enum: ['pending', 'succeeded', 'failed'],
      required: true,
      default: 'pending',
    },
  },
  {
    timestamps: true,
  }
);

refundSchema.index({ paymentId: 1 });
refundSchema.index({ status: 1 });

const Refund = mongoose.model('Refund', refundSchema);

export default Refund;
