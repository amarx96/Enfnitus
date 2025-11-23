const { Client } = require('pg');

const projectRef = 'lorqrxsqgvpjjxfbqugy';
const password = '1nxZYl6B4VCXJTNL';
const regions = [
    'us-west-1', 'us-west-2', 'ap-southeast-1', 'ap-southeast-2', 'ap-northeast-1', 'ap-northeast-2',
    'sa-east-1', 'ca-central-1', 'eu-central-2', 'eu-north-1', 'me-central-1'
];
// Already tested: eu-central-1, eu-west-1, us-east-1, eu-west-2, eu-west-3

const userFormats = [
    `postgres.${projectRef}`,
];
const port = 6543;

async function testConnection(region, user, port) {
    const host = `aws-0-${region}.pooler.supabase.com`;
    const connectionString = `postgresql://${user}:${password}@${host}:${port}/postgres`;
    
    console.log(`Testing: ${region}...`);
    
    const client = new Client({
        connectionString,
        ssl: { rejectUnauthorized: false },
        connectionTimeoutMillis: 3000
    });

    try {
        await client.connect();
        console.log(`✅ SUCCESS! Connected to ${region} with user ${user} on port ${port}`);
        await client.end();
        return true;
    } catch (err) {
        // console.log(`❌ Failed: ${err.message}`);
        if (err.message.includes('getaddrinfo ENOTFOUND')) {
             // Region likely doesn't exist or has no pooler
        }
        return false;
    }
}

async function run() {
    for (const region of regions) {
        const user = `postgres.${projectRef}`;
        const success = await testConnection(region, user, port);
        if (success) return;
    }
    console.log('All extended regions failed.');
}

run();

