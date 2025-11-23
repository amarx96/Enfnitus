/**
 * Voucher Service für Backend
 * Validierung und Anwendung von Voucher Codes
 */

const { supabase } = require('../config/supabase');
const logger = require('../utils/logger');

// Development Voucher Data (when database is disabled)
const DEVELOPMENT_VOUCHERS = {
  'WELCOME2025': {
    id: 1,
    voucher_code: 'WELCOME2025',
    campaign_name: 'Willkommen 2025',
    discount_type: 'percentage',
    discount_value: 25,
    applicable_tariffs: ['standard', 'dynamic', 'green'],
    start_date: '2025-01-01',
    end_date: '2025-12-31',
    is_active: true,
    usage_limit: 1000,
    used_count: 0,
    created_at: '2025-01-01T00:00:00.000Z'
  },
  'GREEN50': {
    id: 2,
    voucher_code: 'GREEN50',
    campaign_name: 'Grün sparen',
    discount_type: 'fixed',
    discount_value: 50,
    applicable_tariffs: ['green'],
    start_date: '2025-01-01',
    end_date: '2025-12-31',
    is_active: true,
    usage_limit: 500,
    used_count: 0,
    created_at: '2025-01-01T00:00:00.000Z'
  },
  'NEUKUNDE10': {
    id: 3,
    voucher_code: 'NEUKUNDE10',
    campaign_name: 'Neukunden Rabatt',
    discount_type: 'percentage',
    discount_value: 10,
    applicable_tariffs: ['standard', 'dynamic', 'green'],
    start_date: '2025-01-01',
    end_date: '2025-12-31',
    is_active: true,
    usage_limit: 100,
    used_count: 0,
    created_at: '2025-01-01T00:00:00.000Z'
  },
  'WINTER2025': {
    id: 4,
    voucher_code: 'WINTER2025',
    campaign_name: 'Winter Aktion',
    discount_type: 'percentage',
    discount_value: 15,
    applicable_tariffs: ['standard', 'dynamic'],
    start_date: '2025-11-01',
    end_date: '2025-03-31',
    is_active: true,
    usage_limit: 200,
    used_count: 0,
    created_at: '2025-11-01T00:00:00.000Z'
  }
};

// Check if we're running in development mode without database
const isDatabaseDisabled = !supabase || process.env.NODE_ENV === 'development';

/**
 * Voucher Code validieren
 * @param {string} voucherCode - Der eingegebene Voucher Code
 * @param {string} tariffId - Die Tarif ID für die Validierung
 * @returns {Object} Validierungsergebnis
 */
async function validateVoucherCode(voucherCode, tariffId) {
  try {
    logger.info(`Validating voucher code: ${voucherCode} for tariff: ${tariffId}`);

    let voucher;
    
    // Use development data if database is disabled
    if (isDatabaseDisabled) {
      voucher = DEVELOPMENT_VOUCHERS[voucherCode.toUpperCase()];
      
      if (!voucher || !voucher.is_active) {
        return {
          isValid: false,
          message: 'Voucher Code nicht gefunden oder nicht aktiv',
          code: 'VOUCHER_NOT_FOUND'
        };
      }
    } else {
      // Use database in production
      const { data, error } = await supabase
        .from('voucher_codes')
        .select('*')
        .eq('voucher_code', voucherCode.toUpperCase())
        .eq('is_active', true)
        .single();

      if (error || !data) {
        return {
          isValid: false,
          message: 'Voucher Code nicht gefunden oder nicht aktiv',
          code: 'VOUCHER_NOT_FOUND'
        };
      }
      
      voucher = data;
    }

    // Zeitraum prüfen
    const now = new Date();
    const startDate = new Date(voucher.start_date);
    const endDate = new Date(voucher.end_date);

    if (now < startDate) {
      return {
        isValid: false,
        message: `Voucher Code ist erst ab ${startDate.toLocaleDateString('de-DE')} gültig`,
        code: 'VOUCHER_NOT_YET_VALID'
      };
    }

    if (now > endDate) {
      return {
        isValid: false,
        message: `Voucher Code ist seit ${endDate.toLocaleDateString('de-DE')} abgelaufen`,
        code: 'VOUCHER_EXPIRED'
      };
    }

    // Nutzungslimit prüfen
    const usageCount = voucher.current_usage_count || voucher.used_count || 0;
    const usageLimit = voucher.max_usage_count || voucher.usage_limit;
    
    if (usageLimit && usageCount >= usageLimit) {
      return {
        isValid: false,
        message: 'Voucher Code wurde bereits maximal oft verwendet',
        code: 'VOUCHER_USAGE_LIMIT_REACHED'
      };
    }

    // Tarif-Kompatibilität prüfen
    // Extract base tariff name from tariff ID (e.g., 'standard-10115' -> 'standard')
    const baseTariffName = tariffId.split('-')[0];
    
    // Check if voucher supports this tariff type
    const applicableTariffs = voucher.applicable_tariffs || [voucher.tariff_id];
    if (!applicableTariffs.includes(baseTariffName) && !applicableTariffs.includes(tariffId)) {
      return {
        isValid: false,
        message: `Voucher Code ist nicht für diesen Tarif gültig`,
        code: 'VOUCHER_TARIFF_MISMATCH'
      };
    }

    // Voucher ist gültig
    return {
      isValid: true,
      voucher: voucher,
      discounts: {
        type: voucher.discount_type,
        value: voucher.discount_value,
        workingPriceReduction: voucher.discount_working_price || 0,
        basePriceReduction: voucher.discount_base_price || 0
      },
      message: 'Voucher Code erfolgreich angewendet!'
    };

  } catch (error) {
    logger.error('Error validating voucher code:', error);
    return {
      isValid: false,
      message: 'Fehler bei der Voucher-Validierung',
      code: 'VALIDATION_ERROR'
    };
  }
}

/**
 * Tarif-Preise mit Voucher-Rabatt berechnen
 * @param {Object} tariff - Original Tarif-Objekt
 * @param {Object} voucher - Voucher-Objekt
 * @returns {Object} Tarif mit angepassten Preisen
 */
function applyVoucherDiscount(tariff, voucher) {
  try {
    const originalTariff = { ...tariff };
    const discountedTariff = { ...tariff };

    let savings = 0;
    
    // Apply discount based on type
    if (voucher.discount_type === 'percentage') {
      // Percentage discount applies to total monthly costs
      const originalMonthlyCost = tariff.estimatedCosts?.monthlyCosts || tariff.kosten?.monatliche_kosten || 0;
      const discountAmount = originalMonthlyCost * (voucher.discount_value / 100);
      const newMonthlyCost = originalMonthlyCost - discountAmount;
      
      // Update costs
      if (discountedTariff.estimatedCosts) {
        discountedTariff.estimatedCosts.monthlyCosts = newMonthlyCost;
        discountedTariff.estimatedCosts.totalAnnualCosts = newMonthlyCost * 12;
      }
      
      if (discountedTariff.kosten) {
        discountedTariff.kosten.monatliche_kosten = newMonthlyCost;
        discountedTariff.kosten.gesamtkosten_jahr = newMonthlyCost * 12;
      }
      
      savings = discountAmount;
      
    } else if (voucher.discount_type === 'fixed') {
      // Fixed EUR discount per month
      const originalMonthlyCost = tariff.estimatedCosts?.monthlyCosts || tariff.kosten?.monatliche_kosten || 0;
      const newMonthlyCost = Math.max(0, originalMonthlyCost - voucher.discount_value);
      
      // Update costs
      if (discountedTariff.estimatedCosts) {
        discountedTariff.estimatedCosts.monthlyCosts = newMonthlyCost;
        discountedTariff.estimatedCosts.totalAnnualCosts = newMonthlyCost * 12;
      }
      
      if (discountedTariff.kosten) {
        discountedTariff.kosten.monatliche_kosten = newMonthlyCost;
        discountedTariff.kosten.gesamtkosten_jahr = newMonthlyCost * 12;
      }
      
      savings = Math.min(voucher.discount_value, originalMonthlyCost);
    }

    // Add voucher information to tariff
    discountedTariff.voucher_applied = {
      voucher_code: voucher.voucher_code,
      campaign_name: voucher.campaign_name,
      discount_type: voucher.discount_type,
      discount_value: voucher.discount_value,
      savings_per_month: savings,
      savings_per_year: savings * 12
    };

    return {
      success: true,
      originalTariff: originalTariff,
      discountedTariff: discountedTariff,
      savings: {
        monthly: savings,
        yearly: savings * 12,
        percentage: voucher.discount_type === 'percentage' ? voucher.discount_value : 
                   ((savings / (tariff.estimatedCosts?.monthlyCosts || tariff.kosten?.monatliche_kosten || 1)) * 100)
      }
    };

  } catch (error) {
    logger.error('Error applying voucher discount:', error);
    return {
      success: false,
      message: 'Fehler bei der Rabatt-Anwendung'
    };
  }
}

/**
 * Voucher-Nutzung tracken
 * @param {string} voucherCodeId - Voucher Code ID
 * @param {string} customerId - Customer ID
 * @param {string} tariffId - Tariff ID
 * @param {number} originalCost - Ursprüngliche Kosten
 * @param {number} discountedCost - Reduzierte Kosten
 */
async function trackVoucherUsage(voucherCodeId, customerId, tariffId, originalCost, discountedCost) {
  try {
    // In development mode, just log the usage
    if (isDatabaseDisabled) {
      logger.info(`Voucher usage tracked (dev mode): ${voucherCodeId} for customer ${customerId}`);
      return { success: true };
    }

    const savingsAmount = originalCost - discountedCost;

    // Voucher-Nutzung speichern
    const { error: usageError } = await supabase
      .from('voucher_usage')
      .insert([{
        voucher_code_id: voucherCodeId,
        customer_id: customerId,
        tariff_id: tariffId,
        original_monthly_cost: originalCost,
        discounted_monthly_cost: discountedCost,
        savings_amount: savingsAmount
      }]);

    if (usageError) throw usageError;

    // Nutzungszähler erhöhen
    const { error: updateError } = await supabase
      .from('voucher_codes')
      .update({ 
        current_usage_count: supabase.sql`current_usage_count + 1`,
        updated_at: new Date().toISOString()
      })
      .eq('id', voucherCodeId);

    if (updateError) throw updateError;

    logger.info(`Voucher usage tracked: ${voucherCodeId} for customer: ${customerId}`);
    return true;

  } catch (error) {
    logger.error('Error tracking voucher usage:', error);
    return false;
  }
}

/**
 * Alle aktiven Voucher Codes abrufen (für Admin)
 */
async function getActiveVouchers() {
  try {
    const { data: vouchers, error } = await supabase
      .from('voucher_codes')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return vouchers;

  } catch (error) {
    logger.error('Error fetching active vouchers:', error);
    return [];
  }
}

module.exports = {
  validateVoucherCode,
  applyVoucherDiscount,
  trackVoucherUsage,
  getActiveVouchers
};