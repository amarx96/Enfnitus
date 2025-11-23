import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import userEvent from '@testing-library/user-event';
import { render, mockPricingFormData, mockPricingResult, mockCustomerData, mockFetch, mockApiResponses } from '../utils/testUtils';
import ContractSummary from '../../components/ContractSummary';

// Mock react-router-dom
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

// Mock URL.createObjectURL for file download tests
global.URL.createObjectURL = jest.fn(() => 'mocked-url');
global.URL.revokeObjectURL = jest.fn();

describe('ContractSummary Component', () => {
  const mockOnContractCreated = jest.fn();
  
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const renderContractSummary = (
    selectedTariff = mockPricingResult,
    customerData = mockCustomerData,
    pricingFormData = mockPricingFormData
  ) => {
    return render(
      <ContractSummary 
        selectedTariff={selectedTariff}
        customerData={customerData}
        pricingFormData={pricingFormData}
        onContractCreated={mockOnContractCreated}
      />
    );
  };

  describe('Loading State', () => {
    it('should show loading state during contract creation', () => {
      mockFetch(mockApiResponses.customerRegistration, true, 201);
      renderContractSummary();
      
      expect(screen.getByText('Vertragsentwurf wird erstellt...')).toBeInTheDocument();
      expect(screen.getByRole('progressbar')).toBeInTheDocument();
      expect(screen.getByText(/Wir erstellen Ihren Vertragsentwurf/)).toBeInTheDocument();
    });
  });

  describe('Successful Contract Creation', () => {
    beforeEach(() => {
      // Mock successful customer registration
      mockFetch(mockApiResponses.customerRegistration, true, 201);
      
      // Mock successful contract draft creation
      global.fetch = jest.fn()
        .mockResolvedValueOnce({
          ok: true,
          status: 201,
          json: () => Promise.resolve(mockApiResponses.customerRegistration)
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 201,
          json: () => Promise.resolve(mockApiResponses.contractDraft)
        });
    });

    it('should display success message after contract creation', async () => {
      renderContractSummary();
      
      await waitFor(() => {
        expect(screen.getByText('Vertragsentwurf erfolgreich erstellt!')).toBeInTheDocument();
      });
      
      expect(screen.getByText(/Wir haben alle Details an max.mustermann@example.com gesendet/)).toBeInTheDocument();
    });

    it('should display contract summary information', async () => {
      renderContractSummary();
      
      await waitFor(() => {
        expect(screen.getByText('Ihr Vertragsentwurf')).toBeInTheDocument();
      });
      
      expect(screen.getByText('Fix12 Grün')).toBeInTheDocument();
      expect(screen.getByText('12 Monate Vertragslaufzeit')).toBeInTheDocument();
      expect(screen.getByText('93.03€')).toBeInTheDocument();
      expect(screen.getByText('pro Monat')).toBeInTheDocument();
    });

    it('should display customer information', async () => {
      renderContractSummary();
      
      await waitFor(() => {
        expect(screen.getByText('Kundeninformationen')).toBeInTheDocument();
      });
      
      expect(screen.getByText('Max Mustermann')).toBeInTheDocument();
      expect(screen.getByText('max.mustermann@example.com')).toBeInTheDocument();
      expect(screen.getByText('+49 30 12345678')).toBeInTheDocument();
      expect(screen.getByText('Musterstraße 123, 10115 Berlin')).toBeInTheDocument();
    });

    it('should display contract details', async () => {
      renderContractSummary();
      
      await waitFor(() => {
        expect(screen.getByText('Vertragsdetails')).toBeInTheDocument();
      });
      
      expect(screen.getByText('draft_123')).toBeInTheDocument();
      expect(screen.getByText('3500 kWh/Jahr')).toBeInTheDocument();
      expect(screen.getByText('3 Personen')).toBeInTheDocument();
    });

    it('should show selected additional options', async () => {
      const pricingDataWithOptions = {
        ...mockPricingFormData,
        moechteSmartMeter: true,
        moechteSolarPV: true,
        hatElektrofahrzeug: true,
      };
      
      renderContractSummary(mockPricingResult, mockCustomerData, pricingDataWithOptions);
      
      await waitFor(() => {
        expect(screen.getByText('Smart Meter gewünscht')).toBeInTheDocument();
        expect(screen.getByText('Solar PV gewünscht')).toBeInTheDocument();
        expect(screen.getByText('Elektrofahrzeug')).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('should display error on customer registration failure', async () => {
      mockFetch({ error: 'Registration failed' }, false, 400);
      renderContractSummary();
      
      await waitFor(() => {
        expect(screen.getByText(/Fehler bei der Kundenregistrierung/)).toBeInTheDocument();
      });
      
      expect(screen.getByText('Zurück zu den persönlichen Daten')).toBeInTheDocument();
    });

    it('should handle existing customer scenario', async () => {
      // Mock customer already exists (409)
      global.fetch = jest.fn()
        .mockResolvedValueOnce({
          ok: false,
          status: 409,
          json: () => Promise.resolve({ message: 'Customer already exists' })
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 401,
          json: () => Promise.resolve({ message: 'Invalid credentials' })
        });
      
      renderContractSummary();
      
      await waitFor(() => {
        expect(screen.getByText(/Kunde existiert bereits/)).toBeInTheDocument();
      });
    });

    it('should display error on contract creation failure', async () => {
      global.fetch = jest.fn()
        .mockResolvedValueOnce({
          ok: true,
          status: 201,
          json: () => Promise.resolve(mockApiResponses.customerRegistration)
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 400,
          json: () => Promise.resolve({ message: 'Contract creation failed' })
        });
      
      renderContractSummary();
      
      await waitFor(() => {
        expect(screen.getByText(/Contract creation failed/)).toBeInTheDocument();
      });
    });

    it('should handle network errors', async () => {
      global.fetch = jest.fn(() => Promise.reject(new Error('Network error')));
      renderContractSummary();
      
      await waitFor(() => {
        expect(screen.getByText(/Network error/)).toBeInTheDocument();
      });
    });
  });

  describe('File Download', () => {
    beforeEach(() => {
      // Mock successful contract creation
      global.fetch = jest.fn()
        .mockResolvedValueOnce({
          ok: true,
          status: 201,
          json: () => Promise.resolve(mockApiResponses.customerRegistration)
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 201,
          json: () => Promise.resolve(mockApiResponses.contractDraft)
        });
    });

    it('should allow contract download', async () => {
      const user = userEvent.setup();
      
      // Mock DOM methods for download
      const mockClick = jest.fn();
      const mockAppendChild = jest.fn();
      const mockRemoveChild = jest.fn();
      
      const mockAnchor = {
        href: '',
        download: '',
        click: mockClick,
      };
      
      document.createElement = jest.fn(() => mockAnchor as any);
      document.body.appendChild = mockAppendChild;
      document.body.removeChild = mockRemoveChild;
      
      renderContractSummary();
      
      await waitFor(() => {
        expect(screen.getByText('Vertrag herunterladen')).toBeInTheDocument();
      });
      
      const downloadButton = screen.getByText('Vertrag herunterladen');
      await user.click(downloadButton);
      
      expect(mockClick).toHaveBeenCalled();
      expect(mockAppendChild).toHaveBeenCalledWith(mockAnchor);
      expect(mockRemoveChild).toHaveBeenCalledWith(mockAnchor);
    });

    it('should generate correct filename for download', async () => {
      const user = userEvent.setup();
      
      const mockAnchor = {
        href: '',
        download: '',
        click: jest.fn(),
      };
      
      document.createElement = jest.fn(() => mockAnchor as any);
      document.body.appendChild = jest.fn();
      document.body.removeChild = jest.fn();
      
      renderContractSummary();
      
      await waitFor(() => {
        const downloadButton = screen.getByText('Vertrag herunterladen');
        expect(downloadButton).toBeInTheDocument();
      });
      
      const downloadButton = screen.getByText('Vertrag herunterladen');
      await user.click(downloadButton);
      
      const expectedFilename = `Vertragsentwurf_Mustermann_${new Date().toISOString().split('T')[0]}.txt`;
      expect(mockAnchor.download).toBe(expectedFilename);
    });
  });

  describe('Navigation', () => {
    it('should redirect to home if missing required props', () => {
      render(
        <ContractSummary 
          selectedTariff={null as any}
          customerData={mockCustomerData}
          pricingFormData={mockPricingFormData}
          onContractCreated={mockOnContractCreated}
        />
      );
      
      expect(mockNavigate).toHaveBeenCalledWith('/');
    });

    it('should provide navigation to create new contract', async () => {
      const user = userEvent.setup();
      
      // Mock successful contract creation
      global.fetch = jest.fn()
        .mockResolvedValueOnce({
          ok: true,
          status: 201,
          json: () => Promise.resolve(mockApiResponses.customerRegistration)
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 201,
          json: () => Promise.resolve(mockApiResponses.contractDraft)
        });
      
      renderContractSummary();
      
      await waitFor(() => {
        expect(screen.getByText('Neuen Vertrag erstellen')).toBeInTheDocument();
      });
      
      const newContractButton = screen.getByText('Neuen Vertrag erstellen');
      await user.click(newContractButton);
      
      expect(mockNavigate).toHaveBeenCalledWith('/');
    });
  });

  describe('API Integration', () => {
    it('should make correct API calls for customer registration', async () => {
      const fetchSpy = jest.spyOn(global, 'fetch');
      
      global.fetch = jest.fn()
        .mockResolvedValueOnce({
          ok: true,
          status: 201,
          json: () => Promise.resolve(mockApiResponses.customerRegistration)
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 201,
          json: () => Promise.resolve(mockApiResponses.contractDraft)
        });
      
      renderContractSummary();
      
      await waitFor(() => {
        expect(fetchSpy).toHaveBeenCalledWith('/api/v1/auth/register', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            vorname: 'Max',
            nachname: 'Mustermann',
            email: 'max.mustermann@example.com',
            telefon: '+49 30 12345678',
            adresse: {
              strasse: 'Musterstraße',
              hausnummer: '123',
              plz: '10115',
              ort: 'Berlin',
            },
            passwort: expect.any(String),
          }),
        });
      });
    });

    it('should make correct API call for contract draft creation', async () => {
      const fetchSpy = jest.spyOn(global, 'fetch');
      
      global.fetch = jest.fn()
        .mockResolvedValueOnce({
          ok: true,
          status: 201,
          json: () => Promise.resolve(mockApiResponses.customerRegistration)
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 201,
          json: () => Promise.resolve(mockApiResponses.contractDraft)
        });
      
      renderContractSummary();
      
      await waitFor(() => {
        const contractCall = fetchSpy.mock.calls.find(call => 
          call[0] === '/api/v1/vertraege/entwuerfe'
        );
        
        expect(contractCall).toBeTruthy();
        if (contractCall) {
          expect(contractCall[1]).toMatchObject({
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': 'Bearer mock_jwt_token',
            },
          });
        }
      });
    });
  });

  describe('Next Steps Information', () => {
    beforeEach(() => {
      global.fetch = jest.fn()
        .mockResolvedValueOnce({
          ok: true,
          status: 201,
          json: () => Promise.resolve(mockApiResponses.customerRegistration)
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 201,
          json: () => Promise.resolve(mockApiResponses.contractDraft)
        });
    });

    it('should display next steps information', async () => {
      renderContractSummary();
      
      await waitFor(() => {
        expect(screen.getByText('Nächste Schritte')).toBeInTheDocument();
      });
      
      expect(screen.getByText(/Sie erhalten eine Bestätigung per E-Mail/)).toBeInTheDocument();
      expect(screen.getByText(/Unser Team wird Sie innerhalb von 2 Werktagen kontaktieren/)).toBeInTheDocument();
      expect(screen.getByText(/Nach Ihrer Bestätigung wird der Vertrag finaliziert/)).toBeInTheDocument();
      expect(screen.getByText(/Der Wechsel zu Enfinitus Energie erfolgt automatisch/)).toBeInTheDocument();
    });
  });

  describe('Action Buttons', () => {
    beforeEach(() => {
      global.fetch = jest.fn()
        .mockResolvedValueOnce({
          ok: true,
          status: 201,
          json: () => Promise.resolve(mockApiResponses.customerRegistration)
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 201,
          json: () => Promise.resolve(mockApiResponses.contractDraft)
        });
    });

    it('should display all action buttons', async () => {
      renderContractSummary();
      
      await waitFor(() => {
        expect(screen.getByText('Vertrag herunterladen')).toBeInTheDocument();
        expect(screen.getByText('Per E-Mail gesendet')).toBeInTheDocument();
        expect(screen.getByText('Neuen Vertrag erstellen')).toBeInTheDocument();
      });
    });

    it('should disable email button to indicate it was sent', async () => {
      renderContractSummary();
      
      await waitFor(() => {
        const emailButton = screen.getByText('Per E-Mail gesendet').closest('button');
        expect(emailButton).toBeDisabled();
      });
    });
  });
});