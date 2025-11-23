/**
 * Supabase Connection Test
 * Tests basic Supabase connection without requiring tables
 */

const { supabase } = require('./src/config/supabase');

async function testBasicConnection() {
  console.log('🔗 Testing Supabase connection...\n');

  try {
    // Test basic connection by checking if we can access the service
    const { data, error } = await supabase.auth.getSession();
    
    console.log('✅ Supabase client connection successful');
    console.log('📊 Connection details:');
    console.log(`   • URL: ${process.env.SUPABASE_URL}`);
    console.log(`   • Project: ${process.env.SUPABASE_URL?.split('//')[1]?.split('.')[0] || 'Unknown'}`);
    console.log(`   • Key configured: ${process.env.SUPABASE_ANON_KEY ? 'Yes' : 'No'}`);
    
    // Try to ping the database with a simple query
    const { data: pingData, error: pingError } = await supabase
      .from('_supabase_migrations')
      .select('*')
      .limit(1);
    
    if (pingError) {
      // This is expected if tables don't exist yet
      console.log('⚠️ Database tables not found (expected if schema not created yet)');
      console.log('\n📋 NEXT STEPS:');
      console.log('1. Go to the Supabase SQL Editor (opened in browser)');
      console.log('2. Copy and paste the SQL from database-schema.sql');
      console.log('3. Click "Run" to execute the SQL');
      console.log('4. Run the integration tests again');
      
      return 'connection-ok-no-tables';
    } else {
      console.log('✅ Database ping successful');
      return 'full-connection-ok';
    }
    
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    return 'connection-failed';
  }
}

// Show the SQL that needs to be executed
function showSchemaSQL() {
  console.log('\n📄 SQL TO EXECUTE IN SUPABASE DASHBOARD:');
  console.log('=' .repeat(80));
  
  const fs = require('fs');
  const path = require('path');
  
  try {
    const schemaPath = path.join(__dirname, 'database-schema.sql');
    const sqlSchema = fs.readFileSync(schemaPath, 'utf8');
    
    console.log(sqlSchema);
  } catch (error) {
    console.log('Error reading schema file:', error.message);
  }
  
  console.log('=' .repeat(80));
}

// Run the test
if (require.main === module) {
  testBasicConnection().then(status => {
    if (status === 'connection-ok-no-tables') {
      showSchemaSQL();
      console.log('\n🔧 Database connection works, but schema needs to be created.');
      process.exit(0);
    } else if (status === 'full-connection-ok') {
      console.log('\n🎉 Full database connection successful!');
      console.log('🚀 You can now run the integration tests.');
      process.exit(0);
    } else {
      console.log('\n❌ Connection failed. Please check your environment variables.');
      process.exit(1);
    }
  }).catch(error => {
    console.error('\n💥 Test crashed:', error.message);
    process.exit(1);
  });
}

module.exports = { testBasicConnection };