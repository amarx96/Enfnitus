-- Contracting Service Schema for Supabase

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Campaigns Table (Dyn, Fix12, Fix24)
CREATE TABLE IF NOT EXISTS campaigns (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  campaign_key VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(100),
  tariff_type VARCHAR(20), -- 'dynamic', 'fixed_12', 'fixed_24'
  valid_from DATE,
  valid_to DATE,
  base_price_eur_month DECIMAL(10, 2),
  energy_price_ct_kwh DECIMAL(10, 4),
  features JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default campaigns if not exist
INSERT INTO campaigns (campaign_key, name, tariff_type, base_price_eur_month, energy_price_ct_kwh)
VALUES 
('DYN_BERLIN_2024', 'Dynamic Berlin 2024', 'dynamic', 9.90, 28.50),
('FIX12_BERLIN_2024', 'Fix 12 Months Berlin', 'fixed_12', 11.90, 32.50),
('FIX24_BERLIN_2024', 'Fix 24 Months Berlin', 'fixed_24', 10.90, 31.50)
ON CONFLICT (campaign_key) DO NOTHING;

-- Contract Drafts Table
-- Temporary holding area for new contracts
CREATE TABLE IF NOT EXISTS contract_drafts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  contract_id VARCHAR(100) UNIQUE, -- Generated ID
  funnel_id VARCHAR(50), -- Track source (Enfinitus, Viet Energie)
  customer_id UUID REFERENCES customers(id),
  campaign_id UUID REFERENCES campaigns(id),
  tariff_id VARCHAR(50),
  
  -- Pricing Snapshot
  working_price_ct_kwh DECIMAL(10, 4),
  fix_fee_eur_month DECIMAL(10, 2),
  expected_consumption INTEGER,
  
  -- Contract Details
  contract_draft_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  desired_contract_change_date DATE,
  expected_contract_end_date DATE,
  
  -- Billing & Legal
  schufa_status VARCHAR(20) DEFAULT 'PENDING', -- PENDING, APPROVED, REJECTED
  iban VARCHAR(34),
  sepa_mandate BOOLEAN DEFAULT FALSE,
  other_billing_info JSONB,
  
  status VARCHAR(20) DEFAULT 'DRAFT', -- DRAFT, VALIDATING, ACTIVE, SWITCH_FAILED
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- MaLo Drafts Table
-- Staging for market-location details
CREATE TABLE IF NOT EXISTS malo_drafts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  customer_id UUID REFERENCES customers(id),
  contract_draft_id UUID REFERENCES contract_drafts(id),
  
  market_location_identifier VARCHAR(20), -- MaLo ID
  has_own_msb BOOLEAN DEFAULT FALSE,
  meter_number VARCHAR(50),
  previous_provider_code VARCHAR(20),
  previous_annual_consumption INTEGER,
  possible_supplier_change_date DATE,
  
  schufa_score_accepted BOOLEAN DEFAULT FALSE,
  malo_draft_status VARCHAR(20) DEFAULT 'PENDING', -- PENDING, APPROVED, REJECTED
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Customer MaLo Table (Final)
-- Definitive record linked to confirmed contracts
CREATE TABLE IF NOT EXISTS customer_malo (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  customer_id UUID REFERENCES customers(id),
  contract_id UUID REFERENCES contract_drafts(id), -- Link to contract
  
  market_location_identifier VARCHAR(20),
  has_own_msb BOOLEAN,
  meter_number VARCHAR(50),
  previous_provider_code VARCHAR(20),
  previous_annual_consumption INTEGER,
  possible_supplier_change_date DATE,
  
  schufa_score_accepted BOOLEAN,
  change_process_status VARCHAR(20), -- IN_PROGRESS, COMPLETED, FAILED
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Change Logs
-- Historization of changes
CREATE TABLE IF NOT EXISTS change_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  table_name VARCHAR(50),
  record_id UUID,
  field_name VARCHAR(50),
  old_value TEXT,
  new_value TEXT,
  changed_by VARCHAR(100), -- 'SYSTEM' or Admin ID
  changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add FunnelID to Customer MaLo if needed (redundant if in contract_drafts, but user asked)
ALTER TABLE customer_malo ADD COLUMN IF NOT EXISTS funnel_id VARCHAR(50);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_contract_drafts_modtime BEFORE UPDATE ON contract_drafts FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_malo_drafts_modtime BEFORE UPDATE ON malo_drafts FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_customer_malo_modtime BEFORE UPDATE ON customer_malo FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- RLS Policies (simplified for dev)
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE contract_drafts ENABLE ROW LEVEL SECURITY;
ALTER TABLE malo_drafts ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_malo ENABLE ROW LEVEL SECURITY;
ALTER TABLE change_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable all for anon" ON campaigns FOR ALL USING (true);
CREATE POLICY "Enable all for anon" ON contract_drafts FOR ALL USING (true);
CREATE POLICY "Enable all for anon" ON malo_drafts FOR ALL USING (true);
CREATE POLICY "Enable all for anon" ON customer_malo FOR ALL USING (true);
CREATE POLICY "Enable all for anon" ON change_logs FOR ALL USING (true);

GRANT ALL ON campaigns TO anon, authenticated;
GRANT ALL ON contract_drafts TO anon, authenticated;
GRANT ALL ON malo_drafts TO anon, authenticated;
GRANT ALL ON customer_malo TO anon, authenticated;
GRANT ALL ON change_logs TO anon, authenticated;

