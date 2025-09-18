import mongoose, { Document, Schema } from 'mongoose';

export interface IEmailTemplate extends Document {
  name: string;
  subject: string;
  htmlContent: string;
  textContent: string;
  type: 'confirmation' | 'receipt' | 'custom';
  isActive: boolean;
  variables: string[];
  createdAt: Date;
  updatedAt: Date;
}

const emailTemplateSchema = new Schema<IEmailTemplate>({
  name: {
    type: String,
    required: true,
    unique: true
  },
  subject: {
    type: String,
    required: true
  },
  htmlContent: {
    type: String,
    required: true
  },
  textContent: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['confirmation', 'receipt', 'custom'],
    default: 'custom'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  variables: [{
    type: String
  }]
}, {
  timestamps: true
});

emailTemplateSchema.on('index', function(error) {
  if (error) {
    console.error('EmailTemplate index error:', error);
  }
});

export const EmailTemplate = mongoose.model<IEmailTemplate>('EmailTemplate', emailTemplateSchema);
