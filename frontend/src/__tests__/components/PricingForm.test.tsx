import React from 'react';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import userEvent from '@testing-library/user-event';
import { render, mockPricingFormData } from '../utils/testUtils';
import PricingForm from '../../components/PricingForm';

// Mock react-router-dom
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

describe('PricingForm Component', () => {
  const mockOnSubmit = jest.fn();
  
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const renderPricingForm = (initialData = null) => {
    return render(
      <PricingForm 
        onSubmit={mockOnSubmit} 
        initialData={initialData}
      />
    );
  };

  describe('Rendering', () => {
    it('should render all form sections', () => {
      renderPricingForm();
      
      expect(screen.getByText('Dein Strompreis bei Tibber')).toBeInTheDocument();
      expect(screen.getByText('Postleitzahl')).toBeInTheDocument();
      expect(screen.getByText('Personenanzahl im Haushalt')).toBeInTheDocument();
      expect(screen.getByText('kWh / Jahr')).toBeInTheDocument();
      expect(screen.getByText('Smart Meter')).toBeInTheDocument();
      expect(screen.getByText('Solar PV')).toBeInTheDocument();
      expect(screen.getByText('Elektrofahrzeug')).toBeInTheDocument();
    });

    it('should render with initial data', () => {
      renderPricingForm(mockPricingFormData);
      
      const plzInput = screen.getByDisplayValue('10115');
      expect(plzInput).toBeInTheDocument();
      
      const consumptionInput = screen.getByDisplayValue('3500');
      expect(consumptionInput).toBeInTheDocument();
    });

    it('should display the main heading and description', () => {
      renderPricingForm();
      
      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Dein Strompreis bei Tibber');
      expect(screen.getByText(/Gib deinen Energieverbrauch ein/)).toBeInTheDocument();
    });
  });

  describe('Form Validation', () => {
    it('should validate PLZ format', async () => {
      const user = userEvent.setup();
      renderPricingForm();
      
      const plzInput = screen.getByLabelText(/PLZ/);
      const submitButton = screen.getByRole('button', { name: /Dein Strompreis bei Tibber/ });
      
      // Test invalid PLZ
      await user.type(plzInput, '123');
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText('Postleitzahl muss 5 Ziffern haben')).toBeInTheDocument();
      });
      
      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it('should validate empty PLZ', async () => {
      const user = userEvent.setup();
      renderPricingForm();
      
      const submitButton = screen.getByRole('button', { name: /Dein Strompreis bei Tibber/ });
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText('Postleitzahl ist erforderlich')).toBeInTheDocument();
      });
    });

    it('should accept valid PLZ', async () => {
      const user = userEvent.setup();
      renderPricingForm();
      
      const plzInput = screen.getByLabelText(/PLZ/);
      await user.type(plzInput, '10115');
      
      // Should not show error
      expect(screen.queryByText(/Postleitzahl muss 5 Ziffern haben/)).not.toBeInTheDocument();
    });

    it('should validate annual consumption range', async () => {
      const user = userEvent.setup();
      renderPricingForm();
      
      const consumptionInput = screen.getByLabelText(/Jahresverbrauch/);
      const submitButton = screen.getByRole('button', { name: /Dein Strompreis bei Tibber/ });
      
      // Test consumption too low
      await user.clear(consumptionInput);
      await user.type(consumptionInput, '100');
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText('Jahresverbrauch muss zwischen 500 und 50.000 kWh liegen')).toBeInTheDocument();
      });
    });
  });

  describe('Form Interactions', () => {
    it('should handle household size slider changes', async () => {
      const user = userEvent.setup();
      renderPricingForm();
      
      const slider = screen.getByRole('slider');
      
      // Change slider value
      fireEvent.change(slider, { target: { value: '5' } });
      
      await waitFor(() => {
        expect(screen.getByText('5 Personen')).toBeInTheDocument();
      });
    });

    it('should handle smart meter switches', async () => {
      const user = userEvent.setup();
      renderPricingForm();
      
      const hasSmartMeterSwitch = screen.getByLabelText('Ich habe bereits einen Smart Meter');
      const wantsSmartMeterSwitch = screen.getByLabelText('Ich möchte einen Smart Meter');
      
      await user.click(hasSmartMeterSwitch);
      await user.click(wantsSmartMeterSwitch);
      
      expect(hasSmartMeterSwitch).toBeChecked();
      expect(wantsSmartMeterSwitch).toBeChecked();
    });

    it('should handle solar PV switches', async () => {
      const user = userEvent.setup();
      renderPricingForm();
      
      const hasSolarSwitch = screen.getByLabelText('Ich habe Solar PV auf dem Dach');
      const wantsSolarSwitch = screen.getByLabelText('Ich möchte Solar PV');
      
      await user.click(hasSolarSwitch);
      await user.click(wantsSolarSwitch);
      
      expect(hasSolarSwitch).toBeChecked();
      expect(wantsSolarSwitch).toBeChecked();
    });

    it('should handle electric vehicle switch', async () => {
      const user = userEvent.setup();
      renderPricingForm();
      
      const evSwitch = screen.getByLabelText('Ich besitze ein Elektrofahrzeug');
      
      await user.click(evSwitch);
      
      expect(evSwitch).toBeChecked();
    });
  });

  describe('Consumption Estimation', () => {
    it('should show estimated consumption based on household size', () => {
      renderPricingForm();
      
      // Default household size is 2, should show estimated consumption
      expect(screen.getByText(/Geschätzter Verbrauch:/)).toBeInTheDocument();
    });

    it('should update estimated consumption when household size changes', async () => {
      renderPricingForm();
      
      const slider = screen.getByRole('slider');
      
      // Change to 4 people
      fireEvent.change(slider, { target: { value: '4' } });
      
      await waitFor(() => {
        // Should show higher estimated consumption for more people
        expect(screen.getByText(/Geschätzter Verbrauch: 4400 kWh\/Jahr/)).toBeInTheDocument();
      });
    });
  });

  describe('Form Submission', () => {
    it('should submit valid form data', async () => {
      const user = userEvent.setup();
      renderPricingForm();
      
      // Fill out form
      const plzInput = screen.getByLabelText(/PLZ/);
      const consumptionInput = screen.getByLabelText(/Jahresverbrauch/);
      const submitButton = screen.getByRole('button', { name: /Dein Strompreis bei Tibber/ });
      
      await user.type(plzInput, '10115');
      await user.type(consumptionInput, '3500');
      
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith({
          plz: '10115',
          haushaltsgroesse: 2, // default value
          jahresverbrauch: 3500,
          hatSmartMeter: false,
          moechteSmartMeter: false,
          hatSolarPV: false,
          moechteSolarPV: false,
          hatElektrofahrzeug: false,
        });
      });
      
      expect(mockNavigate).toHaveBeenCalledWith('/results');
    });

    it('should submit with estimated consumption when not provided', async () => {
      const user = userEvent.setup();
      renderPricingForm();
      
      const plzInput = screen.getByLabelText(/PLZ/);
      const submitButton = screen.getByRole('button', { name: /Dein Strompreis bei Tibber/ });
      
      await user.type(plzInput, '10115');
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            plz: '10115',
            jahresverbrauch: 2800, // estimated for 2 people (1200 + 2*800)
          })
        );
      });
    });

    it('should show loading state during submission', async () => {
      const user = userEvent.setup();
      renderPricingForm();
      
      const plzInput = screen.getByLabelText(/PLZ/);
      const submitButton = screen.getByRole('button', { name: /Dein Strompreis bei Tibber/ });
      
      await user.type(plzInput, '10115');
      
      // Mock slow submission
      mockOnSubmit.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 1000)));
      
      await user.click(submitButton);
      
      expect(screen.getByText('Wird berechnet...')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      renderPricingForm();
      
      expect(screen.getByLabelText(/PLZ/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Jahresverbrauch/)).toBeInTheDocument();
      expect(screen.getByRole('slider')).toHaveAccessibleName();
    });

    it('should support keyboard navigation', async () => {
      const user = userEvent.setup();
      renderPricingForm();
      
      const plzInput = screen.getByLabelText(/PLZ/);
      
      // Tab to PLZ input and type
      await user.tab();
      expect(plzInput).toHaveFocus();
      
      await user.type(plzInput, '12345');
      expect(plzInput).toHaveValue('12345');
    });
  });

  describe('Error Handling', () => {
    it('should clear errors when user corrects input', async () => {
      const user = userEvent.setup();
      renderPricingForm();
      
      const plzInput = screen.getByLabelText(/PLZ/);
      const submitButton = screen.getByRole('button', { name: /Dein Strompreis bei Tibber/ });
      
      // Trigger error
      await user.type(plzInput, '123');
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText('Postleitzahl muss 5 Ziffern haben')).toBeInTheDocument();
      });
      
      // Correct the error
      await user.clear(plzInput);
      await user.type(plzInput, '12345');
      
      await waitFor(() => {
        expect(screen.queryByText('Postleitzahl muss 5 Ziffern haben')).not.toBeInTheDocument();
      });
    });
  });
});