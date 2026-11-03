const mongoose = require('mongoose');
const { APPOINTMENT_STATUS } = require('../config/constants');

const appointmentSchema = new mongoose.Schema(
  {
    appointmentNumber: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Patient',
      required: [true, 'Patient reference is required'],
      index: true,
    },
    doctor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Doctor',
      required: [true, 'Doctor reference is required'],
      index: true,
    },
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      required: [true, 'Department reference is required'],
    },
    appointmentDate: {
      type: Date,
      required: [true, 'Appointment date is required'],
      index: true,
    },
    timeSlot: {
      startTime: { type: String, required: [true, 'Start time is required'] },
      endTime: { type: String, required: [true, 'End time is required'] },
    },
    symptoms: {
      type: String,
      trim: true,
      default: '',
    },
    status: {
      type: String,
      enum: Object.values(APPOINTMENT_STATUS),
      default: APPOINTMENT_STATUS.PENDING,
      index: true,
    },
    cancellationReason: {
      type: String,
      default: '',
    },
    fee: {
      type: Number,
      required: [true, 'Consultation fee is required'],
      min: [0, 'Fee cannot be negative'],
    },
    isPaid: {
      type: Boolean,
      default: false,
    },
    bookedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for schedule lookups and conflict detection
appointmentSchema.index({ doctor: 1, appointmentDate: 1, 'timeSlot.startTime': 1 });

module.exports = mongoose.model('Appointment', appointmentSchema);
