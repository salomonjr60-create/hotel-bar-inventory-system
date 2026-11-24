'use client';

import React from 'react';
import { useInventory } from '@/context/InventoryContext';
import Navbar from '@/components/Navbar';
import DashboardView from '@/components/DashboardView';
import InventoryView from '@/components/InventoryView';
import StockCountView from '@/components/StockCountView';
import GoodsReceiptView from '@/components/GoodsReceiptView';
import TransfersView from '@/components/TransfersView';
import WastageView from '@/components/WastageView';
import RequisitionsView from '@/components/RequisitionsView';
import ReportsView from '@/components/ReportsView';
import SettingsView from '@/components/SettingsView';

export default function Home() {
  const { activeTab } = useInventory();

  return (
    <div className="min-h-screen bg-[#050b18] text-slate-100 flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {activeTab === 'dashboard' && <DashboardView />}
        {activeTab === 'inventory' && <InventoryView />}
        {activeTab === 'stock-count' && <StockCountView />}
        {activeTab === 'goods-receipt' && <GoodsReceiptView />}
        {activeTab === 'transfers' && <TransfersView />}
        {activeTab === 'wastage' && <WastageView />}
        {activeTab === 'requisitions' && <RequisitionsView />}
        {activeTab === 'reports' && <ReportsView />}
        {activeTab === 'settings' && <SettingsView />}
      </main>

      {/* Luxury Footer */}
      <footer className="bg-[#040814] border-t border-[#131f3b] py-6 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-[#d4af37]" />
            <span className="text-slate-400 font-semibold">
              Farrago W-Lounge • Mina Seyahi Beach Resort & Marina
            </span>
            <span>| Doc No: PL-PL2600109</span>
          </div>
          <div>
            HOTEL BAR INVENTORY CONTROL SYSTEM • 235 Master Items Reconciled • Supabase PostgreSQL RLS
          </div>
        </div>
      </footer>
    </div>
  );
}
