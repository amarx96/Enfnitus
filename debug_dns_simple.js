const dns = require('dns');

console.log('Attempting to resolve db.lorqrxsqgvpjjxfbqugy.supabase.co...');

dns.resolve('db.lorqrxsqgvpjjxfbqugy.supabase.co', 'A', (err, addresses) => {
    if (err) console.log('Standard A record lookup failed:', err.message);
    else console.log('Standard A record success:', addresses);
});

dns.resolve('db.lorqrxsqgvpjjxfbqugy.supabase.co', 'AAAA', (err, addresses) => {
    if (err) console.log('Standard AAAA record lookup failed:', err.message);
    else console.log('Standard AAAA record success:', addresses);
});

// Check specific pooler aliases if possible (guessing Frankfurt)
const regions = ['eu-central-1', 'us-east-1', 'eu-west-1', 'us-west-1'];
regions.forEach(region => {
    const host = `db.lorqrxsqgvpjjxfbqugy.supabase.co`; 
    // Supavisor acts on the same host usually. 
    // But if there is a CNAME...
});

