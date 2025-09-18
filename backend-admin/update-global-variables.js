const mongoose = require('mongoose');
require('dotenv').config();

// Import the compiled models and services
const { Booking } = require('./dist/models/Booking');
const { GlobalVariablesService } = require('./dist/services/globalVariablesService');

async function updateGlobalVariablesForAllBookings() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/booking-system');
    console.log('Connected to MongoDB');

    // Get all bookings
    const bookings = await Booking.find({});
    console.log(`Found ${bookings.length} bookings to update`);

    let successCount = 0;
    let errorCount = 0;
    const errors = [];

    // Update global variables for each booking
    for (const booking of bookings) {
      try {
        await GlobalVariablesService.updateGlobalVariables(booking._id.toString());
        successCount++;
        console.log(`✅ Updated global variables for booking ${booking.outboundConfirmationNumber}`);
      } catch (error) {
        errorCount++;
        errors.push({
          bookingId: booking._id,
          confirmationNumber: booking.outboundConfirmationNumber,
          error: error.message
        });
        console.error(`❌ Error updating global variables for booking ${booking.outboundConfirmationNumber}:`, error.message);
      }
    }

    // Print summary
    console.log('\n📊 Update Summary:');
    console.log(`Total bookings: ${bookings.length}`);
    console.log(`Successful updates: ${successCount}`);
    console.log(`Failed updates: ${errorCount}`);

    if (errors.length > 0) {
      console.log('\n❌ Errors:');
      errors.forEach(error => {
        console.log(`- Booking ${error.confirmationNumber}: ${error.error}`);
      });
    }

    // Test a few bookings to show the global variables
    console.log('\n🧪 Testing global variables for first 3 bookings:');
    const testBookings = bookings.slice(0, 3);
    
    for (const booking of testBookings) {
      try {
        const variables = await GlobalVariablesService.getGlobalVariables(booking._id.toString());
        console.log(`\n📋 Booking ${booking.outboundConfirmationNumber}:`);
        console.log('Global Variables:');
        Object.entries(variables).forEach(([key, value]) => {
          console.log(`  ${key}: ${value}`);
        });
      } catch (error) {
        console.error(`Error getting global variables for booking ${booking.outboundConfirmationNumber}:`, error.message);
      }
    }

  } catch (error) {
    console.error('Error in update script:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Test template replacement
async function testTemplateReplacement() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/booking-system');
    console.log('Connected to MongoDB for template testing');

    const booking = await Booking.findOne({});
    if (!booking) {
      console.log('No bookings found for template testing');
      return;
    }

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

// Run the script
if (require.main === module) {
  console.log('🚀 Starting global variables update script...\n');
  
  updateGlobalVariablesForAllBookings()
    .then(() => {
      console.log('\n✅ Global variables update completed!');
      return testTemplateReplacement();
    })
    .then(() => {
      console.log('\n✅ Template replacement test completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Script failed:', error);
      process.exit(1);
    });
} 