-- Voucher Codes Database Schema für Supabase

-- Voucher Codes Tabelle
CREATE TABLE voucher_codes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    voucher_code VARCHAR(20) UNIQUE NOT NULL,
    campaign_id VARCHAR(50) NOT NULL,
    tariff_id VARCHAR(50) NOT NULL,
    start_date TIMESTAMP WITH TIME ZONE NOT NULL,
    end_date TIMESTAMP WITH TIME ZONE NOT NULL,
    discount_working_price DECIMAL(5,2) DEFAULT 0.00, -- Reduzierung in ct/kWh
    discount_base_price DECIMAL(5,2) DEFAULT 0.00,    -- Reduzierung in EUR/Monat
    max_usage_count INTEGER DEFAULT NULL,             -- Maximale Nutzung (NULL = unbegrenzt)
    current_usage_count INTEGER DEFAULT 0,            -- Aktuelle Nutzung
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Voucher Usage Tracking Tabelle
CREATE TABLE voucher_usage (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    voucher_code_id UUID REFERENCES voucher_codes(id),
    customer_id UUID,
    used_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    tariff_id VARCHAR(50) NOT NULL,
    original_monthly_cost DECIMAL(10,2),
    discounted_monthly_cost DECIMAL(10,2),
    savings_amount DECIMAL(10,2)
);

-- Indizes für bessere Performance
CREATE INDEX idx_voucher_codes_code ON voucher_codes(voucher_code);
CREATE INDEX idx_voucher_codes_active ON voucher_codes(is_active, start_date, end_date);
CREATE INDEX idx_voucher_codes_tariff ON voucher_codes(tariff_id);
CREATE INDEX idx_voucher_usage_customer ON voucher_usage(customer_id);

-- Sample Voucher Codes für Testing
INSERT INTO voucher_codes (voucher_code, campaign_id, tariff_id, start_date, end_date, discount_working_price, discount_base_price, max_usage_count) VALUES
('WELCOME2025', 'welcome-campaign-2025', 'standard-10115', '2025-01-01', '2025-12-31', 2.50, 5.00, 1000),
('GREEN50', 'green-energy-promo', 'green-10115', '2025-01-01', '2025-06-30', 1.50, 3.00, 500),
('NEUKUNDE10', 'new-customer-special', 'standard-10115', '2025-11-01', '2025-12-31', 3.00, 2.50, 100),
('WINTER2025', 'winter-special', 'dynamic-10115', '2025-12-01', '2026-02-28', 1.00, 1.50, 250);

-- RLS (Row Level Security) Policies
ALTER TABLE voucher_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE voucher_usage ENABLE ROW LEVEL SECURITY;

-- Allow read access to voucher_codes for validation
CREATE POLICY "Allow voucher code validation" ON voucher_codes
FOR SELECT USING (true);

-- Allow insert for voucher usage tracking
CREATE POLICY "Allow voucher usage insert" ON voucher_usage
FOR INSERT WITH CHECK (true);