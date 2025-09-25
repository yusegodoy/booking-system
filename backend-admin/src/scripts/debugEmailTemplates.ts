import mongoose from 'mongoose';
import { EmailTemplate } from '../models/EmailTemplate';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://administrator-booking:mOqM183APIf4b9Rw@airportshuttletpa.wapwkji.mongodb.net/?retryWrites=true&w=majority&appName=airportshuttletpa';

async function debugEmailTemplates() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Check all templates
    const allTemplates = await EmailTemplate.find({}).sort({ name: 1 });
    console.log(`📧 Total templates in database: ${allTemplates.length}`);
    
    if (allTemplates.length === 0) {
      console.log('❌ NO TEMPLATES FOUND - This is the problem!');
      console.log('💡 Creating default templates...');
      
      // Create Receipt template
      const receiptTemplate = new EmailTemplate({
        name: 'Receipt',
        subject: 'Payment Receipt - {{confirmationNumber}}',
        htmlContent: `
          <h2>Payment Receipt</h2>
          <p>Dear {{customerName}},</p>
          <p>Thank you for your payment. Here are your receipt details:</p>
          <ul>
            <li>Confirmation Number: {{confirmationNumber}}</li>
            <li>Amount: ${'{{totalPrice}}'}</li>
            <li>Date: {{bookingDate}}</li>
          </ul>
          <p>Best regards,<br>Airport Shuttle TPA</p>
        `,
        textContent: `
          Payment Receipt
          
          Dear {{customerName}},
          
          Thank you for your payment. Here are your receipt details:
          
          - Confirmation Number: {{confirmationNumber}}
          - Amount: ${'{{totalPrice}}'}
          - Date: {{bookingDate}}
          
          Best regards,
          Airport Shuttle TPA
        `,
        type: 'receipt',
        isActive: true,
        variables: ['customerName', 'confirmationNumber', 'totalPrice', 'bookingDate']
      });
      
      await receiptTemplate.save();
      console.log('✅ Created Receipt template');

      // Create Confirmation template
      const confirmationTemplate = new EmailTemplate({
        name: 'Confirmation',
        subject: 'Booking Confirmation - {{confirmationNumber}}',
        htmlContent: `
          <h2>Booking Confirmation</h2>
          <p>Dear {{customerName}},</p>
          <p>Your booking has been confirmed. Here are the details:</p>
          <ul>
            <li>Confirmation Number: {{confirmationNumber}}</li>
            <li>Pickup: {{pickupLocation}}</li>
            <li>Dropoff: {{dropoffLocation}}</li>
            <li>Date: {{tripDate}}</li>
            <li>Time: {{tripTime}}</li>
            <li>Vehicle: {{vehicleType}}</li>
            <li>Passengers: {{vehicleCapacity}}</li>
            <li>Total: ${'{{totalPrice}}'}</li>
          </ul>
          <p>We look forward to serving you!</p>
          <p>Best regards,<br>Airport Shuttle TPA</p>
        `,
        textContent: `
          Booking Confirmation
          
          Dear {{customerName}},
          
          Your booking has been confirmed. Here are the details:
          
          - Confirmation Number: {{confirmationNumber}}
          - Pickup: {{pickupLocation}}
          - Dropoff: {{dropoffLocation}}
          - Date: {{tripDate}}
          - Time: {{tripTime}}
          - Vehicle: {{vehicleType}}
          - Passengers: {{vehicleCapacity}}
          - Total: ${'{{totalPrice}}'}
          
          We look forward to serving you!
          
          Best regards,
          Airport Shuttle TPA
        `,
        type: 'confirmation',
        isActive: true,
        variables: ['customerName', 'confirmationNumber', 'pickupLocation', 'dropoffLocation', 'tripDate', 'tripTime', 'vehicleType', 'vehicleCapacity', 'totalPrice']
      });
      
      await confirmationTemplate.save();
      console.log('✅ Created Confirmation template');
      
    } else {
      console.log('📋 Existing templates:');
      allTemplates.forEach((template, index) => {
        console.log(`${index + 1}. ${template.name} (${template.type}) - Active: ${template.isActive}`);
      });
    }

    // Final verification
    const finalTemplates = await EmailTemplate.find({ isActive: true }).sort({ name: 1 });
    console.log(`\n✅ Active templates ready for use: ${finalTemplates.length}`);
    finalTemplates.forEach(template => {
      console.log(`   - ${template.name} (${template.type})`);
    });

  } catch (error) {
    console.error('❌ Error debugging email templates:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

debugEmailTemplates();
