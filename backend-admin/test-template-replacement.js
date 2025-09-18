const mongoose = require('mongoose');
require('dotenv').config();

// Import the compiled services
const { GlobalVariablesService } = require('./dist/services/globalVariablesService');
const { Booking } = require('./dist/models/Booking');

async function testTemplateReplacement() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/booking-system');
    console.log('Connected to MongoDB for template testing');

    const booking = await Booking.findOne({});
    if (!booking) {
      console.log('No bookings found for template testing');
      return;
    }

    console.log(`Testing with booking: ${booking.outboundConfirmationNumber}`);

    const template = `
Dear {{CUSTOMER_NAME}},

Thank you for your booking with confirmation number {{CONFIRMATION_NUMBER}}.

Your pickup details:
- Date: {{PU_DATE}}
- Time: {{PU_TIME}}
- Location: {{PU}}

Your drop-off location: {{DO}}

Total passengers: {{PASSENGERS}}
Vehicle type: {{VEHICLE_TYPE}}
Total price: {{TOTAL_PRICE}}

Additional stops: {{STOPS}}

Special instructions: {{SPECIAL_INSTRUCTIONS}}

Best regards,
Your Transportation Team
    `;

    const variables = await GlobalVariablesService.getGlobalVariables(booking._id.toString());
    console.log('\n📋 Available Variables:');
    Object.entries(variables).forEach(([key, value]) => {
      console.log(`  ${key}: "${value}"`);
    });

    const result = GlobalVariablesService.replaceVariables(template, variables);

    console.log('\n📧 Template Replacement Test:');
    console.log('Original Template:');
    console.log(template);
    console.log('\nProcessed Template:');
    console.log(result);

  } catch (error) {
    console.error('Error in template testing:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the test
if (require.main === module) {
  console.log('🧪 Testing template replacement...\n');
  testTemplateReplacement()
    .then(() => {
      console.log('\n✅ Template replacement test completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Test failed:', error);
      process.exit(1);
    });
} 