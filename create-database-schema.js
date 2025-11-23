/**
 * Database Schema Creator for Supabase
 * This script creates all necessary tables in the Supabase database
 */

const fs = require('fs');
const path = require('path');

// Import Supabase configuration
const { supabase } = require('./src/config/supabase');

async function createDatabaseSchema() {
  console.log('🔗 Connecting to Supabase and creating database schema...');

  try {
    // Read the SQL schema file
    const schemaPath = path.join(__dirname, 'database-schema.sql');
    const sqlSchema = fs.readFileSync(schemaPath, 'utf8');

    console.log('📝 SQL Schema loaded, executing...');

    // Split the SQL into individual commands
    const sqlCommands = sqlSchema
      .split(';')
      .map(cmd => cmd.trim())
      .filter(cmd => cmd.length > 0 && !cmd.startsWith('--'));

    // Execute each SQL command
    for (let i = 0; i < sqlCommands.length; i++) {
      const command = sqlCommands[i];
      if (command.length > 0) {
        console.log(`📝 Executing command ${i + 1}/${sqlCommands.length}...`);
        
        try {
          const { data, error } = await supabase.rpc('exec_sql', {
            sql: command
          });

          if (error) {
            // Try alternative method using query
            console.log('⚠️ RPC method failed, trying direct query...');
            const { data: queryData, error: queryError } = await supabase
              .from('_temp_table_check')
              .select('*')
              .limit(1);

            // If this also fails, we need to use a different approach
            console.log('⚠️ Direct database schema creation not available via client.');
            console.log('📋 Please execute the following SQL in your Supabase dashboard:');
            console.log('\n--- COPY THE FOLLOWING SQL TO SUPABASE SQL EDITOR ---');
            console.log(sqlSchema);
            console.log('--- END OF SQL ---\n');
            
            return false;
          }
        } catch (err) {
          console.log(`⚠️ Command ${i + 1} failed: ${err.message}`);
        }
      }
    }

    // Test if tables were created
    console.log('✅ Testing table creation...');
    
    // Test customers table
    const { data: customersTest, error: customersError } = await supabase
      .from('customers')
      .select('*')
      .limit(1);

    if (customersError && customersError.code === 'PGRST116') {
      console.log('❌ Tables not found. Please execute SQL manually in Supabase dashboard.');
      console.log('\n📋 Go to https://app.supabase.com/project/lorqrxsqgvpjjxfbqugy/sql');
      console.log('📋 And execute the SQL from database-schema.sql file\n');
      return false;
    }

    console.log('✅ Database schema created successfully!');
    
    // Test with a sample customer
    console.log('🧪 Testing customer creation...');
    const testCustomer = {
      vorname: 'Test',
      nachname: 'User',
      strasse: 'Teststraße',
      hausnummer: '1',
      plz: '10115',
      ort: 'Berlin',
      email: `test-${Date.now()}@example.com`,
      telefon: '+49 30 12345678'
    };

    const { data: customerData, error: customerError } = await supabase
      .from('customers')
      .insert([testCustomer])
      .select()
      .single();

    if (customerError) {
      console.log(`❌ Test customer creation failed: ${customerError.message}`);
      return false;
    }

    console.log('✅ Test customer created successfully!');
    
    // Clean up test customer
    await supabase
      .from('customers')
      .delete()
      .eq('id', customerData.id);

    console.log('🧹 Test data cleaned up.');

    return true;

  } catch (error) {
    console.error('❌ Database schema creation failed:', error.message);
    return false;
  }
}

// Export for use in other scripts
module.exports = { createDatabaseSchema };

// Run directly if called from command line
if (require.main === module) {
  createDatabaseSchema().then(success => {
    if (success) {
      console.log('\n🎉 Database is ready for use!');
      process.exit(0);
    } else {
      console.log('\n❌ Database setup incomplete. Please check the instructions above.');
      process.exit(1);
    }
  }).catch(error => {
    console.error('\n💥 Fatal error:', error.message);
    process.exit(1);
  });
}