import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useLoadScript, Autocomplete } from '@react-google-maps/api';
import { GOOGLE_MAPS_API_KEY } from '../config/constants';
import { useGlobalRouteCalculation } from '../hooks/useGlobalRouteCalculation';
import CustomerAutocomplete from './CustomerAutocomplete';
import './BookingEditor.css';

// Iconos para los botones
const SaveIcon = () => <span style={{ marginRight: '8px' }}>💾</span>;
const EmailIcon = () => <span style={{ marginRight: '8px' }}>📧</span>;
const PaymentsIcon = () => <span style={{ marginRight: '8px' }}>💳</span>;
const RoundTripIcon = () => <span style={{ marginRight: '8px' }}>🔄</span>;
const CopyIcon = () => <span style={{ marginRight: '8px' }}>📋</span>;
const DeleteIcon = () => <span style={{ marginRight: '8px' }}>🗑️</span>;



interface BookingEditorProps {
  booking?: any; // Make booking optional for creating new bookings
  onSave: (updatedBooking: any) => void;
  onCancel: () => void;
  onClose: () => void;
  onDelete?: () => void; // New prop for handling booking deletion
  isCreating?: boolean; // New prop to indicate if we're creating a new booking
}

interface FormData {
  // User Data
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  specialInstructions: string;
  
  // Additional Information
  groupName: string;
  occasion: string;
  greetingSign: string;
  timeZone: string;
  
  // Trip Information
  pickup: string;
  dropoff: string;
  date: string;

  pickupDate: string;
  pickupHour: string;
  pickupMinute: string;
  pickupPeriod: string;
  additionalStops: string[];
  routeDistance: string;
  routeDuration: string;
  passengers: number;
  checkedLuggage: number;
  carryOn: number;
  infantSeats: number;
  toddlerSeats: number;
  boosterSeats: number;
  flight: string;
  airportCode: string;
  terminalGate: string;
  meetOption: string;
  
  // Round Trip Information
  roundTrip: boolean;
  returnDate: string;
  returnHour: string;
  returnMinute: string;
  returnPeriod: string;
  returnFlight: string;
  
  // Service & Vehicle
  serviceType: string;
  vehicleType: string;
  
  // Payment and Status
  paymentMethod: 'cash' | 'invoice' | 'credit_card' | 'zelle';
  checkoutType: 'guest' | 'account';
  isLoggedIn: boolean;
  status: 'Unassigned' | 'Assigned' | 'On the way' | 'Arrived' | 'Customer in car' | 'Customer dropped off' | 'Customer dropped off - Pending payment' | 'Done' | 'No Show' | 'Canceled';
  totalPrice: number;
  
  // Price Breakdown Components
  calculatedPrice: number;
  bookingFee: number;
  childSeatsCharge: number;
  discountPercentage: number;
  discountFixed: number;
  roundTripDiscount: number;
  gratuityPercentage: number;
  gratuityFixed: number;
  taxesPercentage: number;
  taxesFixed: number;
  creditCardFeePercentage: number;
  creditCardFeeFixed: number;
  
  // Backend Price Breakdown (from new API)
  basePrice: number;
  distancePrice: number;
  stopsCharge: number;
  returnTripPrice: number;
  subtotal: number;
  paymentDiscount: number;
  areaName: string;
  pricingMethod: string;
  distance: number;
  surgeMultiplier: number;
  surgeName: string;
  
  // Assignment
  assignedDriver: string;
  assignedVehicle: string;
  notes: string;
  dispatchNotes: string;
  
  // Notifications
  sendConfirmations: string;
  changeNotifications: string;
  customerId?: string; // Optional customer ID
}

const BookingEditor: React.FC<BookingEditorProps> = ({ booking, onSave, onCancel, onClose, onDelete, isCreating = false }) => {
  // Google Maps setup for autocomplete
  const libraries: ("places")[] = ["places"];
  const { isLoaded } = useLoadScript({
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
    libraries,
  });

  // Global route calculation hook
  const { routeInfo, isCalculating, calculateRoute, clearRoute } = useGlobalRouteCalculation();

  // Autocomplete refs
  const pickupAutocomplete = useRef<google.maps.places.Autocomplete | null>(null);
  const dropoffAutocomplete = useRef<google.maps.places.Autocomplete | null>(null);
  const stopAutocompletes = useRef<(google.maps.places.Autocomplete | null)[]>([]);

  // Vehicle types state
  const [vehicleTypes, setVehicleTypes] = useState<any[]>([]);
  const [vehicleTypesLoading, setVehicleTypesLoading] = useState(false);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [vehiclesLoading, setVehiclesLoading] = useState(false);
  
  // Drivers state
  const [drivers, setDrivers] = useState<any[]>([]);
  const [driversLoading, setDriversLoading] = useState(false);

  // Function to map incorrect vehicle type names to correct ones
  const mapVehicleTypeName = (vehicleTypeName: string): string => {
    const vehicleTypeMap: { [key: string]: string } = {
      'Luxury Sedan (SED)': 'minivan',
      'SUV (SUV)': 'minivan',
      'Minivan (MIN)': 'minivan',
      'Luxury Sedan': 'minivan',
      'Standard Sedan': 'minivan',
      'Premium Sedan': 'minivan',
      'Luxury SUV': 'minivan',
      'Standard SUV': 'minivan',
      'Premium SUV': 'minivan',
      'Standard Minivan': 'minivan',
      'Premium Minivan': 'minivan',
      'Sedan': 'minivan',
      'Minivan': 'minivan',
      'SUV': 'minivan',
      'test': 'test'
    };
    
    return vehicleTypeMap[vehicleTypeName] || vehicleTypeName;
  };

  // Function to load vehicle types from backend
  const loadVehicleTypes = async () => {
    setVehicleTypesLoading(true);
    try {
      const response = await fetch('/api/vehicle-types');
      if (response.ok) {
        const data = await response.json();
        setVehicleTypes(data);
        console.log('Vehicle types loaded:', data);
      } else {
        console.error('Error loading vehicle types:', response.status);
      }
    } catch (error) {
      console.error('Error loading vehicle types:', error);
    } finally {
      setVehicleTypesLoading(false);
    }
  };

  // Function to load vehicles from backend
  const loadVehicles = async () => {
    setVehiclesLoading(true);
    try {
      const response = await fetch('/api/vehicles', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken') || localStorage.getItem('token')}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        const vehiclesData = data.vehicles || data;
        setVehicles(vehiclesData);
        console.log('Vehicles loaded:', vehiclesData);
        console.log('Vehicle types in vehicles:', vehiclesData.map((v: any) => ({ 
          id: v._id, 
          licensePlate: v.licensePlate, 
          vehicleType: v.vehicleType 
        })));
      } else {
        console.error('Error loading vehicles:', response.status);
      }
    } catch (error) {
      console.error('Error loading vehicles:', error);
    } finally {
      setVehiclesLoading(false);
    }
  };

  // Function to load drivers from backend
  const loadDrivers = async () => {
    setDriversLoading(true);
    try {
      const response = await fetch('/api/drivers', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken') || localStorage.getItem('token')}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        const driversData = data.drivers || data;
        setDrivers(driversData);
        console.log('Drivers loaded:', driversData);
      } else {
        console.error('Error loading drivers:', response.status);
      }
    } catch (error) {
      console.error('Error loading drivers:', error);
    } finally {
      setDriversLoading(false);
    }
  };

  // Load vehicle types, vehicles and drivers on component mount
  useEffect(() => {
    loadVehicleTypes();
    loadVehicles();
    loadDrivers();
  }, []);

  // Define calculateTotalPrice function before using it
  const calculateTotalPrice = (calculatedPrice: number, currentFormData: FormData) => {
    let total = calculatedPrice;
    
    // Add booking fee
    total += currentFormData.bookingFee;
    
    // Add child seats charge
    total += currentFormData.childSeatsCharge;
    
    // Apply percentage discount (on calculated price)
    total -= (calculatedPrice * currentFormData.discountPercentage / 100);
    
    // Apply fixed discount
    total -= currentFormData.discountFixed;
    
    // Apply round trip discount
    total -= currentFormData.roundTripDiscount;
    
    // Add gratuity (percentage on calculated price)
    total += (calculatedPrice * currentFormData.gratuityPercentage / 100);
    
    // Add gratuity (fixed)
    total += currentFormData.gratuityFixed;
    
    // Add taxes (percentage on calculated price)
    total += (calculatedPrice * currentFormData.taxesPercentage / 100);
    
    // Add taxes (fixed)
    total += currentFormData.taxesFixed;
    
    // Add credit card fee (percentage on current total)
    if (currentFormData.paymentMethod === 'credit_card') {
      total += (total * currentFormData.creditCardFeePercentage / 100);
      total += currentFormData.creditCardFeeFixed;
    }
    
    return Math.max(0, total);
  };

  // Helper function to calculate subtotal before credit card fees
  const calculateSubtotal = (calculatedPrice: number, currentFormData: FormData) => {
    let subtotal = calculatedPrice;
    
    // Add booking fee
    subtotal += currentFormData.bookingFee;
    
    // Add child seats charge
    subtotal += currentFormData.childSeatsCharge;
    
    // Apply percentage discount (on calculated price)
    subtotal -= (calculatedPrice * currentFormData.discountPercentage / 100);
    
    // Apply fixed discount
    subtotal -= currentFormData.discountFixed;
    
    // Apply round trip discount
    subtotal -= currentFormData.roundTripDiscount;
    
    // Add gratuity (percentage on calculated price)
    subtotal += (calculatedPrice * currentFormData.gratuityPercentage / 100);
    
    // Add gratuity (fixed)
    subtotal += currentFormData.gratuityFixed;
    
    // Add taxes (percentage on calculated price)
    subtotal += (calculatedPrice * currentFormData.taxesPercentage / 100);
    
    // Add taxes (fixed)
    subtotal += currentFormData.taxesFixed;
    
    return Math.max(0, subtotal);
  };

  const [formData, setFormData] = useState<FormData>(() => {
    const initialData: FormData = {
      // User Data
      firstName: booking?.userData?.firstName || '',
      lastName: booking?.userData?.lastName || '',
      email: booking?.userData?.email || '',
      phone: booking?.userData?.phone || '',
      specialInstructions: booking?.userData?.specialInstructions || '',
      
      // Additional Information
      groupName: booking?.groupName || '',
      occasion: booking?.occasion || '',
      greetingSign: booking?.greetingSign || '',
      timeZone: booking?.timeZone || 'America/New_York',
      
      // Trip Information
      pickup: booking?.tripInfo?.pickup || '',
      dropoff: booking?.tripInfo?.dropoff || '',
      date: booking?.tripInfo?.date || '',
      pickupDate: booking?.tripInfo?.pickupDate || booking?.tripInfo?.date || '',
      pickupHour: booking?.tripInfo?.pickupHour || '12',
      pickupMinute: booking?.tripInfo?.pickupMinute || '00',
      pickupPeriod: booking?.tripInfo?.pickupPeriod || 'AM',
      additionalStops: (() => {
        const stopsFromDB = booking?.tripInfo?.stops;
        console.log('Using stops field:', stopsFromDB);
        console.log('Type:', typeof stopsFromDB);
        console.log('Is array:', Array.isArray(stopsFromDB));
        
        if (Array.isArray(stopsFromDB)) {
          const validStops = stopsFromDB.filter((stop: any) => stop && stop.trim() !== '');
          console.log('Valid stops found:', validStops);
          console.log('Valid stops count:', validStops.length);
          return validStops;
        } else if (typeof stopsFromDB === 'string' && stopsFromDB.trim() !== '') {
          // Si es un string, convertirlo a array
          console.log('Single stop as string found:', stopsFromDB);
          return [stopsFromDB];
        } else {
          console.log('No valid stops found');
          return [];
        }
      })(),
      routeDistance: booking?.tripInfo?.routeDistance || '',
      routeDuration: booking?.tripInfo?.routeDuration || '',
      passengers: booking?.tripInfo?.passengers || 1,
      checkedLuggage: booking?.tripInfo?.checkedLuggage || 0,
      carryOn: booking?.tripInfo?.carryOn || 0,
      infantSeats: booking?.tripInfo?.infantSeats || 0,
      toddlerSeats: booking?.tripInfo?.toddlerSeats || 0,
      boosterSeats: booking?.tripInfo?.boosterSeats || 0,
      flight: booking?.tripInfo?.flight || '',
      airportCode: booking?.tripInfo?.airportCode || '',
      terminalGate: booking?.tripInfo?.terminalGate || '',
      meetOption: booking?.tripInfo?.meetOption || 'When your flight arrives',
      
      // Round Trip Information
      roundTrip: booking?.tripInfo?.roundTrip || false,
      returnDate: booking?.tripInfo?.returnDate || '',
      returnHour: booking?.tripInfo?.returnHour || '',
      returnMinute: booking?.tripInfo?.returnMinute || '',
      returnPeriod: booking?.tripInfo?.returnPeriod || 'AM',
      returnFlight: booking?.tripInfo?.returnFlight || '',
      
      // Service & Vehicle
      serviceType: booking?.serviceType || 'Hourly/As Directed',
      vehicleType: booking?.vehicleType || '',
      
      // Payment and Status
      paymentMethod: booking?.paymentMethod || 'cash',
      checkoutType: booking?.checkoutType || 'guest',
      isLoggedIn: booking?.isLoggedIn || false,
      status: booking?.status || 'Unassigned',
      totalPrice: booking?.totalPrice || 0,
      
      // Price Breakdown Components
      calculatedPrice: booking?.calculatedPrice || booking?.totalPrice || 0,
      bookingFee: booking?.bookingFee || 0,
      childSeatsCharge: booking?.childSeatsCharge || 0,
      discountPercentage: booking?.discountPercentage || 0,
      discountFixed: booking?.discountFixed || 0,
      roundTripDiscount: booking?.roundTripDiscount || 0,
      gratuityPercentage: booking?.gratuityPercentage || 0,
      gratuityFixed: booking?.gratuityFixed || 0,
      taxesPercentage: booking?.taxesPercentage || 0,
      taxesFixed: booking?.taxesFixed || 0,
      creditCardFeePercentage: booking?.creditCardFeePercentage || 0,
      creditCardFeeFixed: booking?.creditCardFeeFixed || 0,
      
      // Backend Price Breakdown (from new API)
      basePrice: booking?.basePrice || 0,
      distancePrice: booking?.distancePrice || 0,
      stopsCharge: booking?.stopsCharge || 0,
      returnTripPrice: booking?.returnTripPrice || 0,
      subtotal: booking?.subtotal || 0,
      paymentDiscount: booking?.paymentDiscount || 0,
      areaName: booking?.areaName || '',
      pricingMethod: booking?.pricingMethod || '',
      distance: booking?.distance || 0,
      surgeMultiplier: booking?.surgeMultiplier || 1,
      surgeName: booking?.surgeName || '',
      
      // Assignment - Convert ObjectId to string for frontend
      assignedDriver: booking?.assignedDriver || '',
      assignedVehicle: booking?.assignedVehicle ? (typeof booking.assignedVehicle === 'object' ? booking.assignedVehicle._id || booking.assignedVehicle.toString() : booking.assignedVehicle.toString()) : '',
      notes: booking?.notes || '',
      dispatchNotes: booking?.dispatchNotes || '',
      
      // Notifications
      sendConfirmations: booking?.sendConfirmations || 'Do Not Send',
      changeNotifications: booking?.changeNotifications || 'Do Not Send'
    };

    // Recalculate total price based on all components
    const calculatedTotal = calculateTotalPrice(initialData.calculatedPrice, initialData);
    initialData.totalPrice = calculatedTotal;

    console.log('Initial form data loaded:', initialData);
    console.log('Date from DB:', booking?.tripInfo?.date);
    console.log('Date in form data:', initialData.date);
    console.log('Processed additional stops:', initialData.additionalStops);
    console.log('Additional stops count:', initialData.additionalStops.length);
    console.log('Assigned vehicle from DB:', booking?.assignedVehicle);
    console.log('Assigned vehicle in form:', initialData.assignedVehicle);
    console.log('Status from DB:', booking?.status);
    console.log('Status in form:', initialData.status);
    console.log('Vehicle type from DB:', booking?.vehicleType);
    console.log('Vehicle type in form:', initialData.vehicleType);
    console.log('Assigned driver from DB:', booking?.assignedDriver);
    console.log('Assigned driver in form:', initialData.assignedDriver);
    return initialData;
  });

  const [isLoading, setIsLoading] = useState(false);
  const [priceLoading, setPriceLoading] = useState(false);
  const [priceError, setPriceError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<{[key: string]: string}>({});
  const [hasBeenSaved, setHasBeenSaved] = useState(!isCreating);
  
  // Email modal states
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailTemplates, setEmailTemplates] = useState<any[]>([]);
  const [selectedEmailTemplate, setSelectedEmailTemplate] = useState<any>(null);
  const [emailLoading, setEmailLoading] = useState(false);

  // Round trip modal states
  const [showRoundTripModal, setShowRoundTripModal] = useState(false);
  const [roundTripData, setRoundTripData] = useState({
    returnDate: '',
    returnHour: '12',
    returnMinute: '00',
    returnPeriod: 'PM'
  });
  const [emailMessage, setEmailMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);





  // Set default vehicle type when vehicle types are loaded
  useEffect(() => {
    if (vehicleTypes.length > 0 && !formData.vehicleType) {
      const defaultVehicleType = vehicleTypes.find(type => type.isActive) || vehicleTypes[0];
      if (defaultVehicleType) {
        setFormData(prev => ({
          ...prev,
          vehicleType: defaultVehicleType._id || defaultVehicleType.id
        }));
      }
    }
  }, [vehicleTypes, formData.vehicleType]);

  // Initial route calculation is now handled by the main useEffect


  

  






  // Handle input changes
  const handleInputChange = useCallback((field: keyof FormData, value: string | number | boolean) => {
    // Clear validation error for this field when user starts typing
    if (validationErrors[field]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
    
    // Clear round trip validation errors when round trip is unchecked
    if (field === 'roundTrip' && !value) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.returnDate;
        delete newErrors.returnTime;
        return newErrors;
      });
    }
    
    // Reset hasBeenSaved when user makes changes (for existing bookings)
    if (!isCreating && hasBeenSaved) {
      console.log('User made changes, resetting hasBeenSaved to false');
      setHasBeenSaved(false);
    }
    
    setFormData((prev: FormData) => {
      const updated = { ...prev, [field]: value };
      
      // Recalculate total price when payment method changes (for credit card fees)
      if (field === 'paymentMethod') {
        updated.totalPrice = calculateTotalPrice(updated.calculatedPrice, updated);
      }
      
      return updated;
    });
  }, [calculateTotalPrice, validationErrors, isCreating, hasBeenSaved]);

  // Handle customer selection from autocomplete
  const handleCustomerSelect = useCallback((customer: any) => {
    setFormData((prev: FormData) => ({
      ...prev,
      firstName: customer.firstName,
      lastName: customer.lastName,
      email: customer.email,
      phone: customer.phone,
      customerId: customer._id // Store the customer ID when selecting existing customer
    }));

    // Clear validation errors for customer fields
    setValidationErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors.firstName;
      delete newErrors.lastName;
      delete newErrors.email;
      delete newErrors.phone;
      return newErrors;
    });
  }, []);

  // Auto-recalculate price when vehicle type changes (only for new bookings or when explicitly needed)
  useEffect(() => {
    if (formData.vehicleType && formData.pickup && formData.dropoff && isCreating) {
      // Only auto-recalculate for new bookings and avoid if already calculating
      if (!isCalculating) {
        const timeoutId = setTimeout(() => {
          handleRecalculatePrice();
        }, 500);
        
        return () => clearTimeout(timeoutId);
      }
    }
  }, [formData.vehicleType, isCreating, isCalculating]);







  // Add additional stop
  const addAdditionalStop = () => {
    setFormData(prev => {
      const newStops = [...prev.additionalStops, ''];
      console.log('Adding stop. New stops array:', newStops);
      return {
        ...prev,
        additionalStops: newStops
      };
    });
    // Route info is now handled globally
  };

  // Remove additional stop
  const removeAdditionalStop = (index: number) => {
    setFormData(prev => ({
      ...prev,
      additionalStops: prev.additionalStops.filter((_, i) => i !== index)
    }));
    // Route calculation will be triggered by useEffect
  };

  // Update additional stop
  const updateAdditionalStop = (index: number, value: string) => {
    setFormData(prev => {
      const updatedStops = prev.additionalStops.map((stop, i) => i === index ? value : stop);
      console.log(`Updating stop ${index} to "${value}". Updated stops:`, updatedStops);
      return {
        ...prev,
        additionalStops: updatedStops
      };
    });
    // Ya no recalcula automáticamente aquí para evitar llamadas excesivas
  };



  const handleNumberInputChange = (field: keyof FormData, value: string) => {
    const numValue = value === '' ? 0 : parseInt(value) || 0;
    
    // Reset hasBeenSaved when user makes changes (for existing bookings)
    if (!isCreating && hasBeenSaved) {
      console.log('User made changes (number input), resetting hasBeenSaved to false');
      setHasBeenSaved(false);
    }
    
    setFormData((prev: FormData) => ({
      ...prev,
      [field]: numValue
    }));
  };

  const handlePriceInputChange = (field: keyof FormData, value: string) => {
    const priceValue = value === '' ? 0 : parseFloat(value) || 0;
    
    // Reset hasBeenSaved when user makes changes (for existing bookings)
    if (!isCreating && hasBeenSaved) {
      console.log('User made changes (price input), resetting hasBeenSaved to false');
      setHasBeenSaved(false);
    }
    
    setFormData((prev: FormData) => ({
      ...prev,
      [field]: priceValue
    }));
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to move this booking to trash? You can restore it later from the trash.')) {
      return;
    }

    setIsLoading(true);
    try {
      // Get token from localStorage (use adminToken for admin portal)
      const token = localStorage.getItem('adminToken') || localStorage.getItem('token');
      
      if (!token) {
        throw new Error('No authentication token found. Please log in again.');
      }

      const url = `/api/bookings/${booking._id}`;

      const response = await fetch(url, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      alert('Booking moved to trash successfully. You can restore it later from the trash.');
      
      // Call the onDelete callback if provided (this will refresh the calendar)
      if (onDelete) {
        onDelete();
      } else {
        onClose(); // Fallback to just closing if no onDelete callback
      }
    } catch (error) {
      console.error('Error moving booking to trash:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      alert(`Error moving booking to trash: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRoundTrip = async () => {
    // Validate return date and time
    if (!roundTripData.returnDate) {
      alert('Please select a return date');
      return;
    }

    if (!roundTripData.returnHour || !roundTripData.returnMinute || !roundTripData.returnPeriod) {
      alert('Please select a return time');
      return;
    }

    setIsLoading(true);
    try {
      // Get token from localStorage
      const token = localStorage.getItem('adminToken') || localStorage.getItem('token');
      
      if (!token) {
        throw new Error('No authentication token found. Please log in again.');
      }

      // Create return booking data following the same structure as handleSave
      const returnBookingData = {
        customerId: formData.customerId,
        userData: {
          firstName: formData.firstName,
          lastName: formData.lastName,
          phone: formData.phone,
          email: formData.email,
          specialInstructions: formData.specialInstructions
        },
        tripInfo: {
          // Invert pickup and dropoff
          pickup: formData.dropoff,
          dropoff: formData.pickup,
          date: roundTripData.returnDate,
          pickupDate: roundTripData.returnDate,
          pickupHour: roundTripData.returnHour,
          pickupMinute: roundTripData.returnMinute,
          pickupPeriod: roundTripData.returnPeriod,
          stops: formData.additionalStops,
          routeDistance: formData.routeDistance,
          routeDuration: formData.routeDuration,
          passengers: formData.passengers,
          checkedLuggage: formData.checkedLuggage,
          carryOn: formData.carryOn,
          infantSeats: formData.infantSeats,
          toddlerSeats: formData.toddlerSeats,
          boosterSeats: formData.boosterSeats,
          flight: formData.flight,
          airportCode: formData.airportCode,
          terminalGate: formData.terminalGate,
          meetOption: formData.meetOption,
          roundTrip: false, // Set to false for return journey
          returnDate: '',
          returnHour: '',
          returnMinute: '',
          returnPeriod: '',
          returnFlight: ''
        },
        groupName: formData.groupName,
        occasion: formData.occasion,
        greetingSign: formData.greetingSign,
        timeZone: formData.timeZone,
        serviceType: formData.serviceType,
        vehicleType: formData.vehicleType,
        paymentMethod: formData.paymentMethod,
        checkoutType: formData.checkoutType,
        isLoggedIn: formData.isLoggedIn,
        status: 'Pending',
        totalPrice: 0, // Reset pricing for manual calculation
        calculatedPrice: null,
        bookingFee: 0,
        childSeatsCharge: 0,
        discountPercentage: 0,
        discountFixed: 0,
        roundTripDiscount: 0,
        gratuityPercentage: 0,
        gratuityFixed: 0,
        taxesPercentage: 0,
        taxesFixed: 0,
        basePrice: 0,
        distancePrice: 0,
        surgeMultiplier: 1,
        surgeName: '',
        stopsCharge: 0,
        returnTripPrice: 0,
        subtotal: 0,
        finalTotal: 0,
        paymentDiscount: 0,
        paymentDiscountDescription: '',
        areaName: '',
        pricingMethod: 'distance'
      };

      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(returnBookingData)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      alert(`Return booking created successfully! Confirmation Number: ${result.outboundConfirmationNumber}`);
      
      // Close modal and refresh data
      setShowRoundTripModal(false);
      setRoundTripData({
        returnDate: '',
        returnHour: '12',
        returnMinute: '00',
        returnPeriod: 'PM'
      });

      // Call onSave to refresh the parent component
      if (onSave) {
        onSave(result);
      }

    } catch (error) {
      console.error('Error creating return booking:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      alert(`Error creating return booking: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Validation function
  const validateForm = (): boolean => {
    const errors: {[key: string]: string} = {};
    
    // Required user data fields
    if (!formData.firstName.trim()) {
      errors.firstName = 'First name is required';
    }
    if (!formData.lastName.trim()) {
      errors.lastName = 'Last name is required';
    }
    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Please enter a valid email address';
    }
    if (!formData.phone.trim()) {
      errors.phone = 'Phone number is required';
    }
    
    // Required trip information
    if (!formData.date) {
      errors.date = 'Trip date is required';
    }
    if (!formData.pickupHour || !formData.pickupMinute) {
      errors.pickupTime = 'Pickup time is required';
    }
    if (!formData.pickup.trim()) {
      errors.pickup = 'Pickup location is required';
    }
    if (!formData.dropoff.trim()) {
      errors.dropoff = 'Dropoff location is required';
    }
    if (formData.passengers < 1) {
      errors.passengers = 'At least 1 passenger is required';
    }
    
    // Round trip validation
    if (formData.roundTrip) {
      if (!formData.returnDate) {
        errors.returnDate = 'Return date is required for round trips';
      }
      if (!formData.returnHour || !formData.returnMinute) {
        errors.returnTime = 'Return time is required for round trips';
      }
    }
    
    setValidationErrors(errors);
    
    if (Object.keys(errors).length > 0) {
      // Scroll to first error
      const firstErrorField = document.querySelector('.field-error') as HTMLElement;
      if (firstErrorField) {
        firstErrorField.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return false;
    }
    
    return true;
  };

  const handleSave = async () => {
    // Validate form before saving
    if (!validateForm()) {
      return;
    }
    
    setIsLoading(true);
    try {
      // Convert empty string to null for assignedVehicle to avoid validation issues
      const assignedVehicleValue = formData.assignedVehicle && formData.assignedVehicle.trim() !== '' 
        ? formData.assignedVehicle 
        : null;

      const updatedBooking = {
        ...booking,
        customerId: formData.customerId, // Include customer ID if selected from autocomplete
        userData: {
          firstName: formData.firstName,
          lastName: formData.lastName,
          phone: formData.phone,
          email: formData.email,
          specialInstructions: formData.specialInstructions
        },
        tripInfo: {
          pickup: formData.pickup,
          dropoff: formData.dropoff,
          date: formData.date,
    
          pickupDate: formData.pickupDate,
          pickupHour: formData.pickupHour,
          pickupMinute: formData.pickupMinute,
          pickupPeriod: formData.pickupPeriod,
          stops: formData.additionalStops, // Guardar en el campo 'stops' de la base de datos
          routeDistance: formData.routeDistance,
          routeDuration: formData.routeDuration,
          passengers: formData.passengers,
          checkedLuggage: formData.checkedLuggage,
          carryOn: formData.carryOn,
          infantSeats: formData.infantSeats,
          toddlerSeats: formData.toddlerSeats,
          boosterSeats: formData.boosterSeats,
          flight: formData.flight,
          airportCode: formData.airportCode,
          terminalGate: formData.terminalGate,
          meetOption: formData.meetOption,
          roundTrip: formData.roundTrip,
          returnDate: formData.returnDate,
          returnHour: formData.returnHour,
          returnMinute: formData.returnMinute,
          returnPeriod: formData.returnPeriod,
          returnFlight: formData.returnFlight
        },
        groupName: formData.groupName,
        occasion: formData.occasion,
        greetingSign: formData.greetingSign,
        timeZone: formData.timeZone,
        serviceType: formData.serviceType,
        vehicleType: formData.vehicleType,
        paymentMethod: formData.paymentMethod,
        checkoutType: formData.checkoutType,
        isLoggedIn: formData.isLoggedIn,
        status: formData.status,
        totalPrice: formData.totalPrice,
        // Price breakdown components
        calculatedPrice: formData.calculatedPrice,
        bookingFee: formData.bookingFee,
        childSeatsCharge: formData.childSeatsCharge,
        discountPercentage: formData.discountPercentage,
        discountFixed: formData.discountFixed,
        roundTripDiscount: formData.roundTripDiscount,
        gratuityPercentage: formData.gratuityPercentage,
        gratuityFixed: formData.gratuityFixed,
        taxesPercentage: formData.taxesPercentage,
        taxesFixed: formData.taxesFixed,
        creditCardFeePercentage: formData.creditCardFeePercentage,
        creditCardFeeFixed: formData.creditCardFeeFixed,
        assignedDriver: formData.assignedDriver || null,
        assignedVehicle: assignedVehicleValue,
        notes: formData.notes,
        dispatchNotes: formData.dispatchNotes,
        sendConfirmations: formData.sendConfirmations,
        changeNotifications: formData.changeNotifications
      };
      
      console.log('Saving booking with assignment data:', {
        assignedDriver: formData.assignedDriver,
        assignedVehicle: assignedVehicleValue,
        status: formData.status,
        vehicleType: formData.vehicleType
      });
      
      console.log('Saving booking with price data:', {
        totalPrice: formData.totalPrice,
        calculatedPrice: formData.calculatedPrice,
        bookingFee: formData.bookingFee,
        childSeatsCharge: formData.childSeatsCharge,
        discountPercentage: formData.discountPercentage,
        discountFixed: formData.discountFixed,
        roundTripDiscount: formData.roundTripDiscount,
        gratuityPercentage: formData.gratuityPercentage,
        gratuityFixed: formData.gratuityFixed,
        taxesPercentage: formData.taxesPercentage,
        taxesFixed: formData.taxesFixed,
        creditCardFeePercentage: formData.creditCardFeePercentage,
        creditCardFeeFixed: formData.creditCardFeeFixed
      });
      
      console.log('Saving additional stops:', formData.additionalStops);
      console.log('Additional stops count:', formData.additionalStops.length);
             console.log('Saving to stops field in DB:', updatedBooking.tripInfo.stops);
       console.log('Trip info being saved:', updatedBooking.tripInfo);
       
       await onSave(updatedBooking);
       
       // Mark as saved successfully
       console.log('Setting hasBeenSaved to true');
       setHasBeenSaved(true);
       console.log('hasBeenSaved should now be true');
    } catch (error) {
      console.error('Error saving booking:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRecalculatePrice = async () => {
    setPriceLoading(true);
    setPriceError(null);
    try {
      // Validate that we have pickup and dropoff addresses
      if (!formData.pickup.trim() || !formData.dropoff.trim()) {
        setPriceError('⚠️ Cannot recalculate price: Please enter both pickup and dropoff addresses.');
        setPriceLoading(false);
        return;
      }

      // Use current addresses from form data to get coordinates
      const pickup = {
        lat: 0, // Will be calculated by geocoding
        lng: 0, // Will be calculated by geocoding
        address: formData.pickup,
        zipcode: '',
        city: ''
      };
      const dropoff = {
        lat: 0, // Will be calculated by geocoding
        lng: 0, // Will be calculated by geocoding
        address: formData.dropoff,
        zipcode: '',
        city: ''
      };
      // Calculate distance if we don't have it
      let miles = 0;
      
      if (routeInfo && routeInfo.totalDistanceMiles) {
        miles = routeInfo.totalDistanceMiles;
        console.log('Using routeInfo miles:', miles);
      } else if (formData.routeDistance) {
        // Extract miles from the routeDistance string (e.g., "15.2 mi")
        const match = formData.routeDistance.match(/([\d\.]+)\s*mi/);
        if (match) miles = parseFloat(match[1]);
        console.log('Using formData.routeDistance miles:', miles);
      }
      
      // If we still don't have miles, calculate the route first
      if (miles === 0) {
        console.log('No miles found, calculating route...');
        
        // Check if we're already calculating to avoid duplicate calls
        if (isCalculating) {
          console.log('Route calculation already in progress, waiting for completion...');
          // Wait for the calculation to complete with a longer timeout
          let attempts = 0;
          const maxAttempts = 10; // Wait up to 10 seconds
          
          while (isCalculating && attempts < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, 1000));
            attempts++;
            console.log(`Waiting for route calculation... attempt ${attempts}/${maxAttempts}`);
          }
          
          // Check if we got the result after waiting
          if (routeInfo && routeInfo.totalDistanceMiles) {
            miles = routeInfo.totalDistanceMiles;
            console.log('Got miles from completed calculation:', miles);
          }
        } else {
          // Only calculate if we're not already calculating
          try {
            console.log('Starting new route calculation...');
            await calculateRoute({
              pickup: formData.pickup,
              dropoff: formData.dropoff,
              stops: formData.additionalStops
            });
            
            // Wait a bit for the calculation to complete and update routeInfo
            await new Promise(resolve => setTimeout(resolve, 500));
            
            // Try again after calculating route
            if (routeInfo && routeInfo.totalDistanceMiles) {
              miles = routeInfo.totalDistanceMiles;
              console.log('Miles after route calculation:', miles);
            } else {
              console.log('Route calculation completed but no miles available yet');
              // Wait a bit more and try again
              await new Promise(resolve => setTimeout(resolve, 1000));
              if (routeInfo && routeInfo.totalDistanceMiles) {
                miles = routeInfo.totalDistanceMiles;
                console.log('Miles after additional wait:', miles);
              }
            }
          } catch (error) {
            console.error('Error calculating route:', error);
          }
        }
      }
      
      console.log('Final miles for recalculation:', miles);
      
      // Validate that we have a valid distance
      if (miles === 0 || isNaN(miles)) {
        setPriceError('⚠️ Cannot calculate distance between addresses. Please check that the pickup and dropoff addresses are valid.');
        setPriceLoading(false);
        return;
      }
      
      console.log('=== ANÁLISIS DE DISTANCIA ===');
      console.log('routeInfo:', routeInfo);
      console.log('routeInfo.totalDistanceMiles:', routeInfo?.totalDistanceMiles);
      console.log('formData.routeDistance (string):', formData.routeDistance);
      console.log('formData.routeDistance type:', typeof formData.routeDistance);
      console.log('miles calculated:', miles);
      console.log('miles is NaN:', isNaN(miles));
      const stopsCount = formData.additionalStops.filter(stop => stop.trim() !== '').length;
      const childSeatsCount = formData.infantSeats + formData.toddlerSeats + formData.boosterSeats;
      const isRoundTrip = formData.roundTrip;
      
      // Map the vehicle type name to the correct one and find its ID
      const mappedVehicleTypeName = mapVehicleTypeName(formData.vehicleType);
      const vehicleType = vehicleTypes.find(vt => vt.name === mappedVehicleTypeName);
      const vehicleTypeId = vehicleType?._id || '';

      const requestBody = {
        pickup,
        dropoff,
        miles,
        stopsCount,
        childSeatsCount,
        isRoundTrip,
        vehicleTypeId,
        paymentMethod: formData.paymentMethod // Include payment method for discount calculation
      };

      console.log('=== DATOS PARA CÁLCULO DE PRECIO ===');
      console.log('Original vehicle type:', formData.vehicleType);
      console.log('Mapped vehicle type name:', mappedVehicleTypeName);
      console.log('Found vehicle type:', vehicleType);
      console.log('Vehicle type ID being sent:', vehicleTypeId);
      console.log('Datos enviados al backend:', requestBody);
      console.log('Body JSON:', JSON.stringify(requestBody, null, 2));
      console.log('Route distance from formData:', formData.routeDistance);
      console.log('Miles being sent:', miles);
      console.log('Stops count being sent:', stopsCount);
      console.log('Payment method being sent:', formData.paymentMethod);

      const response = await fetch('http://localhost:5001/api/pricing/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });
      if (!response.ok) {
        let errorMsg = 'Error recalculating price';
        try {
          const errorData = await response.json();
          errorMsg = errorData.message || errorData.error || JSON.stringify(errorData);
        } catch (e) {
          errorMsg = await response.text();
        }
        console.error('Error del backend (Status:', response.status, '):', errorMsg);
        throw new Error(errorMsg);
      }
      const data = await response.json();
      console.log('=== RESPUESTA DEL BACKEND ===');
      console.log('Respuesta completa:', data);
      console.log('Precio base:', data.basePrice);
      console.log('Precio por distancia:', data.distancePrice);
      console.log('Cargo por paradas:', data.stopsCharge);
      console.log('Cargo por asientos infantiles:', data.childSeatsCharge);
      console.log('Descuento por viaje redondo:', data.roundTripDiscount);
      console.log('Precio del viaje de regreso:', data.returnTripPrice);
      console.log('Subtotal:', data.subtotal);
      console.log('Descuento por método de pago:', data.paymentDiscount);
      console.log('Precio final:', data.finalTotal);
      console.log('Método de precios usado:', data.pricingMethod);
      console.log('Área:', data.areaName);
      console.log('Distancia:', data.distance);
      
      // Update form data with the complete breakdown from backend
      setFormData((prev) => ({ 
        ...prev, 
        calculatedPrice: data.finalTotal, // Use finalTotal instead of totalPrice
        totalPrice: data.finalTotal, // Use the final total from backend
        childSeatsCharge: data.childSeatsCharge,
        roundTripDiscount: data.roundTripDiscount,
        // Store additional breakdown data for display
        basePrice: data.basePrice,
        distancePrice: data.distancePrice,
        stopsCharge: data.stopsCharge,
        returnTripPrice: data.returnTripPrice,
        subtotal: data.subtotal,
        paymentDiscount: data.paymentDiscount,
        areaName: data.areaName,
        pricingMethod: data.pricingMethod,
        distance: data.distance,
        surgeMultiplier: data.surgeMultiplier,
        surgeName: data.surgeName
      }));
    } catch (error: any) {
      setPriceError(error.message || 'Error recalculating price');
    } finally {
      setPriceLoading(false);
    }
  };



  const handlePriceComponentChange = (field: keyof FormData, value: string) => {
    const numValue = value === '' ? 0 : parseFloat(value) || 0;
    
    // Reset hasBeenSaved when user makes changes (for existing bookings)
    if (!isCreating && hasBeenSaved) {
      console.log('User made changes (price component), resetting hasBeenSaved to false');
      setHasBeenSaved(false);
    }
    
    setFormData((prev) => {
      const updated = { ...prev, [field]: numValue };
      // Recalculate total price when any component changes
      updated.totalPrice = calculateTotalPrice(updated.calculatedPrice, updated);
      return updated;
    });
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price);
  };

  // Helper function for luggage field focus/blur handlers
  const handleLuggageFieldFocus = (e: React.FocusEvent<HTMLSelectElement>) => {
    e.target.style.borderColor = '#d32f2f';
    e.target.style.backgroundColor = '#fff';
  };

  const handleLuggageFieldBlur = (e: React.FocusEvent<HTMLSelectElement>) => {
    e.target.style.borderColor = '#e0e0e0';
    e.target.style.backgroundColor = '#f7fafd';
  };

  // Autocomplete load handlers
  const onPickupLoad = (autocomplete: google.maps.places.Autocomplete) => {
    pickupAutocomplete.current = autocomplete;
  };

  const onDropoffLoad = (autocomplete: google.maps.places.Autocomplete) => {
    dropoffAutocomplete.current = autocomplete;
  };

  const onStopLoad = (index: number) => (autocomplete: google.maps.places.Autocomplete) => {
    stopAutocompletes.current[index] = autocomplete;
  };

  // Place changed handlers
  const onPickupPlaceChanged = () => {
    const place = pickupAutocomplete.current?.getPlace();
    if (place && place.formatted_address) {
      setFormData((prev) => ({ ...prev, pickup: place.formatted_address || '' }));
      // Trigger route calculation after address selection (only if dropoff exists and not already calculating)
      if (formData.dropoff && !isCalculating) {
        setTimeout(() => {
          calculateRoute({
            pickup: place.formatted_address || '',
            dropoff: formData.dropoff,
            stops: formData.additionalStops
          });
        }, 300);
      }
    }
  };

  const onDropoffPlaceChanged = () => {
    const place = dropoffAutocomplete.current?.getPlace();
    if (place && place.formatted_address) {
      setFormData((prev) => ({ ...prev, dropoff: place.formatted_address || '' }));
      // Trigger route calculation after address selection (only if pickup exists and not already calculating)
      if (formData.pickup && !isCalculating) {
        setTimeout(() => {
          calculateRoute({
            pickup: formData.pickup,
            dropoff: place.formatted_address || '',
            stops: formData.additionalStops
          });
        }, 300);
      }
    }
  };

  const onStopPlaceChanged = (index: number) => () => {
    const autocomplete = stopAutocompletes.current[index];
    const place = autocomplete?.getPlace();
    if (place && place.formatted_address) {
      setFormData((prev) => {
        const updatedStops = prev.additionalStops.map((stop, i) => i === index ? place.formatted_address || '' : stop);
        return { ...prev, additionalStops: updatedStops };
      });
      // Trigger route calculation after stop selection (only if both pickup and dropoff exist and not already calculating)
      if (formData.pickup && formData.dropoff && !isCalculating) {
        setTimeout(() => {
          calculateRoute({
            pickup: formData.pickup,
            dropoff: formData.dropoff,
            stops: formData.additionalStops.map((stop, i) => i === index ? place.formatted_address || '' : stop)
          });
        }, 300);
      }
    }
  };





  // Route calculation is now handled globally


  


  // Calculate route when component mounts with initial data (only if not already calculating)
  useEffect(() => {
    if (formData.pickup && formData.dropoff && !isCalculating) {
      // Add a small delay to avoid immediate calculation on mount
      const timeoutId = setTimeout(() => {
        calculateRoute({
          pickup: formData.pickup,
          dropoff: formData.dropoff,
          stops: formData.additionalStops
        });
      }, 500);
      
      return () => clearTimeout(timeoutId);
    }
  }, []); // Only run once on mount
  
  // Update form data when route info changes
  useEffect(() => {
    if (routeInfo) {
      setFormData(prev => ({
        ...prev,
        routeDistance: routeInfo.distance,
        routeDuration: routeInfo.duration
      }));
    }
  }, [routeInfo]);

  // Email modal functions
  const fetchEmailTemplates = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_BASE_URL || 'http://localhost:5001/api'}/email/templates`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const templates = await response.json();
        setEmailTemplates(templates);
      }
    } catch (error) {
      console.error('Error fetching email templates:', error);
    }
  };

  const handleEmailButtonClick = () => {
    setShowEmailModal(true);
    fetchEmailTemplates();
    setEmailMessage(null);
  };

  const handleSendEmail = async () => {
    if (!selectedEmailTemplate || !booking?._id) {
      setEmailMessage({ type: 'error', text: 'Please select a template and ensure booking is saved' });
      return;
    }

    setEmailLoading(true);
    try {
      const response = await fetch(`${process.env.REACT_APP_API_BASE_URL || 'http://localhost:5001/api'}/email/send`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          bookingId: booking._id,
          templateName: selectedEmailTemplate.name,
          toEmail: formData.email
        })
      });

      const result = await response.json();

      if (response.ok) {
        setEmailMessage({ 
          type: 'success', 
          text: `Email sent successfully to ${formData.email}!` 
        });
        setTimeout(() => {
          setShowEmailModal(false);
          setEmailMessage(null);
        }, 2000);
      } else {
        setEmailMessage({ type: 'error', text: result.message || 'Failed to send email' });
      }
    } catch (error) {
      console.error('Error sending email:', error);
      setEmailMessage({ type: 'error', text: 'Network error. Please try again.' });
    } finally {
      setEmailLoading(false);
    }
  };

  return (
    <div className="booking-editor-overlay">
      <div className="booking-editor-modal">
        {/* Header */}
        <div className="editor-header">
          <div className="header-left">
            <h2>{isCreating ? 'Create New Reservation' : `Edit Reservation #${booking?.outboundConfirmationNumber}`}</h2>
            <span className="booking-date">
              {isCreating ? 'New reservation' : `Created: ${new Date(booking?.createdAt).toLocaleDateString()}`}
            </span>
          </div>
          <div className="header-right">
            <button className="close-btn" onClick={onClose}>×</button>
          </div>
        </div>

        {/* Action Buttons Bar */}
        <div className="action-buttons-bar">
          <div className="action-buttons-container">
            <button 
              className="action-btn primary"
              onClick={handleSave}
              disabled={isLoading}
            >
              <SaveIcon />
              {isLoading ? 'Saving...' : (isCreating ? 'Create' : 'Save')}
            </button>
            <button 
              className="action-btn email"
              onClick={handleEmailButtonClick}
              disabled={isLoading || !booking?._id}
              title={!booking?._id ? "Save booking first to send emails" : "Send email to customer"}
            >
              <EmailIcon />
              Email
            </button>
            <button 
              className="action-btn payments"
              onClick={() => {
                // TODO: Implement payments functionality
                console.log('Payments button clicked');
              }}
              disabled={isLoading}
            >
              <PaymentsIcon />
              Payments
            </button>
            <button 
              className="action-btn round-trip"
              onClick={() => setShowRoundTripModal(true)}
              disabled={isLoading}
            >
              <RoundTripIcon />
              Round-Trip
            </button>
            <button 
              className="action-btn copy"
              onClick={() => {
                // TODO: Implement copy functionality
                console.log('Copy button clicked');
              }}
              disabled={isLoading}
            >
              <CopyIcon />
              Copy
            </button>
            {!isCreating && (
              <button 
                className="action-btn delete"
                onClick={handleDelete}
                disabled={isLoading}
              >
                <DeleteIcon />
                Delete
              </button>
            )}
          </div>
        </div>

        {/* Content Area - Single Page Layout */}
        <div className="editor-content">

          
          {/* Column 1: Customer Info & Payment */}
          <div className="content-column">
            {/* Customer Information */}
            <div className="form-section">
              <h3>👤 CUSTOMER INFO</h3>
              <div style={{
                backgroundColor: '#e8f5e8',
                border: '1px solid #4caf50',
                borderRadius: '6px',
                padding: '8px 12px',
                marginBottom: '15px',
                fontSize: '13px',
                color: '#2e7d32',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                💡 <strong>Tip:</strong> Start typing in any field to search for existing customers and auto-fill all fields
              </div>
              <div className="form-grid">
                <div className={`form-group ${validationErrors.firstName ? 'form-group-with-error' : ''}`}>
                  <label style={{
                    fontSize: '16px',
                    fontWeight: '600',
                    color: '#2c3e50',
                    marginBottom: '8px',
                    display: 'block'
                  }}>
                    First Name *
                  </label>
                  <CustomerAutocomplete
                    value={formData.firstName}
                    onChange={(value) => handleInputChange('firstName', value)}
                    onCustomerSelect={handleCustomerSelect}
                    placeholder="Enter first name or search existing customer"
                    fieldType="firstName"
                    className={validationErrors.firstName ? 'field-error' : ''}
                    isEditing={!isCreating}
                  />
                </div>
                <div className={`form-group ${validationErrors.lastName ? 'form-group-with-error' : ''}`}>
                  <label style={{
                    fontSize: '16px',
                    fontWeight: '600',
                    color: '#2c3e50',
                    marginBottom: '8px',
                    display: 'block'
                  }}>
                    Last Name *
                  </label>
                  <CustomerAutocomplete
                    value={formData.lastName}
                    onChange={(value) => handleInputChange('lastName', value)}
                    onCustomerSelect={handleCustomerSelect}
                    placeholder="Enter last name or search existing customer"
                    fieldType="lastName"
                    className={validationErrors.lastName ? 'field-error' : ''}
                    isEditing={!isCreating}
                  />
                </div>
                <div className={`form-group ${validationErrors.phone ? 'form-group-with-error' : ''}`}>
                  <label style={{
                    fontSize: '16px',
                    fontWeight: '600',
                    color: '#2c3e50',
                    marginBottom: '8px',
                    display: 'block'
                  }}>
                    Phone *
                  </label>
                  <CustomerAutocomplete
                    value={formData.phone}
                    onChange={(value) => handleInputChange('phone', value)}
                    onCustomerSelect={handleCustomerSelect}
                    placeholder="Enter phone number or search existing customer"
                    fieldType="phone"
                    className={validationErrors.phone ? 'field-error' : ''}
                    isEditing={!isCreating}
                  />
                </div>
                <div className={`form-group ${validationErrors.email ? 'form-group-with-error' : ''}`}>
                  <label style={{
                    fontSize: '16px',
                    fontWeight: '600',
                    color: '#2c3e50',
                    marginBottom: '8px',
                    display: 'block'
                  }}>
                    Email *
                  </label>
                  <CustomerAutocomplete
                    value={formData.email}
                    onChange={(value) => handleInputChange('email', value)}
                    onCustomerSelect={handleCustomerSelect}
                    placeholder="Enter email address or search existing customer"
                    fieldType="email"
                    className={validationErrors.email ? 'field-error' : ''}
                    isEditing={!isCreating}
                  />
                </div>
              </div>
              <div className="form-group full-width">
                <label style={{
                  fontSize: '16px',
                  fontWeight: '600',
                  color: '#2c3e50',
                  marginBottom: '8px',
                  display: 'block'
                }}>
                  Special Instructions
                </label>
                <textarea
                  value={formData.specialInstructions}
                  onChange={(e) => handleInputChange('specialInstructions', e.target.value)}
                  placeholder="Enter any special instructions or requirements..."
                  rows={3}
                />
              </div>
            </div>

            {/* Luggage & Child Seats */}
            <div className="form-section">
              <h3>🧳 LUGGAGE & CHILD SEATS</h3>
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(6, 1fr)', 
                gap: '20px',
                padding: '20px 0'
              }}>
                                 <div style={{ 
                   display: 'flex', 
                   flexDirection: 'column',
                   alignItems: 'center',
                   textAlign: 'center',
                   position: 'relative'
                 }}>
                   <label style={{ 
                     fontSize: '14px', 
                     fontWeight: '700', 
                     color: validationErrors.passengers ? '#dc3545' : '#1a365d', 
                     marginBottom: '8px', 
                     display: 'block',
                     textTransform: 'uppercase',
                     letterSpacing: '0.5px'
                   }}>
                     Passengers *
                   </label>
                   <select
                     value={formData.passengers}
                     onChange={(e) => handleNumberInputChange('passengers', e.target.value)}
                     style={{ 
                       width: '70px', 
                       padding: '12px', 
                       border: validationErrors.passengers ? '2px solid #dc3545' : '2px solid #e0e0e0', 
                       borderRadius: '8px',
                       textAlign: 'center',
                       fontSize: '1rem',
                       fontWeight: '600',
                       color: '#222',
                       backgroundColor: validationErrors.passengers ? '#fff5f5' : '#f7fafd',
                       transition: 'border 0.2s',
                       outline: 'none',
                       boxSizing: 'border-box',
                       cursor: 'pointer'
                     }}
                     onFocus={handleLuggageFieldFocus}
                     onBlur={handleLuggageFieldBlur}
                   >
                     <option value={1}>1</option>
                     <option value={2}>2</option>
                     <option value={3}>3</option>
                     <option value={4}>4</option>
                     <option value={5}>5</option>
                     <option value={6}>6</option>
                   </select>
                   
                 </div>
                <div style={{ 
                  display: 'flex', 
                  flexDirection: 'column',
                  alignItems: 'center',
                  textAlign: 'center'
                }}>
                  <label style={{ 
                    fontSize: '14px', 
                    fontWeight: '700', 
                    color: '#1a365d', 
                    marginBottom: '8px', 
                    display: 'block',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>
                    Checked
                  </label>
                  <select
                    value={formData.checkedLuggage}
                    onChange={(e) => handleNumberInputChange('checkedLuggage', e.target.value)}
                    style={{ 
                      width: '70px', 
                      padding: '12px', 
                      border: '2px solid #e0e0e0', 
                      borderRadius: '8px',
                      textAlign: 'center',
                      fontSize: '1rem',
                      fontWeight: '600',
                      color: '#222',
                      backgroundColor: '#f7fafd',
                      transition: 'border 0.2s',
                      outline: 'none',
                      boxSizing: 'border-box',
                      cursor: 'pointer'
                    }}
                    onFocus={handleLuggageFieldFocus}
                    onBlur={handleLuggageFieldBlur}
                  >
                    <option value={0}>0</option>
                    <option value={1}>1</option>
                    <option value={2}>2</option>
                    <option value={3}>3</option>
                    <option value={4}>4</option>
                    <option value={5}>5</option>
                    <option value={6}>6</option>
                    <option value={7}>7</option>
                    <option value={8}>8</option>
                  </select>
                </div>
                <div style={{ 
                  display: 'flex', 
                  flexDirection: 'column',
                  alignItems: 'center',
                  textAlign: 'center'
                }}>
                  <label style={{ 
                    fontSize: '14px', 
                    fontWeight: '700', 
                    color: '#1a365d', 
                    marginBottom: '8px', 
                    display: 'block',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>
                    Carry On
                  </label>
                  <select
                    value={formData.carryOn}
                    onChange={(e) => handleNumberInputChange('carryOn', e.target.value)}
                    style={{ 
                      width: '70px', 
                      padding: '12px', 
                      border: '2px solid #e0e0e0', 
                      borderRadius: '8px',
                      textAlign: 'center',
                      fontSize: '1rem',
                      fontWeight: '600',
                      color: '#222',
                      backgroundColor: '#f7fafd',
                      transition: 'border 0.2s',
                      outline: 'none',
                      boxSizing: 'border-box',
                      cursor: 'pointer'
                    }}
                    onFocus={handleLuggageFieldFocus}
                    onBlur={handleLuggageFieldBlur}
                  >
                    <option value={0}>0</option>
                    <option value={1}>1</option>
                    <option value={2}>2</option>
                    <option value={3}>3</option>
                    <option value={4}>4</option>
                    <option value={5}>5</option>
                    <option value={6}>6</option>
                    <option value={7}>7</option>
                    <option value={8}>8</option>
                  </select>
                </div>
                <div style={{ 
                  display: 'flex', 
                  flexDirection: 'column',
                  alignItems: 'center',
                  textAlign: 'center'
                }}>
                  <label style={{ 
                    fontSize: '14px', 
                    fontWeight: '700', 
                    color: '#1a365d', 
                    marginBottom: '8px', 
                    display: 'block',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>
                    Infant
                  </label>
                  <select
                    value={formData.infantSeats}
                    onChange={(e) => handleNumberInputChange('infantSeats', e.target.value)}
                    style={{ 
                      width: '70px', 
                      padding: '12px', 
                      border: '2px solid #e0e0e0', 
                      borderRadius: '8px',
                      textAlign: 'center',
                      fontSize: '1rem',
                      fontWeight: '600',
                      color: '#222',
                      backgroundColor: '#f7fafd',
                      transition: 'border 0.2s',
                      outline: 'none',
                      boxSizing: 'border-box',
                      cursor: 'pointer'
                    }}
                    onFocus={handleLuggageFieldFocus}
                    onBlur={handleLuggageFieldBlur}
                  >
                    <option value={0}>0</option>
                    <option value={1}>1</option>
                    <option value={2}>2</option>
                    <option value={3}>3</option>
                    <option value={4}>4</option>
                  </select>
                </div>
                <div style={{ 
                  display: 'flex', 
                  flexDirection: 'column',
                  alignItems: 'center',
                  textAlign: 'center'
                }}>
                  <label style={{ 
                    fontSize: '14px', 
                    fontWeight: '700', 
                    color: '#1a365d', 
                    marginBottom: '8px', 
                    display: 'block',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>
                    Toddler
                  </label>
                  <select
                    value={formData.toddlerSeats}
                    onChange={(e) => handleNumberInputChange('toddlerSeats', e.target.value)}
                    style={{ 
                      width: '70px', 
                      padding: '12px', 
                      border: '2px solid #e0e0e0', 
                      borderRadius: '8px',
                      textAlign: 'center',
                      fontSize: '1rem',
                      fontWeight: '600',
                      color: '#222',
                      backgroundColor: '#f7fafd',
                      transition: 'border 0.2s',
                      outline: 'none',
                      boxSizing: 'border-box',
                      cursor: 'pointer'
                    }}
                    onFocus={handleLuggageFieldFocus}
                    onBlur={handleLuggageFieldBlur}
                  >
                    <option value={0}>0</option>
                    <option value={1}>1</option>
                    <option value={2}>2</option>
                    <option value={3}>3</option>
                    <option value={4}>4</option>
                  </select>
                </div>
                <div style={{ 
                  display: 'flex', 
                  flexDirection: 'column',
                  alignItems: 'center',
                  textAlign: 'center'
                }}>
                  <label style={{ 
                    fontSize: '14px', 
                    fontWeight: '700', 
                    color: '#1a365d', 
                    marginBottom: '8px', 
                    display: 'block',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>
                    Booster
                  </label>
                  <select
                    value={formData.boosterSeats}
                    onChange={(e) => handleNumberInputChange('boosterSeats', e.target.value)}
                    style={{ 
                      width: '70px', 
                      padding: '12px', 
                      border: '2px solid #e0e0e0', 
                      borderRadius: '8px',
                      textAlign: 'center',
                      fontSize: '1rem',
                      fontWeight: '600',
                      color: '#222',
                      backgroundColor: '#f7fafd',
                      transition: 'border 0.2s',
                      outline: 'none',
                      boxSizing: 'border-box',
                      cursor: 'pointer'
                    }}
                    onFocus={handleLuggageFieldFocus}
                    onBlur={handleLuggageFieldBlur}
                  >
                    <option value={0}>0</option>
                    <option value={1}>1</option>
                    <option value={2}>2</option>
                    <option value={3}>3</option>
                    <option value={4}>4</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Payment Information */}
            <div className="form-section">
              <h3>💳 PAYMENT</h3>
              <div className="form-grid">
                <div className="form-group">
                  <label style={{
                    fontSize: '16px',
                    fontWeight: '600',
                    color: '#2c3e50',
                    marginBottom: '8px',
                    display: 'block'
                  }}>
                    Payment Method
                  </label>
                  <select
                    value={formData.paymentMethod}
                    onChange={(e) => handleInputChange('paymentMethod', e.target.value as 'cash' | 'invoice' | 'credit_card' | 'zelle')}
                  >
                    <option value="cash">CASH</option>
                    <option value="invoice">Invoice</option>
                    <option value="zelle">Zelle</option>
                    <option value="credit_card">Credit Card Info</option>
                  </select>
                </div>
                <div className="form-group">
                  <label style={{
                    fontSize: '16px',
                    fontWeight: '600',
                    color: '#2c3e50',
                    marginBottom: '8px',
                    display: 'block'
                  }}>
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => handleInputChange('status', e.target.value as 'Unassigned' | 'Assigned' | 'On the way' | 'Arrived' | 'Customer in car' | 'Customer dropped off' | 'Customer dropped off - Pending payment' | 'Done' | 'No Show' | 'Canceled')}
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      fontSize: '16px',
                      backgroundColor: 'white'
                    }}
                  >
                    <option value="Unassigned">Unassigned</option>
                    <option value="Assigned">Assigned</option>
                    <option value="On the way">On the way</option>
                    <option value="Arrived">Arrived</option>
                    <option value="Customer in car">Customer in car</option>
                    <option value="Customer dropped off">Customer dropped off</option>
                    <option value="Customer dropped off - Pending payment">Customer dropped off - Pending payment</option>
                    <option value="Done">Done</option>
                    <option value="No Show">No Show</option>
                    <option value="Canceled">Canceled</option>
                  </select>
                </div>
              </div>
            </div>

          </div>

          {/* Column 2: Date/Time & Routing */}
          <div className="content-column">
            {/* Date and Time */}
            <div className="form-section">
              <h3>📅 DATE & TIME</h3>
              <div className="form-grid">
                                 <div className={`form-group ${validationErrors.date ? 'form-group-with-error' : ''}`}>
                   <label style={{
                     fontSize: '16px',
                     fontWeight: '600',
                     color: '#2c3e50',
                     marginBottom: '8px',
                     display: 'block'
                   }}>
                     Trip Date *
                   </label>
                   <input
                     type="date"
                     value={formData.date}
                     onChange={(e) => handleInputChange('date', e.target.value)}
                     className={validationErrors.date ? 'field-error' : ''}
                   />
                   
                 </div>
                                 <div className={`form-group ${validationErrors.pickupTime ? 'form-group-with-error' : ''}`}>
                   <label style={{
                     fontSize: '16px',
                     fontWeight: '600',
                     color: '#2c3e50',
                     marginBottom: '8px',
                     display: 'block'
                   }}>
                     Pickup Time *
                   </label>
                   <div className={`time-input-group ${validationErrors.pickupTime ? 'field-error' : ''}`}>
                     <input
                       type="number"
                       min="1"
                       max="12"
                       value={formData.pickupHour}
                       onChange={(e) => handleInputChange('pickupHour', e.target.value)}
                       placeholder="Hour"
                     />
                     <span>:</span>
                     <input
                       type="number"
                       min="0"
                       max="59"
                       value={formData.pickupMinute}
                       onChange={(e) => handleInputChange('pickupMinute', e.target.value)}
                       placeholder="Min"
                     />
                     <select
                       value={formData.pickupPeriod}
                       onChange={(e) => handleInputChange('pickupPeriod', e.target.value)}
                     >
                       <option value="AM">AM</option>
                       <option value="PM">PM</option>
                     </select>
                   </div>
                   
                 </div>
              </div>
            </div>

            {/* Routing Information */}
            <div className="form-section">
              <h3>📍 ROUTING INFO</h3>
              
              {/* Trip Type Selection */}
                             {/* Pickup Location */}
               <div className={`form-group ${validationErrors.pickup ? 'form-group-with-error' : ''}`}>
                 <label style={{
                   fontSize: '16px',
                   fontWeight: '600',
                   color: '#2c3e50',
                   marginBottom: '8px',
                   display: 'block'
                 }}>
                   Pickup Location *
                 </label>
                 <Autocomplete onLoad={onPickupLoad} onPlaceChanged={onPickupPlaceChanged}>
                   <input
                     type="text"
                     value={formData.pickup}
                     onChange={(e) => handleInputChange('pickup', e.target.value)}
                     placeholder="Enter pickup address or location"
                     className={`routing-input ${validationErrors.pickup ? 'field-error' : ''}`}
                     autoComplete="off"
                   />
                 </Autocomplete>
                 
               </div>

              {/* Additional Stops - Between Pickup and Dropoff */}
              {formData.additionalStops.map((stop, index) => (
                <div key={index} className="form-group">
                  <label style={{
                    fontSize: '16px',
                    fontWeight: '600',
                    color: '#2c3e50',
                    marginBottom: '8px',
                    display: 'block'
                  }}>
                    Additional Stop {index + 1}
                  </label>
                  <div style={{display: 'flex', gap: '10px', alignItems: 'center'}}>
                    <Autocomplete onLoad={onStopLoad(index)} onPlaceChanged={onStopPlaceChanged(index)}>
                      <input
                        type="text"
                        value={stop}
                        onChange={(e) => updateAdditionalStop(index, e.target.value)}
                        placeholder="Enter additional stop address"
                        className="routing-input"
                        style={{flex: 1}}
                        autoComplete="off"
                      />
                    </Autocomplete>
                    <button
                      type="button"
                      className="remove-stop-btn"
                      onClick={() => removeAdditionalStop(index)}
                      style={{
                        padding: '8px 12px',
                        backgroundColor: '#dc3545',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: 'bold'
                      }}
                    >
                      ×
                    </button>
                  </div>
                </div>
              ))}
              
              {/* Add Stop Button */}
              <div className="form-group" style={{marginBottom: '0'}}>
                <button 
                  type="button"
                  onClick={addAdditionalStop}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: '#28a745',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '500'
                  }}
                >
                  + Add Additional Stop
                </button>
              </div>

                                                         {/* Dropoff Location */}
               <div className={`form-group ${validationErrors.dropoff ? 'form-group-with-error' : ''}`}>
                 <label style={{
                   fontSize: '16px',
                   fontWeight: '600',
                   color: '#2c3e50',
                   marginBottom: '8px',
                   display: 'block'
                 }}>
                   Dropoff Location *
                 </label>
                 <Autocomplete onLoad={onDropoffLoad} onPlaceChanged={onDropoffPlaceChanged}>
                   <input
                     type="text"
                     value={formData.dropoff}
                     onChange={(e) => handleInputChange('dropoff', e.target.value)}
                     placeholder="Enter dropoff address or location"
                     className={`routing-input ${validationErrors.dropoff ? 'field-error' : ''}`}
                     autoComplete="off"
                   />
                 </Autocomplete>
                 
               </div>
              
              {/* Route Information */}
              {routeInfo && (
                <div className="form-group">
                  <label style={{
                    fontSize: '16px',
                    fontWeight: '600',
                    color: '#2c3e50',
                    marginBottom: '8px',
                    display: 'block'
                  }}>
                    Route Information
                  </label>
                  <div style={{ 
                    padding: '12px', 
                    backgroundColor: '#f8f9fa', 
                    borderRadius: '6px',
                    border: '1px solid #e9ecef'
                  }}>
                                          <div style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center',
                        fontSize: '14px',
                        fontWeight: '500'
                      }}>
                        <span>Total Distance: <strong>{routeInfo.distance}</strong></span>
                        <span>Total Duration: <strong>{routeInfo.duration}</strong></span>
                      </div>
                    {routeInfo.validStopsCount > 0 && (
                      <div style={{ 
                        marginTop: '8px', 
                        fontSize: '12px', 
                        color: '#6c757d' 
                      }}>
                        Includes {routeInfo.validStopsCount} stop{routeInfo.validStopsCount > 1 ? 's' : ''}
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              {/* Flight Information */}
              <div className="flight-info-section">
                <h4 style={{
                  fontSize: '18px',
                  fontWeight: '700',
                  color: '#2c3e50',
                  marginBottom: '15px',
                  borderBottom: '2px solid #3498db',
                  paddingBottom: '8px'
                }}>
                  Flight Information
                </h4>
                <div className="flight-grid">
                  <div className="form-group">
                    <label style={{
                      fontSize: '16px',
                      fontWeight: '600',
                      color: '#2c3e50',
                      marginBottom: '8px',
                      display: 'block'
                    }}>
                      Flight Number
                    </label>
                    <input
                      type="text"
                      value={formData.flight}
                      onChange={(e) => handleInputChange('flight', e.target.value)}
                      placeholder="Enter flight number"
                      className="routing-input"
                    />
                  </div>
                  <div className="form-group">
                    <label style={{
                      fontSize: '16px',
                      fontWeight: '600',
                      color: '#2c3e50',
                      marginBottom: '8px',
                      display: 'block'
                    }}>
                      Meet Option
                    </label>
                    <select
                      value={formData.meetOption}
                      onChange={(e) => handleInputChange('meetOption', e.target.value)}
                      className="routing-input"
                    >
                      <option value="When your flight arrives">When your flight arrives</option>
                      <option value="At specific time">At specific time</option>
                      <option value="At baggage claim">At baggage claim</option>
                      <option value="At curbside">At curbside</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>



            {/* Round Trip */}
            <div className="form-section">
              <div className="form-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={formData.roundTrip}
                    onChange={(e) => handleInputChange('roundTrip', e.target.checked)}
                  />
                  This is a round trip
                </label>
              </div>
              
              {formData.roundTrip && (
                                 <div className="form-grid">
                   <div className={`form-group ${validationErrors.returnDate ? 'form-group-with-error' : ''}`}>
                     <label>Return Date</label>
                     <input
                       type="date"
                       value={formData.returnDate}
                       onChange={(e) => handleInputChange('returnDate', e.target.value)}
                       className={validationErrors.returnDate ? 'field-error' : ''}
                     />
                     
                   </div>
                                     <div className={`form-group ${validationErrors.returnTime ? 'form-group-with-error' : ''}`}>
                     <label>Return Time</label>
                     <div className={`time-input-group ${validationErrors.returnTime ? 'field-error' : ''}`}>
                       <input
                         type="number"
                         min="1"
                         max="12"
                         value={formData.returnHour}
                         onChange={(e) => handleInputChange('returnHour', e.target.value)}
                         placeholder="Hour"
                       />
                       <span>:</span>
                       <input
                         type="number"
                         min="0"
                         max="59"
                         value={formData.returnMinute}
                         onChange={(e) => handleInputChange('returnMinute', e.target.value)}
                         placeholder="Min"
                       />
                       <select
                         value={formData.returnPeriod}
                         onChange={(e) => handleInputChange('returnPeriod', e.target.value)}
                       >
                         <option value="AM">AM</option>
                         <option value="PM">PM</option>
                       </select>
                     </div>
                     
                   </div>
                  <div className="form-group">
                    <label>Return Flight</label>
                    <input
                      type="text"
                      value={formData.returnFlight}
                      onChange={(e) => handleInputChange('returnFlight', e.target.value)}
                      placeholder="Enter return flight number"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Column 3: Vehicle Type & Pricing */}
          <div className="content-column">
            {/* Vehicle Type */}
                                            <div className="form-section">
                     <h3>🚐 VEHICLES AND DRIVERS</h3>
               <div className="form-grid">
                 <div className="form-group">
                   <label>Vehicle Type</label>
                   <select
                     value={formData.vehicleType}
                     onChange={(e) => handleInputChange('vehicleType', e.target.value)}
                     style={{
                       width: '100%',
                       padding: '12px',
                       border: '1px solid #ddd',
                       borderRadius: '4px',
                       fontSize: '16px',
                       backgroundColor: 'white'
                     }}
                   >
                     <option value="">Unassigned</option>
                     {vehicleTypes.map((type) => (
                       <option key={type._id} value={type.name}>
                         {type.name} ({type.capacity} passengers)
                       </option>
                     ))}
                   </select>
                 </div>
                 <div className="form-group">
                   <label>Assigned Vehicle</label>
                   <select
                     value={formData.assignedVehicle}
                     onChange={(e) => handleInputChange('assignedVehicle', e.target.value)}
                     style={{
                       width: '100%',
                       padding: '12px',
                       border: '1px solid #ddd',
                       borderRadius: '4px',
                       fontSize: '16px',
                       backgroundColor: 'white'
                     }}
                   >
                     <option value="">Unassigned</option>
                     {vehicles
                       .filter(vehicle => {
                         if (!formData.vehicleType) return true;
                         // Check if vehicleType is a populated object or just an ID
                         const vehicleTypeName = vehicle.vehicleType?.name || vehicle.vehicleType;
                         return vehicleTypeName === formData.vehicleType;
                       })
                       .map((vehicle) => (
                         <option key={vehicle._id} value={vehicle._id}>
                           {vehicle.make || 'N/A'} {vehicle.modelName || 'N/A'} - {vehicle.licensePlate}
                         </option>
                       ))}
                   </select>
                 </div>
                 <div className="form-group">
                   <label>Assigned Driver</label>
                   <select
                     value={formData.assignedDriver}
                     onChange={(e) => handleInputChange('assignedDriver', e.target.value)}
                     disabled={driversLoading}
                     style={{
                       width: '100%',
                       padding: '12px',
                       border: '1px solid #ddd',
                       borderRadius: '4px',
                       fontSize: '16px',
                       backgroundColor: 'white'
                     }}
                   >
                     <option value="">Unassigned</option>
                     {drivers.map((driver) => (
                       <option key={driver._id} value={driver._id}>
                         {driver.firstName} {driver.lastName}
                       </option>
                     ))}
                   </select>
                   {driversLoading && <small>Loading drivers...</small>}
                 </div>
               </div>
             </div>

            {/* Pricing */}
            <div className="form-section">
              <h3>💰 PRICING</h3>
              <div className="price-breakdown-detailed">
                                 <div className="price-header">
                   <h4>Price Breakdown</h4>
                   <button 
                     className="action-btn secondary"
                     onClick={handleRecalculatePrice}
                     disabled={priceLoading}
                     title="Recalculate price using current pickup and dropoff addresses"
                   >
                     {priceLoading ? 'Recalculating...' : 'Recalculate Price'}
                   </button>
                 </div>
                                 {priceError && <div className="price-error">{priceError}</div>}
                 {!isCreating && !routeInfo?.totalDistanceMiles && !priceError && (
                   <div style={{
                     backgroundColor: '#fff3cd',
                     border: '1px solid #ffeaa7',
                     borderRadius: '6px',
                     padding: '8px 12px',
                     marginBottom: '15px',
                     fontSize: '13px',
                     color: '#856404',
                     display: 'flex',
                     alignItems: 'center',
                     gap: '6px'
                   }}>
                     ⚠️ <strong>Note:</strong> Price cannot be recalculated automatically. Update pickup/dropoff addresses to enable recalculation.
                   </div>
                 )}
                
                <table className="price-table">
                  <thead>
                    <tr>
                      <th>Item</th>
                      <th></th>
                      <th>Input</th>
                      <th></th>
                      <th>Calculated</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>Base Price</td>
                      <td className="price-symbol">$</td>
                      <td>
                        <input
                          type="number"
                          step="0.01"
                          className="price-input"
                          value={formData.calculatedPrice}
                          onChange={(e) => handlePriceComponentChange('calculatedPrice', e.target.value)}
                          placeholder="0.00"
                        />
                      </td>
                      <td></td>
                      <td className="price-calculated">${formData.calculatedPrice.toFixed(2)}</td>
                    </tr>
                    <tr>
                      <td>Booking Fee</td>
                      <td className="price-symbol">$</td>
                      <td>
                        <input
                          type="number"
                          step="0.01"
                          className="price-input"
                          value={formData.bookingFee}
                          onChange={(e) => handlePriceComponentChange('bookingFee', e.target.value)}
                          placeholder="0.00"
                        />
                      </td>
                      <td></td>
                      <td className="price-calculated">${formData.bookingFee.toFixed(2)}</td>
                    </tr>
                    <tr>
                      <td>Child Seats</td>
                      <td className="price-symbol">$</td>
                      <td>
                        <input
                          type="number"
                          step="0.01"
                          className="price-input"
                          value={formData.childSeatsCharge}
                          onChange={(e) => handlePriceComponentChange('childSeatsCharge', e.target.value)}
                          placeholder="0.00"
                        />
                      </td>
                      <td></td>
                      <td className="price-calculated">${formData.childSeatsCharge.toFixed(2)}</td>
                    </tr>
                    <tr>
                      <td>Discount (%)</td>
                      <td></td>
                      <td>
                        <input
                          type="number"
                          step="0.01"
                          className="price-input percentage"
                          value={formData.discountPercentage}
                          onChange={(e) => handlePriceComponentChange('discountPercentage', e.target.value)}
                          placeholder="0.00"
                        />
                      </td>
                      <td className="price-symbol">%</td>
                      <td className="price-calculated">${(formData.calculatedPrice * formData.discountPercentage / 100).toFixed(2)}</td>
                    </tr>
                    <tr>
                      <td>Discount ($)</td>
                      <td className="price-symbol">$</td>
                      <td>
                        <input
                          type="number"
                          step="0.01"
                          className="price-input"
                          value={formData.discountFixed}
                          onChange={(e) => handlePriceComponentChange('discountFixed', e.target.value)}
                          placeholder="0.00"
                        />
                      </td>
                      <td></td>
                      <td className="price-calculated">${formData.discountFixed.toFixed(2)}</td>
                    </tr>
                    <tr>
                      <td>Round Trip Discount</td>
                      <td className="price-symbol">$</td>
                      <td>
                        <input
                          type="number"
                          step="0.01"
                          className="price-input"
                          value={formData.roundTripDiscount}
                          onChange={(e) => handlePriceComponentChange('roundTripDiscount', e.target.value)}
                          placeholder="0.00"
                        />
                      </td>
                      <td></td>
                      <td className="price-calculated">${formData.roundTripDiscount.toFixed(2)}</td>
                    </tr>
                    <tr>
                      <td>Gratuity (%)</td>
                      <td></td>
                      <td>
                        <input
                          type="number"
                          step="0.01"
                          className="price-input percentage"
                          value={formData.gratuityPercentage}
                          onChange={(e) => handlePriceComponentChange('gratuityPercentage', e.target.value)}
                          placeholder="0.00"
                        />
                      </td>
                      <td className="price-symbol">%</td>
                      <td className="price-calculated">${(formData.calculatedPrice * formData.gratuityPercentage / 100).toFixed(2)}</td>
                    </tr>
                    <tr>
                      <td>Gratuity ($)</td>
                      <td className="price-symbol">$</td>
                      <td>
                        <input
                          type="number"
                          step="0.01"
                          className="price-input"
                          value={formData.gratuityFixed}
                          onChange={(e) => handlePriceComponentChange('gratuityFixed', e.target.value)}
                          placeholder="0.00"
                        />
                      </td>
                      <td></td>
                      <td className="price-calculated">${formData.gratuityFixed.toFixed(2)}</td>
                    </tr>
                    <tr>
                      <td>Taxes (%)</td>
                      <td></td>
                      <td>
                        <input
                          type="number"
                          step="0.01"
                          className="price-input percentage"
                          value={formData.taxesPercentage}
                          onChange={(e) => handlePriceComponentChange('taxesPercentage', e.target.value)}
                          placeholder="0.00"
                        />
                      </td>
                      <td className="price-symbol">%</td>
                      <td className="price-calculated">${(formData.calculatedPrice * formData.taxesPercentage / 100).toFixed(2)}</td>
                    </tr>
                    <tr>
                      <td>Taxes ($)</td>
                      <td className="price-symbol">$</td>
                      <td>
                        <input
                          type="number"
                          step="0.01"
                          className="price-input"
                          value={formData.taxesFixed}
                          onChange={(e) => handlePriceComponentChange('taxesFixed', e.target.value)}
                          placeholder="0.00"
                        />
                      </td>
                      <td></td>
                      <td className="price-calculated">${formData.taxesFixed.toFixed(2)}</td>
                    </tr>
                    <tr>
                      <td>Credit Card Fee (%)</td>
                      <td></td>
                      <td>
                        <input
                          type="number"
                          step="0.01"
                          className="price-input percentage"
                          value={formData.creditCardFeePercentage}
                          onChange={(e) => handlePriceComponentChange('creditCardFeePercentage', e.target.value)}
                          placeholder="0.00"
                        />
                      </td>
                      <td className="price-symbol">%</td>
                      <td className="price-calculated">${formData.paymentMethod === 'credit_card' ? (calculateSubtotal(formData.calculatedPrice, formData) * formData.creditCardFeePercentage / 100).toFixed(2) : '0.00'}</td>
                    </tr>
                    <tr>
                      <td>Credit Card Fee ($)</td>
                      <td className="price-symbol">$</td>
                      <td>
                        <input
                          type="number"
                          step="0.01"
                          className="price-input"
                          value={formData.creditCardFeeFixed}
                          onChange={(e) => handlePriceComponentChange('creditCardFeeFixed', e.target.value)}
                          placeholder="0.00"
                        />
                      </td>
                      <td></td>
                      <td className="price-calculated">${formData.creditCardFeeFixed.toFixed(2)}</td>
                    </tr>
                    <tr className="total">
                      <td>Total</td>
                      <td></td>
                      <td></td>
                      <td></td>
                      <td className="price-calculated total">${formData.totalPrice.toFixed(2)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="editor-footer">
          <div className="footer-left">
            <span className="confirmation-number">Conf#: {booking?.outboundConfirmationNumber}</span>
            <span className="status-badge">{formData.status}</span>
          </div>
          <div className="footer-right">
            <button 
              className="action-btn secondary"
              onClick={onCancel}
            >
              Cancel
            </button>
                         <button 
               className="action-btn primary"
               onClick={async () => {
                 try {
                   console.log('Save & Close clicked. hasBeenSaved:', hasBeenSaved);
                   if (hasBeenSaved) {
                     console.log('Closing editor directly');
                     onClose();
                   } else {
                     console.log('Saving first, then closing');
                     await handleSave();
                     // After successful save, close the editor
                     onClose();
                   }
                 } catch (error) {
                   console.error('Error in Save & Close button:', error);
                 }
               }}
               disabled={isLoading}
             >
                               {isLoading ? 'Saving...' : 'Save & Close'}
             </button>
          </div>
        </div>
      </div>

      {/* Email Modal */}
      {showEmailModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>📧 Send Email to Customer</h3>
              <button
                className="close-button"
                onClick={() => {
                  setShowEmailModal(false);
                  setSelectedEmailTemplate(null);
                  setEmailMessage(null);
                }}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <div className="email-customer-info">
                <h4>Customer Information</h4>
                <p><strong>Name:</strong> {formData.firstName} {formData.lastName}</p>
                <p><strong>Email:</strong> {formData.email}</p>
                <p><strong>Phone:</strong> {formData.phone}</p>
                {booking && (
                  <p><strong>Confirmation:</strong> {booking.outboundConfirmationNumber}</p>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="emailTemplate">Select Email Template:</label>
                <select
                  id="emailTemplate"
                  value={selectedEmailTemplate?._id || ''}
                  onChange={(e) => {
                    const template = emailTemplates.find(t => t._id === e.target.value);
                    setSelectedEmailTemplate(template || null);
                  }}
                  className="form-select"
                >
                  <option value="">Choose a template...</option>
                  {emailTemplates.map((template) => (
                    <option key={template._id} value={template._id}>
                      {template.name} ({template.type})
                    </option>
                  ))}
                </select>
              </div>

              {selectedEmailTemplate && (
                <div className="template-preview">
                  <h5>Template Preview:</h5>
                  <div className="template-info">
                    <p><strong>Subject:</strong> {selectedEmailTemplate.subject}</p>
                    <p><strong>Type:</strong> {selectedEmailTemplate.type}</p>
                    <p><strong>Status:</strong> {selectedEmailTemplate.isActive ? 'Active' : 'Inactive'}</p>
                  </div>
                </div>
              )}

              {emailMessage && (
                <div className={`message ${emailMessage.type}`}>
                  {emailMessage.text}
                </div>
              )}

              <div className="form-actions">
                <button
                  className="btn btn-primary"
                  onClick={handleSendEmail}
                  disabled={emailLoading || !selectedEmailTemplate || !booking?._id}
                >
                  {emailLoading ? 'Sending...' : '📧 Send Email'}
                </button>
                <button
                  className="btn btn-secondary"
                  onClick={() => {
                    setShowEmailModal(false);
                    setSelectedEmailTemplate(null);
                    setEmailMessage(null);
                  }}
                  disabled={emailLoading}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Round Trip Modal */}
      {showRoundTripModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>🔄 Create Return Trip</h3>
              <button
                className="close-button"
                onClick={() => {
                  setShowRoundTripModal(false);
                  setRoundTripData({
                    returnDate: '',
                    returnHour: '12',
                    returnMinute: '00',
                    returnPeriod: 'PM'
                  });
                }}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <div className="round-trip-info">
                <p><strong>Original Trip:</strong></p>
                <p>📍 From: {formData.pickup}</p>
                <p>📍 To: {formData.dropoff}</p>
                <p>📅 Date: {formData.date} at {formData.pickupHour}:{formData.pickupMinute} {formData.pickupPeriod}</p>
                
                <div className="separator"></div>
                
                <p><strong>Return Trip:</strong></p>
                <p>📍 From: {formData.dropoff} → To: {formData.pickup}</p>
              </div>

              <div className="form-group">
                <label>Return Date *</label>
                <input
                  type="date"
                  value={roundTripData.returnDate}
                  onChange={(e) => setRoundTripData(prev => ({ ...prev, returnDate: e.target.value }))}
                  min={formData.date} // Can't be before original trip
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Return Time *</label>
                  <div className="time-inputs">
                    <select
                      value={roundTripData.returnHour}
                      onChange={(e) => setRoundTripData(prev => ({ ...prev, returnHour: e.target.value }))}
                    >
                      {Array.from({ length: 12 }, (_, i) => {
                        const hour = (i + 1).toString().padStart(2, '0');
                        return (
                          <option key={hour} value={hour}>
                            {hour}
                          </option>
                        );
                      })}
                    </select>
                    <span>:</span>
                    <select
                      value={roundTripData.returnMinute}
                      onChange={(e) => setRoundTripData(prev => ({ ...prev, returnMinute: e.target.value }))}
                    >
                      {Array.from({ length: 60 }, (_, i) => {
                        const minute = i.toString().padStart(2, '0');
                        return (
                          <option key={minute} value={minute}>
                            {minute}
                          </option>
                        );
                      })}
                    </select>
                    <select
                      value={roundTripData.returnPeriod}
                      onChange={(e) => setRoundTripData(prev => ({ ...prev, returnPeriod: e.target.value }))}
                    >
                      <option value="AM">AM</option>
                      <option value="PM">PM</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="round-trip-note">
                <p><strong>Note:</strong> The return trip will:</p>
                <ul>
                  <li>✅ Invert pickup and dropoff locations</li>
                  <li>✅ Copy all passenger and vehicle information</li>
                  <li>✅ Use the return date and time you specify</li>
                  <li>⚠️ Reset pricing (you'll need to calculate manually)</li>
                  <li>✅ Generate a new confirmation number</li>
                </ul>
              </div>

              <div className="modal-actions">
                <button
                  className="btn-secondary"
                  onClick={() => {
                    setShowRoundTripModal(false);
                    setRoundTripData({
                      returnDate: '',
                      returnHour: '12',
                      returnMinute: '00',
                      returnPeriod: 'PM'
                    });
                  }}
                >
                  Cancel
                </button>
                <button
                  className="btn-primary"
                  onClick={handleRoundTrip}
                  disabled={isLoading || !roundTripData.returnDate}
                >
                  {isLoading ? 'Creating...' : 'Create Return Trip'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BookingEditor; 