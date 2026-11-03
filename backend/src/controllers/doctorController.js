const Doctor = require('../models/Doctor');
const User = require('../models/User');
const { generateSequentialId } = require('../utils/idGenerator');
const { recordAudit } = require('../middlewares/auditLogger');
const { ROLES } = require('../config/constants');

// @desc    Register a new doctor profile
// @route   POST /api/v1/doctors
// @access  Private (Super Admin, Hospital Admin)
const addDoctor = async (req, res, next) => {
  try {
    const {
      userId,
      fullName,
      email,
      phone,
      specialization,
      qualification,
      experienceYears,
      department,
      consultationFee,
      availableDays,
      availableTimeSlots,
      isDepartmentHead,
      password,
    } = req.body;

    let targetUserId = userId;

    // If userId not provided, create a User record first
    if (!targetUserId) {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        targetUserId = existingUser._id;
      } else {
        const newUser = await User.create({
          name: fullName,
          email,
          password: password || 'Doctor@123',
          role: isDepartmentHead ? ROLES.DEPARTMENT_HEAD : ROLES.DOCTOR,
          phone,
          department,
        });
        targetUserId = newUser._id;
      }
    }

    // Check if Doctor profile already exists for this user
    const existingDoctor = await Doctor.findOne({ userId: targetUserId });
    if (existingDoctor) {
      return res.status(400).json({
        success: false,
        message: 'A doctor profile already exists for this user account.',
      });
    }

    const doctorId = await generateSequentialId('DOC', 'Doctor', 'doctorId');

    const doctor = await Doctor.create({
      doctorId,
      userId: targetUserId,
      fullName,
      email,
      phone,
      specialization,
      qualification,
      experienceYears,
      department,
      consultationFee,
      availableDays: availableDays || ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      availableTimeSlots: availableTimeSlots || [
        { startTime: '09:00', endTime: '13:00', slotDurationMinutes: 20 },
        { startTime: '14:00', endTime: '17:00', slotDurationMinutes: 20 },
      ],
      isDepartmentHead: Boolean(isDepartmentHead),
    });

    await recordAudit({
      req,
      action: 'DOCTOR_REGISTERED',
      module: 'DOCTOR',
      targetEntity: 'Doctor',
      targetId: doctor._id.toString(),
      details: { doctorId: doctor.doctorId, fullName: doctor.fullName },
    });

    res.status(201).json({
      success: true,
      message: 'Doctor profile created successfully',
      doctor,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all doctors with filters
// @route   GET /api/v1/doctors
// @access  Public / Authenticated
const getDoctors = async (req, res, next) => {
  try {
    const { department, specialization, status, search } = req.query;

    const filter = {};
    if (department) filter.department = department;
    if (specialization) filter.specialization = specialization;
    if (status) filter.employmentStatus = status;

    if (search) {
      filter.$or = [
        { fullName: { $regex: search, $options: 'i' } },
        { specialization: { $regex: search, $options: 'i' } },
        { doctorId: { $regex: search, $options: 'i' } },
      ];
    }

    const doctors = await Doctor.find(filter)
      .populate('department', 'name code locationBuilding locationFloor')
      .populate('userId', 'isActive profileImage')
      .sort({ fullName: 1 });

    res.status(200).json({
      success: true,
      count: doctors.length,
      doctors,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single doctor by ID or doctorId
// @route   GET /api/v1/doctors/:id
// @access  Public / Authenticated
const getDoctorById = async (req, res, next) => {
  try {
    const isObjectId = /^[0-9a-fA-F]{24}$/.test(req.params.id);
    const query = isObjectId ? { _id: req.params.id } : { doctorId: req.params.id };

    const doctor = await Doctor.findOne(query)
      .populate('department', 'name code locationBuilding locationFloor')
      .populate('userId', 'isActive profileImage');

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found',
      });
    }

    res.status(200).json({
      success: true,
      doctor,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update doctor profile & schedule
// @route   PUT /api/v1/doctors/:id
// @access  Private (Admin, Doctor self)
const updateDoctor = async (req, res, next) => {
  try {
    let doctor = await Doctor.findById(req.params.id);

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found',
      });
    }

    // Do not allow doctorId modification
    delete req.body.doctorId;

    doctor = await Doctor.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    }).populate('department', 'name code');

    await recordAudit({
      req,
      action: 'DOCTOR_UPDATED',
      module: 'DOCTOR',
      targetEntity: 'Doctor',
      targetId: doctor._id.toString(),
      details: req.body,
    });

    res.status(200).json({
      success: true,
      message: 'Doctor profile updated successfully',
      doctor,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update doctor employment status
// @route   PATCH /api/v1/doctors/:id/status
// @access  Private (Super Admin, Hospital Admin)
const updateDoctorStatus = async (req, res, next) => {
  try {
    const { employmentStatus } = req.body;

    const doctor = await Doctor.findById(req.params.id);
    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found',
      });
    }

    doctor.employmentStatus = employmentStatus;
    await doctor.save();

    await recordAudit({
      req,
      action: 'DOCTOR_STATUS_UPDATED',
      module: 'DOCTOR',
      targetEntity: 'Doctor',
      targetId: doctor._id.toString(),
      details: { employmentStatus },
    });

    res.status(200).json({
      success: true,
      message: `Doctor status updated to ${employmentStatus}`,
      doctor,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  addDoctor,
  getDoctors,
  getDoctorById,
  updateDoctor,
  updateDoctorStatus,
};
