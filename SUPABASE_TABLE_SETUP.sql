-- ================================================
-- SUPABASE DATABASE SETUP INSTRUCTIONS
-- ================================================
-- 
-- CRITICAL: You need to create the database tables manually in Supabase
-- The API key appears to be invalid for programmatic table creation
--
-- STEPS TO FOLLOW:
-- 1. Go to https://lorqrxsqgvpjjxfbqugy.supabase.co
-- 2. Login to your Supabase dashboard  
-- 3. Navigate to SQL Editor (sidebar)
-- 4. Copy and paste the SQL below into the editor
-- 5. Click "Run" to execute the SQL
--
-- ================================================

-- Enable UUID extension (required for primary keys)
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

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);
CREATE INDEX IF NOT EXISTS idx_pricing_data_customer_id ON pricing_data(customer_id);
CREATE INDEX IF NOT EXISTS idx_contracts_customer_id ON contracts(customer_id);

-- Insert a test customer to verify everything works
INSERT INTO customers (vorname, nachname, strasse, hausnummer, plz, ort, email, telefon) 
VALUES ('Test', 'User', 'Teststraße', '123', '12345', 'Teststadt', 'test@example.com', '+49 123 456789')
ON CONFLICT (email) DO NOTHING;

-- Verify tables were created successfully
SELECT 'customers' as table_name, COUNT(*) as record_count FROM customers
UNION ALL
SELECT 'pricing_data' as table_name, COUNT(*) as record_count FROM pricing_data
UNION ALL
SELECT 'contracts' as table_name, COUNT(*) as record_count FROM contracts;

-- ================================================
-- AFTER RUNNING THIS SQL:
-- 1. You should see a success message in Supabase
-- 2. Check the "Table Editor" to see your new tables
-- 3. Return to VS Code and run the tests again
-- ================================================