const Facility = require('../models/Facility');
const { generateSequentialId } = require('../utils/idGenerator');
const { recordAudit } = require('../middlewares/auditLogger');

// @desc    Get all facilities
// @route   GET /api/v1/facilities
// @access  Private
const getFacilities = async (req, res, next) => {
  try {
    const { status, type } = req.query;
    const query = {};
    if (status) query.status = status;
    if (type) query.facilityType = type;

    const facilities = await Facility.find(query)
      .populate('department', 'name code')
      .populate('inCharge', 'name email role')
      .sort({ name: 1 });

    const total = facilities.length;
    const operational = facilities.filter((f) => f.status === 'AVAILABLE' || f.status === 'OCCUPIED').length;
    const underMaintenance = facilities.filter((f) => f.status === 'UNDER_MAINTENANCE' || f.status === 'STERILIZING').length;

    res.status(200).json({
      success: true,
      summary: {
        total,
        operational,
        underMaintenance,
      },
      data: facilities,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new facility
// @route   POST /api/v1/facilities
// @access  Private (Admin)
const createFacility = async (req, res, next) => {
  try {
    const facilityId = await generateSequentialId('FAC', 'Facility', 'facilityId');

    const facility = await Facility.create({
      ...req.body,
      facilityId,
    });

    await recordAudit({
      req,
      action: 'FACILITY_CREATED',
      module: 'FACILITIES',
      targetEntity: 'Facility',
      targetId: facility._id.toString(),
      details: { facilityId, name: facility.name },
    });

    res.status(201).json({
      success: true,
      data: facility,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update facility status
// @route   PATCH /api/v1/facilities/:id/status
// @access  Private (Admin, Department Head)
const updateFacilityStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const facility = await Facility.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    );

    if (!facility) {
      return res.status(404).json({ success: false, message: 'Facility not found' });
    }

    res.status(200).json({
      success: true,
      data: facility,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Add equipment to facility
// @route   POST /api/v1/facilities/:id/equipment
// @access  Private (Admin, Department Head)
const addEquipment = async (req, res, next) => {
  try {
    const facility = await Facility.findById(req.params.id);
    if (!facility) {
      return res.status(404).json({ success: false, message: 'Facility not found' });
    }

    facility.equipment.push(req.body);
    await facility.save();

    res.status(201).json({
      success: true,
      data: facility,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getFacilities,
  createFacility,
  updateFacilityStatus,
  addEquipment,
};
