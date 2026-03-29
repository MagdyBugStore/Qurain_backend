import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema(
  {
    sessionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Session',
      required: true,
      unique: true,
    },
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
    stars: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    comment: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
// Note: sessionId already has unique index from unique: true
reviewSchema.index({ teacherId: 1, createdAt: -1 });
reviewSchema.index({ studentId: 1 });

const Review = mongoose.model('Review', reviewSchema);

export default Review;
