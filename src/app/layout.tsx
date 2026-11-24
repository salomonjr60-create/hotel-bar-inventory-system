import type { Metadata } from 'next';
import './globals.css';
import { InventoryProvider } from '@/context/InventoryContext';

export const metadata: Metadata = {
  title: 'Hotel Bar Inventory Control System | Farrago W-Lounge',
  description:
    'Beverage Stock Management | Par Level Control | Daily Inventory | Cost Monitoring - Luxury 5-Star Hotel Bar Operations',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-[#050b18] text-slate-100 antialiased selection:bg-[#d4af37] selection:text-[#050b18]">
        <InventoryProvider>{children}</InventoryProvider>
      </body>
    </html>
  );
}
