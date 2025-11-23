/**
 * Supabase Client Configuration for Frontend
 * 
 * This module sets up the Supabase client for React frontend operations
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase configuration. Please check your environment variables.');
}

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database Types (TypeScript interfaces)
export interface CustomerData {
  id?: string;
  vorname: string;
  nachname: string;
  strasse: string;
  hausnummer: string;
  plz: string;
  ort: string;
  email: string;
  telefon?: string;
  created_at?: string;
  updated_at?: string;
}

export interface PricingData {
  id?: string;
  customer_id?: string;
  plz: string;
  verbrauch: number;
  haushaltsgroesse: number;
  smart_meter: boolean;
  selected_tariff: any;
  estimated_costs: any;
  created_at?: string;
}

export interface ContractData {
  id?: string;
  customer_id: string;
  pricing_id: string;
  contract_number?: string;
  status: 'draft' | 'pending' | 'active' | 'cancelled';
  start_date?: string;
  end_date?: string;
  terms_accepted: boolean;
  created_at?: string;
  updated_at?: string;
}

/**
 * Test database connection
 */
export async function testConnection(): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('customers')
      .select('count', { count: 'exact', head: true });
    
    if (error && error.code !== 'PGRST116') { // PGRST116 is "relation does not exist"
      throw error;
    }
    
    console.log('✅ Supabase connection successful');
    return true;
  } catch (error) {
    console.error('❌ Supabase connection failed:', error);
    return false;
  }
}

export default supabase;