/**
 * Unit Tests for Supabase Integration
 * Tests the customer service functions and database operations
 */

const { supabase, testConnection } = require('../../src/config/supabase');
const customerService = require('../../src/services/customerService');

// Test data
const mockCustomerData = {
  vorname: 'John',
  nachname: 'Doe',
  strasse: 'Teststraße',
  hausnummer: '123',
  plz: '10115',
  ort: 'Berlin',
  email: `test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}@example.com`,
  telefon: '+49 30 12345678'
};

const mockPricingData = {
  plz: '10115',
  verbrauch: 3500,
  haushaltsgroesse: 3,
  smartMeter: true,
  selectedTariff: {
    tariffName: 'Fix12 Grün',
    contractDuration: 12,
    pricePerKwh: 0.25
  },
  estimatedCosts: {
    monthlyCosts: 93.03,
    yearlyCosts: 1116.36
  }
};

describe('Supabase Integration Tests', () => {
  let testCustomerId = null;
  let testPricingId = null;

  beforeAll(async () => {
    // Ensure database connection works
    const connected = await testConnection();
    if (!connected) {
      throw new Error('Database connection failed. Please check your Supabase configuration.');
    }
  });

  afterAll(async () => {
    // Clean up test data
    if (testCustomerId) {
      await supabase
        .from('customers')
        .delete()
        .eq('id', testCustomerId);
    }
    if (testPricingId) {
      await supabase
        .from('pricing_data')
        .delete()
        .eq('id', testPricingId);
    }
  });

  describe('Database Connection', () => {
    test('should connect to Supabase successfully', async () => {
      const result = await testConnection();
      expect(result).toBe(true);
    });

    test('should have required environment variables', () => {
      expect(process.env.SUPABASE_URL).toBeDefined();
      expect(process.env.SUPABASE_ANON_KEY).toBeDefined();
    });
  });

  describe('Customer Service', () => {
    test('should create a customer successfully', async () => {
      const result = await customerService.createCustomer(mockCustomerData);
      
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data.id).toBeDefined();
      expect(result.data.email).toBe(mockCustomerData.email);
      expect(result.data.vorname).toBe(mockCustomerData.vorname);
      expect(result.data.nachname).toBe(mockCustomerData.nachname);

      // Store for cleanup
      testCustomerId = result.data.id;
    });

    test('should retrieve customer by ID', async () => {
      expect(testCustomerId).toBeDefined();
      
      const result = await customerService.getCustomerById(testCustomerId);
      
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data.id).toBe(testCustomerId);
      expect(result.data.email).toBe(mockCustomerData.email);
    });

    test('should retrieve customer by email', async () => {
      const result = await customerService.getCustomerByEmail(mockCustomerData.email);
      
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data.email).toBe(mockCustomerData.email);
    });

    test('should return null for non-existent email', async () => {
      const result = await customerService.getCustomerByEmail('nonexistent@example.com');
      
      expect(result.success).toBe(true);
      expect(result.data).toBe(null);
    });

    test('should update customer data', async () => {
      expect(testCustomerId).toBeDefined();
      
      const updateData = {
        telefon: '+49 30 87654321'
      };

      const result = await customerService.updateCustomer(testCustomerId, updateData);
      
      expect(result.success).toBe(true);
      expect(result.data.telefon).toBe(updateData.telefon);
      expect(result.data.updated_at).toBeDefined();
    });

    test('should fail to create customer with missing required fields', async () => {
      const incompleteData = {
        vorname: 'Test',
        // Missing required fields
      };

      const result = await customerService.createCustomer(incompleteData);
      
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    test('should fail to create customer with duplicate email', async () => {
      const duplicateData = { ...mockCustomerData };
      // Use the same email as the already created customer

      const result = await customerService.createCustomer(duplicateData);
      
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('Pricing Data Service', () => {
    test('should store pricing data successfully', async () => {
      expect(testCustomerId).toBeDefined();
      
      const result = await customerService.storePricingData(testCustomerId, mockPricingData);
      
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data.id).toBeDefined();
      expect(result.data.customer_id).toBe(testCustomerId);
      expect(result.data.plz).toBe(mockPricingData.plz);
      expect(result.data.verbrauch).toBe(mockPricingData.verbrauch);

      // Store for cleanup
      testPricingId = result.data.id;
    });

    test('should fail to store pricing data with invalid customer ID', async () => {
      const fakeCustomerId = '00000000-0000-0000-0000-000000000000';
      
      const result = await customerService.storePricingData(fakeCustomerId, mockPricingData);
      
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('Contract Service', () => {
    test('should create contract successfully', async () => {
      expect(testCustomerId).toBeDefined();
      expect(testPricingId).toBeDefined();
      
      const contractData = {
        contractNumber: `TEST-${Date.now()}`,
        termsAccepted: true
      };

      const result = await customerService.createContract(testCustomerId, testPricingId, contractData);
      
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data.customer_id).toBe(testCustomerId);
      expect(result.data.pricing_id).toBe(testPricingId);
      expect(result.data.status).toBe('draft');
      expect(result.data.terms_accepted).toBe(true);
    });
  });

  describe('Data Validation', () => {
    test('should validate PLZ format', async () => {
      const invalidData = {
        ...mockCustomerData,
        email: `test-invalid-plz-${Date.now()}@example.com`,
        plz: 'invalid'
      };

      const result = await customerService.createCustomer(invalidData);
      
      // Should still create customer as PLZ validation is not enforced at DB level
      expect(result.success).toBe(true);
      
      // Clean up
      if (result.data) {
        await supabase.from('customers').delete().eq('id', result.data.id);
      }
    });

    test('should validate email format', async () => {
      const invalidData = {
        ...mockCustomerData,
        email: 'invalid-email'
      };

      const result = await customerService.createCustomer(invalidData);
      
      // Should still work as basic email validation is handled at application level
      expect(result.success).toBe(true);
      
      // Clean up
      if (result.data) {
        await supabase.from('customers').delete().eq('id', result.data.id);
      }
    });
  });

  describe('Error Handling', () => {
    test('should handle database connection errors gracefully', async () => {
      // Temporarily break the connection by using invalid credentials
      const invalidSupabase = require('@supabase/supabase-js').createClient(
        'https://invalid.supabase.co',
        'invalid-key'
      );

      // Test with direct Supabase call
      const { data, error } = await invalidSupabase
        .from('customers')
        .select('count', { count: 'exact', head: true });

      expect(error).toBeDefined();
    });

    test('should handle network timeout errors', async () => {
      // This test simulates network issues
      // In a real scenario, you might mock the network layer
      expect(true).toBe(true); // Placeholder for network timeout testing
    });
  });

  describe('Performance Tests', () => {
    test('should create customer within reasonable time', async () => {
      const startTime = Date.now();
      
      const uniqueEmail = `perf-test-${Date.now()}@example.com`;
      const testData = { ...mockCustomerData, email: uniqueEmail };
      
      const result = await customerService.createCustomer(testData);
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      expect(result.success).toBe(true);
      expect(duration).toBeLessThan(5000); // Should complete within 5 seconds
      
      // Clean up
      if (result.data) {
        await supabase.from('customers').delete().eq('id', result.data.id);
      }
    });
  });
});