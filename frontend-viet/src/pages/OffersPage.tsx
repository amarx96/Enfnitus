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
        title: 'Không tìm thấy tariff',
        description: 'Vui lòng quay lại tính toán tariff.',
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
          Không có tariff khả dụng. Vui lòng quay lại tính toán tariff.
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
              Các lựa chọn tariff của bạn
            </Heading>
            <Text color="gray.600" fontSize="lg">
              Dựa trên mức tiêu thụ hàng năm {(formData?.jahresverbrauch || 3500).toLocaleString()} kWh
            </Text>
            {voucher?.isValid && (
              <Alert status="success" borderRadius="md" maxW="md">
                <AlertIcon />
                <Text fontSize="sm">
                  Giảm {voucher.discounts.value}% với mã "{voucher.voucherCode}" được áp dụng!
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
                      ĐƯỢC ĐỀ XUẤT
                    </Badge>
                  )}

                  <CardHeader pb={2}>
                    <VStack spacing={2} align="start">
                      <HStack>
                        <Heading size="md" color="gray.900">
                          {tariff.name.replace('Rabot', 'Viet Energie')}
                        </Heading>
                        {tariff.green && (
                          <Badge colorScheme="green" size="sm">
                            XUẤT
                          </Badge>
                        )}
                        {tariff.dynamicPricing && (
                          <Badge colorScheme="purple" size="sm">
                            LINH HOẠT
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
                          mỗi tháng
                        </Text>
                      </VStack>

                      <Divider />

                      {/* Price Details */}
                      <SimpleGrid columns={2} spacing={4} w="full" fontSize="sm">
                        <Box>
                          <Text fontWeight="medium" color="gray.700">Giá cơ bản</Text>
                          <Text color="gray.600">{(tariff.grundpreis || 0).toFixed(2)} €/Tháng</Text>
                        </Box>
                        <Box>
                          <Text fontWeight="medium" color="gray.700">Giá sử dụng</Text>
                          <Text color="gray.600">{(tariff.arbeitspreis || 0).toFixed(4)} ct/kWh</Text>
                        </Box>
                      </SimpleGrid>

                      <Box w="full">
                        <Text fontWeight="medium" color="gray.700" fontSize="sm">Chi phí hàng năm:</Text>
                        <Text color="gray.900" fontWeight="semibold">
                          {hasDiscount ? 
                            `${(discountedPrice * 12).toFixed(2)} €/Năm` : 
                            `${(tariff.jahreskosten || (tariff.monatlich * 12) || 0).toFixed(2)} €/Năm`
                          }
                        </Text>
                      </Box>

                      <Divider />

                      {/* Features */}
                      <Box w="full">
                        <Text fontWeight="medium" color="gray.700" mb={2} fontSize="sm">
                          Bao gồm:
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
                        loadingText="Đang chọn..."
                        _hover={{
                          transform: 'translateY(-1px)',
                          shadow: 'md'
                        }}
                      >
                        {tariff.recommended ? "Chọn ngay" : "Chọn tariff"}
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
            ← Quay lại tính toán tariff
          </Button>
        </VStack>
      </Container>
    </Box>
  );
};

export default OffersPage;