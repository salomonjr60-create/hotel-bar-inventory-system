'use client';

import React, { useState, useMemo } from 'react';
import { useInventory } from '@/context/InventoryContext';
import { WastageRecord, WastageReason, HotelOutlet } from '@/types/inventory';
import {
  TrendingDown,
  Plus,
  CheckCircle2,
  XCircle,
  Clock,
  AlertOctagon,
  Calendar,
  X,
  DollarSign,
  PieChart as PieChartIcon,
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';

const WASTAGE_REASONS: WastageReason[] = [
  'Broken bottles',
  'Spillage',
  'Expired beverages',
  'Complimentary consumption',
  'Incorrect preparation',
  'Other operational losses',
];

export default function WastageView() {
  const {
    products,
    wastageRecords,
    currentRole,
    currentOutlet,
    recordWastage,
    approveWastage,
    rejectWastage,
  } = useInventory();

  const [showNewModal, setShowNewModal] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<string>(products[0]?.id || '');
  const [quantity, setQuantity] = useState<number>(1);
  const [reason, setReason] = useState<WastageReason>('Broken bottles');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [employee, setEmployee] = useState<string>('Elena Rostova');
  const [notes, setNotes] = useState<string>('Dropped bottle during bar rush');

  // Metrics
  const totalFinancialLoss = useMemo(() => {
    return wastageRecords.reduce((acc, w) => acc + w.financialLoss, 0);
  }, [wastageRecords]);

  // Breakdown by Reason
  const reasonBreakdown = useMemo(() => {
    const map: Record<string, number> = {};
    wastageRecords.forEach((w) => {
      map[w.reason] = (map[w.reason] || 0) + w.financialLoss;
    });
    return Object.entries(map).map(([name, value]) => ({
      name,
      value: Number(value.toFixed(2)),
    }));
  }, [wastageRecords]);

  const COLORS = ['#ef4444', '#f59e0b', '#38bdf8', '#a855f7', '#ec4899', '#64748b'];

  const selectedProduct = products.find((p) => p.id === selectedProductId);
  const estimatedLoss = selectedProduct ? (quantity * selectedProduct.rate) : 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;

    recordWastage({
      productId: selectedProduct.id,
      itemCode: selectedProduct.itemCode,
      productName: selectedProduct.name,
      category: selectedProduct.category,
      quantity: Number(quantity),
      unit: selectedProduct.unit,
      reason,
      date,
      employee,
      supervisorApproval: currentRole === 'ADMIN' || currentRole === 'BAR_MANAGER' ? 'Approved' : 'Pending',
      outlet: currentOutlet,
      notes,
    });

    setShowNewModal(false);
  };

  const canApprove = currentRole === 'ADMIN' || currentRole === 'BAR_MANAGER';

  return (
    <div className="space-y-6 pb-16">
      {/* Top Banner */}
      <div className="bg-[#0b152d] p-6 rounded-2xl border border-[#1b2b4e] shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-xs font-semibold text-red-400 tracking-wider uppercase">
              Operational Spillage & Breakage Control
            </span>
            <span className="text-[10px] bg-red-950/60 text-red-400 border border-red-800 px-2 py-0.5 rounded">
              Cost Impact Tracking
            </span>
          </div>
          <h2 className="text-2xl font-bold text-white mt-1">
            Wastage, Breakage & Spillage Audit
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Record broken bottles, spillage, expired beverages and complimentary VIP consumption with automated financial loss computation.
          </p>
        </div>

        <button
          onClick={() => setShowNewModal(true)}
          className="flex items-center space-x-2 bg-gradient-to-r from-red-600 to-red-800 text-white px-4 py-2.5 rounded-xl font-bold text-xs shadow-md hover:brightness-110 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Record Wastage Incident</span>
        </button>
      </div>

      {/* KPI Cards & Breakdown Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="space-y-4">
          <div className="bg-[#0b152d] p-5 rounded-2xl border border-[#1b2b4e] shadow-xl">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Total Recorded Financial Loss
            </span>
            <div className="text-3xl font-extrabold text-red-400 mt-2">
              AED {totalFinancialLoss.toFixed(2)}
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Across {wastageRecords.length} recorded bar incidents
            </p>
          </div>

          <div className="bg-[#0b152d] p-5 rounded-2xl border border-[#1b2b4e] shadow-xl">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Pending Approvals
            </span>
            <div className="text-2xl font-bold text-amber-400 mt-2">
              {wastageRecords.filter((w) => w.supervisorApproval === 'Pending').length} Incidents
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Require F&B supervisor sign-off
            </p>
          </div>
        </div>

        {/* Wastage by Reason Chart */}
        <div className="lg:col-span-2 bg-[#0b152d] p-5 rounded-2xl border border-[#1b2b4e] shadow-xl flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Financial Loss by Operational Reason
              </h3>
              <p className="text-xs text-slate-400">Broken bottles vs spillage vs complimentary service losses</p>
            </div>
          </div>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={reasonBreakdown} layout="vertical" margin={{ top: 5, right: 30, left: 60, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#182747" />
                <XAxis type="number" stroke="#64748b" fontSize={10} />
                <YAxis dataKey="name" type="category" stroke="#64748b" fontSize={10} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0a1329',
                    borderColor: '#223766',
                    borderRadius: '8px',
                    fontSize: '11px',
                  }}
                />
                <Bar dataKey="value" name="Loss (AED)" fill="#ef4444" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Wastage Log Table */}
      <div className="bg-[#0b152d] rounded-2xl border border-[#1b2b4e] shadow-xl overflow-hidden">
        <div className="p-4 border-b border-[#1b2b4e] flex items-center justify-between">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <TrendingDown className="w-4 h-4 text-red-400" />
            Wastage Incident Log
          </h3>
          <span className="text-xs text-slate-400">{wastageRecords.length} records</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#070e20] text-slate-300 font-semibold uppercase tracking-wider border-b border-[#1b2b4e]">
              <tr>
                <th className="py-3 px-4">Record #</th>
                <th className="py-3 px-3">Date</th>
                <th className="py-3 px-3">Item Code</th>
                <th className="py-3 px-3">Beverage Name</th>
                <th className="py-3 px-3">Reason</th>
                <th className="py-3 px-3 text-right">Qty</th>
                <th className="py-3 px-3 text-right">Loss (AED)</th>
                <th className="py-3 px-3">Employee</th>
                <th className="py-3 px-3 text-center">Approval</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#152345]">
              {wastageRecords.map((w) => (
                <tr key={w.id} className="hover:bg-[#0f1c3b] transition-colors">
                  <td className="py-3.5 px-4 font-mono font-bold text-[#d4af37]">{w.recordNumber}</td>
                  <td className="py-3.5 px-3 text-slate-300">{w.date}</td>
                  <td className="py-3.5 px-3 font-mono text-slate-400">{w.itemCode}</td>
                  <td className="py-3.5 px-3 font-semibold text-white max-w-xs truncate">{w.productName}</td>
                  <td className="py-3.5 px-3">
                    <span className="inline-block bg-[#1a121f] text-red-300 border border-red-800/40 px-2 py-0.5 rounded text-[10px] font-semibold">
                      {w.reason}
                    </span>
                  </td>
                  <td className="py-3.5 px-3 text-right font-mono font-bold text-white">
                    {w.quantity} {w.unit}
                  </td>
                  <td className="py-3.5 px-3 text-right font-mono font-bold text-red-400">
                    AED {w.financialLoss.toFixed(2)}
                  </td>
                  <td className="py-3.5 px-3 text-slate-300">{w.employee}</td>
                  <td className="py-3.5 px-3 text-center">
                    <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      w.supervisorApproval === 'Approved'
                        ? 'bg-emerald-950 text-emerald-400 border border-emerald-700'
                        : w.supervisorApproval === 'Pending'
                        ? 'bg-amber-950 text-amber-400 border border-amber-700'
                        : 'bg-red-950 text-red-400 border border-red-700'
                    }`}>
                      {w.supervisorApproval}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    {w.supervisorApproval === 'Pending' && canApprove ? (
                      <div className="flex items-center justify-center space-x-1.5">
                        <button
                          onClick={() => approveWastage(w.id)}
                          className="px-2.5 py-1 bg-emerald-700 hover:bg-emerald-600 text-white rounded text-xs font-bold"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => rejectWastage(w.id)}
                          className="px-2.5 py-1 bg-red-800 hover:bg-red-700 text-white rounded text-xs font-bold"
                        >
                          Reject
                        </button>
                      </div>
                    ) : (
                      <span className="text-[11px] text-slate-400">{w.supervisorApproval}</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Wastage Incident Modal */}
      {showNewModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0a1329] border border-[#223766] rounded-2xl w-full max-w-lg shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#1b2b4e] pb-3">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <TrendingDown className="w-4 h-4 text-red-400" />
                  Record Beverage Wastage & Breakage
                </h3>
                <p className="text-xs text-slate-400">Financial loss automatically calculated against product rate</p>
              </div>
              <button onClick={() => setShowNewModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Select Beverage SKU</label>
                <select
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(e.target.value)}
                  className="w-full px-3 py-2 bg-[#0c1630] border border-[#223766] rounded-xl text-xs text-white"
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.itemCode} - {p.name} ({p.packagingDescription}) [Rate: AED {p.rate}]
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Quantity</label>
                  <input
                    type="number"
                    step="0.25"
                    min="0.25"
                    required
                    value={quantity}
                    onChange={(e) => setQuantity(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 bg-[#0c1630] border border-[#223766] rounded-xl text-xs text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Reason for Wastage</label>
                  <select
                    value={reason}
                    onChange={(e) => setReason(e.target.value as WastageReason)}
                    className="w-full px-3 py-2 bg-[#0c1630] border border-[#223766] rounded-xl text-xs text-white"
                  >
                    {WASTAGE_REASONS.map((r) => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Incident Date</label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-3 py-2 bg-[#0c1630] border border-[#223766] rounded-xl text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Reporting Bartender</label>
                  <input
                    type="text"
                    value={employee}
                    onChange={(e) => setEmployee(e.target.value)}
                    className="w-full px-3 py-2 bg-[#0c1630] border border-[#223766] rounded-xl text-xs text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Details / Operational Circumstances</label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Broken during speed rail cocktail preparation"
                  className="w-full px-3 py-2 bg-[#0c1630] border border-[#223766] rounded-xl text-xs text-white"
                />
              </div>

              {/* Financial Calculation Box */}
              <div className="bg-[#19111b] border border-red-900/60 p-3 rounded-xl flex items-center justify-between text-xs">
                <span className="text-slate-300">Calculated Financial Loss:</span>
                <span className="font-mono text-base font-bold text-red-400">
                  AED {estimatedLoss.toFixed(2)}
                </span>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-[#1b2b4e]">
                <button
                  type="button"
                  onClick={() => setShowNewModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:bg-[#122045]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-red-600 to-red-800 text-white hover:brightness-110 shadow-md"
                >
                  Submit Incident
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
