const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/booking-admin';

// Import models
const { VehicleType } = require('./backend-admin/src/models/VehicleType');
const { Vehicle } = require('./backend-admin/src/models/Vehicle');
const { User } = require('./backend-admin/src/models/User');
const { Customer } = require('./backend-admin/src/models/Customer');
const { Booking } = require('./backend-admin/src/models/Booking');
const { Driver } = require('./backend-admin/src/models/Driver');

async function restoreRealData() {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Path to exported data
    const exportDir = path.join(__dirname, 'mongodb-export');
    
    if (!fs.existsSync(exportDir)) {
      console.error('❌ Export directory not found:', exportDir);
      return;
    }

    console.log('📁 Using export directory:', exportDir);

    // Clear existing data
    console.log('🗑️ Clearing existing data...');
    await VehicleType.deleteMany({});
    await Vehicle.deleteMany({});
    await User.deleteMany({});
    await Customer.deleteMany({});
    await Booking.deleteMany({});
    await Driver.deleteMany({});

    // Restore VehicleTypes
    console.log('🚗 Restoring VehicleTypes...');
    const vehicleTypesData = JSON.parse(fs.readFileSync(path.join(exportDir, 'vehicletypes.json'), 'utf8'));
    await VehicleType.insertMany(vehicleTypesData);
    console.log(`✅ Restored ${vehicleTypesData.length} VehicleTypes`);

    // Restore Vehicles
    console.log('🚙 Restoring Vehicles...');
    const vehiclesData = JSON.parse(fs.readFileSync(path.join(exportDir, 'vehicles.json'), 'utf8'));
    if (vehiclesData.length > 0) {
      await Vehicle.insertMany(vehiclesData);
      console.log(`✅ Restored ${vehiclesData.length} Vehicles`);
    } else {
      console.log('ℹ️ No vehicles to restore');
    }

    // Restore Users
    console.log('👤 Restoring Users...');
    const usersData = JSON.parse(fs.readFileSync(path.join(exportDir, 'users.json'), 'utf8'));
    await User.insertMany(usersData);
    console.log(`✅ Restored ${usersData.length} Users`);

    // Restore Customers
    console.log('👥 Restoring Customers...');
    const customersData = JSON.parse(fs.readFileSync(path.join(exportDir, 'customers.json'), 'utf8'));
    await Customer.insertMany(customersData);
    console.log(`✅ Restored ${customersData.length} Customers`);

    // Restore Bookings
    console.log('📋 Restoring Bookings...');
    const bookingsData = JSON.parse(fs.readFileSync(path.join(exportDir, 'bookings.json'), 'utf8'));
    await Booking.insertMany(bookingsData);
    console.log(`✅ Restored ${bookingsData.length} Bookings`);

    // Restore Drivers
    console.log('🚕 Restoring Drivers...');
    const driversData = JSON.parse(fs.readFileSync(path.join(exportDir, 'drivers.json'), 'utf8'));
    await Driver.insertMany(driversData);
    console.log(`✅ Restored ${driversData.length} Drivers`);

    console.log('🎉 Real data restoration completed successfully!');
    console.log('📊 Summary:');
    console.log(`   - VehicleTypes: ${vehicleTypesData.length}`);
    console.log(`   - Vehicles: ${vehiclesData.length}`);
    console.log(`   - Users: ${usersData.length}`);
    console.log(`   - Customers: ${customersData.length}`);
    console.log(`   - Bookings: ${bookingsData.length}`);
    console.log(`   - Drivers: ${driversData.length}`);

  } catch (error) {
    console.error('❌ Error restoring real data:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run the restoration
restoreRealData();
