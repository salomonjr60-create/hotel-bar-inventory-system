'use client';

import React, { useState, useMemo } from 'react';
import { useInventory } from '@/context/InventoryContext';
import { ALL_CATEGORIES, HOTEL_OUTLETS } from '@/types/inventory';
import {
  FileText,
  Download,
  Filter,
  FileSpreadsheet,
  FileDown,
  Layers,
  Search,
  Calendar,
  Sparkles,
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

export default function ReportsView() {
  const {
    products,
    stockCounts,
    goodsReceipts,
    transfers,
    wastageRecords,
    requisitions,
    currentOutlet,
  } = useInventory();

  // Selected report type (1 to 12)
  const [selectedReportId, setSelectedReportId] = useState<number>(1);

  // Filters
  const [filterStartDate, setFilterStartDate] = useState<string>('2026-11-01');
  const [filterEndDate, setFilterEndDate] = useState<string>('2026-11-30');
  const [filterCategory, setFilterCategory] = useState<string>('All');
  const [filterOutlet, setFilterOutlet] = useState<string>('All');
  const [searchFilter, setSearchFilter] = useState<string>('');

  const reportTypes = [
    { id: 1, title: 'Daily Beverage Inventory', desc: 'Current daily stock levels, pars, and status across bars' },
    { id: 2, title: 'Weekly Beverage Inventory', desc: 'Weekly opening, consumption, receipts, and closing balances' },
    { id: 3, title: 'Monthly Beverage Inventory', desc: 'Full month beverage audit, depletion, and cost reconciliation' },
    { id: 4, title: 'Par Level Report', desc: 'Official baseline pars vs operational min/max par configurations' },
    { id: 5, title: 'Low Stock Report', desc: 'Prioritized list of all products below par requiring replenishment' },
    { id: 6, title: 'Stock Variance Report', desc: 'Physical count discrepancies vs expected book stocks and monetary variance' },
    { id: 7, title: 'Goods Received Report', desc: 'Inbound deliveries from suppliers (MMI, A+E, Barakat) and costs' },
    { id: 8, title: 'Stock Transfer Report', desc: 'Inter-outlet beverage transfers between the 7 hotel locations' },
    { id: 9, title: 'Wastage Report', desc: 'Spillage, broken bottles, expired items, and calculated financial loss' },
    { id: 10, title: 'Beverage Valuation Report', desc: 'Comprehensive financial stock valuation by category and outlet' },
    { id: 11, title: 'Purchase Requisition Report', desc: 'Requisition history, approved orders, and cost commitments' },
    { id: 12, title: 'Category-Wise Inventory Report', desc: 'Departmental breakdown (Spirits, Wine, Champagne, Beer, Mixers)' },
  ];

  // Compute report data rows based on selected report and filters
  const reportData = useMemo(() => {
    let raw: any[] = [];

    switch (selectedReportId) {
      case 1: // Daily Beverage Inventory
      case 10: // Beverage Valuation Report
      case 12: // Category-Wise Inventory Report
        raw = products.map((p) => ({
          'SNo': p.sno,
          'Item Code': p.itemCode,
          'Beverage Name': p.name,
          'Category': p.category,
          'Subcategory': p.subcategory,
          'Packaging': p.packagingDescription,
          'Physical Stock': p.currentStock,
          'Unit': p.unit,
          'Min Par': p.minParLevel,
          'Rate (AED)': p.rate,
          'Valuation (AED)': Number((p.currentStock * p.rate).toFixed(2)),
          'Status': p.status,
        }));
        break;

      case 4: // Par Level Report
        raw = products.map((p) => ({
          'SNo': p.sno,
          'Item Code': p.itemCode,
          'Beverage Name': p.name,
          'Category': p.category,
          'Original PDF Par': p.originalParLevel,
          'Operational Min Par': p.minParLevel,
          'Operational Max Par': p.maxParLevel,
          'Current Stock': p.currentStock,
          'Reorder Qty': p.reorderQuantity,
          'Unit': p.unit,
          'Status': p.status,
        }));
        break;

      case 5: // Low Stock Report
        raw = products
          .filter((p) => p.minParLevel > 0 && p.currentStock < p.minParLevel)
          .map((p) => ({
            'SNo': p.sno,
            'Item Code': p.itemCode,
            'Beverage Name': p.name,
            'Category': p.category,
            'Current Stock': p.currentStock,
            'Min Par': p.minParLevel,
            'Max Par': p.maxParLevel,
            'Deficit / Reorder Qty': p.reorderQuantity,
            'Unit Cost (AED)': p.rate,
            'Replenish Cost (AED)': Number((p.reorderQuantity * p.rate).toFixed(2)),
            'Severity': p.currentStock <= 0 ? 'CRITICAL (Zero Stock)' : 'RED (Below Par)',
          }));
        break;

      case 6: // Stock Variance Report
        raw = stockCounts.flatMap((sc) =>
          sc.lines
            .filter((l) => l.variance !== 0)
            .map((l) => ({
              'Count #': sc.countNumber,
              'Date': sc.countDate,
              'Outlet': sc.outletName,
              'Item Code': l.itemCode,
              'Beverage Name': l.productName,
              'Expected Stock': l.expectedClosingStock,
              'Physical Count': l.physicalClosingStock,
              'Variance Units': l.variance,
              'Variance Value (AED)': l.varianceValue,
              'Conducted By': sc.conductedBy,
              'Status': sc.status,
            }))
        );
        break;

      case 7: // Goods Received Report
        raw = goodsReceipts.flatMap((gr) =>
          gr.lines.map((l) => ({
            'Receipt #': gr.receiptNumber,
            'Date': gr.dateReceived,
            'Supplier': gr.supplierName,
            'Delivery Note': gr.deliveryNoteNumber,
            'PO #': gr.poNumber,
            'Item Code': l.itemCode,
            'Product': l.productName,
            'Qty Received': l.quantityReceived,
            'Unit Cost (AED)': l.unitCost,
            'Total Value (AED)': l.totalValue,
            'Receiving Staff': gr.receivingEmployee,
          }))
        );
        break;

      case 8: // Stock Transfer Report
        raw = transfers.flatMap((tr) =>
          tr.lines.map((l) => ({
            'Transfer #': tr.transferNumber,
            'Date': tr.transferDate,
            'From Outlet': tr.sendingOutlet,
            'To Outlet': tr.receivingOutlet,
            'Item Code': l.itemCode,
            'Product': l.productName,
            'Quantity': l.quantity,
            'Unit': l.unit,
            'Initiated By': tr.employee,
            'Status': tr.status,
          }))
        );
        break;

      case 9: // Wastage Report
        raw = wastageRecords.map((w) => ({
          'Record #': w.recordNumber,
          'Date': w.date,
          'Outlet': w.outlet,
          'Item Code': w.itemCode,
          'Product': w.productName,
          'Reason': w.reason,
          'Quantity': w.quantity,
          'Unit': w.unit,
          'Loss (AED)': w.financialLoss,
          'Staff': w.employee,
          'Approval': w.supervisorApproval,
          'Notes': w.notes || '-',
        }));
        break;

      case 11: // Purchase Requisition Report
        raw = requisitions.flatMap((req) =>
          req.lines.map((l) => ({
            'Req #': req.reqNumber,
            'Date': req.dateCreated,
            'Outlet': req.outlet,
            'Item Code': l.itemCode,
            'Product': l.productName,
            'Requested Qty': l.requestedQty,
            'Unit Cost (AED)': l.unitCost,
            'Estimated Cost (AED)': l.estimatedTotal,
            'Created By': req.createdBy,
            'Status': req.status,
          }))
        );
        break;

      default:
        raw = products.map((p) => ({
          'Item Code': p.itemCode,
          'Product Name': p.name,
          'Category': p.category,
          'Physical Stock': p.currentStock,
          'Min Par': p.minParLevel,
          'Rate': p.rate,
        }));
    }

    // Apply Filters
    return raw.filter((item) => {
      if (filterCategory !== 'All' && item.Category && item.Category !== filterCategory) {
        return false;
      }
      if (filterOutlet !== 'All') {
        const outletVal = item.Outlet || item['From Outlet'] || item['To Outlet'];
        if (outletVal && outletVal !== filterOutlet) {
          return false;
        }
      }
      if (searchFilter.trim()) {
        const q = searchFilter.toLowerCase();
        const str = JSON.stringify(item).toLowerCase();
        if (!str.includes(q)) return false;
      }
      return true;
    });
  }, [selectedReportId, products, stockCounts, goodsReceipts, transfers, wastageRecords, requisitions, filterCategory, filterOutlet, searchFilter]);

  const currentReportMeta = reportTypes.find((r) => r.id === selectedReportId)!;

  // Export to Excel (.xlsx)
  const handleExportExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(reportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Report');
    XLSX.writeFile(workbook, `${currentReportMeta.title.replace(/\s+/g, '_')}_Report.xlsx`);
  };

  // Export to CSV
  const handleExportCSV = () => {
    const worksheet = XLSX.utils.json_to_sheet(reportData);
    const csvOutput = XLSX.utils.sheet_to_csv(worksheet);
    const blob = new Blob([csvOutput], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', `${currentReportMeta.title.replace(/\s+/g, '_')}_Report.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export to PDF
  const handleExportPDF = () => {
    const doc = new jsPDF('landscape');

    // Luxury Header
    doc.setFillColor(10, 19, 41);
    doc.rect(0, 0, 297, 34, 'F');

    doc.setTextColor(212, 175, 55);
    doc.setFontSize(15);
    doc.setFont('helvetica', 'bold');
    doc.text('HOTEL BAR INVENTORY CONTROL SYSTEM', 14, 14);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(255, 255, 255);
    doc.text(`Official Report: ${currentReportMeta.title.toUpperCase()}`, 14, 21);
    doc.text(`Farrago W Lounge • Mina Seyahi Beach Resort & Marina • Generated: ${new Date().toLocaleDateString()}`, 14, 27);

    if (reportData.length > 0) {
      const headers = Object.keys(reportData[0]);
      const rows = reportData.map((obj) => headers.map((h) => obj[h]));

      autoTable(doc, {
        startY: 40,
        head: [headers],
        body: rows,
        theme: 'grid',
        headStyles: {
          fillColor: [10, 19, 41],
          textColor: [212, 175, 55],
          fontSize: 7.5,
          fontStyle: 'bold',
        },
        styles: {
          fontSize: 7,
          cellPadding: 2,
        },
      });
    }

    doc.save(`${currentReportMeta.title.replace(/\s+/g, '_')}_Report.pdf`);
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Top Banner */}
      <div className="bg-[#0b152d] p-6 rounded-2xl border border-[#1b2b4e] shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-xs font-semibold text-[#d4af37] tracking-wider uppercase">
              Financial Audit & Management Intelligence
            </span>
            <span className="text-[10px] bg-[#d4af3715] text-[#d4af37] px-2 py-0.5 rounded border border-[#d4af3730]">
              12 Official Reports
            </span>
          </div>
          <h2 className="text-2xl font-bold text-white mt-1">
            Beverage Inventory Reporting Center
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Export official hotel audit reports to Excel (.xlsx), CSV, and PDF with multi-parameter filtering.
          </p>
        </div>

        {/* Export Buttons */}
        <div className="flex items-center space-x-2">
          <button
            onClick={handleExportExcel}
            className="flex items-center space-x-1.5 px-3.5 py-2 bg-[#122045] hover:bg-[#1a2f66] text-emerald-400 rounded-xl text-xs font-bold border border-[#1f335c] transition-all"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Excel (.xlsx)</span>
          </button>
          <button
            onClick={handleExportCSV}
            className="flex items-center space-x-1.5 px-3.5 py-2 bg-[#122045] hover:bg-[#1a2f66] text-slate-200 rounded-xl text-xs font-semibold border border-[#1f335c] transition-all"
          >
            <Download className="w-3.5 h-3.5" />
            <span>CSV</span>
          </button>
          <button
            onClick={handleExportPDF}
            className="flex items-center space-x-1.5 px-4 py-2 bg-gradient-to-r from-[#d4af37] to-[#b58d24] text-[#050b18] rounded-xl text-xs font-bold hover:brightness-110 shadow-md transition-all"
          >
            <FileDown className="w-3.5 h-3.5" />
            <span>Export PDF</span>
          </button>
        </div>
      </div>

      {/* Report Selection Grid (12 Reports) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {reportTypes.map((r) => {
          const isSelected = selectedReportId === r.id;
          return (
            <button
              key={r.id}
              onClick={() => setSelectedReportId(r.id)}
              className={`p-3.5 rounded-xl text-left border transition-all ${
                isSelected
                  ? 'bg-gradient-to-br from-[#122045] to-[#0a1329] border-[#d4af37] shadow-lg'
                  : 'bg-[#0b152d] border-[#1b2b4e] hover:border-[#2a3f70]'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono text-[#d4af37] font-bold">REPORT #{r.id}</span>
                {isSelected && <span className="w-2 h-2 rounded-full bg-[#d4af37]" />}
              </div>
              <h4 className={`text-xs font-bold mt-1.5 ${isSelected ? 'text-white' : 'text-slate-300'}`}>
                {r.title}
              </h4>
              <p className="text-[10px] text-slate-400 mt-1 line-clamp-2">{r.desc}</p>
            </button>
          );
        })}
      </div>

      {/* Filter Bar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 bg-[#081024] p-4 rounded-xl border border-[#162544]">
        <div>
          <label className="block text-[11px] font-semibold text-slate-400 mb-1">Search Keywords</label>
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-500" />
            <input
              type="text"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              placeholder="Filter table rows..."
              className="w-full pl-8 pr-3 py-1.5 bg-[#0b152d] border border-[#1e3463] rounded-lg text-xs text-white"
            />
          </div>
        </div>

        <div>
          <label className="block text-[11px] font-semibold text-slate-400 mb-1">Category Filter</label>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="w-full px-3 py-1.5 bg-[#0b152d] border border-[#1e3463] rounded-lg text-xs text-white"
          >
            <option value="All">All Categories</option>
            {ALL_CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-semibold text-slate-400 mb-1">Hotel Outlet</label>
          <select
            value={filterOutlet}
            onChange={(e) => setFilterOutlet(e.target.value)}
            className="w-full px-3 py-1.5 bg-[#0b152d] border border-[#1e3463] rounded-lg text-xs text-white"
          >
            <option value="All">All Hotel Outlets</option>
            {HOTEL_OUTLETS.map((o) => (
              <option key={o} value={o}>{o}</option>
            ))}
          </select>
        </div>

        <div className="flex items-end">
          <div className="w-full text-right text-xs text-slate-400 py-1.5">
            Matching Records: <span className="font-bold text-[#f7e7a9]">{reportData.length}</span>
          </div>
        </div>
      </div>

      {/* Report Preview Table */}
      <div className="bg-[#0b152d] rounded-2xl border border-[#1b2b4e] shadow-2xl overflow-hidden">
        <div className="p-4 border-b border-[#1b2b4e] flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <FileText className="w-4 h-4 text-[#d4af37]" />
              {currentReportMeta.title} Preview
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">{currentReportMeta.desc}</p>
          </div>
          <span className="text-xs text-slate-400">Previewing {reportData.length} entries</span>
        </div>

        <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
          {reportData.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400">
              No data records match the selected report criteria and filters.
            </div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead className="bg-[#070e20] text-slate-300 font-semibold uppercase tracking-wider sticky top-0 z-10 border-b border-[#1b2b4e]">
                <tr>
                  {Object.keys(reportData[0]).map((headKey) => (
                    <th key={headKey} className="py-2.5 px-3 whitespace-nowrap">
                      {headKey}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#152345]">
                {reportData.slice(0, 100).map((row, idx) => (
                  <tr key={idx} className="hover:bg-[#0f1c3b] transition-colors">
                    {Object.entries(row).map(([key, val]: any, cellIdx) => (
                      <td key={cellIdx} className="py-2 px-3 whitespace-nowrap text-slate-300">
                        {typeof val === 'number' ? (
                          <span className="font-mono">{val}</span>
                        ) : (
                          val
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
