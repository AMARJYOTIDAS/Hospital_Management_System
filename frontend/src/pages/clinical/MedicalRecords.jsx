import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import api from '../../api/axios';
import {
  FileText,
  Activity,
  Heart,
  Thermometer,
  Calendar,
  User,
  PlusCircle,
  Clock,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  X,
  Pill,
} from 'lucide-react';

export const MedicalRecords = () => {
  const { user } = useSelector((state) => state.auth);
  const [patients, setPatients] = useState([]);
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [records, setRecords] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showConsultationModal, setShowConsultationModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Consultation Form State
  const initialFormState = {
    patientId: '',
    vitalSigns: {
      bloodPressure: '120/80',
      heartRateBpm: 72,
      temperatureCelsius: 36.6,
      respiratoryRate: 16,
      oxygenSaturationPct: 98,
    },
    symptoms: '',
    clinicalObservations: '',
    diagnosis: '',
    treatmentPlan: '',
    recoveryStatus: 'Under Treatment',
    followUpDate: '',
    // Optional attached prescription
    prescribeMedicines: false,
    rxItems: [{ medicine: '', dosage: '500mg', frequency: 'Twice daily', durationDays: 7, quantityPrescribed: 14 }],
  };
  const [formData, setFormData] = useState(initialFormState);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const [patRes, medRes] = await Promise.all([
        api.get('/patients?limit=50'),
        api.get('/pharmacy/medicines'),
      ]);
      setPatients(patRes.data.patients || []);
      setMedicines(medRes.data.medicines || []);

      if (patRes.data.patients?.length > 0) {
        setSelectedPatientId(patRes.data.patients[0]._id);
      }
    } catch (err) {
      console.error('Failed to load consultation data', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPatientRecords = async (patientId) => {
    if (!patientId) return;
    try {
      const [recRes, rxRes] = await Promise.all([
        api.get(`/medical-records/patient/${patientId}`),
        api.get(`/prescriptions?patient=${patientId}`),
      ]);
      setRecords(recRes.data.records || []);
      setPrescriptions(rxRes.data.prescriptions || []);
    } catch (err) {
      console.error('Failed to load patient records', err);
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (selectedPatientId) {
      fetchPatientRecords(selectedPatientId);
    }
  }, [selectedPatientId]);

  const handleConsultationSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');
    setSubmitting(true);

    try {
      const recPayload = {
        patientId: formData.patientId || selectedPatientId,
        vitalSigns: formData.vitalSigns,
        symptoms: formData.symptoms,
        clinicalObservations: formData.clinicalObservations,
        diagnosis: formData.diagnosis,
        treatmentPlan: formData.treatmentPlan,
        recoveryStatus: formData.recoveryStatus,
        followUpDate: formData.followUpDate || null,
      };

      const recRes = await api.post('/medical-records', recPayload);

      // If prescription items added, create prescription
      if (formData.prescribeMedicines && formData.rxItems.length > 0 && formData.rxItems[0].medicine) {
        await api.post('/prescriptions', {
          patientId: formData.patientId || selectedPatientId,
          medicalRecordId: recRes.data.medicalRecord._id,
          medicines: formData.rxItems,
          notes: `Prescribed during consultation for ${formData.diagnosis}`,
        });
      }

      setSuccessMessage(`Medical record #${recRes.data.medicalRecord.recordNumber} saved successfully!`);
      setTimeout(() => {
        setShowConsultationModal(false);
        setSuccessMessage('');
      }, 1500);
      fetchPatientRecords(selectedPatientId);
    } catch (err) {
      setErrorMessage(err.response?.data?.message || 'Failed to save clinical consultation');
    } finally {
      setSubmitting(false);
    }
  };

  const selectedPatient = patients.find((p) => p._id === selectedPatientId);

  const getRecoveryBadge = (status) => {
    switch (status) {
      case 'Recovered':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'Significantly Improved':
        return 'bg-teal-100 text-teal-800 border-teal-300';
      case 'Under Treatment':
        return 'bg-sky-100 text-sky-800 border-sky-300';
      case 'Critical':
      case 'Deteriorating':
        return 'bg-rose-100 text-rose-800 border-rose-300';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-300';
    }
  };

  const isDoctor = user?.role === 'DOCTOR' || user?.role === 'DEPARTMENT_HEAD' || user?.role === 'SUPER_ADMIN';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Electronic Medical Records (EMR)</h1>
          <p className="text-xs text-slate-500 mt-1">
            Clinical consultations, vital signs documentation, diagnosis, and recovery outcomes
          </p>
        </div>
        {isDoctor && (
          <button
            onClick={() => {
              setFormData({
                ...initialFormState,
                patientId: selectedPatientId,
                rxItems: [{ medicine: medicines[0]?._id || '', dosage: '500mg', frequency: 'Twice daily', durationDays: 7, quantityPrescribed: 14 }],
              });
              setErrorMessage('');
              setSuccessMessage('');
              setShowConsultationModal(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-semibold text-sm rounded-xl shadow-sm transition shadow-primary-600/20"
          >
            <PlusCircle className="w-4 h-4" />
            New Clinical Consultation
          </button>
        )}
      </div>

      {/* Patient Selector */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex items-center gap-3 w-full md:w-auto">
          <User className="w-5 h-5 text-primary-600 shrink-0" />
          <div className="text-xs font-semibold text-slate-700">Select Patient:</div>
          <select
            value={selectedPatientId}
            onChange={(e) => setSelectedPatientId(e.target.value)}
            className="px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 font-medium"
          >
            {patients.map((p) => (
              <option key={p._id} value={p._id}>
                {p.fullName} ({p.patientId} • Blood: {p.bloodGroup})
              </option>
            ))}
          </select>
        </div>

        {selectedPatient && (
          <div className="flex items-center gap-3 text-xs text-slate-500">
            <span>Age: <strong className="text-slate-800">
              {Math.abs(new Date(Date.now() - new Date(selectedPatient.dateOfBirth).getTime()).getUTCFullYear() - 1970)} yrs
            </strong></span>
            <span>•</span>
            <span>Allergies: <strong className="text-rose-600">
              {selectedPatient.medicalHistory?.allergies?.join(', ') || 'None'}
            </strong></span>
          </div>
        )}
      </div>

      {/* Patient Timeline & Clinical Consultations */}
      <div className="space-y-4">
        {records.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center text-slate-400">
            <FileText className="w-12 h-12 mx-auto text-slate-300 mb-2" />
            <p className="font-semibold text-slate-700">No medical records documented yet</p>
            <p className="text-xs mt-1">Start a consultation above to record diagnosis and vitals.</p>
          </div>
        ) : (
          records.map((rec) => (
            <div
              key={rec._id}
              className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-4 hover:border-primary-200 transition"
            >
              {/* Top Banner */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary-50 text-primary-700 flex items-center justify-center font-bold text-xs">
                    EMR
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">{rec.diagnosis}</h3>
                    <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                      <span>{rec.recordNumber}</span>
                      <span>•</span>
                      <span>Dr. {rec.doctor?.fullName} ({rec.doctor?.specialization})</span>
                      <span>•</span>
                      <span>{new Date(rec.examinationDate).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-400">Recovery Status:</span>
                  <span className={`text-xs px-3 py-1 rounded-full font-bold border ${getRecoveryBadge(rec.recoveryStatus)}`}>
                    {rec.recoveryStatus}
                  </span>
                </div>
              </div>

              {/* Vitals Strip */}
              {rec.vitalSigns && (
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 p-3 bg-slate-50/80 rounded-xl text-xs">
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Blood Pressure</span>
                    <span className="font-bold text-slate-800">{rec.vitalSigns.bloodPressure || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Heart Rate</span>
                    <span className="font-bold text-slate-800">{rec.vitalSigns.heartRateBpm ? `${rec.vitalSigns.heartRateBpm} bpm` : 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Temperature</span>
                    <span className="font-bold text-slate-800">{rec.vitalSigns.temperatureCelsius ? `${rec.vitalSigns.temperatureCelsius} °C` : 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Resp. Rate</span>
                    <span className="font-bold text-slate-800">{rec.vitalSigns.respiratoryRate ? `${rec.vitalSigns.respiratoryRate} /min` : 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Oxygen Saturation</span>
                    <span className="font-bold text-emerald-600">{rec.vitalSigns.oxygenSaturationPct ? `${rec.vitalSigns.oxygenSaturationPct}%` : 'N/A'}</span>
                  </div>
                </div>
              )}

              {/* Clinical Observations & Treatment */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-600">
                <div className="p-3 bg-white border border-slate-100 rounded-xl">
                  <span className="font-bold text-slate-800 block mb-1">Clinical Observations & Examination:</span>
                  <p className="leading-relaxed">{rec.clinicalObservations}</p>
                </div>
                <div className="p-3 bg-white border border-slate-100 rounded-xl">
                  <span className="font-bold text-slate-800 block mb-1">Prescribed Treatment Plan:</span>
                  <p className="leading-relaxed">{rec.treatmentPlan}</p>
                </div>
              </div>

              {/* Follow-up Note */}
              {rec.followUpDate && (
                <div className="text-xs text-slate-500 flex items-center gap-1.5 pt-1">
                  <Calendar className="w-3.5 h-3.5 text-primary-500" />
                  <span>Scheduled Follow-Up: <strong>{new Date(rec.followUpDate).toLocaleDateString()}</strong></span>
                </div>
              )}
            </div>
          ))
        )}

        {/* Prescriptions Section for this patient */}
        {prescriptions.length > 0 && (
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-4">
            <div className="flex items-center gap-2">
              <Pill className="w-5 h-5 text-emerald-600" />
              <h3 className="text-base font-bold text-slate-900">Active Patient Prescriptions</h3>
            </div>
            <div className="space-y-3">
              {prescriptions.map((rx) => (
                <div key={rx._id} className="p-4 rounded-xl border border-slate-100 bg-slate-50/50">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-emerald-700">{rx.prescriptionNumber}</span>
                    <span
                      className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                        rx.status === 'Dispensed' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {rx.status}
                    </span>
                  </div>
                  <div className="divide-y divide-slate-200/60">
                    {rx.medicines?.map((m, idx) => (
                      <div key={idx} className="py-2 flex items-center justify-between text-xs">
                        <div>
                          <strong className="text-slate-800">{m.medicine?.name}</strong>
                          <span className="text-slate-400 ml-2">({m.dosage} • {m.frequency})</span>
                        </div>
                        <div className="text-slate-500">
                          Qty: <strong>{m.quantityPrescribed}</strong> units ({m.durationDays} days)
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* New Consultation Modal */}
      {showConsultationModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Clinical Consultation Documentation</h3>
                <p className="text-xs text-slate-500">Record examination vitals, diagnosis, and treatment protocol</p>
              </div>
              <button
                onClick={() => setShowConsultationModal(false)}
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

            <form onSubmit={handleConsultationSubmit} className="space-y-4">
              {/* Vital Signs */}
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-2">
                  Vital Signs
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Blood Pressure</label>
                    <input
                      type="text"
                      value={formData.vitalSigns.bloodPressure}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          vitalSigns: { ...formData.vitalSigns, bloodPressure: e.target.value },
                        })
                      }
                      placeholder="120/80"
                      className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Heart Rate (bpm)</label>
                    <input
                      type="number"
                      value={formData.vitalSigns.heartRateBpm}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          vitalSigns: { ...formData.vitalSigns, heartRateBpm: Number(e.target.value) },
                        })
                      }
                      placeholder="72"
                      className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Temp (°C)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={formData.vitalSigns.temperatureCelsius}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          vitalSigns: { ...formData.vitalSigns, temperatureCelsius: Number(e.target.value) },
                        })
                      }
                      placeholder="36.6"
                      className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Resp. Rate</label>
                    <input
                      type="number"
                      value={formData.vitalSigns.respiratoryRate}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          vitalSigns: { ...formData.vitalSigns, respiratoryRate: Number(e.target.value) },
                        })
                      }
                      placeholder="16"
                      className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">SpO2 (%)</label>
                    <input
                      type="number"
                      value={formData.vitalSigns.oxygenSaturationPct}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          vitalSigns: { ...formData.vitalSigns, oxygenSaturationPct: Number(e.target.value) },
                        })
                      }
                      placeholder="98"
                      className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg"
                    />
                  </div>
                </div>
              </div>

              {/* Diagnosis and Observations */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Primary Clinical Diagnosis *</label>
                <input
                  type="text"
                  required
                  value={formData.diagnosis}
                  onChange={(e) => setFormData({ ...formData, diagnosis: e.target.value })}
                  placeholder="e.g. Stage 1 Essential Hypertension"
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Clinical Observations *</label>
                  <textarea
                    rows={3}
                    required
                    value={formData.clinicalObservations}
                    onChange={(e) => setFormData({ ...formData, clinicalObservations: e.target.value })}
                    placeholder="Physical examination notes, stethoscope findings..."
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Treatment Plan *</label>
                  <textarea
                    rows={3}
                    required
                    value={formData.treatmentPlan}
                    onChange={(e) => setFormData({ ...formData, treatmentPlan: e.target.value })}
                    placeholder="Therapy regimen, lifestyle changes, dietary guidance..."
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Recovery Clinical Status *</label>
                  <select
                    value={formData.recoveryStatus}
                    onChange={(e) => setFormData({ ...formData, recoveryStatus: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:outline-none"
                  >
                    <option value="Recovered">Recovered</option>
                    <option value="Significantly Improved">Significantly Improved</option>
                    <option value="Under Treatment">Under Treatment</option>
                    <option value="Critical">Critical</option>
                    <option value="Deteriorating">Deteriorating</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Next Follow-Up Date</label>
                  <input
                    type="date"
                    value={formData.followUpDate}
                    onChange={(e) => setFormData({ ...formData, followUpDate: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Digital Prescription Toggle */}
              <div className="pt-2 border-t border-slate-100">
                <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.prescribeMedicines}
                    onChange={(e) => setFormData({ ...formData, prescribeMedicines: e.target.checked })}
                    className="rounded text-primary-600 focus:ring-primary-500"
                  />
                  <span>Attach Electronic Prescription (Rx)</span>
                </label>

                {formData.prescribeMedicines && (
                  <div className="mt-3 p-3 bg-slate-50 rounded-xl space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                      <div className="sm:col-span-2">
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">Drug *</label>
                        <select
                          value={formData.rxItems[0]?.medicine}
                          onChange={(e) => {
                            const updated = [...formData.rxItems];
                            updated[0].medicine = e.target.value;
                            setFormData({ ...formData, rxItems: updated });
                          }}
                          className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg"
                        >
                          <option value="">Select Drug</option>
                          {medicines.map((m) => (
                            <option key={m._id} value={m._id}>
                              {m.name} ({m.availableQuantity} in stock)
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">Dosage</label>
                        <input
                          type="text"
                          value={formData.rxItems[0]?.dosage}
                          onChange={(e) => {
                            const updated = [...formData.rxItems];
                            updated[0].dosage = e.target.value;
                            setFormData({ ...formData, rxItems: updated });
                          }}
                          className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">Quantity</label>
                        <input
                          type="number"
                          min="1"
                          value={formData.rxItems[0]?.quantityPrescribed}
                          onChange={(e) => {
                            const updated = [...formData.rxItems];
                            updated[0].quantityPrescribed = Number(e.target.value);
                            setFormData({ ...formData, rxItems: updated });
                          }}
                          className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowConsultationModal(false)}
                  className="px-4 py-2.5 text-slate-600 hover:bg-slate-100 rounded-xl text-xs font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-xs font-semibold shadow-sm transition disabled:opacity-50"
                >
                  {submitting ? 'Saving EMR Record...' : 'Complete Clinical Consultation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
