import { Request, Response } from 'express';
import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import GoogleCalendarConfig from '../models/GoogleCalendarConfig';
import { Booking } from '../models/Booking';
import googleCalendarService from '../services/googleCalendarService';

// OAuth2 client for Google Calendar
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI || 'http://localhost:5001/api/google-calendar/auth/callback'
);

export const getConfig = async (req: Request, res: Response) => {
  try {
    const config = await GoogleCalendarConfig.findOne({ isEnabled: true });
    
    if (!config) {
      return res.status(404).json({ 
        success: false, 
        message: 'Google Calendar not configured' 
      });
    }

    // Don't send sensitive data
    const safeConfig = {
      isEnabled: config.isEnabled,
      calendarId: config.calendarId,
      calendarName: config.calendarName,
      syncEnabled: config.syncEnabled,
      autoSync: config.autoSync,
      syncInterval: config.syncInterval,
      lastSync: config.lastSync,
      syncStatus: config.syncStatus,
      errorMessage: config.errorMessage,
      hasValidTokens: !!(config.refreshToken && config.accessToken),
      // Event configuration
      eventFields: config.eventFields,
      eventTitleTemplate: config.eventTitleTemplate,
      eventLocationTemplate: config.eventLocationTemplate,
      includeAttendees: config.includeAttendees,
      includeReminders: config.includeReminders,
      reminderMinutes: config.reminderMinutes
    };

    return res.json({ success: true, config: safeConfig });
  } catch (error: any) {
    console.error('Error getting Google Calendar config:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Failed to get Google Calendar configuration' 
    });
  }
};

export const updateConfig = async (req: Request, res: Response) => {
  try {
    const { 
      clientId, 
      clientSecret, 
      calendarId, 
      calendarName, 
      syncEnabled, 
      autoSync, 
      syncInterval,
      eventFields,
      eventTitleTemplate,
      eventLocationTemplate,
      includeAttendees,
      includeReminders,
      reminderMinutes
    } = req.body;

    const userId = (req as any).user.id;

    let config = await GoogleCalendarConfig.findOne({ isEnabled: true });

    if (config) {
      // Update existing config
      config.clientId = clientId;
      config.clientSecret = clientSecret;
      config.calendarId = calendarId;
      config.calendarName = calendarName;
      config.syncEnabled = syncEnabled;
      config.autoSync = autoSync;
      config.syncInterval = syncInterval;
      config.updatedBy = userId;
      
      // Update event configuration
      if (eventFields) config.eventFields = eventFields;
      if (eventTitleTemplate) config.eventTitleTemplate = eventTitleTemplate;
      if (eventLocationTemplate) config.eventLocationTemplate = eventLocationTemplate;
      if (includeAttendees !== undefined) config.includeAttendees = includeAttendees;
      if (includeReminders !== undefined) config.includeReminders = includeReminders;
      if (reminderMinutes) config.reminderMinutes = reminderMinutes;
    } else {
      // Create new config
      config = new GoogleCalendarConfig({
        isEnabled: true,
        clientId,
        clientSecret,
        calendarId,
        calendarName,
        syncEnabled,
        autoSync,
        syncInterval,
        eventFields: eventFields || {
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
        },
        eventTitleTemplate: eventTitleTemplate || '🚗 {{customerName}} - {{pickupAddress}} to {{dropoffAddress}}',
        eventLocationTemplate: eventLocationTemplate || '{{pickupAddress}} to {{dropoffAddress}}',
        includeAttendees: includeAttendees !== undefined ? includeAttendees : true,
        includeReminders: includeReminders !== undefined ? includeReminders : true,
        reminderMinutes: reminderMinutes || [1440, 60],
        createdBy: userId,
        updatedBy: userId
      });
    }

    await config.save();

    res.json({ 
      success: true, 
      message: 'Google Calendar configuration updated successfully' 
    });
  } catch (error: any) {
    console.error('Error updating Google Calendar config:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to update Google Calendar configuration' 
    });
  }
};

export const getAuthUrl = async (req: Request, res: Response) => {
  try {
    // Check if Google credentials are configured
    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
      return res.status(400).json({
        success: false,
        message: 'Google Calendar credentials not configured. Please add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to your environment variables.'
      });
    }

    const scopes = [
      'https://www.googleapis.com/auth/calendar',
      'https://www.googleapis.com/auth/calendar.events'
    ];

    const authUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      prompt: 'consent' // Force consent to get refresh token
    });

    return res.json({ success: true, authUrl });
  } catch (error: any) {
    console.error('Error generating auth URL:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Failed to generate authentication URL. Please check your Google Calendar configuration.' 
    });
  }
};

export const handleAuthCallback = async (req: Request, res: Response) => {
  try {
    const { code } = req.query;

    if (!code) {
      return res.status(400).json({ 
        success: false, 
        message: 'Authorization code not provided' 
      });
    }

    console.log('🔐 Processing Google OAuth callback with code:', code);

    // Exchange code for tokens
    const { tokens } = await oauth2Client.getToken(code as string);
    
    console.log('✅ Tokens received from Google');
    console.log('   - Access Token:', tokens.access_token ? '✅ Present' : '❌ Missing');
    console.log('   - Refresh Token:', tokens.refresh_token ? '✅ Present' : '❌ Missing');
    
    // Find or create config
    let config = await GoogleCalendarConfig.findOne({ isEnabled: true });
    
    if (!config) {
      console.log('⚠️  No config found, creating new one...');
      config = new GoogleCalendarConfig({
        isEnabled: true,
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        redirectUri: process.env.GOOGLE_REDIRECT_URI,
        calendarId: 'primary',
        calendarName: 'Booking System',
        syncEnabled: true,
        autoSync: true,
        syncInterval: 15,
        syncStatus: 'idle'
      });
    }

    // Update config with tokens
    config.refreshToken = tokens.refresh_token || config.refreshToken;
    config.accessToken = tokens.access_token || config.accessToken;
    config.tokenExpiry = tokens.expiry_date ? new Date(tokens.expiry_date) : config.tokenExpiry;
    config.syncStatus = 'idle';
    config.errorMessage = undefined;
    
    // Only set updatedBy if user is authenticated
    if ((req as any).user?.id) {
      config.updatedBy = (req as any).user.id;
    }

    await config.save();
    
    console.log('✅ Configuration updated successfully');

    return res.json({ 
      success: true, 
      message: 'Google Calendar authentication successful' 
    });
  } catch (error: any) {
    console.error('❌ Error handling auth callback:', error);
    return res.status(500).json({ 
      success: false, 
      message: `Failed to complete authentication: ${error.message}` 
    });
  }
};

export const testConnection = async (req: Request, res: Response) => {
  try {
    const result = await googleCalendarService.testConnection();
    
    if (result.success) {
      res.json({ 
        success: true, 
        message: 'Google Calendar connection successful' 
      });
    } else {
      res.status(400).json({ 
        success: false, 
        message: result.error 
      });
    }
  } catch (error: any) {
    console.error('Error testing connection:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to test connection' 
    });
  }
};

export const getAvailableCalendars = async (req: Request, res: Response) => {
  try {
    const result = await googleCalendarService.getAvailableCalendars();
    
    if (result.success) {
      res.json({ 
        success: true, 
        calendars: result.calendars 
      });
    } else {
      res.status(400).json({ 
        success: false, 
        message: result.error 
      });
    }
  } catch (error: any) {
    console.error('Error getting available calendars:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to get available calendars' 
    });
  }
};

export const syncAllBookings = async (req: Request, res: Response) => {
  try {
    // Check if Google OAuth2 credentials are configured
    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
      console.error('❌ Google Calendar OAuth2 credentials not configured');
      return res.status(400).json({
        success: false,
        message: 'Google Calendar OAuth2 credentials not configured. Please add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to your environment variables.'
      });
    }

    const result = await googleCalendarService.syncAllPendingBookings();
    
    if (result.success) {
      res.json({ 
        success: true, 
        message: `Sync completed. ${result.synced} bookings synced, ${result.errors} errors.`,
        synced: result.synced,
        errors: result.errors
      });
    } else {
      res.status(400).json({ 
        success: false, 
        message: result.error 
      });
    }
  } catch (error: any) {
    console.error('❌ Error syncing all bookings:', error);
    
    // Provide specific error messages based on error type
    let errorMessage = 'Failed to sync bookings';
    if (error.message && error.message.includes('Could not determine client ID')) {
      errorMessage = 'Google Calendar OAuth2 credentials not configured properly';
    } else if (error.message && error.message.includes('invalid_request')) {
      errorMessage = 'Google Calendar authentication failed. Please reconnect your Google Calendar.';
    }
    
    res.status(500).json({ 
      success: false, 
      message: errorMessage 
    });
  }
};

export const syncSingleBooking = async (req: Request, res: Response) => {
  try {
    const { bookingId } = req.params;
    
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ 
        success: false, 
        message: 'Booking not found' 
      });
    }

    const result = await googleCalendarService.syncBookingToCalendar(booking);
    
    if (result.success) {
      return res.json({ 
        success: true, 
        message: 'Booking synced successfully',
        eventId: result.eventId
      });
    } else {
      return res.status(400).json({ 
        success: false, 
        message: result.error 
      });
    }
  } catch (error: any) {
    console.error('Error syncing single booking:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Failed to sync booking' 
    });
  }
};

export const disconnect = async (req: Request, res: Response) => {
  try {
    const config = await GoogleCalendarConfig.findOne({ isEnabled: true });
    if (config) {
      config.refreshToken = undefined;
      config.accessToken = undefined;
      config.tokenExpiry = undefined;
      config.updatedBy = (req as any).user?.id;
      await config.save();
    }

    res.json({ 
      success: true, 
      message: 'Google Calendar disconnected successfully' 
    });
  } catch (error: any) {
    console.error('Error disconnecting Google Calendar:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to disconnect Google Calendar' 
    });
  }
};
