import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  Chip,
  Paper,
  LinearProgress,
  Alert,
  Fade,
  Grow,
  Stack,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  ElectricBolt as ElectricIcon,
  Nature as EcoIcon,
  TrendingDown as SavingsIcon,
  Security as SecurityIcon,
  Speed as SpeedIcon,
  CheckCircle as CheckIcon,
  ArrowForward as ArrowIcon,
  LocationOn as LocationIcon,
  Euro as EuroIcon,
  Timeline as TimelineIcon,
  PlayArrow as PlayIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import { PricingFormData } from '../App';

interface LandingPageProps {
  onStartJourney: () => void;
  onQuickPricing: (data: PricingFormData) => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onStartJourney, onQuickPricing }) => {
  const navigate = useNavigate();
  const [animateElements, setAnimateElements] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'loading' | 'connected' | 'error'>('loading');
  const [realtimeStats, setRealtimeStats] = useState({
    activePowerPlants: 147,
    currentGreenPercentage: 73.5,
    customersServed: 24567,
    averageSavings: 127
  });

  useEffect(() => {
    setAnimateElements(true);
    
    // Test backend connectivity
    const checkConnection = async () => {
      try {
        const response = await fetch('/api/v1/health');
        if (response.ok) {
          setConnectionStatus('connected');
        } else {
          setConnectionStatus('error');
        }
      } catch (error) {
        setConnectionStatus('error');
      }
    };

    checkConnection();

    // Simulate real-time updates for demo
    const interval = setInterval(() => {
      setRealtimeStats(prev => ({
        activePowerPlants: prev.activePowerPlants + Math.floor(Math.random() * 3 - 1),
        currentGreenPercentage: Math.max(70, Math.min(80, prev.currentGreenPercentage + (Math.random() * 2 - 1))),
        customersServed: prev.customersServed + Math.floor(Math.random() * 5),
        averageSavings: prev.averageSavings + Math.floor(Math.random() * 6 - 3)
      }));
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const handleQuickStart = () => {
    onStartJourney();
    navigate('/pricing');
  };

  const handleQuickPricing = () => {
    // Quick pricing for Berlin center
    const quickData: PricingFormData = {
      plz: '10115',
      haushaltsgroesse: 2,
      jahresverbrauch: 3500,
      hatSmartMeter: true,
      moechteSmartMeter: true,
      hatSolarPV: false,
      moechteSolarPV: false,
      hatElektrofahrzeug: false,
      hatBatterie: false,
      moechteBatterie: false
    };
    onQuickPricing(quickData);
    navigate('/results');
  };

  const benefits = [
    {
      icon: <SavingsIcon color="primary" />,
      title: '100% Transparent',
      description: 'Keine versteckten Kosten, faire Preisgestaltung'
    },
    {
      icon: <EcoIcon color="primary" />,
      title: '100% Ökostrom',
      description: 'Ausschließlich erneuerbare Energiequellen'
    },
    {
      icon: <SpeedIcon color="primary" />,
      title: 'Smart Technology',
      description: 'Modernste Smart-Meter-Technologie'
    },
    {
      icon: <SecurityIcon color="primary" />,
      title: 'Versorgungssicherheit',
      description: 'Zuverlässige Stromversorgung 24/7'
    }
  ];

  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 4 }}>
        {/* Connection Status Bar */}
        <Fade in={true}>
          <Alert 
            severity={connectionStatus === 'connected' ? 'success' : connectionStatus === 'error' ? 'warning' : 'info'}
            sx={{ mb: 3, borderRadius: 2 }}
            icon={connectionStatus === 'loading' ? <LinearProgress /> : undefined}
          >
            {connectionStatus === 'connected' && '✅ Backend & Supabase verbunden - System bereit'}
            {connectionStatus === 'error' && '⚠️ Backend-Verbindung - Entwicklungsmodus'}
            {connectionStatus === 'loading' && 'Verbinde mit Backend...'}
          </Alert>
        </Fade>

        {/* Hero Section */}
        <Fade in={animateElements} timeout={800}>
          <Box textAlign="center" sx={{ mb: 6 }}>
            <Typography 
              variant="h2" 
              component="h1" 
              gutterBottom
              sx={{ 
                fontWeight: 'bold',
                background: 'linear-gradient(45deg, #1976d2 30%, #42a5f5 90%)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                color: 'transparent',
                mb: 2
              }}
            >
              Intelligent Energy Solutions
            </Typography>
            <Typography 
              variant="h5" 
              color="text.secondary" 
              sx={{ mb: 4, maxWidth: '600px', mx: 'auto' }}
            >
              Revolutioniere deine Energieversorgung mit unserem intelligenten Stromvergleich
              und transparenten Tarifen für Berlin.
            </Typography>
            
            <Stack 
              direction={{ xs: 'column', sm: 'row' }} 
              spacing={2} 
              justifyContent="center" 
              sx={{ mb: 4 }}
            >
              <Button 
                variant="contained" 
                size="large" 
                endIcon={<PlayIcon />}
                onClick={handleQuickStart}
                sx={{ px: 4, py: 1.5, borderRadius: 3 }}
              >
                Jetzt Tarif finden
              </Button>
              <Button 
                variant="outlined" 
                size="large" 
                endIcon={<ArrowIcon />}
                onClick={handleQuickPricing}
                sx={{ px: 4, py: 1.5, borderRadius: 3 }}
              >
                Schnell-Check Berlin
              </Button>
            </Stack>
          </Box>
        </Fade>

        {/* Real-time Stats */}
        <Grow in={animateElements} timeout={1200}>
          <Paper elevation={2} sx={{ p: 3, mb: 6, borderRadius: 3 }}>
            <Typography variant="h6" gutterBottom textAlign="center" color="primary">
              Live-Statistiken
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={6} md={3}>
                <Box textAlign="center">
                  <Typography variant="h4" color="primary" fontWeight="bold">
                    {realtimeStats.activePowerPlants}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Aktive Kraftwerke
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={6} md={3}>
                <Box textAlign="center">
                  <Typography variant="h4" color="success.main" fontWeight="bold">
                    {realtimeStats.currentGreenPercentage.toFixed(1)}%
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Grünstrom-Anteil
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={6} md={3}>
                <Box textAlign="center">
                  <Typography variant="h4" color="secondary.main" fontWeight="bold">
                    {realtimeStats.customersServed.toLocaleString()}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Zufriedene Kunden
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={6} md={3}>
                <Box textAlign="center">
                  <Typography variant="h4" color="warning.main" fontWeight="bold">
                    €{realtimeStats.averageSavings}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Ø Ersparnis/Monat
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </Paper>
        </Grow>

        {/* Benefits Grid */}
        <Box sx={{ mb: 6 }}>
          <Typography variant="h4" textAlign="center" gutterBottom color="primary">
            Warum Enfinitus Energie?
          </Typography>
          <Grid container spacing={3} sx={{ mt: 2 }}>
            {benefits.map((benefit, index) => (
              <Grid item xs={12} sm={6} md={3} key={index}>
                <Grow in={animateElements} timeout={1000 + index * 200}>
                  <Card 
                    elevation={2}
                    sx={{ 
                      height: '100%', 
                      textAlign: 'center', 
                      p: 2,
                      borderRadius: 3,
                      transition: 'transform 0.2s',
                      '&:hover': { transform: 'translateY(-4px)' }
                    }}
                  >
                    <CardContent>
                      <Box sx={{ mb: 2 }}>{benefit.icon}</Box>
                      <Typography variant="h6" gutterBottom>
                        {benefit.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {benefit.description}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grow>
              </Grid>
            ))}
          </Grid>
        </Box>

        {/* Process Steps */}
        <Fade in={animateElements} timeout={1500}>
          <Paper elevation={2} sx={{ p: 4, borderRadius: 3, mb: 6 }}>
            <Typography variant="h5" textAlign="center" gutterBottom color="primary">
              Dein Weg zum optimalen Stromtarif
            </Typography>
            <List>
              <ListItem>
                <ListItemIcon>
                  <Chip label="1" color="primary" />
                </ListItemIcon>
                <ListItemText 
                  primary="Verbrauch ermitteln" 
                  secondary="PLZ eingeben und Haushaltsgröße angeben"
                />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <Chip label="2" color="primary" />
                </ListItemIcon>
                <ListItemText 
                  primary="Tarife vergleichen" 
                  secondary="Transparente Preisübersicht mit Ersparnis-Kalkulation"
                />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <Chip label="3" color="primary" />
                </ListItemIcon>
                <ListItemText 
                  primary="Daten eingeben" 
                  secondary="Persönliche Informationen für Vertragsabschluss"
                />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <Chip label="4" color="primary" />
                </ListItemIcon>
                <ListItemText 
                  primary="Vertrag abschließen" 
                  secondary="Sofortiger Download und E-Mail-Bestätigung"
                />
              </ListItem>
            </List>
            
            <Box textAlign="center" sx={{ mt: 3 }}>
              <Button 
                variant="contained" 
                size="large"
                startIcon={<ElectricIcon />}
                onClick={handleQuickStart}
                sx={{ px: 4, py: 1.5, borderRadius: 3 }}
              >
                Funnel starten
              </Button>
            </Box>
          </Paper>
        </Fade>

        {/* Coverage Area */}
        <Fade in={animateElements} timeout={1800}>
          <Box textAlign="center">
            <Typography variant="h6" gutterBottom color="primary">
              Verfügbare Gebiete
            </Typography>
            <Stack direction="row" spacing={1} justifyContent="center" flexWrap="wrap">
              {[
                'Berlin Mitte', 'Berlin Friedrichshain', 'Berlin Lichtenberg', 
                'Berlin Prenzlauer Berg', 'Berlin Charlottenburg', 'Berlin Neukölln',
                'Berlin Tempelhof'
              ].map((area, index) => (
                <Chip 
                  key={index}
                  label={area} 
                  variant="outlined" 
                  color="primary"
                  icon={<CheckIcon />}
                  sx={{ m: 0.5 }}
                />
              ))}
            </Stack>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
              22 Postleitzahlen verfügbar • Weitere Gebiete folgen
            </Typography>
          </Box>
        </Fade>
      </Box>
    </Container>
  );
};

export default LandingPage;