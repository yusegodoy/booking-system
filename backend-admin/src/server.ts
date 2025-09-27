import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import path from 'path';
import { connectDB } from './config/database';
import { emailService } from './services/emailService';
import { resendEmailService } from './services/resendEmailService';
import authRoutes from './routes/authRoutes';
import bookingRoutes from './routes/bookingRoutes';
import userRoutes from './routes/userRoutes';
import customerRoutes from './routes/customerRoutes';
import pricingRoutes from './routes/pricingRoutes';
import vehicleTypeRoutes from './routes/vehicleTypeRoutes';
import vehicleRoutes from './routes/vehicleRoutes';
import areaRoutes from './routes/areaRoutes';
import vehicleAreaPriceRoutes from './routes/vehicleAreaPriceRoutes';
import uploadRoutes from './routes/uploadRoutes';
import globalVariablesRoutes from './routes/globalVariablesRoutes';
import driverRoutes from './routes/driverRoutes';
import googleCalendarRoutes from './routes/googleCalendarRoutes';
import emailRoutes from './routes/emailRoutes';
import serviceAgreementRoutes from './routes/serviceAgreementRoutes';
import companyInfoRoutes from './routes/companyInfoRoutes';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

// Connect to database
connectDB();

// Middleware
app.use(helmet());
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl)
    if (!origin) return callback(null, true);

    try {
      const url = new URL(origin);
      const host = url.hostname;
      const port = url.port;

      // Allow localhost and 127.0.0.1 on port 3000
      if ((host === 'localhost' || host === '127.0.0.1') && port === '3000') {
        return callback(null, true);
      }

      // Allow any IP address on port 3000 (for LAN access)
      if (port === '3000') {
        // Check if it's a valid IP address
        const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
        if (ipRegex.test(host)) {
          return callback(null, true);
        }
      }

      // Allow explicit FRONTEND_URL if provided
      if (process.env.FRONTEND_URL && origin === process.env.FRONTEND_URL) {
        return callback(null, true);
      }

      // Allow production domain
      if (host === 'booking.airportshuttletpa.com') {
        return callback(null, true);
      }

      console.log(`CORS blocked origin: ${origin} (host: ${host}, port: ${port})`);
      return callback(new Error('Not allowed by CORS'));
    } catch (error) {
      console.log(`CORS error parsing origin: ${origin}`, error);
      return callback(new Error('Invalid Origin'));
    }
  },
  credentials: true
}));
app.use(morgan('combined'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/users', userRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/pricing', pricingRoutes);
app.use('/api/vehicle-types', vehicleTypeRoutes);
app.use('/api/vehicles', vehicleRoutes);
app.use('/api/areas', areaRoutes);
app.use('/api/vehicle-area-prices', vehicleAreaPriceRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/global-variables', globalVariablesRoutes);
app.use('/api/drivers', driverRoutes);
app.use('/api/google-calendar', googleCalendarRoutes);
app.use('/api/email', emailRoutes);
app.use('/api/service-agreement', serviceAgreementRoutes);
app.use('/api/company-info', companyInfoRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

app.listen(PORT, async () => {
  console.log(`Admin backend server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  
  // Initialize email services
  try {
    await emailService.initialize();
  } catch (error) {
    console.log('Email service initialization failed:', error);
  }

  try {
    await resendEmailService.initialize();
  } catch (error) {
    console.log('Resend email service initialization failed:', error);
  }
}); 