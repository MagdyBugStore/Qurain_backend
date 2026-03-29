import mongoose from 'mongoose';

const availabilitySchema = new mongoose.Schema(
  {
    teacherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Teacher',
      required: true,
      unique: true,
    },
    schedule: {
      type: [[String]], // 7 days x 12 time slots
      required: true,
      validate: {
        validator: function(v) {
          return Array.isArray(v) && v.length === 7 && 
                 v.every(day => Array.isArray(day) && day.length === 12);
        },
        message: 'Schedule must be a 7x12 array',
      },
    },
  },
  {
    timestamps: true,
  }
);

// Note: teacherId already has unique index from unique: true

const Availability = mongoose.model('Availability', availabilitySchema);

export default Availability;
