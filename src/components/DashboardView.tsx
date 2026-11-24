'use client';

import React, { useMemo } from 'react';
import { useInventory } from '@/context/InventoryContext';
import {
  Wine,
  TrendingDown,
  TrendingUp,
  AlertTriangle,
  AlertOctagon,
  CheckCircle2,
  DollarSign,
  Package,
  Layers,
  ArrowRightLeft,
  Truck,
  FileSpreadsheet,
  Download,
  PlusCircle,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
} from 'recharts';

export default function DashboardView() {
  const {
    products,
    stockCounts,
    goodsReceipts,
    transfers,
    requisitions,
    currentOutlet,
    setActiveTab,
    generateAutoRequisition,
    setSelectedCategory,
    setFilterStatus,
  } = useInventory();

  // Metrics calculation
  const metrics = useMemo(() => {
    const totalProducts = products.length;
    const totalQty = products.reduce((acc, p) => acc + p.currentStock, 0);
    const totalVal = products.reduce((acc, p) => acc + p.currentStock * p.rate, 0);

    const zeroStock = products.filter((p) => p.currentStock <= 0);
    const belowPar = products.filter((p) => p.minParLevel > 0 && p.currentStock < p.minParLevel);
    const approachingPar = products.filter(
      (p) => p.minParLevel > 0 && p.currentStock >= p.minParLevel && p.currentStock <= p.minParLevel * 1.25
    );
    const healthyStock = products.filter(
      (p) => p.currentStock > (p.minParLevel > 0 ? p.minParLevel * 1.25 : 0)
    );

    const pendingTransfers = transfers.filter((t) => t.status === 'Pending Approval').length;
    const pendingRequisitions = requisitions.filter((r) => r.status === 'Submitted').length;

    // Latest variance from stock counts
    const latestCount = stockCounts[0];
    const currentVarianceVal = latestCount ? latestCount.totalVarianceValue : 0;

    return {
      totalProducts,
      totalQty: Number(totalQty.toFixed(2)),
      totalVal: Number(totalVal.toFixed(2)),
      zeroStockCount: zeroStock.length,
      belowParCount: belowPar.length,
      approachingParCount: approachingPar.length,
      healthyCount: healthyStock.length,
      pendingTransfers,
      pendingRequisitions,
      currentVarianceVal,
      lowStockList: belowPar.slice(0, 6),
    };
  }, [products, transfers, requisitions, stockCounts]);

  // Chart 1: Stock Distribution by Category
  const categoryData = useMemo(() => {
    const map: Record<string, { count: number; qty: number; value: number }> = {};
    products.forEach((p) => {
      const shortName = p.category
        .replace(' and Non-Alcoholic Beer', '')
        .replace(' and Champagne', '')
        .replace(' and Water', '');
      if (!map[shortName]) {
        map[shortName] = { count: 0, qty: 0, value: 0 };
      }
      map[shortName].count += 1;
      map[shortName].qty += p.currentStock;
      map[shortName].value += p.currentStock * p.rate;
    });

    return Object.entries(map).map(([name, data]) => ({
      name,
      count: data.count,
      quantity: Number(data.qty.toFixed(1)),
      value: Number(data.value.toFixed(1)),
    }));
  }, [products]);

  // Chart 2: Weekly Consumption Trend (Simulated realistic luxury bar volume)
  const weeklyTrendData = [
    { day: 'Mon', spirits: 14.5, wine: 18.0, beer: 36, mixers: 42 },
    { day: 'Tue', spirits: 18.0, wine: 22.5, beer: 44, mixers: 48 },
    { day: 'Wed', spirits: 25.0, wine: 31.0, beer: 58, mixers: 65 },
    { day: 'Thu', spirits: 38.5, wine: 45.0, beer: 78, mixers: 88 },
    { day: 'Fri', spirits: 54.0, wine: 62.5, beer: 112, mixers: 130 },
    { day: 'Sat', spirits: 62.0, wine: 70.0, beer: 124, mixers: 145 },
    { day: 'Sun', spirits: 28.0, wine: 34.0, beer: 60, mixers: 70 },
  ];

  // Chart 3: Monthly Inventory Movement (Opening, Receipts, Issues, Closing)
  const monthlyMovementData = [
    { month: 'Jul', received: 4800, issued: 4400, wastage: 85 },
    { month: 'Aug', received: 5200, issued: 4900, wastage: 92 },
    { month: 'Sep', received: 6100, issued: 5750, wastage: 110 },
    { month: 'Oct', received: 6800, issued: 6400, wastage: 125 },
    { month: 'Nov (MTD)', received: 5900, issued: 5350, wastage: 78 },
  ];

  // Colors for charts
  const GOLD_PALETTE = ['#d4af37', '#f7e7a9', '#38bdf8', '#34d399', '#f87171', '#fbbf24', '#a78bfa', '#ec4899'];
  const STATUS_PIE = [
    { name: 'Healthy (>Par)', value: metrics.healthyCount, color: '#10b981' },
    { name: 'Approaching Par', value: metrics.approachingParCount, color: '#f59e0b' },
    { name: 'Below Par Level', value: metrics.belowParCount, color: '#ef4444' },
    { name: 'Zero Stock', value: metrics.zeroStockCount, color: '#dc2626' },
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* Welcome & Outlet Header */}
      <div className="bg-gradient-to-r from-[#0c1630] via-[#101f42] to-[#0a1329] p-6 rounded-2xl border border-[#1e3463] shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
            <span className="text-xs font-semibold text-[#d4af37] tracking-wider uppercase">
              Live Operations Control • {currentOutlet}
            </span>
          </div>
          <h2 className="text-2xl font-bold text-white mt-1">
            Beverage Inventory & Par Level Intelligence
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            235 Official PDF master products reconciled • Automated par-level replenishment • RLS enforced
          </p>
        </div>

        {/* Quick Action Toolbar */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setActiveTab('stock-count')}
            className="flex items-center space-x-2 bg-gradient-to-r from-[#d4af37] to-[#b58d24] text-[#050b18] px-4 py-2.5 rounded-xl font-bold text-xs shadow-md hover:brightness-110 transition-all"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Daily Stock Count</span>
          </button>

          <button
            onClick={() => {
              generateAutoRequisition();
              setActiveTab('requisitions');
            }}
            className="flex items-center space-x-2 bg-[#14234b] hover:bg-[#1a2e63] text-[#f7e7a9] px-4 py-2.5 rounded-xl font-semibold text-xs border border-[#d4af3740] transition-all"
          >
            <Zap className="w-4 h-4 text-[#d4af37]" />
            <span>1-Click Auto Reorder</span>
          </button>

          <button
            onClick={() => setActiveTab('reports')}
            className="flex items-center space-x-2 bg-[#0c1630] hover:bg-[#122045] text-slate-200 px-3.5 py-2.5 rounded-xl font-semibold text-xs border border-[#223766] transition-all"
          >
            <Download className="w-4 h-4 text-[#d4af37]" />
            <span>Export Reports</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {/* Card 1: Total Master Products */}
        <div
          onClick={() => {
            setSelectedCategory('All');
            setFilterStatus('All');
            setActiveTab('inventory');
          }}
          className="bg-[#0b152d] hover:bg-[#0f1d3e] p-4 rounded-xl border border-[#1b2b4e] hover:border-[#d4af3750] transition-all cursor-pointer group shadow-lg"
        >
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Total Products</span>
            <Wine className="w-4 h-4 text-[#d4af37] group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl font-bold text-white mt-2">
            {metrics.totalProducts}
          </div>
          <div className="text-[10px] text-emerald-400 mt-1 flex items-center gap-1">
            <ShieldCheck className="w-3 h-3" />
            <span>235 Master PDF items</span>
          </div>
        </div>

        {/* Card 2: Total Inventory Valuation */}
        <div className="bg-[#0b152d] p-4 rounded-xl border border-[#1b2b4e] shadow-lg">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Stock Valuation</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-[#f7e7a9] mt-2">
            AED {metrics.totalVal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="text-[10px] text-slate-400 mt-1">
            Total bottles: {metrics.totalQty} units
          </div>
        </div>

        {/* Card 3: Below Par Level (Red Alert) */}
        <div
          onClick={() => {
            setFilterStatus('RED');
            setActiveTab('inventory');
          }}
          className="bg-[#0b152d] hover:bg-[#1c1218] p-4 rounded-xl border border-[#3d1922] hover:border-red-500 transition-all cursor-pointer group shadow-lg"
        >
          <div className="flex items-center justify-between text-red-400">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Below Par Level</span>
            <AlertTriangle className="w-4 h-4 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl font-bold text-red-400 mt-2">
            {metrics.belowParCount} <span className="text-xs font-normal text-slate-400">items</span>
          </div>
          <div className="text-[10px] text-red-300 mt-1">
            Immediate reorder required
          </div>
        </div>

        {/* Card 4: Critical Zero Stock */}
        <div
          onClick={() => {
            setFilterStatus('CRITICAL');
            setActiveTab('inventory');
          }}
          className="bg-[#0b152d] hover:bg-[#281116] p-4 rounded-xl border border-[#4a181f] hover:border-red-600 transition-all cursor-pointer group shadow-lg"
        >
          <div className="flex items-center justify-between text-red-500">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Zero Stock (Critical)</span>
            <AlertOctagon className="w-4 h-4 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl font-bold text-red-500 mt-2">
            {metrics.zeroStockCount} <span className="text-xs font-normal text-slate-400">items</span>
          </div>
          <div className="text-[10px] text-red-400 mt-1">
            Speed rails depleted
          </div>
        </div>

        {/* Card 5: Operational Variance */}
        <div
          onClick={() => setActiveTab('stock-count')}
          className="bg-[#0b152d] hover:bg-[#0f1d3e] p-4 rounded-xl border border-[#1b2b4e] hover:border-[#d4af3750] transition-all cursor-pointer group shadow-lg"
        >
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Current Variance</span>
            <TrendingDown className="w-4 h-4 text-amber-400" />
          </div>
          <div className={`text-2xl font-bold mt-2 ${metrics.currentVarianceVal < 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
            AED {metrics.currentVarianceVal.toFixed(2)}
          </div>
          <div className="text-[10px] text-slate-400 mt-1">
            Pending transfers: {metrics.pendingTransfers} • Reqs: {metrics.pendingRequisitions}
          </div>
        </div>
      </div>

      {/* Critical Replenishment Banner if Low Stock Exists */}
      {metrics.belowParCount > 0 && (
        <div className="bg-gradient-to-r from-[#241118] via-[#1a0f18] to-[#0c1630] border border-red-900/60 p-4 rounded-xl flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-lg bg-red-500/20 flex items-center justify-center text-red-400">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">
                Replenishment Alert: {metrics.belowParCount} items below minimum par levels!
              </h4>
              <p className="text-xs text-slate-400">
                Generate an automated purchase requisition to replenish stock to maximum par levels before evening service.
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              generateAutoRequisition();
              setActiveTab('requisitions');
            }}
            className="flex items-center space-x-1.5 bg-red-600 hover:bg-red-500 text-white px-3.5 py-2 rounded-lg text-xs font-bold transition-all shadow-md"
          >
            <span>Review & Replenish</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Main Charts Row 1: Stock Distribution & Status Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart 1: Category Stock Breakdown */}
        <div className="lg:col-span-2 bg-[#0b152d] p-5 rounded-2xl border border-[#1b2b4e] shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Stock Quantity & Valuation by Beverage Category
              </h3>
              <p className="text-xs text-slate-400">Physical stock count and monetary valuation across main beverage departments</p>
            </div>
            <span className="text-[10px] bg-[#d4af3715] text-[#d4af37] px-2 py-0.5 rounded border border-[#d4af3730]">
              Automated DB Sync
            </span>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryData} margin={{ top: 10, right: 10, left: 0, bottom: 25 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#182747" />
                <XAxis dataKey="name" stroke="#64748b" fontSize={10} angle={-20} textAnchor="end" />
                <YAxis stroke="#64748b" fontSize={10} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0a1329',
                    borderColor: '#223766',
                    borderRadius: '8px',
                    fontSize: '11px',
                  }}
                />
                <Bar dataKey="quantity" name="Stock Qty (Units)" fill="#d4af37" radius={[4, 4, 0, 0]} />
                <Bar dataKey="value" name="Valuation (AED)" fill="#38bdf8" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Par Level Health Donut */}
        <div className="bg-[#0b152d] p-5 rounded-2xl border border-[#1b2b4e] shadow-xl flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Par Level Compliance
            </h3>
            <p className="text-xs text-slate-400">Health of 235 beverage SKUs vs official hotel par rules</p>
          </div>

          <div className="h-56 w-full my-2">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={STATUS_PIE}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={4}
                >
                  {STATUS_PIE.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0a1329',
                    borderColor: '#223766',
                    borderRadius: '8px',
                    fontSize: '11px',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-2 gap-2 text-[11px] pt-2 border-t border-[#182747]">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span className="text-slate-300">Healthy: {metrics.healthyCount}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              <span className="text-slate-300">Approaching: {metrics.approachingParCount}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
              <span className="text-slate-300">Below Par: {metrics.belowParCount}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-red-700" />
              <span className="text-slate-300">Zero Stock: {metrics.zeroStockCount}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Row 2: Weekly Consumption & Monthly Movement */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weekly Consumption by Beverage Class */}
        <div className="bg-[#0b152d] p-5 rounded-2xl border border-[#1b2b4e] shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Weekly Bar Stock Consumption (Bottles/Units)
              </h3>
              <p className="text-xs text-slate-400">High-volume beverage depletion throughout the week</p>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={weeklyTrendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#182747" />
                <XAxis dataKey="day" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0a1329',
                    borderColor: '#223766',
                    borderRadius: '8px',
                    fontSize: '11px',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Line type="monotone" dataKey="spirits" name="Spirits & Liqueurs" stroke="#d4af37" strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="wine" name="Wines & Champagne" stroke="#f43f5e" strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="beer" name="Beers" stroke="#38bdf8" strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="mixers" name="Soft & Mixers" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Monthly Inventory Movement */}
        <div className="bg-[#0b152d] p-5 rounded-2xl border border-[#1b2b4e] shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Monthly Stock Movement (Received vs Issued vs Wastage)
              </h3>
              <p className="text-xs text-slate-400">Beverage intake and hotel dispensing reconciliation (AED value)</p>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyMovementData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#182747" />
                <XAxis dataKey="month" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0a1329',
                    borderColor: '#223766',
                    borderRadius: '8px',
                    fontSize: '11px',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Bar dataKey="received" name="Goods Received (AED)" fill="#10b981" radius={[3, 3, 0, 0]} />
                <Bar dataKey="issued" name="Bar Issues / Sales (AED)" fill="#d4af37" radius={[3, 3, 0, 0]} />
                <Bar dataKey="wastage" name="Wastage (AED)" fill="#ef4444" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Row 3: Priority Low Stock Products Table */}
      <div className="bg-[#0b152d] p-5 rounded-2xl border border-[#1b2b4e] shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              Immediate Replenishment Priority List
            </h3>
            <p className="text-xs text-slate-400">Products currently below authorized minimum par level baseline</p>
          </div>
          <button
            onClick={() => {
              setFilterStatus('RED');
              setActiveTab('inventory');
            }}
            className="text-xs text-[#d4af37] hover:underline font-semibold flex items-center gap-1"
          >
            <span>View All Low Stock Items</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#070e20] text-slate-400 font-semibold uppercase tracking-wider border-b border-[#182747]">
              <tr>
                <th className="py-2.5 px-3">SNo</th>
                <th className="py-2.5 px-3">Item Code</th>
                <th className="py-2.5 px-3">Beverage Name</th>
                <th className="py-2.5 px-3">Category</th>
                <th className="py-2.5 px-3 text-right">Current Stock</th>
                <th className="py-2.5 px-3 text-right">Min Par</th>
                <th className="py-2.5 px-3 text-right">Max Par</th>
                <th className="py-2.5 px-3 text-right">Reorder Qty</th>
                <th className="py-2.5 px-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#152345]">
              {metrics.lowStockList.map((item) => (
                <tr key={item.id} className="hover:bg-[#0f1c3b] transition-colors">
                  <td className="py-3 px-3 font-mono text-slate-400">{item.sno}</td>
                  <td className="py-3 px-3 font-mono text-[#d4af37] font-semibold">{item.itemCode}</td>
                  <td className="py-3 px-3 font-medium text-white max-w-xs truncate">{item.name}</td>
                  <td className="py-3 px-3 text-slate-300">{item.category} • {item.subcategory}</td>
                  <td className="py-3 px-3 text-right font-bold text-red-400">
                    {item.currentStock.toFixed(2)} {item.unit}
                  </td>
                  <td className="py-3 px-3 text-right text-slate-300 font-semibold">{item.minParLevel.toFixed(2)}</td>
                  <td className="py-3 px-3 text-right text-slate-400">{item.maxParLevel.toFixed(2)}</td>
                  <td className="py-3 px-3 text-right font-bold text-[#f7e7a9]">
                    +{item.reorderQuantity.toFixed(2)}
                  </td>
                  <td className="py-3 px-3 text-center">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      item.status === 'CRITICAL' ? 'bg-red-950 text-red-400 border border-red-800' : 'bg-red-900/40 text-red-300 border border-red-700/50'
                    }`}>
                      {item.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
