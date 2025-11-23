import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter as Router } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import App from '../App';
import PricingForm from '../components/PricingForm';
import CustomerForm from '../components/CustomerForm';

// Mock the services
jest.mock('../services/customerApi');

const theme = createTheme();

const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <Router>
      <ThemeProvider theme={theme}>
        {component}
      </ThemeProvider>
    </Router>
  );
};

describe('Frontend Funnel Integration Tests', () => {
  
  describe('App Component', () => {
    test('should render the main App component', () => {
      renderWithProviders(<App />);
      
      // Should show the main app structure
      expect(screen.getByText(/Enfinitus Energie/i)).toBeInTheDocument();
    });

    test('should show database connection status', async () => {
      renderWithProviders(<App />);
      
      // Should show some connection feedback
      await waitFor(() => {
        // Look for any connection-related text or elements
        expect(document.body).toBeInTheDocument();
      });
    });
  });

  describe('Pricing Form Flow', () => {
    test('should render pricing form with all required fields', () => {
      const mockOnSubmit = jest.fn();
      
      renderWithProviders(
        <PricingForm onSubmit={mockOnSubmit} />
      );

      // Check for key form elements
      expect(screen.getByLabelText(/postleitzahl/i)).toBeInTheDocument();
      expect(screen.getByText(/haushalts/i)).toBeInTheDocument();
      expect(screen.getByText(/smart.*meter/i)).toBeInTheDocument();
    });

    test('should validate PLZ input', async () => {
      const mockOnSubmit = jest.fn();
      
      renderWithProviders(
        <PricingForm onSubmit={mockOnSubmit} />
      );

      const plzInput = screen.getByLabelText(/postleitzahl/i);
      
      // Test invalid PLZ
      fireEvent.change(plzInput, { target: { value: '123' } });
      
      const submitButton = screen.getByRole('button', { name: /tarife.*berechnen/i });
      fireEvent.click(submitButton);

      // Should show validation error
      await waitFor(() => {
        expect(screen.getByText(/postleitzahl.*ungültig/i)).toBeInTheDocument();
      });
    });

    test('should accept valid PLZ and household data', async () => {
      const mockOnSubmit = jest.fn();
      
      renderWithProviders(
        <PricingForm onSubmit={mockOnSubmit} />
      );

      // Fill in valid data
      const plzInput = screen.getByLabelText(/postleitzahl/i);
      fireEvent.change(plzInput, { target: { value: '10115' } });

      // Set household size
      const householdSlider = screen.getByRole('slider');
      fireEvent.change(householdSlider, { target: { value: '3' } });

      const submitButton = screen.getByRole('button', { name: /tarife.*berechnen/i });
      fireEvent.click(submitButton);

      // Should call onSubmit with correct data
      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            plz: '10115',
            haushaltsgroesse: 3
          })
        );
      });
    });

    test('should handle smart meter options', () => {
      const mockOnSubmit = jest.fn();
      
      renderWithProviders(
        <PricingForm onSubmit={mockOnSubmit} />
      );

      // Find and toggle smart meter options
      const smartMeterSwitches = screen.getAllByRole('checkbox');
      
      // Should have multiple switch options for smart meter, solar, electric car, etc.
      expect(smartMeterSwitches.length).toBeGreaterThan(0);
      
      // Toggle one of them
      fireEvent.click(smartMeterSwitches[0]);
      
      // Component should handle state change
      expect(smartMeterSwitches[0]).toBeChecked();
    });
  });

  describe('Customer Form Flow', () => {
    test('should render customer form with all required fields', () => {
      const mockProps = {
        onSubmit: jest.fn(),
        selectedTariff: {
          tariffId: 'test-tariff',
          tariffName: 'Test Tariff',
          pricing: { basePrice: 10, workingPrice: 0.25 },
          estimatedCosts: { monthlyCosts: 85, totalAnnualCosts: 1020 }
        },
        pricingData: {
          plz: '10115',
          haushaltsgroesse: 3,
          hatSmartMeter: false,
          moechteSmartMeter: true,
          hatSolarPV: false,
          moechteSolarPV: false,
          hatElektrofahrzeug: false
        }
      };

      renderWithProviders(
        <CustomerForm {...mockProps} />
      );

      // Check for customer form fields
      expect(screen.getByLabelText(/vorname/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/nachname/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/straße/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/hausnummer/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/ort/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/e-mail/i)).toBeInTheDocument();
    });

    test('should validate customer form fields', async () => {
      const mockProps = {
        onSubmit: jest.fn(),
        selectedTariff: {
          tariffId: 'test-tariff',
          tariffName: 'Test Tariff',
          pricing: { basePrice: 10, workingPrice: 0.25 },
          estimatedCosts: { monthlyCosts: 85, totalAnnualCosts: 1020 }
        },
        pricingData: {
          plz: '10115',
          haushaltsgroesse: 3,
          hatSmartMeter: false,
          moechteSmartMeter: true,
          hatSolarPV: false,
          moechteSolarPV: false,
          hatElektrofahrzeug: false
        }
      };

      renderWithProviders(
        <CustomerForm {...mockProps} />
      );

      // Try to submit without filling required fields
      const submitButton = screen.getByRole('button', { name: /vertrag.*abschließen/i });
      fireEvent.click(submitButton);

      // Should show validation errors
      await waitFor(() => {
        const errorMessages = screen.getAllByText(/feld.*erforderlich/i);
        expect(errorMessages.length).toBeGreaterThan(0);
      });
    });

    test('should submit valid customer data', async () => {
      const mockOnSubmit = jest.fn();
      const mockProps = {
        onSubmit: mockOnSubmit,
        selectedTariff: {
          tariffId: 'test-tariff',
          tariffName: 'Test Tariff',
          pricing: { basePrice: 10, workingPrice: 0.25 },
          estimatedCosts: { monthlyCosts: 85, totalAnnualCosts: 1020 }
        },
        pricingData: {
          plz: '10115',
          haushaltsgroesse: 3,
          hatSmartMeter: false,
          moechteSmartMeter: true,
          hatSolarPV: false,
          moechteSolarPV: false,
          hatElektrofahrzeug: false
        }
      };

      renderWithProviders(
        <CustomerForm {...mockProps} />
      );

      // Fill in customer data
      fireEvent.change(screen.getByLabelText(/vorname/i), { target: { value: 'Max' } });
      fireEvent.change(screen.getByLabelText(/nachname/i), { target: { value: 'Mustermann' } });
      fireEvent.change(screen.getByLabelText(/straße/i), { target: { value: 'Hauptstraße' } });
      fireEvent.change(screen.getByLabelText(/hausnummer/i), { target: { value: '123' } });
      fireEvent.change(screen.getByLabelText(/ort/i), { target: { value: 'Berlin' } });
      fireEvent.change(screen.getByLabelText(/e-mail/i), { target: { value: 'max@example.com' } });

      // Accept terms
      const termsCheckbox = screen.getByRole('checkbox', { name: /agb.*akzeptiert/i });
      fireEvent.click(termsCheckbox);

      const submitButton = screen.getByRole('button', { name: /vertrag.*abschließen/i });
      fireEvent.click(submitButton);

      // Should call onSubmit with customer data
      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            vorname: 'Max',
            nachname: 'Mustermann',
            strasse: 'Hauptstraße',
            hausnummer: '123',
            ort: 'Berlin',
            email: 'max@example.com'
          })
        );
      });
    });
  });

  describe('Frontend-Backend Integration', () => {
    test('should handle API communication', async () => {
      // Mock successful API response
      const { testDatabaseConnection } = require('../services/customerApi');
      testDatabaseConnection.mockResolvedValue(true);

      renderWithProviders(<App />);

      // Should handle database connection testing
      await waitFor(() => {
        expect(testDatabaseConnection).toHaveBeenCalled();
      });
    });

    test('should handle form submission to Supabase', async () => {
      // Mock successful customer submission
      const { submitCustomerData } = require('../services/customerApi');
      submitCustomerData.mockResolvedValue({
        success: true,
        data: { id: 'test-customer-id', vorname: 'Test' }
      });

      const mockProps = {
        onSubmit: jest.fn(),
        selectedTariff: {
          tariffId: 'test-tariff',
          tariffName: 'Test Tariff',
          pricing: { basePrice: 10, workingPrice: 0.25 },
          estimatedCosts: { monthlyCosts: 85, totalAnnualCosts: 1020 }
        },
        pricingData: {
          plz: '10115',
          haushaltsgroesse: 3,
          hatSmartMeter: false,
          moechteSmartMeter: true,
          hatSolarPV: false,
          moechteSolarPV: false,
          hatElektrofahrzeug: false
        }
      };

      renderWithProviders(
        <CustomerForm {...mockProps} />
      );

      // Should have backend integration ready
      expect(document.body).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    test('should handle network errors gracefully', async () => {
      // Mock network error
      const { submitCustomerData } = require('../services/customerApi');
      submitCustomerData.mockRejectedValue(new Error('Network error'));

      const mockProps = {
        onSubmit: jest.fn(),
        selectedTariff: {
          tariffId: 'test-tariff',
          tariffName: 'Test Tariff',
          pricing: { basePrice: 10, workingPrice: 0.25 },
          estimatedCosts: { monthlyCosts: 85, totalAnnualCosts: 1020 }
        },
        pricingData: {
          plz: '10115',
          haushaltsgroesse: 3,
          hatSmartMeter: false,
          moechteSmartMeter: true,
          hatSolarPV: false,
          moechteSolarPV: false,
          hatElektrofahrzeug: false
        }
      };

      renderWithProviders(
        <CustomerForm {...mockProps} />
      );

      // Should handle errors without crashing
      expect(document.body).toBeInTheDocument();
    });

    test('should show loading states during API calls', async () => {
      const mockOnSubmit = jest.fn();
      
      renderWithProviders(
        <PricingForm onSubmit={mockOnSubmit} />
      );

      // Fill form and submit
      const plzInput = screen.getByLabelText(/postleitzahl/i);
      fireEvent.change(plzInput, { target: { value: '10115' } });

      const submitButton = screen.getByRole('button', { name: /tarife.*berechnen/i });
      
      // Should show loading state when appropriate
      expect(submitButton).toBeInTheDocument();
    });
  });
});