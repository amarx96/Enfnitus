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
  Badge,
  Icon,
  Divider,
  useToast,
  Alert,
  AlertIcon,
} from '@chakra-ui/react';
import { CheckIcon } from '@chakra-ui/icons';

interface PricingFormData {
  jahresverbrauch: number;
  haushaltgroesse: number;
  plz: string;
  hatSmartMeter: boolean;
  moechteSmartMeter: boolean;
  hatSolarPV: boolean;
  moechteSolarPV: boolean;
  hatElektroauto: boolean;
  moechteElektroauto: boolean;
  hatBatterie: boolean;
  moechteBatterie: boolean;
}

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

const OffersPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();
  const [selectedTariff, setSelectedTariff] = useState<string | null>(null);

  // Get data from previous page
  const { tariffs, formData, voucher } = (location.state as {
    tariffs?: Tariff[];
    formData?: PricingFormData;
    voucher?: VoucherData | null;
  }) || {};

  useEffect(() => {
    if (!tariffs || tariffs.length === 0) {
      toast({
        title: 'Keine Tarife gefunden',
        description: 'Bitte kehren Sie zur Tarifberechnung zurück.',
        status: 'warning',
        duration: 3000,
      });
      navigate('/pricing');
    }
  }, [tariffs, navigate, toast]);

  const applyVoucherDiscount = (price: number) => {
    if (!voucher?.isValid) return price;
    
    if (voucher.discounts.type === 'percentage') {
      return price * (1 - voucher.discounts.value / 100);
    } else {
      return price - voucher.discounts.value;
    }
  };

  const handleTariffSelection = (tariff: Tariff) => {
    setSelectedTariff(tariff.id);
    
    // Navigate to contract page with all data
    navigate('/contract', {
      state: {
        selectedTariff: tariff,
        formData,
        voucher,
        originalPrice: tariff.monatlich,
        discountedPrice: applyVoucherDiscount(tariff.monatlich),
      }
    });
  };

  if (!tariffs) {
    return (
      <Container maxW="7xl" py={8}>
        <Alert status="warning">
          <AlertIcon />
          Keine Tarife verfügbar. Bitte kehren Sie zur Tarifberechnung zurück.
        </Alert>
      </Container>
    );
  }

  return (
    <Box py={{ base: 8, md: 12 }}>
      <Container maxW="7xl" px={{ base: 4, md: 8 }}>
        <VStack spacing={8} w="full">
          {/* Header */}
          <VStack spacing={2} textAlign="center">
            <Heading size="xl" color="gray.900">
              Ihre Tarifoptionen
            </Heading>
            <Text color="gray.600" fontSize="lg">
              Basierend auf einem Jahresverbrauch von {(formData?.jahresverbrauch || 3500).toLocaleString()} kWh
            </Text>
            {voucher?.isValid && (
              <Alert status="success" borderRadius="md" maxW="md">
                <AlertIcon />
                <Text fontSize="sm">
                  {voucher.discounts.value}% Rabatt mit Code "{voucher.voucherCode}" wird angewendet!
                </Text>
              </Alert>
            )}
          </VStack>

          {/* Tariff Cards */}
          <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6} w="full">
            {tariffs.map((tariff: Tariff) => {
              const originalPrice = tariff.monatlich || 0;
              const discountedPrice = applyVoucherDiscount(originalPrice) || 0;
              const hasDiscount = voucher?.isValid && originalPrice !== discountedPrice;

              return (
                <Card
                  key={tariff.id}
                  variant="outline"
                  position="relative"
                  borderWidth={tariff.recommended ? 3 : 1}
                  borderColor={tariff.recommended ? 'brand.500' : 'gray.200'}
                  _hover={{ 
                    shadow: 'lg', 
                    borderColor: tariff.recommended ? 'brand.600' : 'brand.300',
                    transform: 'translateY(-2px)',
                    transition: 'all 0.2s'
                  }}
                  bg="white"
                >
                  {tariff.recommended && (
                    <Badge
                      position="absolute"
                      top="-10px"
                      left="50%"
                      transform="translateX(-50%)"
                      bg="brand.500"
                      color="white"
                      px={4}
                      py={1}
                      borderRadius="full"
                      fontSize="xs"
                      fontWeight="bold"
                    >
                      EMPFOHLEN
                    </Badge>
                  )}

                  <CardHeader pb={2}>
                    <VStack spacing={2} align="start">
                      <HStack>
                        <Heading size="md" color="gray.900">
                          {tariff.name.replace('Rabot', 'Enfinitus')}
                        </Heading>
                        {tariff.green && (
                          <Badge colorScheme="green" size="sm">
                            ÖKO
                          </Badge>
                        )}
                        {tariff.dynamicPricing && (
                          <Badge colorScheme="purple" size="sm">
                            DYNAMISCH
                          </Badge>
                        )}
                      </HStack>
                      <Text color="gray.600" fontSize="sm">
                        {tariff.type}
                      </Text>
                    </VStack>
                  </CardHeader>

                  <CardBody pt={0}>
                    <VStack spacing={4} align="start">
                      {/* Price */}
                      <VStack spacing={1} align="center" w="full">
                        <HStack>
                          {hasDiscount && (
                            <Text
                              fontSize="lg"
                              color="gray.400"
                              textDecoration="line-through"
                            >
                              {originalPrice.toFixed(2)} €
                            </Text>
                          )}
                          <Text
                            fontSize="3xl"
                            fontWeight="bold"
                            color={hasDiscount ? 'brand.500' : 'gray.900'}
                          >
                            {discountedPrice.toFixed(2)} €
                          </Text>
                        </HStack>
                        <Text color="gray.600" fontSize="sm">
                          pro Monat
                        </Text>
                      </VStack>

                      <Divider />

                      {/* Price Details */}
                      <SimpleGrid columns={2} spacing={4} w="full" fontSize="sm">
                        <Box>
                          <Text fontWeight="medium" color="gray.700">Grundpreis</Text>
                          <Text color="gray.600">{(tariff.grundpreis || 9.90).toFixed(2)} €/Monat</Text>
                        </Box>
                        <Box>
                          <Text fontWeight="medium" color="gray.700">Arbeitspreis</Text>
                          <Text color="gray.600">{(tariff.arbeitspreis || 30.00).toFixed(4)} ct/kWh</Text>
                        </Box>
                      </SimpleGrid>

                      <Box w="full">
                        <Text fontWeight="medium" color="gray.700" fontSize="sm">Jährliche Kosten:</Text>
                        <Text color="gray.900" fontWeight="semibold">
                          {hasDiscount ? 
                            `${(discountedPrice * 12).toFixed(2)} €/Jahr` : 
                            `${(tariff.jahreskosten || (tariff.monatlich * 12) || 0).toFixed(2)} €/Jahr`
                          }
                        </Text>
                      </Box>

                      <Divider />

                      {/* Features */}
                      <Box w="full">
                        <Text fontWeight="medium" color="gray.700" mb={2} fontSize="sm">
                          Inklusive:
                        </Text>
                        <VStack spacing={1} align="start">
                          {tariff.features.slice(0, 6).map((feature, index) => (
                            <HStack key={index} spacing={2}>
                              <Icon as={CheckIcon} color="green.500" boxSize={3} />
                              <Text fontSize="xs" color="gray.600">
                                {feature}
                              </Text>
                            </HStack>
                          ))}
                        </VStack>
                      </Box>

                      {/* Action Button */}
                      <Button
                        w="full"
                        colorScheme={tariff.recommended ? "brand" : "gray"}
                        variant={tariff.recommended ? "solid" : "outline"}
                        size="lg"
                        onClick={() => handleTariffSelection(tariff)}
                        isLoading={selectedTariff === tariff.id}
                        loadingText="Wird ausgewählt..."
                        _hover={{
                          transform: 'translateY(-1px)',
                          shadow: 'md'
                        }}
                      >
                        {tariff.recommended ? "Jetzt wählen" : "Tarif wählen"}
                      </Button>
                    </VStack>
                  </CardBody>
                </Card>
              );
            })}
          </SimpleGrid>

          {/* Back Button */}
          <Button
            variant="ghost"
            onClick={() => navigate('/pricing')}
            size="lg"
          >
            ← Zurück zur Tarifberechnung
          </Button>
        </VStack>
      </Container>
    </Box>
  );
};

export default OffersPage;