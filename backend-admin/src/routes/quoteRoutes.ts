import express from 'express';
import { VehicleType } from '../models/VehicleType';
import Area from '../models/Area';
import { calculateRidePrice } from '../utils/pricing';

const router = express.Router();

router.post('/', async (req, res) => {
  try {
    const { pickup, dropoff, vehicleId, distance, pricePerMile } = req.body;
    const vehicle = await VehicleType.findById(vehicleId).populate('areaPrices.area');
    if (!vehicle) {
      return res.status(404).json({ error: 'Vehicle not found' });
    }
    const areas = await Area.find();
    const price = calculateRidePrice(
      pickup, dropoff, vehicle, pricePerMile, distance, areas
    );
    return res.json({ price });
  } catch (error) {
    console.error('Error calculating quote:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router; 