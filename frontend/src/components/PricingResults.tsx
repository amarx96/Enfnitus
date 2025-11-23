import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  Chip,
  LinearProgress,
  Alert,
  Divider,
  Paper,
  IconButton,
} from '@mui/material';
import {
  ElectricBolt as ElectricIcon,
  Euro as EuroIcon,
  Schedule as ScheduleIcon,
  ChevronRight as ChevronRightIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import { PricingFormData, PricingResult } from '../App';

interface PricingResultsProps {
  formData: PricingFormData;
  onSelectTariff: (tariff: PricingResult) => void;
}

const PricingResults: React.FC<PricingResultsProps> = ({ formData, onSelectTariff }) => {
  const navigate = useNavigate();
  const [tariffs, setTariffs] = useState<PricingResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [location, setLocation] = useState<any>(null);

  useEffect(() => {
    fetchPricingData();
  }, [formData]);

  const fetchPricingData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Prepare request data - mapping to backend format
      const requestData = {
        plz: formData.plz,
        jahresverbrauch: formData.jahresverbrauch,
        haushaltgroesse: formData.haushaltsgroesse,
        // Optional: could add tariff type filter
      };

      const response = await fetch('/api/v1/pricing/berechnen', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.nachricht || 'Fehler beim Abrufen der Preisdaten');
      }

      const data = await response.json();
      
      if (data.erfolg) {
        setLocation(data.daten.location);
        
        // Transform backend response to frontend format
        const transformedTariffs = data.daten.tarife.map((tariff: any) => ({
          tariffId: tariff.id,
          tariffName: tariff.name,
          tariffType: tariff.type,
          contractDuration: 12, // Default contract duration
          pricing: {
            workingPrice: tariff.preise.arbeitspreis_brutto,
            basePrice: tariff.preise.grundpreis_brutto,
            currency: 'EUR',
            workingPriceUnit: tariff.preise.einheit_arbeitspreis,
            basePriceUnit: tariff.preise.einheit_grundpreis,
          },
          estimatedCosts: {
            annualConsumption: data.daten.consumption.annual_kwh,
            energyCosts: tariff.kosten.arbeitspreis_jahr,
            baseCosts: tariff.kosten.grundpreis_jahr,
            totalAnnualCosts: tariff.kosten.gesamtkosten_jahr,
            monthlyCosts: tariff.kosten.monatliche_kosten,
          },
          savings: tariff.ersparnis || null,
          recommended: tariff.empfohlen || false,
        }));
        
        // Also add alternative tariffs if available
        if (data.daten.alternative_tarife && data.daten.alternative_tarife.length > 0) {
          const alternativeTariffs = data.daten.alternative_tarife.map((tariff: any) => ({
            tariffId: tariff.id,
            tariffName: tariff.name,
            tariffType: tariff.type,
            contractDuration: 12,
            pricing: {
              workingPrice: 0, // Not provided in alternative tariffs
              basePrice: 0,
              currency: 'EUR',
              workingPriceUnit: 'ct/kWh',
              basePriceUnit: '€/Monat',
            },
            estimatedCosts: {
              annualConsumption: data.daten.consumption.annual_kwh,
              energyCosts: 0,
              baseCosts: 0,
              totalAnnualCosts: tariff.jahreskosten,
              monthlyCosts: tariff.monatliche_kosten,
            },
            savings: null,
            recommended: false,
          }));
          
          transformedTariffs.push(...alternativeTariffs);
        }
        
        setTariffs(transformedTariffs);
        
        // Apply voucher code if provided
        if (formData.voucherCode && transformedTariffs.length > 0) {
          await applyVoucherToTariffs(transformedTariffs);
        }
      } else {
        throw new Error(data.nachricht || 'Unbekannter Fehler');
      }
    } catch (err) {
      console.error('Pricing data fetch error:', err);
      setError(err instanceof Error ? err.message : 'Fehler beim Laden der Tarife');
    } finally {
      setLoading(false);
    }
  };

  const applyVoucherToTariffs = async (tariffList: PricingResult[]) => {
    try {
      // Apply voucher to each compatible tariff
      const updatedTariffs = await Promise.all(
        tariffList.map(async (tariff) => {
          try {
            const response = await fetch('/api/v1/voucher/apply', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                voucherCode: formData.voucherCode,
                tariff: {
                  id: tariff.tariffId,
                  name: tariff.tariffName,
                  type: tariff.tariffType,
                  preise: {
                    arbeitspreis_brutto: tariff.pricing.workingPrice,
                    arbeitspreis_netto: tariff.pricing.workingPrice / 1.19, // Estimate
                    grundpreis_brutto: tariff.pricing.basePrice,
                    grundpreis_netto: tariff.pricing.basePrice / 1.19, // Estimate
                    einheit_arbeitspreis: tariff.pricing.workingPriceUnit,
                    einheit_grundpreis: tariff.pricing.basePriceUnit
                  },
                  kosten: {
                    arbeitspreis_jahr: tariff.estimatedCosts.energyCosts,
                    grundpreis_jahr: tariff.estimatedCosts.baseCosts,
                    gesamtkosten_jahr: tariff.estimatedCosts.totalAnnualCosts,
                    monatliche_kosten: tariff.estimatedCosts.monthlyCosts
                  }
                }
              })
            });

            if (response.ok) {
              const voucherResult = await response.json();
              if (voucherResult.erfolg) {
                const discountedTariff = voucherResult.daten.discountedTariff;
                return {
                  ...tariff,
                  pricing: {
                    ...tariff.pricing,
                    workingPrice: discountedTariff.preise.arbeitspreis_brutto,
                    basePrice: discountedTariff.preise.grundpreis_brutto,
                  },
                  estimatedCosts: {
                    ...tariff.estimatedCosts,
                    energyCosts: discountedTariff.kosten.arbeitspreis_jahr,
                    baseCosts: discountedTariff.kosten.grundpreis_jahr,
                    totalAnnualCosts: discountedTariff.kosten.gesamtkosten_jahr,
                    monthlyCosts: discountedTariff.kosten.monatliche_kosten,
                  },
                  voucherApplied: {
                    code: formData.voucherCode!,
                    savings: voucherResult.daten.savings,
                    originalPrice: tariff.estimatedCosts.monthlyCosts,
                    discountedPrice: discountedTariff.kosten.monatliche_kosten
                  }
                };
              }
            }
          } catch (voucherError) {
            console.warn(`Voucher not applicable to tariff ${tariff.tariffId}:`, voucherError);
          }
          
          // Return original tariff if voucher couldn't be applied
          return tariff;
        })
      );

      setTariffs(updatedTariffs);
    } catch (error) {
      console.error('Error applying voucher codes:', error);
      // Continue with original tariffs if voucher application fails
    }
  };

  const handleSelectTariff = (tariff: PricingResult) => {
    onSelectTariff(tariff);
    navigate('/customer');
  };

  const getTariffTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'fest':
      case 'fixed':
        return 'primary';
      case 'gruen':
      case 'green':
        return 'success';
      case 'dynamisch':
      case 'dynamic':
        return 'secondary';
      default:
        return 'default';
    }
  };

  const getTariffTypeLabel = (type: string) => {
    switch (type.toLowerCase()) {
      case 'fest':
      case 'fixed':
        return 'Fester Tarif';
      case 'gruen':
      case 'green':
        return 'Grüner Strom';
      case 'dynamisch':
      case 'dynamic':
        return 'Dynamischer Tarif';
      default:
        return type;
    }
  };

  if (!formData) {
    navigate('/');
    return null;
  }

  if (loading) {
    return (
      <Box>
        <Typography variant="h4" component="h1" gutterBottom>
          Berechne deine Preise...
        </Typography>
        <Card>
          <CardContent>
            <LinearProgress />
            <Typography variant="body1" sx={{ mt: 2 }}>
              Wir suchen die besten Tarife für deine PLZ {formData.plz}
            </Typography>
          </CardContent>
        </Card>
      </Box>
    );
  }

  if (error) {
    return (
      <Box>
        <Typography variant="h4" component="h1" gutterBottom>
          Preisberechnung
        </Typography>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button variant="outlined" onClick={() => navigate('/')}>
          Zurück zum Formular
        </Button>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Deine Strompreise
      </Typography>

      {/* Location and Consumption Summary */}
      <Paper sx={{ p: 3, mb: 3, bgcolor: 'background.paper' }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Typography variant="h6" color="primary">
                PLZ {formData.plz}
              </Typography>
              {location && (
                <Typography variant="body2" color="text.secondary" sx={{ ml: 2 }}>
                  {location.district}
                </Typography>
              )}
            </Box>
          </Grid>
          <Grid item xs={12} md={4}>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
              <Typography variant="h4" color="primary" sx={{ fontWeight: 600, mb: 0.5 }}>
                {formData.jahresverbrauch || tariffs[0]?.estimatedCosts?.annualConsumption || 'N/A'}
              </Typography>
              <Typography variant="body1" color="text.secondary">
                kWh/Jahr {formData.jahresverbrauch ? '(eingegeben)' : '(geschätzt)'}
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} md={4}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Typography variant="h6">
                {formData.haushaltsgroesse} {formData.haushaltsgroesse === 1 ? 'Person' : 'Personen'}
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Tariff Options */}
      <Typography variant="h5" component="h2" gutterBottom sx={{ mb: 3 }}>
        Verfügbare Tarife ({tariffs.length})
      </Typography>

      <Grid container spacing={3}>
        {tariffs.map((tariff, index) => (
          <Grid item xs={12} key={tariff.tariffId}>
            <Card 
              sx={{ 
                cursor: 'pointer',
                transition: 'transform 0.2s, box-shadow 0.2s',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: theme => theme.shadows[8],
                },
                position: 'relative',
                overflow: 'visible',
              }}
              onClick={() => handleSelectTariff(tariff)}
            >
              {index === 0 && (
                <Chip
                  label="Empfohlen"
                  color="primary"
                  size="small"
                  sx={{
                    position: 'absolute',
                    top: -10,
                    right: 16,
                    zIndex: 1,
                    fontWeight: 600,
                  }}
                />
              )}
              <CardContent sx={{ p: 3 }}>
                <Grid container spacing={3} alignItems="center">
                  <Grid item xs={12} md={6}>
                    <Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <Typography variant="h6" component="h3" sx={{ mr: 2 }}>
                          {tariff.tariffName}
                        </Typography>
                        <Chip 
                          label={getTariffTypeLabel(tariff.tariffType)}
                          color={getTariffTypeColor(tariff.tariffType)}
                          size="small"
                        />
                      </Box>
                      
                      <Grid container spacing={2} sx={{ mt: 1 }}>
                        <Grid item xs={6}>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <ElectricIcon fontSize="small" color="action" sx={{ mr: 1 }} />
                            <Typography variant="body2" color="text.secondary">
                              {tariff.pricing.workingPrice} {tariff.pricing.workingPriceUnit}
                            </Typography>
                          </Box>
                        </Grid>
                        <Grid item xs={6}>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <EuroIcon fontSize="small" color="action" sx={{ mr: 1 }} />
                            <Typography variant="body2" color="text.secondary">
                              {tariff.pricing.basePrice} {tariff.pricing.basePriceUnit}
                            </Typography>
                          </Box>
                        </Grid>
                        <Grid item xs={6}>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <ScheduleIcon fontSize="small" color="action" sx={{ mr: 1 }} />
                            <Typography variant="body2" color="text.secondary">
                              {tariff.contractDuration} Monate Laufzeit
                            </Typography>
                          </Box>
                        </Grid>
                      </Grid>
                    </Box>
                  </Grid>
                  
                  <Grid item xs={12} md={4}>
                    <Box sx={{ textAlign: 'center' }}>
                      {tariff.voucherApplied && (
                        <Box sx={{ mb: 1 }}>
                          <Typography variant="body2" sx={{ 
                            color: 'text.secondary', 
                            textDecoration: 'line-through' 
                          }}>
                            {tariff.voucherApplied.originalPrice.toFixed(2)}€
                          </Typography>
                        </Box>
                      )}
                      <Typography variant="h4" color="primary" sx={{ 
                        fontWeight: 600,
                        color: tariff.voucherApplied ? 'success.main' : 'primary.main'
                      }}>
                        {tariff.estimatedCosts.monthlyCosts.toFixed(2)}€
                      </Typography>
                      {tariff.voucherApplied && (
                        <Box sx={{ 
                          mt: 0.5, 
                          p: 1, 
                          bgcolor: 'success.light', 
                          borderRadius: 1,
                          display: 'inline-block'
                        }}>
                          <Typography variant="body2" sx={{ 
                            color: 'success.main', 
                            fontWeight: 600,
                            fontSize: '0.75rem'
                          }}>
                            🎟️ {tariff.voucherApplied.code} 
                            (-{(tariff.voucherApplied.originalPrice - tariff.voucherApplied.discountedPrice).toFixed(2)}€)
                          </Typography>
                        </Box>
                      )}
                      <Typography variant="body2" color="text.secondary">
                        pro Monat
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                        {tariff.estimatedCosts.totalAnnualCosts.toFixed(0)}€ pro Jahr
                      </Typography>
                    </Box>
                  </Grid>
                  
                  <Grid item xs={12} md={2}>
                    <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                      <IconButton color="primary">
                        <ChevronRightIcon />
                      </IconButton>
                    </Box>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {tariffs.length === 0 && !loading && (
        <Alert severity="info" sx={{ mt: 2 }}>
          Keine Tarife für Ihre PLZ verfügbar. Bitte versuchen Sie eine andere Postleitzahl.
        </Alert>
      )}

      {/* Additional Information */}
      <Paper sx={{ p: 3, mt: 4, bgcolor: 'background.default' }}>
        <Typography variant="h6" gutterBottom>
          Ihre Eingaben
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={3}>
            <Typography variant="body2" color="text.secondary">Postleitzahl</Typography>
            <Typography variant="body1">{formData.plz}</Typography>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Typography variant="body2" color="text.secondary">Haushaltsgröße</Typography>
            <Typography variant="body1">{formData.haushaltsgroesse} Personen</Typography>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Typography variant="body2" color="text.secondary">Jahresverbrauch</Typography>
            <Typography variant="body1">{formData.jahresverbrauch || 'Geschätzt'} kWh</Typography>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Typography variant="body2" color="text.secondary">Extras</Typography>
            <Box>
              {formData.hatElektrofahrzeug && <Chip label="E-Auto" size="small" sx={{ mr: 0.5, mb: 0.5 }} />}
              {formData.hatSolarPV && <Chip label="Solar PV" size="small" sx={{ mr: 0.5, mb: 0.5 }} />}
              {formData.hatSmartMeter && <Chip label="Smart Meter" size="small" sx={{ mr: 0.5, mb: 0.5 }} />}
            </Box>
          </Grid>
        </Grid>
      </Paper>

      <Button 
        variant="outlined" 
        onClick={() => navigate('/')} 
        sx={{ mt: 3 }}
      >
        Eingaben ändern
      </Button>
    </Box>
  );
};

export default PricingResults;