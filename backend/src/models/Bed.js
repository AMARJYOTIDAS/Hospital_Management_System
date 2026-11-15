const mongoose = require('mongoose');

const bedSchema = new mongoose.Schema(
  {
    bedNumber: {
      type: String,
      required: [true, 'Bed number is required'],
      unique: true,
      trim: true,
    },
    room: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Room',
      required: [true, 'Room reference is required'],
    },
    bedType: {
      type: String,
      enum: ['STANDARD', 'ICU', 'ELECTRIC', 'PEDIATRIC'],
      default: 'STANDARD',
    },
    isOccupied: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: ['AVAILABLE', 'OCCUPIED', 'CLEANING', 'MAINTENANCE'],
      default: 'AVAILABLE',
    },
    currentPatient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Patient',
      default: null,
    },
    currentAdmission: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admission',
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Bed', bedSchema);
