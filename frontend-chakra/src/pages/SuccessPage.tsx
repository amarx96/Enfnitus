import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Heading,
  Text,
  VStack,
  HStack,
  Card,
  CardBody,
  CardHeader,
  Button,
  Badge,
  Divider,
  Alert,
  AlertIcon,
  SimpleGrid,
  Icon,
} from '@chakra-ui/react';
import { CheckIcon } from '@chakra-ui/icons';

const SuccessPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { customerData, selectedTariff, voucher } = location.state || {};

  if (!customerData || !selectedTariff) {
    return (
      <Container maxW="7xl" py={8}>
        <Alert status="error">
          <AlertIcon />
          Keine Vertragsdaten gefunden. Bitte starten Sie den Prozess erneut.
        </Alert>
      </Container>
    );
  }

  return (
    <Box py={{ base: 8, md: 12 }}>
      <Container maxW="4xl" px={{ base: 4, md: 8 }}>
        <VStack spacing={8} w="full">
          {/* Success Header */}
          <VStack spacing={4} textAlign="center">
            <Box
              bg="green.100"
              borderRadius="full"
              p={4}
              mb={4}
            >
              <Icon as={CheckIcon} w={12} h={12} color="green.500" />
            </Box>
            <Heading size="xl" color="green.600">
              Vertrag erfolgreich abgeschlossen!
            </Heading>
            <Text color="gray.600" fontSize="lg" maxW="2xl">
              Herzlichen Glückwunsch! Ihr Stromvertrag wurde erfolgreich erstellt.
              Sie erhalten in Kürze eine Bestätigung per E-Mail.
            </Text>
          </VStack>

          {/* Contract Summary */}
          <Card variant="outline" w="full">
            <CardHeader>
              <Heading size="md">Ihre Vertragsdetails</Heading>
            </CardHeader>
            <CardBody>
              <VStack spacing={4} align="start">
                {/* Customer Info */}
                <VStack spacing={2} align="start" w="full">
                  <Text fontWeight="bold" color="gray.700">
                    Kunde
                  </Text>
                  <Text>{customerData.vorname} {customerData.nachname}</Text>
                  <Text color="gray.600">{customerData.email}</Text>
                  <Text color="gray.600">{customerData.telefon}</Text>
                </VStack>

                <Divider />

                {/* Tariff Info */}
                <VStack spacing={2} align="start" w="full">
                  <Text fontWeight="bold" color="gray.700">
                    Gewählter Tarif
                  </Text>
                  <HStack>
                    <Text fontSize="lg" fontWeight="medium">{selectedTariff.name}</Text>
                    {selectedTariff.green && <Badge colorScheme="green">ÖKO</Badge>}
                  </HStack>
                  
                  {voucher?.isValid && (
                    <Alert status="success" size="sm">
                      <AlertIcon />
                      <Text fontSize="sm">
                        Voucher-Code <strong>{voucher.voucherCode}</strong> erfolgreich angewendet! 
                        Sie sparen {voucher.discounts.value}% auf Ihre monatlichen Kosten.
                      </Text>
                    </Alert>
                  )}
                </VStack>

                <Divider />

                {/* Address */}
                <VStack spacing={2} align="start" w="full">
                  <Text fontWeight="bold" color="gray.700">
                    Lieferadresse
                  </Text>
                  <Text>
                    {customerData.strasse} {customerData.hausnummer}
                  </Text>
                  <Text>
                    {customerData.plz} {customerData.stadt}
                  </Text>
                </VStack>
              </VStack>
            </CardBody>
          </Card>

          {/* Next Steps */}
          <Card variant="outline" w="full">
            <CardHeader>
              <Heading size="md">Nächste Schritte</Heading>
            </CardHeader>
            <CardBody>
              <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6} w="full">
                <VStack spacing={2} textAlign="center">
                  <Text fontSize="2xl">📧</Text>
                  <Text fontWeight="medium">E-Mail Bestätigung</Text>
                  <Text fontSize="sm" color="gray.600">
                    Sie erhalten in den nächsten Minuten eine Bestätigung per E-Mail
                  </Text>
                </VStack>
                <VStack spacing={2} textAlign="center">
                  <Text fontSize="2xl">📋</Text>
                  <Text fontWeight="medium">Vertragsunterlagen</Text>
                  <Text fontSize="sm" color="gray.600">
                    Die vollständigen Vertragsunterlagen erhalten Sie innerhalb von 24 Stunden
                  </Text>
                </VStack>
                <VStack spacing={2} textAlign="center">
                  <Text fontSize="2xl">⚡</Text>
                  <Text fontWeight="medium">Versorgung beginnt</Text>
                  <Text fontSize="sm" color="gray.600">
                    Ihr neuer Stromtarif wird in etwa 14 Tagen aktiviert
                  </Text>
                </VStack>
              </SimpleGrid>
            </CardBody>
          </Card>

          {/* Support Information */}
          <Card variant="outline" w="full">
            <CardBody>
              <VStack spacing={4}>
                <Heading size="md">Fragen oder Probleme?</Heading>
                <Text color="gray.600" textAlign="center">
                  Unser Kundenservice steht Ihnen gerne zur Verfügung:
                </Text>
                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4} w="full">
                  <VStack spacing={2}>
                    <Text fontWeight="medium">Telefon</Text>
                    <Text color="brand.600" fontSize="lg">+49 30 12345678</Text>
                  </VStack>
                  <VStack spacing={2}>
                    <Text fontWeight="medium">E-Mail</Text>
                    <Text color="brand.600">support@evu-backend.de</Text>
                  </VStack>
                </SimpleGrid>
              </VStack>
            </CardBody>
          </Card>

          {/* Action Buttons */}
          <VStack spacing={4} w="full">
            <Button
              colorScheme="brand"
              size="lg"
              w="full"
              maxW="md"
              onClick={() => navigate('/')}
            >
              Zurück zur Startseite
            </Button>
            <Button
              variant="ghost"
              onClick={() => window.print()}
            >
              Vertragsdetails drucken
            </Button>
          </VStack>
        </VStack>
      </Container>
    </Box>
  );
};

export default SuccessPage;