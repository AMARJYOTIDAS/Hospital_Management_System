const mongoose = require('mongoose');
const { ADMISSION_STATUS, RECOVERY_STATUS } = require('../config/constants');

const admissionSchema = new mongoose.Schema(
  {
    admissionId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Patient',
      required: [true, 'Patient reference is required'],
    },
    doctor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Doctor',
      required: [true, 'Attending Doctor is required'],
    },
    room: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Room',
      required: [true, 'Room reference is required'],
    },
    bed: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Bed',
      required: [true, 'Bed reference is required'],
    },
    admissionDate: {
      type: Date,
      default: Date.now,
      required: true,
    },
    dischargeDate: {
      type: Date,
      default: null,
    },
    reasonForAdmission: {
      type: String,
      required: [true, 'Reason for admission is required'],
      trim: true,
    },
    initialDiagnosis: {
      type: String,
      default: '',
    },
    dischargeDiagnosis: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: Object.values(ADMISSION_STATUS),
      default: ADMISSION_STATUS.ADMITTED,
    },
    recoveryStatus: {
      type: String,
      enum: Object.values(RECOVERY_STATUS),
      default: RECOVERY_STATUS.UNDER_TREATMENT,
    },
    dischargeSummary: {
      instructions: String,
      medications: String,
      followUpDate: Date,
      conditionAtDischarge: String,
    },
    admittedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Admission', admissionSchema);
