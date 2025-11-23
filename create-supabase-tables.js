// Script to create database tables in Supabase
const { createClient } = require('@supabase/supabase-js');

// Supabase configuration
const supabaseUrl = 'https://lorqrxsqgvpjjxfbqugy.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxvcnFyeHNxZ3Zwamp4ZmJxdWd5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIwNDM5NDMsImV4cCI6MjA3NzYxOTk0M30.ACvZTb2Do2xrwK8oPEHw-AvBE1sU8rPmWoUFFqKxJT0';

const supabase = createClient(supabaseUrl, supabaseKey);

async function createTables() {
  console.log('🚀 Creating Supabase tables...');

  try {
    // Enable UUID extension
    console.log('📋 Enabling UUID extension...');
    const { error: extensionError } = await supabase.rpc('create_extension_if_not_exists', {
      extension_name: 'uuid-ossp'
    });

    if (extensionError) {
      console.log('⚠️ Extension creation may require admin privileges:', extensionError.message);
    }

    // Create customers table
    console.log('👥 Creating customers table...');
    const { error: customersError } = await supabase.rpc('exec', {
      sql: `
        CREATE TABLE IF NOT EXISTS customers (
          id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
          vorname VARCHAR(100) NOT NULL,
          nachname VARCHAR(100) NOT NULL,
          strasse VARCHAR(200) NOT NULL,
          hausnummer VARCHAR(20) NOT NULL,
          plz VARCHAR(10) NOT NULL,
          ort VARCHAR(100) NOT NULL,
          email VARCHAR(255) NOT NULL UNIQUE,
          telefon VARCHAR(50),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    });

    if (customersError) {
      console.error('❌ Error creating customers table:', customersError);
    } else {
      console.log('✅ Customers table created successfully');
    }

    // Create pricing_data table
    console.log('💰 Creating pricing_data table...');
    const { error: pricingError } = await supabase.rpc('exec', {
      sql: `
        CREATE TABLE IF NOT EXISTS pricing_data (
          id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
          customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
          plz VARCHAR(10) NOT NULL,
          verbrauch INTEGER NOT NULL,
          haushaltsgroesse INTEGER NOT NULL,
          smart_meter BOOLEAN DEFAULT FALSE,
          selected_tariff JSONB,
          estimated_costs JSONB,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    });

    if (pricingError) {
      console.error('❌ Error creating pricing_data table:', pricingError);
    } else {
      console.log('✅ Pricing_data table created successfully');
    }

    // Create contracts table
    console.log('📄 Creating contracts table...');
    const { error: contractsError } = await supabase.rpc('exec', {
      sql: `
        CREATE TABLE IF NOT EXISTS contracts (
          id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
          customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
          pricing_id UUID REFERENCES pricing_data(id) ON DELETE SET NULL,
          contract_number VARCHAR(50) UNIQUE,
          status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'pending', 'active', 'cancelled')),
          start_date DATE,
          end_date DATE,
          terms_accepted BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    });

    if (contractsError) {
      console.error('❌ Error creating contracts table:', contractsError);
    } else {
      console.log('✅ Contracts table created successfully');
    }

    console.log('🎉 Database tables setup completed!');

  } catch (error) {
    console.error('❌ Error setting up database:', error);
  }
}

// Alternative: Simple table existence test
async function testTableExistence() {
  console.log('🔍 Testing table existence...');

  try {
    // Test customers table
    const { data: customersTest, error: customersError } = await supabase
      .from('customers')
      .select('id')
      .limit(1);

    if (customersError) {
      console.log('❌ Customers table not accessible:', customersError.message);
    } else {
      console.log('✅ Customers table exists and accessible');
    }

    // Test pricing_data table
    const { data: pricingTest, error: pricingError } = await supabase
      .from('pricing_data')
      .select('id')
      .limit(1);

    if (pricingError) {
      console.log('❌ Pricing_data table not accessible:', pricingError.message);
    } else {
      console.log('✅ Pricing_data table exists and accessible');
    }

    // Test contracts table
    const { data: contractsTest, error: contractsError } = await supabase
      .from('contracts')
      .select('id')
      .limit(1);

    if (contractsError) {
      console.log('❌ Contracts table not accessible:', contractsError.message);
    } else {
      console.log('✅ Contracts table exists and accessible');
    }

  } catch (error) {
    console.error('❌ Error testing tables:', error);
  }
}

// Run the functions
console.log('🗄️ Supabase Database Setup');
console.log('==========================');

testTableExistence()
  .then(() => createTables())
  .then(() => testTableExistence())
  .catch(console.error);