import mongoose from 'mongoose';
import { EmailTemplate } from '../models/EmailTemplate';

// Production MongoDB URI
const PRODUCTION_MONGODB_URI = "mongodb+srv://administrator-booking:mOqM183APIf4b9Rw@airportshuttletpa.wapwkji.mongodb.net/booking-admin?retryWrites=true&w=majority&appName=airportshuttletpa";

async function createSimpleEmailTemplate() {
  try {
    console.log('🔗 Connecting to PRODUCTION database...');
    
    await mongoose.connect(PRODUCTION_MONGODB_URI);
    console.log('✅ Connected to MongoDB Atlas Production');

    // Get the existing template
    const existingTemplate = await EmailTemplate.findOne({ name: 'Confirmation Final' });
    if (!existingTemplate) {
      console.log('❌ Confirmation Final template not found');
      return;
    }

    console.log('📧 Creating simple, cross-client compatible template...');

    // Update with simple template
    existingTemplate.htmlContent = getSimpleHTMLTemplate();
    existingTemplate.textContent = getSimpleTextTemplate();
    
    await existingTemplate.save();
    console.log('✅ Simple email template updated successfully');

    console.log('\n📧 Simple Template Details:');
    console.log('   - Name: Confirmation Final');
    console.log('   - HTML Content: ' + getSimpleHTMLTemplate().length + ' characters');
    console.log('   - Text Content: ' + getSimpleTextTemplate().length + ' characters');

    // Verify the template was updated
    const verifyTemplate = await EmailTemplate.findOne({ name: 'Confirmation Final' });
    if (verifyTemplate) {
      console.log('\n✅ Verification successful: Simple template updated');
      console.log(`   Updated: ${verifyTemplate.updatedAt}`);
    } else {
      console.log('\n❌ Verification failed: Template not found');
    }

  } catch (error) {
    console.error('❌ Error updating template:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

function getSimpleHTMLTemplate(): string {
  return `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Booking Confirmation - Airport Shuttle TPA</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
    
    <!-- Header -->
    <div style="background-color: #4a90e2; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
        <h1 style="margin: 0; font-size: 24px;">🚗 Airport Shuttle TPA</h1>
        <p style="margin: 5px 0 0 0; font-size: 14px;">Your trusted transportation partner</p>
    </div>
    
    <!-- Main Content -->
    <div style="background-color: white; padding: 20px; border: 1px solid #ddd;">
        
        <!-- Confirmation Badge -->
        <div style="background-color: #28a745; color: white; padding: 10px 20px; border-radius: 20px; display: inline-block; font-weight: bold; margin-bottom: 20px;">
            ✅ BOOKING CONFIRMED
        </div>
        
        <!-- Greeting -->
        <h2 style="color: #333; margin-bottom: 15px;">Dear {{customerName}},</h2>
        
        <p style="margin-bottom: 20px; font-size: 16px;">Thank you for choosing Airport Shuttle TPA! Your booking has been confirmed and we're excited to serve you.</p>
        
        <!-- Booking Information -->
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #4a90e2;">
            <h3 style="color: #4a90e2; margin: 0 0 15px 0; font-size: 18px;">📋 Booking Information</h3>
            
            <table style="width: 100%; border-collapse: collapse;">
                <tr>
                    <td style="padding: 8px 0; font-weight: bold; width: 40%;">Confirmation Number:</td>
                    <td style="padding: 8px 0; color: #28a745; font-weight: bold;">{{confirmationNumber}}</td>
                </tr>
                <tr>
                    <td style="padding: 8px 0; font-weight: bold;">Total Price:</td>
                    <td style="padding: 8px 0; color: #28a745; font-weight: bold;">{{totalPrice}}</td>
                </tr>
                <tr>
                    <td style="padding: 8px 0; font-weight: bold;">Pickup Location:</td>
                    <td style="padding: 8px 0;">{{pickupLocation}}</td>
                </tr>
                <tr>
                    <td style="padding: 8px 0; font-weight: bold;">Drop-off Location:</td>
                    <td style="padding: 8px 0;">{{dropoffLocation}}</td>
                </tr>
                <tr>
                    <td style="padding: 8px 0; font-weight: bold;">Date & Time:</td>
                    <td style="padding: 8px 0;">{{pickupDate}} at {{pickupTime}}</td>
                </tr>
                <tr>
                    <td style="padding: 8px 0; font-weight: bold;">Passengers:</td>
                    <td style="padding: 8px 0;">{{passengers}} {{#if (eq passengers 1)}}person{{else}}people{{/if}}</td>
                </tr>
                <tr>
                    <td style="padding: 8px 0; font-weight: bold;">Vehicle Type:</td>
                    <td style="padding: 8px 0;">{{vehicleType}}</td>
                </tr>
                {{#if flightNumber}}
                <tr>
                    <td style="padding: 8px 0; font-weight: bold;">Flight Number:</td>
                    <td style="padding: 8px 0;">{{flightNumber}}</td>
                </tr>
                {{/if}}
            </table>
        </div>
        
        <!-- What's Next -->
        <div style="background-color: #4a90e2; color: white; padding: 15px; border-radius: 8px; text-align: center; margin-bottom: 20px;">
            <h3 style="margin: 0 0 10px 0; font-size: 16px;">🎯 What's Next?</h3>
            <p style="margin: 0; font-size: 14px;">Our professional driver will contact you 30 minutes before your scheduled pickup time.</p>
        </div>
        
        <!-- Contact Information -->
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <h3 style="color: #4a90e2; margin: 0 0 15px 0; font-size: 18px;">📞 Need Help?</h3>
            
            <table style="width: 100%; border-collapse: collapse;">
                <tr>
                    <td style="padding: 8px 0; font-weight: bold; width: 20%;">📱 Phone:</td>
                    <td style="padding: 8px 0;">{{companyPhone}}</td>
                </tr>
                <tr>
                    <td style="padding: 8px 0; font-weight: bold;">✉️ Email:</td>
                    <td style="padding: 8px 0;"><a href="mailto:{{companyEmail}}" style="color: #4a90e2;">{{companyEmail}}</a></td>
                </tr>
                <tr>
                    <td style="padding: 8px 0; font-weight: bold;">🌐 Website:</td>
                    <td style="padding: 8px 0;"><a href="https://AirportShuttleTPA.com" style="color: #4a90e2;">AirportShuttleTPA.com</a></td>
                </tr>
            </table>
        </div>
        
        {{#if specialInstructions}}
        <!-- Special Instructions -->
        <div style="background-color: #fff3cd; border: 1px solid #ffc107; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
            <h3 style="color: #856404; margin: 0 0 10px 0; font-size: 16px;">📝 Special Instructions</h3>
            <p style="margin: 0; color: #856404; font-size: 14px;">{{specialInstructions}}</p>
        </div>
        {{/if}}
        
        <!-- Important Notes -->
        <div style="background-color: #e3f2fd; border: 1px solid #2196f3; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <h3 style="color: #1976d2; margin: 0 0 15px 0; font-size: 18px;">📋 Important Notes</h3>
            
            <p style="margin: 0 0 10px 0; font-size: 14px;"><strong>Driver Assignment:</strong> Your driver will be assigned the night before your trip and will contact you upon arrival.</p>
            
            <p style="margin: 0 0 10px 0; font-size: 14px;"><strong>Notifications:</strong> You'll receive SMS and email updates (tracking link included).</p>
            
            <p style="margin: 0 0 10px 0; font-size: 14px;"><strong>Airport Pick-Up:</strong> Curbside pick-up by default; "meet & greet" inside baggage claim available upon request. International travelers can use WhatsApp (free Wi-Fi at TPA).</p>
            
            <p style="margin: 0 0 10px 0; font-size: 14px;"><strong>Payments:</strong> Credit cards are charged 24h prior to the trip (receipt by email). Cash also accepted. To update a card, request a secure payment link.</p>
            
            <p style="margin: 0 0 10px 0; font-size: 14px;"><strong>Gratuities:</strong> Not included. Tips are optional (cash or card).</p>
            
            <p style="margin: 0 0 10px 0; font-size: 14px;"><strong>Cancellations:</strong> Free if made ≥24h before. 50% fee if within 24h (unless due to flight cancellation → full refund).</p>
            
            <p style="margin: 0 0 10px 0; font-size: 14px;"><strong>Flights:</strong> We track your flight and adjust pick-up time when possible, but punctuality of new times is not guaranteed.</p>
            
            <p style="margin: 0 0 10px 0; font-size: 14px;"><strong>Children:</strong> Guests must provide an approved car seat or rent one for $5 (infant, toddler, booster).</p>
            
            <p style="margin: 0 0 10px 0; font-size: 14px;"><strong>Pets:</strong> Allowed with prior notice; cleaning fees may apply.</p>
            
            <p style="margin: 0 0 0 0; font-size: 14px;"><strong>Pick-Up Times:</strong> Times are estimates and may vary due to traffic or weather. No refunds for delays.</p>
        </div>
        
    </div>
    
    <!-- Footer -->
    <div style="background-color: #2c3e50; color: white; padding: 20px; text-align: center; border-radius: 0 0 8px 8px;">
        <h3 style="margin: 0 0 10px 0; font-size: 18px;">Airport Shuttle TPA</h3>
        <p style="margin: 0 0 15px 0; font-size: 14px;">Professional Transportation Services</p>
        
        <p style="margin: 0; font-size: 12px;">
            <a href="https://AirportShuttleTPA.com" style="color: #4a90e2; text-decoration: none; margin-right: 15px;">Visit our website</a>
            <a href="mailto:{{companyEmail}}" style="color: #4a90e2; text-decoration: none;">Contact us</a>
        </p>
    </div>
    
</body>
</html>`;
}

function getSimpleTextTemplate(): string {
  return `BOOKING CONFIRMATION - {{confirmationNumber}}

Dear {{customerName}},

Thank you for choosing Airport Shuttle TPA! Your booking has been confirmed and we're excited to serve you.

BOOKING INFORMATION:
==================
Confirmation Number: {{confirmationNumber}}
Total Price: {{totalPrice}}
Pickup Location: {{pickupLocation}}
Drop-off Location: {{dropoffLocation}}
Date & Time: {{pickupDate}} at {{pickupTime}}
Passengers: {{passengers}} {{#if (eq passengers 1)}}person{{else}}people{{/if}}
Vehicle Type: {{vehicleType}}
{{#if flightNumber}}Flight Number: {{flightNumber}}{{/if}}

WHAT'S NEXT?
============
Our professional driver will contact you 30 minutes before your scheduled pickup time.

CONTACT INFORMATION:
===================
Phone: {{companyPhone}}
Email: {{companyEmail}}
Website: AirportShuttleTPA.com

{{#if specialInstructions}}
SPECIAL INSTRUCTIONS:
====================
{{specialInstructions}}
{{/if}}

IMPORTANT NOTES:
===============

Driver Assignment: Your driver will be assigned the night before your trip and will contact you upon arrival.

Notifications: You'll receive SMS and email updates (tracking link included).

Airport Pick-Up: Curbside pick-up by default; "meet & greet" inside baggage claim available upon request. International travelers can use WhatsApp (free Wi-Fi at TPA).

Payments: Credit cards are charged 24h prior to the trip (receipt by email). Cash also accepted. To update a card, request a secure payment link.

Gratuities: Not included. Tips are optional (cash or card).

Cancellations: Free if made ≥24h before. 50% fee if within 24h (unless due to flight cancellation → full refund).

Flights: We track your flight and adjust pick-up time when possible, but punctuality of new times is not guaranteed.

Children: Guests must provide an approved car seat or rent one for $5 (infant, toddler, booster).

Pets: Allowed with prior notice; cleaning fees may apply.

Pick-Up Times: Times are estimates and may vary due to traffic or weather. No refunds for delays.

Thank you for choosing Airport Shuttle TPA!

Best regards,
The Airport Shuttle TPA Team`;
}

// Run the script
createSimpleEmailTemplate();
