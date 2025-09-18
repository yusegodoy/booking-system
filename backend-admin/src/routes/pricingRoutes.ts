import express from 'express';
import { getPricingConfig, updatePricingConfig, calculatePrice } from '../controllers/pricingController';
import { auth } from '../middleware/auth';

const router = express.Router();

// Get pricing configuration (admin only)
router.get('/config', auth, getPricingConfig);

// Update pricing configuration (admin only)
router.post('/config', auth, updatePricingConfig);

// Calculate price (public endpoint)
router.post('/calculate', calculatePrice);

export default router; 