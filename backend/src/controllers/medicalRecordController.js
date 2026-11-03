const MedicalRecord = require('../models/MedicalRecord');
const Doctor = require('../models/Doctor');
const Patient = require('../models/Patient');
const Appointment = require('../models/Appointment');
const { generateSequentialId } = require('../utils/idGenerator');
const { recordAudit } = require('../middlewares/auditLogger');
const { APPOINTMENT_STATUS } = require('../config/constants');

// @desc    Create new medical record / clinical consultation
// @route   POST /api/v1/medical-records
// @access  Private (Doctor)
const createMedicalRecord = async (req, res, next) => {
  try {
    const {
      patientId,
      doctorId,
      appointmentId,
      vitalSigns,
      symptoms,
      clinicalObservations,
      diagnosis,
      treatmentPlan,
      labTestsOrdered,
      recoveryStatus,
      followUpDate,
    } = req.body;

    // Verify Patient
    const patient = await Patient.findById(patientId);
    if (!patient) {
      return res.status(404).json({ success: false, message: 'Patient not found' });
    }

    // Verify Doctor
    let targetDoctorId = doctorId;
    if (!targetDoctorId) {
      const docProfile = await Doctor.findOne({ userId: req.user._id });
      if (!docProfile) {
        return res.status(400).json({ success: false, message: 'Doctor profile required to create record' });
      }
      targetDoctorId = docProfile._id;
    }

    const recordNumber = await generateSequentialId('MR', 'MedicalRecord', 'recordNumber');

    const medicalRecord = await MedicalRecord.create({
      recordNumber,
      patient: patientId,
      doctor: targetDoctorId,
      appointment: appointmentId || null,
      vitalSigns: vitalSigns || {},
      symptoms: Array.isArray(symptoms) ? symptoms : symptoms ? symptoms.split(',').map((s) => s.trim()) : [],
      clinicalObservations,
      diagnosis,
      treatmentPlan,
      labTestsOrdered: labTestsOrdered || [],
      recoveryStatus: recoveryStatus || 'Under Treatment',
      followUpDate: followUpDate || null,
    });

    // If appointment is provided, mark it as Completed
    if (appointmentId) {
      await Appointment.findByIdAndUpdate(appointmentId, {
        status: APPOINTMENT_STATUS.COMPLETED,
      });
    }

    await recordAudit({
      req,
      action: 'MEDICAL_RECORD_CREATED',
      module: 'CLINICAL',
      targetEntity: 'MedicalRecord',
      targetId: medicalRecord._id.toString(),
      details: {
        recordNumber: medicalRecord.recordNumber,
        patient: patient.fullName,
        diagnosis,
        recoveryStatus: medicalRecord.recoveryStatus,
      },
    });

    res.status(201).json({
      success: true,
      message: 'Medical record created successfully',
      medicalRecord,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get clinical records by patient ID
// @route   GET /api/v1/medical-records/patient/:patientId
// @access  Private (Doctor, Admin, Patient self)
const getMedicalRecordsByPatient = async (req, res, next) => {
  try {
    const isObjectId = /^[0-9a-fA-F]{24}$/.test(req.params.patientId);
    let patientObjId = req.params.patientId;

    if (!isObjectId) {
      const patient = await Patient.findOne({ patientId: req.params.patientId });
      if (!patient) {
        return res.status(404).json({ success: false, message: 'Patient not found' });
      }
      patientObjId = patient._id;
    }

    const records = await MedicalRecord.find({ patient: patientObjId })
      .populate('doctor', 'doctorId fullName specialization')
      .populate('patient', 'patientId fullName phone bloodGroup')
      .sort({ examinationDate: -1 });

    res.status(200).json({
      success: true,
      count: records.length,
      records,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single medical record by ID
// @route   GET /api/v1/medical-records/:id
// @access  Private (Doctor, Admin, Patient self)
const getMedicalRecordById = async (req, res, next) => {
  try {
    const record = await MedicalRecord.findById(req.params.id)
      .populate('doctor', 'doctorId fullName specialization')
      .populate('patient', 'patientId fullName phone bloodGroup dateOfBirth gender');

    if (!record) {
      return res.status(404).json({ success: false, message: 'Medical record not found' });
    }

    res.status(200).json({
      success: true,
      record,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update medical record & recovery status
// @route   PUT /api/v1/medical-records/:id
// @access  Private (Doctor)
const updateMedicalRecord = async (req, res, next) => {
  try {
    let record = await MedicalRecord.findById(req.params.id);
    if (!record) {
      return res.status(404).json({ success: false, message: 'Medical record not found' });
    }

    record = await MedicalRecord.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    await recordAudit({
      req,
      action: 'MEDICAL_RECORD_UPDATED',
      module: 'CLINICAL',
      targetEntity: 'MedicalRecord',
      targetId: record._id.toString(),
      details: req.body,
    });

    res.status(200).json({
      success: true,
      message: 'Medical record updated successfully',
      record,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createMedicalRecord,
  getMedicalRecordsByPatient,
  getMedicalRecordById,
  updateMedicalRecord,
};
