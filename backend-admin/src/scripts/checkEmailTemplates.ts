import mongoose from 'mongoose';
import { EmailTemplate } from '../models/EmailTemplate';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/booking-admin';

async function checkEmailTemplates() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const templates = await EmailTemplate.find({}).sort({ createdAt: -1 });
    
    console.log(`📧 Found ${templates.length} email templates:`);
    console.log('=' .repeat(50));
    
    if (templates.length === 0) {
      console.log('❌ No email templates found in database');
      console.log('💡 You need to create Receipt and Confirmation templates');
    } else {
      templates.forEach((template, index) => {
        console.log(`${index + 1}. ${template.name}`);
        console.log(`   Type: ${template.type}`);
        console.log(`   Active: ${template.isActive ? '✅' : '❌'}`);
        console.log(`   Subject: ${template.subject}`);
        console.log(`   Created: ${template.createdAt}`);
        console.log('   ---');
      });
    }

    // Check specifically for Receipt and Confirmation
    const receiptTemplate = await EmailTemplate.findOne({ name: 'Receipt' });
    const confirmationTemplate = await EmailTemplate.findOne({ name: 'Confirmation' });
    
    console.log('\n🔍 Specific template check:');
    console.log(`Receipt template: ${receiptTemplate ? '✅ Found' : '❌ Missing'}`);
    console.log(`Confirmation template: ${confirmationTemplate ? '✅ Found' : '❌ Missing'}`);

    if (!receiptTemplate || !confirmationTemplate) {
      console.log('\n💡 To create missing templates, run:');
      console.log('npm run create-default-templates');
    }

  } catch (error) {
    console.error('❌ Error checking email templates:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

checkEmailTemplates();
