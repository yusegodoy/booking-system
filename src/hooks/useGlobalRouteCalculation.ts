import { useState, useCallback, useRef, useEffect } from 'react';

interface RouteInfo {
  distance: string;
  duration: string;
  totalDistanceMiles: number;
  totalDurationMinutes: number;
  validStopsCount: number;
  pickupCoords?: { lat: number; lng: number };
  dropoffCoords?: { lat: number; lng: number };
  stopCoords?: { lat: number; lng: number }[];
}

interface RouteCalculationParams {
  pickup: string;
  dropoff: string;
  stops: string[];
}

interface UseGlobalRouteCalculationReturn {
  routeInfo: RouteInfo | null;
  isCalculating: boolean;
  calculateRoute: (params: RouteCalculationParams) => Promise<RouteInfo | null>;
  clearRoute: () => void;
  getApiStatus: () => { isLoaded: boolean; error: string | null };
}

// Cache global para evitar cálculos duplicados
const routeCache = new Map<string, { data: RouteInfo; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

// Función para generar clave de caché
const generateCacheKey = (pickup: string, dropoff: string, stops: string[]): string => {
  const validStops = stops.filter(stop => stop.trim() !== '');
  const stopsKey = validStops.length > 0 ? `:${validStops.join('|')}` : '';
  return `route:${pickup}:${dropoff}${stopsKey}`;
};

// Función para obtener coordenadas de una dirección
const getPlaceCoordinates = async (address: string): Promise<{ lat: number; lng: number } | null> => {
  if (!window.google || !window.google.maps) {
    throw new Error('Google Maps API not loaded');
  }

  return new Promise((resolve, reject) => {
    const geocoder = new window.google.maps.Geocoder();
    geocoder.geocode({ address }, (results, status) => {
      if (status === 'OK' && results && results[0]) {
        const location = results[0].geometry.location;
        resolve({
          lat: location.lat(),
          lng: location.lng()
        });
      } else {
        reject(new Error(`Geocoding failed: ${status}`));
      }
    });
  });
};

// Función para calcular ruta usando Directions API
const calculateRouteWithDirections = async (
  pickup: string,
  dropoff: string,
  stops: string[]
): Promise<RouteInfo> => {
  if (!window.google || !window.google.maps) {
    throw new Error('Google Maps API not loaded');
  }

  return new Promise((resolve, reject) => {
    const directionsService = new window.google.maps.DirectionsService();
    const validStops = stops.filter(stop => stop.trim() !== '');
    const waypoints = validStops.length > 0 
      ? validStops.map(stop => ({ location: stop }))
      : undefined;

    directionsService.route({
      origin: pickup,
      destination: dropoff,
      waypoints: waypoints,
      optimizeWaypoints: false, // Mantener orden de stops
      travelMode: window.google.maps.TravelMode.DRIVING
    }, async (result, status) => {
      if (status === 'OK' && result) {
        try {
          // Calcular distancia y duración total
          let totalDistanceMeters = 0;
          let totalDurationSeconds = 0;

          if (result.routes[0] && result.routes[0].legs) {
            result.routes[0].legs.forEach((leg) => {
              if (leg.distance && leg.distance.value) {
                totalDistanceMeters += leg.distance.value;
              }
              if (leg.duration && leg.duration.value) {
                totalDurationSeconds += leg.duration.value;
              }
            });
          }

          // Agregar tiempo de paradas (15 minutos por stop)
          const stopTimeMinutes = validStops.length * 15;
          const totalDurationWithStops = totalDurationSeconds + (stopTimeMinutes * 60);

          // Convertir a formato legible
          const totalDistanceMiles = totalDistanceMeters / 1609.34;
          const totalDurationMinutes = Math.floor(totalDurationWithStops / 60);
          
          const distanceText = `${totalDistanceMiles.toFixed(1)} mi`;
          const hours = Math.floor(totalDurationMinutes / 60);
          const minutes = totalDurationMinutes % 60;
          const durationText = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;

          // Obtener coordenadas de pickup y dropoff
          let pickupCoords: { lat: number; lng: number } | undefined;
          let dropoffCoords: { lat: number; lng: number } | undefined;
          let stopCoords: { lat: number; lng: number }[] | undefined;

          try {
            const coords = await getPlaceCoordinates(pickup);
            pickupCoords = coords || undefined;
          } catch (error) {
            console.warn('Failed to get pickup coordinates:', error);
          }

          try {
            const coords = await getPlaceCoordinates(dropoff);
            dropoffCoords = coords || undefined;
          } catch (error) {
            console.warn('Failed to get dropoff coordinates:', error);
          }

          // Obtener coordenadas de stops
          if (validStops.length > 0) {
            stopCoords = [];
            for (const stop of validStops) {
              try {
                const coords = await getPlaceCoordinates(stop);
                if (coords) {
                  stopCoords.push(coords);
                }
              } catch (error) {
                console.warn(`Failed to get coordinates for stop: ${stop}`, error);
              }
            }
          }

          const routeInfo: RouteInfo = {
            distance: distanceText,
            duration: durationText,
            totalDistanceMiles,
            totalDurationMinutes,
            validStopsCount: validStops.length,
            pickupCoords,
            dropoffCoords,
            stopCoords
          };

          resolve(routeInfo);
        } catch (error) {
          reject(error);
        }
      } else {
        reject(new Error(`Directions API error: ${status}`));
      }
    });
  });
};

export const useGlobalRouteCalculation = (): UseGlobalRouteCalculationReturn => {
  const [routeInfo, setRouteInfo] = useState<RouteInfo | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [isApiLoaded, setIsApiLoaded] = useState(false);

  // Verificar si Google Maps API está cargado
  useEffect(() => {
    const checkGoogleMaps = () => {
      if (window.google && window.google.maps) {
        setIsApiLoaded(true);
        setApiError(null);
      } else {
        setIsApiLoaded(false);
        setApiError('Google Maps API not loaded');
      }
    };

    // Verificar inmediatamente
    checkGoogleMaps();

    // Verificar cada segundo hasta que esté cargado
    const interval = setInterval(() => {
      if (!isApiLoaded) {
        checkGoogleMaps();
      } else {
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isApiLoaded]);

  const calculateRoute = useCallback(async (params: RouteCalculationParams): Promise<RouteInfo | null> => {
    const { pickup, dropoff, stops } = params;

    // Validar parámetros
    if (!pickup.trim() || !dropoff.trim()) {
      console.log('❌ Global Route: Missing pickup or dropoff');
      setRouteInfo(null);
      return null;
    }

    // Verificar caché
    const cacheKey = generateCacheKey(pickup, dropoff, stops);
    const cached = routeCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      console.log('✅ Global Route: Using cached result');
      setRouteInfo(cached.data);
      return cached.data;
    }

    // Verificar que Google Maps API esté disponible
    if (!isApiLoaded) {
      console.error('❌ Global Route: Google Maps API not loaded');
      setApiError('Google Maps API not loaded');
      return null;
    }

    console.log('🔄 Global Route: Starting calculation', {
      pickup,
      dropoff,
      stops: stops.filter(stop => stop.trim() !== ''),
      stopsCount: stops.filter(stop => stop.trim() !== '').length
    });

    setIsCalculating(true);
    setApiError(null);

    try {
      const result = await calculateRouteWithDirections(pickup, dropoff, stops);
      
      // Guardar en caché
      routeCache.set(cacheKey, {
        data: result,
        timestamp: Date.now()
      });

      console.log('✅ Global Route: Calculation completed', result);
      setRouteInfo(result);
      return result;

    } catch (error) {
      console.error('❌ Global Route: Calculation failed', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      setApiError(errorMessage);
      setRouteInfo(null);
      return null;
    } finally {
      setIsCalculating(false);
    }
  }, [isApiLoaded]);

  const clearRoute = useCallback(() => {
    setRouteInfo(null);
    setApiError(null);
  }, []);

  const getApiStatus = useCallback(() => {
    return {
      isLoaded: isApiLoaded,
      error: apiError
    };
  }, [isApiLoaded, apiError]);

  return {
    routeInfo,
    isCalculating,
    calculateRoute,
    clearRoute,
    getApiStatus
  };
}; 