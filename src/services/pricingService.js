const rabotPricingService = require('./rabotPricingService');
const logger = require('../utils/logger');
const { supabase } = require('../config/supabase');

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
   */
  async calculatePricing(plz, jahresverbrauch = null, haushaltgroesse = 2, tariftyp = 'standard', funnelId = 'enfinitus-website') {
    try {
      // Fetch pricing from Rabot Energy
      const rabotPricing = await rabotPricingService.getPricing(plz);
      
      // Estimate consumption if not provided
      if (!jahresverbrauch) {
        jahresverbrauch = this.estimateConsumption(haushaltgroesse);
      }

      // Map tariff type to Rabot tariff keys
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
        
        // Use Supabase Client
        const { data: marginData, error } = await supabase
            .from('pricing_margins')
            .select('*')
            .eq('funnel_id', funnelId)
            .eq('tariff_type', marginType)
            .single();

        if (marginData) {
             margin = marginData;
        } else if (error && error.code !== 'PGRST116') { // 116 is "row not found"
             // Fallback to mock if error (e.g. connection issue)
             const mock = this.mockMargins.find(m => m.funnel_id === funnelId && m.tariff_type === marginType);
             if (mock) margin = mock;
        }
      } catch (err) {
          logger.warn('Failed to fetch margins', err);
          // Continue with 0 margin
      }

      // Calculate final prices
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
            estimated: !jahresverbrauch
          },
          tarife: [
            {
              id: `${rabotTariffKey}-${plz}`,
              name: tariffData.name,
              type: tariffData.type,
              description: `Power by Rabot Energy - ${tariffData.type}`,
              preise: {
                arbeitspreis_netto: (finalWorkingPrice / 1.19).toFixed(4),
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

  async calculateAlternativesWithMargins(tariffs, jahresverbrauch, currentKey, funnelId) {
    const alternatives = [];
    const keys = Object.keys(tariffs);
    
    for (const key of keys) {
      if (key !== currentKey) {
        const t = tariffs[key];
        
        let marginType = 'FIX12';
        if (key === 'green') marginType = 'GREEN';
        if (key === 'dynamic') marginType = 'DYNAMIC';
        if (key === 'standard') marginType = 'FIX12';
        
        let margin = { margin_working_price_ct: 0, margin_base_price_eur: 0 };
        try {
           const { data: marginData } = await supabase
                .from('pricing_margins')
                .select('*')
                .eq('funnel_id', funnelId)
                .eq('tariff_type', marginType)
                .single();
            
           if (marginData) margin = marginData;
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

  async getMargins() {
      const { data, error } = await supabase.from('pricing_margins').select('*').order('funnel_id');
      if (error || !data) return this.mockMargins;
      return data;
  }

  async updateMargin(data) {
      const { funnelId, tariffType, marginWorkingPrice, marginBasePrice } = data;
      
      const { error } = await supabase
          .from('pricing_margins')
          .upsert({
              funnel_id: funnelId,
              tariff_type: tariffType,
              margin_working_price_ct: parseFloat(marginWorkingPrice),
              margin_base_price_eur: parseFloat(marginBasePrice),
              updated_at: new Date().toISOString()
          }, { onConflict: 'funnel_id, tariff_type' });

      if (error) {
          // Fallback to mock
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
      
      return { success: true };
  }

  mapTariffType(tariftyp) {
      if (tariftyp === 'oeko') return 'GREEN';
      if (tariftyp === 'dynamisch') return 'DYNAMIC';
      return 'FIX12';
  }

  estimateConsumption(haushaltgroesse) {
    const baseConsumption = 1500; 
    const personMultiplier = [0, 1.0, 0.85, 0.75, 0.70];
    const persons = Math.min(haushaltgroesse, 4);
    const additionalPerPerson = 800;
    const efficiency = personMultiplier[persons] || 0.70;
    return Math.round(baseConsumption + (persons * additionalPerPerson * efficiency));
  }

  calculateMarketComparison(gesamtkostenJahr, jahresverbrauch) {
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

  getSupportedPostalCodes() {
    return ['10115', '10117', '10119', '10178', '10179'];
  }

  isPostalCodeSupported(plz) {
    return /^\d{5}$/.test(plz);
  }
}

module.exports = new PricingService();
