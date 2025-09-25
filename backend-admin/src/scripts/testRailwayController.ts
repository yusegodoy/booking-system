import mongoose from 'mongoose';
import { EmailTemplate } from '../models/EmailTemplate';

async function testRailwayController() {
  try {
    console.log('🔍 Testing Railway controller logic...');
    
    // Connect to Railway MongoDB
    const mongoUri = 'mongodb+srv://administrator-booking:mOqM183APIf4b9Rw@airportshuttletpa.wapwkji.mongodb.net/?retryWrites=true&w=majority&appName=airportshuttletpa';
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to Railway MongoDB');
    
    // Test the exact query from the controller
    console.log('🔍 Testing controller query...');
    const templates = await EmailTemplate.find().sort({ createdAt: -1 });
    console.log('📧 Controller query result:', templates.length, 'templates');
    
    if (templates.length > 0) {
      console.log('✅ Controller query works correctly');
      console.log('📋 Controller query templates:');
      templates.forEach((template, index) => {
        console.log(`  ${index + 1}. Name: "${template.name}", Type: "${template.type}", Active: ${template.isActive}`);
      });
    } else {
      console.log('❌ Controller query returns empty array');
    }
    
    // Test with different queries
    console.log('\n🔍 Testing different queries...');
    
    // Query 1: All templates
    const allTemplates = await EmailTemplate.find();
    console.log('📧 All templates:', allTemplates.length);
    
    // Query 2: Active templates only
    const activeTemplates = await EmailTemplate.find({ isActive: true });
    console.log('📧 Active templates:', activeTemplates.length);
    
    // Query 3: Templates by type
    const confirmationTemplates = await EmailTemplate.find({ type: 'confirmation' });
    console.log('📧 Confirmation templates:', confirmationTemplates.length);
    
    const receiptTemplates = await EmailTemplate.find({ type: 'receipt' });
    console.log('📧 Receipt templates:', receiptTemplates.length);
    
    // Test the exact controller logic
    console.log('\n🔍 Testing exact controller logic...');
    try {
      console.log('📧 getEmailTemplates called');
      const controllerTemplates = await EmailTemplate.find().sort({ createdAt: -1 });
      console.log('📧 Templates found in database:', controllerTemplates.length);
      console.log('📧 Template names:', controllerTemplates.map(t => t.name));
      
      if (controllerTemplates.length > 0) {
        console.log('✅ Controller should return templates');
        return controllerTemplates;
      } else {
        console.log('❌ Controller returns empty array');
        return [];
      }
    } catch (error) {
      console.error('❌ Error in controller logic:', error);
      return [];
    }
    
  } catch (error) {
    console.error('❌ Error testing Railway controller:', error);
    return [];
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from Railway MongoDB');
  }
}

// Run the test
testRailwayController();
