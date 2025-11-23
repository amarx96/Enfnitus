import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  FormControlLabel,
  Switch,
  Grid,
  Box,
  Alert,
  Slider,
  Chip,
  Container,
  Paper,
} from '@mui/material';
import {
  LocationOn as LocationIcon,
  People as PeopleIcon,
  ElectricBolt as ElectricIcon,
  SolarPower as SolarIcon,
  ElectricCar as CarIcon,
  BatteryChargingFull as BatteryIcon,
  Power as InverterIcon,
  Home as HomeIcon,
} from '@mui/icons-material';
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

  // Estimate annual consumption based on household size and features
  const getEstimatedConsumption = () => {
    let baseConsumption = 1200 + (formData.haushaltsgroesse * 800);
    
    // Add consumption for electric vehicle
    if (formData.hatElektrofahrzeug) {
      baseConsumption += 3000; // Average 3000 kWh for EV
    }
    
    // Reduce consumption if has solar PV
    if (formData.hatSolarPV) {
      baseConsumption *= 0.6; // 40% reduction with solar
    }
    
    return Math.round(baseConsumption);
  };

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    // PLZ validation
    if (!formData.plz) {
      newErrors.plz = 'Postleitzahl ist erforderlich';
    } else if (!/^\d{5}$/.test(formData.plz)) {
      newErrors.plz = 'Postleitzahl muss 5 Ziffern haben';
    }

    // Household size validation
    if (formData.haushaltsgroesse < 1 || formData.haushaltsgroesse > 20) {
      newErrors.haushaltsgroesse = 'Haushaltsgröße muss zwischen 1 und 20 Personen liegen';
    }

    // Annual consumption validation if provided
    if (formData.jahresverbrauch && (formData.jahresverbrauch < 500 || formData.jahresverbrauch > 50000)) {
      newErrors.jahresverbrauch = 'Jahresverbrauch muss zwischen 500 und 50.000 kWh liegen';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);
    
    try {
      // If no annual consumption provided, use estimated value
      const finalData = {
        ...formData,
        jahresverbrauch: formData.jahresverbrauch || getEstimatedConsumption(),
      };
      
      onSubmit(finalData);
      navigate('/results');
    } catch (error) {
      console.error('Form submission error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePlzChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 5);
    setFormData({ ...formData, plz: value });
    if (errors.plz) {
      setErrors({ ...errors, plz: '' });
    }
  };

  const handleHouseholdSizeChange = (event: Event, newValue: number | number[]) => {
    const value = Array.isArray(newValue) ? newValue[0] : newValue;
    setFormData({ ...formData, haushaltsgroesse: value });
    if (errors.haushaltsgroesse) {
      setErrors({ ...errors, haushaltsgroesse: '' });
    }
  };

  const handleAnnualConsumptionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value === '' ? undefined : parseInt(e.target.value, 10);
    setFormData({ ...formData, jahresverbrauch: value });
    if (errors.jahresverbrauch) {
      setErrors({ ...errors, jahresverbrauch: '' });
    }
  };

  return (
    <Box>
      {/* Hero Section mit Hausvisualisierung */}
      <Box sx={{ 
        position: 'relative',
        minHeight: '80vh',
        display: 'flex',
        alignItems: 'center',
        overflow: 'hidden',
        mb: 6
      }}>
        {/* Hintergrund-Illustration */}
        <Box sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'linear-gradient(135deg, #E3F2FD 0%, #FFF9C4 50%, #BBDEFB 100%)',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: '10%',
            right: '5%',
            width: '500px',
            height: '300px',
            background: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 500 300\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Crect x=\'100\' y=\'150\' width=\'300\' height=\'120\' fill=\'%23E0E0E0\' rx=\'10\'/%3E%3Crect x=\'80\' y=\'100\' width=\'50\' height=\'170\' fill=\'%23BDBDBD\' rx=\'5\'/%3E%3Crect x=\'370\' y=\'100\' width=\'50\' height=\'170\' fill=\'%23BDBDBD\' rx=\'5\'/%3E%3Cpolygon points=\'70,100 250,20 430,100\' fill=\'%23424242\'/%3E%3C/svg%3E") no-repeat center',
            backgroundSize: 'contain',
            opacity: 0.3,
          }
        }} />

        <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 2 }}>
          <Grid container spacing={6} alignItems="center">
            <Grid item xs={12} md={6}>
              <Typography variant="h2" component="h1" sx={{ 
                fontWeight: 700,
                color: 'secondary.main',
                mb: 3,
                fontSize: { xs: '2rem', md: '3.5rem' }
              }}>
                FORDERN SIE JETZT IHR ANGEBOT AN!
              </Typography>
              
              <Typography variant="h6" sx={{ 
                color: 'text.secondary',
                mb: 4,
                lineHeight: 1.6
              }}>
                Ihre komplette Energielösung aus einer Hand - von der Photovoltaikanlage bis zur intelligenten Wallbox. 
                Werden Sie energieautark mit unseren zukunftsweisenden Technologien.
              </Typography>

              {/* Technologie-Tags */}
              <Box sx={{ mb: 4, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                <Chip 
                  icon={<SolarIcon />} 
                  label="PV-ANLAGE" 
                  sx={{ 
                    bgcolor: '#1976D2', // Blau
                    color: 'white',
                    '& .MuiChip-icon': { color: 'white' }
                  }}
                />
                <Chip 
                  icon={<BatteryIcon />} 
                  label="STROMSPEICHER" 
                  sx={{ 
                    bgcolor: '#FFB300', // Gelb
                    color: 'white',
                    '& .MuiChip-icon': { color: 'white' }
                  }}
                />
                <Chip 
                  icon={<InverterIcon />} 
                  label="WECHSELRICHTER" 
                  sx={{ 
                    bgcolor: '#1976D2', // Blau
                    color: 'white',
                    '& .MuiChip-icon': { color: 'white' }
                  }}
                />
                <Chip 
                  icon={<CarIcon />} 
                  label="WALLBOX" 
                  sx={{ 
                    bgcolor: '#E53935', // Rot als Akzent
                    color: 'white',
                    '& .MuiChip-icon': { color: 'white' }
                  }}
                />
              </Box>
            </Grid>

            {/* Anfrageformular */}
            <Grid item xs={12} md={6}>
              <Paper elevation={8} sx={{ 
                p: 4, 
                borderRadius: 4,
                background: 'rgba(255,255,255,0.95)',
                backdropFilter: 'blur(10px)'
              }}>
                <Typography variant="h4" align="center" sx={{ 
                  mb: 3, 
                  color: 'secondary.main',
                  fontWeight: 600
                }}>
                  Kostenlose Beratung
                </Typography>
                
                {errors.submit && (
                  <Alert severity="error" sx={{ mb: 2 }}>
                    {errors.submit}
                  </Alert>
                )}

                <Grid container spacing={3}>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Postleitzahl"
                      value={formData.plz}
                      onChange={handlePlzChange}
                      error={!!errors.plz}
                      helperText={errors.plz}
                      InputProps={{
                        startAdornment: <LocationIcon color="primary" sx={{ mr: 1 }} />,
                      }}
                      placeholder="z.B. 10115"
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <Typography gutterBottom sx={{ fontWeight: 500 }}>
                      <PeopleIcon sx={{ mr: 1, verticalAlign: 'middle', color: 'primary.main' }} />
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
                      color="primary"
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      type="number"
                      label="Geschätzter Jahresverbrauch"
                      value={formData.jahresverbrauch || ''}
                      onChange={handleAnnualConsumptionChange}
                      error={!!errors.jahresverbrauch}
                      helperText={errors.jahresverbrauch || `Geschätzter Verbrauch: ${getEstimatedConsumption()} kWh/Jahr`}
                      InputProps={{
                        startAdornment: <ElectricIcon color="primary" sx={{ mr: 1 }} />,
                        endAdornment: 'kWh/Jahr',
                      }}
                      placeholder={getEstimatedConsumption().toString()}
                    />
                  </Grid>

                  {/* Technologie-Optionen */}
                  <Grid item xs={12}>
                    <Typography variant="h6" sx={{ mb: 2, color: 'secondary.main' }}>
                      Interessante Technologien
                    </Typography>
                    
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={formData.hatSolarPV}
                            onChange={(e) => setFormData({ ...formData, hatSolarPV: e.target.checked })}
                            color="primary"
                          />
                        }
                        label={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <SolarIcon color="primary" />
                            Photovoltaikanlage
                          </Box>
                        }
                      />

                      <FormControlLabel
                        control={
                          <Switch
                            checked={formData.hatSmartMeter}
                            onChange={(e) => setFormData({ ...formData, hatSmartMeter: e.target.checked })}
                            color="primary"
                          />
                        }
                        label={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <BatteryIcon color="primary" />
                            Smart Meter
                          </Box>
                        }
                      />

                      <FormControlLabel
                        control={
                          <Switch
                            checked={formData.moechteSolarPV}
                            onChange={(e) => setFormData({ ...formData, moechteSolarPV: e.target.checked })}
                            color="secondary"
                          />
                        }
                        label={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <BatteryIcon color="secondary" />
                            Batterie / Stromspeicher
                          </Box>
                        }
                      />
                      
                      <FormControlLabel
                        control={
                          <Switch
                            checked={formData.hatElektrofahrzeug}
                            onChange={(e) => setFormData({ ...formData, hatElektrofahrzeug: e.target.checked })}
                            color="primary"
                          />
                        }
                        label={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <CarIcon color="primary" />
                            Elektrofahrzeug / Wallbox
                          </Box>
                        }
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
                        fontSize: '1.1rem',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        background: 'linear-gradient(45deg, #1976D2 30%, #FFB300 90%)',
                        '&:hover': {
                          background: 'linear-gradient(45deg, #E55100 30%, #FF6B35 90%)',
                        }
                      }}
                    >
                      {loading ? 'Wird berechnet...' : 'JETZT ANGEBOT ANFORDERN'}
                    </Button>
                  </Grid>
                </Grid>
              </Paper>
            </Grid>
          </Grid>
        </Container>
      </Box>
    </Box>
  );
};

export default PricingForm;