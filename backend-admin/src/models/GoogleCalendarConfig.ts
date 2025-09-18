import mongoose, { Document, Schema } from 'mongoose';

export interface ICalendarEventFields {
  confirmationNumber: boolean;
  customerName: boolean;
  customerEmail: boolean;
  customerPhone: boolean;
  passengers: boolean;
  luggage: boolean;
  vehicleType: boolean;
  totalPrice: boolean;
  date: boolean;
  time: boolean;
  flight: boolean;
  roundTrip: boolean;
  returnDate: boolean;
  returnFlight: boolean;
  specialInstructions: boolean;
  childSeats: boolean;
  pickupAddress: boolean;
  dropoffAddress: boolean;
}

export interface IGoogleCalendarConfig extends Document {
  isEnabled: boolean;
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  refreshToken?: string;
  accessToken?: string;
  tokenExpiry?: Date;
  calendarId: string;
  calendarName: string;
  syncEnabled: boolean;
  autoSync: boolean;
  syncInterval: number; // minutes
  lastSync?: Date;
  syncStatus: 'idle' | 'syncing' | 'error' | 'success';
  errorMessage?: string;
  // Event configuration
  eventFields: ICalendarEventFields;
  eventTitleTemplate: string;
  eventLocationTemplate: string;
  includeAttendees: boolean;
  includeReminders: boolean;
  reminderMinutes: number[]; // Array of minutes for reminders
  createdBy?: mongoose.Types.ObjectId;
  updatedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const googleCalendarConfigSchema = new Schema<IGoogleCalendarConfig>({
  isEnabled: {
    type: Boolean,
    default: false
  },
  clientId: {
    type: String,
    required: true
  },
  clientSecret: {
    type: String,
    required: true
  },
  redirectUri: {
    type: String,
    required: true,
    default: 'http://localhost:5001/api/google-calendar/auth/callback'
  },
  refreshToken: {
    type: String
  },
  accessToken: {
    type: String
  },
  tokenExpiry: {
    type: Date
  },
  calendarId: {
    type: String,
    required: true,
    default: 'primary'
  },
  calendarName: {
    type: String,
    required: true,
    default: 'Booking System'
  },
  syncEnabled: {
    type: Boolean,
    default: true
  },
  autoSync: {
    type: Boolean,
    default: true
  },
  syncInterval: {
    type: Number,
    default: 15 // 15 minutes
  },
  lastSync: {
    type: Date
  },
  syncStatus: {
    type: String,
    enum: ['idle', 'syncing', 'error', 'success'],
    default: 'idle'
  },
  errorMessage: {
    type: String
  },
  // Event configuration
  eventFields: {
    type: {
      confirmationNumber: { type: Boolean, default: true },
      customerName: { type: Boolean, default: true },
      customerEmail: { type: Boolean, default: true },
      customerPhone: { type: Boolean, default: true },
      passengers: { type: Boolean, default: true },
      luggage: { type: Boolean, default: true },
      vehicleType: { type: Boolean, default: true },
      totalPrice: { type: Boolean, default: true },
      date: { type: Boolean, default: true },
      time: { type: Boolean, default: true },
      flight: { type: Boolean, default: true },
      roundTrip: { type: Boolean, default: true },
      returnDate: { type: Boolean, default: true },
      returnFlight: { type: Boolean, default: true },
      specialInstructions: { type: Boolean, default: true },
      childSeats: { type: Boolean, default: true },
      pickupAddress: { type: Boolean, default: true },
      dropoffAddress: { type: Boolean, default: true }
    },
    default: {
      confirmationNumber: true,
      customerName: true,
      customerEmail: true,
      customerPhone: true,
      passengers: true,
      luggage: true,
      vehicleType: true,
      totalPrice: true,
      date: true,
      time: true,
      flight: true,
      roundTrip: true,
      returnDate: true,
      returnFlight: true,
      specialInstructions: true,
      childSeats: true,
      pickupAddress: true,
      dropoffAddress: true
    }
  },
  eventTitleTemplate: {
    type: String,
    default: '🚗 {{customerName}} - {{pickupAddress}} to {{dropoffAddress}}'
  },
  eventLocationTemplate: {
    type: String,
    default: '{{pickupAddress}} to {{dropoffAddress}}'
  },
  includeAttendees: {
    type: Boolean,
    default: true
  },
  includeReminders: {
    type: Boolean,
    default: true
  },
  reminderMinutes: {
    type: [Number],
    default: [1440, 60] // 1 day and 1 hour before
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  updatedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Indexes for better query performance - using ensureIndex to prevent duplicates
googleCalendarConfigSchema.on('index', function(error) {
  if (error) console.log('GoogleCalendarConfig index error:', error);
});

export default mongoose.model<IGoogleCalendarConfig>('GoogleCalendarConfig', googleCalendarConfigSchema);
