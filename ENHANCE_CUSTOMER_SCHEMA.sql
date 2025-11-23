-- Enhanced Customer Schema Migration
-- Adds missing fields for complete customer data storage

-- Add missing columns to customers table
ALTER TABLE customers 
ADD COLUMN IF NOT EXISTS geburtsdatum DATE,
ADD COLUMN IF NOT EXISTS bezirk VARCHAR(100),
ADD COLUMN IF NOT EXISTS agb_akzeptiert BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS datenschutz_akzeptiert BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS marketing_einverstaendnis BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS newsletter_einverstaendnis BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS notizen TEXT,
ADD COLUMN IF NOT EXISTS passwort_hash VARCHAR(255);

-- Update existing records to have required consent fields as TRUE if they exist
-- (since they wouldn't be in the DB if they hadn't accepted terms)
UPDATE customers 
SET agb_akzeptiert = TRUE, 
    datenschutz_akzeptiert = TRUE 
WHERE agb_akzeptiert IS NULL OR datenschutz_akzeptiert IS NULL;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_customers_geburtsdatum ON customers(geburtsdatum);
CREATE INDEX IF NOT EXISTS idx_customers_agb_akzeptiert ON customers(agb_akzeptiert);
CREATE INDEX IF NOT EXISTS idx_customers_datenschutz_akzeptiert ON customers(datenschutz_akzeptiert);
CREATE INDEX IF NOT EXISTS idx_customers_marketing_einverstaendnis ON customers(marketing_einverstaendnis);

-- Verify the schema
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'customers' 
ORDER BY ordinal_position;