'use client';

import React, { useState } from 'react';
import { useInventory } from '@/context/InventoryContext';
import { StockTransfer, StockTransferLine, HOTEL_OUTLETS, HotelOutlet } from '@/types/inventory';
import {
  ArrowRightLeft,
  Plus,
  CheckCircle2,
  XCircle,
  Clock,
  MapPin,
  Calendar,
  X,
  Sparkles,
  Shield,
} from 'lucide-react';

export default function TransfersView() {
  const {
    products,
    transfers,
    currentRole,
    currentOutlet,
    requestStockTransfer,
    approveStockTransfer,
    rejectStockTransfer,
  } = useInventory();

  const [showNewModal, setShowNewModal] = useState(false);
  const [sendingOutlet, setSendingOutlet] = useState<HotelOutlet>('Central Beverage Store');
  const [receivingOutlet, setReceivingOutlet] = useState<HotelOutlet>(currentOutlet);
  const [transferDate, setTransferDate] = useState(new Date().toISOString().split('T')[0]);
  const [employee, setEmployee] = useState('Marcus Vance');
  const [notes, setNotes] = useState('Pre-shift bar restocking');
  const [lines, setLines] = useState<{ productId: string; quantity: number }[]>([
    { productId: products[0]?.id || '', quantity: 6 },
  ]);

  const handleAddLine = () => {
    if (products.length > 0) {
      setLines([...lines, { productId: products[0].id, quantity: 6 }]);
    }
  };

  const handleRemoveLine = (idx: number) => {
    setLines(lines.filter((_, i) => i !== idx));
  };

  const handleUpdateLine = (idx: number, field: 'productId' | 'quantity', val: any) => {
    setLines((prev) => {
      const copy = [...prev];
      (copy[idx] as any)[field] = val;
      return copy;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (sendingOutlet === receivingOutlet) {
      alert('Sending outlet and receiving outlet cannot be identical.');
      return;
    }

    const formattedLines: StockTransferLine[] = lines.map((l) => {
      const prod = products.find((p) => p.id === l.productId);
      return {
        id: `trl-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        productId: l.productId,
        itemCode: prod?.itemCode || 'CODE',
        productName: prod?.name || 'Item',
        quantity: Number(l.quantity),
        unit: prod?.unit || 'Bottle',
      };
    });

    requestStockTransfer({
      sendingOutlet,
      receivingOutlet,
      transferDate,
      employee,
      status: 'Pending Approval',
      lines: formattedLines,
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
            <span className="text-xs font-semibold text-[#d4af37] tracking-wider uppercase">
              Inter-Outlet Stock Movement
            </span>
            <span className="text-[10px] bg-[#d4af3715] text-[#d4af37] px-2 py-0.5 rounded border border-[#d4af3730]">
              7 Hotel Locations Configured
            </span>
          </div>
          <h2 className="text-2xl font-bold text-white mt-1">
            Stock Transfer Management & Reconciliation
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Transfer beverages between W Lounge, Central Beverage Store, Pool Bar, Banquet Bar and other outlets with dual-location balance sync upon approval.
          </p>
        </div>

        <button
          onClick={() => setShowNewModal(true)}
          className="flex items-center space-x-2 bg-gradient-to-r from-[#d4af37] to-[#b58d24] text-[#050b18] px-4 py-2.5 rounded-xl font-bold text-xs shadow-md hover:brightness-110 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Request Stock Transfer</span>
        </button>
      </div>

      {/* Transfers List */}
      <div className="bg-[#0b152d] rounded-2xl border border-[#1b2b4e] shadow-xl overflow-hidden">
        <div className="p-4 border-b border-[#1b2b4e] flex items-center justify-between">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <ArrowRightLeft className="w-4 h-4 text-[#d4af37]" />
            Transfer Requests & Approvals
          </h3>
          <span className="text-xs text-slate-400">{transfers.length} transfers recorded</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#070e20] text-slate-300 font-semibold uppercase tracking-wider border-b border-[#1b2b4e]">
              <tr>
                <th className="py-3 px-4">Transfer #</th>
                <th className="py-3 px-3">Date</th>
                <th className="py-3 px-3">Sending Outlet</th>
                <th className="py-3 px-3">Receiving Outlet</th>
                <th className="py-3 px-3">Initiated By</th>
                <th className="py-3 px-3">Transferred SKUs</th>
                <th className="py-3 px-3 text-center">Status</th>
                <th className="py-3 px-4 text-center">Authorization</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#152345]">
              {transfers.map((tr) => (
                <tr key={tr.id} className="hover:bg-[#0f1c3b] transition-colors">
                  <td className="py-3.5 px-4 font-mono font-bold text-[#d4af37]">{tr.transferNumber}</td>
                  <td className="py-3.5 px-3 text-slate-300">{tr.transferDate}</td>
                  <td className="py-3.5 px-3 font-semibold text-slate-300">{tr.sendingOutlet}</td>
                  <td className="py-3.5 px-3 font-semibold text-white flex items-center gap-1.5">
                    <span className="text-[#d4af37]">➔</span>
                    <span>{tr.receivingOutlet}</span>
                  </td>
                  <td className="py-3.5 px-3 text-slate-300">{tr.employee}</td>
                  <td className="py-3.5 px-3 text-slate-300">
                    <div className="max-w-xs truncate">
                      {tr.lines.map((l) => `${l.quantity}x ${l.productName}`).join(', ')}
                    </div>
                  </td>
                  <td className="py-3.5 px-3 text-center">
                    <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      tr.status === 'Approved'
                        ? 'bg-emerald-950 text-emerald-400 border border-emerald-700'
                        : tr.status === 'Pending Approval'
                        ? 'bg-amber-950 text-amber-400 border border-amber-700'
                        : 'bg-red-950 text-red-400 border border-red-700'
                    }`}>
                      {tr.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    {tr.status === 'Pending Approval' && canApprove ? (
                      <div className="flex items-center justify-center space-x-1.5">
                        <button
                          onClick={() => approveStockTransfer(tr.id)}
                          className="px-2.5 py-1 bg-emerald-700 hover:bg-emerald-600 text-white rounded text-xs font-bold"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => rejectStockTransfer(tr.id)}
                          className="px-2.5 py-1 bg-red-800 hover:bg-red-700 text-white rounded text-xs font-bold"
                        >
                          Reject
                        </button>
                      </div>
                    ) : (
                      <span className="text-[11px] text-slate-400">
                        {tr.status === 'Approved' ? tr.approvedBy || 'Approved' : tr.status}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Transfer Modal */}
      {showNewModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0a1329] border border-[#223766] rounded-2xl w-full max-w-xl shadow-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#1b2b4e] pb-3">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <ArrowRightLeft className="w-4 h-4 text-[#d4af37]" />
                  Request Beverage Stock Transfer
                </h3>
                <p className="text-xs text-slate-400">Dual-outlet stock adjustment upon supervisor authorization</p>
              </div>
              <button onClick={() => setShowNewModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Sending Outlet (From)</label>
                  <select
                    value={sendingOutlet}
                    onChange={(e) => setSendingOutlet(e.target.value as HotelOutlet)}
                    className="w-full px-3 py-2 bg-[#0c1630] border border-[#223766] rounded-xl text-xs text-white"
                  >
                    {HOTEL_OUTLETS.map((o) => (
                      <option key={o} value={o}>{o}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Receiving Outlet (To)</label>
                  <select
                    value={receivingOutlet}
                    onChange={(e) => setReceivingOutlet(e.target.value as HotelOutlet)}
                    className="w-full px-3 py-2 bg-[#0c1630] border border-[#223766] rounded-xl text-xs text-white"
                  >
                    {HOTEL_OUTLETS.map((o) => (
                      <option key={o} value={o}>{o}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Transfer Date</label>
                  <input
                    type="date"
                    value={transferDate}
                    onChange={(e) => setTransferDate(e.target.value)}
                    className="w-full px-3 py-2 bg-[#0c1630] border border-[#223766] rounded-xl text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Employee Name</label>
                  <input
                    type="text"
                    value={employee}
                    onChange={(e) => setEmployee(e.target.value)}
                    className="w-full px-3 py-2 bg-[#0c1630] border border-[#223766] rounded-xl text-xs text-white"
                  />
                </div>
              </div>

              {/* Items */}
              <div className="border border-[#1b2b4e] rounded-xl p-3 bg-[#070e20] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-white">Transferred Products</span>
                  <button
                    type="button"
                    onClick={handleAddLine}
                    className="text-xs text-[#d4af37] hover:underline flex items-center gap-1 font-semibold"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Product
                  </button>
                </div>

                {lines.map((l, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <select
                      value={l.productId}
                      onChange={(e) => handleUpdateLine(idx, 'productId', e.target.value)}
                      className="flex-1 px-2.5 py-1.5 bg-[#0c1630] border border-[#223766] rounded-lg text-xs text-white"
                    >
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.itemCode} - {p.name} ({p.packagingDescription})
                        </option>
                      ))}
                    </select>

                    <div className="w-24">
                      <input
                        type="number"
                        min="0.25"
                        step="0.25"
                        placeholder="Qty"
                        value={l.quantity}
                        onChange={(e) => handleUpdateLine(idx, 'quantity', parseFloat(e.target.value) || 0)}
                        className="w-full px-2 py-1.5 bg-[#0c1630] border border-[#223766] rounded-lg text-xs text-white font-mono"
                      />
                    </div>

                    {lines.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveLine(idx)}
                        className="text-red-400 hover:text-red-300 p-1"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Reason / Shift Notes</label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Replenishment for private dining event"
                  className="w-full px-3 py-2 bg-[#0c1630] border border-[#223766] rounded-xl text-xs text-white"
                />
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
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-[#d4af37] to-[#b58d24] text-[#050b18] hover:brightness-110 shadow-md"
                >
                  Submit Transfer Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
