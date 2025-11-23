import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  Alert,
  Divider,
  Paper,
  Chip,
  LinearProgress,
} from '@mui/material';
import {
  CheckCircle as CheckIcon,
  Description as DocumentIcon,
  Email as EmailIcon,
  Download as DownloadIcon,
} from '@mui/icons-material';
import { PricingFormData, PricingResult, CustomerData } from '../App';

interface ContractSummaryProps {
  selectedTariff: PricingResult;
  customerData: CustomerData;
  pricingFormData: PricingFormData;
  onContractCreated: (draft: any) => void;
}

const ContractSummary: React.FC<ContractSummaryProps> = ({
  selectedTariff,
  customerData,
  pricingFormData,
  onContractCreated,
}) => {
  const navigate = useNavigate();
  const [contractDraft, setContractDraft] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    createContractDraft();
  }, []);

  const createContractDraft = async () => {
    try {
      setLoading(true);
      setError(null);

      // First, register the customer
      const customerResponse = await fetch('/api/v1/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          vorname: customerData.vorname,
          nachname: customerData.nachname,
          email: customerData.email,
          telefon: customerData.telefon,
          adresse: {
            strasse: customerData.strasse,
            hausnummer: customerData.hausnummer,
            plz: customerData.plz,
            ort: customerData.ort,
          },
          // Generate a temporary password - in real app, this would be handled differently
          passwort: Math.random().toString(36).slice(-8),
        }),
      });

      let authToken: string;
      let customerId: string;

      if (customerResponse.ok) {
        const customerData = await customerResponse.json();
        authToken = customerData.daten.token;
        customerId = customerData.daten.kunde.kunden_id;
      } else if (customerResponse.status === 409) {
        // Customer already exists, try to login
        const loginResponse = await fetch('/api/v1/auth/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: customerData.email,
            passwort: 'temp', // This would need proper handling in production
          }),
        });

        if (!loginResponse.ok) {
          throw new Error('Kunde existiert bereits. Bitte kontaktieren Sie den Support.');
        }

        const loginData = await loginResponse.json();
        authToken = loginData.daten.token;
        customerId = loginData.daten.kunde.kunden_id;
      } else {
        throw new Error('Fehler bei der Kundenregistrierung');
      }

      // Create contract draft
      const contractResponse = await fetch('/api/v1/vertraege/entwuerfe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          kampagnen_id: selectedTariff.tariffId, // Using tariffId as campaign ID for simplicity
          tarif_id: selectedTariff.tariffId,
          geschaetzter_jahresverbrauch: pricingFormData.jahresverbrauch,
          vertragsbeginn: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days from now
          zusaetzliche_bedingungen: {
            smartMeter: pricingFormData.moechteSmartMeter,
            solarPV: pricingFormData.moechteSolarPV,
            elektrofahrzeug: pricingFormData.hatElektrofahrzeug,
            haushaltsgröße: pricingFormData.haushaltsgroesse,
          },
          notizen: `Kunde interessiert sich für: ${[
            pricingFormData.moechteSmartMeter && 'Smart Meter',
            pricingFormData.moechteSolarPV && 'Solar PV',
            pricingFormData.hatElektrofahrzeug && 'E-Fahrzeug Tarif',
          ].filter(Boolean).join(', ') || 'Standard Tarif'}`,
        }),
      });

      if (!contractResponse.ok) {
        const errorData = await contractResponse.json();
        throw new Error(errorData.message || 'Fehler bei der Vertragserstellung');
      }

      const contractData = await contractResponse.json();
      setContractDraft(contractData.data);
      onContractCreated(contractData.data);
      setSuccess(true);

    } catch (err) {
      console.error('Contract creation error:', err);
      setError(err instanceof Error ? err.message : 'Fehler bei der Vertragserstellung');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadContract = () => {
    // In a real application, this would generate and download a PDF
    const contractText = generateContractText();
    const blob = new Blob([contractText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Vertragsentwurf_${customerData.nachname}_${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const generateContractText = () => {
    return `
VERTRAGSENTWURF - ENFINITUS ENERGIE

Kunde: ${customerData.vorname} ${customerData.nachname}
E-Mail: ${customerData.email}
Telefon: ${customerData.telefon || 'Nicht angegeben'}

Adresse:
${customerData.strasse} ${customerData.hausnummer}
${customerData.plz} ${customerData.ort}

TARIF DETAILS:
Tarif: ${selectedTariff.tariffName}
Typ: ${selectedTariff.tariffType}
Vertragslaufzeit: ${selectedTariff.contractDuration} Monate
Arbeitspreis: ${selectedTariff.pricing.workingPrice} ${selectedTariff.pricing.workingPriceUnit}
Grundpreis: ${selectedTariff.pricing.basePrice} ${selectedTariff.pricing.basePriceUnit}

VERBRAUCH:
Geschätzter Jahresverbrauch: ${pricingFormData.jahresverbrauch} kWh
Haushaltsgröße: ${pricingFormData.haushaltsgroesse} Personen

GESCHÄTZTE KOSTEN:
Energiekosten pro Jahr: ${selectedTariff.estimatedCosts.energyCosts.toFixed(2)}€
Grundkosten pro Jahr: ${selectedTariff.estimatedCosts.baseCosts.toFixed(2)}€
Gesamtkosten pro Jahr: ${selectedTariff.estimatedCosts.totalAnnualCosts.toFixed(2)}€
Monatliche Kosten: ${selectedTariff.estimatedCosts.monthlyCosts.toFixed(2)}€

ZUSÄTZLICHE OPTIONEN:
${pricingFormData.moechteSmartMeter ? '✓ Smart Meter gewünscht' : ''}
${pricingFormData.moechteSolarPV ? '✓ Solar PV gewünscht' : ''}
${pricingFormData.hatElektrofahrzeug ? '✓ Elektrofahrzeug vorhanden' : ''}

Erstellt am: ${new Date().toLocaleString('de-DE')}
    `.trim();
  };

  if (!selectedTariff || !customerData || !pricingFormData) {
    navigate('/');
    return null;
  }

  if (loading) {
    return (
      <Box>
        <Typography variant="h4" component="h1" gutterBottom>
          Vertragsentwurf wird erstellt...
        </Typography>
        <Card>
          <CardContent>
            <LinearProgress />
            <Typography variant="body1" sx={{ mt: 2 }}>
              Wir erstellen Ihren Vertragsentwurf und senden alle Details an Ihre E-Mail-Adresse.
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
          Vertragserstellung
        </Typography>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button variant="outlined" onClick={() => navigate('/customer')}>
          Zurück zu den persönlichen Daten
        </Button>
      </Box>
    );
  }

  return (
    <Box>
      {success && (
        <Alert 
          severity="success" 
          sx={{ mb: 4 }}
          icon={<CheckIcon />}
        >
          <Typography variant="h6" gutterBottom>
            Vertragsentwurf erfolgreich erstellt!
          </Typography>
          <Typography variant="body2">
            Wir haben alle Details an {customerData.email} gesendet.
          </Typography>
        </Alert>
      )}

      <Typography variant="h4" component="h1" gutterBottom>
        Ihr Vertragsentwurf
      </Typography>

      {/* Contract Summary */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Typography variant="h6" gutterBottom color="primary">
              {selectedTariff.tariffName}
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              {selectedTariff.contractDuration} Monate Vertragslaufzeit
            </Typography>
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" color="text.secondary">Arbeitspreis:</Typography>
              <Typography variant="body1">{selectedTariff.pricing.workingPrice} {selectedTariff.pricing.workingPriceUnit}</Typography>
            </Box>
            <Box sx={{ mt: 1 }}>
              <Typography variant="body2" color="text.secondary">Grundpreis:</Typography>
              <Typography variant="body1">{selectedTariff.pricing.basePrice} {selectedTariff.pricing.basePriceUnit}</Typography>
            </Box>
          </Grid>
          <Grid item xs={12} md={6}>
            <Box sx={{ textAlign: { xs: 'left', md: 'right' } }}>
              <Typography variant="h4" color="primary" sx={{ fontWeight: 600 }}>
                {selectedTariff.estimatedCosts.monthlyCosts.toFixed(2)}€
              </Typography>
              <Typography variant="body1" color="text.secondary">
                pro Monat
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                {selectedTariff.estimatedCosts.totalAnnualCosts.toFixed(0)}€ pro Jahr
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Customer Information */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Kundeninformationen
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <Typography variant="body2" color="text.secondary">Name:</Typography>
              <Typography variant="body1">{customerData.vorname} {customerData.nachname}</Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="body2" color="text.secondary">E-Mail:</Typography>
              <Typography variant="body1">{customerData.email}</Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="body2" color="text.secondary">Telefon:</Typography>
              <Typography variant="body1">{customerData.telefon || 'Nicht angegeben'}</Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="body2" color="text.secondary">Adresse:</Typography>
              <Typography variant="body1">
                {customerData.strasse} {customerData.hausnummer}, {customerData.plz} {customerData.ort}
              </Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Contract Details */}
      {contractDraft && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Vertragsdetails
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">Entwurfs-ID:</Typography>
                <Typography variant="body1" sx={{ fontFamily: 'monospace' }}>
                  {contractDraft.draftId}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">Status:</Typography>
                <Chip label={contractDraft.status || 'Entwurf'} size="small" color="info" />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">Geschätzter Verbrauch:</Typography>
                <Typography variant="body1">{pricingFormData.jahresverbrauch} kWh/Jahr</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">Haushaltsgröße:</Typography>
                <Typography variant="body1">{pricingFormData.haushaltsgroesse} Personen</Typography>
              </Grid>
            </Grid>

            {/* Additional Options */}
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Zusätzliche Optionen:
              </Typography>
              <Box>
                {pricingFormData.moechteSmartMeter && (
                  <Chip label="Smart Meter gewünscht" size="small" sx={{ mr: 1, mb: 1 }} />
                )}
                {pricingFormData.moechteSolarPV && (
                  <Chip label="Solar PV gewünscht" size="small" sx={{ mr: 1, mb: 1 }} />
                )}
                {pricingFormData.hatElektrofahrzeug && (
                  <Chip label="Elektrofahrzeug" size="small" sx={{ mr: 1, mb: 1 }} />
                )}
                {!pricingFormData.moechteSmartMeter && 
                 !pricingFormData.moechteSolarPV && 
                 !pricingFormData.hatElektrofahrzeug && (
                  <Typography variant="body2" color="text.secondary">
                    Keine zusätzlichen Optionen gewählt
                  </Typography>
                )}
              </Box>
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        <Button
          variant="contained"
          startIcon={<DownloadIcon />}
          onClick={handleDownloadContract}
          sx={{ minWidth: 200 }}
        >
          Vertrag herunterladen
        </Button>
        
        <Button
          variant="outlined"
          startIcon={<DocumentIcon />}
          disabled
          sx={{ minWidth: 200 }}
        >
          Per E-Mail gesendet
        </Button>
        
        <Button
          variant="text"
          onClick={() => navigate('/')}
        >
          Neuen Vertrag erstellen
        </Button>
      </Box>

      {/* Next Steps */}
      <Alert severity="info" sx={{ mt: 4 }}>
        <Typography variant="h6" gutterBottom>
          Nächste Schritte
        </Typography>
        <Typography variant="body2" component="div">
          <ol style={{ paddingLeft: '20px' }}>
            <li>Sie erhalten eine Bestätigung per E-Mail mit allen Vertragsdetails</li>
            <li>Unser Team wird Sie innerhalb von 2 Werktagen kontaktieren</li>
            <li>Nach Ihrer Bestätigung wird der Vertrag finalisiert und der Wechselprozess eingeleitet</li>
            <li>Der Wechsel zu Enfinitus Energie erfolgt automatisch ohne Unterbrechung Ihrer Stromversorgung</li>
          </ol>
        </Typography>
      </Alert>
    </Box>
  );
};

export default ContractSummary;