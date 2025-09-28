import mongoose, { Document, Schema } from 'mongoose';

export interface IEmailVariable extends Document {
  category: string;
  variableName: string;
  codeField: string;
  description: string;
  dataType: 'string' | 'number' | 'boolean' | 'date' | 'array';
  isActive: boolean;
  isRequired: boolean;
  defaultValue?: string;
  exampleValue?: string;
  createdAt: Date;
  updatedAt: Date;
}

const emailVariableSchema = new Schema<IEmailVariable>({
  category: {
    type: String,
    required: true,
    enum: [
      'Customer Information',
      'Trip Information', 
      'Vehicle Information',
      'Pricing & Payment',
      'Child Safety',
      'Driver Assignment',
      'Booking Details',
      'Company Information'
    ]
  },
  variableName: {
    type: String,
    required: true,
    unique: true
  },
  codeField: {
    type: String,
    required: true,
    description: 'Campo real en el código (ej: booking.userData.firstName)'
  },
  description: {
    type: String,
    required: true
  },
  dataType: {
    type: String,
    enum: ['string', 'number', 'boolean', 'date', 'array'],
    default: 'string'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isRequired: {
    type: Boolean,
    default: false
  },
  defaultValue: {
    type: String,
    default: ''
  },
  exampleValue: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

// Índices para optimizar consultas
emailVariableSchema.index({ category: 1, isActive: 1 });
emailVariableSchema.index({ variableName: 1 });

emailVariableSchema.on('index', function(error) {
  if (error) {
    console.error('EmailVariable index error:', error);
  }
});

export const EmailVariable = mongoose.model<IEmailVariable>('EmailVariable', emailVariableSchema);

