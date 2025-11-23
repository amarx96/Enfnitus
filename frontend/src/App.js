import React, { useState } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { 
  Container, 
  Box, 
  AppBar, 
  Toolbar, 
  Typography, 
  Button,
  createTheme,
  ThemeProvider,
  CssBaseline,
  Paper,
  IconButton,
  Tooltip,
  Switch,
  FormControlLabel
} from '@mui/material';
import { 
  Home as HomeIcon, 
  Phone as PhoneIcon, 
  Email as EmailIcon,
  DesktopWindows as DesktopIcon,
  TabletMac as TabletIcon,
  Smartphone as MobileIcon,
  DarkMode as DarkModeIcon,
  LightMode as LightModeIcon
} from '@mui/icons-material';
import PricingForm from './components/PricingForm';
import PricingResults from './components/PricingResults';
import CustomerForm from './components/CustomerForm';
import ContractSummary from './components/ContractSummary';
import LandingPage from './components/LandingPage';

// Clean White Theme with Material UI Colors
const createAppTheme = (isDarkMode = false) => createTheme({
  palette: {
    mode: isDarkMode ? 'dark' : 'light',
    primary: {
      main: '#1976d2', // Material Blue
      light: '#42a5f5',
      dark: '#1565c0',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#dc004e', // Material Pink
      light: '#ff5983',
      dark: '#9a0036',
      contrastText: '#ffffff',
    },
    background: {
      default: isDarkMode ? '#121212' : '#fafafa',
      paper: isDarkMode ? '#1e1e1e' : '#ffffff',
    },
    text: {
      primary: isDarkMode ? '#ffffff' : '#212121',
      secondary: isDarkMode ? '#aaaaaa' : '#757575',
    },
    success: {
      main: '#4caf50',
      light: '#81c784',
      dark: '#388e3c',
    },
    error: {
      main: '#f44336',
      light: '#e57373',
      dark: '#d32f2f',
    },
    warning: {
      main: '#ff9800',
      light: '#ffb74d',
      dark: '#f57c00',
    },
    info: {
      main: '#2196f3',
      light: '#64b5f6',
      dark: '#1976d2',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h4: {
      fontWeight: 600,
      fontSize: '2rem',
      letterSpacing: '-0.5px',
    },
    h5: {
      fontWeight: 500,
      fontSize: '1.5rem',
    },
    h6: {
      fontWeight: 500,
      fontSize: '1.25rem',
    },
    body1: {
      fontSize: '1rem',
      lineHeight: 1.6,
    },
    body2: {
      fontSize: '0.875rem',
      lineHeight: 1.5,
    },
    button: {
      fontWeight: 600,
      textTransform: 'none',
    },
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          textTransform: 'none',
          fontWeight: 600,
          padding: '10px 24px',
          fontSize: '1rem',
          boxShadow: isDarkMode 
            ? '0 2px 8px rgba(255,255,255,0.1)'
            : '0 2px 8px rgba(0,0,0,0.1)',
          '&:hover': {
            transform: 'translateY(-1px)',
            transition: 'all 0.2s ease-in-out',
            boxShadow: isDarkMode 
              ? '0 4px 12px rgba(255,255,255,0.15)'
              : '0 4px 12px rgba(0,0,0,0.15)',
          },
        },
        contained: {
          boxShadow: '0 3px 10px rgba(25, 118, 210, 0.3)',
          '&:hover': {
            boxShadow: '0 6px 16px rgba(25, 118, 210, 0.4)',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: isDarkMode
            ? '0 4px 20px rgba(255,255,255,0.05)'
            : '0 4px 20px rgba(0,0,0,0.1)',
        },
        elevation1: {
          boxShadow: isDarkMode 
            ? '0 2px 8px rgba(255,255,255,0.05)'
            : '0 2px 8px rgba(0,0,0,0.08)',
        },
        elevation2: {
          boxShadow: isDarkMode 
            ? '0 4px 16px rgba(255,255,255,0.08)'
            : '0 4px 16px rgba(0,0,0,0.12)',
        },
        elevation3: {
          boxShadow: isDarkMode 
            ? '0 6px 24px rgba(255,255,255,0.1)'
            : '0 6px 24px rgba(0,0,0,0.15)',
        },
        elevation4: {
          boxShadow: isDarkMode 
            ? '0 8px 32px rgba(255,255,255,0.12)'
            : '0 8px 32px rgba(0,0,0,0.18)',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          boxShadow: isDarkMode
            ? '0 4px 20px rgba(255,255,255,0.08)'
            : '0 4px 20px rgba(0,0,0,0.12)',
          border: isDarkMode 
            ? '1px solid rgba(255,255,255,0.1)'
            : '1px solid rgba(0,0,0,0.08)',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 8,
            backgroundColor: isDarkMode 
              ? 'rgba(255,255,255,0.05)'
              : 'rgba(0,0,0,0.02)',
            '& fieldset': {
              borderColor: isDarkMode 
                ? 'rgba(255,255,255,0.2)'
                : 'rgba(0,0,0,0.2)',
            },
            '&:hover fieldset': {
              borderColor: isDarkMode 
                ? 'rgba(255,255,255,0.3)'
                : 'rgba(0,0,0,0.3)',
            },
            '&.Mui-focused fieldset': {
              borderColor: '#1976d2',
              borderWidth: 2,
            },
          },
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          boxShadow: isDarkMode
            ? '0 2px 10px rgba(255,255,255,0.1)'
            : '0 2px 10px rgba(0,0,0,0.1)',
          backdropFilter: 'blur(20px)',
          backgroundColor: isDarkMode 
            ? 'rgba(30,30,30,0.95)'
            : 'rgba(255,255,255,0.95)',
        },
      },
    },
  },
});

function App() {
  const navigate = useNavigate();
  const [pricingData, setPricingData] = useState(null);
  const [pricingResults, setPricingResults] = useState(null);
  const [selectedTariff, setSelectedTariff] = useState(null);
  const [customerData, setCustomerData] = useState(null);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [viewMode, setViewMode] = useState('desktop'); // 'desktop', 'tablet', 'mobile'

  const theme = createAppTheme(isDarkMode);

  const handlePricingSubmit = (data) => {
    setPricingData(data);
    navigate('/results');
  };

  const handlePricingResults = (results) => {
    setPricingResults(results);
  };

  const handleTariffSelection = (tariff) => {
    setSelectedTariff(tariff);
    navigate('/customer');
  };

  const handleCustomerSubmit = (data) => {
    setCustomerData(data);
    navigate('/contract');
  };

  const handleQuickPricing = (data) => {
    setPricingData(data);
    navigate('/results');
  };

  const resetFlow = () => {
    setPricingData(null);
    setPricingResults(null);
    setCustomerData(null);
  };

  // Responsive layout configuration based on view mode
  const getLayoutConfig = () => {
    switch (viewMode) {
      case 'mobile':
        return {
          maxWidth: 'sm',
          padding: { xs: 2, sm: 3 },
          paperPadding: 3,
          containerSpacing: 2,
        };
      case 'tablet':
        return {
          maxWidth: 'md',
          padding: { xs: 2, md: 4 },
          paperPadding: 4,
          containerSpacing: 3,
        };
      case 'desktop':
      default:
        return {
          maxWidth: 'lg',
          padding: { xs: 3, md: 6 },
          paperPadding: 6,
          containerSpacing: 4,
        };
    }
  };

  const layoutConfig = getLayoutConfig();

  const getViewModeIcon = () => {
    switch (viewMode) {
      case 'mobile': return <MobileIcon />;
      case 'tablet': return <TabletIcon />;
      case 'desktop': 
      default: return <DesktopIcon />;
    }
  };

  const cycleViewMode = () => {
    const modes = ['desktop', 'tablet', 'mobile'];
    const currentIndex = modes.indexOf(viewMode);
    const nextIndex = (currentIndex + 1) % modes.length;
    setViewMode(modes[nextIndex]);
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ 
        minHeight: '100vh',
        bgcolor: 'background.default',
        transition: 'all 0.3s ease-in-out',
      }}>
        {/* Enhanced Header with Theme and View Mode Controls */}
        <AppBar 
          position="sticky" 
          elevation={2}
          color="transparent"
        >
          <Toolbar>
            <HomeIcon sx={{ mr: 2, color: 'primary.main' }} />
            <Typography 
              variant="h6" 
              component="div" 
              sx={{ 
                flexGrow: 1, 
                fontWeight: 700,
                color: 'text.primary',
              }}
            >
              Enfinitus NewTech
            </Typography>

            {/* View Mode Toggle */}
            <Tooltip title={`Aktuell: ${viewMode.charAt(0).toUpperCase() + viewMode.slice(1)} Ansicht`}>
              <IconButton 
                onClick={cycleViewMode}
                color="primary"
                sx={{ mr: 1 }}
              >
                {getViewModeIcon()}
              </IconButton>
            </Tooltip>

            {/* Dark Mode Toggle */}
            <FormControlLabel
              control={
                <Switch
                  checked={isDarkMode}
                  onChange={(e) => setIsDarkMode(e.target.checked)}
                  color="primary"
                />
              }
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', ml: 1 }}>
                  {isDarkMode ? <DarkModeIcon /> : <LightModeIcon />}
                </Box>
              }
              sx={{ mr: 2 }}
            />

            <Button 
              color="primary" 
              variant="outlined"
              sx={{ 
                borderRadius: 2,
              }}
            >
              Kontakt
            </Button>
          </Toolbar>
        </AppBar>

        {/* Main Content with Responsive Design */}
        <Container 
          maxWidth={layoutConfig.maxWidth}
          sx={{ 
            py: layoutConfig.padding,
            px: { xs: 2, md: 3 },
          }}
        >
          {/* Single Paper Container for all content */}
          <Paper 
            elevation={3}
            sx={{
              p: layoutConfig.paperPadding,
              borderRadius: 3,
              bgcolor: 'background.paper',
              border: theme.palette.mode === 'dark' 
                ? '1px solid rgba(255,255,255,0.1)'
                : '1px solid rgba(0,0,0,0.08)',
            }}
          >
            <Routes>
              <Route 
                path="/" 
                element={
                  <LandingPage 
                    onStartJourney={() => navigate('/pricing')}
                    onQuickPricing={handleQuickPricing}
                  />
                } 
              />
              
              <Route 
                path="/pricing" 
                element={
                  <Box sx={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}>
                    <Box sx={{
                      width: '100%',
                      maxWidth: viewMode === 'mobile' ? '100%' : 
                                viewMode === 'tablet' ? '500px' : '600px',
                      display: 'flex',
                      flexDirection: 'column',
                    }}>
                      <Typography 
                        variant="h4" 
                        align="center" 
                        gutterBottom
                        sx={{
                          mb: 4,
                          color: 'primary.main',
                          fontWeight: 700,
                        }}
                      >
                        Energiepreis Rechner
                      </Typography>
                      
                      <PricingForm onSubmit={handlePricingSubmit} initialData={pricingData} />
                    </Box>
                  </Box>
                } 
              />
              
              <Route 
                path="/results" 
                element={
                  <PricingResults 
                    formData={pricingData} 
                    onSelectTariff={handleTariffSelection}
                  />
                } 
              />
              
              <Route 
                path="/customer" 
                element={
                  <CustomerForm 
                    selectedTariff={selectedTariff}
                    pricingFormData={pricingData}
                    onSubmit={handleCustomerSubmit}
                  />
                } 
              />
              
              <Route 
                path="/contract" 
                element={
                  <ContractSummary 
                    pricingData={pricingData}
                    pricingResults={pricingResults}
                    customerData={customerData}
                    onBack={resetFlow}
                    onComplete={resetFlow}
                  />
                } 
              />
            </Routes>
          </Paper>
        </Container>

        {/* Clean Footer */}
        <Box 
          component="footer" 
          sx={{ 
            mt: 'auto',
            py: 3,
            borderTop: theme.palette.mode === 'dark' 
              ? '1px solid rgba(255,255,255,0.1)'
              : '1px solid rgba(0,0,0,0.1)',
          }}
        >
          <Container maxWidth={layoutConfig.maxWidth}>
            <Box sx={{ 
              display: 'flex', 
              flexDirection: { xs: 'column', md: 'row' },
              justifyContent: 'space-between', 
              alignItems: 'center',
              gap: 2,
            }}>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                © 2024 Enfinitus NewTech. Alle Rechte vorbehalten.
              </Typography>
              
              <Box sx={{ display: 'flex', gap: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <PhoneIcon sx={{ color: 'primary.main', fontSize: '1rem' }} />
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    +49 (0) 123 456 789
                  </Typography>
                </Box>
                
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <EmailIcon sx={{ color: 'primary.main', fontSize: '1rem' }} />
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    info@enfinitus-newtech.de
                  </Typography>
                </Box>
              </Box>
            </Box>
          </Container>
        </Box>
      </Box>
    </ThemeProvider>
  );
}

export default App;