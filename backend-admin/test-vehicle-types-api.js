const fetch = require('node-fetch');

async function testVehicleTypesAPI() {
  try {
    console.log('🧪 Testing Vehicle Types API...\n');

    // Test 1: Get all vehicle types (public endpoint)
    console.log('1️⃣ Testing public endpoint: GET /api/vehicle-types');
    try {
      const publicResponse = await fetch('http://localhost:5001/api/vehicle-types');
      console.log('   Status:', publicResponse.status);
      if (publicResponse.ok) {
        const publicData = await publicResponse.json();
        console.log('   ✅ Public endpoint works');
        console.log('   📊 Found', publicData.length, 'vehicle types');
        console.log('   📋 Vehicle types:', publicData.map(v => v.name));
      } else {
        console.log('   ❌ Public endpoint failed');
      }
    } catch (error) {
      console.log('   ❌ Error testing public endpoint:', error.message);
    }

    console.log('\n2️⃣ Testing admin endpoint: GET /api/vehicle-types/admin');
    console.log('   Note: This requires authentication token');
    
    // Test 2: Get admin vehicle types (requires auth)
    try {
      const adminResponse = await fetch('http://localhost:5001/api/vehicle-types/admin', {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      console.log('   Status:', adminResponse.status);
      
      if (adminResponse.ok) {
        const adminData = await adminResponse.json();
        console.log('   ✅ Admin endpoint works (without auth - this might be wrong)');
        console.log('   📊 Found', adminData.length, 'vehicle types');
        console.log('   📋 Vehicle types:', adminData.map(v => v.name));
      } else {
        const errorData = await adminResponse.json().catch(() => ({}));
        console.log('   ❌ Admin endpoint failed:', errorData.message || 'Unknown error');
        console.log('   📋 Expected: 401 Unauthorized (requires auth token)');
      }
    } catch (error) {
      console.log('   ❌ Error testing admin endpoint:', error.message);
    }

    // Test 3: Test with a mock token
    console.log('\n3️⃣ Testing admin endpoint with mock token');
    try {
      const mockTokenResponse = await fetch('http://localhost:5001/api/vehicle-types/admin', {
        headers: {
          'Authorization': 'Bearer mock-token-123',
          'Content-Type': 'application/json'
        }
      });
      console.log('   Status:', mockTokenResponse.status);
      
      if (mockTokenResponse.ok) {
        const mockData = await mockTokenResponse.json();
        console.log('   ✅ Admin endpoint works with mock token (this might be wrong)');
        console.log('   📊 Found', mockData.length, 'vehicle types');
      } else {
        const errorData = await mockTokenResponse.json().catch(() => ({}));
        console.log('   ❌ Admin endpoint failed with mock token:', errorData.message || 'Unknown error');
        console.log('   📋 Expected: 401 Unauthorized (invalid token)');
      }
    } catch (error) {
      console.log('   ❌ Error testing admin endpoint with mock token:', error.message);
    }

    // Test 4: Check if server is running
    console.log('\n4️⃣ Testing server health');
    try {
      const healthResponse = await fetch('http://localhost:5001/health');
      console.log('   Status:', healthResponse.status);
      if (healthResponse.ok) {
        const healthData = await healthResponse.json();
        console.log('   ✅ Server is running:', healthData);
      } else {
        console.log('   ❌ Server health check failed');
      }
    } catch (error) {
      console.log('   ❌ Server not responding:', error.message);
      console.log('   💡 Make sure the backend server is running on port 5001');
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
if (require.main === module) {
  testVehicleTypesAPI()
    .then(() => {
      console.log('\n✅ API test completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Test failed:', error);
      process.exit(1);
    });
} 