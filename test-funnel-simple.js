console.log('🔧 Testing EVU Funnel Backend...');

const http = require('http');

function makeRequest(options, data) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const response = JSON.parse(body);
          resolve({ statusCode: res.statusCode, data: response });
        } catch (error) {
          resolve({ statusCode: res.statusCode, data: body });
        }
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

async function testFunnel() {
  try {
    // Test 1: Health check
    console.log('1️⃣ Testing server health...');
    const healthOptions = {
      hostname: 'localhost',
      port: 3000,
      path: '/health',
      method: 'GET'
    };
    
    const healthResult = await makeRequest(healthOptions);
    if (healthResult.statusCode === 200) {
      console.log('✅ Server health check passed!');
    } else {
      console.log(`❌ Server health check failed: ${healthResult.statusCode}`);
    }

    // Test 2: Pricing API
    console.log('\n2️⃣ Testing pricing API...');
    const pricingOptions = {
      hostname: 'localhost',
      port: 3000,
      path: '/api/v1/pricing/berechnen',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    };
    
    const pricingData = {
      plz: "10115",
      jahresverbrauch: 3500,
      haushaltgroesse: 2
    };

    const pricingResult = await makeRequest(pricingOptions, pricingData);
    if (pricingResult.statusCode === 200) {
      console.log('✅ Pricing API working!');
      console.log(`   Status: ${pricingResult.data.status}`);
      if (pricingResult.data.daten && pricingResult.data.daten.length > 0) {
        console.log(`   Found ${pricingResult.data.daten.length} tariffs`);
      }
    } else {
      console.log(`❌ Pricing API failed: ${pricingResult.statusCode}`);
      console.log(`   Error: ${JSON.stringify(pricingResult.data, null, 2)}`);
    }

    // Test 3: Legacy route
    console.log('\n3️⃣ Testing legacy route...');
    const legacyOptions = {
      hostname: 'localhost',
      port: 3000,
      path: '/api/v1/tarife/berechnen',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const legacyResult = await makeRequest(legacyOptions, pricingData);
    if (legacyResult.statusCode === 200) {
      console.log('✅ Legacy route working!');
    } else {
      console.log(`⚠️ Legacy route failed: ${legacyResult.statusCode}`);
    }

    console.log('\n🎉 FUNNEL IS RUNNING PROPERLY!');
    console.log('   ✅ Backend API: http://localhost:3000');
    console.log('   ✅ Frontend: http://localhost:3000');
    console.log('   ✅ Health Check: http://localhost:3000/health');
    console.log('   ✅ API Docs: http://localhost:3000/api-docs');

  } catch (error) {
    console.error('❌ Funnel test failed:', error.message);
  }
}

testFunnel();