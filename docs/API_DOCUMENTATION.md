# Smart Healthcare & Hospital Management System: REST API Documentation

## 1. Authentication & Security Conventions

- **Base URL**: `/api/v1`
- **Security**: Bearer JWT token transmitted via `Authorization: Bearer <TOKEN>` header.
- **Content-Type**: `application/json` (or `multipart/form-data` for file/report uploads).
- **Error Response Protocol**:
```json
{
  "success": false,
  "message": "Descriptive error message",
  "errors": []
}
```

---

## 2. API Endpoints by Domain Module

### Module 1: Authentication & Authorization (`/api/v1/auth`)

| Method | Endpoint | Allowed Roles | Description | Request Body |
|---|---|---|---|---|
| `POST` | `/auth/register` | Super Admin, Hospital Admin | Register hospital staff or patient | `{ name, email, password, role, phone }` |
| `POST` | `/auth/login` | Public | Authenticate user, return JWT & role | `{ email, password }` |
| `GET` | `/auth/me` | Authenticated | Fetch current user context & permissions | None |
| `POST` | `/auth/forgot-password` | Public | Trigger password reset token | `{ email }` |
| `PUT` | `/auth/reset-password/:token` | Public | Reset password with valid token | `{ newPassword }` |
| `PUT` | `/auth/update-password` | Authenticated | Change user password | `{ currentPassword, newPassword }` |
| `PATCH` | `/auth/users/:id/status` | Super Admin, Hospital Admin | Activate/Deactivate user account | `{ isActive: boolean }` |

---

### Module 2: Patient Management (`/api/v1/patients`)

| Method | Endpoint | Allowed Roles | Description | Request Body |
|---|---|---|---|---|
| `POST` | `/patients` | Super Admin, Hospital Admin, Receptionist | Register new patient (Auto PID) | Demographic, contact, emergency info |
| `GET` | `/patients` | Super Admin, Hospital Admin, Doctor, Receptionist, Accountant | List patients with pagination & search | Query: `?page=1&limit=20&search=john` |
| `GET` | `/patients/:id` | Super Admin, Hospital Admin, Doctor, Receptionist, Patient (self) | Fetch full patient profile | None |
| `PUT` | `/patients/:id` | Super Admin, Hospital Admin, Receptionist, Patient (self) | Update patient profile | Editable patient fields |
| `GET` | `/patients/:id/medical-history` | Super Admin, Doctor, Patient (self) | Fetch comprehensive history & timeline | None |

---

### Module 3: Doctor Management (`/api/v1/doctors`)

| Method | Endpoint | Allowed Roles | Description | Request Body |
|---|---|---|---|---|
| `POST` | `/doctors` | Super Admin, Hospital Admin | Add doctor profile (Auto DOC-ID) | Specialization, dept, fee, slots |
| `GET` | `/doctors` | All Authenticated, Public (directory) | List doctors with filtering by dept | Query: `?department=Cardiology` |
| `GET` | `/doctors/:id` | All Authenticated | Get doctor details & schedule | None |
| `PUT` | `/doctors/:id` | Super Admin, Hospital Admin, Doctor (self) | Update doctor details/slots | Doctor fields, available slots |
| `PATCH` | `/doctors/:id/status` | Super Admin, Hospital Admin | Change status (Active/Leave) | `{ employmentStatus }` |

---

### Module 4: Department Management (`/api/v1/departments`)

| Method | Endpoint | Allowed Roles | Description | Request Body |
|---|---|---|---|---|
| `GET` | `/departments` | All Authenticated | List all hospital departments | None |
| `POST` | `/departments` | Super Admin | Create new clinical department | `{ name, code, headOfDepartment, ... }` |
| `PUT` | `/departments/:id` | Super Admin, Hospital Admin | Update department details / Head | Updated department fields |
| `GET` | `/departments/:id/staff` | Super Admin, Hospital Admin, Dept Head | List doctors & nurses in department | None |

---

### Module 5: Appointment Management (`/api/v1/appointments`)

| Method | Endpoint | Allowed Roles | Description | Request Body |
|---|---|---|---|---|
| `POST` | `/appointments` | Super Admin, Hospital Admin, Receptionist, Patient | Book appointment | `{ patientId, doctorId, date, timeSlot, symptoms }` |
| `GET` | `/appointments` | Super Admin, Hospital Admin, Receptionist, Doctor, Dept Head | List appointments with filters | Query: `?doctor=&patient=&date=&status=` |
| `GET` | `/appointments/my-appointments` | Doctor, Patient | Get current user's appointments | None |
| `PATCH` | `/appointments/:id/status` | Super Admin, Hospital Admin, Doctor, Receptionist | Update status (Confirmed/Completed/No-show) | `{ status, cancellationReason }` |
| `PUT` | `/appointments/:id/reschedule` | Super Admin, Receptionist, Patient | Reschedule date & slot | `{ newDate, newTimeSlot }` |

---

### Module 6: Medical Records & Clinical Care (`/api/v1/medical-records`)

| Method | Endpoint | Allowed Roles | Description | Request Body |
|---|---|---|---|---|
| `POST` | `/medical-records` | Doctor | Create clinical record & diagnosis | `{ patient, symptoms, observations, diagnosis, treatmentPlan, recoveryStatus }` |
| `GET` | `/medical-records/patient/:patientId`| Doctor, Super Admin, Patient (self) | View patient's clinical records | None |
| `GET` | `/medical-records/:id` | Doctor, Super Admin, Patient (self) | Fetch individual record detail | None |
| `PUT` | `/medical-records/:id` | Doctor (creator) | Update record & recovery status | `{ recoveryStatus, followUpDate, ... }` |

---

### Module 7: Prescriptions (`/api/v1/prescriptions`)

| Method | Endpoint | Allowed Roles | Description | Request Body |
|---|---|---|---|---|
| `POST` | `/prescriptions` | Doctor | Issue digital prescription | `{ patient, medicines: [{ medicine, dosage, freq, duration, qty }] }` |
| `GET` | `/prescriptions` | Doctor, Pharmacist, Super Admin, Hospital Admin | List prescriptions | Query: `?status=Issued` |
| `GET` | `/prescriptions/:id` | Doctor, Pharmacist, Patient (self) | Get prescription details | None |
| `PATCH` | `/prescriptions/:id/dispense` | Pharmacist | Mark prescription dispensed & adjust stock | `{ dispensedItems: [{ medicineId, quantity }] }` |

---

### Module 8: Pharmacy & Medicine Inventory (`/api/v1/pharmacy`)

| Method | Endpoint | Allowed Roles | Description | Request Body |
|---|---|---|---|---|
| `POST` | `/pharmacy/medicines` | Pharmacist, Hospital Admin, Super Admin | Add medicine to catalog | Drug specs, batch, prices, minStock |
| `GET` | `/pharmacy/medicines` | Pharmacist, Hospital Admin, Super Admin, Doctor | List medicines with search & alerts | Query: `?lowStock=true&nearExpiry=true` |
| `PUT` | `/pharmacy/medicines/:id` | Pharmacist, Super Admin | Update medicine pricing/details | Updated medicine fields |
| `POST` | `/pharmacy/stock-in` | Pharmacist, Hospital Admin | Stock IN (Procurement receipt) | `{ medicineId, quantity, supplierId, unitCost, batchNumber }` |
| `POST` | `/pharmacy/stock-out` | Pharmacist | Stock OUT (Dispensation/Disposal) | `{ medicineId, quantity, reason, prescriptionId }` |
| `GET` | `/pharmacy/transactions` | Pharmacist, Hospital Admin, Accountant | Audit logs of stock movements | Query: `?type=IN&startDate=&endDate=` |
| `GET` | `/pharmacy/analytics` | Pharmacist, Hospital Admin, Super Admin | Inventory overview & valuation | None |

---

### Module 9: Inpatient Admissions & Bed Management (`/api/v1/admissions`)

| Method | Endpoint | Allowed Roles | Description | Request Body |
|---|---|---|---|---|
| `POST` | `/admissions` | Super Admin, Hospital Admin, Receptionist, Doctor | Admit patient & assign bed | `{ patient, doctor, department, facility, room, bed, diagnosis }` |
| `GET` | `/admissions` | Super Admin, Hospital Admin, Receptionist, Doctor | List active and past admissions | Query: `?status=Admitted` |
| `PATCH` | `/admissions/:id/discharge` | Super Admin, Hospital Admin, Doctor | Clinically discharge patient & free bed | `{ dischargeSummary: { finalDiagnosis, clinicalRecoveryOutcome } }` |
| `GET` | `/admissions/beds/status` | Super Admin, Hospital Admin, Receptionist, Doctor | Real-time bed occupancy matrix | None |

---

### Module 10: Billing & Financial Management (`/api/v1/finance`)

| Method | Endpoint | Allowed Roles | Description | Request Body |
|---|---|---|---|---|
| `POST` | `/finance/bills` | Accountant, Hospital Admin, Super Admin | Generate patient invoice | `{ patientId, admissionId, items: [...] }` |
| `GET` | `/finance/bills` | Accountant, Hospital Admin, Super Admin | List invoices & payment statuses | Query: `?status=Unpaid` |
| `POST` | `/finance/payments` | Accountant, Receptionist | Record payment against invoice | `{ billId, amount, paymentMethod, transactionRef }` |
| `POST` | `/finance/expenses` | Accountant, Hospital Admin, Super Admin | Record operational expense | `{ category, department, amount, expenseDate, recipient, method }` |
| `GET` | `/finance/expenses` | Accountant, Hospital Admin, Super Admin | List hospital expenditures | Query: `?category=&startDate=&endDate=` |
| `GET` | `/finance/analytics` | Accountant, Hospital Admin, Super Admin | Revenue vs Expense, Net Income | Query: `?timeframe=monthly&year=2026` |

---

### Module 11: Recovery Analytics & Operational Dashboards (`/api/v1/analytics`)

| Method | Endpoint | Allowed Roles | Description | Parameters |
|---|---|---|---|---|
| `GET` | `/analytics/admin-summary` | Super Admin, Hospital Admin | Central KPI cards & counts | Query: `?filter=thisMonth` |
| `GET` | `/analytics/patient-recovery`| Super Admin, Hospital Admin, Doctor, Dept Head | Recovery rates & outcome distribution | Query: `?department=` |
| `GET` | `/analytics/revenue-expense-trend`| Super Admin, Hospital Admin, Accountant | Monthly revenue vs expense curve | Query: `?year=2026` |
| `GET` | `/analytics/bed-occupancy` | Super Admin, Hospital Admin, Dept Head | Real-time facility occupancy rate | None |
| `GET` | `/analytics/doctor-performance`| Super Admin, Hospital Admin, Dept Head | Consultations & recovery outcomes per doctor | Query: `?doctorId=` |

---

### Module 12: Reports & Exports (`/api/v1/reports`)

| Method | Endpoint | Allowed Roles | Description | Supported Format |
|---|---|---|---|---|
| `GET` | `/reports/patients` | Super Admin, Hospital Admin | Patient intake & outcome report | JSON / PDF / Excel |
| `GET` | `/reports/pharmacy-stock` | Super Admin, Hospital Admin, Pharmacist | Drug inventory & valuation report | JSON / PDF / Excel |
| `GET` | `/reports/financial-statement` | Super Admin, Hospital Admin, Accountant | P&L and itemized revenue/expense | JSON / PDF / Excel |
| `GET` | `/reports/facility-utilization` | Super Admin, Hospital Admin, Dept Head | Room & bed utilization metrics | JSON / PDF / Excel |

---

### Module 13: System Notifications & Audit Logs (`/api/v1/system`)

| Method | Endpoint | Allowed Roles | Description |
|---|---|---|---|
| `GET` | `/system/notifications` | All Authenticated | Get user's notifications |
| `PATCH` | `/system/notifications/:id/read` | All Authenticated | Mark notification read |
| `GET` | `/system/audit-logs` | Super Admin | View immutable security & clinical audit trail |
