const mongoose = require('mongoose');
require('dotenv').config();

// Import the compiled model
const { VehicleType } = require('./dist/models/VehicleType');

async function checkVehicleTypes() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/booking-system');
    console.log('Connected to MongoDB');

    // Get all vehicle types
    const vehicleTypes = await VehicleType.find({});
    console.log(`Found ${vehicleTypes.length} vehicle types in database:`);
    
    if (vehicleTypes.length === 0) {
      console.log('No vehicle types found in database');
      console.log('Creating default vehicle types...');
      
      // Create default vehicle types
      const defaultVehicleTypes = [
        {
          name: 'Minivan',
          description: 'Comfortable minivan for groups up to 7 passengers',
          category: 'Standard',
          capacity: 7,
          totalVehicles: 10,
          availableVehicles: 8,
          isAvailable: true,
          isActive: true,
          basePrice: 55,
          baseDistanceThreshold: 12,
          distanceTiers: [
            { fromMiles: 0, toMiles: 12, pricePerMile: 0, description: 'Base distance (included)' },
            { fromMiles: 12, toMiles: 20, pricePerMile: 2.0, description: 'Medium distance' },
            { fromMiles: 20, toMiles: 0, pricePerMile: 2.0, description: 'Long distance' }
          ],
          stopCharge: 5,
          childSeatCharge: 5,
          roundTripDiscount: 10,
          surgePricing: [],
          areaPrices: [],
          specifications: ['Air conditioning', 'Comfortable seating', 'Luggage space'],
          operatingHours: '24/7',
          images: [],
          mainImage: ''
        },
        {
          name: 'SUV',
          description: 'Spacious SUV for groups up to 6 passengers',
          category: 'Premium',
          capacity: 6,
          totalVehicles: 5,
          availableVehicles: 4,
          isAvailable: true,
          isActive: true,
          basePrice: 65,
          baseDistanceThreshold: 12,
          distanceTiers: [
            { fromMiles: 0, toMiles: 12, pricePerMile: 0, description: 'Base distance (included)' },
            { fromMiles: 12, toMiles: 20, pricePerMile: 2.5, description: 'Medium distance' },
            { fromMiles: 20, toMiles: 0, pricePerMile: 2.5, description: 'Long distance' }
          ],
          stopCharge: 5,
          childSeatCharge: 5,
          roundTripDiscount: 10,
          surgePricing: [],
          areaPrices: [],
          specifications: ['Premium interior', 'Advanced safety features', 'Extra luggage space'],
          operatingHours: '24/7',
          images: [],
          mainImage: ''
        },
        {
          name: 'Sedan',
          description: 'Elegant sedan for up to 4 passengers',
          category: 'Standard',
          capacity: 4,
          totalVehicles: 8,
          availableVehicles: 6,
          isAvailable: true,
          isActive: true,
          basePrice: 45,
          baseDistanceThreshold: 12,
          distanceTiers: [
            { fromMiles: 0, toMiles: 12, pricePerMile: 0, description: 'Base distance (included)' },
            { fromMiles: 12, toMiles: 20, pricePerMile: 1.8, description: 'Medium distance' },
            { fromMiles: 20, toMiles: 0, pricePerMile: 1.8, description: 'Long distance' }
          ],
          stopCharge: 5,
          childSeatCharge: 5,
          roundTripDiscount: 10,
          surgePricing: [],
          areaPrices: [],
          specifications: ['Comfortable seating', 'Climate control', 'Professional driver'],
          operatingHours: '24/7',
          images: [],
          mainImage: ''
        }
      ];

      for (const vehicleData of defaultVehicleTypes) {
        const vehicleType = new VehicleType(vehicleData);
        await vehicleType.save();
        console.log(`✅ Created vehicle type: ${vehicleType.name}`);
      }

      console.log('Default vehicle types created successfully!');
    } else {
      vehicleTypes.forEach((vehicle, index) => {
        console.log(`\n${index + 1}. ${vehicle.name}`);
        console.log(`   Category: ${vehicle.category}`);
        console.log(`   Capacity: ${vehicle.capacity} passengers`);
        console.log(`   Base Price: $${vehicle.basePrice}`);
        console.log(`   Available: ${vehicle.availableVehicles}/${vehicle.totalVehicles}`);
        console.log(`   Active: ${vehicle.isActive}`);
        console.log(`   Available for booking: ${vehicle.isAvailable}`);
      });
    }

  } catch (error) {
    console.error('Error checking vehicle types:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the script
if (require.main === module) {
  console.log('🔍 Checking vehicle types in database...\n');
  checkVehicleTypes()
    .then(() => {
      console.log('\n✅ Vehicle types check completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Script failed:', error);
      process.exit(1);
    });
} 