console.log('🎫 Testing WELCOME2025 voucher...');

const http = require('http');

function testVoucher() {
  const postData = JSON.stringify({
    voucherCode: 'WELCOME2025',
    tariffId: 'standard-10115'
  });

  const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/v1/voucher/validate',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData)
    }
  };

  const req = http.request(options, (res) => {
    let data = '';

    res.on('data', (chunk) => {
      data += chunk;
    });

    res.on('end', () => {
      try {
        const response = JSON.parse(data);
        
        if (res.statusCode === 200 && response.erfolg) {
          console.log('✅ WELCOME2025 voucher is VALID!');
          console.log(`   💰 Discount: ${response.daten.discounts.value}${response.daten.discounts.type === 'percentage' ? '%' : '€'}`);
          console.log(`   📅 Valid from: ${response.daten.voucher.startDate} to ${response.daten.voucher.endDate}`);
          console.log(`   🎯 Voucher Code: ${response.daten.voucherCode}`);
        } else {
          console.log('❌ WELCOME2025 voucher validation failed:');
          console.log(`   ${response.nachricht || response.message || 'Unknown error'}`);
        }
      } catch (error) {
        console.log('❌ Error parsing response:', data);
      }
    });
  });

  req.on('error', (err) => {
    console.log('❌ Request failed:', err.message);
  });

  req.write(postData);
  req.end();
}

// Wait a moment for server to be ready, then test
setTimeout(testVoucher, 2000);