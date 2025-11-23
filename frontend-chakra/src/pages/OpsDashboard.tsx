import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Heading,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Input,
  Button,
  HStack,
  VStack,
  Text,
  Badge,
  useToast,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  ModalFooter,
  FormControl,
  FormLabel,
  Switch,
  Select,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper
} from '@chakra-ui/react';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api/v1';

// Types
interface Campaign {
  id: string;
  campaign_key: string;
  name: string;
  tariff_type: string;
  base_price_eur_month: string;
  energy_price_ct_kwh: string;
}

interface MarketingCampaign {
  id: string;
  campaign_id: string;
  voucher_code: string;
  funnel_id: string;
  discount_working_price_ct: string;
  discount_base_price_eur: string;
  start_date: string;
  end_date: string;
  is_active: boolean;
}

interface ContractDraft {
  id: string;
  contract_id: string;
  funnel_id: string;
  customer_id: string;
  status: string;
  schufa_status: string;
  created_at: string;
}

interface MaLoDraft {
  id: string;
  market_location_identifier: string;
  meter_number: string;
  previous_provider_code: string;
  previous_annual_consumption: number;
  schufa_score_accepted: boolean;
  malo_draft_status: string;
  has_own_msb: boolean;
}

interface PricingMargin {
  id?: string;
  funnel_id: string;
  tariff_type: string;
  margin_working_price_ct: number;
  margin_base_price_eur: number;
}

const OpsDashboard: React.FC = () => {
  const toast = useToast();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [marketingCampaigns, setMarketingCampaigns] = useState<MarketingCampaign[]>([]);
  const [contracts, setContracts] = useState<ContractDraft[]>([]);
  const [selectedContractId, setSelectedContractId] = useState<string | null>(null);
  const [maLoDrafts, setMaLoDrafts] = useState<MaLoDraft[]>([]);
  const [customerIdSearch, setCustomerIdSearch] = useState('');
  
  // Pricing Margins
  const [pricingMargins, setPricingMargins] = useState<PricingMargin[]>([]);
  const [selectedPricingFunnel, setSelectedPricingFunnel] = useState('enfinitus-website');

  // Editing
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingMaLo, setEditingMaLo] = useState<MaLoDraft | null>(null);

  // New Campaign Form
  const [newCampaign, setNewCampaign] = useState({
    voucherCode: '',
    funnelId: 'enfinitus-website',
    discountWorkingPrice: 0,
    discountBasePrice: 0,
    startDate: '',
    endDate: ''
  });

  // Fetch Data
  useEffect(() => {
    fetchCampaigns();
    fetchMarketingCampaigns();
    fetchContracts();
  }, []);

  useEffect(() => {
    fetchPricingMargins(selectedPricingFunnel);
  }, [selectedPricingFunnel]);

  const fetchCampaigns = async () => {
    try {
      const res = await axios.get(API_URL + '/contracting/ops/campaigns');
      setCampaigns(res.data.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchPricingMargins = async (funnelId: string) => {
    try {
      const res = await axios.get(`${API_URL}/pricing/ops/margins?funnelId=${funnelId}`);
      const types = ['FIX12', 'FIX24', 'DYNAMIC', 'GREEN'];
      const merged = types.map(type => {
         const existing = res.data.data.find((m: any) => m.tariff_type === type);
         return existing ? {
           ...existing,
           margin_working_price_ct: parseFloat(existing.margin_working_price_ct),
           margin_base_price_eur: parseFloat(existing.margin_base_price_eur)
         } : {
           funnel_id: funnelId,
           tariff_type: type,
           margin_working_price_ct: 0,
           margin_base_price_eur: 0
         };
      });
      setPricingMargins(merged);
    } catch (err) {
      console.error(err);
      toast({ title: 'Error fetching margins', status: 'error' });
    }
  };

  const fetchMarketingCampaigns = async () => {
    try {
      const res = await axios.get(API_URL + '/contracting/ops/marketing-campaigns');
      setMarketingCampaigns(res.data.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchContracts = async () => {
    try {
      const url = customerIdSearch 
        ? `${API_URL}/contracting/ops/contracts?customerId=${customerIdSearch}`
        : API_URL + '/contracting/ops/contracts';
      const res = await axios.get(url);
      setContracts(res.data.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateCampaign = async () => {
    try {
      await axios.post(API_URL + '/contracting/ops/marketing-campaigns', newCampaign);
      toast({ title: 'Campaign Created', status: 'success' });
      fetchMarketingCampaigns();
      setNewCampaign({
        voucherCode: '',
        funnelId: 'enfinitus-website',
        discountWorkingPrice: 0,
        discountBasePrice: 0,
        startDate: '',
        endDate: ''
      });
    } catch (err) {
      toast({ title: 'Creation Failed', status: 'error' });
    }
  };

  const handleContractSelect = async (contractId: string, dbId: string) => {
    setSelectedContractId(contractId);
    try {
      const res = await axios.get(`${API_URL}/contracting/ops/malo-drafts/${contractId}`);
      setMaLoDrafts(res.data.data);
    } catch (err) {
      console.error(err);
      toast({ title: 'Error fetching MaLo drafts', status: 'error' });
    }
  };

  const handleEditMaLo = (malo: MaLoDraft) => {
    setEditingMaLo(malo);
    setIsEditOpen(true);
  };

  const saveMaLoChanges = async () => {
    if (!editingMaLo) return;
    try {
      await axios.put(`${API_URL}/contracting/ops/malo-drafts/${editingMaLo.id}`, editingMaLo);
      toast({ title: 'Changes saved', status: 'success' });
      setIsEditOpen(false);
      if (selectedContractId) handleContractSelect(selectedContractId, ''); // Refresh
    } catch (err) {
      toast({ title: 'Save failed', status: 'error' });
    }
  };

  const confirmSwitch = async (draftId: string) => {
    try {
      await axios.post(API_URL + '/contracting/ops/confirm-switch', { draftId });
      toast({ title: 'Switch Initiated (GPKE/MaKo sent)', status: 'success' });
      if (selectedContractId) handleContractSelect(selectedContractId, ''); // Refresh
    } catch (err: any) {
      toast({ title: 'Confirm failed', description: err.response?.data?.message, status: 'error' });
    }
  };
  
  const handleMarginChange = (tariffType: string, field: keyof PricingMargin, value: string | number) => {
    setPricingMargins(prev => prev.map(m => 
      m.tariff_type === tariffType ? { ...m, [field]: typeof value === 'string' ? parseFloat(value) || 0 : value } : m
    ));
  };

  const saveMargin = async (margin: PricingMargin) => {
    try {
       await axios.post(API_URL + '/pricing/ops/margins', margin);
       toast({ title: `Saved margin for ${margin.tariff_type}`, status: 'success' });
    } catch (err) {
       toast({ title: 'Save failed', status: 'error' });
    }
  };

  return (
    <Container maxW="container.xl" py={10}>
      <Heading mb={6}>Operations Dashboard</Heading>
      
      <Tabs variant="enclosed">
        <TabList>
          <Tab>Contract Management</Tab>
          <Tab>Pricing & Margins</Tab>
          <Tab>Marketing Campaigns</Tab>
        </TabList>

        <TabPanels>
          {/* Contract Management */}
          <TabPanel>
            <HStack mb={6}>
              <Input 
                placeholder="Search by Customer UUID..." 
                value={customerIdSearch}
                onChange={(e) => setCustomerIdSearch(e.target.value)}
              />
              <Button onClick={fetchContracts} colorScheme="blue">Search</Button>
            </HStack>

            <HStack align="start" spacing={8}>
              <Box flex={1} borderWidth="1px" borderRadius="lg" p={4}>
                <Heading size="md" mb={4}>Contract Drafts</Heading>
                <Table size="sm">
                  <Thead>
                    <Tr>
                      <Th>Contract ID</Th>
                      <Th>Status</Th>
                      <Th>Funnel</Th>
                      <Th>Schufa</Th>
                      <Th>Action</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {contracts.map(c => (
                      <Tr key={c.id} bg={selectedContractId === c.contract_id ? 'blue.50' : undefined}>
                        <Td fontSize="xs">{c.contract_id}</Td>
                        <Td><Badge colorScheme={c.status === 'ACTIVE' ? 'green' : 'yellow'}>{c.status}</Badge></Td>
                        <Td>{c.funnel_id}</Td>
                        <Td>{c.schufa_status}</Td>
                        <Td>
                          <Button size="xs" onClick={() => handleContractSelect(c.contract_id, c.id)}>
                            View MaLo
                          </Button>
                        </Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              </Box>

              <Box flex={1} borderWidth="1px" borderRadius="lg" p={4}>
                <Heading size="md" mb={4}>MaLo Drafts (Market Location)</Heading>
                {maLoDrafts.length === 0 ? (
                  <Text color="gray.500">Select a contract to view details</Text>
                ) : (
                  <VStack spacing={4} align="stretch">
                    {maLoDrafts.map(m => (
                      <Box key={m.id} p={4} borderWidth="1px" borderRadius="md">
                        <HStack justify="space-between" mb={2}>
                          <Heading size="sm">MaLo: {m.market_location_identifier}</Heading>
                          <Badge>{m.malo_draft_status}</Badge>
                        </HStack>
                        <Table size="sm" variant="simple">
                          <Tbody>
                            <Tr><Td>Meter #</Td><Td>{m.meter_number}</Td></Tr>
                            <Tr><Td>Prev. Provider</Td><Td>{m.previous_provider_code}</Td></Tr>
                            <Tr><Td>Consumption</Td><Td>{m.previous_annual_consumption} kWh</Td></Tr>
                            <Tr><Td>Own MSB</Td><Td>{m.has_own_msb ? 'Yes' : 'No'}</Td></Tr>
                            <Tr><Td>Schufa Accepted</Td><Td>{m.schufa_score_accepted ? 'Yes' : 'No'}</Td></Tr>
                          </Tbody>
                        </Table>
                        <HStack mt={4} spacing={2}>
                          <Button size="sm" onClick={() => handleEditMaLo(m)}>Edit Data</Button>
                          {m.malo_draft_status === 'APPROVED' && (
                            <Button size="sm" colorScheme="green" onClick={() => confirmSwitch(m.id)}>
                              Confirm Switch
                            </Button>
                          )}
                        </HStack>
                      </Box>
                    ))}
                  </VStack>
                )}
              </Box>
            </HStack>
          </TabPanel>

          {/* Pricing & Margins (Formerly Base Tariffs) */}
          <TabPanel>
            <VStack align="start" spacing={6}>
              <Box p={4} borderWidth="1px" borderRadius="lg" w="full" bg="gray.50">
                <Text mb={2} fontWeight="bold">Select Funnel to Configure:</Text>
                <Select 
                  value={selectedPricingFunnel} 
                  onChange={(e) => setSelectedPricingFunnel(e.target.value)}
                  bg="white"
                  maxW="400px"
                >
                  <option value="enfinitus-website">Enfinitus (enfinitus-website)</option>
                  <option value="viet-energie-website">Viet Energie (viet-energie-website)</option>
                </Select>
              </Box>

              <Table variant="simple">
                <Thead>
                  <Tr>
                    <Th>Tariff Type</Th>
                    <Th>Base Margin (€/Month)</Th>
                    <Th>Working Margin (ct/kWh)</Th>
                    <Th>Total Example (Berlin)</Th>
                    <Th>Action</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {pricingMargins.map(margin => (
                    <Tr key={margin.tariff_type}>
                      <Td fontWeight="bold">{margin.tariff_type}</Td>
                      <Td>
                        <FormControl>
                          <FormLabel fontSize="xs" color="gray.500">Add to Base Price</FormLabel>
                          <NumberInput 
                            value={margin.margin_base_price_eur}
                            precision={2}
                            step={0.5}
                            onChange={(val) => handleMarginChange(margin.tariff_type, 'margin_base_price_eur', val)}
                          >
                            <NumberInputField />
                            <NumberInputStepper>
                              <NumberIncrementStepper />
                              <NumberDecrementStepper />
                            </NumberInputStepper>
                          </NumberInput>
                        </FormControl>
                      </Td>
                      <Td>
                        <FormControl>
                          <FormLabel fontSize="xs" color="gray.500">Add to Working Price</FormLabel>
                          <NumberInput 
                            value={margin.margin_working_price_ct}
                            precision={4}
                            step={0.1}
                            onChange={(val) => handleMarginChange(margin.tariff_type, 'margin_working_price_ct', val)}
                          >
                            <NumberInputField />
                            <NumberInputStepper>
                              <NumberIncrementStepper />
                              <NumberDecrementStepper />
                            </NumberInputStepper>
                          </NumberInput>
                        </FormControl>
                      </Td>
                      <Td>
                        <Text fontSize="sm" color="gray.500">
                          AP: +{margin.margin_working_price_ct} ct<br/>
                          GP: +{margin.margin_base_price_eur} €
                        </Text>
                      </Td>
                      <Td>
                        <Button colorScheme="blue" size="sm" onClick={() => saveMargin(margin)}>
                          Save Margin
                        </Button>
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            </VStack>
          </TabPanel>

          {/* Marketing Campaigns */}
          <TabPanel>
            <HStack align="start" spacing={8}>
              {/* Create Form */}
              <Box w="300px" borderWidth="1px" borderRadius="lg" p={4}>
                <Heading size="md" mb={4}>Create Voucher</Heading>
                <VStack spacing={4}>
                  <FormControl>
                    <FormLabel>Voucher Code</FormLabel>
                    <Input 
                      value={newCampaign.voucherCode}
                      onChange={e => setNewCampaign({...newCampaign, voucherCode: e.target.value.toUpperCase()})}
                      placeholder="SUMMER2025"
                    />
                  </FormControl>
                  <FormControl>
                    <FormLabel>Funnel</FormLabel>
                    <Select 
                      value={newCampaign.funnelId}
                      onChange={e => setNewCampaign({...newCampaign, funnelId: e.target.value})}
                    >
                      <option value="enfinitus-website">Enfinitus</option>
                      <option value="viet-energie-website">Viet Energie</option>
                    </Select>
                  </FormControl>
                  <FormControl>
                    <FormLabel>Discount (Arbeitspreis ct/kWh)</FormLabel>
                    <Input 
                      type="number"
                      value={newCampaign.discountWorkingPrice}
                      onChange={e => setNewCampaign({...newCampaign, discountWorkingPrice: parseFloat(e.target.value)})}
                    />
                  </FormControl>
                  <FormControl>
                    <FormLabel>Discount (Grundpreis €/Mo)</FormLabel>
                    <Input 
                      type="number"
                      value={newCampaign.discountBasePrice}
                      onChange={e => setNewCampaign({...newCampaign, discountBasePrice: parseFloat(e.target.value)})}
                    />
                  </FormControl>
                  <FormControl>
                    <FormLabel>Start Date</FormLabel>
                    <Input 
                      type="date"
                      value={newCampaign.startDate}
                      onChange={e => setNewCampaign({...newCampaign, startDate: e.target.value})}
                    />
                  </FormControl>
                  <FormControl>
                    <FormLabel>End Date</FormLabel>
                    <Input 
                      type="date"
                      value={newCampaign.endDate}
                      onChange={e => setNewCampaign({...newCampaign, endDate: e.target.value})}
                    />
                  </FormControl>
                  <Button colorScheme="green" w="full" onClick={handleCreateCampaign}>
                    Create Campaign
                  </Button>
                </VStack>
              </Box>

              {/* List */}
              <Box flex={1}>
                <Heading size="md" mb={4}>Active Campaigns</Heading>
                <Table size="sm">
                  <Thead>
                    <Tr>
                      <Th>Campaign ID</Th>
                      <Th>Voucher</Th>
                      <Th>Funnel</Th>
                      <Th isNumeric>Disc. Working</Th>
                      <Th isNumeric>Disc. Base</Th>
                      <Th>Valid Until</Th>
                      <Th>Status</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {marketingCampaigns.map(c => (
                      <Tr key={c.id}>
                        <Td fontSize="xs">{c.campaign_id}</Td>
                        <Td fontWeight="bold">{c.voucher_code}</Td>
                        <Td>{c.funnel_id}</Td>
                        <Td isNumeric>{c.discount_working_price_ct} ct</Td>
                        <Td isNumeric>{c.discount_base_price_eur} €</Td>
                        <Td>{new Date(c.end_date).toLocaleDateString()}</Td>
                        <Td><Badge colorScheme={c.is_active ? 'green' : 'red'}>{c.is_active ? 'Active' : 'Inactive'}</Badge></Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              </Box>
            </HStack>
          </TabPanel>
        </TabPanels>
      </Tabs>

      {/* Edit Modal */}
      <Modal isOpen={isEditOpen} onClose={() => setIsEditOpen(false)}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Edit MaLo Draft</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {editingMaLo && (
              <VStack spacing={4}>
                <FormControl>
                  <FormLabel>Market Location ID</FormLabel>
                  <Input 
                    value={editingMaLo.market_location_identifier} 
                    onChange={e => setEditingMaLo({...editingMaLo, market_location_identifier: e.target.value})}
                  />
                </FormControl>
                <FormControl>
                  <FormLabel>Meter Number</FormLabel>
                  <Input 
                    value={editingMaLo.meter_number} 
                    onChange={e => setEditingMaLo({...editingMaLo, meter_number: e.target.value})}
                  />
                </FormControl>
                <FormControl>
                  <FormLabel>Annual Consumption</FormLabel>
                  <Input 
                    type="number"
                    value={editingMaLo.previous_annual_consumption} 
                    onChange={e => setEditingMaLo({...editingMaLo, previous_annual_consumption: parseInt(e.target.value)})}
                  />
                </FormControl>
                <FormControl display="flex" alignItems="center">
                  <FormLabel mb="0">Has Own MSB?</FormLabel>
                  <Switch 
                    isChecked={editingMaLo.has_own_msb}
                    onChange={e => setEditingMaLo({...editingMaLo, has_own_msb: e.target.checked})}
                  />
                </FormControl>
              </VStack>
            )}
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={() => setIsEditOpen(false)}>Cancel</Button>
            <Button colorScheme="blue" onClick={saveMaLoChanges}>Save Changes</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Container>
  );
};

export default OpsDashboard;
