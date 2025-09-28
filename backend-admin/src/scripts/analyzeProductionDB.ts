import mongoose from 'mongoose';
import { EmailTemplate } from '../models/EmailTemplate';
import { EmailConfig } from '../models/EmailConfig';
import { Booking } from '../models/Booking';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/booking-admin';

async function analyzeProductionDB() {
  try {
    console.log('🔗 Connecting to production database...');
    console.log('📍 URI:', MONGODB_URI.replace(/\/\/.*@/, '//***:***@'));
    
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB Atlas');

    // Analyze Email Templates
    console.log('\n📧 EMAIL TEMPLATES ANALYSIS:');
    console.log('=' .repeat(50));
    
    const templates = await EmailTemplate.find({}).sort({ createdAt: -1 });
    console.log(`Found ${templates.length} email templates:`);
    
    if (templates.length === 0) {
      console.log('❌ No email templates found in production database');
    } else {
      templates.forEach((template, index) => {
        console.log(`\n${index + 1}. ${template.name}`);
        console.log(`   Type: ${template.type}`);
        console.log(`   Active: ${template.isActive ? '✅' : '❌'}`);
        console.log(`   Subject: ${template.subject}`);
        console.log(`   Variables: ${template.variables.length} available`);
        console.log(`   Created: ${template.createdAt}`);
        console.log(`   Updated: ${template.updatedAt}`);
        console.log(`   HTML Content Length: ${template.htmlContent.length} characters`);
        console.log(`   Text Content Length: ${template.textContent.length} characters`);
      });
    }

    // Analyze Email Configuration
    console.log('\n⚙️ EMAIL CONFIGURATION ANALYSIS:');
    console.log('=' .repeat(50));
    
    const emailConfigs = await EmailConfig.find({});
    console.log(`Found ${emailConfigs.length} email configurations:`);
    
    if (emailConfigs.length === 0) {
      console.log('❌ No email configurations found');
    } else {
      emailConfigs.forEach((config, index) => {
        console.log(`\n${index + 1}. Configuration ${index + 1}`);
        console.log(`   Host: ${config.smtpHost}`);
        console.log(`   Port: ${config.smtpPort}`);
        console.log(`   User: ${config.smtpUser}`);
        console.log(`   From Email: ${config.fromEmail}`);
        console.log(`   From Name: ${config.fromName}`);
        console.log(`   Active: ${config.isActive ? '✅' : '❌'}`);
        console.log(`   Created: ${config.createdAt}`);
      });
    }

    // Analyze Bookings
    console.log('\n📋 BOOKINGS ANALYSIS:');
    console.log('=' .repeat(50));
    
    const totalBookings = await Booking.countDocuments();
    const recentBookings = await Booking.find({})
      .sort({ createdAt: -1 })
      .limit(5)
      .select('outboundConfirmationNumber userData.firstName userData.lastName tripInfo.pickup tripInfo.dropoff totalPrice status createdAt');
    
    console.log(`Total bookings: ${totalBookings}`);
    console.log('\nRecent bookings:');
    recentBookings.forEach((booking, index) => {
      console.log(`${index + 1}. ${booking.outboundConfirmationNumber} - ${booking.userData.firstName} ${booking.userData.lastName}`);
      console.log(`   From: ${booking.tripInfo.pickup}`);
      console.log(`   To: ${booking.tripInfo.dropoff}`);
      console.log(`   Price: $${booking.totalPrice}`);
      console.log(`   Status: ${booking.status}`);
      console.log(`   Date: ${booking.createdAt}`);
    });

    // Check for "Confirmation Final" template specifically
    console.log('\n🔍 CHECKING FOR "CONFIRMATION FINAL" TEMPLATE:');
    console.log('=' .repeat(50));
    
    const confirmationFinal = await EmailTemplate.findOne({ name: 'Confirmation Final' });
    if (confirmationFinal) {
      console.log('✅ "Confirmation Final" template found in production database');
      console.log(`   Active: ${confirmationFinal.isActive ? '✅' : '❌'}`);
      console.log(`   Subject: ${confirmationFinal.subject}`);
      console.log(`   Variables: ${confirmationFinal.variables.length}`);
      console.log(`   Created: ${confirmationFinal.createdAt}`);
    } else {
      console.log('❌ "Confirmation Final" template NOT found in production database');
      console.log('💡 Need to create it in production database');
    }

    // Database info
    console.log('\n🗄️ DATABASE INFORMATION:');
    console.log('=' .repeat(50));
    console.log(`Database Name: ${mongoose.connection.db?.databaseName}`);
    console.log(`Host: ${mongoose.connection.host}`);
    console.log(`Port: ${mongoose.connection.port}`);

  } catch (error) {
    console.error('❌ Error analyzing production database:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

// Run the analysis
analyzeProductionDB();
