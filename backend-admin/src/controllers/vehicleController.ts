import { Request, Response } from 'express';
import { Vehicle } from '../models/Vehicle';
import { VehicleType } from '../models/VehicleType';

// Get all vehicles
export const getAllVehicles = async (req: Request, res: Response) => {
  try {
    const vehicles = await Vehicle.find()
      .populate('vehicleType', 'name category capacity')
      .sort({ licensePlate: 1 });
    res.json({ vehicles });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching vehicles', error: (error as Error).message });
  }
};

// Get all active vehicles
export const getActiveVehicles = async (req: Request, res: Response) => {
  try {
    const vehicles = await Vehicle.find({ isActive: true })
      .populate('vehicleType', 'name category capacity')
      .sort({ licensePlate: 1 });
    res.json({ vehicles });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching active vehicles', error: (error as Error).message });
  }
};

// Get available vehicles
export const getAvailableVehicles = async (req: Request, res: Response) => {
  try {
    const vehicles = await Vehicle.find({ 
      isActive: true,
      isAvailable: true 
    })
      .populate('vehicleType', 'name category capacity')
      .sort({ licensePlate: 1 });
    res.json({ vehicles });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching available vehicles', error: (error as Error).message });
  }
};

// Get vehicles by type
export const getVehiclesByType = async (req: Request, res: Response) => {
  try {
    const { vehicleTypeId } = req.params;
    const vehicles = await Vehicle.find({ 
      vehicleType: vehicleTypeId,
      isActive: true 
    })
      .populate('vehicleType', 'name category capacity')
      .sort({ licensePlate: 1 });
    res.json({ vehicles });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching vehicles by type', error: (error as Error).message });
  }
};

// Get a single vehicle by ID
export const getVehicleById = async (req: Request, res: Response) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id)
      .populate('vehicleType', 'name category capacity');
    
    if (!vehicle) {
      return res.status(404).json({ message: 'Vehicle not found' });
    }
    
    return res.json(vehicle);
  } catch (error) {
    return res.status(500).json({ message: 'Error fetching vehicle', error: (error as Error).message });
  }
};

// Create a new vehicle
export const createVehicle = async (req: Request, res: Response) => {
  try {
    const {
      licensePlate,
      description,
      vehicleType,
      year,
      make,
      modelName,
      color,
      features,
      maxLuggage,
      isActive,
      isAvailable,
      images,
      mainImage,
      notes
    } = req.body;

    // Check if license plate already exists
    const existingVehicle = await Vehicle.findOne({ licensePlate });
    if (existingVehicle) {
      return res.status(400).json({ message: 'Vehicle with this license plate already exists' });
    }

    // Verify vehicle type exists
    const vehicleTypeExists = await VehicleType.findById(vehicleType);
    if (!vehicleTypeExists) {
      return res.status(400).json({ message: 'Vehicle type not found' });
    }

    const vehicle = new Vehicle({
      licensePlate,
      description,
      vehicleType,
      year,
      make,
      modelName,
      color,
      features: features || [],
      maxLuggage,
      isActive: isActive !== undefined ? isActive : true,
      isAvailable: isAvailable !== undefined ? isAvailable : true,
      images: images || [],
      mainImage,
      notes
    });

    const savedVehicle = await vehicle.save();
    const populatedVehicle = await Vehicle.findById(savedVehicle._id)
      .populate('vehicleType', 'name category capacity');

    return res.status(201).json(populatedVehicle);
  } catch (error) {
    return res.status(500).json({ message: 'Error creating vehicle', error: (error as Error).message });
  }
};

// Update a vehicle
export const updateVehicle = async (req: Request, res: Response) => {
  try {
    const {
      licensePlate,
      description,
      vehicleType,
      year,
      make,
      modelName,
      color,
      features,
      maxLuggage,
      isActive,
      isAvailable,
      images,
      mainImage,
      notes
    } = req.body;

    // Check if license plate already exists (excluding current vehicle)
    const existingVehicle = await Vehicle.findOne({ 
      licensePlate, 
      _id: { $ne: req.params.id } 
    });
    if (existingVehicle) {
      return res.status(400).json({ message: 'Vehicle with this license plate already exists' });
    }

    // Verify vehicle type exists if provided
    if (vehicleType) {
      const vehicleTypeExists = await VehicleType.findById(vehicleType);
      if (!vehicleTypeExists) {
        return res.status(400).json({ message: 'Vehicle type not found' });
      }
    }

    const vehicle = await Vehicle.findByIdAndUpdate(
      req.params.id,
      {
        licensePlate,
        description,
        vehicleType,
        year,
        make,
        modelName,
        color,
        features,
        maxLuggage,
        isActive,
        isAvailable,
        images,
        mainImage,
        notes
      },
      { new: true, runValidators: true }
    ).populate('vehicleType', 'name category capacity');

    if (!vehicle) {
      return res.status(404).json({ message: 'Vehicle not found' });
    }

    return res.json(vehicle);
  } catch (error) {
    return res.status(500).json({ message: 'Error updating vehicle', error: (error as Error).message });
  }
};

// Delete a vehicle
export const deleteVehicle = async (req: Request, res: Response) => {
  try {
    const vehicle = await Vehicle.findByIdAndDelete(req.params.id);
    
    if (!vehicle) {
      return res.status(404).json({ message: 'Vehicle not found' });
    }
    
    return res.json({ message: 'Vehicle deleted successfully' });
  } catch (error) {
    return res.status(500).json({ message: 'Error deleting vehicle', error: (error as Error).message });
  }
};

// Update vehicle availability
export const updateVehicleAvailability = async (req: Request, res: Response) => {
  try {
    const { isAvailable } = req.body;

    const vehicle = await Vehicle.findByIdAndUpdate(
      req.params.id,
      { isAvailable },
      { new: true, runValidators: true }
    ).populate('vehicleType', 'name category capacity');

    if (!vehicle) {
      return res.status(404).json({ message: 'Vehicle not found' });
    }

    return res.json(vehicle);
  } catch (error) {
    return res.status(500).json({ message: 'Error updating vehicle availability', error: (error as Error).message });
  }
}; 