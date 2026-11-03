require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const Department = require('../models/Department');
const Doctor = require('../models/Doctor');
const Patient = require('../models/Patient');
const Appointment = require('../models/Appointment');
const Supplier = require('../models/Supplier');
const Medicine = require('../models/Medicine');
const InventoryTransaction = require('../models/InventoryTransaction');
const MedicalRecord = require('../models/MedicalRecord');
const Prescription = require('../models/Prescription');
const { ROLES, APPOINTMENT_STATUS, INVENTORY_TXN_TYPE, RECOVERY_STATUS } = require('../config/constants');
const logger = require('../utils/logger');

const departmentsData = [
  { name: 'Cardiology', code: 'CARD', description: 'Heart-related treatment and patient management', locationBuilding: 'Building A', locationFloor: '2nd Floor' },
  { name: 'Neurology', code: 'NEUR', description: 'Neurological patient management and brain diagnostics', locationBuilding: 'Building A', locationFloor: '3rd Floor' },
  { name: 'Orthopedics', code: 'ORTH', description: 'Bone and joint treatment and reconstructive care', locationBuilding: 'Building B', locationFloor: '1st Floor' },
  { name: 'Pediatrics', code: 'PEDI', description: 'Child and adolescent healthcare services', locationBuilding: 'Building B', locationFloor: '2nd Floor' },
  { name: 'Dermatology', code: 'DERM', description: 'Skin-related treatment and outpatient dermatology', locationBuilding: 'Building B', locationFloor: '3rd Floor' },
  { name: 'General Medicine', code: 'GMED', description: 'Comprehensive general patient treatment and primary care', locationBuilding: 'Main Wing', locationFloor: '1st Floor' },
  { name: 'Emergency', code: 'EMER', description: '24/7 acute trauma and emergency patient coordination', locationBuilding: 'Emergency Wing', locationFloor: 'Ground Floor' },
  { name: 'Surgery', code: 'SURG', description: 'General and specialized surgical operations', locationBuilding: 'Surgical Wing', locationFloor: '4th Floor' },
  { name: 'Radiology', code: 'RADI', description: 'Diagnostic imaging, CT, MRI, and X-ray services', locationBuilding: 'Diagnostics Wing', locationFloor: 'Basement' },
  { name: 'Pharmacy', code: 'PHAR', description: 'Medicine compounding, storage, and retail inventory', locationBuilding: 'Main Wing', locationFloor: 'Ground Floor' },
  { name: 'Laboratory', code: 'LABS', description: 'Pathological and clinical diagnostic testing', locationBuilding: 'Diagnostics Wing', locationFloor: '1st Floor' },
];

const seedDatabase = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    logger.info('Connected to MongoDB for initial system seeding...');

    // 1. Seed Departments
    logger.info('Seeding hospital departments...');
    const departmentMap = {};

    for (const dept of departmentsData) {
      let existingDept = await Department.findOne({ code: dept.code });
      if (!existingDept) {
        existingDept = await Department.create(dept);
        logger.info(`Created department: ${dept.name} (${dept.code})`);
      }
      departmentMap[dept.code] = existingDept._id;
    }

    // 2. Seed Master Users for each role
    logger.info('Seeding role accounts...');

    const initialUsers = [
      {
        name: 'Super Administrator',
        email: 'superadmin@smarthealth.com',
        password: 'Password@123',
        role: ROLES.SUPER_ADMIN,
        phone: '+1 555-0100',
      },
      {
        name: 'Hospital Administrator',
        email: 'admin@smarthealth.com',
        password: 'Password@123',
        role: ROLES.HOSPITAL_ADMIN,
        phone: '+1 555-0101',
      },
      {
        name: 'Dr. Sarah Mitchell, MD',
        email: 'dr.smith@smarthealth.com',
        password: 'Password@123',
        role: ROLES.DOCTOR,
        phone: '+1 555-0102',
        department: departmentMap['CARD'],
      },
      {
        name: 'Dr. Robert Chen (Cardio Head)',
        email: 'depthead.cardio@smarthealth.com',
        password: 'Password@123',
        role: ROLES.DEPARTMENT_HEAD,
        phone: '+1 555-0103',
        department: departmentMap['CARD'],
      },
      {
        name: 'Dr. Marcus Vance, MD',
        email: 'dr.vance@smarthealth.com',
        password: 'Password@123',
        role: ROLES.DOCTOR,
        phone: '+1 555-0108',
        department: departmentMap['NEUR'],
      },
      {
        name: 'Emily Davis, PharmD',
        email: 'pharmacist@smarthealth.com',
        password: 'Password@123',
        role: ROLES.PHARMACIST,
        phone: '+1 555-0104',
        department: departmentMap['PHAR'],
      },
      {
        name: 'Jessica Taylor (Front Desk)',
        email: 'receptionist@smarthealth.com',
        password: 'Password@123',
        role: ROLES.RECEPTIONIST,
        phone: '+1 555-0105',
      },
      {
        name: 'David Vance, CPA',
        email: 'accountant@smarthealth.com',
        password: 'Password@123',
        role: ROLES.ACCOUNTANT,
        phone: '+1 555-0106',
      },
      {
        name: 'John Patient',
        email: 'patient@smarthealth.com',
        password: 'Password@123',
        role: ROLES.PATIENT,
        phone: '+1 555-0107',
      },
    ];

    const userMap = {};
    for (const u of initialUsers) {
      let user = await User.findOne({ email: u.email });
      if (!user) {
        user = await User.create(u);
        logger.info(`Created user account: ${u.email} [${u.role}]`);
      }
      userMap[u.email] = user._id;
    }

    // Set Department Head for Cardiology
    if (userMap['depthead.cardio@smarthealth.com'] && departmentMap['CARD']) {
      await Department.findByIdAndUpdate(departmentMap['CARD'], {
        headOfDepartment: userMap['depthead.cardio@smarthealth.com'],
      });
    }

    // 3. Seed Doctors
    logger.info('Seeding doctor clinical profiles...');
    const doctorProfiles = [
      {
        doctorId: 'DOC-2026-0001',
        userId: userMap['dr.smith@smarthealth.com'],
        fullName: 'Dr. Sarah Mitchell, MD',
        email: 'dr.smith@smarthealth.com',
        phone: '+1 555-0102',
        specialization: 'Cardiology & Electrophysiology',
        qualification: 'MBBS, MD, FACC',
        experienceYears: 12,
        department: departmentMap['CARD'],
        consultationFee: 150,
        availableDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        availableTimeSlots: [
          { startTime: '09:00', endTime: '12:00', slotDurationMinutes: 30 },
          { startTime: '14:00', endTime: '17:00', slotDurationMinutes: 30 },
        ],
        isDepartmentHead: false,
      },
      {
        doctorId: 'DOC-2026-0002',
        userId: userMap['depthead.cardio@smarthealth.com'],
        fullName: 'Dr. Robert Chen, MD',
        email: 'depthead.cardio@smarthealth.com',
        phone: '+1 555-0103',
        specialization: 'Interventional Cardiology',
        qualification: 'MBBS, MS, FRCS',
        experienceYears: 20,
        department: departmentMap['CARD'],
        consultationFee: 200,
        availableDays: ['Monday', 'Wednesday', 'Friday'],
        availableTimeSlots: [
          { startTime: '10:00', endTime: '13:00', slotDurationMinutes: 30 },
        ],
        isDepartmentHead: true,
      },
      {
        doctorId: 'DOC-2026-0003',
        userId: userMap['dr.vance@smarthealth.com'],
        fullName: 'Dr. Marcus Vance, MD',
        email: 'dr.vance@smarthealth.com',
        phone: '+1 555-0108',
        specialization: 'Neurology & Neurovascular Care',
        qualification: 'MBBS, DM Neurology',
        experienceYears: 15,
        department: departmentMap['NEUR'],
        consultationFee: 180,
        availableDays: ['Tuesday', 'Thursday', 'Saturday'],
        availableTimeSlots: [
          { startTime: '09:00', endTime: '13:00', slotDurationMinutes: 30 },
        ],
        isDepartmentHead: false,
      },
    ];

    const doctorMap = {};
    for (const doc of doctorProfiles) {
      let existingDoc = await Doctor.findOne({ doctorId: doc.doctorId });
      if (!existingDoc) {
        existingDoc = await Doctor.create(doc);
        logger.info(`Created doctor profile: ${doc.fullName} (${doc.doctorId})`);
      }
      doctorMap[doc.doctorId] = existingDoc._id;
    }

    // 4. Seed Patients
    logger.info('Seeding patient records...');
    const patientsData = [
      {
        patientId: 'PID-2026-0001',
        userId: userMap['patient@smarthealth.com'],
        fullName: 'John Patient',
        dateOfBirth: new Date('1985-06-15'),
        gender: 'Male',
        bloodGroup: 'O+',
        phone: '+1 555-0107',
        email: 'patient@smarthealth.com',
        address: { street: '742 Evergreen Terrace', city: 'Springfield', state: 'IL', zipCode: '62704' },
        emergencyContact: { name: 'Mary Patient', relationship: 'Spouse', phone: '+1 555-0199' },
        medicalHistory: {
          allergies: ['Penicillin'],
          chronicConditions: ['Hypertension'],
          pastSurgeries: ['Appendectomy (2018)'],
          notes: 'Patient regularly monitors BP at home.',
        },
        status: 'Active',
      },
      {
        patientId: 'PID-2026-0002',
        fullName: 'Eleanor Roosevelt Clark',
        dateOfBirth: new Date('1992-11-23'),
        gender: 'Female',
        bloodGroup: 'A+',
        phone: '+1 555-0211',
        email: 'eleanor.clark@example.com',
        address: { street: '120 Elm St', city: 'Chicago', state: 'IL', zipCode: '60601' },
        emergencyContact: { name: 'Arthur Clark', relationship: 'Brother', phone: '+1 555-0212' },
        medicalHistory: {
          allergies: ['Sulfa drugs'],
          chronicConditions: ['Asthma'],
          pastSurgeries: [],
          notes: 'Carries rescue inhaler.',
        },
        status: 'Active',
      },
      {
        patientId: 'PID-2026-0003',
        fullName: 'Michael Anthony Ross',
        dateOfBirth: new Date('1978-04-02'),
        gender: 'Male',
        bloodGroup: 'B-',
        phone: '+1 555-0322',
        email: 'michael.ross@example.com',
        address: { street: '456 Oak Avenue', city: 'Peoria', state: 'IL', zipCode: '61602' },
        emergencyContact: { name: 'Linda Ross', relationship: 'Mother', phone: '+1 555-0323' },
        medicalHistory: {
          allergies: ['Latex'],
          chronicConditions: ['Type 2 Diabetes'],
          pastSurgeries: ['Knee Arthroscopy (2021)'],
          notes: 'Metformin 500mg daily.',
        },
        status: 'Active',
      },
    ];

    const patientMap = {};
    for (const pat of patientsData) {
      let existingPat = await Patient.findOne({ patientId: pat.patientId });
      if (!existingPat) {
        existingPat = await Patient.create(pat);
        logger.info(`Created patient profile: ${pat.fullName} (${pat.patientId})`);
      }
      patientMap[pat.patientId] = existingPat._id;
    }

    // 5. Seed Initial Appointments
    logger.info('Seeding sample appointments...');
    const today = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(today.getDate() + 1);

    const appointmentsData = [
      {
        appointmentNumber: 'APT-2026-0001',
        patient: patientMap['PID-2026-0001'],
        doctor: doctorMap['DOC-2026-0001'],
        department: departmentMap['CARD'],
        appointmentDate: today,
        timeSlot: { startTime: '09:00', endTime: '09:30' },
        symptoms: 'Mild chest tightness after strenuous cardio exercise',
        status: APPOINTMENT_STATUS.CONFIRMED,
        fee: 150,
        isPaid: true,
      },
      {
        appointmentNumber: 'APT-2026-0002',
        patient: patientMap['PID-2026-0002'],
        doctor: doctorMap['DOC-2026-0002'],
        department: departmentMap['CARD'],
        appointmentDate: tomorrow,
        timeSlot: { startTime: '10:00', endTime: '10:30' },
        symptoms: 'Routine cardiovascular checkup and ECG review',
        status: APPOINTMENT_STATUS.PENDING,
        fee: 200,
        isPaid: false,
      },
      {
        appointmentNumber: 'APT-2026-0003',
        patient: patientMap['PID-2026-0003'],
        doctor: doctorMap['DOC-2026-0003'],
        department: departmentMap['NEUR'],
        appointmentDate: tomorrow,
        timeSlot: { startTime: '11:00', endTime: '11:30' },
        symptoms: 'Persistent tension migraines and visual aura',
        status: APPOINTMENT_STATUS.CONFIRMED,
        fee: 180,
        isPaid: false,
      },
    ];

    for (const apt of appointmentsData) {
      const existingApt = await Appointment.findOne({ appointmentNumber: apt.appointmentNumber });
      if (!existingApt) {
        await Appointment.create(apt);
        logger.info(`Created sample appointment: ${apt.appointmentNumber}`);
      }
    }

    // 6. Seed Pharmacy Suppliers
    logger.info('Seeding pharmaceutical suppliers...');
    const suppliersData = [
      { name: 'Apex Pharmaceuticals Inc.', contactPerson: 'David Miller', phone: '+1 555-4001', email: 'orders@apexpharma.com', address: '100 BioPark Blvd, Boston, MA' },
      { name: 'MediSource Wholesalers', contactPerson: 'Sarah Jenkins', phone: '+1 555-4002', email: 'support@medisource.com', address: '500 Logistics Way, Chicago, IL' },
    ];

    const supplierMap = {};
    for (const sup of suppliersData) {
      let existingSup = await Supplier.findOne({ name: sup.name });
      if (!existingSup) {
        existingSup = await Supplier.create(sup);
        logger.info(`Created supplier: ${sup.name}`);
      }
      supplierMap[sup.name] = existingSup._id;
    }

    // 7. Seed Medicines
    logger.info('Seeding medicine formulary catalog...');
    const now = new Date();
    const expiryNextYear = new Date(now.getFullYear() + 2, 5, 15);
    const nearExpiryDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 15);

    const medicinesData = [
      {
        medicineId: 'MED-0001',
        name: 'Amoxicillin 500mg',
        genericName: 'Amoxicillin Trihydrate',
        category: 'Antibiotic',
        manufacturer: 'Pfizer Inc.',
        batchNumber: 'AMX-2026-B1',
        purchasePrice: 4.5,
        sellingPrice: 12.0,
        availableQuantity: 150,
        minimumStockLevel: 25,
        expiryDate: expiryNextYear,
        supplier: supplierMap['Apex Pharmaceuticals Inc.'],
      },
      {
        medicineId: 'MED-0002',
        name: 'Atorvastatin 20mg',
        genericName: 'Atorvastatin Calcium',
        category: 'Cardiovascular',
        manufacturer: 'Novartis',
        batchNumber: 'ATV-2026-A4',
        purchasePrice: 8.0,
        sellingPrice: 22.0,
        availableQuantity: 8, // Low Stock (< 15)
        minimumStockLevel: 15,
        expiryDate: expiryNextYear,
        supplier: supplierMap['Apex Pharmaceuticals Inc.'],
      },
      {
        medicineId: 'MED-0003',
        name: 'Metformin 500mg',
        genericName: 'Metformin Hydrochloride',
        category: 'Antidiabetic',
        manufacturer: 'Merck Healthcare',
        batchNumber: 'MET-2026-C8',
        purchasePrice: 3.0,
        sellingPrice: 9.5,
        availableQuantity: 200,
        minimumStockLevel: 20,
        expiryDate: expiryNextYear,
        supplier: supplierMap['MediSource Wholesalers'],
      },
      {
        medicineId: 'MED-0004',
        name: 'Paracetamol 650mg',
        genericName: 'Acetaminophen',
        category: 'Analgesic',
        manufacturer: 'GSK Pharma',
        batchNumber: 'PCM-2026-D2',
        purchasePrice: 1.5,
        sellingPrice: 5.0,
        availableQuantity: 350,
        minimumStockLevel: 50,
        expiryDate: nearExpiryDate, // Near Expiry (< 30 days)
        supplier: supplierMap['MediSource Wholesalers'],
      },
      {
        medicineId: 'MED-0005',
        name: 'Omeprazole 20mg',
        genericName: 'Omeprazole Delayed-Release',
        category: 'Gastrointestinal',
        manufacturer: 'AstraZeneca',
        batchNumber: 'OMP-2026-E1',
        purchasePrice: 6.0,
        sellingPrice: 16.5,
        availableQuantity: 4, // Low Stock (< 10)
        minimumStockLevel: 10,
        expiryDate: expiryNextYear,
        supplier: supplierMap['MediSource Wholesalers'],
      },
    ];

    const medicineMap = {};
    for (const med of medicinesData) {
      let existingMed = await Medicine.findOne({ medicineId: med.medicineId });
      if (!existingMed) {
        existingMed = await Medicine.create(med);
        logger.info(`Created medicine: ${med.name} (${med.medicineId})`);
      }
      medicineMap[med.medicineId] = existingMed._id;
    }

    // 8. Seed Medical Record for John Patient
    logger.info('Seeding sample clinical medical records...');
    const existingMR = await MedicalRecord.findOne({ recordNumber: 'MR-2026-0001' });
    let mrId = existingMR?._id;
    if (!existingMR) {
      const mr = await MedicalRecord.create({
        recordNumber: 'MR-2026-0001',
        patient: patientMap['PID-2026-0001'],
        doctor: doctorMap['DOC-2026-0001'],
        examinationDate: new Date(),
        vitalSigns: {
          bloodPressure: '135/88',
          heartRateBpm: 76,
          temperatureCelsius: 36.8,
          respiratoryRate: 16,
          oxygenSaturationPct: 98,
        },
        symptoms: ['Occasional exertional chest tightness', 'Mild morning dizziness'],
        clinicalObservations: 'Normal heart sounds S1/S2 present. No peripheral edema. ECG sinus rhythm without acute ischemic changes.',
        diagnosis: 'Stage 1 Essential Hypertension with exertional fatigue',
        treatmentPlan: 'Initiate lifestyle diet modifications, low sodium protocol, and pharmacotherapy.',
        recoveryStatus: RECOVERY_STATUS.UNDER_TREATMENT,
        followUpDate: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 14),
      });
      mrId = mr._id;
      logger.info('Created sample medical record MR-2026-0001');
    }

    // 9. Seed Prescription for John Patient
    const existingRx = await Prescription.findOne({ prescriptionNumber: 'RX-2026-0001' });
    if (!existingRx && medicineMap['MED-0002'] && medicineMap['MED-0003']) {
      await Prescription.create({
        prescriptionNumber: 'RX-2026-0001',
        patient: patientMap['PID-2026-0001'],
        doctor: doctorMap['DOC-2026-0001'],
        medicalRecord: mrId,
        medicines: [
          {
            medicine: medicineMap['MED-0002'], // Atorvastatin
            dosage: '20mg',
            frequency: 'Once daily at bedtime',
            durationDays: 30,
            quantityPrescribed: 30,
            quantityDispensed: 0,
            instructions: 'Take with a glass of water after dinner',
          },
          {
            medicine: medicineMap['MED-0003'], // Metformin
            dosage: '500mg',
            frequency: 'Twice daily with meals',
            durationDays: 30,
            quantityPrescribed: 60,
            quantityDispensed: 0,
            instructions: 'Take morning and evening with food',
          },
        ],
        status: 'Issued',
        notes: 'Follow up in 2 weeks with repeat lipid and BP profile',
      });
      logger.info('Created sample prescription RX-2026-0001');
    }

    logger.info('Phase 3 Database seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    logger.error(`Error seeding database: ${error.message}`);
    process.exit(1);
  }
};

seedDatabase();
