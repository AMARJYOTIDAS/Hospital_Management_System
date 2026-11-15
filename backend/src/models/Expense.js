const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema(
  {
    expenseId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Expense title is required'],
      trim: true,
    },
    category: {
      type: String,
      enum: [
        'MEDICAL_SUPPLIES',
        'PHARMACEUTICALS',
        'SALARIES',
        'UTILITIES',
        'EQUIPMENT_MAINTENANCE',
        'FACILITY_RENT',
        'ADMINISTRATIVE',
        'OTHER',
      ],
      default: 'MEDICAL_SUPPLIES',
    },
    amount: {
      type: Number,
      required: [true, 'Expense amount is required'],
      min: 0,
    },
    paymentMethod: {
      type: String,
      enum: ['CASH', 'BANK_TRANSFER', 'CHEQUE', 'CREDIT_CARD'],
      default: 'BANK_TRANSFER',
    },
    vendor: {
      type: String,
      default: '',
    },
    date: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      enum: ['PENDING', 'APPROVED', 'PAID'],
      default: 'PAID',
    },
    receiptNumber: {
      type: String,
      default: '',
    },
    notes: {
      type: String,
      default: '',
    },
    recordedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Expense', expenseSchema);
