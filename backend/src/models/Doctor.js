const mongoose = require('mongoose');

const doctorSchema = new mongoose.Schema(
  {
    doctorId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    fullName: {
      type: String,
      required: [true, 'Doctor full name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      lowercase: true,
      trim: true,
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true,
    },
    specialization: {
      type: String,
      required: [true, 'Specialization is required'],
      trim: true,
    },
    qualification: {
      type: String,
      required: [true, 'Qualification is required'],
      trim: true,
    },
    experienceYears: {
      type: Number,
      required: [true, 'Experience in years is required'],
      min: [0, 'Experience cannot be negative'],
    },
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      required: [true, 'Department is required'],
    },
    consultationFee: {
      type: Number,
      required: [true, 'Consultation fee is required'],
      min: [0, 'Consultation fee cannot be negative'],
    },
    availableDays: [
      {
        type: String,
        enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
      },
    ],
    availableTimeSlots: [
      {
        startTime: { type: String, required: true }, // e.g. "09:00"
        endTime: { type: String, required: true },   // e.g. "13:00"
        slotDurationMinutes: { type: Number, default: 20 },
      },
    ],
    profileImage: {
      type: String,
      default: null,
    },
    isDepartmentHead: {
      type: Boolean,
      default: false,
    },
    employmentStatus: {
      type: String,
      enum: ['Active', 'On Leave', 'Resigned', 'Suspended'],
      default: 'Active',
    },
  },
  {
    timestamps: true,
  }
);

doctorSchema.index({ department: 1, employmentStatus: 1 });
doctorSchema.index({ fullName: 'text', specialization: 'text' });

module.exports = mongoose.model('Doctor', doctorSchema);
