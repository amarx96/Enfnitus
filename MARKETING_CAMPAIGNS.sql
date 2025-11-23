-- Marketing Campaigns & Voucher System
-- Extends the Contracting Service Architecture

-- Enable UUID extension if not already
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Marketing Campaigns Table
-- Defines voucher-based campaigns with discounts
CREATE TABLE IF NOT EXISTS marketing_campaigns (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  campaign_id VARCHAR(50) UNIQUE NOT NULL, -- Generated e.g., CAMP-XMAS-2024
  voucher_code VARCHAR(50) UNIQUE NOT NULL,
  funnel_id VARCHAR(50), -- To link to specific funnels (e.g. viet-energie-website)
  
  -- Discounts
  discount_working_price_ct DECIMAL(10, 4) DEFAULT 0,
  discount_base_price_eur DECIMAL(10, 2) DEFAULT 0,
  
  -- Validity
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add Voucher Link to Contract Drafts
-- Tracks which voucher was applied to a contract
ALTER TABLE contract_drafts 
ADD COLUMN IF NOT EXISTS marketing_campaign_id UUID REFERENCES marketing_campaigns(id);

-- Add Voucher Link to Final Contracts
-- Ensures billing can reference the original campaign terms
ALTER TABLE contracts 
ADD COLUMN IF NOT EXISTS marketing_campaign_id UUID REFERENCES marketing_campaigns(id);

-- Trigger for updated_at
CREATE TRIGGER update_marketing_campaigns_modtime 
BEFORE UPDATE ON marketing_campaigns 
FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- RLS Policies
ALTER TABLE marketing_campaigns ENABLE ROW LEVEL SECURITY;

-- Allow everyone to read active campaigns (for validation)
CREATE POLICY "Allow public read active campaigns" ON marketing_campaigns
FOR SELECT USING (is_active = true);

-- Allow authenticated users (Ops) to manage campaigns
CREATE POLICY "Allow ops manage campaigns" ON marketing_campaigns
FOR ALL USING (true);

GRANT ALL ON marketing_campaigns TO anon, authenticated;

-- Insert sample campaign
INSERT INTO marketing_campaigns (campaign_id, voucher_code, funnel_id, discount_working_price_ct, discount_base_price_eur, start_date, end_date)
VALUES 
('CAMP-WELCOME-2025', 'WELCOME2025', 'enfinitus-website', 2.0, 5.0, '2024-01-01', '2025-12-31'),
('CAMP-VIET-START', 'VIETSTART', 'viet-energie-website', 3.0, 0.0, '2024-01-01', '2025-12-31')
ON CONFLICT (campaign_id) DO NOTHING;

