import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    role: {
      type: String,
      enum: ['student', 'teacher', 'admin'],
      required: false,
      default: null,
    },
    fullName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 150,
    },
    email: {
      type: String,
      unique: true,
      sparse: true,
      lowercase: true,
      trim: true,
      maxlength: 255,
      validate: {
        validator: function(v) {
          return !v || /^\S+@\S+\.\S+$/.test(v);
        },
        message: 'Invalid email format',
      },
    },
    phone: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
      maxlength: 30,
    },
    passwordHash: {
      type: String,
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    preferredLanguage: {
      type: String,
      enum: ['ar', 'en'],
      default: 'ar',
    },
    avatar: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Validation: at least one of email or phone is required
userSchema.pre('validate', function(next) {
  if (!this.email && !this.phone) {
    next(new Error('Either email or phone is required'));
  } else {
    next();
  }
});

// Indexes
// Note: email and phone already have unique indexes from unique: true
userSchema.index({ role: 1, isActive: 1 });

const User = mongoose.model('User', userSchema);

export default User;
