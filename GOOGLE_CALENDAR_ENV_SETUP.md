# 🔧 Google Calendar Environment Variables Setup

## 📝 Required Environment Variables

Add these variables to your `backend-admin/.env` file:

```env
# Google Calendar Integration
GOOGLE_CLIENT_ID=YOUR_GOOGLE_CLIENT_ID_HERE
GOOGLE_CLIENT_SECRET=YOUR_GOOGLE_CLIENT_SECRET_HERE
GOOGLE_REDIRECT_URI=http://localhost:5001/api/google-calendar/auth/callback
```

## 🚀 Production Environment Variables

For production deployment, update the redirect URI:

```env
GOOGLE_REDIRECT_URI=https://yourdomain.com/api/google-calendar/auth/callback
```

## 📋 Complete .env Example

```env
# Database Configuration
MONGODB_URI=mongodb://localhost:27017/booking_system
PORT=5001

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-in-production

# Frontend URL
FRONTEND_URL=http://localhost:3000

# Google Calendar Integration
GOOGLE_CLIENT_ID=YOUR_GOOGLE_CLIENT_ID_HERE
GOOGLE_CLIENT_SECRET=YOUR_GOOGLE_CLIENT_SECRET_HERE
GOOGLE_REDIRECT_URI=http://localhost:5001/api/google-calendar/auth/callback

# Email Configuration (if using email features)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=YOUR_EMAIL_PASSWORD_HERE
```

## ⚠️ Important Notes

1. **Never commit your `.env` file** to version control
2. **Keep your Google credentials secure**
3. **Use different credentials for development and production**
4. **Update redirect URIs** when deploying to production

## 🔍 How to Get Google Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable Google Calendar API
4. Create OAuth 2.0 credentials
5. Copy Client ID and Client Secret to your `.env` file

See `GOOGLE_CALENDAR_SETUP.md` for detailed setup instructions.
