const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://lorqrxsqgvpjjxfbqugy.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxvcnFyeHNxZ3Zwamp4ZmJxdWd5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MjA0Mzk0MywiZXhwIjoyMDc3NjE5OTQzfQ.fSDPofIGHbd3CpmtEmiQBGTOryyLktW2u0Xp_pIsw0c';

const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  console.log('Testing Supabase connection via JS Client...');
  try {
    // Try to select from a table we know might exist or just check health
    const { data, error } = await supabase.from('pricing_margins').select('*').limit(1);
    
    if (error) {
      console.error('Supabase JS Error:', error);
      // If table doesn't exist, it proves connection works at least
      if (error.code === '42P01') {
          console.log('Connection successful (Table not found, which is expected if migration failed).');
      }
    } else {
      console.log('Supabase JS Connection Successful!', data);
    }
  } catch (e) {
      console.error('Exception:', e);
  }
}

test();
