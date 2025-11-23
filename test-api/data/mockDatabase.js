/**
 * Mock Database for EVU Backend Test API
 * Simulates PostgreSQL database with in-memory storage
 */

class MockDatabase {
  constructor() {
    this.customers = new Map();
    this.tariffs = new Map();
    this.prices = new Map();
    this.contracts = new Map();
    this.plzData = new Map();
    this.consumption = new Map();
    
    // Initialize with some default data
    this.initializeDefaultData();
  }

  // ================================
  // CUSTOMER OPERATIONS
  // ================================

  createCustomer(customerData) {
    const customerId = customerData.kunden_id;
    customerData.erstellt_am = new Date();
    customerData.aktualisiert_am = new Date();
    this.customers.set(customerId, customerData);
    console.log(`📝 Mock DB: Customer created - ${customerId}`);
    return customerData;
  }

  findCustomerById(customerId) {
    return this.customers.get(customerId) || null;
  }

  findCustomerByEmail(email) {
    for (const customer of this.customers.values()) {
      if (customer.email === email) {
        return customer;
      }
    }
    return null;
  }

  updateCustomer(customerId, updates) {
    const customer = this.customers.get(customerId);
    if (!customer) return null;

    const updatedCustomer = {
      ...customer,
      ...updates,
      aktualisiert_am: new Date()
    };

    this.customers.set(customerId, updatedCustomer);
    console.log(`📝 Mock DB: Customer updated - ${customerId}`);
    return updatedCustomer;
  }

  updateCustomerLastLogin(customerId) {
    const customer = this.customers.get(customerId);
    if (customer) {
      customer.letzter_login = new Date();
      this.customers.set(customerId, customer);
    }
  }

  deleteCustomer(customerId) {
    const deleted = this.customers.delete(customerId);
    if (deleted) {
      console.log(`🗑️ Mock DB: Customer deleted - ${customerId}`);
    }
    return deleted;
  }

  getAllCustomers() {
    return Array.from(this.customers.values());
  }

  // ================================
  // TARIFF OPERATIONS
  // ================================

  createTariff(tariffData) {
    const tariffId = tariffData.id || `tariff_${Date.now()}`;
    tariffData.id = tariffId;
    tariffData.erstellt_am = new Date();
    tariffData.aktualisiert_am = new Date();
    this.tariffs.set(tariffId, tariffData);
    console.log(`📝 Mock DB: Tariff created - ${tariffId}`);
    return tariffData;
  }

  findTariffById(tariffId) {
    return this.tariffs.get(tariffId) || null;
  }

  findActiveTariffs() {
    return Array.from(this.tariffs.values()).filter(tariff => tariff.ist_aktiv);
  }

  findTariffsByType(type) {
    return Array.from(this.tariffs.values()).filter(tariff => 
      tariff.ist_aktiv && tariff.tarif_typ === type
    );
  }

  getAllTariffs() {
    return Array.from(this.tariffs.values());
  }

  // ================================
  // PRICING OPERATIONS
  // ================================

  createPrice(priceData) {
    const priceId = priceData.preis_id || `price_${Date.now()}`;
    priceData.preis_id = priceId;
    priceData.erstellt_am = new Date();
    this.prices.set(priceId, priceData);
    console.log(`📝 Mock DB: Price created - ${priceId}`);
    return priceData;
  }

  findPricesByPlz(plz) {
    return Array.from(this.prices.values()).filter(price => price.plz === plz);
  }

  findPricesByTariffId(tariffId) {
    return Array.from(this.prices.values()).filter(price => price.tarif_id === tariffId);
  }

  // ================================
  // PLZ OPERATIONS  
  // ================================

  createPlzData(plzData) {
    this.plzData.set(plzData.plz, plzData);
    console.log(`📝 Mock DB: PLZ data created - ${plzData.plz}`);
    return plzData;
  }

  findPlzData(plz) {
    return this.plzData.get(plz) || null;
  }

  isPlzAvailable(plz) {
    const plzData = this.plzData.get(plz);
    return plzData && plzData.verfuegbar;
  }

  getAllAvailablePlz() {
    return Array.from(this.plzData.values()).filter(plz => plz.verfuegbar);
  }

  // ================================
  // CONTRACT OPERATIONS
  // ================================

  createContract(contractData) {
    const contractId = contractData.vertrag_id || `contract_${Date.now()}`;
    contractData.vertrag_id = contractId;
    contractData.erstellt_am = new Date();
    contractData.aktualisiert_am = new Date();
    this.contracts.set(contractId, contractData);
    console.log(`📝 Mock DB: Contract created - ${contractId}`);
    return contractData;
  }

  findContractById(contractId) {
    return this.contracts.get(contractId) || null;
  }

  findContractsByCustomerId(customerId) {
    return Array.from(this.contracts.values()).filter(contract => 
      contract.kunden_id === customerId
    );
  }

  updateContract(contractId, updates) {
    const contract = this.contracts.get(contractId);
    if (!contract) return null;

    const updatedContract = {
      ...contract,
      ...updates,
      aktualisiert_am: new Date()
    };

    this.contracts.set(contractId, updatedContract);
    console.log(`📝 Mock DB: Contract updated - ${contractId}`);
    return updatedContract;
  }

  // ================================
  // CONSUMPTION OPERATIONS
  // ================================

  createConsumption(consumptionData) {
    const consumptionId = `consumption_${Date.now()}`;
    consumptionData.id = consumptionId;
    consumptionData.erstellt_am = new Date();
    this.consumption.set(consumptionId, consumptionData);
    return consumptionData;
  }

  findConsumptionByCustomerId(customerId, startDate = null, endDate = null) {
    const customerConsumption = Array.from(this.consumption.values()).filter(consumption => 
      consumption.kunden_id === customerId
    );

    if (startDate && endDate) {
      return customerConsumption.filter(consumption => {
        const consumptionDate = new Date(consumption.datum);
        return consumptionDate >= startDate && consumptionDate <= endDate;
      });
    }

    return customerConsumption;
  }

  // ================================
  // UTILITY METHODS
  // ================================

  initializeDefaultData() {
    console.log('🔄 Initialisiere Standard-Mock-Daten...');

    // Standard PLZ-Daten für deutsche Großstädte
    const standardPlzData = [
      { plz: '10115', stadt: 'Berlin', bezirk: 'Mitte', bundesland: 'Berlin', verfuegbar: true, netzbetreiber: 'Stromnetz Berlin' },
      { plz: '20095', stadt: 'Hamburg', bezirk: 'Hamburg-Altstadt', bundesland: 'Hamburg', verfuegbar: true, netzbetreiber: 'Stromnetz Hamburg' },
      { plz: '80331', stadt: 'München', bezirk: 'Altstadt-Lehel', bundesland: 'Bayern', verfuegbar: true, netzbetreiber: 'SWM Infrastruktur' },
      { plz: '50667', stadt: 'Köln', bezirk: 'Innenstadt', bundesland: 'Nordrhein-Westfalen', verfuegbar: true, netzbetreiber: 'Rheinenergie' },
      { plz: '60311', stadt: 'Frankfurt am Main', bezirk: 'Innenstadt', bundesland: 'Hessen', verfuegbar: true, netzbetreiber: 'Mainova' },
      { plz: '70173', stadt: 'Stuttgart', bezirk: 'Mitte', bundesland: 'Baden-Württemberg', verfuegbar: true, netzbetreiber: 'Netze BW' },
      { plz: '40213', stadt: 'Düsseldorf', bezirk: 'Stadtmitte', bundesland: 'Nordrhein-Westfalen', verfuegbar: true, netzbetreiber: 'Stadtwerke Düsseldorf' },
      { plz: '44135', stadt: 'Dortmund', bezirk: 'Innenstadt-Nord', bundesland: 'Nordrhein-Westfalen', verfuegbar: true, netzbetreiber: 'DEW21' },
      { plz: '45127', stadt: 'Essen', bezirk: 'Stadtkern', bundesland: 'Nordrhein-Westfalen', verfuegbar: true, netzbetreiber: 'Westnetz' },
      { plz: '04109', stadt: 'Leipzig', bezirk: 'Mitte', bundesland: 'Sachsen', verfuegbar: true, netzbetreiber: 'Stadtwerke Leipzig' },
      { plz: '01067', stadt: 'Dresden', bezirk: 'Altstadt', bundesland: 'Sachsen', verfuegbar: true, netzbetreiber: 'SachsenNetze' },
      { plz: '30159', stadt: 'Hannover', bezirk: 'Mitte', bundesland: 'Niedersachsen', verfuegbar: true, netzbetreiber: 'Avacon' },
      { plz: '90402', stadt: 'Nürnberg', bezirk: 'Lorenz', bundesland: 'Bayern', verfuegbar: false, netzbetreiber: 'N-ERGIE', grund: 'Netzausbau in Planung' }
    ];

    standardPlzData.forEach(plzData => {
      this.createPlzData(plzData);
    });

    console.log(`✅ ${standardPlzData.length} PLZ-Datensätze initialisiert`);
  }

  // Database stats
  getStats() {
    return {
      customers: this.customers.size,
      tariffs: this.tariffs.size,
      prices: this.prices.size,
      contracts: this.contracts.size,
      plzData: this.plzData.size,
      consumption: this.consumption.size,
      timestamp: new Date().toISOString()
    };
  }

  // Clear all data (for testing)
  clearAll() {
    this.customers.clear();
    this.tariffs.clear();
    this.prices.clear();
    this.contracts.clear();
    this.plzData.clear();
    this.consumption.clear();
    this.initializeDefaultData();
    console.log('🗑️ Mock DB: Alle Daten gelöscht und neu initialisiert');
  }

  // Export data for backup/restore
  exportData() {
    return {
      customers: Array.from(this.customers.entries()),
      tariffs: Array.from(this.tariffs.entries()),
      prices: Array.from(this.prices.entries()),
      contracts: Array.from(this.contracts.entries()),
      plzData: Array.from(this.plzData.entries()),
      consumption: Array.from(this.consumption.entries())
    };
  }

  // Import data from backup
  importData(data) {
    if (data.customers) {
      this.customers = new Map(data.customers);
    }
    if (data.tariffs) {
      this.tariffs = new Map(data.tariffs);
    }
    if (data.prices) {
      this.prices = new Map(data.prices);
    }
    if (data.contracts) {
      this.contracts = new Map(data.contracts);
    }
    if (data.plzData) {
      this.plzData = new Map(data.plzData);
    }
    if (data.consumption) {
      this.consumption = new Map(data.consumption);
    }
    console.log('📥 Mock DB: Daten importiert');
  }
}

// Singleton instance
const mockDatabase = new MockDatabase();

module.exports = mockDatabase;