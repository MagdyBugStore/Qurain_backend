import mongoose from 'mongoose';

const ijazahSchema = new mongoose.Schema(
  {
    teacherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Teacher',
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    issuer: {
      type: String,
      trim: true,
      default: null,
    },
    issuedYear: {
      type: Number,
      min: 1900,
      max: new Date().getFullYear(),
      default: null,
    },
    certificateUrl: {
      type: String,
      default: null,
    },
    description: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

ijazahSchema.index({ teacherId: 1 });

const Ijazah = mongoose.model('Ijazah', ijazahSchema);

export default Ijazah;
