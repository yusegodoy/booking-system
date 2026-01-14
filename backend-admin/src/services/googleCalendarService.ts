import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import GoogleCalendarConfig from '../models/GoogleCalendarConfig';
import { Booking } from '../models/Booking';
import { IBooking } from '../models/Booking';

export class GoogleCalendarService {
  private oauth2Client: OAuth2Client;
  private calendar: any;

  constructor() {
    this.oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI || 'http://localhost:5001/api/google-calendar/auth/callback'
    );
  }

  // Initialize the service with configuration
  async initialize() {
    try {
      // Check if Google OAuth2 credentials are configured
      if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
        console.error('❌ Google Calendar OAuth2 credentials not configured in environment variables');
        console.error('   Missing: GOOGLE_CLIENT_ID and/or GOOGLE_CLIENT_SECRET');
        throw new Error('Google Calendar OAuth2 credentials not configured. Please add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to your environment variables.');
      }

      const config = await GoogleCalendarConfig.findOne({ isEnabled: true });
      if (!config) {
        throw new Error('Google Calendar not configured in database');
      }

      if (!config.refreshToken) {
        throw new Error('Google Calendar refresh token not found. Please reconnect your Google Calendar account.');
      }

      console.log('🔧 Initializing Google Calendar service with credentials');
      console.log('   - Client ID:', process.env.GOOGLE_CLIENT_ID ? '✅ Present' : '❌ Missing');
      console.log('   - Client Secret:', process.env.GOOGLE_CLIENT_SECRET ? '✅ Present' : '❌ Missing');
      console.log('   - Refresh Token:', config.refreshToken ? '✅ Present' : '❌ Missing');

      this.oauth2Client.setCredentials({
        client_id: config.clientId || process.env.GOOGLE_CLIENT_ID,
        client_secret: config.clientSecret || process.env.GOOGLE_CLIENT_SECRET,
        refresh_token: config.refreshToken,
        access_token: config.accessToken,
        expiry_date: config.tokenExpiry?.getTime()
      } as any);

      // Set up automatic token refresh handler
      this.oauth2Client.on('tokens', async (tokens) => {
        try {
          // Get the current config again to ensure we have the latest version
          const currentConfig = await GoogleCalendarConfig.findOne({ isEnabled: true });
          if (!currentConfig) {
            console.error('❌ Config not found when trying to save refreshed tokens');
            return;
          }

          if (tokens.refresh_token) {
            // Update refresh token if provided
            currentConfig.refreshToken = tokens.refresh_token;
          }
          if (tokens.access_token) {
            // Update access token and expiry
            currentConfig.accessToken = tokens.access_token;
            if (tokens.expiry_date) {
              currentConfig.tokenExpiry = new Date(tokens.expiry_date);
            }
          }
          await currentConfig.save();
          console.log('✅ Google Calendar tokens refreshed and saved');
        } catch (saveError) {
          console.error('❌ Failed to save refreshed tokens:', saveError);
        }
      });

      this.calendar = google.calendar({ version: 'v3', auth: this.oauth2Client });
      console.log('✅ Google Calendar service initialized successfully');
      return true;
    } catch (error) {
      console.error('❌ Failed to initialize Google Calendar service:', error);
      return false;
    }
  }

  // Create or update event in Google Calendar
  async syncBookingToCalendar(booking: IBooking): Promise<{ success: boolean; eventId?: string; error?: string }> {
    const bookingId = (booking._id as any)?.toString() || 'unknown';
    const confirmationNumber = booking.outboundConfirmationNumber || 'N/A';
    
    try {
      // Validate required booking data
      if (!booking.tripInfo || !booking.tripInfo.date) {
        throw new Error('Booking missing required tripInfo.date');
      }
      
      if (!booking.tripInfo.pickupHour || !booking.tripInfo.pickupMinute || !booking.tripInfo.pickupPeriod) {
        throw new Error('Booking missing required pickup time information');
      }
      
      if (!booking.userData) {
        throw new Error('Booking missing required userData');
      }

      if (!this.calendar) {
        const initialized = await this.initialize();
        if (!initialized) {
          throw new Error('Failed to initialize Google Calendar service');
        }
      }

      const config = await GoogleCalendarConfig.findOne({ isEnabled: true });
      if (!config) {
        throw new Error('Google Calendar not configured');
      }

      // Check if we need to refresh tokens (refresh 5 minutes before expiry to be safe)
      const now = new Date();
      const fiveMinutesFromNow = new Date(now.getTime() + 5 * 60 * 1000);
      
      if (config.tokenExpiry && config.tokenExpiry < fiveMinutesFromNow) {
        console.log('🔄 Access token expired or expiring soon, refreshing...');
        try {
          // Ensure credentials are set before refreshing
          this.oauth2Client.setCredentials({
            client_id: config.clientId || process.env.GOOGLE_CLIENT_ID,
            client_secret: config.clientSecret || process.env.GOOGLE_CLIENT_SECRET,
            refresh_token: config.refreshToken,
            access_token: config.accessToken,
            expiry_date: config.tokenExpiry?.getTime()
          } as any);
          
          const tokenResponse = await this.oauth2Client.getAccessToken();
          if (tokenResponse.token) {
            // Update config with new token
            config.accessToken = tokenResponse.token;
            if (tokenResponse.res?.data?.expiry_date) {
              config.tokenExpiry = new Date(tokenResponse.res.data.expiry_date);
            } else {
              // If no expiry date provided, assume 1 hour from now
              config.tokenExpiry = new Date(now.getTime() + 60 * 60 * 1000);
            }
            await config.save();
            
            // Update oauth2Client with new token
            this.oauth2Client.setCredentials({
              client_id: config.clientId || process.env.GOOGLE_CLIENT_ID,
              client_secret: config.clientSecret || process.env.GOOGLE_CLIENT_SECRET,
              refresh_token: config.refreshToken,
              access_token: config.accessToken,
              expiry_date: config.tokenExpiry?.getTime()
            } as any);
            
            console.log('✅ Access token refreshed successfully');
          }
        } catch (refreshError: any) {
          console.error('❌ Failed to refresh access token:', refreshError);
          // If refresh fails, it might be because the refresh token is invalid
          if (refreshError.message?.includes('invalid_grant') || 
              refreshError.message?.includes('Token has been expired') ||
              refreshError.message?.includes('invalid_token')) {
            // Clear invalid tokens
            config.accessToken = undefined;
            config.tokenExpiry = undefined;
            await config.save();
            throw new Error('Authentication expired. Please reconnect your Google Calendar account.');
          }
          throw new Error('Failed to refresh access token. Please reconnect your Google Calendar account.');
        }
      }

      // Prepare event data
      const eventData = this.prepareEventData(booking, config);
      
      let eventId = booking.googleCalendarEventId;
      let result;

      console.log(`🔄 Syncing booking ${confirmationNumber} (${bookingId}) to Google Calendar...`);

      if (eventId) {
        // Update existing event
        result = await this.calendar.events.update({
          calendarId: config.calendarId,
          eventId: eventId,
          requestBody: eventData
        });
        console.log(`✅ Updated event ${eventId} for booking ${confirmationNumber}`);
      } else {
        // Create new event
        result = await this.calendar.events.insert({
          calendarId: config.calendarId,
          requestBody: eventData
        });
        eventId = result.data.id;
        console.log(`✅ Created event ${eventId} for booking ${confirmationNumber}`);
      }

             // Update booking with sync status
       await Booking.findByIdAndUpdate((booking._id as any), {
         googleCalendarEventId: eventId,
         googleCalendarSyncStatus: 'synced',
         googleCalendarLastSync: new Date(),
         googleCalendarError: null
       });

      return { success: true, eventId };
    } catch (error: any) {
      console.error(`❌ Failed to sync booking ${confirmationNumber} (${bookingId}) to Google Calendar:`, error);
      
      // Check if it's an authentication error
      let errorMessage = error.message || 'Unknown error';
      if (error.code === 401 || error.message?.includes('invalid_grant') || error.message?.includes('Token has been expired')) {
        errorMessage = 'Authentication failed. Please reconnect your Google Calendar account.';
      } else if (error.code === 403) {
        errorMessage = 'Access denied. Please check Google Calendar permissions.';
      }
      
      // Update booking with error status
      await Booking.findByIdAndUpdate((booking._id as any), {
        googleCalendarSyncStatus: 'error',
        googleCalendarLastSync: new Date(),
        googleCalendarError: errorMessage
      });

      return { success: false, error: errorMessage };
    }
  }

  // Delete event from Google Calendar
  async deleteEventFromCalendar(booking: IBooking): Promise<{ success: boolean; error?: string }> {
    try {
      if (!booking.googleCalendarEventId) {
        return { success: true }; // No event to delete
      }

      if (!this.calendar) {
        await this.initialize();
      }

      const config = await GoogleCalendarConfig.findOne({ isEnabled: true });
      if (!config) {
        throw new Error('Google Calendar not configured');
      }

      await this.calendar.events.delete({
        calendarId: config.calendarId,
        eventId: booking.googleCalendarEventId
      });

             // Update booking
       await Booking.findByIdAndUpdate((booking._id as any), {
         googleCalendarEventId: null,
         googleCalendarSyncStatus: 'not_synced',
         googleCalendarLastSync: new Date(),
         googleCalendarError: null
       });

      return { success: true };
    } catch (error: any) {
      console.error('Failed to delete event from Google Calendar:', error);
      return { success: false, error: error.message };
    }
  }

  // Prepare event data from booking
  private prepareEventData(booking: IBooking, config: any) {
    // Parse the date and time correctly for America/New_York timezone
    const [year, month, day] = booking.tripInfo.date.split('-').map(Number);
    
    const pickupHour = parseInt(booking.tripInfo.pickupHour || '0');
    const pickupMinute = parseInt(booking.tripInfo.pickupMinute || '0');
    const isPM = (booking.tripInfo.pickupPeriod || '').toUpperCase() === 'PM';
    
    // Convert to 24-hour format
    let hour24 = pickupHour;
    if (isPM && pickupHour !== 12) {
      hour24 = pickupHour + 12;
    } else if (!isPM && pickupHour === 12) {
      hour24 = 0;
    }
    
    // Create date/time string in ISO format for America/New_York timezone
    // The issue: when we use toISOString(), it converts to UTC, but Google Calendar
    // interprets the dateTime in the specified timezone, causing a 5-hour offset
    // Solution: Format the date/time directly without converting to UTC
    // Google Calendar will interpret it in the timezone specified (America/New_York)
    // Format: YYYY-MM-DDTHH:mm:ss (without 'Z' or timezone offset)
    const formatDateTime = (y: number, m: number, d: number, h: number, min: number): string => {
      return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}T${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}:00`;
    };
    
    const startDateTimeStr = formatDateTime(year, month, day, hour24, pickupMinute);
    
    // Calculate end time (2 hours later)
    let endHour = hour24 + 2;
    let endDay = day;
    let endMonth = month;
    let endYear = year;
    if (endHour >= 24) {
      endHour = endHour - 24;
      endDay++;
      const daysInMonth = new Date(year, month, 0).getDate();
      if (endDay > daysInMonth) {
        endDay = 1;
        endMonth++;
        if (endMonth > 12) {
          endMonth = 1;
          endYear++;
        }
      }
    }
    const endDateTimeStr = formatDateTime(endYear, endMonth, endDay, endHour, pickupMinute);

    // Generate title using template (with fallback)
    const titleTemplate = config.eventTitleTemplate || '🚗 {{customerName}} - {{pickupAddress}} to {{dropoffAddress}}';
    const title = this.generateEventTitle(booking, titleTemplate);
    
    // Generate description based on configuration
    const description = this.generateEventDescription(booking, config.eventFields || {});
    
    // Generate location using template (with fallback)
    const locationTemplate = config.eventLocationTemplate || '{{pickupAddress}} to {{dropoffAddress}}';
    const location = this.generateEventLocation(booking, locationTemplate);

    const eventData: any = {
      summary: title,
      description: description,
      location: location,
      start: {
        dateTime: startDateTimeStr,
        timeZone: 'America/New_York'
      },
      end: {
        dateTime: endDateTimeStr,
        timeZone: 'America/New_York'
      },
      colorId: this.getColorIdForStatus(booking.status),
      extendedProperties: {
        private: {
          bookingId: (booking._id as any).toString(),
          confirmationNumber: booking.outboundConfirmationNumber,
          status: booking.status
        }
      }
    };

    // Add attendees if configured and email exists
    if (config.includeAttendees && booking.userData?.email) {
      const firstName = booking.userData.firstName || '';
      const lastName = booking.userData.lastName || '';
      const displayName = `${firstName} ${lastName}`.trim() || 'Customer';
      eventData.attendees = [
        { email: booking.userData.email, displayName: displayName }
      ];
    }

    // Add reminders if configured
    if (config.includeReminders && config.reminderMinutes && config.reminderMinutes.length > 0) {
      eventData.reminders = {
        useDefault: false,
        overrides: config.reminderMinutes.map((minutes: number) => ({
          method: 'email',
          minutes: minutes
        }))
      };
    }

    return eventData;
  }

  // Generate event title using template
  private generateEventTitle(booking: IBooking, template: string): string {
    const firstName = booking.userData?.firstName || '';
    const lastName = booking.userData?.lastName || '';
    const customerName = `${firstName} ${lastName}`.trim() || 'Customer';
    
    const replacements: { [key: string]: string } = {
      '{{customerName}}': customerName,
      '{{pickupAddress}}': booking.tripInfo?.pickup || 'Pickup location not specified',
      '{{dropoffAddress}}': booking.tripInfo?.dropoff || 'Dropoff location not specified',
      '{{confirmationNumber}}': booking.outboundConfirmationNumber || 'N/A',
      '{{vehicleType}}': booking.vehicleType || (booking.assignedVehicle ? String(booking.assignedVehicle) : null) || 'Not assigned',
      '{{totalPrice}}': booking.totalPrice ? `$${booking.totalPrice}` : 'N/A',
      '{{date}}': booking.tripInfo?.date || 'N/A',
      '{{time}}': booking.tripInfo?.pickupHour && booking.tripInfo?.pickupMinute && booking.tripInfo?.pickupPeriod 
        ? `${booking.tripInfo.pickupHour}:${booking.tripInfo.pickupMinute} ${booking.tripInfo.pickupPeriod}` 
        : 'N/A',
      '{{flight}}': booking.tripInfo?.flight || 'N/A'
    };

    let title = template;
    Object.entries(replacements).forEach(([placeholder, value]) => {
      title = title.replace(new RegExp(placeholder, 'g'), value);
    });

    return title;
  }

  // Generate event location using template
  private generateEventLocation(booking: IBooking, template: string): string {
    const firstName = booking.userData?.firstName || '';
    const lastName = booking.userData?.lastName || '';
    const customerName = `${firstName} ${lastName}`.trim() || 'Customer';
    
      const replacements: { [key: string]: string } = {
        '{{pickupAddress}}': booking.tripInfo?.pickup || 'Pickup location not specified',
        '{{dropoffAddress}}': booking.tripInfo?.dropoff || 'Dropoff location not specified',
        '{{customerName}}': customerName,
        '{{confirmationNumber}}': (booking.outboundConfirmationNumber?.toString() || 'N/A')
      };

    let location = template;
    Object.entries(replacements).forEach(([placeholder, value]) => {
      location = location.replace(new RegExp(placeholder, 'g'), value);
    });

    return location;
  }

  // Generate event description based on configuration
  private generateEventDescription(booking: IBooking, eventFields: any): string {
    const lines: string[] = [];
    const userData = booking.userData || {};
    const tripInfo = booking.tripInfo || {};

    if (eventFields.confirmationNumber) {
      lines.push(`📋 Confirmation: ${booking.outboundConfirmationNumber || 'N/A'}`);
    }
    if (eventFields.customerName) {
      const firstName = userData.firstName || '';
      const lastName = userData.lastName || '';
      const customerName = `${firstName} ${lastName}`.trim() || 'Customer';
      lines.push(`👤 Customer: ${customerName}`);
    }
    if (eventFields.customerEmail && userData.email) {
      lines.push(`📧 Email: ${userData.email}`);
    }
    if (eventFields.customerPhone && userData.phone) {
      lines.push(`📞 Phone: ${userData.phone}`);
    }
    if (eventFields.passengers && tripInfo.passengers) {
      lines.push(`👥 Passengers: ${tripInfo.passengers}`);
    }
    if (eventFields.luggage && (tripInfo.checkedLuggage || tripInfo.carryOn)) {
      const checked = tripInfo.checkedLuggage || 0;
      const carryOn = tripInfo.carryOn || 0;
      lines.push(`🛄 Luggage: ${checked} checked, ${carryOn} carry-on`);
    }
    if (eventFields.vehicleType) {
      lines.push(`🚗 Vehicle: ${booking.vehicleType || (booking.assignedVehicle ? String(booking.assignedVehicle) : null) || 'Not assigned'}`);
    }
    if (eventFields.totalPrice && booking.totalPrice) {
      lines.push(`💰 Total: $${booking.totalPrice}`);
    }
    if (eventFields.date && tripInfo.date) {
      lines.push(`📅 Date: ${tripInfo.date}`);
    }
    if (eventFields.time && tripInfo.pickupHour && tripInfo.pickupMinute && tripInfo.pickupPeriod) {
      lines.push(`⏰ Time: ${tripInfo.pickupHour}:${tripInfo.pickupMinute} ${tripInfo.pickupPeriod}`);
    }
    if (eventFields.flight && tripInfo.flight) {
      lines.push(`✈️ Flight: ${tripInfo.flight}`);
    }
    if (eventFields.roundTrip) {
      lines.push(`🔄 Round Trip: ${tripInfo.roundTrip ? 'Yes' : 'No'}`);
    }

    if (eventFields.returnDate && tripInfo.roundTrip && tripInfo.returnDate) {
      const returnTime = tripInfo.returnHour && tripInfo.returnMinute && tripInfo.returnPeriod
        ? ` at ${tripInfo.returnHour}:${tripInfo.returnMinute} ${tripInfo.returnPeriod}`
        : '';
      lines.push(`🛬 Return: ${tripInfo.returnDate}${returnTime}`);
    }
    if (eventFields.returnFlight && tripInfo.roundTrip && tripInfo.returnFlight) {
      lines.push(`✈️ Return Flight: ${tripInfo.returnFlight}`);
    }

    if (eventFields.specialInstructions && userData.specialInstructions) {
      lines.push(`📝 Special Instructions: ${userData.specialInstructions}`);
    }

    if (eventFields.childSeats && tripInfo) {
      const infantSeats = tripInfo.infantSeats || 0;
      const toddlerSeats = tripInfo.toddlerSeats || 0;
      const boosterSeats = tripInfo.boosterSeats || 0;
      if (infantSeats > 0 || toddlerSeats > 0 || boosterSeats > 0) {
        lines.push(`👶 Child Seats: ${infantSeats} infant, ${toddlerSeats} toddler, ${boosterSeats} booster`);
      }
    }

    return lines.join('\n');
  }

  // Get color ID based on booking status
  private getColorIdForStatus(status: string): string {
    switch (status) {
      case 'Unassigned':
        return '1'; // Red
      case 'Assigned':
        return '2'; // Orange
      case 'On the way':
        return '3'; // Yellow
      case 'Arrived':
        return '4'; // Green
      case 'Customer in car':
        return '5'; // Blue
      case 'Customer dropped off':
        return '6'; // Purple
      case 'Done':
        return '7'; // Gray
      case 'Canceled':
        return '8'; // Dark gray
      default:
        return '1'; // Default red
    }
  }

  // Sync all pending bookings
  async syncAllPendingBookings(): Promise<{ success: boolean; synced: number; errors: number; error?: string }> {
    try {
      const config = await GoogleCalendarConfig.findOne({ isEnabled: true });
      if (!config) {
        throw new Error('Google Calendar not configured');
      }

      // Update sync status
      await GoogleCalendarConfig.findByIdAndUpdate(config._id, {
        syncStatus: 'syncing',
        lastSync: new Date()
      });

      const pendingBookings = await Booking.find({
        isDeleted: { $ne: true },
        googleCalendarSyncStatus: { $in: ['pending', 'error', 'not_synced'] }
      });

      let synced = 0;
      let errors = 0;

      for (const booking of pendingBookings) {
        const bookingId = (booking._id as any)?.toString() || 'unknown';
        const confirmationNumber = booking.outboundConfirmationNumber || 'N/A';
        
        try {
          const result = await this.syncBookingToCalendar(booking);
          if (result.success) {
            synced++;
            console.log(`✅ Successfully synced booking ${confirmationNumber} (${bookingId})`);
          } else {
            errors++;
            console.error(`❌ Failed to sync booking ${confirmationNumber} (${bookingId}): ${result.error}`);
          }
        } catch (error: any) {
          errors++;
          console.error(`❌ Exception syncing booking ${confirmationNumber} (${bookingId}):`, error.message);
        }
      }

      // Update sync status
      await GoogleCalendarConfig.findByIdAndUpdate(config._id, {
        syncStatus: errors > 0 ? 'error' : 'success',
        lastSync: new Date(),
        errorMessage: errors > 0 ? `${errors} bookings failed to sync` : null
      });

      return { success: true, synced, errors };
    } catch (error: any) {
      console.error('Failed to sync all pending bookings:', error);
      
      // Update sync status
      const config = await GoogleCalendarConfig.findOne({ isEnabled: true });
      if (config) {
        await GoogleCalendarConfig.findByIdAndUpdate(config._id, {
          syncStatus: 'error',
          lastSync: new Date(),
          errorMessage: error.message
        });
      }

      return { success: false, synced: 0, errors: 0, error: error.message };
    }
  }

  // Get available calendars
  async getAvailableCalendars(): Promise<{ success: boolean; calendars?: any[]; error?: string }> {
    try {
      // First check if config exists
      const config = await GoogleCalendarConfig.findOne({ isEnabled: true });
      if (!config) {
        return { success: false, error: 'Google Calendar not configured. Please connect your Google Calendar account.' };
      }

      if (!config.refreshToken) {
        return { success: false, error: 'Google Calendar refresh token not found. Please reconnect your Google Calendar account.' };
      }

      // Initialize if needed
      if (!this.calendar) {
        const initialized = await this.initialize();
        if (!initialized) {
          return { success: false, error: 'Failed to initialize Google Calendar service. Please check your configuration.' };
        }
      }

      // Check if we need to refresh tokens (refresh 5 minutes before expiry to be safe)
      const now = new Date();
      const fiveMinutesFromNow = new Date(now.getTime() + 5 * 60 * 1000);
      
      if (config.tokenExpiry && config.tokenExpiry < fiveMinutesFromNow) {
        console.log('🔄 Access token expired or expiring soon, refreshing...');
        try {
          // Ensure credentials are set before refreshing
          this.oauth2Client.setCredentials({
            client_id: config.clientId || process.env.GOOGLE_CLIENT_ID,
            client_secret: config.clientSecret || process.env.GOOGLE_CLIENT_SECRET,
            refresh_token: config.refreshToken,
            access_token: config.accessToken,
            expiry_date: config.tokenExpiry?.getTime()
          } as any);
          
          const tokenResponse = await this.oauth2Client.getAccessToken();
          if (tokenResponse.token) {
            // Update config with new token
            config.accessToken = tokenResponse.token;
            if (tokenResponse.res?.data?.expiry_date) {
              config.tokenExpiry = new Date(tokenResponse.res.data.expiry_date);
            } else {
              // If no expiry date provided, assume 1 hour from now
              config.tokenExpiry = new Date(now.getTime() + 60 * 60 * 1000);
            }
            await config.save();
            
            // Update oauth2Client with new token
            this.oauth2Client.setCredentials({
              client_id: config.clientId || process.env.GOOGLE_CLIENT_ID,
              client_secret: config.clientSecret || process.env.GOOGLE_CLIENT_SECRET,
              refresh_token: config.refreshToken,
              access_token: config.accessToken,
              expiry_date: config.tokenExpiry?.getTime()
            } as any);
            
            console.log('✅ Access token refreshed successfully');
          }
        } catch (refreshError: any) {
          console.error('❌ Failed to refresh access token:', refreshError);
          console.error('   Error details:', refreshError.message);
          // If refresh fails, it might be because the refresh token is invalid
          if (refreshError.message?.includes('invalid_grant') || 
              refreshError.message?.includes('Token has been expired') ||
              refreshError.message?.includes('invalid_token')) {
            // Clear invalid tokens
            config.accessToken = undefined;
            config.tokenExpiry = undefined;
            await config.save();
            return { success: false, error: 'Authentication expired. Please reconnect your Google Calendar account.' };
          }
          return { success: false, error: 'Failed to refresh access token. Please reconnect your Google Calendar account.' };
        }
      }

      // Make sure calendar is still initialized after token refresh
      if (!this.calendar) {
        const initialized = await this.initialize();
        if (!initialized) {
          return { success: false, error: 'Failed to initialize Google Calendar service after token refresh.' };
        }
      }

      console.log('📅 Attempting to list calendars...');
      let response;
      try {
        response = await this.calendar.calendarList.list();
        console.log('✅ Successfully retrieved calendars:', response.data.items?.length || 0);
        return { success: true, calendars: response.data.items || [] };
      } catch (listError: any) {
        // If we get a 400 or 401, try refreshing the token and retry once
        if ((listError.code === 400 || listError.code === 401) && config) {
          console.log('🔄 Got 400/401 error, attempting to refresh token and retry...');
          try {
            // Ensure credentials are set
            this.oauth2Client.setCredentials({
              client_id: config.clientId || process.env.GOOGLE_CLIENT_ID,
              client_secret: config.clientSecret || process.env.GOOGLE_CLIENT_SECRET,
              refresh_token: config.refreshToken,
              access_token: config.accessToken,
              expiry_date: config.tokenExpiry?.getTime()
            } as any);
            
            const tokenResponse = await this.oauth2Client.getAccessToken();
            if (tokenResponse.token) {
              config.accessToken = tokenResponse.token;
              if (tokenResponse.res?.data?.expiry_date) {
                config.tokenExpiry = new Date(tokenResponse.res.data.expiry_date);
              } else {
                // If no expiry date provided, assume 1 hour from now
                config.tokenExpiry = new Date(new Date().getTime() + 60 * 60 * 1000);
              }
              await config.save();
              
              // Reinitialize calendar with new token
              this.oauth2Client.setCredentials({
                client_id: config.clientId || process.env.GOOGLE_CLIENT_ID,
                client_secret: config.clientSecret || process.env.GOOGLE_CLIENT_SECRET,
                refresh_token: config.refreshToken,
                access_token: config.accessToken,
                expiry_date: config.tokenExpiry?.getTime()
              } as any);
              
              this.calendar = google.calendar({ version: 'v3', auth: this.oauth2Client });
              
              // Retry the request
              console.log('🔄 Retrying calendar list request...');
              response = await this.calendar.calendarList.list();
              console.log('✅ Successfully retrieved calendars after retry:', response.data.items?.length || 0);
              return { success: true, calendars: response.data.items || [] };
            }
          } catch (retryError: any) {
            console.error('❌ Failed to refresh and retry:', retryError);
            // If refresh token is invalid, clear tokens
            if (retryError.message?.includes('invalid_grant') || 
                retryError.message?.includes('Token has been expired') ||
                retryError.message?.includes('invalid_token')) {
              config.accessToken = undefined;
              config.tokenExpiry = undefined;
              await config.save();
            }
            throw retryError; // Re-throw to be handled by outer catch
          }
        }
        throw listError; // Re-throw to be handled by outer catch
      }
    } catch (error: any) {
      console.error('❌ Failed to get available calendars:', error);
      console.error('   Error code:', error.code);
      console.error('   Error message:', error.message);
      console.error('   Error response:', error.response?.data);
      
      // Check if it's an authentication error
      if (error.code === 401 || error.message?.includes('invalid_grant') || error.message?.includes('Token has been expired') || error.message?.includes('invalid_token')) {
        // Try to clear the invalid tokens
        const config = await GoogleCalendarConfig.findOne({ isEnabled: true });
        if (config) {
          config.accessToken = undefined;
          config.tokenExpiry = undefined;
          await config.save();
          console.log('🧹 Cleared invalid access token');
        }
        return { success: false, error: 'Authentication failed. Please reconnect your Google Calendar account.' };
      }
      
      if (error.code === 403) {
        return { success: false, error: 'Access denied. Please check Google Calendar permissions.' };
      }

      if (error.code === 400) {
        const errorDetails = error.response?.data?.error?.message || error.message || 'Invalid request';
        console.error('   Detailed error:', errorDetails);
        return { success: false, error: `Invalid request: ${errorDetails}. Please check your Google Calendar configuration or reconnect your account.` };
      }

      return { success: false, error: error.message || 'Failed to get available calendars' };
    }
  }

  // Test connection
  async testConnection(): Promise<{ success: boolean; error?: string }> {
    try {
      if (!this.calendar) {
        await this.initialize();
      }

      const config = await GoogleCalendarConfig.findOne({ isEnabled: true });
      if (!config) {
        throw new Error('Google Calendar not configured');
      }

      // Try to get calendar info
      await this.calendar.calendars.get({
        calendarId: config.calendarId
      });

      return { success: true };
    } catch (error: any) {
      console.error('Failed to test Google Calendar connection:', error);
      return { success: false, error: error.message };
    }
  }
}

export default new GoogleCalendarService();
