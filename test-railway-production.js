const axios = require('axios');

// Base URL of the production backend on Railway
const API_URL = process.env.API_URL || 'https://enfinitus-production.up.railway.app/api/v1';

async function run() {
  console.log('🚀 Testing Railway → Supabase integration via production backend\n');

  try {
    // 1) Pricing test
    console.log('1️⃣ Pricing /pricing/berechnen');
    const pricingRes = await axios.post(`${API_URL}/pricing/berechnen`, {
      plz: '10115',
      jahresverbrauch: 3500,
      funnelId: 'enfinitus-website',
    });

    if (!pricingRes.data.erfolg) {
      throw new Error('Pricing failed: ' + (pricingRes.data.nachricht || 'unknown error'));
    }

    const firstTariff = pricingRes.data.daten.tarife[0];
    console.log('   ✅ Pricing OK. First tariff ID:', firstTariff.id, 'Monatlich:', firstTariff.kosten?.monatliche_kosten);

    const tariffId = firstTariff.id;

    // 2) Contract import test (writes to Supabase)
    console.log('\n2️⃣ Contract Import /contracting/import');

    const uniqueEmail = `railway.test.${Date.now()}@example.com`;

    const importPayload = {
      funnelId: 'enfinitus-website',
      customer: {
        firstName: 'Railway',
        lastName: 'Test',
        email: uniqueEmail,
        phone: '+49 30 123456',
        street: 'Teststrasse',
        houseNumber: '1',
        zipCode: '10115',
        city: 'Berlin',
        termsAccepted: true,
        privacyAccepted: true,
      },
      contract: {
        campaignKey: tariffId,
        tariffId,
        estimatedConsumption: 3500,
        desiredStartDate: new Date().toISOString().split('T')[0],
        iban: 'DE12345678901234567890',
        sepaMandate: true,
      },
      meterLocation: {
        maloId: '41234567890',
        meterNumber: 'METER-RAILWAY-TEST',
      },
    };

    const importRes = await axios.post(`${API_URL}/contracting/import`, importPayload);

    if (!importRes.data.success) {
      console.error('❌ Import failed:', importRes.data);
      throw new Error(importRes.data.message || 'Import failed');
    }

    console.log('   ✅ Import OK. ContractID:', importRes.data.contractId, 'DraftID:', importRes.data.draftId);

    console.log('\n✅ Railway → Supabase integration looks good (Pricing + Contract Import succeeded).\n');
  } catch (err) {
    console.error('\n❌ Integration test failed:', err.message);
    if (err.response) {
      console.error('Status:', err.response.status);
      console.error('Response data:', err.response.data);
    }
  }
}

run();


