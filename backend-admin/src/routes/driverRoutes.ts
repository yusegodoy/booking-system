import express from 'express';
import {
  driverLogin,
  registerDriver,
  getAllDrivers,
  getDriverById,
  updateDriver,
  deleteDriver,
  updateDriverAvailability,
  getDriverStats,
  getDriverBookings,
  updateDriverDocuments,
  getAvailableDrivers,
  assignVehicleToDriver,
  getDriverProfile,
  getDriverOwnBookings,
  uploadDriverPhoto,
  uploadMiddleware
} from '../controllers/driverController';
import { auth, requireAdmin, requireManager } from '../middleware/auth';

const router = express.Router();

// Driver authentication routes
router.post('/login', driverLogin);

// Driver management routes (Admin/Manager only)
router.post('/register', auth, requireAdmin, registerDriver);
router.get('/', auth, requireManager, getAllDrivers);
router.get('/available', auth, requireManager, getAvailableDrivers);
router.get('/:id', auth, requireManager, getDriverById);
router.put('/:id', auth, requireManager, updateDriver);
router.delete('/:id', auth, requireAdmin, deleteDriver);

// Driver specific routes
router.put('/:id/availability', auth, requireManager, updateDriverAvailability);
router.get('/:id/stats', auth, requireManager, getDriverStats);
router.get('/:id/bookings', auth, requireManager, getDriverBookings);
router.put('/:id/documents', auth, requireManager, updateDriverDocuments);
router.put('/:id/assign-vehicle', auth, requireManager, assignVehicleToDriver);
router.post('/:id/photo', auth, requireManager, uploadMiddleware, uploadDriverPhoto);

// Driver dashboard routes
router.get('/profile/:driverId', getDriverProfile);
router.get('/bookings/:driverId', getDriverOwnBookings);

export default router; 