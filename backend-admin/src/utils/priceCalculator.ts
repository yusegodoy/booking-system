import { IVehicleType } from '../models/VehicleType';
import Area from '../models/Area';

interface Location {
  lat: number;
  lng: number;
  address?: string;
  zipcode?: string;
  city?: string;
}

interface PriceCalculationResult {
  basePrice: number;
  distancePrice: number;
  totalPrice: number;
  distance: number;
  areaDiscount?: number;
  areaName?: string;
  surgeMultiplier?: number;
  surgeName?: string;
  pricingMethod: 'fixed' | 'distance';
}

// Function to calculate distance between two points using Haversine formula
function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 3959; // Earth's radius in miles
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

// Function to check if a location is within an area
async function isLocationInArea(location: Location, area: any): Promise<boolean> {
  switch (area.type) {
    case 'city':
      return location.city?.toLowerCase() === area.value.toLowerCase();
    
    case 'zipcode':
      return location.zipcode === area.value;
    
    case 'polygon':
      if (!area.polygon || area.polygon.length < 3) return false;
      return isPointInPolygon(location.lat, location.lng, area.polygon);
    
    default:
      return false;
  }
}

// Function to check if a point is inside a polygon (ray casting algorithm)
function isPointInPolygon(lat: number, lng: number, polygon: Array<{lat: number, lng: number}>): boolean {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].lng;
    const yi = polygon[i].lat;
    const xj = polygon[j].lng;
    const yj = polygon[j].lat;
    
    if (((yi > lat) !== (yj > lat)) && (lng < (xj - xi) * (lat - yi) / (yj - yi) + xi)) {
      inside = !inside;
    }
  }
  return inside;
}

// Main function to calculate prices
// RULE: When pickup or dropoff points are in multiple areas, the HIGHEST PRICE is used
export async function calculatePrice(
  vehicleType: IVehicleType,
  pickup: Location,
  dropoff: Location,
  options: {
    stops?: Location[];
    childSeats?: number;
    roundTrip?: boolean;
    pickupDateTime?: Date; // For surge pricing
    providedMiles?: number; // Miles provided by frontend when coordinates are not available
  } = {}
): Promise<PriceCalculationResult> {
  const { stops = [], childSeats = 0, roundTrip = false, pickupDateTime = new Date(), providedMiles } = options;
  
  // Calculate total distance
  let totalDistance = 0;
  
  // If coordinates are 0 or not available, use provided miles
  if ((pickup.lat === 0 && pickup.lng === 0) || (dropoff.lat === 0 && dropoff.lng === 0)) {
    if (providedMiles && providedMiles > 0) {
      totalDistance = providedMiles;
      console.log('Using provided miles for distance calculation:', providedMiles);
    } else {
      console.log('No valid coordinates or miles provided, using 0 distance');
      totalDistance = 0;
    }
  } else {
    // Calculate distance from coordinates
    totalDistance = calculateDistance(pickup.lat, pickup.lng, dropoff.lat, dropoff.lng);
    console.log('Calculated distance from coordinates:', totalDistance);
  }
  
  // Add distance for additional stops
  let currentLocation = pickup;
  for (const stop of stops) {
    totalDistance += calculateDistance(currentLocation.lat, currentLocation.lng, stop.lat, stop.lng);
    currentLocation = stop;
  }
  if (stops.length > 0) {
    totalDistance += calculateDistance(currentLocation.lat, currentLocation.lng, dropoff.lat, dropoff.lng);
  }

  // Check if there are fixed prices by area
  if (vehicleType.areaPrices && vehicleType.areaPrices.length > 0) {
    // Find areas that match pickup or dropoff
    const matchingAreas = [];
    
    for (const areaPrice of vehicleType.areaPrices) {
      const area = await Area.findById(areaPrice.area);
      if (!area) continue;
      
      const pickupInArea = await isLocationInArea(pickup, area);
      const dropoffInArea = await isLocationInArea(dropoff, area);
      
      if (pickupInArea || dropoffInArea) {
        matchingAreas.push({
          area,
          fixedPrice: areaPrice.fixedPrice,
          pickupInArea,
          dropoffInArea
        });
      }
    }
    
    // If there are matching areas, use the HIGHEST PRICE (new rule)
    if (matchingAreas.length > 0) {
      // Sort by price in descending order (highest first)
      matchingAreas.sort((a, b) => b.fixedPrice - a.fixedPrice);
      const highestPriceArea = matchingAreas[0];
      
      let totalPrice = highestPriceArea.fixedPrice;
      
      // Add additional charges
      if (stops.length > 0) {
        totalPrice += vehicleType.stopCharge * stops.length;
      }
      
      if (childSeats > 0) {
        totalPrice += vehicleType.childSeatCharge * childSeats;
      }
      
      if (roundTrip) {
        totalPrice = totalPrice * (1 - vehicleType.roundTripDiscount / 100);
      }
      
      // Create area name showing all matching areas
      const matchingAreaNames = matchingAreas.map(ma => ma.area.name).join(', ');
      
      return {
        basePrice: highestPriceArea.fixedPrice,
        distancePrice: 0,
        totalPrice,
        distance: totalDistance,
        areaName: matchingAreas.length > 1 ? 
          `Multiple areas: ${matchingAreaNames} (using highest: $${highestPriceArea.fixedPrice})` : 
          highestPriceArea.area.name,
        pricingMethod: 'fixed'
      };
    }
  }

  // If no fixed prices by area, use distance-based calculation with base threshold and tiers
  let basePrice = vehicleType.basePrice;
  let distancePrice = 0;
  const baseThreshold = vehicleType.baseDistanceThreshold || 12;

  console.log('=== DISTANCE CALCULATION DEBUG ===');
  console.log('Base price:', basePrice);
  console.log('Base distance threshold:', baseThreshold, 'miles');
  console.log('Total distance:', totalDistance, 'miles');
  console.log('Vehicle type distanceTiers:', vehicleType.distanceTiers);

  // Check if distance is within base threshold
  if (totalDistance <= baseThreshold) {
    console.log(`Distance (${totalDistance} miles) is within base threshold (${baseThreshold} miles)`);
    console.log(`Price: Base price only = $${basePrice}`);
    distancePrice = 0; // No additional distance charge
  } else {
    // Calculate additional distance beyond base threshold
    const additionalDistance = totalDistance - baseThreshold;
    console.log(`Distance (${totalDistance} miles) exceeds base threshold (${baseThreshold} miles)`);
    console.log(`Additional distance to charge: ${additionalDistance} miles`);

    if (vehicleType.distanceTiers && vehicleType.distanceTiers.length > 0) {
      console.log('Using configured distance tiers for additional distance');
      // Sort tiers by fromMiles to ensure proper order
      const sortedTiers = [...vehicleType.distanceTiers].sort((a, b) => a.fromMiles - b.fromMiles);
      console.log('Sorted tiers:', sortedTiers);
      
      // Calculate price for additional distance using tiers
      let remainingAdditionalDistance = additionalDistance;
      
      for (const tier of sortedTiers) {
        // Adjust tier range to account for base threshold
        const adjustedTierStart = tier.fromMiles + baseThreshold;
        const adjustedTierEnd = tier.toMiles === 0 ? Infinity : tier.toMiles + baseThreshold;
        
        console.log(`Checking tier: ${adjustedTierStart}-${adjustedTierEnd === Infinity ? '∞' : adjustedTierEnd} miles (${tier.fromMiles}-${tier.toMiles === 0 ? '∞' : tier.toMiles} additional miles) at $${tier.pricePerMile}/mile`);
        
        if (remainingAdditionalDistance <= 0) break;
        
        // Calculate how many miles fall into this tier
        const tierStart = tier.fromMiles;
        const tierEnd = tier.toMiles === 0 ? Infinity : tier.toMiles;
        
        // Calculate the actual distance that falls into this tier
        const distanceInThisTier = Math.max(0, Math.min(remainingAdditionalDistance, tierEnd - tierStart));
        
        if (distanceInThisTier > 0) {
          const tierPrice = distanceInThisTier * tier.pricePerMile;
          distancePrice += tierPrice;
          console.log(`Tier applied! Distance in tier: ${distanceInThisTier}, Price: ${tierPrice}`);
          remainingAdditionalDistance -= distanceInThisTier;
        }
        
        // If this tier has no upper limit (toMiles = 0), apply it to all remaining distance
        if (tier.toMiles === 0 && remainingAdditionalDistance > 0) {
          const unlimitedTierPrice = remainingAdditionalDistance * tier.pricePerMile;
          distancePrice += unlimitedTierPrice;
          console.log(`Unlimited tier applied! Remaining distance: ${remainingAdditionalDistance}, Price: ${unlimitedTierPrice}`);
          remainingAdditionalDistance = 0;
        }
      }
    } else {
      console.log('No distance tiers configured, using fallback calculation for additional distance');
      // Fallback: charge $1 per mile for additional distance
      distancePrice = additionalDistance * 1;
      console.log(`Fallback: ${additionalDistance} additional miles * $1 = $${distancePrice}`);
    }
  }
  
  console.log('Final distance price calculated:', distancePrice);

  let totalPrice = basePrice + distancePrice;

  // Apply surge pricing if applicable
  let surgeMultiplier = 1;
  let surgeName = '';
  
  if (vehicleType.surgePricing && vehicleType.surgePricing.length > 0) {
    const applicableSurges = [];
    
    for (const surge of vehicleType.surgePricing) {
      if (!surge.isActive) continue;
      
      let isApplicable = true;
      
      // Check days of week
      if (surge.daysOfWeek && surge.daysOfWeek.length > 0) {
        const dayOfWeek = pickupDateTime.getDay();
        if (!surge.daysOfWeek.includes(dayOfWeek)) {
          isApplicable = false;
        }
      }
      
      // Check time range
      if (surge.startTime && surge.endTime) {
        const currentTime = pickupDateTime.toTimeString().substring(0, 5); // HH:MM
        if (currentTime < surge.startTime || currentTime > surge.endTime) {
          isApplicable = false;
        }
      }
      
      // Check date range
      if (surge.startDate && surge.endDate) {
        const currentDate = pickupDateTime.toISOString().split('T')[0];
        const startDate = new Date(surge.startDate).toISOString().split('T')[0];
        const endDate = new Date(surge.endDate).toISOString().split('T')[0];
        if (currentDate < startDate || currentDate > endDate) {
          isApplicable = false;
        }
      }
      
      // Check specific dates
      if (surge.specificDates && surge.specificDates.length > 0) {
        const currentDate = pickupDateTime.toISOString().split('T')[0];
        const hasSpecificDate = surge.specificDates.some(date => 
          new Date(date).toISOString().split('T')[0] === currentDate
        );
        if (!hasSpecificDate) {
          isApplicable = false;
        }
      }
      
      if (isApplicable) {
        applicableSurges.push(surge);
      }
    }
    
    // Use the surge with highest priority
    if (applicableSurges.length > 0) {
      applicableSurges.sort((a, b) => b.priority - a.priority);
      const highestSurge = applicableSurges[0];
      surgeMultiplier = highestSurge.multiplier;
      surgeName = highestSurge.name;
    }
  }

  // Apply surge multiplier
  totalPrice = totalPrice * surgeMultiplier;

  // Add additional charges
  if (stops.length > 0) {
    totalPrice += vehicleType.stopCharge * stops.length;
  }

  if (childSeats > 0) {
    totalPrice += vehicleType.childSeatCharge * childSeats;
  }

  // NOTE: Do NOT apply roundTrip discount here
  // The roundTrip discount should be applied only to the return trip
  // The outbound trip price should remain at full price
  // This is handled in pricingController.ts

  return {
    basePrice,
    distancePrice,
    totalPrice,
    distance: totalDistance,
    surgeMultiplier: surgeMultiplier > 1 ? surgeMultiplier : undefined,
    surgeName: surgeName || undefined,
    pricingMethod: 'distance'
  };
}

// Function to get all available areas
export async function getAvailableAreas(): Promise<any[]> {
  return await Area.find().sort({ name: 1 });
}

// Function to check if a location is in any area with fixed price
export async function checkLocationInPricedAreas(
  location: Location,
  vehicleType: IVehicleType
): Promise<{ area: any; fixedPrice: number } | null> {
  if (!vehicleType.areaPrices || vehicleType.areaPrices.length === 0) {
    return null;
  }

  const matchingAreas = [];

  for (const areaPrice of vehicleType.areaPrices) {
    const area = await Area.findById(areaPrice.area);
    if (!area) continue;

    const isInArea = await isLocationInArea(location, area);
    if (isInArea) {
      matchingAreas.push({ area, fixedPrice: areaPrice.fixedPrice });
    }
  }

  // Return the area with the highest price (new rule)
  if (matchingAreas.length > 0) {
    matchingAreas.sort((a, b) => b.fixedPrice - a.fixedPrice);
    return matchingAreas[0];
  }

  return null;
} 