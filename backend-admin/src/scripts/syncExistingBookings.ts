import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Booking } from '../models/Booking';
import GoogleCalendarConfig from '../models/GoogleCalendarConfig';
import googleCalendarService from '../services/googleCalendarService';

// Load environment variables
dotenv.config();

async function syncExistingBookings() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/booking_system';
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    // Check if Google Calendar is configured
    const config = await GoogleCalendarConfig.findOne({ isEnabled: true });
    if (!config) {
      console.log('❌ Google Calendar not configured. Please configure it first.');
      process.exit(1);
    }

    if (!config.refreshToken || !config.accessToken) {
      console.log('❌ Google Calendar not authenticated. Please authenticate first.');
      process.exit(1);
    }

    console.log('✅ Google Calendar configuration found');

    // Get all bookings that haven't been synced
    const unsyncedBookings = await Booking.find({
      isDeleted: { $ne: true },
      googleCalendarSyncStatus: { $in: ['not_synced', 'error', 'pending'] }
    });

    console.log(`📊 Found ${unsyncedBookings.length} bookings to sync`);

    if (unsyncedBookings.length === 0) {
      console.log('✅ All bookings are already synced!');
      process.exit(0);
    }

    // Initialize Google Calendar service
    await googleCalendarService.initialize();

    let synced = 0;
    let errors = 0;

    // Sync each booking
    for (const booking of unsyncedBookings) {
      try {
        console.log(`🔄 Syncing booking ${booking.outboundConfirmationNumber}...`);
        
        const result = await googleCalendarService.syncBookingToCalendar(booking);
        
        if (result.success) {
          console.log(`✅ Synced booking ${booking.outboundConfirmationNumber}`);
          synced++;
        } else {
          console.log(`❌ Failed to sync booking ${booking.outboundConfirmationNumber}: ${result.error}`);
          errors++;
        }

        // Add a small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));

      } catch (error: any) {
        console.log(`❌ Error syncing booking ${booking.outboundConfirmationNumber}: ${error.message}`);
        errors++;
      }
    }

    // Update config with sync results
    await GoogleCalendarConfig.findByIdAndUpdate(config._id, {
      syncStatus: errors > 0 ? 'error' : 'success',
      lastSync: new Date(),
      errorMessage: errors > 0 ? `${errors} bookings failed to sync` : null
    });

    console.log('\n📊 Sync Summary:');
    console.log(`✅ Successfully synced: ${synced} bookings`);
    console.log(`❌ Failed to sync: ${errors} bookings`);
    console.log(`📅 Last sync: ${new Date().toLocaleString()}`);

    if (errors > 0) {
      console.log('\n⚠️  Some bookings failed to sync. Check the error messages above.');
      console.log('You can run this script again to retry failed bookings.');
    } else {
      console.log('\n🎉 All bookings synced successfully!');
    }

  } catch (error: any) {
    console.error('❌ Script error:', error.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run the script
if (require.main === module) {
  syncExistingBookings()
    .then(() => {
      console.log('✅ Script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Script failed:', error);
      process.exit(1);
    });
}

export default syncExistingBookings;
