// Test-Setup für Jest
require('dotenv').config({ path: '.env.test' });

// Test-Datenbank Konfiguration
process.env.NODE_ENV = 'test';
process.env.DB_NAME = 'evu_backend_test';
process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing-only';
process.env.LOG_LEVEL = 'error'; // Weniger Logs während Tests

// Globale Test-Utilities
global.testUtils = {
  // Test-Kunde-Daten
  testKunde: {
    email: 'test@example.com',
    passwort: 'Test123!@#',
    vorname: 'Max',
    nachname: 'Mustermann',
    strasse: 'Teststraße',
    hausnummer: '123',
    plz: '10115',
    stadt: 'Berlin',
    telefon: '+49 30 12345678'
  },
  
  // Test-PLZ-Daten
  testPlz: {
    plz: '10115',
    stadt: 'Berlin',
    bezirk: 'Mitte',
    bundesland: 'Berlin',
    netzbetreiber: 'Stromnetz Berlin'
  },
  
  // Test-Tarif-Daten
  testTarif: {
    tarif_name: 'Test Tarif Fix12',
    tarif_typ: 'fest',
    vertragslaufzeit_monate: 12,
    min_verbrauch_kwh: 500,
    max_verbrauch_kwh: 10000
  },
  
  // Test-Preisdaten
  testPreise: {
    arbeitspreis_cent_pro_kwh: 28.50,
    grundpreis_euro_pro_monat: 9.90,
    netzentgelte_cent_pro_kwh: 7.20,
    steuern_cent_pro_kwh: 5.40
  }
};

// Mock für Logger (reduziert Ausgabe in Tests)
jest.mock('../src/utils/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn()
}));

// Timeout für alle Tests erhöhen
jest.setTimeout(30000);

// Cleanup nach jedem Test
afterEach(() => {
  jest.clearAllMocks();
});

console.log('🧪 Test-Setup geladen - EVU Backend Tests bereit');