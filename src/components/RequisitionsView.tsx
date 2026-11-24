'use client';

import React, { useState } from 'react';
import { useInventory } from '@/context/InventoryContext';
import { PurchaseRequisition, PurchaseRequisitionLine, HotelOutlet } from '@/types/inventory';
import {
  FileSpreadsheet,
  Plus,
  Zap,
  CheckCircle2,
  XCircle,
  Download,
  FileText,
  FileDown,
  X,
  AlertTriangle,
  Sparkles,
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

export default function RequisitionsView() {
  const {
    products,
    requisitions,
    currentRole,
    currentOutlet,
    createRequisition,
    approveRequisition,
    rejectRequisition,
    generateAutoRequisition,
  } = useInventory();

  const [selectedReq, setSelectedReq] = useState<PurchaseRequisition | null>(null);
  const [showManualModal, setShowManualModal] = useState(false);
  const [notes, setNotes] = useState('Weekly central store beverage requisition');
  const [lines, setLines] = useState<{ productId: string; requestedQty: number }[]>([
    { productId: products[0]?.id || '', requestedQty: 12 },
  ]);

  const canApprove = currentRole === 'ADMIN' || currentRole === 'BAR_MANAGER';

  // Export Requisition as PDF
  const exportReqPDF = (req: PurchaseRequisition) => {
    const doc = new jsPDF();

    // Luxury Header
    doc.setFillColor(10, 19, 41); // Navy Blue
    doc.rect(0, 0, 210, 38, 'F');

    doc.setTextColor(212, 175, 55); // Champagne Gold
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('HOTEL BAR INVENTORY CONTROL SYSTEM', 14, 16);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(255, 255, 255);
    doc.text('Farrago W Lounge • Mina Seyahi Beach Resort & Marina', 14, 23);
    doc.text('Official Beverage Purchase Requisition Form (Doc Ref: PL-PL2600109)', 14, 29);

    // Metadata
    doc.setTextColor(30, 41, 59);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text(`Requisition #: ${req.reqNumber}`, 14, 46);
    doc.text(`Date Created: ${req.dateCreated}`, 14, 52);
    doc.text(`Outlet: ${req.outlet}`, 14, 58);

    doc.text(`Status: ${req.status.toUpperCase()}`, 130, 46);
    doc.text(`Created By: ${req.createdBy}`, 130, 52);
    doc.text(`Approved By: ${req.approvedBy || 'Pending'}`, 130, 58);

    // Table
    const tableData = req.lines.map((l, index) => [
      index + 1,
      l.itemCode,
      l.productName,
      l.currentStock.toFixed(2),
      l.minParLevel.toFixed(2),
      l.maxParLevel.toFixed(2),
      l.requestedQty.toFixed(2),
      `AED ${l.unitCost.toFixed(2)}`,
      `AED ${l.estimatedTotal.toFixed(2)}`,
    ]);

    autoTable(doc, {
      startY: 64,
      head: [['#', 'Item Code', 'Beverage Name', 'Current', 'Min Par', 'Max Par', 'Order Qty', 'Rate', 'Est. Total']],
      body: tableData,
      theme: 'grid',
      headStyles: {
        fillColor: [10, 19, 41],
        textColor: [212, 175, 55],
        fontStyle: 'bold',
        fontSize: 8,
      },
      styles: {
        fontSize: 8,
        cellPadding: 2,
      },
      columnStyles: {
        0: { cellWidth: 8 },
        1: { cellWidth: 20 },
        2: { cellWidth: 60 },
        6: { fontStyle: 'bold', halign: 'right' },
        7: { halign: 'right' },
        8: { fontStyle: 'bold', halign: 'right' },
      },
    });

    const finalY = (doc as any).lastAutoTable.finalY || 150;

    // Total Cost Box
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(10, 19, 41);
    doc.text(
      `Total Estimated Cost: AED ${req.totalEstimatedCost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      14,
      finalY + 12
    );

    // Signature blocks
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.line(14, finalY + 35, 75, finalY + 35);
    doc.text('Prepared By: Bartender / Supervisor', 14, finalY + 40);

    doc.line(80, finalY + 35, 140, finalY + 35);
    doc.text('Reviewed: Head Bartender / Bar Manager', 80, finalY + 40);

    doc.line(145, finalY + 35, 195, finalY + 35);
    doc.text('Authorized: Cost Controller / DOF', 145, finalY + 40);

    doc.save(`${req.reqNumber}-Beverage-Requisition.pdf`);
  };

  // Export Requisition as Excel (.xlsx)
  const exportReqExcel = (req: PurchaseRequisition) => {
    const sheetData = req.lines.map((l, i) => ({
      'SNo': i + 1,
      'Item Code': l.itemCode,
      'Beverage Name': l.productName,
      'Current Physical Stock': l.currentStock,
      'Min Par Level': l.minParLevel,
      'Max Par Level': l.maxParLevel,
      'Recommended Order Qty': l.recommendedQty,
      'Requested Qty': l.requestedQty,
      'Unit Cost (AED)': l.unitCost,
      'Estimated Total (AED)': l.estimatedTotal,
    }));

    const worksheet = XLSX.utils.json_to_sheet(sheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Requisition');
    XLSX.writeFile(workbook, `${req.reqNumber}-Requisition.xlsx`);
  };

  const handleAddLine = () => {
    if (products.length > 0) {
      setLines([...lines, { productId: products[0].id, requestedQty: 6 }]);
    }
  };

  const handleRemoveLine = (idx: number) => {
    setLines(lines.filter((_, i) => i !== idx));
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const formattedLines: PurchaseRequisitionLine[] = lines.map((l) => {
      const prod = products.find((p) => p.id === l.productId);
      const stock = prod?.currentStock || 0;
      const minPar = prod?.minParLevel || 0;
      const maxPar = prod?.maxParLevel || 0;
      const rec = Math.max(0, maxPar - stock);
      const rate = prod?.rate || 0;
      return {
        id: `reql-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        productId: l.productId,
        itemCode: prod?.itemCode || 'CODE',
        productName: prod?.name || 'Item',
        currentStock: stock,
        minParLevel: minPar,
        maxParLevel: maxPar,
        recommendedQty: rec,
        requestedQty: Number(l.requestedQty),
        unitCost: rate,
        estimatedTotal: Number((l.requestedQty * rate).toFixed(2)),
      };
    });

    const total = formattedLines.reduce((acc, l) => acc + l.estimatedTotal, 0);

    createRequisition({
      dateCreated: new Date().toISOString().split('T')[0],
      createdBy: `${currentRole} User`,
      status: 'Submitted',
      outlet: currentOutlet,
      totalEstimatedCost: Number(total.toFixed(2)),
      lines: formattedLines,
      notes,
    });

    setShowManualModal(false);
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Top Banner */}
      <div className="bg-[#0b152d] p-6 rounded-2xl border border-[#1b2b4e] shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-xs font-semibold text-[#d4af37] tracking-wider uppercase">
              Automated Cost Control & Replenishment
            </span>
            <span className="text-[10px] bg-[#d4af3715] text-[#d4af37] px-2 py-0.5 rounded border border-[#d4af3730]">
              Max Par Formula: Reorder = Max Par - Current Stock
            </span>
          </div>
          <h2 className="text-2xl font-bold text-white mt-1">
            Purchase Requisitions & Par-Level Replenishment
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Generate 1-click orders for products below par, approve workflows, and export official PDF purchase forms and Excel spreadsheets.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => generateAutoRequisition()}
            className="flex items-center space-x-2 bg-gradient-to-r from-[#d4af37] to-[#b58d24] text-[#050b18] px-4 py-2.5 rounded-xl font-bold text-xs shadow-md hover:brightness-110 transition-all"
          >
            <Zap className="w-4 h-4 text-[#050b18]" />
            <span>1-Click Auto Par Replenish</span>
          </button>
          <button
            onClick={() => setShowManualModal(true)}
            className="flex items-center space-x-2 bg-[#122045] hover:bg-[#1a2f66] text-slate-200 px-4 py-2.5 rounded-xl font-semibold text-xs border border-[#1e3463] transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Custom Requisition</span>
          </button>
        </div>
      </div>

      {/* Requisitions List Table */}
      <div className="bg-[#0b152d] rounded-2xl border border-[#1b2b4e] shadow-xl overflow-hidden">
        <div className="p-4 border-b border-[#1b2b4e] flex items-center justify-between">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <FileSpreadsheet className="w-4 h-4 text-[#d4af37]" />
            Purchase Requisitions Log
          </h3>
          <span className="text-xs text-slate-400">{requisitions.length} requisitions recorded</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#070e20] text-slate-300 font-semibold uppercase tracking-wider border-b border-[#1b2b4e]">
              <tr>
                <th className="py-3 px-4">Requisition #</th>
                <th className="py-3 px-3">Date</th>
                <th className="py-3 px-3">Outlet</th>
                <th className="py-3 px-3">Created By</th>
                <th className="py-3 px-3 text-right">Items</th>
                <th className="py-3 px-3 text-right">Est. Total Cost (AED)</th>
                <th className="py-3 px-3 text-center">Status</th>
                <th className="py-3 px-4 text-center">Export / Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#152345]">
              {requisitions.map((req) => (
                <tr key={req.id} className="hover:bg-[#0f1c3b] transition-colors">
                  <td className="py-3.5 px-4 font-mono font-bold text-[#d4af37]">{req.reqNumber}</td>
                  <td className="py-3.5 px-3 text-slate-300">{req.dateCreated}</td>
                  <td className="py-3.5 px-3 font-semibold text-white">{req.outlet}</td>
                  <td className="py-3.5 px-3 text-slate-300">{req.createdBy}</td>
                  <td className="py-3.5 px-3 text-right font-mono text-slate-300">{req.lines.length} SKUs</td>
                  <td className="py-3.5 px-3 text-right font-mono font-bold text-[#f7e7a9]">
                    AED {req.totalEstimatedCost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td className="py-3.5 px-3 text-center">
                    <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      req.status === 'Approved'
                        ? 'bg-emerald-950 text-emerald-400 border border-emerald-700'
                        : req.status === 'Submitted'
                        ? 'bg-amber-950 text-amber-400 border border-amber-700'
                        : req.status === 'Rejected'
                        ? 'bg-red-950 text-red-400 border border-red-700'
                        : 'bg-slate-800 text-slate-300 border border-slate-700'
                    }`}>
                      {req.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <div className="flex items-center justify-center space-x-2">
                      {/* PDF Export */}
                      <button
                        onClick={() => exportReqPDF(req)}
                        title="Download Luxury PDF Purchase Form"
                        className="p-1.5 rounded bg-[#122045] hover:bg-[#1a2f66] text-[#d4af37] border border-[#1f335c] transition-colors"
                      >
                        <FileText className="w-3.5 h-3.5" />
                      </button>
                      {/* Excel Export */}
                      <button
                        onClick={() => exportReqExcel(req)}
                        title="Download Excel Spreadsheet (.xlsx)"
                        className="p-1.5 rounded bg-[#122045] hover:bg-[#1a2f66] text-emerald-400 border border-[#1f335c] transition-colors"
                      >
                        <FileDown className="w-3.5 h-3.5" />
                      </button>
                      {/* Approve / Reject */}
                      {req.status === 'Submitted' && canApprove && (
                        <>
                          <button
                            onClick={() => approveRequisition(req.id)}
                            className="px-2 py-1 bg-emerald-700 hover:bg-emerald-600 text-white rounded text-[11px] font-bold"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => rejectRequisition(req.id)}
                            className="px-2 py-1 bg-red-800 hover:bg-red-700 text-white rounded text-[11px] font-bold"
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

      {/* Manual Requisition Modal */}
      {showManualModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0a1329] border border-[#223766] rounded-2xl w-full max-w-xl shadow-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#1b2b4e] pb-3">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <FileSpreadsheet className="w-4 h-4 text-[#d4af37]" />
                  Create Custom Purchase Requisition
                </h3>
                <p className="text-xs text-slate-400">Order products for hotel cellar replenishment</p>
              </div>
              <button onClick={() => setShowManualModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleManualSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Purpose / Notes</label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Replenish speed rails for weekend terrace events"
                  className="w-full px-3 py-2 bg-[#0c1630] border border-[#223766] rounded-xl text-xs text-white"
                />
              </div>

              {/* Items */}
              <div className="border border-[#1b2b4e] rounded-xl p-3 bg-[#070e20] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-white">Requisitioned SKUs</span>
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
                      onChange={(e) => {
                        const copy = [...lines];
                        copy[idx].productId = e.target.value;
                        setLines(copy);
                      }}
                      className="flex-1 px-2.5 py-1.5 bg-[#0c1630] border border-[#223766] rounded-lg text-xs text-white"
                    >
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.itemCode} - {p.name} (Stock: {p.currentStock} / Par: {p.minParLevel})
                        </option>
                      ))}
                    </select>

                    <div className="w-24">
                      <input
                        type="number"
                        min="1"
                        placeholder="Qty"
                        value={l.requestedQty}
                        onChange={(e) => {
                          const copy = [...lines];
                          copy[idx].requestedQty = parseFloat(e.target.value) || 0;
                          setLines(copy);
                        }}
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

              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-[#1b2b4e]">
                <button
                  type="button"
                  onClick={() => setShowManualModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:bg-[#122045]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-[#d4af37] to-[#b58d24] text-[#050b18] hover:brightness-110 shadow-md"
                >
                  Submit Requisition
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
