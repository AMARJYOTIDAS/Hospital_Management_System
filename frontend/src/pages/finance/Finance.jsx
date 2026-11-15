import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import {
  CreditCard,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Plus,
  Search,
  CheckCircle,
  AlertCircle,
  FileText,
  Wallet,
  Receipt,
  Building,
  RefreshCw,
  Trash2,
} from 'lucide-react';

export const Finance = () => {
  const [activeTab, setActiveTab] = useState('bills'); // 'bills' | 'expenses'
  const [summary, setSummary] = useState(null);
  const [bills, setBills] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Modals
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [selectedBill, setSelectedBill] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Invoice form
  const [invoiceForm, setInvoiceForm] = useState({
    patient: '',
    items: [
      { description: 'Specialist Consultation Fee', category: 'CONSULTATION', quantity: 1, unitPrice: 100, totalPrice: 100 },
    ],
    taxAmount: 0,
    discountAmount: 0,
    notes: '',
  });

  // Payment form
  const [paymentForm, setPaymentForm] = useState({
    amount: '',
    paymentMethod: 'CASH',
    transactionReference: '',
    notes: '',
  });

  // Expense form
  const [expenseForm, setExpenseForm] = useState({
    title: '',
    category: 'MEDICAL_SUPPLIES',
    amount: '',
    vendor: '',
    paymentMethod: 'BANK_TRANSFER',
    notes: '',
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [sumRes, billsRes, expRes, patRes] = await Promise.all([
        api.get('/finance/summary'),
        api.get('/finance/bills'),
        api.get('/finance/expenses'),
        api.get('/patients?limit=50'),
      ]);

      setSummary(sumRes.data.data);
      setBills(billsRes.data.data || []);
      setExpenses(expRes.data.data || []);
      setPatients(patRes.data.data || []);
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to load financial records' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Invoice line items helper
  const handleItemChange = (index, field, value) => {
    const updated = [...invoiceForm.items];
    updated[index][field] = value;
    if (field === 'quantity' || field === 'unitPrice') {
      const q = Number(field === 'quantity' ? value : updated[index].quantity) || 1;
      const p = Number(field === 'unitPrice' ? value : updated[index].unitPrice) || 0;
      updated[index].totalPrice = q * p;
    }
    setInvoiceForm({ ...invoiceForm, items: updated });
  };

  const addItem = () => {
    setInvoiceForm({
      ...invoiceForm,
      items: [
        ...invoiceForm.items,
        { description: 'Medication / Procedure', category: 'OTHER', quantity: 1, unitPrice: 50, totalPrice: 50 },
      ],
    });
  };

  const removeItem = (idx) => {
    if (invoiceForm.items.length <= 1) return;
    setInvoiceForm({
      ...invoiceForm,
      items: invoiceForm.items.filter((_, i) => i !== idx),
    });
  };

  const subTotal = invoiceForm.items.reduce((s, it) => s + (Number(it.totalPrice) || 0), 0);
  const finalTotal = Math.max(0, subTotal + Number(invoiceForm.taxAmount || 0) - Number(invoiceForm.discountAmount || 0));

  const handleCreateInvoice = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      await api.post('/finance/bills', invoiceForm);
      setMessage({ type: 'success', text: 'Invoice created successfully' });
      setIsInvoiceModalOpen(false);
      setInvoiceForm({
        patient: '',
        items: [{ description: 'Consultation Fee', category: 'CONSULTATION', quantity: 1, unitPrice: 100, totalPrice: 100 }],
        taxAmount: 0,
        discountAmount: 0,
        notes: '',
      });
      fetchData();
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to generate invoice' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleRecordPayment = async (e) => {
    e.preventDefault();
    if (!selectedBill) return;
    setActionLoading(true);

    try {
      await api.post('/finance/payments', {
        billId: selectedBill._id,
        ...paymentForm,
      });
      setMessage({ type: 'success', text: `Payment of $${paymentForm.amount} logged successfully.` });
      setIsPaymentModalOpen(false);
      setSelectedBill(null);
      setPaymentForm({ amount: '', paymentMethod: 'CASH', transactionReference: '', notes: '' });
      fetchData();
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Payment collection failed' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleCreateExpense = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      await api.post('/finance/expenses', expenseForm);
      setMessage({ type: 'success', text: 'Expense voucher recorded successfully' });
      setIsExpenseModalOpen(false);
      setExpenseForm({ title: '', category: 'MEDICAL_SUPPLIES', amount: '', vendor: '', paymentMethod: 'BANK_TRANSFER', notes: '' });
      fetchData();
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Expense recording failed' });
    } finally {
      setActionLoading(false);
    }
  };

  const filteredBills = bills.filter((b) => {
    const matchesSearch =
      b.patient?.fullName?.toLowerCase().includes(search.toLowerCase()) ||
      b.billId?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter ? b.paymentStatus === statusFilter : true;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Hospital Billing & Financial Ledger</h1>
          <p className="text-sm text-slate-500 mt-1">
            Inpatient & outpatient invoicing, point-of-sale collections, and operational expense accounting.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchData}
            className="p-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition"
            title="Refresh Ledger"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => setIsExpenseModalOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2.5 bg-slate-800 text-white rounded-xl text-sm font-semibold hover:bg-slate-700 transition"
          >
            <Receipt className="w-4 h-4" />
            <span>Record Expense</span>
          </button>
          <button
            onClick={() => setIsInvoiceModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-primary-600 text-white rounded-xl font-semibold shadow-md shadow-primary-500/20 hover:bg-primary-700 transition"
          >
            <Plus className="w-4 h-4" />
            <span>Create Invoice</span>
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

      {/* Financial Overview Metrics */}
      {summary && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Revenue</span>
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <TrendingUp className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3 text-2xl font-bold text-slate-800">${summary.totalRevenue.toLocaleString()}</div>
            <div className="text-xs text-slate-500 mt-1">{summary.paymentsCount} payments logged</div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Expenses</span>
              <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                <TrendingDown className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3 text-2xl font-bold text-slate-800">${summary.totalExpenses.toLocaleString()}</div>
            <div className="text-xs text-slate-500 mt-1">{summary.expensesCount} expense vouchers</div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Net Income</span>
              <div className="w-9 h-9 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
                <Wallet className="w-5 h-5" />
              </div>
            </div>
            <div className={`mt-3 text-2xl font-bold ${summary.netIncome >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
              ${summary.netIncome.toLocaleString()}
            </div>
            <div className="text-xs text-slate-500 mt-1">Operating margin</div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Outstanding Due</span>
              <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <DollarSign className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3 text-2xl font-bold text-amber-600">${summary.totalReceivables.toLocaleString()}</div>
            <div className="text-xs text-slate-500 mt-1">Pending patient receivables</div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveTab('bills')}
          className={`py-3 px-6 font-semibold text-sm border-b-2 transition flex items-center gap-2 ${
            activeTab === 'bills'
              ? 'border-primary-600 text-primary-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Patient Invoices ({bills.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('expenses')}
          className={`py-3 px-6 font-semibold text-sm border-b-2 transition flex items-center gap-2 ${
            activeTab === 'expenses'
              ? 'border-primary-600 text-primary-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Receipt className="w-4 h-4" />
          <span>Operating Expenses ({expenses.length})</span>
        </button>
      </div>

      {/* Tab 1: Invoices */}
      {activeTab === 'bills' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search invoices by patient name or invoice ID..."
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
              <option value="Paid">Paid</option>
              <option value="Partially Paid">Partially Paid</option>
              <option value="Unpaid">Unpaid</option>
            </select>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-semibold border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4">Invoice #</th>
                    <th className="px-6 py-4">Patient</th>
                    <th className="px-6 py-4">Total Amount</th>
                    <th className="px-6 py-4">Paid</th>
                    <th className="px-6 py-4">Balance Due</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    <tr>
                      <td colSpan="7" className="px-6 py-12 text-center text-slate-400">
                        <div className="inline-block w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
                      </td>
                    </tr>
                  ) : filteredBills.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="px-6 py-12 text-center text-slate-400">
                        No invoices found.
                      </td>
                    </tr>
                  ) : (
                    filteredBills.map((b) => (
                      <tr key={b._id} className="hover:bg-slate-50/60 transition">
                        <td className="px-6 py-4 font-semibold text-slate-800">{b.billId}</td>
                        <td className="px-6 py-4">
                          <div className="font-medium text-slate-900">{b.patient?.fullName || 'N/A'}</div>
                          <div className="text-xs text-slate-400">{b.patient?.phone}</div>
                        </td>
                        <td className="px-6 py-4 font-bold text-slate-800">${b.totalAmount.toFixed(2)}</td>
                        <td className="px-6 py-4 text-emerald-600 font-medium">${b.paidAmount.toFixed(2)}</td>
                        <td className="px-6 py-4 text-rose-600 font-semibold">${b.balanceAmount.toFixed(2)}</td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-block text-xs font-semibold px-2.5 py-0.5 rounded-full ${
                              b.paymentStatus === 'Paid'
                                ? 'bg-emerald-100 text-emerald-800'
                                : b.paymentStatus === 'Partially Paid'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {b.paymentStatus}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          {b.balanceAmount > 0 ? (
                            <button
                              onClick={() => {
                                setSelectedBill(b);
                                setPaymentForm({
                                  amount: b.balanceAmount,
                                  paymentMethod: 'CASH',
                                  transactionReference: '',
                                  notes: '',
                                });
                                setIsPaymentModalOpen(true);
                              }}
                              className="px-3 py-1.5 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-xs font-semibold transition"
                            >
                              Collect Pay
                            </button>
                          ) : (
                            <span className="text-xs text-emerald-600 font-semibold flex items-center justify-end gap-1">
                              <CheckCircle className="w-3.5 h-3.5" />
                              Settled
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Expenses */}
      {activeTab === 'expenses' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-semibold border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4">Expense ID</th>
                  <th className="px-6 py-4">Title / Purpose</th>
                  <th className="px-6 py-4">Category</th>
                  <th className="px-6 py-4">Vendor</th>
                  <th className="px-6 py-4">Amount</th>
                  <th className="px-6 py-4">Payment Method</th>
                  <th className="px-6 py-4">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {expenses.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-6 py-12 text-center text-slate-400">
                      No operational expense records logged yet.
                    </td>
                  </tr>
                ) : (
                  expenses.map((exp) => (
                    <tr key={exp._id} className="hover:bg-slate-50/60 transition">
                      <td className="px-6 py-4 font-semibold text-slate-800">{exp.expenseId}</td>
                      <td className="px-6 py-4 font-medium text-slate-900">{exp.title}</td>
                      <td className="px-6 py-4">
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                          {exp.category.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-600">{exp.vendor || 'N/A'}</td>
                      <td className="px-6 py-4 font-bold text-rose-600">${exp.amount.toLocaleString()}</td>
                      <td className="px-6 py-4 text-xs text-slate-600">{exp.paymentMethod}</td>
                      <td className="px-6 py-4 text-xs text-slate-500">
                        {new Date(exp.date).toLocaleDateString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Collect Payment Modal */}
      {isPaymentModalOpen && selectedBill && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-lg font-bold text-slate-800">Collect Payment</h3>
                <p className="text-xs text-slate-500">Invoice: {selectedBill.billId}</p>
              </div>
              <button
                onClick={() => setIsPaymentModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-semibold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleRecordPayment} className="space-y-4 mt-4">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex justify-between items-center text-xs">
                <span className="text-slate-600 font-medium">Balance Due:</span>
                <span className="text-rose-600 font-bold text-sm">${selectedBill.balanceAmount.toFixed(2)}</span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Payment Amount ($) *</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  max={selectedBill.balanceAmount}
                  value={paymentForm.amount}
                  onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Payment Method *</label>
                <select
                  value={paymentForm.paymentMethod}
                  onChange={(e) => setPaymentForm({ ...paymentForm, paymentMethod: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-primary-500"
                >
                  <option value="CASH">Cash</option>
                  <option value="CREDIT_CARD">Credit Card</option>
                  <option value="DEBIT_CARD">Debit Card</option>
                  <option value="UPI">UPI / Digital</option>
                  <option value="INSURANCE">Insurance Settlement</option>
                  <option value="BANK_TRANSFER">Bank Wire</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Transaction Reference</label>
                <input
                  type="text"
                  placeholder="e.g. TXN-CC-8842 or Auth Code"
                  value={paymentForm.transactionReference}
                  onChange={(e) => setPaymentForm({ ...paymentForm, transactionReference: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsPaymentModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-emerald-700 disabled:opacity-50"
                >
                  {actionLoading ? 'Recording...' : 'Record Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Invoice Modal */}
      {isInvoiceModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-800">Generate Patient Invoice</h3>
              <button
                onClick={() => setIsInvoiceModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-semibold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateInvoice} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Patient *</label>
                <select
                  required
                  value={invoiceForm.patient}
                  onChange={(e) => setInvoiceForm({ ...invoiceForm, patient: e.target.value })}
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

              {/* Items List */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-700 uppercase">Itemized Line Items</span>
                  <button
                    type="button"
                    onClick={addItem}
                    className="text-xs font-semibold text-primary-600 hover:text-primary-700 flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Line Item
                  </button>
                </div>

                {invoiceForm.items.map((item, index) => (
                  <div key={index} className="grid grid-cols-12 gap-2 p-3 rounded-xl bg-slate-50 border border-slate-200 items-end">
                    <div className="col-span-5">
                      <label className="block text-[10px] font-semibold text-slate-500 mb-1">Description</label>
                      <input
                        type="text"
                        required
                        value={item.description}
                        onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                        className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs"
                      />
                    </div>
                    <div className="col-span-3">
                      <label className="block text-[10px] font-semibold text-slate-500 mb-1">Category</label>
                      <select
                        value={item.category}
                        onChange={(e) => handleItemChange(index, 'category', e.target.value)}
                        className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-xs"
                      >
                        <option value="CONSULTATION">Consultation</option>
                        <option value="ROOM_RENT">Room Rent</option>
                        <option value="PHARMACY">Pharmacy</option>
                        <option value="LAB_TEST">Lab Test</option>
                        <option value="PROCEDURE">Procedure</option>
                        <option value="OTHER">Other</option>
                      </select>
                    </div>
                    <div className="col-span-2">
                      <label className="block text-[10px] font-semibold text-slate-500 mb-1">Unit ($)</label>
                      <input
                        type="number"
                        min="0"
                        required
                        value={item.unitPrice}
                        onChange={(e) => handleItemChange(index, 'unitPrice', e.target.value)}
                        className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-xs font-semibold"
                      />
                    </div>
                    <div className="col-span-2 flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-700">${item.totalPrice}</span>
                      {invoiceForm.items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeItem(index)}
                          className="text-rose-500 hover:text-rose-700 p-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Subtotals & Totals */}
              <div className="grid grid-cols-2 gap-4 pt-3 border-t border-slate-100">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Discount ($)</label>
                  <input
                    type="number"
                    min="0"
                    value={invoiceForm.discountAmount}
                    onChange={(e) => setInvoiceForm({ ...invoiceForm, discountAmount: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-xl text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Tax ($)</label>
                  <input
                    type="number"
                    min="0"
                    value={invoiceForm.taxAmount}
                    onChange={(e) => setInvoiceForm({ ...invoiceForm, taxAmount: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-xl text-xs"
                  />
                </div>
              </div>

              <div className="p-3 bg-primary-50 rounded-xl flex justify-between items-center text-sm font-bold text-primary-900">
                <span>Net Total Payable:</span>
                <span className="text-lg">${finalTotal.toFixed(2)}</span>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsInvoiceModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-sm font-medium text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 bg-primary-600 text-white rounded-xl text-sm font-semibold hover:bg-primary-700 disabled:opacity-50"
                >
                  {actionLoading ? 'Generating...' : 'Issue Invoice'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Record Expense Modal */}
      {isExpenseModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-800">Record Operational Expense</h3>
              <button
                onClick={() => setIsExpenseModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-semibold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateExpense} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Expense Title / Item *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Surgical Gloves & PPE Restock"
                  value={expenseForm.title}
                  onChange={(e) => setExpenseForm({ ...expenseForm, title: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Category *</label>
                  <select
                    value={expenseForm.category}
                    onChange={(e) => setExpenseForm({ ...expenseForm, category: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="MEDICAL_SUPPLIES">Medical Supplies</option>
                    <option value="PHARMACEUTICALS">Pharmaceuticals</option>
                    <option value="SALARIES">Salaries & Payroll</option>
                    <option value="UTILITIES">Utilities & Power</option>
                    <option value="EQUIPMENT_MAINTENANCE">Equipment Maint.</option>
                    <option value="FACILITY_RENT">Facility Rent</option>
                    <option value="ADMINISTRATIVE">Admin Expenses</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Amount ($) *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    placeholder="500"
                    value={expenseForm.amount}
                    onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm font-bold text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Vendor / Payee</label>
                <input
                  type="text"
                  placeholder="e.g. MedSupply Co."
                  value={expenseForm.vendor}
                  onChange={(e) => setExpenseForm({ ...expenseForm, vendor: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsExpenseModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-sm font-medium text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 bg-slate-900 text-white rounded-xl text-sm font-semibold hover:bg-slate-800 disabled:opacity-50"
                >
                  {actionLoading ? 'Saving...' : 'Save Expense'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
