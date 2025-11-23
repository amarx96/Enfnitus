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
        title: 'Chưa chọn tariff',
        description: 'Vui lòng chọn một tariff trước.',
        status: 'warning',
        duration: 3000,
      });
      navigate('/pricing');
    }
  }, [selectedTariff, navigate, toast]);

  const validateForm = (): boolean => {
    const newErrors: ErrorData = {};
    
    // Required fields validation
    if (!customerData.vorname.trim()) newErrors.vorname = 'Họ tên là bắt buộc';
    if (!customerData.nachname.trim()) newErrors.nachname = 'Tên là bắt buộc';
    if (!customerData.email.trim()) newErrors.email = 'Email là bắt buộc';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerData.email)) {
      newErrors.email = 'Địa chỉ email không hợp lệ';
    }
    if (!customerData.telefon.trim()) newErrors.telefon = 'Điện thoại là bắt buộc';
    if (!customerData.strasse.trim()) newErrors.strasse = 'Đường là bắt buộc';
    if (!customerData.hausnummer.trim()) newErrors.hausnummer = 'Số nhà là bắt buộc';
    if (!customerData.plz.trim()) newErrors.plz = 'Mã bưu điện là bắt buộc';
    else if (!/^\d{5}$/.test(customerData.plz)) {
      newErrors.plz = 'Mã bưu điện phải có 5 chữ số';
    }
    if (!customerData.stadt.trim()) newErrors.stadt = 'Thành phố là bắt buộc';
    
    // Password validation
    if (!customerData.passwort) newErrors.passwort = 'Mật khẩu là bắt buộc';
    else if (customerData.passwort.length < 8) {
      newErrors.passwort = 'Mật khẩu phải có ít nhất 8 ký tự';
    }
    if (customerData.passwort !== customerData.passwortBestaetigung) {
      newErrors.passwortBestaetigung = 'Mật khẩu không khớp';
    }
    
    // Required checkboxes
    if (!customerData.agbAkzeptiert) newErrors.agbAkzeptiert = 'Phải chấp nhận điều khoản sử dụng';
    if (!customerData.datenschutzAkzeptiert) newErrors.datenschutzAkzeptiert = 'Phải chấp nhận chính sách bảo mật';
    
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
        title: 'Vui lòng sửa lỗi nhập liệu',
        status: 'error',
        duration: 3000,
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Prepare contract import payload
      const importPayload = {
        funnelId: 'viet-energie-website',
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
          campaignKey: selectedTariff.id.toUpperCase(),
          tariffId: selectedTariff.id,
          estimatedConsumption: formData?.jahresverbrauch || 2500,
          desiredStartDate: new Date().toISOString().split('T')[0],
          iban: '',
          sepaMandate: false,
          voucherCode: voucher?.voucherCode || null
        },
        meterLocation: {
          maloId: '',
          hasOwnMsb: formData?.hatSmartMeter || false,
          meterNumber: '',
          previousProviderId: '', 
          previousConsumption: formData?.jahresverbrauch || 2500
        }
      };

      // Import contract via Contracting Service
      const response = await axios.post('http://localhost:3000/api/v1/contracting/import', importPayload);
      
      if (response.data.success) {
        toast({
          title: 'Ký hợp đồng thành công!',
          description: `Mã hợp đồng: ${response.data.contractId}. Chúng tôi đang xử lý yêu cầu của bạn.`,
          status: 'success',
          duration: 5000,
        });
        
        // Navigate to success page
        navigate('/success', {
          state: {
            customerData: {
              ...customerData,
              customerId: response.data.draftId,
            },
            selectedTariff,
            voucher,
            contractId: response.data.contractId
          }
        });
        
      } else {
        throw new Error(response.data.message || 'Đăng ký thất bại');
      }
      
    } catch (error: any) {
      console.error('Registration error:', error);
      toast({
        title: 'Đăng ký thất bại',
        description: error.response?.data?.message || error.message || 'Đã xảy ra lỗi không xác định',
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
          Chưa chọn tariff. Vui lòng quay lại chọn tariff.
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
              Ký kết hợp đồng
            </Heading>
            <Text color="gray.600" fontSize="lg">
              Chỉ còn một vài bước để có hợp đồng điện mới
            </Text>
          </VStack>

          <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={8} w="full">
            {/* Left Column - Customer Form */}
            <Card variant="outline">
              <CardHeader>
                <Heading size="md">Thông tin của bạn</Heading>
              </CardHeader>
              <CardBody>
                <VStack spacing={4}>
                  {/* Personal Information */}
                  <Text fontWeight="bold" color="gray.700" alignSelf="start">
                    Thông tin cá nhân
                  </Text>
                  
                  <SimpleGrid columns={2} spacing={4} w="full">
                    <FormControl isInvalid={!!errors.vorname}>
                      <FormLabel>Họ tên *</FormLabel>
                      <Input
                        value={customerData.vorname}
                        onChange={(e) => handleInputChange('vorname', e.target.value)}
                        placeholder="Nguyễn"
                      />
                      <FormErrorMessage>{errors.vorname}</FormErrorMessage>
                    </FormControl>
                    
                    <FormControl isInvalid={!!errors.nachname}>
                      <FormLabel>Tên *</FormLabel>
                      <Input
                        value={customerData.nachname}
                        onChange={(e) => handleInputChange('nachname', e.target.value)}
                        placeholder="Văn An"
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
                      placeholder="nguyen.vanan@example.com"
                    />
                    <FormErrorMessage>{errors.email}</FormErrorMessage>
                  </FormControl>
                  
                  <SimpleGrid columns={2} spacing={4} w="full">
                    <FormControl isInvalid={!!errors.telefon}>
                      <FormLabel>Điện thoại *</FormLabel>
                      <Input
                        type="tel"
                        value={customerData.telefon}
                        onChange={(e) => handleInputChange('telefon', e.target.value)}
                        placeholder="+84 90 123 4567"
                      />
                      <FormErrorMessage>{errors.telefon}</FormErrorMessage>
                    </FormControl>
                    
                    <FormControl>
                      <FormLabel>Ngày sinh</FormLabel>
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
                    Địa chỉ
                  </Text>
                  
                  <SimpleGrid columns={3} spacing={4} w="full">
                    <FormControl gridColumn="span 2" isInvalid={!!errors.strasse}>
                      <FormLabel>Đường *</FormLabel>
                      <Input
                        value={customerData.strasse}
                        onChange={(e) => handleInputChange('strasse', e.target.value)}
                        placeholder="Nguyễn Huệ"
                      />
                      <FormErrorMessage>{errors.strasse}</FormErrorMessage>
                    </FormControl>
                    
                    <FormControl isInvalid={!!errors.hausnummer}>
                      <FormLabel>Số nhà *</FormLabel>
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
                      <FormLabel>Mã bưu điện *</FormLabel>
                      <Input
                        value={customerData.plz}
                        onChange={(e) => handleInputChange('plz', e.target.value)}
                        placeholder="70000"
                      />
                      <FormErrorMessage>{errors.plz}</FormErrorMessage>
                    </FormControl>
                    
                    <FormControl gridColumn="span 2" isInvalid={!!errors.stadt}>
                      <FormLabel>Thành phố *</FormLabel>
                      <Input
                        value={customerData.stadt}
                        onChange={(e) => handleInputChange('stadt', e.target.value)}
                        placeholder="Hồ Chí Minh"
                      />
                      <FormErrorMessage>{errors.stadt}</FormErrorMessage>
                    </FormControl>
                  </SimpleGrid>

                  <Divider />

                  {/* Account Information */}
                  <Text fontWeight="bold" color="gray.700" alignSelf="start">
                    Thông tin tài khoản
                  </Text>
                  
                  <SimpleGrid columns={2} spacing={4} w="full">
                    <FormControl isInvalid={!!errors.passwort}>
                      <FormLabel>Mật khẩu *</FormLabel>
                      <Input
                        type="password"
                        value={customerData.passwort}
                        onChange={(e) => handleInputChange('passwort', e.target.value)}
                        placeholder="Ít nhất 8 ký tự"
                      />
                      <FormErrorMessage>{errors.passwort}</FormErrorMessage>
                    </FormControl>
                    
                    <FormControl isInvalid={!!errors.passwortBestaetigung}>
                      <FormLabel>Xác nhận mật khẩu *</FormLabel>
                      <Input
                        type="password"
                        value={customerData.passwortBestaetigung}
                        onChange={(e) => handleInputChange('passwortBestaetigung', e.target.value)}
                        placeholder="Nhập lại mật khẩu"
                      />
                      <FormErrorMessage>{errors.passwortBestaetigung}</FormErrorMessage>
                    </FormControl>
                  </SimpleGrid>

                  {/* Additional Notes */}
                  <FormControl>
                    <FormLabel>Ghi chú (tùy chọn)</FormLabel>
                    <Textarea
                      value={customerData.notizen}
                      onChange={(e) => handleInputChange('notizen', e.target.value)}
                      placeholder="Yêu cầu đặc biệt hoặc ghi chú..."
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
                  <Heading size="md">Đơn hàng của bạn</Heading>
                </CardHeader>
                <CardBody>
                  <VStack spacing={4} align="start">
                    <HStack justify="space-between" w="full">
                      <Text fontWeight="bold">{selectedTariff.name.replace('Rabot', 'Viet Energie')}</Text>
                      {selectedTariff.green && <Badge colorScheme="green">ÖKO</Badge>}
                    </HStack>
                    
                    <VStack spacing={2} align="start" w="full" fontSize="sm">
                      <HStack justify="space-between" w="full">
                        <Text>Tiêu thụ hàng năm:</Text>
                        <Text>{formData.jahresverbrauch} kWh</Text>
                      </HStack>
                      <HStack justify="space-between" w="full">
                        <Text>Quy mô hộ gia đình:</Text>
                        <Text>{formData.haushaltgroesse} Người</Text>
                      </HStack>
                      {voucher?.isValid && (
                        <HStack justify="space-between" w="full">
                          <Text>Mã giảm giá:</Text>
                          <Text color="green.600" fontWeight="medium">{voucher.voucherCode}</Text>
                        </HStack>
                      )}
                    </VStack>
                    
                    <Divider />
                    
                    <VStack spacing={2} align="start" w="full">
                      {voucher?.isValid && (
                        <HStack justify="space-between" w="full">
                          <Text fontSize="sm" color="gray.600">Ban đầu:</Text>
                          <Text fontSize="sm" color="gray.600" textDecoration="line-through">
                            {(originalPrice || 0).toFixed(2)} €/Tháng
                          </Text>
                        </HStack>
                      )}
                      <HStack justify="space-between" w="full">
                        <Text fontWeight="bold">Hàng tháng:</Text>
                        <Text fontWeight="bold" color={voucher?.isValid ? 'green.600' : 'gray.900'}>
                          {(discountedPrice || 0).toFixed(2)} €
                        </Text>
                      </HStack>
                      <HStack justify="space-between" w="full">
                        <Text>Hàng năm:</Text>
                        <Text>{((discountedPrice || 0) * 12).toFixed(2)} €</Text>
                      </HStack>
                    </VStack>
                  </VStack>
                </CardBody>
              </Card>

              {/* Terms and Conditions */}
              <Card variant="outline" w="full">
                <CardHeader>
                  <Heading size="md">Chấp thuận</Heading>
                </CardHeader>
                <CardBody>
                  <VStack spacing={4} align="start">
                    <FormControl isInvalid={!!errors.agbAkzeptiert}>
                      <Checkbox
                        isChecked={customerData.agbAkzeptiert}
                        onChange={(e) => handleInputChange('agbAkzeptiert', e.target.checked)}
                      >
                        <Text fontSize="sm">
                          Tôi chấp nhận{' '}
                          <Text as="span" color="brand.600" textDecoration="underline" cursor="pointer">
                            Điều khoản Sử dụng
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
                          Tôi chấp nhận{' '}
                          <Text as="span" color="brand.600" textDecoration="underline" cursor="pointer">
                            Chính sách Bảo mật
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
                        Tôi muốn nhận thông tin về các ưu đãi mới
                      </Text>
                    </Checkbox>
                    
                    <Checkbox
                      isChecked={customerData.newsletterEinverstaendnis}
                      onChange={(e) => handleInputChange('newsletterEinverstaendnis', e.target.checked)}
                    >
                      <Text fontSize="sm">
                        Tôi muốn đăng ký nhận bản tin
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
                loadingText="Đang tạo hợp đồng..."
              >
                Ký kết hợp đồng
              </Button>
              
              <Button
                w="full"
                variant="ghost"
                onClick={() => navigate(-1)}
              >
                ← Quay lại
              </Button>
            </VStack>
          </SimpleGrid>
        </VStack>
      </Container>
    </Box>
  );
};

export default ContractPage;