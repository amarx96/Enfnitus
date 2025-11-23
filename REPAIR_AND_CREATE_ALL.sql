-- FINAL REPAIR & CREATE SCRIPT
-- Ensures all dependencies exist before linking them.

-- 1. Create Dependencies (if missing)
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

-- 2. Fix CONTRACT_DRAFTS (Add columns and references)
ALTER TABLE contract_drafts 
ADD COLUMN IF NOT EXISTS marketing_campaign_id UUID REFERENCES marketing_campaigns(id),
ADD COLUMN IF NOT EXISTS tariff_snapshot_id UUID REFERENCES tariff_price_snapshots(id),
ADD COLUMN IF NOT EXISTS schufa_status VARCHAR(20) DEFAULT 'PENDING',
ADD COLUMN IF NOT EXISTS iban VARCHAR(34),
ADD COLUMN IF NOT EXISTS sepa_mandate BOOLEAN DEFAULT FALSE;

-- 3. Fix CONTRACTS
ALTER TABLE contracts 
ADD COLUMN IF NOT EXISTS marketing_campaign_id UUID REFERENCES marketing_campaigns(id),
ADD COLUMN IF NOT EXISTS tariff_snapshot_id UUID REFERENCES tariff_price_snapshots(id);

-- 4. Fix CUSTOMER_MALO
ALTER TABLE customer_malo 
ADD COLUMN IF NOT EXISTS funnel_id VARCHAR(50);

-- 5. Enable RLS for new tables
ALTER TABLE tariff_price_snapshots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable all for anon" ON tariff_price_snapshots FOR ALL USING (true);

-- 6. FORCE SCHEMA RELOAD
NOTIFY pgrst, 'reload schema';

