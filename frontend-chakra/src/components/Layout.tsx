import React, { ReactNode } from 'react';
import {
  Box,
  Flex,
  Text,
  Button,
  Container,
  HStack,
  VStack,
  IconButton,
  useDisclosure,
  Drawer,
  DrawerBody,
  DrawerHeader,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
  useBreakpointValue,
} from '@chakra-ui/react';
import { HamburgerIcon } from '@chakra-ui/icons';
import { Link as RouterLink, useLocation } from 'react-router-dom';

interface LayoutProps {
  children: ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const location = useLocation();
  const isMobile = useBreakpointValue({ base: true, md: false });

  const navItems = [
    { label: 'Home', path: '/' },
    { label: 'Tarife', path: '/pricing' },
    { label: 'Vertrag', path: '/contract' },
  ];

  const NavLink = ({ path, label }: { path: string; label: string }) => (
    <Button
      as={RouterLink}
      to={path}
      variant={location.pathname === path ? 'solid' : 'ghost'}
      size="md"
      color={location.pathname === path ? 'white' : 'gray.700'}
      _hover={{
        color: location.pathname === path ? 'white' : 'brand.500',
        transform: 'translateY(-1px)',
      }}
    >
      {label}
    </Button>
  );

  return (
    <Box minH="100vh" bg="gray.50">
      {/* Header */}
      <Box bg="white" boxShadow="sm" position="sticky" top={0} zIndex={100}>
        <Container maxW="7xl" px={{ base: 4, md: 8 }}>
          <Flex h="16" alignItems="center" justifyContent="space-between">
            {/* Logo */}
            <Flex alignItems="center">
              <Box
                w="8"
                h="8"
                bg="brand.500"
                borderRadius="lg"
                display="flex"
                alignItems="center"
                justifyContent="center"
                mr={3}
              >
                <Text color="white" fontWeight="bold" fontSize="sm">
                  E
                </Text>
              </Box>
              <Text fontSize="xl" fontWeight="bold" color="gray.800">
                Enfinitus
              </Text>
              <Text fontSize="xl" fontWeight="300" color="brand.500" ml={1}>
                Energie
              </Text>
            </Flex>

            {/* Desktop Navigation */}
            {!isMobile && (
              <Flex alignItems="center">
                <HStack spacing={1}>
                  {navItems.map((item) => (
                    <NavLink key={item.path} path={item.path} label={item.label} />
                  ))}
                </HStack>
                {/* Site Switcher */}
                <Button
                  as="a"
                  href="http://localhost:3002"
                  target="_blank"
                  rel="noopener noreferrer"
                  variant="outline"
                  size="sm"
                  ml={4}
                  colorScheme="red"
                  leftIcon={<Text fontSize="lg">🇻🇳</Text>}
                  _hover={{ bg: 'red.50' }}
                >
                  Viet Energie
                </Button>
              </Flex>
            )}

            {/* Mobile Menu Button */}
            {isMobile && (
              <IconButton
                aria-label="Open menu"
                icon={<HamburgerIcon />}
                variant="ghost"
                onClick={onOpen}
              />
            )}
          </Flex>
        </Container>
      </Box>

      {/* Mobile Drawer */}
      <Drawer isOpen={isOpen} placement="right" onClose={onClose}>
        <DrawerOverlay />
        <DrawerContent>
          <DrawerCloseButton />
          <DrawerHeader>Menu</DrawerHeader>
          <DrawerBody>
            <VStack spacing={4} align="stretch">
              {navItems.map((item) => (
                <Button
                  key={item.path}
                  as={RouterLink}
                  to={item.path}
                  variant={location.pathname === item.path ? 'solid' : 'ghost'}
                  size="lg"
                  onClick={onClose}
                >
                  {item.label}
                </Button>
              ))}
              <Button
                as="a"
                href="http://localhost:3002"
                target="_blank"
                rel="noopener noreferrer"
                variant="outline"
                colorScheme="red"
                size="lg"
                leftIcon={<Text fontSize="lg">🇻🇳</Text>}
              >
                Viet Energie
              </Button>
            </VStack>
          </DrawerBody>
        </DrawerContent>
      </Drawer>

      {/* Main Content */}
      <Box flex="1">
        {children}
      </Box>

      {/* Footer */}
      <Box bg="white" mt="auto" borderTop="1px" borderColor="gray.200">
        <Container maxW="7xl" px={{ base: 4, md: 8 }}>
          <Flex
            py={8}
            direction={{ base: 'column', md: 'row' }}
            justify="space-between"
            align="center"
          >
            <Text color="gray.600" fontSize="sm">
              © 2025 Enfinitus Energie. Alle Rechte vorbehalten.
            </Text>
            <HStack spacing={6} mt={{ base: 4, md: 0 }}>
              <Text color="gray.500" fontSize="sm" cursor="pointer" _hover={{ color: 'brand.500' }}>
                Datenschutz
              </Text>
              <Text color="gray.500" fontSize="sm" cursor="pointer" _hover={{ color: 'brand.500' }}>
                AGB
              </Text>
              <Text color="gray.500" fontSize="sm" cursor="pointer" _hover={{ color: 'brand.500' }}>
                Impressum
              </Text>
            </HStack>
          </Flex>
        </Container>
      </Box>
    </Box>
  );
};

export default Layout;