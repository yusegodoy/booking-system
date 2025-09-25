import mongoose from 'mongoose';
import { EmailTemplate } from '../models/EmailTemplate';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/booking-admin';

async function fixEmailTemplateNames() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Find and fix receipt template (lowercase to proper case)
    const receiptTemplate = await EmailTemplate.findOne({ name: 'receipt' });
    if (receiptTemplate) {
      receiptTemplate.name = 'Receipt';
      await receiptTemplate.save();
      console.log('✅ Fixed receipt template name: receipt → Receipt');
    }

    // Find and fix confirmation template (if needed)
    const confirmationTemplate = await EmailTemplate.findOne({ name: 'Confirmation' });
    if (confirmationTemplate) {
      console.log('✅ Confirmation template name is already correct');
    }

    // Verify all templates
    const allTemplates = await EmailTemplate.find({}).sort({ name: 1 });
    console.log('\n📧 All email templates after fix:');
    console.log('=' .repeat(40));
    
    allTemplates.forEach((template, index) => {
      console.log(`${index + 1}. ${template.name}`);
      console.log(`   Type: ${template.type}`);
      console.log(`   Active: ${template.isActive ? '✅' : '❌'}`);
    });

    console.log('\n✅ Email template names fixed successfully!');
    console.log('💡 Now the BookingEditor should show all templates correctly.');

  } catch (error) {
    console.error('❌ Error fixing email template names:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

fixEmailTemplateNames();
