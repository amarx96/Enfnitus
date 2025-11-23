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
          Không tìm thấy dữ liệu hợp đồng. Vui lòng bắt đầu lại quy trình.
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
              Ký kết hợp đồng thành công!
            </Heading>
            <Text color="gray.600" fontSize="lg" maxW="2xl">
              Chúc mừng! Hợp đồng điện của bạn đã được tạo thành công.
              Bạn sẽ nhận được xác nhận qua email trong ít phút.
            </Text>
          </VStack>

          {/* Contract Summary */}
          <Card variant="outline" w="full">
            <CardHeader>
              <Heading size="md">Chi tiết hợp đồng của bạn</Heading>
            </CardHeader>
            <CardBody>
              <VStack spacing={4} align="start">
                {/* Customer Info */}
                <VStack spacing={2} align="start" w="full">
                  <Text fontWeight="bold" color="gray.700">
                    Khách hàng
                  </Text>
                  <Text>{customerData.vorname} {customerData.nachname}</Text>
                  <Text color="gray.600">{customerData.email}</Text>
                  <Text color="gray.600">{customerData.telefon}</Text>
                </VStack>

                <Divider />

                {/* Tariff Info */}
                <VStack spacing={2} align="start" w="full">
                  <Text fontWeight="bold" color="gray.700">
                    Tariff đã chọn
                  </Text>
                  <HStack>
                    <Text fontSize="lg" fontWeight="medium">{selectedTariff.name}</Text>
                    {selectedTariff.green && <Badge colorScheme="green">XUẤT</Badge>}
                  </HStack>
                  
                  {voucher?.isValid && (
                    <Alert status="success" size="sm">
                      <AlertIcon />
                      <Text fontSize="sm">
                        Mã giảm giá <strong>{voucher.voucherCode}</strong> đã được áp dụng thành công! 
                        Bạn tiết kiệm {voucher.discounts.value}% chi phí hàng tháng.
                      </Text>
                    </Alert>
                  )}
                </VStack>

                <Divider />

                {/* Address */}
                <VStack spacing={2} align="start" w="full">
                  <Text fontWeight="bold" color="gray.700">
                    Địa chỉ cung cấp
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
              <Heading size="md">Các bước tiếp theo</Heading>
            </CardHeader>
            <CardBody>
              <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6} w="full">
                <VStack spacing={2} textAlign="center">
                  <Text fontSize="2xl">📧</Text>
                  <Text fontWeight="medium">Xác nhận Email</Text>
                  <Text fontSize="sm" color="gray.600">
                    Bạn sẽ nhận được email xác nhận trong vài phút tới
                  </Text>
                </VStack>
                <VStack spacing={2} textAlign="center">
                  <Text fontSize="2xl">📋</Text>
                  <Text fontWeight="medium">Tài liệu hợp đồng</Text>
                  <Text fontSize="sm" color="gray.600">
                    Bạn sẽ nhận được tài liệu hợp đồng đầy đủ trong vòng 24 giờ
                  </Text>
                </VStack>
                <VStack spacing={2} textAlign="center">
                  <Text fontSize="2xl">⚡</Text>
                  <Text fontWeight="medium">Bắt đầu cung cấp</Text>
                  <Text fontSize="sm" color="gray.600">
                    Tariff điện mới của bạn sẽ được kích hoạt trong vòng 14 ngày
                  </Text>
                </VStack>
              </SimpleGrid>
            </CardBody>
          </Card>

          {/* Support Information */}
          <Card variant="outline" w="full">
            <CardBody>
              <VStack spacing={4}>
                <Heading size="md">Có câu hỏi hoặc vấn đề?</Heading>
                <Text color="gray.600" textAlign="center">
                  Dịch vụ khách hàng của chúng tôi sẵn sàng hỗ trợ bạn:
                </Text>
                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4} w="full">
                  <VStack spacing={2}>
                    <Text fontWeight="medium">Điện thoại</Text>
                    <Text color="brand.600" fontSize="lg">+84 90 123 4567</Text>
                  </VStack>
                  <VStack spacing={2}>
                    <Text fontWeight="medium">Email</Text>
                    <Text color="brand.600">support@viet-energy.vn</Text>
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
              Về trang chủ
            </Button>
            <Button
              variant="ghost"
              onClick={() => window.print()}
            >
              In chi tiết hợp đồng
            </Button>
          </VStack>
        </VStack>
      </Container>
    </Box>
  );
};

export default SuccessPage;