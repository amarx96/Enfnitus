import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Heading,
  Text,
  VStack,
  SimpleGrid,
  Card,
  CardBody,
  CardHeader,
  Button,
  Input,
  FormControl,
  FormLabel,
  InputGroup,
  InputRightElement,
  Select,
  Slider,
  SliderTrack,
  SliderFilledTrack,
  SliderThumb,
  SliderMark,
  Alert,
  AlertIcon,
  Spinner,
  useToast,
} from '@chakra-ui/react';
import { CheckIcon } from '@chakra-ui/icons';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api/v1';

interface Tariff {
  id: string;
  name: string;
  type: string;
  grundpreis: number;
  arbeitspreis: number;
  jahreskosten: number;
  monatlich: number;
  ersparnis?: number;
  features: string[];
  recommended?: boolean;
  green?: boolean;
  smartMeterCompatible?: boolean;
  solarOptimized?: boolean;
  dynamicPricing?: boolean;
}

interface VoucherData {
  voucherCode: string;
  isValid: boolean;
  discounts: {
    type: string;
    value: number;
  };
}

const PricingPage: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    plz: '10115',
    jahresverbrauch: 3500,
    haushaltgroesse: 2,
    hatSmartMeter: false,
    moechteSmartMeter: false,
    hatSolarPV: false,
    moechteSolarPV: false,
    hatElektroauto: false,
    moechteElektroauto: false,
    hatBatterie: false,
    moechteBatterie: false,
  });
  const [voucherCode, setVoucherCode] = useState('');
  const [voucher, setVoucher] = useState<VoucherData | null>(null);
  const [tariffs, setTariffs] = useState<Tariff[]>([]);
  const [loading, setLoading] = useState(false);
  const [voucherLoading, setVoucherLoading] = useState(false);
  const toast = useToast();

  const calculateTariffs = useCallback(async () => {
    console.log('calculateTariffs called'); // Debug
    setLoading(true);
    try {
      // Dynamischer Verbrauch basierend auf Eingaben - inline calculation
      const baseConsumption = 1500 + (formData.haushaltgroesse - 1) * 1000;
      let calculatedConsumption = baseConsumption;
      if (formData.hatElektroauto) calculatedConsumption += 3000;
      if (formData.hatSolarPV && formData.hatBatterie) calculatedConsumption += 500;
      
      const requestData = {
        ...formData,
        jahresverbrauch: formData.jahresverbrauch || calculatedConsumption,
        funnelId: 'enfinitus-website'
      };
      
      console.log('Request data:', requestData); // Debug

      const response = await axios.post(API_URL + '/pricing/berechnen', requestData);
      console.log('Response received:', response.data); // Debug
      if (response.data.erfolg) {
        const data = response.data.daten;
        console.log('Data structure:', data); // Debug
        const allTariffs = [...data.tarife, ...data.alternative_tarife];
        console.log('All tariffs combined:', allTariffs); // Debug
        
        const calculatedTariffs = allTariffs.map((tariff: any, index: number) => {
          const features = ['24/7 Online-Service', 'Keine Mindestlaufzeit', 'Preisgarantie 12 Monate'];
          
          // Erweiterte Features basierend auf Tarif-Typ und Benutzereingaben
          if (tariff.name.toLowerCase().includes('grün') || tariff.name.toLowerCase().includes('öko')) {
            features.push('100% Ökostrom', 'CO2-neutral');
          }
          
          if (tariff.name.toLowerCase().includes('dynamisch') || tariff.name.toLowerCase().includes('flex')) {
            features.push('Dynamische Preise', 'Börsenpreis-gekoppelt');
          }

          // Haupttarif mit vollem Kosten-Objekt
          const isMainTariff = data.tarife.includes(tariff);
          
          return {
            id: tariff.id || `tariff-${index}`,
            name: tariff.name,
            type: tariff.type || 'Standard',
            grundpreis: isMainTariff ? tariff.preise?.grundpreis_brutto : 9.9,
            arbeitspreis: isMainTariff ? tariff.preise?.arbeitspreis_brutto : 30.0,
            jahreskosten: isMainTariff ? tariff.kosten?.gesamtkosten_jahr : tariff.jahreskosten,
            monatlich: isMainTariff ? tariff.kosten?.monatliche_kosten : tariff.monatliche_kosten,
            ersparnis: isMainTariff ? tariff.ersparnis?.ersparnis_prozent : 0,
            features,
            recommended: tariff.empfohlen || false,
            green: tariff.name.toLowerCase().includes('grün') || tariff.name.toLowerCase().includes('öko'),
            smartMeterCompatible: formData.hatSmartMeter || formData.moechteSmartMeter,
            solarOptimized: formData.hatSolarPV || formData.moechteSolarPV,
            dynamicPricing: tariff.name.toLowerCase().includes('dynamisch') || tariff.name.toLowerCase().includes('flex'),
          };
        });
        console.log('Calculated tariffs:', calculatedTariffs); // Debug
        setTariffs(calculatedTariffs);
        console.log('Tariffs state should be updated'); // Debug
      } else {
        console.log('API response not successful:', response.data); // Debug
        toast({
          title: 'Fehler bei der Tarifberechnung',
          description: response.data.nachricht || 'Unbekannter Fehler',
          status: 'error',
          duration: 3000,
        });
      }
    } catch (error) {
      console.error('Error in calculateTariffs:', error); // Debug
      toast({
        title: 'Fehler bei der Tarifberechnung',
        description: 'Bitte versuchen Sie es später erneut.',
        status: 'error',
        duration: 3000,
      });
    }
    setLoading(false);
  }, [formData, toast]);

  const handleCalculateAndNavigate = useCallback(async () => {
    setLoading(true);
    try {
      // Calculate tariffs directly and get results
      const baseConsumption = 1500 + (formData.haushaltgroesse - 1) * 1000;
      let calculatedConsumption = baseConsumption;
      
      const requestData = {
        ...formData,
        jahresverbrauch: formData.jahresverbrauch || calculatedConsumption,
        funnelId: 'enfinitus-website'
      };

      const response = await axios.post(API_URL + '/pricing/berechnen', requestData);
      
      if (response.data.erfolg) {
        const data = response.data.daten;
        const allTariffs = [...data.tarife, ...data.alternative_tarife];
        
        // Transform tariffs to match frontend format
        const transformedTariffs = allTariffs.map((tariff, index) => {
          const features = ['24/7 Online-Service', 'Keine Mindestlaufzeit', 'Preisgarantie 12 Monate'];
          
          if (formData.hatSmartMeter || formData.moechteSmartMeter) {
            features.push('Smart Meter optimiert');
          }
          
          if (tariff.name.toLowerCase().includes('dynamisch') || tariff.name.toLowerCase().includes('flex')) {
            features.push('Dynamische Preise', 'Börsenpreis-gekoppelt');
          }

          const isMainTariff = data.tarife.includes(tariff);
          
          return {
            id: tariff.id || `tariff-${index}`,
            name: tariff.name,
            type: tariff.type || 'Standard',
            grundpreis: isMainTariff ? tariff.preise?.grundpreis_brutto : 9.9,
            arbeitspreis: isMainTariff ? tariff.preise?.arbeitspreis_brutto : 30.0,
            jahreskosten: isMainTariff ? tariff.kosten?.gesamtkosten_jahr : tariff.jahreskosten,
            monatlich: isMainTariff ? tariff.kosten?.monatliche_kosten : tariff.monatliche_kosten,
            ersparnis: isMainTariff ? tariff.ersparnis?.ersparnis_prozent : 0,
            features,
            recommended: tariff.empfohlen || false,
            green: tariff.name.toLowerCase().includes('grün') || tariff.name.toLowerCase().includes('öko'),
            smartMeterCompatible: formData.hatSmartMeter || formData.moechteSmartMeter,
            solarOptimized: formData.hatSolarPV || formData.moechteSolarPV,
            dynamicPricing: tariff.name.toLowerCase().includes('dynamisch') || tariff.name.toLowerCase().includes('flex'),
          };
        });

        // Navigate directly with calculated tariffs
        navigate('/offers', {
          state: {
            tariffs: transformedTariffs,
            formData,
            voucher,
          }
        });
      } else {
        throw new Error(response.data.nachricht || 'Berechnung fehlgeschlagen');
      }
    } catch (error) {
      console.error('Calculation error:', error);
      toast({
        title: 'Berechnung fehlgeschlagen',
        description: 'Bitte versuchen Sie es erneut.',
        status: 'error',
        duration: 3000,
      });
    } finally {
      setLoading(false);
    }
  }, [formData, voucher, navigate, toast]);

  const validateVoucher = useCallback(async () => {
    if (!voucherCode.trim()) {
      setVoucher(null);
      return;
    }

    setVoucherLoading(true);
    try {
      const response = await axios.post(API_URL + '/voucher/validate', {
        voucherCode: voucherCode.toUpperCase(),
        tariffId: 'standard-10115',
      });
      
      if (response.data.erfolg) {
        setVoucher(response.data.daten);
        toast({
          title: 'Voucher-Code gültig!',
          description: `${response.data.daten.discounts.value}% Rabatt wird angewendet.`,
          status: 'success',
          duration: 3000,
        });
      } else {
        setVoucher(null);
        toast({
          title: 'Voucher-Code ungültig',
          description: response.data.nachricht || 'Der eingegebene Code ist nicht gültig.',
          status: 'error',
          duration: 3000,
        });
      }
    } catch (error) {
      setVoucher(null);
      toast({
        title: 'Voucher-Validierung fehlgeschlagen',
        description: 'Bitte versuchen Sie es später erneut.',
        status: 'error',
        duration: 3000,
      });
    }
    setVoucherLoading(false);
  }, [voucherCode, toast]);

  useEffect(() => {
    calculateTariffs();
  }, [calculateTariffs]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (voucherCode) {
        validateVoucher();
      } else {
        setVoucher(null);
      }
    }, 1000);

    return () => clearTimeout(timeoutId);
  }, [voucherCode, validateVoucher]);

  const handleInputChange = (field: string, value: string | number | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  return (
    <Box py={{ base: 8, md: 12 }}>
      <Container maxW="7xl" px={{ base: 4, md: 8 }}>
        <VStack spacing={12}>
          {/* Header */}
          <VStack spacing={4} textAlign="center">
            <Heading fontSize={{ base: '3xl', md: '4xl' }} color="gray.900">
              Ihre persönlichen Tarife
            </Heading>
            <Text fontSize="lg" color="gray.600" maxW="2xl">
              Geben Sie Ihre Daten ein und finden Sie den perfekten Stromtarif für Ihr Zuhause.
            </Text>
          </VStack>

          {/* Calculation Form */}
          <Card w="full" maxW="2xl" variant="outline">
            <CardHeader>
              <Heading size="md" color="gray.900">
                Tarifberechnung
              </Heading>
            </CardHeader>
            <CardBody>
              <VStack spacing={6}>
                <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4} w="full">
                  <FormControl>
                    <FormLabel color="gray.700">Postleitzahl</FormLabel>
                    <Input
                      value={formData.plz}
                      onChange={(e) => handleInputChange('plz', e.target.value)}
                      placeholder="z.B. 10115"
                      maxLength={5}
                    />
                  </FormControl>

                  <FormControl>
                    <FormLabel color="gray.700">Haushaltsgröße</FormLabel>
                    <Select
                      value={formData.haushaltgroesse}
                      onChange={(e: React.ChangeEvent<HTMLSelectElement>) => handleInputChange('haushaltgroesse', parseInt(e.target.value))}
                    >
                      <option value={1}>1 Person</option>
                      <option value={2}>2 Personen</option>
                      <option value={3}>3 Personen</option>
                      <option value={4}>4 Personen</option>
                      <option value={5}>5+ Personen</option>
                    </Select>
                  </FormControl>

                  <FormControl>
                    <FormLabel color="gray.700">Geschätzter Verbrauch</FormLabel>
                    <Text fontSize="lg" fontWeight="semibold" color="brand.500">
                      {(() => {
                        const baseConsumption = 1500 + (formData.haushaltgroesse - 1) * 1000;
                        let consumption = baseConsumption;
                        if (formData.hatElektroauto) consumption += 3000;
                        if (formData.hatSolarPV && formData.hatBatterie) consumption += 500;
                        return consumption;
                      })()} kWh/Jahr
                    </Text>
                    <Text fontSize="xs" color="gray.500">
                      Basierend auf Haushaltsgröße
                    </Text>
                  </FormControl>
                </SimpleGrid>

                <FormControl>
                  <FormLabel color="gray.700">Jahresverbrauch (kWh)</FormLabel>
                  <VStack spacing={4}>
                    <InputGroup>
                      <Input
                        type="number"
                        value={formData.jahresverbrauch || ''}
                        onChange={(e) => handleInputChange('jahresverbrauch', parseInt(e.target.value) || 0)}
                        placeholder="z.B. 3500"
                      />
                      <InputRightElement>
                        <Text fontSize="sm" color="gray.500">kWh</Text>
                      </InputRightElement>
                    </InputGroup>
                    
                    <Box w="full" px={2}>
                      <Text fontSize="sm" color="gray.600" mb={2}>
                        Oder wählen Sie basierend auf Ihrer Haushaltsgröße:
                      </Text>
                      <Slider
                        value={formData.jahresverbrauch}
                        min={1000}
                        max={8000}
                        step={250}
                        onChange={(value) => handleInputChange('jahresverbrauch', value)}
                      >
                        <SliderMark value={1500} mt="2" ml="-2.5" fontSize="sm" color="gray.500">
                          1.5k
                        </SliderMark>
                        <SliderMark value={3500} mt="2" ml="-2.5" fontSize="sm" color="gray.500">
                          3.5k
                        </SliderMark>
                        <SliderMark value={6000} mt="2" ml="-2.5" fontSize="sm" color="gray.500">
                          6k
                        </SliderMark>
                        <SliderTrack>
                          <SliderFilledTrack bg="brand.500" />
                        </SliderTrack>
                        <SliderThumb bg="brand.500" />
                      </Slider>
                    </Box>

                    <SimpleGrid columns={2} spacing={3} w="full" fontSize="sm">
                      <Text color="gray.600">1-2 Personen: ~2.500 kWh</Text>
                      <Text color="gray.600">3-4 Personen: ~3.500 kWh</Text>
                      <Text color="gray.600">5+ Personen: ~5.000 kWh</Text>
                      <Text color="gray.600">Mit Wärmepumpe: +2.000 kWh</Text>
                    </SimpleGrid>
                  </VStack>
                </FormControl>

                {/* Voucher Code */}
                <FormControl>
                  <FormLabel color="gray.700">Voucher-Code (optional)</FormLabel>
                  <InputGroup>
                    <Input
                      value={voucherCode}
                      onChange={(e) => setVoucherCode(e.target.value)}
                      placeholder="z.B. WELCOME2025"
                      textTransform="uppercase"
                    />
                    <InputRightElement>
                      {voucherLoading && <Spinner size="sm" color="brand.500" />}
                      {voucher?.isValid && <CheckIcon color="green.500" />}
                    </InputRightElement>
                  </InputGroup>
                  {voucher?.isValid && (
                    <Alert status="success" mt={2} borderRadius="md">
                      <AlertIcon />
                      <Text fontSize="sm">
                        {voucher.discounts.value}% Rabatt wird angewendet!
                      </Text>
                    </Alert>
                  )}
                </FormControl>

                <Button
                  colorScheme="green"
                  size="lg"
                  w="full"
                  onClick={handleCalculateAndNavigate}
                  isLoading={loading}
                  loadingText="Berechne..."
                >
                  Tarife berechnen
                </Button>
                
                {/* Debug Info */}
                {process.env.NODE_ENV === 'development' && (
                  <Text fontSize="xs" color="gray.500">
                    Debug: {tariffs.length} tariffs loaded
                  </Text>
                )}
              </VStack>
            </CardBody>
          </Card>


        </VStack>
      </Container>
    </Box>
  );
};

export default PricingPage;
