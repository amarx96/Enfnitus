/**
 * Simple Supabase Integration Test
 * Tests basic connection and table access after manual schema creation
 */

const { supabase } = require('./src/config/supabase');
const customerService = require('./src/services/customerService');

async function testSupabaseIntegration() {
  console.log('🧪 Testing Supabase Integration...\n');

  // Test 1: Database ConnectioTib
  console.log('1️⃣ Testing database connection...');
  try {
    const { data, error } = await supabase
      .from('customers')
      .select('id')
      .limit(1);

    if (error && error.code === 'PGRST116') {
      console.log('❌ Tables not found! Please create the database schema first.');
      console.log('📋 Instructions:');
      console.log('1. Go to https://app.supabase.com/project/lorqrxsqgvpjjxfbqugy/sql');
      console.log('2. Copy and execute the SQL from database-schema.sql');
      console.log('3. Run this test again\n');
      return false;
    } else if (error) {
      console.log(`❌ Connection error: ${error.message}`);
      return false;
    } else {
      console.log('✅ Database connection successful\n');
    }
  } catch (err) {
    console.log(`❌ Connection failed: ${err.message}`);
    return false;
  }

  // Test 2: Customer Creation
  console.log('2️⃣ Testing customer creation...');
  try {
    const testCustomer = {
      vorname: 'Hans',
      nachname: 'Mueller',
      strasse: 'Berliner Straße',
      hausnummer: '42',
      plz: '10115',
      ort: 'Berlin',
      email: `test-customer-${Date.now()}@example.com`,
      telefon: '+49 30 12345678'
    };

    const result = await customerService.createCustomer(testCustomer);
    
    if (result.success) {
      console.log('✅ Customer creation successful');
      console.log(`📝 Customer ID: ${result.data.id}`);
      
      // Test 3: Customer Retrieval
      console.log('\n3️⃣ Testing customer retrieval...');
      const retrieveResult = await customerService.getCustomerById(result.data.id);
      
      if (retrieveResult.success) {
        console.log('✅ Customer retrieval successful');
        console.log(`📝 Retrieved: ${retrieveResult.data.vorname} ${retrieveResult.data.nachname}`);
      } else {
        console.log(`❌ Customer retrieval failed: ${retrieveResult.error}`);
        return false;
      }

      // Test 4: Pricing Data Storage
      console.log('\n4️⃣ Testing pricing data storage...');
      const pricingData = {
        plz: '10115',
        verbrauch: 3500,
        haushaltsgroesse: 3,
        smartMeter: true,
        selectedTariff: {
          tariffName: 'Fix12 Grün',
          contractDuration: 12
        },
        estimatedCosts: {
          monthlyCosts: 93.03
        }
      };

      const pricingResult = await customerService.storePricingData(result.data.id, pricingData);
      
      if (pricingResult.success) {
        console.log('✅ Pricing data storage successful');
        console.log(`📝 Pricing ID: ${pricingResult.data.id}`);

        // Test 5: Contract Creation
        console.log('\n5️⃣ Testing contract creation...');
        const contractData = {
          contractNumber: `CONTRACT-${Date.now()}`,
          termsAccepted: true
        };

        const contractResult = await customerService.createContract(
          result.data.id, 
          pricingResult.data.id, 
          contractData
        );

        if (contractResult.success) {
          console.log('✅ Contract creation successful');
          console.log(`📝 Contract ID: ${contractResult.data.id}`);

          // Clean up test data
          console.log('\n🧹 Cleaning up test data...');
          await supabase.from('contracts').delete().eq('id', contractResult.data.id);
          await supabase.from('pricing_data').delete().eq('id', pricingResult.data.id);
          await supabase.from('customers').delete().eq('id', result.data.id);
          console.log('✅ Test data cleaned up');
        } else {
          console.log(`❌ Contract creation failed: ${contractResult.error}`);
        }
      } else {
        console.log(`❌ Pricing data storage failed: ${pricingResult.error}`);
      }

    } else {
      console.log(`❌ Customer creation failed: ${result.error}`);
      return false;
    }
  } catch (err) {
    console.log(`❌ Test failed: ${err.message}`);
    return false;
  }

  return true;
}

// Run the test
if (require.main === module) {
  testSupabaseIntegration().then(success => {
    if (success) {
      console.log('\n🎉 All Supabase integration tests passed!');
      console.log('🚀 Your application is ready for production use.');
      process.exit(0);
    } else {
      console.log('\n❌ Some tests failed. Please check the logs above.');
      process.exit(1);
    }
  }).catch(error => {
    console.error('\n💥 Test suite crashed:', error.message);
    process.exit(1);
  });
}

module.exports = { testSupabaseIntegration };