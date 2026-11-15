const mongoose = require('mongoose');

const equipmentItemSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  modelNumber: String,
  serialNumber: String,
  status: {
    type: String,
    enum: ['FUNCTIONAL', 'UNDER_MAINTENANCE', 'REPAIR_NEEDED', 'DECOMMISSIONED'],
    default: 'FUNCTIONAL',
  },
  lastServiceDate: Date,
  nextServiceDate: Date,
});

const facilitySchema = new mongoose.Schema(
  {
    facilityId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Facility name is required'],
      trim: true,
    },
    facilityType: {
      type: String,
      enum: [
        'OPERATION_THEATER',
        'INTENSIVE_CARE_UNIT',
        'PATHOLOGY_LAB',
        'RADIOLOGY_IMAGING',
        'EMERGENCY_ROOM',
        'DIALYSIS_UNIT',
        'BLOOD_BANK',
        'PHARMACY_DEPOT',
      ],
      required: true,
    },
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      default: null,
    },
    location: {
      floor: String,
      wing: String,
      block: String,
    },
    status: {
      type: String,
      enum: ['AVAILABLE', 'OCCUPIED', 'UNDER_MAINTENANCE', 'STERILIZING', 'INACTIVE'],
      default: 'AVAILABLE',
    },
    capacity: {
      type: Number,
      default: 1,
    },
    inCharge: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    equipment: [equipmentItemSchema],
  },
  { timestamps: true }
);

module.exports = mongoose.model('Facility', facilitySchema);
