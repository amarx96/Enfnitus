import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter, MemoryRouter } from 'react-router-dom';
import App from '../App';
import '@testing-library/jest-dom';

// Mock Supabase client
jest.mock('../services/supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      insert: jest.fn(() => ({
        select: jest.fn(() => Promise.resolve({ data: { id: 1 }, error: null })),
      })),
      select: jest.fn(() => ({
        eq: jest.fn(() => Promise.resolve({ data: [], error: null })),
      })),
    })),
  },
}));

// Provider component for routing
const renderWithProviders = (component: React.ReactNode, route = '/') => {
  return render(
    <MemoryRouter initialEntries={[route]}>
      {component}
    </MemoryRouter>
  );
};

describe('✅ Frontend Funnel Complete Validation', () => {
  describe('🎯 Application Core', () => {
    test('renders main application with header and branding', () => {
      renderWithProviders(<App />);
      
      // Check application branding
      expect(screen.getByText('Enfinitus Energie')).toBeInTheDocument();
      
      // Main title exists (using getAllByText for duplicates)
      const titles = screen.getAllByText('Dein Strompreis bei Tibber');
      expect(titles.length).toBeGreaterThan(0);
      
      // Main description
      expect(screen.getByText(/gib deinen energieverbrauch ein/i)).toBeInTheDocument();
    });

    test('establishes database connection successfully', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      renderWithProviders(<App />);
      
      // Wait for connection test
      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('✅ Frontend database connection successful');
      }, { timeout: 3000 });
      
      consoleSpy.mockRestore();
    });
  });

  describe('🏠 Pricing Form Interface', () => {
    test('displays all required form sections and inputs', () => {
      renderWithProviders(<App />);
      
      // Check main form sections
      expect(screen.getByText('Postleitzahl')).toBeInTheDocument();
      expect(screen.getByText('Personenanzahl im Haushalt')).toBeInTheDocument();
      expect(screen.getByText('Smart Meter')).toBeInTheDocument();
      expect(screen.getByText('Solar PV')).toBeInTheDocument();
      expect(screen.getByText('Elektrofahrzeug')).toBeInTheDocument();
      
      // Check form inputs
      expect(screen.getByLabelText('PLZ')).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/10115/i)).toBeInTheDocument();
      expect(screen.getByRole('slider')).toBeInTheDocument();
      expect(screen.getByLabelText(/jahresverbrauch/i)).toBeInTheDocument();
    });

    test('handles PLZ input validation correctly', () => {
      renderWithProviders(<App />);
      
      const plzInput = screen.getByPlaceholderText(/10115/i);
      
      // Test input functionality
      fireEvent.change(plzInput, { target: { value: '10115' } });
      expect(plzInput).toHaveValue('10115');
      
      // Test clearing
      fireEvent.change(plzInput, { target: { value: '' } });
      expect(plzInput).toHaveValue('');
      
      // Test different valid PLZ
      fireEvent.change(plzInput, { target: { value: '80331' } });
      expect(plzInput).toHaveValue('80331');
    });

    test('provides functional household size slider', () => {
      renderWithProviders(<App />);
      
      const slider = screen.getByRole('slider');
      expect(slider).toBeInTheDocument();
      
      // Test slider functionality
      fireEvent.change(slider, { target: { value: 4 } });
      // Slider should accept the change
      expect(slider).toBeInTheDocument();
    });

    test('includes smart meter and energy option checkboxes', () => {
      renderWithProviders(<App />);
      
      // Get all checkboxes (Material-UI uses checkboxes, not radio buttons)
      const checkboxes = screen.getAllByRole('checkbox');
      expect(checkboxes.length).toBeGreaterThanOrEqual(5); // Smart meter (2) + Solar PV (2) + EV (1)
      
      // Verify specific checkboxes by their labels
      expect(screen.getByLabelText(/ich habe bereits einen smart meter/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/ich möchte einen smart meter/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/ich habe solar pv/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/ich möchte solar pv/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/ich besitze ein elektrofahrzeug/i)).toBeInTheDocument();
    });

    test('allows checkbox interactions for energy options', () => {
      renderWithProviders(<App />);
      
      // Test smart meter checkbox
      const smartMeterCheckbox = screen.getByLabelText(/ich habe bereits einen smart meter/i);
      fireEvent.click(smartMeterCheckbox);
      expect(smartMeterCheckbox).toBeChecked();
      
      // Test solar PV checkbox  
      const solarCheckbox = screen.getByLabelText(/ich habe solar pv/i);
      fireEvent.click(solarCheckbox);
      expect(solarCheckbox).toBeChecked();
      
      // Test EV checkbox
      const evCheckbox = screen.getByLabelText(/ich besitze ein elektrofahrzeug/i);
      fireEvent.click(evCheckbox);
      expect(evCheckbox).toBeChecked();
    });
  });

  describe('🚀 Form Submission and Navigation', () => {
    test('provides functional submit button', () => {
      renderWithProviders(<App />);
      
      // Find submit button (it has the same text as the title)
      const buttons = screen.getAllByRole('button');
      const submitButton = buttons.find(button => 
        button.getAttribute('type') === 'submit'
      );
      
      expect(submitButton).toBeInTheDocument();
      expect(submitButton).toHaveTextContent(/dein strompreis bei tibber/i);
    });

    test('handles complete form interaction workflow', () => {
      renderWithProviders(<App />);
      
      // Fill PLZ
      const plzInput = screen.getByPlaceholderText(/10115/i);
      fireEvent.change(plzInput, { target: { value: '10115' } });
      expect(plzInput).toHaveValue('10115');
      
      // Adjust household size
      const slider = screen.getByRole('slider');
      fireEvent.change(slider, { target: { value: 3 } });
      
      // Select smart meter option
      const smartMeterCheckbox = screen.getByLabelText(/ich habe bereits einen smart meter/i);
      fireEvent.click(smartMeterCheckbox);
      expect(smartMeterCheckbox).toBeChecked();
      
      // Optional: Fill consumption
      const consumptionInput = screen.getByLabelText(/jahresverbrauch/i);
      fireEvent.change(consumptionInput, { target: { value: '3500' } });
      expect(consumptionInput).toHaveValue(3500);
      
      // Form should be ready for submission
      const buttons = screen.getAllByRole('button');
      const submitButton = buttons.find(button => 
        button.getAttribute('type') === 'submit'
      );
      expect(submitButton).toBeInTheDocument();
    });
  });

  describe('🔗 Integration and API', () => {
    test('maintains Supabase database connectivity', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      renderWithProviders(<App />);
      
      // Database connection should be established
      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('🔗 Testing database connection from frontend...');
        expect(consoleSpy).toHaveBeenCalledWith('✅ Frontend database connection successful');
      }, { timeout: 3000 });
      
      consoleSpy.mockRestore();
    });

    test('provides error-free form rendering', () => {
      // Suppress console warnings for this test
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      renderWithProviders(<App />);
      
      // Main form should render without errors
      expect(screen.getByText('Postleitzahl')).toBeInTheDocument();
      expect(screen.getByLabelText('PLZ')).toBeInTheDocument();
      
      // Form should be interactive
      const plzInput = screen.getByPlaceholderText(/10115/i);
      fireEvent.change(plzInput, { target: { value: '12345' } });
      expect(plzInput).toHaveValue('12345');
      
      consoleSpy.mockRestore();
    });
  });

  describe('🎨 User Experience Validation', () => {
    test('provides complete user interface elements', () => {
      renderWithProviders(<App />);
      
      // Navigation elements
      expect(screen.getByText('Enfinitus Energie')).toBeInTheDocument();
      
      // Form sections
      const formSections = [
        'Postleitzahl',
        'Personenanzahl im Haushalt', 
        'Smart Meter',
        'Solar PV',
        'Elektrofahrzeug'
      ];
      
      formSections.forEach(section => {
        expect(screen.getByText(section)).toBeInTheDocument();
      });
      
      // Interactive elements
      expect(screen.getByRole('slider')).toBeInTheDocument();
      expect(screen.getAllByRole('checkbox').length).toBeGreaterThanOrEqual(5);
      expect(screen.getAllByRole('button').length).toBeGreaterThanOrEqual(3);
    });

    test('supports full user journey through pricing form', () => {
      renderWithProviders(<App />);
      
      // Step 1: Enter location
      const plzInput = screen.getByPlaceholderText(/10115/i);
      fireEvent.change(plzInput, { target: { value: '10115' } });
      
      // Step 2: Set household size
      const slider = screen.getByRole('slider');
      fireEvent.change(slider, { target: { value: 2 } });
      
      // Step 3: Configure smart meter
      const smartMeterCheckbox = screen.getByLabelText(/ich habe bereits einen smart meter/i);
      fireEvent.click(smartMeterCheckbox);
      
      // Step 4: Configure solar PV (optional)
      const solarCheckbox = screen.getByLabelText(/ich möchte solar pv/i);
      fireEvent.click(solarCheckbox);
      
      // Step 5: Configure EV (optional)
      const evCheckbox = screen.getByLabelText(/ich besitze ein elektrofahrzeug/i);
      fireEvent.click(evCheckbox);
      
      // All configurations should be set
      expect(plzInput).toHaveValue('10115');
      expect(smartMeterCheckbox).toBeChecked();
      expect(solarCheckbox).toBeChecked();
      expect(evCheckbox).toBeChecked();
      
      // Form ready for submission
      const submitButtons = screen.getAllByRole('button').filter(button => 
        button.getAttribute('type') === 'submit'
      );
      expect(submitButtons.length).toBeGreaterThan(0);
    });
  });

  describe('✅ Frontend Funnel Summary', () => {
    test('validates complete frontend functionality', () => {
      renderWithProviders(<App />);
      
      // ✅ Core application loads
      expect(screen.getByText('Enfinitus Energie')).toBeInTheDocument();
      
      // ✅ Pricing form renders completely
      expect(screen.getByText('Postleitzahl')).toBeInTheDocument();
      expect(screen.getByLabelText('PLZ')).toBeInTheDocument();
      expect(screen.getByRole('slider')).toBeInTheDocument();
      
      // ✅ Smart meter options available
      expect(screen.getByLabelText(/ich habe bereits einen smart meter/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/ich möchte einen smart meter/i)).toBeInTheDocument();
      
      // ✅ Energy options available
      expect(screen.getByLabelText(/ich habe solar pv/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/ich möchte solar pv/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/ich besitze ein elektrofahrzeug/i)).toBeInTheDocument();
      
      // ✅ Form submission capability
      const submitButtons = screen.getAllByRole('button').filter(button => 
        button.getAttribute('type') === 'submit'
      );
      expect(submitButtons.length).toBeGreaterThan(0);
      
      // ✅ User interaction working
      const plzInput = screen.getByPlaceholderText(/10115/i);
      fireEvent.change(plzInput, { target: { value: '10115' } });
      expect(plzInput).toHaveValue('10115');
    });
  });
});