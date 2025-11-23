/**
 * Test Enhanced Customer Registration
 * Tests that all form data from ContractPage is properly stored in database
 */

const axios = require('axios');

async function testEnhancedCustomerRegistration() {
  try {
    console.log('🧪 Testing enhanced customer registration...\n');

    // Comprehensive test customer data (matching ContractPage form)
    const testCustomerData = {
      // Personal Information
      vorname: 'Maria',
      nachname: 'Mustermann',
      email: `maria.mustermann.${Date.now()}@example.com`,
      telefon: '+49 30 12345678',
      geburtsdatum: '1985-06-15',
      
      // Address Information
      strasse: 'Teststraße',
      hausnummer: '42',
      plz: '10115',
      ort: 'Berlin',
      bezirk: 'Mitte',
      
      // Agreements & Consents
      agbAkzeptiert: true,
      datenschutzAkzeptiert: true,
      marketingEinverstaendnis: false,
      newsletterEinverstaendnis: true,
      
      // Additional Information
      notizen: 'Test customer for enhanced registration functionality'
    };

    console.log('📝 Test customer data prepared:');
    console.log(JSON.stringify(testCustomerData, null, 2));
    console.log('\n📤 Sending registration request...');

    // Send registration request to backend
    const response = await axios.post('http://localhost:3000/api/v1/customers', testCustomerData);
    
    if (response.data.success) {
      console.log('✅ Customer registration successful!');
      console.log('👤 Customer ID:', response.data.data.id);
      console.log('📊 Stored data:', JSON.stringify(response.data.data, null, 2));
      
      // Verify all fields were stored
      const storedData = response.data.data;
      const fieldsToCheck = [
        'vorname', 'nachname', 'email', 'telefon', 'geburtsdatum',
        'strasse', 'hausnummer', 'plz', 'ort', 'bezirk',
        'agb_akzeptiert', 'datenschutz_akzeptiert', 
        'marketing_einverstaendnis', 'newsletter_einverstaendnis', 
        'notizen'
      ];
      
      console.log('\n🔍 Field verification:');
      const missingFields = [];
      
      for (const field of fieldsToCheck) {
        if (storedData.hasOwnProperty(field)) {
          console.log(`  ✅ ${field}: ${storedData[field]}`);
        } else {
          console.log(`  ❌ ${field}: MISSING`);
          missingFields.push(field);
        }
      }
      
      if (missingFields.length === 0) {
        console.log('\n🎉 All customer data fields are properly stored!');
      } else {
        console.log(`\n⚠️  Missing fields: ${missingFields.join(', ')}`);
        console.log('💡 These fields require database schema migration.');
      }
      
    } else {
      console.log('❌ Customer registration failed:', response.data.error);
    }

  } catch (error) {
    if (error.response) {
      console.log('❌ Registration failed with status:', error.response.status);
      console.log('📄 Error details:', error.response.data);
    } else if (error.request) {
      console.log('❌ No response from server. Is the backend running on port 3000?');
    } else {
      console.log('❌ Request setup error:', error.message);
    }
  }
}

// Export for use in other tests
module.exports = testEnhancedCustomerRegistration;

// Run test if executed directly
if (require.main === module) {
  testEnhancedCustomerRegistration();
}
