import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchCurrentUser } from './store/slices/authSlice';
import { ProtectedRoute } from './components/common/ProtectedRoute';
import { DashboardLayout } from './components/layout/DashboardLayout';
import { Login } from './pages/auth/Login';
import { Dashboard } from './pages/dashboard/Dashboard';
import { Patients } from './pages/patients/Patients';
import { Doctors } from './pages/doctors/Doctors';
import { Appointments } from './pages/appointments/Appointments';
import { MedicalRecords } from './pages/clinical/MedicalRecords';
import { Pharmacy } from './pages/pharmacy/Pharmacy';

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
      {/* Public Route */}
      <Route path="/login" element={<Login />} />

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
        <Route path="appointments" element={<Appointments />} />
        <Route path="medical-records" element={<MedicalRecords />} />
        <Route path="pharmacy" element={<Pharmacy />} />
        
        {/* Placeholder Route for other modules to be implemented in upcoming phases */}
        <Route
          path="*"
          element={
            <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center max-w-lg mx-auto mt-12">
              <h3 className="text-lg font-bold text-slate-800">Module Staged for Phase Rollout</h3>
              <p className="text-sm text-slate-500 mt-2">
                This clinical/administrative module will be activated in the next development phase per the approved roadmap.
              </p>
              <a
                href="/dashboard"
                className="mt-4 inline-block px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700"
              >
                Back to Dashboard
              </a>
            </div>
          }
        />
      </Route>
    </Routes>
  );
}

export default App;
