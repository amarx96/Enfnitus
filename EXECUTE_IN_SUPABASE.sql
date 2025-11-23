-- ==================================================
-- COPY THIS EXACTLY INTO SUPABASE SQL EDITOR
-- ==================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create customers table
CREATE TABLE IF NOT EXISTS customers (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  vorname VARCHAR(100) NOT NULL,
  nachname VARCHAR(100) NOT NULL,
  strasse VARCHAR(200) NOT NULL,
  hausnummer VARCHAR(20) NOT NULL,
  plz VARCHAR(10) NOT NULL,
  ort VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  telefon VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create pricing_data table
CREATE TABLE IF NOT EXISTS pricing_data (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  plz VARCHAR(10) NOT NULL,
  verbrauch INTEGER NOT NULL,
  haushaltsgroesse INTEGER NOT NULL,
  smart_meter BOOLEAN DEFAULT FALSE,
  selected_tariff JSONB,
  estimated_costs JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create contracts table
CREATE TABLE IF NOT EXISTS contracts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  pricing_id UUID REFERENCES pricing_data(id) ON DELETE SET NULL,
  contract_number VARCHAR(50) UNIQUE,
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'pending', 'active', 'cancelled')),
  start_date DATE,
  end_date DATE,
  terms_accepted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);
CREATE INDEX IF NOT EXISTS idx_pricing_data_customer_id ON pricing_data(customer_id);
CREATE INDEX IF NOT EXISTS idx_contracts_customer_id ON contracts(customer_id);

-- Enable Row Level Security
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE pricing_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;

-- Create permissive policies (allow all operations)
CREATE POLICY IF NOT EXISTS "Allow all operations" ON customers FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "Allow all operations" ON pricing_data FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "Allow all operations" ON contracts FOR ALL USING (true) WITH CHECK (true);

-- Grant permissions
GRANT ALL ON customers TO anon, authenticated;
GRANT ALL ON pricing_data TO anon, authenticated;
GRANT ALL ON contracts TO anon, authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;

-- Test insert to verify everything works
INSERT INTO customers (vorname, nachname, strasse, hausnummer, plz, ort, email, telefon) 
VALUES ('Test', 'User', 'Teststraße', '123', '12345', 'Teststadt', 'test@example.com', '+49 123 456789')
ON CONFLICT (email) DO NOTHING;

-- Verify tables exist
SELECT 'SUCCESS: Tables created!' AS result;
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('customers', 'pricing_data', 'contracts')
ORDER BY table_name;