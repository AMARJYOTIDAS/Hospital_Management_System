import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import api from '../../api/axios';
import {
  UserCheck,
  UserPlus,
  Search,
  Filter,
  Layers,
  Clock,
  Calendar,
  DollarSign,
  Briefcase,
  GraduationCap,
  CheckCircle,
  AlertCircle,
  X,
} from 'lucide-react';

export const Doctors = () => {
  const { user } = useSelector((state) => state.auth);
  const [doctors, setDoctors] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const initialDoctorState = {
    fullName: '',
    email: '',
    phone: '',
    specialization: '',
    qualification: '',
    experienceYears: 5,
    department: '',
    consultationFee: 150,
    availableDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
  };
  const [formData, setFormData] = useState(initialDoctorState);

  const fetchData = async () => {
    try {
      setLoading(true);
      const params = {};
      if (search) params.search = search;
      if (departmentFilter) params.department = departmentFilter;

      const [docRes, deptRes] = await Promise.all([
        api.get('/doctors', { params }),
        api.get('/departments'),
      ]);

      setDoctors(docRes.data.doctors || []);
      setDepartments(deptRes.data.departments || []);
    } catch (err) {
      console.error('Failed to fetch doctor directory', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchData();
    }, 300);
    return () => clearTimeout(timer);
  }, [search, departmentFilter]);

  const handleAddDoctor = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');
    setSubmitting(true);

    try {
      const res = await api.post('/doctors', formData);
      setSuccessMessage(`Doctor ${res.data.doctor.fullName} (${res.data.doctor.doctorId}) added successfully!`);
      setFormData(initialDoctorState);
      setTimeout(() => {
        setShowAddModal(false);
        setSuccessMessage('');
      }, 1500);
      fetchData();
    } catch (err) {
      setErrorMessage(err.response?.data?.message || 'Failed to add doctor');
    } finally {
      setSubmitting(false);
    }
  };

  const isStaffAdmin = user?.role === 'SUPER_ADMIN' || user?.role === 'HOSPITAL_ADMIN';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Doctor & Specialist Directory</h1>
          <p className="text-xs text-slate-500 mt-1">
            Clinical practitioners, consultation fees, specialties, and outpatient schedules
          </p>
        </div>
        {isStaffAdmin && (
          <button
            onClick={() => {
              setFormData({
                ...initialDoctorState,
                department: departments[0]?._id || '',
              });
              setErrorMessage('');
              setSuccessMessage('');
              setShowAddModal(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-semibold text-sm rounded-xl shadow-sm transition shadow-primary-600/20"
          >
            <UserPlus className="w-4 h-4" />
            Add Doctor
          </button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by doctor name, specialty, or DOC-ID..."
            className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white transition"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
            <Filter className="w-3.5 h-3.5" /> Department:
          </div>
          <select
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            className="px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">All Departments</option>
            {departments.map((dept) => (
              <option key={dept._id} value={dept._id}>
                {dept.name} ({dept.code})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Doctor Cards Grid */}
      {loading ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200/80">
          <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-xs text-slate-400 mt-3 font-medium">Loading clinical directory...</p>
        </div>
      ) : doctors.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200/80 text-slate-400">
          <UserCheck className="w-12 h-12 mx-auto text-slate-300 mb-2" />
          <p className="font-semibold text-slate-700">No doctors found</p>
          <p className="text-xs mt-1">Try selecting another department or adjusting your search.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {doctors.map((doc) => (
            <div
              key={doc._id}
              className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 hover:border-primary-300 hover:shadow-md transition flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <span className="text-[11px] font-bold text-primary-700 bg-primary-50 px-2 py-0.5 rounded-md">
                      {doc.doctorId}
                    </span>
                    <h3 className="text-base font-bold text-slate-900 mt-1.5">{doc.fullName}</h3>
                    <p className="text-xs font-semibold text-primary-600">{doc.specialization}</p>
                  </div>
                  <span
                    className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                      doc.employmentStatus === 'Active'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                    }`}
                  >
                    {doc.employmentStatus}
                  </span>
                </div>

                <div className="space-y-2 py-3 border-y border-slate-100 text-xs text-slate-600">
                  <div className="flex items-center gap-2">
                    <Layers className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>Department: </span>
                    <span className="font-semibold text-slate-800">{doc.department?.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <GraduationCap className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>Credentials: </span>
                    <span className="font-semibold text-slate-800">{doc.qualification}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Briefcase className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>Clinical Experience: </span>
                    <span className="font-semibold text-slate-800">{doc.experienceYears} Years</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>Consultation Fee: </span>
                    <span className="font-bold text-emerald-600">${doc.consultationFee}</span>
                  </div>
                </div>

                {/* Available Days */}
                <div className="mt-3">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                    Available Days
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {doc.availableDays?.map((d) => (
                      <span key={d} className="px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-700">
                        {d.substring(0, 3)}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
                <span>{doc.email}</span>
                <span className="font-medium text-slate-600">{doc.phone}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Doctor Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Add Clinical Doctor Profile</h3>
                <p className="text-xs text-slate-500">Register specialist credentials and consultation fees</p>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {errorMessage && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {successMessage && (
              <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center gap-2">
                <CheckCircle className="w-4 h-4 shrink-0" />
                <span>{successMessage}</span>
              </div>
            )}

            <form onSubmit={handleAddDoctor} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Full Name & Title *</label>
                  <input
                    type="text"
                    required
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    placeholder="e.g. Dr. Alexander Price, MD"
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Email Address *</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="doctor@hospital.com"
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Phone Number *</label>
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+1 555-0888"
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Department *</label>
                  <select
                    required
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:outline-none"
                  >
                    <option value="">Select Department</option>
                    {departments.map((d) => (
                      <option key={d._id} value={d._id}>
                        {d.name} ({d.code})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Medical Specialization *</label>
                  <input
                    type="text"
                    required
                    value={formData.specialization}
                    onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                    placeholder="e.g. Pediatric Cardiology"
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Qualifications *</label>
                  <input
                    type="text"
                    required
                    value={formData.qualification}
                    onChange={(e) => setFormData({ ...formData, qualification: e.target.value })}
                    placeholder="e.g. MBBS, MD, FAAP"
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Experience (Years) *</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={formData.experienceYears}
                    onChange={(e) => setFormData({ ...formData, experienceYears: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Consultation Fee ($) *</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={formData.consultationFee}
                    onChange={(e) => setFormData({ ...formData, consultationFee: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2.5 text-slate-600 hover:bg-slate-100 rounded-xl text-xs font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-xs font-semibold shadow-sm transition disabled:opacity-50"
                >
                  {submitting ? 'Creating Profile...' : 'Save Doctor Profile'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
