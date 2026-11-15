const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema(
  {
    roomNumber: {
      type: String,
      required: [true, 'Room number is required'],
      unique: true,
      trim: true,
    },
    roomType: {
      type: String,
      enum: ['GENERAL', 'SEMI_PRIVATE', 'PRIVATE', 'ICU', 'EMERGENCY', 'ISOLATION'],
      default: 'GENERAL',
    },
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      required: false,
    },
    floor: {
      type: String,
      default: '1st Floor',
      trim: true,
    },
    dailyRate: {
      type: Number,
      required: [true, 'Daily rate is required'],
      min: 0,
      default: 50,
    },
    totalBeds: {
      type: Number,
      required: true,
      default: 2,
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'MAINTENANCE', 'DECOMMISSIONED'],
      default: 'ACTIVE',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Room', roomSchema);
