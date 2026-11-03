const Department = require('../models/Department');
const { recordAudit } = require('../middlewares/auditLogger');

// @desc    Get all active departments
// @route   GET /api/v1/departments
// @access  Public / Authenticated
const getDepartments = async (req, res, next) => {
  try {
    const departments = await Department.find({ isActive: true })
      .populate('headOfDepartment', 'name email phone')
      .sort({ name: 1 });

    res.status(200).json({
      success: true,
      count: departments.length,
      departments,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single department by ID
// @route   GET /api/v1/departments/:id
// @access  Authenticated
const getDepartmentById = async (req, res, next) => {
  try {
    const department = await Department.findById(req.params.id).populate(
      'headOfDepartment',
      'name email phone'
    );

    if (!department) {
      return res.status(404).json({
        success: false,
        message: 'Department not found',
      });
    }

    res.status(200).json({
      success: true,
      department,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new department
// @route   POST /api/v1/departments
// @access  Private (Super Admin)
const createDepartment = async (req, res, next) => {
  try {
    const { name, code, description, headOfDepartment, locationBuilding, locationFloor, budgetAllocated } = req.body;

    const department = await Department.create({
      name,
      code,
      description,
      headOfDepartment: headOfDepartment || null,
      locationBuilding,
      locationFloor,
      budgetAllocated,
    });

    await recordAudit({
      req,
      action: 'DEPARTMENT_CREATED',
      module: 'DEPARTMENT',
      targetEntity: 'Department',
      targetId: department._id.toString(),
      details: { name: department.name, code: department.code },
    });

    res.status(201).json({
      success: true,
      message: 'Department created successfully',
      department,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update department
// @route   PUT /api/v1/departments/:id
// @access  Private (Super Admin, Hospital Admin)
const updateDepartment = async (req, res, next) => {
  try {
    let department = await Department.findById(req.params.id);

    if (!department) {
      return res.status(404).json({
        success: false,
        message: 'Department not found',
      });
    }

    department = await Department.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    await recordAudit({
      req,
      action: 'DEPARTMENT_UPDATED',
      module: 'DEPARTMENT',
      targetEntity: 'Department',
      targetId: department._id.toString(),
      details: req.body,
    });

    res.status(200).json({
      success: true,
      message: 'Department updated successfully',
      department,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDepartments,
  getDepartmentById,
  createDepartment,
  updateDepartment,
};
