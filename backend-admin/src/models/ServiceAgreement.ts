import mongoose, { Document, Schema } from 'mongoose';

export interface IServiceAgreement extends Document {
  title: string;
  content: string;
  htmlContent: string;
  isActive: boolean;
  version: number;
  lastModified: Date;
  lastModifiedBy: string;
  createdAt: Date;
  updatedAt: Date;
}

const serviceAgreementSchema = new Schema<IServiceAgreement>({
  title: {
    type: String,
    required: true,
    trim: true,
    default: 'Service Agreement'
  },
  content: {
    type: String,
    required: true,
    default: ''
  },
  htmlContent: {
    type: String,
    required: true,
    default: ''
  },
  isActive: {
    type: Boolean,
    default: true
  },
  version: {
    type: Number,
    default: 1
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

// Index for active service agreement
serviceAgreementSchema.index({ isActive: 1 });

export const ServiceAgreement = mongoose.model<IServiceAgreement>('ServiceAgreement', serviceAgreementSchema);
