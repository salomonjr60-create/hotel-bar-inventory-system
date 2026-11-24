export type BeverageCategory =
  | 'Spirits'
  | 'Liqueurs and Aperitifs'
  | 'Red Wines'
  | 'White Wines'
  | 'Rose Wines'
  | 'Sparkling Wines and Champagne'
  | 'Beers and Non-Alcoholic Beer'
  | 'Soft Beverages and Water';

export const ALL_CATEGORIES: BeverageCategory[] = [
  'Spirits',
  'Liqueurs and Aperitifs',
  'Red Wines',
  'White Wines',
  'Rose Wines',
  'Sparkling Wines and Champagne',
  'Beers and Non-Alcoholic Beer',
  'Soft Beverages and Water',
];

export const CATEGORY_SUBCATEGORIES: Record<BeverageCategory, string[]> = {
  'Spirits': [
    'Whisky and Whiskey',
    'Scotch Whisky',
    'Irish Whiskey',
    'Bourbon Whiskey',
    'Vodka',
    'Gin',
    'White Rum',
    'Dark Rum',
    'Spiced Rum',
    'Aged Rum',
    'Tequila Blanco',
    'Tequila Reposado',
    'Tequila Anejo',
    'Mezcal',
    'Cognac',
    'Brandy',
    'Pisco',
    'Other Spirits',
  ],
  'Liqueurs and Aperitifs': [
    'Coffee Liqueurs',
    'Orange Liqueurs',
    'Fruit Liqueurs',
    'Herbal Liqueurs',
    'Cream Liqueurs',
    'Vermouth',
    'Bitters',
    'Aperitifs',
    'Digestifs',
    'Other Liqueurs',
  ],
  'Red Wines': [
    'Red Wine',
  ],
  'White Wines': [
    'White Wine',
  ],
  'Rose Wines': [
    'Rose Wine',
  ],
  'Sparkling Wines and Champagne': [
    'Champagne',
    'Prosecco',
    'Sparkling Rose',
    'Other Sparkling Wines',
  ],
  'Beers and Non-Alcoholic Beer': [
    'Bottled Beer',
    'Draft Beer',
    'Non-Alcoholic Beer',
  ],
  'Soft Beverages and Water': [
    'Other Fresh Juices',
    'Soft Drinks',
    'Mixers',
    'Energy Drinks',
    'Still Water',
    'Sparkling Water',
  ],
};

export type StockStatus = 'GREEN' | 'YELLOW' | 'RED' | 'CRITICAL';

export interface BeverageProduct {
  id: string;
  sno: number;
  itemCode: string;
  name: string;
  category: BeverageCategory;
  subcategory: string;
  packagingSize: string;
  packagingDescription: string;
  unit: string;
  originalParLevel: number;
  minParLevel: number;
  maxParLevel: number;
  rate: number;
  value: number;
  currentStock: number;
  reorderQuantity: number;
  status: StockStatus;
  isAdditional: boolean;
  outletStocks?: Record<string, number>;
}

export const HOTEL_OUTLETS = [
  'W Lounge',
  'Main Bar',
  'Pool Bar',
  'Restaurant Bar',
  'Banquet Bar',
  'Executive Lounge',
  'Central Beverage Store',
] as const;

export type HotelOutlet = (typeof HOTEL_OUTLETS)[number];

export type UserRole = 'ADMIN' | 'BAR_MANAGER' | 'SUPERVISOR' | 'BARTENDER';

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  assignedOutlet: HotelOutlet;
}

export interface StockCountLine {
  id: string;
  productId: string;
  itemCode: string;
  productName: string;
  category: string;
  openingStock: number;
  stockReceived: number;
  stockIssued: number;
  transfersIn: number;
  transfersOut: number;
  wastage: number;
  expectedClosingStock: number;
  physicalClosingStock: number;
  variance: number;
  varianceValue: number;
  unit: string;
}

export interface StockCount {
  id: string;
  countNumber: string;
  countDate: string;
  outletName: HotelOutlet;
  conductedBy: string;
  status: 'Draft' | 'Submitted' | 'Approved' | 'Rejected';
  approvedBy?: string;
  approvedAt?: string;
  totalVarianceValue: number;
  lines: StockCountLine[];
  notes?: string;
}

export interface GoodsReceiptLine {
  id: string;
  productId: string;
  itemCode: string;
  productName: string;
  quantityReceived: number;
  unitCost: number;
  totalValue: number;
}

export interface GoodsReceipt {
  id: string;
  receiptNumber: string;
  supplierName: string;
  deliveryNoteNumber: string;
  poNumber: string;
  dateReceived: string;
  receivingEmployee: string;
  status: 'Pending' | 'Verified' | 'Authorized';
  totalValue: number;
  outlet: HotelOutlet;
  lines: GoodsReceiptLine[];
}

export interface StockTransferLine {
  id: string;
  productId: string;
  itemCode: string;
  productName: string;
  quantity: number;
  unit: string;
}

export interface StockTransfer {
  id: string;
  transferNumber: string;
  sendingOutlet: HotelOutlet;
  receivingOutlet: HotelOutlet;
  transferDate: string;
  employee: string;
  status: 'Draft' | 'Pending Approval' | 'Approved' | 'Rejected';
  approvedBy?: string;
  approvedAt?: string;
  lines: StockTransferLine[];
  notes?: string;
}

export type WastageReason =
  | 'Broken bottles'
  | 'Spillage'
  | 'Expired beverages'
  | 'Complimentary consumption'
  | 'Incorrect preparation'
  | 'Other operational losses';

export interface WastageRecord {
  id: string;
  recordNumber: string;
  productId: string;
  itemCode: string;
  productName: string;
  category: string;
  quantity: number;
  unit: string;
  reason: WastageReason;
  date: string;
  employee: string;
  supervisorApproval: 'Pending' | 'Approved' | 'Rejected';
  financialLoss: number;
  outlet: HotelOutlet;
  notes?: string;
}

export interface PurchaseRequisitionLine {
  id: string;
  productId: string;
  itemCode: string;
  productName: string;
  currentStock: number;
  minParLevel: number;
  maxParLevel: number;
  recommendedQty: number;
  requestedQty: number;
  unitCost: number;
  estimatedTotal: number;
}

export interface PurchaseRequisition {
  id: string;
  reqNumber: string;
  dateCreated: string;
  createdBy: string;
  status: 'Draft' | 'Submitted' | 'Approved' | 'Rejected';
  approvedBy?: string;
  approvedAt?: string;
  outlet: HotelOutlet;
  totalEstimatedCost: number;
  lines: PurchaseRequisitionLine[];
  notes?: string;
}

export interface NotificationAlert {
  id: string;
  title: string;
  message: string;
  type:
    | 'low_stock'
    | 'zero_stock'
    | 'count_overdue'
    | 'requisition_approval'
    | 'transfer_pending'
    | 'variance_alert';
  severity: 'info' | 'warning' | 'critical';
  timestamp: string;
  read: boolean;
  relatedId?: string;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  user: string;
  role: string;
  action: string;
  entityType: string;
  entityId: string;
  details: string;
}
