import React, { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { 
  Container, 
  Box, 
  AppBar, 
  Toolbar, 
  Typography, 
  Button,
  createTheme,
  ThemeProvider,
  CssBaseline
} from '@mui/material';
import { Home as HomeIcon, Phone as PhoneIcon, Email as EmailIcon, LocationOn as LocationIcon } from '@mui/icons-material';
import PricingForm from './components/PricingForm';
import PricingResults from './components/PricingResults';
import CustomerForm from './components/CustomerForm';
import ContractSummary from './components/ContractSummary';
import { testDatabaseConnection } from './services/customerApi';

// Enfinitus NewTech Farbschema - Weiß-Metallisches Blau (Konsistent)
const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#64B5F6', // Metallisches Blau
      dark: '#1976D2',
      light: '#90CAF9',
    },
    secondary: {
      main: '#B0BEC5', // Metallisches Grau-Blau
      dark: '#78909C',
      light: '#CFD8DC',
    },
    background: {
      default: '#FFFFFF', // Dunkler metallischer Hintergrund - einheitlich
      paper: '#37474F', // Dunklere Container
    },
    text: {
      primary: '#FFFFFF',
      secondary: '#B0BEC5',
    },
    success: {
      main: '#4CAF50',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h4: {
      fontWeight: 600,
      color: '#1976D2',
    },
    h5: {
      fontWeight: 500,
      color: '#333',
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          textTransform: 'none',
          fontWeight: 600,
          padding: '12px 24px',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
        },
      },
    },
  },
});

export interface PricingFormData {
  plz: string;
  haushaltsgroesse: number;
  jahresverbrauch?: number;
  hatSmartMeter: boolean;
  moechteSmartMeter: boolean;
  hatSolarPV: boolean;
  moechteSolarPV: boolean;
  hatElektrofahrzeug: boolean;
  hatBatterie: boolean;
  moechteBatterie: boolean;
  voucherCode?: string;
}

export interface PricingResult {
  tariffId: string;
  tariffName: string;
  tariffType: string;
  contractDuration: number;
  pricing: {
    workingPrice: number;
    basePrice: number;
    currency: string;
    workingPriceUnit: string;
    basePriceUnit: string;
  };
  estimatedCosts: {
    annualConsumption: number;
    energyCosts: number;
    baseCosts: number;
    totalAnnualCosts: number;
    monthlyCosts: number;
  };
  savings?: {
    marktpreis_jahr: number;
    enfinitus_jahr: number;
    ersparnis_euro: number;
    ersparnis_prozent: number;
    besser_als_markt: boolean;
  } | null;
  recommended?: boolean;
  voucherApplied?: {
    code: string;
    savings: any;
    originalPrice: number;
    discountedPrice: number;
  };
}

export interface CustomerData {
  id?: string;
  vorname: string;
  nachname: string;
  strasse: string;
  hausnummer: string;
  plz: string;
  ort: string;
  email: string;
  telefon?: string;
}

function App() {
  const [pricingFormData, setPricingFormData] = useState<PricingFormData | null>(null);
  const [selectedTariff, setSelectedTariff] = useState<PricingResult | null>(null);
  const [customerData, setCustomerData] = useState<CustomerData | null>(null);
  const [contractDraft, setContractDraft] = useState<any>(null);

  // Test database connection on app startup
  useEffect(() => {
    const testConnection = async () => {
      console.log('🔗 Testing database connection from frontend...');
      const connected = await testDatabaseConnection();
      if (connected) {
        console.log('✅ Frontend database connection successful');
      } else {
        console.warn('⚠️ Frontend database connection failed');
      }
    };
    
    testConnection();
  }, []);

  const resetForm = () => {
    setPricingFormData(null);
    setSelectedTariff(null);
    setCustomerData(null);
    setContractDraft(null);
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
        {/* Header/Navigation */}
        <AppBar position="static" sx={{ 
          bgcolor: 'background.default', 
          color: 'text.primary',
          boxShadow: '0 2px 10px rgba(0,0,0,0.3)'
        }}>
          <Toolbar sx={{ justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box sx={{ 
                width: 50, 
                height: 50, 
                bgcolor: 'primary.main',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontWeight: 'bold',
                fontSize: '1.2rem'
              }}>
                EN
              </Box>
              <Typography variant="h5" component="div" sx={{ 
                fontWeight: 700,
                color: 'primary.main'
              }}>
                ENFINITUS ENERGIE
              </Typography>
              <Typography variant="subtitle2" sx={{ color: 'text.secondary' }}>
                Energielösungen der Zukunft
              </Typography>
            </Box>
            
            <Box sx={{ display: 'flex', gap: 3, alignItems: 'center' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'text.secondary' }}>
                <PhoneIcon fontSize="small" />
                <Typography variant="body2">+49 176 87 31</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'text.secondary' }}>
                <EmailIcon fontSize="small" />
                <Typography variant="body2">info@enfinitus-newtech.de</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'text.secondary' }}>
                <LocationIcon fontSize="small" />
                <Typography variant="body2">Herzbergstraße 15, 10365 Berlin</Typography>
              </Box>
              <Button 
                variant="contained" 
                color="primary"
                onClick={resetForm}
                startIcon={<HomeIcon />}
                sx={{ ml: 2 }}
              >
                Startseite
              </Button>
            </Box>
          </Toolbar>
        </AppBar>

        {/* Main Content */}
        <Box sx={{ 
          background: 'linear-gradient(135deg, #E3F2FD 0%, #FFF3E0 100%)',
          minHeight: 'calc(100vh - 80px)'
        }}>
          <Container maxWidth="lg" sx={{ py: 4 }}>
            <Routes>
              <Route 
                path="/" 
                element={
                  <PricingForm 
                    onSubmit={(data: PricingFormData) => setPricingFormData(data)} 
                    initialData={pricingFormData}
                  />
                } 
              />
              <Route 
                path="/results" 
                element={
                  <PricingResults 
                    formData={pricingFormData!}
                    onSelectTariff={(tariff: PricingResult) => setSelectedTariff(tariff)}
                  />
                } 
              />
              <Route 
                path="/customer" 
                element={
                  <CustomerForm 
                    selectedTariff={selectedTariff!}
                    pricingFormData={pricingFormData!}
                    onSubmit={(data: CustomerData) => setCustomerData(data)}
                  />
                } 
              />
              <Route 
                path="/contract" 
                element={
                  <ContractSummary 
                    selectedTariff={selectedTariff!}
                    customerData={customerData!}
                    pricingFormData={pricingFormData!}
                    onContractCreated={(draft: any) => setContractDraft(draft)}
                  />
                } 
              />
            </Routes>
          </Container>
        </Box>
      </Box>
    </ThemeProvider>
  );
}

export default App;