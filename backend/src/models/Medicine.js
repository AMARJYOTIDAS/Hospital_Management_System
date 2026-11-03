const mongoose = require('mongoose');

const medicineSchema = new mongoose.Schema(
  {
    medicineId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Medicine commercial name is required'],
      trim: true,
      index: true,
    },
    genericName: {
      type: String,
      trim: true,
      index: true,
    },
    category: {
      type: String,
      enum: [
        'Antibiotic',
        'Analgesic',
        'Antiviral',
        'Cardiovascular',
        'Antidiabetic',
        'Respiratory',
        'Gastrointestinal',
        'Other',
      ],
      required: [true, 'Medicine category is required'],
    },
    manufacturer: {
      type: String,
      required: [true, 'Manufacturer is required'],
      trim: true,
    },
    batchNumber: {
      type: String,
      required: [true, 'Batch number is required'],
      trim: true,
    },
    purchasePrice: {
      type: Number,
      required: [true, 'Purchase price is required'],
      min: [0, 'Purchase price cannot be negative'],
    },
    sellingPrice: {
      type: Number,
      required: [true, 'Selling price is required'],
      min: [0, 'Selling price cannot be negative'],
    },
    availableQuantity: {
      type: Number,
      required: true,
      min: [0, 'Available stock cannot be negative'],
      default: 0,
    },
    minimumStockLevel: {
      type: Number,
      required: true,
      min: [0, 'Minimum stock level cannot be negative'],
      default: 15,
    },
    expiryDate: {
      type: Date,
      required: [true, 'Expiry date is required'],
      index: true,
    },
    supplier: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Supplier',
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

medicineSchema.index({ name: 'text', genericName: 'text', manufacturer: 'text' });
medicineSchema.index({ availableQuantity: 1, minimumStockLevel: 1 });

module.exports = mongoose.model('Medicine', medicineSchema);
