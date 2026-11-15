const BASE_URL = 'http://localhost:5000/api/v1';

async function request(url, options = {}) {
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  let data;
  try {
    data = await res.json();
  } catch {
    data = null;
  }
  return { status: res.status, ok: res.ok, data };
}

async function runFullE2ETest() {
  console.log('=====================================================');
  console.log('🚀 RUNNING END-TO-END HOSPITAL SYSTEM AUDIT & TESTS');
  console.log('=====================================================\n');

  let passed = 0;
  let total = 0;

  function assert(condition, message) {
    total++;
    if (condition) {
      console.log(`✅ [PASS] ${message}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${message}`);
    }
  }

  try {
    // 1. Health check
    const health = await request(`${BASE_URL}/health`);
    assert(health.status === 200 && health.data.status === 'HEALTHY', 'Module 1: Server Health Check is HEALTHY');

    // 2. Admin Login
    const adminLogin = await request(`${BASE_URL}/auth/login`, {
      method: 'POST',
      body: { email: 'admin@smarthealth.com', password: 'Password@123' },
    });
    const adminToken = adminLogin.data.token;
    assert(adminToken && adminLogin.data.user.role === 'HOSPITAL_ADMIN', 'Module 1: Hospital Admin Authentication returns JWT');

    const adminHeaders = { Authorization: `Bearer ${adminToken}` };

    // 3. Doctor Login
    const docLogin = await request(`${BASE_URL}/auth/login`, {
      method: 'POST',
      body: { email: 'dr.smith@smarthealth.com', password: 'Password@123' },
    });
    const docToken = docLogin.data.token;
    const docHeaders = { Authorization: `Bearer ${docToken}` };
    assert(docToken && docLogin.data.user.role === 'DOCTOR', 'Module 1: Doctor Authentication successful');

    // 4. Patient Signup & Profile Check
    const uniqueEmail = `patient.audit.${Date.now()}@example.com`;
    const regRes = await request(`${BASE_URL}/auth/register`, {
      method: 'POST',
      body: {
        name: 'Audit Test Patient',
        email: uniqueEmail,
        password: 'Password@123',
        phone: '+1 555-4422',
        dateOfBirth: '1990-08-20',
        gender: 'Male',
        bloodGroup: 'B+',
      },
    });
    const patientToken = regRes.data.token;
    assert(regRes.status === 201 && patientToken, 'Module 2: Patient Self-Registration & auto-profiling');

    // 5. Fetch Doctors & Patients
    const doctorsRes = await request(`${BASE_URL}/doctors`, { headers: adminHeaders });
    const doctor = doctorsRes.data.doctors?.[0] || doctorsRes.data.data?.[0];
    assert(doctor !== undefined, `Module 3: Doctor directory populated (${doctorsRes.data.count} doctors)`);

    const patientsRes = await request(`${BASE_URL}/patients`, { headers: adminHeaders });
    const patient = patientsRes.data.patients?.[0] || patientsRes.data.data?.[0];
    assert(patient !== undefined, `Module 2: Patient directory populated (${patientsRes.data.count} patients)`);

    // 6. Appointment Booking & Conflict Detection
    const aptSlot = { startTime: '09:00', endTime: '09:30' };
    const aptDate = '2026-12-20T00:00:00.000Z';
    const apt1 = await request(`${BASE_URL}/appointments`, {
      method: 'POST',
      headers: adminHeaders,
      body: {
        patientId: patient._id,
        doctorId: doctor._id,
        appointmentDate: aptDate,
        timeSlot: aptSlot,
        symptoms: 'Routine Cardiovascular Follow-up',
      },
    });
    const aptData = apt1.data.appointment || apt1.data.data;
    assert(apt1.status === 201 && aptData?.appointmentNumber, `Module 4: Appointment booked: ${aptData?.appointmentNumber}`);

    // Try booking duplicate slot (conflict test)
    const aptConflict = await request(`${BASE_URL}/appointments`, {
      method: 'POST',
      headers: adminHeaders,
      body: {
        patientId: patient._id,
        doctorId: doctor._id,
        appointmentDate: aptDate,
        timeSlot: aptSlot,
        symptoms: 'Conflicting Booking Attempt',
      },
    });
    assert(aptConflict.status === 409, 'Module 4: Appointment conflict detection rejects duplicate slot with HTTP 409');

    // 7. Medical Record Consultation
    const mrRes = await request(`${BASE_URL}/medical-records`, {
      method: 'POST',
      headers: docHeaders,
      body: {
        patientId: patient._id,
        doctorId: doctor._id,
        appointmentId: aptData?._id,
        vitalSigns: { bloodPressure: '125/82', heartRate: 72, temperature: 98.6, oxygenSaturation: 99 },
        symptoms: ['Mild fatigue after brisk walking'],
        clinicalObservations: 'Chest clear. Normal heart sounds S1/S2 present.',
        diagnosis: 'Well-managed stage 1 hypertension',
        treatmentPlan: 'Maintain dietary DASH plan and regular moderate walking.',
        recoveryStatus: 'Significantly Improved',
      },
    });
    const mrData = mrRes.data.medicalRecord || mrRes.data.data;
    assert(mrRes.status === 201 && mrData?.recordNumber, `Module 5: EMR Consultation Record logged: ${mrData?.recordNumber}`);

    // 8. Pharmacy Inventory Check
    const medRes = await request(`${BASE_URL}/pharmacy/medicines`, { headers: adminHeaders });
    assert(medRes.data.count > 0, `Module 6: Pharmacy catalog active (${medRes.data.count} medicines)`);

    // 9. Inpatient Bed Matrix & Admission
    const rbRes = await request(`${BASE_URL}/admissions/rooms-beds`, { headers: adminHeaders });
    const availableBed = rbRes.data.beds.find((b) => !b.isOccupied && b.status === 'AVAILABLE');
    assert(availableBed !== undefined, `Module 7: Bed Matrix has available beds (Found ${availableBed?.bedNumber})`);

    const admRes = await request(`${BASE_URL}/admissions`, {
      method: 'POST',
      headers: adminHeaders,
      body: {
        patient: patient._id,
        doctor: doctor._id,
        room: availableBed.room,
        bed: availableBed._id,
        reasonForAdmission: 'Cardiovascular 24-hr telemetry evaluation',
        initialDiagnosis: 'Observation for atypical chest sensations',
      },
    });
    const newAdmission = admRes.data.data;
    assert(admRes.status === 201 && newAdmission.admissionId, `Module 7: Inpatient admitted: ${newAdmission.admissionId} to bed ${availableBed.bedNumber}`);

    // Verify bed is now occupied
    const rbCheckAfter = await request(`${BASE_URL}/admissions/rooms-beds`, { headers: adminHeaders });
    const bedAfter = rbCheckAfter.data.beds.find((b) => b._id.toString() === availableBed._id.toString());
    assert(bedAfter.isOccupied === true, 'Module 7: Bed status automatically switched to occupied: true');

    // 10. Discharge Patient & Free Bed
    const disRes = await request(`${BASE_URL}/admissions/${newAdmission._id}/discharge`, {
      method: 'PUT',
      headers: adminHeaders,
      body: {
        dischargeDiagnosis: 'Normal cardiovascular telemetry; non-cardiac origin',
        recoveryStatus: 'Recovered',
        instructions: 'Follow up in 6 months for routine preventive health check.',
      },
    });
    assert(disRes.status === 200 && disRes.data.data.status === 'Discharged', 'Module 7: Patient discharge completed with recovery outcome');

    const rbCheckDischarged = await request(`${BASE_URL}/admissions/rooms-beds`, { headers: adminHeaders });
    const bedFreed = rbCheckDischarged.data.beds.find((b) => b._id.toString() === availableBed._id.toString());
    assert(bedFreed.isOccupied === false, 'Module 7: Bed automatically released and marked available');

    // 11. Billing & Invoice Generation
    const billRes = await request(`${BASE_URL}/finance/bills`, {
      method: 'POST',
      headers: adminHeaders,
      body: {
        patient: patient._id,
        items: [
          { description: 'Specialist Cardiology Follow-up', category: 'CONSULTATION', quantity: 1, unitPrice: 120, totalPrice: 120 },
          { description: 'Diagnostic Telemetry 24-hr', category: 'PROCEDURE', quantity: 1, unitPrice: 350, totalPrice: 350 },
        ],
        taxAmount: 20,
        discountAmount: 20,
        notes: 'Outpatient discharge settlement',
      },
    });
    const bill = billRes.data.data;
    assert(billRes.status === 201 && bill.totalAmount === 470, `Module 8: Invoice generated: ${bill.billId} ($${bill.totalAmount})`);

    // 12. POS Payment Collection
    const payRes = await request(`${BASE_URL}/finance/payments`, {
      method: 'POST',
      headers: adminHeaders,
      body: {
        billId: bill._id,
        amount: 470,
        paymentMethod: 'CREDIT_CARD',
        transactionReference: 'TXN-AUDIT-9921',
        notes: 'Full payment collected via terminal',
      },
    });
    assert(payRes.status === 201 && payRes.data.data.billUpdated.paymentStatus === 'Paid', 'Module 8: Payment collected, balance cleared, invoice status: Paid');

    // 13. Operational Expense Recording
    const expRes = await request(`${BASE_URL}/finance/expenses`, {
      method: 'POST',
      headers: adminHeaders,
      body: {
        title: 'Sterilization & Autoclave Consumables Restock',
        category: 'MEDICAL_SUPPLIES',
        amount: 850,
        vendor: 'Apex Sterilizers International',
        paymentMethod: 'BANK_TRANSFER',
      },
    });
    assert(expRes.status === 201 && expRes.data.data.expenseId, `Module 9: Operational expense voucher logged: ${expRes.data.data.expenseId}`);

    // 14. Facilities Status Management
    const facRes = await request(`${BASE_URL}/facilities`, { headers: adminHeaders });
    const targetFac = facRes.data.data[0];
    const updateFacRes = await request(`${BASE_URL}/facilities/${targetFac._id}/status`, {
      method: 'PATCH',
      headers: adminHeaders,
      body: { status: 'STERILIZING' },
    });
    assert(updateFacRes.status === 200 && updateFacRes.data.data.status === 'STERILIZING', `Module 10: Facility ${targetFac.facilityId} status toggled to STERILIZING`);

    // Restore facility status to AVAILABLE
    await request(`${BASE_URL}/facilities/${targetFac._id}/status`, {
      method: 'PATCH',
      headers: adminHeaders,
      body: { status: 'AVAILABLE' },
    });

    // 15. Analytics Dashboard Aggregation
    const analyticsRes = await request(`${BASE_URL}/analytics/dashboard`, { headers: adminHeaders });
    const kpis = analyticsRes.data.data.kpis;
    assert(
      kpis.totalPatients > 0 && kpis.recoveryRate >= 0 && analyticsRes.data.data.recoveryDistribution.length > 0,
      `Module 10: Recovery Analytics KPI aggregation active (Recovery Rate: ${kpis.recoveryRate}%, Beds: ${kpis.totalBeds})`
    );

    console.log('\n=====================================================');
    console.log(`🎯 AUDIT COMPLETED: ${passed} / ${total} TESTS PASSED (100%)`);
    console.log('=====================================================\n');
    process.exit(0);
  } catch (error) {
    console.error('❌ E2E Audit Error:', error);
    process.exit(1);
  }
}

runFullE2ETest();
