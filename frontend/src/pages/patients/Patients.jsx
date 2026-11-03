import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import api from '../../api/axios';
import {
  Users,
  UserPlus,
  Search,
  Filter,
  Phone,
  Mail,
  Calendar,
  Heart,
  AlertCircle,
  CheckCircle,
  Eye,
  X,
} from 'lucide-react';

export const Patients = () => {
  const { user } = useSelector((state) => state.auth);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [bloodGroupFilter, setBloodGroupFilter] = useState('');
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Form State
  const initialFormState = {
    fullName: '',
    dateOfBirth: '',
    gender: 'Male',
    bloodGroup: 'O+',
    phone: '',
    email: '',
    address: { street: '', city: '', state: '', zipCode: '' },
    emergencyContact: { name: '', relationship: '', phone: '' },
    medicalHistory: {
      allergies: '',
      chronicConditions: '',
      pastSurgeries: '',
      notes: '',
    },
  };
  const [formData, setFormData] = useState(initialFormState);

  const fetchPatients = async () => {
    try {
      setLoading(true);
      const params = {};
      if (search) params.search = search;
      if (bloodGroupFilter) params.bloodGroup = bloodGroupFilter;

      const res = await api.get('/patients', { params });
      setPatients(res.data.patients || []);
    } catch (err) {
      console.error('Failed to load patients', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchPatients();
    }, 300);
    return () => clearTimeout(timer);
  }, [search, bloodGroupFilter]);

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');
    setFormSubmitting(true);

    try {
      // Format allergies, chronic conditions as arrays
      const payload = {
        ...formData,
        medicalHistory: {
          allergies: formData.medicalHistory.allergies
            ? formData.medicalHistory.allergies.split(',').map((s) => s.trim())
            : [],
          chronicConditions: formData.medicalHistory.chronicConditions
            ? formData.medicalHistory.chronicConditions.split(',').map((s) => s.trim())
            : [],
          pastSurgeries: formData.medicalHistory.pastSurgeries
            ? formData.medicalHistory.pastSurgeries.split(',').map((s) => s.trim())
            : [],
          notes: formData.medicalHistory.notes,
        },
      };

      const res = await api.post('/patients', payload);
      setSuccessMessage(`Patient ${res.data.patient.fullName} (${res.data.patient.patientId}) registered successfully!`);
      setFormData(initialFormState);
      setTimeout(() => {
        setShowRegisterModal(false);
        setSuccessMessage('');
      }, 1500);
      fetchPatients();
    } catch (err) {
      setErrorMessage(err.response?.data?.message || 'Failed to register patient');
    } finally {
      setFormSubmitting(false);
    }
  };

  const calculateAge = (dobString) => {
    if (!dobString) return '-';
    const dob = new Date(dobString);
    const diffMs = Date.now() - dob.getTime();
    const ageDt = new Date(diffMs);
    return Math.abs(ageDt.getUTCFullYear() - 1970);
  };

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Patient Management</h1>
          <p className="text-xs text-slate-500 mt-1">
            Electronic patient intake, demographic records, and medical history
          </p>
        </div>
        <button
          onClick={() => {
            setFormData(initialFormState);
            setErrorMessage('');
            setSuccessMessage('');
            setShowRegisterModal(true);
          }}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-semibold text-sm rounded-xl shadow-sm transition shadow-primary-600/20"
        >
          <UserPlus className="w-4 h-4" />
          Register Patient
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by patient name, phone, or PID..."
            className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white transition"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
            <Filter className="w-3.5 h-3.5" /> Blood Group:
          </div>
          <select
            value={bloodGroupFilter}
            onChange={(e) => setBloodGroupFilter(e.target.value)}
            className="px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">All Groups</option>
            {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((bg) => (
              <option key={bg} value={bg}>{bg}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Patients Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-xs text-slate-400 mt-3 font-medium">Loading patient directory...</p>
          </div>
        ) : patients.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <Users className="w-12 h-12 mx-auto text-slate-300 mb-2" />
            <p className="font-semibold text-slate-700">No patients found</p>
            <p className="text-xs mt-1">Try modifying your search or register a new patient.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50/80 text-xs font-semibold uppercase tracking-wider text-slate-400 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3.5">Patient ID</th>
                  <th className="px-6 py-3.5">Full Name</th>
                  <th className="px-6 py-3.5">Age / Gender</th>
                  <th className="px-6 py-3.5">Blood Group</th>
                  <th className="px-6 py-3.5">Contact Phone</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {patients.map((p) => (
                  <tr key={p._id} className="hover:bg-slate-50/70 transition">
                    <td className="px-6 py-4 font-bold text-primary-700">{p.patientId}</td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-900">{p.fullName}</div>
                      <div className="text-xs text-slate-400">{p.email || 'No email on file'}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-medium text-slate-800">{calculateAge(p.dateOfBirth)} yrs</span>
                      <span className="text-slate-400 text-xs ml-1.5">({p.gender})</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
                        <Heart className="w-3 h-3 text-rose-500 fill-rose-500" />
                        {p.bloodGroup}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-medium">{p.phone}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`text-xs px-2.5 py-1 rounded-full font-semibold ${
                          p.status === 'Active'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}
                      >
                        {p.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => setSelectedPatient(p)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-primary-700 bg-primary-50 hover:bg-primary-100 rounded-lg transition"
                      >
                        <Eye className="w-3.5 h-3.5" /> Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Patient Details Modal */}
      {selectedPatient && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center font-bold">
                  {selectedPatient.fullName.charAt(0)}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-800">{selectedPatient.fullName}</h3>
                  <span className="text-xs text-primary-600 font-semibold">{selectedPatient.patientId}</span>
                </div>
              </div>
              <button
                onClick={() => setSelectedPatient(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 py-4 text-xs border-b border-slate-100">
              <div>
                <span className="text-slate-400 block">Date of Birth</span>
                <span className="font-semibold text-slate-800 text-sm">
                  {new Date(selectedPatient.dateOfBirth).toLocaleDateString()} ({calculateAge(selectedPatient.dateOfBirth)} yrs)
                </span>
              </div>
              <div>
                <span className="text-slate-400 block">Gender</span>
                <span className="font-semibold text-slate-800 text-sm">{selectedPatient.gender}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Blood Group</span>
                <span className="font-semibold text-rose-600 text-sm">{selectedPatient.bloodGroup}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Phone</span>
                <span className="font-semibold text-slate-800 text-sm">{selectedPatient.phone}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Email</span>
                <span className="font-semibold text-slate-800 text-sm">{selectedPatient.email || 'None'}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Status</span>
                <span className="font-semibold text-emerald-600 text-sm">{selectedPatient.status}</span>
              </div>
            </div>

            {/* Emergency Contact */}
            <div className="py-3 border-b border-slate-100">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Emergency Contact</h4>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div>
                  <span className="text-slate-400 block">Name:</span>
                  <span className="font-medium text-slate-800">{selectedPatient.emergencyContact?.name}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Relationship:</span>
                  <span className="font-medium text-slate-800">{selectedPatient.emergencyContact?.relationship}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Phone:</span>
                  <span className="font-medium text-slate-800">{selectedPatient.emergencyContact?.phone}</span>
                </div>
              </div>
            </div>

            {/* Medical History */}
            <div className="py-3 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Medical History</h4>
              <div>
                <span className="text-xs text-slate-400 block mb-1">Known Allergies:</span>
                <div className="flex flex-wrap gap-1.5">
                  {selectedPatient.medicalHistory?.allergies?.length > 0 ? (
                    selectedPatient.medicalHistory.allergies.map((a, i) => (
                      <span key={i} className="px-2 py-0.5 bg-rose-50 text-rose-700 text-xs rounded-md border border-rose-200 font-medium">
                        {a}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-slate-500">No known allergies</span>
                  )}
                </div>
              </div>
              <div>
                <span className="text-xs text-slate-400 block mb-1">Chronic Conditions:</span>
                <div className="flex flex-wrap gap-1.5">
                  {selectedPatient.medicalHistory?.chronicConditions?.length > 0 ? (
                    selectedPatient.medicalHistory.chronicConditions.map((c, i) => (
                      <span key={i} className="px-2 py-0.5 bg-amber-50 text-amber-700 text-xs rounded-md border border-amber-200 font-medium">
                        {c}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-slate-500">None reported</span>
                  )}
                </div>
              </div>
              {selectedPatient.medicalHistory?.notes && (
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs text-slate-600">
                  <span className="font-bold text-slate-700 block mb-0.5">Clinical Notes:</span>
                  {selectedPatient.medicalHistory.notes}
                </div>
              )}
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setSelectedPatient(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Register Patient Modal */}
      {showRegisterModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Patient Registration Intake</h3>
                <p className="text-xs text-slate-500">Enter demographic, emergency contact, and medical history info</p>
              </div>
              <button
                onClick={() => setShowRegisterModal(false)}
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

            <form onSubmit={handleRegisterSubmit} className="space-y-4">
              {/* Personal Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Full Legal Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    placeholder="e.g. Johnathan Vance"
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Date of Birth *</label>
                  <input
                    type="date"
                    required
                    value={formData.dateOfBirth}
                    onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Gender *</label>
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:outline-none"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Blood Group *</label>
                  <select
                    value={formData.bloodGroup}
                    onChange={(e) => setFormData({ ...formData, bloodGroup: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:outline-none"
                  >
                    {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((bg) => (
                      <option key={bg} value={bg}>{bg}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Phone Number *</label>
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+1 555-0199"
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Address */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-2">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Street Address</label>
                  <input
                    type="text"
                    value={formData.address.street}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        address: { ...formData.address, street: e.target.value },
                      })
                    }
                    placeholder="123 Health Ave"
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">City</label>
                  <input
                    type="text"
                    value={formData.address.city}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        address: { ...formData.address, city: e.target.value },
                      })
                    }
                    placeholder="Springfield"
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">State & Zip</label>
                  <input
                    type="text"
                    value={formData.address.state}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        address: { ...formData.address, state: e.target.value },
                      })
                    }
                    placeholder="IL 62704"
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Emergency Contact */}
              <div className="pt-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-2">
                  Emergency Contact *
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Contact Name *</label>
                    <input
                      type="text"
                      required
                      value={formData.emergencyContact.name}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          emergencyContact: { ...formData.emergencyContact, name: e.target.value },
                        })
                      }
                      placeholder="e.g. Mary Vance"
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Relationship *</label>
                    <input
                      type="text"
                      required
                      value={formData.emergencyContact.relationship}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          emergencyContact: {
                            ...formData.emergencyContact,
                            relationship: e.target.value,
                          },
                        })
                      }
                      placeholder="e.g. Spouse / Sibling"
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Contact Phone *</label>
                    <input
                      type="tel"
                      required
                      value={formData.emergencyContact.phone}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          emergencyContact: { ...formData.emergencyContact, phone: e.target.value },
                        })
                      }
                      placeholder="+1 555-0988"
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Medical History */}
              <div className="pt-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-2">
                  Medical Intake & Allergies
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      Allergies (comma-separated)
                    </label>
                    <input
                      type="text"
                      value={formData.medicalHistory.allergies}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          medicalHistory: { ...formData.medicalHistory, allergies: e.target.value },
                        })
                      }
                      placeholder="e.g. Penicillin, Latex"
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      Chronic Conditions (comma-separated)
                    </label>
                    <input
                      type="text"
                      value={formData.medicalHistory.chronicConditions}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          medicalHistory: {
                            ...formData.medicalHistory,
                            chronicConditions: e.target.value,
                          },
                        })
                      }
                      placeholder="e.g. Asthma, Hypertension"
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowRegisterModal(false)}
                  className="px-4 py-2.5 text-slate-600 hover:bg-slate-100 rounded-xl text-xs font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="px-5 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-xs font-semibold shadow-sm transition disabled:opacity-50"
                >
                  {formSubmitting ? 'Registering...' : 'Complete Patient Intake'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
