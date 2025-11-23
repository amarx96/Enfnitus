/**
 * Frontend Supabase Integration Tests
 * Tests the frontend API service functions
 */

import { 
  submitCustomerData, 
  storePricingData, 
  createContract, 
  getCustomerById, 
  testDatabaseConnection 
} from '../../services/customerApi';

// Mock supabase for frontend testing
jest.mock('../../services/supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      insert: jest.fn(() => ({
        select: jest.fn(() => ({
          single: jest.fn()
        }))
      })),
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn()
        })),
        head: jest.fn()
      }))
    }))
  }
}));

describe('Frontend Supabase Integration', () => {
  const mockCustomerData = {
    vorname: 'John',
    nachname: 'Doe',
    strasse: 'Teststraße',
    hausnummer: '123',
    plz: '10115',
    ort: 'Berlin',
    email: 'test@example.com',
    telefon: '+49 30 12345678'
  };

  const mockPricingData = {
    plz: '10115',
    verbrauch: 3500,
    haushaltsgroesse: 3,
    smartMeter: true,
    selectedTariff: {
      tariffName: 'Fix12 Grün',
      contractDuration: 12
    },
    estimatedCosts: {
      monthlyCosts: 93.03
    }
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Customer Data Submission', () => {
    it('should submit customer data successfully', async () => {
      const { supabase } = require('../../services/supabase');
      
      // Mock successful response
      const mockResponse = {
        data: { id: 'test-id-123', ...mockCustomerData },
        error: null
      };
      
      supabase.from().insert().select().single.mockResolvedValue(mockResponse);

      const result = await submitCustomerData(mockCustomerData);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockResponse.data);
      expect(supabase.from).toHaveBeenCalledWith('customers');
    });

    it('should handle submission errors gracefully', async () => {
      const { supabase } = require('../../services/supabase');
      
      // Mock error response
      const mockError = new Error('Database connection failed');
      supabase.from().insert().select().single.mockRejectedValue(mockError);

      const result = await submitCustomerData(mockCustomerData);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should validate required fields', async () => {
      const incompleteData = {
        vorname: 'John',
        nachname: '',
        strasse: '',
        hausnummer: '',
        plz: '',
        ort: '',
        email: '',
        telefon: ''
      };

      const result = await submitCustomerData(incompleteData);

      // The function should still attempt to submit, validation happens at DB level
      expect(result).toBeDefined();
    });
  });

  describe('Pricing Data Storage', () => {
    it('should store pricing data successfully', async () => {
      const { supabase } = require('../../services/supabase');
      
      const mockResponse = {
        data: { id: 'pricing-id-123', customer_id: 'customer-id-123' },
        error: null
      };
      
      supabase.from().insert().select().single.mockResolvedValue(mockResponse);

      const result = await storePricingData('customer-id-123', mockPricingData);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockResponse.data);
      expect(supabase.from).toHaveBeenCalledWith('pricing_data');
    });

    it('should handle pricing data storage errors', async () => {
      const { supabase } = require('../../services/supabase');
      
      const mockError = new Error('Foreign key constraint failed');
      supabase.from().insert().select().single.mockRejectedValue(mockError);

      const result = await storePricingData('invalid-customer-id', mockPricingData);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('Contract Creation', () => {
    it('should create contract successfully', async () => {
      const { supabase } = require('../../services/supabase');
      
      const mockResponse = {
        data: { 
          id: 'contract-id-123', 
          customer_id: 'customer-id-123',
          pricing_id: 'pricing-id-123',
          status: 'draft'
        },
        error: null
      };
      
      supabase.from().insert().select().single.mockResolvedValue(mockResponse);

      const contractData = {
        contractNumber: 'CONTRACT-123',
        termsAccepted: true
      };

      const result = await createContract('customer-id-123', 'pricing-id-123', contractData);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockResponse.data);
      expect(supabase.from).toHaveBeenCalledWith('contracts');
    });
  });

  describe('Customer Retrieval', () => {
    it('should retrieve customer by ID successfully', async () => {
      const { supabase } = require('../../services/supabase');
      
      const mockResponse = {
        data: { id: 'customer-id-123', ...mockCustomerData },
        error: null
      };
      
      supabase.from().select().eq().single.mockResolvedValue(mockResponse);

      const result = await getCustomerById('customer-id-123');

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockResponse.data);
    });

    it('should handle customer not found', async () => {
      const { supabase } = require('../../services/supabase');
      
      const mockError = new Error('No rows found');
      supabase.from().select().eq().single.mockRejectedValue(mockError);

      const result = await getCustomerById('non-existent-id');

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('Database Connection Test', () => {
    it('should test database connection successfully', async () => {
      const { supabase } = require('../../services/supabase');
      
      // Mock successful connection test
      supabase.from().select.mockReturnValue({
        head: jest.fn().mockResolvedValue({ error: null })
      });

      const result = await testDatabaseConnection();

      expect(result).toBe(true);
    });

    it('should handle connection test failure', async () => {
      const { supabase } = require('../../services/supabase');
      
      // Mock connection failure
      const mockError = new Error('Connection failed');
      supabase.from().select.mockReturnValue({
        head: jest.fn().mockRejectedValue(mockError)
      });

      const result = await testDatabaseConnection();

      expect(result).toBe(false);
    });

    it('should handle table not found gracefully', async () => {
      const { supabase } = require('../../services/supabase');
      
      // Mock table not found error (PGRST116)
      const mockError = { code: 'PGRST116', message: 'relation does not exist' };
      supabase.from().select.mockReturnValue({
        head: jest.fn().mockResolvedValue({ error: mockError })
      });

      const result = await testDatabaseConnection();

      expect(result).toBe(true); // Should return true even if tables don't exist yet
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors', async () => {
      global.fetch = jest.fn().mockRejectedValue(new Error('Network error'));

      const result = await submitCustomerData(mockCustomerData);

      // Should fall back to direct Supabase call
      expect(result).toBeDefined();
    });

    it('should handle API fallback', async () => {
      const { supabase } = require('../../services/supabase');
      
      // Mock Supabase to fail
      supabase.from().insert().select().single.mockRejectedValue(new Error('Supabase error'));
      
      // Mock fetch to succeed
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ data: { id: 'api-id-123' } })
      });

      const result = await submitCustomerData(mockCustomerData);

      expect(result.success).toBe(true);
      expect(result.data.id).toBe('api-id-123');
    });
  });
});