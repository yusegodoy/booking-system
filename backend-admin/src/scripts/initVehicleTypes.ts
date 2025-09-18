import mongoose from 'mongoose';
import { VehicleType } from '../models/VehicleType';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/booking-admin';

async function initVehicleTypes() {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Clear existing vehicle types
    await VehicleType.deleteMany({});
    console.log('Cleared existing vehicle types');

    // Create sample vehicle types
    const vehicleTypes = [
      {
        name: 'Sedan',
        description: 'Comfortable sedan for up to 4 passengers',
        capacity: 4,
        isActive: true,
        basePrice: 45,
        shortDistanceThreshold: 10,
        shortDistanceRate: 3.0,
        longDistanceThreshold: 25,
        longDistanceRate: 2.5,
        stopCharge: 3,
        childSeatCharge: 5,
        roundTripDiscount: 15,
        imageUrl: 'https://images.pexels.com/photos/170782/pexels-photo-170782.jpeg',
        areaPricing: []
      },
      {
        name: 'Minivan',
        description: 'Spacious minivan for up to 6 passengers with luggage',
        capacity: 6,
        isActive: true,
        basePrice: 55,
        shortDistanceThreshold: 12,
        shortDistanceRate: 3.5,
        longDistanceThreshold: 20,
        longDistanceRate: 2.0,
        stopCharge: 5,
        childSeatCharge: 5,
        roundTripDiscount: 10,
        imageUrl: 'https://images.pexels.com/photos/210019/pexels-photo-210019.jpeg',
        areaPricing: [
          {
            name: 'Tampa Airport',
            type: 'zipcode',
            value: '33607',
            basePrice: 65,
            pricePerMile: 4.0,
            priority: 2
          },
          {
            name: 'Downtown Tampa',
            type: 'city',
            value: 'Tampa',
            basePrice: 60,
            pricePerMile: 3.8,
            priority: 1
          }
        ]
      },
      {
        name: 'SUV',
        description: 'Luxury SUV for up to 5 passengers',
        capacity: 5,
        isActive: true,
        basePrice: 65,
        shortDistanceThreshold: 15,
        shortDistanceRate: 4.0,
        longDistanceThreshold: 30,
        longDistanceRate: 3.0,
        stopCharge: 4,
        childSeatCharge: 6,
        roundTripDiscount: 12,
        imageUrl: 'https://images.pexels.com/photos/116675/pexels-photo-116675.jpeg',
        areaPricing: []
      }
    ];

    // Insert vehicle types
    const createdVehicleTypes = await VehicleType.insertMany(vehicleTypes);
    console.log(`Created ${createdVehicleTypes.length} vehicle types:`);
    
    createdVehicleTypes.forEach(vt => {
      console.log(`- ${vt.name}: ${vt.description}`);
    });

    console.log('Vehicle types initialization completed successfully!');
  } catch (error) {
    console.error('Error initializing vehicle types:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the initialization
initVehicleTypes(); 