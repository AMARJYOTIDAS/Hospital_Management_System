const express = require('express');
const { body } = require('express-validator');
const {
  addDoctor,
  getDoctors,
  getDoctorById,
  updateDoctor,
  updateDoctorStatus,
} = require('../controllers/doctorController');
const { protect } = require('../middlewares/auth');
const { authorize } = require('../middlewares/rbac');
const { validate } = require('../middlewares/validate');
const { ROLES } = require('../config/constants');

const router = express.Router();

const doctorValidation = [
  body('fullName').trim().notEmpty().withMessage('Doctor full name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('phone').trim().notEmpty().withMessage('Phone number is required'),
  body('specialization').trim().notEmpty().withMessage('Specialization is required'),
  body('qualification').trim().notEmpty().withMessage('Qualification is required'),
  body('department').notEmpty().withMessage('Department reference is required'),
  body('consultationFee').isNumeric().withMessage('Valid consultation fee is required'),
  validate,
];

router.get('/', getDoctors);
router.get('/:id', getDoctorById);

router.post(
  '/',
  protect,
  authorize(ROLES.SUPER_ADMIN, ROLES.HOSPITAL_ADMIN),
  doctorValidation,
  addDoctor
);

router.put(
  '/:id',
  protect,
  authorize(ROLES.SUPER_ADMIN, ROLES.HOSPITAL_ADMIN, ROLES.DOCTOR),
  updateDoctor
);

router.patch(
  '/:id/status',
  protect,
  authorize(ROLES.SUPER_ADMIN, ROLES.HOSPITAL_ADMIN),
  updateDoctorStatus
);

module.exports = router;
