const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://lorqrxsqgvpjjxfbqugy.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxvcnFyeHNxZ3Zwamp4ZmJxdWd5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MjA0Mzk0MywiZXhwIjoyMDc3NjE5OTQzfQ.fSDPofIGHbd3CpmtEmiQBGTOryyLktW2u0Xp_pIsw0c';
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
    console.log('Checking customers table columns...');
    
    // Insert a dummy record with new columns to see if it fails
    const { data, error } = await supabase.from('customers').insert({
        email: `test-schema-${Date.now()}@example.com`,
        vorname: 'Test',
        nachname: 'Schema',
        agb_akzeptiert: true // This is the column failing
    }).select();

    if (error) {
        console.error('Schema Check Failed:', error);
    } else {
        console.log('Schema Check Passed! Record inserted:', data);
    }
}

check();

