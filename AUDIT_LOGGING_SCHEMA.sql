-- Audit Trail & Logging Schema
-- Required for regulatory compliance and process replay

-- 1. Import Requests Log
-- Stores raw payloads from the sales funnel for debugging and replay
CREATE TABLE IF NOT EXISTS import_requests (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    payload JSONB NOT NULL,
    source_ip VARCHAR(50),
    user_agent TEXT,
    processed_successfully BOOLEAN DEFAULT FALSE,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Contract Events Log
-- Immutable audit trail of high-level state changes
CREATE TABLE IF NOT EXISTS contract_events (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    contract_id VARCHAR(100) NOT NULL, -- Reference to the string ID (e.g. CONT-...)
    event_type VARCHAR(50) NOT NULL, -- 'DRAFT_CREATED', 'VALIDATION_PASSED', 'MANUAL_EDIT', 'ACTIVATED', 'SWITCH_FAILED'
    performed_by VARCHAR(100) DEFAULT 'SYSTEM', -- 'SYSTEM' or Admin User ID
    details JSONB, -- Context specific data (e.g. validation scores)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_contract_events_contract_id ON contract_events(contract_id);
CREATE INDEX idx_import_requests_created_at ON import_requests(created_at);

-- RLS
ALTER TABLE import_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE contract_events ENABLE ROW LEVEL SECURITY;

-- Allow System/Ops to write
CREATE POLICY "Allow authenticated insert" ON import_requests FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated select" ON import_requests FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated all" ON contract_events FOR ALL TO authenticated USING (true);

-- Notify Schema Cache
NOTIFY pgrst, 'reload schema';

