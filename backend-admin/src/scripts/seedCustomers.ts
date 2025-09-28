import mongoose from 'mongoose';
import { Customer } from '../models/Customer';
import dotenv from 'dotenv';

dotenv.config();

const sampleCustomers = [
  {
    firstName: 'John',
    lastName: 'Smith',
    email: 'john.smith@email.com',
    phone: '(555) 123-4567',
    address: '123 Main Street',
    city: 'New York',
    state: 'NY',
    zipCode: '10001',
    country: 'USA',
    company: 'ABC Corporation',
    notes: 'Regular business customer, prefers luxury vehicles',
    isActive: true,
    totalBookings: 5,
    totalSpent: 1250.00,
    lastBookingDate: new Date('2024-01-15')
  },
  {
    firstName: 'Sarah',
    lastName: 'Johnson',
    email: 'sarah.johnson@email.com',
    phone: '(555) 234-5678',
    address: '456 Oak Avenue',
    city: 'Los Angeles',
    state: 'CA',
    zipCode: '90210',
    country: 'USA',
    company: 'XYZ Industries',
    notes: 'VIP customer, always books airport transfers',
    isActive: true,
    totalBookings: 12,
    totalSpent: 3200.00,
    lastBookingDate: new Date('2024-01-20')
  },
  {
    firstName: 'Michael',
    lastName: 'Brown',
    email: 'michael.brown@email.com',
    phone: '(555) 345-6789',
    address: '789 Pine Street',
    city: 'Chicago',
    state: 'IL',
    zipCode: '60601',
    country: 'USA',
    company: 'Tech Solutions Inc',
    notes: 'New customer, first booking was last week',
    isActive: true,
    totalBookings: 1,
    totalSpent: 180.00,
    lastBookingDate: new Date('2024-01-18')
  },
  {
    firstName: 'Emily',
    lastName: 'Davis',
    email: 'emily.davis@email.com',
    phone: '(555) 456-7890',
    address: '321 Elm Street',
    city: 'Miami',
    state: 'FL',
    zipCode: '33101',
    country: 'USA',
    company: 'Sunshine Tours',
    notes: 'Tour group coordinator, books multiple vehicles',
    isActive: true,
    totalBookings: 8,
    totalSpent: 2100.00,
    lastBookingDate: new Date('2024-01-12')
  },
  {
    firstName: 'David',
    lastName: 'Wilson',
    email: 'david.wilson@email.com',
    phone: '(555) 567-8901',
    address: '654 Maple Drive',
    city: 'Seattle',
    state: 'WA',
    zipCode: '98101',
    country: 'USA',
    company: 'Pacific Ventures',
    notes: 'Inactive customer, hasn\'t booked in 6 months',
    isActive: false,
    totalBookings: 3,
    totalSpent: 450.00,
    lastBookingDate: new Date('2023-07-15')
  },
  {
    firstName: 'Lisa',
    lastName: 'Anderson',
    email: 'lisa.anderson@email.com',
    phone: '(555) 678-9012',
    address: '987 Cedar Lane',
    city: 'Boston',
    state: 'MA',
    zipCode: '02101',
    country: 'USA',
    company: 'Northeast Consulting',
    notes: 'Regular customer, prefers SUVs for family trips',
    isActive: true,
    totalBookings: 6,
    totalSpent: 1400.00,
    lastBookingDate: new Date('2024-01-10')
  },
  {
    firstName: 'Robert',
    lastName: 'Taylor',
    email: 'robert.taylor@email.com',
    phone: '(555) 789-0123',
    address: '147 Birch Road',
    city: 'Denver',
    state: 'CO',
    zipCode: '80201',
    country: 'USA',
    company: 'Mountain Adventures',
    notes: 'Adventure tourism company, needs vehicles for groups',
    isActive: true,
    totalBookings: 15,
    totalSpent: 3800.00,
    lastBookingDate: new Date('2024-01-22')
  },
  {
    firstName: 'Jennifer',
    lastName: 'Martinez',
    email: 'jennifer.martinez@email.com',
    phone: '(555) 890-1234',
    address: '258 Spruce Street',
    city: 'Phoenix',
    state: 'AZ',
    zipCode: '85001',
    country: 'USA',
    company: 'Desert Tours',
    notes: 'New customer, interested in luxury transportation',
    isActive: true,
    totalBookings: 2,
    totalSpent: 320.00,
    lastBookingDate: new Date('2024-01-19')
  }
];

async function seedCustomers() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/booking-admin';
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    // Clear existing customers
    await Customer.deleteMany({});
    console.log('Cleared existing customers');

    // Insert sample customers
    const insertedCustomers = await Customer.insertMany(sampleCustomers);
    console.log(`Successfully inserted ${insertedCustomers.length} sample customers`);

    // Display inserted customers
    console.log('\nInserted customers:');
    insertedCustomers.forEach((customer, index) => {
      console.log(`${index + 1}. ${customer.firstName} ${customer.lastName} - ${customer.email}`);
    });

    console.log('\nCustomer seeding completed successfully!');
  } catch (error) {
    console.error('Error seeding customers:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the seeding function
seedCustomers(); 