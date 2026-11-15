const express = require('express');
const {
  getAdmissions,
  getAdmissionById,
  createAdmission,
  dischargePatient,
  getRoomsAndBeds,
  createRoom,
  createBed,
} = require('../controllers/admissionController');
const { protect } = require('../middlewares/auth');
const { authorize } = require('../middlewares/rbac');
const { ROLES } = require('../config/constants');

const router = express.Router();

router.use(protect);

router.get('/rooms-beds', getRoomsAndBeds);
router.post('/rooms', authorize(ROLES.SUPER_ADMIN, ROLES.HOSPITAL_ADMIN), createRoom);
router.post('/beds', authorize(ROLES.SUPER_ADMIN, ROLES.HOSPITAL_ADMIN), createBed);

router
  .route('/')
  .get(getAdmissions)
  .post(
    authorize(ROLES.SUPER_ADMIN, ROLES.HOSPITAL_ADMIN, ROLES.DOCTOR, ROLES.RECEPTIONIST),
    createAdmission
  );

router.route('/:id').get(getAdmissionById);

router.put(
  '/:id/discharge',
  authorize(ROLES.SUPER_ADMIN, ROLES.HOSPITAL_ADMIN, ROLES.DOCTOR),
  dischargePatient
);

module.exports = router;
