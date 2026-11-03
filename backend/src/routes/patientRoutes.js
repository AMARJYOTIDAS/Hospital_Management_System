const express = require('express');
const { body } = require('express-validator');
const {
  registerPatient,
  getPatients,
  getPatientById,
  updatePatient,
} = require('../controllers/patientController');
const { protect } = require('../middlewares/auth');
const { authorize } = require('../middlewares/rbac');
const { validate } = require('../middlewares/validate');
const { ROLES } = require('../config/constants');

const router = express.Router();

const patientValidation = [
  body('fullName').trim().notEmpty().withMessage('Patient full name is required'),
  body('dateOfBirth').isISO8601().withMessage('Valid date of birth is required'),
  body('gender').isIn(['Male', 'Female', 'Other']).withMessage('Valid gender is required'),
  body('bloodGroup')
    .isIn(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'])
    .withMessage('Valid blood group is required'),
  body('phone').trim().notEmpty().withMessage('Phone number is required'),
  body('emergencyContact.name').trim().notEmpty().withMessage('Emergency contact name is required'),
  body('emergencyContact.phone').trim().notEmpty().withMessage('Emergency contact phone is required'),
  validate,
];

router.post(
  '/',
  protect,
  authorize(ROLES.SUPER_ADMIN, ROLES.HOSPITAL_ADMIN, ROLES.RECEPTIONIST, ROLES.DOCTOR),
  patientValidation,
  registerPatient
);

router.get(
  '/',
  protect,
  authorize(
    ROLES.SUPER_ADMIN,
    ROLES.HOSPITAL_ADMIN,
    ROLES.DOCTOR,
    ROLES.RECEPTIONIST,
    ROLES.ACCOUNTANT,
    ROLES.DEPARTMENT_HEAD
  ),
  getPatients
);

router.get('/:id', protect, getPatientById);

router.put(
  '/:id',
  protect,
  authorize(ROLES.SUPER_ADMIN, ROLES.HOSPITAL_ADMIN, ROLES.RECEPTIONIST, ROLES.DOCTOR),
  updatePatient
);

module.exports = router;
