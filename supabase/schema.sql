-- ====================================================================
-- HOTEL BAR INVENTORY CONTROL SYSTEM - SUPABASE POSTGRESQL SCHEMA
-- HOTEL: Mina Seyahi Beach Resort & Marina - Farrago W Lounge
-- CREATED: 2026-11-24
-- ====================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. PROFILES TABLE
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('ADMIN', 'BAR_MANAGER', 'SUPERVISOR', 'BARTENDER')),
    assigned_outlet TEXT NOT NULL DEFAULT 'W Lounge',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. OUTLETS TABLE
CREATE TABLE IF NOT EXISTS outlets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT UNIQUE NOT NULL,
    code TEXT UNIQUE NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. BEVERAGE CATEGORIES TABLE
CREATE TABLE IF NOT EXISTS beverage_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    subcategory TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(name, subcategory)
);

-- 4. PRODUCTS TABLE
CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sno INTEGER NOT NULL,
    item_code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    subcategory TEXT NOT NULL,
    packaging_size TEXT NOT NULL,
    packaging_description TEXT NOT NULL,
    unit TEXT NOT NULL,
    rate NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    value NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    is_additional BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. PAR LEVELS TABLE
CREATE TABLE IF NOT EXISTS par_levels (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    outlet_id UUID REFERENCES outlets(id) ON DELETE CASCADE,
    original_par_level NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    min_par_level NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    max_par_level NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    updated_by UUID REFERENCES profiles(id),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(product_id, outlet_id)
);

-- 6. INVENTORY BALANCES TABLE
CREATE TABLE IF NOT EXISTS inventory_balances (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    outlet_id UUID REFERENCES outlets(id) ON DELETE CASCADE,
    current_physical_stock NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    last_counted_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(product_id, outlet_id)
);

-- 7. STOCK COUNTS TABLE
CREATE TABLE IF NOT EXISTS stock_counts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    count_number TEXT UNIQUE NOT NULL,
    count_date DATE NOT NULL,
    outlet_id UUID REFERENCES outlets(id) ON DELETE CASCADE,
    conducted_by UUID REFERENCES profiles(id),
    status TEXT NOT NULL CHECK (status IN ('Draft', 'Submitted', 'Approved', 'Rejected')) DEFAULT 'Draft',
    approved_by UUID REFERENCES profiles(id),
    approved_at TIMESTAMPTZ,
    total_variance_value NUMERIC(10, 2) DEFAULT 0.00,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. STOCK COUNT LINES TABLE
CREATE TABLE IF NOT EXISTS stock_count_lines (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    stock_count_id UUID REFERENCES stock_counts(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id),
    opening_stock NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    stock_received NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    stock_issued NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    transfers_in NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    transfers_out NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    wastage NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    expected_closing_stock NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    physical_closing_stock NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    variance NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    variance_value NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    unit TEXT NOT NULL DEFAULT 'Bottle'
);

-- 9. GOODS RECEIPTS TABLE
CREATE TABLE IF NOT EXISTS goods_receipts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    receipt_number TEXT UNIQUE NOT NULL,
    supplier_name TEXT NOT NULL,
    delivery_note_number TEXT NOT NULL,
    po_number TEXT,
    date_received DATE NOT NULL,
    outlet_id UUID REFERENCES outlets(id),
    receiving_employee UUID REFERENCES profiles(id),
    status TEXT NOT NULL CHECK (status IN ('Pending', 'Verified', 'Authorized')) DEFAULT 'Verified',
    total_value NUMERIC(10, 2) DEFAULT 0.00,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. GOODS RECEIPT LINES TABLE
CREATE TABLE IF NOT EXISTS goods_receipt_lines (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    goods_receipt_id UUID REFERENCES goods_receipts(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id),
    quantity_received NUMERIC(10, 2) NOT NULL,
    unit_cost NUMERIC(10, 2) NOT NULL,
    total_value NUMERIC(10, 2) NOT NULL
);

-- 11. STOCK TRANSFERS TABLE
CREATE TABLE IF NOT EXISTS stock_transfers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    transfer_number TEXT UNIQUE NOT NULL,
    sending_outlet_id UUID REFERENCES outlets(id),
    receiving_outlet_id UUID REFERENCES outlets(id),
    transfer_date DATE NOT NULL,
    employee_id UUID REFERENCES profiles(id),
    status TEXT NOT NULL CHECK (status IN ('Draft', 'Pending Approval', 'Approved', 'Rejected')) DEFAULT 'Draft',
    approved_by UUID REFERENCES profiles(id),
    approved_at TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. STOCK TRANSFER LINES TABLE
CREATE TABLE IF NOT EXISTS stock_transfer_lines (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    stock_transfer_id UUID REFERENCES stock_transfers(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id),
    quantity NUMERIC(10, 2) NOT NULL,
    unit TEXT NOT NULL
);

-- 13. WASTAGE RECORDS TABLE
CREATE TABLE IF NOT EXISTS wastage_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    record_number TEXT UNIQUE NOT NULL,
    product_id UUID REFERENCES products(id),
    outlet_id UUID REFERENCES outlets(id),
    quantity NUMERIC(10, 2) NOT NULL,
    unit TEXT NOT NULL,
    reason TEXT NOT NULL CHECK (reason IN ('Broken bottles', 'Spillage', 'Expired beverages', 'Complimentary consumption', 'Incorrect preparation', 'Other operational losses')),
    date DATE NOT NULL,
    employee_id UUID REFERENCES profiles(id),
    supervisor_approval TEXT NOT NULL CHECK (supervisor_approval IN ('Pending', 'Approved', 'Rejected')) DEFAULT 'Pending',
    financial_loss NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 14. PURCHASE REQUISITIONS TABLE
CREATE TABLE IF NOT EXISTS purchase_requisitions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    req_number TEXT UNIQUE NOT NULL,
    date_created DATE NOT NULL,
    outlet_id UUID REFERENCES outlets(id),
    created_by UUID REFERENCES profiles(id),
    status TEXT NOT NULL CHECK (status IN ('Draft', 'Submitted', 'Approved', 'Rejected')) DEFAULT 'Draft',
    approved_by UUID REFERENCES profiles(id),
    approved_at TIMESTAMPTZ,
    total_estimated_cost NUMERIC(10, 2) DEFAULT 0.00,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 15. PURCHASE REQUISITION LINES TABLE
CREATE TABLE IF NOT EXISTS purchase_requisition_lines (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    requisition_id UUID REFERENCES purchase_requisitions(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id),
    current_stock NUMERIC(10, 2) NOT NULL,
    min_par_level NUMERIC(10, 2) NOT NULL,
    max_par_level NUMERIC(10, 2) NOT NULL,
    recommended_qty NUMERIC(10, 2) NOT NULL,
    requested_qty NUMERIC(10, 2) NOT NULL,
    unit_cost NUMERIC(10, 2) NOT NULL,
    estimated_total NUMERIC(10, 2) NOT NULL
);

-- 16. AUDIT LOGS TABLE
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    user_id UUID REFERENCES profiles(id),
    user_email TEXT,
    role TEXT,
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id TEXT,
    details TEXT
);

-- ====================================================================
-- ROW LEVEL SECURITY POLICIES (RLS)
-- ====================================================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE outlets ENABLE ROW LEVEL SECURITY;
ALTER TABLE beverage_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE par_levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_counts ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_count_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE goods_receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE goods_receipt_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_transfers ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_transfer_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE wastage_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_requisitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_requisition_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Read policies: Authenticated users can view master reference tables
CREATE POLICY "Allow read products to all auth" ON products FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow read outlets to all auth" ON outlets FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow read par_levels to all auth" ON par_levels FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow read inventory_balances to all auth" ON inventory_balances FOR SELECT TO authenticated USING (true);

-- Admin & Bar Manager: Full access policies
CREATE POLICY "Admin full access products" ON products FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('ADMIN', 'BAR_MANAGER'))
);

CREATE POLICY "Admin & Manager full par_levels" ON par_levels FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('ADMIN', 'BAR_MANAGER'))
);

-- Supervisor & Bartender: Count and transaction entry
CREATE POLICY "Allow stock count entry" ON stock_counts FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow stock count select" ON stock_counts FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow stock transfer entry" ON stock_transfers FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow stock transfer select" ON stock_transfers FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow wastage entry" ON wastage_records FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow wastage select" ON wastage_records FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow requisition entry" ON purchase_requisitions FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow requisition select" ON purchase_requisitions FOR SELECT TO authenticated USING (true);

-- Outlets Seed Data
INSERT INTO outlets (name, code, description) VALUES
('W Lounge', 'W-LNG', 'Primary luxury lounge and cocktail bar'),
('Main Bar', 'BAR-MAIN', 'Central hotel lobby and main bar'),
('Pool Bar', 'BAR-POOL', 'Wet Deck resort and poolside bar'),
('Restaurant Bar', 'BAR-REST', 'Fine dining restaurant bar'),
('Banquet Bar', 'BAR-BNQ', 'Events, gala dinners and banquet bar'),
('Executive Lounge', 'EX-LNG', 'VIP and club level executive lounge'),
('Central Beverage Store', 'STORE-CTR', 'Main hotel beverage warehousing and cellar')
ON CONFLICT (name) DO NOTHING;

-- SEED MASTER BEVERAGE INVENTORY (All 235 PDF Items + 14 Category H Items)
INSERT INTO products (sno, item_code, name, category, subcategory, packaging_size, packaging_description, unit, rate, value, is_additional) VALUES (1, 'Z00013214', 'Fly Craft Non-Alcoholic Malt Beer 330ML', 'Beers and Non-Alcoholic Beer', 'Non-Alcoholic Beer', '330ML', '330ML/Btl', 'Bottle', 30.0, 30.0, FALSE) ON CONFLICT (item_code) DO NOTHING;
INSERT INTO products (sno, item_code, name, category, subcategory, packaging_size, packaging_description, unit, rate, value, is_additional) VALUES (2, 'Z00013149', 'Non Alcoholic-Sangre De Toro White Wine 750ML #45945', 'White Wines', 'White Wine', '750ML', '750Ml/Btl', 'Bottle', 0.1, 0.1, FALSE) ON CONFLICT (item_code) DO NOTHING;
INSERT INTO products (sno, item_code, name, category, subcategory, packaging_size, packaging_description, unit, rate, value, is_additional) VALUES (3, 'Z00013148', 'Non Alcoholic-Sangre De Toro Red Wine 750ML #45944', 'Red Wines', 'Red Wine', '750ML', '750ML/Btl', 'Bottle', 0.1, 0.1, FALSE) ON CONFLICT (item_code) DO NOTHING;
INSERT INTO products (sno, item_code, name, category, subcategory, packaging_size, packaging_description, unit, rate, value, is_additional) VALUES (4, 'Z00013136', 'Vintense Prestige Rose 750ML #10130117', 'Sparkling Wines and Champagne', 'Sparkling Rose', '750ML', '750ML/Btl', 'Bottle', 1.0, 1.0, FALSE) ON CONFLICT (item_code) DO NOTHING;
INSERT INTO products (sno, item_code, name, category, subcategory, packaging_size, packaging_description, unit, rate, value, is_additional) VALUES (5, 'Z00013078', 'Cocchi Americano Vermouth 750ML #34848', 'Liqueurs and Aperitifs', 'Vermouth', '750ML', '750ML/Btl', 'Can', 0.1, 0.1, FALSE) ON CONFLICT (item_code) DO NOTHING;
INSERT INTO products (sno, item_code, name, category, subcategory, packaging_size, packaging_description, unit, rate, value, is_additional) VALUES (6, 'Z00013003', 'Lyres Dark Cane 700Ml #34056', 'Spirits', 'Dark Rum', '700ML', '700ML/Btl', 'Can', 1.0, 1.0, FALSE) ON CONFLICT (item_code) DO NOTHING;
INSERT INTO products (sno, item_code, name, category, subcategory, packaging_size, packaging_description, unit, rate, value, is_additional) VALUES (7, 'Z00013000', 'Lyres American Malt 700ML #34053', 'Spirits', 'Bourbon Whiskey', '700ML', '700ML/Btl', 'Can', 1.0, 1.0, FALSE) ON CONFLICT (item_code) DO NOTHING;
INSERT INTO products (sno, item_code, name, category, subcategory, packaging_size, packaging_description, unit, rate, value, is_additional) VALUES (8, 'Z00012959', 'Altre Stelle Rosso 750ML #42210', 'Red Wines', 'Red Wine', '750ML', '750ML/Btl', 'Bottle', 0.1, 0.1, FALSE) ON CONFLICT (item_code) DO NOTHING;
INSERT INTO products (sno, item_code, name, category, subcategory, packaging_size, packaging_description, unit, rate, value, is_additional) VALUES (9, 'Z00012904', 'Giffard Bitter Orange 700ML #99820115', 'Liqueurs and Aperitifs', 'Orange Liqueurs', '700ML', '700ML/Btl', 'Bottle', 0.1, 0.1, FALSE) ON CONFLICT (item_code) DO NOTHING;
INSERT INTO products (sno, item_code, name, category, subcategory, packaging_size, packaging_description, unit, rate, value, is_additional) VALUES (10, 'Z00012389', 'Fior di Limoncello 700ML #98680044', 'Liqueurs and Aperitifs', 'Fruit Liqueurs', '700ML', '700ML/Btl', 'Bottle', 1.0, 1.0, FALSE) ON CONFLICT (item_code) DO NOTHING;
INSERT INTO products (sno, item_code, name, category, subcategory, packaging_size, packaging_description, unit, rate, value, is_additional) VALUES (11, 'Z00012201', 'Metaxa 12 Stars 700ML # 90820166', 'Spirits', 'Brandy', '700ML', '700ML/Btl', 'Bottle', 0.1, 0.1, FALSE) ON CONFLICT (item_code) DO NOTHING;
INSERT INTO products (sno, item_code, name, category, subcategory, packaging_size, packaging_description, unit, rate, value, is_additional) VALUES (12, 'Z00012062', 'Maraschino Luxardo  70CL #40890', 'Liqueurs and Aperitifs', 'Fruit Liqueurs', '70CL', '700ML/Btl', 'Bottle', 1.0, 1.0, FALSE) ON CONFLICT (item_code) DO NOTHING;
INSERT INTO products (sno, item_code, name, category, subcategory, packaging_size, packaging_description, unit, rate, value, is_additional) VALUES (13, 'Z00011977', 'Woodford Double Oaked 700ML #28136', 'Spirits', 'Bourbon Whiskey', '700ML', '700ML/Btl', 'Bottle', 0.1, 0.1, FALSE) ON CONFLICT (item_code) DO NOTHING;
INSERT INTO products (sno, item_code, name, category, subcategory, packaging_size, packaging_description, unit, rate, value, is_additional) VALUES (14, 'Z00011975', 'Jack Daniel s Tennessee Rye 750ML #25614', 'Spirits', 'Bourbon Whiskey', '750ML', '750ML/Btl', 'Bottle', 2.0, 2.0, FALSE) ON CONFLICT (item_code) DO NOTHING;
INSERT INTO products (sno, item_code, name, category, subcategory, packaging_size, packaging_description, unit, rate, value, is_additional) VALUES (15, 'Z00011909', 'Rinomato Bitter Scuro 1LTR #91090831', 'Liqueurs and Aperitifs', 'Bitters', '1LTR', '1LTR/Btl', 'Bottle', 0.1, 0.1, FALSE) ON CONFLICT (item_code) DO NOTHING;
INSERT INTO products (sno, item_code, name, category, subcategory, packaging_size, packaging_description, unit, rate, value, is_additional) VALUES (16, 'Z00011846', 'Villa Domiziano Chianti DOCG 750ML #37498SI', 'Red Wines', 'Red Wine', '750ML', '750ML/Btl', 'Bottle', 2.0, 2.0, FALSE) ON CONFLICT (item_code) DO NOTHING;
INSERT INTO products (sno, item_code, name, category, subcategory, packaging_size, packaging_description, unit, rate, value, is_additional) VALUES (17, 'Z00011827', 'La Petite Gargote Cabernet Sauvignon 750ML #26939', 'Red Wines', 'Red Wine', '750ML', '750ML/Btl', 'Bottle', 6.0, 6.0, FALSE) ON CONFLICT (item_code) DO NOTHING;
INSERT INTO products (sno, item_code, name, category, subcategory, packaging_size, packaging_description, unit, rate, value, is_additional) VALUES (18, 'Z00011618', 'Mezcal Verde Amaras 700ML #35997', 'Spirits', 'Mezcal', '700ML', 'Bot/70Cl', 'Bottle', 2.0, 2.0, FALSE) ON CONFLICT (item_code) DO NOTHING;
INSERT INTO products (sno, item_code, name, category, subcategory, packaging_size, packaging_description, unit, rate, value, is_additional) VALUES (19, 'Z00011492', 'Ventiterre Soave DOC 750ML #8734', 'White Wines', 'White Wine', '750ML', '750ML/Btl', 'Bottle', 4.0, 4.0, FALSE) ON CONFLICT (item_code) DO NOTHING;
INSERT INTO products (sno, item_code, name, category, subcategory, packaging_size, packaging_description, unit, rate, value, is_additional) VALUES (20, 'Z00011212', 'Marius Grenache Syrah 750ML #12864', 'Red Wines', 'Red Wine', '750ML', '750ML/Btl', 'Bottle', 0.1, 0.1, FALSE) ON CONFLICT (item_code) DO NOTHING;
INSERT INTO products (sno, item_code, name, category, subcategory, packaging_size, packaging_description, unit, rate, value, is_additional) VALUES (21, 'Z00011157', 'Birra Moretti 8Ltr Blade #34630 (WTD)', 'Beers and Non-Alcoholic Beer', 'Draft Beer', '8LTR', '8Ltr/Keg', 'Keg', 4.0, 4.0, FALSE) ON CONFLICT (item_code) DO NOTHING;
INSERT INTO products (sno, item_code, name, category, subcategory, packaging_size, packaging_description, unit, rate, value, is_additional) VALUES (22, 'Z00010994', 'Casamigos Blanco 700ML #90730337', 'Spirits', 'Tequila Blanco', '700ML', '700ML/Btl', 'Bottle', 1.0, 1.0, FALSE) ON CONFLICT (item_code) DO NOTHING;
INSERT INTO products (sno, item_code, name, category, subcategory, packaging_size, packaging_description, unit, rate, value, is_additional) VALUES (23, 'Z00010694', 'Marius Rose 750ML #15408', 'Rose Wines', 'Rose Wine', '750ML', '750ML/Btl', 'Bottle', 2.0, 2.0, FALSE) ON CONFLICT (item_code) DO NOTHING;
INSERT INTO products (sno, item_code, name, category, subcategory, packaging_size, packaging_description, unit, rate, value, is_additional) VALUES (24, 'Z00010589', 'Amaro Montenegro 23% 1LTR #32724', 'Liqueurs and Aperitifs', 'Herbal Liqueurs', '1LTR', '1LTR/Btl', 'Bottle', 1.0, 1.0, FALSE) ON CONFLICT (item_code) DO NOTHING;
INSERT INTO products (sno, item_code, name, category, subcategory, packaging_size, packaging_description, unit, rate, value, is_additional) VALUES (25, 'Z00009991', 'Kahlua Coffee Liquer 700Ml #35914', 'Liqueurs and Aperitifs', 'Coffee Liqueurs', '700ML', '700ML/Btl', 'Bottle', 3.0, 3.0, FALSE) ON CONFLICT (item_code) DO NOTHING;
INSERT INTO products (sno, item_code, name, category, subcategory, packaging_size, packaging_description, unit, rate, value, is_additional) VALUES (26, 'Z00009881', 'Cuvee Speciale Rose Barton N Guestier #96560007', 'Rose Wines', 'Rose Wine', '750ML', '750ML/Btl', 'Bottle', 0.1, 0.1, FALSE) ON CONFLICT (item_code) DO NOTHING;
INSERT INTO products (sno, item_code, name, category, subcategory, packaging_size, packaging_description, unit, rate, value, is_additional) VALUES (27, 'Z00009853', 'Italicus Rosolio Di Bergamotto  #22697', 'Liqueurs and Aperitifs', 'Aperitifs', '700ML', '700ML/Btl', 'Bottle', 1.0, 1.0, FALSE) ON CONFLICT (item_code) DO NOTHING;
INSERT INTO products (sno, item_code, name, category, subcategory, packaging_size, packaging_description, unit, rate, value, is_additional) VALUES (28, 'Z00009813', 'Tito s Vodka 750ml #18120 (W-TD)', 'Spirits', 'Vodka', '750ML', '750ML/Btl', 'Bottle', 2.0, 2.0, FALSE) ON CONFLICT (item_code) DO NOTHING;
INSERT INTO products (sno, item_code, name, category, subcategory, packaging_size, packaging_description, unit, rate, value, is_additional) VALUES (29, 'Z00009811', 'Four Roses Yellow Label 70CL #14803', 'Spirits', 'Bourbon Whiskey', '70CL', '700ML/Btl', 'Bottle', 1.0, 1.0, FALSE) ON CONFLICT (item_code) DO NOTHING;
INSERT INTO products (sno, item_code, name, category, subcategory, packaging_size, packaging_description, unit, rate, value, is_additional) VALUES (30, 'Z00009485', 'Roku Gin 1LTR #90720183', 'Spirits', 'Gin', '1LTR', '1000ML/Btl', 'Bottle', 0.1, 0.1, FALSE) ON CONFLICT (item_code) DO NOTHING;
INSERT INTO products (sno, item_code, name, category, subcategory, packaging_size, packaging_description, unit, rate, value, is_additional) VALUES (31, 'Z00009153', 'Stately Steenberg Cab/Shiraz #91090674', 'Red Wines', 'Red Wine', '750ML', '750ML/Btl', 'Bottle', 1.0, 1.0, FALSE) ON CONFLICT (item_code) DO NOTHING;
INSERT INTO products (sno, item_code, name, category, subcategory, packaging_size, packaging_description, unit, rate, value, is_additional) VALUES (32, 'Z00009151', 'Alamos Catena Malbec 75CL #96230149 (W-TD)', 'Red Wines', 'Red Wine', '75CL', '750ML/Btl', 'Bottle', 5.0, 5.0, FALSE) ON CONFLICT (item_code) DO NOTHING;
INSERT INTO products (sno, item_code, name, category, subcategory, packaging_size, packaging_description, unit, rate, value, is_additional) VALUES (33, 'Z00009149', 'Albarino Pazo De Senorans 750ML  #95720583', 'White Wines', 'White Wine', '750ML', '750ML/Btl', 'Bottle', 2.0, 2.0, FALSE) ON CONFLICT (item_code) DO NOTHING;
INSERT INTO products (sno, item_code, name, category, subcategory, packaging_size, packaging_description, unit, rate, value, is_additional) VALUES (34, 'Z00009147', 'Terrazas de los Andes Chard #E038604-6', 'White Wines', 'White Wine', '750ML', '750ML/Btl', 'Bottle', 2.0, 2.0, FALSE) ON CONFLICT (item_code) DO NOTHING;
INSERT INTO products (sno, item_code, name, category, subcategory, packaging_size, packaging_description, unit, rate, value, is_additional) VALUES (35, 'Z00009145', 'Saumur Blanc, Langlois-Chateau #99180327', 'White Wines', 'White Wine', '750ML', '750ML/Btl', 'Bottle', 2.0, 2.0, FALSE) ON CONFLICT (item_code) DO NOTHING;
INSERT INTO products (sno, item_code, name, category, subcategory, packaging_size, packaging_description, unit, rate, value, is_additional) VALUES (36, 'Z00009141', 'Bourgogne Pinot Noir La Vignee 750ML #95570092', 'Red Wines', 'Red Wine', '750ML', '750ML/Btl', 'Bottle', 2.0, 2.0, FALSE) ON CONFLICT (item_code) DO NOTHING;
INSERT INTO products (sno, item_code, name, category, subcategory, packaging_size, packaging_description, unit, rate, value, is_additional) VALUES (37, 'Z00009139', '400 CONEJOS MEZCAL #96260077', 'Spirits', 'Mezcal', '700ML', '700ML/Btl', 'Bottle', 1.0, 1.0, FALSE) ON CONFLICT (item_code) DO NOTHING;
INSERT INTO products (sno, item_code, name, category, subcategory, packaging_size, packaging_description, unit, rate, value, is_additional) VALUES (38, 'Z00009138', 'Casamigos Anejo700ml #90730339', 'Spirits', 'Tequila Anejo', '700ML', '700ML/Btl', 'Bottle', 1.0, 1.0, FALSE) ON CONFLICT (item_code) DO NOTHING;
INSERT INTO products (sno, item_code, name, category, subcategory, packaging_size, packaging_description, unit, rate, value, is_additional) VALUES (39, 'Z00009137', 'Altos Blanco 70cl #31814', 'Spirits', 'Tequila Blanco', '70CL', '700ML/Btl', 'Bottle', 6.0, 6.0, FALSE) ON CONFLICT (item_code) DO NOTHING;
INSERT INTO products (sno, item_code, name, category, subcategory, packaging_size, packaging_description, unit, rate, value, is_additional) VALUES (40, 'Z00009136', 'Royal Salute 21 Year Old #17857', 'Spirits', 'Scotch Whisky', '700ML', '700ML/Btl', 'Bottle', 1.0, 1.0, FALSE) ON CONFLICT (item_code) DO NOTHING;
INSERT INTO products (sno, item_code, name, category, subcategory, packaging_size, packaging_description, unit, rate, value, is_additional) VALUES (41, 'Z00009135', 'Four Roses Single Barrel #13037', 'Spirits', 'Bourbon Whiskey', '700ML', '700ML/Btl', 'Bottle', 1.0, 1.0, FALSE) ON CONFLICT (item_code) DO NOTHING;
INSERT INTO products (sno, item_code, name, category, subcategory, packaging_size, packaging_description, unit, rate, value, is_additional) VALUES (42, 'Z00008741', 'Perrier Jouet Grand Brut 750ML  #11297 (W-TD)', 'Sparkling Wines and Champagne', 'Champagne', '750ML', '750ML/Btl', 'Bottle', 3.0, 3.0, FALSE) ON CONFLICT (item_code) DO NOTHING;
INSERT INTO products (sno, item_code, name, category, subcategory, packaging_size, packaging_description, unit, rate, value, is_additional) VALUES (43, 'Z00008619', 'Birra Moretti 330ML Bottle #9835 (WTD)', 'Beers and Non-Alcoholic Beer', 'Bottled Beer', '330ML', '330ML/Btl', 'Bottle', 72.0, 72.0, FALSE) ON CONFLICT (item_code) DO NOTHING;
INSERT INTO products (sno, item_code, name, category, subcategory, packaging_size, packaging_description, unit, rate, value, is_additional) VALUES (44, 'Z00008453', 'Mirabeau Provence Rose 75CL #15028(W-TD)', 'Rose Wines', 'Rose Wine', '75CL', '750ML/Btl', 'Bottle', 3.0, 3.0, FALSE) ON CONFLICT (item_code) DO NOTHING;
INSERT INTO products (sno, item_code, name, category, subcategory, packaging_size, packaging_description, unit, rate, value, is_additional) VALUES (45, 'Z00008444', 'Se Busca Anejo 70CL #90660087', 'Spirits', 'Mezcal', '70CL', '70CL/Bot', 'Bottle', 1.0, 1.0, FALSE) ON CONFLICT (item_code) DO NOTHING;
INSERT INTO products (sno, item_code, name, category, subcategory, packaging_size, packaging_description, unit, rate, value, is_additional) VALUES (46, 'Z00008443', 'Se Busca Reposado 700ML #90660086', 'Spirits', 'Mezcal', '700ML', '700ML/BOT', 'Bottle', 1.0, 1.0, FALSE) ON CONFLICT (item_code) DO NOTHING;
INSERT INTO products (sno, item_code, name, category, subcategory, packaging_size, packaging_description, unit, rate, value, is_additional) VALUES (47, 'Z00008441', 'Clase Azul Anejo 70CL #91090604', 'Spirits', 'Tequila Anejo', '70CL', '700ML/Btl', 'Bottle', 1.0, 1.0, FALSE) ON CONFLICT (item_code) DO NOTHING;
INSERT INTO products (sno, item_code, name, category, subcategory, packaging_size, packaging_description, unit, rate, value, is_additional) VALUES (48, 'Z00008414', 'Del Maguey Vida Mezcal 70CL #28224', 'Spirits', 'Mezcal', '70CL', '700ML/Btl', 'Bottle', 4.0, 4.0, FALSE) ON CONFLICT (item_code) DO NOTHING;
INSERT INTO products (sno, item_code, name, category, subcategory, packaging_size, packaging_description, unit, rate, value, is_additional) VALUES (49, 'Z00008406', 'Hibiki JAP Harmony 70CL #90720133', 'Spirits', 'Whisky and Whiskey', '70CL', '700ML/Btl', 'Bottle', 2.0, 2.0, FALSE) ON CONFLICT (item_code) DO NOTHING;
INSERT INTO products (sno, item_code, name, category, subcategory, packaging_size, packaging_description, unit, rate, value, is_additional) VALUES (50, 'Z00008405', 'Suze 70CL #27677', 'Liqueurs and Aperitifs', 'Aperitifs', '70CL', '700ML/Btl', 'Bottle', 1.0, 1.0, FALSE) ON CONFLICT (item_code) DO NOTHING;
INSERT INTO products (sno, item_code, name, category, subcategory, packaging_size, packaging_description, unit, rate, value, is_additional) VALUES (51, 'Z00008364', 'Diplomatico Mantuano 700ML #22896', 'Spirits', 'Aged Rum', '700ML', '700ML/BOT', 'Bottle', 0.1, 0.1, FALSE) ON CONFLICT (item_code) DO NOTHING;
INSERT INTO products (sno, item_code, name, category, subcategory, packaging_size, packaging_description, unit, rate, value, is_additional) VALUES (52, 'Z00008344', 'Lillet Blanc 750ML #13049', 'Liqueurs and Aperitifs', 'Vermouth', '750ML', '750ML/BOT', 'Bottle', 1.0, 1.0, FALSE) ON CONFLICT (item_code) DO NOTHING;
INSERT INTO products (sno, item_code, name, category, subcategory, packaging_size, packaging_description, unit, rate, value, is_additional) VALUES (53, 'Z00008309', 'The Macallan Double Cask 18Y  70CL #30004', 'Spirits', 'Scotch Whisky', '70CL', '700ML/Btl', 'Bottle', 1.0, 1.0, FALSE) ON CONFLICT (item_code) DO NOTHING;
INSERT INTO products (sno, item_code, name, category, subcategory, packaging_size, packaging_description, unit, rate, value, is_additional) VALUES (54, 'Z00008308', 'The Macallan Double Cask 15Y  70CL #28730', 'Spirits', 'Scotch Whisky', '70CL', '700ML/Btl', 'Bottle', 0.1, 0.1, FALSE) ON CONFLICT (item_code) DO NOTHING;
INSERT INTO products (sno, item_code, name, category, subcategory, packaging_size, packaging_description, unit, rate, value, is_additional) VALUES (55, 'Z00008307', 'The Macallan Double Cask 12Y 70CL #20807', 'Spirits', 'Scotch Whisky', '70CL', '700ML/Btl', 'Bottle', 2.0, 2.0, FALSE) ON CONFLICT (item_code) DO NOTHING;
INSERT INTO products (sno, item_code, name, category, subcategory, packaging_size, packaging_description, unit, rate, value, is_additional) VALUES (56, 'Z00008306', 'Glenmorangie X 70CL #31149', 'Spirits', 'Scotch Whisky', '70CL', '700ML/Btl', 'Bottle', 1.0, 1.0, FALSE) ON CONFLICT (item_code) DO NOTHING;
INSERT INTO products (sno, item_code, name, category, subcategory, packaging_size, packaging_description, unit, rate, value, is_additional) VALUES (57, 'Z00008299', 'Bitter Truth Chocolate 20CL #99250002', 'Liqueurs and Aperitifs', 'Bitters', '20CL', '200ML/Btl', 'Bottle', 1.0, 1.0, FALSE) ON CONFLICT (item_code) DO NOTHING;
INSERT INTO products (sno, item_code, name, category, subcategory, packaging_size, packaging_description, unit, rate, value, is_additional) VALUES (58, 'Z00008296', 'Bitter Truth Peach 20CL #99250018', 'Liqueurs and Aperitifs', 'Bitters', '20CL', '200ML/Btl', 'Bottle', 1.0, 1.0, FALSE) ON CONFLICT (item_code) DO NOTHING;
INSERT INTO products (sno, item_code, name, category, subcategory, packaging_size, packaging_description, unit, rate, value, is_additional) VALUES (59, 'Z00008287', 'Clase Azul Reposado 700ML #91090602', 'Spirits', 'Tequila Reposado', '700ML', '700ML/BOT', 'Bottle', 1.0, 1.0, FALSE) ON CONFLICT (item_code) DO NOTHING;
INSERT INTO products (sno, item_code, name, category, subcategory, packaging_size, packaging_description, unit, rate, value, is_additional) VALUES (60, 'Z00008284', 'Crystalhead Vodka 75CL #91090407', 'Spirits', 'Vodka', '75CL', '750ML/Btl', 'Bottle', 1.0, 1.0, FALSE) ON CONFLICT (item_code) DO NOTHING;
INSERT INTO products (sno, item_code, name, category, subcategory, packaging_size, packaging_description, unit, rate, value, is_additional) VALUES (61, 'Z00008100', 'Zuccardi Serie A Malbec 750ML #12600', 'Red Wines', 'Red Wine', '750ML', '750ML/Btl', 'Bottle', 2.0, 2.0, FALSE) ON CONFLICT (item_code) DO NOTHING;
INSERT INTO products (sno, item_code, name, category, subcategory, packaging_size, packaging_description, unit, rate, value, is_additional) VALUES (62, 'Z00008024', 'Jim Beam Honey 70CL (90720049)', 'Liqueurs and Aperitifs', 'Other Liqueurs', '70CL', '700ML/Btl', 'Bottle', 0.1, 0.1, FALSE) ON CONFLICT (item_code) DO NOTHING;
INSERT INTO products (sno, item_code, name, category, subcategory, packaging_size, packaging_description, unit, rate, value, is_additional) VALUES (63, 'Z00007992', 'St Germain 70Cl#11626', 'Liqueurs and Aperitifs', 'Aperitifs', '70CL', '700ML/Btl', 'Bottle', 2.0, 2.0, FALSE) ON CONFLICT (item_code) DO NOTHING;
INSERT INTO products (sno, item_code, name, category, subcategory, packaging_size, packaging_description, unit, rate, value, is_additional) VALUES (64, 'Z00007830', 'Babydoll Sauv Blanc 75CL #99090010 (W-TD)', 'White Wines', 'White Wine', '75CL', '750ML/Btl', 'Bottle', 9.0, 9.0, FALSE) ON CONFLICT (item_code) DO NOTHING;
INSERT INTO products (sno, item_code, name, category, subcategory, packaging_size, packaging_description, unit, rate, value, is_additional) VALUES (65, 'Z00007596', 'Chablis S/Martin Domaine Laroche 750ML #95170034', 'White Wines', 'White Wine', '750ML', '750ML/Btl', 'Bottle', 2.0, 2.0, FALSE) ON CONFLICT (item_code) DO NOTHING;
INSERT INTO products (sno, item_code, name, category, subcategory, packaging_size, packaging_description, unit, rate, value, is_additional) VALUES (66, 'Z00007543', 'Pinot Grigio Italia White 750ML #95720755', 'White Wines', 'White Wine', '750ML', '750ML/Btl', 'Bottle', 6.0, 6.0, FALSE) ON CONFLICT (item_code) DO NOTHING;
INSERT INTO products (sno, item_code, name, category, subcategory, packaging_size, packaging_description, unit, rate, value, is_additional) VALUES (67, 'Z00007335', 'Santa Caro Vistana Sauv Blanc 750ML #96290062', 'White Wines', 'White Wine', '750ML', '750ML/Btl', 'Bottle', 0.1, 0.1, FALSE) ON CONFLICT (item_code) DO NOTHING;
INSERT INTO products (sno, item_code, name, category, subcategory, packaging_size, packaging_description, unit, rate, value, is_additional) VALUES (68, 'Z00007334', 'Santa Caro Vistana Cab/Sauv 750ML#96290059', 'Red Wines', 'Red Wine', '750ML', '750ML/Btl', 'Bottle', 0.1, 0.1, FALSE) ON CONFLICT (item_code) DO NOTHING;
INSERT INTO products (sno, item_code, name, category, subcategory, packaging_size, packaging_description, unit, rate, value, is_additional) VALUES (69, 'Z00007256', 'Amira Nero D''avola Feudo Butera 750ML #E0162 (LTD)', 'Red Wines', 'Red Wine', '750ML', '750ML/Btl', 'Bottle', 2.0, 2.0, FALSE) ON CONFLICT (item_code) DO NOTHING;
INSERT INTO products (sno, item_code, name, category, subcategory, packaging_size, packaging_description, unit, rate, value, is_additional) VALUES (70, 'Z00006659', 'Da Luca Pinot Grigio 750ML #95160013 (WTD)', 'White Wines', 'White Wine', '750ML', '750ML/Btl', 'Bottle', 9.0, 9.0, FALSE) ON CONFLICT (item_code) DO NOTHING;
INSERT INTO products (sno, item_code, name, category, subcategory, packaging_size, packaging_description, unit, rate, value, is_additional) VALUES (71, 'Z00006171', 'Beluga Noble Vodka 700ml #91090199(LTD)', 'Spirits', 'Vodka', '700ML', '700ML/Btl', 'Bottle', 2.0, 2.0, FALSE) ON CONFLICT (item_code) DO NOTHING;
INSERT INTO products (sno, item_code, name, category, subcategory, packaging_size, packaging_description, unit, rate, value, is_additional) VALUES (72, 'Z00006088', 'Da Luca Sparkling Rose NV 750ML #95160033 (WTD)', 'Sparkling Wines and Champagne', 'Sparkling Rose', '750ML', '750ML/Btl', 'Bottle', 6.0, 6.0, FALSE) ON CONFLICT (item_code) DO NOTHING;
INSERT INTO products (sno, item_code, name, category, subcategory, packaging_size, packaging_description, unit, rate, value, is_additional) VALUES (73, 'Z00006025', 'Roku Gin 70CL #90720151', 'Spirits', 'Gin', '70CL', '700Ml/Btl', 'Bottle', 2.0, 2.0, FALSE) ON CONFLICT (item_code) DO NOTHING;
INSERT INTO products (sno, item_code, name, category, subcategory, packaging_size, packaging_description, unit, rate, value, is_additional) VALUES (74, 'Z00005946', 'By Ott Rose Domaines Ott 750ML #95700102', 'Rose Wines', 'Rose Wine', '750ML', '750ML/Btl', 'Bottle', 2.0, 2.0, FALSE) ON CONFLICT (item_code) DO NOTHING;
INSERT INTO products (sno, item_code, name, category, subcategory, packaging_size, packaging_description, unit, rate, value, is_additional) VALUES (75, 'Z00005888', 'Tequila Reserve 1800 Silver 75CL #96260013', 'Spirits', 'Tequila Blanco', '75CL', '750ML/Btl', 'Bottle', 1.0, 1.0, FALSE) ON CONFLICT (item_code) DO NOTHING;
INSERT INTO products (sno, item_code, name, category, subcategory, packaging_size, packaging_description, unit, rate, value, is_additional) VALUES (76, 'Z00005766', 'Caourunn Gin 70CL #19020', 'Spirits', 'Gin', '70CL', '700ML\Btl', 'Bottle', 1.0, 1.0, FALSE) ON CONFLICT (item_code) DO NOTHING;
INSERT INTO products (sno, item_code, name, category, subcategory, packaging_size, packaging_description, unit, rate, value, is_additional) VALUES (77, 'Z00005565', 'Malfy Original Gin 750ml #31807', 'Spirits', 'Gin', '750ML', '750ml/Btl', 'Bottle', 3.0, 3.0, FALSE) ON CONFLICT (item_code) DO NOTHING;
INSERT INTO products (sno, item_code, name, category, subcategory, packaging_size, packaging_description, unit, rate, value, is_additional) VALUES (78, 'Z00005528', 'De Kuyper Creme De Cassis 700Ml #99190014', 'Liqueurs and Aperitifs', 'Fruit Liqueurs', '700ML', '700ML/Btl', 'Bottle', 1.0, 1.0, FALSE) ON CONFLICT (item_code) DO NOTHING;
INSERT INTO products (sno, item_code, name, category, subcategory, packaging_size, packaging_description, unit, rate, value, is_additional) VALUES (79, 'Z00005499', 'Yeni Raki 700Ml #98700011', 'Liqueurs and Aperitifs', 'Aperitifs', '700ML', '700Ml/Btl', 'Bottle', 0.1, 0.1, FALSE) ON CONFLICT (item_code) DO NOTHING;
INSERT INTO products (sno, item_code, name, category, subcategory, packaging_size, packaging_description, unit, rate, value, is_additional) VALUES (80, 'Z00005454', 'Torrese Pazo Das Bruxas 75CL #23052 (W-TD)', 'White Wines', 'White Wine', '75CL', '750ML/Btl', 'Bottle', 2.0, 2.0, FALSE) ON CONFLICT (item_code) DO NOTHING;
INSERT INTO products (sno, item_code, name, category, subcategory, packaging_size, packaging_description, unit, rate, value, is_additional) VALUES (81, 'Z00005438', 'Stolichanaya Premium 750ML #90660016 (WTD)', 'Spirits', 'Vodka', '750ML', '750ML/Btl', 'Bottle', 6.0, 6.0, FALSE) ON CONFLICT (item_code) DO NOTHING;
INSERT INTO products (sno, item_code, name, category, subcategory, packaging_size, packaging_description, unit, rate, value, is_additional) VALUES (82, 'Z00005368', 'Italia Pisco 70CL #91090520', 'Spirits', 'Pisco', '70CL', '700Ml/Btl', 'Bottle', 2.0, 2.0, FALSE) ON CONFLICT (item_code) DO NOTHING;
INSERT INTO products (sno, item_code, name, category, subcategory, packaging_size, packaging_description, unit, rate, value, is_additional) VALUES (83, 'Z00005227', 'Minuty M de Minuty 750ML #10839 (WTD)', 'Rose Wines', 'Rose Wine', '750ML', '750ML/Btl', 'Bottle', 5.0, 5.0, FALSE) ON CONFLICT (item_code) DO NOTHING;
INSERT INTO products (sno, item_code, name, category, subcategory, packaging_size, packaging_description, unit, rate, value, is_additional) VALUES (84, 'Z00005224', 'La Petite Gargote Rose 750ML #26938', 'Rose Wines', 'Rose Wine', '750ML', '750Ml/Btl', 'Bottle', 8.0, 8.0, FALSE) ON CONFLICT (item_code) DO NOTHING;
INSERT INTO products (sno, item_code, name, category, subcategory, packaging_size, packaging_description, unit, rate, value, is_additional) VALUES (85, 'Z00005196', 'Sipsmith London Dry Gin 70CL #90720142', 'Spirits', 'Gin', '70CL', '700ML/Btl', 'Bottle', 2.0, 2.0, FALSE) ON CONFLICT (item_code) DO NOTHING;
INSERT INTO products (sno, item_code, name, category, subcategory, packaging_size, packaging_description, unit, rate, value, is_additional) VALUES (86, 'Z00005180', 'Monkey Shoulder 70CL #90580029', 'Spirits', 'Scotch Whisky', '70CL', '700ML/Btl', 'Bottle', 2.0, 2.0, FALSE) ON CONFLICT (item_code) DO NOTHING;
INSERT INTO products (sno, item_code, name, category, subcategory, packaging_size, packaging_description, unit, rate, value, is_additional) VALUES (87, 'Z00004793', 'Mancino Bianco 750ML #91090282', 'Liqueurs and Aperitifs', 'Vermouth', '750ML', '750Ml/Btl', 'Bottle', 1.0, 1.0, FALSE) ON CONFLICT (item_code) DO NOTHING;
INSERT INTO products (sno, item_code, name, category, subcategory, packaging_size, packaging_description, unit, rate, value, is_additional) VALUES (88, 'Z00004792', 'Rinomato Aperivito Deciso 100Cl #91091342', 'Liqueurs and Aperitifs', 'Bitters', '100CL', '1 Ltr/Btl', 'Bottle', 1.0, 1.0, FALSE) ON CONFLICT (item_code) DO NOTHING;
INSERT INTO products (sno, item_code, name, category, subcategory, packaging_size, packaging_description, unit, rate, value, is_additional) VALUES (89, 'Z00004700', 'Monkey 47 Gin 50CL #20842', 'Spirits', 'Gin', '50CL', '500ML/Btl', 'Bottle', 3.0, 3.0, FALSE) ON CONFLICT (item_code) DO NOTHING;
INSERT INTO products (sno, item_code, name, category, subcategory, packaging_size, packaging_description, unit, rate, value, is_additional) VALUES (90, 'Z00004471', 'Torres Sangre de Toro Verdejo 75CL #20762(WTD)', 'White Wines', 'White Wine', '75CL', '750ML BOT', 'Bottle', 1.0, 1.0, FALSE) ON CONFLICT (item_code) DO NOTHING;
INSERT INTO products (sno, item_code, name, category, subcategory, packaging_size, packaging_description, unit, rate, value, is_additional) VALUES (91, 'Z00004450', 'Jameson Black Barrel Select Reserve 700ML #17854', 'Spirits', 'Irish Whiskey', '700ML', '700Ml/Btl', 'Bottle', 1.0, 1.0, FALSE) ON CONFLICT (item_code) DO NOTHING;
INSERT INTO products (sno, item_code, name, category, subcategory, packaging_size, packaging_description, unit, rate, value, is_additional) VALUES (92, 'Z00004439', 'Mancino Rosso Vermouth 750ml #91090283', 'Liqueurs and Aperitifs', 'Vermouth', '750ML', '750ML/Btl', 'Bottle', 5.0, 5.0, FALSE) ON CONFLICT (item_code) DO NOTHING;
INSERT INTO products (sno, item_code, name, category, subcategory, packaging_size, packaging_description, unit, rate, value, is_additional) VALUES (93, 'Z00004435', 'The Botanist Gin 700Ml #90820142', 'Spirits', 'Gin', '700ML', '700Ml/Btl', 'Bottle', 1.0, 1.0, FALSE) ON CONFLICT (item_code) DO NOTHING;
INSERT INTO products (sno, item_code, name, category, subcategory, packaging_size, packaging_description, unit, rate, value, is_additional) VALUES (94, 'Z00004423', 'Tullamore Dew 90580037', 'Spirits', 'Irish Whiskey', '750ML', '750ML/Btl', 'Bottle', 1.0, 1.0, FALSE) ON CONFLICT (item_code) DO NOTHING;
INSERT INTO products (sno, item_code, name, category, subcategory, packaging_size, packaging_description, unit, rate, value, is_additional) VALUES (95, 'Z00004171', 'Bulldog Gin 700 ML #24431 (W-TD)', 'Spirits', 'Gin', '700 ML', '700ML/Btl', 'Bottle', 2.0, 2.0, FALSE) ON CONFLICT (item_code) DO NOTHING;
INSERT INTO products (sno, item_code, name, category, subcategory, packaging_size, packaging_description, unit, rate, value, is_additional) VALUES (96, 'Z00003849', 'Big Easy Chenin Blanc 750ML #96960018 (W-TD)', 'White Wines', 'White Wine', '750ML', '750ML/Btl', 'Bottle', 2.0, 2.0, FALSE) ON CONFLICT (item_code) DO NOTHING;
INSERT INTO products (sno, item_code, name, category, subcategory, packaging_size, packaging_description, unit, rate, value, is_additional) VALUES (97, 'Z00003332', 'Gin Mare 70CL #17995', 'Spirits', 'Gin', '70CL', '700ML/Btl', 'Bottle', 2.0, 2.0, FALSE) ON CONFLICT (item_code) DO NOTHING;
INSERT INTO products (sno, item_code, name, category, subcategory, packaging_size, packaging_description, unit, rate, value, is_additional) VALUES (98, 'Z00003320', 'London No1  70ML #18418', 'Spirits', 'Gin', '70ML', '700ml bott', 'Bottle', 1.0, 1.0, FALSE) ON CONFLICT (item_code) DO NOTHING;
INSERT INTO products (sno, item_code, name, category, subcategory, packaging_size, packaging_description, unit, rate, value, is_additional) VALUES (99, 'Z00003120', 'Jim Beam Apple # 90720055', 'Liqueurs and Aperitifs', 'Other Liqueurs', '750ML', '750Ml/Btl', 'Bottle', 0.1, 0.1, FALSE) ON CONFLICT (item_code) DO NOTHING;
INSERT INTO products (sno, item_code, name, category, subcategory, packaging_size, packaging_description, unit, rate, value, is_additional) VALUES (100, 'Z00002860', 'Cuvee Henri Fabre Rose 750ML #95538067', 'Rose Wines', 'Rose Wine', '750ML', '750ML/Btl', 'Bottle', 1.0, 1.0, FALSE) ON CONFLICT (item_code) DO NOTHING;
INSERT INTO products (sno, item_code, name, category, subcategory, packaging_size, packaging_description, unit, rate, value, is_additional) VALUES (101, 'Z00002781', 'Torres Sangre de Toro Original 75CL  #1955 (WTD)', 'Red Wines', 'Red Wine', '75CL', '750ML/Btl', 'Bottle', 0.1, 0.1, FALSE) ON CONFLICT (item_code) DO NOTHING;
INSERT INTO products (sno, item_code, name, category, subcategory, packaging_size, packaging_description, unit, rate, value, is_additional) VALUES (102, 'Z00002446', 'Gin No 3 London Dry # 11945', 'Spirits', 'Gin', '3 L', '700Ml Bot', 'Bottle', 1.0, 1.0, FALSE) ON CONFLICT (item_code) DO NOTHING;
INSERT INTO products (sno, item_code, name, category, subcategory, packaging_size, packaging_description, unit, rate, value, is_additional) VALUES (103, 'Z00002264', 'Terrazas Andes Reserva Malbec E038704-6', 'Red Wines', 'Red Wine', '750ML', '750Ml Btl', 'Bottle', 2.0, 2.0, FALSE) ON CONFLICT (item_code) DO NOTHING;
INSERT INTO products (sno, item_code, name, category, subcategory, packaging_size, packaging_description, unit, rate, value, is_additional) VALUES (104, 'Z00002191', 'Hon Original Negroni Can 24x200 #99820116', 'Spirits', 'Gin', '200ML', '200ML/Can', 'Can', 2.0, 2.0, FALSE) ON CONFLICT (item_code) DO NOTHING;
INSERT INTO products (sno, item_code, name, category, subcategory, packaging_size, packaging_description, unit, rate, value, is_additional) VALUES (105, 'Z00002189', 'The Bitter Truth Celery 99250001', 'Liqueurs and Aperitifs', 'Bitters', '200ML', '200ML/Btl', 'Bottle', 1.0, 1.0, FALSE) ON CONFLICT (item_code) DO NOTHING;
INSERT INTO products (sno, item_code, name, category, subcategory, packaging_size, packaging_description, unit, rate, value, is_additional) VALUES (106, 'Z00002186', 'Absinthe 69 (99270026)', 'Spirits', 'Other Spirits', '700ML', '700Ml Botl', 'Bottle', 1.0, 1.0, FALSE) ON CONFLICT (item_code) DO NOTHING;
INSERT INTO products (sno, item_code, name, category, subcategory, packaging_size, packaging_description, unit, rate, value, is_additional) VALUES (107, 'Z00001684', 'De Kuyper  Passion Fruit #99190029', 'Liqueurs and Aperitifs', 'Fruit Liqueurs', '700ML', '700Ml/Btl', 'Bottle', 1.0, 1.0, FALSE) ON CONFLICT (item_code) DO NOTHING;
INSERT INTO products (sno, item_code, name, category, subcategory, packaging_size, packaging_description, unit, rate, value, is_additional) VALUES (108, 'Z00001677', 'De Kuyper Creme de Banana 70CL #99190010', 'Liqueurs and Aperitifs', 'Fruit Liqueurs', '70CL', '700Ml/Btl', 'Bottle', 0.1, 0.1, FALSE) ON CONFLICT (item_code) DO NOTHING;
INSERT INTO products (sno, item_code, name, category, subcategory, packaging_size, packaging_description, unit, rate, value, is_additional) VALUES (109, 'Z00001675', 'De Kuyper Apricot Brandy#99190003', 'Liqueurs and Aperitifs', 'Fruit Liqueurs', '700ML', '700Ml/Btl', 'Bottle', 4.0, 4.0, FALSE) ON CONFLICT (item_code) DO NOTHING;
INSERT INTO products (sno, item_code, name, category, subcategory, packaging_size, packaging_description, unit, rate, value, is_additional) VALUES (110, 'Z00001324', 'Veuve Clicquot Rose #084796', 'Sparkling Wines and Champagne', 'Champagne', '750ML', '750ML/Btl', 'Bottle', 1.0, 1.0, FALSE) ON CONFLICT (item_code) DO NOTHING;
INSERT INTO products (sno, item_code, name, category, subcategory, packaging_size, packaging_description, unit, rate, value, is_additional) VALUES (111, 'Z00001155', 'Jack Daniel''s Single Barrel 750ML #74086', 'Spirits', 'Bourbon Whiskey', '750ML', '750Ml/Btl', 'Bottle', 2.0, 2.0, FALSE) ON CONFLICT (item_code) DO NOTHING;
INSERT INTO products (sno, item_code, name, category, subcategory, packaging_size, packaging_description, unit, rate, value, is_additional) VALUES (112, 'Z00001153', 'ELIJAH CRAIG 12 YRS #86286', 'Spirits', 'Bourbon Whiskey', '750ML', '750ML', 'Bottle', 2.0, 2.0, FALSE) ON CONFLICT (item_code) DO NOTHING;
INSERT INTO products (sno, item_code, name, category, subcategory, packaging_size, packaging_description, unit, rate, value, is_additional) VALUES (113, 'Z00000831', 'Carpano Bianco 1Ltr # 99210004', 'Liqueurs and Aperitifs', 'Vermouth', '1LTR', '1 Ltr/Btl', 'Bottle', 2.0, 2.0, FALSE) ON CONFLICT (item_code) DO NOTHING;
INSERT INTO products (sno, item_code, name, category, subcategory, packaging_size, packaging_description, unit, rate, value, is_additional) VALUES (114, 'Z00000830', 'Carpano Classico 1Ltr #99210003', 'Liqueurs and Aperitifs', 'Vermouth', '1LTR', '1 Ltr/Btl', 'Bottle', 1.0, 1.0, FALSE) ON CONFLICT (item_code) DO NOTHING;
INSERT INTO products (sno, item_code, name, category, subcategory, packaging_size, packaging_description, unit, rate, value, is_additional) VALUES (115, 'Z00000763', 'De Kuyper Blue Curacao 700Ml#99190017', 'Liqueurs and Aperitifs', 'Orange Liqueurs', '700ML', '700ML/Btl', 'Bottle', 1.0, 1.0, FALSE) ON CONFLICT (item_code) DO NOTHING;
INSERT INTO products (sno, item_code, name, category, subcategory, packaging_size, packaging_description, unit, rate, value, is_additional) VALUES (116, 'Z00000762', 'De Kuyper Triple Sec 700ML #99190035', 'Liqueurs and Aperitifs', 'Orange Liqueurs', '700ML', '700Ml/Btl', 'Bottle', 5.0, 5.0, FALSE) ON CONFLICT (item_code) DO NOTHING;
INSERT INTO products (sno, item_code, name, category, subcategory, packaging_size, packaging_description, unit, rate, value, is_additional) VALUES (117, 'Z00000411', 'Tequila Patron Reposado 750Ml #9784', 'Spirits', 'Tequila Reposado', '750ML', '750ML/Btl', 'Bottle', 1.0, 1.0, FALSE) ON CONFLICT (item_code) DO NOTHING;
INSERT INTO products (sno, item_code, name, category, subcategory, packaging_size, packaging_description, unit, rate, value, is_additional) VALUES (118, 'S40064', 'Tequila Don Julio 1942 75CL #90730111', 'Spirits', 'Tequila Blanco', '75CL', '750ML/Btl', 'Bottle', 1.0, 1.0, FALSE) ON CONFLICT (item_code) DO NOTHING;
INSERT INTO products (sno, item_code, name, category, subcategory, packaging_size, packaging_description, unit, rate, value, is_additional) VALUES (119, 'E00427', 'Dom Perignon Blanc Luminous 750ml #12496', 'Sparkling Wines and Champagne', 'Champagne', '750ML', '750ML/Btl', 'Bottle', 1.0, 1.0, FALSE) ON CONFLICT (item_code) DO NOTHING;
INSERT INTO products (sno, item_code, name, category, subcategory, packaging_size, packaging_description, unit, rate, value, is_additional) VALUES (120, 'E00426', 'Ruinart Blanc de Blacns 75CL #85246', 'Sparkling Wines and Champagne', 'Champagne', '75CL', '750ml bott', 'Bottle', 0.1, 0.1, FALSE) ON CONFLICT (item_code) DO NOTHING;
INSERT INTO products (sno, item_code, name, category, subcategory, packaging_size, packaging_description, unit, rate, value, is_additional) VALUES (121, 'E00425', 'Ruinart R de Ruinart Brut- El Sur -France', 'White Wines', 'White Wine', '750ML', '750ml bott', 'Bottle', 1.0, 1.0, FALSE) ON CONFLICT (item_code) DO NOTHING;
INSERT INTO products (sno, item_code, name, category, subcategory, packaging_size, packaging_description, unit, rate, value, is_additional) VALUES (122, '45070232', 'Riesling Dr. Loosen 75CL #95900016', 'White Wines', 'White Wine', '75CL', '750ML/Btl', 'Bottle', 2.0, 2.0, FALSE) ON CONFLICT (item_code) DO NOTHING;
INSERT INTO products (sno, item_code, name, category, subcategory, packaging_size, packaging_description, unit, rate, value, is_additional) VALUES (123, '45070229', 'Woodbridge Chardonnay by Robert Mondavi 75CL #96010176 (WTD)', 'White Wines', 'White Wine', '75CL', '750ML/Btl', 'Bottle', 5.0, 5.0, FALSE) ON CONFLICT (item_code) DO NOTHING;
INSERT INTO products (sno, item_code, name, category, subcategory, packaging_size, packaging_description, unit, rate, value, is_additional) VALUES (124, '45070201', 'Gavi Batasiolo, Black DOCG 75CL #95490004', 'White Wines', 'White Wine', '75CL', '750ML/Btl', 'Bottle', 0.1, 0.1, FALSE) ON CONFLICT (item_code) DO NOTHING;
INSERT INTO products (sno, item_code, name, category, subcategory, packaging_size, packaging_description, unit, rate, value, is_additional) VALUES (125, '45070176', 'Woodbridge Cabernt Saivignon, 75CL #96010169 (W-TD)', 'Red Wines', 'Red Wine', '75CL', '750ML/Btl', 'Bottle', 2.0, 2.0, FALSE) ON CONFLICT (item_code) DO NOTHING;
INSERT INTO products (sno, item_code, name, category, subcategory, packaging_size, packaging_description, unit, rate, value, is_additional) VALUES (126, '45070151', 'Yalumba Y Series Merlot 750ML #96390193 (W-TD)', 'Red Wines', 'Red Wine', '750ML', '750ML/Btl', 'Bottle', 2.0, 2.0, FALSE) ON CONFLICT (item_code) DO NOTHING;
INSERT INTO products (sno, item_code, name, category, subcategory, packaging_size, packaging_description, unit, rate, value, is_additional) VALUES (127, '45070133', 'Chianti Gabbiano DOCG 750ML #95930016 (WTD)', 'Red Wines', 'Red Wine', '750ML', '750ML/Btl', 'Bottle', 1.0, 1.0, FALSE) ON CONFLICT (item_code) DO NOTHING;
INSERT INTO products (sno, item_code, name, category, subcategory, packaging_size, packaging_description, unit, rate, value, is_additional) VALUES (128, '45070123', 'Pinot Grigio Rose Italia 75CL #95720766 (WTD)', 'Rose Wines', 'Rose Wine', '75CL', '750Ml/Btl', 'Bottle', 8.0, 8.0, FALSE) ON CONFLICT (item_code) DO NOTHING;
INSERT INTO products (sno, item_code, name, category, subcategory, packaging_size, packaging_description, unit, rate, value, is_additional) VALUES (129, '45070122', 'Chateu L Aumerade 750ML #95538086 (W-TD)', 'Rose Wines', 'Rose Wine', '750ML', '750ML/Btl', 'Bottle', 3.0, 3.0, FALSE) ON CONFLICT (item_code) DO NOTHING;
INSERT INTO products (sno, item_code, name, category, subcategory, packaging_size, packaging_description, unit, rate, value, is_additional) VALUES (130, '45070118', 'Taylor''s Fine Tawny 750ML #95080004', 'Red Wines', 'Red Wine', '750ML', '750Ml/Btl', 'Bottle', 1.0, 1.0, FALSE) ON CONFLICT (item_code) DO NOTHING;
INSERT INTO products (sno, item_code, name, category, subcategory, packaging_size, packaging_description, unit, rate, value, is_additional) VALUES (131, '26120003', 'Torres Vina Esmeralda 750ML #7583 (WTD)', 'White Wines', 'White Wine', '750ML', '750ML/Btl', 'Bottle', 2.0, 2.0, FALSE) ON CONFLICT (item_code) DO NOTHING;
INSERT INTO products (sno, item_code, name, category, subcategory, packaging_size, packaging_description, unit, rate, value, is_additional) VALUES (132, '26090021', 'Cloudy Bay Sauvignon Blanc 750ML #E0393 (WTD)', 'White Wines', 'White Wine', '750ML', '750ML/Btl', 'Bottle', 2.0, 2.0, FALSE) ON CONFLICT (item_code) DO NOTHING;
INSERT INTO products (sno, item_code, name, category, subcategory, packaging_size, packaging_description, unit, rate, value, is_additional) VALUES (133, '26060002', 'La Petite Gargote Chardonnay 750ML #26937 (W-TD)', 'White Wines', 'White Wine', '750ML', '750Ml/Btl', 'Bottle', 8.0, 8.0, FALSE) ON CONFLICT (item_code) DO NOTHING;
INSERT INTO products (sno, item_code, name, category, subcategory, packaging_size, packaging_description, unit, rate, value, is_additional) VALUES (134, '26050014', 'Cossetti Gavi Di Gavi DOCG 75CL #75606 (WTD)', 'White Wines', 'White Wine', '75CL', '750ML/Btl', 'Bottle', 3.0, 3.0, FALSE) ON CONFLICT (item_code) DO NOTHING;
INSERT INTO products (sno, item_code, name, category, subcategory, packaging_size, packaging_description, unit, rate, value, is_additional) VALUES (135, '26050006', 'Laroche Chablis Premier CRU Vaudevey 750ML #95170048', 'White Wines', 'White Wine', '750ML', '750ML/Btl', 'Bottle', 2.0, 2.0, FALSE) ON CONFLICT (item_code) DO NOTHING;
INSERT INTO products (sno, item_code, name, category, subcategory, packaging_size, packaging_description, unit, rate, value, is_additional) VALUES (136, '26040001', 'Gewurztraminer, Hugel et Fils 750ML #95230002', 'White Wines', 'White Wine', '750ML', '750ML/Btl', 'Bottle', 2.0, 2.0, FALSE) ON CONFLICT (item_code) DO NOTHING;
INSERT INTO products (sno, item_code, name, category, subcategory, packaging_size, packaging_description, unit, rate, value, is_additional) VALUES (137, '26010075', 'Tormaresca Chardonnay Puglia 75CL #98786 (LTD)', 'White Wines', 'White Wine', '75CL', '750ML/Btl', 'Bottle', 0.1, 0.1, FALSE) ON CONFLICT (item_code) DO NOTHING;
INSERT INTO products (sno, item_code, name, category, subcategory, packaging_size, packaging_description, unit, rate, value, is_additional) VALUES (138, '26010002', 'Chardonnay Wolf Blass-Eaglehawk/Aus #95930010', 'White Wines', 'White Wine', '750ML', '750ML/Btl', 'Bottle', 0.1, 0.1, FALSE) ON CONFLICT (item_code) DO NOTHING;
INSERT INTO products (sno, item_code, name, category, subcategory, packaging_size, packaging_description, unit, rate, value, is_additional) VALUES (139, '25030023', 'Cham Brut Krug Grande Cuvee NV 75CL  #E0010-6', 'Sparkling Wines and Champagne', 'Champagne', '75CL', '750ML/Btl', 'Bottle', 1.0, 1.0, FALSE) ON CONFLICT (item_code) DO NOTHING;
INSERT INTO products (sno, item_code, name, category, subcategory, packaging_size, packaging_description, unit, rate, value, is_additional) VALUES (140, '25030005', 'Conte Fosco 75CL #98680025 (LTD)', 'Sparkling Wines and Champagne', 'Other Sparkling Wines', '75CL', '750ML/Btl', 'Bottle', 12.0, 12.0, FALSE) ON CONFLICT (item_code) DO NOTHING;
INSERT INTO products (sno, item_code, name, category, subcategory, packaging_size, packaging_description, unit, rate, value, is_additional) VALUES (141, '25030002', 'Laurent Perrier La Cuvee 750ML #95910019(WTD)', 'Sparkling Wines and Champagne', 'Champagne', '750ML', '750ML/Btl', 'Bottle', 2.0, 2.0, FALSE) ON CONFLICT (item_code) DO NOTHING;
INSERT INTO products (sno, item_code, name, category, subcategory, packaging_size, packaging_description, unit, rate, value, is_additional) VALUES (142, '25030001', 'Veuve Clicquot Yellow Lbl 750ml #08406', 'Sparkling Wines and Champagne', 'Champagne', '750ML', '750Ml/Btl', 'Bottle', 2.0, 2.0, FALSE) ON CONFLICT (item_code) DO NOTHING;
INSERT INTO products (sno, item_code, name, category, subcategory, packaging_size, packaging_description, unit, rate, value, is_additional) VALUES (143, '25020012', 'Dom Perignon Rose 75Cl #5142398', 'Sparkling Wines and Champagne', 'Champagne', '75CL', '750ML/Btl', 'Bottle', 1.0, 1.0, FALSE) ON CONFLICT (item_code) DO NOTHING;
INSERT INTO products (sno, item_code, name, category, subcategory, packaging_size, packaging_description, unit, rate, value, is_additional) VALUES (144, '24090032', 'Whispering Angel Rose 75CL #11922 (WTD)', 'Rose Wines', 'Rose Wine', '75CL', '750ml bott', 'Bottle', 2.0, 2.0, FALSE) ON CONFLICT (item_code) DO NOTHING;
INSERT INTO products (sno, item_code, name, category, subcategory, packaging_size, packaging_description, unit, rate, value, is_additional) VALUES (145, '24080043', 'Da Luca Nero d’Avola 750ML #95160012 (WTD)', 'Red Wines', 'Red Wine', '750ML', '750ML/Btl', 'Bottle', 6.0, 6.0, FALSE) ON CONFLICT (item_code) DO NOTHING;
INSERT INTO products (sno, item_code, name, category, subcategory, packaging_size, packaging_description, unit, rate, value, is_additional) VALUES (146, '24070002', 'Pinot Noir, Matua Valley #95930196(LTD)', 'Red Wines', 'Red Wine', '750ML', '750ML/Btl', 'Bottle', 2.0, 2.0, FALSE) ON CONFLICT (item_code) DO NOTHING;
INSERT INTO products (sno, item_code, name, category, subcategory, packaging_size, packaging_description, unit, rate, value, is_additional) VALUES (147, '24060229', 'Lambrusco Rosso Zonin 750ML #8735', 'Red Wines', 'Red Wine', '750ML', '750ML/Btl', 'Bottle', 0.1, 0.1, FALSE) ON CONFLICT (item_code) DO NOTHING;
INSERT INTO products (sno, item_code, name, category, subcategory, packaging_size, packaging_description, unit, rate, value, is_additional) VALUES (148, '24060108', 'Cote D''Beaune, Villages Bouchhard 750ML #95570095', 'Red Wines', 'Red Wine', '750ML', '750ML/Btl', 'Bottle', 2.0, 2.0, FALSE) ON CONFLICT (item_code) DO NOTHING;
INSERT INTO products (sno, item_code, name, category, subcategory, packaging_size, packaging_description, unit, rate, value, is_additional) VALUES (149, '24060090', 'Barbera D Asti Superiore Dezzani 750Ml #15104', 'Red Wines', 'Red Wine', '750ML', '750ML/Btl', 'Bottle', 0.1, 0.1, FALSE) ON CONFLICT (item_code) DO NOTHING;
INSERT INTO products (sno, item_code, name, category, subcategory, packaging_size, packaging_description, unit, rate, value, is_additional) VALUES (150, '24060075', 'Rubicon Meerlust 75CL #96070007', 'Red Wines', 'Red Wine', '75CL', '750ML/Btl', 'Bottle', 2.0, 2.0, FALSE) ON CONFLICT (item_code) DO NOTHING;
INSERT INTO products (sno, item_code, name, category, subcategory, packaging_size, packaging_description, unit, rate, value, is_additional) VALUES (151, '24040005', 'Zuccardi Q Series Malbec 75CL #12023 (WTD)', 'Red Wines', 'Red Wine', '75CL', '750ML/Btl', 'Bottle', 2.0, 2.0, FALSE) ON CONFLICT (item_code) DO NOTHING;
INSERT INTO products (sno, item_code, name, category, subcategory, packaging_size, packaging_description, unit, rate, value, is_additional) VALUES (152, '24040001', 'Da Luca Prosecco 750ML #95160021 (LTD)', 'Sparkling Wines and Champagne', 'Prosecco', '750ML', '750ML/Btl', 'Bottle', 8.0, 8.0, FALSE) ON CONFLICT (item_code) DO NOTHING;
INSERT INTO products (sno, item_code, name, category, subcategory, packaging_size, packaging_description, unit, rate, value, is_additional) VALUES (153, '23030003', 'De Kuyper Elderflower 70CL #99190021', 'Liqueurs and Aperitifs', 'Herbal Liqueurs', '70CL', '750ML/Btl', 'Bottle', 4.0, 4.0, FALSE) ON CONFLICT (item_code) DO NOTHING;
INSERT INTO products (sno, item_code, name, category, subcategory, packaging_size, packaging_description, unit, rate, value, is_additional) VALUES (154, '22180097', 'Ardbeg 10Yrs Old 700Ml #6594', 'Spirits', 'Scotch Whisky', '700ML', '700Ml/Btl', 'Bottle', 1.0, 1.0, FALSE) ON CONFLICT (item_code) DO NOTHING;
INSERT INTO products (sno, item_code, name, category, subcategory, packaging_size, packaging_description, unit, rate, value, is_additional) VALUES (155, '22180094', 'Laphroaig 10Y 700ML #90720067', 'Spirits', 'Scotch Whisky', '700ML', '700ML/Btl', 'Bottle', 1.0, 1.0, FALSE) ON CONFLICT (item_code) DO NOTHING;
INSERT INTO products (sno, item_code, name, category, subcategory, packaging_size, packaging_description, unit, rate, value, is_additional) VALUES (156, '22180092', 'Glenfiddich 18YO Whisky 70CL #90580118', 'Spirits', 'Scotch Whisky', '70CL', '700Ml/Btl', 'Bottle', 1.0, 1.0, FALSE) ON CONFLICT (item_code) DO NOTHING;
INSERT INTO products (sno, item_code, name, category, subcategory, packaging_size, packaging_description, unit, rate, value, is_additional) VALUES (157, '22180087', 'Nikka Whisky from the Barrel 50CL #11186', 'Spirits', 'Whisky and Whiskey', '50CL', '500ML/Btl', 'Bottle', 1.0, 1.0, FALSE) ON CONFLICT (item_code) DO NOTHING;
INSERT INTO products (sno, item_code, name, category, subcategory, packaging_size, packaging_description, unit, rate, value, is_additional) VALUES (158, '22180056', 'Woodford Reserve Bourbon Whiskey 750ML #76106', 'Spirits', 'Bourbon Whiskey', '750ML', '750ML/Btl', 'Bottle', 3.0, 3.0, FALSE) ON CONFLICT (item_code) DO NOTHING;
INSERT INTO products (sno, item_code, name, category, subcategory, packaging_size, packaging_description, unit, rate, value, is_additional) VALUES (159, '22180054', 'Makers Mark Bourbon Whiskey 75CL #91270001', 'Spirits', 'Bourbon Whiskey', '75CL', '750ML/Btl', 'Bottle', 3.0, 3.0, FALSE) ON CONFLICT (item_code) DO NOTHING;
INSERT INTO products (sno, item_code, name, category, subcategory, packaging_size, packaging_description, unit, rate, value, is_additional) VALUES (160, '22180048', 'Talisker Storm Single Malt Whisky 700ML #90730205', 'Spirits', 'Scotch Whisky', '700ML', '750ML/Btl', 'Bottle', 1.0, 1.0, FALSE) ON CONFLICT (item_code) DO NOTHING;
INSERT INTO products (sno, item_code, name, category, subcategory, packaging_size, packaging_description, unit, rate, value, is_additional) VALUES (161, '22180038', 'Gentleman Jack Bourbon Whisky 75CL #5386', 'Spirits', 'Bourbon Whiskey', '75CL', '750ML/Btl', 'Bottle', 1.0, 1.0, FALSE) ON CONFLICT (item_code) DO NOTHING;
INSERT INTO products (sno, item_code, name, category, subcategory, packaging_size, packaging_description, unit, rate, value, is_additional) VALUES (162, '22180037', 'JW Blue Label Whisky 75CL #99520071', 'Spirits', 'Scotch Whisky', '75CL', '750ML/Btl', 'Bottle', 1.0, 1.0, FALSE) ON CONFLICT (item_code) DO NOTHING;
INSERT INTO products (sno, item_code, name, category, subcategory, packaging_size, packaging_description, unit, rate, value, is_additional) VALUES (163, '22180031', 'Balvenie 12YO Doublewood 70CL #90580032', 'Spirits', 'Scotch Whisky', '70CL', '700ML/Btl', 'Bottle', 1.0, 1.0, FALSE) ON CONFLICT (item_code) DO NOTHING;
INSERT INTO products (sno, item_code, name, category, subcategory, packaging_size, packaging_description, unit, rate, value, is_additional) VALUES (164, '22180022', 'Glenfiddich 12 YO Whisky 70CL #90580116', 'Spirits', 'Scotch Whisky', '70CL', '700Ml/Btl', 'Bottle', 2.0, 2.0, FALSE) ON CONFLICT (item_code) DO NOTHING;
INSERT INTO products (sno, item_code, name, category, subcategory, packaging_size, packaging_description, unit, rate, value, is_additional) VALUES (165, '22180020', 'Chivas Regal 18Y 75CL #76756', 'Spirits', 'Scotch Whisky', '75CL', '750ML/Btl', 'Bottle', 1.0, 1.0, FALSE) ON CONFLICT (item_code) DO NOTHING;
INSERT INTO products (sno, item_code, name, category, subcategory, packaging_size, packaging_description, unit, rate, value, is_additional) VALUES (166, '22180018', 'Jameson Irish Whiskey 750Ml #0215', 'Spirits', 'Irish Whiskey', '750ML', '750ML/Btl', 'Bottle', 3.0, 3.0, FALSE) ON CONFLICT (item_code) DO NOTHING;
INSERT INTO products (sno, item_code, name, category, subcategory, packaging_size, packaging_description, unit, rate, value, is_additional) VALUES (167, '22180016', 'Jim Beam Bourbon Whiskey 750ML #90720010', 'Spirits', 'Bourbon Whiskey', '750ML', '750ML/Btl', 'Bottle', 5.0, 5.0, FALSE) ON CONFLICT (item_code) DO NOTHING;
INSERT INTO products (sno, item_code, name, category, subcategory, packaging_size, packaging_description, unit, rate, value, is_additional) VALUES (168, '22180015', 'Jack Daniels Tennessee Whiskey 75CL #5883', 'Spirits', 'Bourbon Whiskey', '75CL', '750ML/Btl', 'Bottle', 0.1, 0.1, FALSE) ON CONFLICT (item_code) DO NOTHING;
INSERT INTO products (sno, item_code, name, category, subcategory, packaging_size, packaging_description, unit, rate, value, is_additional) VALUES (169, '22180013', 'JW Red Label Whisky 70CL #90730325 (LTD)', 'Spirits', 'Scotch Whisky', '70CL', '700ML/Btl', 'Bottle', 0.1, 0.1, FALSE) ON CONFLICT (item_code) DO NOTHING;
INSERT INTO products (sno, item_code, name, category, subcategory, packaging_size, packaging_description, unit, rate, value, is_additional) VALUES (170, '22180012', 'JW Black Label 70CL #90730340', 'Spirits', 'Scotch Whisky', '70CL', '700ML/Btl', 'Bottle', 2.0, 2.0, FALSE) ON CONFLICT (item_code) DO NOTHING;
INSERT INTO products (sno, item_code, name, category, subcategory, packaging_size, packaging_description, unit, rate, value, is_additional) VALUES (171, '22180010', 'Dewar''s White Label Whisky 75CL #01680 (LTD)', 'Spirits', 'Scotch Whisky', '75CL', '750ML/Btl', 'Bottle', 7.0, 7.0, FALSE) ON CONFLICT (item_code) DO NOTHING;
INSERT INTO products (sno, item_code, name, category, subcategory, packaging_size, packaging_description, unit, rate, value, is_additional) VALUES (172, '22180009', 'Glenkinchie Single Malt 12YO Whisky', 'Spirits', 'Scotch Whisky', '750ML', '750Ml/Btl', 'Bottle', 1.0, 1.0, FALSE) ON CONFLICT (item_code) DO NOTHING;
INSERT INTO products (sno, item_code, name, category, subcategory, packaging_size, packaging_description, unit, rate, value, is_additional) VALUES (173, '22180005', 'Chivas Regal 12YO 750Ml #3298', 'Spirits', 'Scotch Whisky', '750ML', '750ML/Btl', 'Bottle', 2.0, 2.0, FALSE) ON CONFLICT (item_code) DO NOTHING;
INSERT INTO products (sno, item_code, name, category, subcategory, packaging_size, packaging_description, unit, rate, value, is_additional) VALUES (174, '22170047', 'Ketel One Vodka 75CL #90730123 (W-TD)', 'Spirits', 'Vodka', '75CL', '750ML/Btl', 'Bottle', 6.0, 6.0, FALSE) ON CONFLICT (item_code) DO NOTHING;
INSERT INTO products (sno, item_code, name, category, subcategory, packaging_size, packaging_description, unit, rate, value, is_additional) VALUES (175, '22170020', 'Smirnoff Apple Green Vodka  Twist #90730', 'Spirits', 'Vodka', '700ML', '700ml bott', 'Bottle', 1.0, 1.0, FALSE) ON CONFLICT (item_code) DO NOTHING;
INSERT INTO products (sno, item_code, name, category, subcategory, packaging_size, packaging_description, unit, rate, value, is_additional) VALUES (176, '22170006', 'Grey Goose 1.5L #85026 (W-TD)', 'Spirits', 'Vodka', '1.5L', '1.5Ltr/Btl', 'Bottle', 0.1, 0.1, FALSE) ON CONFLICT (item_code) DO NOTHING;
INSERT INTO products (sno, item_code, name, category, subcategory, packaging_size, packaging_description, unit, rate, value, is_additional) VALUES (177, '22170005', 'Smirnoff Red Vodka 700ML #90730326 (LTD)', 'Spirits', 'Vodka', '700ML', '700ML/Bot', 'Bottle', 2.0, 2.0, FALSE) ON CONFLICT (item_code) DO NOTHING;
INSERT INTO products (sno, item_code, name, category, subcategory, packaging_size, packaging_description, unit, rate, value, is_additional) VALUES (178, '22170004', 'Ciroc Vodka 750Ml  #90730191(WTD)', 'Spirits', 'Vodka', '750ML', '750ML/Btl', 'Bottle', 2.0, 2.0, FALSE) ON CONFLICT (item_code) DO NOTHING;
INSERT INTO products (sno, item_code, name, category, subcategory, packaging_size, packaging_description, unit, rate, value, is_additional) VALUES (179, '22170003', 'Grey Goose 750ML #7838 (WTD)', 'Spirits', 'Vodka', '750ML', '750ML/Btl', 'Bottle', 3.0, 3.0, FALSE) ON CONFLICT (item_code) DO NOTHING;
INSERT INTO products (sno, item_code, name, category, subcategory, packaging_size, packaging_description, unit, rate, value, is_additional) VALUES (180, '22170002', 'Belvedere Vodka 750ml #7837 (W-TD)', 'Spirits', 'Vodka', '750ML', '750ML/Btl', 'Bottle', 2.0, 2.0, FALSE) ON CONFLICT (item_code) DO NOTHING;
INSERT INTO products (sno, item_code, name, category, subcategory, packaging_size, packaging_description, unit, rate, value, is_additional) VALUES (181, '22160027', 'Tequila Jose Cuervo Silver 750ml #96260003 (LTD)', 'Spirits', 'Tequila Blanco', '750ML', '750ML/Btl', 'Bottle', 2.0, 2.0, FALSE) ON CONFLICT (item_code) DO NOTHING;
INSERT INTO products (sno, item_code, name, category, subcategory, packaging_size, packaging_description, unit, rate, value, is_additional) VALUES (182, '22160024', 'Tequila Patron Silver 750ml #10111', 'Spirits', 'Tequila Blanco', '750ML', '750ML/Btl', 'Bottle', 1.0, 1.0, FALSE) ON CONFLICT (item_code) DO NOTHING;
INSERT INTO products (sno, item_code, name, category, subcategory, packaging_size, packaging_description, unit, rate, value, is_additional) VALUES (183, '22160016', 'Tequila Patron Cafe XO 750ml #97856', 'Liqueurs and Aperitifs', 'Coffee Liqueurs', '750ML', '750ML/Btl', 'Bottle', 0.1, 0.1, FALSE) ON CONFLICT (item_code) DO NOTHING;
INSERT INTO products (sno, item_code, name, category, subcategory, packaging_size, packaging_description, unit, rate, value, is_additional) VALUES (184, '22160008', 'Tequila Jose Cuervo Gold 750ml #96260001 (WTD)', 'Spirits', 'Tequila Reposado', '750ML', '750ML/Btl', 'Bottle', 8.0, 8.0, FALSE) ON CONFLICT (item_code) DO NOTHING;
INSERT INTO products (sno, item_code, name, category, subcategory, packaging_size, packaging_description, unit, rate, value, is_additional) VALUES (185, '22160001', 'Tequila Patron Anejo 75CL #8030', 'Spirits', 'Tequila Anejo', '75CL', '750ML/Btl', 'Bottle', 1.0, 1.0, FALSE) ON CONFLICT (item_code) DO NOTHING;
INSERT INTO products (sno, item_code, name, category, subcategory, packaging_size, packaging_description, unit, rate, value, is_additional) VALUES (186, '22140004', 'Sambuca White Bianca 70CL #90620003', 'Liqueurs and Aperitifs', 'Other Liqueurs', '70CL', '700ML/Btl', 'Bottle', 2.0, 2.0, FALSE) ON CONFLICT (item_code) DO NOTHING;
INSERT INTO products (sno, item_code, name, category, subcategory, packaging_size, packaging_description, unit, rate, value, is_additional) VALUES (187, '22130082', 'Ron Zacapa Centenario 23 Yo Rum 750ml #90730128', 'Spirits', 'Aged Rum', '750ML', '750ML/Btl', 'Bottle', 2.0, 2.0, FALSE) ON CONFLICT (item_code) DO NOTHING;
INSERT INTO products (sno, item_code, name, category, subcategory, packaging_size, packaging_description, unit, rate, value, is_additional) VALUES (188, '22130074', 'Appleton Estate  Jamaican Extra Rum 700ML #11592', 'Spirits', 'Aged Rum', '700ML', '700ML/Btl', 'Can', 1.0, 1.0, FALSE) ON CONFLICT (item_code) DO NOTHING;
INSERT INTO products (sno, item_code, name, category, subcategory, packaging_size, packaging_description, unit, rate, value, is_additional) VALUES (189, '22130063', 'Angostura 1824 750ml', 'Spirits', 'Aged Rum', '750ML', '750ml bott', 'Bottle', 1.0, 1.0, FALSE) ON CONFLICT (item_code) DO NOTHING;
INSERT INTO products (sno, item_code, name, category, subcategory, packaging_size, packaging_description, unit, rate, value, is_additional) VALUES (190, '22130053', 'Diplomatico Reserva Exclusiva 750ml #22895', 'Spirits', 'Aged Rum', '750ML', '750Ml/Btl', 'Bottle', 2.0, 2.0, FALSE) ON CONFLICT (item_code) DO NOTHING;
INSERT INTO products (sno, item_code, name, category, subcategory, packaging_size, packaging_description, unit, rate, value, is_additional) VALUES (191, '22130018', 'Bacardi Black 750ml #78256 (WTD)', 'Spirits', 'Dark Rum', '750ML', '750ML/Btl', 'Bottle', 1.0, 1.0, FALSE) ON CONFLICT (item_code) DO NOTHING;
INSERT INTO products (sno, item_code, name, category, subcategory, packaging_size, packaging_description, unit, rate, value, is_additional) VALUES (192, '22130008', 'Cachaca 51 700ml #6754', 'Spirits', 'Other Spirits', '700ML', '700ML/Btl', 'Bottle', 3.0, 3.0, FALSE) ON CONFLICT (item_code) DO NOTHING;
INSERT INTO products (sno, item_code, name, category, subcategory, packaging_size, packaging_description, unit, rate, value, is_additional) VALUES (193, '22130006', 'Captain Morgan Black Label 750ML #90570051', 'Spirits', 'Dark Rum', '750ML', '750ML/Btl', 'Bottle', 2.0, 2.0, FALSE) ON CONFLICT (item_code) DO NOTHING;
INSERT INTO products (sno, item_code, name, category, subcategory, packaging_size, packaging_description, unit, rate, value, is_additional) VALUES (194, '22130004', 'Captain Morgan Spiced 750ml #90570049', 'Spirits', 'Spiced Rum', '750ML', '750ML/Btl', 'Bottle', 3.0, 3.0, FALSE) ON CONFLICT (item_code) DO NOTHING;
INSERT INTO products (sno, item_code, name, category, subcategory, packaging_size, packaging_description, unit, rate, value, is_additional) VALUES (195, '22130003', 'Bacardi Superior Carta Blanca 750ML #0148 (LTD)', 'Spirits', 'White Rum', '750ML', '750ML/Btl', 'Bottle', 7.0, 7.0, FALSE) ON CONFLICT (item_code) DO NOTHING;
INSERT INTO products (sno, item_code, name, category, subcategory, packaging_size, packaging_description, unit, rate, value, is_additional) VALUES (196, '22100075', 'Apricot Brandy Bols 700ML #0636', 'Liqueurs and Aperitifs', 'Fruit Liqueurs', '700ML', '700Ml/Btl', 'Bottle', 0.1, 0.1, FALSE) ON CONFLICT (item_code) DO NOTHING;
INSERT INTO products (sno, item_code, name, category, subcategory, packaging_size, packaging_description, unit, rate, value, is_additional) VALUES (197, '22100066', 'Tequila Don Julio Blanco 75cl #90730088', 'Spirits', 'Tequila Blanco', '75CL', '750ML/Btl', 'Bottle', 1.0, 1.0, FALSE) ON CONFLICT (item_code) DO NOTHING;
INSERT INTO products (sno, item_code, name, category, subcategory, packaging_size, packaging_description, unit, rate, value, is_additional) VALUES (198, '22100063', 'Midori Melon Liqueur 70CL  #90840001', 'Liqueurs and Aperitifs', 'Fruit Liqueurs', '70CL', '700ML/Btl', 'Bottle', 1.0, 1.0, FALSE) ON CONFLICT (item_code) DO NOTHING;
INSERT INTO products (sno, item_code, name, category, subcategory, packaging_size, packaging_description, unit, rate, value, is_additional) VALUES (199, '22100040', 'Dom Benedictine Herb Liqueur 750ML  #0635', 'Liqueurs and Aperitifs', 'Herbal Liqueurs', '750ML', '750Ml/Btl', 'Bottle', 1.0, 1.0, FALSE) ON CONFLICT (item_code) DO NOTHING;
INSERT INTO products (sno, item_code, name, category, subcategory, packaging_size, packaging_description, unit, rate, value, is_additional) VALUES (200, '22100039', 'Galliano Herb Liqueur, Authentico 700Ml #11401', 'Liqueurs and Aperitifs', 'Herbal Liqueurs', '700ML', '700ML/Btl', 'Bottle', 0.1, 0.1, FALSE) ON CONFLICT (item_code) DO NOTHING;
INSERT INTO products (sno, item_code, name, category, subcategory, packaging_size, packaging_description, unit, rate, value, is_additional) VALUES (201, '22100033', 'Blue Curacao Bols 700ML #0645', 'Liqueurs and Aperitifs', 'Orange Liqueurs', '700ML', '700ML/Btl', 'Bottle', 0.1, 0.1, FALSE) ON CONFLICT (item_code) DO NOTHING;
INSERT INTO products (sno, item_code, name, category, subcategory, packaging_size, packaging_description, unit, rate, value, is_additional) VALUES (202, '22100031', 'Amarula African Cream 700Ml', 'Liqueurs and Aperitifs', 'Cream Liqueurs', '700ML', '700Ml/Btl', 'Can', 0.1, 0.1, FALSE) ON CONFLICT (item_code) DO NOTHING;
INSERT INTO products (sno, item_code, name, category, subcategory, packaging_size, packaging_description, unit, rate, value, is_additional) VALUES (203, '22100028', 'Chambord Royale de Raspberry Liqueur 700ML #7841', 'Liqueurs and Aperitifs', 'Fruit Liqueurs', '700ML', '700Ml/Btl', 'Bottle', 1.0, 1.0, FALSE) ON CONFLICT (item_code) DO NOTHING;
INSERT INTO products (sno, item_code, name, category, subcategory, packaging_size, packaging_description, unit, rate, value, is_additional) VALUES (204, '22100024', 'Jagermeister Herb Liquer 700Ml #91310002', 'Liqueurs and Aperitifs', 'Herbal Liqueurs', '700ML', '700Ml/Btl', 'Bottle', 2.0, 2.0, FALSE) ON CONFLICT (item_code) DO NOTHING;
INSERT INTO products (sno, item_code, name, category, subcategory, packaging_size, packaging_description, unit, rate, value, is_additional) VALUES (205, '22100010', 'Cointreau Orange Liqueur 700Ml #90820002', 'Liqueurs and Aperitifs', 'Orange Liqueurs', '700ML', '700Ml/Btl', 'Bottle', 1.0, 1.0, FALSE) ON CONFLICT (item_code) DO NOTHING;
INSERT INTO products (sno, item_code, name, category, subcategory, packaging_size, packaging_description, unit, rate, value, is_additional) VALUES (206, '22100009', 'Grand Marnier Orange Liqueur 700Ml #0668', 'Liqueurs and Aperitifs', 'Orange Liqueurs', '700ML', '700Ml/Btl', 'Bottle', 1.0, 1.0, FALSE) ON CONFLICT (item_code) DO NOTHING;
INSERT INTO products (sno, item_code, name, category, subcategory, packaging_size, packaging_description, unit, rate, value, is_additional) VALUES (207, '22100008', 'Baileys Irish Cream 750Ml #99520011', 'Liqueurs and Aperitifs', 'Cream Liqueurs', '750ML', '750Ml/Btl', 'Bottle', 1.0, 1.0, FALSE) ON CONFLICT (item_code) DO NOTHING;
INSERT INTO products (sno, item_code, name, category, subcategory, packaging_size, packaging_description, unit, rate, value, is_additional) VALUES (208, '22100007', 'Drambuie Honey Liqueur 750Ml #90580042', 'Liqueurs and Aperitifs', 'Herbal Liqueurs', '750ML', '750Ml/Btl', 'Bottle', 1.0, 1.0, FALSE) ON CONFLICT (item_code) DO NOTHING;
INSERT INTO products (sno, item_code, name, category, subcategory, packaging_size, packaging_description, unit, rate, value, is_additional) VALUES (209, '22100001', 'Amaretto Disaronno 700Ml #0631', 'Liqueurs and Aperitifs', 'Other Liqueurs', '700ML', '700ML/Btl', 'Bottle', 3.0, 3.0, FALSE) ON CONFLICT (item_code) DO NOTHING;
INSERT INTO products (sno, item_code, name, category, subcategory, packaging_size, packaging_description, unit, rate, value, is_additional) VALUES (210, '22080006', 'Hendricks Gin 700Ml #90580115', 'Spirits', 'Gin', '700ML', '700Ml/Btl', 'Bottle', 2.0, 2.0, FALSE) ON CONFLICT (item_code) DO NOTHING;
INSERT INTO products (sno, item_code, name, category, subcategory, packaging_size, packaging_description, unit, rate, value, is_additional) VALUES (211, '22080005', 'Tanqueray 10Yrs Gin 750ML #90730068', 'Spirits', 'Gin', '750ML', '750Ml/Btl', 'Bottle', 2.0, 2.0, FALSE) ON CONFLICT (item_code) DO NOTHING;
INSERT INTO products (sno, item_code, name, category, subcategory, packaging_size, packaging_description, unit, rate, value, is_additional) VALUES (212, '22080004', 'Tanqueray Gin 700Ml #90730327 (WTD)', 'Spirits', 'Gin', '700ML', '700Ml/Btl', 'Bottle', 9.0, 9.0, FALSE) ON CONFLICT (item_code) DO NOTHING;
INSERT INTO products (sno, item_code, name, category, subcategory, packaging_size, packaging_description, unit, rate, value, is_additional) VALUES (213, '22070022', 'Pedro Ximenez San Emilio Solera Res. Sherry Wine 750ML #96710018', 'Red Wines', 'Red Wine', '750ML', '750ML/Btl', 'Bottle', 1.0, 1.0, FALSE) ON CONFLICT (item_code) DO NOTHING;
INSERT INTO products (sno, item_code, name, category, subcategory, packaging_size, packaging_description, unit, rate, value, is_additional) VALUES (214, '22030014', 'JW Black Ruby 750ML #90730417', 'Spirits', 'Scotch Whisky', '750ML', '750ML/Btl', 'Bottle', 0.1, 0.1, FALSE) ON CONFLICT (item_code) DO NOTHING;
INSERT INTO products (sno, item_code, name, category, subcategory, packaging_size, packaging_description, unit, rate, value, is_additional) VALUES (215, '22030013', 'Hennessy XO 700ML #8320', 'Spirits', 'Cognac', '700ML', '700ML/Btl', 'Bottle', 1.0, 1.0, FALSE) ON CONFLICT (item_code) DO NOTHING;
INSERT INTO products (sno, item_code, name, category, subcategory, packaging_size, packaging_description, unit, rate, value, is_additional) VALUES (216, '22030011', 'Remy Martin VSOP 700Ml#90820005', 'Spirits', 'Cognac', '700ML', '700Ml/Btl', 'Bottle', 1.0, 1.0, FALSE) ON CONFLICT (item_code) DO NOTHING;
INSERT INTO products (sno, item_code, name, category, subcategory, packaging_size, packaging_description, unit, rate, value, is_additional) VALUES (217, '22030009', 'Hennessy VSOP 700ml #7637', 'Spirits', 'Cognac', '700ML', '700ML/Btl', 'Bottle', 2.0, 2.0, FALSE) ON CONFLICT (item_code) DO NOTHING;
INSERT INTO products (sno, item_code, name, category, subcategory, packaging_size, packaging_description, unit, rate, value, is_additional) VALUES (218, '22030005', 'Hennessy VS 700Ml #0125', 'Spirits', 'Cognac', '700ML', '700ML/Btl', 'Bottle', 4.0, 4.0, FALSE) ON CONFLICT (item_code) DO NOTHING;
INSERT INTO products (sno, item_code, name, category, subcategory, packaging_size, packaging_description, unit, rate, value, is_additional) VALUES (219, '22030004', 'Courvoisier VS 70CL #90720029', 'Spirits', 'Cognac', '70CL', '700ML/Btl', 'Bottle', 0.1, 0.1, FALSE) ON CONFLICT (item_code) DO NOTHING;
INSERT INTO products (sno, item_code, name, category, subcategory, packaging_size, packaging_description, unit, rate, value, is_additional) VALUES (220, '22030001', 'Torres 10Y Brandy 700Ml #3040', 'Spirits', 'Brandy', '700ML', '700Ml/Btl', 'Bottle', 1.0, 1.0, FALSE) ON CONFLICT (item_code) DO NOTHING;
INSERT INTO products (sno, item_code, name, category, subcategory, packaging_size, packaging_description, unit, rate, value, is_additional) VALUES (221, '22020004', 'Angostura Orange Bitter 10cl #16861', 'Liqueurs and Aperitifs', 'Bitters', '10CL', '100ML/Btl', 'Bottle', 1.0, 1.0, FALSE) ON CONFLICT (item_code) DO NOTHING;
INSERT INTO products (sno, item_code, name, category, subcategory, packaging_size, packaging_description, unit, rate, value, is_additional) VALUES (222, '22020001', 'Angostura Bitters 200Ml #0618', 'Liqueurs and Aperitifs', 'Bitters', '200ML', '200ML/Btl', 'Bottle', 2.0, 2.0, FALSE) ON CONFLICT (item_code) DO NOTHING;
INSERT INTO products (sno, item_code, name, category, subcategory, packaging_size, packaging_description, unit, rate, value, is_additional) VALUES (223, '22010021', 'Pernod 1ltr #1705', 'Liqueurs and Aperitifs', 'Aperitifs', '1LTR', '1 Ltr/Btl', 'Bottle', 1.0, 1.0, FALSE) ON CONFLICT (item_code) DO NOTHING;
INSERT INTO products (sno, item_code, name, category, subcategory, packaging_size, packaging_description, unit, rate, value, is_additional) VALUES (224, '22010019', 'Martini Rosato 1Ltr', 'Liqueurs and Aperitifs', 'Vermouth', '1LTR', '1 Ltr/Btl', 'Bottle', 1.0, 1.0, FALSE) ON CONFLICT (item_code) DO NOTHING;
INSERT INTO products (sno, item_code, name, category, subcategory, packaging_size, packaging_description, unit, rate, value, is_additional) VALUES (225, '22010016', 'Aperol 700ML #108206', 'Liqueurs and Aperitifs', 'Aperitifs', '700ML', '700ML/Btl', 'Bottle', 5.0, 5.0, FALSE) ON CONFLICT (item_code) DO NOTHING;
INSERT INTO products (sno, item_code, name, category, subcategory, packaging_size, packaging_description, unit, rate, value, is_additional) VALUES (226, '22010015', 'Cynar 1ltr #108216', 'Liqueurs and Aperitifs', 'Digestifs', '1LTR', '1 Ltr/Btl', 'Bottle', 1.0, 1.0, FALSE) ON CONFLICT (item_code) DO NOTHING;
INSERT INTO products (sno, item_code, name, category, subcategory, packaging_size, packaging_description, unit, rate, value, is_additional) VALUES (227, '22010006', 'Martini Rosso 1Ltr #14444', 'Liqueurs and Aperitifs', 'Vermouth', '1LTR', '1 Ltr/Btl', 'Bottle', 2.0, 2.0, FALSE) ON CONFLICT (item_code) DO NOTHING;
INSERT INTO products (sno, item_code, name, category, subcategory, packaging_size, packaging_description, unit, rate, value, is_additional) VALUES (228, '22010005', 'Martini Extra Dry 1ltr #14445', 'Liqueurs and Aperitifs', 'Vermouth', '1LTR', '1 Ltr/Btl', 'Bottle', 1.0, 1.0, FALSE) ON CONFLICT (item_code) DO NOTHING;
INSERT INTO products (sno, item_code, name, category, subcategory, packaging_size, packaging_description, unit, rate, value, is_additional) VALUES (229, '22010004', 'Martini Bianco 1Ltr #14443', 'Liqueurs and Aperitifs', 'Vermouth', '1LTR', '1 Ltr/Btl', 'Bottle', 1.0, 1.0, FALSE) ON CONFLICT (item_code) DO NOTHING;
INSERT INTO products (sno, item_code, name, category, subcategory, packaging_size, packaging_description, unit, rate, value, is_additional) VALUES (230, '22010003', 'Campari Bitter 1Ltr #0613', 'Liqueurs and Aperitifs', 'Bitters', '1LTR', '1Ltr/ Btl', 'Bottle', 5.0, 5.0, FALSE) ON CONFLICT (item_code) DO NOTHING;
INSERT INTO products (sno, item_code, name, category, subcategory, packaging_size, packaging_description, unit, rate, value, is_additional) VALUES (231, '22010002', 'Ricard 1Ltr #1706', 'Liqueurs and Aperitifs', 'Aperitifs', '1LTR', '1 Ltr/Btl', 'Bottle', 1.0, 1.0, FALSE) ON CONFLICT (item_code) DO NOTHING;
INSERT INTO products (sno, item_code, name, category, subcategory, packaging_size, packaging_description, unit, rate, value, is_additional) VALUES (232, '21020038', 'Peroni Btl 330Ml #90060009 (WTD)', 'Beers and Non-Alcoholic Beer', 'Bottled Beer', '330ML', '330ML/Btl', 'Bottle', 72.0, 72.0, FALSE) ON CONFLICT (item_code) DO NOTHING;
INSERT INTO products (sno, item_code, name, category, subcategory, packaging_size, packaging_description, unit, rate, value, is_additional) VALUES (233, '21020024', 'Stella Artois Btl 330Ml #90220005 (WTD)', 'Beers and Non-Alcoholic Beer', 'Bottled Beer', '330ML', '330ML/Btl', 'Bottle', 48.0, 48.0, FALSE) ON CONFLICT (item_code) DO NOTHING;
INSERT INTO products (sno, item_code, name, category, subcategory, packaging_size, packaging_description, unit, rate, value, is_additional) VALUES (234, '21020012', 'Corona Btl 330Ml #90170039 (LTD)', 'Beers and Non-Alcoholic Beer', 'Bottled Beer', '330ML', '330ML/Btl', 'Bottle', 48.0, 48.0, FALSE) ON CONFLICT (item_code) DO NOTHING;
INSERT INTO products (sno, item_code, name, category, subcategory, packaging_size, packaging_description, unit, rate, value, is_additional) VALUES (235, '21020002', 'Heineken Btl 330Ml  #6768-11 (LTD)', 'Beers and Non-Alcoholic Beer', 'Bottled Beer', '330ML', '330ML/Btl', 'Bottle', 72.0, 72.0, FALSE) ON CONFLICT (item_code) DO NOTHING;
INSERT INTO products (sno, item_code, name, category, subcategory, packaging_size, packaging_description, unit, rate, value, is_additional) VALUES (236, 'SB001', 'Barakat Fresh Orange Juice', 'Soft Beverages and Water', 'Other Fresh Juices', '1 LTR', '1 LTR/Bottle', 'Bottle', 0.0, 0.0, TRUE) ON CONFLICT (item_code) DO NOTHING;
INSERT INTO products (sno, item_code, name, category, subcategory, packaging_size, packaging_description, unit, rate, value, is_additional) VALUES (237, 'SB002', 'Barakat Fresh Apple Juice', 'Soft Beverages and Water', 'Other Fresh Juices', '1 LTR', '1 LTR/Bottle', 'Bottle', 0.0, 0.0, TRUE) ON CONFLICT (item_code) DO NOTHING;
INSERT INTO products (sno, item_code, name, category, subcategory, packaging_size, packaging_description, unit, rate, value, is_additional) VALUES (238, 'SB003', 'Barakat Fresh Watermelon Juice', 'Soft Beverages and Water', 'Other Fresh Juices', '1 LTR', '1 LTR/Bottle', 'Bottle', 0.0, 0.0, TRUE) ON CONFLICT (item_code) DO NOTHING;
INSERT INTO products (sno, item_code, name, category, subcategory, packaging_size, packaging_description, unit, rate, value, is_additional) VALUES (239, 'SB004', 'Barakat Fresh Mixed Fruit Juice', 'Soft Beverages and Water', 'Other Fresh Juices', '1 LTR', '1 LTR/Bottle', 'Bottle', 0.0, 0.0, TRUE) ON CONFLICT (item_code) DO NOTHING;
INSERT INTO products (sno, item_code, name, category, subcategory, packaging_size, packaging_description, unit, rate, value, is_additional) VALUES (240, 'SB005', 'Al Ain Still Water', 'Soft Beverages and Water', 'Still Water', '750ML', '750ML/Bottle', 'Bottle', 0.0, 0.0, TRUE) ON CONFLICT (item_code) DO NOTHING;
INSERT INTO products (sno, item_code, name, category, subcategory, packaging_size, packaging_description, unit, rate, value, is_additional) VALUES (241, 'SB006', 'Al Ain Sparkling Water', 'Soft Beverages and Water', 'Sparkling Water', '750ML', '750ML/Bottle', 'Bottle', 0.0, 0.0, TRUE) ON CONFLICT (item_code) DO NOTHING;
INSERT INTO products (sno, item_code, name, category, subcategory, packaging_size, packaging_description, unit, rate, value, is_additional) VALUES (242, 'SB007', 'Coca-Cola Can 330ml', 'Soft Beverages and Water', 'Soft Drinks', '330ML', '330ML/Can', 'Can', 0.0, 0.0, TRUE) ON CONFLICT (item_code) DO NOTHING;
INSERT INTO products (sno, item_code, name, category, subcategory, packaging_size, packaging_description, unit, rate, value, is_additional) VALUES (243, 'SB008', 'Coca-Cola Zero Can 330ml', 'Soft Beverages and Water', 'Soft Drinks', '330ML', '330ML/Can', 'Can', 0.0, 0.0, TRUE) ON CONFLICT (item_code) DO NOTHING;
INSERT INTO products (sno, item_code, name, category, subcategory, packaging_size, packaging_description, unit, rate, value, is_additional) VALUES (244, 'SB009', 'Sprite Can 330ml', 'Soft Beverages and Water', 'Soft Drinks', '330ML', '330ML/Can', 'Can', 0.0, 0.0, TRUE) ON CONFLICT (item_code) DO NOTHING;
INSERT INTO products (sno, item_code, name, category, subcategory, packaging_size, packaging_description, unit, rate, value, is_additional) VALUES (245, 'SB010', 'Fever-Tree Indian Tonic Water 200ml', 'Soft Beverages and Water', 'Mixers', '200ML', '200ML/Bottle', 'Bottle', 0.0, 0.0, TRUE) ON CONFLICT (item_code) DO NOTHING;
INSERT INTO products (sno, item_code, name, category, subcategory, packaging_size, packaging_description, unit, rate, value, is_additional) VALUES (246, 'SB011', 'Fever-Tree Soda Water 200ml', 'Soft Beverages and Water', 'Mixers', '200ML', '200ML/Bottle', 'Bottle', 0.0, 0.0, TRUE) ON CONFLICT (item_code) DO NOTHING;
INSERT INTO products (sno, item_code, name, category, subcategory, packaging_size, packaging_description, unit, rate, value, is_additional) VALUES (247, 'SB012', 'Fever-Tree Ginger Ale 200ml', 'Soft Beverages and Water', 'Mixers', '200ML', '200ML/Bottle', 'Bottle', 0.0, 0.0, TRUE) ON CONFLICT (item_code) DO NOTHING;
INSERT INTO products (sno, item_code, name, category, subcategory, packaging_size, packaging_description, unit, rate, value, is_additional) VALUES (248, 'SB013', 'Red Bull Energy Drink 250ml', 'Soft Beverages and Water', 'Energy Drinks', '250ML', '250ML/Can', 'Can', 0.0, 0.0, TRUE) ON CONFLICT (item_code) DO NOTHING;
INSERT INTO products (sno, item_code, name, category, subcategory, packaging_size, packaging_description, unit, rate, value, is_additional) VALUES (249, 'SB014', 'Red Bull Sugarfree 250ml', 'Soft Beverages and Water', 'Energy Drinks', '250ML', '250ML/Can', 'Can', 0.0, 0.0, TRUE) ON CONFLICT (item_code) DO NOTHING;