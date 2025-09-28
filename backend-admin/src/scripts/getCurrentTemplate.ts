import mongoose from 'mongoose';
import { EmailTemplate } from '../models/EmailTemplate';

// Production MongoDB URI
const PRODUCTION_MONGODB_URI = "mongodb+srv://administrator-booking:mOqM183APIf4b9Rw@airportshuttletpa.wapwkji.mongodb.net/booking-admin?retryWrites=true&w=majority&appName=airportshuttletpa";

async function getCurrentTemplate() {
  try {
    console.log('🔗 Connecting to PRODUCTION database...');
    
    await mongoose.connect(PRODUCTION_MONGODB_URI);
    console.log('✅ Connected to MongoDB Atlas Production');

    // Get the current Confirmation Final template
    const template = await EmailTemplate.findOne({ name: 'Confirmation Final' });
    
    if (!template) {
      console.log('❌ Confirmation Final template not found');
      return;
    }

    console.log('\n📧 CURRENT TEMPLATE ANALYSIS:');
    console.log('=' .repeat(50));
    console.log(`Name: ${template.name}`);
    console.log(`Type: ${template.type}`);
    console.log(`Active: ${template.isActive}`);
    console.log(`Subject: ${template.subject}`);
    console.log(`Variables: ${template.variables.length}`);
    console.log(`HTML Length: ${template.htmlContent.length} characters`);
    console.log(`Text Length: ${template.textContent.length} characters`);
    console.log(`Created: ${template.createdAt}`);
    console.log(`Updated: ${template.updatedAt}`);

    // Save current template to file for analysis
    const fs = require('fs');
    const path = require('path');
    
    const outputDir = path.join(__dirname, '../../template-analysis');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Save HTML content
    fs.writeFileSync(
      path.join(outputDir, 'current-confirmation-final.html'),
      template.htmlContent
    );

    // Save text content
    fs.writeFileSync(
      path.join(outputDir, 'current-confirmation-final.txt'),
      template.textContent
    );

    // Save template info
    fs.writeFileSync(
      path.join(outputDir, 'template-info.json'),
      JSON.stringify({
        name: template.name,
        type: template.type,
        subject: template.subject,
        variables: template.variables,
        isActive: template.isActive,
        createdAt: template.createdAt,
        updatedAt: template.updatedAt,
        htmlLength: template.htmlContent.length,
        textLength: template.textContent.length
      }, null, 2)
    );

    console.log('\n💾 Files saved to template-analysis directory:');
    console.log('   - current-confirmation-final.html');
    console.log('   - current-confirmation-final.txt');
    console.log('   - template-info.json');

    // Show first 500 characters of HTML for preview
    console.log('\n📄 HTML PREVIEW (first 500 characters):');
    console.log('=' .repeat(50));
    console.log(template.htmlContent.substring(0, 500) + '...');

  } catch (error) {
    console.error('❌ Error getting template:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

// Run the script
getCurrentTemplate();
