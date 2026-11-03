const Patient = require('../models/Patient');
const { generateSequentialId } = require('../utils/idGenerator');
const { recordAudit } = require('../middlewares/auditLogger');

// @desc    Register a new patient
// @route   POST /api/v1/patients
// @access  Private (Super Admin, Hospital Admin, Receptionist, Doctor)
const registerPatient = async (req, res, next) => {
  try {
    const {
      fullName,
      dateOfBirth,
      gender,
      bloodGroup,
      phone,
      email,
      address,
      emergencyContact,
      medicalHistory,
      userId,
    } = req.body;

    const patientId = await generateSequentialId('PID', 'Patient', 'patientId');

    const patient = await Patient.create({
      patientId,
      userId: userId || null,
      fullName,
      dateOfBirth,
      gender,
      bloodGroup,
      phone,
      email: email || '',
      address: address || {},
      emergencyContact,
      medicalHistory: medicalHistory || {
        allergies: [],
        chronicConditions: [],
        pastSurgeries: [],
        notes: '',
      },
      registeredBy: req.user ? req.user._id : null,
    });

    await recordAudit({
      req,
      action: 'PATIENT_REGISTERED',
      module: 'PATIENT',
      targetEntity: 'Patient',
      targetId: patient._id.toString(),
      details: { patientId: patient.patientId, fullName: patient.fullName },
    });

    res.status(201).json({
      success: true,
      message: 'Patient registered successfully',
      patient,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all patients with pagination, search, and filters
// @route   GET /api/v1/patients
// @access  Private (All Hospital Staff)
const getPatients = async (req, res, next) => {
  try {
    const { search, bloodGroup, status, page = 1, limit = 15 } = req.query;

    const filter = {};
    if (bloodGroup) filter.bloodGroup = bloodGroup;
    if (status) filter.status = status;

    if (search) {
      filter.$or = [
        { fullName: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { patientId: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);
    const patients = await Patient.find(filter)
      .populate('registeredBy', 'name role')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    const total = await Patient.countDocuments(filter);

    res.status(200).json({
      success: true,
      count: patients.length,
      total,
      totalPages: Math.ceil(total / Number(limit)),
      currentPage: Number(page),
      patients,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single patient by ID or PID
// @route   GET /api/v1/patients/:id
// @access  Private (Hospital Staff, Patient self)
const getPatientById = async (req, res, next) => {
  try {
    const isObjectId = /^[0-9a-fA-F]{24}$/.test(req.params.id);
    const query = isObjectId ? { _id: req.params.id } : { patientId: req.params.id };

    const patient = await Patient.findOne(query).populate('registeredBy', 'name role');

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found',
      });
    }

    res.status(200).json({
      success: true,
      patient,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update patient information
// @route   PUT /api/v1/patients/:id
// @access  Private (Admin, Receptionist, Doctor)
const updatePatient = async (req, res, next) => {
  try {
    let patient = await Patient.findById(req.params.id);

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found',
      });
    }

    // Do not allow patientId or registeredBy modification
    delete req.body.patientId;
    delete req.body.registeredBy;

    patient = await Patient.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    await recordAudit({
      req,
      action: 'PATIENT_UPDATED',
      module: 'PATIENT',
      targetEntity: 'Patient',
      targetId: patient._id.toString(),
      details: req.body,
    });

    res.status(200).json({
      success: true,
      message: 'Patient updated successfully',
      patient,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  registerPatient,
  getPatients,
  getPatientById,
  updatePatient,
};
