const express = require('express');
const { body } = require('express-validator');
const {
  bookAppointment,
  getAppointments,
  getMyAppointments,
  updateAppointmentStatus,
  rescheduleAppointment,
} = require('../controllers/appointmentController');
const { protect } = require('../middlewares/auth');
const { authorize } = require('../middlewares/rbac');
const { validate } = require('../middlewares/validate');
const { ROLES, APPOINTMENT_STATUS } = require('../config/constants');

const router = express.Router();

const bookingValidation = [
  body('patientId').notEmpty().withMessage('Patient ID is required'),
  body('doctorId').notEmpty().withMessage('Doctor ID is required'),
  body('appointmentDate').isISO8601().withMessage('Valid appointment date is required'),
  body('timeSlot.startTime').notEmpty().withMessage('Slot start time is required'),
  body('timeSlot.endTime').notEmpty().withMessage('Slot end time is required'),
  validate,
];

router.post(
  '/',
  protect,
  authorize(ROLES.SUPER_ADMIN, ROLES.HOSPITAL_ADMIN, ROLES.RECEPTIONIST, ROLES.PATIENT),
  bookingValidation,
  bookAppointment
);

router.get(
  '/',
  protect,
  authorize(
    ROLES.SUPER_ADMIN,
    ROLES.HOSPITAL_ADMIN,
    ROLES.DOCTOR,
    ROLES.RECEPTIONIST,
    ROLES.DEPARTMENT_HEAD
  ),
  getAppointments
);

router.get('/my-appointments', protect, getMyAppointments);

router.patch(
  '/:id/status',
  protect,
  authorize(ROLES.SUPER_ADMIN, ROLES.HOSPITAL_ADMIN, ROLES.DOCTOR, ROLES.RECEPTIONIST),
  [
    body('status')
      .isIn(Object.values(APPOINTMENT_STATUS))
      .withMessage('Valid status is required'),
    validate,
  ],
  updateAppointmentStatus
);

router.put(
  '/:id/reschedule',
  protect,
  authorize(ROLES.SUPER_ADMIN, ROLES.HOSPITAL_ADMIN, ROLES.RECEPTIONIST, ROLES.PATIENT),
  [
    body('newDate').isISO8601().withMessage('Valid date required'),
    body('newTimeSlot.startTime').notEmpty().withMessage('Start time required'),
    body('newTimeSlot.endTime').notEmpty().withMessage('End time required'),
    validate,
  ],
  rescheduleAppointment
);

module.exports = router;
