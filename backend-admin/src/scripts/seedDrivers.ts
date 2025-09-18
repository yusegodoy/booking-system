import mongoose from 'mongoose';
import { Driver } from '../models/Driver';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/booking-admin';

const sampleDrivers = [
  {
    firstName: 'John',
    lastName: 'Smith',
    email: 'john.smith@transport.com',
    password: 'password123',
    phone: '+1-555-0101',
    photo: '/uploads/drivers/driver-john-smith.jpg',
    licenseNumber: 'DL123456789',
    licenseExpiry: new Date('2025-12-31'),
    isActive: true,
    isAvailable: true,
    rating: 4.8,
    totalTrips: 156,
    totalEarnings: 12500,
    emergencyContact: {
      name: 'Mary Smith',
      phone: '+1-555-0102',
      relationship: 'Spouse'
    },
    schedule: {
      monday: { start: '08:00', end: '18:00', available: true },
      tuesday: { start: '08:00', end: '18:00', available: true },
      wednesday: { start: '08:00', end: '18:00', available: true },
      thursday: { start: '08:00', end: '18:00', available: true },
      friday: { start: '08:00', end: '18:00', available: true },
      saturday: { start: '09:00', end: '17:00', available: true },
      sunday: { start: '10:00', end: '16:00', available: false }
    },
    documents: {
      license: 'license_john_smith.pdf',
      insurance: 'insurance_john_smith.pdf',
      backgroundCheck: 'background_john_smith.pdf',
      drugTest: 'drugtest_john_smith.pdf'
    }
  },
  {
    firstName: 'Sarah',
    lastName: 'Johnson',
    email: 'sarah.johnson@transport.com',
    password: 'password123',
    phone: '+1-555-0201',
    photo: '/uploads/drivers/driver-sarah-johnson.jpg',
    licenseNumber: 'DL987654321',
    licenseExpiry: new Date('2026-06-30'),
    isActive: true,
    isAvailable: true,
    rating: 4.9,
    totalTrips: 203,
    totalEarnings: 18200,
    emergencyContact: {
      name: 'Michael Johnson',
      phone: '+1-555-0202',
      relationship: 'Husband'
    },
    schedule: {
      monday: { start: '07:00', end: '17:00', available: true },
      tuesday: { start: '07:00', end: '17:00', available: true },
      wednesday: { start: '07:00', end: '17:00', available: true },
      thursday: { start: '07:00', end: '17:00', available: true },
      friday: { start: '07:00', end: '17:00', available: true },
      saturday: { start: '08:00', end: '16:00', available: true },
      sunday: { start: '09:00', end: '15:00', available: true }
    },
    documents: {
      license: 'license_sarah_johnson.pdf',
      insurance: 'insurance_sarah_johnson.pdf',
      backgroundCheck: 'background_sarah_johnson.pdf',
      drugTest: 'drugtest_sarah_johnson.pdf'
    }
  },
  {
    firstName: 'Robert',
    lastName: 'Williams',
    email: 'robert.williams@transport.com',
    password: 'password123',
    phone: '+1-555-0301',
    photo: '/uploads/drivers/driver-robert-williams.jpg',
    licenseNumber: 'DL456789123',
    licenseExpiry: new Date('2025-09-15'),
    isActive: true,
    isAvailable: false,
    rating: 4.7,
    totalTrips: 89,
    totalEarnings: 7200,
    emergencyContact: {
      name: 'Lisa Williams',
      phone: '+1-555-0302',
      relationship: 'Wife'
    },
    schedule: {
      monday: { start: '09:00', end: '19:00', available: true },
      tuesday: { start: '09:00', end: '19:00', available: true },
      wednesday: { start: '09:00', end: '19:00', available: true },
      thursday: { start: '09:00', end: '19:00', available: true },
      friday: { start: '09:00', end: '19:00', available: true },
      saturday: { start: '10:00', end: '18:00', available: false },
      sunday: { start: '11:00', end: '17:00', available: false }
    },
    documents: {
      license: 'license_robert_williams.pdf',
      insurance: 'insurance_robert_williams.pdf',
      backgroundCheck: 'background_robert_williams.pdf',
      drugTest: 'drugtest_robert_williams.pdf'
    }
  },
  {
    firstName: 'Maria',
    lastName: 'Garcia',
    email: 'maria.garcia@transport.com',
    password: 'password123',
    phone: '+1-555-0401',
    licenseNumber: 'DL789123456',
    licenseExpiry: new Date('2026-03-20'),
    isActive: true,
    isAvailable: true,
    rating: 4.6,
    totalTrips: 134,
    totalEarnings: 10800,
    emergencyContact: {
      name: 'Carlos Garcia',
      phone: '+1-555-0402',
      relationship: 'Brother'
    },
    schedule: {
      monday: { start: '08:30', end: '18:30', available: true },
      tuesday: { start: '08:30', end: '18:30', available: true },
      wednesday: { start: '08:30', end: '18:30', available: true },
      thursday: { start: '08:30', end: '18:30', available: true },
      friday: { start: '08:30', end: '18:30', available: true },
      saturday: { start: '09:30', end: '17:30', available: true },
      sunday: { start: '10:30', end: '16:30', available: false }
    },
    documents: {
      license: 'license_maria_garcia.pdf',
      insurance: 'insurance_maria_garcia.pdf',
      backgroundCheck: 'background_maria_garcia.pdf',
      drugTest: 'drugtest_maria_garcia.pdf'
    }
  },
  {
    firstName: 'David',
    lastName: 'Brown',
    email: 'david.brown@transport.com',
    password: 'password123',
    phone: '+1-555-0501',
    licenseNumber: 'DL321654987',
    licenseExpiry: new Date('2025-11-10'),
    isActive: false,
    isAvailable: false,
    rating: 4.5,
    totalTrips: 67,
    totalEarnings: 5400,
    emergencyContact: {
      name: 'Jennifer Brown',
      phone: '+1-555-0502',
      relationship: 'Sister'
    },
    schedule: {
      monday: { start: '08:00', end: '18:00', available: false },
      tuesday: { start: '08:00', end: '18:00', available: false },
      wednesday: { start: '08:00', end: '18:00', available: false },
      thursday: { start: '08:00', end: '18:00', available: false },
      friday: { start: '08:00', end: '18:00', available: false },
      saturday: { start: '09:00', end: '17:00', available: false },
      sunday: { start: '10:00', end: '16:00', available: false }
    },
    documents: {
      license: 'license_david_brown.pdf',
      insurance: 'insurance_david_brown.pdf',
      backgroundCheck: 'background_david_brown.pdf',
      drugTest: 'drugtest_david_brown.pdf'
    }
  }
];

async function seedDrivers() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    console.log('🧹 Clearing existing drivers...');
    await Driver.deleteMany({});
    console.log('✅ Cleared existing drivers');

    console.log('🌱 Seeding drivers...');
    const createdDrivers = await Driver.insertMany(sampleDrivers);
    console.log(`✅ Created ${createdDrivers.length} drivers`);

    console.log('📋 Driver details:');
    createdDrivers.forEach((driver, index) => {
      console.log(`${index + 1}. ${driver.firstName} ${driver.lastName} - ${driver.email}`);
      console.log(`   License: ${driver.licenseNumber} | Rating: ${driver.rating} ⭐`);
      console.log(`   Status: ${driver.isActive ? 'Active' : 'Inactive'} | Available: ${driver.isAvailable ? 'Yes' : 'No'}`);
      console.log(`   Total Trips: ${driver.totalTrips} | Total Earnings: $${driver.totalEarnings}`);
      console.log('');
    });

    console.log('🎉 Driver seeding completed successfully!');
  } catch (error) {
    console.error('❌ Error seeding drivers:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run the seeding function
seedDrivers(); 