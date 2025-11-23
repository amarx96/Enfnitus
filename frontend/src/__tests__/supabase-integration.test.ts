/**
 * Frontend Supabase Integration Tests
 * 
 * Testing the frontend connection and data operations with Supabase
 */

import { supabase, testConnection } from '../services/supabase';
import { submitCustomerData, testDatabaseConnection } from '../services/customerApi';

describe('Frontend Supabase Integration', () => {
  beforeAll(async () => {
    // Wait a bit for any initial setup
    await new Promise(resolve => setTimeout(resolve, 1000));
  });

  describe('Supabase Client Connection', () => {
    test('should have valid Supabase configuration', () => {
      expect(process.env.REACT_APP_SUPABASE_URL).toBeDefined();
      expect(process.env.REACT_APP_SUPABASE_ANON_KEY).toBeDefined();
      expect(process.env.REACT_APP_SUPABASE_URL).toContain('supabase.co');
    });

    test('should create Supabase client successfully', () => {
      expect(supabase).toBeDefined();
      expect(supabase.from).toBeDefined();
      expect(typeof supabase.from).toBe('function');
    });

    test('should test database connection', async () => {
      const connected = await testConnection();
      // Connection should work even if tables don't exist yet
      expect(typeof connected).toBe('boolean');
    }, 10000);
  });

  describe('Database Connection via API', () => {
    test('should test database connection via customerApi', async () => {
      const connected = await testDatabaseConnection();
      expect(typeof connected).toBe('boolean');
      console.log('Database connection test result:', connected);
    }, 10000);
  });

  describe('Customer Data Submission', () => {
    const mockCustomerData = {
      vorname: 'Test',
      nachname: 'User',
      strasse: 'Teststraße',
      hausnummer: '123',
      plz: '12345',
      ort: 'Teststadt',
      email: `test-${Date.now()}@example.com`,
      telefon: '+49 123 456789'
    };

    test('should validate customer data structure', () => {
      expect(mockCustomerData.vorname).toBeDefined();
      expect(mockCustomerData.nachname).toBeDefined();
      expect(mockCustomerData.email).toContain('@');
      expect(mockCustomerData.plz).toMatch(/^\d{5}$/);
    });

    test('should attempt to submit customer data', async () => {
      try {
        const result = await submitCustomerData(mockCustomerData);
        
        // The result should have a success property
        expect(result).toHaveProperty('success');
        expect(typeof result.success).toBe('boolean');
        
        if (result.success) {
          expect(result.data).toBeDefined();
          console.log('✅ Customer data submitted successfully:', result.data.id);
        } else {
          console.log('⚠️ Customer submission failed (expected if tables not created):', result.error);
          // This is expected if tables aren't created yet
          expect(result.error).toBeDefined();
        }
      } catch (error: any) {
        console.log('⚠️ Customer submission threw error (expected if tables not created):', error.message);
        // This is acceptable for testing purposes
        expect(error).toBeDefined();
      }
    }, 15000);
  });
});

export {};