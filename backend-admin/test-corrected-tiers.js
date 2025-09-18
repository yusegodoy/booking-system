const fetch = require('node-fetch');

async function testCorrectedTiers() {
  console.log('🧪 Testing Corrected Distance Tiers Display...\n');

  const testCases = [
    {
      name: 'Distance within threshold (10 miles)',
      miles: 10,
      expectedBasePrice: 55,
      expectedDistancePrice: 0,
      expectedTotal: 55,
      description: 'Should only charge base price - no tiers applied'
    },
    {
      name: 'Distance at threshold (12 miles)',
      miles: 12,
      expectedBasePrice: 55,
      expectedDistancePrice: 0,
      expectedTotal: 55,
      description: 'Should only charge base price - no tiers applied'
    },
    {
      name: 'Distance in first tier (15 miles)',
      miles: 15,
      expectedBasePrice: 55,
      expectedDistancePrice: 12, // 3 additional miles × $4 (first tier)
      expectedTotal: 67,
      description: 'Should charge base price + 3 miles in first tier'
    },
    {
      name: 'Distance in second tier (30 miles)',
      miles: 30,
      expectedBasePrice: 55,
      expectedDistancePrice: 52, // 13 miles × $4 + 5 miles × $3.5
      expectedTotal: 107,
      description: 'Should charge base price + first tier + second tier'
    },
    {
      name: 'Long distance (71.4 miles)',
      miles: 71.4,
      expectedBasePrice: 55,
      expectedDistancePrice: 59.4, // Using fallback $1/mile for additional miles
      expectedTotal: 114.4,
      description: 'Should charge base price + significant additional miles'
    }
  ];

  console.log('📋 Expected Tier Structure (with 12-mile base threshold):');
  console.log('   • 0-12 miles: Base price only ($55)');
  console.log('   • 12-25 miles: Base price + (additional miles × tier price)');
  console.log('   • 25-37 miles: Base price + (additional miles × tier price)');
  console.log('   • 37-62 miles: Base price + (additional miles × tier price)');
  console.log('   • 62+ miles: Base price + (additional miles × tier price)');
  console.log('');

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

  console.log('🎯 Corrected Tiers Test Completed!');
  console.log('\n📋 Summary of Corrected Logic:');
  console.log('   • Tiers now show "additional miles" instead of total miles');
  console.log('   • First tier: 0-13 additional miles (12-25 total miles)');
  console.log('   • Second tier: 13-25 additional miles (25-37 total miles)');
  console.log('   • Third tier: 25-50 additional miles (37-62 total miles)');
  console.log('   • Fourth tier: 50+ additional miles (62+ total miles)');
  console.log('\n⚙️  Configuration:');
  console.log('   • Each vehicle type can have its own baseDistanceThreshold');
  console.log('   • Configure in Admin Portal → Vehicles → Edit → Pricing Configuration');
  console.log('   • Tiers apply only to miles beyond the base threshold');
}

// Run the test
testCorrectedTiers().catch(console.error); 