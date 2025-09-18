const fetch = require('node-fetch');

async function testPricingCalculation() {
  console.log('🧪 Testing pricing calculation after distance tiers fix...\n');

  const testCases = [
    {
      name: 'Tampa Airport to Siesta Key (71.4 miles)',
      pickup: { lat: 0, lng: 0, address: 'Tampa Airport', zipcode: '', city: '' },
      dropoff: { lat: 0, lng: 0, address: 'Siesta Key', zipcode: '', city: '' },
      miles: 71.4,
      expectedPrice: 340.60 // Base price $55 + (71.4 * $4) = $340.60
    },
    {
      name: 'Short distance (10 miles)',
      pickup: { lat: 0, lng: 0, address: 'Location A', zipcode: '', city: '' },
      dropoff: { lat: 0, lng: 0, address: 'Location B', zipcode: '', city: '' },
      miles: 10,
      expectedPrice: 95 // Base price $55 + (10 * $4) = $95
    },
    {
      name: 'Medium distance (20 miles)',
      pickup: { lat: 0, lng: 0, address: 'Location A', zipcode: '', city: '' },
      dropoff: { lat: 0, lng: 0, address: 'Location B', zipcode: '', city: '' },
      miles: 20,
      expectedPrice: 135 // Base price $55 + (20 * $4) = $135
    }
  ];

  for (const testCase of testCases) {
    console.log(`📍 Testing: ${testCase.name}`);
    
    try {
      const requestBody = {
        pickup: testCase.pickup,
        dropoff: testCase.dropoff,
        miles: testCase.miles,
        stopsCount: 0,
        childSeatsCount: 0,
        isRoundTrip: false,
        paymentMethod: 'cash'
      };

      const response = await fetch('http://localhost:5001/api/pricing/calculate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      if (response.ok) {
        const result = await response.json();
        
        console.log(`   ✅ Success!`);
        console.log(`   📊 Breakdown:`);
        console.log(`      Base price: $${result.basePrice}`);
        console.log(`      Distance price: $${result.distancePrice}`);
        console.log(`      Distance: ${result.distance} miles`);
        console.log(`      Payment discount: $${result.paymentDiscount}`);
        console.log(`      Final total: $${result.finalTotal}`);
        
        // Check if the calculation is correct
        const calculatedPrice = result.basePrice + result.distancePrice;
        const expectedPrice = testCase.expectedPrice;
        const isCorrect = Math.abs(calculatedPrice - expectedPrice) < 0.01;
        
        console.log(`   🎯 Expected: $${expectedPrice}, Calculated: $${calculatedPrice}`);
        console.log(`   ${isCorrect ? '✅ CORRECT' : '❌ INCORRECT'}`);
        
        if (!isCorrect) {
          console.log(`   ⚠️  Price difference: $${Math.abs(calculatedPrice - expectedPrice).toFixed(2)}`);
        }
        
      } else {
        const errorText = await response.text();
        console.log(`   ❌ Error: ${response.status} - ${errorText}`);
      }
      
    } catch (error) {
      console.log(`   ❌ Network error: ${error.message}`);
    }
    
    console.log('');
  }

  console.log('🎯 Pricing calculation test completed!');
}

// Run the test
testPricingCalculation().catch(console.error); 