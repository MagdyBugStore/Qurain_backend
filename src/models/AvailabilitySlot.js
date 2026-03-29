import mongoose from 'mongoose';

const availabilitySlotSchema = new mongoose.Schema(
  {
    teacherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Teacher',
      required: true,
    },
    startTime: {
      type: Date,
      required: true,
    },
    endTime: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ['available', 'booked', 'blocked', 'cancelled'],
      default: 'available',
    },
  },
  {
    timestamps: true,
  }
);

// Validation: endTime must be after startTime
availabilitySlotSchema.pre('validate', function(next) {
  if (this.endTime <= this.startTime) {
    next(new Error('endTime must be after startTime'));
  } else {
    next();
  }
});

// Indexes
availabilitySlotSchema.index({ teacherId: 1, startTime: 1, status: 1 });
availabilitySlotSchema.index({ status: 1, startTime: 1 });

const AvailabilitySlot = mongoose.model('AvailabilitySlot', availabilitySlotSchema);

export default AvailabilitySlot;
