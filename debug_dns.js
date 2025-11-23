const dns = require('dns');

console.log('Testing DNS resolution for Supabase...');
const host = 'db.lorqrxsqgvpjjxfbqugy.supabase.co';

dns.lookup(host, (err, address) => {
  if (err) {
    console.error(`DNS Lookup FAILED for ${host}:`, err.message);
    console.log('\nDiagnosis: Your network or ISP might be blocking the specific Supabase DB domain, or there is a local DNS configuration issue.');
  } else {
    console.log(`DNS Lookup SUCCESS: ${host} -> ${address}`);
    console.log('\nDiagnosis: Hostname resolves. If connection fails, it is likely a Firewall/Port 5432 block.');
  }
});
