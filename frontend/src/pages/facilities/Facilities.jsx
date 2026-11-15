import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import {
  Building2,
  CheckCircle,
  AlertTriangle,
  Wrench,
  Plus,
  RefreshCw,
  Search,
  Sliders,
  Cpu,
  Layers,
} from 'lucide-react';

export const Facilities = () => {
  const [facilities, setFacilities] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [newFacility, setNewFacility] = useState({
    name: '',
    facilityType: 'OPERATION_THEATER',
    locationFloor: '3rd Floor',
    locationWing: 'Surgical Wing',
    capacity: 1,
    status: 'AVAILABLE',
  });

  const fetchFacilities = async () => {
    try {
      setLoading(true);
      const res = await api.get('/facilities');
      setFacilities(res.data.data || []);
      setSummary(res.data.summary || null);
    } catch (err) {
      console.error('Failed to load facilities', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFacilities();
  }, []);

  const handleStatusChange = async (facilityId, newStatus) => {
    try {
      await api.patch(`/facilities/${facilityId}/status`, { status: newStatus });
      fetchFacilities();
    } catch (err) {
      console.error('Failed to update status', err);
    }
  };

  const handleCreateFacility = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      await api.post('/facilities', {
        name: newFacility.name,
        facilityType: newFacility.facilityType,
        location: {
          floor: newFacility.locationFloor,
          wing: newFacility.locationWing,
        },
        capacity: Number(newFacility.capacity),
        status: newFacility.status,
      });
      setIsModalOpen(false);
      setNewFacility({
        name: '',
        facilityType: 'OPERATION_THEATER',
        locationFloor: '3rd Floor',
        locationWing: 'Surgical Wing',
        capacity: 1,
        status: 'AVAILABLE',
      });
      fetchFacilities();
    } catch (err) {
      console.error('Failed to create facility', err);
    } finally {
      setActionLoading(false);
    }
  };

  const filteredFacilities = facilities.filter((f) => {
    const matchesSearch = f.name?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter ? f.status === statusFilter : true;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Hospital Facilities & Medical Suites</h1>
          <p className="text-sm text-slate-500 mt-1">
            Operation Theaters, Intensive Care Units, Diagnostic Suites, and clinical equipment maintenance.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchFacilities}
            className="p-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-primary-600 text-white rounded-xl font-semibold shadow-md shadow-primary-500/20 hover:bg-primary-700 transition text-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Add Facility Suite</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      {summary && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Suites</span>
              <div className="w-9 h-9 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center">
                <Building2 className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3 text-3xl font-extrabold text-slate-800">{summary.total}</div>
            <div className="text-xs text-slate-500 mt-1">Specialized clinical environments</div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Fully Operational</span>
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <CheckCircle className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3 text-3xl font-extrabold text-emerald-600">{summary.operational}</div>
            <div className="text-xs text-slate-500 mt-1">Available or actively performing procedures</div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Under Maintenance / Sterilizing</span>
              <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <Wrench className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3 text-3xl font-extrabold text-amber-600">{summary.underMaintenance}</div>
            <div className="text-xs text-slate-500 mt-1">Scheduled disinfection & maintenance</div>
          </div>
        </div>
      )}

      {/* Search Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search facility by name or equipment..."
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
          <option value="AVAILABLE">Available</option>
          <option value="OCCUPIED">Occupied / In Procedure</option>
          <option value="UNDER_MAINTENANCE">Under Maintenance</option>
          <option value="STERILIZING">Sterilizing</option>
        </select>
      </div>

      {/* Facilities Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {loading ? (
          <div className="col-span-2 py-12 text-center text-slate-400">
            <div className="inline-block w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : filteredFacilities.length === 0 ? (
          <div className="col-span-2 py-12 text-center text-slate-400">
            No facilities match the filter.
          </div>
        ) : (
          filteredFacilities.map((fac) => (
            <div key={fac._id} className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                    {fac.facilityId} • {fac.facilityType.replace(/_/g, ' ')}
                  </span>
                  <h3 className="text-lg font-bold text-slate-800 mt-2">{fac.name}</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {fac.location?.floor || 'Floor 1'} • {fac.location?.wing || 'Main Wing'}
                  </p>
                </div>
                <select
                  value={fac.status}
                  onChange={(e) => handleStatusChange(fac._id, e.target.value)}
                  className={`text-xs font-semibold px-2.5 py-1 rounded-lg border focus:outline-none transition ${
                    fac.status === 'AVAILABLE'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : fac.status === 'OCCUPIED'
                      ? 'bg-rose-50 text-rose-700 border-rose-200'
                      : 'bg-amber-50 text-amber-700 border-amber-200'
                  }`}
                >
                  <option value="AVAILABLE">Available</option>
                  <option value="OCCUPIED">Occupied</option>
                  <option value="UNDER_MAINTENANCE">Maintenance</option>
                  <option value="STERILIZING">Sterilizing</option>
                </select>
              </div>

              {/* Equipment Roster */}
              <div className="mt-5 pt-4 border-t border-slate-100">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Cpu className="w-3.5 h-3.5 text-primary-600" />
                  <span>Clinical Equipment Inventory ({fac.equipment?.length || 0})</span>
                </h4>
                {fac.equipment?.length > 0 ? (
                  <div className="space-y-1.5">
                    {fac.equipment.map((eq, idx) => (
                      <div key={idx} className="flex items-center justify-between text-xs p-2 rounded-lg bg-slate-50 border border-slate-100">
                        <div>
                          <span className="font-semibold text-slate-800">{eq.name}</span>
                          <span className="text-slate-400 text-[10px] block">Model: {eq.modelNumber || 'N/A'}</span>
                        </div>
                        <span className="inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                          {eq.status}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic">No equipment tagged to this suite yet.</p>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Facility Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-800">Add Clinical Facility Suite</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-semibold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateFacility} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Facility Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Operation Theater 3 (Orthopedics)"
                  value={newFacility.name}
                  onChange={(e) => setNewFacility({ ...newFacility, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Facility Type *</label>
                <select
                  value={newFacility.facilityType}
                  onChange={(e) => setNewFacility({ ...newFacility, facilityType: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-primary-500"
                >
                  <option value="OPERATION_THEATER">Operation Theater</option>
                  <option value="INTENSIVE_CARE_UNIT">Intensive Care Unit (ICU)</option>
                  <option value="PATHOLOGY_LAB">Pathology Laboratory</option>
                  <option value="RADIOLOGY_IMAGING">Radiology Imaging Suite</option>
                  <option value="EMERGENCY_ROOM">Emergency Room</option>
                  <option value="DIALYSIS_UNIT">Dialysis Unit</option>
                  <option value="BLOOD_BANK">Blood Bank</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Floor</label>
                  <input
                    type="text"
                    value={newFacility.locationFloor}
                    onChange={(e) => setNewFacility({ ...newFacility, locationFloor: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Wing / Block</label>
                  <input
                    type="text"
                    value={newFacility.locationWing}
                    onChange={(e) => setNewFacility({ ...newFacility, locationWing: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-sm font-medium text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 bg-primary-600 text-white rounded-xl text-sm font-semibold hover:bg-primary-700 disabled:opacity-50"
                >
                  {actionLoading ? 'Creating...' : 'Create Facility'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
