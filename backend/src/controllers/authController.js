const User = require('../models/User');
const Patient = require('../models/Patient');
const { generateSequentialId } = require('../utils/idGenerator');
const { ROLES } = require('../config/constants');
const { recordAudit } = require('../middlewares/auditLogger');
const logger = require('../utils/logger');

// @desc    Register a new user (Patients can self-register, Staff by Admin)
// @route   POST /api/v1/auth/register
// @access  Public (for Patient role) / Admin (for staff roles)
const register = async (req, res, next) => {
  try {
    const { name, email, password, role, phone, department } = req.body;

    // Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({
        success: false,
        message: 'A user with this email address already exists.',
      });
    }

    // Role restrictions
    const requestedRole = role || ROLES.PATIENT;

    // If requesting non-patient role, require Super Admin or Hospital Admin
    if (requestedRole !== ROLES.PATIENT) {
      if (!req.user || (req.user.role !== ROLES.SUPER_ADMIN && req.user.role !== ROLES.HOSPITAL_ADMIN)) {
        return res.status(403).json({
          success: false,
          message: 'Only Hospital Administrators can create staff accounts.',
        });
      }
    }

    const user = await User.create({
      name,
      email,
      password,
      role: requestedRole,
      phone,
      department: department || null,
    });

    // If registering as a Patient, auto-create associated Patient profile
    if (requestedRole === ROLES.PATIENT) {
      try {
        const patientId = await generateSequentialId('PID', 'Patient', 'patientId');
        await Patient.create({
          patientId,
          userId: user._id,
          fullName: user.name,
          dateOfBirth: req.body.dateOfBirth || new Date('1995-01-01'),
          gender: req.body.gender || 'Other',
          bloodGroup: req.body.bloodGroup || 'O+',
          phone: user.phone,
          email: user.email,
          address: req.body.address || {},
          emergencyContact: req.body.emergencyContact || {
            name: 'Emergency Contact',
            relationship: 'Family',
            phone: user.phone,
          },
          registeredBy: user._id,
        });
      } catch (err) {
        logger.error(`Failed to auto-create Patient profile: ${err.message}`);
      }
    }

    await recordAudit({
      req,
      action: 'USER_REGISTERED',
      module: 'AUTH',
      targetEntity: 'User',
      targetId: user._id.toString(),
      details: { role: user.role, email: user.email },
    });

    const token = user.generateAuthToken();

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        department: user.department,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Authenticate user & get JWT token
// @route   POST /api/v1/auth/login
// @access  Public
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both email and password.',
      });
    }

    // Find user by email including password field
    const user = await User.findOne({ email }).select('+password').populate('department', 'name code');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password credentials.',
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Your account has been deactivated. Please contact the administrator.',
      });
    }

    // Check if password matches
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password credentials.',
      });
    }

    // Update lastLogin
    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    // Generate JWT
    const token = user.generateAuthToken();

    await recordAudit({
      req: { ...req, user },
      action: 'USER_LOGIN',
      module: 'AUTH',
      targetEntity: 'User',
      targetId: user._id.toString(),
      details: { role: user.role, email: user.email },
    });

    res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        department: user.department,
        lastLogin: user.lastLogin,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get current logged in user profile
// @route   GET /api/v1/auth/me
// @access  Private
const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).populate('department', 'name code');

    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        department: user.department,
        isActive: user.isActive,
        createdAt: user.createdAt,
        lastLogin: user.lastLogin,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update current user password
// @route   PUT /api/v1/auth/update-password
// @access  Private
const updatePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user.id).select('+password');

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Current password provided is incorrect.',
      });
    }

    user.password = newPassword;
    await user.save();

    await recordAudit({
      req,
      action: 'PASSWORD_UPDATED',
      module: 'AUTH',
      targetEntity: 'User',
      targetId: user._id.toString(),
    });

    const token = user.generateAuthToken();

    res.status(200).json({
      success: true,
      message: 'Password updated successfully',
      token,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Toggle user active/inactive status
// @route   PATCH /api/v1/auth/users/:id/status
// @access  Private (Super Admin, Hospital Admin)
const toggleUserStatus = async (req, res, next) => {
  try {
    const { isActive } = req.body;
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
      });
    }

    // Cannot deactivate super admin by hospital admin
    if (user.role === ROLES.SUPER_ADMIN && req.user.role !== ROLES.SUPER_ADMIN) {
      return res.status(403).json({
        success: false,
        message: 'Permission denied: Cannot modify Super Admin status.',
      });
    }

    user.isActive = Boolean(isActive);
    await user.save({ validateBeforeSave: false });

    await recordAudit({
      req,
      action: 'USER_STATUS_TOGGLED',
      module: 'AUTH',
      targetEntity: 'User',
      targetId: user._id.toString(),
      details: { newStatus: user.isActive },
    });

    res.status(200).json({
      success: true,
      message: `User account has been ${user.isActive ? 'activated' : 'deactivated'}.`,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all users with filtering
// @route   GET /api/v1/auth/users
// @access  Private (Super Admin, Hospital Admin)
const getAllUsers = async (req, res, next) => {
  try {
    const { role, isActive, search, page = 1, limit = 20 } = req.query;

    const filter = {};
    if (role) filter.role = role;
    if (typeof isActive !== 'undefined') filter.isActive = isActive === 'true';
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);
    const users = await User.find(filter)
      .select('-password')
      .populate('department', 'name code')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    const total = await User.countDocuments(filter);

    res.status(200).json({
      success: true,
      count: users.length,
      total,
      totalPages: Math.ceil(total / Number(limit)),
      currentPage: Number(page),
      users,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  getMe,
  updatePassword,
  toggleUserStatus,
  getAllUsers,
};
