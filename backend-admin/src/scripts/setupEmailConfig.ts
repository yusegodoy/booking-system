import mongoose from 'mongoose';
import { EmailConfig } from '../models/EmailConfig';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/booking-admin';

async function setupEmailConfig() {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Check if email config already exists
    const existingConfig = await EmailConfig.findOne({ isActive: true });
    if (existingConfig) {
      console.log('ℹ️ Email configuration already exists');
      console.log('Current config:', {
        host: existingConfig.smtpHost,
        port: existingConfig.smtpPort,
        user: existingConfig.smtpUser,
        fromEmail: existingConfig.fromEmail
      });
      return;
    }

    // Create default email configuration for IONOS
    const emailConfig = new EmailConfig({
      smtpHost: 'smtp.ionos.com',
      smtpPort: 587,
      smtpUser: 'info@airportshuttletpa.com',
      smtpPassword: '', // Will be set through admin portal
      smtpSecure: false,
      fromEmail: 'info@airportshuttletpa.com',
      fromName: 'Airport Shuttle TPA',
      adminEmail: 'info@airportshuttletpa.com',
      isActive: true
    });

    await emailConfig.save();
    console.log('✅ Email configuration created successfully');
    console.log('📧 Please configure the SMTP password through the admin portal');
    console.log('🔗 Go to: Admin Portal > Email Management > SMTP Configuration');

  } catch (error) {
    console.error('❌ Error setting up email configuration:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run the setup
setupEmailConfig();
