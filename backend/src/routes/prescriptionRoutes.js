const express = require('express');
const { body } = require('express-validator');
const {
  createPrescription,
  getPrescriptions,
  getPrescriptionById,
  dispensePrescription,
} = require('../controllers/prescriptionController');
const { protect } = require('../middlewares/auth');
const { authorize } = require('../middlewares/rbac');
const { validate } = require('../middlewares/validate');
const { ROLES } = require('../config/constants');

const router = express.Router();

const prescriptionValidation = [
  body('patientId').notEmpty().withMessage('Patient reference is required'),
  body('medicines').isArray({ min: 1 }).withMessage('At least one medicine is required'),
  body('medicines.*.medicine').notEmpty().withMessage('Medicine reference is required'),
  body('medicines.*.dosage').trim().notEmpty().withMessage('Dosage is required'),
  body('medicines.*.frequency').trim().notEmpty().withMessage('Frequency is required'),
  body('medicines.*.quantityPrescribed').isInt({ min: 1 }).withMessage('Quantity must be >= 1'),
  validate,
];

router.post(
  '/',
  protect,
  authorize(ROLES.DOCTOR, ROLES.DEPARTMENT_HEAD),
  prescriptionValidation,
  createPrescription
);

router.get('/', protect, getPrescriptions);
router.get('/:id', protect, getPrescriptionById);

router.patch(
  '/:id/dispense',
  protect,
  authorize(ROLES.PHARMACIST, ROLES.SUPER_ADMIN, ROLES.HOSPITAL_ADMIN),
  dispensePrescription
);

module.exports = router;
