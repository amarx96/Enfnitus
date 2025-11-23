/**
 * Simple Supabase Connection Test
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

console.log('🔗 Testing Supabase connection...');
console.log('URL:', supabaseUrl ? 'Set' : 'Missing');
console.log('Key:', supabaseKey ? 'Set' : 'Missing');

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase configuration');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
  try {
    // Try to create a simple test table access
    const { data, error } = await supabase
      .from('customers')
      .select('count', { count: 'exact', head: true });
    
    if (error) {
      if (error.code === 'PGRST116') {
        console.log('⚠️  Tables not yet created - this is expected for first setup');
        console.log('📋 Please create tables manually in Supabase:');
        console.log('   1. Go to your Supabase dashboard');
        console.log('   2. Navigate to SQL Editor');
        console.log('   3. Run the SQL from database-schema.sql');
        return true;
      } else {
        throw error;
      }
    }
    
    console.log('✅ Supabase connection successful!');
    console.log('✅ Tables are accessible');
    return true;

  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    return false;
  }
}

testConnection().then((success) => {
  if (success) {
    console.log('\n🎉 Supabase is ready for your EVU application!');
  }
  process.exit(success ? 0 : 1);
});