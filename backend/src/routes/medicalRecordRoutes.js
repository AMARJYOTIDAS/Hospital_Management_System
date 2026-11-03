const express = require('express');
const { body } = require('express-validator');
const {
  createMedicalRecord,
  getMedicalRecordsByPatient,
  getMedicalRecordById,
  updateMedicalRecord,
} = require('../controllers/medicalRecordController');
const { protect } = require('../middlewares/auth');
const { authorize } = require('../middlewares/rbac');
const { validate } = require('../middlewares/validate');
const { ROLES } = require('../config/constants');

const router = express.Router();

const recordValidation = [
  body('patientId').notEmpty().withMessage('Patient reference is required'),
  body('clinicalObservations').trim().notEmpty().withMessage('Clinical observations are required'),
  body('diagnosis').trim().notEmpty().withMessage('Diagnosis is required'),
  body('treatmentPlan').trim().notEmpty().withMessage('Treatment plan is required'),
  validate,
];

router.post(
  '/',
  protect,
  authorize(ROLES.DOCTOR, ROLES.DEPARTMENT_HEAD),
  recordValidation,
  createMedicalRecord
);

router.get('/patient/:patientId', protect, getMedicalRecordsByPatient);
router.get('/:id', protect, getMedicalRecordById);

router.put(
  '/:id',
  protect,
  authorize(ROLES.DOCTOR, ROLES.DEPARTMENT_HEAD),
  updateMedicalRecord
);

module.exports = router;
