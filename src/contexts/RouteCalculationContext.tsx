import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { useGoogleApiOptimization } from '../hooks/useGoogleApiOptimization';

interface RouteInfo {
  distance: string;
  duration: string;
  totalDistanceMeters: number;
  totalDistanceMiles: number;
  totalDurationSeconds: number;
  totalDurationWithStops: number;
  validStopsCount: number;
}

interface RouteCalculationContextType {
  calculateRoute: (pickup: string, dropoff: string, stops: string[]) => Promise<RouteInfo | null>;
  routeInfo: RouteInfo | null;
  isCalculating: boolean;
  clearRouteInfo: () => void;
}

const RouteCalculationContext = createContext<RouteCalculationContextType | undefined>(undefined);

interface RouteCalculationProviderProps {
  children: ReactNode;
}

export const RouteCalculationProvider: React.FC<RouteCalculationProviderProps> = ({ children }) => {
  const { makeApiCall } = useGoogleApiOptimization();
  const [routeInfo, setRouteInfo] = useState<RouteInfo | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);

  const calculateRoute = useCallback(async (pickup: string, dropoff: string, stops: string[]): Promise<RouteInfo | null> => {
    if (!pickup || !dropoff) {
      setRouteInfo(null);
      return null;
    }

    console.log('🔄 Global: Calculating route distance:', { 
      pickup, 
      dropoff, 
      stops,
      validStopsCount: stops.filter(stop => stop.trim() !== '').length 
    });
    setIsCalculating(true);

    try {
      const validStops = stops.filter(stop => stop.trim() !== '');
      const cacheKey = `route:${pickup}:${dropoff}:${validStops.join('|')}`;
      
      const result = await makeApiCall('route', cacheKey, async () => {
        if (!window.google || !window.google.maps) {
          throw new Error('Google Maps API not loaded');
        }
        
        const directionsService = new window.google.maps.DirectionsService();
        
        return new Promise<google.maps.DirectionsResult>((resolve, reject) => {
          const waypoints = validStops.length > 0 ? validStops.map(stop => ({ location: stop })) : undefined;
          
          directionsService.route({
            origin: pickup,
            destination: dropoff,
            waypoints: waypoints,
            optimizeWaypoints: false,
            travelMode: window.google.maps.TravelMode.DRIVING
          }, (result, status) => {
            if (status === 'OK' && result) {
              resolve(result);
            } else {
              reject(new Error(`Directions API error: ${status}`));
            }
          });
        });
      });

      if (result && 'routes' in result) {
        // Calculate total distance and duration
        let totalDistanceMeters = 0;
        let totalDurationSeconds = 0;

        if (result.routes[0] && result.routes[0].legs) {
          result.routes[0].legs.forEach((leg: any) => {
            if (leg.distance && leg.distance.value) {
              totalDistanceMeters += leg.distance.value;
            }
            if (leg.duration && leg.duration.value) {
              totalDurationSeconds += leg.duration.value;
            }
          });
        }

        // Add stop time (15 minutes per stop)
        const validStopsCount = validStops.length;
        const stopTimeMinutes = validStopsCount * 15;
        const totalDurationWithStops = totalDurationSeconds + (stopTimeMinutes * 60);

        // Convert to readable format
        const totalDistanceMiles = totalDistanceMeters / 1609.34;
        const totalDistanceText = `${totalDistanceMiles.toFixed(1)} mi`;

        const totalHours = Math.floor(totalDurationWithStops / 3600);
        const totalMinutes = Math.floor((totalDurationWithStops % 3600) / 60);
        let totalDurationText = '';
        if (totalHours > 0) {
          totalDurationText = `${totalHours}h ${totalMinutes}m`;
        } else {
          totalDurationText = `${totalMinutes}m`;
        }

        const newRouteInfo: RouteInfo = {
          distance: totalDistanceText,
          duration: totalDurationText,
          totalDistanceMeters,
          totalDistanceMiles,
          totalDurationSeconds,
          totalDurationWithStops,
          validStopsCount
        };

        console.log('✅ Global: Route calculated:', {
          ...newRouteInfo,
          stopsIncluded: validStopsCount > 0 ? 'Yes' : 'No',
          totalStops: validStopsCount
        });
        setRouteInfo(newRouteInfo);
        return newRouteInfo;
      }
    } catch (error) {
      console.error('❌ Global: Error calculating route:', error);
      setRouteInfo(null);
    } finally {
      setIsCalculating(false);
    }

    return null;
  }, [makeApiCall]);

  const clearRouteInfo = useCallback(() => {
    setRouteInfo(null);
  }, []);

  const value: RouteCalculationContextType = {
    calculateRoute,
    routeInfo,
    isCalculating,
    clearRouteInfo
  };

  return (
    <RouteCalculationContext.Provider value={value}>
      {children}
    </RouteCalculationContext.Provider>
  );
};

export const useRouteCalculation = (): RouteCalculationContextType => {
  const context = useContext(RouteCalculationContext);
  if (context === undefined) {
    throw new Error('useRouteCalculation must be used within a RouteCalculationProvider');
  }
  return context;
}; 