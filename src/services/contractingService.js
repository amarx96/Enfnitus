const { supabase } = require('../config/supabase');
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
    // Check if we should use Mock Mode (if Supabase key is missing or explicit env var)
    if (process.env.MOCK_MODE === 'true') {
       logger.warn('Running in MOCK mode (Configured via ENV)');
       return this.mockImportContract(data);
    }

    try {
      // 0. Log Import Request
      await supabase.from('import_requests').insert([{
          payload: data,
          processed_successfully: false
      }]);

      const {
        funnelId,
        customer,
        contract,
        meterLocation
      } = data;

      logger.info(`Importing contract for customer ${customer.email} from funnel ${funnelId}`);

      // 1. Find or Create Customer
      let customerId;
      const { data: existingCustomer, error: custErr } = await supabase
        .from('customers')
        .select('id')
        .eq('email', customer.email)
        .single();

      if (existingCustomer) {
        customerId = existingCustomer.id;
      } else {
        const { data: newCustomer, error: createCustErr } = await supabase
          .from('customers')
          .insert([{
            vorname: customer.firstName,
            nachname: customer.lastName,
            email: customer.email,
            telefon: customer.phone,
            strasse: customer.street,
            hausnummer: customer.houseNumber,
            plz: customer.zipCode,
            ort: customer.city
          }])
          .select('id')
          .single();
        
        if (createCustErr) throw createCustErr;
        customerId = newCustomer.id;
      }

      // 2. Match Campaign (Tariff)
      let campaignKey = contract.campaignKey;
      
      // Map Frontend Tariff IDs to Database Campaign Keys
      if (campaignKey) {
          const keyLower = campaignKey.toLowerCase();
          if (keyLower.includes('standard')) campaignKey = 'FIX12_BERLIN_2024';
          else if (keyLower.includes('fix24')) campaignKey = 'FIX24_BERLIN_2024';
          else if (keyLower.includes('dynamic')) campaignKey = 'DYN_BERLIN_2024';
          else if (keyLower.includes('green')) campaignKey = 'FIX12_BERLIN_2024';
      }

      const { data: campaign, error: campErr } = await supabase
        .from('campaigns')
        .select('*')
        .eq('campaign_key', campaignKey)
        .single();

      if (campErr || !campaign) {
        throw new Error(`Campaign not found for key: ${campaignKey} (Original: ${contract.campaignKey})`);
      }

      // 3. Handle Voucher / Marketing Campaign
      let marketingCampaignId = null;
      let workingPrice = parseFloat(campaign.energy_price_ct_kwh);
      let basePrice = parseFloat(campaign.base_price_eur_month);

      if (contract.voucherCode) {
        const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
        const { data: voucher, error: voucherErr } = await supabase
            .from('marketing_campaigns')
            .select('*')
            .eq('voucher_code', contract.voucherCode)
            .eq('is_active', true)
            .lte('start_date', today)
            .gte('end_date', today)
            .single();

        if (voucher) {
          // Check funnel restriction if applicable
          if (!voucher.funnel_id || voucher.funnel_id === funnelId) {
            marketingCampaignId = voucher.id;
            workingPrice -= parseFloat(voucher.discount_working_price_ct);
            basePrice -= parseFloat(voucher.discount_base_price_eur);
            
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
      const { data: marginData } = await supabase
        .from('pricing_margins')
        .select('*')
        .eq('funnel_id', funnelId)
        .eq('tariff_type', tariffType)
        .single();
      
      if (marginData) margin = marginData;

      const finalAp = rabotTariff.energy_price_ct_kwh + parseFloat(margin.margin_working_price_ct || 0);
      const finalGp = rabotTariff.base_price_eur_month + parseFloat(margin.margin_base_price_eur || 0);

      let snapshotId = null;
      try {
          // Create Snapshot
          const { data: snapshot, error: snapErr } = await supabase
            .from('tariff_price_snapshots')
            .insert([{
                funnel_id: funnelId, 
                tariff_type: tariffType, 
                zip_code: zipCode,
                rabot_working_price_ct: rabotTariff.energy_price_ct_kwh, 
                rabot_base_price_eur: rabotTariff.base_price_eur_month,
                margin_working_price_ct: margin.margin_working_price_ct || 0, 
                margin_base_price_eur: margin.margin_base_price_eur || 0,
                final_working_price_ct: finalAp, 
                final_base_price_eur: finalGp
            }])
            .select('id')
            .single();
            
          if (snapshot) snapshotId = snapshot.id;
      } catch (e) {
          logger.warn('Failed to create tariff snapshot', e);
      }

      // 4. Create Contract ID
      const contractIdGen = `CONT-${customerId.substring(0,8)}-${campaign.id.substring(0,8)}-${Date.now()}`;

      // 5. Create Contract Draft
      const { data: contractDraft, error: draftErr } = await supabase
        .from('contract_drafts')
        .insert([{
          contract_id: contractIdGen,
          funnel_id: funnelId,
          customer_id: customerId,
          campaign_id: campaign.id,
          tariff_id: contract.tariffId,
          working_price_ct_kwh: workingPrice,
          fix_fee_eur_month: basePrice,
          expected_consumption: contract.estimatedConsumption,
          contract_draft_date: new Date().toISOString(),
          desired_contract_change_date: contract.desiredStartDate,
          schufa_status: 'PENDING',
          iban: contract.iban,
          sepa_mandate: contract.sepaMandate || false,
          status: 'DRAFT',
          marketing_campaign_id: marketingCampaignId,
          tariff_snapshot_id: snapshotId
        }])
        .select('id')
        .single();

      if (draftErr) throw draftErr;
      const contractDraftId = contractDraft.id;

      // 6. Create MaLo Draft
      const { error: maloErr } = await supabase
        .from('malo_drafts')
        .insert([{
          customer_id: customerId,
          contract_draft_id: contractDraftId,
          market_location_identifier: meterLocation.maloId,
          has_own_msb: meterLocation.hasOwnMsb || false,
          meter_number: meterLocation.meterNumber,
          previous_provider_code: meterLocation.previousProviderId,
          previous_annual_consumption: meterLocation.previousConsumption,
          malo_draft_status: 'PENDING'
        }]);

      if (maloErr) {
          // Rollback attempt (delete draft) - Basic compensation logic
          await supabase.from('contract_drafts').delete().eq('id', contractDraftId);
          throw maloErr;
      }

      logger.info(`Contract import successful. Draft ID: ${contractDraftId}`);

      // Audit: Draft Created
      await supabase.from('contract_events').insert([{
          contract_id: contractIdGen,
          event_type: 'DRAFT_CREATED',
          details: { draftId: contractDraftId, funnelId }
      }]);

      this.verifyDraft(contractDraftId).catch(err => logger.error('Verification failed', err));

      return {
        success: true,
        contractId: contractIdGen,
        draftId: contractDraftId
      };

    } catch (error) {
      logger.error('Import failed', error);
      // If connection failed completely, fall back to mock?
      if (error.message.includes('FetchError') || error.message.includes('connection')) {
          return this.mockImportContract(data);
      }
      throw error;
    }
  }

  mockImportContract(data) {
       const contractDraftId = `MOCK-DRAFT-${Date.now()}`;
       const contractId = `MOCK-CONT-${Date.now()}`;
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
       return { success: true, contractId, draftId: contractDraftId };
  }

  /**
   * Verify a draft (Mocking SCHUFA and MaLo checks)
   */
  async verifyDraft(draftId) {
    logger.info(`Starting verification for draft ${draftId}`);
    
    const schufaScore = Math.random() > 0.1; 
    const schufaStatus = schufaScore ? 'APPROVED' : 'REJECTED';

    await supabase
      .from('contract_drafts')
      .update({ schufa_status: schufaStatus })
      .eq('id', draftId);

    await supabase
      .from('malo_drafts')
      .update({ 
          schufa_score_accepted: schufaScore,
          malo_draft_status: schufaScore ? 'APPROVED' : 'REJECTED'
      })
      .eq('contract_draft_id', draftId);

    logger.info(`Verification completed for draft ${draftId}: ${schufaStatus}`);
    
    // Audit: Validation Result
    // Need contract_id? We only have draftId here. 
    // Ideally we'd fetch contract_id, but for simplicity let's trust later steps or query it.
    // Querying contract_id from draftId
    const { data: draft } = await supabase.from('contract_drafts').select('contract_id').eq('id', draftId).single();
    if (draft) {
        await supabase.from('contract_events').insert([{
            contract_id: draft.contract_id,
            event_type: schufaStatus === 'APPROVED' ? 'VALIDATION_PASSED' : 'VALIDATION_FAILED',
            details: { schufaScore: schufaScore, automatic: true }
        }]);
    }
  }

  async updateMaLoDraft(id, updates, userId) {
    // Mock check
    if (id.startsWith('MOCK')) return { success: true };

    const { error } = await supabase
      .from('malo_drafts')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id);
      
    if (error) throw error;

    // Audit: Manual Edit
    // Get contract_id via join
    const { data: draft } = await supabase
        .from('malo_drafts')
        .select('contract_drafts(contract_id)')
        .eq('id', id)
        .single();
    
    if (draft && draft.contract_drafts) {
         await supabase.from('contract_events').insert([{
            contract_id: draft.contract_drafts.contract_id,
            event_type: 'MANUAL_EDIT',
            performed_by: userId || 'OPS_USER',
            details: { updates }
        }]);
    }

    return { success: true };
  }

  async confirmSwitch(draftId, adminId) {
    if (draftId.startsWith('MOCK')) return { success: true, message: 'Switch process initiated (MOCKED)' };

    // Get verified draft data
    const { data: draft, error } = await supabase
        .from('malo_drafts')
        .select(`
            *,
            contract_drafts (*)
        `)
        .eq('id', draftId)
        .single();

    if (error || !draft) throw new Error('Draft not found');
    
    const contractDraft = draft.contract_drafts; // Joined data

    if (draft.malo_draft_status !== 'APPROVED') {
        throw new Error('MaLo draft is not approved yet');
    }

    // 1. Create Final Contract
    const { data: contract, error: contErr } = await supabase
        .from('contracts')
        .insert([{
            customer_id: contractDraft.customer_id,
            contract_id: contractDraft.contract_id,
            status: 'active',
            marketing_campaign_id: contractDraft.marketing_campaign_id,
            tariff_snapshot_id: contractDraft.tariff_snapshot_id,
            created_at: new Date().toISOString()
        }])
        .select('id')
        .single();
        
    if (contErr) throw contErr;

    // 2. Move to Customer MaLo
    const { error: maloErr } = await supabase
        .from('customer_malo')
        .insert([{
            customer_id: contractDraft.customer_id,
            contract_id: contractDraft.id, // draft ID used as reference currently
            funnel_id: contractDraft.funnel_id,
            market_location_identifier: draft.market_location_identifier,
            has_own_msb: draft.has_own_msb,
            meter_number: draft.meter_number,
            previous_provider_code: draft.previous_provider_code,
            previous_annual_consumption: draft.previous_annual_consumption,
            possible_supplier_change_date: draft.possible_supplier_change_date,
            schufa_score_accepted: draft.schufa_score_accepted,
            change_process_status: 'IN_PROGRESS'
        }]);
        
    if (maloErr) throw maloErr;

    // 3. Update Contract Draft Status
    await supabase
        .from('contract_drafts')
        .update({ status: 'active' })
        .eq('id', contractDraft.id);

    // Audit: Activated
    await supabase.from('contract_events').insert([{
        contract_id: contractDraft.contract_id,
        event_type: 'ACTIVATED',
        details: { finalContractId: contract.id }
    }]);

    logger.info(`Switch confirmed. Contract ${contractDraft.contract_id} active.`);
    return { success: true, message: 'Switch process initiated' };
  }

  // Ops Getters
  async getCampaigns() {
    const { data } = await supabase.from('campaigns').select('*');
    if (!data) return [];
    return data;
  }

  async getMarketingCampaigns() {
    const { data } = await supabase.from('marketing_campaigns').select('*').order('created_at', { ascending: false });
    if (!data) return this.mockMarketingCampaigns;
    return data;
  }

  async createMarketingCampaign(data) {
    const campaignId = `CAMP-${data.voucherCode}-${new Date().getFullYear()}`;
    
    const { error } = await supabase
        .from('marketing_campaigns')
        .insert([{
          campaign_id: campaignId,
          voucher_code: data.voucherCode,
          funnel_id: data.funnelId,
          discount_working_price_ct: data.discountWorkingPrice,
          discount_base_price_eur: data.discountBasePrice,
          start_date: data.startDate,
          end_date: data.endDate
        }]);

    if (error) throw error;
    return { success: true, campaignId };
  }

  async getContractDrafts(customerId) {
    let query = supabase.from('contract_drafts').select('*');
    if (customerId) {
      query = query.eq('customer_id', customerId);
    }
    const { data } = await query;
    if (!data) return this.mockContracts;
    return data;
  }

  async getMaLoDrafts(contractId) {
    // Need to join to filter by contract_id string on parent
    // Supabase join syntax: contract_drafts!inner(contract_id)
    const { data } = await supabase
        .from('malo_drafts')
        .select('*, contract_drafts!inner(contract_id)')
        .eq('contract_drafts.contract_id', contractId);
        
    if (!data) return [];
    return data;
  }
}

module.exports = new ContractingService();
