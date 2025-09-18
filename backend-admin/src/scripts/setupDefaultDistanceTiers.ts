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

const setupDefaultDistanceTiers = async () => {
  try {
    console.log('Setting up default distance tiers...');
    
    // Find all vehicle types
    const vehicleTypes = await VehicleType.find({});
    console.log(`Found ${vehicleTypes.length} vehicle types`);
    
    for (const vehicleType of vehicleTypes) {
      console.log(`Processing vehicle type: ${vehicleType.name}`);
      
      // Check if distanceTiers are already configured
      if (vehicleType.distanceTiers && vehicleType.distanceTiers.length > 0) {
        console.log(`Vehicle type ${vehicleType.name} already has distance tiers configured`);
        continue;
      }
      
      // Add default distance tiers
      vehicleType.distanceTiers = defaultDistanceTiers;
      await vehicleType.save();
      
      console.log(`✅ Added default distance tiers to ${vehicleType.name}`);
    }
    
    console.log('✅ Default distance tiers setup completed successfully');
  } catch (error) {
    console.error('Error setting up default distance tiers:', error);
  } finally {
    await mongoose.disconnect();
    console.log('MongoDB disconnected');
  }
};

// Run the script
if (require.main === module) {
  connectDB().then(() => {
    setupDefaultDistanceTiers();
  });
}

export { setupDefaultDistanceTiers }; 