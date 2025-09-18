const https = require('http');

// First, get a new token
const loginData = JSON.stringify({
  email: 'admin@example.com',
  password: 'admin123'
});

const loginOptions = {
  hostname: 'localhost',
  port: 5001,
  path: '/api/auth/login',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': loginData.length
  }
};

const loginReq = https.request(loginOptions, (loginRes) => {
  let loginResponseData = '';
  loginRes.on('data', (chunk) => {
    loginResponseData += chunk;
  });
  
  loginRes.on('end', () => {
    try {
      const loginResult = JSON.parse(loginResponseData);
      if (loginResult.token) {
        console.log('✅ Login successful, token obtained');
        
        // Now test the drivers API
        const driversOptions = {
          hostname: 'localhost',
          port: 5001,
          path: '/api/drivers',
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${loginResult.token}`,
            'Content-Type': 'application/json'
          }
        };

        const driversReq = https.request(driversOptions, (driversRes) => {
          console.log(`Drivers API Status: ${driversRes.statusCode}`);
          
          let driversResponseData = '';
          driversRes.on('data', (chunk) => {
            driversResponseData += chunk;
          });
          
          driversRes.on('end', () => {
            console.log('Drivers API Response:', driversResponseData);
          });
        });

        driversReq.on('error', (error) => {
          console.error('Drivers API Error:', error);
        });

        driversReq.end();
      } else {
        console.log('❌ Login failed:', loginResult);
      }
    } catch (error) {
      console.error('❌ Error parsing login response:', error);
    }
  });
});

loginReq.on('error', (error) => {
  console.error('❌ Login Error:', error);
});

loginReq.write(loginData);
loginReq.end(); 