import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { connectDB, disconnectDB } from '../config/database';
import { EmailTemplate } from '../models/EmailTemplate';

dotenv.config();

const TEMPLATE_NAME = 'Confirmation Final';
const SUBJECT = 'Your Ride Is Confirmed – {{confirmationNumber}}';

const htmlTemplatePath = path.resolve(__dirname, '../../template-analysis/current-confirmation-final.html');
const textTemplatePath = path.resolve(__dirname, '../../template-analysis/current-confirmation-final.txt');

async function loadTemplateFile(filePath: string): Promise<string> {
  return fs.promises.readFile(filePath, 'utf-8');
}

async function run(): Promise<void> {
  try {
    console.log('🚀 Updating template in MongoDB:', TEMPLATE_NAME);

    const [htmlContent, textContent] = await Promise.all([
      loadTemplateFile(htmlTemplatePath),
      loadTemplateFile(textTemplatePath)
    ]);

    if (!htmlContent.trim()) {
      throw new Error('HTML content is empty. Aborting update.');
    }

    await connectDB();

    const updatePayload = {
      subject: SUBJECT,
      htmlContent,
      textContent: textContent.trim() ? textContent : 'Plain text version not available.',
      type: 'confirmation' as const,
      isActive: true,
    };

    const result = await EmailTemplate.findOneAndUpdate(
      { name: TEMPLATE_NAME },
      {
        $set: updatePayload,
        $setOnInsert: { name: TEMPLATE_NAME, variables: [] }
      },
      { new: true, upsert: true }
    );

    if (!result) {
      throw new Error(`Template ${TEMPLATE_NAME} could not be updated or created.`);
    }

    const templateId = (result as any)._id ? String((result as any)._id) : 'unknown';

    console.log('✅ Template updated successfully!');
    console.log('🆔 Template ID:', templateId);
    console.log('📝 Subject:', result.subject);
  } catch (error) {
    console.error('❌ Error updating template:', error);
    process.exitCode = 1;
  } finally {
    await disconnectDB();
  }
}

run();
