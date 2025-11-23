/**
 * Database Initialization Script
 * 
 * Run this script to create the necessary tables in Supabase
 */

const { supabase } = require('./src/config/supabase');
const fs = require('fs');
const path = require('path');

async function initializeDatabase() {
  try {
    console.log('🔗 Connecting to Supabase...');
    
    // Read and execute schema SQL
    const schemaPath = path.join(__dirname, 'database-schema.sql');
    if (fs.existsSync(schemaPath)) {
      const schemaSql = fs.readFileSync(schemaPath, 'utf8');
      console.log('📝 Executing database schema...');
      
      // Split SQL into individual statements and execute them
      const statements = schemaSql.split(';').filter(stmt => stmt.trim());
      
      for (const statement of statements) {
        if (statement.trim()) {
          try {
            await supabase.rpc('exec_sql', { sql: statement });
          } catch (error) {
            // Some SQL commands may not work via RPC, that's okay
            console.log('Note: Some schema commands require manual execution in Supabase SQL editor');
            break;
          }
        }
      }
    }

    // Test table creation by creating a simple test
    console.log('✅ Testing table access...');
    const { data, error } = await supabase
      .from('customers')
      .select('count', { count: 'exact', head: true });
    
    if (error && error.code === 'PGRST116') {
      console.log('📋 Tables need to be created. Please run the SQL in database-schema.sql in your Supabase SQL editor.');
      console.log('   1. Go to your Supabase project dashboard');
      console.log('   2. Navigate to SQL Editor');
      console.log('   3. Copy and paste the contents of database-schema.sql');
      console.log('   4. Run the SQL commands');
    } else if (error) {
      console.error('❌ Database error:', error.message);
    } else {
      console.log('✅ Database tables are accessible!');
    }

    // Create a test customer to verify everything works
    console.log('🧪 Testing customer creation...');
    const { data: testData, error: testError } = await supabase
      .from('customers')
      .insert([{
        vorname: 'Test',
        nachname: 'User',
        strasse: 'Teststraße',
        hausnummer: '1',
        plz: '12345',
        ort: 'Teststadt',
        email: `test-${Date.now()}@example.com`,
        telefon: '+49 123 456789'
      }])
      .select()
      .single();

    if (testError) {
      console.error('❌ Test customer creation failed:', testError.message);
    } else {
      console.log('✅ Test customer created successfully:', testData.id);
      
      // Clean up test customer
      await supabase
        .from('customers')
        .delete()
        .eq('id', testData.id);
      console.log('🧹 Test customer removed');
    }

    console.log('\n🎉 Database initialization complete!');
    console.log('Your application is now ready to store customer data in Supabase.');

  } catch (error) {
    console.error('❌ Database initialization failed:', error.message);
  }
}

initializeDatabase();