/**
 * Supabase Database Client Configuration
 * 
 * This module sets up the Supabase client for backend operations
 */

const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

let supabase;

// Handle missing configuration
if (!supabaseUrl || !supabaseKey) {
  if (process.env.NODE_ENV === 'test' || process.env.CI === 'true') {
    console.warn('⚠️ Missing Supabase configuration in Test/CI environment. Using mock client.');
    // Create a dummy object for tests to prevent import crashes
    supabase = {
      from: () => ({
        select: () => Promise.resolve({ data: [], error: null }),
        insert: () => Promise.resolve({ data: [], error: null }),
        update: () => Promise.resolve({ data: [], error: null }),
        delete: () => Promise.resolve({ data: [], error: null }),
      }),
      auth: {
        signUp: () => Promise.resolve({ data: {}, error: null }),
        signIn: () => Promise.resolve({ data: {}, error: null }),
      }
    };
  } else {
    console.error('Missing Supabase configuration. Please check your environment variables (SUPABASE_URL, SUPABASE_ANON_KEY).');
    // In production/dev, we want to fail fast if config is missing
    if (process.env.NODE_ENV === 'production') {
        process.exit(1);
    } else {
        console.warn('Running without Supabase connection (Mock Mode potentially active).');
    }
  }
} else {
  // Create real Supabase client
  try {
      supabase = createClient(supabaseUrl, supabaseKey);
  } catch (error) {
      console.error('Failed to create Supabase client:', error.message);
  }
}

/**
 * Test database connection
 */
async function testConnection() {
  if (!supabase || !supabaseUrl) return false;
  
  try {
    const { data, error } = await supabase
      .from('customers')
      .select('count', { count: 'exact', head: true });
    
    if (error && error.code !== 'PGRST116') { // PGRST116 is "relation does not exist"
      throw error;
    }
    
    console.log('✅ Supabase connection successful');
    return true;
  } catch (error) {
    console.error('❌ Supabase connection failed:', error.message);
    return false;
  }
}

module.exports = {
  supabase,
  testConnection
};