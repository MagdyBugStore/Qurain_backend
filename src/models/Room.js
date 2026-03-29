import mongoose from 'mongoose';

const roomSchema = new mongoose.Schema(
  {
    sessionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Session',
      required: true,
      unique: true,
    },
    title: {
      type: String,
      default: null,
    },
    roomId: {
      type: String,
      required: true,
      unique: true,
    },
    joinUrl: {
      type: String,
      default: null,
    },
    participants: [{
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
      },
      joinedAt: {
        type: Date,
        default: Date.now,
      },
      leftAt: {
        type: Date,
        default: null,
      },
    }],
    status: {
      type: String,
      enum: ['active', 'ended'],
      default: 'active',
    },
    startedAt: {
      type: Date,
      default: Date.now,
    },
    endedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
// Note: sessionId and roomId already have unique indexes from unique: true
roomSchema.index({ status: 1 });

const Room = mongoose.model('Room', roomSchema);

export default Room;
