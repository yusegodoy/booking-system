import mongoose from 'mongoose';
import { VehicleType } from '../models/VehicleType';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/booking-admin';

async function restoreVehicleTypes() {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Clear existing vehicle types
    await VehicleType.deleteMany({});
    console.log('Cleared existing vehicle types');

    // Create the original vehicle types
    const vehicleTypes = [
      {
        name: 'minivan',
        description: 'Comfortable minivan for airport transfers and group travel',
        category: 'standard',
        capacity: 7,
        isActive: true,
        totalVehicles: 5,
        availableVehicles: 5,
        isAvailable: true,
        basePrice: 55,
        baseDistanceThreshold: 12,
        distanceTiers: [
          {
            fromMiles: 0,
            toMiles: 12,
            pricePerMile: 4,
            description: 'Short distance'
          },
          {
            fromMiles: 12,
            toMiles: 25,
            pricePerMile: 3.5,
            description: 'Medium distance'
          },
          {
            fromMiles: 25,
            toMiles: 50,
            pricePerMile: 3,
            description: 'Long distance'
          },
          {
            fromMiles: 50,
            toMiles: 0,
            pricePerMile: 2.5,
            description: 'Extended distance'
          }
        ],
        stopCharge: 5,
        childSeatCharge: 5,
        roundTripDiscount: 5,
        cashDiscountPercentage: 3.5,
        cashDiscountFixedAmount: 0.15,
        specifications: {
          features: ['AC', 'GPS', 'WiFi', 'Luggage Space'],
          maxLuggage: 7
        }
      },
      {
        name: 'test',
        description: 'Test vehicle type for development',
        category: 'standard',
        capacity: 4,
        isActive: true,
        totalVehicles: 2,
        availableVehicles: 2,
        isAvailable: true,
        basePrice: 45,
        baseDistanceThreshold: 10,
        distanceTiers: [
          {
            fromMiles: 0,
            toMiles: 10,
            pricePerMile: 3,
            description: 'Short distance'
          },
          {
            fromMiles: 10,
            toMiles: 20,
            pricePerMile: 2.5,
            description: 'Medium distance'
          },
          {
            fromMiles: 20,
            toMiles: 0,
            pricePerMile: 2,
            description: 'Long distance'
          }
        ],
        stopCharge: 3,
        childSeatCharge: 5,
        roundTripDiscount: 10,
        cashDiscountPercentage: 3.5,
        cashDiscountFixedAmount: 0.15,
        specifications: {
          features: ['AC', 'GPS'],
          maxLuggage: 4
        }
      }
    ];

    // Insert vehicle types
    const createdVehicleTypes = await VehicleType.insertMany(vehicleTypes);
    console.log(`Created ${createdVehicleTypes.length} vehicle types:`);
    
    createdVehicleTypes.forEach(vt => {
      console.log(`- ${vt.name}: ${vt.description}`);
    });

    console.log('Vehicle types restored successfully!');
  } catch (error) {
    console.error('Error restoring vehicle types:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the restoration
restoreVehicleTypes(); 