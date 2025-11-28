import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Autocomplete } from '@react-google-maps/api';
import AuthForm from './AuthForm';
import ConfirmationPopup from './ConfirmationPopup';
import { DEFAULT_MAP_CENTER, GOOGLE_MAPS_CONFIG } from '../config/constants';
import { useGoogleMaps } from '../contexts/GoogleMapsContext';
import { useGlobalRouteCalculation } from '../hooks/useGlobalRouteCalculation';

interface WizardProps {
  onOpenDashboard: () => void;
  onOpenLoginModal: () => void;
  embedded?: boolean;
  wizardState: {
    currentStep: number;
    tripInfo: {
      pickup: string;
      dropoff: string;
      date: string;
      pickupHour: string;
      pickupMinute: string;
      pickupPeriod: string;
      passengers: number;
      checkedLuggage: number;
      carryOn: number;
      infantSeats: number;
      toddlerSeats: number;
      boosterSeats: number;
      flight: string;
      roundTrip: boolean;
      returnDate: string;
      returnHour: string;
      returnMinute: string;
      returnPeriod: string;
      returnFlight: string;
      stops: string[];

      vehicleType?: string;
      vehicleName?: string;
    };
    userData: {
      firstName: string;
      lastName: string;
      email: string;
      phone: string;
      specialInstructions: string;
    };
    isLoggedIn: boolean;
    checkoutType: 'guest' | 'account' | null;
    showAuthForm: boolean;
    vehicleSelected: boolean;
    paymentMethod: 'cash' | 'invoice';
  };
  updateWizardState: (updates: any) => void;
}

const steps = [
  'Trip Information',
  'Vehicle Selection',
  'Payment & Summary'
];

const initialTripInfo = {
  pickup: '',
  dropoff: '',
  date: '',
  pickupHour: '',
  pickupMinute: '',
  pickupPeriod: '',
  passengers: 1,
  checkedLuggage: 0,
  carryOn: 0,
  flight: '',
  roundTrip: false,
  returnDate: '',
  returnHour: '',
  returnMinute: '',
  returnPeriod: '',
  returnFlight: '',
  stops: [] as string[], // Array de paradas adicionales
  
};

// type TripInfo = typeof initialTripInfo; // No se usa

const libraries: ("places" | "drawing")[] = ["places", "drawing"];
const DEFAULT_CENTER = DEFAULT_MAP_CENTER; // Tampa International Airport
const DEFAULT_ZOOM = 12;

// Campos obligatorios para la validación del viaje
const requiredTripFields = ['date', 'pickupHour', 'pickupMinute', 'pickupPeriod', 'pickup', 'dropoff', 'passengers'];
const requiredReturnFields = ['returnDate', 'returnHour', 'returnMinute', 'returnPeriod'];

const Wizard: React.FC<WizardProps> = ({ onOpenDashboard, onOpenLoginModal, wizardState, updateWizardState, embedded = false }) => {
    // Global route calculation hook
  const { routeInfo, isCalculating, calculateRoute, clearRoute } = useGlobalRouteCalculation();
  
  // Estado para el menú de usuario y help (debe ir al inicio del componente)
  const [showUserMenu, setShowUserMenu] = React.useState(false);
  const [showHelp, setShowHelp] = React.useState(false);
  // Estados para validación de email y teléfono
  const [emailError, setEmailError] = React.useState('');
  const [phoneError, setPhoneError] = React.useState('');
  const [emailTouched, setEmailTouched] = React.useState(false);
  const [phoneTouched, setPhoneTouched] = React.useState(false);
  // Estados para validación de nombre y apellido
  const [firstNameError, setFirstNameError] = React.useState('');
  const [lastNameError, setLastNameError] = React.useState('');
  const [firstNameTouched, setFirstNameTouched] = React.useState(false);
  const [lastNameTouched, setLastNameTouched] = React.useState(false);

  // Debounce timers para optimizar llamadas a APIs
  const debounceTimers = useRef<{
    route: NodeJS.Timeout | null;
    geocoding: NodeJS.Timeout | null;
    places: NodeJS.Timeout | null;
  }>({
    route: null,
    geocoding: null,
    places: null
  });

  // Cache for location details - moved to component level
  const locationDetailsCache = useRef(new Map());

  // Extract detailed location information with caching
  const extractLocationDetails = useCallback(async (address: string) => {
    if (!window.google || !address) return { address };
    
    // Check cache first
    if (locationDetailsCache.current.has(address)) {
      return locationDetailsCache.current.get(address);
    }
    
    return new Promise((resolve) => {
      const geocoder = new window.google.maps.Geocoder();
      geocoder.geocode({ address }, (results: any, status: any) => {
        if (status === 'OK' && results && results[0]) {
          const result = results[0];
          const location = result.geometry.location;
          
          // Extract address components
          let city = '';
          let zipcode = '';
          let state = '';
          
          for (const component of result.address_components) {
            const types = component.types;
            if (types.includes('locality')) {
              city = component.long_name;
            } else if (types.includes('postal_code')) {
              zipcode = component.long_name;
            } else if (types.includes('administrative_area_level_1')) {
              state = component.short_name;
            }
          }
          
          const locationDetails = {
            address: result.formatted_address,
            lat: location.lat(),
            lng: location.lng(),
            city,
            zipcode,
            state
          };
          
          // Cache the result
          locationDetailsCache.current.set(address, locationDetails);
          
          // Limit cache size
          if (locationDetailsCache.current.size > 100) {
            const firstKey = locationDetailsCache.current.keys().next().value;
            locationDetailsCache.current.delete(firstKey);
          }
          
          resolve(locationDetails);
        } else {
          resolve({ address });
        }
      });
    });
  }, []);

  // Función para cerrar menús al hacer click fuera
  React.useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      setShowUserMenu(false);
      setShowHelp(false);
    };
    if (showUserMenu || showHelp) {
      document.addEventListener('click', handleClick);
      return () => document.removeEventListener('click', handleClick);
    }
  }, [showUserMenu, showHelp]);

  // Evitar que el click en el menú lo cierre
  const stopPropagation = (e: React.MouseEvent) => e.stopPropagation();

  const { isLoaded } = useGoogleMaps();
  // Estados locales que no necesitan ser preservados
  const [tripTouched, setTripTouched] = useState<{[key:string]: boolean}>({});
  const [tripError, setTripError] = useState('');
  const [showStops, setShowStops] = useState(false); // Controla la visibilidad de los campos de paradas
  const [showChildSeats, setShowChildSeats] = useState(false); // Controla la visibilidad de los campos de child seats
  const [selectedChildSeatType, setSelectedChildSeatType] = useState<'infant' | 'toddler' | 'booster' | ''>(''); // Tipo de car seat seleccionado
  const [showConfirmationPopup, setShowConfirmationPopup] = useState(false);
  const [confirmationNumbers, setConfirmationNumbers] = useState<{ outbound: number; return?: number }>({ outbound: 0 });
  const [vehicleTypes, setVehicleTypes] = useState<any[]>([]);
  const [vehicleTypesLoading, setVehicleTypesLoading] = useState(false);
  const [vehicleTypesError, setVehicleTypesError] = useState('');
  // Añadir estado para el vehículo seleccionado
  const [selectedVehicle, setSelectedVehicle] = useState<any>(null);
  // Añadir estado para el método de pago por vehículo
  const [vehiclePaymentMethods, setVehiclePaymentMethods] = useState<{[vehicleId: string]: 'cash' | 'invoice'}>(() => ({}));
  // Añadir estado para los precios de los vehículos
  const [vehiclePrices, setVehiclePrices] = useState<{[vehicleId: string]: number}>({});
  
  // Estados para el cálculo de precios usando la API del backend
  const [priceLoading, setPriceLoading] = useState(false);
  const [priceError, setPriceError] = useState<string | null>(null);
  const [calculatedPrice, setCalculatedPrice] = useState<{
    basePrice: number;
    distancePrice: number;
    stopsCharge: number;
    childSeatsCharge: number;
    roundTripDiscount: number;
    returnTripPrice: number;
    subtotal: number;
    paymentDiscount: number;
    paymentDiscountDescription?: string;
    finalTotal: number;
    areaName: string;
    pricingMethod: string;
    distance: number;
    surgeMultiplier: number;
    surgeName: string;
  } | null>(null);

  // Suppress Google Maps API warnings for deprecated Autocomplete
  useEffect(() => {
    const originalWarn = console.warn;
    console.warn = (...args) => {
      if (args[0] && typeof args[0] === 'string' && 
          args[0].includes('google.maps.places.Autocomplete') &&
          args[0].includes('not available to new customers')) {
        return; // Suppress this specific warning
      }
      originalWarn.apply(console, args);
    };
    
    return () => {
      console.warn = originalWarn;
    };
  }, []);

  const pickupAutocomplete = useRef<google.maps.places.Autocomplete | null>(null);
  const dropoffAutocomplete = useRef<google.maps.places.Autocomplete | null>(null);
  const stopAutocompletes = useRef<(google.maps.places.Autocomplete | null)[]>([]);

  // Estado del slideshow de Minivan
  const [slide, setSlide] = useState(0);

  // Extraer valores del wizardState
  const { currentStep, tripInfo, userData, isLoggedIn, checkoutType, showAuthForm, vehicleSelected, paymentMethod } = wizardState;

  // Función optimizada para calcular ruta con debounce
  const debouncedCalculateRoute = useCallback((pickup: string, dropoff: string, stops: string[]) => {
    // Limpiar timer anterior
    if (debounceTimers.current.route) {
      clearTimeout(debounceTimers.current.route);
    }

    // Solo calcular si tenemos pickup y dropoff válidos
    if (!pickup.trim() || !dropoff.trim()) {
      return;
    }

    // Configurar nuevo timer con debounce aumentado
    debounceTimers.current.route = setTimeout(() => {
      calculateRoute({ pickup, dropoff, stops });
    }, GOOGLE_MAPS_CONFIG.DEBOUNCE_DELAYS.ROUTE_CALCULATION);
  }, [calculateRoute]);

  // Función optimizada para extraer detalles de ubicación con debounce
  const debouncedExtractLocationDetails = useCallback((address: string) => {
    // Limpiar timer anterior
    if (debounceTimers.current.geocoding) {
      clearTimeout(debounceTimers.current.geocoding);
    }

    // Solo procesar si la dirección es válida
    if (!address.trim()) {
      return Promise.resolve({ address });
    }

    // Configurar nuevo timer con debounce aumentado
    return new Promise((resolve) => {
      debounceTimers.current.geocoding = setTimeout(() => {
        extractLocationDetails(address).then(resolve);
      }, GOOGLE_MAPS_CONFIG.DEBOUNCE_DELAYS.GEOCODING);
    });
  }, [extractLocationDetails]);

  // Auto-calculate route when addresses change
  React.useEffect(() => {
    if (tripInfo.pickup && tripInfo.dropoff) {
      debouncedCalculateRoute(tripInfo.pickup, tripInfo.dropoff, tripInfo.stops);
    }
  }, [tripInfo.pickup, tripInfo.dropoff, tripInfo.stops, debouncedCalculateRoute]);

  const handleTripChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    let newValue: string | number | boolean = value;
    if (type === 'checkbox') {
      newValue = (e.target as HTMLInputElement).checked;
    } else if (name === 'passengers' || name === 'checkedLuggage' || name === 'carryOn') {
      newValue = Number(value);
    }
    updateWizardState({
      tripInfo: {
        ...tripInfo,
        [name]: newValue
      }
    });
  };

  const handleUserDataChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    updateWizardState({
      userData: {
        ...userData,
        [e.target.name]: e.target.value
      }
    });
    
    // Validar email en tiempo real
    if (e.target.name === 'email') {
      validateEmail(e.target.value);
    }
    
    // Validar teléfono en tiempo real
    if (e.target.name === 'phone') {
      validatePhone(e.target.value);
    }
    
    // Validar nombre en tiempo real
    if (e.target.name === 'firstName') {
      validateFirstName(e.target.value);
    }
    
    // Validar apellido en tiempo real
    if (e.target.name === 'lastName') {
      validateLastName(e.target.value);
    }
  };

  // Función para validar email
  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) {
      setEmailError('');
    } else if (!emailRegex.test(email)) {
      setEmailError('Please enter a valid email address');
    } else {
      setEmailError('');
    }
  };

  // Función para validar teléfono
  const validatePhone = (phone: string) => {
    const phoneRegex = /^\+?[\d\s\-\(\)]{7,15}$/;
    if (!phone) {
      setPhoneError('');
    } else if (!phoneRegex.test(phone)) {
      setPhoneError('Please enter a valid phone number');
    } else {
      setPhoneError('');
    }
  };

  // Función para validar nombre
  const validateFirstName = (firstName: string) => {
    if (!firstName) {
      setFirstNameError('First name is required');
    } else if (firstName.trim().length < 2) {
      setFirstNameError('First name must be at least 2 characters');
    } else {
      setFirstNameError('');
    }
  };

  // Función para validar apellido
  const validateLastName = (lastName: string) => {
    if (!lastName) {
      setLastNameError('Last name is required');
    } else if (lastName.trim().length < 2) {
      setLastNameError('Last name must be at least 2 characters');
    } else {
      setLastNameError('');
    }
  };

  // Función para manejar blur de campos
  const handleUserDataBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    if (e.target.name === 'email') {
      setEmailTouched(true);
      validateEmail(e.target.value);
    }
    if (e.target.name === 'phone') {
      setPhoneTouched(true);
      validatePhone(e.target.value);
    }
    if (e.target.name === 'firstName') {
      setFirstNameTouched(true);
      validateFirstName(e.target.value);
    }
    if (e.target.name === 'lastName') {
      setLastNameTouched(true);
      validateLastName(e.target.value);
    }
  };

  // Función para cargar datos de usuario registrado
  const loadUserData = () => {
    // Aquí se cargarían los datos del usuario desde localStorage, API, etc.
    // Por ahora simulamos datos de ejemplo
    const savedUserData = localStorage.getItem('userData');
    if (savedUserData) {
      const parsedData = JSON.parse(savedUserData);
      updateWizardState({
        userData: parsedData,
        isLoggedIn: true
      });
    }
  };

  // Cargar datos de usuario cuando se llega al paso de Payment Information
  React.useEffect(() => {
    if (currentStep === 2 && !isLoggedIn) {
      loadUserData();
    }
  }, [currentStep, isLoggedIn, loadUserData]);

  // Establecer checkoutType automáticamente cuando se llega al paso de Payment & Summary
  React.useEffect(() => {
    if (currentStep === 2 && !checkoutType) {
      updateWizardState({
        checkoutType: 'guest' // Establecer como guest por defecto
      });
    }
  }, [currentStep, checkoutType]);

  // Función para manejar login
  const handleLogin = (email: string, password: string) => {
    // Verificar credenciales de demo
    if (email === 'demo@example.com' && password === 'demo123') {
      const mockUserData = {
        firstName: 'John',
        lastName: 'Doe',
        email: email,
        phone: '+1 (555) 123-4567',
        specialInstructions: ''
      };
      
      updateWizardState({
        userData: mockUserData,
        isLoggedIn: true,
        showAuthForm: false,
        checkoutType: 'account'
      });
      
      // Guardar en localStorage para futuras sesiones
      localStorage.setItem('userData', JSON.stringify(mockUserData));
    } else {
      // Aquí se haría la llamada a la API de login real
      // Por ahora simulamos un login exitoso para cualquier email
      const mockUserData = {
        firstName: 'Demo',
        lastName: 'User',
        email: email,
        phone: '+1 (555) 999-8888',
        specialInstructions: ''
      };
      
      updateWizardState({
        userData: mockUserData,
        isLoggedIn: true,
        showAuthForm: false,
        checkoutType: 'account'
      });
      
      // Guardar en localStorage para futuras sesiones
      localStorage.setItem('userData', JSON.stringify(mockUserData));
    }
  };

  // Función para manejar registro
  const handleRegister = (firstName: string, lastName: string, email: string, password: string, phone: string) => {
    // Aquí se haría la llamada a la API de registro
    // Por ahora simulamos un registro exitoso
    const newUserData = {
      firstName,
      lastName,
      email,
      phone,
      specialInstructions: ''
    };
    
    updateWizardState({
      userData: newUserData,
      isLoggedIn: true,
      showAuthForm: false,
      checkoutType: 'account'
    });
    
    // Guardar en localStorage para futuras sesiones
    localStorage.setItem('userData', JSON.stringify(newUserData));
  };

  // Función para continuar como guest
  const continueAsGuest = () => {
    updateWizardState({
      checkoutType: 'guest',
      showAuthForm: false,
      isLoggedIn: false,
      userData: {
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        specialInstructions: ''
      }
    });
  };

  // Manejar cambios en las paradas
  const handleStopChange = (index: number, value: string) => {
    updateWizardState({
      tripInfo: {
        ...tripInfo,
        stops: tripInfo.stops.map((stop, i) => i === index ? value : stop)
      }
    });
    
    // Route calculation will be triggered by useEffect
  };

    // Agregar una nueva parada
  const addStop = () => {
    updateWizardState({
      tripInfo: {
        ...tripInfo,
        stops: [...tripInfo.stops, '']
      }
    });
    setShowStops(true);
    
    // Route calculation will be triggered by useEffect
  };

  // Eliminar una parada
  const removeStop = (index: number) => {
    const newStops = tripInfo.stops.filter((_, i) => i !== index);
    updateWizardState({
      tripInfo: {
        ...tripInfo,
        stops: newStops
      }
    });
    
    // Si no quedan paradas, ocultar la sección
    if (newStops.length <= 1) {
      setShowStops(false);
    }
    
    // Route calculation will be triggered by useEffect
  };

  // Función para limpiar child seats
  const clearChildSeats = () => {
    updateWizardState({
      tripInfo: {
        ...tripInfo,
        infantSeats: 0,
        toddlerSeats: 0,
        boosterSeats: 0
      }
    });
    setShowChildSeats(false);
    setSelectedChildSeatType('');
  };

  // Función para agregar child seat
  const addChildSeat = (type: 'infant' | 'toddler' | 'booster', quantity: number) => {
    updateWizardState({
      tripInfo: {
        ...tripInfo,
        [type === 'infant' ? 'infantSeats' : type === 'toddler' ? 'toddlerSeats' : 'boosterSeats']: 
          tripInfo[type === 'infant' ? 'infantSeats' : type === 'toddler' ? 'toddlerSeats' : 'boosterSeats'] + quantity
      }
    });
    setSelectedChildSeatType('');
  };

  // Cargar autocomplete para una parada
  const onStopLoad = (index: number) => (autocomplete: google.maps.places.Autocomplete) => {
    stopAutocompletes.current[index] = autocomplete;
    console.log(`Autocomplete loaded for stop ${index}:`, autocomplete);
  };

  // Manejar cambio de lugar para una parada
  const onStopPlaceChanged = (index: number) => () => {
    if (stopAutocompletes.current[index]) {
      const place = stopAutocompletes.current[index]!.getPlace();
      if (place && place.formatted_address) {
        handleStopChange(index, place.formatted_address);
        // Trigger route calculation after stop selection
        setTimeout(() => {
          debouncedCalculateRoute(tripInfo.pickup, tripInfo.dropoff, tripInfo.stops);
        }, 100);
      }
    }
  };

  const handleTripBlur = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => {
    setTripTouched(prev => ({ ...prev, [e.target.name]: true }));
  };

  // Autocomplete load handlers
  const onPickupLoad = (autocomplete: google.maps.places.Autocomplete) => {
    pickupAutocomplete.current = autocomplete;
  };

  const onDropoffLoad = (autocomplete: google.maps.places.Autocomplete) => {
    dropoffAutocomplete.current = autocomplete;
  };

  // Place changed handlers
  const onPickupPlaceChanged = () => {
    if (pickupAutocomplete.current) {
      const place = pickupAutocomplete.current.getPlace();
      if (place && place.formatted_address) {
        updateWizardState({
          tripInfo: {
            ...tripInfo,
            pickup: place.formatted_address
          }
        });
        // Trigger route calculation
        setTimeout(() => {
          debouncedCalculateRoute(place.formatted_address || '', tripInfo.dropoff, tripInfo.stops);
        }, 100);
      }
    }
  };

  const onDropoffPlaceChanged = () => {
    if (dropoffAutocomplete.current) {
      const place = dropoffAutocomplete.current.getPlace();
      if (place && place.formatted_address) {
        updateWizardState({
          tripInfo: {
            ...tripInfo,
            dropoff: place.formatted_address
          }
        });
        // Trigger route calculation
        setTimeout(() => {
          debouncedCalculateRoute(tripInfo.pickup, place.formatted_address || '', tripInfo.stops);
        }, 100);
      }
    }
  };

  // Route calculation is now handled globally

  



  // Calcular fecha/hora de salida
  const getDepartureTime = () => {
    if (!tripInfo.date || !tripInfo.pickupHour || !tripInfo.pickupMinute || !tripInfo.pickupPeriod) return undefined;
    const [year, month, day] = tripInfo.date.split('-').map(Number);
    let hour = Number(tripInfo.pickupHour);
    if (tripInfo.pickupPeriod === 'PM' && hour < 12) hour += 12;
    if (tripInfo.pickupPeriod === 'AM' && hour === 12) hour = 0;
    const minute = Number(tripInfo.pickupMinute);
    return new Date(year, month - 1, day, hour, minute);
  };

  // Obtener waypoints para las paradas (ya no se usa, pero mantenemos por compatibilidad)
  const getWaypoints = () => {
    const validStops = tripInfo.stops.filter(stop => stop.trim() !== '');
    return validStops.map(stop => ({
      location: stop,
      stopover: true
    }));
  };

  const isTripValid = () => {
    for (const field of requiredTripFields) {
      const value = tripInfo[field as keyof typeof tripInfo];
      if (
        (typeof value === 'string' && value === '') ||
        (typeof value === 'number' && (value === null || value === undefined || Number.isNaN(value)))
      ) {
        return false;
      }
    }
    if (tripInfo.roundTrip) {
      for (const field of requiredReturnFields) {
        const value = tripInfo[field as keyof typeof tripInfo];
        if (
          (typeof value === 'string' && value === '') ||
          (typeof value === 'number' && (value === null || value === undefined || Number.isNaN(value)))
        ) {
          return false;
        }
      }
    }
    return true;
  };

  // Función para generar número de confirmación consecutivo
  const generateConfirmationNumber = () => {
    // Obtener configuración de rango desde localStorage (configurable desde admin)
    const config = JSON.parse(localStorage.getItem('bookingConfig') || '{"minNumber": 10000, "maxNumber": 99999}');
    const minNumber = config.minNumber || 10000;
    const maxNumber = config.maxNumber || 99999;
    
    // Obtener números de confirmación existentes
    const existingBookings = JSON.parse(localStorage.getItem('bookings') || '[]');
    const existingNumbers = existingBookings.flatMap((booking: any) => [
      booking.outboundConfirmationNumber,
      ...(booking.returnConfirmationNumber ? [booking.returnConfirmationNumber] : [])
    ]);
    
    // Si no hay números existentes, empezar desde el mínimo
    if (existingNumbers.length === 0) {
      return minNumber;
    }
    
    // Encontrar el siguiente número consecutivo
    const maxExistingNumber = Math.max(...existingNumbers);
    const nextNumber = maxExistingNumber + 1;
    
    // Verificar que no exceda el máximo configurado
    if (nextNumber > maxNumber) {
      alert('Maximum confirmation number reached. Please contact administrator to increase the range.');
      return null;
    }
    
    return nextNumber;
  };

  // Función para generar números únicos y consecutivos para cada tramo
  const generateUniqueConfirmationNumbers = async () => {
    try {
      // Obtener el siguiente número disponible del backend (public endpoint)
      const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5001/api';
      const response = await fetch(`${API_BASE_URL}/bookings/next-confirmation-number`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to get next confirmation number');
      }

      const data = await response.json();
      const nextNumber = data.nextNumber;

      if (tripInfo.roundTrip) {
        // Verificar que hay espacio para dos números
        if (nextNumber + 1 > 99999) {
          alert('Maximum confirmation number reached. Please contact administrator to increase the range.');
          return null;
        }
        return { outbound: nextNumber, return: nextNumber + 1 };
      } else {
        return { outbound: nextNumber };
      }
    } catch (error) {
      console.error('Error generating confirmation numbers:', error);
      // Fallback: usar timestamp + random como antes
      const timestamp = Date.now();
      const random = Math.floor(Math.random() * 1000);
      const fallbackNumber = `BK${timestamp}${random}`;
      
      if (tripInfo.roundTrip) {
        return { outbound: fallbackNumber, return: `${fallbackNumber}R` };
      } else {
        return { outbound: fallbackNumber };
      }
    }
  };

  // Función para crear la reservación
  // Función para calcular precios usando la API del backend (igual que BookingEditor)
  const calculatePriceWithBackend = async () => {
    if (!tripInfo.pickup || !tripInfo.dropoff || !tripInfo.vehicleType) {
      return;
    }

    setPriceLoading(true);
    setPriceError(null);

    try {
      // Usar la distancia calculada de la ruta global
      let miles = 0;
      if (routeInfo && routeInfo.totalDistanceMiles) {
        miles = routeInfo.totalDistanceMiles;
      } else {
        // Fallback: estimar distancia basada en ubicaciones conocidas
        miles = 15; // Distancia por defecto
      }

      const stopsCount = tripInfo.stops.filter(stop => stop.trim() !== '').length;
      const childSeatsCount = tripInfo.infantSeats + tripInfo.toddlerSeats + tripInfo.boosterSeats;
      const isRoundTrip = tripInfo.roundTrip;

      // Mapear el nombre del vehículo al correcto
      const mappedVehicleTypeName = mapVehicleTypeName(tripInfo.vehicleType);
      const vehicleType = vehicleTypes.find(vt => vt.name === mappedVehicleTypeName);
      const vehicleTypeId = vehicleType?._id || '';

      const requestBody = {
        pickup: {
          lat: 0, // No tenemos coordenadas en el wizard
          lng: 0,
          address: tripInfo.pickup,
          zipcode: '',
          city: ''
        },
        dropoff: {
          lat: 0,
          lng: 0,
          address: tripInfo.dropoff,
          zipcode: '',
          city: ''
        },
        miles,
        stopsCount,
        childSeatsCount,
        isRoundTrip,
        vehicleTypeId,
        paymentMethod: paymentMethod
      };

      console.log('=== WIZARD PRICING CALCULATION ===');
      console.log('Request body:', requestBody);

      const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5001/api';
      const response = await fetch(`${API_BASE_URL}/pricing/calculate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        let errorMsg = 'Error calculating price';
        try {
          const errorData = await response.json();
          errorMsg = errorData.message || errorData.error || JSON.stringify(errorData);
        } catch (e) {
          errorMsg = `HTTP ${response.status}: ${response.statusText}`;
        }
        throw new Error(errorMsg);
      }

      const data = await response.json();
      console.log('Pricing response:', data);

      // Actualizar el precio calculado
      setCalculatedPrice(data);

      // Actualizar el precio del vehículo en el estado
      if (tripInfo.vehicleType) {
        setVehiclePrices(prev => ({
          ...prev,
          [tripInfo.vehicleType as string]: data.finalTotal
        }));
      }

    } catch (error: any) {
      console.error('Error calculating price:', error);
      setPriceError(error.message || 'Error calculating price');
    } finally {
      setPriceLoading(false);
    }
  };

  // Función para mapear nombres de vehículos (igual que BookingEditor)
  const mapVehicleTypeName = (vehicleType: string): string => {
    const mapping: { [key: string]: string } = {
      'Minivan': 'Minivan',
      'SUV': 'SUV',
      'Sedan': 'Sedan',
      'Luxury': 'Luxury',
      'Van': 'Van',
      'Bus': 'Bus'
    };
    return mapping[vehicleType] || vehicleType;
  };

  // Calcular precio automáticamente cuando cambien los datos relevantes
  useEffect(() => {
    if (tripInfo.pickup && tripInfo.dropoff && tripInfo.vehicleType && vehicleTypes.length > 0) {
      // Solo calcular si tenemos distancia calculada
      if (routeInfo && routeInfo.totalDistanceMiles > 0) {
        const timeoutId = setTimeout(() => {
          calculatePriceWithBackend();
        }, 300); // Debounce reducido ya que tenemos distancia
        
        return () => clearTimeout(timeoutId);
      }
    }
  }, [tripInfo.pickup, tripInfo.dropoff, tripInfo.vehicleType, tripInfo.stops, tripInfo.infantSeats, tripInfo.toddlerSeats, tripInfo.boosterSeats, tripInfo.roundTrip, paymentMethod, vehicleTypes, routeInfo]);

  // Función para resetear el formulario a su estado inicial
  const resetForm = () => {
    updateWizardState({
      currentStep: 0,
      tripInfo: {
        pickup: '',
        dropoff: '',
        date: '',
        pickupHour: '',
        pickupMinute: '',
        pickupPeriod: '',
        passengers: 1,
        checkedLuggage: 0,
        carryOn: 0,
        flight: '',
        roundTrip: false,
        returnDate: '',
        returnHour: '',
        returnMinute: '',
        returnPeriod: '',
        returnFlight: '',
        stops: [],
        vehicleType: undefined,
        vehicleName: undefined
      },
      userData: {
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        specialInstructions: ''
      },
      vehicleSelected: false,
      paymentMethod: 'cash',
      checkoutType: null,
      showAuthForm: false
    });
    
    // Limpiar estados locales
    setTripTouched({});
    setTripError('');
    setShowStops(false);
    setShowChildSeats(false);
    setSelectedChildSeatType('');
    setVehiclePaymentMethods({});
    setVehiclePrices({});
    setEmailError('');
    setPhoneError('');
    setFirstNameError('');
    setLastNameError('');
    setEmailTouched(false);
    setPhoneTouched(false);
    setFirstNameTouched(false);
    setLastNameTouched(false);
    
    // Reset pricing states
    setCalculatedPrice(null);
    setPriceError(null);
    setPriceLoading(false);
  };

  const createBooking = async () => {
    // Validar campos requeridos antes de crear la reservación
    const requiredFields = [
      { field: tripInfo.pickup, name: 'Pickup location' },
      { field: tripInfo.dropoff, name: 'Dropoff location' },
      { field: tripInfo.date, name: 'Date' },
      { field: tripInfo.pickupHour, name: 'Pickup hour' },
      { field: tripInfo.pickupMinute, name: 'Pickup minute' },
      { field: tripInfo.pickupPeriod, name: 'Pickup period' },
      { field: userData.firstName, name: 'First name' },
      { field: userData.lastName, name: 'Last name' },
      { field: userData.email, name: 'Email' },
      { field: userData.phone, name: 'Phone' },
      { field: tripInfo.vehicleType, name: 'Vehicle type' }
    ];

    const missingFields = requiredFields.filter(item => !item.field || item.field.trim() === '');
    if (missingFields.length > 0) {
      alert(`Please complete the following required fields: ${missingFields.map(f => f.name).join(', ')}`);
      return;
    }

    // Generar números de confirmación únicos para cada tramo
    const confirmationNumbers = await generateUniqueConfirmationNumbers();
    if (!confirmationNumbers) {
      return; // No se puede crear la reservación si no hay números disponibles
    }

    // Crear objeto de reservación con todos los campos requeridos
    const booking = {
      outboundConfirmationNumber: confirmationNumbers.outbound,
      ...(confirmationNumbers.return && { returnConfirmationNumber: confirmationNumbers.return }),
      tripInfo: { 
        ...tripInfo,
        passengers: tripInfo.passengers || 1, // Asegurar valor por defecto
        checkedLuggage: tripInfo.checkedLuggage || 0,
        carryOn: tripInfo.carryOn || 0,
        infantSeats: tripInfo.infantSeats || 0,
        toddlerSeats: tripInfo.toddlerSeats || 0,
        boosterSeats: tripInfo.boosterSeats || 0,
        flight: tripInfo.flight || '',
        roundTrip: tripInfo.roundTrip || false,
        stops: tripInfo.stops || []
      },
      userData: { 
        ...userData,
        specialInstructions: userData.specialInstructions || ''
      },
      paymentMethod: paymentMethod || 'cash',
      checkoutType: checkoutType || 'guest',
      isLoggedIn: isLoggedIn || false,
      status: 'Pending',
      // Include all pricing breakdown fields if available
      ...(calculatedPrice && {
        basePrice: calculatedPrice.basePrice || 0,
        distancePrice: calculatedPrice.distancePrice || 0,
        stopsCharge: calculatedPrice.stopsCharge || 0,
        childSeatsCharge: calculatedPrice.childSeatsCharge || 0,
        roundTripDiscount: calculatedPrice.roundTripDiscount || 0,
        returnTripPrice: calculatedPrice.returnTripPrice || 0,
        subtotal: calculatedPrice.subtotal || 0,
        paymentDiscount: calculatedPrice.paymentDiscount || 0,
        paymentDiscountDescription: calculatedPrice.paymentDiscountDescription || '',
        areaName: calculatedPrice.areaName || '',
        pricingMethod: calculatedPrice.pricingMethod || 'distance',
        surgeMultiplier: calculatedPrice.surgeMultiplier || 1,
        surgeName: calculatedPrice.surgeName || '',
        calculatedPrice: calculatedPrice.finalTotal || 0 // Store finalTotal as calculatedPrice number
      }),
      totalPrice: (() => {
        // Si hay precio calculado del backend
        if (calculatedPrice) {
          // Si es roundtrip, el precio de ida es el subtotal sin incluir returnTripPrice
          if (tripInfo.roundTrip && calculatedPrice.returnTripPrice !== undefined) {
            // Calcular precio de ida: basePrice + distancePrice + stopsCharge + childSeatsCharge
            // Luego aplicar descuento proporcional
            const outboundSubtotal = (calculatedPrice.basePrice || 0) + 
                                    (calculatedPrice.distancePrice || 0) + 
                                    (calculatedPrice.stopsCharge || 0) + 
                                    (calculatedPrice.childSeatsCharge || 0);
            
            // Calcular el subtotal total (ida + vuelta) para calcular proporción del descuento
            const totalSubtotal = outboundSubtotal + (calculatedPrice.returnTripPrice || 0);
            
            // Aplicar descuento proporcional solo a la ida
            let outboundPrice = outboundSubtotal;
            if (calculatedPrice.paymentDiscount && totalSubtotal > 0) {
              const outboundProportion = outboundSubtotal / totalSubtotal;
              const outboundDiscount = calculatedPrice.paymentDiscount * outboundProportion;
              outboundPrice = outboundSubtotal - outboundDiscount;
            }
            
            return Math.round(outboundPrice * 100) / 100;
          } else {
            // No es roundtrip, usar finalTotal directamente
            return calculatedPrice.finalTotal || 0;
          }
        }
        
        // Fallback al cálculo anterior si no hay precio calculado del backend
        const selectedVehiclePrice = tripInfo.vehicleType ? vehiclePrices[tripInfo.vehicleType] : null;
        const basePrice = selectedVehiclePrice || 55;
        const childSeatsCount = tripInfo.infantSeats + tripInfo.toddlerSeats + tripInfo.boosterSeats;
        const childSeatsCharge = childSeatsCount * 5;
        
        if (tripInfo.roundTrip) {
          // Para roundtrip, solo devolver precio de ida (sin incluir vuelta)
          const baseTotal = basePrice + childSeatsCharge;
          const totalDiscount = paymentMethod === 'cash' ? baseTotal * 0.035 + 0.15 : 0;
          return baseTotal - totalDiscount;
        } else {
          const baseTotal = basePrice + childSeatsCharge;
          const totalDiscount = paymentMethod === 'cash' ? baseTotal * 0.035 + 0.15 : 0;
          return baseTotal - totalDiscount;
        }
      })()
    };

    console.log('Creating booking with validated data:', booking);

    try {
      // Create booking using public endpoint (no authentication required)
      const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5001/api';
      const response = await fetch(`${API_BASE_URL}/bookings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(booking)
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error creating booking');
      }
      // Mostrar popup de confirmación
      setConfirmationNumbers(confirmationNumbers);
      setShowConfirmationPopup(true);
      
      // Resetear el formulario después de un booking exitoso
      setTimeout(() => {
        resetForm();
      }, 3000); // Esperar 3 segundos para que el usuario vea el popup de confirmación
    } catch (error: any) {
      console.error('Full error details:', error);
      console.error('Booking data sent:', booking);
      
      let errorMessage = 'Error creating booking';
      if (error.message) {
        errorMessage += ': ' + error.message;
      }
      
      // Try to get more specific error information
      if (error.response) {
        try {
          const errorData = await error.response.json();
          if (errorData.message) {
            errorMessage = errorData.message;
          }
          if (errorData.error) {
            errorMessage += ' - ' + errorData.error;
          }
        } catch (e) {
          console.error('Could not parse error response:', e);
        }
      }
      
      alert(errorMessage);
    }
  };

  const handleNext = () => {
    if (currentStep === 0 && !isTripValid()) {
      setTripError('Please complete all required fields.');
      setTripTouched(prev => {
        const touched = { ...prev };
        requiredTripFields.forEach(f => { touched[f] = true; });
        if (tripInfo.roundTrip) requiredReturnFields.forEach(f => { touched[f] = true; });
        return touched;
      });
      return;
    }
    if (currentStep === 1 && !vehicleSelected) {
      // No permitir avanzar si no se ha seleccionado un vehículo
      return;
    }
    if (currentStep === 2) {
      // Validar campos requeridos en el paso de payment
      const requiredFields = ['firstName', 'lastName', 'email', 'phone'];
      const missingFields = requiredFields.filter(field => !userData[field as keyof typeof userData]);
      
      if (missingFields.length > 0) {
        // Marcar campos como tocados para mostrar errores
        if (missingFields.includes('firstName')) {
          setFirstNameTouched(true);
          validateFirstName(userData.firstName);
        }
        if (missingFields.includes('lastName')) {
          setLastNameTouched(true);
          validateLastName(userData.lastName);
        }
        if (missingFields.includes('email')) {
          setEmailTouched(true);
          validateEmail(userData.email);
        }
        if (missingFields.includes('phone')) {
          setPhoneTouched(true);
          validatePhone(userData.phone);
        }
        return;
      }
      
      // Validar formato de todos los campos
      if (firstNameError || lastNameError || emailError || phoneError) {
        return;
      }
    }
    if (currentStep === steps.length - 1) {
      // Estamos en Payment & Summary, procesar la confirmación
      createBooking();
      return;
    }
    setTripError('');
    updateWizardState({
      currentStep: Math.min(currentStep + 1, steps.length - 1)
    });
  };

  // Slideshow de imágenes de ejemplo para Minivan
  const minivanImages = [
    'https://images.pexels.com/photos/358070/pexels-photo-358070.jpeg',
    'https://images.pexels.com/photos/170782/pexels-photo-170782.jpeg',
    'https://images.pexels.com/photos/210019/pexels-photo-210019.jpeg',
  ];

  function calculateMinivanPrice(miles: number, stopsCount: number = 0): number {
    // Por ahora mantenemos la lógica hardcodeada, pero en el futuro se puede conectar al backend
    let basePrice = 0;
    if (miles <= 12) basePrice = 55;
    else if (miles <= 20) basePrice = 55 + (miles - 12) * 3.5;
    else basePrice = 55 + 8 * 3.5 + (miles - 20) * 2;
    
    // Agregar cargo por paradas adicionales ($5 por parada)
    const stopsCharge = stopsCount * 5;
    
    // Agregar cargo por child seats ($5 por cada uno)
    const childSeatsCharge = (tripInfo.infantSeats + tripInfo.toddlerSeats + tripInfo.boosterSeats) * 5;
    
    return basePrice + stopsCharge + childSeatsCharge;
  }

  // Función para obtener la configuración de precios del backend
  const getPricingConfig = async () => {
    try {
      const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5001/api';
      const response = await fetch(`${API_BASE_URL}/pricing/config`);
      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      console.error('Error fetching pricing config:', error);
    }
    return null;
  };

  // Función para calcular precio usando la configuración del backend (igual que calculatePriceWithBackend)
  const calculatePriceWithConfig = async (miles: number, stopsCount: number = 0, vehicleTypeId?: string): Promise<number> => {
    try {
      const childSeatsCount = tripInfo.infantSeats + tripInfo.toddlerSeats + tripInfo.boosterSeats;
      const isRoundTrip = tripInfo.roundTrip;

      const requestBody = {
        pickup: {
          lat: 0, // No tenemos coordenadas en el wizard
          lng: 0,
          address: tripInfo.pickup,
          zipcode: '',
          city: ''
        },
        dropoff: {
          lat: 0,
          lng: 0,
          address: tripInfo.dropoff,
          zipcode: '',
          city: ''
        },
        miles,
        stopsCount,
        childSeatsCount,
        isRoundTrip,
        vehicleTypeId: vehicleTypeId || '',
        paymentMethod: paymentMethod
      };

      console.log('=== VEHICLE CARD PRICING CALCULATION ===');
      console.log('Request body:', requestBody);

      const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5001/api';
      const response = await fetch(`${API_BASE_URL}/pricing/calculate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        let errorMsg = 'Error calculating price';
        try {
          const errorData = await response.json();
          errorMsg = errorData.message || errorData.error || JSON.stringify(errorData);
        } catch (e) {
          errorMsg = `HTTP ${response.status}: ${response.statusText}`;
        }
        throw new Error(errorMsg);
      }

      const data = await response.json();
      console.log('Vehicle card pricing response:', data);
      return data.finalTotal;
    } catch (error) {
      console.error('Error calculating price with config:', error);
      // Fallback to base price if calculation fails
      const vehicle = vehicleTypes.find(v => v._id === vehicleTypeId);
      return vehicle?.basePrice || 55;
    }
  };

  // Fetch vehicle types from backend on mount
  useEffect(() => {
    console.log('Vehicle types loaded in Wizard:', vehicleTypes);
    vehicleTypes.forEach(vehicle => {
      if (vehicle.mainImage) {
        console.log(`Vehicle ${vehicle.name} has image:`, vehicle.mainImage.substring(0, 50) + '...');
      } else {
        console.log(`Vehicle ${vehicle.name} has no main image`);
      }
    });
  }, [vehicleTypes]);
  useEffect(() => {
    const fetchVehicleTypes = async () => {
      setVehicleTypesLoading(true);
      setVehicleTypesError('');
      try {
        const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5001/api';
        const response = await fetch(`${API_BASE_URL}/vehicle-types`);
        if (response.ok) {
          const data = await response.json();
          setVehicleTypes(data);
        } else {
          setVehicleTypesError('Failed to load vehicle types');
        }
      } catch (error) {
        setVehicleTypesError('Error loading vehicle types');
      } finally {
        setVehicleTypesLoading(false);
      }
    };
    fetchVehicleTypes();
  }, []);

  // Calculate prices for all vehicles when distance or stops change
  useEffect(() => {
    const calculateAllPrices = async () => {
      if (vehicleTypes.length === 0) return;
      
      // Solo calcular si tenemos distancia válida
      if (!routeInfo || !routeInfo.totalDistanceMiles || routeInfo.totalDistanceMiles === 0) {
        return; // No mostrar precios hasta tener distancia real
      }
      
      const miles = routeInfo.totalDistanceMiles;
      const validStopsCount = tripInfo.stops.filter(stop => stop.trim() !== '').length;
      
      const newPrices: {[vehicleId: string]: number} = {};
      
      for (const vehicle of vehicleTypes) {
        try {
          const price = await calculatePriceWithConfig(miles, validStopsCount, vehicle._id);
          newPrices[vehicle._id] = price;
        } catch (error) {
          console.error('Error calculating price for vehicle:', vehicle._id, error);
          newPrices[vehicle._id] = vehicle.basePrice;
        }
      }
      
      setVehiclePrices(newPrices);
    };
    
    calculateAllPrices();
  }, [routeInfo, tripInfo.stops, tripInfo.infantSeats, tripInfo.toddlerSeats, tripInfo.boosterSeats, tripInfo.roundTrip, vehicleTypes]);

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <form className="trip-form" autoComplete="off" onSubmit={e => e.preventDefault()}>
            <div className="trip-row date-time-row" style={window.innerWidth <= 600 ? { 
              display: 'flex', 
              flexDirection: 'row', 
              gap: 20,
              justifyContent: 'center',
              alignItems: 'center',
              marginBottom: 8
            } : {
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 32,
              alignItems: 'center'
            }}>
              <label className={tripTouched.date && !tripInfo.date ? 'error' : ''} style={window.innerWidth <= 600 ? { 
                flex: '0 0 42%', 
                maxWidth: '42%',
                textAlign: 'center'
              } : {
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center'
              }}>
                Date
                <input type="date" name="date" value={tripInfo.date} onChange={handleTripChange} onBlur={handleTripBlur} required />
              </label>
              <label className={
                (tripTouched.pickupHour && !tripInfo.pickupHour) ||
                (tripTouched.pickupMinute && !tripInfo.pickupMinute) ||
                (tripTouched.pickupPeriod && !tripInfo.pickupPeriod) ? 'error' : ''
              } style={window.innerWidth <= 600 ? { 
                flex: '0 0 42%', 
                maxWidth: '42%',
                textAlign: 'center'
              } : {
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center'
              }}>
                Pickup time
                <input 
                  type="time" 
                  value={(() => {
                    // Convertir formato 12h a 24h para el input time
                    if (tripInfo.pickupHour && tripInfo.pickupMinute && tripInfo.pickupPeriod) {
                      let hour24 = parseInt(tripInfo.pickupHour);
                      if (tripInfo.pickupPeriod === 'PM' && hour24 !== 12) hour24 += 12;
                      if (tripInfo.pickupPeriod === 'AM' && hour24 === 12) hour24 = 0;
                      return `${String(hour24).padStart(2, '0')}:${tripInfo.pickupMinute}`;
                    }
                    return '';
                  })()}
                  onChange={(e) => {
                    // Convertir formato 24h a 12h
                    const [hour24, minute] = e.target.value.split(':');
                    if (hour24 && minute) {
                      const hour24Num = parseInt(hour24);
                      let hour12 = hour24Num;
                      let period = 'AM';
                      
                      if (hour24Num >= 12) {
                        period = 'PM';
                        if (hour24Num > 12) hour12 = hour24Num - 12;
                      }
                      if (hour24Num === 0) hour12 = 12;
                      
                      updateWizardState({
                        tripInfo: {
                          ...tripInfo,
                          pickupHour: String(hour12).padStart(2, '0'),
                          pickupMinute: minute,
                          pickupPeriod: period
                        }
                      });
                    }
                  }}
                  onBlur={handleTripBlur}
                  required
                />
              </label>
            </div>
            <label className={tripTouched.pickup && !tripInfo.pickup ? 'error' : ''} style={{ width: '100%' }}>
              Pickup location
              <Autocomplete onLoad={onPickupLoad} onPlaceChanged={onPickupPlaceChanged}>
                <input type="text" name="pickup" value={tripInfo.pickup} onChange={handleTripChange} onBlur={handleTripBlur} placeholder="Enter pickup address" required autoComplete="off" />
              </Autocomplete>
            </label>
            
            {/* Sección de paradas adicionales */}
            <div style={{ marginTop: '16px', marginBottom: '8px', textAlign: 'center' }}>
              <button 
                type="button" 
                onClick={addStop}
                style={{
                  background: 'transparent',
                  border: '2px dashed #d32f2f',
                  borderRadius: '8px',
                  padding: '10px 16px',
                  cursor: 'pointer',
                  color: '#d32f2f',
                  fontSize: '14px',
                  fontWeight: '500',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  transition: 'all 0.2s ease',
                  minWidth: '120px'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#fff7f0';
                  e.currentTarget.style.borderColor = '#b71c1c';
                  e.currentTarget.style.color = '#b71c1c';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.borderColor = '#d32f2f';
                  e.currentTarget.style.color = '#d32f2f';
                }}
              >
                <span style={{ fontSize: '16px', fontWeight: 'bold' }}>+</span>
                <span>Add Stop</span>
              </button>
            </div>
            
            {/* Campos de paradas adicionales */}
            {showStops && tripInfo.stops.map((stop, index) => (
              <label key={index} style={{ width: '100%' }}>
                Stop {index + 1}
                <div style={{ position: 'relative', width: '100%' }}>
                  <Autocomplete onLoad={onStopLoad(index)} onPlaceChanged={onStopPlaceChanged(index)}>
                    <input 
                      type="text" 
                      value={stop} 
                      onChange={(e) => handleStopChange(index, e.target.value)}
                      placeholder="Enter stop address" 
                      autoComplete="off" 
                    />
                  </Autocomplete>
                  <button
                    type="button"
                    onClick={() => removeStop(index)}
                    style={{
                      position: 'absolute',
                      right: '8px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      color: '#dc3545',
                      cursor: 'pointer',
                      padding: '6px',
                      borderRadius: '50%',
                      width: '28px',
                      height: '28px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.2s ease'
                    }}
                    title="Remove stop"
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#ffe6e6';
                      e.currentTarget.style.color = '#b71c1c';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                      e.currentTarget.style.color = '#dc3545';
                    }}
                  >
                    <svg 
                      width="20" 
                      height="20" 
                      viewBox="0 0 24 24" 
                      fill="currentColor"
                      style={{ display: 'block' }}
                    >
                      <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                    </svg>
                  </button>
                </div>
              </label>
            ))}
            
            <label className={tripTouched.dropoff && !tripInfo.dropoff ? 'error' : ''} style={{ width: '100%' }}>
              Drop-off location
              <Autocomplete onLoad={onDropoffLoad} onPlaceChanged={onDropoffPlaceChanged}>
                <input type="text" name="dropoff" value={tripInfo.dropoff} onChange={handleTripChange} onBlur={handleTripBlur} placeholder="Enter drop-off address" required autoComplete="off" />
              </Autocomplete>
            </label>
            
            {/* Distance and duration display (map removed for API optimization) */}
            {routeInfo && (
              <div style={{ marginBottom: 18, color: '#222', fontWeight: 500, fontSize: '1.08rem', textAlign: 'center' }}>
                <div style={{ marginBottom: 4 }}>
                  Total distance: <b>{routeInfo.distance}</b> &nbsp; | &nbsp; Total time: <b>{routeInfo.duration}</b>
                </div>
                {routeInfo.validStopsCount > 0 && (
                  <div style={{ fontSize: '0.9rem', color: '#666' }}>
                    Includes {routeInfo.validStopsCount} stop{routeInfo.validStopsCount > 1 ? 's' : ''} 
                    (+{routeInfo.validStopsCount * 15} min stop time)
                  </div>
                )}
              </div>
            )}
            <label>
              Flight number (optional)
              <input type="text" name="flight" value={tripInfo.flight} onChange={handleTripChange} placeholder="e.g. IB1234" autoComplete="off" />
            </label>
            <div className="trip-row">
              <label className={tripTouched.passengers && (!tripInfo.passengers && tripInfo.passengers !== 0) ? 'error' : ''}>
                Passengers
                <input type="number" name="passengers" min={1} max={8} value={tripInfo.passengers} onChange={handleTripChange} onBlur={handleTripBlur} required />
              </label>
              <label className={tripTouched.checkedLuggage && (tripInfo.checkedLuggage === null || tripInfo.checkedLuggage === undefined) ? 'error' : ''}>
                Checked luggage
                <input type="number" name="checkedLuggage" min={0} max={8} value={tripInfo.checkedLuggage} onChange={handleTripChange} onBlur={handleTripBlur} required />
              </label>
              <label className={tripTouched.carryOn && (tripInfo.carryOn === null || tripInfo.carryOn === undefined) ? 'error' : ''}>
                Carry-on
                <input type="number" name="carryOn" min={0} max={8} value={tripInfo.carryOn} onChange={handleTripChange} onBlur={handleTripBlur} required />
              </label>
            </div>
            
            {/* Sección de child seats adicionales */}
            {!showChildSeats && (
              <div style={{ marginTop: '16px', marginBottom: '8px', textAlign: 'center' }}>
                <button 
                  type="button" 
                  onClick={() => setShowChildSeats(true)}
                  style={{
                    background: 'transparent',
                    border: '2px dashed #1976d2',
                    borderRadius: '8px',
                    padding: '10px 16px',
                    cursor: 'pointer',
                    color: '#1976d2',
                    fontSize: '14px',
                    fontWeight: '500',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    transition: 'all 0.2s ease',
                    minWidth: '140px'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#f0f8ff';
                    e.currentTarget.style.borderColor = '#1565c0';
                    e.currentTarget.style.color = '#1565c0';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.borderColor = '#1976d2';
                    e.currentTarget.style.color = '#1976d2';
                  }}
                >
                  <span style={{ fontSize: '16px', fontWeight: 'bold' }}>👶</span>
                  <span>Add Child Seats</span>
                </button>
              </div>
            )}
            
            {/* Campos de child seats */}
            {showChildSeats && (
              <div style={{ marginTop: '20px', marginBottom: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <h3 style={{ color: '#333', fontSize: '1.1rem', fontWeight: '600', margin: 0 }}>
                    Child Seats (Optional) - $5 each
                  </h3>
                  <button
                    type="button"
                    onClick={clearChildSeats}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#dc3545',
                      cursor: 'pointer',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontSize: '0.9rem',
                      fontWeight: '500',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#ffe6e6';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                    title="Remove all child seats"
                  >
                    Remove All
                  </button>
                </div>

                {/* Resumen de child seats agregados */}
                {(tripInfo.infantSeats > 0 || tripInfo.toddlerSeats > 0 || tripInfo.boosterSeats > 0) && (
                  <div style={{ 
                    background: '#f8f9fa', 
                    border: '1px solid #e9ecef', 
                    borderRadius: '8px', 
                    padding: '12px', 
                    marginBottom: '16px' 
                  }}>
                    <div style={{ fontWeight: '600', marginBottom: '8px', color: '#333' }}>Selected Child Seats:</div>
                    <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                      {tripInfo.infantSeats > 0 && (
                        <span style={{ 
                          background: '#e3f2fd', 
                          color: '#1976d2', 
                          padding: '4px 8px', 
                          borderRadius: '4px', 
                          fontSize: '0.9rem',
                          fontWeight: '500'
                        }}>
                          {tripInfo.infantSeats} Infant Seat{tripInfo.infantSeats > 1 ? 's' : ''}
                        </span>
                      )}
                      {tripInfo.toddlerSeats > 0 && (
                        <span style={{ 
                          background: '#e8f5e8', 
                          color: '#2e7d32', 
                          padding: '4px 8px', 
                          borderRadius: '4px', 
                          fontSize: '0.9rem',
                          fontWeight: '500'
                        }}>
                          {tripInfo.toddlerSeats} Toddler Seat{tripInfo.toddlerSeats > 1 ? 's' : ''}
                        </span>
                      )}
                      {tripInfo.boosterSeats > 0 && (
                        <span style={{ 
                          background: '#fff3e0', 
                          color: '#f57c00', 
                          padding: '4px 8px', 
                          borderRadius: '4px', 
                          fontSize: '0.9rem',
                          fontWeight: '500'
                        }}>
                          {tripInfo.boosterSeats} Booster Seat{tripInfo.boosterSeats > 1 ? 's' : ''}
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Selector de tipo de car seat */}
                {selectedChildSeatType === '' && (
                  <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#333' }}>
                      Select Child Seat Type:
                    </label>
                    <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                      <button
                        type="button"
                        onClick={() => setSelectedChildSeatType('infant')}
                        style={{
                          background: '#e3f2fd',
                          border: '2px solid #1976d2',
                          borderRadius: '8px',
                          padding: '12px 16px',
                          cursor: 'pointer',
                          color: '#1976d2',
                          fontSize: '14px',
                          fontWeight: '600',
                          transition: 'all 0.2s ease',
                          minWidth: '120px',
                          textAlign: 'center'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = '#bbdefb';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = '#e3f2fd';
                        }}
                      >
                        <div style={{ fontSize: '1.2rem', marginBottom: '4px' }}>👶</div>
                        <div>Infant Seat</div>
                        <div style={{ fontSize: '0.8rem', fontWeight: '400', marginTop: '2px' }}>
                          (0-12 months)
                        </div>
                      </button>
                      
                      <button
                        type="button"
                        onClick={() => setSelectedChildSeatType('toddler')}
                        style={{
                          background: '#e8f5e8',
                          border: '2px solid #2e7d32',
                          borderRadius: '8px',
                          padding: '12px 16px',
                          cursor: 'pointer',
                          color: '#2e7d32',
                          fontSize: '14px',
                          fontWeight: '600',
                          transition: 'all 0.2s ease',
                          minWidth: '120px',
                          textAlign: 'center'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = '#c8e6c9';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = '#e8f5e8';
                        }}
                      >
                        <div style={{ fontSize: '1.2rem', marginBottom: '4px' }}>🧒</div>
                        <div>Toddler Seat</div>
                        <div style={{ fontSize: '0.8rem', fontWeight: '400', marginTop: '2px' }}>
                          (1-3 years)
                        </div>
                      </button>
                      
                      <button
                        type="button"
                        onClick={() => setSelectedChildSeatType('booster')}
                        style={{
                          background: '#fff3e0',
                          border: '2px solid #f57c00',
                          borderRadius: '8px',
                          padding: '12px 16px',
                          cursor: 'pointer',
                          color: '#f57c00',
                          fontSize: '14px',
                          fontWeight: '600',
                          transition: 'all 0.2s ease',
                          minWidth: '120px',
                          textAlign: 'center'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = '#ffe0b2';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = '#fff3e0';
                        }}
                      >
                        <div style={{ fontSize: '1.2rem', marginBottom: '4px' }}>👦</div>
                        <div>Booster Seat</div>
                        <div style={{ fontSize: '0.8rem', fontWeight: '400', marginTop: '2px' }}>
                          (4-8 years)
                        </div>
                      </button>
                    </div>
                  </div>
                )}

                {/* Selector de cantidad */}
                {selectedChildSeatType !== '' && (
                  <div style={{ 
                    background: '#f8f9fa', 
                    border: '1px solid #e9ecef', 
                    borderRadius: '8px', 
                    padding: '16px',
                    marginBottom: '16px'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                      <h4 style={{ margin: 0, color: '#333', fontSize: '1rem', fontWeight: '600' }}>
                        {selectedChildSeatType === 'infant' ? 'Infant Seat' : 
                         selectedChildSeatType === 'toddler' ? 'Toddler Seat' : 'Booster Seat'}
                      </h4>
                      <button
                        type="button"
                        onClick={() => setSelectedChildSeatType('')}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#666',
                          cursor: 'pointer',
                          fontSize: '1.2rem',
                          fontWeight: 'bold'
                        }}
                        title="Back to selection"
                      >
                        ×
                      </button>
                    </div>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                      <label style={{ fontWeight: '500', color: '#333' }}>Quantity:</label>
                      <select
                        id="childSeatQuantity"
                        style={{
                          padding: '8px 12px',
                          border: '1px solid #ddd',
                          borderRadius: '4px',
                          fontSize: '14px',
                          minWidth: '80px'
                        }}
                      >
                        {[1, 2, 3, 4].map(num => (
                          <option key={num} value={num}>{num}</option>
                        ))}
                      </select>
                    </div>
                    
                    <button
                      type="button"
                      onClick={() => {
                        const quantity = parseInt((document.getElementById('childSeatQuantity') as HTMLSelectElement).value);
                        addChildSeat(selectedChildSeatType as 'infant' | 'toddler' | 'booster', quantity);
                      }}
                      style={{
                        background: '#1976d2',
                        border: 'none',
                        borderRadius: '6px',
                        padding: '10px 20px',
                        color: '#fff',
                        fontSize: '14px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = '#1565c0';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = '#1976d2';
                      }}
                    >
                      Add to Reservation
                    </button>
                  </div>
                )}
              </div>
            )}
            <label className="roundtrip-checkbox">
              <input type="checkbox" name="roundTrip" checked={tripInfo.roundTrip} onChange={handleTripChange} />
              Round trip
            </label>
            {tripInfo.roundTrip && (
              <>
                <div className="trip-row">
                  <label className={tripTouched.returnDate && !tripInfo.returnDate ? 'error' : ''}>
                    Return date
                    <input type="date" name="returnDate" value={tripInfo.returnDate} onChange={handleTripChange} onBlur={handleTripBlur} required={tripInfo.roundTrip} />
                  </label>
                  <label className={
                    (tripTouched.returnHour && !tripInfo.returnHour) ||
                    (tripTouched.returnMinute && !tripInfo.returnMinute) ||
                    (tripTouched.returnPeriod && !tripInfo.returnPeriod) ? 'error' : ''
                  }>
                    Return time
                    <div className="time-selectors">
                      <select name="returnHour" value={tripInfo.returnHour} onChange={handleTripChange} onBlur={handleTripBlur} required={tripInfo.roundTrip}>
                        <option value="">Hour</option>
                        {[...Array(12)].map((_, i) => (
                          <option key={i+1} value={String(i+1).padStart(2, '0')}>{i+1}</option>
                        ))}
                      </select>
                      <span>:</span>
                      <select name="returnMinute" value={tripInfo.returnMinute} onChange={handleTripChange} onBlur={handleTripBlur} required={tripInfo.roundTrip}>
                        <option value="">Min</option>
                        {['00','05','10','15','20','25','30','35','40','45','50','55'].map(min => (
                          <option key={min} value={min}>{min}</option>
                        ))}
                      </select>
                      <select name="returnPeriod" value={tripInfo.returnPeriod} onChange={handleTripChange} onBlur={handleTripBlur} required={tripInfo.roundTrip}>
                        <option value="">AM/PM</option>
                        <option value="AM">AM</option>
                        <option value="PM">PM</option>
                      </select>
                    </div>
                  </label>
                </div>
                <label>
                  Return flight number (optional)
                  <input type="text" name="returnFlight" value={tripInfo.returnFlight} onChange={handleTripChange} placeholder="e.g. IB5678" autoComplete="off" />
                </label>
              </>
            )}
            {tripError && <div className="trip-error-message">{tripError}</div>}
          </form>
        );
      case 1:
        // Vehicle Selection Step
        return (
          <div className="vehicle-selection-step" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 400 }}>
            <h2 style={{ textAlign: 'center', marginBottom: 32 }}>Choose your vehicle</h2>
            <div className="vehicle-list" style={{ display: 'flex', flexWrap: 'wrap', gap: 32, justifyContent: 'center' }}>
              {vehicleTypesLoading && <p>Loading vehicle types...</p>}
              {vehicleTypesError && <p style={{color: 'red'}}>{vehicleTypesError}</p>}
              {vehicleTypes.map((vehicle) => {
                const paymentMethod = vehiclePaymentMethods[vehicle._id] || 'cash';
                // Usar el precio calculado del estado, pero mostrar loading si no está calculado
                const calculatedPrice = vehiclePrices[vehicle._id];
                const basePrice = calculatedPrice || vehicle.basePrice;
                const isPriceCalculated = !!calculatedPrice;
                // Usar los valores de descuento configurados en el admin
                const cashDiscountPercentage = vehicle.cashDiscountPercentage ?? 3.5;
                const cashDiscountFixedAmount = vehicle.cashDiscountFixedAmount ?? 0.15;
                const cashPrice = basePrice - (basePrice * (cashDiscountPercentage / 100) + cashDiscountFixedAmount);
                return (
                  <div key={vehicle._id} className="vehicle-card" style={{ background: '#fff', borderRadius: 18, boxShadow: '0 4px 24px rgba(25,118,210,0.10)', padding: 32, maxWidth: 420, width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', margin: '0 auto' }}>
                    {/* Imagen del vehículo */}
                    <div style={{ 
                      width: '100%', 
                      height: 180, 
                      borderRadius: 12, 
                      boxShadow: '0 2px 8px rgba(0,0,0,0.10)', 
                      marginBottom: 18,
                      overflow: 'hidden',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: '#f5f5f5'
                    }}>
                      {vehicle.mainImage ? (
                        <img 
                          src={vehicle.mainImage} 
                          alt={vehicle.name} 
                          style={{ 
                            width: '100%', 
                            height: '100%', 
                            objectFit: 'cover'
                          }} 
                          onError={(e) => {
                            console.log('Error loading vehicle image:', vehicle.name, vehicle.mainImage);
                            e.currentTarget.style.display = 'none';
                            const nextSibling = e.currentTarget.nextSibling as HTMLElement;
                            if (nextSibling) {
                              nextSibling.style.display = 'flex';
                            }
                          }}
                        />
                      ) : null}
                      <div style={{
                        display: vehicle.mainImage ? 'none' : 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '100%',
                        height: '100%',
                        backgroundColor: '#e3f2fd',
                        color: '#1976d2'
                      }}>
                        <div style={{ fontSize: '3rem', marginBottom: '8px' }}>🚗</div>
                        <div style={{ fontSize: '1rem', fontWeight: '600' }}>Vehicle Image</div>
                      </div>
                    </div>
                    <h3 style={{ margin: '12px 0 6px 0', fontSize: '2rem', color: '#d32f2f', fontWeight: 800, letterSpacing: 0.5 }}>{vehicle.name}</h3>
                    <p style={{ margin: 0, color: '#444', fontWeight: 600 }}>{vehicle.capacity} Passengers</p>
                    <p style={{ margin: '8px 0 8px 0', color: '#888', fontSize: '0.93rem', lineHeight: 1.4 }}>{vehicle.description}</p>
                    <p style={{ margin: '0 0 16px 0', color: '#b71c1c', fontSize: '0.98rem', fontWeight: 500 }}>
                      {vehicle.specifications && vehicle.specifications.features && vehicle.specifications.features.length > 0 ? vehicle.specifications.features.join(', ') : 'Comfortable and reliable.'}
                    </p>
                    {/* Mostrar solo el precio total sin descuento */}
                    <div className="vehicle-price-final" style={{ marginTop: 16, width: '100%', background: '#fafafa', borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.07)', padding: 16, textAlign: 'center' }}>
                      <h4 style={{ color: '#1976d2', marginBottom: 8 }}>Total Price</h4>
                      <div style={{ fontWeight: 800, fontSize: '1.7rem', color: '#1976d2', margin: '8px 0' }}>
                        {isPriceCalculated ? (
                          `$${basePrice.toFixed(2)}`
                        ) : (
                          <span style={{ color: '#666', fontSize: '1rem' }}>
                            Calculating...
                          </span>
                        )}
                      </div>
                    </div>
                    <button 
                      className="select-vehicle-btn" 
                      style={{ 
                        marginTop: 18, 
                        padding: '12px 36px', 
                        fontSize: '1.1rem', 
                        borderRadius: 8, 
                        background: '#d32f2f', 
                        color: '#fff', 
                        border: 'none', 
                        fontWeight: 600, 
                        cursor: 'pointer', 
                        width: '100%',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = '#b71c1c';
                        e.currentTarget.style.transform = 'translateY(-1px)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = '#d32f2f';
                        e.currentTarget.style.transform = 'translateY(0)';
                      }}
                      onClick={() => {
                        setSelectedVehicle(vehicle);
                        updateWizardState({
                          tripInfo: {
                            ...tripInfo,
                            vehicleType: vehicle._id,
                            vehicleName: vehicle.name
                          },
                          vehicleSelected: true,
                          paymentMethod: paymentMethod,
                          currentStep: 2 // Avanzar automáticamente al paso de pago
                        });
                      }}
                    >
                      Select {vehicle.name}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        );
      case 2:
        return (
          <div className="payment-summary-step" style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
            <h2 style={{ textAlign: 'center', marginBottom: '32px', color: '#d32f2f', fontSize: '2rem', fontWeight: '700' }}>
              Payment & Summary
            </h2>
            
            {/* Información del viaje */}
            <div style={{ 
              background: '#f8f9fa', 
              borderRadius: '12px', 
              padding: '20px', 
              marginBottom: '24px',
              border: '1px solid #e9ecef'
            }}>
              <h3 style={{ marginBottom: '16px', color: '#333', fontSize: '1.2rem', fontWeight: '600' }}>
                Trip Summary
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '0.95rem' }}>
                <div><strong>From:</strong> {tripInfo.pickup}</div>
                <div><strong>To:</strong> {tripInfo.dropoff}</div>
                <div><strong>Date:</strong> {tripInfo.date}</div>
                <div><strong>Time:</strong> {tripInfo.pickupHour}:{tripInfo.pickupMinute} {tripInfo.pickupPeriod}</div>
                <div><strong>Passengers:</strong> {tripInfo.passengers}</div>
                <div><strong>Vehicle:</strong> {tripInfo.vehicleName || 'Minivan'}</div>
                {(tripInfo.infantSeats > 0 || tripInfo.toddlerSeats > 0 || tripInfo.boosterSeats > 0) && (
                  <div style={{ gridColumn: '1 / -1' }}>
                    <strong>Child Seats:</strong> 
                    {tripInfo.infantSeats > 0 && ` ${tripInfo.infantSeats} Infant`}
                    {tripInfo.toddlerSeats > 0 && ` ${tripInfo.toddlerSeats} Toddler`}
                    {tripInfo.boosterSeats > 0 && ` ${tripInfo.boosterSeats} Booster`}
                    <span style={{ color: '#d32f2f', fontWeight: '600', marginLeft: '8px' }}>
                      (+${((tripInfo.infantSeats + tripInfo.toddlerSeats + tripInfo.boosterSeats) * 5).toFixed(2)})
                    </span>
                  </div>
                )}
                {tripInfo.stops.filter(stop => stop.trim() !== '').length > 0 && (
                  <div style={{ gridColumn: '1 / -1' }}>
                    <strong>Stops:</strong> {tripInfo.stops.filter(stop => stop.trim() !== '').join(', ')}
                  </div>
                )}
                {isTripValid() && (
                  <div style={{ gridColumn: '1 / -1', marginTop: '8px', paddingTop: '8px', borderTop: '1px solid #dee2e6' }}>
                    <strong>Total Price:</strong> 
                    <span style={{ color: '#d32f2f', fontWeight: '700', fontSize: '1.1rem', marginLeft: '8px' }}>
                      ${calculatedPrice?.finalTotal?.toFixed(2) || (() => {
                        // Fallback al cálculo anterior si no hay precio calculado del backend
                        const selectedVehiclePrice = tripInfo.vehicleType ? vehiclePrices[tripInfo.vehicleType] : null;
                        const basePrice = selectedVehiclePrice || 55;
                        
                        if (tripInfo.roundTrip) {
                          const returnPrice = basePrice * 0.95;
                          const baseTotal = basePrice + returnPrice;
                          const totalDiscount = paymentMethod === 'cash' ? baseTotal * 0.035 + 0.15 : 0;
                          return (baseTotal - totalDiscount).toFixed(2);
                        } else {
                          const totalDiscount = paymentMethod === 'cash' ? basePrice * 0.035 + 0.15 : 0;
                          return (basePrice - totalDiscount).toFixed(2);
                        }
                      })()}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Selección de tipo de checkout */}
            {!isLoggedIn && !checkoutType && (
              <div style={{ marginBottom: '32px' }}>
                <h3 style={{ marginBottom: '20px', color: '#333', fontSize: '1.3rem', fontWeight: '600', textAlign: 'center' }}>
                  How would you like to proceed?
                </h3>
                <div style={{ display: 'flex', gap: '20px', justifyContent: 'center' }}>
                  <div
                    style={{
                      background: '#fff',
                      border: '2px solid #e0e0e0',
                      borderRadius: '12px',
                      padding: '24px',
                      cursor: 'pointer',
                      textAlign: 'center',
                      minWidth: '200px',
                      transition: 'all 0.2s ease',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = '#d32f2f';
                      e.currentTarget.style.transform = 'translateY(-2px)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = '#e0e0e0';
                      e.currentTarget.style.transform = 'translateY(0)';
                    }}
                    onClick={continueAsGuest}
                  >
                    <div style={{ fontSize: '3rem', marginBottom: '12px' }}>👤</div>
                    <h4 style={{ marginBottom: '8px', color: '#333', fontSize: '1.1rem', fontWeight: '600' }}>
                      Continue as Guest
                    </h4>
                    <p style={{ fontSize: '0.9rem', color: '#666', lineHeight: '1.4' }}>
                      Quick checkout without creating an account
                    </p>
                  </div>
                  
                  <div
                    style={{
                      background: '#fff',
                      border: '2px solid #e0e0e0',
                      borderRadius: '12px',
                      padding: '24px',
                      cursor: 'pointer',
                      textAlign: 'center',
                      minWidth: '200px',
                      transition: 'all 0.2s ease',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = '#1976d2';
                      e.currentTarget.style.transform = 'translateY(-2px)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = '#e0e0e0';
                      e.currentTarget.style.transform = 'translateY(0)';
                    }}
                    onClick={onOpenLoginModal}
                  >
                    <div style={{ fontSize: '3rem', marginBottom: '12px' }}>👤</div>
                    <h4 style={{ marginBottom: '8px', color: '#333', fontSize: '1.1rem', fontWeight: '600' }}>
                      Sign In / Create Account
                    </h4>
                    <p style={{ fontSize: '0.9rem', color: '#666', lineHeight: '1.4' }}>
                      Save your information for faster future bookings
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Formulario de autenticación */}
            {showAuthForm && (
              <AuthForm 
                onLogin={handleLogin}
                onRegister={handleRegister}
                onBack={() => updateWizardState({ showAuthForm: false })}
              />
            )}

            {/* Formulario de datos del usuario */}
            {(isLoggedIn || (checkoutType && !showAuthForm)) && (
              <form className="payment-form" autoComplete="off" onSubmit={e => e.preventDefault()}>
                {/* Indicador de usuario registrado */}
                {isLoggedIn && (
                  <div style={{ 
                    background: '#e3f2fd', 
                    border: '1px solid #2196f3', 
                    borderRadius: '8px', 
                    padding: '12px', 
                    marginBottom: '20px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    justifyContent: 'space-between'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '1.2rem' }}>👤</span>
                      <span style={{ fontSize: '0.9rem', color: '#1976d2' }}>
                        Welcome back! Your information has been loaded from your account.
                      </span>
                    </div>
                    <button
                      type="button"
                      style={{
                        background: '#fff',
                        border: '1px solid #d32f2f',
                        color: '#d32f2f',
                        borderRadius: '6px',
                        padding: '6px 14px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        fontSize: '0.95rem',
                        marginLeft: '16px',
                        transition: 'all 0.2s'
                      }}
                      onClick={() => {
                        updateWizardState({
                          isLoggedIn: false,
                          checkoutType: null,
                          userData: {
                            firstName: '',
                            lastName: '',
                            email: '',
                            phone: '',
                            specialInstructions: ''
                          }
                        });
                        localStorage.removeItem('userData');
                      }}
                    >
                      Logout
                    </button>
                  </div>
                )}
              
              <div style={{ marginBottom: '24px' }}>
                <h3 style={{ marginBottom: '16px', color: '#333', fontSize: '1.2rem', fontWeight: '600' }}>
                  Passenger Information
                </h3>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                  <label style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    First Name *
                    <input 
                      type="text" 
                      name="firstName" 
                      value={userData.firstName}
                      onChange={handleUserDataChange}
                      onBlur={handleUserDataBlur}
                      required 
                      style={{
                        padding: '12px',
                        border: firstNameTouched && firstNameError ? '1px solid #d32f2f' : '1px solid #ddd',
                        borderRadius: '8px',
                        fontSize: '14px'
                      }}
                      placeholder="Enter first name"
                    />
                    {firstNameTouched && firstNameError && (
                      <span style={{ color: '#d32f2f', fontSize: '0.8rem', marginTop: '2px' }}>
                        {firstNameError}
                      </span>
                    )}
                  </label>
                  <label style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    Last Name *
                    <input 
                      type="text" 
                      name="lastName" 
                      value={userData.lastName}
                      onChange={handleUserDataChange}
                      onBlur={handleUserDataBlur}
                      required 
                      style={{
                        padding: '12px',
                        border: lastNameTouched && lastNameError ? '1px solid #d32f2f' : '1px solid #ddd',
                        borderRadius: '8px',
                        fontSize: '14px'
                      }}
                      placeholder="Enter last name"
                    />
                    {lastNameTouched && lastNameError && (
                      <span style={{ color: '#d32f2f', fontSize: '0.8rem', marginTop: '2px' }}>
                        {lastNameError}
                      </span>
                    )}
                  </label>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                  <label style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    Email Address *
                    <input 
                      type="email" 
                      name="email" 
                      value={userData.email}
                      onChange={handleUserDataChange}
                      onBlur={handleUserDataBlur}
                      required 
                      style={{
                        padding: '12px',
                        border: emailTouched && emailError ? '1px solid #d32f2f' : '1px solid #ddd',
                        borderRadius: '8px',
                        fontSize: '14px'
                      }}
                      placeholder="Enter email address"
                    />
                    {emailTouched && emailError && (
                      <span style={{ color: '#d32f2f', fontSize: '0.8rem', marginTop: '2px' }}>
                        {emailError}
                      </span>
                    )}
                  </label>
                  <label style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    Phone Number *
                    <input 
                      type="tel" 
                      name="phone" 
                      value={userData.phone}
                      onChange={handleUserDataChange}
                      onBlur={handleUserDataBlur}
                      required 
                      style={{
                        padding: '12px',
                        border: phoneTouched && phoneError ? '1px solid #d32f2f' : '1px solid #ddd',
                        borderRadius: '8px',
                        fontSize: '14px'
                      }}
                      placeholder="Enter phone number"
                    />
                    {phoneTouched && phoneError && (
                      <span style={{ color: '#d32f2f', fontSize: '0.8rem', marginTop: '2px' }}>
                        {phoneError}
                      </span>
                    )}
                  </label>
                </div>

                <label style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '16px' }}>
                  Special Instructions (Optional)
                  <textarea 
                    name="specialInstructions" 
                    value={userData.specialInstructions}
                    onChange={handleUserDataChange}
                    rows={3}
                    style={{
                      padding: '12px',
                      border: '1px solid #ddd',
                      borderRadius: '8px',
                      fontSize: '14px',
                      resize: 'vertical'
                    }}
                    placeholder="Any special instructions for the driver..."
                  />
                </label>
              </div>

              {/* Método de pago */}
              <div style={{ marginBottom: '24px' }}>
                <h3 style={{ marginBottom: '16px', color: '#333', fontSize: '1.2rem', fontWeight: '600' }}>
                  Payment Method
                </h3>
                <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
                  <div
                    className={paymentMethod === 'cash' ? 'payment-option selected' : 'payment-option'}
                    style={{
                      background: paymentMethod === 'cash' ? '#fff7f0' : 'transparent',
                      border: paymentMethod === 'cash' ? '2px solid #d32f2f' : '1.5px solid #e0e0e0',
                      borderRadius: '12px',
                      padding: '16px 24px',
                      cursor: 'pointer',
                      fontWeight: '600',
                      fontSize: '1.1rem',
                      color: '#d32f2f',
                      transition: 'all 0.2s',
                      textAlign: 'center',
                      minWidth: '120px'
                    }}
                    onClick={() => updateWizardState({ paymentMethod: 'cash' })}
                  >
                    <div style={{ fontSize: '2rem', marginBottom: '8px' }}>💵</div>
                    Cash
                    <div style={{ fontSize: '0.9rem', fontWeight: '400', color: '#666', marginTop: '4px' }}>
                      3.5% + $0.15 discount
                    </div>
                  </div>
                  <div
                    className={paymentMethod === 'invoice' ? 'payment-option selected' : 'payment-option'}
                    style={{
                      background: paymentMethod === 'invoice' ? '#f7fafd' : 'transparent',
                      border: paymentMethod === 'invoice' ? '2px solid #1976d2' : '1.5px solid #e0e0e0',
                      borderRadius: '12px',
                      padding: '16px 24px',
                      cursor: 'pointer',
                      fontWeight: '600',
                      fontSize: '1.1rem',
                      color: '#1976d2',
                      transition: 'all 0.2s',
                      textAlign: 'center',
                      minWidth: '120px'
                    }}
                    onClick={() => updateWizardState({ paymentMethod: 'invoice' })}
                  >
                    <div style={{ fontSize: '2rem', marginBottom: '8px' }}>📄</div>
                    Invoice
                    <div style={{ fontSize: '0.9rem', fontWeight: '400', color: '#666', marginTop: '4px' }}>
                      Pay later
                    </div>
                  </div>
                </div>
              </div>

              {/* Términos y condiciones */}
              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', cursor: 'pointer' }}>
                  <input 
                    type="checkbox" 
                    required 
                    style={{ marginTop: '2px' }}
                  />
                  <div style={{ fontSize: '0.9rem', lineHeight: '1.4' }}>
                    I agree to the <button style={{ color: '#d32f2f', textDecoration: 'underline' }}>Terms & Conditions</button> and 
                    <button style={{ color: '#d32f2f', textDecoration: 'underline' }}> Privacy Policy</button>
                  </div>
                </label>
              </div>
            </form>
            )}
          </div>
        );
      default:
        return null;
    }
  };

  if (!isLoaded) {
    return (
      <div className="wizard-container" style={{position: 'relative', minHeight: 400, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
        <span style={{fontSize: '1.2rem', color: '#d32f2f', fontWeight: 600}}>Loading map...</span>
      </div>
    );
  }

  return (
    <div className="wizard-container" style={{position: 'relative', width: '100%', height: '100%'}}>
      {/* Barra superior de botones */}
      <div style={{
        position: embedded ? 'absolute' : 'fixed',
        top: embedded ? 0 : 0,
        left: embedded ? 0 : 0,
        width: embedded ? '100%' : '100vw',
        background: '#fff',
        zIndex: 2000,
        display: 'flex',
        justifyContent: 'flex-end',
        alignItems: 'center',
        padding: '8px 12px',
        boxShadow: '0 2px 8px rgba(211,47,47,0.07)',
        gap: 8,
        minHeight: 48
      }}>
        {/* Home icon */}
        <button
          className="home-btn"
          style={{ position: 'static', marginRight: 8, fontSize: 22, padding: '6px 10px', minWidth: 0, background: 'none', border: 'none' }}
          onClick={() => updateWizardState({ currentStep: 0 })}
          title="Home"
        >
          🏠
        </button>
        {/* Help icon */}
        <button
          className="account-btn"
          style={{ fontSize: 22, padding: '6px 10px', minWidth: 0, marginRight: 8, background: 'none', border: 'none' }}
          onClick={e => { e.stopPropagation(); setShowHelp(v => !v); }}
          title="Help / Call for assistance"
        >
          📞
        </button>
        {showHelp && (
          <div onClick={stopPropagation} style={{ position: 'absolute', top: 48, right: 120, background: '#fff', border: '1.5px solid #d32f2f', borderRadius: 8, boxShadow: '0 2px 8px rgba(211,47,47,0.13)', padding: '18px 24px', zIndex: 2100, minWidth: 220 }}>
            <div style={{ fontWeight: 600, color: '#d32f2f', marginBottom: 6 }}>Need help?</div>
            <div style={{ fontSize: 15, color: '#333' }}>Call <b>305 484 4910</b> for assistance.</div>
          </div>
        )}
        {/* Login/Register or User icon */}
        {!wizardState.isLoggedIn ? (
          <>
            <button
              className="account-btn"
              style={{ fontSize: 22, padding: '6px 10px', minWidth: 0, marginRight: 8, background: 'none', border: 'none' }}
              onClick={onOpenLoginModal}
              title="Login"
            >
              👤
            </button>
            {/* Register button deshabilitado/oculto */}
            {/* <button
              className="account-btn"
              style={{ fontSize: 22, padding: '6px 10px', minWidth: 0, background: 'none', border: 'none' }}
              onClick={() => updateWizardState({ showAuthForm: true, checkoutType: 'account' })}
              title="Register"
            >
              ➕
            </button> */}
          </>
        ) : (
          <div style={{ position: 'relative' }}>
            <button
              className="account-btn"
              style={{ fontSize: 22, padding: '6px 10px', minWidth: 0, background: 'none', border: 'none' }}
              onClick={e => { e.stopPropagation(); setShowUserMenu(v => !v); }}
              title={`Account: ${wizardState.userData.firstName || 'User'}`}
            >
              👤
            </button>
            {showUserMenu && (
              <div onClick={stopPropagation} style={{ position: 'absolute', top: 40, right: 0, background: '#fff', border: '1.5px solid #d32f2f', borderRadius: 8, boxShadow: '0 2px 8px rgba(211,47,47,0.13)', padding: '12px 0', zIndex: 2100, minWidth: 160 }}>
                <div style={{ padding: '10px 18px', color: '#222', fontWeight: 600 }}>Hello, {wizardState.userData.firstName || 'User'}</div>
                <button className="account-btn" style={{ width: '100%', border: 'none', borderRadius: 0, textAlign: 'left', padding: '10px 18px', background: 'none', color: '#d32f2f' }} onClick={onOpenDashboard}>My Account</button>
                <button className="account-btn" style={{ width: '100%', border: 'none', borderRadius: 0, textAlign: 'left', padding: '10px 18px', background: 'none', color: '#d32f2f' }} onClick={() => updateWizardState({ isLoggedIn: false, userData: { firstName: '', lastName: '', email: '', phone: '', specialInstructions: '' } })}>Log out</button>
              </div>
            )}
          </div>
        )}
      </div>
      {/* Espacio para que el contenido no quede tapado */}
      <div style={{ height: 56 }} />
      <div className="wizard-steps" style={{ gap: window.innerWidth <= 600 ? 4 : 30, marginBottom: window.innerWidth <= 600 ? 18 : 38 }}>
        {steps.map((step, idx) => {
          // Determinar si el tab debe estar habilitado
          const isEnabled = idx === 0 || // Trip Info siempre habilitado
                           (idx === 1 && isTripValid()) || // Vehicle Info solo si trip es válido
                           (idx === 2 && isTripValid() && vehicleSelected); // Payment & Summary solo si trip es válido y vehículo seleccionado
          // Iconos para tabs
          const tabIcons = ['🧭', '🚐', '💳'];
          const tabLabels = ['Trip', 'Vehicle', 'Payment & Summary'];
          return (
            <div
              key={step}
              className={`wizard-step${idx === currentStep ? ' active' : ''}${!isEnabled ? ' disabled' : ''}`}
              onClick={() => {
                if (isEnabled) {
                  updateWizardState({ currentStep: idx });
                }
              }}
              style={{
                opacity: isEnabled ? 1 : 0.5,
                cursor: isEnabled ? 'pointer' : 'not-allowed',
                position: 'relative',
                padding: window.innerWidth <= 600 ? '6px 0 4px 0' : undefined,
                fontSize: window.innerWidth <= 600 ? 16 : undefined,
                minWidth: window.innerWidth <= 600 ? 44 : undefined,
                flexDirection: window.innerWidth <= 600 ? 'column' : undefined,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: window.innerWidth <= 600 ? 2 : 0
              }}
            >
              <span style={{ fontSize: window.innerWidth <= 600 ? 20 : 22, lineHeight: 1 }}>{tabIcons[idx]}</span>
              <span style={{ fontSize: window.innerWidth <= 600 ? 11 : 15, fontWeight: 600, marginTop: 2 }}>{tabLabels[idx]}</span>
              {!isEnabled && (
                <div style={{
                  position: 'absolute',
                  top: '-8px',
                  right: '-8px',
                  width: '16px',
                  height: '16px',
                  background: '#ccc',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '10px',
                  color: '#fff',
                  fontWeight: 'bold'
                }}>
                  🔒
                </div>
              )}
            </div>
          );
        })}
      </div>
      <div className="wizard-content">
        {renderStep()}
      </div>
      <div className="wizard-navigation">
        <button
          onClick={() => updateWizardState({ currentStep: Math.max(currentStep - 1, 0) })}
          disabled={currentStep === 0}
          style={{
            background: '#d32f2f',
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            padding: '12px 24px',
            fontSize: '1.1rem',
            fontWeight: '600',
            cursor: currentStep === 0 ? 'not-allowed' : 'pointer',
            opacity: currentStep === 0 ? 0.5 : 1,
            transition: 'all 0.2s ease',
            boxShadow: '0 2px 8px rgba(211, 47, 47, 0.2)',
            minWidth: '120px'
          }}
          onMouseEnter={(e) => {
            if (currentStep !== 0) {
              e.currentTarget.style.transform = 'translateY(-1px)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(211, 47, 47, 0.3)';
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 2px 8px rgba(211, 47, 47, 0.2)';
          }}
        >
          Back
        </button>
        <button
          onClick={handleNext}
          disabled={
            (currentStep === 0 && !isTripValid()) ||
            (currentStep === 1 && !vehicleSelected) || 
            (currentStep === 2 && !checkoutType)
          }
          style={{
            background: currentStep === steps.length - 1 ? '#28a745' : '#d32f2f',
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            padding: '12px 24px',
            fontSize: '1.1rem',
            fontWeight: '600',
            cursor: (currentStep === 0 && !isTripValid()) || (currentStep === 1 && !vehicleSelected) || (currentStep === 2 && !checkoutType) ? 'not-allowed' : 'pointer',
            opacity: (currentStep === 0 && !isTripValid()) || (currentStep === 1 && !vehicleSelected) || (currentStep === 2 && !checkoutType) ? 0.5 : 1,
            transition: 'all 0.2s ease',
            boxShadow: currentStep === steps.length - 1 ? '0 2px 8px rgba(40, 167, 69, 0.2)' : '0 2px 8px rgba(211, 47, 47, 0.2)',
            minWidth: '120px'
          }}
          onMouseEnter={(e) => {
            if (!((currentStep === 0 && !isTripValid()) || (currentStep === 1 && !vehicleSelected) || (currentStep === 2 && !checkoutType))) {
              e.currentTarget.style.transform = 'translateY(-1px)';
              e.currentTarget.style.boxShadow = currentStep === steps.length - 1 ? '0 4px 12px rgba(40, 167, 69, 0.3)' : '0 4px 12px rgba(211, 47, 47, 0.3)';
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = currentStep === steps.length - 1 ? '0 2px 8px rgba(40, 167, 69, 0.2)' : '0 2px 8px rgba(211, 47, 47, 0.2)';
          }}
        >
          {currentStep === steps.length - 1 ? 'Confirm Booking' : 'Next'}
        </button>
      </div>
      
      {/* Popup de confirmación */}
      <ConfirmationPopup
        isOpen={showConfirmationPopup}
        onClose={() => {
          setShowConfirmationPopup(false);
          resetForm(); // Resetear el formulario cuando se cierre el popup
        }}
        outboundNumber={confirmationNumbers.outbound}
        returnNumber={confirmationNumbers.return}
      />
    </div>
  );
};

export default Wizard; 