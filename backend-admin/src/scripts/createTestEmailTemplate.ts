import mongoose from 'mongoose';
import { EmailTemplate } from '../models/EmailTemplate';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/booking-admin';

async function createProfessionalTestTemplate() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Delete existing test template
    await EmailTemplate.deleteOne({ name: 'test-email' });
    console.log('🗑️ Deleted existing test template');

    // Create professional test template
    const testTemplate = new EmailTemplate({
      name: 'test-email',
      subject: 'Test Email - Airport Shuttle TPA Service',
      htmlContent: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Test Email</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; border-left: 4px solid #007bff;">
            <h2 style="color: #007bff; margin-top: 0;">Airport Shuttle TPA</h2>
            <p><strong>Professional Transportation Services</strong></p>
          </div>
          
          <div style="margin: 20px 0;">
            <h3 style="color: #333;">Email Configuration Test</h3>
            <p>This is a test email to verify that your email configuration is working correctly.</p>
            
            <div style="background-color: #e9ecef; padding: 15px; border-radius: 5px; margin: 15px 0;">
              <h4 style="margin-top: 0; color: #495057;">Test Details:</h4>
              <ul style="margin: 0; padding-left: 20px;">
                <li><strong>Service:</strong> Resend Email API</li>
                <li><strong>Status:</strong> ✅ Successfully configured</li>
                <li><strong>Date:</strong> {{bookingDate}}</li>
                <li><strong>Time:</strong> {{bookingTime}}</li>
              </ul>
            </div>
            
            <p>If you received this email, your email service is working correctly and ready for production use.</p>
          </div>
          
          <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0; font-size: 14px; color: #6c757d;">
            <p style="margin: 0;"><strong>Airport Shuttle TPA</strong></p>
            <p style="margin: 5px 0 0 0;">Professional airport transportation services in Tampa Bay area</p>
            <p style="margin: 5px 0 0 0;">Email: info@airportshuttletpa.com</p>
            <p style="margin: 5px 0 0 0;">Website: https://airportshuttletpa.com</p>
          </div>
        </body>
        </html>
      `,
      textContent: `
        AIRPORT SHUTTLE TPA
        Professional Transportation Services
        
        EMAIL CONFIGURATION TEST
        
        This is a test email to verify that your email configuration is working correctly.
        
        Test Details:
        - Service: Resend Email API
        - Status: ✅ Successfully configured
        - Date: {{bookingDate}}
        - Time: {{bookingTime}}
        
        If you received this email, your email service is working correctly and ready for production use.
        
        ---
        Airport Shuttle TPA
        Professional airport transportation services in Tampa Bay area
        Email: info@airportshuttletpa.com
        Website: https://airportshuttletpa.com
      `,
      type: 'custom',
      isActive: true,
      variables: ['bookingDate', 'bookingTime']
    });

    await testTemplate.save();
    console.log('✅ Professional test email template created');

  } catch (error) {
    console.error('❌ Error creating test template:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

createProfessionalTestTemplate();
