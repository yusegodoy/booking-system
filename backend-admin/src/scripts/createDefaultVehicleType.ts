import mongoose from 'mongoose';
import { VehicleType } from '../models/VehicleType';

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect('mongodb://localhost:27017/booking-admin');
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

// Default distance tiers configuration
const defaultDistanceTiers = [
  {
    fromMiles: 0,
    toMiles: 12,
    pricePerMile: 3.5,
    description: 'Short distance (0-12 miles)'
  },
  {
    fromMiles: 12,
    toMiles: 20,
    pricePerMile: 2.0,
    description: 'Medium distance (12-20 miles)'
  },
  {
    fromMiles: 20,
    toMiles: 0, // 0 means no upper limit
    pricePerMile: 2.0,
    description: 'Long distance (20+ miles)'
  }
];

const createDefaultVehicleType = async () => {
  try {
    console.log('Creating default vehicle type...');
    
    // Check if minivan already exists
    const existingMinivan = await VehicleType.findOne({ name: 'minivan' });
    if (existingMinivan) {
      console.log('Minivan already exists, updating distance tiers...');
      existingMinivan.distanceTiers = defaultDistanceTiers;
      await existingMinivan.save();
      console.log('✅ Updated minivan with distance tiers');
      return;
    }
    
    // Create new minivan vehicle type
    const minivan = new VehicleType({
      name: 'minivan',
      description: 'Comfortable minivan for airport transfers and group travel',
      category: 'standard',
      capacity: 7,
      isActive: true,
      totalVehicles: 5,
      availableVehicles: 5,
      isAvailable: true,
      basePrice: 55,
      distanceTiers: defaultDistanceTiers,
      stopCharge: 5,
      childSeatCharge: 5,
      roundTripDiscount: 5,
      cashDiscountPercentage: 3.5,
      cashDiscountFixedAmount: 0.15,
      specifications: {
        features: ['AC', 'GPS', 'WiFi', 'Luggage Space'],
        maxLuggage: 7
      }
    });
    
    await minivan.save();
    console.log('✅ Created default minivan vehicle type with distance tiers');
    
  } catch (error) {
    console.error('Error creating default vehicle type:', error);
  } finally {
    await mongoose.disconnect();
    console.log('MongoDB disconnected');
  }
};

// Run the script
if (require.main === module) {
  connectDB().then(() => {
    createDefaultVehicleType();
  });
}

export { createDefaultVehicleType }; 