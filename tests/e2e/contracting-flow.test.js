const request = require('supertest');
const express = require('express');
const bodyParser = require('body-parser');
const contractingRoutes = require('../../src/routes/contracting');
const database = require('../../src/config/database');

// Mock Database
jest.mock('../../src/config/database');
jest.mock('../../src/utils/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
}));

// Setup App
const app = express();
app.use(bodyParser.json());
app.use('/api/v1/contracting', contractingRoutes);

describe('E2E Contracting Architecture Flow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock Database Connect
    const mockClient = {
      query: jest.fn(),
      release: jest.fn(),
    };
    database.connect.mockResolvedValue(mockClient);
    database.query = mockClient.query; // Allow direct query usage if any
  });

  test('Complete Flow: Import -> Ops View -> Switch', async () => {
    const mockClient = await database.connect();

    // 1. Import Contract
    const importPayload = {
      funnelId: 'e2e-test',
      customer: { email: 'e2e@test.com' },
      contract: { campaignKey: 'FIX12', estimatedConsumption: 2000 },
      meterLocation: { maloId: 'DE123' }
    };

    // Mock DB calls for Import
    mockClient.query
      // Import Sequence
      .mockResolvedValueOnce({ rows: [] }) // BEGIN
      .mockResolvedValueOnce({ rows: [{ id: 'cust-e2e' }] }) // Customer exists/created
      .mockResolvedValueOnce({ rows: [{ id: 'camp-e2e', energy_price_ct_kwh: 30, base_price_eur_month: 10 }] }) // Campaign
      .mockResolvedValueOnce({ rows: [{ id: 'draft-e2e' }] }) // Contract Draft
      .mockResolvedValueOnce({ rows: [{ id: 'malo-e2e' }] }) // MaLo Draft
      .mockResolvedValueOnce({ rows: [] }); // COMMIT

    const importRes = await request(app)
      .post('/api/v1/contracting/import')
      .send(importPayload)
      .expect(201);

    expect(importRes.body.success).toBe(true);
    expect(importRes.body.draftId).toBe('draft-e2e');

    // 2. Ops View - Get MaLo Drafts
    // Mock DB for Ops View
    mockClient.query.mockResolvedValueOnce({ 
      rows: [{ id: 'malo-e2e', malo_draft_status: 'APPROVED', market_location_identifier: 'DE123' }] 
    });

    const opsRes = await request(app)
      .get('/api/v1/contracting/ops/malo-drafts/CONT-SOME-ID')
      .expect(200);

    expect(opsRes.body.data[0].id).toBe('malo-e2e');

    // 3. Confirm Switch
    // Mock DB calls for Confirm
    mockClient.query
      // Confirm Sequence
      .mockResolvedValueOnce({ rows: [] }) // BEGIN
      .mockResolvedValueOnce({ 
        rows: [{ 
          contract_draft_id: 'draft-e2e',
          malo_draft_status: 'APPROVED',
          customer_id: 'cust-e2e',
          contract_id: 'CONT-123'
        }] 
      }) // Get Draft Data
      .mockResolvedValueOnce({ rows: [{ id: 'pricing-e2e' }] }) // Pricing Data
      .mockResolvedValueOnce({ rows: [{ id: 'contract-final-e2e' }] }) // Final Contract
      .mockResolvedValueOnce({ rows: [] }) // Customer MaLo
      .mockResolvedValueOnce({ rows: [] }) // Update Draft Status
      .mockResolvedValueOnce({ rows: [] }); // COMMIT

    const confirmRes = await request(app)
      .post('/api/v1/contracting/ops/confirm-switch')
      .send({ draftId: 'draft-e2e' })
      .expect(200);

    expect(confirmRes.body.success).toBe(true);
  });
});
