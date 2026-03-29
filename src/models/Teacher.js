import mongoose from 'mongoose';

const teacherSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    approvalStatus: {
      type: String,
      enum: ['incomplete', 'pending', 'approved', 'rejected', 'suspended'],
      default: 'incomplete',
    },
    bio: {
      type: String,
      default: null,
    },
    experienceYears: {
      type: Number,
      min: 0,
      default: null,
    },
    sessionPrice: {
      type: mongoose.Schema.Types.Decimal128,
      default: null,
    },
    ratingAvg: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    ratingCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    approvedAt: {
      type: Date,
      default: null,
    },
    teachingStyle: {
      type: String,
      default: null,
    },
    sessionContent: {
      type: String,
      default: null,
    },
    introVideo: {
      type: String,
      default: null,
    },
    languages: {
      type: [{
        type: String,
        enum: ['ar', 'en'],
      }],
      default: [],
    },
    qualifications: {
      type: [
        {
          title: {
            type: String,
            required: true,
            trim: true,
            maxlength: 255,
          },
          issuer: {
            type: String,
            trim: true,
            maxlength: 255,
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
        },
      ],
      default: [],
    },
    ijazahs: {
      type: [
        {
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
      ],
      default: [],
    },
    certificates: {
      type: [
        {
          filename: { type: String, required: true },
          originalName: { type: String, required: true },
          size: { type: Number, required: true },
          mimeType: { type: String, required: true },
          url: { type: String, required: true },
          uploadedAt: { type: Date, default: Date.now },
        },
      ],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
// Note: userId already has unique index from unique: true
teacherSchema.index({ approvalStatus: 1, ratingAvg: -1 });

const Teacher = mongoose.model('Teacher', teacherSchema);

export default Teacher;
