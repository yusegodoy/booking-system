import express from 'express';
import { VehicleType } from '../models/VehicleType';
import Area from '../models/Area';

const router = express.Router();

// Get area prices for a vehicle
router.get('/:vehicleId/area-prices', async (req, res) => {
  try {
    const { vehicleId } = req.params;
    const vehicle = await VehicleType.findById(vehicleId).populate('areaPrices.area');
    if (!vehicle) {
      return res.status(404).json({ error: 'Vehicle not found' });
    }
    return res.json(vehicle.areaPrices);
  } catch (error) {
    console.error('Error fetching vehicle area prices:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Assign or update fixed prices for areas for a vehicle
router.put('/:vehicleId/area-prices', async (req, res) => {
  try {
    const { areaPrices } = req.body;
    const { vehicleId } = req.params;

    // Validate that the vehicle exists
    const vehicle = await VehicleType.findById(vehicleId);
    if (!vehicle) {
      return res.status(404).json({ error: 'Vehicle not found' });
    }

    // Validate that all areas exist
    for (const areaPrice of areaPrices) {
      const area = await Area.findById(areaPrice.area);
      if (!area) {
        return res.status(404).json({ error: `Area ${areaPrice.area} not found` });
      }
    }

    // Update or add area prices without replacing existing ones
    for (const newAreaPrice of areaPrices) {
      const existingIndex = vehicle.areaPrices.findIndex(
        ap => ap.area.toString() === newAreaPrice.area
      );
      
      if (existingIndex >= 0) {
        // Update existing area price
        vehicle.areaPrices[existingIndex].fixedPrice = newAreaPrice.fixedPrice;
      } else {
        // Add new area price
        vehicle.areaPrices.push(newAreaPrice);
      }
    }

    await vehicle.save();

    // Return updated vehicle with populated areas
    const updatedVehicle = await VehicleType.findById(vehicleId).populate('areaPrices.area');
    return res.json(updatedVehicle);
  } catch (error) {
    console.error('Error updating vehicle area prices:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete a specific area price for a vehicle
router.delete('/:vehicleId/area-prices/:areaId', async (req, res) => {
  try {
    const { vehicleId, areaId } = req.params;
    
    const vehicle = await VehicleType.findById(vehicleId);
    if (!vehicle) {
      return res.status(404).json({ error: 'Vehicle not found' });
    }

    vehicle.areaPrices = vehicle.areaPrices.filter(
      ap => ap.area.toString() !== areaId
    );
    await vehicle.save();

    return res.json({ success: true });
  } catch (error) {
    console.error('Error deleting vehicle area price:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router; 