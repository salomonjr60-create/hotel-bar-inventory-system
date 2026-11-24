# HOTEL BAR INVENTORY CONTROL SYSTEM
### Farrago W-Lounge | Mina Seyahi Beach Resort & Marina

> **Official Authority Document**: `W Lounge (1).pdf` (Doc No: PL-PL2600109)  
> **Sign-off Approvals Verified**: Gamini Thala Bandaralage (Cost Controller), Anthony Tran (Director of F&B), Vakeesan Muthukumarasamy (DOF/DDOF)

A professional, fully functional Hotel Bar Inventory Management System engineered for luxury five-star hotel bar operations.

---

## 🌟 Key Capabilities

1. **Master Beverage Inventory (All 235 PDF Entries)**:
   - Full extraction of all 235 beverage SKUs across all 5 pages.
   - Retains exact SNo, Item Code, Beverage Name, Category, Subcategory, Packaging Size, Unit, Par Level, Rate, and Value.
   - **Zero & 0.10 Values Preserved**: 100% fidelity to the official hotel document.
   - **Baseline Par Level Integrity**: Original PDF par level is permanently preserved as a locked baseline that cannot be overwritten.
   - **Category H Additions**: Configurable par levels for Barakat fresh juices, Al Ain mineral water, soft drinks, mixers, and energy drinks.

2. **Categorization & Subcategorization (Categories A through H)**:
   - **Spirits**: Scotch Whisky, Irish Whiskey, Bourbon Whiskey, Whisky & Whiskey, Vodka, Gin, White Rum, Dark Rum, Spiced Rum, Aged Rum, Tequila Blanco, Tequila Reposado, Tequila Anejo, Mezcal, Cognac, Brandy, Pisco, Other Spirits.
   - **Liqueurs & Aperitifs**: Coffee, Orange, Fruit, Herbal, Cream, Vermouth, Bitters, Aperitifs, Digestifs, Other Liqueurs.
   - **Red Wines, White Wines, Rose Wines**.
   - **Sparkling Wines & Champagne**: Champagne, Prosecco, Sparkling Rose, Other Sparkling Wines.
   - **Beers & Non-Alcoholic Beer**: Bottled Beer, Draft Beer (Blade Kegs), Non-Alcoholic Beer.
   - **Soft Beverages & Water**: Fresh Juices, Still Water, Sparkling Water, Mixers, Soft Drinks, Energy Drinks.

3. **Executive Dashboard**:
   - Total products, total inventory volume, total monetary valuation (AED).
   - Below par warnings (Red) and Zero-stock depleted speed rails (Critical).
   - Live Recharts visualizations: Stock by Category, Valuation Breakdown, Par Compliance Donut, Weekly Consumption Trends, Monthly Movement.

4. **Daily Stock Count Module**:
   - Formula: `Opening + Received + Transfers In - Issued - Transfers Out - Wastage = Expected Closing Stock`.
   - Variance calculation: `Physical Closing Stock - Expected Closing Stock` with monetary impact.
   - Decimal bottle count buttons (`+0.25`, `+0.50`, `+0.75`, `+1.00`) and draft keg litres.
   - Draft submission, supervisor review, and approval workflow.

5. **Goods Received Bay**:
   - Supplier intake (MMI, African + Eastern, Barakat, Al Ain Water).
   - Delivery note numbers, PO numbers, unit rates.
   - Automatic inventory increment upon authorization.

6. **Inter-Outlet Stock Transfers**:
   - 7 Hotel Locations: W Lounge, Main Bar, Pool Bar, Restaurant Bar, Banquet Bar, Executive Lounge, Central Beverage Store.
   - Dual-location stock balance adjustment upon supervisor authorization.

7. **Wastage & Breakage Control**:
   - Reasons: Broken bottles, Spillage, Expired beverages, Complimentary consumption, Incorrect preparation, Other operational losses.
   - Automatic financial loss calculation (`Quantity * Rate`).

8. **Automated Purchase Requisitions**:
   - **1-Click Auto Par Replenishment**: Automatically scans below-par items and recommends order quantities (`Max Par - Current Stock`).
   - One-click export to **Luxury PDF Purchase Order** and **Excel (.xlsx)**.

9. **12 Official Downloadable Reports**:
   - Daily, Weekly, Monthly, Par Level, Low Stock, Variance, Goods Received, Transfers, Wastage, Valuation, Requisitions, Category-Wise.
   - Filter by Date, Outlet, Category, Staff.
   - Instant export to Excel, CSV, and PDF.

10. **Role-Based Access Control (RBAC)**:
    - 4 Hotel Roles: `ADMIN`, `BAR_MANAGER`, `SUPERVISOR`, `BARTENDER`.
    - Live role switching and Supabase PostgreSQL Row-Level Security (RLS).

---

## 🛠 Technology Stack

- **Framework**: Next.js 16 (App Router) with TypeScript
- **Styling**: Tailwind CSS (Dark Navy & Champagne Gold Luxury Theme)
- **Database**: Supabase PostgreSQL (16 Relational Tables & RLS Policies)
- **Icons**: Lucide React
- **Charts**: Recharts
- **Spreadsheets & Documents**: SheetJS (XLSX) & jsPDF / jsPDF-autotable
- **Version Control**: GitHub
- **Deployment**: Vercel

---

## 🚀 Local Setup & Installation

```bash
# Clone the repository
git clone https://github.com/salomonjr60-create/hotel-bar-inventory-system.git
cd hotel-bar-inventory-system

# Install dependencies
npm install --legacy-peer-deps

# Run development server
npm run dev
# Or build and start production server
npm run build
npm run start -p 3000
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🗄 Supabase Database Integration & Administrator Accounts

The project includes the complete production SQL schema at `supabase/schema.sql`.

### Step 1: Deploy Database Schema
1. Create a Supabase project at [supabase.com](https://supabase.com).
2. Open the **SQL Editor** in the Supabase Dashboard.
3. Copy and run the entire script from `supabase/schema.sql`.
   - This creates all 16 relational tables (`profiles`, `outlets`, `beverage_categories`, `products`, `par_levels`, `inventory_balances`, `stock_counts`, `stock_count_lines`, `goods_receipts`, `goods_receipt_lines`, `stock_transfers`, `stock_transfer_lines`, `wastage_records`, `purchase_requisitions`, `purchase_requisition_lines`, `audit_logs`).
   - Seeds all 7 hotel outlets and all 235 master beverage items from `W Lounge (1).pdf`.
   - Activates Row-Level Security (RLS) policies and triggers.

### Step 2: Configure Environment Variables
Create `.env.local` in the project root:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
```

### Step 3: Create Administrator Account
1. In the Supabase Dashboard, go to **Authentication > Users** and click **Add User**.
2. Enter the administrator email (e.g. `fnb.director@wlounge.hotel`) and password.
3. In the SQL Editor, assign the `ADMIN` role to the created profile:
```sql
UPDATE profiles 
SET role = 'ADMIN', full_name = 'Anthony Tran (Director of F&B)'
WHERE email = 'fnb.director@wlounge.hotel';
```
Available roles: `'ADMIN'`, `'BAR_MANAGER'`, `'SUPERVISOR'`, `'BARTENDER'`.

---

## 📊 Import Validation Summary

| Metric | Source PDF (`W Lounge (1).pdf`) | Extracted Database | Status |
| :--- | :--- | :--- | :--- |
| **Total Product Records** | **235** | **235** | **100% Match** |
| **Sum of Qty/MinLvl (Par)** | **268.00** | **268.00** | **100% Match** |
| **Sum of Rates** | **794.60** | **794.60** | **100% Match** |
| **Sum of Values** | **794.60** | **794.60** | **100% Match** |
| **Locked Baseline Pars** | Strictly preserved | Verbatim | **PASS** |
| **Additional Category H Items** | 14 items (Barakat & Al Ain) | 14 items | **PASS** |
