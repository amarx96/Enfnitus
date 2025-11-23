import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Container,
  Heading,
  Text,
  VStack,
  HStack,
  SimpleGrid,
  Card,
  CardBody,
  CardHeader,
  Button,
  Input,
  FormControl,
  FormLabel,
  FormErrorMessage,
  Textarea,
  Checkbox,
  Badge,
  Alert,
  AlertIcon,
  useToast,
  Divider,
} from '@chakra-ui/react';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api/v1';

interface CustomerData {
  // Personal Information
  vorname: string;
  nachname: string;
  email: string;
  telefon: string;
  geburtsdatum: string;
  
  // Address Information
  strasse: string;
  hausnummer: string;
  plz: string;
  stadt: string;
  bezirk?: string;
  
  // Account Information
  passwort: string;
  passwortBestaetigung: string;

  // Payment Information
  iban: string;
  kontoinhaber: string;
  sepaMandat: boolean;
  
  // Agreements
  agbAkzeptiert: boolean;
  datenschutzAkzeptiert: boolean;
  marketingEinverstaendnis: boolean;
  newsletterEinverstaendnis: boolean;
  
  // Additional
  notizen?: string;
}

interface ErrorData {
  vorname?: string;
  nachname?: string;
  email?: string;
  telefon?: string;
  strasse?: string;
  hausnummer?: string;
  plz?: string;
  stadt?: string;
  passwort?: string;
  passwortBestaetigung?: string;
  iban?: string;
  kontoinhaber?: string;
  sepaMandat?: string;
  agbAkzeptiert?: string; // Error messages are strings
  datenschutzAkzeptiert?: string; // Error messages are strings
}

const ContractPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();
  
  // Get data from previous pages
  const { selectedTariff, formData, voucher, originalPrice, discountedPrice } = location.state || {};
  
  const [customerData, setCustomerData] = useState<CustomerData>({
    vorname: '',
    nachname: '',
    email: '',
    telefon: '',
    geburtsdatum: '',
    strasse: '',
    hausnummer: '',
    plz: formData?.plz || '',
    stadt: '',
    bezirk: '',
    passwort: '',
    passwortBestaetigung: '',
    iban: '',
    kontoinhaber: '',
    sepaMandat: false,
    agbAkzeptiert: false,
    datenschutzAkzeptiert: false,
    marketingEinverstaendnis: false,
    newsletterEinverstaendnis: false,
    notizen: '',
  });
  
  const [errors, setErrors] = useState<ErrorData>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!selectedTariff) {
      toast({
        title: 'Kein Tarif ausgewählt',
        description: 'Bitte wählen Sie zuerst einen Tarif aus.',
        status: 'warning',
        duration: 3000,
      });
      navigate('/pricing');
    }
  }, [selectedTariff, navigate, toast]);

  const validateForm = (): boolean => {
    const newErrors: ErrorData = {};
    
    // Required fields validation
    if (!customerData.vorname.trim()) newErrors.vorname = 'Vorname ist erforderlich';
    if (!customerData.nachname.trim()) newErrors.nachname = 'Nachname ist erforderlich';
    if (!customerData.email.trim()) newErrors.email = 'E-Mail ist erforderlich';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerData.email)) {
      newErrors.email = 'Ungültige E-Mail-Adresse';
    }
    if (!customerData.telefon.trim()) newErrors.telefon = 'Telefon ist erforderlich';
    if (!customerData.strasse.trim()) newErrors.strasse = 'Straße ist erforderlich';
    if (!customerData.hausnummer.trim()) newErrors.hausnummer = 'Hausnummer ist erforderlich';
    if (!customerData.plz.trim()) newErrors.plz = 'PLZ ist erforderlich';
    else if (!/^\d{5}$/.test(customerData.plz)) {
      newErrors.plz = 'PLZ muss 5-stellig sein';
    }
    if (!customerData.stadt.trim()) newErrors.stadt = 'Stadt ist erforderlich';
    
    // Password validation
    if (!customerData.passwort) newErrors.passwort = 'Passwort ist erforderlich';
    else if (customerData.passwort.length < 8) {
      newErrors.passwort = 'Passwort muss mindestens 8 Zeichen haben';
    }
    if (customerData.passwort !== customerData.passwortBestaetigung) {
      newErrors.passwortBestaetigung = 'Passwörter stimmen nicht überein';
    }

    // Payment validation
    if (!customerData.iban.trim()) newErrors.iban = 'IBAN ist erforderlich';
    else if (!/^DE\d{20}$/.test(customerData.iban.replace(/\s/g, ''))) {
       // Simple DE check, can be relaxed if needed
       // Keeping it simple for now
    }
    if (!customerData.kontoinhaber.trim()) newErrors.kontoinhaber = 'Kontoinhaber ist erforderlich';
    if (!customerData.sepaMandat) newErrors.sepaMandat = 'SEPA-Mandat muss erteilt werden';
    
    // Required checkboxes
    if (!customerData.agbAkzeptiert) newErrors.agbAkzeptiert = 'AGB müssen akzeptiert werden';
    if (!customerData.datenschutzAkzeptiert) newErrors.datenschutzAkzeptiert = 'Datenschutz muss akzeptiert werden';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof CustomerData, value: string | boolean) => {
    setCustomerData(prev => ({
      ...prev,
      [field]: value,
    }));
    
    // Clear error when user starts typing
    if (errors[field as keyof ErrorData]) {
      setErrors(prev => ({
        ...prev,
        [field]: undefined,
      }));
    }
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      toast({
        title: 'Bitte korrigieren Sie die Eingabefehler',
        status: 'error',
        duration: 3000,
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Prepare contract import payload
      const importPayload = {
        funnelId: 'enfinitus-website',
        customer: {
          firstName: customerData.vorname,
          lastName: customerData.nachname,
          email: customerData.email,
          phone: customerData.telefon,
          birthDate: customerData.geburtsdatum || null,
          street: customerData.strasse,
          houseNumber: customerData.hausnummer,
          zipCode: customerData.plz,
          city: customerData.stadt,
          district: customerData.bezirk || null,
          termsAccepted: customerData.agbAkzeptiert,
          privacyAccepted: customerData.datenschutzAkzeptiert,
          marketingConsent: customerData.marketingEinverstaendnis,
          newsletterConsent: customerData.newsletterEinverstaendnis,
          notes: customerData.notizen || null,
        },
        contract: {
          campaignKey: selectedTariff.id.toUpperCase(), // Assuming ID maps to campaign key like FIX12_BERLIN_2024
          tariffId: selectedTariff.id,
          estimatedConsumption: formData?.jahresverbrauch || 2500,
          desiredStartDate: new Date().toISOString().split('T')[0], // Default to today/ASAP
          iban: customerData.iban,
          sepaMandate: customerData.sepaMandat,
          voucherCode: voucher?.voucherCode || null
        },
        meterLocation: {
          maloId: '', // Would be collected if known
          hasOwnMsb: formData?.hatSmartMeter || false,
          meterNumber: '', // Would be collected
          previousProviderId: '', 
          previousConsumption: formData?.jahresverbrauch || 2500
        }
      };

      // Import contract via Contracting Service
      const response = await axios.post(API_URL + '/contracting/import', importPayload);
      
      if (response.data.success) {
        toast({
          title: 'Vertrag erfolgreich eingereicht!',
          description: `Ihre Vertrags-ID: ${response.data.contractId}. Wir bearbeiten Ihre Anfrage.`,
          status: 'success',
          duration: 5000,
        });
        
        // Navigate to success page
        navigate('/success', {
          state: {
            customerData: {
              ...customerData,
              customerId: response.data.draftId, // Using draft ID as temporary ref
            },
            selectedTariff,
            voucher,
            contractId: response.data.contractId
          }
        });
        
      } else {
        throw new Error(response.data.message || 'Registrierung fehlgeschlagen');
      }
      
    } catch (error: any) {
      console.error('Registration error:', error);
      toast({
        title: 'Registrierung fehlgeschlagen',
        description: error.response?.data?.message || error.message || 'Ein unbekannter Fehler ist aufgetreten',
        status: 'error',
        duration: 5000,
      });
    }
    
    setIsSubmitting(false);
  };

  if (!selectedTariff) {
    return (
      <Container maxW="7xl" py={8}>
        <Alert status="warning">
          <AlertIcon />
          Kein Tarif ausgewählt. Bitte kehren Sie zur Tarifauswahl zurück.
        </Alert>
      </Container>
    );
  }

  return (
    <Box py={{ base: 8, md: 12 }}>
      <Container maxW="6xl" px={{ base: 4, md: 8 }}>
        <VStack spacing={8} w="full">
          {/* Header */}
          <VStack spacing={2} textAlign="center">
            <Heading size="xl" color="gray.900">
              Vertragsabschluss
            </Heading>
            <Text color="gray.600" fontSize="lg">
              Nur noch wenige Schritte zu Ihrem neuen Stromvertrag
            </Text>
          </VStack>

          <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={8} w="full">
            {/* Left Column - Customer Form */}
            <Card variant="outline">
              <CardHeader>
                <Heading size="md">Ihre Daten</Heading>
              </CardHeader>
              <CardBody>
                <VStack spacing={4}>
                  {/* Personal Information */}
                  <Text fontWeight="bold" color="gray.700" alignSelf="start">
                    Persönliche Angaben
                  </Text>
                  
                  <SimpleGrid columns={2} spacing={4} w="full">
                    <FormControl isInvalid={!!errors.vorname}>
                      <FormLabel>Vorname *</FormLabel>
                      <Input
                        value={customerData.vorname}
                        onChange={(e) => handleInputChange('vorname', e.target.value)}
                        placeholder="Max"
                      />
                      <FormErrorMessage>{errors.vorname}</FormErrorMessage>
                    </FormControl>
                    
                    <FormControl isInvalid={!!errors.nachname}>
                      <FormLabel>Nachname *</FormLabel>
                      <Input
                        value={customerData.nachname}
                        onChange={(e) => handleInputChange('nachname', e.target.value)}
                        placeholder="Mustermann"
                      />
                      <FormErrorMessage>{errors.nachname}</FormErrorMessage>
                    </FormControl>
                  </SimpleGrid>
                  
                  <FormControl isInvalid={!!errors.email}>
                    <FormLabel>E-Mail *</FormLabel>
                    <Input
                      type="email"
                      value={customerData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      placeholder="max.mustermann@example.com"
                    />
                    <FormErrorMessage>{errors.email}</FormErrorMessage>
                  </FormControl>
                  
                  <SimpleGrid columns={2} spacing={4} w="full">
                    <FormControl isInvalid={!!errors.telefon}>
                      <FormLabel>Telefon *</FormLabel>
                      <Input
                        type="tel"
                        value={customerData.telefon}
                        onChange={(e) => handleInputChange('telefon', e.target.value)}
                        placeholder="+49 30 12345678"
                      />
                      <FormErrorMessage>{errors.telefon}</FormErrorMessage>
                    </FormControl>
                    
                    <FormControl>
                      <FormLabel>Geburtsdatum</FormLabel>
                      <Input
                        type="date"
                        value={customerData.geburtsdatum}
                        onChange={(e) => handleInputChange('geburtsdatum', e.target.value)}
                      />
                    </FormControl>
                  </SimpleGrid>

                  <Divider />

                  {/* Address Information */}
                  <Text fontWeight="bold" color="gray.700" alignSelf="start">
                    Adresse
                  </Text>
                  
                  <SimpleGrid columns={3} spacing={4} w="full">
                    <FormControl gridColumn="span 2" isInvalid={!!errors.strasse}>
                      <FormLabel>Straße *</FormLabel>
                      <Input
                        value={customerData.strasse}
                        onChange={(e) => handleInputChange('strasse', e.target.value)}
                        placeholder="Musterstraße"
                      />
                      <FormErrorMessage>{errors.strasse}</FormErrorMessage>
                    </FormControl>
                    
                    <FormControl isInvalid={!!errors.hausnummer}>
                      <FormLabel>Hausnummer *</FormLabel>
                      <Input
                        value={customerData.hausnummer}
                        onChange={(e) => handleInputChange('hausnummer', e.target.value)}
                        placeholder="123"
                      />
                      <FormErrorMessage>{errors.hausnummer}</FormErrorMessage>
                    </FormControl>
                  </SimpleGrid>
                  
                  <SimpleGrid columns={3} spacing={4} w="full">
                    <FormControl isInvalid={!!errors.plz}>
                      <FormLabel>PLZ *</FormLabel>
                      <Input
                        value={customerData.plz}
                        onChange={(e) => handleInputChange('plz', e.target.value)}
                        placeholder="10115"
                      />
                      <FormErrorMessage>{errors.plz}</FormErrorMessage>
                    </FormControl>
                    
                    <FormControl gridColumn="span 2" isInvalid={!!errors.stadt}>
                      <FormLabel>Stadt *</FormLabel>
                      <Input
                        value={customerData.stadt}
                        onChange={(e) => handleInputChange('stadt', e.target.value)}
                        placeholder="Berlin"
                      />
                      <FormErrorMessage>{errors.stadt}</FormErrorMessage>
                    </FormControl>
                  </SimpleGrid>

                  <Divider />

                  {/* Payment Information */}
                  <Text fontWeight="bold" color="gray.700" alignSelf="start">
                    Zahlungsdaten (SEPA)
                  </Text>
                  
                  <FormControl isInvalid={!!errors.kontoinhaber}>
                    <FormLabel>Kontoinhaber *</FormLabel>
                    <Input
                      value={customerData.kontoinhaber}
                      onChange={(e) => handleInputChange('kontoinhaber', e.target.value)}
                      placeholder="Max Mustermann"
                    />
                    <FormErrorMessage>{errors.kontoinhaber}</FormErrorMessage>
                  </FormControl>

                  <FormControl isInvalid={!!errors.iban}>
                    <FormLabel>IBAN *</FormLabel>
                    <Input
                      value={customerData.iban}
                      onChange={(e) => handleInputChange('iban', e.target.value)}
                      placeholder="DE12 3456 7890 1234 5678 90"
                    />
                    <FormErrorMessage>{errors.iban}</FormErrorMessage>
                  </FormControl>

                  <FormControl isInvalid={!!errors.sepaMandat}>
                    <Checkbox
                      isChecked={customerData.sepaMandat}
                      onChange={(e) => handleInputChange('sepaMandat', e.target.checked)}
                    >
                      <Text fontSize="sm">
                        Ich ermächtige Enfinitus Energie, Zahlungen von meinem Konto mittels Lastschrift einzuziehen. Zugleich weise ich mein Kreditinstitut an, die von Enfinitus Energie auf mein Konto gezogenen Lastschriften einzulösen.
                      </Text>
                    </Checkbox>
                    <FormErrorMessage>{errors.sepaMandat}</FormErrorMessage>
                  </FormControl>

                  <Divider />

                  {/* Account Information */}
                  <Text fontWeight="bold" color="gray.700" alignSelf="start">
                    Zugangsdaten
                  </Text>
                  
                  <SimpleGrid columns={2} spacing={4} w="full">
                    <FormControl isInvalid={!!errors.passwort}>
                      <FormLabel>Passwort *</FormLabel>
                      <Input
                        type="password"
                        value={customerData.passwort}
                        onChange={(e) => handleInputChange('passwort', e.target.value)}
                        placeholder="Mindestens 8 Zeichen"
                      />
                      <FormErrorMessage>{errors.passwort}</FormErrorMessage>
                    </FormControl>
                    
                    <FormControl isInvalid={!!errors.passwortBestaetigung}>
                      <FormLabel>Passwort bestätigen *</FormLabel>
                      <Input
                        type="password"
                        value={customerData.passwortBestaetigung}
                        onChange={(e) => handleInputChange('passwortBestaetigung', e.target.value)}
                        placeholder="Passwort wiederholen"
                      />
                      <FormErrorMessage>{errors.passwortBestaetigung}</FormErrorMessage>
                    </FormControl>
                  </SimpleGrid>

                  {/* Additional Notes */}
                  <FormControl>
                    <FormLabel>Anmerkungen (optional)</FormLabel>
                    <Textarea
                      value={customerData.notizen}
                      onChange={(e) => handleInputChange('notizen', e.target.value)}
                      placeholder="Besondere Wünsche oder Anmerkungen..."
                      rows={3}
                    />
                  </FormControl>
                </VStack>
              </CardBody>
            </Card>

            {/* Right Column - Order Summary & Terms */}
            <VStack spacing={6}>
              {/* Order Summary */}
              <Card variant="outline" w="full">
                <CardHeader>
                  <Heading size="md">Ihre Bestellung</Heading>
                </CardHeader>
                <CardBody>
                  <VStack spacing={4} align="start">
                    <HStack justify="space-between" w="full">
                      <Text fontWeight="bold">{selectedTariff.name.replace('Rabot', 'Enfinitus')}</Text>
                      {selectedTariff.green && <Badge colorScheme="green">ÖKO</Badge>}
                    </HStack>
                    
                    <VStack spacing={2} align="start" w="full" fontSize="sm">
                      <HStack justify="space-between" w="full">
                        <Text>Jahresverbrauch:</Text>
                        <Text>{formData.jahresverbrauch} kWh</Text>
                      </HStack>
                      <HStack justify="space-between" w="full">
                        <Text>Haushaltsgröße:</Text>
                        <Text>{formData.haushaltgroesse} Personen</Text>
                      </HStack>
                      {voucher?.isValid && (
                        <HStack justify="space-between" w="full">
                          <Text>Voucher-Code:</Text>
                          <Text color="green.600" fontWeight="medium">{voucher.voucherCode}</Text>
                        </HStack>
                      )}
                    </VStack>
                    
                    <Divider />
                    
                    <VStack spacing={2} align="start" w="full">
                      {voucher?.isValid && (
                        <HStack justify="space-between" w="full">
                          <Text fontSize="sm" color="gray.600">Ursprünglich:</Text>
                          <Text fontSize="sm" color="gray.600" textDecoration="line-through">
                            {originalPrice.toFixed(2)} €/Monat
                          </Text>
                        </HStack>
                      )}
                      <HStack justify="space-between" w="full">
                        <Text fontWeight="bold">Monatlich:</Text>
                        <Text fontWeight="bold" color={voucher?.isValid ? 'green.600' : 'gray.900'}>
                          {discountedPrice.toFixed(2)} €
                        </Text>
                      </HStack>
                      <HStack justify="space-between" w="full">
                        <Text>Jährlich:</Text>
                        <Text>{(discountedPrice * 12).toFixed(2)} €</Text>
                      </HStack>
                    </VStack>
                  </VStack>
                </CardBody>
              </Card>

              {/* Terms and Conditions */}
              <Card variant="outline" w="full">
                <CardHeader>
                  <Heading size="md">Zustimmung</Heading>
                </CardHeader>
                <CardBody>
                  <VStack spacing={4} align="start">
                    <FormControl isInvalid={!!errors.agbAkzeptiert}>
                      <Checkbox
                        isChecked={customerData.agbAkzeptiert}
                        onChange={(e) => handleInputChange('agbAkzeptiert', e.target.checked)}
                      >
                        <Text fontSize="sm">
                          Ich akzeptiere die{' '}
                          <Text as="span" color="brand.600" textDecoration="underline" cursor="pointer">
                            Allgemeinen Geschäftsbedingungen
                          </Text>{' '}*
                        </Text>
                      </Checkbox>
                      <FormErrorMessage>{errors.agbAkzeptiert}</FormErrorMessage>
                    </FormControl>
                    
                    <FormControl isInvalid={!!errors.datenschutzAkzeptiert}>
                      <Checkbox
                        isChecked={customerData.datenschutzAkzeptiert}
                        onChange={(e) => handleInputChange('datenschutzAkzeptiert', e.target.checked)}
                      >
                        <Text fontSize="sm">
                          Ich akzeptiere die{' '}
                          <Text as="span" color="brand.600" textDecoration="underline" cursor="pointer">
                            Datenschutzerklärung
                          </Text>{' '}*
                        </Text>
                      </Checkbox>
                      <FormErrorMessage>{errors.datenschutzAkzeptiert}</FormErrorMessage>
                    </FormControl>
                    
                    <Checkbox
                      isChecked={customerData.marketingEinverstaendnis}
                      onChange={(e) => handleInputChange('marketingEinverstaendnis', e.target.checked)}
                    >
                      <Text fontSize="sm">
                        Ich möchte Informationen über neue Angebote erhalten
                      </Text>
                    </Checkbox>
                    
                    <Checkbox
                      isChecked={customerData.newsletterEinverstaendnis}
                      onChange={(e) => handleInputChange('newsletterEinverstaendnis', e.target.checked)}
                    >
                      <Text fontSize="sm">
                        Ich möchte den Newsletter abonnieren
                      </Text>
                    </Checkbox>
                  </VStack>
                </CardBody>
              </Card>

              {/* Submit Button */}
              <Button
                w="full"
                colorScheme="brand"
                size="lg"
                onClick={handleSubmit}
                isLoading={isSubmitting}
                loadingText="Vertrag wird erstellt..."
              >
                Vertrag abschließen
              </Button>
              
              <Button
                w="full"
                variant="ghost"
                onClick={() => navigate(-1)}
              >
                ← Zurück
              </Button>
            </VStack>
          </SimpleGrid>
        </VStack>
      </Container>
    </Box>
  );
};

export default ContractPage;
