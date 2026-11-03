const mongoose = require('mongoose');

const patientSchema = new mongoose.Schema(
  {
    patientId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      unique: true,
      sparse: true,
    },
    fullName: {
      type: String,
      required: [true, 'Patient full name is required'],
      trim: true,
      index: true,
    },
    dateOfBirth: {
      type: Date,
      required: [true, 'Date of birth is required'],
    },
    gender: {
      type: String,
      enum: ['Male', 'Female', 'Other'],
      required: [true, 'Gender is required'],
    },
    bloodGroup: {
      type: String,
      enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
      required: [true, 'Blood group is required'],
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true,
      index: true,
    },
    email: {
      type: String,
      lowercase: true,
      trim: true,
      default: '',
    },
    address: {
      street: { type: String, default: '' },
      city: { type: String, default: '' },
      state: { type: String, default: '' },
      zipCode: { type: String, default: '' },
    },
    emergencyContact: {
      name: { type: String, required: [true, 'Emergency contact name is required'] },
      relationship: { type: String, required: [true, 'Emergency contact relationship is required'] },
      phone: { type: String, required: [true, 'Emergency contact phone is required'] },
    },
    medicalHistory: {
      allergies: [{ type: String, trim: true }],
      chronicConditions: [{ type: String, trim: true }],
      pastSurgeries: [{ type: String, trim: true }],
      notes: { type: String, default: '' },
    },
    registrationDate: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      enum: ['Active', 'Admitted', 'Discharged', 'Deceased'],
      default: 'Active',
    },
    registeredBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

patientSchema.index({ fullName: 'text', phone: 'text', patientId: 'text' });

module.exports = mongoose.model('Patient', patientSchema);
