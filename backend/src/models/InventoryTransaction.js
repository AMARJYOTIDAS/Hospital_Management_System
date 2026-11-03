const mongoose = require('mongoose');
const { INVENTORY_TXN_TYPE } = require('../config/constants');

const inventoryTransactionSchema = new mongoose.Schema(
  {
    transactionNumber: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    medicine: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Medicine',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: Object.values(INVENTORY_TXN_TYPE),
      required: true,
      index: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: [1, 'Quantity must be at least 1'],
    },
    previousStock: {
      type: Number,
      required: true,
    },
    newStock: {
      type: Number,
      required: true,
    },
    unitCost: {
      type: Number,
      default: 0,
    },
    totalAmount: {
      type: Number,
      default: 0,
    },
    supplier: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Supplier',
    },
    prescription: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Prescription',
    },
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Patient',
    },
    reason: {
      type: String,
      trim: true,
    },
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    transactionDate: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: false,
  }
);

inventoryTransactionSchema.index({ medicine: 1, transactionDate: -1 });

module.exports = mongoose.model('InventoryTransaction', inventoryTransactionSchema);
