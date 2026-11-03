const express = require('express');
const { body } = require('express-validator');
const {
  register,
  login,
  getMe,
  updatePassword,
  toggleUserStatus,
  getAllUsers,
} = require('../controllers/authController');
const { protect } = require('../middlewares/auth');
const { authorize } = require('../middlewares/rbac');
const { validate } = require('../middlewares/validate');
const { ROLES } = require('../config/constants');

const router = express.Router();

// Validation chains
const registerValidation = [
  body('name').trim().notEmpty().withMessage('Full name is required'),
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  body('phone').trim().notEmpty().withMessage('Phone number is required'),
  validate,
];

const loginValidation = [
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('password').notEmpty().withMessage('Password is required'),
  validate,
];

const passwordValidation = [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword')
    .isLength({ min: 6 })
    .withMessage('New password must be at least 6 characters long'),
  validate,
];

// Routes
router.post('/register', registerValidation, register);
router.post('/login', loginValidation, login);
router.get('/me', protect, getMe);
router.put('/update-password', protect, passwordValidation, updatePassword);

// Administrative routes
router.get(
  '/users',
  protect,
  authorize(ROLES.SUPER_ADMIN, ROLES.HOSPITAL_ADMIN),
  getAllUsers
);

router.patch(
  '/users/:id/status',
  protect,
  authorize(ROLES.SUPER_ADMIN, ROLES.HOSPITAL_ADMIN),
  toggleUserStatus
);

module.exports = router;
