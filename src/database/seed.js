const database = require('../config/database');
const logger = require('../utils/logger');

async function seed() {
  try {
    await database.connect();
    logger.info('Starting database seeding...');

    // Seed PLZ data (sample German postal codes)
    await database.query(`
      INSERT INTO plz_data (plz, city, district, federal_state, grid_provider, grid_provider_code) VALUES
      ('10115', 'Berlin', 'Mitte', 'Berlin', 'Stromnetz Berlin', 'SNB'),
      ('80331', 'München', 'Altstadt-Lehel', 'Bayern', 'SWM Netz', 'SWM'),
      ('20095', 'Hamburg', 'Hamburg-Altstadt', 'Hamburg', 'Stromnetz Hamburg', 'SNH'),
      ('50667', 'Köln', 'Innenstadt', 'Nordrhein-Westfalen', 'Rheinenergie', 'RHE'),
      ('60311', 'Frankfurt am Main', 'Innenstadt', 'Hessen', 'Mainova Netz', 'MVN'),
      ('70173', 'Stuttgart', 'Mitte', 'Baden-Württemberg', 'Netze BW', 'NBW'),
      ('40210', 'Düsseldorf', 'Stadtmitte', 'Nordrhein-Westfalen', 'Stadtwerke Düsseldorf', 'SWD'),
      ('04109', 'Leipzig', 'Mitte', 'Sachsen', 'Netz Leipzig', 'NLE'),
      ('01067', 'Dresden', 'Altstadt', 'Sachsen', 'SachsenEnergie Netz', 'SEN'),
      ('30159', 'Hannover', 'Mitte', 'Niedersachsen', 'enercity Netz', 'ENC')
      ON CONFLICT (plz, city, district) DO NOTHING;
    `);

    // Seed tariffs
    await database.query(`
      INSERT INTO tariffs (tariff_name, tariff_type, contract_duration_months, min_consumption_kwh, max_consumption_kwh, target_customer_type, billing_frequency) VALUES
      ('Fix12', 'fixed', 12, 1000, 10000, 'household', 'monthly'),
      ('Fix24', 'fixed', 24, 1000, 15000, 'household', 'monthly'),
      ('Dynamic', 'dynamic', 1, 500, 20000, 'household', 'monthly'),
      ('Green12', 'green', 12, 1000, 10000, 'household', 'monthly'),
      ('Green24', 'green', 24, 1000, 15000, 'household', 'monthly'),
      ('Business12', 'fixed', 12, 5000, 100000, 'business', 'monthly'),
      ('Business24', 'fixed', 24, 5000, 200000, 'business', 'quarterly')
      ON CONFLICT (tariff_name) DO NOTHING;
    `);

    // Create sample pricing campaign
    await database.query(`
      INSERT INTO pricing_campaigns (campaign_id, campaign_name, tariff_id, valid_from, valid_until, is_active, created_by) VALUES
      ('CAMP001', 'Standard Pricing 2024', 1, '2024-01-01', '2024-12-31', true, 'system'),
      ('CAMP002', 'Dynamic Pricing 2024', 3, '2024-01-01', '2024-12-31', true, 'system'),
      ('CAMP003', 'Green Energy 2024', 4, '2024-01-01', '2024-12-31', true, 'system')
      ON CONFLICT (campaign_id) DO NOTHING;
    `);

    // Seed pricing tables with sample data
    const pricingData = [
      // Fix12 pricing
      { campaign: 'CAMP001', plz: '10115', city: 'Berlin', district: 'Mitte', tariff: 1, working_price: 28.50, base_price: 9.90 },
      { campaign: 'CAMP001', plz: '80331', city: 'München', district: 'Altstadt-Lehel', tariff: 1, working_price: 29.20, base_price: 9.90 },
      { campaign: 'CAMP001', plz: '20095', city: 'Hamburg', district: 'Hamburg-Altstadt', tariff: 1, working_price: 27.80, base_price: 9.90 },
      { campaign: 'CAMP001', plz: '50667', city: 'Köln', district: 'Innenstadt', tariff: 1, working_price: 28.90, base_price: 9.90 },
      { campaign: 'CAMP001', plz: '60311', city: 'Frankfurt am Main', district: 'Innenstadt', tariff: 1, working_price: 29.50, base_price: 9.90 },
      
      // Dynamic pricing
      { campaign: 'CAMP002', plz: '10115', city: 'Berlin', district: 'Mitte', tariff: 3, working_price: 25.50, base_price: 4.90 },
      { campaign: 'CAMP002', plz: '80331', city: 'München', district: 'Altstadt-Lehel', tariff: 3, working_price: 26.20, base_price: 4.90 },
      { campaign: 'CAMP002', plz: '20095', city: 'Hamburg', district: 'Hamburg-Altstadt', tariff: 3, working_price: 24.80, base_price: 4.90 },
      
      // Green energy pricing
      { campaign: 'CAMP003', plz: '10115', city: 'Berlin', district: 'Mitte', tariff: 4, working_price: 30.50, base_price: 12.90 },
      { campaign: 'CAMP003', plz: '80331', city: 'München', district: 'Altstadt-Lehel', tariff: 4, working_price: 31.20, base_price: 12.90 },
    ];

    for (const price of pricingData) {
      await database.query(`
        INSERT INTO pricing_tables (campaign_id, plz, city, district, tariff_id, working_price_cent_per_kwh, base_price_euro_per_month, grid_fees_cent_per_kwh, taxes_cent_per_kwh, renewable_surcharge_cent_per_kwh, effective_date)
        VALUES ($1, $2, $3, $4, $5, $6, $7, 6.50, 7.30, 3.75, '2024-01-01')
        ON CONFLICT (campaign_id, plz, city, district, tariff_id, effective_date) DO NOTHING;
      `, [price.campaign, price.plz, price.city, price.district, price.tariff, price.working_price, price.base_price]);
    }

    logger.info('Database seeding completed successfully');
    await database.close();

  } catch (error) {
    logger.error('Seeding failed:', error);
    process.exit(1);
  }
}

// Run seeding if this file is executed directly
if (require.main === module) {
  seed();
}

module.exports = seed;