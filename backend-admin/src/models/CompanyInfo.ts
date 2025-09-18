import mongoose, { Document, Schema } from 'mongoose';

export interface ICompanyInfo extends Document {
  // Basic company information
  companyName: string;
  companyEmail: string;
  companyPhone: string;
  companyWebsite: string;
  companyAddress: string;
  companyCity: string;
  companyState: string;
  companyZipCode: string;
  companyCountry: string;
  
  // Business information
  businessLicense: string;
  taxId: string;
  operatingHours: string;
  emergencyContact: string;
  
  // Branding
  logoUrl: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  backgroundColor: string;
  textColor: string;
  
  // Social media
  facebookUrl: string;
  instagramUrl: string;
  twitterUrl: string;
  linkedinUrl: string;
  
  // Additional information
  description: string;
  missionStatement: string;
  termsOfService: string;
  privacyPolicy: string;
  
  // System settings
  isActive: boolean;
  lastModified: Date;
  lastModifiedBy: string;
  createdAt: Date;
  updatedAt: Date;
}

const companyInfoSchema = new Schema<ICompanyInfo>({
  // Basic company information
  companyName: {
    type: String,
    required: true,
    default: 'Airport Shuttle TPA'
  },
  companyEmail: {
    type: String,
    required: true,
    default: 'info@airportshuttletpa.com'
  },
  companyPhone: {
    type: String,
    required: true,
    default: '+1 (813) 555-0123'
  },
  companyWebsite: {
    type: String,
    default: 'https://airportshuttletpa.com'
  },
  companyAddress: {
    type: String,
    default: '123 Airport Blvd'
  },
  companyCity: {
    type: String,
    default: 'Tampa'
  },
  companyState: {
    type: String,
    default: 'FL'
  },
  companyZipCode: {
    type: String,
    default: '33607'
  },
  companyCountry: {
    type: String,
    default: 'USA'
  },
  
  // Business information
  businessLicense: {
    type: String,
    default: ''
  },
  taxId: {
    type: String,
    default: ''
  },
  operatingHours: {
    type: String,
    default: '24/7'
  },
  emergencyContact: {
    type: String,
    default: '+1 (813) 555-0123'
  },
  
  // Branding
  logoUrl: {
    type: String,
    default: ''
  },
  primaryColor: {
    type: String,
    default: '#007bff'
  },
  secondaryColor: {
    type: String,
    default: '#6c757d'
  },
  accentColor: {
    type: String,
    default: '#28a745'
  },
  backgroundColor: {
    type: String,
    default: '#ffffff'
  },
  textColor: {
    type: String,
    default: '#333333'
  },
  
  // Social media
  facebookUrl: {
    type: String,
    default: ''
  },
  instagramUrl: {
    type: String,
    default: ''
  },
  twitterUrl: {
    type: String,
    default: ''
  },
  linkedinUrl: {
    type: String,
    default: ''
  },
  
  // Additional information
  description: {
    type: String,
    default: 'Professional airport transportation services in Tampa Bay area'
  },
  missionStatement: {
    type: String,
    default: 'To provide safe, reliable, and comfortable transportation services to our customers'
  },
  termsOfService: {
    type: String,
    default: ''
  },
  privacyPolicy: {
    type: String,
    default: ''
  },
  
  // System settings
  isActive: {
    type: Boolean,
    default: true
  },
  lastModified: {
    type: Date,
    default: Date.now
  },
  lastModifiedBy: {
    type: String,
    required: true,
    default: 'System'
  }
}, {
  timestamps: true
});

// Index for active company info
companyInfoSchema.index({ isActive: 1 });

export const CompanyInfo = mongoose.model<ICompanyInfo>('CompanyInfo', companyInfoSchema);
