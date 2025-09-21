import express from 'express';
import {
  getAllBookings,
  getBookingById,
  updateBookingStatus,
  updateBooking,
  deleteBooking,
  getDeletedBookings,
  restoreBooking,
  permanentlyDeleteBooking,
  getBookingStats,
  createBooking,
  getNextConfirmationNumber
} from '../controllers/bookingController';
import { auth } from '../middleware/auth';
import { validateBookingId, validateBookingStatus, validatePagination } from '../middleware/validation';

const router = express.Router();

// Public routes (no authentication required)
// Get next available confirmation number
router.get('/next-confirmation-number', getNextConfirmationNumber);

// Crear una nueva reserva (public endpoint for customers)
router.post('/', createBooking);

// All other routes require authentication
router.use(auth);

// Get all bookings with pagination and filtering
router.get('/', validatePagination, getAllBookings);

// Get booking statistics
router.get('/stats', getBookingStats);

// Get deleted bookings (trash)
router.get('/trash/list', getDeletedBookings);

// Restore a deleted booking
router.patch('/trash/:id/restore', validateBookingId, restoreBooking);

// Permanently delete a booking (from trash)
router.delete('/trash/:id', validateBookingId, permanentlyDeleteBooking);

// Get a single booking by ID
router.get('/:id', validateBookingId, getBookingById);

// Update booking status
router.patch('/:id/status', validateBookingId, validateBookingStatus, updateBookingStatus);

// Update booking status (alternative endpoint for admin portal)
router.patch('/:id', validateBookingId, updateBookingStatus);

// Update booking details
router.put('/:id', validateBookingId, updateBooking);

// Delete a booking (move to trash)
router.delete('/:id', validateBookingId, deleteBooking);

export default router; 