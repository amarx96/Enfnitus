/**
 * Dummy Data Generator for EVU Backend Test API
 * Generates realistic German energy customer and tariff data
 */

const { v4: uuidv4 } = require('uuid');
const mockDatabase = require('./mockDatabase');

class DummyDataGenerator {
  
  // ================================
  // CUSTOMER DATA GENERATION
  // ================================

  static generateCustomer(overrides = {}) {
    const firstName = this.getRandomFirstName();
    const lastName = this.getRandomLastName();
    const city = this.getRandomCity();
    const plz = this.getRandomPlz();

    const baseCustomer = {
      kunden_id: `kunde_${uuidv4()}`,
      email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@${this.getRandomEmailDomain()}`,
      passwort_hash: '$2a$12$dummy.hash.for.testing.only.123456789', // Dummy hash
      vorname: firstName,
      nachname: lastName,
      telefon: this.generateGermanPhoneNumber(),
      strasse: this.getRandomStreet(),
      hausnummer: Math.floor(Math.random() * 200) + 1,
      plz: plz,
      stadt: city.name,
      bezirk: city.district || 'Stadtmitte',
      bundesland: city.state,
      land: 'Deutschland',
      geburtsdatum: this.getRandomBirthDate(),
      bevorzugte_sprache: 'de',
      marketing_einverstaendnis: Math.random() > 0.3,
      newsletter_einverstaendnis: Math.random() > 0.4,
      ist_aktiv: true,
      ist_verifiziert: Math.random() > 0.1, // 90% verified
      ist_gesperrt: false,
      erstellt_am: this.getRandomDateInPast(365), // Within last year
      aktualisiert_am: new Date(),
      letzter_login: this.getRandomDateInPast(30), // Within last 30 days
      jahresverbrauch: this.getRandomEnergyConsumption(),
      haushaltsgröße: Math.floor(Math.random() * 6) + 1, // 1-6 people
      kunde_typ: this.getRandomCustomerType(),
      verträge_anzahl: Math.floor(Math.random() * 3) + 1, // 1-3 contracts
      präferenzen: JSON.stringify({
        newsletter: Math.random() > 0.5,
        sms_benachrichtigungen: Math.random() > 0.7,
        öko_strom: Math.random() > 0.4,
        preisalerts: Math.random() > 0.6,
        automatische_verlängerung: Math.random() > 0.3
      })
    };

    return { ...baseCustomer, ...overrides };
  }

  // ================================
  // TARIFF DATA GENERATION
  // ================================

  static generateTariff(overrides = {}) {
    const tariffTypes = ['fest', 'dynamisch', 'gruen', 'basic'];
    const tariffType = overrides.tarif_typ || this.getRandomFromArray(tariffTypes);
    
    const baseTariff = {
      id: `tariff_${uuidv4()}`,
      tarif_name: this.generateTariffName(tariffType),
      tarif_typ: tariffType,
      ist_aktiv: Math.random() > 0.2, // 80% active
      arbeitspreis_cent_pro_kwh: this.generateWorkingPrice(tariffType),
      grundpreis_euro_pro_monat: this.generateBasicPrice(tariffType),
      mindestvertragslaufzeit_monate: this.getRandomFromArray([12, 24, 36]),
      kuendigungsfrist_monate: this.getRandomFromArray([1, 3, 6]),
      oeko_zertifikat: tariffType === 'gruen' || Math.random() > 0.7,
      co2_neutral: tariffType === 'gruen' || Math.random() > 0.8,
      neukundenrabatt_prozent: tariffType === 'basic' ? 0 : Math.random() * 15,
      fruhbucherrabatt_prozent: Math.random() > 0.5 ? Math.random() * 10 : 0,
      mengenstaffel_ab_kwh: Math.random() > 0.6 ? 5000 + Math.floor(Math.random() * 10000) : null,
      preisgarantie_monate: this.getRandomFromArray([0, 6, 12, 24]),
      erstellt_am: this.getRandomDateInPast(180),
      aktualisiert_am: new Date(),
      gueltig_ab: new Date(),
      gueltig_bis: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
      beschreibung: this.generateTariffDescription(tariffType),
      zielkunden_typ: this.getRandomFromArray(['haushalt', 'gewerbe', 'industrie']),
      min_verbrauch_kwh: 500,
      max_verbrauch_kwh: this.getRandomFromArray([10000, 25000, 50000, 100000]),
      abrechnungs_haeufigkeit: this.getRandomFromArray(['monatlich', 'quartalsweise', 'jaehrlich']),
      zahlungsweise: this.getRandomFromArray(['lastschrift', 'rechnung', 'vorauskasse'])
    };

    return { ...baseTariff, ...overrides };
  }

  // ================================
  // PRICING DATA GENERATION
  // ================================

  static generatePriceData(plz, tariffId, overrides = {}) {
    const region = this.getRegionByPlz(plz);
    
    const basePrice = {
      preis_id: `price_${uuidv4()}`,
      tarif_id: tariffId,
      plz: plz,
      arbeitspreis_cent_pro_kwh: 25.0 + Math.random() * 10, // 25-35 cent
      grundpreis_euro_pro_monat: 8.0 + Math.random() * 6, // 8-14 euro
      netzentgelt_cent_pro_kwh: 7.0 + Math.random() * 3, // 7-10 cent
      konzessionsabgabe_cent_pro_kwh: 1.32 + Math.random() * 0.5,
      stromsteuer_cent_pro_kwh: 2.05, // Fixed by law
      erneuerbare_umlage_cent_pro_kwh: 3.7 + Math.random() * 0.5,
      kwk_umlage_cent_pro_kwh: 0.3 + Math.random() * 0.1,
      offshore_umlage_cent_pro_kwh: 0.4 + Math.random() * 0.1,
      abschaltbare_lasten_umlage_cent_pro_kwh: 0.01,
      mehrwertsteuer_prozent: 19.0,
      gueltig_ab: new Date(),
      gueltig_bis: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      region: region,
      netzbetreiber: this.getNetworkOperatorByPlz(plz),
      erstellt_am: new Date()
    };

    return { ...basePrice, ...overrides };
  }

  // ================================
  // CONTRACT DATA GENERATION
  // ================================

  static generateContract(customerId, tariffId, overrides = {}) {
    const status = this.getRandomFromArray(['entwurf', 'genehmigt', 'aktiv', 'gekuendigt', 'beendet']);
    
    const baseContract = {
      vertrag_id: `vertrag_${uuidv4()}`,
      kunden_id: customerId,
      tarif_id: tariffId,
      kampagne_id: `kampagne_${Date.now()}`,
      status: status,
      geschaetzter_jahresverbrauch: this.getRandomEnergyConsumption(),
      vertragsbeginn: this.getRandomFutureDate(30), // Within next 30 days
      vertragsende: null, // Will be set based on contract duration
      abschlagszahlung_euro: Math.floor(Math.random() * 200) + 50, // 50-250 euro
      zahlungsweise: this.getRandomFromArray(['lastschrift', 'rechnung']),
      erstellt_am: this.getRandomDateInPast(60),
      aktualisiert_am: new Date(),
      genehmigt_am: status === 'genehmigt' || status === 'aktiv' ? this.getRandomDateInPast(30) : null,
      genehmigt_von: status === 'genehmigt' || status === 'aktiv' ? 'system_auto_approval' : null,
      abgelehnt_am: null,
      ablehnungsgrund: null,
      kuendigungsdatum: status === 'gekuendigt' ? this.getRandomDateInPast(10) : null,
      kuendigungsgrund: status === 'gekuendigt' ? this.getRandomFromArray(['umzug', 'preis', 'service', 'sonstiges']) : null,
      notizen: this.generateContractNotes(),
      dokumente: JSON.stringify([
        'vertragsbedingungen.pdf',
        'preisblatt.pdf',
        'widerrufsbelehrung.pdf'
      ]),
      zusatzbestimmungen: JSON.stringify({
        preisgarantie: Math.random() > 0.5,
        oeko_option: Math.random() > 0.3,
        smart_meter: Math.random() > 0.7
      })
    };

    // Set contract end date based on duration
    if (baseContract.vertragsbeginn) {
      const startDate = new Date(baseContract.vertragsbeginn);
      const durationMonths = this.getRandomFromArray([12, 24, 36]);
      const endDate = new Date(startDate);
      endDate.setMonth(endDate.getMonth() + durationMonths);
      baseContract.vertragsende = endDate;
    }

    return { ...baseContract, ...overrides };
  }

  // ================================
  // CONSUMPTION DATA GENERATION
  // ================================

  static generateConsumptionHistory(customerId, months = 12) {
    const consumptionData = [];
    const baseConsumption = this.getRandomEnergyConsumption();
    
    for (let i = 0; i < months; i++) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      
      // Seasonal variation
      const seasonalFactor = this.getSeasonalConsumptionFactor(date.getMonth());
      const monthlyConsumption = (baseConsumption / 12) * seasonalFactor;
      
      // Add some randomness
      const variance = 0.8 + Math.random() * 0.4; // ±20% variance
      const finalConsumption = Math.round(monthlyConsumption * variance);
      
      consumptionData.push({
        kunden_id: customerId,
        datum: date,
        verbrauch_kwh: finalConsumption,
        kosten_euro: finalConsumption * (0.28 + Math.random() * 0.05), // ~28-33 cent per kWh
        ablesungstyp: this.getRandomFromArray(['geschaetzt', 'abgelesen', 'smart_meter']),
        temperatur_durchschnitt: this.getAverageTemperature(date.getMonth()),
        heizgradtage: this.getHeatingDegreeDays(date.getMonth()),
        erstellt_am: date
      });
    }
    
    return consumptionData.reverse(); // Oldest first
  }

  // ================================
  // HELPER METHODS
  // ================================

  static getRandomFirstName() {
    const names = [
      'Alexander', 'Anna', 'Andreas', 'Andrea', 'Anton', 'Annika',
      'Benjamin', 'Bianca', 'Bernd', 'Britta', 'Boris', 'Barbara',
      'Christian', 'Christina', 'Christoph', 'Claudia', 'Carsten', 'Celine',
      'Daniel', 'Diana', 'Dennis', 'Daniela', 'Dirk', 'Doris',
      'Erik', 'Eva', 'Emanuel', 'Elisabeth', 'Elias', 'Emma',
      'Felix', 'Franziska', 'Florian', 'Frieda', 'Friedrich', 'Fatima',
      'Georg', 'Greta', 'Günther', 'Gabriele', 'Gustav', 'Gisela',
      'Hans', 'Hannah', 'Henrik', 'Heike', 'Helmut', 'Helga',
      'Ingo', 'Iris', 'Ivan', 'Ingrid', 'Ismail', 'Ilse',
      'Jan', 'Julia', 'Jürgen', 'Jana', 'Johannes', 'Jennifer',
      'Klaus', 'Katrin', 'Kevin', 'Katharina', 'Karl', 'Kerstin',
      'Lars', 'Laura', 'Lukas', 'Lisa', 'Ludwig', 'Lena',
      'Michael', 'Maria', 'Matthias', 'Melanie', 'Martin', 'Monika',
      'Nicolas', 'Nina', 'Norbert', 'Nadine', 'Nils', 'Nicole',
      'Oliver', 'Olivia', 'Otto', 'Oma', 'Oskar', 'Ophelia',
      'Patrick', 'Petra', 'Paul', 'Paula', 'Peter', 'Pamela',
      'Ralf', 'Rebecca', 'Robert', 'Regina', 'Richard', 'Ruth',
      'Stefan', 'Sabine', 'Sebastian', 'Sandra', 'Simon', 'Silke',
      'Thomas', 'Tina', 'Tobias', 'Tanja', 'Tim', 'Theresa',
      'Ulrich', 'Ursula', 'Uwe', 'Ute', 'Urban', 'Una',
      'Viktor', 'Verena', 'Volker', 'Vanessa', 'Vincent', 'Viola',
      'Wolfgang', 'Waltraud', 'Werner', 'Wanda', 'Wilhelm', 'Wilma'
    ];
    return this.getRandomFromArray(names);
  }

  static getRandomLastName() {
    const surnames = [
      'Müller', 'Schmidt', 'Schneider', 'Fischer', 'Weber', 'Meyer',
      'Wagner', 'Becker', 'Schulz', 'Hoffmann', 'Schäfer', 'Koch',
      'Bauer', 'Richter', 'Klein', 'Wolf', 'Schröder', 'Neumann',
      'Schwarz', 'Zimmermann', 'Braun', 'Krüger', 'Hofmann', 'Hartmann',
      'Lange', 'Schmitt', 'Werner', 'Schmitz', 'Krause', 'Meier',
      'Lehmann', 'Schmid', 'Schulze', 'Maier', 'Köhler', 'Herrmann',
      'König', 'Walter', 'Mayer', 'Huber', 'Kaiser', 'Fuchs',
      'Peters', 'Lang', 'Scholz', 'Möller', 'Weiß', 'Jung',
      'Hahn', 'Schubert', 'Vogel', 'Friedrich', 'Keller', 'Günther',
      'Frank', 'Berger', 'Winkler', 'Roth', 'Beck', 'Lorenz',
      'Baumann', 'Franke', 'Albrecht', 'Simmel', 'Sommer', 'Krämer'
    ];
    return this.getRandomFromArray(surnames);
  }

  static getRandomCity() {
    const cities = [
      { name: 'Berlin', state: 'Berlin', district: 'Mitte' },
      { name: 'Hamburg', state: 'Hamburg', district: 'Altstadt' },
      { name: 'München', state: 'Bayern', district: 'Altstadt-Lehel' },
      { name: 'Köln', state: 'Nordrhein-Westfalen', district: 'Innenstadt' },
      { name: 'Frankfurt am Main', state: 'Hessen', district: 'Innenstadt' },
      { name: 'Stuttgart', state: 'Baden-Württemberg', district: 'Mitte' },
      { name: 'Düsseldorf', state: 'Nordrhein-Westfalen', district: 'Stadtmitte' },
      { name: 'Dortmund', state: 'Nordrhein-Westfalen', district: 'Innenstadt-Nord' },
      { name: 'Essen', state: 'Nordrhein-Westfalen', district: 'Stadtkern' },
      { name: 'Leipzig', state: 'Sachsen', district: 'Mitte' },
      { name: 'Bremen', state: 'Bremen', district: 'Mitte' },
      { name: 'Dresden', state: 'Sachsen', district: 'Altstadt' },
      { name: 'Hannover', state: 'Niedersachsen', district: 'Mitte' },
      { name: 'Nürnberg', state: 'Bayern', district: 'Lorenz' },
      { name: 'Duisburg', state: 'Nordrhein-Westfalen', district: 'Mitte' }
    ];
    return this.getRandomFromArray(cities);
  }

  static getRandomPlz() {
    const plzList = [
      '10115', '20095', '80331', '50667', '60311', '70173',
      '40213', '44135', '45127', '04109', '28195', '01067',
      '30159', '90402', '47051'
    ];
    return this.getRandomFromArray(plzList);
  }

  static getRandomStreet() {
    const streets = [
      'Hauptstraße', 'Bahnhofstraße', 'Kirchstraße', 'Poststraße', 'Marktstraße',
      'Schulstraße', 'Gartenstraße', 'Feldstraße', 'Waldstraße', 'Ringstraße',
      'Bergstraße', 'Dorfstraße', 'Lindenstraße', 'Rosenstraße', 'Sonnenstraße',
      'Mühlenstraße', 'Friedhofstraße', 'Neue Straße', 'Lange Straße', 'Kurze Straße',
      'Am Park', 'Am Markt', 'Am Bahnhof', 'Unter den Linden', 'Kaiserdamm'
    ];
    return this.getRandomFromArray(streets);
  }

  static getRandomEmailDomain() {
    const domains = [
      'gmail.com', 'web.de', 'gmx.de', 't-online.de', 'outlook.de',
      'yahoo.de', 'freenet.de', 'arcor.de', 'hotmail.de', 'live.de'
    ];
    return this.getRandomFromArray(domains);
  }

  static generateGermanPhoneNumber() {
    const areaCodes = ['030', '040', '089', '0221', '069', '0711', '0211', '0231', '0201', '0341'];
    const areaCode = this.getRandomFromArray(areaCodes);
    const number = Math.floor(Math.random() * 90000000) + 10000000; // 8 digits
    return `+49 ${areaCode.substring(1)} ${number.toString().substring(0, 3)} ${number.toString().substring(3, 6)} ${number.toString().substring(6)}`;
  }

  static getRandomBirthDate() {
    const minAge = 18;
    const maxAge = 80;
    const today = new Date();
    const birthYear = today.getFullYear() - minAge - Math.floor(Math.random() * (maxAge - minAge));
    const birthMonth = Math.floor(Math.random() * 12);
    const birthDay = Math.floor(Math.random() * 28) + 1; // Safe day range
    return new Date(birthYear, birthMonth, birthDay);
  }

  static getRandomEnergyConsumption() {
    // Realistic German household consumption based on household size
    const consumptionRanges = [
      { min: 1500, max: 2500 }, // 1 person
      { min: 2500, max: 3500 }, // 2 people
      { min: 3500, max: 4500 }, // 3 people
      { min: 4000, max: 5500 }, // 4 people
      { min: 5000, max: 7000 }, // 5+ people
    ];
    
    const range = this.getRandomFromArray(consumptionRanges);
    return Math.floor(Math.random() * (range.max - range.min)) + range.min;
  }

  static getRandomCustomerType() {
    const types = ['privat', 'gewerbe', 'industrie'];
    const weights = [0.8, 0.15, 0.05]; // 80% private, 15% business, 5% industrial
    
    const rand = Math.random();
    if (rand < weights[0]) return types[0];
    if (rand < weights[0] + weights[1]) return types[1];
    return types[2];
  }

  static generateTariffName(type) {
    const prefixes = {
      'fest': ['Stabil', 'Fix', 'Sicher', 'Konstant'],
      'dynamisch': ['Flex', 'Smart', 'Variabel', 'Dynamik'],
      'gruen': ['Öko', 'Natur', 'Green', 'Bio'],
      'basic': ['Basic', 'Standard', 'Einfach', 'Start']
    };
    
    const suffixes = ['Strom', 'Energie', 'Power', 'Plus', 'Premium', 'Eco', 'Home'];
    
    const prefix = this.getRandomFromArray(prefixes[type] || prefixes.basic);
    const suffix = this.getRandomFromArray(suffixes);
    
    return `${prefix}${suffix} ${new Date().getFullYear()}`;
  }

  static generateWorkingPrice(type) {
    const basePrices = {
      'fest': { min: 26, max: 32 },
      'dynamisch': { min: 24, max: 35 },
      'gruen': { min: 28, max: 38 },
      'basic': { min: 30, max: 40 }
    };
    
    const range = basePrices[type] || basePrices.basic;
    return +(Math.random() * (range.max - range.min) + range.min).toFixed(2);
  }

  static generateBasicPrice(type) {
    const basePrices = {
      'fest': { min: 8, max: 12 },
      'dynamisch': { min: 6, max: 14 },
      'gruen': { min: 10, max: 16 },
      'basic': { min: 12, max: 18 }
    };
    
    const range = basePrices[type] || basePrices.basic;
    return +(Math.random() * (range.max - range.min) + range.min).toFixed(2);
  }

  static generateTariffDescription(type) {
    const descriptions = {
      'fest': 'Stabiler Strompreis für planbare Kosten. Preisgarantie für die gesamte Vertragslaufzeit.',
      'dynamisch': 'Flexibler Stromtarif mit börsenabhängigen Preisen. Profitieren Sie von günstigen Marktphasen.',
      'gruen': '100% Ökostrom aus erneuerbaren Energien. Klimaneutral und nachhaltig produziert.',
      'basic': 'Unser Grundtarif mit fairen Konditionen. Ideal für den Einstieg in günstige Strompreise.'
    };
    
    return descriptions[type] || descriptions.basic;
  }

  static generateContractNotes() {
    const notes = [
      'Automatische Verlängerung vereinbart',
      'Kunde wünscht digitale Rechnung',
      'Einzugsermächtigung erteilt',
      'Sonderkündigungsrecht bei Preiserhöhung',
      'Smart Meter Installation erforderlich',
      'Neukunde mit Wechselbonus',
      'Empfehlung durch Bestandskunde'
    ];
    
    return this.getRandomFromArray(notes);
  }

  static getRegionByPlz(plz) {
    const regionMap = {
      '1': 'Berlin/Brandenburg',
      '2': 'Hamburg/Schleswig-Holstein',
      '3': 'Niedersachsen',
      '4': 'Nordrhein-Westfalen',
      '5': 'Nordrhein-Westfalen',
      '6': 'Hessen/Rheinland-Pfalz',
      '7': 'Baden-Württemberg',
      '8': 'Bayern',
      '9': 'Bayern/Thüringen',
      '0': 'Sachsen/Sachsen-Anhalt/Thüringen'
    };
    
    return regionMap[plz.charAt(0)] || 'Unbekannt';
  }

  static getNetworkOperatorByPlz(plz) {
    const operatorMap = {
      '10115': 'Stromnetz Berlin',
      '20095': 'Stromnetz Hamburg',
      '80331': 'SWM Infrastruktur',
      '50667': 'Rheinenergie',
      '60311': 'Mainova',
      '70173': 'Netze BW',
      '40213': 'Stadtwerke Düsseldorf',
      '44135': 'DEW21',
      '45127': 'Westnetz',
      '04109': 'Stadtwerke Leipzig'
    };
    
    return operatorMap[plz] || 'Regional Netzbetreiber';
  }

  static getSeasonalConsumptionFactor(month) {
    // Winter months have higher consumption due to heating
    const factors = [
      1.3, 1.4, 1.2, 1.0, 0.8, 0.7,  // Jan-Jun
      0.7, 0.8, 0.9, 1.0, 1.2, 1.3   // Jul-Dec
    ];
    return factors[month];
  }

  static getAverageTemperature(month) {
    // Average temperatures in Germany by month (Celsius)
    const temps = [1, 3, 7, 12, 17, 20, 22, 22, 18, 12, 6, 2];
    return temps[month];
  }

  static getHeatingDegreeDays(month) {
    // Heating degree days for Germany by month
    const hdd = [450, 380, 280, 150, 50, 10, 0, 0, 30, 150, 280, 420];
    return hdd[month];
  }

  static getRandomDateInPast(days) {
    const date = new Date();
    date.setDate(date.getDate() - Math.floor(Math.random() * days));
    return date;
  }

  static getRandomFutureDate(days) {
    const date = new Date();
    date.setDate(date.getDate() + Math.floor(Math.random() * days));
    return date;
  }

  static getRandomFromArray(array) {
    return array[Math.floor(Math.random() * array.length)];
  }

  // ================================
  // INITIALIZATION METHODS
  // ================================

  static initializeTestData() {
    console.log('🔄 Initialisiere umfassende Test-Daten...');

    // Generate test customers
    const customers = [];
    for (let i = 0; i < 50; i++) {
      const customer = this.generateCustomer();
      customers.push(customer);
      mockDatabase.createCustomer(customer);
    }

    // Generate test tariffs
    const tariffs = [];
    const tariffTypes = ['fest', 'dynamisch', 'gruen', 'basic'];
    
    tariffTypes.forEach(type => {
      for (let i = 0; i < 3; i++) {
        const tariff = this.generateTariff({ tarif_typ: type });
        tariffs.push(tariff);
        mockDatabase.createTariff(tariff);
      }
    });

    // Generate price data for all PLZ and tariff combinations
    const plzList = ['10115', '20095', '80331', '50667', '60311'];
    tariffs.forEach(tariff => {
      plzList.forEach(plz => {
        const priceData = this.generatePriceData(plz, tariff.id);
        mockDatabase.createPrice(priceData);
      });
    });

    // Generate contracts for customers
    customers.forEach(customer => {
      if (Math.random() > 0.3) { // 70% have contracts
        const randomTariff = this.getRandomFromArray(tariffs);
        const contract = this.generateContract(customer.kunden_id, randomTariff.id);
        mockDatabase.createContract(contract);
      }
    });

    // Generate consumption history for customers with contracts
    customers.forEach(customer => {
      if (mockDatabase.findContractsByCustomerId(customer.kunden_id).length > 0) {
        const consumptionHistory = this.generateConsumptionHistory(customer.kunden_id, 12);
        consumptionHistory.forEach(consumption => {
          mockDatabase.createConsumption(consumption);
        });
      }
    });

    const stats = mockDatabase.getStats();
    console.log('✅ Test-Daten erfolgreich initialisiert:');
    console.log(`   - ${stats.customers} Kunden`);
    console.log(`   - ${stats.tariffs} Tarife`);
    console.log(`   - ${stats.prices} Preisdatensätze`);
    console.log(`   - ${stats.contracts} Verträge`);
    console.log(`   - ${stats.consumption} Verbrauchsdaten`);
    console.log(`   - ${stats.plzData} PLZ-Datensätze`);
  }
}

module.exports = DummyDataGenerator;