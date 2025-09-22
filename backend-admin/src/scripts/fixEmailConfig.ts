import mongoose from 'mongoose';
import { EmailConfig } from '../models/EmailConfig';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/booking-admin';

async function fixEmailConfig() {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Delete all existing email configurations
    await EmailConfig.deleteMany({});
    console.log('🗑️ Deleted all existing email configurations');

    // Create correct email configuration for IONOS
    const emailConfig = new EmailConfig({
      smtpHost: 'smtp.ionos.com',
      smtpPort: 587, // Correct port for IONOS
      smtpUser: 'info@airportshuttletpa.com',
      smtpPassword: '', // Will be set through admin portal
      smtpSecure: false, // IONOS uses STARTTLS, not SSL
      fromEmail: 'info@airportshuttletpa.com',
      fromName: 'Airport Shuttle TPA',
      adminEmail: 'info@airportshuttletpa.com',
      isActive: false // Start as inactive until password is set
    });

    await emailConfig.save();
    console.log('✅ Email configuration created with correct settings:');
    console.log('   - Host: smtp.ionos.com');
    console.log('   - Port: 587 (correct)');
    console.log('   - Secure: false (STARTTLS)');
    console.log('   - User: info@airportshuttletpa.com');
    console.log('   - Active: false (until password is set)');
    
    console.log('\n📧 Next steps:');
    console.log('1. Go to Admin Portal > Email Management');
    console.log('2. Set your IONOS email password');
    console.log('3. Enable email service');
    console.log('4. Test the configuration');

  } catch (error) {
    console.error('❌ Error fixing email configuration:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run the fix
fixEmailConfig();
