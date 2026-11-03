const Medicine = require('../models/Medicine');
const Supplier = require('../models/Supplier');
const InventoryTransaction = require('../models/InventoryTransaction');
const { generateSequentialId } = require('../utils/idGenerator');
const { recordAudit } = require('../middlewares/auditLogger');
const { INVENTORY_TXN_TYPE } = require('../config/constants');

// @desc    Add new medicine to formulary
// @route   POST /api/v1/pharmacy/medicines
// @access  Private (Pharmacist, Admin)
const addMedicine = async (req, res, next) => {
  try {
    const {
      name,
      genericName,
      category,
      manufacturer,
      batchNumber,
      purchasePrice,
      sellingPrice,
      availableQuantity,
      minimumStockLevel,
      expiryDate,
      supplier,
    } = req.body;

    const medicineId = await generateSequentialId('MED', 'Medicine', 'medicineId');

    const medicine = await Medicine.create({
      medicineId,
      name,
      genericName,
      category,
      manufacturer,
      batchNumber,
      purchasePrice,
      sellingPrice,
      availableQuantity: availableQuantity || 0,
      minimumStockLevel: minimumStockLevel || 15,
      expiryDate,
      supplier: supplier || null,
    });

    // If initial stock > 0, record initial stock IN transaction
    if (availableQuantity && availableQuantity > 0) {
      const txnNumber = await generateSequentialId('TXN', 'InventoryTransaction', 'transactionNumber');
      await InventoryTransaction.create({
        transactionNumber: txnNumber,
        medicine: medicine._id,
        type: INVENTORY_TXN_TYPE.IN,
        quantity: availableQuantity,
        previousStock: 0,
        newStock: availableQuantity,
        unitCost: purchasePrice,
        totalAmount: availableQuantity * purchasePrice,
        supplier: supplier || null,
        reason: 'Initial Formulary Intake',
        performedBy: req.user._id,
      });
    }

    await recordAudit({
      req,
      action: 'MEDICINE_ADDED',
      module: 'PHARMACY',
      targetEntity: 'Medicine',
      targetId: medicine._id.toString(),
      details: { medicineId: medicine.medicineId, name: medicine.name },
    });

    res.status(201).json({
      success: true,
      message: 'Medicine added to catalog successfully',
      medicine,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all medicines with search & alerts
// @route   GET /api/v1/pharmacy/medicines
// @access  Private
const getMedicines = async (req, res, next) => {
  try {
    const { search, category, lowStock, nearExpiry } = req.query;

    const filter = { isActive: true };
    if (category) filter.category = category;

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { genericName: { $regex: search, $options: 'i' } },
        { manufacturer: { $regex: search, $options: 'i' } },
        { batchNumber: { $regex: search, $options: 'i' } },
        { medicineId: { $regex: search, $options: 'i' } },
      ];
    }

    let medicines = await Medicine.find(filter)
      .populate('supplier', 'name phone')
      .sort({ name: 1 });

    const now = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(now.getDate() + 30);

    if (lowStock === 'true') {
      medicines = medicines.filter((m) => m.availableQuantity <= m.minimumStockLevel);
    }

    if (nearExpiry === 'true') {
      medicines = medicines.filter((m) => new Date(m.expiryDate) <= thirtyDaysFromNow);
    }

    res.status(200).json({
      success: true,
      count: medicines.length,
      medicines,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Stock IN: Purchase / Restock medicines
// @route   POST /api/v1/pharmacy/stock-in
// @access  Private (Pharmacist, Admin)
const recordStockIn = async (req, res, next) => {
  try {
    const { medicineId, quantity, supplierId, unitCost, batchNumber, reason } = req.body;

    const medicine = await Medicine.findById(medicineId);
    if (!medicine) {
      return res.status(404).json({ success: false, message: 'Medicine not found' });
    }

    const qty = Number(quantity);
    if (isNaN(qty) || qty <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid quantity' });
    }

    const prevStock = medicine.availableQuantity;
    const newStock = prevStock + qty;

    medicine.availableQuantity = newStock;
    if (batchNumber) medicine.batchNumber = batchNumber;
    if (unitCost) medicine.purchasePrice = Number(unitCost);
    await medicine.save();

    const txnNumber = await generateSequentialId('TXN', 'InventoryTransaction', 'transactionNumber');
    const transaction = await InventoryTransaction.create({
      transactionNumber: txnNumber,
      medicine: medicine._id,
      type: INVENTORY_TXN_TYPE.IN,
      quantity: qty,
      previousStock: prevStock,
      newStock: newStock,
      unitCost: unitCost || medicine.purchasePrice,
      totalAmount: qty * (unitCost || medicine.purchasePrice),
      supplier: supplierId || medicine.supplier,
      reason: reason || 'Procurement Stock IN',
      performedBy: req.user._id,
    });

    await recordAudit({
      req,
      action: 'STOCK_IN_RECORDED',
      module: 'PHARMACY',
      targetEntity: 'InventoryTransaction',
      targetId: transaction._id.toString(),
      details: { medicine: medicine.name, quantityAdded: qty, newStock },
    });

    res.status(200).json({
      success: true,
      message: `Stock updated for ${medicine.name}. Added: ${qty}, New Total: ${newStock}`,
      transaction,
      medicine,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Stock OUT: Manual Dispensation / Disposal
// @route   POST /api/v1/pharmacy/stock-out
// @access  Private (Pharmacist)
const recordStockOut = async (req, res, next) => {
  try {
    const { medicineId, quantity, reason, type = INVENTORY_TXN_TYPE.OUT } = req.body;

    const medicine = await Medicine.findById(medicineId);
    if (!medicine) {
      return res.status(404).json({ success: false, message: 'Medicine not found' });
    }

    const qty = Number(quantity);
    if (isNaN(qty) || qty <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid quantity' });
    }

    if (medicine.availableQuantity < qty) {
      return res.status(400).json({
        success: false,
        message: `Insufficient stock for ${medicine.name}. Available: ${medicine.availableQuantity}, Requested: ${qty}`,
      });
    }

    const prevStock = medicine.availableQuantity;
    const newStock = prevStock - qty;

    medicine.availableQuantity = newStock;
    await medicine.save();

    const txnNumber = await generateSequentialId('TXN', 'InventoryTransaction', 'transactionNumber');
    const transaction = await InventoryTransaction.create({
      transactionNumber: txnNumber,
      medicine: medicine._id,
      type,
      quantity: qty,
      previousStock: prevStock,
      newStock: newStock,
      unitCost: medicine.sellingPrice,
      totalAmount: qty * medicine.sellingPrice,
      reason: reason || 'Stock OUT / Adjustment',
      performedBy: req.user._id,
    });

    await recordAudit({
      req,
      action: 'STOCK_OUT_RECORDED',
      module: 'PHARMACY',
      targetEntity: 'InventoryTransaction',
      targetId: transaction._id.toString(),
      details: { medicine: medicine.name, quantityDeducted: qty, newStock },
    });

    res.status(200).json({
      success: true,
      message: `Stock deducted for ${medicine.name}. Removed: ${qty}, Remaining: ${newStock}`,
      transaction,
      medicine,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get inventory audit transactions
// @route   GET /api/v1/pharmacy/transactions
// @access  Private (Pharmacist, Accountant, Admin)
const getTransactions = async (req, res, next) => {
  try {
    const { type, page = 1, limit = 20 } = req.query;

    const filter = {};
    if (type) filter.type = type;

    const skip = (Number(page) - 1) * Number(limit);
    const transactions = await InventoryTransaction.find(filter)
      .populate('medicine', 'medicineId name genericName batchNumber')
      .populate('performedBy', 'name role')
      .populate('supplier', 'name')
      .sort({ transactionDate: -1 })
      .skip(skip)
      .limit(Number(limit));

    const total = await InventoryTransaction.countDocuments(filter);

    res.status(200).json({
      success: true,
      count: transactions.length,
      total,
      transactions,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get pharmacy analytics & stock valuation
// @route   GET /api/v1/pharmacy/analytics
// @access  Private
const getPharmacyAnalytics = async (req, res, next) => {
  try {
    const medicines = await Medicine.find({ isActive: true });
    const now = new Date();
    const thirtyDays = new Date();
    thirtyDays.setDate(now.getDate() + 30);

    let totalStockUnits = 0;
    let inventoryValuation = 0;
    let lowStockCount = 0;
    let nearExpiryCount = 0;
    let expiredCount = 0;

    medicines.forEach((m) => {
      totalStockUnits += m.availableQuantity;
      inventoryValuation += m.availableQuantity * m.purchasePrice;

      if (m.availableQuantity <= m.minimumStockLevel) {
        lowStockCount += 1;
      }

      const expDate = new Date(m.expiryDate);
      if (expDate <= now) {
        expiredCount += 1;
      } else if (expDate <= thirtyDays) {
        nearExpiryCount += 1;
      }
    });

    res.status(200).json({
      success: true,
      analytics: {
        totalProducts: medicines.length,
        totalStockUnits,
        inventoryValuation: Math.round(inventoryValuation * 100) / 100,
        lowStockCount,
        nearExpiryCount,
        expiredCount,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get suppliers
// @route   GET /api/v1/pharmacy/suppliers
// @access  Private
const getSuppliers = async (req, res, next) => {
  try {
    const suppliers = await Supplier.find({ isActive: true }).sort({ name: 1 });
    res.status(200).json({ success: true, count: suppliers.length, suppliers });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  addMedicine,
  getMedicines,
  recordStockIn,
  recordStockOut,
  getTransactions,
  getPharmacyAnalytics,
  getSuppliers,
};
