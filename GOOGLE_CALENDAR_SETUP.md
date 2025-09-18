# 📅 Google Calendar Integration Setup Guide

## 🎯 **Overview**

This feature allows you to automatically sync all your bookings with Google Calendar. Each booking will create an event in your Google Calendar with all the relevant details including customer information, pickup/dropoff locations, flight details, and more.

## ✨ **Features**

- ✅ **Automatic Sync**: All bookings are automatically synced to Google Calendar
- ✅ **Rich Event Details**: Events include customer info, locations, flight details, and special instructions
- ✅ **Color Coding**: Events are color-coded based on booking status
- ✅ **Reminders**: Automatic reminders (1 day and 1 hour before pickup)
- ✅ **Round Trips**: Separate events for outbound and return trips
- ✅ **Real-time Updates**: Events are updated when booking status changes
- ✅ **Multiple Calendars**: Choose which calendar to sync to

## 🔧 **Setup Instructions**

### **Step 1: Create Google Cloud Project**

1. **Go to Google Cloud Console**: https://console.cloud.google.com/
2. **Create a new project** or select an existing one
3. **Enable Google Calendar API**:
   - Go to "APIs & Services" > "Library"
   - Search for "Google Calendar API"
   - Click "Enable"

### **Step 2: Create OAuth 2.0 Credentials**

1. **Go to "APIs & Services" > "Credentials"**
2. **Click "Create Credentials" > "OAuth 2.0 Client IDs"**
3. **Configure OAuth consent screen**:
   - User Type: External
   - App name: "Booking System"
   - User support email: Your email
   - Developer contact information: Your email
   - Add scopes: `https://www.googleapis.com/auth/calendar`

4. **Create OAuth 2.0 Client ID**:
   - Application type: Web application
   - Name: "Booking System Web Client"
   - Authorized redirect URIs: 
     - `http://localhost:5001/api/google-calendar/auth/callback` (for development)
     - `https://yourdomain.com/api/google-calendar/auth/callback` (for production)

5. **Save your credentials**:
   - Client ID
   - Client Secret

### **Step 3: Configure Environment Variables**

Add these to your `.env` file:

```env
GOOGLE_CLIENT_ID=your_client_id_here
GOOGLE_CLIENT_SECRET=your_client_secret_here
GOOGLE_REDIRECT_URI=http://localhost:5001/api/google-calendar/auth/callback
```

### **Step 4: Install Dependencies**

The required dependencies are already included in `package.json`:

```json
{
  "googleapis": "^128.0.0",
  "google-auth-library": "^9.0.0"
}
```

### **Step 5: Configure in Admin Portal**

1. **Access Admin Portal**: Go to your booking system admin panel
2. **Navigate to Google Calendar tab**: Click on "📅 Google Calendar" in the navigation
3. **Click "Connect Google Calendar"**: This will open Google OAuth
4. **Authorize the application**: Grant permissions to access your calendar
5. **Configure settings**:
   - Choose which calendar to sync to
   - Set sync interval (default: 15 minutes)
   - Enable/disable auto sync

## 🎨 **Event Details**

Each booking creates an event with the following information:

### **Event Title**
```
🚗 John Doe - Tampa Airport to Downtown Hotel
```

### **Event Description**
```
📋 Confirmation: 12345
👤 Customer: John Doe
📧 Email: john@example.com
📞 Phone: +1-555-123-4567
👥 Passengers: 2
🛄 Luggage: 2 checked, 1 carry-on
🚗 Vehicle: Minivan
💰 Total: $85.00
📅 Date: 2024-01-15
⏰ Time: 2:30 PM
✈️ Flight: AA1234
🔄 Round Trip: No
📝 Special Instructions: Please call when arriving
👶 Child Seats: 1 infant, 0 toddler, 0 booster
```

### **Event Location**
```
Tampa Airport to Downtown Hotel
```

### **Event Times**
- **Start**: Pickup time
- **End**: Pickup time + 2 hours (default)

### **Reminders**
- **Email**: 1 day before
- **Popup**: 1 hour before

### **Color Coding**
- 🔴 **Red**: Unassigned
- 🟠 **Orange**: Assigned
- 🟡 **Yellow**: On the way
- 🟢 **Green**: Arrived
- 🔵 **Blue**: Customer in car
- 🟣 **Purple**: Customer dropped off
- ⚪ **Gray**: Done
- ⚫ **Dark Gray**: Canceled

## 🔄 **Sync Process**

### **Automatic Sync**
- New bookings are automatically synced when created
- Existing bookings are synced when status changes
- Sync happens every 15 minutes (configurable)

### **Manual Sync**
- Click "Sync All Bookings" to manually sync all pending bookings
- Individual bookings can be synced from the booking editor

### **Sync Status**
- **Pending**: Waiting to be synced
- **Synced**: Successfully synced to Google Calendar
- **Error**: Failed to sync (check error message)
- **Not Synced**: Not yet attempted

## 🛠️ **Troubleshooting**

### **Common Issues**

#### **1. "Google Calendar not configured"**
- Make sure you've completed the setup steps
- Check that environment variables are set correctly
- Verify Google Calendar API is enabled

#### **2. "Authentication failed"**
- Check your Client ID and Client Secret
- Verify redirect URI matches exactly
- Make sure OAuth consent screen is configured

#### **3. "Permission denied"**
- Check that the Google account has access to the calendar
- Verify calendar ID is correct
- Make sure calendar is not read-only

#### **4. "Rate limit exceeded"**
- Google Calendar API has rate limits
- Wait a few minutes and try again
- Consider increasing sync interval

### **Error Messages**

| Error | Solution |
|-------|----------|
| `invalid_grant` | Re-authenticate with Google |
| `access_denied` | Check calendar permissions |
| `notFound` | Verify calendar ID |
| `quotaExceeded` | Wait and retry later |

## 🔒 **Security Considerations**

### **OAuth Tokens**
- Refresh tokens are stored securely in the database
- Access tokens are automatically refreshed
- Tokens can be revoked from Google Account settings

### **Data Privacy**
- Only booking data is synced to Google Calendar
- No customer data is stored by Google
- Events are private to your calendar

### **Access Control**
- Only admin users can configure Google Calendar
- Regular users cannot access calendar settings
- All API calls require authentication

## 📊 **Monitoring**

### **Sync Statistics**
- Total bookings synced
- Failed syncs
- Last sync time
- Sync status

### **Logs**
- Check server logs for sync errors
- Monitor Google Calendar API usage
- Track authentication issues

## 🚀 **Production Deployment**

### **Environment Variables**
```env
GOOGLE_CLIENT_ID=your_production_client_id
GOOGLE_CLIENT_SECRET=your_production_client_secret
GOOGLE_REDIRECT_URI=https://yourdomain.com/api/google-calendar/auth/callback
```

### **SSL Certificate**
- Google OAuth requires HTTPS in production
- Ensure your domain has a valid SSL certificate
- Update redirect URI to use HTTPS

### **Rate Limiting**
- Monitor API usage to stay within limits
- Consider implementing exponential backoff
- Set appropriate sync intervals

## 📞 **Support**

If you encounter issues:

1. **Check the troubleshooting section above**
2. **Verify all setup steps are completed**
3. **Check server logs for error messages**
4. **Test with a simple booking first**
5. **Contact support with specific error details**

## 🔄 **Updates**

This integration will be updated with:
- Additional calendar providers (Outlook, Apple Calendar)
- More event customization options
- Advanced sync scheduling
- Bulk operations
- Analytics and reporting

---

**Need help?** Check the troubleshooting section or contact support with your specific issue.
