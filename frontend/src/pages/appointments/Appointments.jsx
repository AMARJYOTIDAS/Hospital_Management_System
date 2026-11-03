import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import api from '../../api/axios';
import {
  Calendar,
  Clock,
  User,
  UserCheck,
  CheckCircle,
  AlertCircle,
  Filter,
  PlusCircle,
  XCircle,
  RefreshCw,
  X,
  DollarSign,
} from 'lucide-react';

export const Appointments = () => {
  const { user } = useSelector((state) => state.auth);
  const [appointments, setAppointments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [showBookModal, setShowBookModal] = useState(false);
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Booking Form State
  const initialBookingState = {
    patientId: '',
    doctorId: '',
    appointmentDate: new Date().toISOString().split('T')[0],
    timeSlot: { startTime: '09:00', endTime: '09:30' },
    symptoms: '',
  };
  const [bookingData, setBookingData] = useState(initialBookingState);

  // Reschedule Form State
  const [rescheduleData, setRescheduleData] = useState({
    newDate: '',
    newTimeSlot: { startTime: '10:00', endTime: '10:30' },
  });

  const timeSlots = [
    { startTime: '09:00', endTime: '09:30' },
    { startTime: '09:30', endTime: '10:00' },
    { startTime: '10:00', endTime: '10:30' },
    { startTime: '10:30', endTime: '11:00' },
    { startTime: '11:00', endTime: '11:30' },
    { startTime: '11:30', endTime: '12:00' },
    { startTime: '14:00', endTime: '14:30' },
    { startTime: '14:30', endTime: '15:00' },
    { startTime: '15:00', endTime: '15:30' },
    { startTime: '15:30', endTime: '16:00' },
    { startTime: '16:00', endTime: '16:30' },
  ];

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const params = {};
      if (statusFilter) params.status = statusFilter;

      // Patients and Doctors can query /my-appointments or full list depending on role
      const endpoint = (user?.role === 'PATIENT' || user?.role === 'DOCTOR')
        ? '/appointments/my-appointments'
        : '/appointments';

      const res = await api.get(endpoint, { params });
      setAppointments(res.data.appointments || []);
    } catch (err) {
      console.error('Failed to load appointments', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchDropdownData = async () => {
    try {
      const [docRes, patRes] = await Promise.all([
        api.get('/doctors'),
        api.get('/patients?limit=100'),
      ]);
      setDoctors(docRes.data.doctors || []);
      setPatients(patRes.data.patients || []);
      if (docRes.data.doctors?.length > 0 && !bookingData.doctorId) {
        setBookingData((prev) => ({ ...prev, doctorId: docRes.data.doctors[0]._id }));
      }
      if (patRes.data.patients?.length > 0 && !bookingData.patientId) {
        setBookingData((prev) => ({ ...prev, patientId: patRes.data.patients[0]._id }));
      }
    } catch (err) {
      console.error('Failed to load dropdown records', err);
    }
  };

  useEffect(() => {
    fetchAppointments();
    fetchDropdownData();
  }, [statusFilter]);

  const handleBookSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');
    setSubmitting(true);

    try {
      const res = await api.post('/appointments', bookingData);
      setSuccessMessage(`Appointment #${res.data.appointment.appointmentNumber} confirmed!`);
      setBookingData(initialBookingState);
      setTimeout(() => {
        setShowBookModal(false);
        setSuccessMessage('');
      }, 1500);
      fetchAppointments();
    } catch (err) {
      setErrorMessage(err.response?.data?.message || 'Failed to book appointment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusChange = async (appointmentId, newStatus) => {
    try {
      await api.patch(`/appointments/${appointmentId}/status`, { status: newStatus });
      fetchAppointments();
    } catch (err) {
      alert(err.response?.data?.message || 'Status update failed');
    }
  };

  const handleRescheduleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');
    setSubmitting(true);

    try {
      await api.put(`/appointments/${selectedAppointment._id}/reschedule`, rescheduleData);
      setSuccessMessage('Appointment rescheduled successfully!');
      setTimeout(() => {
        setShowRescheduleModal(false);
        setSuccessMessage('');
      }, 1500);
      fetchAppointments();
    } catch (err) {
      setErrorMessage(err.response?.data?.message || 'Rescheduling failed');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Confirmed':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Completed':
        return 'bg-sky-50 text-sky-700 border-sky-200';
      case 'Pending':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Cancelled':
      case 'No-show':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  const selectedDoctorObj = doctors.find((d) => d._id === bookingData.doctorId);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Appointment Scheduling</h1>
          <p className="text-xs text-slate-500 mt-1">
            Outpatient bookings, doctor consultation slots, and scheduling conflict management
          </p>
        </div>
        <button
          onClick={() => {
            setErrorMessage('');
            setSuccessMessage('');
            setShowBookModal(true);
          }}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-semibold text-sm rounded-xl shadow-sm transition shadow-primary-600/20"
        >
          <PlusCircle className="w-4 h-4" />
          Book Appointment
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
            <Filter className="w-3.5 h-3.5" /> Status Filter:
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 font-medium"
          >
            <option value="">All Appointments</option>
            <option value="Confirmed">Confirmed</option>
            <option value="Pending">Pending</option>
            <option value="Completed">Completed</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        </div>
        <span className="text-xs text-slate-400 font-medium">{appointments.length} Total Records</span>
      </div>

      {/* Appointments Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-xs text-slate-400 mt-3 font-medium">Loading appointments...</p>
          </div>
        ) : appointments.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <Calendar className="w-12 h-12 mx-auto text-slate-300 mb-2" />
            <p className="font-semibold text-slate-700">No appointments scheduled</p>
            <p className="text-xs mt-1">Book an appointment using the button above.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50/80 text-xs font-semibold uppercase tracking-wider text-slate-400 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3.5">Appointment #</th>
                  <th className="px-6 py-3.5">Date & Time</th>
                  <th className="px-6 py-3.5">Patient Details</th>
                  <th className="px-6 py-3.5">Doctor & Specialty</th>
                  <th className="px-6 py-3.5">Fee & Payment</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {appointments.map((apt) => (
                  <tr key={apt._id} className="hover:bg-slate-50/70 transition">
                    <td className="px-6 py-4 font-bold text-primary-700">{apt.appointmentNumber}</td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        {new Date(apt.appointmentDate).toLocaleDateString()}
                      </div>
                      <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                        <Clock className="w-3 h-3 text-slate-400" />
                        {apt.timeSlot?.startTime} - {apt.timeSlot?.endTime}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-800">{apt.patient?.fullName}</div>
                      <div className="text-xs text-slate-400">
                        {apt.patient?.patientId} • {apt.patient?.phone}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-800">{apt.doctor?.fullName}</div>
                      <div className="text-xs text-primary-600">{apt.doctor?.specialization}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-900">${apt.fee}</div>
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                          apt.isPaid ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {apt.isPaid ? 'Paid' : 'Unpaid'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`text-xs px-2.5 py-1 rounded-full font-semibold border ${getStatusBadge(
                          apt.status
                        )}`}
                      >
                        {apt.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        {apt.status !== 'Completed' && apt.status !== 'Cancelled' && (
                          <>
                            <button
                              onClick={() => handleStatusChange(apt._id, 'Completed')}
                              title="Mark Completed"
                              className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
                                setSelectedAppointment(apt);
                                setRescheduleData({
                                  newDate: new Date(apt.appointmentDate).toISOString().split('T')[0],
                                  newTimeSlot: apt.timeSlot,
                                });
                                setErrorMessage('');
                                setSuccessMessage('');
                                setShowRescheduleModal(true);
                              }}
                              title="Reschedule"
                              className="p-1.5 text-sky-600 hover:bg-sky-50 rounded-lg transition"
                            >
                              <RefreshCw className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleStatusChange(apt._id, 'Cancelled')}
                              title="Cancel Appointment"
                              className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Book Appointment Modal */}
      {showBookModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Book Patient Appointment</h3>
                <p className="text-xs text-slate-500">Select doctor, date, and conflict-checked time slot</p>
              </div>
              <button
                onClick={() => setShowBookModal(false)}
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

            <form onSubmit={handleBookSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Select Patient *</label>
                <select
                  required
                  value={bookingData.patientId}
                  onChange={(e) => setBookingData({ ...bookingData, patientId: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:outline-none"
                >
                  <option value="">Select a registered patient</option>
                  {patients.map((p) => (
                    <option key={p._id} value={p._id}>
                      {p.fullName} ({p.patientId} - {p.phone})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Attending Doctor *</label>
                <select
                  required
                  value={bookingData.doctorId}
                  onChange={(e) => setBookingData({ ...bookingData, doctorId: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:outline-none"
                >
                  <option value="">Select doctor</option>
                  {doctors.map((d) => (
                    <option key={d._id} value={d._id}>
                      {d.fullName} - {d.specialization} (${d.consultationFee})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Appointment Date *</label>
                  <input
                    type="date"
                    required
                    value={bookingData.appointmentDate}
                    onChange={(e) => setBookingData({ ...bookingData, appointmentDate: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Available Slot *</label>
                  <select
                    value={bookingData.timeSlot.startTime}
                    onChange={(e) => {
                      const match = timeSlots.find((s) => s.startTime === e.target.value);
                      if (match) setBookingData({ ...bookingData, timeSlot: match });
                    }}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:outline-none"
                  >
                    {timeSlots.map((slot) => (
                      <option key={slot.startTime} value={slot.startTime}>
                        {slot.startTime} - {slot.endTime}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {selectedDoctorObj && (
                <div className="p-3 bg-primary-50/60 rounded-xl border border-primary-100 flex items-center justify-between text-xs text-primary-900">
                  <span className="font-medium">Standard Consultation Fee:</span>
                  <span className="font-extrabold text-sm text-primary-700">${selectedDoctorObj.consultationFee}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Primary Symptoms / Reason</label>
                <textarea
                  rows={3}
                  value={bookingData.symptoms}
                  onChange={(e) => setBookingData({ ...bookingData, symptoms: e.target.value })}
                  placeholder="Describe patient symptoms or reason for visit..."
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowBookModal(false)}
                  className="px-4 py-2.5 text-slate-600 hover:bg-slate-100 rounded-xl text-xs font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-xs font-semibold shadow-sm transition disabled:opacity-50"
                >
                  {submitting ? 'Booking Slot...' : 'Confirm Appointment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reschedule Modal */}
      {showRescheduleModal && selectedAppointment && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Reschedule #{selectedAppointment.appointmentNumber}
                </h3>
                <p className="text-xs text-slate-500">Pick a new date and time slot</p>
              </div>
              <button
                onClick={() => setShowRescheduleModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
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

            <form onSubmit={handleRescheduleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">New Appointment Date</label>
                <input
                  type="date"
                  required
                  value={rescheduleData.newDate}
                  onChange={(e) => setRescheduleData({ ...rescheduleData, newDate: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">New Time Slot</label>
                <select
                  value={rescheduleData.newTimeSlot.startTime}
                  onChange={(e) => {
                    const match = timeSlots.find((s) => s.startTime === e.target.value);
                    if (match) setRescheduleData({ ...rescheduleData, newTimeSlot: match });
                  }}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:outline-none"
                >
                  {timeSlots.map((slot) => (
                    <option key={slot.startTime} value={slot.startTime}>
                      {slot.startTime} - {slot.endTime}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowRescheduleModal(false)}
                  className="px-3.5 py-2 text-slate-600 hover:bg-slate-100 rounded-xl text-xs font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-xs font-semibold transition disabled:opacity-50"
                >
                  {submitting ? 'Rescheduling...' : 'Save Reschedule'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
