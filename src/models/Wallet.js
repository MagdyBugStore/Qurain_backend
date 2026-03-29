import mongoose from 'mongoose';

const walletSchema = new mongoose.Schema(
  {
    teacherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Teacher',
      required: true,
      unique: true,
    },
    balance: {
      type: mongoose.Schema.Types.Decimal128,
      default: 0,
      required: true,
    },
    currency: {
      type: String,
      default: 'SAR',
      maxlength: 3,
    },
  },
  {
    timestamps: true,
  }
);

// Note: teacherId already has unique index from unique: true

const Wallet = mongoose.model('Wallet', walletSchema);

export default Wallet;
