import mongoose from 'mongoose';
import { Booking } from '../models/Booking';
import { User } from '../models/User';
import bcrypt from 'bcryptjs';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/booking-admin';

const sampleBookings = [
  {
    outboundConfirmationNumber: '10001',
    tripInfo: {
      pickup: '123 Main St, New York, NY',
      dropoff: 'JFK Airport, New York, NY',
      date: '2024-01-15',
      pickupDate: '2024-01-15',
      pickupHour: '10',
      pickupMinute: '30',
      pickupPeriod: 'AM',
      pickupLocation: '123 Main St, New York, NY',
      dropoffLocation: 'JFK Airport, New York, NY',
      passengers: 2,
      checkedLuggage: 2,
      carryOn: 1,
      infantSeats: 0,
      toddlerSeats: 0,
      boosterSeats: 0,
      flight: 'AA123',
      airportCode: 'JFK',
      terminalGate: 'Terminal 8',
      meetOption: 'When your flight arrives',
      roundTrip: false,
      stops: []
    },
    userData: {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      phone: '+1-555-0123',
      specialInstructions: 'Please be on time'
    },
    groupName: 'Business Trip',
    occasion: 'Business',
    greetingSign: 'No',
    timeZone: 'America/New_York',
    serviceType: 'Airport Transfer',
    vehicleType: 'Luxury Sedan (SED)',
    paymentMethod: 'credit_card',
    checkoutType: 'guest',
    isLoggedIn: false,
    status: 'Unassigned',
    totalPrice: 150.00,
    calculatedPrice: 120.00,
    bookingFee: 10.00,
    childSeatsCharge: 0,
    discountPercentage: 0,
    discountFixed: 0,
    roundTripDiscount: 0,
    gratuityPercentage: 15,
    gratuityFixed: 0,
    taxesPercentage: 8.5,
    taxesFixed: 0,
    creditCardFeePercentage: 3.5,
    creditCardFeeFixed: 0,
    assignedDriver: '',
    assignedVehicle: '',
    notes: 'First time customer',
    dispatchNotes: '',
    sendConfirmations: 'Send Email',
    changeNotifications: 'Send Email'
  },
  {
    outboundConfirmationNumber: '10002',
    tripInfo: {
      pickup: '456 Park Ave, Los Angeles, CA',
      dropoff: 'LAX Airport, Los Angeles, CA',
      date: '2024-01-16',
      pickupDate: '2024-01-16',
      pickupHour: '08',
      pickupMinute: '00',
      pickupPeriod: 'AM',
      pickupLocation: '456 Park Ave, Los Angeles, CA',
      dropoffLocation: 'LAX Airport, Los Angeles, CA',
      passengers: 4,
      checkedLuggage: 4,
      carryOn: 2,
      infantSeats: 1,
      toddlerSeats: 0,
      boosterSeats: 0,
      flight: 'DL456',
      airportCode: 'LAX',
      terminalGate: 'Terminal 2',
      meetOption: 'When your flight arrives',
      roundTrip: true,
      returnDate: '2024-01-20',
      returnHour: '06',
      returnMinute: '00',
      returnPeriod: 'PM',
      returnFlight: 'DL457',
      stops: []
    },
    userData: {
      firstName: 'Jane',
      lastName: 'Smith',
      email: 'jane.smith@example.com',
      phone: '+1-555-0456',
      specialInstructions: 'Family with infant'
    },
    groupName: 'Family Vacation',
    occasion: 'Vacation',
    greetingSign: 'Yes',
    timeZone: 'America/Los_Angeles',
    serviceType: 'Airport Transfer',
    vehicleType: 'SUV (SUV)',
    paymentMethod: 'cash',
    checkoutType: 'guest',
    isLoggedIn: false,
    status: 'Assigned',
    totalPrice: 280.00,
    calculatedPrice: 200.00,
    bookingFee: 15.00,
    childSeatsCharge: 25.00,
    discountPercentage: 10,
    discountFixed: 0,
    roundTripDiscount: 20.00,
    gratuityPercentage: 18,
    gratuityFixed: 0,
    taxesPercentage: 9.5,
    taxesFixed: 0,
    creditCardFeePercentage: 0,
    creditCardFeeFixed: 0,
    assignedDriver: 'Mike Johnson',
    assignedVehicle: 'SUV-001',
    notes: 'Family with infant seat required',
    dispatchNotes: 'Driver confirmed for 8 AM pickup',
    sendConfirmations: 'Send Email',
    changeNotifications: 'Send Email'
  },
  {
    outboundConfirmationNumber: '10003',
    tripInfo: {
      pickup: '789 Oak St, Chicago, IL',
      dropoff: 'ORD Airport, Chicago, IL',
      date: '2024-01-17',
      pickupDate: '2024-01-17',
      pickupHour: '12',
      pickupMinute: '00',
      pickupPeriod: 'PM',
      pickupLocation: '789 Oak St, Chicago, IL',
      dropoffLocation: 'ORD Airport, Chicago, IL',
      passengers: 1,
      checkedLuggage: 1,
      carryOn: 1,
      infantSeats: 0,
      toddlerSeats: 0,
      boosterSeats: 0,
      flight: 'UA789',
      airportCode: 'ORD',
      terminalGate: 'Terminal 1',
      meetOption: 'When your flight arrives',
      roundTrip: false,
      stops: []
    },
    userData: {
      firstName: 'Robert',
      lastName: 'Wilson',
      email: 'robert.wilson@example.com',
      phone: '+1-555-0789',
      specialInstructions: 'Business traveler, need receipt'
    },
    groupName: 'Business Meeting',
    occasion: 'Business',
    greetingSign: 'No',
    timeZone: 'America/Chicago',
    serviceType: 'Airport Transfer',
    vehicleType: 'Luxury Sedan (SED)',
    paymentMethod: 'invoice',
    checkoutType: 'account',
    isLoggedIn: true,
    status: 'Done',
    totalPrice: 95.00,
    calculatedPrice: 80.00,
    bookingFee: 8.00,
    childSeatsCharge: 0,
    discountPercentage: 0,
    discountFixed: 5.00,
    roundTripDiscount: 0,
    gratuityPercentage: 12,
    gratuityFixed: 0,
    taxesPercentage: 8.25,
    taxesFixed: 0,
    creditCardFeePercentage: 0,
    creditCardFeeFixed: 0,
    assignedDriver: 'Sarah Davis',
    assignedVehicle: 'SED-002',
    notes: 'Regular business customer',
    dispatchNotes: 'Trip completed successfully',
    sendConfirmations: 'Send Email',
    changeNotifications: 'Send Email'
  }
];

const sampleUsers = [
  {
    firstName: 'Admin',
    lastName: 'User',
    email: 'admin@booking.com',
    password: 'admin123',
    role: 'admin',
    isActive: true
  },
  {
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    password: 'password123',
    role: 'operator',
    isActive: true
  }
];

export const seedData = async (): Promise<void> => {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Clear existing data
    await Booking.deleteMany({});
    await User.deleteMany({});
    console.log('Cleared existing data');

    // Create users
    for (const userData of sampleUsers) {
      const hashedPassword = await bcrypt.hash(userData.password, 10);
      const user = new User({
        ...userData,
        password: hashedPassword
      });
      await user.save();
    }
    console.log('Created sample users');

    // Create bookings
    for (const bookingData of sampleBookings) {
      const booking = new Booking(bookingData);
      await booking.save();
    }
    console.log('Created sample bookings');

    console.log('Database seeded successfully!');
    console.log(`Created ${sampleUsers.length} users and ${sampleBookings.length} bookings`);

  } catch (error) {
    console.error('Error seeding data:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
};

// Run the seed function if this file is executed directly
if (require.main === module) {
  seedData();
} 