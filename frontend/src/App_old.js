import React, { useState } from 'react';
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
  CssBaseline,
  Paper
} from '@mui/material';
import { 
  Home as HomeIcon, 
  Phone as PhoneIcon, 
  Email as EmailIcon
} from '@mui/icons-material';
import PricingForm from './components/PricingForm';
import PricingResults from './components/PricingResults';
import CustomerForm from './components/CustomerForm';
import ContractSummary from './components/ContractSummary';

// Enhanced Enfinitus NewTech Theme with Paper elevation support
const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#64B5F6', // Metallisches Blau
      dark: '#1976D2',
      light: '#90CAF9',
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: '#B0BEC5', // Metallisches Grau-Blau
      dark: '#78909C',
      light: '#CFD8DC',
      contrastText: '#FFFFFF',
    },
    background: {
      default: '#263238', // Dunkler metallischer Hintergrund - einheitlich
      paper: '#37474F', // Dunklere Container für Papers
    },
    text: {
      primary: '#FFFFFF',
      secondary: '#B0BEC5',
    },
    success: {
      main: '#4CAF50',
    },
    error: {
      main: '#f44336',
    },
    warning: {
      main: '#ff9800',
    },
    info: {
      main: '#2196f3',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h4: {
      fontWeight: 600,
      color: '#64B5F6',
      fontSize: '1.8rem',
    },
    h5: {
      fontWeight: 500,
      color: '#B0BEC5',
      fontSize: '1.4rem',
    },
    h6: {
      fontWeight: 500,
      color: '#FFFFFF',
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
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          textTransform: 'none',
          fontWeight: 600,
          padding: '12px 32px',
          fontSize: '1rem',
          boxShadow: '0 4px 12px rgba(100, 181, 246, 0.3)',
          '&:hover': {
            boxShadow: '0 6px 16px rgba(100, 181, 246, 0.4)',
            transform: 'translateY(-2px)',
  const handlePricingSubmit = (data) => {
    setPricingData(data);
  };

  const handlePricingResults = (results) => {
    setPricingResults(results);
  };

  const handleCustomerSubmit = (data) => {
    setCustomerData(data);
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
        background: 'linear-gradient(135deg, #263238 0%, #37474F 50%, #455A64 100%)',
        position: 'relative',
        '&::before': {
          content: '""',
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'radial-gradient(circle at 25% 25%, rgba(100, 181, 246, 0.1) 0%, transparent 70%)',
          pointerEvents: 'none',
          zIndex: -1,
        }
      }}>
        {/* Enhanced Header with Elevation */}
        <AppBar 
          position="sticky" 
          elevation={4}
          sx={{ 
            background: 'linear-gradient(90deg, #37474F 0%, #455A64 100%)',
            backdropFilter: 'blur(20px)',
            borderBottom: '1px solid rgba(100, 181, 246, 0.1)',
          }}
        >
          <Toolbar>
            <HomeIcon sx={{ mr: 2, color: '#64B5F6' }} />
            <Typography 
              variant="h6" 
              component="div" 
              sx={{ 
                flexGrow: 1, 
                fontWeight: 700,
                background: 'linear-gradient(45deg, #64B5F6, #90CAF9)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              Enfinitus NewTech
            </Typography>
            <Button 
              color="primary" 
              variant="outlined"
              sx={{ 
                borderRadius: 8,
                borderColor: 'rgba(100, 181, 246, 0.5)',
                '&:hover': {
                  borderColor: '#64B5F6',
                  backgroundColor: 'rgba(100, 181, 246, 0.1)',
                },
              }}
            >
              Kontakt
            </Button>
          </Toolbar>
        </AppBar>

        {/* Main Content with Enhanced Paper Design */}
        <Container 
          maxWidth="lg" 
          sx={{ 
            py: { xs: 3, md: 6 },
            px: { xs: 2, md: 3 },
          }}
        >
          <Routes>
            <Route 
              path="/" 
              element={
                <Paper 
                  elevation={3}
                  sx={{
                    p: { xs: 3, md: 6 },
                    borderRadius: 3,
                    background: 'linear-gradient(135deg, #37474F 0%, #455A64 100%)',
                    border: '1px solid rgba(100, 181, 246, 0.2)',
                  }}
                >
                  {/* Single Centered Pricing Form */}
                  <Box sx={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}>
                    <Box sx={{
                      width: '100%',
                      maxWidth: { xs: '100%', md: '600px' },
                      display: 'flex',
                      flexDirection: 'column',
                    }}>
                      <Paper 
                        elevation={4}
                        sx={{
                          p: 4,
                          background: 'linear-gradient(135deg, #37474F 0%, #455A64 100%)',
                          border: '2px solid rgba(100, 181, 246, 0.2)',
                          position: 'relative',
                          overflow: 'hidden',
                          '&::before': {
                            content: '""',
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            height: '4px',
                            background: 'linear-gradient(90deg, #64B5F6, #90CAF9)',
                          }
                        }}
                      >
                        <PricingForm onSubmit={handlePricingSubmit} initialData={pricingData} />
                      </Paper>
                    </Box>
                  </Box>
                </Paper>
              } 
            />
            
            <Route 
              path="/results" 
              element={
                <Paper elevation={3} sx={{ p: 4, borderRadius: 3 }}>
                  <PricingResults 
                    pricingData={pricingData} 
                    onContinue={handlePricingResults}
                    onBack={resetFlow}
                  />
                </Paper>
              } 
            />
            
            <Route 
              path="/customer" 
              element={
                <Paper elevation={3} sx={{ p: 4, borderRadius: 3 }}>
                  <CustomerForm 
                    onSubmit={handleCustomerSubmit}
                    onBack={resetFlow}
                    initialData={customerData}
                  />
                </Paper>
              } 
            />
            
            <Route 
              path="/contract" 
              element={
                <Paper elevation={3} sx={{ p: 4, borderRadius: 3 }}>
                  <ContractSummary 
                    pricingData={pricingData}
                    pricingResults={pricingResults}
                    customerData={customerData}
                    onBack={resetFlow}
                    onComplete={resetFlow}
                  />
                </Paper>
              } 
            />
          </Routes>
        </Container>

        {/* Enhanced Footer */}
        <Paper 
          elevation={2}
          component="footer" 
          sx={{ 
            mt: 'auto',
            py: 4,
            background: 'linear-gradient(90deg, #37474F 0%, #455A64 100%)',
            borderTop: '1px solid rgba(100, 181, 246, 0.1)',
            borderRadius: 0,
          }}
        >
          <Container maxWidth="lg">
            <Box sx={{ 
              display: 'flex', 
              flexDirection: { xs: 'column', md: 'row' },
              justifyContent: 'space-between', 
              alignItems: 'center',
              gap: 2,
            }}>
              <Typography variant="body2" sx={{ color: '#B0BEC5' }}>
                © 2024 Enfinitus NewTech. Alle Rechte vorbehalten.
              </Typography>
              
              <Box sx={{ display: 'flex', gap: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <PhoneIcon sx={{ color: '#64B5F6', fontSize: '1rem' }} />
                  <Typography variant="body2" sx={{ color: '#B0BEC5' }}>
                    +49 (0) 123 456 789
                  </Typography>
                </Box>
                
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <EmailIcon sx={{ color: '#64B5F6', fontSize: '1rem' }} />
                  <Typography variant="body2" sx={{ color: '#B0BEC5' }}>
                    info@enfinitus-newtech.de
                  </Typography>
                </Box>
              </Box>
            </Box>
          </Container>
        </Paper>
      </Box>
    </ThemeProvider>
  );
}

export default App;