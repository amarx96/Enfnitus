-- =================================================================
-- FINAL MIGRATION SCRIPT FOR SUPABASE
-- Run this script in your Supabase Dashboard > SQL Editor
-- =================================================================

-- 1. Base Schema & Contracting Service
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Customers Table (Base)
CREATE TABLE IF NOT EXISTS customers (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    vorname VARCHAR(100),
    nachname VARCHAR(100),
    email VARCHAR(255) UNIQUE,
    telefon VARCHAR(50),
    strasse VARCHAR(100),
    hausnummer VARCHAR(20),
    plz VARCHAR(10),
    ort VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enhanced Customer Fields (from ENHANCE_CUSTOMER_SCHEMA.sql)
ALTER TABLE customers 
ADD COLUMN IF NOT EXISTS geburtsdatum DATE,
ADD COLUMN IF NOT EXISTS bezirk VARCHAR(100),
ADD COLUMN IF NOT EXISTS agb_akzeptiert BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS datenschutz_akzeptiert BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS marketing_einverstaendnis BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS newsletter_einverstaendnis BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS notizen TEXT,
ADD COLUMN IF NOT EXISTS passwort_hash VARCHAR(255);

-- Campaigns Table
CREATE TABLE IF NOT EXISTS campaigns (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  campaign_key VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(100),
  tariff_type VARCHAR(20),
  valid_from DATE,
  valid_to DATE,
  base_price_eur_month DECIMAL(10, 2),
  energy_price_ct_kwh DECIMAL(10, 4),
  features JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

INSERT INTO campaigns (campaign_key, name, tariff_type, base_price_eur_month, energy_price_ct_kwh)
VALUES 
('DYN_BERLIN_2024', 'Dynamic Berlin 2024', 'dynamic', 9.90, 28.50),
('FIX12_BERLIN_2024', 'Fix 12 Months Berlin', 'fixed_12', 11.90, 32.50),
('FIX24_BERLIN_2024', 'Fix 24 Months Berlin', 'fixed_24', 10.90, 31.50)
ON CONFLICT (campaign_key) DO NOTHING;

-- Marketing Campaigns (Vouchers)
CREATE TABLE IF NOT EXISTS marketing_campaigns (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  campaign_id VARCHAR(50) UNIQUE NOT NULL,
  voucher_code VARCHAR(50) UNIQUE NOT NULL,
  funnel_id VARCHAR(50),
  discount_working_price_ct DECIMAL(10, 4) DEFAULT 0,
  discount_base_price_eur DECIMAL(10, 2) DEFAULT 0,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

INSERT INTO marketing_campaigns (campaign_id, voucher_code, funnel_id, discount_working_price_ct, discount_base_price_eur, start_date, end_date)
VALUES 
('CAMP-WELCOME-2025', 'WELCOME2025', 'enfinitus-website', 2.0, 5.0, '2024-01-01', '2025-12-31'),
('CAMP-VIET-START', 'VIETSTART', 'viet-energie-website', 3.0, 0.0, '2024-01-01', '2025-12-31')
ON CONFLICT (campaign_id) DO NOTHING;

-- Pricing Margins
CREATE TABLE IF NOT EXISTS pricing_margins (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  funnel_id VARCHAR(50) NOT NULL, 
  tariff_type VARCHAR(50) NOT NULL,
  margin_working_price_ct DECIMAL(10, 4) DEFAULT 0.0000,
  margin_base_price_eur DECIMAL(10, 2) DEFAULT 0.00,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(funnel_id, tariff_type)
);

INSERT INTO pricing_margins (funnel_id, tariff_type, margin_working_price_ct, margin_base_price_eur)
VALUES 
('enfinitus-website', 'FIX12', 1.5000, 2.00),
('enfinitus-website', 'FIX24', 1.0000, 1.50),
('enfinitus-website', 'DYNAMIC', 0.5000, 1.00),
('viet-energie-website', 'FIX12', 1.2000, 1.80),
('viet-energie-website', 'FIX24', 0.8000, 1.20),
('viet-energie-website', 'DYNAMIC', 0.4000, 0.90)
ON CONFLICT (funnel_id, tariff_type) DO NOTHING;

-- Tariff Price Snapshots
CREATE TABLE IF NOT EXISTS tariff_price_snapshots (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    funnel_id VARCHAR(50) NOT NULL,
    tariff_type VARCHAR(50) NOT NULL,
    zip_code VARCHAR(10) NOT NULL,
    rabot_working_price_ct DECIMAL(10, 4) NOT NULL,
    rabot_base_price_eur DECIMAL(10, 2) NOT NULL,
    margin_working_price_ct DECIMAL(10, 4) NOT NULL,
    margin_base_price_eur DECIMAL(10, 2) NOT NULL,
    final_working_price_ct DECIMAL(10, 4) NOT NULL,
    final_base_price_eur DECIMAL(10, 2) NOT NULL,
    valid_from TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    valid_to TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Contract Drafts
CREATE TABLE IF NOT EXISTS contract_drafts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  contract_id VARCHAR(100) UNIQUE,
  funnel_id VARCHAR(50),
  customer_id UUID REFERENCES customers(id),
  campaign_id UUID REFERENCES campaigns(id),
  tariff_id VARCHAR(50),
  working_price_ct_kwh DECIMAL(10, 4),
  fix_fee_eur_month DECIMAL(10, 2),
  expected_consumption INTEGER,
  contract_draft_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  desired_contract_change_date DATE,
  expected_contract_end_date DATE,
  schufa_status VARCHAR(20) DEFAULT 'PENDING',
  iban VARCHAR(34),
  sepa_mandate BOOLEAN DEFAULT FALSE,
  other_billing_info JSONB,
  status VARCHAR(20) DEFAULT 'DRAFT',
  marketing_campaign_id UUID REFERENCES marketing_campaigns(id),
  tariff_snapshot_id UUID REFERENCES tariff_price_snapshots(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- MaLo Drafts
CREATE TABLE IF NOT EXISTS malo_drafts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  customer_id UUID REFERENCES customers(id),
  contract_draft_id UUID REFERENCES contract_drafts(id),
  market_location_identifier VARCHAR(20),
  has_own_msb BOOLEAN DEFAULT FALSE,
  meter_number VARCHAR(50),
  previous_provider_code VARCHAR(20),
  previous_annual_consumption INTEGER,
  possible_supplier_change_date DATE,
  schufa_score_accepted BOOLEAN DEFAULT FALSE,
  malo_draft_status VARCHAR(20) DEFAULT 'PENDING',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Customer MaLo (Final)
CREATE TABLE IF NOT EXISTS customer_malo (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  customer_id UUID REFERENCES customers(id),
  contract_id UUID REFERENCES contract_drafts(id),
  market_location_identifier VARCHAR(20),
  has_own_msb BOOLEAN,
  meter_number VARCHAR(50),
  previous_provider_code VARCHAR(20),
  previous_annual_consumption INTEGER,
  possible_supplier_change_date DATE,
  schufa_score_accepted BOOLEAN,
  change_process_status VARCHAR(20),
  funnel_id VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Contracts (Final) - If not exists (referenced in MARKETING_CAMPAIGNS)
CREATE TABLE IF NOT EXISTS contracts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  contract_id VARCHAR(100) UNIQUE,
  customer_id UUID REFERENCES customers(id),
  status VARCHAR(20),
  marketing_campaign_id UUID REFERENCES marketing_campaigns(id),
  tariff_snapshot_id UUID REFERENCES tariff_price_snapshots(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE contract_drafts ENABLE ROW LEVEL SECURITY;
ALTER TABLE malo_drafts ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_malo ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketing_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE pricing_margins ENABLE ROW LEVEL SECURITY;
ALTER TABLE tariff_price_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable all for anon" ON customers FOR ALL USING (true);
CREATE POLICY "Enable all for anon" ON campaigns FOR ALL USING (true);
CREATE POLICY "Enable all for anon" ON contract_drafts FOR ALL USING (true);
CREATE POLICY "Enable all for anon" ON malo_drafts FOR ALL USING (true);
CREATE POLICY "Enable all for anon" ON customer_malo FOR ALL USING (true);
CREATE POLICY "Enable all for anon" ON marketing_campaigns FOR ALL USING (true);
CREATE POLICY "Enable all for anon" ON pricing_margins FOR ALL USING (true);
CREATE POLICY "Enable all for anon" ON tariff_price_snapshots FOR ALL USING (true);
CREATE POLICY "Enable all for anon" ON contracts FOR ALL USING (true);

GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;

