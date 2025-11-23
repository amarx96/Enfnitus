const contractingService = require('../../src/services/contractingService');
const database = require('../../src/config/database');

// Mock dependencies
jest.mock('../../src/config/database');
jest.mock('../../src/utils/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
}));

describe('ContractingService', () => {
  let mockClient;

  beforeEach(() => {
    mockClient = {
      query: jest.fn(),
      release: jest.fn(),
    };
    database.connect.mockResolvedValue(mockClient);
    jest.clearAllMocks();
  });

  describe('importContract', () => {
    const mockData = {
      funnelId: 'test-funnel',
      customer: {
        email: 'test@example.com',
        firstName: 'Max',
        lastName: 'Mustermann',
      },
      contract: {
        campaignKey: 'FIX12_TEST',
        tariffId: 'tariff-1',
        estimatedConsumption: 2500,
        desiredStartDate: '2024-01-01',
      },
      meterLocation: {
        maloId: 'DE123',
        meterNumber: 'M123',
      },
    };

    it('should successfully import a contract', async () => {
      // Mock sequence of DB calls
      mockClient.query
        .mockResolvedValueOnce({ rows: [] }) // BEGIN
        .mockResolvedValueOnce({ rows: [] }) // Customer lookup (not found)
        .mockResolvedValueOnce({ rows: [{ id: 'cust-123' }] }) // Create customer
        .mockResolvedValueOnce({ rows: [{ id: 'camp-123', energy_price_ct_kwh: 30, base_price_eur_month: 10 }] }) // Campaign lookup
        .mockResolvedValueOnce({ rows: [{ id: 'draft-123' }] }) // Contract draft
        .mockResolvedValueOnce({ rows: [{ id: 'malo-123' }] }) // MaLo draft
        .mockResolvedValueOnce({ rows: [] }); // COMMIT

      // Mock verifyDraft (async)
      const verifySpy = jest.spyOn(contractingService, 'verifyDraft').mockImplementation(() => Promise.resolve());

      const result = await contractingService.importContract(mockData);

      expect(result.success).toBe(true);
      expect(result.contractId).toContain('CONT-');
      expect(mockClient.query).toHaveBeenCalledWith('BEGIN');
      expect(mockClient.query).toHaveBeenCalledWith('COMMIT');
      expect(mockClient.release).toHaveBeenCalled();
    });

    it('should rollback on error', async () => {
      mockClient.query.mockRejectedValueOnce(new Error('DB Error'));

      await expect(contractingService.importContract(mockData)).rejects.toThrow('DB Error');
      expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK');
      expect(mockClient.release).toHaveBeenCalled();
    });
  });

  describe('confirmSwitch', () => {
    const draftId = 'draft-123';
    const adminId = 'admin-1';

    it('should confirm switch and migrate data', async () => {
      const mockDraft = {
        contract_draft_id: 'draft-123',
        contract_id: 'CONT-123',
        customer_id: 'cust-123',
        malo_draft_status: 'APPROVED',
        working_price_ct_kwh: 30,
        fix_fee_eur_month: 10,
        expected_consumption: 2500,
        desired_contract_change_date: '2024-01-01',
        expected_contract_end_date: '2025-01-01'
      };

      mockClient.query
        .mockResolvedValueOnce({ rows: [] }) // BEGIN
        .mockResolvedValueOnce({ rows: [mockDraft] }) // Get Draft
        .mockResolvedValueOnce({ rows: [{ id: 'pricing-1' }] }) // Create Pricing
        .mockResolvedValueOnce({ rows: [{ id: 'contract-final-1' }] }) // Create Contract
        .mockResolvedValueOnce({ rows: [] }) // Create Customer MaLo
        .mockResolvedValueOnce({ rows: [] }) // Update Draft Status
        .mockResolvedValueOnce({ rows: [] }); // COMMIT

      const result = await contractingService.confirmSwitch(draftId, adminId);

      expect(result.success).toBe(true);
      expect(mockClient.query).toHaveBeenCalledWith('COMMIT');
    });

    it('should fail if draft is not approved', async () => {
      mockClient.query
        .mockResolvedValueOnce({ rows: [] }) // BEGIN
        .mockResolvedValueOnce({ rows: [{ malo_draft_status: 'PENDING' }] }); // Get Draft

      await expect(contractingService.confirmSwitch(draftId, adminId)).rejects.toThrow('MaLo draft is not approved');
      expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK');
    });
  });
});
