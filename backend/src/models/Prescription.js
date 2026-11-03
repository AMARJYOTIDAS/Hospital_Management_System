const mongoose = require('mongoose');

const prescriptionSchema = new mongoose.Schema(
  {
    prescriptionNumber: {
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
    medicalRecord: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MedicalRecord',
    },
    medicines: [
      {
        medicine: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Medicine',
          required: [true, 'Medicine reference is required'],
        },
        dosage: { type: String, required: [true, 'Dosage is required'] }, // e.g. "500mg"
        frequency: { type: String, required: [true, 'Frequency is required'] }, // e.g. "Twice daily after food"
        durationDays: { type: Number, required: [true, 'Duration in days is required'], min: 1 },
        quantityPrescribed: { type: Number, required: true, min: 1 },
        quantityDispensed: { type: Number, default: 0, min: 0 },
        instructions: { type: String, default: '' },
      },
    ],
    status: {
      type: String,
      enum: ['Issued', 'Partially Dispensed', 'Dispensed', 'Cancelled'],
      default: 'Issued',
      index: true,
    },
    dispensedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    dispensedAt: {
      type: Date,
      default: null,
    },
    notes: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

prescriptionSchema.index({ patient: 1, createdAt: -1 });

module.exports = mongoose.model('Prescription', prescriptionSchema);
