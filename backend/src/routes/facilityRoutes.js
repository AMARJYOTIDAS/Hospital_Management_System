const express = require('express');
const {
  getFacilities,
  createFacility,
  updateFacilityStatus,
  addEquipment,
} = require('../controllers/facilityController');
const { protect } = require('../middlewares/auth');
const { authorize } = require('../middlewares/rbac');
const { ROLES } = require('../config/constants');

const router = express.Router();

router.use(protect);

router
  .route('/')
  .get(getFacilities)
  .post(authorize(ROLES.SUPER_ADMIN, ROLES.HOSPITAL_ADMIN), createFacility);

router.patch(
  '/:id/status',
  authorize(ROLES.SUPER_ADMIN, ROLES.HOSPITAL_ADMIN, ROLES.DEPARTMENT_HEAD),
  updateFacilityStatus
);

router.post(
  '/:id/equipment',
  authorize(ROLES.SUPER_ADMIN, ROLES.HOSPITAL_ADMIN, ROLES.DEPARTMENT_HEAD),
  addEquipment
);

module.exports = router;
