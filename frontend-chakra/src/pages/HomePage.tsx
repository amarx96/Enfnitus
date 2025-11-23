import React from 'react';
import {
  Box,
  Container,
  Heading,
  Text,
  Button,
  VStack,
  HStack,
  SimpleGrid,
  Icon,
  Flex,
  Card,
  CardBody,
  Badge,
  useColorModeValue,
} from '@chakra-ui/react';
import { Link as RouterLink } from 'react-router-dom';
import { CheckIcon, StarIcon, WarningIcon, Icon as ChakraIcon } from '@chakra-ui/icons';

// Custom Lightning Icon
const LightningIcon = (props: any) => (
  <ChakraIcon viewBox="0 0 24 24" {...props}>
    <path
      fill="currentColor"
      d="M13 2L3 14h7l-1 8 10-12h-7l1-8z"
    />
  </ChakraIcon>
);

// Custom Speed Icon for fast switching
const SpeedIcon = (props: any) => (
  <ChakraIcon viewBox="0 0 24 24" {...props}>
    <path
      fill="currentColor"
      d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"
    />
  </ChakraIcon>
);

const HomePage: React.FC = () => {
  const features = [
    {
      icon: CheckIcon,
      title: 'Transparente Preise',
      description: 'Keine versteckten Kosten, faire und transparente Tarife für alle.',
    },
    {
      icon: StarIcon,
      title: '100% Ökostrom',
      description: 'Nachhaltiger Strom aus erneuerbaren Energiequellen.',
    },
    {
      icon: SpeedIcon,
      title: 'Schneller Wechsel',
      description: 'Einfacher Online-Wechsel in nur wenigen Minuten.',
    },
  ];

  return (
    <Box>
      {/* Hero Section */}
      <Box bg="linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)" py={{ base: 16, md: 24 }}>
        <Container maxW="7xl" px={{ base: 4, md: 8 }}>
          <Flex
            direction={{ base: 'column', lg: 'row' }}
            align="center"
            justify="space-between"
            gap={12}
          >
            <VStack align="start" spacing={8} flex="1" maxW="xl">
              <Badge colorScheme="green" px={3} py={1} borderRadius="full" fontSize="sm">
                🌱 100% Ökostrom
              </Badge>
              
              <VStack align="start" spacing={4}>
                <Heading
                  fontSize={{ base: '4xl', md: '5xl', lg: '6xl' }}
                  fontWeight="bold"
                  color="gray.900"
                  lineHeight="shorter"
                >
                  Günstige{' '}
                  <Text as="span" color="brand.500">
                    Stromtarife
                  </Text>{' '}
                  für Berlin
                </Heading>
                
                <Text fontSize="xl" color="gray.600" lineHeight="relaxed">
                  Speziell für die vietnamesische Community entwickelt. 
                  Faire Preise, persönlicher Service und 100% Ökostrom.
                </Text>
              </VStack>

              <HStack spacing={4}>
                <Button
                  as={RouterLink}
                  to="/pricing"
                  size="lg"
                  colorScheme="green"
                  bg="brand.500"
                  _hover={{ bg: 'brand.600', transform: 'translateY(-2px)' }}
                  boxShadow="lg"
                >
                  Tarife vergleichen
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  colorScheme="green"
                  _hover={{ transform: 'translateY(-2px)' }}
                >
                  Mehr erfahren
                </Button>
              </HStack>

              <HStack spacing={8} pt={4}>
                <VStack align="start" spacing={1}>
                  <Text fontSize="2xl" fontWeight="bold" color="brand.500">
                    2,500+
                  </Text>
                  <Text fontSize="sm" color="gray.500">
                    Zufriedene Kunden
                  </Text>
                </VStack>
                <VStack align="start" spacing={1}>
                  <Text fontSize="2xl" fontWeight="bold" color="brand.500">
                    15%
                  </Text>
                  <Text fontSize="sm" color="gray.500">
                    Durchschnitt. Ersparnis
                  </Text>
                </VStack>
                <VStack align="start" spacing={1}>
                  <Text fontSize="2xl" fontWeight="bold" color="brand.500">
                    4.8/5
                  </Text>
                  <Text fontSize="sm" color="gray.500">
                    Kundenbewertung
                  </Text>
                </VStack>
              </HStack>
            </VStack>

            {/* Hero Image Placeholder */}
            <Box
              flex="1"
              maxW="xl"
              h={{ base: '300px', md: '400px' }}
              bg="brand.100"
              borderRadius="3xl"
              display="flex"
              alignItems="center"
              justifyContent="center"
              border="1px solid"
              borderColor="brand.200"
            >
              <VStack spacing={4}>
                <Icon as={LightningIcon} w={16} h={16} color="brand.500" />
                <Text color="brand.700" fontSize="lg" fontWeight="medium">
                  Saubere Energie für Berlin
                </Text>
              </VStack>
            </Box>
          </Flex>
        </Container>
      </Box>

      {/* Features Section */}
      <Box py={{ base: 16, md: 24 }}>
        <Container maxW="7xl" px={{ base: 4, md: 8 }}>
          <VStack spacing={16}>
            <VStack spacing={4} textAlign="center">
              <Heading fontSize={{ base: '3xl', md: '4xl' }} color="gray.900">
                Warum Enfinitus Energie?
              </Heading>
              <Text fontSize="lg" color="gray.600" maxW="2xl">
                Wir verstehen die Bedürfnisse der vietnamesischen Community in Berlin 
                und bieten maßgeschneiderte Stromlösungen.
              </Text>
            </VStack>

            <SimpleGrid columns={{ base: 1, md: 3 }} spacing={8} w="full">
              {features.map((feature, index) => (
                <Card key={index} variant="outline" _hover={{ transform: 'translateY(-4px)', boxShadow: 'xl' }} transition="all 0.2s">
                  <CardBody textAlign="center" p={8}>
                    <VStack spacing={4}>
                      <Box
                        p={4}
                        borderRadius="full"
                        bg="brand.100"
                        display="inline-flex"
                      >
                        <Icon as={feature.icon} w={8} h={8} color="brand.500" />
                      </Box>
                      <Heading size="md" color="gray.900">
                        {feature.title}
                      </Heading>
                      <Text color="gray.600" lineHeight="relaxed">
                        {feature.description}
                      </Text>
                    </VStack>
                  </CardBody>
                </Card>
              ))}
            </SimpleGrid>
          </VStack>
        </Container>
      </Box>

      {/* CTA Section */}
      <Box bg="brand.500" py={{ base: 16, md: 20 }}>
        <Container maxW="7xl" px={{ base: 4, md: 8 }}>
          <VStack spacing={8} textAlign="center">
            <VStack spacing={4}>
              <Heading
                fontSize={{ base: '3xl', md: '4xl' }}
                color="white"
                textAlign="center"
              >
                Bereit für den Wechsel?
              </Heading>
              <Text fontSize="xl" color="brand.100" maxW="2xl">
                Berechnen Sie jetzt Ihre persönlichen Tarife und 
                sparen Sie ab dem ersten Monat.
              </Text>
            </VStack>

            <Button
              as={RouterLink}
              to="/pricing"
              size="lg"
              bg="white"
              color="brand.500"
              _hover={{
                transform: 'translateY(-2px)',
                boxShadow: '2xl',
              }}
              px={8}
            >
              Jetzt Tarife berechnen
            </Button>
          </VStack>
        </Container>
      </Box>
    </Box>
  );
};

export default HomePage;