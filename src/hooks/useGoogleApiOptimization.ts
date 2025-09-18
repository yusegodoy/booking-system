import { useRef, useCallback, useState } from 'react';
import { GOOGLE_MAPS_CONFIG } from '../config/constants';

interface CacheEntry {
  data: any;
  timestamp: number;
}

interface ApiCallStats {
  totalCalls: number;
  successfulCalls: number;
  failedCalls: number;
  cachedCalls: number;
  retryCalls: number;
  rateLimitHits: number;
}

interface ErrorTracker {
  consecutiveErrors: number;
  lastErrorTime: number;
  isInCooldown: boolean;
}

export const useGoogleApiOptimization = () => {
  // Memory cache for API responses
  const memoryCache = useRef(new Map<string, CacheEntry>());
  
  // Rate limiting counters
  const rateLimitCounters = useRef({
    route: { count: 0, lastReset: Date.now() },
    geocoding: { count: 0, lastReset: Date.now() },
    places: { count: 0, lastReset: Date.now() }
  });

  // Error tracking per API type
  const errorTrackers = useRef({
    route: { consecutiveErrors: 0, lastErrorTime: 0, isInCooldown: false } as ErrorTracker,
    geocoding: { consecutiveErrors: 0, lastErrorTime: 0, isInCooldown: false } as ErrorTracker,
    places: { consecutiveErrors: 0, lastErrorTime: 0, isInCooldown: false } as ErrorTracker
  });

  // API call statistics
  const [apiStats, setApiStats] = useState<ApiCallStats>({
    totalCalls: 0,
    successfulCalls: 0,
    failedCalls: 0,
    cachedCalls: 0,
    retryCalls: 0,
    rateLimitHits: 0
  });

  // Check if API is in cooldown
  const isInCooldown = useCallback((apiType: 'route' | 'geocoding' | 'places'): boolean => {
    const tracker = errorTrackers.current[apiType];
    const now = Date.now();
    
    if (tracker.isInCooldown) {
      if (now - tracker.lastErrorTime > GOOGLE_MAPS_CONFIG.ERROR_HANDLING.ERROR_COOLDOWN) {
        tracker.isInCooldown = false;
        tracker.consecutiveErrors = 0;
        return false;
      }
      return true;
    }
    
    return false;
  }, []);

  // Check rate limits with improved logic
  const checkRateLimit = useCallback((apiType: 'route' | 'geocoding' | 'places'): boolean => {
    const now = Date.now();
    const counter = rateLimitCounters.current[apiType];
    const limit = GOOGLE_MAPS_CONFIG.RATE_LIMITS[apiType];
    
    // Reset counter if 1 minute has passed
    if (now - counter.lastReset > 60000) {
      counter.count = 0;
      counter.lastReset = now;
    }
    
    if (counter.count >= limit) {
      console.warn(`🚫 ${apiType} API rate limit reached: ${counter.count}/${limit}`);
      setApiStats(prev => ({ ...prev, rateLimitHits: prev.rateLimitHits + 1 }));
      return false;
    }
    
    counter.count++;
    return true;
  }, []);

  // Get remaining calls
  const getRemainingCalls = useCallback((apiType: 'route' | 'geocoding' | 'places'): number => {
    const counter = rateLimitCounters.current[apiType];
    const limit = GOOGLE_MAPS_CONFIG.RATE_LIMITS[apiType];
    return Math.max(0, limit - counter.count);
  }, []);

  // Simple cache management
  const getFromCache = useCallback((key: string): any => {
    const entry = memoryCache.current.get(key);
    if (entry && Date.now() - entry.timestamp < GOOGLE_MAPS_CONFIG.CACHE_DURATION) {
      setApiStats(prev => ({ ...prev, cachedCalls: prev.cachedCalls + 1 }));
      return entry.data;
    }
    return null;
  }, []);

  const setCache = useCallback((key: string, data: any) => {
    // Limit cache size
    if (memoryCache.current.size >= GOOGLE_MAPS_CONFIG.MAX_CACHE_SIZE) {
      const firstKey = memoryCache.current.keys().next().value;
      memoryCache.current.delete(firstKey);
    }
    
    memoryCache.current.set(key, {
      data,
      timestamp: Date.now()
    });
  }, []);

  // Retry mechanism with exponential backoff
  const retryWithBackoff = useCallback(async <T>(
    apiCall: () => Promise<T>,
    retryCount: number = 0
  ): Promise<T> => {
    try {
      return await apiCall();
    } catch (error) {
      const maxRetries = GOOGLE_MAPS_CONFIG.RETRY_CONFIG.MAX_RETRIES;
      
      if (retryCount < maxRetries) {
        const delay = GOOGLE_MAPS_CONFIG.RETRY_CONFIG.RETRY_DELAY * 
          Math.pow(GOOGLE_MAPS_CONFIG.RETRY_CONFIG.BACKOFF_MULTIPLIER, retryCount);
        
        console.log(`🔄 Retrying API call in ${delay}ms (attempt ${retryCount + 1}/${maxRetries})`);
        setApiStats(prev => ({ ...prev, retryCalls: prev.retryCalls + 1 }));
        
        await new Promise(resolve => setTimeout(resolve, delay));
        return retryWithBackoff(apiCall, retryCount + 1);
      }
      
      throw error;
    }
  }, []);

  // Optimized API call wrapper with error handling
  const makeApiCall = useCallback(async <T>(
    apiType: 'route' | 'geocoding' | 'places',
    cacheKey: string,
    apiCall: () => Promise<T>
  ): Promise<T> => {
    setApiStats(prev => ({ ...prev, totalCalls: prev.totalCalls + 1 }));

    // Check cache first
    const cached = getFromCache(cacheKey);
    if (cached) {
      return cached;
    }

    // Check cooldown
    if (isInCooldown(apiType)) {
      throw new Error(`${apiType} API is in cooldown due to consecutive errors`);
    }

    // Check rate limit
    if (!checkRateLimit(apiType)) {
      throw new Error(`${apiType} API rate limit exceeded`);
    }

    try {
      const result = await retryWithBackoff(apiCall);
      setCache(cacheKey, result);
      setApiStats(prev => ({ ...prev, successfulCalls: prev.successfulCalls + 1 }));
      
      // Reset error tracker on success
      errorTrackers.current[apiType].consecutiveErrors = 0;
      
      return result;
    } catch (error) {
      const tracker = errorTrackers.current[apiType];
      tracker.consecutiveErrors++;
      tracker.lastErrorTime = Date.now();
      
      // Check if we should enter cooldown
      if (tracker.consecutiveErrors >= GOOGLE_MAPS_CONFIG.ERROR_HANDLING.MAX_CONSECUTIVE_ERRORS) {
        tracker.isInCooldown = true;
        console.warn(`🚫 ${apiType} API entering cooldown due to ${tracker.consecutiveErrors} consecutive errors`);
      }
      
      // Handle OVER_QUERY_LIMIT specifically
      if (error instanceof Error && error.message.includes('OVER_QUERY_LIMIT')) {
        console.warn(`🚫 ${apiType} API OVER_QUERY_LIMIT - waiting ${GOOGLE_MAPS_CONFIG.ERROR_HANDLING.OVER_QUERY_LIMIT_DELAY}ms`);
        await new Promise(resolve => setTimeout(resolve, GOOGLE_MAPS_CONFIG.ERROR_HANDLING.OVER_QUERY_LIMIT_DELAY));
      }
      
      setApiStats(prev => ({ ...prev, failedCalls: prev.failedCalls + 1 }));
      throw error;
    }
  }, [checkRateLimit, getFromCache, setCache, isInCooldown, retryWithBackoff]);

  // Clear cache
  const clearCache = useCallback(() => {
    memoryCache.current.clear();
  }, []);

  // Get cache stats
  const getCacheStats = useCallback(() => ({
    size: memoryCache.current.size,
    maxSize: GOOGLE_MAPS_CONFIG.MAX_CACHE_SIZE
  }), []);

  // Get error stats
  const getErrorStats = useCallback(() => ({
    route: errorTrackers.current.route,
    geocoding: errorTrackers.current.geocoding,
    places: errorTrackers.current.places
  }), []);

  // Reset error trackers
  const resetErrorTrackers = useCallback(() => {
    Object.keys(errorTrackers.current).forEach(key => {
      const apiType = key as 'route' | 'geocoding' | 'places';
      errorTrackers.current[apiType] = {
        consecutiveErrors: 0,
        lastErrorTime: 0,
        isInCooldown: false
      };
    });
  }, []);

  return {
    makeApiCall,
    checkRateLimit,
    getRemainingCalls,
    getFromCache,
    setCache,
    clearCache,
    getCacheStats,
    getErrorStats,
    resetErrorTrackers,
    apiStats
  };
}; 