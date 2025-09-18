# 🚀 Quick Setup Guide - Google Calendar Integration

## ⚠️ **Current Issue**
The Google Calendar integration is showing "Failed to start authentication" because the Google credentials are not configured.

## 🔧 **Step-by-Step Fix**

### **1. Create .env file**
Create a file named `.env` in the `backend-admin` folder with this content:

```env
# Database Configuration
MONGODB_URI=mongodb://localhost:27017/booking_system
PORT=5001

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-in-production

# Frontend URL
FRONTEND_URL=http://localhost:3000

# Google Calendar Integration
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
GOOGLE_REDIRECT_URI=http://localhost:5001/api/google-calendar/auth/callback
```

### **2. Get Google Credentials**
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable Google Calendar API
4. Create OAuth 2.0 credentials
5. Copy Client ID and Client Secret to your `.env` file

### **3. Restart Backend**
After creating the `.env` file, restart your backend server:

```bash
cd backend-admin
npm run dev
```

### **4. Test Integration**
1. Go to Admin Portal
2. Click on "📅 Google Calendar" tab
3. Click "Connect Google Calendar"
4. Follow the OAuth flow

## 📋 **Detailed Instructions**

For complete setup instructions, see:
- `GOOGLE_CALENDAR_SETUP.md` - Complete setup guide
- `GOOGLE_CALENDAR_ENV_SETUP.md` - Environment variables guide

## 🆘 **Need Help?**

If you need help setting up Google Cloud credentials, I can guide you through the process step by step.
