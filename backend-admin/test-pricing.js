// Using native fetch (Node.js 18+)

async function testPricing() {
  try {
    const requestBody = {
      pickup: {
        lat: 0,
        lng: 0,
        address: "Tampa Airport",
        zipcode: "",
        city: ""
      },
      dropoff: {
        lat: 0,
        lng: 0,
        address: "Siesta Key",
        zipcode: "",
        city: ""
      },
      miles: 71.4,
      stopsCount: 0,
      childSeatsCount: 0,
      isRoundTrip: false,
      paymentMethod: "cash"
    };

    console.log('Testing pricing calculation...');
    console.log('Request body:', JSON.stringify(requestBody, null, 2));

    const response = await fetch('http://localhost:5001/api/pricing/calculate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    if (response.ok) {
      const result = await response.json();
      console.log('✅ Pricing calculation successful!');
      console.log('Response:', JSON.stringify(result, null, 2));
    } else {
      const errorText = await response.text();
      console.error('❌ Pricing calculation failed:', errorText);
    }
  } catch (error) {
    console.error('❌ Error testing pricing:', error);
  }
}

testPricing(); 