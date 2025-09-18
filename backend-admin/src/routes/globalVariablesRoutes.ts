import express from 'express';
import { GlobalVariablesController } from '../controllers/globalVariablesController';

const router = express.Router();

// Get global variables for a specific booking
router.get('/:bookingId', GlobalVariablesController.getGlobalVariables);

// Update global variables for a specific booking
router.put('/:bookingId', GlobalVariablesController.updateGlobalVariables);

// Update a specific variable for a booking
router.patch('/:bookingId/:variableKey', GlobalVariablesController.updateSpecificVariable);

// Get available variable keys and descriptions
router.get('/available/variables', GlobalVariablesController.getAvailableVariables);

// Replace variables in a template
router.post('/replace-variables', GlobalVariablesController.replaceVariablesInTemplate);

// Bulk update global variables for multiple bookings
router.post('/bulk-update', GlobalVariablesController.bulkUpdateGlobalVariables);

export default router; 