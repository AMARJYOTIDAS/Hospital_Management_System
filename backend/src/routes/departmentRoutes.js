const express = require('express');
const { body } = require('express-validator');
const {
  getDepartments,
  getDepartmentById,
  createDepartment,
  updateDepartment,
} = require('../controllers/departmentController');
const { protect } = require('../middlewares/auth');
const { authorize } = require('../middlewares/rbac');
const { validate } = require('../middlewares/validate');
const { ROLES } = require('../config/constants');

const router = express.Router();

const departmentValidation = [
  body('name').trim().notEmpty().withMessage('Department name is required'),
  body('code').trim().notEmpty().withMessage('Department code is required'),
  validate,
];

router.get('/', getDepartments);
router.get('/:id', protect, getDepartmentById);

router.post(
  '/',
  protect,
  authorize(ROLES.SUPER_ADMIN),
  departmentValidation,
  createDepartment
);

router.put(
  '/:id',
  protect,
  authorize(ROLES.SUPER_ADMIN, ROLES.HOSPITAL_ADMIN),
  updateDepartment
);

module.exports = router;
