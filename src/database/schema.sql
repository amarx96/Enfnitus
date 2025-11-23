-- Enfinitus Energie EVU Datenbankschema
-- Basierend auf der EVU Backend-Architektur für vietnamesischen Gemeinschafts-Energieversorger

-- Tabellen löschen falls sie existieren (für Entwicklung/Reset-Zwecke)
DROP TABLE IF EXISTS vertragsentwuerfe CASCADE;
DROP TABLE IF EXISTS vertraege CASCADE;
DROP TABLE IF EXISTS kunden_metadaten CASCADE;
DROP TABLE IF EXISTS kunden CASCADE;
DROP TABLE IF EXISTS preis_kampagnen CASCADE;
DROP TABLE IF EXISTS preis_tabellen CASCADE;
DROP TABLE IF EXISTS tarife CASCADE;
DROP TABLE IF EXISTS plz_daten CASCADE;

-- Tabellen erstellen

-- PLZ (Postleitzahl) Datentabelle
-- Speichert deutsche Postleitzahlen mit Stadt- und Bezirksinformationen
CREATE TABLE plz_daten (
    id SERIAL PRIMARY KEY,
    plz VARCHAR(5) NOT NULL,
    stadt VARCHAR(100) NOT NULL,
    bezirk VARCHAR(100),
    bundesland VARCHAR(50),
    netzbetreiber VARCHAR(100),
    netzbetreiber_code VARCHAR(20),
    erstellt_am TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    aktualisiert_am TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(plz, stadt, bezirk)
);

-- Tarife Tabelle
-- Definiert verschiedene Stromtarife (Fix12, Fix24, Dynamisch, etc.)
CREATE TABLE tarife (
    id SERIAL PRIMARY KEY,
    tarif_name VARCHAR(50) NOT NULL UNIQUE,
    tarif_typ VARCHAR(20) NOT NULL, -- 'fest', 'dynamisch', 'gruen'
    vertragslaufzeit_monate INTEGER NOT NULL,
    min_verbrauch_kwh INTEGER DEFAULT 0,
    max_verbrauch_kwh INTEGER,
    zielkunden_typ VARCHAR(20) DEFAULT 'haushalt', -- 'haushalt', 'geschaeft'
    abrechnungs_haeufigkeit VARCHAR(20) DEFAULT 'monatlich', -- 'monatlich', 'quartalsweise', 'jaehrlich'
    min_marge_prozent DECIMAL(5,2) DEFAULT 0,
    max_marge_prozent DECIMAL(5,2) DEFAULT 100,
    ist_aktiv BOOLEAN DEFAULT true,
    erstellt_am TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    aktualisiert_am TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Preis-Kampagnen Tabelle
-- Verwaltet Preiskampagnen für verschiedene Tarife und Regionen
CREATE TABLE preis_kampagnen (
    id SERIAL PRIMARY KEY,
    kampagne_id VARCHAR(50) NOT NULL UNIQUE,
    kampagne_name VARCHAR(100) NOT NULL,
    tarif_id INTEGER REFERENCES tarife(id),
    gueltig_von DATE NOT NULL,
    gueltig_bis DATE,
    ist_aktiv BOOLEAN DEFAULT true,
    erstellt_von VARCHAR(100),
    erstellt_am TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    aktualisiert_am TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Preistabellen
-- Speichert Preisinformationen für jede PLZ-Stadt-Bezirk-Tarif-Kombination
CREATE TABLE preis_tabellen (
    id SERIAL PRIMARY KEY,
    kampagne_id VARCHAR(50) REFERENCES preis_kampagnen(kampagne_id),
    plz VARCHAR(5) NOT NULL,
    stadt VARCHAR(100) NOT NULL,
    bezirk VARCHAR(100),
    tarif_id INTEGER REFERENCES tarife(id),
    arbeitspreis_cent_pro_kwh DECIMAL(8,4) NOT NULL, -- Cent pro kWh
    grundpreis_euro_pro_monat DECIMAL(8,2) NOT NULL, -- Monatlicher Grundpreis in EUR
    netzentgelte_cent_pro_kwh DECIMAL(8,4) DEFAULT 0,
    steuern_cent_pro_kwh DECIMAL(8,4) DEFAULT 0,
    erneuerbare_umlage_cent_pro_kwh DECIMAL(8,4) DEFAULT 0,
    gueltigkeits_datum DATE NOT NULL,
    erstellt_am TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    aktualisiert_am TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(kampagne_id, plz, stadt, bezirk, tarif_id, gueltigkeits_datum)
);

-- Kunden Tabelle
-- Grundlegende Kundeninformationen und Authentifizierung
CREATE TABLE kunden (
    id SERIAL PRIMARY KEY,
    kunden_id VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    passwort_hash VARCHAR(255) NOT NULL,
    vorname VARCHAR(100) NOT NULL,
    nachname VARCHAR(100) NOT NULL,
    telefon VARCHAR(20),
    geburtsdatum DATE,
    
    -- Adressinformationen
    strasse VARCHAR(255),
    hausnummer VARCHAR(10),
    plz VARCHAR(5),
    stadt VARCHAR(100),
    bezirk VARCHAR(100),
    land VARCHAR(50) DEFAULT 'Deutschland',
    
    -- Kundenpräferenzen
    bevorzugte_sprache VARCHAR(10) DEFAULT 'de',
    marketing_einverstaendnis BOOLEAN DEFAULT false,
    newsletter_einverstaendnis BOOLEAN DEFAULT false,
    
    -- Kontostatus
    ist_aktiv BOOLEAN DEFAULT true,
    ist_verifiziert BOOLEAN DEFAULT false,
    verifizierungs_token VARCHAR(255),
    passwort_reset_token VARCHAR(255),
    passwort_reset_ablauf TIMESTAMP WITH TIME ZONE,
    
    -- Zeitstempel
    erstellt_am TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    aktualisiert_am TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    letzter_login TIMESTAMP WITH TIME ZONE
);

-- Kunden-Metadaten Tabelle
-- Zusätzliche Kundeninformationen für Energieversorgung
CREATE TABLE kunden_metadaten (
    id SERIAL PRIMARY KEY,
    kunden_id VARCHAR(50) REFERENCES kunden(kunden_id),
    
    -- Energieverbrauchsdaten
    jahresverbrauch_kwh INTEGER,
    haushaltgroesse INTEGER,
    zaehler_nummer VARCHAR(50),
    marktlokations_id VARCHAR(100), -- MaLo ID
    
    -- Vorheriger Anbieterinformationen
    vorheriger_anbieter_name VARCHAR(100),
    vorheriger_anbieter_code VARCHAR(20),
    vorheriger_jahresverbrauch_kwh INTEGER,
    anbieter_wechsel_datum DATE,
    
    -- Bonitätsprüfung und Verifizierung
    schufa_score INTEGER,
    schufa_check_date DATE,
    identity_verified BOOLEAN DEFAULT false,
    identity_verification_date TIMESTAMP WITH TIME ZONE,
    
    -- Energy profile
    heating_type VARCHAR(50), -- 'gas', 'electric', 'oil', 'renewable'
    has_electric_vehicle BOOLEAN DEFAULT false,
    has_solar_panels BOOLEAN DEFAULT false,
    has_heat_pump BOOLEAN DEFAULT false,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Contract Drafts Table
-- Temporary storage for contract creation process
CREATE TABLE contract_drafts (
    id SERIAL PRIMARY KEY,
    draft_id VARCHAR(50) NOT NULL UNIQUE,
    customer_id VARCHAR(50) REFERENCES customers(customer_id),
    campaign_id VARCHAR(50) REFERENCES pricing_campaigns(campaign_id),
    tariff_id INTEGER REFERENCES tariffs(id),
    
    -- Pricing snapshot
    working_price_cent_per_kwh DECIMAL(8,4),
    base_price_euro_per_month DECIMAL(8,2),
    estimated_annual_cost_euro DECIMAL(10,2),
    estimated_annual_consumption_kwh INTEGER,
    
    -- Contract terms
    contract_start_date DATE,
    contract_duration_months INTEGER,
    
    -- Status tracking
    status VARCHAR(20) DEFAULT 'draft', -- 'draft', 'pending', 'approved', 'rejected', 'signed'
    expires_at TIMESTAMP WITH TIME ZONE,
    
    -- Additional data
    additional_terms JSONB,
    notes TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Contracts Table
-- Finalized customer contracts
CREATE TABLE contracts (
    id SERIAL PRIMARY KEY,
    contract_id VARCHAR(50) NOT NULL UNIQUE,
    customer_id VARCHAR(50) REFERENCES customers(customer_id),
    campaign_id VARCHAR(50) REFERENCES pricing_campaigns(campaign_id),
    tariff_id INTEGER REFERENCES tariffs(id),
    
    -- Contract details
    contract_number VARCHAR(50) NOT NULL UNIQUE,
    contract_start_date DATE NOT NULL,
    contract_end_date DATE NOT NULL,
    contract_duration_months INTEGER NOT NULL,
    
    -- Pricing information (snapshot at contract time)
    working_price_cent_per_kwh DECIMAL(8,4) NOT NULL,
    base_price_euro_per_month DECIMAL(8,2) NOT NULL,
    estimated_annual_cost_euro DECIMAL(10,2),
    
    -- Energy details
    annual_consumption_kwh INTEGER NOT NULL,
    meter_number VARCHAR(50),
    meter_location_identifier VARCHAR(100),
    
    -- Status
    status VARCHAR(20) DEFAULT 'active', -- 'active', 'suspended', 'terminated', 'expired'
    signed_at TIMESTAMP WITH TIME ZONE,
    activated_at TIMESTAMP WITH TIME ZONE,
    terminated_at TIMESTAMP WITH TIME ZONE,
    termination_reason VARCHAR(255),
    
    -- Contract documents
    contract_document_url VARCHAR(500),
    signed_document_url VARCHAR(500),
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX idx_customers_email ON customers(email);
CREATE INDEX idx_customers_plz ON customers(plz);
CREATE INDEX idx_customers_customer_id ON customers(customer_id);
CREATE INDEX idx_pricing_tables_plz ON pricing_tables(plz);
CREATE INDEX idx_pricing_tables_campaign_tariff ON pricing_tables(campaign_id, tariff_id);
CREATE INDEX idx_contracts_customer_id ON contracts(customer_id);
CREATE INDEX idx_contracts_status ON contracts(status);
CREATE INDEX idx_customer_metas_customer_id ON customer_metas(customer_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at columns
CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON customers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_customer_metas_updated_at BEFORE UPDATE ON customer_metas FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_contracts_updated_at BEFORE UPDATE ON contracts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_contract_drafts_updated_at BEFORE UPDATE ON contract_drafts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_pricing_tables_updated_at BEFORE UPDATE ON pricing_tables FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_pricing_campaigns_updated_at BEFORE UPDATE ON pricing_campaigns FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tariffs_updated_at BEFORE UPDATE ON tariffs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_plz_data_updated_at BEFORE UPDATE ON plz_data FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();