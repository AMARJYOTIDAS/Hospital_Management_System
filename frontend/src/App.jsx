import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchCurrentUser } from './store/slices/authSlice';
import { ProtectedRoute } from './components/common/ProtectedRoute';
import { DashboardLayout } from './components/layout/DashboardLayout';
import { Login } from './pages/auth/Login';
import { Register } from './pages/auth/Register';
import { Dashboard } from './pages/dashboard/Dashboard';
import { Patients } from './pages/patients/Patients';
import { Doctors } from './pages/doctors/Doctors';
import { Departments } from './pages/departments/Departments';
import { Appointments } from './pages/appointments/Appointments';
import { MedicalRecords } from './pages/clinical/MedicalRecords';
import { Pharmacy } from './pages/pharmacy/Pharmacy';
import { Admissions } from './pages/admissions/Admissions';
import { Finance } from './pages/finance/Finance';
import { RecoveryAnalytics } from './pages/analytics/RecoveryAnalytics';
import { Facilities } from './pages/facilities/Facilities';
import { Reports } from './pages/reports/Reports';
import { Users } from './pages/users/Users';

function App() {
  const dispatch = useDispatch();
  const { token, isAuthenticated } = useSelector((state) => state.auth);

  useEffect(() => {
    if (token && !isAuthenticated) {
      dispatch(fetchCurrentUser());
    }
  }, [token, isAuthenticated, dispatch]);

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Protected Routes inside Dashboard Layout Shell */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="patients" element={<Patients />} />
        <Route path="doctors" element={<Doctors />} />
        <Route path="departments" element={<Departments />} />
        <Route path="appointments" element={<Appointments />} />
        <Route path="medical-records" element={<MedicalRecords />} />
        <Route path="pharmacy" element={<Pharmacy />} />
        <Route path="admissions" element={<Admissions />} />
        <Route path="finance" element={<Finance />} />
        <Route path="recovery-analytics" element={<RecoveryAnalytics />} />
        <Route path="facilities" element={<Facilities />} />
        <Route path="reports" element={<Reports />} />
        <Route path="users" element={<Users />} />
        
        {/* Fallback Route */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Route>
    </Routes>
  );
}

export default App;
