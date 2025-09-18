import mongoose, { Document, Schema } from 'mongoose';

export interface IAreaPricing {
  name: string;
  type: 'zipcode' | 'city' | 'custom';
  value: string; // zipcode, city name, or custom area identifier
  coordinates?: {
    lat: number;
    lng: number;
    radius: number; // in miles
  };
  basePrice: number;
  pricePerMile: number;
  priority: number; // higher number = higher priority
}

export interface IAreaPrice {
  area: mongoose.Types.ObjectId;
  fixedPrice: number;
}

export interface IDistanceTier {
  fromMiles: number;
  toMiles: number;
  pricePerMile: number;
  description?: string;
}

export interface ISurgePricing {
  name: string;
  description?: string;
  multiplier: number; // e.g., 1.5 = 50% increase
  isActive: boolean;
  // Time-based conditions
  daysOfWeek?: number[]; // 0=Sunday, 1=Monday, etc.
  startTime?: string; // HH:MM format
  endTime?: string; // HH:MM format
  // Date-based conditions
  startDate?: Date;
  endDate?: Date;
  // Specific dates
  specificDates?: Date[];
  // Priority for overlapping conditions
  priority: number; // higher number = higher priority
}

export interface IVehicleSpecification {
  year?: number;
  make?: string;
  model?: string;
  color?: string;
  fuelType?: 'gasoline' | 'diesel' | 'electric' | 'hybrid';
  transmission?: 'automatic' | 'manual';
  features?: string[]; // e.g., ['AC', 'GPS', 'WiFi', 'Wheelchair Accessible']
  maxLuggage?: number; // number of large suitcases
  dimensions?: {
    length?: number; // in feet
    width?: number; // in feet
    height?: number; // in feet
  };
}

export interface IOperatingHours {
  dayOfWeek: number; // 0=Sunday, 1=Monday, etc.
  isOpen: boolean;
  openTime?: string; // HH:MM format
  closeTime?: string; // HH:MM format
  is24Hours?: boolean;
}

export interface IVehicleRating {
  userId: mongoose.Types.ObjectId;
  rating: number; // 1-5 stars
  comment?: string;
  createdAt: Date;
}

export interface IVehicleType extends Document {
  name: string;
  description: string;
  category: 'economy' | 'standard' | 'premium' | 'luxury' | 'specialty';
  capacity: number;
  isActive: boolean;
  
  // Availability management
  totalVehicles: number; // Total vehicles of this type
  availableVehicles: number; // Currently available vehicles
  isAvailable: boolean; // Overall availability status
  
  // Base pricing configuration
  basePrice: number;
  // Base distance threshold (miles included in base price)
  baseDistanceThreshold: number;
  // Configurable distance tiers (replaces old fixed thresholds)
  distanceTiers: IDistanceTier[];
  // Additional charges
  stopCharge: number;
  childSeatCharge: number;
  roundTripDiscount: number;
  // Cash payment discount configuration
  cashDiscountPercentage: number;
  cashDiscountFixedAmount: number;
  // Surge pricing for special conditions
  surgePricing: ISurgePricing[];
  // Area-specific pricing (overrides base pricing)
  areaPricing: IAreaPricing[];
  // Fixed prices for specific areas
  areaPrices: IAreaPrice[];
  
  // Vehicle specifications
  specifications: IVehicleSpecification;
  
  // Operating hours
  operatingHours: IOperatingHours[];
  
  // Ratings and reviews
  ratings: IVehicleRating[];
  averageRating: number;
  totalRatings: number;
  
  // Vehicle images
  images: string[]; // Array of image URLs
  mainImage?: string; // Primary image URL
  
  createdAt: Date;
  updatedAt: Date;
}

const areaPricingSchema = new Schema<IAreaPricing>({
  name: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['zipcode', 'city', 'custom'],
    required: true
  },
  value: {
    type: String,
    required: true
  },
  coordinates: {
    lat: Number,
    lng: Number,
    radius: Number
  },
  basePrice: {
    type: Number,
    required: true,
    min: 0
  },
  pricePerMile: {
    type: Number,
    required: true,
    min: 0
  },
  priority: {
    type: Number,
    default: 1,
    min: 1
  }
});

const areaPriceSchema = new Schema<IAreaPrice>({
  area: {
    type: Schema.Types.ObjectId,
    ref: 'Area',
    required: true
  },
  fixedPrice: {
    type: Number,
    required: true,
    min: 0
  }
});

const distanceTierSchema = new Schema<IDistanceTier>({
  fromMiles: {
    type: Number,
    required: true,
    min: 0
  },
  toMiles: {
    type: Number,
    required: true,
    min: 0
  },
  pricePerMile: {
    type: Number,
    required: true,
    min: 0
  },
  description: String
});

const surgePricingSchema = new Schema<ISurgePricing>({
  name: {
    type: String,
    required: true
  },
  description: String,
  multiplier: {
    type: Number,
    required: true,
    min: 1,
    default: 1.5
  },
  isActive: {
    type: Boolean,
    default: true
  },
  daysOfWeek: [{
    type: Number,
    min: 0,
    max: 6
  }],
  startTime: String, // HH:MM format
  endTime: String, // HH:MM format
  startDate: Date,
  endDate: Date,
  specificDates: [Date],
  priority: {
    type: Number,
    default: 1,
    min: 1
  }
});

const vehicleSpecificationSchema = new Schema<IVehicleSpecification>({
  year: {
    type: Number,
    min: 1900,
    max: new Date().getFullYear() + 1
  },
  make: String,
  model: String,
  color: String,
  fuelType: {
    type: String,
    enum: ['gasoline', 'diesel', 'electric', 'hybrid']
  },
  transmission: {
    type: String,
    enum: ['automatic', 'manual']
  },
  features: [String],
  maxLuggage: {
    type: Number,
    min: 0
  },
  dimensions: {
    length: Number,
    width: Number,
    height: Number
  }
});

const operatingHoursSchema = new Schema<IOperatingHours>({
  dayOfWeek: {
    type: Number,
    required: true,
    min: 0,
    max: 6
  },
  isOpen: {
    type: Boolean,
    default: true
  },
  openTime: String, // HH:MM format
  closeTime: String, // HH:MM format
  is24Hours: {
    type: Boolean,
    default: false
  }
});

const vehicleRatingSchema = new Schema<IVehicleRating>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  comment: String,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const vehicleTypeSchema = new Schema<IVehicleType>({
  name: {
    type: String,
    required: true,
    unique: true
  },
  description: {
    type: String,
    required: true
  },
  category: {
    type: String,
    enum: ['economy', 'standard', 'premium', 'luxury', 'specialty'],
    default: 'standard'
  },
  capacity: {
    type: Number,
    required: true,
    min: 1
  },
  isActive: {
    type: Boolean,
    default: true
  },
  
  // Availability management
  totalVehicles: {
    type: Number,
    required: true,
    default: 1,
    min: 0
  },
  availableVehicles: {
    type: Number,
    required: true,
    default: 1,
    min: 0
  },
  isAvailable: {
    type: Boolean,
    default: true
  },
  
  // Base pricing
  basePrice: {
    type: Number,
    required: true,
    default: 55,
    min: 0
  },
  // Base distance threshold (miles included in base price)
  baseDistanceThreshold: {
    type: Number,
    required: true,
    default: 12,
    min: 0
  },
  // Configurable distance tiers
  distanceTiers: [distanceTierSchema],
  // Additional charges
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
  },
  // Cash payment discount configuration
  cashDiscountPercentage: {
    type: Number,
    required: true,
    default: 0,
    min: 0,
    max: 100
  },
  cashDiscountFixedAmount: {
    type: Number,
    required: true,
    default: 0,
    min: 0
  },
  // Surge pricing
  surgePricing: [surgePricingSchema],
  // Area-specific pricing
  areaPricing: [areaPricingSchema],
  // Fixed prices for specific areas
  areaPrices: [areaPriceSchema],
  
  // Vehicle specifications
  specifications: {
    type: vehicleSpecificationSchema,
    default: {}
  },
  
  // Operating hours
  operatingHours: [operatingHoursSchema],
  
  // Ratings and reviews
  ratings: [vehicleRatingSchema],
  averageRating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  totalRatings: {
    type: Number,
    default: 0,
    min: 0
  },
  
  // Vehicle images
  images: [String],
  mainImage: String
}, {
  timestamps: true
});

// Indexes for better query performance - using ensureIndex to prevent duplicates
vehicleTypeSchema.on('index', function(error) {
  if (error) console.log('VehicleType index error:', error);
});

// Pre-save middleware to calculate average rating
vehicleTypeSchema.pre('save', function(next) {
  if (this.ratings && this.ratings.length > 0) {
    const totalRating = this.ratings.reduce((sum, rating) => sum + rating.rating, 0);
    this.averageRating = totalRating / this.ratings.length;
    this.totalRatings = this.ratings.length;
  } else {
    this.averageRating = 0;
    this.totalRatings = 0;
  }
  next();
});

export const VehicleType = mongoose.model<IVehicleType>('VehicleType', vehicleTypeSchema); 