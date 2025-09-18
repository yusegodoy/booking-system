import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import GoogleCalendarConfig from '../models/GoogleCalendarConfig';
import { Booking } from '../models/Booking';
import { IBooking } from '../models/Booking';

export class GoogleCalendarService {
  private oauth2Client: OAuth2Client;
  private calendar: any;

  constructor() {
    this.oauth2Client = new google.auth.OAuth2();
  }

  // Initialize the service with configuration
  async initialize() {
    try {
      const config = await GoogleCalendarConfig.findOne({ isEnabled: true });
      if (!config) {
        throw new Error('Google Calendar not configured');
      }

             this.oauth2Client.setCredentials({
         client_id: config.clientId,
         client_secret: config.clientSecret,
         refresh_token: config.refreshToken,
         access_token: config.accessToken,
         expiry_date: config.tokenExpiry?.getTime()
       } as any);

      this.calendar = google.calendar({ version: 'v3', auth: this.oauth2Client });
      return true;
    } catch (error) {
      console.error('Failed to initialize Google Calendar service:', error);
      return false;
    }
  }

  // Create or update event in Google Calendar
  async syncBookingToCalendar(booking: IBooking): Promise<{ success: boolean; eventId?: string; error?: string }> {
    try {
      if (!this.calendar) {
        await this.initialize();
      }

      const config = await GoogleCalendarConfig.findOne({ isEnabled: true });
      if (!config) {
        throw new Error('Google Calendar not configured');
      }

      // Prepare event data
      const eventData = this.prepareEventData(booking, config);
      
      let eventId = booking.googleCalendarEventId;
      let result;

      if (eventId) {
        // Update existing event
        result = await this.calendar.events.update({
          calendarId: config.calendarId,
          eventId: eventId,
          requestBody: eventData
        });
      } else {
        // Create new event
        result = await this.calendar.events.insert({
          calendarId: config.calendarId,
          requestBody: eventData
        });
        eventId = result.data.id;
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
      console.error('Failed to sync booking to Google Calendar:', error);
      
             // Update booking with error status
       await Booking.findByIdAndUpdate((booking._id as any), {
         googleCalendarSyncStatus: 'error',
         googleCalendarLastSync: new Date(),
         googleCalendarError: error.message
       });

      return { success: false, error: error.message };
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
    // Parse the date correctly in local timezone to avoid timezone issues
    const [year, month, day] = booking.tripInfo.date.split('-').map(Number);
    const pickupDate = new Date(year, month - 1, day); // month is 0-indexed
    
    const pickupHour = parseInt(booking.tripInfo.pickupHour);
    const pickupMinute = parseInt(booking.tripInfo.pickupMinute);
    const isPM = booking.tripInfo.pickupPeriod === 'PM';
    
    const startTime = new Date(pickupDate);
    startTime.setHours(
      isPM && pickupHour !== 12 ? pickupHour + 12 : 
      pickupHour === 12 && !isPM ? 0 : pickupHour, 
      pickupMinute, 0, 0
    );
    
    const endTime = new Date(startTime);
    endTime.setHours(endTime.getHours() + 2); // Default 2 hours duration

    // Generate title using template
    const title = this.generateEventTitle(booking, config.eventTitleTemplate);
    
    // Generate description based on configuration
    const description = this.generateEventDescription(booking, config.eventFields);
    
    // Generate location using template
    const location = this.generateEventLocation(booking, config.eventLocationTemplate);

    const eventData: any = {
      summary: title,
      description: description,
      location: location,
      start: {
        dateTime: startTime.toISOString(),
        timeZone: 'America/New_York'
      },
      end: {
        dateTime: endTime.toISOString(),
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

    // Add attendees if configured
    if (config.includeAttendees) {
      eventData.attendees = [
        { email: booking.userData.email, displayName: `${booking.userData.firstName} ${booking.userData.lastName}` }
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
    const replacements: { [key: string]: string } = {
      '{{customerName}}': `${booking.userData.firstName} ${booking.userData.lastName}`,
      '{{pickupAddress}}': booking.tripInfo.pickup,
      '{{dropoffAddress}}': booking.tripInfo.dropoff,
      '{{confirmationNumber}}': booking.outboundConfirmationNumber,
      '{{vehicleType}}': booking.vehicleType || 'Not assigned',
      '{{totalPrice}}': `$${booking.totalPrice}`,
      '{{date}}': booking.tripInfo.date,
      '{{time}}': `${booking.tripInfo.pickupHour}:${booking.tripInfo.pickupMinute} ${booking.tripInfo.pickupPeriod}`,
      '{{flight}}': booking.tripInfo.flight || 'N/A'
    };

    let title = template;
    Object.entries(replacements).forEach(([placeholder, value]) => {
      title = title.replace(new RegExp(placeholder, 'g'), value);
    });

    return title;
  }

  // Generate event location using template
  private generateEventLocation(booking: IBooking, template: string): string {
    const replacements: { [key: string]: string } = {
      '{{pickupAddress}}': booking.tripInfo.pickup,
      '{{dropoffAddress}}': booking.tripInfo.dropoff,
      '{{customerName}}': `${booking.userData.firstName} ${booking.userData.lastName}`,
      '{{confirmationNumber}}': booking.outboundConfirmationNumber
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

    if (eventFields.confirmationNumber) {
      lines.push(`📋 Confirmation: ${booking.outboundConfirmationNumber}`);
    }
    if (eventFields.customerName) {
      lines.push(`👤 Customer: ${booking.userData.firstName} ${booking.userData.lastName}`);
    }
    if (eventFields.customerEmail) {
      lines.push(`📧 Email: ${booking.userData.email}`);
    }
    if (eventFields.customerPhone) {
      lines.push(`📞 Phone: ${booking.userData.phone}`);
    }
    if (eventFields.passengers) {
      lines.push(`👥 Passengers: ${booking.tripInfo.passengers}`);
    }
    if (eventFields.luggage) {
      lines.push(`🛄 Luggage: ${booking.tripInfo.checkedLuggage} checked, ${booking.tripInfo.carryOn} carry-on`);
    }
    if (eventFields.vehicleType) {
      lines.push(`🚗 Vehicle: ${booking.vehicleType || 'Not assigned'}`);
    }
    if (eventFields.totalPrice) {
      lines.push(`💰 Total: $${booking.totalPrice}`);
    }
    if (eventFields.date) {
      lines.push(`📅 Date: ${booking.tripInfo.date}`);
    }
    if (eventFields.time) {
      lines.push(`⏰ Time: ${booking.tripInfo.pickupHour}:${booking.tripInfo.pickupMinute} ${booking.tripInfo.pickupPeriod}`);
    }
    if (eventFields.flight) {
      lines.push(`✈️ Flight: ${booking.tripInfo.flight || 'N/A'}`);
    }
    if (eventFields.roundTrip) {
      lines.push(`🔄 Round Trip: ${booking.tripInfo.roundTrip ? 'Yes' : 'No'}`);
    }

    if (eventFields.returnDate && booking.tripInfo.roundTrip && booking.tripInfo.returnDate) {
      lines.push(`🛬 Return: ${booking.tripInfo.returnDate} at ${booking.tripInfo.returnHour}:${booking.tripInfo.returnMinute} ${booking.tripInfo.returnPeriod}`);
    }
    if (eventFields.returnFlight && booking.tripInfo.roundTrip && booking.tripInfo.returnFlight) {
      lines.push(`✈️ Return Flight: ${booking.tripInfo.returnFlight || 'N/A'}`);
    }

    if (eventFields.specialInstructions && booking.userData.specialInstructions) {
      lines.push(`📝 Special Instructions: ${booking.userData.specialInstructions}`);
    }

    if (eventFields.childSeats && (booking.tripInfo.infantSeats > 0 || booking.tripInfo.toddlerSeats > 0 || booking.tripInfo.boosterSeats > 0)) {
      lines.push(`👶 Child Seats: ${booking.tripInfo.infantSeats} infant, ${booking.tripInfo.toddlerSeats} toddler, ${booking.tripInfo.boosterSeats} booster`);
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
        const result = await this.syncBookingToCalendar(booking);
        if (result.success) {
          synced++;
        } else {
          errors++;
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
      if (!this.calendar) {
        await this.initialize();
      }

      const response = await this.calendar.calendarList.list();
      return { success: true, calendars: response.data.items };
    } catch (error: any) {
      console.error('Failed to get available calendars:', error);
      return { success: false, error: error.message };
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
