import mongoose, { Document, Schema } from 'mongoose';

export interface IEmailConfig extends Document {
  smtpHost: string;
  smtpPort: number;
  smtpUser: string;
  smtpPassword: string;
  smtpSecure: boolean;
  fromEmail: string;
  fromName: string;
  adminEmail: string;
  isActive: boolean;
  // Auto-send email configuration
  autoSendCustomerEmail: boolean;
  autoSendCompanyEmail: boolean;
  customerEmailTemplate: string; // Template name for customer emails
  companyEmailTemplate: string; // Template name for company emails
  createdAt: Date;
  updatedAt: Date;
}

const emailConfigSchema = new Schema<IEmailConfig>({
  smtpHost: {
    type: String,
    required: true,
    default: 'smtp.ionos.com'
  },
  smtpPort: {
    type: Number,
    required: true,
    default: 587
  },
  smtpUser: {
    type: String,
    required: true
  },
  smtpPassword: {
    type: String,
    required: true
  },
  smtpSecure: {
    type: Boolean,
    default: false
  },
  fromEmail: {
    type: String,
    required: true,
    default: 'info@airportshuttletpa.com'
  },
  fromName: {
    type: String,
    required: true,
    default: 'Airport Shuttle TPA'
  },
  adminEmail: {
    type: String,
    required: true,
    default: 'info@airportshuttletpa.com'
  },
  isActive: {
    type: Boolean,
    default: false
  },
  // Auto-send email configuration
  autoSendCustomerEmail: {
    type: Boolean,
    default: false
  },
  autoSendCompanyEmail: {
    type: Boolean,
    default: false
  },
  customerEmailTemplate: {
    type: String,
    default: ''
  },
  companyEmailTemplate: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

// Ensure only one email configuration exists
emailConfigSchema.on('index', function(error) {
  if (error) {
    console.error('EmailConfig index error:', error);
  }
});

export const EmailConfig = mongoose.model<IEmailConfig>('EmailConfig', emailConfigSchema);
