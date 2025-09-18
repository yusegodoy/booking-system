const mongoose = require('mongoose');
require('dotenv').config();

// Import the compiled models and services
const { Booking } = require('./dist/models/Booking');
const { GlobalVariablesService } = require('./dist/services/globalVariablesService');

async function updateAllGlobalVariables() {
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

    // Test a few bookings to show the expanded global variables
    console.log('\n🧪 Testing expanded global variables for first 2 bookings:');
    const testBookings = bookings.slice(0, 2);
    
    for (const booking of testBookings) {
      try {
        const variables = await GlobalVariablesService.getGlobalVariables(booking._id.toString());
        console.log(`\n📋 Booking ${booking.outboundConfirmationNumber}:`);
        console.log('Expanded Global Variables:');
        
        // Group variables by category for better display
        const categories = {
          'Trip Information': ['PU_DATE', 'PU_TIME', 'PU', 'DO', 'RT_DATE', 'RT_TIME', 'RT', 'IS_ROUND_TRIP'],
          'Passenger & Luggage': ['PASSENGERS', 'CHECKED_LUGGAGE', 'CARRY_ON', 'INFANT_SEATS', 'TODDLER_SEATS', 'BOOSTER_SEATS', 'TOTAL_CHILD_SEATS'],
          'Flight Information': ['FLIGHT', 'MEET_OPTION', 'RETURN_FLIGHT'],
          'Customer Information': ['CUSTOMER_NAME', 'CUSTOMER_EMAIL', 'CUSTOMER_PHONE', 'SPECIAL_INSTRUCTIONS', 'GREETING_SIGN'],
          'Vehicle & Service': ['VEHICLE_TYPE', 'SERVICE_TYPE'],
          'Pricing Information': ['BASE_PRICE', 'BOOKING_FEE', 'CHILD_SEATS_CHARGE', 'DISCOUNT_PERCENTAGE', 'DISCOUNT_FIXED', 'ROUND_TRIP_DISCOUNT', 'GRATUITY_PERCENTAGE', 'GRATUITY_FIXED', 'TAXES_PERCENTAGE', 'TAXES_FIXED', 'CREDIT_CARD_FEE_PERCENTAGE', 'CREDIT_CARD_FEE_FIXED', 'CALCULATED_PRICE', 'TOTAL_PRICE'],
          'Payment & Booking': ['PAYMENT_METHOD', 'CHECKOUT_TYPE', 'BOOKING_STATUS', 'CONFIRMATION_NUMBER', 'RETURN_CONFIRMATION_NUMBER'],
          'Route Information': ['STOPS', 'TOTAL_DISTANCE', 'TOTAL_DURATION'],
          'Assignment': ['ASSIGNED_DRIVER', 'ASSIGNED_VEHICLE', 'NOTES', 'DISPATCH_NOTES'],
          'Communication': ['SEND_CONFIRMATIONS', 'CHANGE_NOTIFICATIONS'],
          'Timestamps': ['CREATED_AT', 'UPDATED_AT']
        };

        Object.entries(categories).forEach(([category, keys]) => {
          console.log(`\n  📂 ${category}:`);
          keys.forEach(key => {
            if (variables[key] !== undefined) {
              console.log(`    ${key}: ${variables[key]}`);
            }
          });
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

// Test expanded template replacement
async function testExpandedTemplateReplacement() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/booking-system');
    console.log('Connected to MongoDB for expanded template testing');

    const booking = await Booking.findOne({});
    if (!booking) {
      console.log('No bookings found for template testing');
      return;
    }

    const expandedTemplate = `
Dear {{CUSTOMER_NAME}},

Thank you for your booking with confirmation number {{CONFIRMATION_NUMBER}}.

TRIP DETAILS:
- Pickup Date: {{PU_DATE}}
- Pickup Time: {{PU_TIME}}
- Pickup Location: {{PU}}
- Drop-off Location: {{DO}}
- Round Trip: {{IS_ROUND_TRIP}}

PASSENGER INFORMATION:
- Total Passengers: {{PASSENGERS}}
- Checked Luggage: {{CHECKED_LUGGAGE}}
- Carry-on Bags: {{CARRY_ON}}
- Child Seats: {{TOTAL_CHILD_SEATS}} ({{INFANT_SEATS}} infant, {{TODDLER_SEATS}} toddler, {{BOOSTER_SEATS}} booster)

FLIGHT INFORMATION:
- Flight Number: {{FLIGHT}}
- Meet Option: {{MEET_OPTION}}

VEHICLE & SERVICE:
- Vehicle Type: {{VEHICLE_TYPE}}
- Service Type: {{SERVICE_TYPE}}

PRICING BREAKDOWN:
- Base Price: {{BASE_PRICE}}
- Booking Fee: {{BOOKING_FEE}}
- Child Seats Charge: {{CHILD_SEATS_CHARGE}}
- Round Trip Discount: {{ROUND_TRIP_DISCOUNT}}
- Total Price: {{TOTAL_PRICE}}

PAYMENT INFORMATION:
- Payment Method: {{PAYMENT_METHOD}}
- Booking Status: {{BOOKING_STATUS}}

ADDITIONAL INFORMATION:
- Special Instructions: {{SPECIAL_INSTRUCTIONS}}
- Additional Stops: {{STOPS}}

Best regards,
Your Transportation Team
    `;

    const variables = await GlobalVariablesService.getGlobalVariables(booking._id.toString());
    const result = GlobalVariablesService.replaceVariables(expandedTemplate, variables);

    console.log('\n📧 Expanded Template Replacement Test:');
    console.log('Original Template:');
    console.log(expandedTemplate);
    console.log('\nProcessed Template:');
    console.log(result);

  } catch (error) {
    console.error('Error in expanded template testing:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the script
if (require.main === module) {
  console.log('🚀 Starting expanded global variables update script...\n');
  
  updateAllGlobalVariables()
    .then(() => {
      console.log('\n✅ Expanded global variables update completed!');
      return testExpandedTemplateReplacement();
    })
    .then(() => {
      console.log('\n✅ Expanded template replacement test completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Script failed:', error);
      process.exit(1);
    });
} 