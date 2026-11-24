'use client';

import React, { useState } from 'react';
import { useInventory } from '@/context/InventoryContext';
import { HOTEL_OUTLETS, HotelOutlet, UserRole } from '@/types/inventory';
import {
  Wine,
  Bell,
  CheckCircle,
  AlertTriangle,
  AlertOctagon,
  Info,
  Shield,
  MapPin,
  RefreshCw,
  Search,
  Check,
  ChevronDown,
  Layers,
  FileSpreadsheet,
  TrendingDown,
  ArrowRightLeft,
  Truck,
  ClipboardList,
  FileText,
  Sliders,
  Sparkles,
} from 'lucide-react';

export default function Navbar() {
  const {
    currentRole,
    setCurrentRole,
    currentOutlet,
    setCurrentOutlet,
    activeTab,
    setActiveTab,
    notifications,
    markNotificationRead,
    clearAllNotifications,
    resetToMasterData,
  } = useInventory();

  const [showNotifs, setShowNotifs] = useState(false);
  const [showOutletDropdown, setShowOutletDropdown] = useState(false);
  const [showRoleDropdown, setShowRoleDropdown] = useState(false);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const roles: { role: UserRole; title: string; desc: string }[] = [
    { role: 'ADMIN', title: 'Admin / Director of F&B', desc: 'Full permissions, par approval, valuation' },
    { role: 'BAR_MANAGER', title: 'Bar Manager', desc: 'Manage stock, requisitions & transfers' },
    { role: 'SUPERVISOR', title: 'Head Bartender / Supervisor', desc: 'Daily counts, receipts & wastage' },
    { role: 'BARTENDER', title: 'Bartender', desc: 'View inventory & record physical stock counts' },
  ];

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Layers },
    { id: 'inventory', label: 'Master Inventory & Pars', icon: Wine },
    { id: 'stock-count', label: 'Daily Stock Count', icon: ClipboardList },
    { id: 'goods-receipt', label: 'Goods Received', icon: Truck },
    { id: 'transfers', label: 'Stock Transfers', icon: ArrowRightLeft },
    { id: 'wastage', label: 'Wastage & Breakage', icon: TrendingDown },
    { id: 'requisitions', label: 'Purchase Requisitions', icon: FileSpreadsheet },
    { id: 'reports', label: 'Inventory Reports', icon: FileText },
    { id: 'settings', label: 'RBAC & Supabase', icon: Sliders },
  ];

  return (
    <header className="sticky top-0 z-50 bg-[#070e20] border-b border-[#1b2b4e] shadow-xl">
      {/* Top Brand & Utility Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo & Hotel Header */}
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#f7e7a9] via-[#d4af37] to-[#8d6b15] p-0.5 shadow-lg flex items-center justify-center">
              <div className="w-full h-full bg-[#0a1329] rounded-[10px] flex items-center justify-center">
                <Wine className="w-6 h-6 text-[#d4af37]" />
              </div>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-[10px] font-semibold tracking-[0.2em] uppercase text-[#d4af37] bg-[#d4af3715] px-2 py-0.5 rounded border border-[#d4af3730]">
                  Farrago W Lounge • 5-Star Luxury
                </span>
                <span className="text-[10px] text-slate-400">Doc: PL-PL2600109</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                HOTEL BAR INVENTORY CONTROL SYSTEM
              </h1>
              <p className="text-xs text-slate-400 hidden sm:block">
                Beverage Stock Management | Par Level Control | Daily Inventory | Cost Monitoring
              </p>
            </div>
          </div>

          {/* Right Controls: Outlet Selector, Role Switcher, Notifications */}
          <div className="flex items-center space-x-3">
            {/* Hotel Outlet Selector */}
            <div className="relative">
              <button
                onClick={() => {
                  setShowOutletDropdown(!showOutletDropdown);
                  setShowRoleDropdown(false);
                  setShowNotifs(false);
                }}
                className="flex items-center space-x-2 bg-[#0c1630] hover:bg-[#121f42] text-slate-200 px-3 py-2 rounded-lg text-xs font-medium border border-[#1f335c] transition-all"
              >
                <MapPin className="w-3.5 h-3.5 text-[#d4af37]" />
                <span className="font-semibold text-white">{currentOutlet}</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {showOutletDropdown && (
                <div className="absolute right-0 mt-2 w-64 bg-[#0a1329] rounded-xl border border-[#223766] shadow-2xl py-2 z-50">
                  <div className="px-3 py-1.5 border-b border-[#1b2b4e] text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    Select Active Hotel Outlet
                  </div>
                  {HOTEL_OUTLETS.map((outlet) => (
                    <button
                      key={outlet}
                      onClick={() => {
                        setCurrentOutlet(outlet);
                        setShowOutletDropdown(false);
                      }}
                      className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-[#122045] transition-colors ${
                        currentOutlet === outlet ? 'text-[#d4af37] font-semibold bg-[#d4af3710]' : 'text-slate-300'
                      }`}
                    >
                      <span>{outlet}</span>
                      {currentOutlet === outlet && <Check className="w-3.5 h-3.5 text-[#d4af37]" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Role Switcher (RBAC) */}
            <div className="relative">
              <button
                onClick={() => {
                  setShowRoleDropdown(!showRoleDropdown);
                  setShowOutletDropdown(false);
                  setShowNotifs(false);
                }}
                className="flex items-center space-x-2 bg-gradient-to-r from-[#122045] to-[#0f1a38] text-white px-3 py-2 rounded-lg text-xs font-medium border border-[#d4af3740] shadow-sm hover:border-[#d4af37]"
              >
                <Shield className="w-3.5 h-3.5 text-[#d4af37]" />
                <span className="font-semibold text-[#f7e7a9]">{currentRole.replace('_', ' ')}</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {showRoleDropdown && (
                <div className="absolute right-0 mt-2 w-72 bg-[#0a1329] rounded-xl border border-[#223766] shadow-2xl py-2 z-50">
                  <div className="px-3 py-1.5 border-b border-[#1b2b4e] text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    Switch Access Role (RBAC)
                  </div>
                  {roles.map((r) => (
                    <button
                      key={r.role}
                      onClick={() => {
                        setCurrentRole(r.role);
                        setShowRoleDropdown(false);
                      }}
                      className={`w-full text-left px-3 py-2.5 text-xs hover:bg-[#122045] transition-colors border-b border-[#14234b] last:border-0 ${
                        currentRole === r.role ? 'bg-[#d4af3710]' : ''
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className={`font-semibold ${currentRole === r.role ? 'text-[#d4af37]' : 'text-white'}`}>
                          {r.title}
                        </span>
                        {currentRole === r.role && <Check className="w-3.5 h-3.5 text-[#d4af37]" />}
                      </div>
                      <p className="text-[10px] text-slate-400 mt-0.5">{r.desc}</p>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Notification Bell */}
            <div className="relative">
              <button
                onClick={() => {
                  setShowNotifs(!showNotifs);
                  setShowRoleDropdown(false);
                  setShowOutletDropdown(false);
                }}
                className="relative p-2 rounded-lg bg-[#0c1630] hover:bg-[#121f42] text-slate-300 border border-[#1f335c] transition-colors"
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
                    {unreadCount}
                  </span>
                )}
              </button>

              {showNotifs && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-[#0a1329] rounded-xl border border-[#223766] shadow-2xl py-3 z-50">
                  <div className="px-4 pb-2 border-b border-[#1b2b4e] flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-[#d4af37]" />
                      Alerts & System Notifications
                    </span>
                    <button
                      onClick={clearAllNotifications}
                      className="text-[10px] text-slate-400 hover:text-white"
                    >
                      Clear all
                    </button>
                  </div>
                  <div className="max-h-72 overflow-y-auto divide-y divide-[#152345]">
                    {notifications.length === 0 ? (
                      <div className="p-4 text-center text-xs text-slate-400">
                        No active alerts at this time.
                      </div>
                    ) : (
                      notifications.map((n) => (
                        <div
                          key={n.id}
                          onClick={() => markNotificationRead(n.id)}
                          className={`p-3 text-xs cursor-pointer hover:bg-[#0f1c3b] transition-colors ${
                            !n.read ? 'bg-[#d4af3708]' : ''
                          }`}
                        >
                          <div className="flex items-start gap-2">
                            {n.severity === 'critical' ? (
                              <AlertOctagon className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                            ) : n.severity === 'warning' ? (
                              <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                            ) : (
                              <Info className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
                            )}
                            <div className="flex-1">
                              <p className="font-semibold text-white">{n.title}</p>
                              <p className="text-slate-300 text-[11px] mt-0.5">{n.message}</p>
                              <span className="text-[10px] text-slate-500 mt-1 block">{n.timestamp}</span>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tab Bar */}
      <div className="bg-[#050b18] border-t border-[#142348] overflow-x-auto scrollbar-none">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex space-x-1 py-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center space-x-2 px-3.5 py-2.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-gradient-to-r from-[#d4af37] to-[#aa841e] text-[#050b18] shadow-md font-bold'
                    : 'text-slate-300 hover:text-white hover:bg-[#0c1630]'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-[#050b18]' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
}
