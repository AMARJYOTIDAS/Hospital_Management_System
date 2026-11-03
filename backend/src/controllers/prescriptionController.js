const mongoose = require('mongoose');
const Prescription = require('../models/Prescription');
const Medicine = require('../models/Medicine');
const InventoryTransaction = require('../models/InventoryTransaction');
const Doctor = require('../models/Doctor');
const Patient = require('../models/Patient');
const { generateSequentialId } = require('../utils/idGenerator');
const { recordAudit } = require('../middlewares/auditLogger');
const { INVENTORY_TXN_TYPE } = require('../config/constants');

// @desc    Issue a new prescription
// @route   POST /api/v1/prescriptions
// @access  Private (Doctor)
const createPrescription = async (req, res, next) => {
  try {
    const { patientId, doctorId, medicalRecordId, medicines, notes } = req.body;

    const patient = await Patient.findById(patientId);
    if (!patient) {
      return res.status(404).json({ success: false, message: 'Patient not found' });
    }

    let targetDoctorId = doctorId;
    if (!targetDoctorId) {
      const docProfile = await Doctor.findOne({ userId: req.user._id });
      if (!docProfile) {
        return res.status(400).json({ success: false, message: 'Doctor profile required to issue prescription' });
      }
      targetDoctorId = docProfile._id;
    }

    if (!medicines || medicines.length === 0) {
      return res.status(400).json({ success: false, message: 'Prescription must contain at least one medicine' });
    }

    const prescriptionNumber = await generateSequentialId('RX', 'Prescription', 'prescriptionNumber');

    const prescription = await Prescription.create({
      prescriptionNumber,
      patient: patientId,
      doctor: targetDoctorId,
      medicalRecord: medicalRecordId || null,
      medicines,
      notes: notes || '',
      status: 'Issued',
    });

    await recordAudit({
      req,
      action: 'PRESCRIPTION_ISSUED',
      module: 'CLINICAL',
      targetEntity: 'Prescription',
      targetId: prescription._id.toString(),
      details: {
        prescriptionNumber: prescription.prescriptionNumber,
        itemCount: medicines.length,
      },
    });

    res.status(201).json({
      success: true,
      message: 'Prescription issued successfully',
      prescription,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all prescriptions with filters
// @route   GET /api/v1/prescriptions
// @access  Private (Doctor, Pharmacist, Admin, Patient)
const getPrescriptions = async (req, res, next) => {
  try {
    const { patient, status, page = 1, limit = 20 } = req.query;

    const filter = {};
    if (patient) filter.patient = patient;
    if (status) filter.status = status;

    const skip = (Number(page) - 1) * Number(limit);
    const prescriptions = await Prescription.find(filter)
      .populate('patient', 'patientId fullName phone bloodGroup')
      .populate('doctor', 'doctorId fullName specialization')
      .populate('medicines.medicine', 'medicineId name genericName availableQuantity')
      .populate('dispensedBy', 'name role')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    const total = await Prescription.countDocuments(filter);

    res.status(200).json({
      success: true,
      count: prescriptions.length,
      total,
      prescriptions,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get prescription by ID
// @route   GET /api/v1/prescriptions/:id
// @access  Private
const getPrescriptionById = async (req, res, next) => {
  try {
    const prescription = await Prescription.findById(req.params.id)
      .populate('patient', 'patientId fullName phone bloodGroup dateOfBirth gender address')
      .populate('doctor', 'doctorId fullName specialization')
      .populate('medicines.medicine')
      .populate('dispensedBy', 'name role');

    if (!prescription) {
      return res.status(404).json({ success: false, message: 'Prescription not found' });
    }

    res.status(200).json({
      success: true,
      prescription,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Dispense prescription & deduct stock (Inventory OUT)
// @route   PATCH /api/v1/prescriptions/:id/dispense
// @access  Private (Pharmacist, Admin)
const dispensePrescription = async (req, res, next) => {
  try {
    const prescription = await Prescription.findById(req.params.id)
      .populate('patient', 'fullName patientId');

    if (!prescription) {
      return res.status(404).json({ success: false, message: 'Prescription not found' });
    }

    if (prescription.status === 'Dispensed') {
      return res.status(400).json({ success: false, message: 'This prescription has already been fully dispensed.' });
    }

    // 1. Verify stock availability for all prescribed medicines first
    for (const item of prescription.medicines) {
      const medicine = await Medicine.findById(item.medicine);
      if (!medicine) {
        return res.status(404).json({ success: false, message: `Medicine record not found` });
      }

      const qtyToDispense = item.quantityPrescribed - item.quantityDispensed;
      if (qtyToDispense > 0 && medicine.availableQuantity < qtyToDispense) {
        return res.status(400).json({
          success: false,
          message: `Insufficient inventory for '${medicine.name}'. Required: ${qtyToDispense}, Available: ${medicine.availableQuantity}`,
        });
      }
    }

    // 2. Deduct stock and create Stock OUT audit transactions
    for (const item of prescription.medicines) {
      const qtyToDispense = item.quantityPrescribed - item.quantityDispensed;
      if (qtyToDispense <= 0) continue;

      const medicine = await Medicine.findById(item.medicine);
      const prevStock = medicine.availableQuantity;
      const newStock = prevStock - qtyToDispense;

      medicine.availableQuantity = newStock;
      await medicine.save();

      item.quantityDispensed = item.quantityPrescribed;

      const txnNumber = await generateSequentialId('TXN', 'InventoryTransaction', 'transactionNumber');
      await InventoryTransaction.create({
        transactionNumber: txnNumber,
        medicine: medicine._id,
        type: INVENTORY_TXN_TYPE.OUT,
        quantity: qtyToDispense,
        previousStock: prevStock,
        newStock: newStock,
        unitCost: medicine.sellingPrice,
        totalAmount: qtyToDispense * medicine.sellingPrice,
        prescription: prescription._id,
        patient: prescription.patient._id,
        reason: `Prescription Dispensed #${prescription.prescriptionNumber}`,
        performedBy: req.user._id,
      });
    }

    prescription.status = 'Dispensed';
    prescription.dispensedBy = req.user._id;
    prescription.dispensedAt = new Date();
    await prescription.save();

    await recordAudit({
      req,
      action: 'PRESCRIPTION_DISPENSED',
      module: 'PHARMACY',
      targetEntity: 'Prescription',
      targetId: prescription._id.toString(),
      details: {
        prescriptionNumber: prescription.prescriptionNumber,
        patient: prescription.patient.fullName,
      },
    });

    res.status(200).json({
      success: true,
      message: 'Prescription dispensed and pharmacy stock updated successfully',
      prescription,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createPrescription,
  getPrescriptions,
  getPrescriptionById,
  dispensePrescription,
};
