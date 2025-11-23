/**
 * Customer Database Service
 * 
 * This module provides database operations for customer data using Supabase
 */

const { supabase } = require('../config/supabase');

/**
 * Create a new customer record
 */
async function createCustomer(customerData) {
  try {
    // Prepare customer data for insertion
    const insertData = {
      vorname: customerData.vorname,
      nachname: customerData.nachname,
      strasse: customerData.strasse,
      hausnummer: customerData.hausnummer,
      plz: customerData.plz,
      ort: customerData.ort,
      email: customerData.email,
      telefon: customerData.telefon || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // Add optional fields if they exist
    if (customerData.geburtsdatum) {
      insertData.geburtsdatum = customerData.geburtsdatum;
    }
    if (customerData.bezirk) {
      insertData.bezirk = customerData.bezirk;
    }
    if (customerData.agbAkzeptiert !== undefined) {
      insertData.agb_akzeptiert = customerData.agbAkzeptiert;
    }
    if (customerData.datenschutzAkzeptiert !== undefined) {
      insertData.datenschutz_akzeptiert = customerData.datenschutzAkzeptiert;
    }
    if (customerData.marketingEinverstaendnis !== undefined) {
      insertData.marketing_einverstaendnis = customerData.marketingEinverstaendnis;
    }
    if (customerData.newsletterEinverstaendnis !== undefined) {
      insertData.newsletter_einverstaendnis = customerData.newsletterEinverstaendnis;
    }
    if (customerData.notizen) {
      insertData.notizen = customerData.notizen;
    }
    if (customerData.passwortHash) {
      insertData.passwort_hash = customerData.passwortHash;
    }

    const { data, error } = await supabase
      .from('customers')
      .insert([insertData])
      .select()
      .single();

    if (error) {
      throw error;
    }

    // Map the response to match expected format
    const mappedData = {
      ...data,
      customer_id: data.id // Add customer_id field for consistency
    };

    console.log('✅ Customer created successfully:', data.id);
    return { success: true, data: mappedData };
  } catch (error) {
    console.error('❌ Error creating customer:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Get customer by ID
 */
async function getCustomerById(customerId) {
  try {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .eq('id', customerId)
      .single();

    if (error) {
      throw error;
    }

    // Map the response to match expected format
    const mappedData = data ? {
      ...data,
      customer_id: data.id
    } : null;

    return { success: true, data: mappedData };
  } catch (error) {
    console.error('❌ Error fetching customer:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Get customer by email
 */
async function getCustomerByEmail(email) {
  try {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .eq('email', email)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    // Map the response to match expected format  
    const mappedData = data ? {
      ...data,
      customer_id: data.id
    } : null;

    return { success: true, data: mappedData };
  } catch (error) {
    console.error('❌ Error fetching customer by email:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Update customer data
 */
async function updateCustomer(customerId, customerData) {
  try {
    const { data, error } = await supabase
      .from('customers')
      .update({
        ...customerData,
        updated_at: new Date().toISOString()
      })
      .eq('id', customerId)
      .select()
      .single();

    if (error) {
      throw error;
    }

    // Map the response to match expected format
    const mappedData = {
      ...data,
      customer_id: data.id
    };

    console.log('✅ Customer updated successfully:', customerId);
    return { success: true, data: mappedData };
  } catch (error) {
    console.error('❌ Error updating customer:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Store pricing data
 */
async function storePricingData(customerId, pricingData) {
  try {
    const { data, error } = await supabase
      .from('pricing_data')
      .insert([{
        customer_id: customerId,
        plz: pricingData.plz,
        verbrauch: pricingData.verbrauch,
        haushaltsgroesse: pricingData.haushaltsgroesse,
        smart_meter: pricingData.smartMeter,
        selected_tariff: pricingData.selectedTariff,
        estimated_costs: pricingData.estimatedCosts,
        created_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (error) {
      throw error;
    }

    console.log('✅ Pricing data stored successfully:', data.id);
    return { success: true, data };
  } catch (error) {
    console.error('❌ Error storing pricing data:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Create contract record
 */
async function createContract(customerId, pricingId, contractData) {
  try {
    const { data, error } = await supabase
      .from('contracts')
      .insert([{
        customer_id: customerId,
        pricing_id: pricingId,
        contract_number: contractData.contractNumber,
        status: 'draft',
        terms_accepted: contractData.termsAccepted || false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (error) {
      throw error;
    }

    console.log('✅ Contract created successfully:', data.id);
    return { success: true, data };
  } catch (error) {
    console.error('❌ Error creating contract:', error.message);
    return { success: false, error: error.message };
  }
}

module.exports = {
  createCustomer,
  getCustomerById,
  getCustomerByEmail,
  updateCustomer,
  storePricingData,
  createContract
};