const express = require('express');
const { body } = require('express-validator');
const {
  addMedicine,
  getMedicines,
  recordStockIn,
  recordStockOut,
  getTransactions,
  getPharmacyAnalytics,
  getSuppliers,
} = require('../controllers/pharmacyController');
const { protect } = require('../middlewares/auth');
const { authorize } = require('../middlewares/rbac');
const { validate } = require('../middlewares/validate');
const { ROLES } = require('../config/constants');

const router = express.Router();

const medicineValidation = [
  body('name').trim().notEmpty().withMessage('Medicine name is required'),
  body('category').trim().notEmpty().withMessage('Category is required'),
  body('manufacturer').trim().notEmpty().withMessage('Manufacturer is required'),
  body('batchNumber').trim().notEmpty().withMessage('Batch number is required'),
  body('purchasePrice').isFloat({ min: 0 }).withMessage('Valid purchase price required'),
  body('sellingPrice').isFloat({ min: 0 }).withMessage('Valid selling price required'),
  body('expiryDate').isISO8601().withMessage('Valid expiry date required'),
  validate,
];

const stockInValidation = [
  body('medicineId').notEmpty().withMessage('Medicine ID required'),
  body('quantity').isInt({ min: 1 }).withMessage('Quantity must be >= 1'),
  validate,
];

const stockOutValidation = [
  body('medicineId').notEmpty().withMessage('Medicine ID required'),
  body('quantity').isInt({ min: 1 }).withMessage('Quantity must be >= 1'),
  validate,
];

router.get('/medicines', protect, getMedicines);
router.post(
  '/medicines',
  protect,
  authorize(ROLES.PHARMACIST, ROLES.SUPER_ADMIN, ROLES.HOSPITAL_ADMIN),
  medicineValidation,
  addMedicine
);

router.post(
  '/stock-in',
  protect,
  authorize(ROLES.PHARMACIST, ROLES.SUPER_ADMIN, ROLES.HOSPITAL_ADMIN),
  stockInValidation,
  recordStockIn
);

router.post(
  '/stock-out',
  protect,
  authorize(ROLES.PHARMACIST),
  stockOutValidation,
  recordStockOut
);

router.get('/transactions', protect, getTransactions);
router.get('/analytics', protect, getPharmacyAnalytics);
router.get('/suppliers', protect, getSuppliers);

module.exports = router;
