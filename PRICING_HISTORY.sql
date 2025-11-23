-- Create tariff_price_snapshots table
CREATE TABLE IF NOT EXISTS tariff_price_snapshots (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    funnel_id VARCHAR(50) NOT NULL,
    tariff_type VARCHAR(50) NOT NULL,
    zip_code VARCHAR(10) NOT NULL,
    
    -- Price Components
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

-- Add indexes
CREATE INDEX idx_snapshots_lookup ON tariff_price_snapshots(funnel_id, tariff_type, zip_code);

-- Add columns to contracts
ALTER TABLE contract_drafts 
ADD COLUMN IF NOT EXISTS tariff_snapshot_id UUID REFERENCES tariff_price_snapshots(id);

ALTER TABLE contracts 
ADD COLUMN IF NOT EXISTS tariff_snapshot_id UUID REFERENCES tariff_price_snapshots(id);

-- Grant access
GRANT ALL ON tariff_price_snapshots TO anon, authenticated;

SELECT 'Tariff Price Snapshots table created' as message;

