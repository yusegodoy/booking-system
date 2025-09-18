const fetch = require('node-fetch');

async function testBaseDistanceThreshold() {
  console.log('🧪 Testing Base Distance Threshold Configuration...\n');

  const testCases = [
    {
      name: 'Distance within threshold (10 miles)',
      miles: 10,
      expectedBasePrice: 55,
      expectedDistancePrice: 0,
      expectedTotal: 55,
      description: 'Should only charge base price'
    },
    {
      name: 'Distance at threshold (12 miles)',
      miles: 12,
      expectedBasePrice: 55,
      expectedDistancePrice: 0,
      expectedTotal: 55,
      description: 'Should only charge base price (at threshold)'
    },
    {
      name: 'Distance exceeds threshold (20 miles)',
      miles: 20,
      expectedBasePrice: 55,
      expectedDistancePrice: 8, // 8 additional miles × $1 (fallback)
      expectedTotal: 63,
      description: 'Should charge base price + additional miles'
    },
    {
      name: 'Long distance (71.4 miles)',
      miles: 71.4,
      expectedBasePrice: 55,
      expectedDistancePrice: 59.4, // 59.4 additional miles × $1 (fallback)
      expectedTotal: 114.4,
      description: 'Should charge base price + significant additional miles'
    }
  ];

  for (const testCase of testCases) {
    console.log(`📍 Testing: ${testCase.name}`);
    console.log(`   📝 ${testCase.description}`);
    
    try {
      const requestBody = {
        pickup: { lat: 0, lng: 0, address: 'Test Pickup', zipcode: '', city: '' },
        dropoff: { lat: 0, lng: 0, address: 'Test Dropoff', zipcode: '', city: '' },
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
        console.log(`      Final total: $${result.finalTotal}`);
        
        // Check if the calculation matches expected logic
        const calculatedBasePrice = result.basePrice;
        const calculatedDistancePrice = result.distancePrice;
        const calculatedTotal = calculatedBasePrice + calculatedDistancePrice;
        
        console.log(`   🎯 Expected vs Calculated:`);
        console.log(`      Base price: Expected $${testCase.expectedBasePrice}, Got $${calculatedBasePrice}`);
        console.log(`      Distance price: Expected $${testCase.expectedDistancePrice}, Got $${calculatedDistancePrice}`);
        console.log(`      Total: Expected $${testCase.expectedTotal}, Got $${calculatedTotal}`);
        
        const basePriceCorrect = Math.abs(calculatedBasePrice - testCase.expectedBasePrice) < 0.01;
        const distancePriceCorrect = Math.abs(calculatedDistancePrice - testCase.expectedDistancePrice) < 0.01;
        const totalCorrect = Math.abs(calculatedTotal - testCase.expectedTotal) < 0.01;
        
        console.log(`   ${basePriceCorrect && distancePriceCorrect && totalCorrect ? '✅ CORRECT' : '❌ INCORRECT'}`);
        
        if (!basePriceCorrect || !distancePriceCorrect || !totalCorrect) {
          console.log(`   ⚠️  Price differences:`);
          if (!basePriceCorrect) console.log(`      Base price: $${Math.abs(calculatedBasePrice - testCase.expectedBasePrice).toFixed(2)}`);
          if (!distancePriceCorrect) console.log(`      Distance price: $${Math.abs(calculatedDistancePrice - testCase.expectedDistancePrice).toFixed(2)}`);
          if (!totalCorrect) console.log(`      Total: $${Math.abs(calculatedTotal - testCase.expectedTotal).toFixed(2)}`);
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

  console.log('🎯 Base Distance Threshold Test Completed!');
  console.log('\n📋 Summary of New Logic:');
  console.log('   • 0 to X miles: Base price only ($55)');
  console.log('   • X+ miles: Base price + (additional miles × tier price)');
  console.log('   • X = baseDistanceThreshold (configurable per vehicle, default: 12 miles)');
  console.log('   • Tiers apply only to miles beyond the base threshold');
  console.log('\n⚙️  Configuration:');
  console.log('   • Each vehicle type can have its own baseDistanceThreshold');
  console.log('   • Configure in Admin Portal → Vehicles → Edit → Pricing Configuration');
  console.log('   • Default value: 12 miles');
}

// Run the test
testBaseDistanceThreshold().catch(console.error); 