import mongoose, { Document, Schema } from 'mongoose';

export interface IVehicle extends Document {
  licensePlate: string;
  description: string;
  vehicleType: mongoose.Types.ObjectId; // Reference to VehicleType
  year?: number;
  make?: string;
  modelName?: string;
  color?: string;
  features?: string[];
  maxLuggage?: number;
  isActive: boolean;
  isAvailable: boolean;
  images?: string[];
  mainImage?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const vehicleSchema = new Schema<IVehicle>({
  licensePlate: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  vehicleType: {
    type: Schema.Types.ObjectId,
    ref: 'VehicleType',
    required: true
  },
  year: {
    type: Number,
    min: 1900,
    max: new Date().getFullYear() + 1
  },
  make: String,
  modelName: String,
  color: String,
  features: [String],
  maxLuggage: {
    type: Number,
    min: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isAvailable: {
    type: Boolean,
    default: true
  },
  images: [String],
  mainImage: String,
  notes: String
}, {
  timestamps: true
});

// Indexes for better performance
// Indexes for better query performance - using ensureIndex to prevent duplicates
vehicleSchema.on('index', function(error) {
  if (error) console.log('Vehicle index error:', error);
});

export const Vehicle = mongoose.model<IVehicle>('Vehicle', vehicleSchema); 