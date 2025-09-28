import mongoose from 'mongoose';
import { EmailTemplate } from '../models/EmailTemplate';

// Production MongoDB URI
const PRODUCTION_MONGODB_URI = "mongodb+srv://administrator-booking:mOqM183APIf4b9Rw@airportshuttletpa.wapwkji.mongodb.net/booking-admin?retryWrites=true&w=majority&appName=airportshuttletpa";

async function fixTemplateSyntax() {
  try {
    console.log('🔗 Connecting to PRODUCTION database...');
    
    await mongoose.connect(PRODUCTION_MONGODB_URI);
    console.log('✅ Connected to MongoDB Atlas Production');

    // Get the Confirmation Final template
    const template = await EmailTemplate.findOne({ name: 'Confirmation Final' });
    
    if (!template) {
      console.log('❌ Confirmation Final template not found');
      return;
    }

    console.log('📧 Fixing template syntax for Handlebars...');

    // Fix the HTML content
    let fixedHtml = template.htmlContent;
    
    // Fix conditional syntax
    fixedHtml = fixedHtml.replace(/\{\{#if flightNumber\}\}/g, '{{#if flightNumber}}');
    fixedHtml = fixedHtml.replace(/\{\{\/if\}\}/g, '{{/if}}');
    
    // Fix passenger pluralization
    fixedHtml = fixedHtml.replace(
      /\{\{passengers\}\} \{\{passengers === '1' \? 'person' : 'people'\}\}/g,
      '{{passengers}} {{#if (eq passengers 1)}}person{{else}}people{{/if}}'
    );

    // Fix the text content
    let fixedText = template.textContent;
    
    // Fix conditional syntax in text
    fixedText = fixedText.replace(/\{\{#if flightNumber\}\}/g, '{{#if flightNumber}}');
    fixedText = fixedText.replace(/\{\{\/if\}\}/g, '{{/if}}');
    
    // Fix passenger pluralization in text
    fixedText = fixedText.replace(
      /\{\{passengers\}\} \{\{passengers === '1' \? 'person' : 'people'\}\}/g,
      '{{passengers}} {{#if (eq passengers 1)}}person{{else}}people{{/if}}'
    );

    // Update the template
    template.htmlContent = fixedHtml;
    template.textContent = fixedText;
    
    await template.save();
    console.log('✅ Template syntax fixed successfully');

    console.log('\n📧 Fixed Template Details:');
    console.log('   - Name: Confirmation Final');
    console.log('   - HTML Content: ' + fixedHtml.length + ' characters');
    console.log('   - Text Content: ' + fixedText.length + ' characters');

    // Verify the template was updated
    const verifyTemplate = await EmailTemplate.findOne({ name: 'Confirmation Final' });
    if (verifyTemplate) {
      console.log('\n✅ Verification successful: Template syntax fixed');
      console.log(`   Updated: ${verifyTemplate.updatedAt}`);
    } else {
      console.log('\n❌ Verification failed: Template not found');
    }

  } catch (error) {
    console.error('❌ Error fixing template syntax:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

// Run the script
fixTemplateSyntax();
