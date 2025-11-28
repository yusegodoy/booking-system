import { connectDB, disconnectDB } from '../config/database';
import { EmailTemplate } from '../models/EmailTemplate';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function updateLogoSizeInTemplates() {
  try {
    console.log('🚀 Starting logo size update script...');
    
    // Connect to MongoDB
    await connectDB();
    console.log('✅ Connected to MongoDB');

    // Find all active email templates
    const templates = await EmailTemplate.find({ isActive: true });
    console.log(`📧 Found ${templates.length} active template(s)`);
    
    if (templates.length === 0) {
      console.log('⚠️  No active templates found. Checking all templates...');
      const allTemplates = await EmailTemplate.find({});
      console.log(`📧 Found ${allTemplates.length} total template(s)`);
      if (allTemplates.length > 0) {
        console.log('Template names:', allTemplates.map(t => `${t.name} (active: ${t.isActive})`).join(', '));
      }
    }

    for (const template of templates) {
      let updated = false;
      let newHtmlContent = template.htmlContent;

      // Update logo size from 48px to 100px and improve styling for Gmail compatibility
      // Pattern 1: height:48px -> use max-height:100px instead (better for email clients)
      if (newHtmlContent.includes('height:48px')) {
        // Replace height:48px with max-height:100px (more flexible for email clients)
        newHtmlContent = newHtmlContent.replace(/height:48px/g, 'max-height:100px');
        updated = true;
        console.log(`✅ Updated height:48px to max-height:100px in template: ${template.name}`);
      }

      // Pattern 2: height="48px" or height='48px'
      if (newHtmlContent.includes('height="48px"') || newHtmlContent.includes("height='48px'")) {
        newHtmlContent = newHtmlContent.replace(/height=["']48px["']/g, 'max-height="100px"');
        updated = true;
        console.log(`✅ Updated height="48px" to max-height="100px" in template: ${template.name}`);
      }

      // Also update max-width to be more appropriate for 100px height
      // Increase max-width proportionally: 180px -> 250px
      if (newHtmlContent.includes('max-width:180px')) {
        newHtmlContent = newHtmlContent.replace(/max-width:180px/g, 'max-width:250px');
        updated = true;
        console.log(`✅ Updated max-width:180px to max-width:250px in template: ${template.name}`);
      }
      
      // Also ensure width is set to auto to maintain aspect ratio
      if (newHtmlContent.includes('max-width:250px') && !newHtmlContent.includes('width:auto')) {
        // Find the style attribute and add width:auto if not present
        newHtmlContent = newHtmlContent.replace(
          /(style=["'][^"']*max-width:250px[^"']*)(["'])/gi,
          (match, before, after) => {
            if (!before.includes('width:auto') && !before.includes('width:')) {
              return `${before};width:auto${after}`;
            }
            return match;
          }
        );
        updated = true;
        console.log(`✅ Added width:auto to logo in template: ${template.name}`);
      }

      // Ensure object-fit:contain is present for proper scaling
      if (newHtmlContent.includes('{{logoUrl}}') && !newHtmlContent.includes('object-fit:contain')) {
        // Find the img tag with logoUrl and add object-fit if missing
        newHtmlContent = newHtmlContent.replace(
          /(<img[^>]*src=["']{{logoUrl}}["'][^>]*style=["'])([^"']*)(["'])/gi,
          (match, before, style, after) => {
            if (!style.includes('object-fit')) {
              return `${before}${style};object-fit:contain${after}`;
            }
            return match;
          }
        );
        updated = true;
        console.log(`✅ Added object-fit:contain to logo in template: ${template.name}`);
      }

      // Also add width:auto to maintain aspect ratio
      if (newHtmlContent.includes('{{logoUrl}}') && !newHtmlContent.includes('width:auto')) {
        newHtmlContent = newHtmlContent.replace(
          /(<img[^>]*src=["']{{logoUrl}}["'][^>]*style=["'])([^"']*)(["'])/gi,
          (match, before, style, after) => {
            if (!style.includes('width:auto') && !style.includes('width:')) {
              return `${before}${style};width:auto${after}`;
            }
            return match;
          }
        );
        updated = true;
        console.log(`✅ Added width:auto to logo in template: ${template.name}`);
      }

      if (updated) {
        template.htmlContent = newHtmlContent;
        await template.save();
        console.log(`✅ Successfully updated template: ${template.name}`);
      } else {
        console.log(`ℹ️  No changes needed for template: ${template.name}`);
      }
    }

    console.log('✅ Logo size update completed');
    await disconnectDB();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error updating logo size:', error);
    await disconnectDB();
    process.exit(1);
  }
}

// Run the script
updateLogoSizeInTemplates();

