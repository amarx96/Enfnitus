/**
 * Integration Tests using Dummy API
 * Tests real API flows with mock data
 */

const request = require('supertest');
const axios = require('axios');
const { testUtils, API_ENDPOINTS, TEST_API_CONFIG } = require('../../test-environment');

// Configure axios for dummy API
const apiClient = axios.create({
  baseURL: TEST_API_CONFIG.baseUrl,
  timeout: TEST_API_CONFIG.timeout,
  headers: {
    'Content-Type': 'application/json'
  }
});

describe('🤖 Integration Tests with Dummy API', () => {
  let authToken = null;
  let customerId = null;
  let testCustomer = null;

  beforeAll(async () => {
    // Wait for dummy API to be ready
    await testUtils.waitForApi();
    
    console.log('🚀 Starting integration tests with dummy API');
  });

  describe('🔍 API Health & Info', () => {
    test('should return healthy status', async () => {
      const response = await apiClient.get('/health');
      
      expect(response.status).toBe(200);
      expect(response.data.erfolg).toBe(true);
      expect(response.data.daten.status).toBe('healthy');
      expect(response.data.daten.service).toContain('Dummy API');
      expect(response.data.test_api).toBe(true);
    });

    test('should return API information', async () => {
      const response = await apiClient.get('/info');
      
      expect(response.status).toBe(200);
      expect(response.data.erfolg).toBe(true);
      expect(response.data.daten.name).toContain('EVU Backend Dummy API');
      expect(response.data.daten.endpoints).toHaveProperty('auth');
      expect(response.data.daten.endpoints).toHaveProperty('customers');
      expect(response.data.daten.endpoints).toHaveProperty('pricing');
      expect(response.data.daten.features).toBeInstanceOf(Array);
    });
  });

  describe('🔐 Authentication Flow', () => {
    test('should register new customer successfully', async () => {
      testCustomer = testUtils.generateTestCustomer();
      
      const response = await apiClient.post(API_ENDPOINTS.auth.register, testCustomer);
      
      expect(response.status).toBe(201);
      expect(response.data.erfolg).toBe(true);
      expect(response.data.daten.kunde.email).toBe(testCustomer.email);
      expect(response.data.daten.kunde.vorname).toBe(testCustomer.vorname);
      expect(response.data.daten.token).toBeDefined();
      expect(response.data.daten.token_expires_in).toBe('24h');
      
      // Store for subsequent tests
      authToken = response.data.daten.token;
      customerId = response.data.daten.kunde.kunden_id;
    });

    test('should reject duplicate email registration', async () => {
      const response = await apiClient.post(API_ENDPOINTS.auth.register, testCustomer);
      
      expect(response.status).toBe(409);
      expect(response.data.erfolg).toBe(false);
      expect(response.data.nachricht).toContain('bereits registriert');
    });

    test('should login with valid credentials', async () => {
      const loginData = {
        email: testCustomer.email,
        passwort: testCustomer.passwort
      };
      
      const response = await apiClient.post(API_ENDPOINTS.auth.login, loginData);
      
      expect(response.status).toBe(200);
      expect(response.data.erfolg).toBe(true);
      expect(response.data.daten.kunde.kunden_id).toBe(customerId);
      expect(response.data.daten.token).toBeDefined();
    });

    test('should reject invalid credentials', async () => {
      const loginData = {
        email: testCustomer.email,
        passwort: 'WrongPassword123!'
      };
      
      const response = await apiClient.post(API_ENDPOINTS.auth.login, loginData);
      
      expect(response.status).toBe(401);
      expect(response.data.erfolg).toBe(false);
      expect(response.data.nachricht).toContain('Ungültige Anmeldedaten');
    });

    test('should verify valid token', async () => {
      const response = await apiClient.get(API_ENDPOINTS.auth.verify, {
        headers: testUtils.createAuthHeader(authToken)
      });
      
      expect(response.status).toBe(200);
      expect(response.data.erfolg).toBe(true);
      expect(response.data.daten.kunden_id).toBe(customerId);
      expect(response.data.daten.email).toBe(testCustomer.email);
    });

    test('should reject invalid token', async () => {
      const response = await apiClient.get(API_ENDPOINTS.auth.verify, {
        headers: testUtils.createAuthHeader('invalid-token')
      });
      
      expect(response.status).toBe(401);
      expect(response.data.erfolg).toBe(false);
    });
  });

  describe('👤 Customer Management', () => {
    test('should retrieve customer profile', async () => {
      const response = await apiClient.get(API_ENDPOINTS.customers.profile, {
        headers: testUtils.createAuthHeader(authToken)
      });
      
      expect(response.status).toBe(200);
      expect(response.data.erfolg).toBe(true);
      expect(response.data.daten.kunde.kunden_id).toBe(customerId);
      expect(response.data.daten.kunde.email).toBe(testCustomer.email);
      expect(response.data.daten.kunde.vorname).toBe(testCustomer.vorname);
      expect(response.data.daten.kunde.plz).toBe(testCustomer.plz);
    });

    test('should update customer profile', async () => {
      const updates = {
        telefon: '+49 40 98765432',
        newsletter_einverstaendnis: true
      };
      
      const response = await apiClient.put(API_ENDPOINTS.customers.profile, updates, {
        headers: testUtils.createAuthHeader(authToken)
      });
      
      expect(response.status).toBe(200);
      expect(response.data.erfolg).toBe(true);
      expect(response.data.daten.kunde.telefon).toBe(updates.telefon);
      expect(response.data.daten.kunde.newsletter_einverstaendnis).toBe(true);
    });

    test('should retrieve energy profile', async () => {
      const response = await apiClient.get(API_ENDPOINTS.customers.energyProfile, {
        headers: testUtils.createAuthHeader(authToken)
      });
      
      expect(response.status).toBe(200);
      expect(response.data.erfolg).toBe(true);
      expect(response.data.daten.jahresverbrauch).toBeGreaterThan(0);
      expect(response.data.daten.haushaltsgröße).toBeGreaterThan(0);
      expect(response.data.daten.verbrauchsklasse).toMatch(/niedrig|mittel|hoch/);
      expect(response.data.daten.empfohlene_tarife).toBeInstanceOf(Array);
    });

    test('should update energy profile', async () => {
      const updates = {
        jahresverbrauch: 4200,
        haushaltsgröße: 3
      };
      
      const response = await apiClient.put(API_ENDPOINTS.customers.energyProfile, updates, {
        headers: testUtils.createAuthHeader(authToken)
      });
      
      expect(response.status).toBe(200);
      expect(response.data.erfolg).toBe(true);
      expect(response.data.daten.jahresverbrauch).toBe(4200);
      expect(response.data.daten.haushaltsgröße).toBe(3);
    });

    test('should retrieve consumption history', async () => {
      const response = await apiClient.get(`${API_ENDPOINTS.customers.consumptionHistory}?limit=6`, {
        headers: testUtils.createAuthHeader(authToken)
      });
      
      expect(response.status).toBe(200);
      expect(response.data.erfolg).toBe(true);
      expect(response.data.daten.verbrauchsdaten).toBeInstanceOf(Array);
      expect(response.data.daten.statistiken).toHaveProperty('anzahl_monate');
      expect(response.data.daten.statistiken).toHaveProperty('gesamt_verbrauch_kwh');
      expect(response.data.daten.statistiken).toHaveProperty('durchschnitt_verbrauch_kwh');
    });
  });

  describe('💰 Pricing Services', () => {
    test('should calculate prices for valid PLZ', async () => {
      const pricingRequest = testUtils.generatePricingRequest({
        plz: '10115',
        jahresverbrauch: 3500,
        haushaltsgröße: 2
      });
      
      const response = await apiClient.post(API_ENDPOINTS.pricing.calculate, pricingRequest);
      
      expect(response.status).toBe(200);
      expect(response.data.erfolg).toBe(true);
      expect(response.data.daten.standort.plz).toBe('10115');
      expect(response.data.daten.standort.stadt).toBe('Berlin');
      expect(response.data.daten.verbrauchsdaten.geschaetzterVerbrauch).toBe(3500);
      expect(response.data.daten.tarife).toBeInstanceOf(Array);
      expect(response.data.daten.anzahl_gefunden).toBeGreaterThan(0);
      
      if (response.data.daten.tarife.length > 0) {
        const tariff = response.data.daten.tarife[0];
        expect(tariff.tarif).toHaveProperty('id');
        expect(tariff.tarif).toHaveProperty('name');
        expect(tariff.kosten).toHaveProperty('finale_jahreskosten');
        expect(tariff.kosten.finale_jahreskosten).toBeGreaterThan(0);
        expect(tariff.preisdetails).toHaveProperty('arbeitspreis_cent_pro_kwh');
        expect(tariff.preisdetails).toHaveProperty('grundpreis_euro_pro_monat');
      }
    });

    test('should estimate consumption based on household size', async () => {
      const pricingRequest = {
        plz: '10115',
        haushaltsgröße: 4
        // No jahresverbrauch provided - should be estimated
      };
      
      const response = await apiClient.post(API_ENDPOINTS.pricing.calculate, pricingRequest);
      
      expect(response.status).toBe(200);
      expect(response.data.erfolg).toBe(true);
      expect(response.data.daten.verbrauchsdaten.geschaetzterVerbrauch).toBe(4200); // 4-person household
      expect(response.data.daten.verbrauchsdaten.jahresverbrauch).toBeNull();
      expect(response.data.daten.verbrauchsdaten.haushaltsgröße).toBe(4);
    });

    test('should reject invalid PLZ', async () => {
      const pricingRequest = testUtils.generatePricingRequest({
        plz: '99999' // Invalid PLZ
      });
      
      const response = await apiClient.post(API_ENDPOINTS.pricing.calculate, pricingRequest);
      
      expect(response.status).toBe(404);
      expect(response.data.erfolg).toBe(false);
      expect(response.data.nachricht).toContain('nicht gefunden');
    });

    test('should filter tariffs by type', async () => {
      const pricingRequest = testUtils.generatePricingRequest({
        tariftyp: 'gruen'
      });
      
      const response = await apiClient.post(API_ENDPOINTS.pricing.calculate, pricingRequest);
      
      expect(response.status).toBe(200);
      expect(response.data.erfolg).toBe(true);
      
      if (response.data.daten.tarife.length > 0) {
        response.data.daten.tarife.forEach(tariff => {
          expect(tariff.tarif.typ).toBe('gruen');
        });
      }
    });

    test('should retrieve all active tariffs', async () => {
      const response = await apiClient.get(API_ENDPOINTS.pricing.tariffs);
      
      expect(response.status).toBe(200);
      expect(response.data.erfolg).toBe(true);
      expect(response.data.daten.tarife).toBeInstanceOf(Array);
      expect(response.data.daten.anzahl).toBeGreaterThan(0);
      
      if (response.data.daten.tarife.length > 0) {
        const tariff = response.data.daten.tarife[0];
        expect(tariff).toHaveProperty('id');
        expect(tariff).toHaveProperty('name');
        expect(tariff).toHaveProperty('typ');
        expect(tariff).toHaveProperty('arbeitspreis_cent_pro_kwh');
        expect(tariff).toHaveProperty('grundpreis_euro_pro_monat');
      }
    });

    test('should filter tariffs by type via query parameter', async () => {
      const response = await apiClient.get(`${API_ENDPOINTS.pricing.tariffs}?typ=fest`);
      
      expect(response.status).toBe(200);
      expect(response.data.erfolg).toBe(true);
      
      if (response.data.daten.tarife.length > 0) {
        response.data.daten.tarife.forEach(tariff => {
          expect(tariff.typ).toBe('fest');
        });
      }
    });

    test('should retrieve location information', async () => {
      const response = await apiClient.get(`${API_ENDPOINTS.pricing.locations}/10115`);
      
      expect(response.status).toBe(200);
      expect(response.data.erfolg).toBe(true);
      expect(response.data.daten.plz).toBe('10115');
      expect(response.data.daten.stadt).toBe('Berlin');
      expect(response.data.daten.bundesland).toBe('Berlin');
      expect(response.data.daten.verfuegbar).toBe(true);
      expect(response.data.daten.netzbetreiber).toBeDefined();
    });

    test('should return 404 for unknown PLZ', async () => {
      const response = await apiClient.get(`${API_ENDPOINTS.pricing.locations}/00000`);
      
      expect(response.status).toBe(404);
      expect(response.data.erfolg).toBe(false);
    });
  });

  describe('📄 Contract Management', () => {
    let tariffId = null;
    let contractId = null;

    beforeAll(async () => {
      // Get available tariffs for contract tests
      const tariffsResponse = await apiClient.get(API_ENDPOINTS.pricing.tariffs);
      if (tariffsResponse.data.erfolg && tariffsResponse.data.daten.tarife.length > 0) {
        tariffId = tariffsResponse.data.daten.tarife[0].id;
      }
    });

    test('should retrieve customer contracts', async () => {
      const response = await apiClient.get(API_ENDPOINTS.contracts.list, {
        headers: testUtils.createAuthHeader(authToken)
      });
      
      expect(response.status).toBe(200);
      expect(response.data.erfolg).toBe(true);
      expect(response.data.daten.vertraege).toBeInstanceOf(Array);
      expect(response.data.daten.anzahl).toBeGreaterThanOrEqual(0);
    });

    test('should create contract draft', async () => {
      if (!tariffId) {
        console.log('⚠️ Skipping contract draft test - no tariffs available');
        return;
      }

      const contractRequest = testUtils.generateContractRequest(tariffId);
      
      const response = await apiClient.post(API_ENDPOINTS.contracts.draft, contractRequest, {
        headers: testUtils.createAuthHeader(authToken)
      });
      
      expect(response.status).toBe(201);
      expect(response.data.erfolg).toBe(true);
      expect(response.data.daten.vertrag.vertrag_id).toBeDefined();
      expect(response.data.daten.vertrag.tarif.id).toBe(tariffId);
      expect(response.data.daten.vertrag.status).toBe('entwurf');
      expect(response.data.daten.vertrag.geschaetzter_jahresverbrauch).toBe(contractRequest.geschaetzter_jahresverbrauch);
      
      contractId = response.data.daten.vertrag.vertrag_id;
    });

    test('should reject contract draft with invalid tariff', async () => {
      const contractRequest = testUtils.generateContractRequest('invalid-tariff-id');
      
      const response = await apiClient.post(API_ENDPOINTS.contracts.draft, contractRequest, {
        headers: testUtils.createAuthHeader(authToken)
      });
      
      expect(response.status).toBe(404);
      expect(response.data.erfolg).toBe(false);
      expect(response.data.nachricht).toContain('nicht gefunden');
    });

    test('should validate consumption range in contract draft', async () => {
      if (!tariffId) {
        console.log('⚠️ Skipping contract validation test - no tariffs available');
        return;
      }

      const contractRequest = testUtils.generateContractRequest(tariffId, {
        geschaetzter_jahresverbrauch: 100 // Too low
      });
      
      const response = await apiClient.post(API_ENDPOINTS.contracts.draft, contractRequest, {
        headers: testUtils.createAuthHeader(authToken)
      });
      
      expect(response.status).toBe(400);
      expect(response.data.erfolg).toBe(false);
      expect(response.data.fehler[0].feld).toBe('geschaetzter_jahresverbrauch');
    });
  });

  describe('🔄 End-to-End User Journey', () => {
    test('complete customer journey: register → pricing → contract', async () => {
      // 1. Register new customer
      const newCustomer = testUtils.generateTestCustomer({
        email: `journey.${Date.now()}@example.com`
      });
      
      const registrationResponse = await apiClient.post(API_ENDPOINTS.auth.register, newCustomer);
      expect(registrationResponse.status).toBe(201);
      
      const journeyToken = registrationResponse.data.daten.token;
      const journeyCustomerId = registrationResponse.data.daten.kunde.kunden_id;
      
      // 2. Calculate pricing
      const pricingRequest = testUtils.generatePricingRequest();
      const pricingResponse = await apiClient.post(API_ENDPOINTS.pricing.calculate, pricingRequest);
      expect(pricingResponse.status).toBe(200);
      expect(pricingResponse.data.daten.tarife.length).toBeGreaterThan(0);
      
      const selectedTariff = pricingResponse.data.daten.tarife[0];
      
      // 3. Create contract draft
      const contractRequest = testUtils.generateContractRequest(selectedTariff.tarif.id);
      const contractResponse = await apiClient.post(API_ENDPOINTS.contracts.draft, contractRequest, {
        headers: testUtils.createAuthHeader(journeyToken)
      });
      expect(contractResponse.status).toBe(201);
      
      // 4. Verify contract was created
      const contractsResponse = await apiClient.get(API_ENDPOINTS.contracts.list, {
        headers: testUtils.createAuthHeader(journeyToken)
      });
      expect(contractsResponse.status).toBe(200);
      expect(contractsResponse.data.daten.anzahl).toBeGreaterThan(0);
      
      console.log(`✅ Complete user journey successful for customer ${journeyCustomerId}`);
    });
  });

  describe('⚡ Performance & Load Tests', () => {
    test('should handle multiple concurrent pricing requests', async () => {
      const concurrentRequests = 5;
      const pricingRequest = testUtils.generatePricingRequest();
      
      const startTime = Date.now();
      const promises = Array(concurrentRequests).fill().map(() =>
        apiClient.post(API_ENDPOINTS.pricing.calculate, pricingRequest)
      );
      
      const responses = await Promise.all(promises);
      const endTime = Date.now();
      
      // All requests should succeed
      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.data.erfolg).toBe(true);
      });
      
      // Should complete in reasonable time
      const totalTime = endTime - startTime;
      expect(totalTime).toBeLessThan(10000); // Less than 10 seconds
      
      console.log(`⚡ ${concurrentRequests} concurrent requests completed in ${totalTime}ms`);
    });

    test('should handle large consumption values efficiently', async () => {
      const largePricingRequest = testUtils.generatePricingRequest({
        jahresverbrauch: 45000 // Large industrial consumption
      });
      
      const startTime = Date.now();
      const response = await apiClient.post(API_ENDPOINTS.pricing.calculate, largePricingRequest);
      const endTime = Date.now();
      
      expect(response.status).toBe(200);
      expect(response.data.erfolg).toBe(true);
      expect(response.data.daten.verbrauchsdaten.geschaetzterVerbrauch).toBe(45000);
      
      // Should complete quickly
      const responseTime = endTime - startTime;
      expect(responseTime).toBeLessThan(2000); // Less than 2 seconds
      
      console.log(`⚡ Large consumption calculation completed in ${responseTime}ms`);
    });
  });
});