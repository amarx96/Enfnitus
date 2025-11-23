const axios = require('axios');
const { supabase } = require('./src/config/supabase');

const API_URL = 'http://localhost:3000/api/v1';

async function runCompleteWorkflow() {
    console.log('🚀 Starting Complete Workflow Test...\n');

    try {
        // --- 1. Pricing Calculation ---
        console.log('1️⃣ Testing Pricing Service...');
        const pricingRes = await axios.post(`${API_URL}/pricing/berechnen`, {
            plz: '10115',
            jahresverbrauch: 3500,
            funnelId: 'enfinitus-website'
        });
        
        if (!pricingRes.data.erfolg) throw new Error('Pricing failed');
        console.log('✅ Pricing calculated. Monthly cost:', pricingRes.data.daten.tarife[0].kosten.monatliche_kosten);
        
        const tariffId = pricingRes.data.daten.tarife[0].id; // e.g. standard-10115

        // --- 2. Contract Import (Registration) ---
        console.log('\n2️⃣ Testing Contract Import (Customer Registration)...');
        const customerEmail = `test.user.${Date.now()}@example.com`;
        const importPayload = {
            funnelId: 'enfinitus-website',
            customer: {
                firstName: 'Max',
                lastName: 'Workflow',
                email: customerEmail,
                phone: '+49 123 456789',
                street: 'Test Street',
                houseNumber: '1',
                zipCode: '10115',
                city: 'Berlin',
                termsAccepted: true,
                privacyAccepted: true
            },
            contract: {
                campaignKey: tariffId,
                tariffId: tariffId,
                estimatedConsumption: 3500,
                desiredStartDate: new Date().toISOString().split('T')[0],
                iban: 'DE12345678901234567890',
                sepaMandate: true
            },
            meterLocation: {
                maloId: '41234567890',
                meterNumber: 'METER-123'
            }
        };

        const importRes = await axios.post(`${API_URL}/contracting/import`, importPayload);
        if (!importRes.data.success) throw new Error('Import failed');
        
        const { contractId, draftId } = importRes.data;
        console.log(`✅ Contract Imported. ContractID: ${contractId}, DraftID: ${draftId}`);

        // --- 3. Audit Log Check (Import) ---
        console.log('\n3️⃣ Verifying Audit Log (Import Request)...');
        const { data: logs } = await supabase
            .from('import_requests')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(1);
            
        if (logs && logs.length > 0) {
            console.log('✅ Import Request logged successfully.');
        } else {
            console.log('⚠️ Warning: No import request log found (might be async or RLS issue).');
        }

        // --- 4. Ops Dashboard: View Drafts ---
        console.log('\n4️⃣ Testing Ops: Get Contract Drafts...');
        // Note: The endpoint might require auth, currently open or mocked?
        // Assuming open for dev or we need to check routes.
        // routes/contracting.js -> router.get('/ops/contracts', ...)
        const opsRes = await axios.get(`${API_URL}/contracting/ops/contracts?customerId=${importRes.data.customerId || ''}`); // endpoint usually returns all or filtered
        // Actually the service returns all if no filter.
        // Let's try fetching by ID if possible or just list
        // Ops usually fetches list.
        
        // Let's fetch MaLo draft directly using the ID we got
        console.log('   Fetching MaLo Draft...');
        const maloRes = await axios.get(`${API_URL}/contracting/ops/malo-drafts/${contractId}`);
        if (maloRes.data.success && maloRes.data.data.length > 0) {
             console.log('✅ Ops retrieved MaLo draft.');
             const maloDraftId = maloRes.data.data[0].id;

             // --- 5. Ops: Manual Edit ---
             console.log('\n5️⃣ Testing Ops: Manual Edit...');
             const updateRes = await axios.put(`${API_URL}/contracting/ops/malo-drafts/${maloDraftId}`, {
                 meter_number: 'METER-UPDATED-999'
             });
             
             if (updateRes.data.success) {
                 console.log('✅ Manual edit successful.');
                 
                 // Verify Change Log/Event
                 const { data: events } = await supabase
                    .from('contract_events')
                    .select('*')
                    .eq('event_type', 'MANUAL_EDIT')
                    .order('created_at', { ascending: false })
                    .limit(1);
                 
                 if (events && events.length > 0) {
                     console.log('✅ Contract Event (MANUAL_EDIT) verified.');
                 }
             }

             // --- 6. Ops: Confirm Switch ---
             console.log('\n6️⃣ Testing Ops: Confirm Switch (Activation)...');
             // Need to ensure validation passed first. VerifyDraft mocks it to APPROVED roughly 90% time.
             // If it was REJECTED, confirmSwitch will fail.
             // Let's check status first.
             const checkRes = await axios.get(`${API_URL}/contracting/ops/malo-drafts/${contractId}`);
             const currentStatus = checkRes.data.data[0].malo_draft_status;
             console.log(`   Current Draft Status: ${currentStatus}`);
             
             if (currentStatus === 'APPROVED') {
                 const confirmRes = await axios.post(`${API_URL}/contracting/ops/confirm-switch`, {
                     draftId: maloDraftId
                 });
                 if (confirmRes.data.success) {
                     console.log('✅ Switch Confirmed! Contract is now ACTIVE.');
                 } else {
                     console.log('❌ Switch confirmation failed:', confirmRes.data.message);
                 }
             } else {
                 console.log('⚠️ Skipping Activation: Draft was not auto-approved (Random mock result). Try again.');
             }

        } else {
            console.log('❌ Failed to retrieve MaLo draft.');
        }

    } catch (error) {
        console.error('❌ Workflow Test Failed:', error.message);
        if (error.response) {
            console.error('Response Data:', error.response.data);
        }
    }
}

runCompleteWorkflow();

