import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../.env') });

// Import models
import { EmailTemplate } from '../models/EmailTemplate';

// Connect to MongoDB
const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/booking-admin';
    await mongoose.connect(mongoUri);
    console.log('✅ MongoDB connected');
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error);
    process.exit(1);
  }
};

// Update email templates with correct variables
const updateEmailTemplates = async () => {
  try {
    console.log('📧 Updating email templates with correct variables...');

    // Find existing templates
    const templates = await EmailTemplate.find({});
    console.log(`Found ${templates.length} email templates`);

    for (const template of templates) {
      console.log(`\n📝 Updating template: ${template.name}`);
      
      // Update Confirmation template
      if (template.name === 'Confirmation') {
        const confirmationHtml = [
          '<!DOCTYPE html>',
          '<html lang="en">',
          '<head>',
          '    <meta charset="UTF-8">',
          '    <meta name="viewport" content="width=device-width, initial-scale=1.0">',
          '    <title>Booking Confirmation - {{companyName}}</title>',
          '    <style>',
          '        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }',
          '        .header { background-color: {{primaryColor}}; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }',
          '        .content { background-color: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px; }',
          '        .trip-details { background-color: white; padding: 15px; margin: 15px 0; border-radius: 5px; border-left: 4px solid {{primaryColor}}; }',
          '        .contact-info { background-color: white; padding: 15px; margin: 15px 0; border-radius: 5px; }',
          '        .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }',
          '        .highlight { color: {{primaryColor}}; font-weight: bold; }',
          '        .price { font-size: 24px; font-weight: bold; color: {{primaryColor}}; }',
          '    </style>',
          '</head>',
          '<body>',
          '    <div class="header">',
          '        <h1>✈️ Booking Confirmation</h1>',
          '        <h2>{{companyName}}</h2>',
          '    </div>',
          '    ',
          '    <div class="content">',
          '        <p>Dear {{firstName}} {{lastName}},</p>',
          '        ',
          '        <p>Thank you for choosing {{companyName}} for your transportation needs. Your booking has been confirmed!</p>',
          '        ',
          '        <div class="trip-details">',
          '            <h3>Trip Details</h3>',
          '            <p><strong>Confirmation Number:</strong> <span class="highlight">{{confirmationNumber}}</span></p>',
          '            <p><strong>Pickup Location:</strong> {{pickup}}</p>',
          '            <p><strong>Drop-off Location:</strong> {{dropoff}}</p>',
          '            <p><strong>Date:</strong> {{pickupDate}}</p>',
          '            <p><strong>Time:</strong> {{pickupHour}}:{{pickupMinute}} {{pickupPeriod}}</p>',
          '            <p><strong>Passengers:</strong> {{passengers}}</p>',
          '            <p><strong>Vehicle Type:</strong> {{vehicleType}}</p>',
          '            <p><strong>Total Price:</strong> <span class="price">${{totalPrice}}</span></p>',
          '        </div>',
          '        ',
          '        <div class="contact-info">',
          '            <h3>Contact Information</h3>',
          '            <p><strong>{{companyName}}</strong></p>',
          '            <p>Phone: {{companyPhone}}</p>',
          '            <p>Email: {{companyEmail}}</p>',
          '            <p>Website: {{companyWebsite}}</p>',
          '        </div>',
          '        ',
          '        <p>If you have any questions or need to make changes to your booking, please contact us at {{companyPhone}} or {{companyEmail}}.</p>',
          '        ',
          '        <p>Thank you for choosing {{companyName}}!</p>',
          '        <p>Safe travels!</p>',
          '    </div>',
          '    ',
          '    <div class="footer">',
          '        <p>This is an automated confirmation email. Please do not reply directly to this email.</p>',
          '    </div>',
          '</body>',
          '</html>'
        ].join('\n');

        const confirmationText = [
          'Booking Confirmation - {{companyName}}',
          '',
          'Dear {{firstName}} {{lastName}},',
          '',
          'Thank you for choosing {{companyName}} for your transportation needs. Your booking has been confirmed!',
          '',
          'Trip Details:',
          '- Confirmation Number: {{confirmationNumber}}',
          '- Pickup Location: {{pickup}}',
          '- Drop-off Location: {{dropoff}}',
          '- Date: {{pickupDate}}',
          '- Time: {{pickupHour}}:{{pickupMinute}} {{pickupPeriod}}',
          '- Passengers: {{passengers}}',
          '- Vehicle Type: {{vehicleType}}',
          '- Total Price: ${{totalPrice}}',
          '',
          'Contact Information:',
          '{{companyName}}',
          'Phone: {{companyPhone}}',
          'Email: {{companyEmail}}',
          'Website: {{companyWebsite}}',
          '',
          'If you have any questions or need to make changes to your booking, please contact us at {{companyPhone}} or {{companyEmail}}.',
          '',
          'Thank you for choosing {{companyName}}!',
          'Safe travels!',
          '',
          'This is an automated confirmation email. Please do not reply directly to this email.'
        ].join('\n');

        await EmailTemplate.findByIdAndUpdate(template._id, {
          htmlContent: confirmationHtml,
          textContent: confirmationText,
          subject: 'Booking Confirmation ✈️ {{companyName}}'
        });

        console.log('✅ Confirmation template updated');
      }

      // Update Receipt template
      if (template.name === 'Receipt') {
        const receiptHtml = [
          '<!DOCTYPE html>',
          '<html lang="en">',
          '<head>',
          '    <meta charset="UTF-8">',
          '    <meta name="viewport" content="width=device-width, initial-scale=1.0">',
          '    <title>Receipt - {{companyName}}</title>',
          '    <style>',
          '        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }',
          '        .header { background-color: {{primaryColor}}; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }',
          '        .content { background-color: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px; }',
          '        .receipt-details { background-color: white; padding: 15px; margin: 15px 0; border-radius: 5px; border-left: 4px solid {{primaryColor}}; }',
          '        .price-breakdown { background-color: white; padding: 15px; margin: 15px 0; border-radius: 5px; }',
          '        .contact-info { background-color: white; padding: 15px; margin: 15px 0; border-radius: 5px; }',
          '        .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }',
          '        .highlight { color: {{primaryColor}}; font-weight: bold; }',
          '        .price { font-size: 24px; font-weight: bold; color: {{primaryColor}}; }',
          '        .total { border-top: 2px solid {{primaryColor}}; padding-top: 10px; margin-top: 10px; }',
          '    </style>',
          '</head>',
          '<body>',
          '    <div class="header">',
          '        <h1>🧾 Receipt</h1>',
          '        <h2>{{companyName}}</h2>',
          '    </div>',
          '    ',
          '    <div class="content">',
          '        <p>Dear {{firstName}} {{lastName}},</p>',
          '        ',
          '        <p>Thank you for your business! Here is your receipt for your recent trip.</p>',
          '        ',
          '        <div class="receipt-details">',
          '            <h3>Trip Details</h3>',
          '            <p><strong>Confirmation Number:</strong> <span class="highlight">{{confirmationNumber}}</span></p>',
          '            <p><strong>Date:</strong> {{pickupDate}}</p>',
          '            <p><strong>Pickup:</strong> {{pickup}}</p>',
          '            <p><strong>Drop-off:</strong> {{dropoff}}</p>',
          '            <p><strong>Passengers:</strong> {{passengers}}</p>',
          '            <p><strong>Vehicle Type:</strong> {{vehicleType}}</p>',
          '        </div>',
          '        ',
          '        <div class="price-breakdown">',
          '            <h3>Price Breakdown</h3>',
          '            <p>Base Price: ${{basePrice}}</p>',
          '            <p>Total: <span class="price">${{totalPrice}}</span></p>',
          '        </div>',
          '        ',
          '        <div class="contact-info">',
          '            <h3>Contact Information</h3>',
          '            <p><strong>{{companyName}}</strong></p>',
          '            <p>Phone: {{companyPhone}}</p>',
          '            <p>Email: {{companyEmail}}</p>',
          '            <p>Website: {{companyWebsite}}</p>',
          '        </div>',
          '        ',
          '        <p>Thank you for choosing {{companyName}}!</p>',
          '    </div>',
          '    ',
          '    <div class="footer">',
          '        <p>This is an automated receipt email. Please do not reply directly to this email.</p>',
          '    </div>',
          '</body>',
          '</html>'
        ].join('\n');

        const receiptText = [
          'Receipt - {{companyName}}',
          '',
          'Dear {{firstName}} {{lastName}},',
          '',
          'Thank you for your business! Here is your receipt for your recent trip.',
          '',
          'Trip Details:',
          '- Confirmation Number: {{confirmationNumber}}',
          '- Date: {{pickupDate}}',
          '- Pickup: {{pickup}}',
          '- Drop-off: {{dropoff}}',
          '- Passengers: {{passengers}}',
          '- Vehicle Type: {{vehicleType}}',
          '',
          'Price Breakdown:',
          '- Base Price: ${{basePrice}}',
          '- Total: ${{totalPrice}}',
          '',
          'Contact Information:',
          '{{companyName}}',
          'Phone: {{companyPhone}}',
          'Email: {{companyEmail}}',
          'Website: {{companyWebsite}}',
          '',
          'Thank you for choosing {{companyName}}!',
          '',
          'This is an automated receipt email. Please do not reply directly to this email.'
        ].join('\n');

        await EmailTemplate.findByIdAndUpdate(template._id, {
          htmlContent: receiptHtml,
          textContent: receiptText,
          subject: 'Receipt - {{companyName}}'
        });

        console.log('✅ Receipt template updated');
      }
    }

    console.log('\n✅ All email templates updated successfully!');
  } catch (error) {
    console.error('❌ Error updating email templates:', error);
  }
};

// Main execution
const main = async () => {
  await connectDB();
  await updateEmailTemplates();
  await mongoose.disconnect();
  console.log('✅ Database connection closed');
};

main().catch(console.error);
