/**
 * Test Environment Configuration
 * Configures EVU Backend tests to use dummy API
 */

// Test API Configuration
const TEST_API_CONFIG = {
  baseUrl: process.env.TEST_API_URL || 'http://localhost:3001',
  port: process.env.TEST_API_PORT || 3001,
  enabled: process.env.USE_TEST_API === 'true' || process.env.NODE_ENV === 'test-integration',
  timeout: 30000, // 30 seconds
  retries: 3
};

// Database mock configuration for integration tests
const DATABASE_CONFIG = {
  mockMode: process.env.DB_MOCK_MODE || 'dummy-api', // 'memory', 'dummy-api', 'real'
  connectionString: process.env.TEST_DATABASE_URL || 'postgresql://test:test@localhost:5432/evu_test',
  poolSize: 5,
  idleTimeout: 10000
};

// JWT configuration for tests
const JWT_CONFIG = {
  secret: process.env.JWT_SECRET || 'test-dummy-api-secret-2024',
  expiresIn: process.env.JWT_EXPIRES_IN || '24h',
  algorithm: 'HS256'
};

// Test data configuration
const TEST_DATA_CONFIG = {
  customerCount: 50,
  tariffCount: 12,
  contractCount: 35,
  plzList: ['10115', '20095', '80331', '50667', '60311', '70173', '40213', '44135', '45127', '04109'],
  defaultPlz: '10115',
  defaultConsumption: 3500,
  defaultHouseholdSize: 2
};

// Test environment detection
const isTestEnvironment = () => {
  return process.env.NODE_ENV === 'test' || 
         process.env.NODE_ENV === 'test-integration' ||
         process.env.JEST_WORKER_ID !== undefined;
};

const isIntegrationTest = () => {
  return process.env.NODE_ENV === 'test-integration' ||
         process.env.USE_TEST_API === 'true';
};

// API endpoint mappings for integration tests
const API_ENDPOINTS = {
  auth: {
    register: '/api/v1/auth/register',
    login: '/api/v1/auth/login',
    verify: '/api/v1/auth/verify'
  },
  customers: {
    profile: '/api/v1/kunden/profil',
    energyProfile: '/api/v1/kunden/energie-profil',
    consumptionHistory: '/api/v1/kunden/verbrauchshistorie',
    deleteAccount: '/api/v1/kunden/konto-loeschen'
  },
  pricing: {
    calculate: '/api/v1/preise/berechnen',
    tariffs: '/api/v1/preise/tarife',
    locations: '/api/v1/preise/standorte'
  },
  contracts: {
    list: '/api/v1/vertraege',
    draft: '/api/v1/vertraege/entwurf',
    approve: '/api/v1/vertraege/genehmigen',
    cancel: '/api/v1/vertraege/kuendigen'
  },
  system: {
    health: '/health',
    info: '/info'
  }
};

// Test utilities for integration testing
const testUtils = {
  // Generate test customer data
  generateTestCustomer: (overrides = {}) => ({
    email: `test.${Date.now()}@example.com`,
    passwort: 'TestPasswort123!',
    vorname: 'Max',
    nachname: 'Mustermann',
    telefon: '+49 30 12345678',
    plz: TEST_DATA_CONFIG.defaultPlz,
    ...overrides
  }),

  // Generate pricing request
  generatePricingRequest: (overrides = {}) => ({
    plz: TEST_DATA_CONFIG.defaultPlz,
    jahresverbrauch: TEST_DATA_CONFIG.defaultConsumption,
    haushaltsgröße: TEST_DATA_CONFIG.defaultHouseholdSize,
    ...overrides
  }),

  // Generate contract draft request
  generateContractRequest: (tariffId, overrides = {}) => ({
    tarif_id: tariffId,
    kampagne_id: `test_kampagne_${Date.now()}`,
    geschaetzter_jahresverbrauch: TEST_DATA_CONFIG.defaultConsumption,
    ...overrides
  }),

  // Build full API URL
  buildApiUrl: (endpoint) => {
    return `${TEST_API_CONFIG.baseUrl}${endpoint}`;
  },

  // Create authorization header
  createAuthHeader: (token) => ({
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }),

  // Wait for API to be ready
  waitForApi: async (maxAttempts = 10, delay = 1000) => {
    const axios = require('axios');
    
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const response = await axios.get(testUtils.buildApiUrl('/health'), {
          timeout: 5000
        });
        
        if (response.status === 200 && response.data.erfolg) {
          console.log(`✅ Test API is ready (attempt ${attempt})`);
          return true;
        }
      } catch (error) {
        if (attempt === maxAttempts) {
          console.error(`❌ Test API not ready after ${maxAttempts} attempts`);
          throw new Error('Test API is not responding');
        }
        
        console.log(`⏳ Waiting for Test API... (attempt ${attempt}/${maxAttempts})`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    return false;
  }
};

// Jest setup for integration tests
const setupIntegrationTests = () => {
  if (!isIntegrationTest()) {
    return;
  }

  // Set longer timeout for integration tests
  jest.setTimeout(60000);

  // Global setup before all tests
  beforeAll(async () => {
    if (TEST_API_CONFIG.enabled) {
      console.log('🔧 Setting up integration test environment...');
      
      // Wait for test API to be ready
      await testUtils.waitForApi();
      
      console.log('✅ Integration test environment ready');
    }
  });

  // Cleanup after all tests
  afterAll(async () => {
    if (TEST_API_CONFIG.enabled) {
      console.log('🧹 Cleaning up integration test environment...');
      // Additional cleanup if needed
    }
  });
};

// Mock database adapter for integration tests
const createDatabaseAdapter = () => {
  if (DATABASE_CONFIG.mockMode === 'dummy-api') {
    const axios = require('axios');
    
    return {
      query: async (sql, params = []) => {
        // Route database queries to dummy API
        // This is a simplified adapter - in practice, you'd map SQL to API calls
        console.log(`🔄 Database query routed to dummy API: ${sql}`);
        
        // Example: Map common queries to API endpoints
        if (sql.includes('SELECT') && sql.includes('kunden')) {
          // Simulate customer query
          return { rows: [], rowCount: 0 };
        }
        
        return { rows: [], rowCount: 0 };
      },
      
      connect: async () => {
        console.log('🔗 Connected to dummy API database adapter');
        return true;
      },
      
      disconnect: async () => {
        console.log('🔌 Disconnected from dummy API database adapter');
        return true;
      }
    };
  }
  
  // Return standard database adapter for other modes
  return require('../src/config/database');
};

module.exports = {
  TEST_API_CONFIG,
  DATABASE_CONFIG,
  JWT_CONFIG,
  TEST_DATA_CONFIG,
  API_ENDPOINTS,
  testUtils,
  isTestEnvironment,
  isIntegrationTest,
  setupIntegrationTests,
  createDatabaseAdapter
};