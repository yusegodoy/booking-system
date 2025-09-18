import mongoose, { Document, Schema } from 'mongoose';

export interface IPricingConfig extends Document {
  basePrice: number;
  shortDistanceThreshold: number;
  shortDistanceRate: number;
  longDistanceThreshold: number;
  longDistanceRate: number;
  stopCharge: number;
  childSeatCharge: number;
  roundTripDiscount: number;
  createdAt: Date;
  updatedAt: Date;
}

const pricingConfigSchema = new Schema<IPricingConfig>({
  basePrice: {
    type: Number,
    required: true,
    default: 55,
    min: 0
  },
  shortDistanceThreshold: {
    type: Number,
    required: true,
    default: 12,
    min: 0
  },
  shortDistanceRate: {
    type: Number,
    required: true,
    default: 3.5,
    min: 0
  },
  longDistanceThreshold: {
    type: Number,
    required: true,
    default: 20,
    min: 0
  },
  longDistanceRate: {
    type: Number,
    required: true,
    default: 2,
    min: 0
  },
  stopCharge: {
    type: Number,
    required: true,
    default: 5,
    min: 0
  },
  childSeatCharge: {
    type: Number,
    required: true,
    default: 5,
    min: 0
  },
  roundTripDiscount: {
    type: Number,
    required: true,
    default: 10,
    min: 0,
    max: 100
  }
}, {
  timestamps: true
});

export const PricingConfig = mongoose.model<IPricingConfig>('PricingConfig', pricingConfigSchema); 