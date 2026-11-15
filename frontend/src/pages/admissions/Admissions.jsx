import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import {
  BedDouble,
  UserCheck,
  Plus,
  Search,
  CheckCircle,
  Clock,
  AlertCircle,
  FileCheck,
  DoorOpen,
  ArrowRight,
  RefreshCw,
} from 'lucide-react';

export const Admissions = () => {
  const [admissions, setAdmissions] = useState([]);
  const [roomsSummary, setRoomsSummary] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [beds, setBeds] = useState([]);
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Modals
  const [isAdmitModalOpen, setIsAdmitModalOpen] = useState(false);
  const [isDischargeModalOpen, setIsDischargeModalOpen] = useState(false);
  const [selectedAdmission, setSelectedAdmission] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Form states
  const [admitForm, setAdmitForm] = useState({
    patient: '',
    doctor: '',
    room: '',
    bed: '',
    reasonForAdmission: '',
    initialDiagnosis: '',
  });

  const [dischargeForm, setDischargeForm] = useState({
    dischargeDiagnosis: '',
    recoveryStatus: 'Recovered',
    instructions: 'Take prescribed medications and rest.',
    conditionAtDischarge: 'Stable and fully improved',
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [admRes, roomsRes, patRes, docRes] = await Promise.all([
        api.get('/admissions'),
        api.get('/admissions/rooms-beds'),
        api.get('/patients?limit=50'),
        api.get('/doctors?limit=50'),
      ]);

      setAdmissions(admRes.data.data || []);
      setRoomsSummary(roomsRes.data.summary || null);
      setRooms(roomsRes.data.rooms || []);
      setBeds(roomsRes.data.beds || []);
      setPatients(patRes.data.data || []);
      setDoctors(docRes.data.data || []);
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to load admission data' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAdmitSubmit = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    setMessage({ type: '', text: '' });

    try {
      await api.post('/admissions', admitForm);
      setMessage({ type: 'success', text: 'Patient admitted successfully and bed locked.' });
      setIsAdmitModalOpen(false);
      setAdmitForm({ patient: '', doctor: '', room: '', bed: '', reasonForAdmission: '', initialDiagnosis: '' });
      fetchData();
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to admit patient' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleDischargeSubmit = async (e) => {
    e.preventDefault();
    if (!selectedAdmission) return;
    setActionLoading(true);

    try {
      await api.put(`/admissions/${selectedAdmission._id}/discharge`, dischargeForm);
      setMessage({ type: 'success', text: 'Patient discharged successfully and bed released.' });
      setIsDischargeModalOpen(false);
      setSelectedAdmission(null);
      fetchData();
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to discharge patient' });
    } finally {
      setActionLoading(false);
    }
  };

  // Filter beds when room is selected
  const availableBedsForRoom = beds.filter(
    (b) => b.room === admitForm.room || b.room?._id === admitForm.room
  );

  const filteredAdmissions = admissions.filter((adm) => {
    const matchesSearch =
      adm.patient?.fullName?.toLowerCase().includes(search.toLowerCase()) ||
      adm.admissionId?.toLowerCase().includes(search.toLowerCase()) ||
      adm.room?.roomNumber?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter ? adm.status === statusFilter : true;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Inpatient Admissions & Bed Tracking</h1>
          <p className="text-sm text-slate-500 mt-1">
            Real-time ward occupancy matrix, patient admission, and clinical discharge lifecycle.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchData}
            className="p-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => setIsAdmitModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-primary-600 text-white rounded-xl font-medium shadow-md shadow-primary-500/20 hover:bg-primary-700 transition"
          >
            <Plus className="w-4 h-4" />
            <span>Admit Patient</span>
          </button>
        </div>
      </div>

      {message.text && (
        <div
          className={`p-4 rounded-xl flex items-start gap-3 ${
            message.type === 'error'
              ? 'bg-rose-50 text-rose-700 border border-rose-200'
              : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
          }`}
        >
          {message.type === 'error' ? (
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          ) : (
            <CheckCircle className="w-5 h-5 shrink-0 mt-0.5" />
          )}
          <span className="text-sm font-medium">{message.text}</span>
        </div>
      )}

      {/* Bed Utilization Summary KPI Cards */}
      {roomsSummary && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Beds</span>
              <div className="w-9 h-9 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center">
                <BedDouble className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3 text-2xl font-bold text-slate-800">{roomsSummary.totalBeds}</div>
            <div className="text-xs text-slate-500 mt-1">Across {roomsSummary.totalRooms} hospital rooms</div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Occupied Beds</span>
              <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <UserCheck className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3 text-2xl font-bold text-amber-600">{roomsSummary.occupiedBeds}</div>
            <div className="text-xs text-slate-500 mt-1">Active admitted patients</div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Available Beds</span>
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <CheckCircle className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3 text-2xl font-bold text-emerald-600">{roomsSummary.availableBeds}</div>
            <div className="text-xs text-slate-500 mt-1">Ready for emergency intake</div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Occupancy Rate</span>
              <div className="w-9 h-9 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
                <Clock className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3 text-2xl font-bold text-slate-800">{roomsSummary.occupancyRate}%</div>
            <div className="text-xs text-slate-500 mt-1">Current ward utilization</div>
          </div>
        </div>
      )}

      {/* Visual Bed Matrix Grid */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
        <h2 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2">
          <DoorOpen className="w-5 h-5 text-primary-600" />
          <span>Interactive Ward Bed Matrix</span>
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
          {beds.map((bed) => {
            const isOcc = bed.isOccupied || bed.status === 'OCCUPIED';
            return (
              <div
                key={bed._id}
                className={`p-3.5 rounded-xl border text-center transition-all ${
                  isOcc
                    ? 'bg-rose-50/50 border-rose-200 text-rose-800 shadow-sm'
                    : 'bg-emerald-50/40 border-emerald-200 text-emerald-800 hover:shadow-md'
                }`}
              >
                <div className="flex justify-center mb-1.5">
                  <BedDouble className={`w-6 h-6 ${isOcc ? 'text-rose-500' : 'text-emerald-500'}`} />
                </div>
                <div className="font-bold text-sm text-slate-800">{bed.bedNumber}</div>
                <div className="text-[11px] font-medium text-slate-500 capitalize">{bed.bedType.toLowerCase()}</div>
                <div className="mt-2">
                  <span
                    className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                      isOcc ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'
                    }`}
                  >
                    {isOcc ? 'Occupied' : 'Available'}
                  </span>
                </div>
                {bed.currentPatient && (
                  <div className="text-[11px] text-slate-600 truncate mt-1.5 font-medium">
                    {bed.currentPatient.fullName}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search by Patient Name, Admission ID, or Room..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 border border-slate-200 rounded-xl text-sm text-slate-600 focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          <option value="">All Statuses</option>
          <option value="Admitted">Admitted</option>
          <option value="Discharged">Discharged</option>
          <option value="Under Treatment">Under Treatment</option>
        </select>
      </div>

      {/* Admissions Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-semibold border-b border-slate-200">
              <tr>
                <th className="px-6 py-4">Admission ID</th>
                <th className="px-6 py-4">Patient</th>
                <th className="px-6 py-4">Room & Bed</th>
                <th className="px-6 py-4">Attending Doctor</th>
                <th className="px-6 py-4">Admitted Date</th>
                <th className="px-6 py-4">Recovery Status</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="8" className="px-6 py-12 text-center text-slate-400">
                    <div className="inline-block w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
                    <p className="mt-2 text-xs">Loading inpatient admission records...</p>
                  </td>
                </tr>
              ) : filteredAdmissions.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-6 py-12 text-center text-slate-400">
                    No admission records match your filter criteria.
                  </td>
                </tr>
              ) : (
                filteredAdmissions.map((adm) => (
                  <tr key={adm._id} className="hover:bg-slate-50/60 transition">
                    <td className="px-6 py-4 font-semibold text-slate-800">{adm.admissionId}</td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-900">{adm.patient?.fullName || 'N/A'}</div>
                      <div className="text-xs text-slate-400">{adm.patient?.patientId}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-semibold text-slate-800">Room {adm.room?.roomNumber}</span>
                      <span className="text-xs text-slate-500 block">Bed {adm.bed?.bedNumber}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-800">{adm.doctor?.fullName || 'N/A'}</div>
                      <div className="text-xs text-slate-400">{adm.doctor?.specialization}</div>
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-600">
                      {new Date(adm.admissionDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-block text-xs font-semibold px-2.5 py-0.5 rounded-full ${
                          adm.recoveryStatus === 'Recovered'
                            ? 'bg-emerald-100 text-emerald-800'
                            : adm.recoveryStatus === 'Significantly Improved'
                            ? 'bg-sky-100 text-sky-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {adm.recoveryStatus}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-block text-xs font-semibold px-2.5 py-0.5 rounded-full ${
                          adm.status === 'Admitted'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {adm.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {adm.status === 'Admitted' ? (
                        <button
                          onClick={() => {
                            setSelectedAdmission(adm);
                            setIsDischargeModalOpen(true);
                          }}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-medium transition"
                        >
                          Discharge
                        </button>
                      ) : (
                        <span className="text-xs text-slate-400 font-medium">Discharged</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Admit Patient Modal */}
      {isAdmitModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-800">Inpatient Admission Wizard</h3>
              <button
                onClick={() => setIsAdmitModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-semibold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAdmitSubmit} className="space-y-4 mt-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Select Patient *</label>
                  <select
                    required
                    value={admitForm.patient}
                    onChange={(e) => setAdmitForm({ ...admitForm, patient: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="">-- Choose Patient --</option>
                    {patients.map((p) => (
                      <option key={p._id} value={p._id}>
                        {p.fullName} ({p.patientId})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Attending Doctor *</label>
                  <select
                    required
                    value={admitForm.doctor}
                    onChange={(e) => setAdmitForm({ ...admitForm, doctor: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="">-- Choose Doctor --</option>
                    {doctors.map((d) => (
                      <option key={d._id} value={d._id}>
                        {d.fullName} ({d.specialization})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Select Room *</label>
                  <select
                    required
                    value={admitForm.room}
                    onChange={(e) => setAdmitForm({ ...admitForm, room: e.target.value, bed: '' })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="">-- Choose Room --</option>
                    {rooms.map((r) => (
                      <option key={r._id} value={r._id}>
                        Room {r.roomNumber} ({r.roomType} - ${r.dailyRate}/day)
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Available Bed *</label>
                  <select
                    required
                    value={admitForm.bed}
                    onChange={(e) => setAdmitForm({ ...admitForm, bed: e.target.value })}
                    disabled={!admitForm.room}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 disabled:opacity-50"
                  >
                    <option value="">-- Choose Bed --</option>
                    {availableBedsForRoom
                      .filter((b) => !b.isOccupied && b.status === 'AVAILABLE')
                      .map((b) => (
                        <option key={b._id} value={b._id}>
                          Bed {b.bedNumber} ({b.bedType})
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Reason for Admission *</label>
                <textarea
                  required
                  rows="2"
                  value={admitForm.reasonForAdmission}
                  onChange={(e) => setAdmitForm({ ...admitForm, reasonForAdmission: e.target.value })}
                  placeholder="e.g. Acute unstable coronary syndrome requiring continuous telemetry monitoring"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Initial Clinical Diagnosis</label>
                <input
                  type="text"
                  value={admitForm.initialDiagnosis}
                  onChange={(e) => setAdmitForm({ ...admitForm, initialDiagnosis: e.target.value })}
                  placeholder="e.g. Stage 3 Angina Pectoris / Suspected STEMI"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAdmitModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 bg-primary-600 text-white rounded-xl text-sm font-semibold hover:bg-primary-700 disabled:opacity-50"
                >
                  {actionLoading ? 'Admitting...' : 'Confirm Admission'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Discharge Modal */}
      {isDischargeModalOpen && selectedAdmission && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-800">
                Clinical Discharge: {selectedAdmission.patient?.fullName}
              </h3>
              <button
                onClick={() => setIsDischargeModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-semibold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleDischargeSubmit} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Discharge Clinical Diagnosis *</label>
                <input
                  type="text"
                  required
                  value={dischargeForm.dischargeDiagnosis}
                  onChange={(e) => setDischargeForm({ ...dischargeForm, dischargeDiagnosis: e.target.value })}
                  placeholder="e.g. Resolved Coronary Ischemia, medically stabilized"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Clinical Recovery Outcome *</label>
                <select
                  value={dischargeForm.recoveryStatus}
                  onChange={(e) => setDischargeForm({ ...dischargeForm, recoveryStatus: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-primary-500"
                >
                  <option value="Recovered">Recovered (Full Remission)</option>
                  <option value="Significantly Improved">Significantly Improved</option>
                  <option value="Under Treatment">Under Treatment (Outpatient follow-up)</option>
                  <option value="Transferred">Transferred to Specialized Facility</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Discharge Instructions & Rx</label>
                <textarea
                  rows="2"
                  value={dischargeForm.instructions}
                  onChange={(e) => setDischargeForm({ ...dischargeForm, instructions: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Condition at Discharge</label>
                <input
                  type="text"
                  value={dischargeForm.conditionAtDischarge}
                  onChange={(e) => setDischargeForm({ ...dischargeForm, conditionAtDischarge: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsDischargeModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-emerald-700 disabled:opacity-50"
                >
                  {actionLoading ? 'Discharging...' : 'Confirm Discharge & Free Bed'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
