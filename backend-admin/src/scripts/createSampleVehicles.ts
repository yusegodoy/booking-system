import mongoose from 'mongoose';
import { Vehicle } from '../models/Vehicle';
import { VehicleType } from '../models/VehicleType';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/booking-admin';

async function createSampleVehicles() {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Get existing vehicle types
    const vehicleTypes = await VehicleType.find();
    console.log('Found vehicle types:', vehicleTypes.map(vt => ({ id: vt._id, name: vt.name })));

    if (vehicleTypes.length === 0) {
      console.log('No vehicle types found. Please create vehicle types first.');
      return;
    }

    // Clear existing vehicles
    await Vehicle.deleteMany({});
    console.log('Cleared existing vehicles');

    // Create sample vehicles
    const sampleVehicles = [
      {
        licensePlate: 'ABC123',
        description: 'Chrysler Town & Country - Comfortable minivan for airport transfers',
        vehicleType: vehicleTypes.find(vt => vt.name === 'minivan')?._id,
        year: 2020,
        make: 'Chrysler',
        modelName: 'Town & Country',
        color: 'Silver',
        features: ['AC', 'GPS', 'WiFi', 'Leather Seats'],
        maxLuggage: 6,
        isActive: true,
        isAvailable: true,
        notes: 'Primary airport transfer vehicle'
      },
      {
        licensePlate: 'DEF456',
        description: 'Honda Odyssey - Spacious minivan with excellent fuel economy',
        vehicleType: vehicleTypes.find(vt => vt.name === 'minivan')?._id,
        year: 2021,
        make: 'Honda',
        modelName: 'Odyssey',
        color: 'Black',
        features: ['AC', 'GPS', 'Bluetooth', 'Backup Camera'],
        maxLuggage: 7,
        isActive: true,
        isAvailable: true,
        notes: 'Backup minivan for peak hours'
      },
      {
        licensePlate: 'GHI789',
        description: 'Toyota Highlander - Reliable SUV for group travel',
        vehicleType: vehicleTypes.find(vt => vt.name === 'test')?._id,
        year: 2019,
        make: 'Toyota',
        modelName: 'Highlander',
        color: 'White',
        features: ['AC', 'GPS', 'All-Wheel Drive'],
        maxLuggage: 4,
        isActive: true,
        isAvailable: true,
        notes: 'SUV option for smaller groups'
      },
      {
        licensePlate: 'JKL012',
        description: 'Ford Explorer - Premium SUV with luxury features',
        vehicleType: vehicleTypes.find(vt => vt.name === 'test')?._id,
        year: 2022,
        make: 'Ford',
        modelName: 'Explorer',
        color: 'Blue',
        features: ['AC', 'GPS', 'Leather Seats', 'Premium Sound'],
        maxLuggage: 5,
        isActive: true,
        isAvailable: true,
        notes: 'Premium SUV option'
      }
    ];

    // Create vehicles
    for (const vehicleData of sampleVehicles) {
      if (vehicleData.vehicleType) {
        const vehicle = new Vehicle(vehicleData);
        await vehicle.save();
        console.log(`Created vehicle: ${vehicleData.licensePlate} - ${vehicleData.description}`);
      } else {
        console.log(`Skipping vehicle ${vehicleData.licensePlate} - vehicle type not found`);
      }
    }

    console.log('Sample vehicles created successfully!');
    
    // Display created vehicles
    const createdVehicles = await Vehicle.find().populate('vehicleType', 'name');
    console.log('\nCreated vehicles:');
    createdVehicles.forEach(vehicle => {
      const vehicleType = vehicle.vehicleType as any;
      console.log(`- ${vehicle.licensePlate}: ${vehicle.description} (${vehicleType?.name})`);
    });

  } catch (error) {
    console.error('Error creating sample vehicles:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

createSampleVehicles(); 