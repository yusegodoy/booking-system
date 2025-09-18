import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { VehicleType, IAreaPricing } from '../models/VehicleType';

// Extend Request interface to include user property
interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

// Get all vehicle types
export const getAllVehicleTypes = async (req: Request, res: Response) => {
  try {
    const vehicleTypes = await VehicleType.find({ isActive: true }).sort({ name: 1 });
    res.json(vehicleTypes);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching vehicle types', error: (error as Error).message });
  }
};

// Get all vehicle types (admin - includes inactive)
export const getAllVehicleTypesAdmin = async (req: Request, res: Response) => {
  try {
    const vehicleTypes = await VehicleType.find().sort({ name: 1 });
    res.json(vehicleTypes);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching vehicle types', error: (error as Error).message });
  }
};

// Get vehicle types by category
export const getVehicleTypesByCategory = async (req: Request, res: Response) => {
  try {
    const { category } = req.params;
    const vehicleTypes = await VehicleType.find({ 
      category, 
      isActive: true,
      isAvailable: true 
    }).sort({ name: 1 });
    res.json(vehicleTypes);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching vehicle types by category', error: (error as Error).message });
  }
};

// Get available vehicle types
export const getAvailableVehicleTypes = async (req: Request, res: Response) => {
  try {
    const vehicleTypes = await VehicleType.find({ 
      isActive: true,
      isAvailable: true,
      availableVehicles: { $gt: 0 }
    }).sort({ name: 1 });
    res.json(vehicleTypes);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching available vehicle types', error: (error as Error).message });
  }
};

// Get a single vehicle type by ID
export const getVehicleTypeById = async (req: Request, res: Response) => {
  try {
    const vehicleType = await VehicleType.findById(req.params.id);
    
    if (!vehicleType) {
      return res.status(404).json({ message: 'Vehicle type not found' });
    }
    
    return res.json(vehicleType);
  } catch (error) {
    return res.status(500).json({ message: 'Error fetching vehicle type', error: (error as Error).message });
  }
};

// Create a new vehicle type
export const createVehicleType = async (req: Request, res: Response) => {
  try {
    const {
      name,
      description,
      category,
      capacity,
      totalVehicles,
      availableVehicles,
      isAvailable,
      basePrice,
      distanceTiers,
      stopCharge,
      childSeatCharge,
      roundTripDiscount,
      surgePricing,
      areaPricing,
      areaPrices,
      specifications,
      operatingHours,
      images,
      mainImage
    } = req.body;

    // Validate required fields
    if (!name || !description || !capacity) {
      res.status(400).json({ message: 'Name, description, and capacity are required' });
      return;
    }

    // Check if vehicle type already exists
    const existingVehicleType = await VehicleType.findOne({ name });
    if (existingVehicleType) {
      res.status(400).json({ message: 'Vehicle type with this name already exists' });
      return;
    }

    const vehicleType = new VehicleType({
      name,
      description,
      category: category || 'standard',
      capacity,
      totalVehicles: totalVehicles || 1,
      availableVehicles: availableVehicles || totalVehicles || 1,
      isAvailable: isAvailable !== undefined ? isAvailable : true,
      basePrice: basePrice || 55,
      distanceTiers: distanceTiers || [],
      stopCharge: stopCharge || 5,
      childSeatCharge: childSeatCharge || 5,
      roundTripDiscount: roundTripDiscount || 10,
      surgePricing: surgePricing || [],
      areaPricing: areaPricing || [],
      areaPrices: areaPrices || [],
      specifications: specifications || {},
      operatingHours: operatingHours || [],
      images: images || [],
      mainImage,
      ratings: [],
      averageRating: 0,
      totalRatings: 0
    });

    await vehicleType.save();
    res.status(201).json(vehicleType);
    return;
  } catch (error) {
    res.status(400).json({ message: 'Error creating vehicle type', error: (error as Error).message });
    return;
  }
};

// Update vehicle type
export const updateVehicleType = async (req: Request, res: Response) => {
  try {
    const {
      name,
      description,
      category,
      capacity,
      isActive,
      totalVehicles,
      availableVehicles,
      isAvailable,
      basePrice,
      distanceTiers,
      stopCharge,
      childSeatCharge,
      roundTripDiscount,
      surgePricing,
      areaPricing,
      areaPrices,
      specifications,
      operatingHours,
      images,
      mainImage
    } = req.body;

    const vehicleType = await VehicleType.findByIdAndUpdate(
      req.params.id,
      {
        name,
        description,
        category,
        capacity,
        isActive,
        totalVehicles,
        availableVehicles,
        isAvailable,
        basePrice,
        distanceTiers,
        stopCharge,
        childSeatCharge,
        roundTripDiscount,
        surgePricing,
        areaPricing,
        areaPrices,
        specifications,
        operatingHours,
        images,
        mainImage
      },
      { new: true, runValidators: true }
    );

    if (!vehicleType) {
      return res.status(404).json({ message: 'Vehicle type not found' });
    }

    return res.json(vehicleType);
  } catch (error) {
    return res.status(500).json({ message: 'Error updating vehicle type', error: (error as Error).message });
  }
};

// Update vehicle availability
export const updateVehicleAvailability = async (req: Request, res: Response) => {
  try {
    const { totalVehicles, availableVehicles, isAvailable } = req.body;

    const vehicleType = await VehicleType.findByIdAndUpdate(
      req.params.id,
      {
        totalVehicles,
        availableVehicles,
        isAvailable
      },
      { new: true, runValidators: true }
    );

    if (!vehicleType) {
      return res.status(404).json({ message: 'Vehicle type not found' });
    }

    return res.json(vehicleType);
  } catch (error) {
    return res.status(500).json({ message: 'Error updating vehicle availability', error: (error as Error).message });
  }
};

// Add vehicle rating
export const addVehicleRating = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { rating, comment } = req.body;
    const userId = req.user?.id; // Assuming user is authenticated

    if (!userId) {
      return res.status(401).json({ message: 'User authentication required' });
    }

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Rating must be between 1 and 5' });
    }

    const vehicleType = await VehicleType.findById(req.params.id);
    if (!vehicleType) {
      return res.status(404).json({ message: 'Vehicle type not found' });
    }

    // Check if user already rated this vehicle
    const existingRating = vehicleType.ratings.find(r => r.userId.toString() === userId);
    if (existingRating) {
      return res.status(400).json({ message: 'User has already rated this vehicle type' });
    }

    vehicleType.ratings.push({
      userId: new mongoose.Types.ObjectId(userId),
      rating,
      comment,
      createdAt: new Date()
    });

    await vehicleType.save();
    return res.json(vehicleType);
  } catch (error) {
    return res.status(500).json({ message: 'Error adding vehicle rating', error: (error as Error).message });
  }
};

// Get vehicle ratings
export const getVehicleRatings = async (req: Request, res: Response) => {
  try {
    const vehicleType = await VehicleType.findById(req.params.id).populate('ratings.userId', 'firstName lastName');
    
    if (!vehicleType) {
      return res.status(404).json({ message: 'Vehicle type not found' });
    }

    return res.json({
      ratings: vehicleType.ratings,
      averageRating: vehicleType.averageRating,
      totalRatings: vehicleType.totalRatings
    });
  } catch (error) {
    return res.status(500).json({ message: 'Error fetching vehicle ratings', error: (error as Error).message });
  }
};

// Delete vehicle type
export const deleteVehicleType = async (req: Request, res: Response) => {
  try {
    const vehicleType = await VehicleType.findByIdAndDelete(req.params.id);
    
    if (!vehicleType) {
      return res.status(404).json({ message: 'Vehicle type not found' });
    }
    
    return res.json({ message: 'Vehicle type deleted successfully' });
  } catch (error) {
    return res.status(500).json({ message: 'Error deleting vehicle type', error: (error as Error).message });
  }
};

// Add area pricing to vehicle type
export const addAreaPricing = async (req: Request, res: Response) => {
  try {
    const {
      name,
      type,
      value,
      coordinates,
      basePrice,
      pricePerMile,
      priority
    } = req.body;

    // Validate required fields
    if (!name || !type || !value || basePrice === undefined || pricePerMile === undefined) {
      res.status(400).json({ message: 'Name, type, value, basePrice, and pricePerMile are required' });
      return;
    }

    const vehicleType = await VehicleType.findById(req.params.id);
    if (!vehicleType) {
      res.status(404).json({ message: 'Vehicle type not found' });
      return;
    }

    const newAreaPricing: IAreaPricing = {
      name,
      type,
      value,
      coordinates,
      basePrice,
      pricePerMile,
      priority: priority || 1
    };

    vehicleType.areaPricing.push(newAreaPricing);
    await vehicleType.save();

    res.json(vehicleType);
    return;
  } catch (error) {
    res.status(400).json({ message: 'Error adding area pricing', error: (error as Error).message });
    return;
  }
};

// Update area pricing
export const updateAreaPricing = async (req: Request, res: Response) => {
  try {
    const { vehicleTypeId, areaPricingId } = req.params;
    const updateData = req.body;

    const vehicleType = await VehicleType.findById(vehicleTypeId);
    if (!vehicleType) {
      res.status(404).json({ message: 'Vehicle type not found' });
      return;
    }

    // Buscar el área por _id usando .find
    const areaPricing = vehicleType.areaPricing.find((area: any) => area._id?.toString() === areaPricingId);
    if (!areaPricing) {
      res.status(404).json({ message: 'Area pricing not found' });
      return;
    }

    Object.assign(areaPricing, updateData);
    await vehicleType.save();

    res.json(vehicleType);
    return;
  } catch (error) {
    res.status(400).json({ message: 'Error updating area pricing', error: (error as Error).message });
    return;
  }
};

// Delete area pricing
export const deleteAreaPricing = async (req: Request, res: Response) => {
  try {
    const { vehicleTypeId, areaPricingId } = req.params;

    const vehicleType = await VehicleType.findById(vehicleTypeId);
    if (!vehicleType) {
      res.status(404).json({ message: 'Vehicle type not found' });
      return;
    }

    // Filtrar áreas por _id usando .filter
    vehicleType.areaPricing = vehicleType.areaPricing.filter(
      (area: any) => area._id?.toString() !== areaPricingId
    );
    await vehicleType.save();

    res.json(vehicleType);
    return;
  } catch (error) {
    res.status(400).json({ message: 'Error deleting area pricing', error: (error as Error).message });
    return;
  }
};

// Calculate price for a specific vehicle type
export const calculateVehiclePrice = async (req: Request, res: Response) => {
  try {
    const { vehicleTypeId, miles, stopsCount, childSeatsCount, isRoundTrip, pickupLocation, dropoffLocation } = req.body;

    if (!vehicleTypeId || miles === undefined || stopsCount === undefined || childSeatsCount === undefined) {
      res.status(400).json({ message: 'Missing required parameters' });
      return;
    }

    const vehicleType = await VehicleType.findById(vehicleTypeId);
    if (!vehicleType) {
      res.status(404).json({ message: 'Vehicle type not found' });
      return;
    }

    // Check for area-specific pricing first
    let applicableAreaPricing = null;
    if (pickupLocation || dropoffLocation) {
      // Sort by priority (highest first) and find the first applicable area
      const sortedAreas = vehicleType.areaPricing.sort((a: any, b: any) => (b.priority || 1) - (a.priority || 1));
      
      for (const area of sortedAreas) {
        if (isLocationInArea(pickupLocation, dropoffLocation, area)) {
          applicableAreaPricing = area;
          break;
        }
      }
    }

    let basePrice: number;
    let pricePerMile: number;

    if (applicableAreaPricing) {
      // Use area-specific pricing
      basePrice = applicableAreaPricing.basePrice;
      pricePerMile = applicableAreaPricing.pricePerMile;
    } else {
      // Usar base pricing con distance tiers
      basePrice = vehicleType.basePrice;
      pricePerMile = 0;

      if (Array.isArray(vehicleType.distanceTiers) && vehicleType.distanceTiers.length > 0) {
        // Buscar el tier correspondiente a la distancia
        const tier = vehicleType.distanceTiers.find(
          (t: any) =>
            miles >= t.fromMiles &&
            (t.toMiles === 0 || miles < t.toMiles)
        );
        if (tier) {
          pricePerMile = tier.pricePerMile;
        }
      }
      basePrice = basePrice + pricePerMile * miles;
    }

    // Add additional charges
    const stopsCharge = stopsCount * vehicleType.stopCharge;
    const childSeatsCharge = childSeatsCount * vehicleType.childSeatCharge;
    
    let totalPrice = basePrice + stopsCharge + childSeatsCharge;

    // Apply round trip discount if applicable
    if (isRoundTrip) {
      totalPrice = totalPrice * (1 - vehicleType.roundTripDiscount / 100);
    }

    res.json({
      vehicleType: vehicleType.name,
      basePrice: Math.round(basePrice * 100) / 100,
      stopsCharge,
      childSeatsCharge,
      roundTripDiscount: isRoundTrip ? vehicleType.roundTripDiscount : 0,
      totalPrice: Math.round(totalPrice * 100) / 100,
      appliedAreaPricing: applicableAreaPricing ? applicableAreaPricing.name : null
    });
    return;
  } catch (error) {
    res.status(500).json({ message: 'Error calculating price', error: (error as Error).message });
    return;
  }
};

// Helper function to check if location is in area
const isLocationInArea = (pickupLocation: string, dropoffLocation: string, area: IAreaPricing): boolean => {
  if (area.type === 'zipcode') {
    // Check if pickup or dropoff location contains the zipcode
    return pickupLocation?.includes(area.value) || dropoffLocation?.includes(area.value);
  } else if (area.type === 'city') {
    // Check if pickup or dropoff location contains the city name
    return pickupLocation?.toLowerCase().includes(area.value.toLowerCase()) || 
           dropoffLocation?.toLowerCase().includes(area.value.toLowerCase());
  } else if (area.type === 'custom' && area.coordinates) {
    // For custom areas, you would need to implement geocoding and distance calculation
    // This is a simplified version - in production you'd use a proper geocoding service
    return true; // Placeholder
  }
  return false;
}; 