const database = require('../config/database');
const { v4: uuidv4 } = require('uuid');
const logger = require('../utils/logger');
const rabotPricingService = require('./rabotPricingService');

class ContractingService {
  constructor() {
    this.mockContracts = [];
    this.mockMaLos = [];
    this.mockMarketingCampaigns = [];
  }
  
  /**
   * Import a contract from the sales funnel
   * @param {Object} data - The import data
   */
  async importContract(data) {
    const pool = await database.connect();
    if (!pool) {
       logger.warn('Database connection disabled: Running in MOCK mode');
       const contractDraftId = `MOCK-DRAFT-${Date.now()}`;
       const contractId = `MOCK-CONT-${Date.now()}`;
       
       // Store in mock storage
       this.mockContracts.push({
           id: contractDraftId,
           contract_id: contractId,
           funnel_id: data.funnelId,
           customer_id: `MOCK-CUST-${Date.now()}`,
           status: 'DRAFT',
           created_at: new Date(),
           schufa_status: 'PENDING'
       });

       this.mockMaLos.push({
           id: `MOCK-MALO-${Date.now()}`,
           contract_draft_id: contractDraftId,
           market_location_identifier: data.meterLocation.maloId || '12345678901',
           malo_draft_status: 'PENDING'
       });

       return {
         success: true,
         contractId: contractId,
         draftId: contractDraftId
       };
    }

    let client = null;
    try {
      client = await pool.connect();
      await client.query('BEGIN');

      const {
        funnelId,
        customer,
        contract,
        meterLocation
      } = data;

      logger.info(`Importing contract for customer ${customer.email} from funnel ${funnelId}`);

      // 1. Find or Create Customer
      let customerId;
      const customerRes = await client.query(
        'SELECT id FROM customers WHERE email = $1',
        [customer.email]
      );

      if (customerRes.rows.length > 0) {
        customerId = customerRes.rows[0].id;
      } else {
        const newCustomer = await client.query(`
          INSERT INTO customers (vorname, nachname, email, telefon, strasse, hausnummer, plz, ort)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          RETURNING id
        `, [customer.firstName, customer.lastName, customer.email, customer.phone, customer.street, customer.houseNumber, customer.zipCode, customer.city]);
        customerId = newCustomer.rows[0].id;
      }

      // 2. Match Campaign (Tariff)
      const campaignRes = await client.query(
        'SELECT * FROM campaigns WHERE campaign_key = $1',
        [contract.campaignKey]
      );

      if (campaignRes.rows.length === 0) {
        throw new Error(`Campaign not found for key: ${contract.campaignKey}`);
      }
      const campaign = campaignRes.rows[0];

      // 3. Handle Voucher / Marketing Campaign
      let marketingCampaignId = null;
      let workingPrice = parseFloat(campaign.energy_price_ct_kwh);
      let basePrice = parseFloat(campaign.base_price_eur_month);

      if (contract.voucherCode) {
        const voucherRes = await client.query(
          `SELECT * FROM marketing_campaigns 
           WHERE voucher_code = $1 
           AND is_active = true 
           AND start_date <= CURRENT_DATE 
           AND end_date >= CURRENT_DATE`,
          [contract.voucherCode]
        );

        if (voucherRes.rows.length > 0) {
          const voucher = voucherRes.rows[0];
          
          // Check funnel restriction if applicable
          if (!voucher.funnel_id || voucher.funnel_id === funnelId) {
            marketingCampaignId = voucher.id;
            workingPrice -= parseFloat(voucher.discount_working_price_ct);
            basePrice -= parseFloat(voucher.discount_base_price_eur);
            
            // Ensure prices don't go negative (optional, but good practice)
            workingPrice = Math.max(0, workingPrice);
            basePrice = Math.max(0, basePrice);
            
            logger.info(`Applied voucher ${contract.voucherCode} to contract.`);
          } else {
            logger.warn(`Voucher ${contract.voucherCode} not valid for funnel ${funnelId}`);
          }
        } else {
          logger.warn(`Voucher ${contract.voucherCode} invalid or expired.`);
        }
      }

      // --- Calculate Price Snapshot ---
      const zipCode = customer.zipCode || meterLocation.maloId?.substring(0,5) || '10115'; 
      let tariffType = 'FIX12'; // Default
      if (contract.tariffId && (contract.tariffId.toLowerCase().includes('green') || contract.tariffId.toLowerCase().includes('oeko'))) tariffType = 'GREEN';
      if (contract.tariffId && (contract.tariffId.toLowerCase().includes('dynamic'))) tariffType = 'DYNAMIC';
      
      // Fetch Rabot Price
      const rabotPricing = await rabotPricingService.getPricing(zipCode);
      let rabotTariffKey = 'standard';
      if (tariffType === 'GREEN') rabotTariffKey = 'green';
      if (tariffType === 'DYNAMIC') rabotTariffKey = 'dynamic';
      const rabotTariff = rabotPricing.tariffs[rabotTariffKey] || rabotPricing.tariffs['standard'];

      // Fetch Margin
      let margin = { margin_working_price_ct: 0, margin_base_price_eur: 0 };
      try {
        const marginRes = await client.query(
            'SELECT * FROM pricing_margins WHERE funnel_id = $1 AND tariff_type = $2',
            [funnelId, tariffType]
        );
        if (marginRes.rows.length > 0) margin = marginRes.rows[0];
      } catch (e) { /* ignore */ }

      const finalAp = rabotTariff.energy_price_ct_kwh + parseFloat(margin.margin_working_price_ct || 0);
      const finalGp = rabotTariff.base_price_eur_month + parseFloat(margin.margin_base_price_eur || 0);

      let snapshotId = null;
      try {
          // Check existing
          const existingRes = await client.query(`
            SELECT id FROM tariff_price_snapshots
            WHERE funnel_id = $1 AND tariff_type = $2 AND zip_code = $3
            AND rabot_working_price_ct = $4 AND rabot_base_price_eur = $5
            AND margin_working_price_ct = $6 AND margin_base_price_eur = $7
            ORDER BY created_at DESC LIMIT 1
          `, [
              funnelId, tariffType, zipCode,
              rabotTariff.energy_price_ct_kwh, rabotTariff.base_price_eur_month,
              margin.margin_working_price_ct || 0, margin.margin_base_price_eur || 0
          ]);
          
          if (existingRes.rows.length > 0) {
              snapshotId = existingRes.rows[0].id;
          } else {
              const snapshotRes = await client.query(`
                INSERT INTO tariff_price_snapshots (
                    funnel_id, tariff_type, zip_code,
                    rabot_working_price_ct, rabot_base_price_eur,
                    margin_working_price_ct, margin_base_price_eur,
                    final_working_price_ct, final_base_price_eur
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                RETURNING id
              `, [
                  funnelId, tariffType, zipCode,
                  rabotTariff.energy_price_ct_kwh, rabotTariff.base_price_eur_month,
                  margin.margin_working_price_ct || 0, margin.margin_base_price_eur || 0,
                  finalAp, finalGp
              ]);
              snapshotId = snapshotRes.rows[0].id;
          }
      } catch (e) {
          logger.warn('Failed to create tariff snapshot', e);
      }

      // 4. Create Contract ID
      const contractId = `CONT-${customerId.substring(0,8)}-${campaign.id.substring(0,8)}-${Date.now()}`;

      // 5. Create Contract Draft
      const contractDraftRes = await client.query(`
        INSERT INTO contract_drafts (
          contract_id, funnel_id, customer_id, campaign_id, tariff_id,
          working_price_ct_kwh, fix_fee_eur_month, expected_consumption,
          contract_draft_date, desired_contract_change_date,
          schufa_status, iban, sepa_mandate, status,
          marketing_campaign_id, tariff_snapshot_id
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), $9, $10, $11, $12, 'DRAFT', $13, $14)
        RETURNING id
      `, [
        contractId,
        funnelId,
        customerId,
        campaign.id,
        contract.tariffId,
        workingPrice,
        basePrice,
        contract.estimatedConsumption,
        contract.desiredStartDate,
        'PENDING',
        contract.iban,
        contract.sepaMandate || false,
        marketingCampaignId,
        snapshotId
      ]);

      const contractDraftId = contractDraftRes.rows[0].id;

      // 6. Create MaLo Draft
      const maloDraftRes = await client.query(`
        INSERT INTO malo_drafts (
          customer_id, contract_draft_id,
          market_location_identifier, has_own_msb, meter_number,
          previous_provider_code, previous_annual_consumption,
          malo_draft_status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'PENDING')
        RETURNING id
      `, [
        customerId,
        contractDraftId,
        meterLocation.maloId,
        meterLocation.hasOwnMsb || false,
        meterLocation.meterNumber,
        meterLocation.previousProviderId,
        meterLocation.previousConsumption
      ]);

      await client.query('COMMIT');
      logger.info(`Contract import successful. Draft ID: ${contractDraftId}`);

      this.verifyDraft(contractDraftId).catch(err => logger.error('Verification failed', err));

      return {
        success: true,
        contractId: contractId,
        draftId: contractDraftId
      };

    } catch (error) {
      if (client) await client.query('ROLLBACK');
      logger.error('Import failed', error);
      throw error;
    } finally {
      if (client) client.release();
    }
  }

  // ... (verifyDraft, logChange, updateMaLoDraft remain same) ...
  
  /**
   * Verify a draft (Mocking SCHUFA and MaLo checks)
   */
  async verifyDraft(draftId) {
    logger.info(`Starting verification for draft ${draftId}`);
    const pool = await database.connect();
    if (!pool) return;

    let client = null;
    try {
      client = await pool.connect();
      const schufaScore = Math.random() > 0.1; 
      const schufaStatus = schufaScore ? 'APPROVED' : 'REJECTED';

      await client.query(
        'UPDATE contract_drafts SET schufa_status = $1 WHERE id = $2',
        [schufaStatus, draftId]
      );

      await client.query(
        'UPDATE malo_drafts SET schufa_score_accepted = $1 WHERE contract_draft_id = $2',
        [schufaScore, draftId]
      );
      
      if (schufaScore) {
        await client.query(
          'UPDATE malo_drafts SET malo_draft_status = $1 WHERE contract_draft_id = $2',
          ['APPROVED', draftId] 
        );
      } else {
         await client.query(
          'UPDATE malo_drafts SET malo_draft_status = $1 WHERE contract_draft_id = $2',
          ['REJECTED', draftId]
        );
      }

      logger.info(`Verification completed for draft ${draftId}: ${schufaStatus}`);

    } catch (error) {
      logger.error('Verification error', error);
    } finally {
      if (client) client.release();
    }
  }

  async logChange(client, tableName, recordId, fieldName, oldValue, newValue, changedBy) {
    await client.query(`
      INSERT INTO change_logs (table_name, record_id, field_name, old_value, new_value, changed_by)
      VALUES ($1, $2, $3, $4, $5, $6)
    `, [tableName, recordId, fieldName, String(oldValue), String(newValue), changedBy]);
  }

  async updateMaLoDraft(id, updates, userId) {
    const pool = await database.connect();
    if (!pool) {
      logger.warn('Database disabled, mocking updateMaLoDraft');
      return { success: true };
    }
    
    let client = null;
    try {
      client = await pool.connect();
      await client.query('BEGIN');
      const currentRes = await client.query('SELECT * FROM malo_drafts WHERE id = $1', [id]);
      const current = currentRes.rows[0];
      const fields = Object.keys(updates);
      const values = Object.values(updates);
      const setClause = fields.map((f, i) => `${f.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`)} = $${i + 2}`).join(', ');
      await client.query(
        `UPDATE malo_drafts SET ${setClause}, updated_at = NOW() WHERE id = $1`,
        [id, ...values]
      );
      for (const field of fields) {
        const dbField = field.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
        if (current[dbField] !== updates[field]) {
          await this.logChange(client, 'malo_drafts', id, dbField, current[dbField], updates[field], userId);
        }
      }
      await client.query('COMMIT');
      return { success: true };
    } catch (error) {
      if (client) await client.query('ROLLBACK');
      throw error;
    } finally {
      if (client) client.release();
    }
  }

  /**
   * Confirm Switch / Move to CustomerMaLo AND Final Contracts
   */
  async confirmSwitch(draftId, adminId) {
    const pool = await database.connect();
    if (!pool) {
      logger.warn('Database disabled, mocking confirmSwitch');
      return { success: true, message: 'Switch process initiated (MOCKED)' };
    }

    let client = null;
    try {
      client = await pool.connect();
      await client.query('BEGIN');

      // Get verified draft data
      const draftRes = await client.query(`
        SELECT md.*, cd.*
        FROM malo_drafts md
        JOIN contract_drafts cd ON md.contract_draft_id = cd.id
        WHERE md.contract_draft_id = $1
      `, [draftId]);

      if (draftRes.rows.length === 0) {
        throw new Error('Draft not found');
      }
      const draft = draftRes.rows[0];

      if (draft.malo_draft_status !== 'APPROVED') {
        throw new Error('MaLo draft is not approved yet');
      }

      // 1. Create Pricing Data (Legacy)
      const pricingRes = await client.query(`
        INSERT INTO pricing_data (
          customer_id, plz, verbrauch, haushaltsgroesse, 
          estimated_costs
        ) VALUES ($1, $2, $3, $4, $5)
        RETURNING id
      `, [
        draft.customer_id,
        '00000', 
        draft.expected_consumption,
        1, 
        {
          working_price: draft.working_price_ct_kwh,
          base_price: draft.fix_fee_eur_month
        }
      ]);
      const pricingId = pricingRes.rows[0].id;

      // 2. Create Final Contract (Legacy) with Marketing Link
      // Note: Assuming 'contracts' table has been updated to include marketing_campaign_id by the SQL script
      const contractRes = await client.query(`
        INSERT INTO contracts (
          customer_id, pricing_id, contract_number, 
          status, start_date, end_date, terms_accepted,
          marketing_campaign_id
        ) VALUES ($1, $2, $3, 'ACTIVE', $4, $5, true, $6)
        RETURNING id
      `, [
        draft.customer_id,
        pricingId,
        draft.contract_id,
        draft.desired_contract_change_date,
        draft.expected_contract_end_date,
        draft.marketing_campaign_id
      ]);
      const finalContractId = contractRes.rows[0].id;

      // 3. Move to Customer MaLo
      await client.query(`
        INSERT INTO customer_malo (
          customer_id, contract_id, funnel_id,
          market_location_identifier, has_own_msb, meter_number,
          previous_provider_code, previous_annual_consumption,
          possible_supplier_change_date, schufa_score_accepted,
          change_process_status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'IN_PROGRESS')
      `, [
        draft.customer_id,
        draft.contract_draft_id,
        draft.funnel_id,
        draft.market_location_identifier,
        draft.has_own_msb,
        draft.meter_number,
        draft.previous_provider_code,
        draft.previous_annual_consumption,
        draft.possible_supplier_change_date,
        draft.schufa_score_accepted
      ]);

      // 4. Update Contract Draft Status
      await client.query(
        "UPDATE contract_drafts SET status = 'ACTIVE' WHERE id = $1",
        [draft.contract_draft_id]
      );

      await client.query('COMMIT');

      logger.info(`Switch confirmed. Contract ${draft.contract_id} active.`);
      
      return { success: true, message: 'Switch process initiated' };

    } catch (error) {
      if (client) await client.query('ROLLBACK');
      throw error;
    } finally {
      if (client) client.release();
    }
  }

  // Ops Getters
  async getCampaigns() {
    const pool = await database.connect();
    if (!pool) {
        // Return dummy campaigns
        return [
            { id: 1, campaign_key: 'FIX12', name: 'Fix 12' },
            { id: 2, campaign_key: 'FIX24', name: 'Fix 24' },
            { id: 3, campaign_key: 'DYN', name: 'Dynamic' }
        ];
    }
    const res = await database.query('SELECT * FROM campaigns');
    return res.rows;
  }

  async getMarketingCampaigns() {
    const pool = await database.connect();
    if (!pool) {
        return this.mockMarketingCampaigns;
    }
    const res = await database.query('SELECT * FROM marketing_campaigns ORDER BY created_at DESC');
    return res.rows;
  }

  async createMarketingCampaign(data) {
    const pool = await database.connect();
    if (!pool) {
       logger.warn('Database disabled, mocking createMarketingCampaign');
       const campaignId = `MOCK-CAMP-${Date.now()}`;
       this.mockMarketingCampaigns.push({
           id: campaignId,
           ...data,
           campaign_id: campaignId,
           created_at: new Date()
       });
       return { success: true, campaignId };
    }

    let client = null;
    try {
      client = await pool.connect();
      // Generate Campaign ID
      const campaignId = `CAMP-${data.voucherCode}-${new Date().getFullYear()}`;
      
      await client.query(`
        INSERT INTO marketing_campaigns (
          campaign_id, voucher_code, funnel_id,
          discount_working_price_ct, discount_base_price_eur,
          start_date, end_date
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      `, [
        campaignId,
        data.voucherCode,
        data.funnelId,
        data.discountWorkingPrice,
        data.discountBasePrice,
        data.startDate,
        data.endDate
      ]);
      return { success: true, campaignId };
    } catch (error) {
      logger.error('Create marketing campaign error', error);
      throw error;
    } finally {
      if (client) client.release();
    }
  }

  async getContractDrafts(customerId) {
    const pool = await database.connect();
    if (!pool) {
        if (customerId) {
            return this.mockContracts.filter(c => c.customer_id === customerId);
        }
        return this.mockContracts;
    }
    
    let query = 'SELECT * FROM contract_drafts';
    let params = [];
    if (customerId) {
      query += ' WHERE customer_id = $1';
      params.push(customerId);
    }
    const res = await database.query(query, params);
    return res.rows;
  }

  async getMaLoDrafts(contractId) {
    const pool = await database.connect();
    if (!pool) {
        const draft = this.mockContracts.find(c => c.contract_id === contractId);
        if (!draft) return [];
        return this.mockMaLos.filter(m => m.contract_draft_id === draft.id);
    }

    const res = await database.query(
      `SELECT md.* 
       FROM malo_drafts md
       JOIN contract_drafts cd ON md.contract_draft_id = cd.id
       WHERE cd.contract_id = $1`,
      [contractId]
    );
    return res.rows;
  }
}

module.exports = new ContractingService();