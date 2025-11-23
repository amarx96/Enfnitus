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
  let mockPool;

  beforeEach(() => {
    mockClient = {
      query: jest.fn(),
      release: jest.fn(),
    };
    
    mockPool = {
        connect: jest.fn().mockResolvedValue(mockClient),
        query: jest.fn(), // Fallback if needed
        end: jest.fn()
    };

    // Mock database.connect to return the pool
    database.connect.mockResolvedValue(mockPool);
    
    jest.clearAllMocks();
  });

  describe('importContract', () => {
    const mockData = {
      funnelId: 'test-funnel',
      customer: {
        email: 'test@example.com',
        firstName: 'Max',
        lastName: 'Mustermann',
        phone: '0123456789',
        street: 'Musterstr',
        houseNumber: '1',
        zipCode: '10115',
        city: 'Berlin'
      },
      contract: {
        campaignKey: 'FIX12_TEST',
        tariffId: 'tariff-1',
        estimatedConsumption: 2500,
        desiredStartDate: '2024-01-01',
        iban: 'DE1234567890'
      },
      meterLocation: {
        maloId: 'DE123',
        meterNumber: 'M123',
        previousProviderId: 'PREV123',
        previousConsumption: 2500
      },
    };

    it('should successfully import a contract', async () => {
      // Mock sequence of DB calls
      // 1. Customer check
      // 2. Campaign check
      // 3. Voucher check (optional)
      // 4. Pricing Snapshot creation
      // 5. Contract Draft
      // 6. MaLo Draft
      
      mockClient.query
        .mockResolvedValueOnce({ rows: [] }) // BEGIN
        .mockResolvedValueOnce({ rows: [] }) // Customer lookup (not found)
        .mockResolvedValueOnce({ rows: [{ id: 'cust-123' }] }) // Create customer
        .mockResolvedValueOnce({ rows: [{ id: 'camp-123', energy_price_ct_kwh: 30, base_price_eur_month: 10 }] }) // Campaign lookup
        // .mockResolvedValueOnce({ rows: [] }) // Voucher lookup (if checked) - Assume skipped if no voucher code
        .mockResolvedValueOnce({ rows: [{ id: 'snapshot-123' }] }) // Tariff Snapshot (Find or Create) - This might be multiple calls
        .mockResolvedValueOnce({ rows: [{ id: 'draft-123' }] }) // Contract draft
        .mockResolvedValueOnce({ rows: [{ id: 'malo-123' }] }) // MaLo Draft
        .mockResolvedValueOnce({ rows: [] }); // COMMIT

      // Relax strict call order check or mock generic responses
      mockClient.query.mockResolvedValue({ rows: [{ id: 'generic-id' }] });
      mockClient.query.mockImplementation((sql) => {
          if (sql === 'BEGIN') return Promise.resolve();
          if (sql === 'COMMIT') return Promise.resolve();
          if (sql === 'ROLLBACK') return Promise.resolve();
          if (sql.includes('SELECT id FROM customers')) return Promise.resolve({ rows: [] }); // Customer not found
          if (sql.includes('INSERT INTO customers')) return Promise.resolve({ rows: [{ id: 'cust-123' }] });
          if (sql.includes('SELECT * FROM campaigns')) return Promise.resolve({ rows: [{ id: 'camp-123', energy_price_ct_kwh: 30, base_price_eur_month: 10 }] });
          if (sql.includes('tariff_price_snapshots')) return Promise.resolve({ rows: [{ id: 'snapshot-123' }] });
          if (sql.includes('INSERT INTO contract_drafts')) return Promise.resolve({ rows: [{ id: 'draft-123' }] });
          if (sql.includes('INSERT INTO malo_drafts')) return Promise.resolve({ rows: [{ id: 'malo-123' }] });
          return Promise.resolve({ rows: [] });
      });

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
      mockClient.query.mockImplementation((sql) => {
          if (sql === 'BEGIN') return Promise.resolve();
          throw new Error('DB Error');
      });

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

      mockClient.query.mockImplementation((sql) => {
          if (sql === 'BEGIN') return Promise.resolve();
          if (sql === 'COMMIT') return Promise.resolve();
          if (sql.includes('SELECT md.*')) return Promise.resolve({ rows: [mockDraft] });
          if (sql.includes('INSERT INTO pricing_data')) return Promise.resolve({ rows: [{ id: 'pricing-1' }] });
          if (sql.includes('INSERT INTO contracts')) return Promise.resolve({ rows: [{ id: 'contract-final-1' }] });
          return Promise.resolve({ rows: [] });
      });

      const result = await contractingService.confirmSwitch(draftId, adminId);

      expect(result.success).toBe(true);
      expect(mockClient.query).toHaveBeenCalledWith('COMMIT');
    });

    it('should fail if draft is not approved', async () => {
      mockClient.query.mockImplementation((sql) => {
          if (sql === 'BEGIN') return Promise.resolve();
          if (sql.includes('SELECT md.*')) return Promise.resolve({ rows: [{ malo_draft_status: 'PENDING' }] });
          return Promise.resolve({ rows: [] });
      });

      await expect(contractingService.confirmSwitch(draftId, adminId)).rejects.toThrow('MaLo draft is not approved');
      expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK');
    });
  });
});