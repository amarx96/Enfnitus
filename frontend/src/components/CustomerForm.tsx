import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Grid,
  Alert,
  Divider,
  Paper,
  Chip,
} from '@mui/material';
import {
  Person as PersonIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Home as HomeIcon,
} from '@mui/icons-material';
import { PricingFormData, PricingResult, CustomerData } from '../App';
import { submitCustomerData, storePricingData } from '../services/customerApi';
import { supabase } from '../services/supabase';

interface CustomerFormProps {
  selectedTariff: PricingResult;
  pricingFormData: PricingFormData;
  onSubmit: (data: CustomerData) => void;
}

const CustomerForm: React.FC<CustomerFormProps> = ({ 
  selectedTariff, 
  pricingFormData, 
  onSubmit 
}) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<CustomerData & { password?: string; confirmPassword?: string }>({
    vorname: '',
    nachname: '',
    strasse: '',
    hausnummer: '',
    plz: pricingFormData?.plz || '',
    ort: '',
    email: '',
    telefon: '',
    password: '',
    confirmPassword: '',
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [loading, setLoading] = useState(false);

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    // Required fields
    if (!formData.vorname.trim()) {
      newErrors.vorname = 'Vorname ist erforderlich';
    }

    if (!formData.nachname.trim()) {
      newErrors.nachname = 'Nachname ist erforderlich';
    }

    if (!formData.strasse.trim()) {
      newErrors.strasse = 'Straße ist erforderlich';
    }

    if (!formData.hausnummer.trim()) {
      newErrors.hausnummer = 'Hausnummer ist erforderlich';
    }

    if (!formData.plz.trim()) {
      newErrors.plz = 'Postleitzahl ist erforderlich';
    } else if (!/^\d{5}$/.test(formData.plz)) {
      newErrors.plz = 'Postleitzahl muss 5 Ziffern haben';
    }

    if (!formData.ort.trim()) {
      newErrors.ort = 'Ort ist erforderlich';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'E-Mail ist erforderlich';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Ungültige E-Mail-Adresse';
    }

    // Password validation
    if (!formData.password || formData.password.length < 6) {
      newErrors.password = 'Passwort muss mindestens 6 Zeichen haben';
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwörter stimmen nicht überein';
    }

    // Optional phone validation
    if (formData.telefon && !/^[\d\s\+\-\(\)]+$/.test(formData.telefon)) {
      newErrors.telefon = 'Ungültige Telefonnummer';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);
    
    try {
      // Step 1: Create user account in Supabase Auth
      console.log('Creating user account...');
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password!,
        options: {
          data: {
            vorname: formData.vorname,
            nachname: formData.nachname,
            full_name: `${formData.vorname} ${formData.nachname}`
          }
        }
      });

      if (authError) {
        throw new Error(`Account creation failed: ${authError.message}`);
      }

      console.log('User account created successfully:', authData.user?.id);

      // Step 2: Submit customer data to database with auth user ID
      console.log('Submitting customer data to database...');
      const customerDataWithAuth = {
        ...formData,
        id: authData.user?.id, // Link to auth user
        auth_user_id: authData.user?.id
      };
      
      const customerResult = await submitCustomerData(customerDataWithAuth);
      
      if (!customerResult.success) {
        console.warn('Customer data save failed, but user account was created:', customerResult.error);
      }

      // Step 3: Store pricing data if available
      if (pricingFormData && authData.user?.id) {
        console.log('Storing pricing data...');
        const pricingResult = await storePricingData(authData.user.id, {
          plz: pricingFormData.plz,
          verbrauch: pricingFormData.jahresverbrauch || 0,
          haushaltsgroesse: pricingFormData.haushaltsgroesse,
          smartMeter: pricingFormData.hatSmartMeter,
          selectedTariff: selectedTariff,
          estimatedCosts: selectedTariff.estimatedCosts
        });

        if (!pricingResult.success) {
          console.warn('Failed to store pricing data:', pricingResult.error);
        }
      }

      // Call the original onSubmit prop for compatibility
      onSubmit({ ...formData, id: authData.user?.id });

      // Navigate to contract page with all data
      navigate('/contract', {
        state: {
          customerData: { ...formData, id: authData.user?.id },
          pricingData: pricingFormData,
          selectedTariff: selectedTariff,
          authUser: authData.user
        }
      });

    } catch (error: any) {
      console.error('Registration error:', error);
      setErrors({ ...errors, email: error.message || 'Registration failed' });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof (CustomerData & { password: string; confirmPassword: string })) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setFormData({ ...formData, [field]: e.target.value });
    if (errors[field]) {
      setErrors({ ...errors, [field]: '' });
    }
  };

  const handlePlzChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 5);
    setFormData({ ...formData, plz: value });
    if (errors.plz) {
      setErrors({ ...errors, plz: '' });
    }
  };

  if (!selectedTariff || !pricingFormData) {
    navigate('/');
    return null;
  }

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Persönliche Daten
      </Typography>
      
      <Typography variant="body1" color="text.secondary" gutterBottom sx={{ mb: 4 }}>
        Um Ihren Vertragsentwurf zu erstellen, benötigen wir einige persönliche Informationen.
      </Typography>

      {/* Selected Tariff Summary */}
      <Paper sx={{ p: 3, mb: 4, bgcolor: 'background.paper' }}>
        <Typography variant="h6" gutterBottom>
          Ihr gewählter Tarif
        </Typography>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={6}>
            <Typography variant="h6" color="primary">
              {selectedTariff.tariffName}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {selectedTariff.contractDuration} Monate Laufzeit
            </Typography>
          </Grid>
          <Grid item xs={12} md={6}>
            <Box sx={{ textAlign: { xs: 'left', md: 'right' } }}>
              <Typography variant="h5" color="primary">
                {selectedTariff.estimatedCosts.monthlyCosts.toFixed(2)}€
              </Typography>
              <Typography variant="body2" color="text.secondary">
                pro Monat
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      <Card sx={{ maxWidth: 800, mx: 'auto' }}>
        <CardContent sx={{ p: 4 }}>
          <form onSubmit={handleSubmit}>
            <Grid container spacing={3}>
              {/* Personal Information */}
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                  <PersonIcon color="primary" sx={{ mr: 1 }} />
                  <Typography variant="h6">Persönliche Informationen</Typography>
                </Box>
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Vorname *"
                  value={formData.vorname}
                  onChange={handleInputChange('vorname')}
                  error={!!errors.vorname}
                  helperText={errors.vorname}
                  placeholder="Max"
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Nachname *"
                  value={formData.nachname}
                  onChange={handleInputChange('nachname')}
                  error={!!errors.nachname}
                  helperText={errors.nachname}
                  placeholder="Mustermann"
                />
              </Grid>

              <Grid item xs={12}>
                <Divider sx={{ my: 2 }} />
              </Grid>

              {/* Address Information */}
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                  <HomeIcon color="primary" sx={{ mr: 1 }} />
                  <Typography variant="h6">Adresse</Typography>
                </Box>
              </Grid>

              <Grid item xs={12} sm={8}>
                <TextField
                  fullWidth
                  label="Straße *"
                  value={formData.strasse}
                  onChange={handleInputChange('strasse')}
                  error={!!errors.strasse}
                  helperText={errors.strasse}
                  placeholder="Musterstraße"
                />
              </Grid>

              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Hausnummer *"
                  value={formData.hausnummer}
                  onChange={handleInputChange('hausnummer')}
                  error={!!errors.hausnummer}
                  helperText={errors.hausnummer}
                  placeholder="123"
                />
              </Grid>

              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Postleitzahl *"
                  value={formData.plz}
                  onChange={handlePlzChange}
                  error={!!errors.plz}
                  helperText={errors.plz}
                  placeholder="12345"
                  inputProps={{ maxLength: 5 }}
                />
              </Grid>

              <Grid item xs={12} sm={8}>
                <TextField
                  fullWidth
                  label="Ort *"
                  value={formData.ort}
                  onChange={handleInputChange('ort')}
                  error={!!errors.ort}
                  helperText={errors.ort}
                  placeholder="Berlin"
                />
              </Grid>

              <Grid item xs={12}>
                <Divider sx={{ my: 2 }} />
              </Grid>

              {/* Contact Information */}
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                  <EmailIcon color="primary" sx={{ mr: 1 }} />
                  <Typography variant="h6">Kontaktinformationen</Typography>
                </Box>
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="E-Mail *"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange('email')}
                  error={!!errors.email}
                  helperText={errors.email}
                  placeholder="max.mustermann@email.com"
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Telefon (optional)"
                  value={formData.telefon}
                  onChange={handleInputChange('telefon')}
                  error={!!errors.telefon}
                  helperText={errors.telefon}
                  placeholder="+49 30 12345678"
                />
              </Grid>

              <Grid item xs={12}>
                <Divider sx={{ my: 2 }} />
                <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                  <PersonIcon sx={{ mr: 1, color: 'primary.main' }} />
                  Benutzerkonto erstellen
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Erstellen Sie ein Benutzerkonto, um Ihre Energiedaten zu verwalten und Rechnungen einzusehen.
                </Typography>
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Passwort *"
                  type="password"
                  value={formData.password}
                  onChange={handleInputChange('password')}
                  error={!!errors.password}
                  helperText={errors.password || 'Mindestens 6 Zeichen'}
                  placeholder="Sicheres Passwort"
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Passwort bestätigen *"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={handleInputChange('confirmPassword')}
                  error={!!errors.confirmPassword}
                  helperText={errors.confirmPassword}
                  placeholder="Passwort wiederholen"
                />
              </Grid>

              <Grid item xs={12}>
                <Button
                  type="submit"
                  variant="contained"
                  size="large"
                  fullWidth
                  disabled={loading}
                  sx={{
                    py: 2,
                    fontSize: '1.1rem',
                    fontWeight: 600,
                    mt: 3,
                  }}
                >
                  {loading ? 'Konto wird erstellt...' : 'Konto erstellen und fortfahren'}
                </Button>
              </Grid>
            </Grid>
          </form>
        </CardContent>
      </Card>

      <Alert severity="info" sx={{ mt: 3, maxWidth: 800, mx: 'auto' }}>
        <Typography variant="body2">
          Ihre Daten werden sicher übertragen und entsprechend der DSGVO verarbeitet. 
          Nach der Erstellung des Vertragsentwurfs erhalten Sie eine E-Mail mit allen Details.
        </Typography>
      </Alert>
    </Box>
  );
};

export default CustomerForm;