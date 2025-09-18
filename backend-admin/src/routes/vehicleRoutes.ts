import express from 'express';
import {
  getAllVehicles,
  getActiveVehicles,
  getAvailableVehicles,
  getVehiclesByType,
  getVehicleById,
  createVehicle,
  updateVehicle,
  deleteVehicle,
  updateVehicleAvailability
} from '../controllers/vehicleController';
import { auth } from '../middleware/auth';

const router = express.Router();

// Public routes (for frontend)
router.get('/', getActiveVehicles);
router.get('/available', getAvailableVehicles);
router.get('/type/:vehicleTypeId', getVehiclesByType);
router.get('/:id', getVehicleById);

// Protected routes (admin only)
router.get('/admin/all', auth, getAllVehicles);
router.post('/', auth, createVehicle);
router.put('/:id', auth, updateVehicle);
router.delete('/:id', auth, deleteVehicle);
router.patch('/:id/availability', auth, updateVehicleAvailability);

export default router; 