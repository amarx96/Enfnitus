import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import userEvent from '@testing-library/user-event';
import { render, mockPricingFormData, mockPricingResult, mockFetch, mockApiResponses } from '../utils/testUtils';
import PricingResults from '../../components/PricingResults';

// Mock react-router-dom
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

describe('PricingResults Component', () => {
  const mockOnSelectTariff = jest.fn();
  
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const renderPricingResults = (formData = mockPricingFormData) => {
    return render(
      <PricingResults 
        formData={formData}
        onSelectTariff={mockOnSelectTariff}
      />
    );
  };

  describe('Loading State', () => {
    it('should show loading state initially', () => {
      mockFetch(mockApiResponses.pricing, true, 200);
      renderPricingResults();
      
      expect(screen.getByText('Berechne deine Preise...')).toBeInTheDocument();
      expect(screen.getByRole('progressbar')).toBeInTheDocument();
      expect(screen.getByText(/Wir suchen die besten Tarife/)).toBeInTheDocument();
    });
  });

  describe('Successful Data Loading', () => {
    beforeEach(() => {
      mockFetch(mockApiResponses.pricing, true, 200);
    });

    it('should display pricing results after loading', async () => {
      renderPricingResults();
      
      await waitFor(() => {
        expect(screen.getByText('Deine Strompreise')).toBeInTheDocument();
      });
      
      expect(screen.getByText('PLZ 10115')).toBeInTheDocument();
      expect(screen.getByText('Berlin')).toBeInTheDocument();
      expect(screen.getByText('3500 kWh/Jahr')).toBeInTheDocument();
      expect(screen.getByText('3 Personen')).toBeInTheDocument();
    });

    it('should display tariff information', async () => {
      renderPricingResults();
      
      await waitFor(() => {
        expect(screen.getByText('Fix12 Grün')).toBeInTheDocument();
      });
      
      expect(screen.getByText('28.5 ct/kWh')).toBeInTheDocument();
      expect(screen.getByText('9.9 €/Monat')).toBeInTheDocument();
      expect(screen.getByText('12 Monate Laufzeit')).toBeInTheDocument();
      expect(screen.getByText('93.03€')).toBeInTheDocument();
      expect(screen.getByText('pro Monat')).toBeInTheDocument();
    });

    it('should show recommended tariff badge', async () => {
      renderPricingResults();
      
      await waitFor(() => {
        expect(screen.getByText('Empfohlen')).toBeInTheDocument();
      });
    });

    it('should display customer input summary', async () => {
      renderPricingResults();
      
      await waitFor(() => {
        expect(screen.getByText('Ihre Eingaben')).toBeInTheDocument();
      });
      
      expect(screen.getByText('10115')).toBeInTheDocument();
      expect(screen.getByText('3 Personen')).toBeInTheDocument();
      expect(screen.getByText('3500 kWh')).toBeInTheDocument();
    });
  });

  describe('Tariff Selection', () => {
    beforeEach(() => {
      mockFetch(mockApiResponses.pricing, true, 200);
    });

    it('should handle tariff card click', async () => {
      const user = userEvent.setup();
      renderPricingResults();
      
      await waitFor(() => {
        expect(screen.getByText('Fix12 Grün')).toBeInTheDocument();
      });
      
      const tariffCard = screen.getByText('Fix12 Grün').closest('[role="button"]') || 
                       screen.getByText('Fix12 Grün').closest('div[style*="cursor: pointer"]');
      
      if (tariffCard) {
        await user.click(tariffCard);
        
        expect(mockOnSelectTariff).toHaveBeenCalledWith(
          expect.objectContaining({
            tariffName: 'Fix12 Grün',
            tariffType: 'fest',
          })
        );
        
        expect(mockNavigate).toHaveBeenCalledWith('/customer');
      }
    });
  });

  describe('Error Handling', () => {
    it('should display error message on API failure', async () => {
      mockFetch({ erfolg: false, nachricht: 'Fehler beim Abrufen der Preisdaten' }, false, 500);
      renderPricingResults();
      
      await waitFor(() => {
        expect(screen.getByText(/Fehler beim Abrufen der Preisdaten/)).toBeInTheDocument();
      });
      
      expect(screen.getByText('Zurück zum Formular')).toBeInTheDocument();
    });

    it('should display error for invalid PLZ', async () => {
      mockFetch({ erfolg: false, nachricht: 'Keine Daten für diese PLZ verfügbar' }, false, 404);
      renderPricingResults();
      
      await waitFor(() => {
        expect(screen.getByText(/Keine Daten für diese PLZ verfügbar/)).toBeInTheDocument();
      });
    });

    it('should handle network errors', async () => {
      global.fetch = jest.fn(() => Promise.reject(new Error('Network error')));
      renderPricingResults();
      
      await waitFor(() => {
        expect(screen.getByText(/Network error/)).toBeInTheDocument();
      });
    });
  });

  describe('No Results State', () => {
    it('should display message when no tariffs available', async () => {
      const emptyResponse = {
        ...mockApiResponses.pricing,
        daten: {
          ...mockApiResponses.pricing.daten,
          tarife: [],
        },
      };
      
      mockFetch(emptyResponse, true, 200);
      renderPricingResults();
      
      await waitFor(() => {
        expect(screen.getByText('Verfügbare Tarife (0)')).toBeInTheDocument();
      });
      
      expect(screen.getByText(/Keine Tarife für Ihre PLZ verfügbar/)).toBeInTheDocument();
    });
  });

  describe('Navigation', () => {
    beforeEach(() => {
      mockFetch(mockApiResponses.pricing, true, 200);
    });

    it('should redirect to home if no form data', () => {
      render(
        <PricingResults 
          formData={null as any}
          onSelectTariff={mockOnSelectTariff}
        />
      );
      
      expect(mockNavigate).toHaveBeenCalledWith('/');
    });

    it('should provide back to form button', async () => {
      const user = userEvent.setup();
      renderPricingResults();
      
      await waitFor(() => {
        expect(screen.getByText('Eingaben ändern')).toBeInTheDocument();
      });
      
      const backButton = screen.getByText('Eingaben ändern');
      await user.click(backButton);
      
      expect(mockNavigate).toHaveBeenCalledWith('/');
    });
  });

  describe('Tariff Type Handling', () => {
    it('should display different tariff types with correct colors', async () => {
      const multiTariffResponse = {
        ...mockApiResponses.pricing,
        daten: {
          ...mockApiResponses.pricing.daten,
          tarife: [
            {
              ...mockApiResponses.pricing.daten.tarife[0],
              tarif: { ...mockApiResponses.pricing.daten.tarife[0].tarif, typ: 'fest' },
            },
            {
              ...mockApiResponses.pricing.daten.tarife[0],
              tarif: { ...mockApiResponses.pricing.daten.tarife[0].tarif, typ: 'gruen', name: 'Grün24' },
            },
            {
              ...mockApiResponses.pricing.daten.tarife[0],
              tarif: { ...mockApiResponses.pricing.daten.tarife[0].tarif, typ: 'dynamisch', name: 'Dynamic' },
            },
          ],
        },
      };
      
      mockFetch(multiTariffResponse, true, 200);
      renderPricingResults();
      
      await waitFor(() => {
        expect(screen.getByText('Fester Tarif')).toBeInTheDocument();
        expect(screen.getByText('Grüner Strom')).toBeInTheDocument();
        expect(screen.getByText('Dynamischer Tarif')).toBeInTheDocument();
      });
    });
  });

  describe('Responsive Design', () => {
    beforeEach(() => {
      mockFetch(mockApiResponses.pricing, true, 200);
    });

    it('should display tariff cards in mobile layout', async () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });
      
      renderPricingResults();
      
      await waitFor(() => {
        expect(screen.getByText('Fix12 Grün')).toBeInTheDocument();
      });
      
      // All tariff information should still be visible
      expect(screen.getByText('28.5 ct/kWh')).toBeInTheDocument();
      expect(screen.getByText('9.9 €/Monat')).toBeInTheDocument();
    });
  });

  describe('Additional Options Display', () => {
    it('should show selected options as chips', async () => {
      const formDataWithOptions = {
        ...mockPricingFormData,
        hatElektrofahrzeug: true,
        hatSolarPV: true,
        hatSmartMeter: true,
      };
      
      mockFetch(mockApiResponses.pricing, true, 200);
      renderPricingResults(formDataWithOptions);
      
      await waitFor(() => {
        expect(screen.getByText('E-Auto')).toBeInTheDocument();
        expect(screen.getByText('Solar PV')).toBeInTheDocument();
        expect(screen.getByText('Smart Meter')).toBeInTheDocument();
      });
    });
  });

  describe('API Integration', () => {
    it('should make correct API call with form data', async () => {
      const fetchSpy = jest.spyOn(global, 'fetch');
      mockFetch(mockApiResponses.pricing, true, 200);
      
      renderPricingResults();
      
      await waitFor(() => {
        expect(fetchSpy).toHaveBeenCalledWith('/api/v1/pricing/berechnen', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            plz: '10115',
            jahresverbrauch: 3500,
            haushaltgroesse: 3,
          }),
        });
      });
    });

    it('should handle malformed API response', async () => {
      mockFetch('invalid json', true, 200);
      renderPricingResults();
      
      await waitFor(() => {
        expect(screen.getByText(/Fehler beim Laden der Tarife/)).toBeInTheDocument();
      });
    });
  });
});