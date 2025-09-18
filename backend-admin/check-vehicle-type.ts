import mongoose from 'mongoose';
import { VehicleType } from './src/models/VehicleType';

const connectDB = async () => {
  try {
    await mongoose.connect('mongodb://localhost:27017/booking-admin');
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

async function checkVehicleType() {
  try {
    const vehicleTypes = await VehicleType.find({});
    console.log(`Found ${vehicleTypes.length} vehicle types:`);
    
    for (const vt of vehicleTypes) {
      console.log('\n=== Vehicle Type ===');
      console.log('Name:', vt.name);
      console.log('Base Price:', vt.basePrice);
      console.log('Distance Tiers:', JSON.stringify(vt.distanceTiers, null, 2));
      console.log('Stop Charge:', vt.stopCharge);
      console.log('Child Seat Charge:', vt.childSeatCharge);
      console.log('Round Trip Discount:', vt.roundTripDiscount);
    }
    
  } catch (error) {
    console.error('Error checking vehicle types:', error);
  } finally {
    await mongoose.disconnect();
    console.log('MongoDB disconnected');
  }
}

connectDB().then(() => {
  checkVehicleType();
}); 