import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Typography,
  TextField,
  Button,
  FormControlLabel,
  Switch,
  Grid,
  Box,
  Alert,
  Slider,
  Container,
  Paper,
} from '@mui/material';
import { PricingFormData } from '../App';

interface PricingFormProps {
  onSubmit: (data: PricingFormData) => void;
  initialData?: PricingFormData | null;
}

const PricingForm: React.FC<PricingFormProps> = ({ onSubmit, initialData }) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<PricingFormData>({
    plz: initialData?.plz || '',
    haushaltsgroesse: initialData?.haushaltsgroesse || 2,
    jahresverbrauch: initialData?.jahresverbrauch || undefined,
    hatSmartMeter: initialData?.hatSmartMeter || false,
    moechteSmartMeter: initialData?.moechteSmartMeter || false,
    hatSolarPV: initialData?.hatSolarPV || false,
    moechteSolarPV: initialData?.moechteSolarPV || false,
    hatElektrofahrzeug: initialData?.hatElektrofahrzeug || false,
    hatBatterie: initialData?.hatBatterie || false,
    moechteBatterie: initialData?.moechteBatterie || false,
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [loading, setLoading] = useState(false);

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};
    
    if (!formData.plz || formData.plz.length !== 5) {
      newErrors.plz = 'Bitte geben Sie eine gültige 5-stellige Postleitzahl ein';
    }
    
    if (formData.jahresverbrauch && (formData.jahresverbrauch < 1000 || formData.jahresverbrauch > 20000)) {
      newErrors.jahresverbrauch = 'Jahresverbrauch sollte zwischen 1.000 und 20.000 kWh liegen';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      onSubmit(formData);
      navigate('/pricing-results');
    } catch (error) {
      console.error('Form submission error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePlzChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 5);
    setFormData({ ...formData, plz: value });
    if (errors.plz && value.length === 5) {
      setErrors({ ...errors, plz: '' });
    }
  };

  const handleHouseholdSizeChange = (_: Event, newValue: number | number[]) => {
    setFormData({ ...formData, haushaltsgroesse: newValue as number });
  };

  const handleAnnualConsumptionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value ? parseInt(e.target.value) : undefined;
    setFormData({ ...formData, jahresverbrauch: value });
    if (errors.jahresverbrauch && value && value >= 1000 && value <= 20000) {
      setErrors({ ...errors, jahresverbrauch: '' });
    }
  };

  const getEstimatedConsumption = () => {
    return formData.haushaltsgroesse * 1100;
  };

  return (
    <Box sx={{ bgcolor: 'background.default', minHeight: '100vh' }}>
      {/* Header */}
      <Box sx={{ 
        pt: 8,
        pb: 6,
        textAlign: 'center'
      }}>
        <Container maxWidth="md">
          <Typography variant="h3" component="h1" sx={{ 
            fontWeight: 600,
            color: 'text.primary',
            mb: 3,
            fontSize: { xs: '2rem', md: '3rem' }
          }}>
            Ihr Angebot für Energielösungen
          </Typography>
          
          <Typography variant="h6" sx={{ 
            color: 'text.secondary',
            mb: 4,
            lineHeight: 1.6
          }}>
            Moderne Energielösungen für Ihr Zuhause
          </Typography>
        </Container>
      </Box>

      {/* Formular */}
      <Container maxWidth="md" sx={{ pb: 8 }}>
        <Paper elevation={1} sx={{ 
          p: 4,
          borderRadius: 2,
          border: '1px solid',
          borderColor: 'grey.200'
        }}>
          <form onSubmit={handleSubmit}>
            <Grid container spacing={4}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Postleitzahl"
                  value={formData.plz}
                  onChange={handlePlzChange}
                  error={!!errors.plz}
                  helperText={errors.plz}
                  placeholder="z.B. 10115"
                  variant="outlined"
                />
              </Grid>

              <Grid item xs={12}>
                <Typography gutterBottom sx={{ fontWeight: 500, color: 'text.primary' }}>
                  Haushaltsgröße: {formData.haushaltsgroesse} Personen
                </Typography>
                <Slider
                  value={formData.haushaltsgroesse}
                  onChange={handleHouseholdSizeChange}
                  min={1}
                  max={8}
                  step={1}
                  marks={[
                    { value: 1, label: '1' },
                    { value: 4, label: '4' },
                    { value: 8, label: '8+' }
                  ]}
                  valueLabelDisplay="auto"
                  sx={{ 
                    color: 'primary.main',
                    '& .MuiSlider-mark': {
                      color: 'grey.400'
                    },
                    '& .MuiSlider-markLabel': {
                      color: 'text.secondary'
                    }
                  }}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  type="number"
                  label="Jahresverbrauch (kWh/Jahr)"
                  value={formData.jahresverbrauch || ''}
                  onChange={handleAnnualConsumptionChange}
                  error={!!errors.jahresverbrauch}
                  helperText={errors.jahresverbrauch || `Geschätzter Verbrauch: ${getEstimatedConsumption()} kWh/Jahr`}
                  placeholder={getEstimatedConsumption().toString()}
                  variant="outlined"
                />
              </Grid>

              {/* Optionen */}
              <Grid item xs={12}>
                <Typography variant="h6" sx={{ 
                  mb: 3, 
                  color: 'text.primary',
                  fontWeight: 500
                }}>
                  Zusätzliche Optionen
                </Typography>
                
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={formData.hatSolarPV}
                        onChange={(e) => setFormData({ ...formData, hatSolarPV: e.target.checked })}
                        color="primary"
                      />
                    }
                    label="Photovoltaikanlage"
                    sx={{ '& .MuiFormControlLabel-label': { color: 'text.primary' } }}
                  />

                  <FormControlLabel
                    control={
                      <Switch
                        checked={formData.hatSmartMeter}
                        onChange={(e) => setFormData({ ...formData, hatSmartMeter: e.target.checked })}
                        color="primary"
                      />
                    }
                    label="Smart Meter"
                    sx={{ '& .MuiFormControlLabel-label': { color: 'text.primary' } }}
                  />

                  <FormControlLabel
                    control={
                      <Switch
                        checked={formData.moechteSolarPV}
                        onChange={(e) => setFormData({ ...formData, moechteSolarPV: e.target.checked })}
                        color="primary"
                      />
                    }
                    label="Stromspeicher"
                    sx={{ '& .MuiFormControlLabel-label': { color: 'text.primary' } }}
                  />

                  <FormControlLabel
                    control={
                      <Switch
                        checked={formData.hatBatterie}
                        onChange={(e) => setFormData({ ...formData, hatBatterie: e.target.checked })}
                        color="primary"
                      />
                    }
                    label="Zusätzliche Batterie"
                    sx={{ '& .MuiFormControlLabel-label': { color: 'text.primary' } }}
                  />

                  <FormControlLabel
                    control={
                      <Switch
                        checked={formData.hatElektrofahrzeug}
                        onChange={(e) => setFormData({ ...formData, hatElektrofahrzeug: e.target.checked })}
                        color="primary"
                      />
                    }
                    label="Elektrofahrzeug / Wallbox"
                    sx={{ '& .MuiFormControlLabel-label': { color: 'text.primary' } }}
                  />
                </Box>
              </Grid>

              <Grid item xs={12}>
                <Button
                  fullWidth
                  variant="contained"
                  color="primary"
                  size="large"
                  onClick={handleSubmit}
                  disabled={loading}
                  sx={{ 
                    py: 2,
                    fontSize: '1rem',
                    fontWeight: 500,
                    textTransform: 'none',
                    borderRadius: 2,
                    boxShadow: 1,
                    '&:hover': {
                      boxShadow: 2
                    }
                  }}
                >
                  {loading ? 'Wird berechnet...' : 'Angebot berechnen'}
                </Button>
              </Grid>
            </Grid>
          </form>
        </Paper>
      </Container>

      {loading && (
        <Box sx={{ position: 'fixed', bottom: 20, right: 20 }}>
          <Alert severity="info">
            Ihr individuelles Angebot wird berechnet...
          </Alert>
        </Box>
      )}
    </Box>
  );
};

export default PricingForm;