-- Create pricing_margins table
CREATE TABLE IF NOT EXISTS pricing_margins (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  funnel_id VARCHAR(50) NOT NULL, 
  tariff_type VARCHAR(50) NOT NULL, -- 'FIX12', 'FIX24', 'DYNAMIC', 'GREEN'
  margin_working_price_ct DECIMAL(10, 4) DEFAULT 0.0000,
  margin_base_price_eur DECIMAL(10, 2) DEFAULT 0.00,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(funnel_id, tariff_type)
);

-- Enable RLS
ALTER TABLE pricing_margins ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow read access" ON pricing_margins;
CREATE POLICY "Allow read access" ON pricing_margins FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow all access for authenticated" ON pricing_margins;
CREATE POLICY "Allow all access for authenticated" ON pricing_margins USING (true) WITH CHECK (true);

GRANT ALL ON pricing_margins TO anon, authenticated;

-- Seed default margins
INSERT INTO pricing_margins (funnel_id, tariff_type, margin_working_price_ct, margin_base_price_eur)
VALUES 
('enfinitus-website', 'FIX12', 1.5000, 2.00),
('enfinitus-website', 'FIX24', 1.0000, 1.50),
('enfinitus-website', 'DYNAMIC', 0.5000, 1.00),
('viet-energie-website', 'FIX12', 1.2000, 1.80),
('viet-energie-website', 'FIX24', 0.8000, 1.20),
('viet-energie-website', 'DYNAMIC', 0.4000, 0.90)
ON CONFLICT (funnel_id, tariff_type) DO NOTHING;

SELECT 'Pricing Margins table created successfully' as message;

