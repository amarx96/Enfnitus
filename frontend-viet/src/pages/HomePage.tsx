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
  Card,
  CardBody
} from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import { ChevronRightIcon } from '@chakra-ui/icons';

const HomePage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <Box minH="100vh" bg="gray.50">
      {/* Hero Section */}
      <Box bg="linear-gradient(135deg, #e53e3e 0%, #f7a500 100%)" py={{ base: 16, md: 24 }}>
        <Container maxW="7xl" px={{ base: 4, md: 8 }}>
          <VStack spacing={6} textAlign="center" color="white">
            {/* Vietnamese Brand Logo */}
            <VStack spacing={2}>
              <Heading size="2xl" fontWeight="bold">
                🇻🇳 Viet Energy
              </Heading>
              <Text fontSize="lg" opacity={0.9}>
                Thương hiệu của Enfinitus Energie
              </Text>
            </VStack>
            
            <Heading 
              size="xl" 
              maxW="4xl" 
              lineHeight="shorter"
              textShadow="0 2px 4px rgba(0,0,0,0.3)"
            >
              Điện năng xanh cho gia đình Việt Nam
            </Heading>
            
            <Text 
              fontSize={{ base: "lg", md: "xl" }} 
              maxW="3xl" 
              opacity={0.95}
              fontWeight="medium"
            >
              Khám phá các gói tariff điện tối ưu với giá cả phải chăng và năng lượng tái tạo. 
              Đặc biệt dành cho cộng đồng người Việt tại Đức.
            </Text>

            <Button
              variant="vietnamese"
              size="lg"
              rightIcon={<ChevronRightIcon />}
              onClick={() => navigate('/pricing')}
              fontSize="lg"
              px={8}
              py={6}
              h="auto"
              borderRadius="full"
              boxShadow="0 8px 25px rgba(0,0,0,0.2)"
              _hover={{
                transform: 'translateY(-3px)',
                boxShadow: '0 12px 35px rgba(0,0,0,0.3)',
              }}
            >
              So sánh giá tariff ngay
            </Button>
          </VStack>
        </Container>
      </Box>

      {/* Features Section */}
      <Container maxW="7xl" py={{ base: 12, md: 16 }} px={{ base: 4, md: 8 }}>
        <VStack spacing={12}>
          <VStack spacing={4} textAlign="center">
            <Heading size="lg" color="gray.800">
              Tại sao chọn Viet Energy?
            </Heading>
            <Text fontSize="lg" color="gray.600" maxW="2xl">
              Chúng tôi hiểu nhu cầu của cộng đồng người Việt và cung cấp dịch vụ điện năng phù hợp nhất.
            </Text>
          </VStack>

          <SimpleGrid columns={{ base: 1, md: 3 }} spacing={8} w="full">
            {/* Feature 1 */}
            <Card variant="vietnamese" textAlign="center" p={6}>
              <CardBody>
                <VStack spacing={4}>
                  <Box 
                    w={24} 
                    h={24} 
                    bg="brand.500" 
                    borderRadius="full" 
                    display="flex" 
                    alignItems="center" 
                    justifyContent="center"
                  >
                    <Text fontSize="4xl" color="white">💚</Text>
                  </Box>
                  <Heading size="md" color="gray.800">
                    100% Năng lượng xanh
                  </Heading>
                  <Text color="gray.600">
                    Điện từ nguồn tái tạo thân thiện với môi trường, bảo vệ tương lai cho con em chúng ta.
                  </Text>
                </VStack>
              </CardBody>
            </Card>

            {/* Feature 2 */}
            <Card variant="vietnamese" textAlign="center" p={6}>
              <CardBody>
                <VStack spacing={4}>
                  <Box 
                    w={24} 
                    h={24} 
                    bg="yellow.500" 
                    borderRadius="full" 
                    display="flex" 
                    alignItems="center" 
                    justifyContent="center"
                  >
                    <Text fontSize="4xl" color="white">💰</Text>
                  </Box>
                  <Heading size="md" color="gray.800">
                    Giá cả phải chăng
                  </Heading>
                  <Text color="gray.600">
                    Mức giá cạnh tranh với nhiều ưu đãi đặc biệt. Mã giảm giá WELCOME2025 cho khách hàng mới.
                  </Text>
                </VStack>
              </CardBody>
            </Card>

            {/* Feature 3 */}
            <Card variant="vietnamese" textAlign="center" p={6}>
              <CardBody>
                <VStack spacing={4}>
                  <Box 
                    w={24} 
                    h={24} 
                    bg="orange.400" 
                    borderRadius="full" 
                    display="flex" 
                    alignItems="center" 
                    justifyContent="center"
                  >
                    <Text fontSize="4xl" color="white">🎯</Text>
                  </Box>
                  <Heading size="md" color="gray.800">
                    Dịch vụ tận tâm
                  </Heading>
                  <Text color="gray.600">
                    Hỗ trợ khách hàng bằng tiếng Việt, hiểu văn hóa và nhu cầu của cộng đồng người Việt.
                  </Text>
                </VStack>
              </CardBody>
            </Card>
          </SimpleGrid>
        </VStack>
      </Container>

      {/* CTA Section */}
      <Box bg="brand.50" py={{ base: 12, md: 16 }}>
        <Container maxW="4xl" textAlign="center" px={{ base: 4, md: 8 }}>
          <VStack spacing={6}>
            <Heading size="lg" color="gray.800">
              Bắt đầu tiết kiệm điện ngay hôm nay
            </Heading>
            <Text fontSize="lg" color="gray.600">
              Chỉ mất 3 phút để tìm gói tariff phù hợp nhất với gia đình bạn
            </Text>
            <Button
              variant="vietnamese"
              size="lg"
              rightIcon={<ChevronRightIcon />}
              onClick={() => navigate('/pricing')}
            >
              Tính toán chi phí điện
            </Button>
          </VStack>
        </Container>
      </Box>

      {/* Vietnamese Cultural Elements */}
      <Box py={8} bg="white">
        <Container maxW="7xl" px={{ base: 4, md: 8 }}>
          <HStack justify="center" spacing={8} opacity={0.6}>
            <Text fontSize="2xl">🏮</Text>
            <Text fontSize="sm" color="gray.500" fontStyle="italic">
              "Điện xanh - Tương lai xanh cho thế hệ mai sau"
            </Text>
            <Text fontSize="2xl">🌸</Text>
          </HStack>
        </Container>
      </Box>
    </Box>
  );
};

export default HomePage;