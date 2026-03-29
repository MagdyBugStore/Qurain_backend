import mongoose from 'mongoose';

const uploadedFileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    filename: {
      type: String,
      required: true,
    },
    originalName: {
      type: String,
      required: true,
    },
    size: {
      type: Number,
      required: true,
    },
    mimeType: {
      type: String,
      required: true,
    },
    url: {
      type: String,
      required: true,
    },
    fileType: {
      type: String,
      enum: ['image', 'video'],
      required: true,
    },
    processing: {
      type: Boolean,
      default: false,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

uploadedFileSchema.index({ userId: 1, createdAt: -1 });
uploadedFileSchema.index({ fileType: 1 });

const UploadedFile = mongoose.model('UploadedFile', uploadedFileSchema);

export default UploadedFile;
