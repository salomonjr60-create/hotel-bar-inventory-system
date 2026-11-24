'use client';

import React, { useState, useMemo } from 'react';
import { useInventory } from '@/context/InventoryContext';
import { StockCount, StockCountLine, HOTEL_OUTLETS, HotelOutlet } from '@/types/inventory';
import {
  ClipboardList,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  Plus,
  Save,
  Send,
  Eye,
  Calendar,
  Layers,
  ChevronDown,
  Sparkles,
} from 'lucide-react';

export default function StockCountView() {
  const {
    products,
    stockCounts,
    currentRole,
    currentOutlet,
    submitStockCount,
    approveStockCount,
    rejectStockCount,
  } = useInventory();

  // Mode: 'history' or 'new-count' or 'view-details'
  const [viewMode, setViewMode] = useState<'history' | 'new-count' | 'view-details'>('history');
  const [selectedCount, setSelectedCount] = useState<StockCount | null>(null);

  // New Count Form State
  const [countDate, setCountDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [countOutlet, setCountOutlet] = useState<HotelOutlet>(currentOutlet);
  const [filterCategory, setFilterCategory] = useState<string>('All');
  const [countNotes, setCountNotes] = useState<string>('Routine daily physical inventory count');

  // Count lines state initialized with active products
  const [countLines, setCountLines] = useState<StockCountLine[]>([]);

  // Start new count
  const handleStartNewCount = () => {
    // Generate lines for all products or top operational ones
    const initialLines: StockCountLine[] = products.map((p) => {
      const opening = p.currentStock;
      const received = 0;
      const issued = 0;
      const transIn = 0;
      const transOut = 0;
      const wastage = 0;
      // Formula: Opening + Received + In - Issued - Out - Wastage
      const expected = opening + received + transIn - issued - transOut - wastage;
      const physical = opening; // default to expected until counted
      const variance = physical - expected;
      const varianceVal = variance * p.rate;

      return {
        id: `scl-${p.id}`,
        productId: p.id,
        itemCode: p.itemCode,
        productName: p.name,
        category: p.category,
        openingStock: opening,
        stockReceived: received,
        stockIssued: issued,
        transfersIn: transIn,
        transfersOut: transOut,
        wastage: wastage,
        expectedClosingStock: expected,
        physicalClosingStock: physical,
        variance: variance,
        varianceValue: varianceVal,
        unit: p.unit,
      };
    });

    setCountLines(initialLines);
    setViewMode('new-count');
  };

  const handleUpdateLine = (
    index: number,
    field: 'openingStock' | 'stockReceived' | 'stockIssued' | 'transfersIn' | 'transfersOut' | 'wastage' | 'physicalClosingStock',
    val: number
  ) => {
    setCountLines((prev) => {
      const updated = [...prev];
      const item = { ...updated[index] };
      const safeVal = Math.max(0, val);
      (item as any)[field] = safeVal;

      // Recalculate Expected Closing Stock
      item.expectedClosingStock = Number(
        (
          item.openingStock +
          item.stockReceived +
          item.transfersIn -
          item.stockIssued -
          item.transfersOut -
          item.wastage
        ).toFixed(2)
      );

      // Recalculate Variance
      item.variance = Number((item.physicalClosingStock - item.expectedClosingStock).toFixed(2));
      const prod = products.find((p) => p.id === item.productId);
      const rate = prod?.rate || 0;
      item.varianceValue = Number((item.variance * rate).toFixed(2));

      updated[index] = item;
      return updated;
    });
  };

  const handleQuickAddPhysical = (index: number, delta: number) => {
    const current = countLines[index].physicalClosingStock;
    handleUpdateLine(index, 'physicalClosingStock', Number((current + delta).toFixed(2)));
  };

  const handleSubmitCount = (status: 'Draft' | 'Submitted') => {
    const totalVarianceVal = Number(
      countLines.reduce((acc, l) => acc + l.varianceValue, 0).toFixed(2)
    );

    submitStockCount({
      countDate,
      outletName: countOutlet,
      conductedBy: `${currentRole} User`,
      status,
      totalVarianceValue: totalVarianceVal,
      lines: countLines,
      notes: countNotes,
    });

    setViewMode('history');
  };

  const filteredLines = useMemo(() => {
    if (filterCategory === 'All') return countLines;
    return countLines.filter((l) => l.category === filterCategory);
  }, [countLines, filterCategory]);

  const canApprove = currentRole === 'ADMIN' || currentRole === 'BAR_MANAGER';

  return (
    <div className="space-y-6 pb-16">
      {/* Top Banner */}
      <div className="bg-[#0b152d] p-6 rounded-2xl border border-[#1b2b4e] shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-xs font-semibold text-[#d4af37] tracking-wider uppercase">
              Operational Bar Stock Taking
            </span>
            <span className="text-[10px] bg-[#d4af3715] text-[#d4af37] px-2 py-0.5 rounded border border-[#d4af3730]">
              Decimals (0.25, 0.50, 0.75, 1.00) & Keg Litres Supported
            </span>
          </div>
          <h2 className="text-2xl font-bold text-white mt-1">
            Daily Beverage Stock Count & Variance Analysis
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Opening + Received + Transfers In - Issued - Transfers Out - Wastage = Expected Closing vs Physical Closing
          </p>
        </div>

        <div className="flex items-center space-x-3">
          {viewMode === 'history' ? (
            <button
              onClick={handleStartNewCount}
              className="flex items-center space-x-2 bg-gradient-to-r from-[#d4af37] to-[#b58d24] text-[#050b18] px-4 py-2.5 rounded-xl font-bold text-xs shadow-md hover:brightness-110 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Start New Physical Count</span>
            </button>
          ) : (
            <button
              onClick={() => setViewMode('history')}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:bg-[#122045] border border-[#1b2b4e]"
            >
              View Count History
            </button>
          )}
        </div>
      </div>

      {/* Mode 1: Historical Counts List */}
      {viewMode === 'history' && (
        <div className="bg-[#0b152d] rounded-2xl border border-[#1b2b4e] shadow-xl overflow-hidden">
          <div className="p-4 border-b border-[#1b2b4e] flex items-center justify-between">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <ClipboardList className="w-4 h-4 text-[#d4af37]" />
              Historical Stock Counts & Variance Audit
            </h3>
            <span className="text-xs text-slate-400">{stockCounts.length} audits logged</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#070e20] text-slate-300 font-semibold uppercase tracking-wider border-b border-[#1b2b4e]">
                <tr>
                  <th className="py-3 px-4">Count Number</th>
                  <th className="py-3 px-3">Date</th>
                  <th className="py-3 px-3">Outlet</th>
                  <th className="py-3 px-3">Conducted By</th>
                  <th className="py-3 px-3">Items Counted</th>
                  <th className="py-3 px-3 text-right">Variance Financial (AED)</th>
                  <th className="py-3 px-3 text-center">Status</th>
                  <th className="py-3 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#152345]">
                {stockCounts.map((sc) => (
                  <tr key={sc.id} className="hover:bg-[#0f1c3b] transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-[#d4af37]">{sc.countNumber}</td>
                    <td className="py-3.5 px-3 text-slate-300">{sc.countDate}</td>
                    <td className="py-3.5 px-3 font-semibold text-white">{sc.outletName}</td>
                    <td className="py-3.5 px-3 text-slate-300">{sc.conductedBy}</td>
                    <td className="py-3.5 px-3 font-mono text-slate-400">{sc.lines.length} lines</td>
                    <td className={`py-3.5 px-3 text-right font-mono font-bold ${
                      sc.totalVarianceValue < 0 ? 'text-amber-400' : sc.totalVarianceValue > 0 ? 'text-blue-400' : 'text-emerald-400'
                    }`}>
                      {sc.totalVarianceValue < 0 ? `-AED ${Math.abs(sc.totalVarianceValue).toFixed(2)}` : `AED ${sc.totalVarianceValue.toFixed(2)}`}
                    </td>
                    <td className="py-3.5 px-3 text-center">
                      <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        sc.status === 'Approved'
                          ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-700'
                          : sc.status === 'Submitted'
                          ? 'bg-amber-950/60 text-amber-400 border border-amber-700'
                          : sc.status === 'Rejected'
                          ? 'bg-red-950/60 text-red-400 border border-red-700'
                          : 'bg-slate-800 text-slate-300 border border-slate-700'
                      }`}>
                        {sc.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center space-x-2">
                        <button
                          onClick={() => {
                            setSelectedCount(sc);
                            setViewMode('view-details');
                          }}
                          className="px-2.5 py-1 rounded bg-[#122045] hover:bg-[#1a2f66] text-slate-200 text-xs font-medium flex items-center gap-1 border border-[#1e3463]"
                        >
                          <Eye className="w-3 h-3 text-[#d4af37]" />
                          <span>View</span>
                        </button>
                        {sc.status === 'Submitted' && canApprove && (
                          <>
                            <button
                              onClick={() => approveStockCount(sc.id)}
                              className="px-2.5 py-1 rounded bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => rejectStockCount(sc.id)}
                              className="px-2.5 py-1 rounded bg-red-800 hover:bg-red-700 text-white text-xs font-bold"
                            >
                              Reject
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
        </div>
      )}

      {/* Mode 2: Conduct Daily Physical Count */}
      {viewMode === 'new-count' && (
        <div className="bg-[#0b152d] rounded-2xl border border-[#1b2b4e] shadow-2xl p-6 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#1b2b4e] pb-4">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#d4af37]" />
                Daily Stock Count Sheet
              </h3>
              <p className="text-xs text-slate-400">
                Enter physical closing stock. Bottle decimals (0.25, 0.50, 0.75, 1.00) and draft litres supported.
              </p>
            </div>

            <div className="flex items-center space-x-3">
              <button
                onClick={() => handleSubmitCount('Draft')}
                className="flex items-center space-x-1.5 px-4 py-2 bg-[#122045] hover:bg-[#1a2f66] text-slate-200 rounded-xl text-xs font-semibold border border-[#1f335c]"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save Draft</span>
              </button>
              <button
                onClick={() => handleSubmitCount('Submitted')}
                className="flex items-center space-x-1.5 px-5 py-2 bg-gradient-to-r from-[#d4af37] to-[#b58d24] text-[#050b18] rounded-xl text-xs font-bold hover:brightness-110 shadow-md"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Submit to Supervisor for Approval</span>
              </button>
            </div>
          </div>

          {/* Metadata Controls */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-[#070e20] p-4 rounded-xl border border-[#142348]">
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">Count Date</label>
              <input
                type="date"
                value={countDate}
                onChange={(e) => setCountDate(e.target.value)}
                className="w-full px-3 py-1.5 bg-[#0b152d] border border-[#1e3463] rounded-lg text-xs text-white"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">Hotel Outlet</label>
              <select
                value={countOutlet}
                onChange={(e) => setCountOutlet(e.target.value as HotelOutlet)}
                className="w-full px-3 py-1.5 bg-[#0b152d] border border-[#1e3463] rounded-lg text-xs text-white"
              >
                {HOTEL_OUTLETS.map((o) => (
                  <option key={o} value={o}>{o}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">Category Filter</label>
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="w-full px-3 py-1.5 bg-[#0b152d] border border-[#1e3463] rounded-lg text-xs text-white"
              >
                <option value="All">All Categories ({countLines.length} SKUs)</option>
                <option value="Spirits">Spirits</option>
                <option value="Liqueurs and Aperitifs">Liqueurs and Aperitifs</option>
                <option value="Red Wines">Red Wines</option>
                <option value="White Wines">White Wines</option>
                <option value="Rose Wines">Rose Wines</option>
                <option value="Sparkling Wines and Champagne">Sparkling Wines & Champagne</option>
                <option value="Beers and Non-Alcoholic Beer">Beers</option>
                <option value="Soft Beverages and Water">Soft Beverages & Water</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">Shift Notes</label>
              <input
                type="text"
                value={countNotes}
                onChange={(e) => setCountNotes(e.target.value)}
                placeholder="Shift notes..."
                className="w-full px-3 py-1.5 bg-[#0b152d] border border-[#1e3463] rounded-lg text-xs text-white"
              />
            </div>
          </div>

          {/* Stock Count Worksheet Table */}
          <div className="overflow-x-auto max-h-[600px] overflow-y-auto rounded-xl border border-[#182747]">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#070e20] text-slate-300 font-semibold uppercase tracking-wider sticky top-0 z-10 border-b border-[#1b2b4e]">
                <tr>
                  <th className="py-2.5 px-3">Product</th>
                  <th className="py-2.5 px-2 text-center">Unit</th>
                  <th className="py-2.5 px-2 text-right">Opening</th>
                  <th className="py-2.5 px-2 text-right">Received</th>
                  <th className="py-2.5 px-2 text-right">Issued</th>
                  <th className="py-2.5 px-2 text-right">Trans In</th>
                  <th className="py-2.5 px-2 text-right">Trans Out</th>
                  <th className="py-2.5 px-2 text-right">Wastage</th>
                  <th className="py-2.5 px-3 text-right bg-[#0c1630] font-bold">Expected</th>
                  <th className="py-2.5 px-3 text-center bg-[#102047] text-[#d4af37]">Physical Closing</th>
                  <th className="py-2.5 px-3 text-right">Variance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#152345]">
                {filteredLines.map((line, idx) => {
                  const hasVariance = line.variance !== 0;
                  return (
                    <tr key={line.id} className="hover:bg-[#0f1c3b] transition-colors">
                      <td className="py-2 px-3 font-medium text-white max-w-xs">
                        <div className="truncate font-semibold">{line.productName}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{line.itemCode}</div>
                      </td>
                      <td className="py-2 px-2 text-center text-slate-400 font-mono text-[11px]">{line.unit}</td>
                      <td className="py-2 px-2 text-right font-mono text-slate-300">{line.openingStock.toFixed(2)}</td>
                      <td className="py-2 px-2 text-right font-mono text-slate-300">{line.stockReceived.toFixed(2)}</td>
                      <td className="py-2 px-2 text-right font-mono text-slate-300">{line.stockIssued.toFixed(2)}</td>
                      <td className="py-2 px-2 text-right font-mono text-slate-300">{line.transfersIn.toFixed(2)}</td>
                      <td className="py-2 px-2 text-right font-mono text-slate-300">{line.transfersOut.toFixed(2)}</td>
                      <td className="py-2 px-2 text-right font-mono text-red-300">{line.wastage.toFixed(2)}</td>

                      {/* Calculated Expected Closing */}
                      <td className="py-2 px-3 text-right font-mono font-bold text-slate-200 bg-[#0c1630]">
                        {line.expectedClosingStock.toFixed(2)}
                      </td>

                      {/* Physical Closing Entry + Decimals */}
                      <td className="py-2 px-3 bg-[#0d1838]">
                        <div className="flex items-center space-x-1.5 justify-center">
                          <input
                            type="number"
                            step="0.25"
                            min="0"
                            value={line.physicalClosingStock}
                            onChange={(e) =>
                              handleUpdateLine(idx, 'physicalClosingStock', parseFloat(e.target.value) || 0)
                            }
                            className="w-16 px-1.5 py-1 bg-[#070e20] border border-[#223766] rounded text-center font-mono font-bold text-white text-xs focus:outline-none focus:border-[#d4af37]"
                          />
                          <div className="flex items-center space-x-0.5">
                            <button
                              onClick={() => handleQuickAddPhysical(idx, 0.25)}
                              className="px-1 py-0.5 bg-[#14234b] hover:bg-[#1f3570] text-[10px] font-mono text-[#f7e7a9] rounded"
                            >
                              .25
                            </button>
                            <button
                              onClick={() => handleQuickAddPhysical(idx, 0.50)}
                              className="px-1 py-0.5 bg-[#14234b] hover:bg-[#1f3570] text-[10px] font-mono text-[#f7e7a9] rounded"
                            >
                              .50
                            </button>
                            <button
                              onClick={() => handleQuickAddPhysical(idx, 1.00)}
                              className="px-1 py-0.5 bg-[#14234b] hover:bg-[#1f3570] text-[10px] font-mono text-[#f7e7a9] rounded"
                            >
                              +1
                            </button>
                          </div>
                        </div>
                      </td>

                      {/* Calculated Variance */}
                      <td
                        className={`py-2 px-3 text-right font-mono font-bold ${
                          line.variance < 0
                            ? 'text-red-400'
                            : line.variance > 0
                            ? 'text-blue-400'
                            : 'text-emerald-400'
                        }`}
                      >
                        {line.variance > 0 ? `+${line.variance.toFixed(2)}` : line.variance.toFixed(2)}
                        {hasVariance && (
                          <div className="text-[10px] font-normal text-slate-400">
                            AED {line.varianceValue.toFixed(2)}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Mode 3: View Count Drill-Down Details */}
      {viewMode === 'view-details' && selectedCount && (
        <div className="bg-[#0b152d] rounded-2xl border border-[#1b2b4e] shadow-2xl p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-[#1b2b4e] pb-4">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <ClipboardList className="w-4 h-4 text-[#d4af37]" />
                Audit Report: {selectedCount.countNumber} ({selectedCount.outletName})
              </h3>
              <p className="text-xs text-slate-400">
                Count Date: {selectedCount.countDate} • Conducted by: {selectedCount.conductedBy}
              </p>
            </div>
            <button
              onClick={() => setViewMode('history')}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-300 hover:bg-[#122045] border border-[#1b2b4e]"
            >
              Back to History
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-[#070e20] p-4 rounded-xl border border-[#142348] text-xs">
            <div>
              <span className="text-slate-400">Status:</span>
              <p className="font-bold text-white">{selectedCount.status}</p>
            </div>
            <div>
              <span className="text-slate-400">Approved By:</span>
              <p className="font-bold text-white">{selectedCount.approvedBy || 'Pending'}</p>
            </div>
            <div>
              <span className="text-slate-400">Total Variance Financial:</span>
              <p className={`font-bold ${selectedCount.totalVarianceValue < 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                AED {selectedCount.totalVarianceValue.toFixed(2)}
              </p>
            </div>
            <div>
              <span className="text-slate-400">Operational Notes:</span>
              <p className="text-slate-300 truncate">{selectedCount.notes || '-'}</p>
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-[#182747]">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#070e20] text-slate-300 font-semibold uppercase tracking-wider border-b border-[#1b2b4e]">
                <tr>
                  <th className="py-2.5 px-3">Item Code</th>
                  <th className="py-2.5 px-3">Product Name</th>
                  <th className="py-2.5 px-2 text-right">Opening</th>
                  <th className="py-2.5 px-2 text-right">Received</th>
                  <th className="py-2.5 px-2 text-right">Issued</th>
                  <th className="py-2.5 px-2 text-right">Transfers</th>
                  <th className="py-2.5 px-2 text-right">Wastage</th>
                  <th className="py-2.5 px-3 text-right">Expected</th>
                  <th className="py-2.5 px-3 text-right font-bold text-[#d4af37]">Physical</th>
                  <th className="py-2.5 px-3 text-right">Variance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#152345]">
                {selectedCount.lines.map((l) => (
                  <tr key={l.id} className="hover:bg-[#0f1c3b]">
                    <td className="py-2 px-3 font-mono text-[#d4af37]">{l.itemCode}</td>
                    <td className="py-2 px-3 font-medium text-white">{l.productName}</td>
                    <td className="py-2 px-2 text-right font-mono text-slate-300">{l.openingStock.toFixed(2)}</td>
                    <td className="py-2 px-2 text-right font-mono text-slate-300">{l.stockReceived.toFixed(2)}</td>
                    <td className="py-2 px-2 text-right font-mono text-slate-300">{l.stockIssued.toFixed(2)}</td>
                    <td className="py-2 px-2 text-right font-mono text-slate-300">
                      {(l.transfersIn - l.transfersOut).toFixed(2)}
                    </td>
                    <td className="py-2 px-2 text-right font-mono text-red-300">{l.wastage.toFixed(2)}</td>
                    <td className="py-2 px-3 text-right font-mono font-bold text-slate-200">
                      {l.expectedClosingStock.toFixed(2)}
                    </td>
                    <td className="py-2 px-3 text-right font-mono font-bold text-white bg-[#0d1838]">
                      {l.physicalClosingStock.toFixed(2)} {l.unit}
                    </td>
                    <td
                      className={`py-2 px-3 text-right font-mono font-bold ${
                        l.variance < 0 ? 'text-red-400' : l.variance > 0 ? 'text-blue-400' : 'text-emerald-400'
                      }`}
                    >
                      {l.variance > 0 ? `+${l.variance.toFixed(2)}` : l.variance.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
