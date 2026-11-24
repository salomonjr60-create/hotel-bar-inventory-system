'use client';

import React, { useState } from 'react';
import { useInventory } from '@/context/InventoryContext';
import { GoodsReceipt, GoodsReceiptLine, HOTEL_OUTLETS, HotelOutlet } from '@/types/inventory';
import {
  Truck,
  Plus,
  Save,
  CheckCircle2,
  Package,
  Calendar,
  DollarSign,
  User,
  FileText,
  X,
  Sparkles,
} from 'lucide-react';

export default function GoodsReceiptView() {
  const {
    products,
    goodsReceipts,
    currentOutlet,
    currentRole,
    recordGoodsReceipt,
  } = useInventory();

  const [showNewModal, setShowNewModal] = useState(false);
  const [supplierName, setSupplierName] = useState('Maritime and Mercantile International (MMI Dubai)');
  const [deliveryNote, setDeliveryNote] = useState('');
  const [poNumber, setPoNumber] = useState('');
  const [dateReceived, setDateReceived] = useState(new Date().toISOString().split('T')[0]);
  const [receivingEmployee, setReceivingEmployee] = useState('Carlos Mendes (Storekeeper)');
  const [lines, setLines] = useState<{ productId: string; quantity: number; unitCost: number }[]>([
    { productId: products[0]?.id || '', quantity: 24, unitCost: products[0]?.rate || 10 },
  ]);

  const handleAddLine = () => {
    if (products.length > 0) {
      setLines([...lines, { productId: products[0].id, quantity: 12, unitCost: products[0].rate }]);
    }
  };

  const handleRemoveLine = (idx: number) => {
    setLines(lines.filter((_, i) => i !== idx));
  };

  const handleUpdateLine = (idx: number, field: 'productId' | 'quantity' | 'unitCost', val: any) => {
    setLines((prev) => {
      const copy = [...prev];
      (copy[idx] as any)[field] = val;
      if (field === 'productId') {
        const prod = products.find((p) => p.id === val);
        if (prod) {
          copy[idx].unitCost = prod.rate;
        }
      }
      return copy;
    });
  };

  const totalReceiptVal = lines.reduce((acc, l) => acc + (l.quantity * l.unitCost), 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!deliveryNote) return;

    const formattedLines: GoodsReceiptLine[] = lines.map((l) => {
      const prod = products.find((p) => p.id === l.productId);
      return {
        id: `grl-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        productId: l.productId,
        itemCode: prod?.itemCode || 'CODE',
        productName: prod?.name || 'Item',
        quantityReceived: Number(l.quantity),
        unitCost: Number(l.unitCost),
        totalValue: Number((l.quantity * l.unitCost).toFixed(2)),
      };
    });

    recordGoodsReceipt({
      supplierName,
      deliveryNoteNumber: deliveryNote,
      poNumber: poNumber || 'PO-GEN-2026',
      dateReceived,
      receivingEmployee,
      status: 'Authorized',
      totalValue: Number(totalReceiptVal.toFixed(2)),
      outlet: currentOutlet,
      lines: formattedLines,
    });

    setShowNewModal(false);
    setDeliveryNote('');
    setPoNumber('');
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Top Banner */}
      <div className="bg-[#0b152d] p-6 rounded-2xl border border-[#1b2b4e] shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-xs font-semibold text-[#d4af37] tracking-wider uppercase">
              Receiving Bay & Cellar Inbound
            </span>
            <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded">
              Auto Inventory Update
            </span>
          </div>
          <h2 className="text-2xl font-bold text-white mt-1">
            Goods Received & Supplier Delivery Intake
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Authorized delivery notes update stock counts automatically and write immutable audit log trails.
          </p>
        </div>

        <button
          onClick={() => setShowNewModal(true)}
          className="flex items-center space-x-2 bg-gradient-to-r from-[#d4af37] to-[#b58d24] text-[#050b18] px-4 py-2.5 rounded-xl font-bold text-xs shadow-md hover:brightness-110 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Record New Goods Delivery</span>
        </button>
      </div>

      {/* Goods Receipts List */}
      <div className="bg-[#0b152d] rounded-2xl border border-[#1b2b4e] shadow-xl overflow-hidden">
        <div className="p-4 border-b border-[#1b2b4e] flex items-center justify-between">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Truck className="w-4 h-4 text-[#d4af37]" />
            Supplier Delivery Notes & Receipts
          </h3>
          <span className="text-xs text-slate-400">{goodsReceipts.length} deliveries recorded</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#070e20] text-slate-300 font-semibold uppercase tracking-wider border-b border-[#1b2b4e]">
              <tr>
                <th className="py-3 px-4">Receipt #</th>
                <th className="py-3 px-3">Date</th>
                <th className="py-3 px-3">Supplier Name</th>
                <th className="py-3 px-3">Delivery Note #</th>
                <th className="py-3 px-3">PO #</th>
                <th className="py-3 px-3">Receiving Staff</th>
                <th className="py-3 px-3 text-right">Lines</th>
                <th className="py-3 px-3 text-right">Total Value (AED)</th>
                <th className="py-3 px-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#152345]">
              {goodsReceipts.map((gr) => (
                <tr key={gr.id} className="hover:bg-[#0f1c3b] transition-colors">
                  <td className="py-3.5 px-4 font-mono font-bold text-[#d4af37]">{gr.receiptNumber}</td>
                  <td className="py-3.5 px-3 text-slate-300">{gr.dateReceived}</td>
                  <td className="py-3.5 px-3 font-semibold text-white">{gr.supplierName}</td>
                  <td className="py-3.5 px-3 font-mono text-slate-300">{gr.deliveryNoteNumber}</td>
                  <td className="py-3.5 px-3 font-mono text-slate-400">{gr.poNumber}</td>
                  <td className="py-3.5 px-3 text-slate-300">{gr.receivingEmployee}</td>
                  <td className="py-3.5 px-3 text-right font-mono text-slate-400">{gr.lines.length} SKUs</td>
                  <td className="py-3.5 px-3 text-right font-mono font-bold text-emerald-400">
                    AED {gr.totalValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-950 text-emerald-400 border border-emerald-700">
                      {gr.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Goods Receipt Modal */}
      {showNewModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0a1329] border border-[#223766] rounded-2xl w-full max-w-2xl shadow-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#1b2b4e] pb-3">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Truck className="w-4 h-4 text-[#d4af37]" />
                  Record Authorized Goods Delivery Note
                </h3>
                <p className="text-xs text-slate-400">Inventory counts will automatically increment upon authorization</p>
              </div>
              <button onClick={() => setShowNewModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Supplier Name</label>
                  <select
                    value={supplierName}
                    onChange={(e) => setSupplierName(e.target.value)}
                    className="w-full px-3 py-2 bg-[#0c1630] border border-[#223766] rounded-xl text-xs text-white"
                  >
                    <option value="Maritime and Mercantile International (MMI Dubai)">Maritime and Mercantile International (MMI)</option>
                    <option value="African + Eastern (A+E)">African + Eastern (A+E)</option>
                    <option value="Barakat Fresh Juices LLC">Barakat Fresh Juices LLC</option>
                    <option value="Agthia / Al Ain Mineral Water">Agthia / Al Ain Mineral Water</option>
                    <option value="Chef Middle East LLC">Chef Middle East LLC</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Delivery Note Number</label>
                  <input
                    type="text"
                    required
                    value={deliveryNote}
                    onChange={(e) => setDeliveryNote(e.target.value)}
                    placeholder="e.g. DN-2026-9042"
                    className="w-full px-3 py-2 bg-[#0c1630] border border-[#223766] rounded-xl text-xs text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Purchase Order #</label>
                  <input
                    type="text"
                    value={poNumber}
                    onChange={(e) => setPoNumber(e.target.value)}
                    placeholder="e.g. PO-W-8812"
                    className="w-full px-3 py-2 bg-[#0c1630] border border-[#223766] rounded-xl text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Date Received</label>
                  <input
                    type="date"
                    value={dateReceived}
                    onChange={(e) => setDateReceived(e.target.value)}
                    className="w-full px-3 py-2 bg-[#0c1630] border border-[#223766] rounded-xl text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Receiving Employee</label>
                  <input
                    type="text"
                    value={receivingEmployee}
                    onChange={(e) => setReceivingEmployee(e.target.value)}
                    className="w-full px-3 py-2 bg-[#0c1630] border border-[#223766] rounded-xl text-xs text-white"
                  />
                </div>
              </div>

              {/* Product Lines */}
              <div className="border border-[#1b2b4e] rounded-xl p-3 bg-[#070e20] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-white">Delivered Product SKUs</span>
                  <button
                    type="button"
                    onClick={handleAddLine}
                    className="text-xs text-[#d4af37] hover:underline flex items-center gap-1 font-semibold"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add SKU
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

                    <div className="w-24">
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="Rate"
                        value={l.unitCost}
                        onChange={(e) => handleUpdateLine(idx, 'unitCost', parseFloat(e.target.value) || 0)}
                        className="w-full px-2 py-1.5 bg-[#0c1630] border border-[#223766] rounded-lg text-xs text-white font-mono"
                      />
                    </div>

                    <div className="w-24 text-right font-mono text-xs text-emerald-400 font-bold">
                      AED {(l.quantity * l.unitCost).toFixed(2)}
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

                <div className="flex justify-end pt-2 border-t border-[#142348] text-xs font-bold text-white">
                  <span>Total Delivery Value: </span>
                  <span className="text-emerald-400 font-mono ml-2">AED {totalReceiptVal.toFixed(2)}</span>
                </div>
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
                  Authorize & Update Inventory
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
