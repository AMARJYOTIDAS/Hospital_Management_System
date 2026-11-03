const mongoose = require('mongoose');
const { RECOVERY_STATUS } = require('../config/constants');

const medicalRecordSchema = new mongoose.Schema(
  {
    recordNumber: {
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
    appointment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Appointment',
    },
    examinationDate: {
      type: Date,
      default: Date.now,
      index: true,
    },
    vitalSigns: {
      bloodPressure: { type: String, default: '' }, // e.g. "120/80"
      heartRateBpm: { type: Number, default: null },
      temperatureCelsius: { type: Number, default: null },
      respiratoryRate: { type: Number, default: null },
      oxygenSaturationPct: { type: Number, default: null },
    },
    symptoms: [
      {
        type: String,
        trim: true,
      },
    ],
    clinicalObservations: {
      type: String,
      required: [true, 'Clinical observations are required'],
      trim: true,
    },
    diagnosis: {
      type: String,
      required: [true, 'Diagnosis is required'],
      trim: true,
    },
    treatmentPlan: {
      type: String,
      required: [true, 'Treatment plan is required'],
      trim: true,
    },
    labTestsOrdered: [
      {
        testName: { type: String, required: true },
        instructions: { type: String, default: '' },
        status: { type: String, enum: ['Ordered', 'In Progress', 'Completed'], default: 'Ordered' },
        reportUrl: { type: String, default: null },
      },
    ],
    recoveryStatus: {
      type: String,
      enum: Object.values(RECOVERY_STATUS),
      default: RECOVERY_STATUS.UNDER_TREATMENT,
      required: true,
      index: true,
    },
    followUpDate: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

medicalRecordSchema.index({ patient: 1, examinationDate: -1 });

module.exports = mongoose.model('MedicalRecord', medicalRecordSchema);
