const Admission = require('../models/Admission');
const Room = require('../models/Room');
const Bed = require('../models/Bed');
const Patient = require('../models/Patient');
const { generateSequentialId } = require('../utils/idGenerator');
const { ADMISSION_STATUS, RECOVERY_STATUS } = require('../config/constants');
const { recordAudit } = require('../middlewares/auditLogger');

// @desc    Get all admissions with filtering & pagination
// @route   GET /api/v1/admissions
// @access  Private
const getAdmissions = async (req, res, next) => {
  try {
    const { status, patientId, doctorId, page = 1, limit = 20 } = req.query;
    const query = {};

    if (status) query.status = status;
    if (doctorId) query.doctor = doctorId;
    if (patientId) query.patient = patientId;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const admissions = await Admission.find(query)
      .populate('patient', 'patientId fullName phone gender bloodGroup dateOfBirth')
      .populate('doctor', 'doctorId fullName specialization department')
      .populate('room', 'roomNumber roomType floor dailyRate')
      .populate('bed', 'bedNumber bedType')
      .populate('admittedBy', 'name email role')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Admission.countDocuments(query);

    res.status(200).json({
      success: true,
      count: admissions.length,
      total,
      pages: Math.ceil(total / parseInt(limit)),
      data: admissions,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get admission by ID
// @route   GET /api/v1/admissions/:id
// @access  Private
const getAdmissionById = async (req, res, next) => {
  try {
    const admission = await Admission.findById(req.params.id)
      .populate('patient', 'patientId fullName phone gender bloodGroup dateOfBirth address emergencyContact')
      .populate('doctor', 'doctorId fullName specialization department consultationFee phone')
      .populate('room', 'roomNumber roomType floor dailyRate')
      .populate('bed', 'bedNumber bedType status')
      .populate('admittedBy', 'name email role');

    if (!admission) {
      return res.status(404).json({
        success: false,
        message: 'Admission record not found',
      });
    }

    res.status(200).json({
      success: true,
      data: admission,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Admit a patient to a bed/room
// @route   POST /api/v1/admissions
// @access  Private (Admin, Doctor, Receptionist)
const createAdmission = async (req, res, next) => {
  try {
    const { patient, doctor, room, bed, reasonForAdmission, initialDiagnosis } = req.body;

    // Check if bed is available
    const bedDoc = await Bed.findById(bed);
    if (!bedDoc) {
      return res.status(404).json({ success: false, message: 'Bed not found' });
    }
    if (bedDoc.isOccupied || bedDoc.status !== 'AVAILABLE') {
      return res.status(400).json({
        success: false,
        message: `Bed ${bedDoc.bedNumber} is already occupied or not available.`,
      });
    }

    const admissionId = await generateSequentialId('ADM', 'Admission', 'admissionId');

    const admission = await Admission.create({
      admissionId,
      patient,
      doctor,
      room,
      bed,
      admissionDate: new Date(),
      reasonForAdmission,
      initialDiagnosis,
      status: ADMISSION_STATUS.ADMITTED,
      recoveryStatus: RECOVERY_STATUS.UNDER_TREATMENT,
      admittedBy: req.user._id,
    });

    // Mark bed occupied
    bedDoc.isOccupied = true;
    bedDoc.status = 'OCCUPIED';
    bedDoc.currentPatient = patient;
    bedDoc.currentAdmission = admission._id;
    await bedDoc.save();

    await recordAudit({
      req,
      action: 'PATIENT_ADMISSION',
      module: 'ADMISSION',
      targetEntity: 'Admission',
      targetId: admission._id.toString(),
      details: { admissionId, bedId: bedDoc.bedNumber, patientId: patient },
    });

    const populated = await Admission.findById(admission._id)
      .populate('patient', 'patientId fullName phone')
      .populate('doctor', 'doctorId fullName specialization')
      .populate('room', 'roomNumber roomType dailyRate')
      .populate('bed', 'bedNumber bedType');

    res.status(201).json({
      success: true,
      message: 'Patient admitted successfully',
      data: populated,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Discharge a patient & release bed
// @route   PUT /api/v1/admissions/:id/discharge
// @access  Private (Admin, Doctor)
const dischargePatient = async (req, res, next) => {
  try {
    const { dischargeDiagnosis, recoveryStatus, instructions, medications, followUpDate, conditionAtDischarge } = req.body;

    const admission = await Admission.findById(req.params.id);
    if (!admission) {
      return res.status(404).json({ success: false, message: 'Admission record not found' });
    }

    if (admission.status === ADMISSION_STATUS.DISCHARGED) {
      return res.status(400).json({ success: false, message: 'Patient is already discharged' });
    }

    admission.status = ADMISSION_STATUS.DISCHARGED;
    admission.dischargeDate = new Date();
    admission.dischargeDiagnosis = dischargeDiagnosis || admission.initialDiagnosis;
    admission.recoveryStatus = recoveryStatus || RECOVERY_STATUS.RECOVERED;
    admission.dischargeSummary = {
      instructions: instructions || 'Take prescribed medications and rest.',
      medications: medications || 'Continue regular medication as advised.',
      followUpDate: followUpDate || null,
      conditionAtDischarge: conditionAtDischarge || 'Stable and improved',
    };
    await admission.save();

    // Release bed
    if (admission.bed) {
      const bedDoc = await Bed.findById(admission.bed);
      if (bedDoc) {
        bedDoc.isOccupied = false;
        bedDoc.status = 'AVAILABLE';
        bedDoc.currentPatient = null;
        bedDoc.currentAdmission = null;
        await bedDoc.save();
      }
    }

    await recordAudit({
      req,
      action: 'PATIENT_DISCHARGE',
      module: 'ADMISSION',
      targetEntity: 'Admission',
      targetId: admission._id.toString(),
      details: {
        admissionId: admission.admissionId,
        recoveryStatus: admission.recoveryStatus,
      },
    });

    res.status(200).json({
      success: true,
      message: 'Patient discharged successfully and bed released',
      data: admission,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all rooms and their beds
// @route   GET /api/v1/admissions/rooms-beds
// @access  Private
const getRoomsAndBeds = async (req, res, next) => {
  try {
    const rooms = await Room.find().populate('department', 'name code').sort({ roomNumber: 1 });
    const beds = await Bed.find()
      .populate('currentPatient', 'patientId fullName phone')
      .populate('currentAdmission', 'admissionId admissionDate initialDiagnosis')
      .sort({ bedNumber: 1 });

    const totalBeds = beds.length;
    const occupiedBeds = beds.filter((b) => b.isOccupied).length;
    const availableBeds = totalBeds - occupiedBeds;
    const occupancyRate = totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0;

    res.status(200).json({
      success: true,
      summary: {
        totalRooms: rooms.length,
        totalBeds,
        occupiedBeds,
        availableBeds,
        occupancyRate,
      },
      rooms,
      beds,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new room
// @route   POST /api/v1/admissions/rooms
// @access  Private (Admin)
const createRoom = async (req, res, next) => {
  try {
    const room = await Room.create(req.body);
    res.status(201).json({ success: true, data: room });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new bed
// @route   POST /api/v1/admissions/beds
// @access  Private (Admin)
const createBed = async (req, res, next) => {
  try {
    const bed = await Bed.create(req.body);
    res.status(201).json({ success: true, data: bed });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAdmissions,
  getAdmissionById,
  createAdmission,
  dischargePatient,
  getRoomsAndBeds,
  createRoom,
  createBed,
};
