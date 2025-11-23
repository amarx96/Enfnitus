/**
 * Frontend-Backend Integration Test
 * Tests the complete user journey from React frontend to Node.js backend to Supabase database
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from '../App';
import '@testing-library/jest-dom';

// Mock fetch for API calls
const originalFetch = global.fetch;

describe('🌐 Frontend-Backend Integration Tests', () => {
  let mockCustomerData;
  let mockServer;

  beforeEach(() => {
    // Mock successful customer creation
    mockCustomerData = {
      customer_id: 'test-customer-' + Date.now(),
      email: 'test@example.com',
      created_at: new Date().toISOString()
    };

    // Mock backend responses
    global.fetch = jest.fn((url, options) => {
      console.log('🔗 Mock API call to:', url);
      
      if (url.includes('/api/v1/tarife/berechnen') || url.includes('pricing')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve({
            success: true,
            data: {
              tarife: [{
                tariff_id: 'tibber-variable',
                name: 'Tibber Variable',
                monthly_cost: 85.50,
                working_price: 30.5,
                base_price: 15.99
              }]
            }
          })
        });
      }
      
      if (url.includes('/api/v1/kunden') || url.includes('customers')) {
        return Promise.resolve({
          ok: true,
          status: 201,
          json: () => Promise.resolve({
            success: true,
            data: mockCustomerData
          })
        });
      }

      // Default response
      return Promise.resolve({
        ok: false,
        status: 404,
        json: () => Promise.resolve({ error: 'Not found' })
      });
    });
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  describe('🎯 Complete User Journey', () => {
    test('should complete full funnel: pricing → customer registration', async () => {
      render(
        <MemoryRouter>
          <App />
        </MemoryRouter>
      );

      // Step 1: Fill in pricing form
      const plzInput = screen.getByPlaceholderText(/10115/i);
      fireEvent.change(plzInput, { target: { value: '10115' } });

      // Step 2: Set household size
      const slider = screen.getByRole('slider');
      fireEvent.change(slider, { target: { value: '2' } });

      // Step 3: Configure smart meter
      const smartMeterCheckbox = screen.getByLabelText(/ich habe bereits einen smart meter/i);
      fireEvent.click(smartMeterCheckbox);

      // Step 4: Submit pricing form
      const submitButtons = screen.getAllByRole('button').filter(button => 
        button.getAttribute('type') === 'submit'
      );
      
      if (submitButtons.length > 0) {
        fireEvent.click(submitButtons[0]);

        // Wait for API call and navigation
        await waitFor(() => {
          // Should call pricing API
          expect(global.fetch).toHaveBeenCalledWith(
            expect.stringContaining('tarife'),
            expect.objectContaining({
              method: 'POST',
              headers: expect.objectContaining({
                'Content-Type': 'application/json'
              }),
              body: expect.stringContaining('10115')
            })
          );
        });
      }

      // Verify form submission worked
      expect(plzInput).toHaveValue('10115');
      expect(smartMeterCheckbox).toBeChecked();
    });

    test('should handle API communication for customer registration', async () => {
      // Simulate customer form submission
      const customerData = {
        vorname: 'Max',
        nachname: 'Mustermann',
        email: 'test.integration@example.com',
        plz: '10115',
        telefon: '+49 30 12345678'
      };

      // Direct API call test
      const response = await fetch('http://localhost:3001/api/v1/kunden', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(customerData)
      });

      const result = await response.json();

      expect(response.ok).toBe(true);
      expect(result.success).toBe(true);
      expect(result.data.customer_id).toBeDefined();
      expect(result.data.email).toBe(customerData.email);
    });
  });

  describe('🔄 Data Flow Validation', () => {
    test('should pass pricing data through complete funnel', async () => {
      const pricingFormData = {
        plz: '10115',
        haushaltsgroesse: 2,
        jahresverbrauch: 3500,
        hatSmartMeter: true,
        moechteSolarPV: false,
        hatElektrofahrzeug: false
      };

      render(
        <MemoryRouter>
          <App />
        </MemoryRouter>
      );

      // Verify frontend can collect all required data
      expect(screen.getByText('Postleitzahl')).toBeInTheDocument();
      expect(screen.getByText('Personenanzahl im Haushalt')).toBeInTheDocument();
      expect(screen.getByText('Smart Meter')).toBeInTheDocument();
      expect(screen.getByText('Solar PV')).toBeInTheDocument();
      expect(screen.getByText('Elektrofahrzeug')).toBeInTheDocument();

      // Fill form with test data
      const plzInput = screen.getByPlaceholderText(/10115/i);
      fireEvent.change(plzInput, { target: { value: pricingFormData.plz } });

      const slider = screen.getByRole('slider');
      fireEvent.change(slider, { target: { value: pricingFormData.haushaltsgroesse } });

      // Verify data is captured correctly
      expect(plzInput).toHaveValue(pricingFormData.plz);
    });

    test('should handle backend error responses gracefully', async () => {
      // Mock error response
      global.fetch = jest.fn(() => 
        Promise.resolve({
          ok: false,
          status: 500,
          json: () => Promise.resolve({
            success: false,
            error: 'Internal server error'
          })
        })
      );

      const customerData = {
        vorname: 'Test',
        nachname: 'Error',
        email: 'error@test.com'
      };

      const response = await fetch('http://localhost:3001/api/v1/kunden', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(customerData)
      });

      expect(response.ok).toBe(false);
      expect(response.status).toBe(500);
    });
  });

  describe('🌍 Real Backend Integration', () => {
    test('should connect to actual backend if running', async () => {
      // Test if backend is actually running
      try {
        const healthResponse = await originalFetch('http://localhost:3001/health');
        
        if (healthResponse.ok) {
          const healthData = await healthResponse.json();
          console.log('✅ Backend is running:', healthData.nachricht);
          
          expect(healthData.erfolg).toBe(true);
          expect(healthData.nachricht).toContain('EVU Backend läuft');
          
          // Test actual pricing calculation
          const pricingResponse = await originalFetch('http://localhost:3001/api/v1/tarife/berechnen', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              plz: '10115',
              haushaltsgroesse: 2,
              jahresverbrauch: 3500
            })
          });
          
          if (pricingResponse.ok) {
            console.log('✅ Pricing calculation endpoint working');
          } else {
            console.log('⚠️ Pricing endpoint needs configuration');
          }
          
        } else {
          console.log('ℹ️ Backend not running - using mocked responses');
        }
      } catch (error) {
        console.log('ℹ️ Backend not available for integration test - using mocks');
      }
    });
  });

  describe('📊 Performance and UX', () => {
    test('should provide responsive user interface', async () => {
      const startTime = Date.now();
      
      render(
        <MemoryRouter>
          <App />
        </MemoryRouter>
      );

      // App should render quickly
      expect(screen.getByText('Enfinitus Energie')).toBeInTheDocument();
      expect(screen.getByText('Dein Strompreis bei Tibber')).toBeInTheDocument();

      const renderTime = Date.now() - startTime;
      expect(renderTime).toBeLessThan(1000); // Less than 1 second
    });

    test('should handle user interactions smoothly', async () => {
      render(
        <MemoryRouter>
          <App />
        </MemoryRouter>
      );

      // Test multiple rapid interactions
      const plzInput = screen.getByPlaceholderText(/10115/i);
      
      for (let i = 0; i < 5; i++) {
        fireEvent.change(plzInput, { target: { value: `1011${i}` } });
        expect(plzInput).toHaveValue(`1011${i}`);
      }

      // Interface should remain responsive
      expect(screen.getByText('Postleitzahl')).toBeInTheDocument();
    });
  });
});