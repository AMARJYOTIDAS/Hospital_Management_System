import React, { useState } from 'react';
import {
  FileText,
  Printer,
  Download,
  Calendar,
  CheckCircle,
  BarChart3,
  DollarSign,
  Pill,
  BedDouble,
  ShieldCheck,
} from 'lucide-react';

export const Reports = () => {
  const [selectedReport, setSelectedReport] = useState('clinical');
  const [dateRange, setDateRange] = useState('month');

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Executive & Compliance Reports Center</h1>
          <p className="text-sm text-slate-500 mt-1">
            Formal audit statements, clinical discharge summaries, pharmacy ledger, and bed census exports.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 text-white rounded-xl text-sm font-semibold hover:bg-slate-700 transition"
          >
            <Printer className="w-4 h-4" />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {/* Report Selector Tabs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <button
          onClick={() => setSelectedReport('clinical')}
          className={`p-4 rounded-2xl border text-left transition ${
            selectedReport === 'clinical'
              ? 'bg-primary-50/80 border-primary-500 shadow-sm'
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="w-8 h-8 rounded-lg bg-primary-100 text-primary-600 flex items-center justify-center mb-2">
            <FileText className="w-4 h-4" />
          </div>
          <div className="font-bold text-sm text-slate-800">Clinical & Recovery</div>
          <div className="text-xs text-slate-500 mt-0.5">Discharge census & outcomes</div>
        </button>

        <button
          onClick={() => setSelectedReport('financial')}
          className={`p-4 rounded-2xl border text-left transition ${
            selectedReport === 'financial'
              ? 'bg-primary-50/80 border-primary-500 shadow-sm'
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center mb-2">
            <DollarSign className="w-4 h-4" />
          </div>
          <div className="font-bold text-sm text-slate-800">Financial P&L Statement</div>
          <div className="text-xs text-slate-500 mt-0.5">Revenue, fees, and expenses</div>
        </button>

        <button
          onClick={() => setSelectedReport('pharmacy')}
          className={`p-4 rounded-2xl border text-left transition ${
            selectedReport === 'pharmacy'
              ? 'bg-primary-50/80 border-primary-500 shadow-sm'
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="w-8 h-8 rounded-lg bg-sky-100 text-sky-600 flex items-center justify-center mb-2">
            <Pill className="w-4 h-4" />
          </div>
          <div className="font-bold text-sm text-slate-800">Pharmacy Stock Audit</div>
          <div className="text-xs text-slate-500 mt-0.5">Stock IN/OUT & dispenses</div>
        </button>

        <button
          onClick={() => setSelectedReport('census')}
          className={`p-4 rounded-2xl border text-left transition ${
            selectedReport === 'census'
              ? 'bg-primary-50/80 border-primary-500 shadow-sm'
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center mb-2">
            <BedDouble className="w-4 h-4" />
          </div>
          <div className="font-bold text-sm text-slate-800">Bed Occupancy Census</div>
          <div className="text-xs text-slate-500 mt-0.5">Ward utilization & turnover</div>
        </button>
      </div>

      {/* Formatted Formal Report Paper View */}
      <div className="bg-white p-8 sm:p-12 rounded-2xl border border-slate-200 shadow-sm max-w-4xl mx-auto printable-area">
        {/* Hospital Letterhead */}
        <div className="border-b-2 border-slate-900 pb-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">SMART HEALTHCARE & HOSPITAL SYSTEM</h2>
              <p className="text-xs text-slate-500 mt-0.5">Accredited Tertiary Medical Center & Clinical Operations</p>
              <p className="text-xs text-slate-400">100 Health Sciences Blvd, Metro City • License #MED-2026-904</p>
            </div>
            <div className="text-right">
              <span className="inline-block text-[10px] font-bold px-2 py-0.5 bg-slate-100 text-slate-700 rounded mb-1">
                CONFIDENTIAL AUDIT
              </span>
              <p className="text-xs text-slate-500">Generated: {new Date().toLocaleDateString()}</p>
            </div>
          </div>
        </div>

        {/* Content based on active report */}
        {selectedReport === 'clinical' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-base font-bold text-slate-800 uppercase tracking-wider">Clinical Care & Patient Recovery Audit</h3>
              <p className="text-xs text-slate-500">Quarterly Inpatient Discharge and Outcome Analysis</p>
            </div>

            <div className="grid grid-cols-3 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200 text-center">
              <div>
                <div className="text-xs text-slate-500">Overall Recovery Rate</div>
                <div className="text-2xl font-bold text-emerald-600 mt-1">85.4%</div>
              </div>
              <div>
                <div className="text-xs text-slate-500">Average Stay Duration</div>
                <div className="text-2xl font-bold text-slate-800 mt-1">4.2 Days</div>
              </div>
              <div>
                <div className="text-xs text-slate-500">Total Consultations</div>
                <div className="text-2xl font-bold text-primary-600 mt-1">1,240</div>
              </div>
            </div>

            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-100 font-bold border-b border-slate-300">
                <tr>
                  <th className="py-2.5 px-3">Metric</th>
                  <th className="py-2.5 px-3">Benchmark Standard</th>
                  <th className="py-2.5 px-3">Actual Hospital Performance</th>
                  <th className="py-2.5 px-3">Compliance Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                <tr>
                  <td className="py-2.5 px-3 font-semibold">Post-Operative Recovery Rate</td>
                  <td className="py-2.5 px-3">&gt; 80%</td>
                  <td className="py-2.5 px-3 font-bold text-emerald-600">88.2%</td>
                  <td className="py-2.5 px-3 text-emerald-600 font-medium">Exceeds Benchmark</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-3 font-semibold">ICU Mortality Prevention Index</td>
                  <td className="py-2.5 px-3">&gt; 92%</td>
                  <td className="py-2.5 px-3 font-bold text-emerald-600">96.5%</td>
                  <td className="py-2.5 px-3 text-emerald-600 font-medium">Certified</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-3 font-semibold">Average Consultation Turnaround</td>
                  <td className="py-2.5 px-3">&lt; 30 Mins</td>
                  <td className="py-2.5 px-3 font-bold text-slate-800">22 Mins</td>
                  <td className="py-2.5 px-3 text-emerald-600 font-medium">Optimal</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {selectedReport === 'financial' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-base font-bold text-slate-800 uppercase tracking-wider">Hospital Financial Ledger Statement</h3>
              <p className="text-xs text-slate-500">Revenue Collections, Operating Disbursements & Receivables</p>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-2 border-b border-slate-100">
                <span className="font-semibold text-slate-700">Patient Consultation & OP Services:</span>
                <span className="font-bold text-slate-900">$24,800.00</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-100">
                <span className="font-semibold text-slate-700">Inpatient Bed & Room Charges:</span>
                <span className="font-bold text-slate-900">$48,250.00</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-100">
                <span className="font-semibold text-slate-700">Pharmacy Medication Dispensations:</span>
                <span className="font-bold text-slate-900">$18,400.00</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-100">
                <span className="font-semibold text-slate-700">Operating Expenses & Supplies (Debit):</span>
                <span className="font-bold text-rose-600">-$10,550.00</span>
              </div>
              <div className="flex justify-between py-3 border-t-2 border-slate-800 text-sm font-bold">
                <span className="text-slate-900">Net Hospital Operating Income:</span>
                <span className="text-emerald-600">$80,900.00</span>
              </div>
            </div>
          </div>
        )}

        {selectedReport === 'pharmacy' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-base font-bold text-slate-800 uppercase tracking-wider">Pharmacy Inventory & Dispensation Audit</h3>
              <p className="text-xs text-slate-500">Batch Control, Stock Turnover & Expiry Risk Assessment</p>
            </div>
            <div className="p-4 rounded-xl bg-emerald-50 text-emerald-800 text-xs flex items-center gap-2">
              <CheckCircle className="w-4 h-4 shrink-0" />
              <span>All scheduled clinical substances reconciled with zero unaccounted variances.</span>
            </div>
          </div>
        )}

        {selectedReport === 'census' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-base font-bold text-slate-800 uppercase tracking-wider">Inpatient Bed Utilization & Ward Census</h3>
              <p className="text-xs text-slate-500">Bed Occupancy Rates by Specialty Ward</p>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 leading-relaxed">
              Standard Ward: 67% occupied • ICU Telemetry: 50% occupied • Emergency Triage: 80% available. Ready for rapid disaster response.
            </div>
          </div>
        )}

        {/* Signature Box */}
        <div className="mt-12 pt-6 border-t border-slate-200 flex justify-between items-end text-xs text-slate-500">
          <div>
            <div className="w-36 border-b border-slate-400 mb-1"></div>
            <span>Prepared By: Chief Medical Officer</span>
          </div>
          <div>
            <div className="w-36 border-b border-slate-400 mb-1"></div>
            <span>Approved By: Hospital Administrator</span>
          </div>
        </div>
      </div>
    </div>
  );
};
