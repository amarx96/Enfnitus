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
  Chip,
} from '@mui/material';
import {
  LocationOn as LocationIcon,
  People as PeopleIcon,
  ElectricBolt as ElectricIcon,
  SolarPower as SolarIcon,
  ElectricCar as CarIcon,
  BatteryChargingFull as BatteryIcon,
  Speed as SmartMeterIcon,
  Business as BusinessIcon,
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
  const [voucherCode, setVoucherCode] = useState('');
  const [voucherStatus, setVoucherStatus] = useState<{
    isValid: boolean | null;
    message: string;
    discounts?: any;
  }>({ isValid: null, message: '' });

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
      // Include voucher code in submission data
      const submissionData = {
        ...formData,
        voucherCode: voucherCode || undefined
      };
      onSubmit(submissionData);
      navigate('/results');
    } catch (error) {
      console.error('Form submission error:', error);
    } finally {
      setLoading(false);
    }
  };

  const validateVoucherCode = async (code: string) => {
    if (!code.trim()) {
      setVoucherStatus({ isValid: null, message: '' });
      return;
    }

    try {
      const response = await fetch('/api/v1/voucher/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          voucherCode: code,
          tariffId: 'standard-10115' // Default für Validation
        }),
      });

      const result = await response.json();

      if (result.erfolg) {
        setVoucherStatus({
          isValid: true,
          message: result.nachricht,
          discounts: result.daten.discounts
        });
      } else {
        setVoucherStatus({
          isValid: false,
          message: result.nachricht
        });
      }
    } catch (error) {
      setVoucherStatus({
        isValid: false,
        message: 'Fehler bei der Voucher-Validierung'
      });
    }
  };

  const handleVoucherCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toUpperCase();
    setVoucherCode(value);
    
    // Debounce validation
    const timeoutId = setTimeout(() => {
      validateVoucherCode(value);
    }, 500);
    
    return () => clearTimeout(timeoutId);
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
    // Degressive Verbrauchsstaffel mit Economies of Scale
    // Grundverbrauch für Haushaltsgeräte + zusätzlicher Verbrauch pro Person
    // Cut-off bei 4 Personen - darüber hinaus Gewerbestrom
    const baseConsumption = 1500; // kWh Grundverbrauch für Haushaltsgeräte
    const personMultiplier = [
      0,    // 0 Personen (nicht verwendet)
      1.0,  // 1 Person: 100% des Grundverbrauchs + 800 kWh = 2300 kWh
      0.85, // 2 Personen: 85% Effizienz = 3275 kWh (1637 kWh pro Person)
      0.75, // 3 Personen: 75% Effizienz = 4200 kWh (1400 kWh pro Person)
      0.70, // 4 Personen: 70% Effizienz = 4900 kWh (1225 kWh pro Person)
    ];
    
    const persons = Math.min(formData.haushaltsgroesse, 4); // Maximal 4 Personen
    const additionalConsumptionPerPerson = 800; // kWh zusätzlich pro Person
    const efficiency = personMultiplier[persons] || 0.70;
    
    return Math.round(baseConsumption + (persons * additionalConsumptionPerPerson * efficiency));
  };

  return (
    <Box sx={{ bgcolor: 'background.default', minHeight: '100vh', color: 'text.primary' }}>
      {/* Header mit Intro-Text */}
      <Box sx={{ 
        pt: 6,
        pb: 4,
        textAlign: 'center',
        bgcolor: 'background.default'
      }}>
        <Container maxWidth="lg">
          <Typography variant="h6" sx={{ 
            color: 'text.secondary',
            mb: 2,
            lineHeight: 1.6,
            fontWeight: 400
          }}>
            Gib deinen Energieverbrauch ein und finde deinen monatlichen Enfinitus Energiepreis heraus.
          </Typography>
        </Container>
      </Box>

      {/* Hauptformular Container */}
      <Container maxWidth="md" sx={{ pb: 8 }}>
        <Paper elevation={3} sx={{ 
          bgcolor: 'background.paper',
          borderRadius: 3,
          border: '1px solid',
          borderColor: 'rgba(176, 190, 197, 0.3)',
          overflow: 'hidden'
        }}>
          <Box sx={{ p: 4 }}>
            <Grid container spacing={4}>
              
              {/* Postleitzahl */}
              <Grid item xs={12}>
                <Box sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <LocationIcon sx={{ color: 'primary.main', fontSize: 20 }} />
                    <Typography variant="h6" sx={{ color: 'text.primary', fontWeight: 500 }}>
                      Postleitzahl
                    </Typography>
                  </Box>
                  <TextField
                    fullWidth
                    value={formData.plz}
                    onChange={handlePlzChange}
                    error={!!errors.plz}
                    helperText={errors.plz}
                    placeholder="PLZ"
                    variant="outlined"
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        bgcolor: 'rgba(255,255,255,0.05)',
                        '& fieldset': { borderColor: 'rgba(176, 190, 197, 0.3)' },
                        '&:hover fieldset': { borderColor: 'primary.main' },
                        '&.Mui-focused fieldset': { borderColor: 'primary.main' }
                      },
                      '& .MuiInputBase-input': { color: 'text.primary' },
                      '& .MuiFormHelperText-root': { color: 'text.secondary' }
                    }}
                  />
                </Box>
              </Grid>

              {/* Personenanzahl */}
              <Grid item xs={12}>
                <Box sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                    <PeopleIcon sx={{ color: 'primary.main', fontSize: 20 }} />
                    <Typography variant="h6" sx={{ color: 'text.primary', fontWeight: 500 }}>
                      Personenanzahl im Haushalt
                    </Typography>
                  </Box>
                  <Slider
                    value={formData.haushaltsgroesse}
                    onChange={handleHouseholdSizeChange}
                    min={1}
                    max={4}
                    step={1}
                    marks={[
                      { value: 1, label: '1' },
                      { value: 2, label: '2' },
                      { value: 3, label: '3' },
                      { value: 4, label: '4' }
                    ]}
                    valueLabelDisplay="auto"
                    sx={{
                      color: 'primary.main',
                      '& .MuiSlider-track': { bgcolor: 'primary.main', height: 6 },
                      '& .MuiSlider-rail': { bgcolor: 'rgba(176, 190, 197, 0.3)', height: 6 },
                      '& .MuiSlider-thumb': { 
                        bgcolor: 'primary.main',
                        width: 20,
                        height: 20,
                        '&:hover': { boxShadow: '0 0 0 8px rgba(100, 181, 246, 0.16)' }
                      },
                      '& .MuiSlider-mark': { bgcolor: 'rgba(176, 190, 197, 0.5)' },
                      '& .MuiSlider-markLabel': { color: 'text.secondary', fontSize: '0.75rem' }
                    }}
                  />
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mt: 2, gap: 2 }}>
                    <Chip 
                      label={`${formData.haushaltsgroesse} ${formData.haushaltsgroesse === 1 ? 'Person' : 'Personen'}`}
                      sx={{ 
                        bgcolor: 'primary.main', 
                        color: 'white',
                        fontWeight: 500
                      }}
                    />
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        color: 'text.secondary',
                        textAlign: 'center',
                        fontStyle: 'italic'
                      }}
                    >
                      Geschätzter Verbrauch: {getEstimatedConsumption().toLocaleString()} kWh/Jahr
                    </Typography>
                    
                    {/* Gewerbestrom Button */}
                    <Box sx={{ 
                      mt: 2, 
                      p: 3, 
                      border: '2px dashed',
                      borderColor: 'warning.main',
                      borderRadius: 2,
                      bgcolor: 'rgba(255, 152, 0, 0.1)',
                      textAlign: 'center',
                      width: '100%'
                    }}>
                      <BusinessIcon sx={{ color: 'warning.main', fontSize: 32, mb: 1 }} />
                      <Typography variant="h6" sx={{ color: 'warning.main', fontWeight: 600, mb: 1 }}>
                        5+ Personen?
                      </Typography>
                      <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
                        Bei größeren Haushalten empfehlen wir Gewerbetarife mit besseren Konditionen
                      </Typography>
                      <Button
                        variant="contained"
                        color="warning"
                        startIcon={<BusinessIcon />}
                        sx={{
                          fontWeight: 600,
                          textTransform: 'none',
                          borderRadius: 2,
                          px: 3,
                          py: 1
                        }}
                        onClick={() => {
                          // Navigation zu Gewerbestrom-Seite oder Modal
                          window.open('mailto:gewerbe@enfinitus-newtech.de?subject=Anfrage Gewerbestrom&body=Hallo, ich interessiere mich für Gewerbetarife für einen Haushalt mit mehr als 4 Personen.', '_blank');
                        }}
                      >
                        Zu Gewerbestrom
                      </Button>
                    </Box>
                  </Box>
                </Box>
              </Grid>

              {/* kWh / Jahr */}
              <Grid item xs={12}>
                <Box sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <ElectricIcon sx={{ color: 'primary.main', fontSize: 20 }} />
                    <Typography variant="h6" sx={{ color: 'text.primary', fontWeight: 500 }}>
                      kWh / Jahr
                    </Typography>
                  </Box>
                  <TextField
                    fullWidth
                    type="number"
                    value={formData.jahresverbrauch || ''}
                    onChange={handleAnnualConsumptionChange}
                    error={!!errors.jahresverbrauch}
                    helperText={errors.jahresverbrauch || `Geschätzter Verbrauch: ${getEstimatedConsumption()} kWh/Jahr`}
                    placeholder="Jahresverbrauch (optional)"
                    variant="outlined"
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        bgcolor: 'rgba(255,255,255,0.05)',
                        '& fieldset': { borderColor: 'rgba(176, 190, 197, 0.3)' },
                        '&:hover fieldset': { borderColor: 'primary.main' },
                        '&.Mui-focused fieldset': { borderColor: 'primary.main' }
                      },
                      '& .MuiInputBase-input': { color: 'text.primary' },
                      '& .MuiFormHelperText-root': { color: 'text.secondary' }
                    }}
                  />
                </Box>
              </Grid>

              {/* Voucher Code */}
              <Grid item xs={12}>
                <Box sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <Typography variant="h6" sx={{ color: 'text.primary', fontWeight: 500 }}>
                      🎟️ Voucher Code (optional)
                    </Typography>
                  </Box>
                  <TextField
                    fullWidth
                    value={voucherCode}
                    onChange={handleVoucherCodeChange}
                    placeholder="z.B. WELCOME2025"
                    variant="outlined"
                    helperText={voucherStatus.message}
                    error={voucherStatus.isValid === false}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        bgcolor: voucherStatus.isValid === true ? 'rgba(76, 175, 80, 0.1)' : 
                                voucherStatus.isValid === false ? 'rgba(244, 67, 54, 0.1)' :
                                'rgba(255,255,255,0.05)',
                        borderColor: voucherStatus.isValid === true ? 'success.main' :
                                    voucherStatus.isValid === false ? 'error.main' : 'rgba(176, 190, 197, 0.3)',
                        '& fieldset': { 
                          borderColor: voucherStatus.isValid === true ? 'success.main' :
                                      voucherStatus.isValid === false ? 'error.main' : 'rgba(176, 190, 197, 0.3)'
                        },
                        '&:hover fieldset': { 
                          borderColor: voucherStatus.isValid === true ? 'success.main' :
                                      voucherStatus.isValid === false ? 'error.main' : 'primary.main'
                        },
                        '&.Mui-focused fieldset': { borderColor: 'primary.main' }
                      },
                      '& .MuiInputBase-input': { 
                        color: 'text.primary',
                        textTransform: 'uppercase'
                      },
                      '& .MuiFormHelperText-root': { 
                        color: voucherStatus.isValid === true ? 'success.main' :
                              voucherStatus.isValid === false ? 'error.main' : 'text.secondary'
                      }
                    }}
                  />
                  {voucherStatus.isValid === true && voucherStatus.discounts && (
                    <Box sx={{ 
                      mt: 2, 
                      p: 2, 
                      bgcolor: 'rgba(76, 175, 80, 0.1)', 
                      borderRadius: 1,
                      border: '1px solid',
                      borderColor: 'success.main'
                    }}>
                      <Typography variant="body2" sx={{ color: 'success.main', fontWeight: 600, mb: 1 }}>
                        ✅ Voucher erfolgreich angewendet!
                      </Typography>
                      <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                        Rabatte: {voucherStatus.discounts.workingPriceReduction} ct/kWh Arbeitspreis, 
                        {voucherStatus.discounts.basePriceReduction} €/Monat Grundpreis
                      </Typography>
                    </Box>
                  )}
                </Box>
              </Grid>

              {/* Smart Meter */}
              <Grid item xs={12}>
                <Box sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                    <SmartMeterIcon sx={{ color: 'primary.main', fontSize: 20 }} />
                    <Typography variant="h6" sx={{ color: 'text.primary', fontWeight: 500 }}>
                      Smart Meter
                    </Typography>
                  </Box>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={formData.hatSmartMeter}
                            onChange={(e) => setFormData({ ...formData, hatSmartMeter: e.target.checked })}
                            sx={{
                              '& .MuiSwitch-switchBase.Mui-checked': { color: 'primary.main' },
                              '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { bgcolor: 'primary.main' }
                            }}
                          />
                        }
                        label="Ich habe bereits einen Smart Meter"
                        sx={{ '& .MuiFormControlLabel-label': { color: 'text.primary' } }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={formData.moechteSmartMeter}
                            onChange={(e) => setFormData({ ...formData, moechteSmartMeter: e.target.checked })}
                            sx={{
                              '& .MuiSwitch-switchBase.Mui-checked': { color: 'primary.main' },
                              '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { bgcolor: 'primary.main' }
                            }}
                          />
                        }
                        label="Ich möchte einen Smart Meter"
                        sx={{ '& .MuiFormControlLabel-label': { color: 'text.primary' } }}
                      />
                    </Grid>
                  </Grid>
                </Box>
              </Grid>

              {/* Solar PV */}
              <Grid item xs={12}>
                <Box sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                    <SolarIcon sx={{ color: 'primary.main', fontSize: 20 }} />
                    <Typography variant="h6" sx={{ color: 'text.primary', fontWeight: 500 }}>
                      Solar PV
                    </Typography>
                  </Box>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={formData.hatSolarPV}
                            onChange={(e) => setFormData({ ...formData, hatSolarPV: e.target.checked })}
                            sx={{
                              '& .MuiSwitch-switchBase.Mui-checked': { color: 'primary.main' },
                              '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { bgcolor: 'primary.main' }
                            }}
                          />
                        }
                        label="Ich habe Solar PV auf dem Dach"
                        sx={{ '& .MuiFormControlLabel-label': { color: 'text.primary' } }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={formData.moechteSolarPV}
                            onChange={(e) => setFormData({ ...formData, moechteSolarPV: e.target.checked })}
                            sx={{
                              '& .MuiSwitch-switchBase.Mui-checked': { color: 'primary.main' },
                              '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { bgcolor: 'primary.main' }
                            }}
                          />
                        }
                        label="Ich möchte Solar PV"
                        sx={{ '& .MuiFormControlLabel-label': { color: 'text.primary' } }}
                      />
                    </Grid>
                  </Grid>
                </Box>
              </Grid>

              {/* Batterie */}
              <Grid item xs={12}>
                <Box sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                    <BatteryIcon sx={{ color: 'primary.main', fontSize: 20 }} />
                    <Typography variant="h6" sx={{ color: 'text.primary', fontWeight: 500 }}>
                      Batterie
                    </Typography>
                  </Box>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={formData.hatBatterie}
                        onChange={(e) => setFormData({ ...formData, hatBatterie: e.target.checked })}
                        sx={{
                          '& .MuiSwitch-switchBase.Mui-checked': { color: 'primary.main' },
                          '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { bgcolor: 'primary.main' }
                        }}
                      />
                    }
                    label="Zusätzliche Batterie gewünscht"
                    sx={{ '& .MuiFormControlLabel-label': { color: 'text.primary' } }}
                  />
                </Box>
              </Grid>

              {/* Elektrofahrzeug */}
              <Grid item xs={12}>
                <Box sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                    <CarIcon sx={{ color: 'primary.main', fontSize: 20 }} />
                    <Typography variant="h6" sx={{ color: 'text.primary', fontWeight: 500 }}>
                      Elektrofahrzeug
                    </Typography>
                  </Box>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={formData.hatElektrofahrzeug}
                        onChange={(e) => setFormData({ ...formData, hatElektrofahrzeug: e.target.checked })}
                        sx={{
                          '& .MuiSwitch-switchBase.Mui-checked': { color: 'primary.main' },
                          '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { bgcolor: 'primary.main' }
                        }}
                      />
                    }
                    label="Ich besitze ein Elektrofahrzeug"
                    sx={{ '& .MuiFormControlLabel-label': { color: 'text.primary' } }}
                  />
                </Box>
              </Grid>

              {/* Submit Button */}
              <Grid item xs={12}>
                <Button
                  fullWidth
                  variant="contained"
                  size="large"
                  onClick={handleSubmit}
                  disabled={loading}
                  sx={{ 
                    py: 2,
                    fontSize: '1rem',
                    fontWeight: 600,
                    textTransform: 'none',
                    borderRadius: 2,
                    bgcolor: 'success.main',
                    color: 'white',
                    '&:hover': {
                      bgcolor: 'success.dark',
                      boxShadow: '0 4px 8px rgba(76, 175, 80, 0.3)'
                    },
                    '&:disabled': {
                      bgcolor: 'rgba(76, 175, 80, 0.5)'
                    }
                  }}
                >
                  {loading ? 'Wird berechnet...' : 'Dein Strompreis bei Enfinitus'}
                </Button>
              </Grid>

            </Grid>
          </Box>
        </Paper>
      </Container>

      {loading && (
        <Box sx={{ position: 'fixed', bottom: 20, right: 20 }}>
          <Alert severity="info" sx={{ bgcolor: 'background.paper', color: 'text.primary' }}>
            Ihr individuelles Angebot wird berechnet...
          </Alert>
        </Box>
      )}
    </Box>
  );
};

export default PricingForm;