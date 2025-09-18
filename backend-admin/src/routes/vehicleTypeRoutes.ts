import express from 'express';
import {
  getAllVehicleTypes,
  getAllVehicleTypesAdmin,
  getVehicleTypeById,
  getVehicleTypesByCategory,
  getAvailableVehicleTypes,
  createVehicleType,
  updateVehicleType,
  updateVehicleAvailability,
  deleteVehicleType,
  addVehicleRating,
  getVehicleRatings,
  addAreaPricing,
  updateAreaPricing,
  deleteAreaPricing,
  calculateVehiclePrice
} from '../controllers/vehicleTypeController';
import { auth } from '../middleware/auth';

const router = express.Router();

// Public routes
router.get('/', getAllVehicleTypes);
router.get('/available', getAvailableVehicleTypes);
router.get('/category/:category', getVehicleTypesByCategory);
router.get('/:id/ratings', getVehicleRatings);
router.post('/calculate', calculateVehiclePrice);

// Admin routes (require authentication)
router.get('/admin', auth, getAllVehicleTypesAdmin);
router.get('/:id', auth, getVehicleTypeById);
router.post('/', auth, createVehicleType);
router.put('/:id', auth, updateVehicleType);
router.put('/:id/availability', auth, updateVehicleAvailability);
router.delete('/:id', auth, deleteVehicleType);

// Rating routes
router.post('/:id/ratings', auth, addVehicleRating);

// Area pricing routes
router.post('/:id/area-pricing', auth, addAreaPricing);
router.put('/:vehicleTypeId/area-pricing/:areaPricingId', auth, updateAreaPricing);
router.delete('/:vehicleTypeId/area-pricing/:areaPricingId', auth, deleteAreaPricing);

export default router; 