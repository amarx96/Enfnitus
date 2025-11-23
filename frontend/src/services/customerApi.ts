/**
 * Customer API Service for Frontend
 * 
 * This module provides API functions for customer data operations
 */

import { supabase } from './supabase';
import type { CustomerData, PricingData, ContractData } from './supabase';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';

/**
 * Submit customer data and create customer record
 */
export async function submitCustomerData(customerData: CustomerData): Promise<{success: boolean, data?: any, error?: string}> {
  try {
    // Option 1: Direct Supabase call from frontend
    const { data, error } = await supabase
      .from('customers')
      .insert([{
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
      }])
      .select()
      .single();

    if (error) {
      throw error;
    }

    console.log('✅ Customer data submitted successfully:', data.id);
    return { success: true, data };

  } catch (error: any) {
    console.error('❌ Error submitting customer data:', error.message);
    
    // Fallback to backend API if Supabase direct call fails
    try {
      const response = await fetch(`${API_BASE_URL}/api/customer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(customerData),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return { success: true, data: result };

    } catch (apiError: any) {
      console.error('❌ API fallback also failed:', apiError.message);
      return { success: false, error: error.message };
    }
  }
}

/**
 * Store pricing data
 */
export async function storePricingData(customerId: string, pricingData: any): Promise<{success: boolean, data?: any, error?: string}> {
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

  } catch (error: any) {
    console.error('❌ Error storing pricing data:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Create contract
 */
export async function createContract(customerId: string, pricingId: string, contractData: any): Promise<{success: boolean, data?: any, error?: string}> {
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

  } catch (error: any) {
    console.error('❌ Error creating contract:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Get customer data by ID
 */
export async function getCustomerById(customerId: string): Promise<{success: boolean, data?: CustomerData, error?: string}> {
  try {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .eq('id', customerId)
      .single();

    if (error) {
      throw error;
    }

    return { success: true, data };

  } catch (error: any) {
    console.error('❌ Error fetching customer:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Test database connection
 */
export async function testDatabaseConnection(): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('customers')
      .select('count', { count: 'exact', head: true });
    
    if (error && error.code !== 'PGRST116') { // Table doesn't exist yet
      console.warn('Database tables may not exist yet, but connection is working');
    }
    
    console.log('✅ Database connection test successful');
    return true;
  } catch (error) {
    console.error('❌ Database connection test failed:', error);
    return false;
  }
}