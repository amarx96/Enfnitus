const rabotPricingService = require('./rabotPricingService');
const logger = require('../utils/logger');
const database = require('../config/database');

class PricingService {
  constructor() {
    // Mock Margins for Development/Fallback
    this.mockMargins = [
        { funnel_id: 'enfinitus-website', tariff_type: 'FIX12', margin_working_price_ct: 1.5, margin_base_price_eur: 2.0 },
        { funnel_id: 'viet-energie-website', tariff_type: 'FIX12', margin_working_price_ct: 1.2, margin_base_price_eur: 1.8 }
    ];
  }

  /**
   * Calculate pricing for a specific postal code and consumption
   * Uses Rabot Energy as the pricing source + Enfinitus Margins
   * @param {string} plz - 5-digit postal code
   * @param {number} jahresverbrauch - Annual consumption in kWh
   * @param {number} haushaltgroesse - Household size
   * @param {string} tariftyp - Tariff type (standard, green, dynamic)
   * @param {string} funnelId - Funnel ID (enfinitus-website, viet-energie-website)
   * @returns {Promise<Object>} Pricing calculation result
   */
  async calculatePricing(plz, jahresverbrauch = null, haushaltgroesse = 2, tariftyp = 'standard', funnelId = 'enfinitus-website') {
    try {
      // Fetch pricing from Rabot Energy
      const rabotPricing = await rabotPricingService.getPricing(plz);
      
      // Estimate consumption if not provided
      if (!jahresverbrauch) {
        jahresverbrauch = this.estimateConsumption(haushaltgroesse);
      }

      // Map tariff type to Rabot tariff keys if necessary
      // Rabot mock returns: standard, green, dynamic
      const rabotTariffKey = tariftyp === 'oeko' ? 'green' : (tariftyp === 'dynamisch' ? 'dynamic' : 'standard');
      const tariffData = rabotPricing.tariffs[rabotTariffKey] || rabotPricing.tariffs['standard'];

      if (!tariffData) {
        throw new Error(`Tariff type ${tariftyp} not available from Rabot`);
      }

      // --- APPLY MARGINS ---
      let margin = { margin_working_price_ct: 0, margin_base_price_eur: 0 };
      try {
        // Map tariff type to Margin types: FIX12, GREEN, DYNAMIC
        let marginType = 'FIX12';
        if (tariftyp === 'oeko') marginType = 'GREEN';
        if (tariftyp === 'dynamisch') marginType = 'DYNAMIC';
        if (tariftyp === 'standard') marginType = 'FIX12';
        
        // Check DB connection or use Mock
        const pool = await database.connect();
        if (pool) { 
             const marginRes = await database.query(
                'SELECT * FROM pricing_margins WHERE funnel_id = $1 AND tariff_type = $2',
                [funnelId, marginType]
             );
             if (marginRes.rows.length > 0) {
                 margin = marginRes.rows[0];
             }
        } else {
             // Use Mock Storage
             const mock = this.mockMargins.find(m => m.funnel_id === funnelId && m.tariff_type === marginType);
             if (mock) margin = mock;
        }
      } catch (err) {
          logger.warn('Failed to fetch margins', err);
          // Continue with 0 margin
      }

      // Calculate final prices
      // Rabot returns energy_price_ct_kwh and base_price_eur_month
      const finalWorkingPrice = tariffData.energy_price_ct_kwh + parseFloat(margin.margin_working_price_ct || 0);
      const finalBasePrice = tariffData.base_price_eur_month + parseFloat(margin.margin_base_price_eur || 0);

      const arbeitspreisJahr = (jahresverbrauch * finalWorkingPrice) / 100; // Convert ct to EUR
      const grundpreisJahr = finalBasePrice * 12;
      const gesamtkostenJahr = arbeitspreisJahr + grundpreisJahr;
      const monatlicheKosten = gesamtkostenJahr / 12;

      // Calculate potential savings vs average market price
      const marktpreisVergleich = this.calculateMarketComparison(gesamtkostenJahr, jahresverbrauch);

      // Generate alternative tariffs list
      const alternativeTariffs = await this.calculateAlternativesWithMargins(rabotPricing.tariffs, jahresverbrauch, rabotTariffKey, funnelId);

      return {
        erfolg: true,
        daten: {
          location: {
            plz: plz,
            district: rabotPricing.region,
            network_operator: rabotPricing.grid_operator
          },
          consumption: {
            annual_kwh: jahresverbrauch,
            household_size: haushaltgroesse,
            estimated: !jahresverbrauch // true if we estimated it
          },
          tarife: [
            {
              id: `${rabotTariffKey}-${plz}`,
              name: tariffData.name,
              type: tariffData.type,
              description: `Power by Rabot Energy - ${tariffData.type}`,
              preise: {
                arbeitspreis_netto: (finalWorkingPrice / 1.19).toFixed(4), // approx net, 4 decimals for AP
                arbeitspreis_brutto: finalWorkingPrice,
                grundpreis_netto: (finalBasePrice / 1.19).toFixed(2),
                grundpreis_brutto: finalBasePrice,
                einheit_arbeitspreis: "ct/kWh",
                einheit_grundpreis: "EUR/monat"
              },
              kosten: {
                arbeitspreis_jahr: Math.round(arbeitspreisJahr * 100) / 100,
                grundpreis_jahr: Math.round(grundpreisJahr * 100) / 100,
                gesamtkosten_jahr: Math.round(gesamtkostenJahr * 100) / 100,
                monatliche_kosten: Math.round(monatlicheKosten * 100) / 100,
                kosten_pro_kwh: Math.round((gesamtkostenJahr / jahresverbrauch) * 100) / 100
              },
              ersparnis: marktpreisVergleich,
              empfohlen: rabotTariffKey === 'green' || (rabotTariffKey === 'standard' && jahresverbrauch > 2500)
            }
          ],
          alternative_tarife: alternativeTariffs,
          next_steps: {
            registration_url: "/customer",
            estimated_activation_days: 14,
            contract_minimum_term: `${tariffData.guarantee_months || 12} months`
          }
        }
      };
    } catch (error) {
      logger.error('Pricing calculation failed', { error: error.message, plz });
      throw error;
    }
  }

  /**
   * Calculate alternatives from Rabot tariffs applying Margins
   */
  async calculateAlternativesWithMargins(tariffs, jahresverbrauch, currentKey, funnelId) {
    const alternatives = [];
    const keys = Object.keys(tariffs);
    
    for (const key of keys) {
      if (key !== currentKey) {
        const t = tariffs[key];
        
        // Determine Tariff Type for Margin Lookup
        let marginType = 'FIX12';
        if (key === 'green') marginType = 'GREEN';
        if (key === 'dynamic') marginType = 'DYNAMIC';
        if (key === 'standard') marginType = 'FIX12';
        
        let margin = { margin_working_price_ct: 0, margin_base_price_eur: 0 };
        try {
           const pool = await database.connect();
           if (pool) {
             const res = await database.query(
                'SELECT * FROM pricing_margins WHERE funnel_id = $1 AND tariff_type = $2',
                [funnelId, marginType]
             );
             if (res.rows.length > 0) margin = res.rows[0];
           } else {
               const mock = this.mockMargins.find(m => m.funnel_id === funnelId && m.tariff_type === marginType);
               if (mock) margin = mock;
           }
        } catch (e) { /* ignore */ }

        const finalWorkingPrice = t.energy_price_ct_kwh + parseFloat(margin.margin_working_price_ct || 0);
        const finalBasePrice = t.base_price_eur_month + parseFloat(margin.margin_base_price_eur || 0);

        const total = ((jahresverbrauch * finalWorkingPrice) / 100) + (finalBasePrice * 12);
        alternatives.push({
          id: `${key}-rabot`,
          name: t.name,
          type: t.type,
          monatliche_kosten: Math.round((total / 12) * 100) / 100,
          jahreskosten: Math.round(total * 100) / 100
        });
      }
    }
    return alternatives;
  }

  /**
   * Get all pricing margins (Ops)
   */
  async getMargins() {
      if (!database.getPool()) {
          return this.mockMargins;
      }
      const res = await database.query('SELECT * FROM pricing_margins ORDER BY funnel_id, tariff_type');
      return res.rows;
  }

  /**
   * Update or Insert a margin (Ops)
   */
  async updateMargin(data) {
      const { funnelId, tariffType, marginWorkingPrice, marginBasePrice } = data;

      if (!database.getPool()) {
          logger.info('Mock update margin', data);
          const existingIndex = this.mockMargins.findIndex(m => m.funnel_id === funnelId && m.tariff_type === tariffType);
          if (existingIndex >= 0) {
              this.mockMargins[existingIndex] = {
                  funnel_id: funnelId,
                  tariff_type: tariffType,
                  margin_working_price_ct: parseFloat(marginWorkingPrice),
                  margin_base_price_eur: parseFloat(marginBasePrice)
              };
          } else {
              this.mockMargins.push({
                  funnel_id: funnelId,
                  tariff_type: tariffType,
                  margin_working_price_ct: parseFloat(marginWorkingPrice),
                  margin_base_price_eur: parseFloat(marginBasePrice)
              });
          }
          return { success: true }; 
      }
      
      await database.query(`
          INSERT INTO pricing_margins (funnel_id, tariff_type, margin_working_price_ct, margin_base_price_eur, updated_at)
          VALUES ($1, $2, $3, $4, NOW())
          ON CONFLICT (funnel_id, tariff_type) 
          DO UPDATE SET 
            margin_working_price_ct = EXCLUDED.margin_working_price_ct,
            margin_base_price_eur = EXCLUDED.margin_base_price_eur,
            updated_at = NOW()
      `, [funnelId, tariffType, marginWorkingPrice, marginBasePrice]);
      
      return { success: true };
  }

  mapTariffType(tariftyp) {
      if (tariftyp === 'oeko') return 'GREEN';
      if (tariftyp === 'dynamisch') return 'DYNAMIC';
      return 'FIX12';
  }

  /**
   * Estimate consumption based on household size (with economies of scale)
   * @param {number} haushaltgroesse - Number of people in household
   * @returns {number} Estimated annual consumption in kWh
   */
  estimateConsumption(haushaltgroesse) {
    const baseConsumption = 1500; // kWh base consumption
    const personMultiplier = [
      0,    // 0 persons
      1.0,  // 1 person: 100% = 2300 kWh
      0.85, // 2 persons: 85% efficiency = 3275 kWh  
      0.75, // 3 persons: 75% efficiency = 4200 kWh
      0.70, // 4 persons: 70% efficiency = 4900 kWh
    ];
    
    const persons = Math.min(haushaltgroesse, 4);
    const additionalPerPerson = 800;
    const efficiency = personMultiplier[persons] || 0.70;
    
    return Math.round(baseConsumption + (persons * additionalPerPerson * efficiency));
  }

  /**
   * Calculate savings compared to average market prices
   * @param {number} gesamtkostenJahr - Total annual costs
   * @param {number} jahresverbrauch - Annual consumption
   * @returns {Object} Savings comparison
   */
  calculateMarketComparison(gesamtkostenJahr, jahresverbrauch) {
    // Average German electricity price (2025): ~35 ct/kWh + 12 EUR/month base
    const marktpreisKwhCent = 35;
    const marktpreisGrundEur = 12;
    const marktpreisJahr = (jahresverbrauch * marktpreisKwhCent / 100) + (marktpreisGrundEur * 12);
    
    const ersparnis = marktpreisJahr - gesamtkostenJahr;
    const ersparnisPercent = (ersparnis / marktpreisJahr) * 100;
    
    return {
      marktpreis_jahr: Math.round(marktpreisJahr * 100) / 100,
      enfinitus_jahr: Math.round(gesamtkostenJahr * 100) / 100,
      ersparnis_euro: Math.round(ersparnis * 100) / 100,
      ersparnis_prozent: Math.round(ersparnisPercent * 100) / 100,
      besser_als_markt: ersparnis > 0
    };
  }

  /**
   * Get all supported postal codes
   * With Rabot, we assume broad support, so this is less relevant but kept for compatibility
   * @returns {Array} List of supported postal codes (dummy)
   */
  getSupportedPostalCodes() {
    return ['10115', '10117', '10119', '10178', '10179']; // Examples
  }

  /**
   * Check if a postal code is supported
   * @param {string} plz - Postal code to check
   * @returns {boolean} Whether the postal code is supported
   */
  isPostalCodeSupported(plz) {
    // Assume Rabot supports most German PLZ
    return /^\d{5}$/.test(plz);
  }
}

module.exports = new PricingService();