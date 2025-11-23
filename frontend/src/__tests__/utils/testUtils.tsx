import React from 'react';
import { render, RenderOptions } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { PricingFormData, PricingResult, CustomerData } from '../../App';

// Create test theme
const testTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#00d4aa',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#ff6b35',
    },
    background: {
      default: '#1a1a1a',
      paper: '#2a2a2a',
    },
    text: {
      primary: '#ffffff',
      secondary: '#b3b3b3',
    },
  },
});

// Custom render function that includes providers
const AllTheProviders: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <ThemeProvider theme={testTheme}>
      <CssBaseline />
      <BrowserRouter>
        {children}
      </BrowserRouter>
    </ThemeProvider>
  );
};

const customRender = (
  ui: React.ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllTheProviders, ...options });

// Mock data for tests
export const mockPricingFormData: PricingFormData = {
  plz: '10115',
  haushaltsgroesse: 3,
  jahresverbrauch: 3500,
  hatSmartMeter: false,
  moechteSmartMeter: true,
  hatSolarPV: false,
  moechteSolarPV: false,
  hatElektrofahrzeug: false,
};

export const mockPricingResult: PricingResult = {
  tariffId: 'tariff_123',
  tariffName: 'Fix12 Grün',
  tariffType: 'fixed',
  contractDuration: 12,
  pricing: {
    workingPrice: 28.50,
    basePrice: 9.90,
    currency: 'EUR',
    workingPriceUnit: 'ct/kWh',
    basePriceUnit: '€/Monat',
  },
  estimatedCosts: {
    annualConsumption: 3500,
    energyCosts: 997.50,
    baseCosts: 118.80,
    totalAnnualCosts: 1116.30,
    monthlyCosts: 93.03,
  },
};

export const mockCustomerData: CustomerData = {
  vorname: 'Max',
  nachname: 'Mustermann',
  strasse: 'Musterstraße',
  hausnummer: '123',
  plz: '10115',
  ort: 'Berlin',
  email: 'max.mustermann@example.com',
  telefon: '+49 30 12345678',
};

// Mock API responses
export const mockApiResponses = {
  pricing: {
    erfolg: true,
    daten: {
      standort: {
        plz: '10115',
        stadt: 'Berlin',
        bezirk: 'Mitte',
        netzbetreiber: 'Stromnetz Berlin',
      },
      tarife: [
        {
          tarif: {
            id: 'tariff_123',
            name: 'Fix12 Grün',
            typ: 'fest',
            vertragslaufzeit_monate: 12,
          },
          preisdetails: {
            arbeitspreis_cent_pro_kwh: 28.50,
            grundpreis_euro_pro_monat: 9.90,
          },
          verbrauchsdaten: {
            geschaetzterVerbrauch: 3500,
          },
          kosten: {
            energiekosten_euro: 997.50,
            grundkosten_euro: 118.80,
            finale_jahreskosten: 1116.30,
            monatliche_kosten: 93.03,
          },
        },
      ],
    },
  },
  customerRegistration: {
    erfolg: true,
    daten: {
      token: 'mock_jwt_token',
      kunde: {
        kunden_id: 'customer_123',
        email: 'max.mustermann@example.com',
      },
    },
  },
  contractDraft: {
    success: true,
    data: {
      draftId: 'draft_123',
      customerId: 'customer_123',
      status: 'draft',
    },
  },
};

// Mock fetch function
export const mockFetch = (response: any, ok: boolean = true, status: number = 200) => {
  global.fetch = jest.fn(() =>
    Promise.resolve({
      ok,
      status,
      json: () => Promise.resolve(response),
    } as Response)
  );
};

// Utility functions for testing
export const waitForLoadingToFinish = () => {
  return new Promise(resolve => setTimeout(resolve, 100));
};

export const fillFormField = async (getByLabelText: any, label: string, value: string) => {
  const field = getByLabelText(label);
  field.focus();
  field.value = value;
  field.dispatchEvent(new Event('input', { bubbles: true }));
  field.dispatchEvent(new Event('change', { bubbles: true }));
};

// Re-export everything from testing-library
export * from '@testing-library/react';
export { customRender as render };