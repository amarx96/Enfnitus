const dns = require('dns');

const subdomains = [
    'db',
    'pooler',
    'aws-0-eu-central-1.pooler',
    'eu-central-1.pooler',
    'api',
    'auth'
];

const projectRef = 'lorqrxsqgvpjjxfbqugy';
const baseDomain = 'supabase.co';

subdomains.forEach(sub => {
    let hostname;
    if (sub.includes('pooler') && !sub.includes(projectRef)) {
         // Try generic pooler hosts
         hostname = `${sub}.supabase.com`; // .com for pooler?
    } else {
        hostname = `${sub}.${projectRef}.${baseDomain}`;
    }

    // Also try the specific supavisor domain pattern if known
    // aws-0-eu-central-1.pooler.supabase.com
    
    console.log(`Checking A record for: ${hostname}`);
    dns.resolve(hostname, 'A', (err, addresses) => {
        if (!err && addresses) console.log(`SUCCESS! ${hostname} -> ${addresses}`);
        else console.log(`Failed ${hostname}: ${err ? err.code : 'No address'}`);
    });
});

// Check generic pooler
dns.resolve('aws-0-eu-central-1.pooler.supabase.com', 'A', (err, add) => {
     if (!err) console.log(`Pooler (Frankfurt) IPv4: ${add}`);
});

