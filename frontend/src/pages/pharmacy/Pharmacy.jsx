import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import api from '../../api/axios';
import {
  Pill,
  Package,
  PlusCircle,
  ArrowDownLeft,
  ArrowUpRight,
  AlertTriangle,
  Clock,
  DollarSign,
  Search,
  Filter,
  CheckCircle,
  AlertCircle,
  X,
  Building2,
  FileText,
} from 'lucide-react';

export const Pharmacy = () => {
  const { user } = useSelector((state) => state.auth);
  const [activeTab, setActiveTab] = useState('catalog'); // 'catalog' | 'dispensing' | 'transactions'
  const [medicines, setMedicines] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [lowStockFilter, setLowStockFilter] = useState(false);

  // Modals State
  const [showAddMedModal, setShowAddMedModal] = useState(false);
  const [showStockInModal, setShowStockInModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Stock IN Form State
  const [stockInData, setStockInData] = useState({
    medicineId: '',
    quantity: 50,
    unitCost: 0,
    supplierId: '',
    batchNumber: '',
    reason: 'Restocking order receipt',
  });

  // Add Medicine Form State
  const initialMedState = {
    name: '',
    genericName: '',
    category: 'Antibiotic',
    manufacturer: '',
    batchNumber: '',
    purchasePrice: 5,
    sellingPrice: 12,
    availableQuantity: 50,
    minimumStockLevel: 15,
    expiryDate: new Date(new Date().setFullYear(new Date().getFullYear() + 2)).toISOString().split('T')[0],
    supplier: '',
  };
  const [newMedData, setNewMedData] = useState(initialMedState);

  const fetchPharmacyData = async () => {
    try {
      setLoading(true);
      const params = {};
      if (search) params.search = search;
      if (categoryFilter) params.category = categoryFilter;
      if (lowStockFilter) params.lowStock = 'true';

      const [medRes, rxRes, txnRes, analyticsRes, supRes] = await Promise.all([
        api.get('/pharmacy/medicines', { params }),
        api.get('/prescriptions?status=Issued'),
        api.get('/pharmacy/transactions'),
        api.get('/pharmacy/analytics'),
        api.get('/pharmacy/suppliers'),
      ]);

      setMedicines(medRes.data.medicines || []);
      setPrescriptions(rxRes.data.prescriptions || []);
      setTransactions(txnRes.data.transactions || []);
      setAnalytics(analyticsRes.data.analytics || null);
      setSuppliers(supRes.data.suppliers || []);

      if (medRes.data.medicines?.length > 0 && !stockInData.medicineId) {
        setStockInData((prev) => ({
          ...prev,
          medicineId: medRes.data.medicines[0]._id,
          unitCost: medRes.data.medicines[0].purchasePrice,
        }));
      }
    } catch (err) {
      console.error('Failed to load pharmacy data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchPharmacyData();
    }, 300);
    return () => clearTimeout(timer);
  }, [search, categoryFilter, lowStockFilter]);

  const handleStockInSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');
    setSubmitting(true);

    try {
      const res = await api.post('/pharmacy/stock-in', stockInData);
      setSuccessMessage(res.data.message);
      setTimeout(() => {
        setShowStockInModal(false);
        setSuccessMessage('');
      }, 1500);
      fetchPharmacyData();
    } catch (err) {
      setErrorMessage(err.response?.data?.message || 'Stock IN failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddMedicineSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');
    setSubmitting(true);

    try {
      const res = await api.post('/pharmacy/medicines', newMedData);
      setSuccessMessage(`Drug ${res.data.medicine.name} registered successfully!`);
      setTimeout(() => {
        setShowAddMedModal(false);
        setSuccessMessage('');
      }, 1500);
      fetchPharmacyData();
    } catch (err) {
      setErrorMessage(err.response?.data?.message || 'Failed to add medicine');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDispenseRx = async (prescriptionId) => {
    try {
      const res = await api.patch(`/prescriptions/${prescriptionId}/dispense`);
      alert(res.data.message);
      fetchPharmacyData();
    } catch (err) {
      alert(err.response?.data?.message || 'Dispensing failed');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Pharmacy & Medicine Inventory</h1>
          <p className="text-xs text-slate-500 mt-1">
            Formulary stock control, automated batch management, Stock IN/OUT, and prescription dispensing
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setErrorMessage('');
              setSuccessMessage('');
              setShowStockInModal(true);
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-xl shadow-sm transition"
          >
            <ArrowDownLeft className="w-4 h-4" />
            Stock IN (Procure)
          </button>
          <button
            onClick={() => {
              setErrorMessage('');
              setSuccessMessage('');
              setShowAddMedModal(true);
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-primary-600 hover:bg-primary-700 text-white font-semibold text-xs rounded-xl shadow-sm transition shadow-primary-600/20"
          >
            <PlusCircle className="w-4 h-4" />
            Add Formulary Item
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      {analytics && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Formularies</span>
            <h3 className="text-xl font-bold text-slate-800 mt-1">{analytics.totalProducts} Drugs</h3>
            <span className="text-[11px] text-slate-400 font-medium">{analytics.totalStockUnits} Total Units</span>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Inventory Valuation</span>
            <h3 className="text-xl font-bold text-emerald-600 mt-1">${analytics.inventoryValuation.toLocaleString()}</h3>
            <span className="text-[11px] text-slate-400 font-medium">Cost Basis</span>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Low-Stock Alert</span>
            <h3 className="text-xl font-bold text-amber-600 mt-1">{analytics.lowStockCount} Items</h3>
            <span className="text-[11px] text-amber-600 font-medium">Below Min Level</span>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Near-Expiry (&lt;30d)</span>
            <h3 className="text-xl font-bold text-rose-600 mt-1">{analytics.nearExpiryCount} Batches</h3>
            <span className="text-[11px] text-rose-500 font-medium">Action Needed</span>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Pending Rx Queue</span>
            <h3 className="text-xl font-bold text-primary-600 mt-1">{prescriptions.length} Orders</h3>
            <span className="text-[11px] text-primary-600 font-medium">Awaiting Dispense</span>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-slate-200 gap-4">
        <button
          onClick={() => setActiveTab('catalog')}
          className={`pb-3 text-sm font-semibold transition border-b-2 ${
            activeTab === 'catalog'
              ? 'border-primary-600 text-primary-600'
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          Formulary Catalog ({medicines.length})
        </button>
        <button
          onClick={() => setActiveTab('dispensing')}
          className={`pb-3 text-sm font-semibold transition border-b-2 flex items-center gap-1.5 ${
            activeTab === 'dispensing'
              ? 'border-primary-600 text-primary-600'
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          Prescription Dispensing Terminal
          {prescriptions.length > 0 && (
            <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-rose-500 text-white font-bold">
              {prescriptions.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('transactions')}
          className={`pb-3 text-sm font-semibold transition border-b-2 ${
            activeTab === 'transactions'
              ? 'border-primary-600 text-primary-600'
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          Stock Movement Log (IN/OUT)
        </button>
      </div>

      {/* TAB 1: FORMULARY CATALOG */}
      {activeTab === 'catalog' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search drug, generic name, batch..."
                className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl"
              >
                <option value="">All Categories</option>
                {['Antibiotic', 'Analgesic', 'Cardiovascular', 'Antidiabetic', 'Respiratory', 'Gastrointestinal'].map(
                  (c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  )
                )}
              </select>

              <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={lowStockFilter}
                  onChange={(e) => setLowStockFilter(e.target.checked)}
                  className="rounded text-primary-600"
                />
                <span>Low Stock Only</span>
              </label>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50/80 text-xs font-semibold uppercase tracking-wider text-slate-400 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-3.5">Drug Code</th>
                    <th className="px-6 py-3.5">Commercial & Generic Name</th>
                    <th className="px-6 py-3.5">Category</th>
                    <th className="px-6 py-3.5">Batch / Mfr</th>
                    <th className="px-6 py-3.5">Available Stock</th>
                    <th className="px-6 py-3.5">Pricing (Cost/Sell)</th>
                    <th className="px-6 py-3.5">Expiry Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {medicines.map((m) => {
                    const isLow = m.availableQuantity <= m.minimumStockLevel;
                    const isNearExp = new Date(m.expiryDate) <= new Date(Date.now() + 30 * 86400000);
                    return (
                      <tr key={m._id} className="hover:bg-slate-50/70 transition">
                        <td className="px-6 py-4 font-bold text-primary-700">{m.medicineId}</td>
                        <td className="px-6 py-4">
                          <div className="font-semibold text-slate-900">{m.name}</div>
                          <div className="text-xs text-slate-400">{m.genericName}</div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="px-2 py-0.5 rounded text-xs font-semibold bg-slate-100 text-slate-700">
                            {m.category}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-mono text-xs text-slate-800">{m.batchNumber}</div>
                          <div className="text-[11px] text-slate-400">{m.manufacturer}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900">{m.availableQuantity}</span>
                            {isLow && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200 flex items-center gap-0.5">
                                <AlertTriangle className="w-3 h-3" /> Low Stock
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-400">Min: {m.minimumStockLevel} units</div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-xs font-medium text-slate-500">${m.purchasePrice}</span>
                          <span className="text-slate-400 mx-1">/</span>
                          <span className="text-xs font-bold text-emerald-600">${m.sellingPrice}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-xs font-medium text-slate-700">
                            {new Date(m.expiryDate).toLocaleDateString()}
                          </span>
                          {isNearExp && (
                            <span className="block text-[10px] text-rose-600 font-bold">Expires Soon</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: PRESCRIPTION DISPENSING */}
      {activeTab === 'dispensing' && (
        <div className="space-y-4">
          {prescriptions.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center text-slate-400">
              <CheckCircle className="w-12 h-12 mx-auto text-emerald-400 mb-2" />
              <p className="font-semibold text-slate-700">No pending prescriptions in queue</p>
              <p className="text-xs mt-1">All doctor-prescribed medications have been dispensed.</p>
            </div>
          ) : (
            prescriptions.map((rx) => (
              <div
                key={rx._id}
                className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-primary-700">{rx.prescriptionNumber}</span>
                    <span className="text-xs text-slate-400">•</span>
                    <span className="font-bold text-slate-800 text-sm">{rx.patient?.fullName}</span>
                    <span className="text-xs text-slate-400">({rx.patient?.patientId})</span>
                  </div>
                  <div className="text-xs text-slate-500 mt-1">
                    Prescribed by Dr. {rx.doctor?.fullName} ({rx.doctor?.specialization}) on{' '}
                    {new Date(rx.createdAt).toLocaleDateString()}
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    {rx.medicines?.map((item, idx) => (
                      <div
                        key={idx}
                        className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs flex items-center gap-2"
                      >
                        <Pill className="w-3.5 h-3.5 text-primary-500" />
                        <span className="font-semibold text-slate-800">{item.medicine?.name}</span>
                        <span className="text-slate-400">({item.dosage} • Qty: {item.quantityPrescribed})</span>
                      </div>
                    ))}
                  </div>
                </div>

                <button
                  onClick={() => handleDispenseRx(rx._id)}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-xl shadow-sm transition"
                >
                  <ArrowUpRight className="w-4 h-4" />
                  Dispense & Deduct Stock
                </button>
              </div>
            ))
          )}
        </div>
      )}

      {/* TAB 3: STOCK MOVEMENT LOGS */}
      {activeTab === 'transactions' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50/80 text-xs font-semibold uppercase tracking-wider text-slate-400 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3.5">Txn #</th>
                  <th className="px-6 py-3.5">Type</th>
                  <th className="px-6 py-3.5">Medicine</th>
                  <th className="px-6 py-3.5">Quantity Changed</th>
                  <th className="px-6 py-3.5">Balance Before &rarr; After</th>
                  <th className="px-6 py-3.5">Reason / Note</th>
                  <th className="px-6 py-3.5">Logged By</th>
                  <th className="px-6 py-3.5">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {transactions.map((t) => (
                  <tr key={t._id} className="hover:bg-slate-50/70 transition">
                    <td className="px-6 py-4 font-mono font-bold text-slate-700">{t.transactionNumber}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${
                          t.type === 'IN'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {t.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-semibold text-slate-900">{t.medicine?.name}</td>
                    <td className="px-6 py-4 font-bold">
                      {t.type === 'IN' ? `+${t.quantity}` : `-${t.quantity}`}
                    </td>
                    <td className="px-6 py-4 text-xs font-medium">
                      {t.previousStock} &rarr; <span className="font-bold text-slate-900">{t.newStock}</span>
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-500">{t.reason}</td>
                    <td className="px-6 py-4 text-xs font-medium text-slate-700">{t.performedBy?.name}</td>
                    <td className="px-6 py-4 text-xs text-slate-400">
                      {new Date(t.transactionDate).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Stock IN Modal */}
      {showStockInModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">Procure Stock IN</h3>
                <p className="text-xs text-slate-500">Add received shipment from pharmaceutical supplier</p>
              </div>
              <button
                onClick={() => setShowStockInModal(false)}
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

            <form onSubmit={handleStockInSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Select Medicine *</label>
                <select
                  required
                  value={stockInData.medicineId}
                  onChange={(e) => {
                    const match = medicines.find((m) => m._id === e.target.value);
                    setStockInData({
                      ...stockInData,
                      medicineId: e.target.value,
                      unitCost: match ? match.purchasePrice : 0,
                    });
                  }}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl"
                >
                  {medicines.map((m) => (
                    <option key={m._id} value={m._id}>
                      {m.name} (Current: {m.availableQuantity})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Quantity Received *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={stockInData.quantity}
                    onChange={(e) => setStockInData({ ...stockInData, quantity: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Unit Cost ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={stockInData.unitCost}
                    onChange={(e) => setStockInData({ ...stockInData, unitCost: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Supplier</label>
                <select
                  value={stockInData.supplierId}
                  onChange={(e) => setStockInData({ ...stockInData, supplierId: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl"
                >
                  <option value="">Select Supplier</option>
                  {suppliers.map((s) => (
                    <option key={s._id} value={s._id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowStockInModal(false)}
                  className="px-3.5 py-2 text-slate-600 hover:bg-slate-100 rounded-xl text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold"
                >
                  {submitting ? 'Updating...' : 'Confirm Stock IN'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Drug Modal */}
      {showAddMedModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">Add Formulary Medicine</h3>
                <p className="text-xs text-slate-500">Register new drug catalog entry</p>
              </div>
              <button
                onClick={() => setShowAddMedModal(false)}
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

            <form onSubmit={handleAddMedicineSubmit} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Commercial Name *</label>
                  <input
                    type="text"
                    required
                    value={newMedData.name}
                    onChange={(e) => setNewMedData({ ...newMedData, name: e.target.value })}
                    placeholder="e.g. Lipitor 20mg"
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Generic Molecule *</label>
                  <input
                    type="text"
                    required
                    value={newMedData.genericName}
                    onChange={(e) => setNewMedData({ ...newMedData, genericName: e.target.value })}
                    placeholder="e.g. Atorvastatin"
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Category *</label>
                  <select
                    value={newMedData.category}
                    onChange={(e) => setNewMedData({ ...newMedData, category: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl"
                  >
                    {['Antibiotic', 'Analgesic', 'Cardiovascular', 'Antidiabetic', 'Respiratory', 'Gastrointestinal'].map(
                      (c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      )
                    )}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Manufacturer *</label>
                  <input
                    type="text"
                    required
                    value={newMedData.manufacturer}
                    onChange={(e) => setNewMedData({ ...newMedData, manufacturer: e.target.value })}
                    placeholder="e.g. Pfizer"
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Batch Number *</label>
                  <input
                    type="text"
                    required
                    value={newMedData.batchNumber}
                    onChange={(e) => setNewMedData({ ...newMedData, batchNumber: e.target.value })}
                    placeholder="e.g. BATCH-2026-X1"
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Expiry Date *</label>
                  <input
                    type="date"
                    required
                    value={newMedData.expiryDate}
                    onChange={(e) => setNewMedData({ ...newMedData, expiryDate: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Initial Stock Units</label>
                  <input
                    type="number"
                    min="0"
                    value={newMedData.availableQuantity}
                    onChange={(e) => setNewMedData({ ...newMedData, availableQuantity: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Min Threshold Alert</label>
                  <input
                    type="number"
                    min="1"
                    value={newMedData.minimumStockLevel}
                    onChange={(e) => setNewMedData({ ...newMedData, minimumStockLevel: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddMedModal(false)}
                  className="px-3.5 py-2 text-slate-600 hover:bg-slate-100 rounded-xl text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-xs font-semibold"
                >
                  {submitting ? 'Registering...' : 'Save Formulary Drug'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
