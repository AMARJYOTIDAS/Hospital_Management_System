const mongoose = require('mongoose');

const departmentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Department name is required'],
      unique: true,
      trim: true,
    },
    code: {
      type: String,
      required: [true, 'Department code is required'],
      unique: true,
      uppercase: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    headOfDepartment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    locationBuilding: {
      type: String,
      default: 'Main Wing',
    },
    locationFloor: {
      type: String,
      default: '1st Floor',
    },
    budgetAllocated: {
      type: Number,
      default: 0,
      min: [0, 'Budget cannot be negative'],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Department', departmentSchema);
