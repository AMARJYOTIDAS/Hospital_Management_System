const Appointment = require('../models/Appointment');
const Doctor = require('../models/Doctor');
const Patient = require('../models/Patient');
const { generateSequentialId } = require('../utils/idGenerator');
const { recordAudit } = require('../middlewares/auditLogger');
const { APPOINTMENT_STATUS, ROLES } = require('../config/constants');

// @desc    Book a new appointment with slot conflict verification
// @route   POST /api/v1/appointments
// @access  Private (Patient, Receptionist, Admin)
const bookAppointment = async (req, res, next) => {
  try {
    const { patientId, doctorId, appointmentDate, timeSlot, symptoms } = req.body;

    // Validate Doctor
    const doctor = await Doctor.findById(doctorId).populate('department');
    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found',
      });
    }

    if (doctor.employmentStatus !== 'Active') {
      return res.status(400).json({
        success: false,
        message: `Doctor is currently ${doctor.employmentStatus} and not accepting appointments.`,
      });
    }

    // Validate Patient
    const patient = await Patient.findById(patientId);
    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found',
      });
    }

    // Date normalization to UTC day start
    const dateObj = new Date(appointmentDate);
    const startOfDay = new Date(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate());
    const endOfDay = new Date(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate(), 23, 59, 59, 999);

    // Slot Conflict Detection
    const conflictingAppointment = await Appointment.findOne({
      doctor: doctor._id,
      appointmentDate: { $gte: startOfDay, $lte: endOfDay },
      'timeSlot.startTime': timeSlot.startTime,
      status: { $in: [APPOINTMENT_STATUS.PENDING, APPOINTMENT_STATUS.CONFIRMED] },
    });

    if (conflictingAppointment) {
      return res.status(409).json({
        success: false,
        message: `Dr. ${doctor.fullName} already has a confirmed or pending appointment at ${timeSlot.startTime} on this date. Please choose another time slot.`,
      });
    }

    const appointmentNumber = await generateSequentialId('APT', 'Appointment', 'appointmentNumber');

    const appointment = await Appointment.create({
      appointmentNumber,
      patient: patient._id,
      doctor: doctor._id,
      department: doctor.department._id,
      appointmentDate: dateObj,
      timeSlot,
      symptoms: symptoms || '',
      status: APPOINTMENT_STATUS.CONFIRMED, // Auto-confirmed on direct booking
      fee: doctor.consultationFee,
      isPaid: false,
      bookedBy: req.user ? req.user._id : null,
    });

    await recordAudit({
      req,
      action: 'APPOINTMENT_BOOKED',
      module: 'APPOINTMENT',
      targetEntity: 'Appointment',
      targetId: appointment._id.toString(),
      details: {
        appointmentNumber: appointment.appointmentNumber,
        doctor: doctor.fullName,
        patient: patient.fullName,
        date: appointment.appointmentDate,
      },
    });

    res.status(201).json({
      success: true,
      message: 'Appointment booked successfully',
      appointment,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all appointments with filtering and pagination
// @route   GET /api/v1/appointments
// @access  Private (Staff & Admins)
const getAppointments = async (req, res, next) => {
  try {
    const { doctor, patient, department, status, date, page = 1, limit = 20 } = req.query;

    const filter = {};
    if (doctor) filter.doctor = doctor;
    if (patient) filter.patient = patient;
    if (department) filter.department = department;
    if (status) filter.status = status;

    if (date) {
      const d = new Date(date);
      filter.appointmentDate = {
        $gte: new Date(d.getFullYear(), d.getMonth(), d.getDate()),
        $lte: new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999),
      };
    }

    const skip = (Number(page) - 1) * Number(limit);
    const appointments = await Appointment.find(filter)
      .populate('patient', 'patientId fullName phone gender bloodGroup')
      .populate('doctor', 'doctorId fullName specialization consultationFee')
      .populate('department', 'name code')
      .sort({ appointmentDate: -1, 'timeSlot.startTime': 1 })
      .skip(skip)
      .limit(Number(limit));

    const total = await Appointment.countDocuments(filter);

    res.status(200).json({
      success: true,
      count: appointments.length,
      total,
      totalPages: Math.ceil(total / Number(limit)),
      currentPage: Number(page),
      appointments,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get appointments for currently authenticated user (Doctor or Patient)
// @route   GET /api/v1/appointments/my-appointments
// @access  Private (Doctor, Patient)
const getMyAppointments = async (req, res, next) => {
  try {
    const filter = {};

    if (req.user.role === ROLES.DOCTOR || req.user.role === ROLES.DEPARTMENT_HEAD) {
      const doctorProfile = await Doctor.findOne({ userId: req.user._id });
      if (!doctorProfile) {
        return res.status(404).json({ success: false, message: 'Doctor profile not found' });
      }
      filter.doctor = doctorProfile._id;
    } else if (req.user.role === ROLES.PATIENT) {
      const patientProfile = await Patient.findOne({ userId: req.user._id });
      if (!patientProfile) {
        return res.status(404).json({ success: false, message: 'Patient profile not found' });
      }
      filter.patient = patientProfile._id;
    }

    const appointments = await Appointment.find(filter)
      .populate('patient', 'patientId fullName phone gender bloodGroup')
      .populate('doctor', 'doctorId fullName specialization consultationFee')
      .populate('department', 'name code')
      .sort({ appointmentDate: -1, 'timeSlot.startTime': 1 });

    res.status(200).json({
      success: true,
      count: appointments.length,
      appointments,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update appointment status (e.g. Completed, Cancelled, No-show)
// @route   PATCH /api/v1/appointments/:id/status
// @access  Private (Staff, Doctor, Admin)
const updateAppointmentStatus = async (req, res, next) => {
  try {
    const { status, cancellationReason } = req.body;

    const appointment = await Appointment.findById(req.params.id)
      .populate('doctor', 'fullName')
      .populate('patient', 'fullName');

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found',
      });
    }

    appointment.status = status;
    if (cancellationReason) {
      appointment.cancellationReason = cancellationReason;
    }
    await appointment.save();

    await recordAudit({
      req,
      action: 'APPOINTMENT_STATUS_UPDATED',
      module: 'APPOINTMENT',
      targetEntity: 'Appointment',
      targetId: appointment._id.toString(),
      details: {
        appointmentNumber: appointment.appointmentNumber,
        newStatus: status,
        cancellationReason,
      },
    });

    res.status(200).json({
      success: true,
      message: `Appointment marked as ${status}`,
      appointment,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Reschedule appointment
// @route   PUT /api/v1/appointments/:id/reschedule
// @access  Private (Patient, Receptionist, Admin)
const rescheduleAppointment = async (req, res, next) => {
  try {
    const { newDate, newTimeSlot } = req.body;

    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found',
      });
    }

    const dateObj = new Date(newDate);
    const startOfDay = new Date(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate());
    const endOfDay = new Date(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate(), 23, 59, 59, 999);

    // Conflict check on new date and slot
    const conflict = await Appointment.findOne({
      _id: { $ne: appointment._id },
      doctor: appointment.doctor,
      appointmentDate: { $gte: startOfDay, $lte: endOfDay },
      'timeSlot.startTime': newTimeSlot.startTime,
      status: { $in: [APPOINTMENT_STATUS.PENDING, APPOINTMENT_STATUS.CONFIRMED] },
    });

    if (conflict) {
      return res.status(409).json({
        success: false,
        message: `Conflict: Doctor is already booked for ${newTimeSlot.startTime} on this date.`,
      });
    }

    appointment.appointmentDate = dateObj;
    appointment.timeSlot = newTimeSlot;
    appointment.status = APPOINTMENT_STATUS.CONFIRMED;
    await appointment.save();

    await recordAudit({
      req,
      action: 'APPOINTMENT_RESCHEDULED',
      module: 'APPOINTMENT',
      targetEntity: 'Appointment',
      targetId: appointment._id.toString(),
      details: {
        appointmentNumber: appointment.appointmentNumber,
        newDate,
        newTimeSlot,
      },
    });

    res.status(200).json({
      success: true,
      message: 'Appointment rescheduled successfully',
      appointment,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  bookAppointment,
  getAppointments,
  getMyAppointments,
  updateAppointmentStatus,
  rescheduleAppointment,
};
