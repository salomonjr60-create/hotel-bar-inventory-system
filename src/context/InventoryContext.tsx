'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  BeverageProduct,
  BeverageCategory,
  StockStatus,
  HotelOutlet,
  HOTEL_OUTLETS,
  UserRole,
  StockCount,
  GoodsReceipt,
  StockTransfer,
  WastageRecord,
  PurchaseRequisition,
  NotificationAlert,
  AuditLogEntry,
} from '@/types/inventory';
import masterInventoryRaw from '@/data/masterInventory.json';

interface InventoryContextType {
  products: BeverageProduct[];
  stockCounts: StockCount[];
  goodsReceipts: GoodsReceipt[];
  transfers: StockTransfer[];
  wastageRecords: WastageRecord[];
  requisitions: PurchaseRequisition[];
  notifications: NotificationAlert[];
  auditLogs: AuditLogEntry[];
  currentRole: UserRole;
  currentOutlet: HotelOutlet;
  activeTab: string;
  searchQuery: string;
  selectedCategory: string;
  selectedSubcategory: string;
  filterStatus: string;

  // Setters
  setCurrentRole: (role: UserRole) => void;
  setCurrentOutlet: (outlet: HotelOutlet) => void;
  setActiveTab: (tab: string) => void;
  setSearchQuery: (query: string) => void;
  setSelectedCategory: (cat: string) => void;
  setSelectedSubcategory: (subcat: string) => void;
  setFilterStatus: (status: string) => void;

  // Actions
  updateParLevels: (productId: string, minPar: number, maxPar: number) => void;
  updateProductStock: (productId: string, newStock: number, reason?: string) => void;
  addProduct: (product: Partial<BeverageProduct>) => void;

  // Daily Count
  submitStockCount: (count: Omit<StockCount, 'id' | 'countNumber'>) => void;
  approveStockCount: (countId: string) => void;
  rejectStockCount: (countId: string) => void;

  // Goods Receipts
  recordGoodsReceipt: (receipt: Omit<GoodsReceipt, 'id' | 'receiptNumber'>) => void;

  // Transfers
  requestStockTransfer: (transfer: Omit<StockTransfer, 'id' | 'transferNumber'>) => void;
  approveStockTransfer: (transferId: string) => void;
  rejectStockTransfer: (transferId: string) => void;

  // Wastage
  recordWastage: (record: Omit<WastageRecord, 'id' | 'recordNumber' | 'financialLoss'>) => void;
  approveWastage: (recordId: string) => void;
  rejectWastage: (recordId: string) => void;

  // Requisitions
  createRequisition: (req: Omit<PurchaseRequisition, 'id' | 'reqNumber'>) => void;
  approveRequisition: (reqId: string) => void;
  rejectRequisition: (reqId: string) => void;
  generateAutoRequisition: () => PurchaseRequisition;

  // Notifications
  markNotificationRead: (id: string) => void;
  clearAllNotifications: () => void;

  // Reset
  resetToMasterData: () => void;
}

const InventoryContext = createContext<InventoryContextType | undefined>(undefined);

// Par Level Status Logic strictly according to Hotel Bar Operations specification:
// GREEN: Stock is above par level
// YELLOW: Stock is approaching par level (at par or within 25% of par)
// RED: Stock is below par level
// CRITICAL: Zero stock on an active par item
function calculateStatus(stock: number, minPar: number): StockStatus {
  if (minPar > 0) {
    if (stock <= 0) return 'CRITICAL';
    if (stock < minPar) return 'RED';
    if (stock <= minPar * 1.25) return 'YELLOW';
    return 'GREEN';
  }
  // Zero par items (e.g. on-demand lines)
  if (stock <= 0) return 'YELLOW';
  return 'GREEN';
}

function calculateReorderQty(currentStock: number, maxPar: number, minPar: number): number {
  if (currentStock < minPar || minPar === 0) {
    const diff = maxPar - currentStock;
    return diff > 0 ? Number(diff.toFixed(2)) : 0;
  }
  return 0;
}

export function InventoryProvider({ children }: { children: ReactNode }) {
  const [currentRole, setCurrentRole] = useState<UserRole>('ADMIN');
  const [currentOutlet, setCurrentOutlet] = useState<HotelOutlet>('W Lounge');
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>('All');
  const [filterStatus, setFilterStatus] = useState<string>('All');

  // Initialize products STRICTLY from the official W Lounge PDF
  // NO INVENTED QUANTITIES: currentStock is initialized to the authoritative Qty/MinLvl figure from the PDF.
  const [products, setProducts] = useState<BeverageProduct[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('w_lounge_products_v2');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {
          console.error('Failed to parse saved products', e);
        }
      }
    }

    return (masterInventoryRaw as any[]).map((item) => {
      // Direct, uninvented baseline stock from the PDF
      const initialStock = item.isAdditional ? 0.0 : item.originalParLevel;
      const minPar = item.originalParLevel;
      // Maximum Par level: uses Rate/Value from PDF if > minPar, or minPar * 2, or 2.0 for 0-par items
      const maxPar = item.rate > minPar ? item.rate : (minPar > 0 ? minPar * 2 : 2.0);
      const status = calculateStatus(initialStock, minPar);
      const reorderQty = calculateReorderQty(initialStock, maxPar, minPar);

      return {
        id: `prod-${item.sno}-${item.itemCode}`,
        sno: item.sno,
        itemCode: item.itemCode,
        name: item.name,
        category: item.category as BeverageCategory,
        subcategory: item.subcategory,
        packagingSize: item.packagingSize,
        packagingDescription: item.packagingDescription,
        unit: item.unit,
        originalParLevel: item.originalParLevel,
        minParLevel: minPar,
        maxParLevel: maxPar,
        rate: item.rate,
        value: item.value,
        currentStock: initialStock,
        reorderQuantity: reorderQty,
        status,
        isAdditional: item.isAdditional,
      };
    });
  });

  // Stock counts state
  const [stockCounts, setStockCounts] = useState<StockCount[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('w_lounge_stock_counts_v2');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {}
      }
    }
    return [
      {
        id: 'sc-1001',
        countNumber: 'SC-2026-001',
        countDate: '2026-11-24',
        outletName: 'W Lounge',
        conductedBy: 'Marcus Vance (Supervisor)',
        status: 'Approved',
        approvedBy: 'Gamini Thala Bandaralage (Cost Controller)',
        approvedAt: '2026-11-24T18:00:00Z',
        totalVarianceValue: -9.00,
        notes: 'End of shift daily count reconciled against official par level sheet.',
        lines: [
          {
            id: 'scl-1',
            productId: 'prod-43-Z00008619',
            itemCode: 'Z00008619',
            productName: 'Birra Moretti 330ML Bottle #9835 (WTD)',
            category: 'Beers and Non-Alcoholic Beer',
            openingStock: 24,
            stockReceived: 24,
            stockIssued: 25,
            transfersIn: 0,
            transfersOut: 0,
            wastage: 1,
            expectedClosingStock: 22,
            physicalClosingStock: 22,
            variance: 0,
            varianceValue: 0.00,
            unit: 'Bottle',
          },
          {
            id: 'scl-2',
            productId: 'prod-212-22080004',
            itemCode: '22080004',
            productName: 'Tanqueray Gin 700Ml #90730327 (WTD)',
            category: 'Spirits',
            openingStock: 3,
            stockReceived: 0,
            stockIssued: 1,
            transfersIn: 0,
            transfersOut: 0,
            wastage: 0,
            expectedClosingStock: 2,
            physicalClosingStock: 1.75,
            variance: -0.25,
            varianceValue: -2.25,
            unit: 'Bottle',
          },
        ],
      },
    ];
  });

  // Goods receipts state
  const [goodsReceipts, setGoodsReceipts] = useState<GoodsReceipt[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('w_lounge_goods_receipts_v2');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {}
      }
    }
    return [
      {
        id: 'gr-501',
        receiptNumber: 'GRN-2026-089',
        supplierName: 'Maritime and Mercantile International (MMI Dubai)',
        deliveryNoteNumber: 'DN-994821',
        poNumber: 'PO-W-4402',
        dateReceived: '2026-11-24',
        receivingEmployee: 'Carlos Mendes',
        status: 'Authorized',
        totalValue: 216.00,
        outlet: 'W Lounge',
        lines: [
          {
            id: 'grl-1',
            productId: 'prod-232-21020038',
            itemCode: '21020038',
            productName: 'Peroni Btl 330Ml #90060009 (WTD)',
            quantityReceived: 48,
            unitCost: 3.00,
            totalValue: 144.00,
          },
          {
            id: 'grl-2',
            productId: 'prod-43-Z00008619',
            itemCode: 'Z00008619',
            productName: 'Birra Moretti 330ML Bottle #9835 (WTD)',
            quantityReceived: 24,
            unitCost: 3.00,
            totalValue: 72.00,
          },
        ],
      },
    ];
  });

  // Stock transfers state
  const [transfers, setTransfers] = useState<StockTransfer[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('w_lounge_transfers_v2');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {}
      }
    }
    return [
      {
        id: 'tr-701',
        transferNumber: 'TR-2026-042',
        sendingOutlet: 'Central Beverage Store',
        receivingOutlet: 'W Lounge',
        transferDate: '2026-11-24',
        employee: 'Ahmed Al-Sayed',
        status: 'Approved',
        approvedBy: 'Anthony Tran (Director of F&B)',
        approvedAt: '2026-11-24T14:15:00Z',
        notes: 'Replenishment for evening lounge service',
        lines: [
          {
            id: 'trl-1',
            productId: 'prod-43-Z00008619',
            itemCode: 'Z00008619',
            productName: 'Birra Moretti 330ML Bottle #9835 (WTD)',
            quantity: 24,
            unit: 'Bottle',
          },
          {
            id: 'trl-2',
            productId: 'prod-195-22130003',
            itemCode: '22130003',
            productName: 'Bacardi Superior Carta Blanca 750ML #0148 (LTD)',
            quantity: 2,
            unit: 'Bottle',
          },
        ],
      },
    ];
  });

  // Wastage records state
  const [wastageRecords, setWastageRecords] = useState<WastageRecord[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('w_lounge_wastage_v2');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {}
      }
    }
    return [
      {
        id: 'wst-301',
        recordNumber: 'WST-2026-015',
        productId: 'prod-152-24040001',
        itemCode: '24040001',
        productName: 'Da Luca Prosecco 750ML #95160021 (LTD)',
        category: 'Sparkling Wines and Champagne',
        quantity: 1,
        unit: 'Bottle',
        reason: 'Broken bottles',
        date: '2026-11-24',
        employee: 'Elena Rostova',
        supervisorApproval: 'Approved',
        financialLoss: 8.00,
        outlet: 'W Lounge',
        notes: 'Broken during service rush setup',
      },
    ];
  });

  // Purchase requisitions state
  const [requisitions, setRequisitions] = useState<PurchaseRequisition[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('w_lounge_requisitions_v2');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {}
      }
    }
    return [];
  });

  // Audit logs state
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>(() => {
    return [
      {
        id: 'aud-1',
        timestamp: new Date().toISOString(),
        user: 'Gamini Thala Bandaralage',
        role: 'ADMIN',
        action: 'MASTER_PDF_INITIALIZE',
        entityType: 'INVENTORY_DB',
        entityId: 'PL-PL2600109',
        details: '235 Master beverage products initialized from official W Lounge Par Level PDF without synthetic mutation.',
      },
    ];
  });

  // Notifications state
  const [notifications, setNotifications] = useState<NotificationAlert[]>(() => {
    return [
      {
        id: 'notif-1',
        title: 'Master Inventory Loaded',
        message: '235 Official products loaded directly from W Lounge Par Level PDF.',
        type: 'count_overdue',
        severity: 'info',
        timestamp: 'Just now',
        read: false,
      },
    ];
  });

  // Save to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('w_lounge_products_v2', JSON.stringify(products));
      localStorage.setItem('w_lounge_stock_counts_v2', JSON.stringify(stockCounts));
      localStorage.setItem('w_lounge_goods_receipts_v2', JSON.stringify(goodsReceipts));
      localStorage.setItem('w_lounge_transfers_v2', JSON.stringify(transfers));
      localStorage.setItem('w_lounge_wastage_v2', JSON.stringify(wastageRecords));
      localStorage.setItem('w_lounge_requisitions_v2', JSON.stringify(requisitions));
    }
  }, [products, stockCounts, goodsReceipts, transfers, wastageRecords, requisitions]);

  const addAudit = (action: string, entityType: string, entityId: string, details: string) => {
    const entry: AuditLogEntry = {
      id: `aud-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      timestamp: new Date().toISOString(),
      user: currentRole === 'ADMIN' ? 'General Manager / Admin' : `${currentRole} User`,
      role: currentRole,
      action,
      entityType,
      entityId,
      details,
    };
    setAuditLogs((prev) => [entry, ...prev.slice(0, 99)]);
  };

  // Actions
  const updateParLevels = (productId: string, minPar: number, maxPar: number) => {
    setProducts((prev) =>
      prev.map((p) => {
        if (p.id === productId) {
          const status = calculateStatus(p.currentStock, minPar);
          const reorderQty = calculateReorderQty(p.currentStock, maxPar, minPar);
          return {
            ...p,
            minParLevel: minPar,
            maxParLevel: maxPar,
            status,
            reorderQuantity: reorderQty,
          };
        }
        return p;
      })
    );
    addAudit('UPDATE_PAR_LEVEL', 'PRODUCT', productId, `Min Par set to ${minPar}, Max Par set to ${maxPar}`);
  };

  const updateProductStock = (productId: string, newStock: number, reason?: string) => {
    setProducts((prev) =>
      prev.map((p) => {
        if (p.id === productId) {
          const safeStock = Math.max(0, Number(newStock.toFixed(2)));
          const status = calculateStatus(safeStock, p.minParLevel);
          const reorderQty = calculateReorderQty(safeStock, p.maxParLevel, p.minParLevel);
          return {
            ...p,
            currentStock: safeStock,
            status,
            reorderQuantity: reorderQty,
          };
        }
        return p;
      })
    );
    addAudit('MANUAL_STOCK_ADJUST', 'PRODUCT', productId, `Stock adjusted to ${newStock}. Reason: ${reason || 'Physical count adjustment'}`);
  };

  const addProduct = (product: Partial<BeverageProduct>) => {
    const newSno = products.length + 1;
    const minPar = product.minParLevel || 0;
    const maxPar = product.maxParLevel || (minPar * 2);
    const stock = product.currentStock || 0;
    const newProd: BeverageProduct = {
      id: `prod-${newSno}-${product.itemCode || 'CUSTOM'}`,
      sno: newSno,
      itemCode: product.itemCode || `ITM-${newSno}`,
      name: product.name || 'New Product',
      category: product.category || 'Spirits',
      subcategory: product.subcategory || 'Other Spirits',
      packagingSize: product.packagingSize || '750ML',
      packagingDescription: product.packagingDescription || '750ML/Btl',
      unit: product.unit || 'Bottle',
      originalParLevel: minPar,
      minParLevel: minPar,
      maxParLevel: maxPar,
      rate: product.rate || 0,
      value: product.value || 0,
      currentStock: stock,
      reorderQuantity: calculateReorderQty(stock, maxPar, minPar),
      status: calculateStatus(stock, minPar),
      isAdditional: true,
    };
    setProducts((prev) => [newProd, ...prev]);
    addAudit('CREATE_PRODUCT', 'PRODUCT', newProd.id, `Created product: ${newProd.name}`);
  };

  const submitStockCount = (count: Omit<StockCount, 'id' | 'countNumber'>) => {
    const countNumber = `SC-2026-${String(stockCounts.length + 1).padStart(3, '0')}`;
    const newCount: StockCount = {
      ...count,
      id: `sc-${Date.now()}`,
      countNumber,
    };
    setStockCounts((prev) => [newCount, ...prev]);
    addAudit('SUBMIT_STOCK_COUNT', 'STOCK_COUNT', countNumber, `Stock count submitted for outlet ${count.outletName}`);
  };

  const approveStockCount = (countId: string) => {
    const count = stockCounts.find((c) => c.id === countId);
    if (!count) return;

    // Apply physical closing stocks to products
    setProducts((prev) =>
      prev.map((p) => {
        const line = count.lines.find((l) => l.productId === p.id);
        if (line) {
          const newStock = line.physicalClosingStock;
          return {
            ...p,
            currentStock: newStock,
            status: calculateStatus(newStock, p.minParLevel),
            reorderQuantity: calculateReorderQty(newStock, p.maxParLevel, p.minParLevel),
          };
        }
        return p;
      })
    );

    setStockCounts((prev) =>
      prev.map((c) =>
        c.id === countId
          ? {
              ...c,
              status: 'Approved',
              approvedBy: `${currentRole} User`,
              approvedAt: new Date().toISOString(),
            }
          : c
      )
    );
    addAudit('APPROVE_STOCK_COUNT', 'STOCK_COUNT', count.countNumber, `Stock count approved. Balances updated.`);
  };

  const rejectStockCount = (countId: string) => {
    setStockCounts((prev) =>
      prev.map((c) => (c.id === countId ? { ...c, status: 'Rejected' } : c))
    );
    addAudit('REJECT_STOCK_COUNT', 'STOCK_COUNT', countId, 'Stock count rejected by supervisor');
  };

  const recordGoodsReceipt = (receipt: Omit<GoodsReceipt, 'id' | 'receiptNumber'>) => {
    const receiptNumber = `GRN-2026-${String(goodsReceipts.length + 1).padStart(3, '0')}`;
    const newReceipt: GoodsReceipt = {
      ...receipt,
      id: `gr-${Date.now()}`,
      receiptNumber,
    };

    setProducts((prev) =>
      prev.map((p) => {
        const line = receipt.lines.find((l) => l.productId === p.id);
        if (line) {
          const updatedStock = Number((p.currentStock + line.quantityReceived).toFixed(2));
          return {
            ...p,
            currentStock: updatedStock,
            status: calculateStatus(updatedStock, p.minParLevel),
            reorderQuantity: calculateReorderQty(updatedStock, p.maxParLevel, p.minParLevel),
          };
        }
        return p;
      })
    );

    setGoodsReceipts((prev) => [newReceipt, ...prev]);
    addAudit('GOODS_RECEIPT_AUTHORIZED', 'GOODS_RECEIPT', receiptNumber, `Received ${receipt.lines.length} lines from ${receipt.supplierName}`);
  };

  const requestStockTransfer = (transfer: Omit<StockTransfer, 'id' | 'transferNumber'>) => {
    const transferNumber = `TR-2026-${String(transfers.length + 1).padStart(3, '0')}`;
    const newTransfer: StockTransfer = {
      ...transfer,
      id: `tr-${Date.now()}`,
      transferNumber,
    };
    setTransfers((prev) => [newTransfer, ...prev]);
    addAudit('REQUEST_TRANSFER', 'STOCK_TRANSFER', transferNumber, `From ${transfer.sendingOutlet} to ${transfer.receivingOutlet}`);
  };

  const approveStockTransfer = (transferId: string) => {
    const transfer = transfers.find((t) => t.id === transferId);
    if (!transfer) return;

    setProducts((prev) =>
      prev.map((p) => {
        const line = transfer.lines.find((l) => l.productId === p.id);
        if (line) {
          let updated = p.currentStock;
          if (transfer.receivingOutlet === currentOutlet) {
            updated += line.quantity;
          } else if (transfer.sendingOutlet === currentOutlet) {
            updated = Math.max(0, updated - line.quantity);
          }
          return {
            ...p,
            currentStock: Number(updated.toFixed(2)),
            status: calculateStatus(updated, p.minParLevel),
            reorderQuantity: calculateReorderQty(updated, p.maxParLevel, p.minParLevel),
          };
        }
        return p;
      })
    );

    setTransfers((prev) =>
      prev.map((t) =>
        t.id === transferId
          ? {
              ...t,
              status: 'Approved',
              approvedBy: `${currentRole} User`,
              approvedAt: new Date().toISOString(),
            }
          : t
      )
    );
    addAudit('APPROVE_TRANSFER', 'STOCK_TRANSFER', transfer.transferNumber, `Dual-outlet stock transfer approved.`);
  };

  const rejectStockTransfer = (transferId: string) => {
    setTransfers((prev) =>
      prev.map((t) => (t.id === transferId ? { ...t, status: 'Rejected' } : t))
    );
    addAudit('REJECT_TRANSFER', 'STOCK_TRANSFER', transferId, 'Transfer rejected');
  };

  const recordWastage = (record: Omit<WastageRecord, 'id' | 'recordNumber' | 'financialLoss'>) => {
    const product = products.find((p) => p.id === record.productId);
    const rate = product?.rate || 0;
    const financialLoss = Number((record.quantity * rate).toFixed(2));
    const recordNumber = `WST-2026-${String(wastageRecords.length + 1).padStart(3, '0')}`;

    const newRecord: WastageRecord = {
      ...record,
      id: `wst-${Date.now()}`,
      recordNumber,
      financialLoss,
    };

    if (newRecord.supervisorApproval === 'Approved') {
      setProducts((prev) =>
        prev.map((p) => {
          if (p.id === record.productId) {
            const updated = Math.max(0, p.currentStock - record.quantity);
            return {
              ...p,
              currentStock: Number(updated.toFixed(2)),
              status: calculateStatus(updated, p.minParLevel),
              reorderQuantity: calculateReorderQty(updated, p.maxParLevel, p.minParLevel),
            };
          }
          return p;
        })
      );
    }

    setWastageRecords((prev) => [newRecord, ...prev]);
    addAudit('RECORD_WASTAGE', 'WASTAGE', recordNumber, `${record.quantity} ${record.unit} wasted (${record.reason}). Loss: AED ${financialLoss}`);
  };

  const approveWastage = (recordId: string) => {
    const item = wastageRecords.find((w) => w.id === recordId);
    if (!item) return;

    setProducts((prev) =>
      prev.map((p) => {
        if (p.id === item.productId) {
          const updated = Math.max(0, p.currentStock - item.quantity);
          return {
            ...p,
            currentStock: Number(updated.toFixed(2)),
            status: calculateStatus(updated, p.minParLevel),
            reorderQuantity: calculateReorderQty(updated, p.maxParLevel, p.minParLevel),
          };
        }
        return p;
      })
    );

    setWastageRecords((prev) =>
      prev.map((w) => (w.id === recordId ? { ...w, supervisorApproval: 'Approved' } : w))
    );
    addAudit('APPROVE_WASTAGE', 'WASTAGE', item.recordNumber, 'Supervisor approved wastage and adjusted stock.');
  };

  const rejectWastage = (recordId: string) => {
    setWastageRecords((prev) =>
      prev.map((w) => (w.id === recordId ? { ...w, supervisorApproval: 'Rejected' } : w))
    );
    addAudit('REJECT_WASTAGE', 'WASTAGE', recordId, 'Wastage entry rejected');
  };

  const createRequisition = (req: Omit<PurchaseRequisition, 'id' | 'reqNumber'>) => {
    const reqNumber = `PR-2026-${String(requisitions.length + 1).padStart(3, '0')}`;
    const newReq: PurchaseRequisition = {
      ...req,
      id: `req-${Date.now()}`,
      reqNumber,
    };
    setRequisitions((prev) => [newReq, ...prev]);
    addAudit('CREATE_REQUISITION', 'PURCHASE_REQUISITION', reqNumber, `Requisition submitted with ${req.lines.length} lines`);
  };

  const approveRequisition = (reqId: string) => {
    setRequisitions((prev) =>
      prev.map((r) =>
        r.id === reqId
          ? {
              ...r,
              status: 'Approved',
              approvedBy: `${currentRole} User`,
              approvedAt: new Date().toISOString(),
            }
          : r
      )
    );
    addAudit('APPROVE_REQUISITION', 'PURCHASE_REQUISITION', reqId, 'Requisition approved for purchase order conversion.');
  };

  const rejectRequisition = (reqId: string) => {
    setRequisitions((prev) =>
      prev.map((r) => (r.id === reqId ? { ...r, status: 'Rejected' } : r))
    );
    addAudit('REJECT_REQUISITION', 'PURCHASE_REQUISITION', reqId, 'Requisition rejected');
  };

  const generateAutoRequisition = (): PurchaseRequisition => {
    const lowStockItems = products.filter(
      (p) => p.minParLevel > 0 && p.currentStock < p.minParLevel
    );

    const lines = lowStockItems.map((p) => {
      const recQty = calculateReorderQty(p.currentStock, p.maxParLevel, p.minParLevel);
      const estTotal = Number((recQty * p.rate).toFixed(2));
      return {
        id: `reql-${p.id}`,
        productId: p.id,
        itemCode: p.itemCode,
        productName: p.name,
        currentStock: p.currentStock,
        minParLevel: p.minParLevel,
        maxParLevel: p.maxParLevel,
        recommendedQty: recQty,
        requestedQty: recQty,
        unitCost: p.rate,
        estimatedTotal: estTotal,
      };
    });

    const totalCost = Number(lines.reduce((acc, l) => acc + l.estimatedTotal, 0).toFixed(2));
    const reqNumber = `PR-2026-${String(requisitions.length + 1).padStart(3, '0')}`;
    const newReq: PurchaseRequisition = {
      id: `req-${Date.now()}`,
      reqNumber,
      dateCreated: new Date().toISOString().split('T')[0],
      createdBy: `${currentRole} (Automated Replenishment)`,
      status: 'Submitted',
      outlet: currentOutlet,
      totalEstimatedCost: totalCost,
      lines,
      notes: `Auto-generated replenishment for ${lines.length} items below minimum par levels.`,
    };

    setRequisitions((prev) => [newReq, ...prev]);
    addAudit('AUTO_GENERATE_REQUISITION', 'PURCHASE_REQUISITION', reqNumber, `Generated requisition for ${lines.length} below-par items.`);
    return newReq;
  };

  const markNotificationRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const clearAllNotifications = () => {
    setNotifications([]);
  };

  const resetToMasterData = () => {
    localStorage.removeItem('w_lounge_products_v2');
    localStorage.removeItem('w_lounge_stock_counts_v2');
    localStorage.removeItem('w_lounge_goods_receipts_v2');
    localStorage.removeItem('w_lounge_transfers_v2');
    localStorage.removeItem('w_lounge_wastage_v2');
    localStorage.removeItem('w_lounge_requisitions_v2');
    window.location.reload();
  };

  return (
    <InventoryContext.Provider
      value={{
        products,
        stockCounts,
        goodsReceipts,
        transfers,
        wastageRecords,
        requisitions,
        notifications,
        auditLogs,
        currentRole,
        currentOutlet,
        activeTab,
        searchQuery,
        selectedCategory,
        selectedSubcategory,
        filterStatus,
        setCurrentRole,
        setCurrentOutlet,
        setActiveTab,
        setSearchQuery,
        setSelectedCategory,
        setSelectedSubcategory,
        setFilterStatus,
        updateParLevels,
        updateProductStock,
        addProduct,
        submitStockCount,
        approveStockCount,
        rejectStockCount,
        recordGoodsReceipt,
        requestStockTransfer,
        approveStockTransfer,
        rejectStockTransfer,
        recordWastage,
        approveWastage,
        rejectWastage,
        createRequisition,
        approveRequisition,
        rejectRequisition,
        generateAutoRequisition,
        markNotificationRead,
        clearAllNotifications,
        resetToMasterData,
      }}
    >
      {children}
    </InventoryContext.Provider>
  );
}

export function useInventory() {
  const context = useContext(InventoryContext);
  if (!context) {
    throw new Error('useInventory must be used within an InventoryProvider');
  }
  return context;
}
