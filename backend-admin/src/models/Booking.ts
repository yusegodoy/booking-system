import mongoose, { Document, Schema } from 'mongoose';

export interface IBooking extends Document {
  outboundConfirmationNumber: string;
  returnConfirmationNumber?: string;
  tripInfo: {
    pickup: string;
    dropoff: string;
    date: string;
    pickupDate?: string;
    pickupHour: string;
    pickupMinute: string;
    pickupPeriod: string;
    pickupLocation?: string;
    dropoffLocation?: string;
    passengers: number;
    checkedLuggage: number;
    carryOn: number;
    infantSeats: number;
    toddlerSeats: number;
    boosterSeats: number;
    flight: string;
    airportCode?: string;
    terminalGate?: string;
    meetOption?: string;
    roundTrip: boolean;
    returnDate?: string;
    returnHour?: string;
    returnMinute?: string;
    returnPeriod?: string;
    returnFlight?: string;
    stops: string[];
    tripType?: string; // From Airport, To Airport, Point-to-point, Airport Transfer
  };
  customerId?: mongoose.Types.ObjectId; // Reference to existing customer
  userData: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    specialInstructions?: string;
  };
  groupName?: string;
  occasion?: string;
  greetingSign?: string;
  timeZone?: string;
  serviceType?: string;
  vehicleType?: string; // Vehicle type (e.g., "Minivan", "SUV")
  assignedVehicle?: mongoose.Types.ObjectId | string; // Specific vehicle (e.g., "Chrysler Town & Country")
  paymentMethod: 'cash' | 'invoice' | 'credit_card' | 'zelle';
  checkoutType: 'guest' | 'account';
  isLoggedIn: boolean;
  status: 'Pending' | 'Unassigned' | 'Assigned' | 'On the way' | 'Arrived' | 'Customer in car' | 'Customer dropped off' | 'Customer dropped off - Pending payment' | 'Done' | 'No Show' | 'Canceled';
  totalPrice: number;
  
  // Price breakdown components
  calculatedPrice?: number;
  bookingFee?: number;
  childSeatsCharge?: number;
  discountPercentage?: number;
  discountFixed?: number;
  roundTripDiscount?: number;
  gratuityPercentage?: number;
  gratuityFixed?: number;
  taxesPercentage?: number;
  taxesFixed?: number;
  creditCardFeePercentage?: number;
  creditCardFeeFixed?: number;
  
  // Additional pricing fields from pricing calculation
  basePrice?: number;
  distancePrice?: number;
  stopsCharge?: number;
  returnTripPrice?: number;
  subtotal?: number;
  finalTotal?: number;
  paymentDiscount?: number;
  paymentDiscountDescription?: string;
  areaName?: string;
  pricingMethod?: string;
  surgeMultiplier?: number;
  surgeName?: string;
  
  // Global variables for email templates and consistency across the application
  globalVariables?: {
    // Basic trip information
    PU_DATE?: string;        // Pickup date
    PU_TIME?: string;        // Pickup time
    PU?: string;             // Pickup location
    DO?: string;             // Drop off location
    RT_DATE?: string;        // Return date (for round trips)
    RT_TIME?: string;        // Return time (for round trips)
    RT?: string;             // Return location (for round trips)
    
    // Passenger and luggage information
    PASSENGERS?: string;     // Number of passengers
    CHECKED_LUGGAGE?: string; // Number of checked luggage
    CARRY_ON?: string;       // Number of carry-on bags
    INFANT_SEATS?: string;   // Number of infant seats
    TODDLER_SEATS?: string;  // Number of toddler seats
    BOOSTER_SEATS?: string;  // Number of booster seats
    TOTAL_CHILD_SEATS?: string; // Total child seats
    
    // Flight information
    FLIGHT?: string;         // Flight number
    MEET_OPTION?: string;    // Meet option (When flight arrives, etc.)
    RETURN_FLIGHT?: string;  // Return flight number
    
    // Customer information
    CUSTOMER_NAME?: string;  // Customer full name
    CUSTOMER_EMAIL?: string; // Customer email
    CUSTOMER_PHONE?: string; // Customer phone
    SPECIAL_INSTRUCTIONS?: string; // Special instructions
    GREETING_SIGN?: string;  // Greeting sign
    
    // Vehicle information
    VEHICLE_TYPE?: string;   // Vehicle type
    VEHICLE_NAME?: string;   // Vehicle name/model
    
    // Pricing information
    TOTAL_PRICE?: string;    // Total price
    CURRENCY?: string;       // Currency
    
    // Booking information
    CONFIRMATION_NUMBER?: string; // Confirmation number
    BOOKING_DATE?: string;   // Date when booking was made
    STATUS?: string;         // Booking status
  };
  
  // Google Calendar integration
  googleCalendarEventId?: string; // ID of the event in Google Calendar
  googleCalendarSyncStatus?: 'pending' | 'synced' | 'error' | 'not_synced';
  googleCalendarLastSync?: Date;
  googleCalendarError?: string;
  
  // Driver and assignment information
  assignedDriver?: string;
  
  // Notes and communication
  notes?: string;
  dispatchNotes?: string;
  sendConfirmations?: string;
  changeNotifications?: string;
  
  // Soft delete fields
  isDeleted?: boolean;
  deletedAt?: Date;
  deletedBy?: mongoose.Types.ObjectId;
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

const bookingSchema = new Schema<IBooking>({
  customerId: {
    type: Schema.Types.ObjectId,
    ref: 'Customer',
    required: false
  },
  outboundConfirmationNumber: {
    type: String,
    required: true,
    unique: true
  },
  returnConfirmationNumber: {
    type: String,
    unique: true,
    sparse: true
  },
  tripInfo: {
    pickup: {
      type: String,
      required: true
    },
    dropoff: {
      type: String,
      required: true
    },
    date: {
      type: String,
      required: true
    },
    pickupDate: String,
    pickupHour: {
      type: String,
      required: true
    },
    pickupMinute: {
      type: String,
      required: true
    },
    pickupPeriod: {
      type: String,
      required: true
    },
    pickupLocation: String,
    dropoffLocation: String,
    passengers: {
      type: Number,
      required: true,
      min: 1,
      max: 6
    },
    checkedLuggage: {
      type: Number,
      default: 0
    },
    carryOn: {
      type: Number,
      default: 0
    },
    infantSeats: {
      type: Number,
      default: 0
    },
    toddlerSeats: {
      type: Number,
      default: 0
    },
    boosterSeats: {
      type: Number,
      default: 0
    },
    flight: {
      type: String,
      default: ''
    },
    airportCode: String,
    terminalGate: String,
    meetOption: String,
    roundTrip: {
      type: Boolean,
      default: false
    },
    returnDate: String,
    returnHour: String,
    returnMinute: String,
    returnPeriod: String,
    returnFlight: String,
    stops: [String],
    tripType: {
      type: String,
      enum: ['From Airport', 'To Airport', 'Point-to-point', 'Airport Transfer'],
      default: 'Point-to-point'
    }
  },
  userData: {
    firstName: {
      type: String,
      required: true
    },
    lastName: {
      type: String,
      required: true
    },
    email: {
      type: String,
      required: true
    },
    phone: {
      type: String,
      required: true
    },
    specialInstructions: String
  },
  groupName: String,
  occasion: String,
  greetingSign: String,
  timeZone: String,
  serviceType: String,
  vehicleType: String,
  paymentMethod: {
    type: String,
    enum: ['cash', 'invoice', 'credit_card', 'zelle'],
    required: true
  },
  checkoutType: {
    type: String,
    enum: ['guest', 'account'],
    required: true
  },
  isLoggedIn: {
    type: Boolean,
    default: false
  },
  status: {
    type: String,
    enum: ['Pending', 'Unassigned', 'Assigned', 'On the way', 'Arrived', 'Customer in car', 'Customer dropped off', 'Customer dropped off - Pending payment', 'Done', 'No Show', 'Canceled'],
    default: 'Pending'
  },
  totalPrice: {
    type: Number,
    required: true
  },
  
  // Price breakdown components
  calculatedPrice: {
    type: Number,
    default: 0
  },
  bookingFee: {
    type: Number,
    default: 0
  },
  childSeatsCharge: {
    type: Number,
    default: 0
  },
  discountPercentage: {
    type: Number,
    default: 0
  },
  discountFixed: {
    type: Number,
    default: 0
  },
  roundTripDiscount: {
    type: Number,
    default: 0
  },
  gratuityPercentage: {
    type: Number,
    default: 0
  },
  gratuityFixed: {
    type: Number,
    default: 0
  },
  taxesPercentage: {
    type: Number,
    default: 0
  },
  taxesFixed: {
    type: Number,
    default: 0
  },
  creditCardFeePercentage: {
    type: Number,
    default: 0
  },
  creditCardFeeFixed: {
    type: Number,
    default: 0
  },
  
  // Additional pricing fields from pricing calculation
  basePrice: {
    type: Number,
    default: 0
  },
  distancePrice: {
    type: Number,
    default: 0
  },
  stopsCharge: {
    type: Number,
    default: 0
  },
  returnTripPrice: {
    type: Number,
    default: 0
  },
  subtotal: {
    type: Number,
    default: 0
  },
  finalTotal: {
    type: Number,
    default: 0
  },
  paymentDiscount: {
    type: Number,
    default: 0
  },
  paymentDiscountDescription: {
    type: String,
    default: ''
  },
  areaName: {
    type: String,
    default: ''
  },
  pricingMethod: {
    type: String,
    default: 'distance'
  },
  surgeMultiplier: {
    type: Number,
    default: 1
  },
  surgeName: {
    type: String,
    default: ''
  },
  
  // Global variables for email templates and consistency
  globalVariables: {
    type: Map,
    of: String,
    default: {}
  },
  
  // Google Calendar integration
  googleCalendarEventId: String,
  googleCalendarSyncStatus: {
    type: String,
    enum: ['pending', 'synced', 'error', 'not_synced'],
    default: 'not_synced'
  },
  googleCalendarLastSync: Date,
  googleCalendarError: String,
  
  // Driver and assignment information
  assignedDriver: String,
  
  // Notes and communication
  notes: String,
  dispatchNotes: String,
  sendConfirmations: String,
  changeNotifications: String,
  
  // Soft delete fields
  isDeleted: {
    type: Boolean,
    default: false
  },
  deletedAt: Date,
  deletedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User' // Assuming User model is the one deleting
  },
  
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for better query performance - using ensureIndex to prevent duplicates
bookingSchema.on('index', function(error) {
  if (error) console.log('Booking index error:', error);
});

export const Booking = mongoose.model<IBooking>('Booking', bookingSchema); 