const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
const mongoose = require('mongoose');
const User = require('../models/User');
const Department = require('../models/Department');
const Doctor = require('../models/Doctor');
const Patient = require('../models/Patient');
const Room = require('../models/Room');
const Bed = require('../models/Bed');
const Admission = require('../models/Admission');
const Bill = require('../models/Bill');
const Payment = require('../models/Payment');
const Expense = require('../models/Expense');
const Facility = require('../models/Facility');
const logger = require('../utils/logger');

const seedPhase45 = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    logger.info('Connected to MongoDB for Phase 4 & 5 Seeding...');

    const admin = await User.findOne({ email: 'admin@smarthealth.com' });
    const doctor = await Doctor.findOne();
    const patient = await Patient.findOne();
    const cardioDept = await Department.findOne({ code: 'CARD' });
    const emerDept = await Department.findOne({ code: 'EMER' });

    if (!admin || !doctor || !patient) {
      logger.error('Base seed data missing. Run original seed first.');
      process.exit(1);
    }

    // 1. Seed Rooms
    logger.info('Seeding hospital rooms...');
    const roomsData = [
      { roomNumber: '101', roomType: 'GENERAL', floor: '1st Floor', dailyRate: 75, totalBeds: 2, department: cardioDept?._id },
      { roomNumber: '102', roomType: 'PRIVATE', floor: '1st Floor', dailyRate: 200, totalBeds: 1, department: cardioDept?._id },
      { roomNumber: '201', roomType: 'ICU', floor: '2nd Floor', dailyRate: 450, totalBeds: 2, department: emerDept?._id },
      { roomNumber: '202', roomType: 'SEMI_PRIVATE', floor: '2nd Floor', dailyRate: 130, totalBeds: 2 },
    ];

    const roomDocs = [];
    for (const r of roomsData) {
      let room = await Room.findOne({ roomNumber: r.roomNumber });
      if (!room) {
        room = await Room.create(r);
        logger.info(`Created Room ${r.roomNumber}`);
      }
      roomDocs.push(room);
    }

    // 2. Seed Beds
    logger.info('Seeding beds...');
    const bedsData = [
      { bedNumber: 'B101-A', room: roomDocs[0]._id, bedType: 'STANDARD' },
      { bedNumber: 'B101-B', room: roomDocs[0]._id, bedType: 'STANDARD' },
      { bedNumber: 'B102-A', room: roomDocs[1]._id, bedType: 'ELECTRIC' },
      { bedNumber: 'B201-A', room: roomDocs[2]._id, bedType: 'ICU' },
      { bedNumber: 'B201-B', room: roomDocs[2]._id, bedType: 'ICU' },
      { bedNumber: 'B202-A', room: roomDocs[3]._id, bedType: 'STANDARD' },
    ];

    const bedDocs = [];
    for (const b of bedsData) {
      let bed = await Bed.findOne({ bedNumber: b.bedNumber });
      if (!bed) {
        bed = await Bed.create(b);
        logger.info(`Created Bed ${b.bedNumber}`);
      }
      bedDocs.push(bed);
    }

    // 3. Seed Admission
    let admission = await Admission.findOne({ admissionId: 'ADM-2026-0001' });
    if (!admission) {
      admission = await Admission.create({
        admissionId: 'ADM-2026-0001',
        patient: patient._id,
        doctor: doctor._id,
        room: roomDocs[2]._id, // ICU
        bed: bedDocs[3]._id, // B201-A
        admissionDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
        reasonForAdmission: 'Severe acute chest pressure and unstable angina monitoring',
        initialDiagnosis: 'Acute Coronary Syndrome, rule out STEMI',
        status: 'Admitted',
        recoveryStatus: 'Significantly Improved',
        admittedBy: admin._id,
      });

      // Mark bed occupied
      bedDocs[3].isOccupied = true;
      bedDocs[3].status = 'OCCUPIED';
      bedDocs[3].currentPatient = patient._id;
      bedDocs[3].currentAdmission = admission._id;
      await bedDocs[3].save();

      logger.info('Created sample admission ADM-2026-0001');
    }

    // 4. Seed Bill
    let bill = await Bill.findOne({ billId: 'BILL-2026-0001' });
    if (!bill) {
      bill = await Bill.create({
        billId: 'BILL-2026-0001',
        patient: patient._id,
        admission: admission._id,
        items: [
          { description: 'ICU Bed Stay (3 Days @ $450/day)', category: 'ROOM_RENT', quantity: 3, unitPrice: 450, totalPrice: 1350 },
          { description: 'Specialist Cardiology Evaluation', category: 'CONSULTATION', quantity: 2, unitPrice: 150, totalPrice: 300 },
          { description: 'Cardiovascular Lab Panel & Troponin-T', category: 'LAB_TEST', quantity: 1, unitPrice: 220, totalPrice: 220 },
          { description: 'Injectable Anticoagulants & Statins', category: 'PHARMACY', quantity: 1, unitPrice: 180, totalPrice: 180 },
        ],
        subTotal: 2050,
        taxAmount: 102.5,
        discountAmount: 100,
        totalAmount: 2052.5,
        paidAmount: 1500,
        balanceAmount: 552.5,
        paymentStatus: 'Partially Paid',
        dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
        notes: 'Deposit paid upon admission; balance pending discharge settlement.',
        createdBy: admin._id,
      });
      logger.info('Created sample bill BILL-2026-0001');

      // Seed Initial Payment
      await Payment.create({
        paymentId: 'PAY-2026-0001',
        bill: bill._id,
        patient: patient._id,
        amount: 1500,
        paymentMethod: 'CREDIT_CARD',
        transactionReference: 'TXN-CC-994821',
        notes: 'Initial admission security advance payment',
        receivedBy: admin._id,
      });
      logger.info('Created sample payment PAY-2026-0001');
    }

    // 5. Seed Expenses
    const expensesData = [
      {
        expenseId: 'EXP-2026-0001',
        title: 'Monthly Liquid Medical Oxygen Refill',
        category: 'MEDICAL_SUPPLIES',
        amount: 3200,
        paymentMethod: 'BANK_TRANSFER',
        vendor: 'Praxair Medical Gases Ltd',
        recordedBy: admin._id,
      },
      {
        expenseId: 'EXP-2026-0002',
        title: 'CT Scanner Annual Preventative Maintenance',
        category: 'EQUIPMENT_MAINTENANCE',
        amount: 4500,
        paymentMethod: 'BANK_TRANSFER',
        vendor: 'Siemens Healthineers Technical Service',
        recordedBy: admin._id,
      },
      {
        expenseId: 'EXP-2026-0003',
        title: 'Hospital Complex Power & Electricity Utility',
        category: 'UTILITIES',
        amount: 2850,
        paymentMethod: 'BANK_TRANSFER',
        vendor: 'Metro City Power Corporation',
        recordedBy: admin._id,
      },
    ];

    for (const exp of expensesData) {
      const existingExp = await Expense.findOne({ expenseId: exp.expenseId });
      if (!existingExp) {
        await Expense.create(exp);
        logger.info(`Created Expense ${exp.expenseId}`);
      }
    }

    // 6. Seed Facilities
    const facilitiesData = [
      {
        facilityId: 'FAC-2026-0001',
        name: 'Main Operation Theater 1 (Cardiothoracic)',
        facilityType: 'OPERATION_THEATER',
        department: cardioDept?._id,
        location: { floor: '4th Floor', wing: 'Surgical Wing', block: 'Block A' },
        status: 'AVAILABLE',
        capacity: 1,
        equipment: [
          { name: 'Drager Anesthesia Workstation', modelNumber: 'Perseus A500', serialNumber: 'AN-5921-A', status: 'FUNCTIONAL' },
          { name: 'Heart-Lung Bypass Machine', modelNumber: 'Stockert S5', serialNumber: 'CPB-0982-S', status: 'FUNCTIONAL' },
        ],
      },
      {
        facilityId: 'FAC-2026-0002',
        name: 'Cardiac Catheterization Laboratory (Cath Lab)',
        facilityType: 'OPERATION_THEATER',
        department: cardioDept?._id,
        location: { floor: '2nd Floor', wing: 'Cardiology Wing', block: 'Block B' },
        status: 'AVAILABLE',
        capacity: 1,
        equipment: [
          { name: 'Philips Azurion 7 Angiography System', modelNumber: 'Azurion 7', serialNumber: 'ANG-7741-P', status: 'FUNCTIONAL' },
        ],
      },
      {
        facilityId: 'FAC-2026-0003',
        name: 'Intensive Coronary Care Unit (ICCU)',
        facilityType: 'INTENSIVE_CARE_UNIT',
        department: cardioDept?._id,
        location: { floor: '2nd Floor', wing: 'ICU Wing', block: 'Block A' },
        status: 'OCCUPIED',
        capacity: 8,
        equipment: [
          { name: 'Mindray Central Cardiac Monitor Station', modelNumber: 'BeneVision N22', serialNumber: 'MON-3312-M', status: 'FUNCTIONAL' },
          { name: 'Hamilton C6 Intensive Care Ventilator', modelNumber: 'C6-Adult', serialNumber: 'VEN-4911-H', status: 'FUNCTIONAL' },
        ],
      },
      {
        facilityId: 'FAC-2026-0004',
        name: 'Diagnostic Radiology & 3T MRI Suite',
        facilityType: 'RADIOLOGY_IMAGING',
        location: { floor: 'Basement 1', wing: 'Imaging Wing', block: 'Block C' },
        status: 'AVAILABLE',
        capacity: 2,
        equipment: [
          { name: 'GE SIGNA Pioneer 3.0T MRI', modelNumber: 'SIGNA 3T', serialNumber: 'MRI-9901-G', status: 'FUNCTIONAL' },
        ],
      },
    ];

    for (const f of facilitiesData) {
      const existingFac = await Facility.findOne({ facilityId: f.facilityId });
      if (!existingFac) {
        await Facility.create(f);
        logger.info(`Created Facility ${f.facilityId}`);
      }
    }

    logger.info('Phase 4 & 5 Seed completed successfully!');
    process.exit(0);
  } catch (error) {
    logger.error(`Error in seedPhase45: ${error.message}`);
    process.exit(1);
  }
};

seedPhase45();
