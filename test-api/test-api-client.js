/**
 * Test API Client - Demonstrates EVU Backend Dummy API functionality
 */

const axios = require('axios');

const API_BASE_URL = 'http://localhost:3001';

class TestApiClient {
  constructor() {
    this.authToken = null;
    this.customerId = null;
  }

  async makeRequest(method, url, data = null, headers = {}) {
    try {
      const config = {
        method,
        url: `${API_BASE_URL}${url}`,
        data,
        headers: {
          'Content-Type': 'application/json',
          ...headers
        }
      };

      if (this.authToken) {
        config.headers.Authorization = `Bearer ${this.authToken}`;
      }

      const response = await axios(config);
      return response.data;
    } catch (error) {
      console.error(`❌ ${method} ${url} failed:`, error.response?.data || error.message);
      return error.response?.data || { erfolg: false, nachricht: error.message };
    }
  }

  async testHealthCheck() {
    console.log('\n🔍 Testing Health Check...');
    const result = await this.makeRequest('GET', '/health');
    if (result.erfolg) {
      console.log('✅ Health Check successful');
      console.log(`   Service: ${result.daten.service}`);
      console.log(`   Version: ${result.daten.version}`);
      console.log(`   Uptime: ${result.daten.uptime}s`);
    }
    return result;
  }

  async testApiInfo() {
    console.log('\n📋 Testing API Info...');
    const result = await this.makeRequest('GET', '/info');
    if (result.erfolg) {
      console.log('✅ API Info retrieved');
      console.log(`   Name: ${result.daten.name}`);
      console.log(`   Endpoints: ${Object.keys(result.daten.endpoints).length}`);
      console.log(`   Features: ${result.daten.features.length}`);
    }
    return result;
  }

  async testRegistration() {
    console.log('\n👤 Testing Customer Registration...');
    const customerData = {
      email: `test.${Date.now()}@example.com`,
      passwort: 'TestPasswort123!',
      vorname: 'Max',
      nachname: 'Mustermann',
      telefon: '+49 30 12345678',
      plz: '10115'
    };

    const result = await this.makeRequest('POST', '/api/v1/auth/register', customerData);
    if (result.erfolg) {
      console.log('✅ Registration successful');
      console.log(`   Customer ID: ${result.daten.kunde.kunden_id}`);
      console.log(`   Email: ${result.daten.kunde.email}`);
      console.log(`   Token received: ${result.daten.token ? 'Yes' : 'No'}`);
      
      // Store for subsequent tests
      this.authToken = result.daten.token;
      this.customerId = result.daten.kunde.kunden_id;
      this.customerEmail = customerData.email;
      this.customerPassword = customerData.passwort;
    }
    return result;
  }

  async testLogin() {
    console.log('\n🔐 Testing Customer Login...');
    if (!this.customerEmail || !this.customerPassword) {
      console.log('❌ No customer data available for login test');
      return { erfolg: false, nachricht: 'No customer data' };
    }

    const loginData = {
      email: this.customerEmail,
      passwort: this.customerPassword
    };

    const result = await this.makeRequest('POST', '/api/v1/auth/login', loginData);
    if (result.erfolg) {
      console.log('✅ Login successful');
      console.log(`   Customer: ${result.daten.kunde.vorname} ${result.daten.kunde.nachname}`);
      console.log(`   Verified: ${result.daten.kunde.ist_verifiziert ? 'Yes' : 'No'}`);
    }
    return result;
  }

  async testTokenVerification() {
    console.log('\n🎫 Testing Token Verification...');
    if (!this.authToken) {
      console.log('❌ No auth token available');
      return { erfolg: false, nachricht: 'No auth token' };
    }

    const result = await this.makeRequest('GET', '/api/v1/auth/verify');
    if (result.erfolg) {
      console.log('✅ Token verification successful');
      console.log(`   Customer ID: ${result.daten.kunden_id}`);
      console.log(`   Email: ${result.daten.email}`);
    }
    return result;
  }

  async testCustomerProfile() {
    console.log('\n👥 Testing Customer Profile...');
    if (!this.authToken) {
      console.log('❌ No auth token available');
      return { erfolg: false, nachricht: 'No auth token' };
    }

    const result = await this.makeRequest('GET', '/api/v1/kunden/profil');
    if (result.erfolg) {
      console.log('✅ Profile retrieved');
      console.log(`   Name: ${result.daten.kunde.vorname} ${result.daten.kunde.nachname}`);
      console.log(`   PLZ: ${result.daten.kunde.plz}`);
      console.log(`   City: ${result.daten.kunde.stadt}`);
    }
    return result;
  }

  async testPriceCalculation() {
    console.log('\n💰 Testing Price Calculation...');
    const priceRequest = {
      plz: '10115',
      jahresverbrauch: 3500,
      haushaltsgröße: 2,
      tariftyp: 'fest'
    };

    const result = await this.makeRequest('POST', '/api/v1/preise/berechnen', priceRequest);
    if (result.erfolg) {
      console.log('✅ Price calculation successful');
      console.log(`   Location: ${result.daten.standort.stadt}, ${result.daten.standort.bundesland}`);
      console.log(`   Tariffs found: ${result.daten.anzahl_gefunden}`);
      if (result.daten.tarife.length > 0) {
        const cheapestTariff = result.daten.tarife[0];
        console.log(`   Cheapest: ${cheapestTariff.tarif.name} - €${cheapestTariff.kosten.finale_jahreskosten}/year`);
      }
    }
    return result;
  }

  async testTariffRetrieval() {
    console.log('\n📊 Testing Tariff Retrieval...');
    const result = await this.makeRequest('GET', '/api/v1/preise/tarife?sortierung=preis');
    if (result.erfolg) {
      console.log('✅ Tariffs retrieved');
      console.log(`   Active tariffs: ${result.daten.anzahl}`);
      if (result.daten.tarife.length > 0) {
        console.log(`   Sample tariff: ${result.daten.tarife[0].name} (${result.daten.tarife[0].typ})`);
      }
    }
    return result;
  }

  async testLocationInfo() {
    console.log('\n📍 Testing Location Info...');
    const result = await this.makeRequest('GET', '/api/v1/preise/standorte/10115');
    if (result.erfolg) {
      console.log('✅ Location info retrieved');
      console.log(`   Location: ${result.daten.stadt}, ${result.daten.bundesland}`);
      console.log(`   Available: ${result.daten.verfuegbar ? 'Yes' : 'No'}`);
      console.log(`   Network operator: ${result.daten.netzbetreiber}`);
    }
    return result;
  }

  async testEnergyProfile() {
    console.log('\n⚡ Testing Energy Profile...');
    if (!this.authToken) {
      console.log('❌ No auth token available');
      return { erfolg: false, nachricht: 'No auth token' };
    }

    const result = await this.makeRequest('GET', '/api/v1/kunden/energie-profil');
    if (result.erfolg) {
      console.log('✅ Energy profile retrieved');
      console.log(`   Annual consumption: ${result.daten.jahresverbrauch} kWh`);
      console.log(`   Household size: ${result.daten.haushaltsgröße} people`);
      console.log(`   Consumption class: ${result.daten.verbrauchsklasse}`);
    }
    return result;
  }

  async testConsumptionHistory() {
    console.log('\n📈 Testing Consumption History...');
    if (!this.authToken) {
      console.log('❌ No auth token available');
      return { erfolg: false, nachricht: 'No auth token' };
    }

    const result = await this.makeRequest('GET', '/api/v1/kunden/verbrauchshistorie?limit=6');
    if (result.erfolg) {
      console.log('✅ Consumption history retrieved');
      console.log(`   Months of data: ${result.daten.statistiken.anzahl_monate}`);
      console.log(`   Total consumption: ${result.daten.statistiken.gesamt_verbrauch_kwh} kWh`);
      console.log(`   Average monthly: ${result.daten.statistiken.durchschnitt_verbrauch_kwh} kWh`);
    }
    return result;
  }

  async testContractRetrieval() {
    console.log('\n📄 Testing Contract Retrieval...');
    if (!this.authToken) {
      console.log('❌ No auth token available');
      return { erfolg: false, nachricht: 'No auth token' };
    }

    const result = await this.makeRequest('GET', '/api/v1/vertraege');
    if (result.erfolg) {
      console.log('✅ Contracts retrieved');
      console.log(`   Number of contracts: ${result.daten.anzahl}`);
      if (result.daten.vertraege.length > 0) {
        const contract = result.daten.vertraege[0];
        console.log(`   Sample contract: ${contract.vertrag_id} (${contract.status})`);
      }
    }
    return result;
  }

  async testContractDraft() {
    console.log('\n📝 Testing Contract Draft Creation...');
    if (!this.authToken) {
      console.log('❌ No auth token available');
      return { erfolg: false, nachricht: 'No auth token' };
    }

    // First get available tariffs
    const tariffsResult = await this.makeRequest('GET', '/api/v1/preise/tarife');
    if (!tariffsResult.erfolg || tariffsResult.daten.tarife.length === 0) {
      console.log('❌ No tariffs available for contract draft');
      return { erfolg: false, nachricht: 'No tariffs available' };
    }

    const contractData = {
      tarif_id: tariffsResult.daten.tarife[0].id,
      kampagne_id: 'test_kampagne_2024',
      geschaetzter_jahresverbrauch: 3500
    };

    const result = await this.makeRequest('POST', '/api/v1/vertraege/entwurf', contractData);
    if (result.erfolg) {
      console.log('✅ Contract draft created');
      console.log(`   Contract ID: ${result.daten.vertrag.vertrag_id}`);
      console.log(`   Tariff: ${result.daten.vertrag.tarif.name}`);
      console.log(`   Status: ${result.daten.vertrag.status}`);
    }
    return result;
  }

  async runAllTests() {
    console.log('🚀 Starting EVU Backend Dummy API Tests\n');
    console.log('=' .repeat(60));

    const results = {};

    // Basic API tests
    results.health = await this.testHealthCheck();
    results.info = await this.testApiInfo();

    // Authentication flow
    results.registration = await this.testRegistration();
    results.login = await this.testLogin();
    results.tokenVerification = await this.testTokenVerification();

    // Customer management
    results.profile = await this.testCustomerProfile();
    results.energyProfile = await this.testEnergyProfile();
    results.consumptionHistory = await this.testConsumptionHistory();

    // Pricing services
    results.priceCalculation = await this.testPriceCalculation();
    results.tariffs = await this.testTariffRetrieval();
    results.locationInfo = await this.testLocationInfo();

    // Contract management
    results.contracts = await this.testContractRetrieval();
    results.contractDraft = await this.testContractDraft();

    // Summary
    console.log('\n' + '=' .repeat(60));
    console.log('📊 Test Results Summary:');
    
    const successful = Object.values(results).filter(result => result.erfolg).length;
    const total = Object.keys(results).length;
    
    console.log(`   ✅ Successful: ${successful}/${total}`);
    console.log(`   ❌ Failed: ${total - successful}/${total}`);
    console.log(`   📈 Success Rate: ${((successful / total) * 100).toFixed(1)}%`);

    if (successful === total) {
      console.log('\n🎉 All tests passed! Dummy API is working correctly.');
    } else {
      console.log('\n⚠️  Some tests failed. Check the logs above for details.');
    }

    return results;
  }
}

// Run tests if called directly
if (require.main === module) {
  const client = new TestApiClient();
  
  client.runAllTests().then(results => {
    process.exit(0);
  }).catch(error => {
    console.error('❌ Test execution failed:', error);
    process.exit(1);
  });
}

module.exports = TestApiClient;