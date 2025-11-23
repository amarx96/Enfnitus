-- COMPREHENSIVE SCHEMA REPAIR SCRIPT
-- Ensures all tables have all required columns, even if tables existed before.

-- 1. Fix CONTRACT_DRAFTS
ALTER TABLE contract_drafts 
ADD COLUMN IF NOT EXISTS marketing_campaign_id UUID REFERENCES marketing_campaigns(id),
ADD COLUMN IF NOT EXISTS tariff_snapshot_id UUID REFERENCES tariff_price_snapshots(id),
ADD COLUMN IF NOT EXISTS schufa_status VARCHAR(20) DEFAULT 'PENDING',
ADD COLUMN IF NOT EXISTS iban VARCHAR(34),
ADD COLUMN IF NOT EXISTS sepa_mandate BOOLEAN DEFAULT FALSE;

-- 2. Fix CONTRACTS
ALTER TABLE contracts 
ADD COLUMN IF NOT EXISTS marketing_campaign_id UUID REFERENCES marketing_campaigns(id),
ADD COLUMN IF NOT EXISTS tariff_snapshot_id UUID REFERENCES tariff_price_snapshots(id);

-- 3. Fix CUSTOMER_MALO
ALTER TABLE customer_malo 
ADD COLUMN IF NOT EXISTS funnel_id VARCHAR(50);

-- 4. Fix MALO_DRAFTS (Just in case)
ALTER TABLE malo_drafts
ADD COLUMN IF NOT EXISTS previous_provider_code VARCHAR(20),
ADD COLUMN IF NOT EXISTS previous_annual_consumption INTEGER;

-- 5. FORCE SCHEMA RELOAD
NOTIFY pgrst, 'reload schema';

