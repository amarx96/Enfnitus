const { Client } = require('pg');

const projectRef = 'lorqrxsqgvpjjxfbqugy';
const password = '1nxZYl6B4VCXJTNL';
const regions = ['eu-central-1', 'eu-west-1', 'us-east-1', 'eu-west-2', 'eu-west-3'];
const userFormats = [
    `postgres.${projectRef}`,
    projectRef,
    'postgres'
];
const ports = [6543, 5432];

async function testConnection(region, user, port) {
    const host = `aws-0-${region}.pooler.supabase.com`;
    const connectionString = `postgresql://${user}:${password}@${host}:${port}/postgres`;
    
    console.log(`Testing: ${region} | User: ${user} | Port: ${port}`);
    
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
        console.log(`❌ Failed: ${err.message}`);
        return false;
    }
}

async function run() {
    for (const region of regions) {
        for (const user of userFormats) {
            for (const port of ports) {
                const success = await testConnection(region, user, port);
                if (success) return; // Stop on first success
            }
        }
    }
    console.log('All combinations failed.');
}

run();

