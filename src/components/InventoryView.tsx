'use client';

import React, { useState, useMemo } from 'react';
import { useInventory } from '@/context/InventoryContext';
import {
  ALL_CATEGORIES,
  CATEGORY_SUBCATEGORIES,
  BeverageCategory,
  BeverageProduct,
  StockStatus,
} from '@/types/inventory';
import {
  Wine,
  Search,
  Filter,
  Plus,
  Edit2,
  Check,
  AlertTriangle,
  AlertOctagon,
  ArrowUpDown,
  Lock,
  Layers,
  Sparkles,
  Download,
  X,
  FileSpreadsheet,
} from 'lucide-react';

export default function InventoryView() {
  const {
    products,
    currentRole,
    searchQuery,
    setSearchQuery,
    selectedCategory,
    setSelectedCategory,
    selectedSubcategory,
    setSelectedSubcategory,
    filterStatus,
    setFilterStatus,
    updateParLevels,
    updateProductStock,
    addProduct,
  } = useInventory();

  // Modal states
  const [editingParProduct, setEditingParProduct] = useState<BeverageProduct | null>(null);
  const [newMinPar, setNewMinPar] = useState<number>(0);
  const [newMaxPar, setNewMaxPar] = useState<number>(0);

  const [editingStockProduct, setEditingStockProduct] = useState<BeverageProduct | null>(null);
  const [newStockVal, setNewStockVal] = useState<number>(0);

  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [newProductForm, setNewProductForm] = useState({
    itemCode: '',
    name: '',
    category: 'Spirits' as BeverageCategory,
    subcategory: 'Whisky and Whiskey',
    packagingSize: '750ML',
    unit: 'Bottle',
    rate: 0,
    minParLevel: 0,
    maxParLevel: 0,
  });

  // Available subcategories based on selected category
  const availableSubcategories = useMemo(() => {
    if (selectedCategory === 'All') return [];
    return CATEGORY_SUBCATEGORIES[selectedCategory as BeverageCategory] || [];
  }, [selectedCategory]);

  // Filtered and searched products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      // Category filter
      if (selectedCategory !== 'All' && p.category !== selectedCategory) {
        return false;
      }
      // Subcategory filter
      if (selectedSubcategory !== 'All' && p.subcategory !== selectedSubcategory) {
        return false;
      }
      // Status filter
      if (filterStatus !== 'All' && p.status !== filterStatus) {
        return false;
      }
      // Search query (item code or name)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesCode = p.itemCode.toLowerCase().includes(q);
        const matchesName = p.name.toLowerCase().includes(q);
        const matchesPack = p.packagingDescription.toLowerCase().includes(q);
        if (!matchesCode && !matchesName && !matchesPack) {
          return false;
        }
      }
      return true;
    });
  }, [products, selectedCategory, selectedSubcategory, filterStatus, searchQuery]);

  const handleOpenParModal = (p: BeverageProduct) => {
    setEditingParProduct(p);
    setNewMinPar(p.minParLevel);
    setNewMaxPar(p.maxParLevel);
  };

  const handleSavePar = () => {
    if (editingParProduct) {
      updateParLevels(editingParProduct.id, Number(newMinPar), Number(newMaxPar));
      setEditingParProduct(null);
    }
  };

  const handleOpenStockModal = (p: BeverageProduct) => {
    setEditingStockProduct(p);
    setNewStockVal(p.currentStock);
  };

  const handleSaveStock = () => {
    if (editingStockProduct) {
      updateProductStock(editingStockProduct.id, Number(newStockVal));
      setEditingStockProduct(null);
    }
  };

  const handleCreateProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProductForm.name || !newProductForm.itemCode) return;
    addProduct({
      itemCode: newProductForm.itemCode,
      name: newProductForm.name,
      category: newProductForm.category,
      subcategory: newProductForm.subcategory,
      packagingSize: newProductForm.packagingSize,
      packagingDescription: `${newProductForm.packagingSize}/${newProductForm.unit}`,
      unit: newProductForm.unit,
      minParLevel: Number(newProductForm.minParLevel),
      maxParLevel: Number(newProductForm.maxParLevel),
      rate: Number(newProductForm.rate),
      value: Number(newProductForm.rate),
      currentStock: 0,
    });
    setShowAddModal(false);
    setNewProductForm({
      itemCode: '',
      name: '',
      category: 'Spirits',
      subcategory: 'Whisky and Whiskey',
      packagingSize: '750ML',
      unit: 'Bottle',
      rate: 0,
      minParLevel: 0,
      maxParLevel: 0,
    });
  };

  const canEditPar = currentRole === 'ADMIN' || currentRole === 'BAR_MANAGER';

  return (
    <div className="space-y-6 pb-16">
      {/* Top Banner & Title */}
      <div className="bg-[#0b152d] p-6 rounded-2xl border border-[#1b2b4e] shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-xs font-semibold text-[#d4af37] tracking-wider uppercase">
              Authoritative Inventory Database
            </span>
            <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded">
              235 PDF Items Active
            </span>
          </div>
          <h2 className="text-2xl font-bold text-white mt-1">
            Master Beverage Inventory & Par Level Management
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            All 235 items extracted from W Lounge Par Level document (Doc: PL-PL2600109). Baseline pars locked; operational thresholds configurable.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          {canEditPar && (
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center space-x-2 bg-gradient-to-r from-[#d4af37] to-[#b58d24] text-[#050b18] px-4 py-2.5 rounded-xl font-bold text-xs shadow-md hover:brightness-110 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Add Product / Configure Item</span>
            </button>
          )}
        </div>
      </div>

      {/* Category Navigation Pills */}
      <div className="bg-[#0b152d] p-3 rounded-2xl border border-[#1b2b4e] shadow-lg space-y-3">
        {/* Main Categories (Categories A through H) */}
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-1">
          <button
            onClick={() => {
              setSelectedCategory('All');
              setSelectedSubcategory('All');
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
              selectedCategory === 'All'
                ? 'bg-[#d4af37] text-[#050b18] font-bold shadow-md'
                : 'text-slate-300 hover:text-white hover:bg-[#122045]'
            }`}
          >
            All Categories ({products.length})
          </button>
          {ALL_CATEGORIES.map((cat) => {
            const count = products.filter((p) => p.category === cat).length;
            const isSelected = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => {
                  setSelectedCategory(cat);
                  setSelectedSubcategory('All');
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                  isSelected
                    ? 'bg-[#d4af37] text-[#050b18] font-bold shadow-md'
                    : 'text-slate-300 hover:text-white hover:bg-[#122045]'
                }`}
              >
                {cat} ({count})
              </button>
            );
          })}
        </div>

        {/* Subcategories (if selected) */}
        {availableSubcategories.length > 0 && (
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pt-2 border-t border-[#182747]">
            <span className="text-[11px] font-semibold text-[#d4af37] uppercase tracking-wider pl-1 mr-1 flex items-center gap-1">
              <Layers className="w-3 h-3" /> Subcategory:
            </span>
            <button
              onClick={() => setSelectedSubcategory('All')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${
                selectedSubcategory === 'All'
                  ? 'bg-[#d4af3725] text-[#d4af37] border border-[#d4af3750] font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              All Subcategories
            </button>
            {availableSubcategories.map((subcat) => {
              const subCount = products.filter(
                (p) => p.category === selectedCategory && p.subcategory === subcat
              ).length;
              const isSubSelected = selectedSubcategory === subcat;
              return (
                <button
                  key={subcat}
                  onClick={() => setSelectedSubcategory(subcat)}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-medium whitespace-nowrap transition-all ${
                    isSubSelected
                      ? 'bg-[#d4af3725] text-[#d4af37] border border-[#d4af3750] font-semibold'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-[#122045]'
                  }`}
                >
                  {subcat} ({subCount})
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Search, Filter Status and Stats Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#081024] p-4 rounded-xl border border-[#162544]">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by product name, item code (e.g. Z00008619), or packaging..."
            className="w-full pl-9 pr-4 py-2 bg-[#0b152d] border border-[#1e3463] rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none focus:border-[#d4af37] transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-2.5 text-slate-400 hover:text-white text-xs"
            >
              Clear
            </button>
          )}
        </div>

        {/* Status Filters (Green, Yellow, Red, Critical) */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[11px] text-slate-400 mr-1 flex items-center gap-1">
            <Filter className="w-3 h-3" /> Status:
          </span>
          <button
            onClick={() => setFilterStatus('All')}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold ${
              filterStatus === 'All' ? 'bg-[#182747] text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            All ({products.length})
          </button>
          <button
            onClick={() => setFilterStatus('GREEN')}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 ${
              filterStatus === 'GREEN'
                ? 'bg-emerald-950 text-emerald-400 border border-emerald-700'
                : 'text-emerald-500 hover:bg-emerald-950/40'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>Above Par</span>
          </button>
          <button
            onClick={() => setFilterStatus('YELLOW')}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 ${
              filterStatus === 'YELLOW'
                ? 'bg-amber-950 text-amber-400 border border-amber-700'
                : 'text-amber-500 hover:bg-amber-950/40'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            <span>Approaching</span>
          </button>
          <button
            onClick={() => setFilterStatus('RED')}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 ${
              filterStatus === 'RED'
                ? 'bg-red-950 text-red-400 border border-red-700'
                : 'text-red-400 hover:bg-red-950/40'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-red-400" />
            <span>Below Par</span>
          </button>
          <button
            onClick={() => setFilterStatus('CRITICAL')}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 ${
              filterStatus === 'CRITICAL'
                ? 'bg-red-900 text-white border border-red-500'
                : 'text-red-500 hover:bg-red-900/40'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse" />
            <span>Zero Stock</span>
          </button>
        </div>
      </div>

      {/* Table Results Counter */}
      <div className="flex items-center justify-between text-xs text-slate-400 px-1">
        <span>
          Showing <span className="font-bold text-white">{filteredProducts.length}</span> of {products.length} products
        </span>
        <span className="text-[11px] text-slate-500">
          Click any row to configure par levels or adjust physical counts
        </span>
      </div>

      {/* Modern Luxury Inventory Table */}
      <div className="bg-[#0b152d] rounded-2xl border border-[#1b2b4e] shadow-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#070e20] text-slate-300 font-semibold uppercase tracking-wider border-b border-[#1b2b4e]">
              <tr>
                <th className="py-3 px-3 w-12 text-center">SNo</th>
                <th className="py-3 px-3">Item Code</th>
                <th className="py-3 px-4">Exact Beverage Name</th>
                <th className="py-3 px-3">Category & Subcategory</th>
                <th className="py-3 px-3">Packaging</th>
                <th className="py-3 px-3 text-right">Physical Stock</th>
                <th className="py-3 px-3 text-right">
                  <div className="flex items-center justify-end gap-1" title="Original authoritative par level from official PDF document">
                    <Lock className="w-3 h-3 text-slate-400" />
                    <span>PDF Par</span>
                  </div>
                </th>
                <th className="py-3 px-3 text-right">Min Par</th>
                <th className="py-3 px-3 text-right">Max Par</th>
                <th className="py-3 px-3 text-right">Reorder Qty</th>
                <th className="py-3 px-3 text-right">Rate</th>
                <th className="py-3 px-3 text-center">Status</th>
                <th className="py-3 px-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#152345]">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={13} className="py-12 text-center text-slate-400 text-sm">
                    No beverage products found matching your current filters.
                  </td>
                </tr>
              ) : (
                filteredProducts.map((p) => {
                  const isZero = p.currentStock <= 0;
                  const isBelow = p.minParLevel > 0 && p.currentStock < p.minParLevel;
                  const isYellow = p.minParLevel > 0 && p.currentStock <= p.minParLevel * 1.25 && !isBelow;

                  return (
                    <tr
                      key={p.id}
                      className="hover:bg-[#0f1c3b] transition-colors group cursor-pointer"
                    >
                      <td className="py-3 px-3 text-center font-mono text-slate-400">{p.sno}</td>
                      <td className="py-3 px-3 font-mono text-[#d4af37] font-semibold">{p.itemCode}</td>
                      <td className="py-3 px-4 font-medium text-white max-w-sm">
                        <div className="truncate font-semibold">{p.name}</div>
                        <div className="text-[10px] text-slate-400">{p.packagingDescription}</div>
                      </td>
                      <td className="py-3 px-3 text-slate-300">
                        <span className="font-medium text-white">{p.category}</span>
                        <span className="text-[10px] text-slate-400 block">{p.subcategory}</span>
                      </td>
                      <td className="py-3 px-3 text-slate-300">
                        <span className="inline-block bg-[#122045] px-2 py-0.5 rounded text-[11px] font-mono">
                          {p.packagingSize}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right font-bold text-white">
                        <span
                          className={`font-mono ${
                            isZero
                              ? 'text-red-500 font-extrabold'
                              : isBelow
                              ? 'text-red-400'
                              : isYellow
                              ? 'text-amber-400'
                              : 'text-emerald-400'
                          }`}
                        >
                          {p.currentStock.toFixed(2)}
                        </span>{' '}
                        <span className="text-[10px] text-slate-400 font-normal">{p.unit}</span>
                      </td>
                      {/* Original PDF Par Level (Locked Baseline) */}
                      <td className="py-3 px-3 text-right font-mono font-bold text-slate-300 bg-[#070e20]/50">
                        {p.originalParLevel.toFixed(2)}
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-slate-200">
                        {p.minParLevel.toFixed(2)}
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-slate-400">
                        {p.maxParLevel.toFixed(2)}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold">
                        {p.reorderQuantity > 0 ? (
                          <span className="text-[#f7e7a9]">+{p.reorderQuantity.toFixed(2)}</span>
                        ) : (
                          <span className="text-slate-600">-</span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-slate-300">
                        AED {p.rate.toFixed(2)}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            p.status === 'CRITICAL'
                              ? 'bg-red-950 text-red-400 border border-red-800'
                              : p.status === 'RED'
                              ? 'bg-red-900/40 text-red-300 border border-red-700/60'
                              : p.status === 'YELLOW'
                              ? 'bg-amber-900/40 text-amber-300 border border-amber-700/60'
                              : 'bg-emerald-950/40 text-emerald-300 border border-emerald-700/60'
                          }`}
                        >
                          {p.status}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <div className="flex items-center justify-center space-x-1.5">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenStockModal(p);
                            }}
                            title="Quick Stock Adjustment"
                            className="p-1 rounded hover:bg-[#182747] text-slate-300 hover:text-white transition-colors"
                          >
                            <Wine className="w-3.5 h-3.5" />
                          </button>
                          {canEditPar && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenParModal(p);
                              }}
                              title="Configure Par Levels"
                              className="p-1 rounded hover:bg-[#182747] text-[#d4af37] hover:text-[#f7e7a9] transition-colors"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal 1: Edit Par Levels (Retains original PDF par level) */}
      {editingParProduct && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0a1329] border border-[#223766] rounded-2xl w-full max-w-lg shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#1b2b4e] pb-3">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Edit2 className="w-4 h-4 text-[#d4af37]" />
                  Configure Par Levels
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">{editingParProduct.name}</p>
              </div>
              <button
                onClick={() => setEditingParProduct(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-[#0c1630] p-3 rounded-xl border border-[#182747] space-y-1 text-xs">
              <div className="flex justify-between text-slate-300">
                <span>Item Code:</span>
                <span className="font-mono text-[#d4af37] font-bold">{editingParProduct.itemCode}</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Packaging Description:</span>
                <span>{editingParProduct.packagingDescription}</span>
              </div>
              <div className="flex justify-between text-slate-300 pt-1 border-t border-[#142348]">
                <span className="font-bold flex items-center gap-1 text-[#f7e7a9]">
                  <Lock className="w-3 h-3 text-[#d4af37]" /> Original PDF Par Level (Baseline):
                </span>
                <span className="font-mono font-bold text-emerald-400">
                  {editingParProduct.originalParLevel.toFixed(2)} {editingParProduct.unit}
                </span>
              </div>
              <p className="text-[10px] text-slate-500 pt-1">
                Note: In accordance with hotel audit standards, the original PDF Par Level is preserved permanently as a baseline and cannot be overwritten.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Operational Minimum Par Level
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  value={newMinPar}
                  onChange={(e) => setNewMinPar(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-[#0c1630] border border-[#223766] rounded-xl text-sm font-mono text-white focus:outline-none focus:border-[#d4af37]"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Triggers yellow and red reorder warnings
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Maximum Par Level (Cap)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  value={newMaxPar}
                  onChange={(e) => setNewMaxPar(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-[#0c1630] border border-[#223766] rounded-xl text-sm font-mono text-white focus:outline-none focus:border-[#d4af37]"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Reorder Qty = Max Par - Current Stock
                </span>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 pt-3 border-t border-[#1b2b4e]">
              <button
                onClick={() => setEditingParProduct(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:bg-[#122045]"
              >
                Cancel
              </button>
              <button
                onClick={handleSavePar}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-[#d4af37] to-[#b58d24] text-[#050b18] hover:brightness-110"
              >
                Save Par Levels
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 2: Quick Physical Stock Adjustment */}
      {editingStockProduct && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0a1329] border border-[#223766] rounded-2xl w-full max-w-md shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#1b2b4e] pb-3">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Wine className="w-4 h-4 text-[#d4af37]" />
                  Adjust Physical Stock
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">{editingStockProduct.name}</p>
              </div>
              <button
                onClick={() => setEditingStockProduct(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Physical Stock Quantity ({editingStockProduct.unit})
              </label>
              <input
                type="number"
                step="0.25"
                min="0"
                value={newStockVal}
                onChange={(e) => setNewStockVal(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2.5 bg-[#0c1630] border border-[#223766] rounded-xl text-lg font-mono font-bold text-white focus:outline-none focus:border-[#d4af37]"
              />
              {/* Decimal shortcuts */}
              <div className="flex items-center gap-2 mt-2">
                {[0.25, 0.5, 0.75, 1.0].map((step) => (
                  <button
                    key={step}
                    onClick={() => setNewStockVal((prev) => Number((prev + step).toFixed(2)))}
                    className="flex-1 py-1.5 bg-[#122045] hover:bg-[#1a2f66] text-xs font-mono font-semibold text-[#f7e7a9] rounded-lg transition-colors border border-[#1f335c]"
                  >
                    +{step}
                  </button>
                ))}
                <button
                  onClick={() => setNewStockVal(0)}
                  className="py-1.5 px-3 bg-red-950 hover:bg-red-900 text-xs font-bold text-red-300 rounded-lg border border-red-800"
                >
                  Zero
                </button>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 pt-3 border-t border-[#1b2b4e]">
              <button
                onClick={() => setEditingStockProduct(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:bg-[#122045]"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveStock}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-[#d4af37] to-[#b58d24] text-[#050b18] hover:brightness-110"
              >
                Update Stock
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 3: Add Product / Configure Additional Item */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0a1329] border border-[#223766] rounded-2xl w-full max-w-lg shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#1b2b4e] pb-3">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Plus className="w-4 h-4 text-[#d4af37]" />
                  Add New Product / Configure Soft Beverage
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Configure par levels and packaging for Barakat, Al Ain or custom items
                </p>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateProduct} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Item Code</label>
                  <input
                    type="text"
                    required
                    value={newProductForm.itemCode}
                    onChange={(e) => setNewProductForm({ ...newProductForm, itemCode: e.target.value })}
                    placeholder="e.g. SB-BAR-01"
                    className="w-full px-3 py-2 bg-[#0c1630] border border-[#223766] rounded-xl text-xs text-white focus:outline-none focus:border-[#d4af37]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Product Name</label>
                  <input
                    type="text"
                    required
                    value={newProductForm.name}
                    onChange={(e) => setNewProductForm({ ...newProductForm, name: e.target.value })}
                    placeholder="e.g. Barakat Fresh Mango Juice 1L"
                    className="w-full px-3 py-2 bg-[#0c1630] border border-[#223766] rounded-xl text-xs text-white focus:outline-none focus:border-[#d4af37]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Category</label>
                  <select
                    value={newProductForm.category}
                    onChange={(e) => setNewProductForm({ ...newProductForm, category: e.target.value as BeverageCategory })}
                    className="w-full px-3 py-2 bg-[#0c1630] border border-[#223766] rounded-xl text-xs text-white focus:outline-none focus:border-[#d4af37]"
                  >
                    {ALL_CATEGORIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Packaging Size</label>
                  <input
                    type="text"
                    value={newProductForm.packagingSize}
                    onChange={(e) => setNewProductForm({ ...newProductForm, packagingSize: e.target.value })}
                    placeholder="e.g. 1 LTR or 330ML"
                    className="w-full px-3 py-2 bg-[#0c1630] border border-[#223766] rounded-xl text-xs text-white focus:outline-none focus:border-[#d4af37]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Unit Cost (AED)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={newProductForm.rate}
                    onChange={(e) => setNewProductForm({ ...newProductForm, rate: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-[#0c1630] border border-[#223766] rounded-xl text-xs text-white font-mono focus:outline-none focus:border-[#d4af37]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Min Par Level</label>
                  <input
                    type="number"
                    step="1"
                    value={newProductForm.minParLevel}
                    onChange={(e) => setNewProductForm({ ...newProductForm, minParLevel: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-[#0c1630] border border-[#223766] rounded-xl text-xs text-white font-mono focus:outline-none focus:border-[#d4af37]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Max Par Level</label>
                  <input
                    type="number"
                    step="1"
                    value={newProductForm.maxParLevel}
                    onChange={(e) => setNewProductForm({ ...newProductForm, maxParLevel: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-[#0c1630] border border-[#223766] rounded-xl text-xs text-white font-mono focus:outline-none focus:border-[#d4af37]"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-[#1b2b4e]">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:bg-[#122045]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-[#d4af37] to-[#b58d24] text-[#050b18] hover:brightness-110"
                >
                  Save Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
