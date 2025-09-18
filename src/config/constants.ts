// Global Constants Configuration

// Google Maps API Configuration
export const GOOGLE_MAPS_API_KEY = 'AIzaSyCt4x1Zu_Cgtfdu8Tst65C871kVabm4ZCk';

// API Base URLs
const resolvedApiBaseUrl = process.env.REACT_APP_API_BASE_URL
  || (typeof window !== 'undefined' 
    ? (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
      ? `http://${window.location.hostname}:5001/api`
      : `https://api.${window.location.hostname}/api`)
    : 'http://localhost:5001/api');
export const API_BASE_URL = resolvedApiBaseUrl;

// Default Map Configuration
export const DEFAULT_MAP_CENTER = {
  lat: 27.9506,
  lng: -82.4572
};

// Google Maps API Configuration
export const GOOGLE_MAPS_CONFIG = {
  // API Limits - Optimizados para reducir errores
  RATE_LIMITS: {
    route: 5, // Reducido de 10 a 5 calls per minute para evitar OVER_QUERY_LIMIT
    geocoding: 10, // Reducido de 20 a 10 calls per minute
    places: 15, // Reducido de 30 a 15 calls per minute
  },
  
  // Cache Configuration - Aumentado para reducir llamadas
  CACHE_DURATION: 15 * 60 * 1000, // 15 minutos (aumentado de 5)
  MAX_CACHE_SIZE: 200, // Aumentado de 100 a 200
  
  // Debounce Delays - Aumentados para reducir llamadas
  DEBOUNCE_DELAYS: {
    ROUTE_CALCULATION: 2000, // 2 segundos (aumentado de 1)
    GEOCODING: 1000, // 1 segundo (aumentado de 0.5)
    PLACES_AUTOCOMPLETE: 800, // 0.8 segundos (aumentado de 0.3)
  },
  
  // Retry Configuration
  RETRY_CONFIG: {
    MAX_RETRIES: 3,
    RETRY_DELAY: 2000, // 2 segundos entre reintentos
    BACKOFF_MULTIPLIER: 2, // Multiplicador exponencial
  },
  
  // Error Handling
  ERROR_HANDLING: {
    OVER_QUERY_LIMIT_DELAY: 60000, // 1 minuto de espera
    MAX_CONSECUTIVE_ERRORS: 5,
    ERROR_COOLDOWN: 30000, // 30 segundos de cooldown
  },
  
  // Map Options
  MAP_OPTIONS: {
    zoom: 10,
    mapTypeId: 'roadmap',
    mapTypeControl: true,
    streetViewControl: true,
    fullscreenControl: true,
    zoomControl: true,
    scaleControl: true,
  },
  
  // Drawing Options
  DRAWING_OPTIONS: {
    drawingMode: null,
    drawingControl: true,
    drawingControlOptions: {
      position: 'TOP_CENTER',
      drawingModes: ['POLYGON'],
    },
    polygonOptions: {
      fillColor: '#FF0000',
      fillOpacity: 0.3,
      strokeWeight: 2,
      strokeColor: '#FF0000',
      clickable: true,
      editable: true,
      zIndex: 1,
    },
  },
  
  // Circle Options
  CIRCLE_OPTIONS: {
    strokeColor: '#FF0000',
    strokeOpacity: 0.8,
    strokeWeight: 2,
    fillColor: '#FF0000',
    fillOpacity: 0.35,
  }
};

// Application Configuration
export const APP_NAME = 'Transport Booking System';
export const APP_VERSION = '1.0.0';

// Booking Configuration
export const DEFAULT_BOOKING_CONFIG = {
  minConfirmationNumber: 10000,
  maxConfirmationNumber: 99999,
  defaultCurrency: 'USD',
  defaultLanguage: 'en'
};

// Vehicle Types
export const VEHICLE_TYPES = {
  SEDAN: 'sedan',
  MINIVAN: 'minivan',
  SUV: 'suv',
  VAN: 'van',
  BUS: 'bus'
};

// Booking Status
export const BOOKING_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled'
};

// User Roles
export const USER_ROLES = {
  ADMIN: 'admin',
  USER: 'user',
  DRIVER: 'driver'
};

// Payment Methods
export const PAYMENT_METHODS = {
  CASH: 'cash',
  INVOICE: 'invoice',
  CREDIT_CARD: 'credit_card',
  PAYPAL: 'paypal'
};

// Time Configuration
export const TIME_SLOTS = {
  HOURS: Array.from({length: 12}, (_, i) => i + 1),
  MINUTES: Array.from({length: 60}, (_, i) => i),
  PERIODS: ['AM', 'PM']
};

// Form Validation
export const VALIDATION_RULES = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE: /^[\+]?[1-9][\d]{0,15}$/,
  ZIPCODE: /^\d{5}(-\d{4})?$/,
  PASSWORD_MIN_LENGTH: 6
};

// Error Messages
export const ERROR_MESSAGES = {
  REQUIRED_FIELD: 'This field is required',
  INVALID_EMAIL: 'Please enter a valid email address',
  INVALID_PHONE: 'Please enter a valid phone number',
  INVALID_ZIPCODE: 'Please enter a valid zip code',
  PASSWORD_TOO_SHORT: 'Password must be at least 6 characters long',
  NETWORK_ERROR: 'Network error. Please try again.',
  UNAUTHORIZED: 'You are not authorized to perform this action',
  NOT_FOUND: 'The requested resource was not found',
  SERVER_ERROR: 'Server error. Please try again later.'
};

// Success Messages
export const SUCCESS_MESSAGES = {
  BOOKING_CREATED: 'Booking created successfully!',
  BOOKING_UPDATED: 'Booking updated successfully!',
  BOOKING_DELETED: 'Booking deleted successfully!',
  USER_REGISTERED: 'User registered successfully!',
  USER_LOGGED_IN: 'Login successful!',
  SETTINGS_SAVED: 'Settings saved successfully!',
  VEHICLE_ADDED: 'Vehicle type added successfully!',
  VEHICLE_UPDATED: 'Vehicle type updated successfully!',
  VEHICLE_DELETED: 'Vehicle type deleted successfully!'
}; 