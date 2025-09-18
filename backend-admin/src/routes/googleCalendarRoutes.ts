import express from 'express';
import { auth } from '../middleware/auth';
import {
  getConfig,
  updateConfig,
  getAuthUrl,
  handleAuthCallback,
  testConnection,
  getAvailableCalendars,
  syncAllBookings,
  syncSingleBooking,
  disconnect
} from '../controllers/googleCalendarController';

const router = express.Router();

// Authentication routes (no require auth - called by Google)
router.get('/auth/url', auth, getAuthUrl);
router.get('/auth/callback', handleAuthCallback); // No auth required for Google callback

// All other routes require authentication
router.use(auth);

// Configuration routes
router.get('/config', getConfig);
router.put('/config', updateConfig);

// Connection and testing routes
router.post('/test-connection', testConnection);
router.get('/calendars', getAvailableCalendars);

// Sync routes
router.post('/sync/all', syncAllBookings);
router.post('/sync/booking/:bookingId', syncSingleBooking);

// Disconnect route
router.post('/disconnect', disconnect);

export default router;
