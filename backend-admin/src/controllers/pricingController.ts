import { Request, Response } from 'express';
import { PricingConfig } from '../models/PricingConfig';

// Get pricing configuration
export const getPricingConfig = async (req: Request, res: Response) => {
  try {
    let config = await PricingConfig.findOne();
    
    // If no config exists, create default config
    if (!config) {
      config = new PricingConfig();
      await config.save();
    }
    
    res.json(config);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching pricing configuration', error: (error as Error).message });
  }
};

// Update pricing configuration
export const updatePricingConfig = async (req: Request, res: Response) => {
  try {
    const {
      basePrice,
      shortDistanceThreshold,
      shortDistanceRate,
      longDistanceThreshold,
      longDistanceRate,
      stopCharge,
      childSeatCharge,
      roundTripDiscount
    } = req.body;

    // Validate input
    if (basePrice < 0 || shortDistanceThreshold < 0 || shortDistanceRate < 0 || 
        longDistanceThreshold < 0 || longDistanceRate < 0 || stopCharge < 0 || 
        childSeatCharge < 0 || roundTripDiscount < 0 || roundTripDiscount > 100) {
      res.status(400).json({ message: 'Invalid pricing configuration values' });
      return;
    }

    let config = await PricingConfig.findOne();
    
    if (!config) {
      config = new PricingConfig();
    }

    // Update config
    config.basePrice = basePrice;
    config.shortDistanceThreshold = shortDistanceThreshold;
    config.shortDistanceRate = shortDistanceRate;
    config.longDistanceThreshold = longDistanceThreshold;
    config.longDistanceRate = longDistanceRate;
    config.stopCharge = stopCharge;
    config.childSeatCharge = childSeatCharge;
    config.roundTripDiscount = roundTripDiscount;

    await config.save();
    
    res.json(config);
    return;
  } catch (error) {
    res.status(500).json({ message: 'Error updating pricing configuration', error: (error as Error).message });
    return;
  }
};

// Calculate price based on configuration
export const calculatePrice = async (req: Request, res: Response) => {
  try {
    const { 
      pickup, 
      dropoff, 
      miles, 
      stopsCount, 
      childSeatsCount, 
      isRoundTrip, 
      vehicleTypeId,
      paymentMethod = 'invoice' // Default to invoice if not specified
    } = req.body;

    if (!pickup || !dropoff || miles === undefined || stopsCount === undefined || childSeatsCount === undefined) {
      res.status(400).json({ message: 'Missing required parameters' });
      return;
    }

    // Import the price calculator
    const { calculatePrice: calculatePriceWithAreas } = require('../utils/priceCalculator');
    const { VehicleType } = require('../models/VehicleType');

    // Get vehicle type (default to first available if not specified)
    let vehicleType;
    if (vehicleTypeId) {
      // First try to find by ID
      vehicleType = await VehicleType.findById(vehicleTypeId);
      
      // If not found by ID, try to find by name
      if (!vehicleType) {
        console.log(`Vehicle type not found by ID: ${vehicleTypeId}, trying to find by name`);
        vehicleType = await VehicleType.findOne({ 
          name: vehicleTypeId,
          isActive: true 
        });
      }
    } else {
      vehicleType = await VehicleType.findOne({ isActive: true });
    }

    if (!vehicleType) {
      res.status(404).json({ message: 'No vehicle type found' });
      return;
    }

    // Prepare location objects for the price calculator
    const pickupLocation = {
      lat: pickup.lat || 0,
      lng: pickup.lng || 0,
      address: pickup.address,
      zipcode: pickup.zipcode,
      city: pickup.city
    };

    const dropoffLocation = {
      lat: dropoff.lat || 0,
      lng: dropoff.lng || 0,
      address: dropoff.address,
      zipcode: dropoff.zipcode,
      city: dropoff.city
    };

    console.log('=== BACKEND CALCULATION DEBUG ===');
    console.log('Vehicle type ID received:', vehicleTypeId);
    console.log('Vehicle type ID type:', typeof vehicleTypeId);
    console.log('Miles received from frontend:', miles);
    console.log('Vehicle type found:', vehicleType?.name, vehicleType?._id);
    console.log('Pickup location:', pickupLocation);
    console.log('Dropoff location:', dropoffLocation);
    console.log('Stops count:', stopsCount);
    console.log('Child seats count:', childSeatsCount);
    console.log('Is round trip:', isRoundTrip);
    console.log('Payment method:', paymentMethod);

    // Calculate price using the advanced calculator
    // If coordinates are 0, use the miles provided by frontend
    let calculatedMiles = miles;
    if ((pickupLocation.lat === 0 && pickupLocation.lng === 0) || 
        (dropoffLocation.lat === 0 && dropoffLocation.lng === 0)) {
      console.log('Using miles from frontend because coordinates are 0:', miles);
      calculatedMiles = miles;
    }

    const result = await calculatePriceWithAreas(vehicleType, pickupLocation, dropoffLocation, {
      childSeats: childSeatsCount,
      roundTrip: isRoundTrip,
      pickupDateTime: new Date(),
      providedMiles: calculatedMiles // Pass the miles as an additional parameter
    });

    console.log('=== CALCULATION RESULT ===');
    console.log('Result from calculatePriceWithAreas:', result);

    // Calculate additional charges
    const stopsCharge = stopsCount * vehicleType.stopCharge;
    const childSeatsCharge = childSeatsCount * vehicleType.childSeatCharge;
    
    // Calculate round trip discount
    let roundTripDiscount = 0;
    let returnTripPrice = 0;
    if (isRoundTrip) {
      // For round trips, the return trip gets a 5% discount
      returnTripPrice = result.totalPrice * (1 - vehicleType.roundTripDiscount / 100);
      roundTripDiscount = result.totalPrice - returnTripPrice;
    }

    // Calculate subtotal before payment method discount
    const subtotal = result.totalPrice + stopsCharge + childSeatsCharge + returnTripPrice;

    // Apply payment method discount
    let paymentDiscount = 0;
    let paymentDiscountDescription = '';
    if (paymentMethod === 'cash') {
      // Cash discount: 3.5% + $0.15
      paymentDiscount = subtotal * 0.035 + 0.15;
      paymentDiscountDescription = 'Cash payment discount (3.5% + $0.15)';
    }

    // Calculate final total
    const finalTotal = subtotal - paymentDiscount;

    // Prepare detailed breakdown
    const breakdown = {
      basePrice: Math.round(result.basePrice * 100) / 100,
      distancePrice: Math.round(result.distancePrice * 100) / 100,
      stopsCharge: Math.round(stopsCharge * 100) / 100,
      childSeatsCharge: Math.round(childSeatsCharge * 100) / 100,
      roundTripDiscount: Math.round(roundTripDiscount * 100) / 100,
      returnTripPrice: Math.round(returnTripPrice * 100) / 100,
      subtotal: Math.round(subtotal * 100) / 100,
      paymentDiscount: Math.round(paymentDiscount * 100) / 100,
      finalTotal: Math.round(finalTotal * 100) / 100,
      areaName: result.areaName,
      pricingMethod: result.pricingMethod,
      distance: Math.round(result.distance * 100) / 100,
      surgeMultiplier: result.surgeMultiplier,
      surgeName: result.surgeName,
      paymentMethod,
      paymentDiscountDescription
    };

    console.log('=== FINAL BREAKDOWN ===');
    console.log('Breakdown:', breakdown);

    res.json(breakdown);
    return;
  } catch (error) {
    console.error('Error calculating price:', error);
    res.status(500).json({ message: 'Error calculating price', error: (error as Error).message });
    return;
  }
}; 