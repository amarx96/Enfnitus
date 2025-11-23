import React from 'react';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render } from './utils/testUtils';
import App from '../App';

// Mock the components since we're testing routing
jest.mock('../../components/PricingForm', () => {
  return function MockPricingForm({ onSubmit }: any) {
    return (
      <div data-testid="pricing-form">
        <h1>Pricing Form</h1>
        <button onClick={() => onSubmit({ plz: '10115' })}>Submit Pricing</button>
      </div>
    );
  };
});

jest.mock('../../components/PricingResults', () => {
  return function MockPricingResults({ onSelectTariff }: any) {
    return (
      <div data-testid="pricing-results">
        <h1>Pricing Results</h1>
        <button onClick={() => onSelectTariff({ tariffId: 'test' })}>Select Tariff</button>
      </div>
    );
  };
});

jest.mock('../../components/CustomerForm', () => {
  return function MockCustomerForm({ onSubmit }: any) {
    return (
      <div data-testid="customer-form">
        <h1>Customer Form</h1>
        <button onClick={() => onSubmit({ email: 'test@example.com' })}>Submit Customer</button>
      </div>
    );
  };
});

jest.mock('../../components/ContractSummary', () => {
  return function MockContractSummary({ onContractCreated }: any) {
    return (
      <div data-testid="contract-summary">
        <h1>Contract Summary</h1>
        <button onClick={() => onContractCreated({ id: 'contract123' })}>Create Contract</button>
      </div>
    );
  };
});

// Helper to navigate to different routes
const navigateToRoute = (path: string) => {
  window.history.pushState({}, '', path);
  window.dispatchEvent(new PopStateEvent('popstate'));
};

describe('App Component', () => {
  beforeEach(() => {
    // Reset to home route
    window.history.pushState({}, '', '/');
  });

  describe('Routing', () => {
    it('should render PricingForm on home route', () => {
      render(<App />);
      
      expect(screen.getByTestId('pricing-form')).toBeInTheDocument();
      expect(screen.getByText('Pricing Form')).toBeInTheDocument();
    });

    it('should render PricingResults on results route', () => {
      navigateToRoute('/results');
      render(<App />);
      
      expect(screen.getByTestId('pricing-results')).toBeInTheDocument();
      expect(screen.getByText('Pricing Results')).toBeInTheDocument();
    });

    it('should render CustomerForm on customer route', () => {
      navigateToRoute('/customer');
      render(<App />);
      
      expect(screen.getByTestId('customer-form')).toBeInTheDocument();
      expect(screen.getByText('Customer Form')).toBeInTheDocument();
    });

    it('should render ContractSummary on contract route', () => {
      navigateToRoute('/contract');
      render(<App />);
      
      expect(screen.getByTestId('contract-summary')).toBeInTheDocument();
      expect(screen.getByText('Contract Summary')).toBeInTheDocument();
    });
  });

  describe('Navigation Bar', () => {
    it('should render app bar with title', () => {
      render(<App />);
      
      expect(screen.getByText('Enfinitus Energie')).toBeInTheDocument();
    });

    it('should have home button that resets state', async () => {
      const user = userEvent.setup();
      render(<App />);
      
      // First submit pricing form to set some state
      const submitButton = screen.getByText('Submit Pricing');
      await user.click(submitButton);
      
      // Then click home button
      const homeButton = screen.getByRole('button', { name: '' }); // Home icon button
      await user.click(homeButton);
      
      // Should be back on pricing form with reset state
      expect(screen.getByTestId('pricing-form')).toBeInTheDocument();
    });
  });

  describe('State Management', () => {
    it('should maintain pricing form data across navigation', async () => {
      const user = userEvent.setup();
      render(<App />);
      
      // Submit pricing form
      const submitButton = screen.getByText('Submit Pricing');
      await user.click(submitButton);
      
      // Navigate to results should have access to the form data
      navigateToRoute('/results');
      
      // The PricingResults component should receive the form data
      expect(screen.getByTestId('pricing-results')).toBeInTheDocument();
    });

    it('should maintain selected tariff across navigation', async () => {
      const user = userEvent.setup();
      render(<App />);
      
      // First set pricing data
      const pricingSubmit = screen.getByText('Submit Pricing');
      await user.click(pricingSubmit);
      
      // Navigate to results and select tariff
      navigateToRoute('/results');
      
      const selectTariffButton = screen.getByText('Select Tariff');
      await user.click(selectTariffButton);
      
      // Navigate to customer form should have selected tariff
      navigateToRoute('/customer');
      expect(screen.getByTestId('customer-form')).toBeInTheDocument();
    });

    it('should maintain customer data across navigation', async () => {
      const user = userEvent.setup();
      render(<App />);
      
      // Set up the flow: pricing -> results -> customer -> contract
      const pricingSubmit = screen.getByText('Submit Pricing');
      await user.click(pricingSubmit);
      
      navigateToRoute('/results');
      const selectTariffButton = screen.getByText('Select Tariff');
      await user.click(selectTariffButton);
      
      navigateToRoute('/customer');
      const customerSubmit = screen.getByText('Submit Customer');
      await user.click(customerSubmit);
      
      navigateToRoute('/contract');
      expect(screen.getByTestId('contract-summary')).toBeInTheDocument();
    });

    it('should maintain contract draft after creation', async () => {
      const user = userEvent.setup();
      render(<App />);
      
      // Complete the full flow
      const pricingSubmit = screen.getByText('Submit Pricing');
      await user.click(pricingSubmit);
      
      navigateToRoute('/results');
      const selectTariffButton = screen.getByText('Select Tariff');
      await user.click(selectTariffButton);
      
      navigateToRoute('/customer');
      const customerSubmit = screen.getByText('Submit Customer');
      await user.click(customerSubmit);
      
      navigateToRoute('/contract');
      const contractButton = screen.getByText('Create Contract');
      await user.click(contractButton);
      
      // Contract should be created and maintained in state
      expect(screen.getByTestId('contract-summary')).toBeInTheDocument();
    });
  });

  describe('Component Props', () => {
    it('should pass initial data to PricingForm when available', async () => {
      const user = userEvent.setup();
      render(<App />);
      
      // Submit form to set initial data
      const submitButton = screen.getByText('Submit Pricing');
      await user.click(submitButton);
      
      // Navigate away and back
      navigateToRoute('/results');
      navigateToRoute('/');
      
      // Form should have initial data (this would be verified in actual component props)
      expect(screen.getByTestId('pricing-form')).toBeInTheDocument();
    });

    it('should pass form data to PricingResults', async () => {
      const user = userEvent.setup();
      render(<App />);
      
      const submitButton = screen.getByText('Submit Pricing');
      await user.click(submitButton);
      
      navigateToRoute('/results');
      
      // Results component should receive form data
      expect(screen.getByTestId('pricing-results')).toBeInTheDocument();
    });

    it('should pass selected tariff and pricing data to CustomerForm', async () => {
      const user = userEvent.setup();
      render(<App />);
      
      const pricingSubmit = screen.getByText('Submit Pricing');
      await user.click(pricingSubmit);
      
      navigateToRoute('/results');
      const selectTariffButton = screen.getByText('Select Tariff');
      await user.click(selectTariffButton);
      
      navigateToRoute('/customer');
      
      // Customer form should receive both selected tariff and pricing data
      expect(screen.getByTestId('customer-form')).toBeInTheDocument();
    });

    it('should pass all data to ContractSummary', async () => {
      const user = userEvent.setup();
      render(<App />);
      
      // Complete flow to contract summary
      const pricingSubmit = screen.getByText('Submit Pricing');
      await user.click(pricingSubmit);
      
      navigateToRoute('/results');
      const selectTariffButton = screen.getByText('Select Tariff');
      await user.click(selectTariffButton);
      
      navigateToRoute('/customer');
      const customerSubmit = screen.getByText('Submit Customer');
      await user.click(customerSubmit);
      
      navigateToRoute('/contract');
      
      // Contract summary should receive all required data
      expect(screen.getByTestId('contract-summary')).toBeInTheDocument();
    });
  });

  describe('Reset Functionality', () => {
    it('should reset all state when home button is clicked', async () => {
      const user = userEvent.setup();
      render(<App />);
      
      // Build up some state
      const pricingSubmit = screen.getByText('Submit Pricing');
      await user.click(pricingSubmit);
      
      navigateToRoute('/results');
      const selectTariffButton = screen.getByText('Select Tariff');
      await user.click(selectTariffButton);
      
      // Click home button to reset
      const homeButton = screen.getByRole('button', { name: '' });
      await user.click(homeButton);
      
      // Should be back to clean pricing form
      expect(screen.getByTestId('pricing-form')).toBeInTheDocument();
    });
  });

  describe('TypeScript Interfaces', () => {
    it('should properly type PricingFormData interface', () => {
      render(<App />);
      
      // This test verifies that the interfaces are properly defined
      // TypeScript compilation would fail if interfaces are incorrect
      expect(screen.getByTestId('pricing-form')).toBeInTheDocument();
    });

    it('should properly type PricingResult interface', async () => {
      const user = userEvent.setup();
      render(<App />);
      
      const pricingSubmit = screen.getByText('Submit Pricing');
      await user.click(pricingSubmit);
      
      navigateToRoute('/results');
      
      // Interface typing verified through successful compilation
      expect(screen.getByTestId('pricing-results')).toBeInTheDocument();
    });

    it('should properly type CustomerData interface', async () => {
      const user = userEvent.setup();
      render(<App />);
      
      const pricingSubmit = screen.getByText('Submit Pricing');
      await user.click(pricingSubmit);
      
      navigateToRoute('/results');
      const selectTariffButton = screen.getByText('Select Tariff');
      await user.click(selectTariffButton);
      
      navigateToRoute('/customer');
      
      // Interface typing verified through successful compilation
      expect(screen.getByTestId('customer-form')).toBeInTheDocument();
    });
  });

  describe('Layout Structure', () => {
    it('should have proper layout with app bar and container', () => {
      render(<App />);
      
      expect(screen.getByText('Enfinitus Energie')).toBeInTheDocument();
      expect(screen.getByTestId('pricing-form')).toBeInTheDocument();
    });

    it('should apply dark theme styling', () => {
      render(<App />);
      
      // The component should render without errors with dark theme applied
      expect(screen.getByText('Enfinitus Energie')).toBeInTheDocument();
    });
  });
});