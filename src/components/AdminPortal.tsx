import React, { useState, useEffect, useCallback } from 'react';
import './AdminPortal.css';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import AreaManager from './AreaManager';
import BookingEditor from './BookingEditor';
import GlobalVariablesEditor from './GlobalVariablesEditor';
import CustomerManager from './CustomerManager';
import DriverManager from './DriverManager';
import TrashManager from './TrashManager';
import GoogleCalendarManager from './GoogleCalendarManager';
import EmailManager from './EmailManager';
import EmailVariablesManager from './EmailVariablesManager';
import ServiceAgreementManager from './ServiceAgreementManager';
import CompanyInfoManager from './CompanyInfoManager';
import UserManager from './UserManager';
import ImageUpload from './ImageUpload';
import SpecificVehiclesManager from './SpecificVehiclesManager';
import './ImageUpload.css';
import './SpecificVehiclesManager.css';

interface User {
  _id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
}

interface Reservation {
  _id: string;
  userId: string;
  pickup: string;
  dropoff: string;
  pickupDate: string;
  passengers: number;
  vehicleType: string;
  status: string;
  totalPrice: number;
  createdAt: string;
  user?: {
    firstName: string;
    lastName: string;
    email: string;
  };
}

interface AdminPortalProps {
  onBackToMain: () => void;
}

const AdminPortal: React.FC<AdminPortalProps> = ({ onBackToMain }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'calendar' | 'reservations' | 'customers' | 'settings'>('calendar');
  const [activeSettingsTab, setActiveSettingsTab] = useState<'users' | 'vehicles' | 'areas' | 'global-variables' | 'drivers' | 'google-calendar' | 'email-config' | 'email-variables' | 'service-agreement' | 'company-info'>('users');
  
  // Login state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // Data state
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [originalBookings, setOriginalBookings] = useState<any[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState({
    totalReservations: 0,
    pendingReservations: 0,
    completedReservations: 0,
    totalUsers: 0,
    totalRevenue: 0
  });
  const [tooltip, setTooltip] = useState<{ show: boolean; content: string; x: number; y: number }>({
    show: false,
    content: '',
    x: 0,
    y: 0
  });

  // Vehicle types state
  const [vehicleTypes, setVehicleTypes] = useState<any[]>([]);
  const [selectedVehicleType, setSelectedVehicleType] = useState<any>(null);
  const [showVehicleForm, setShowVehicleForm] = useState(false);
  const [showPricingConfigForm, setShowPricingConfigForm] = useState(false);
  const [showRatingsModal, setShowRatingsModal] = useState(false);
  const [showSpecificVehiclesModal, setShowSpecificVehiclesModal] = useState(false);
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [selectedImagePreview, setSelectedImagePreview] = useState<string | null>(null);
  const [showBookingEditor, setShowBookingEditor] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [vehicleTypesLoaded, setVehicleTypesLoaded] = useState(false);
  const [showTrashManager, setShowTrashManager] = useState(false);

  // Global Variables state
  const [selectedBookingForVariables, setSelectedBookingForVariables] = useState<any>(null);

  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5001/api';

  // Function to convert image to base64
  const convertToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      console.log('Converting file to Base64:', file.name, file.type, file.size);
      
      if (!file) {
        reject(new Error('No file provided for conversion'));
        return;
      }
      
      const reader = new FileReader();
      
      reader.onload = () => {
        const result = reader.result as string;
        console.log('Base64 conversion successful, length:', result.length);
        resolve(result);
      };
      
      reader.onerror = (error) => {
        console.error('Error converting file to Base64:', error);
        reject(new Error(`Failed to convert image to Base64: ${error}`));
      };
      
      reader.readAsDataURL(file);
    });
  };

  // Handle image selection
  const handleImageSelect = (file: File | null, previewUrl: string | null) => {
    setSelectedImageFile(file);
    setSelectedImagePreview(previewUrl);
  };

  // Handle form close and cleanup
  const handleVehicleFormClose = () => {
    setShowVehicleForm(false);
    setSelectedVehicleType(null);
    setSelectedImageFile(null);
    setSelectedImagePreview(null);
  };

  const fetchData = useCallback(async (authToken: string) => {
    try {
      // Fetch reservations
      const reservationsResponse = await fetch(`${API_BASE_URL}/bookings`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (reservationsResponse.ok) {
        const bookingsData = await reservationsResponse.json();
        setOriginalBookings(bookingsData);
        const reservationsData = bookingsData.map((b: any) => ({
          _id: b._id,
          userId: b.userData?.email || '',
          pickup: b.tripInfo?.pickup || '',
          dropoff: b.tripInfo?.dropoff || '',
          pickupDate: b.tripInfo?.date || '',
          passengers: b.tripInfo?.passengers || 1,
          vehicleType: b.assignedVehicle || '',
          status: b.status,
          totalPrice: b.totalPrice,
          createdAt: b.createdAt,
          user: {
            firstName: b.userData?.firstName || '',
            lastName: b.userData?.lastName || '',
            email: b.userData?.email || ''
          }
        }));
        setReservations(reservationsData);
        
        // Calculate stats
        const totalReservations = reservationsData.length;
        const pendingReservations = reservationsData.filter((r: Reservation) => r.status === 'Unassigned').length;
        const completedReservations = reservationsData.filter((r: Reservation) => r.status === 'Done').length;
        const totalRevenue = reservationsData.reduce((sum: number, r: Reservation) => sum + (r.totalPrice || 0), 0);
        
        setStats({
          totalReservations,
          pendingReservations,
          completedReservations,
          totalUsers: 0, // Will be updated after fetching users
          totalRevenue
        });
      }
      
      // Fetch users (if endpoint exists)
      try {
        const usersResponse = await fetch(`${API_BASE_URL}/users`, {
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (usersResponse.ok) {
          const usersData = await usersResponse.json();
          setUsers(usersData);
          setStats(prev => ({ ...prev, totalUsers: usersData.length }));
        }
      } catch (error) {
        console.log('Users endpoint not available');
      }
      
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setDataLoaded(true);
    }
  }, [API_BASE_URL]);

  const loadVehicleTypes = useCallback(async () => {
    if (!token) {
      console.log('❌ No token available for loading vehicle types');
      console.log('🔄 Trying public endpoint instead...');

    try {
        console.log('🔍 Loading vehicle types from public endpoint...');
        const response = await fetch(`${API_BASE_URL}/vehicle-types`);
        
        console.log('📡 Response status:', response.status);
        
        if (response.ok) {
          const data = await response.json();
          console.log('✅ Loaded vehicle types from public endpoint:', data);
          console.log('📊 Number of vehicle types:', data.length);
          setVehicleTypes(data);
        } else {
          console.error('❌ Public endpoint also failed:', response.status);
        }
      } catch (error) {
        console.error('❌ Error loading vehicle types from public endpoint:', error);
      }
      return;
    }

    try {
      console.log('🔍 Loading vehicle types...');
      console.log('✅ Token available:', !!token);
      console.log('🔑 Token (first 20 chars):', token.substring(0, 20) + '...');
      console.log('🌐 API URL:', `${API_BASE_URL}/vehicle-types/admin`);
      
      const headers = {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
      };
      
      console.log('📤 Request headers:', headers);
      
      const response = await fetch(`${API_BASE_URL}/vehicle-types/admin`, {
        headers
      });

      console.log('📡 Response status:', response.status);
      console.log('📡 Response headers:', Object.fromEntries(response.headers.entries()));

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Loaded vehicle types data:', data);
        console.log('📊 Number of vehicle types:', data.length);
        console.log('📊 Vehicle types array:', data);
        setVehicleTypes(data);
      } else {
        console.error('❌ Failed to load vehicle types:', response.status);
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ Error data:', errorData);
        
        // Fallback to public endpoint
        console.log('🔄 Trying public endpoint as fallback...');
        try {
          const publicResponse = await fetch(`${API_BASE_URL}/vehicle-types`);
          if (publicResponse.ok) {
            const publicData = await publicResponse.json();
            console.log('✅ Loaded vehicle types from public endpoint (fallback):', publicData);
            setVehicleTypes(publicData);
          }
        } catch (fallbackError) {
          console.error('❌ Fallback also failed:', fallbackError);
        }
      }
    } catch (error) {
      console.error('❌ Error loading vehicle types:', error);
    } finally {
      setVehicleTypesLoaded(true);
    }
  }, [token, API_BASE_URL]);

  const loadAreas = useCallback(async () => {
    if (!token) return;

    try {
      const response = await fetch(`${API_BASE_URL}/areas`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        // Note: areas state was removed, so we're not setting it anymore
      }
    } catch (error) {
      console.error('Error loading areas:', error);
    }
  }, [token, API_BASE_URL]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setLoginError('');

    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (response.ok && data.token) {
        setToken(data.token);
        setUser(data.user);
        setIsLoggedIn(true);
        
        // Save to localStorage
        localStorage.setItem('adminToken', data.token);
        localStorage.setItem('adminUser', JSON.stringify(data.user));
        
        // Fetch initial data
        fetchData(data.token);
      } else {
        setLoginError(data.message || 'Login failed. Please check your credentials.');
      }
    } catch (error) {
      setLoginError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setUser(null);
    setToken(null);
    setReservations([]);
    setUsers([]);
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
  };

  const handleCreateBooking = (selectedDate?: string) => {
    setSelectedBooking(selectedDate ? { tripInfo: { date: selectedDate } } : null);
    setShowBookingEditor(true);
  };

  const handleEditBooking = (booking: any) => {
    // Buscar el objeto completo en originalBookings
    const fullBooking = originalBookings.find((b) => b._id === booking._id);
    setSelectedBooking(fullBooking || booking); // Si no se encuentra, usar el booking actual
    setShowBookingEditor(true);
  };

  const handleCancelEdit = () => {
    setShowBookingEditor(false);
    setSelectedBooking(null);
  };

  const handleBookingDeleted = async () => {
    // Close the editor
    setShowBookingEditor(false);
    setSelectedBooking(null);
    
    // Refresh the data to update the calendar and reservations list
    if (token) {
      await fetchData(token);
    }
  };

  const handleBookingRestored = async () => {
    // Refresh the data to update the calendar and reservations list
    if (token) {
      await fetchData(token);
    }
  };

  const handleOpenGlobalVariables = (booking: any) => {
    setSelectedBookingForVariables(booking);
    setActiveTab('settings');
    setActiveSettingsTab('global-variables');
  };

  // Check if user is already logged in
  useEffect(() => {
    const savedToken = localStorage.getItem('adminToken');
    const savedUser = localStorage.getItem('adminUser');
    
    if (savedToken && savedUser && !dataLoaded) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
      setIsLoggedIn(true);
      fetchData(savedToken);
      loadVehicleTypes();
    }
  }, [dataLoaded]); // Only run when dataLoaded changes

  // Load vehicle types when switching to vehicles sub-tab in settings
  useEffect(() => {
    if (isLoggedIn && activeTab === 'settings' && activeSettingsTab === 'vehicles' && !vehicleTypesLoaded) {
      loadVehicleTypes();
      loadAreas();
    }
  }, [activeTab, activeSettingsTab, isLoggedIn, vehicleTypesLoaded]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price);
  };

  const handleEventMouseEnter = (info: any) => {
    const event = info.event;
    const reservation = reservations.find(r => r._id === event.id);
    if (reservation) {
      const tooltipContent = `
        <div style="padding: 10px; max-width: 300px;">
          <h4 style="margin: 0 0 8px 0; color: #333;">${reservation.user?.firstName} ${reservation.user?.lastName}</h4>
          <p style="margin: 4px 0; font-size: 12px;"><strong>Email:</strong> ${reservation.user?.email || 'N/A'}</p>
          <p style="margin: 4px 0; font-size: 12px;"><strong>From:</strong> ${reservation.pickup}</p>
          <p style="margin: 4px 0; font-size: 12px;"><strong>To:</strong> ${reservation.dropoff}</p>
          <p style="margin: 4px 0; font-size: 12px;"><strong>Date:</strong> ${formatDate(reservation.pickupDate)}</p>
          <p style="margin: 4px 0; font-size: 12px;"><strong>Passengers:</strong> ${reservation.passengers}</p>
          <p style="margin: 4px 0; font-size: 12px;"><strong>Vehicle:</strong> ${reservation.vehicleType || 'N/A'}</p>
          <p style="margin: 4px 0; font-size: 12px;"><strong>Status:</strong> ${reservation.status}</p>
          <p style="margin: 4px 0; font-size: 12px;"><strong>Price:</strong> ${formatPrice(reservation.totalPrice)}</p>
        </div>
      `;
      
      setTooltip({
        show: true,
        content: tooltipContent,
        x: info.jsEvent.pageX + 10,
        y: info.jsEvent.pageY - 10
      });
    }
  };

  const handleEventMouseLeave = () => {
    setTooltip({ show: false, content: '', x: 0, y: 0 });
  };

  // Generate events for FullCalendar
  const calendarEvents = reservations.map(r => ({
    id: r._id,
    title: (r.user ? `${r.user.firstName} ${r.user.lastName} - ` : '') + `${r.pickup} → ${r.dropoff} (${r.passengers} pax)`,
    start: r.pickupDate,
    end: r.pickupDate,
    backgroundColor: r.status === 'Done' ? '#d3d3d3' : r.status === 'Assigned' ? '#28a745' : r.status === 'Unassigned' ? '#8a2be2' : r.status === 'Canceled' ? '#dc3545' : r.status === 'On the way' ? '#ffc107' : r.status === 'Arrived' ? '#17a2b8' : r.status === 'Customer in car' ? '#fd7e14' : r.status === 'Customer dropped off' ? '#6f42c1' : r.status === 'Customer dropped off - Pending payment' ? '#e83e8c' : r.status === 'No Show' ? '#6c757d' : '#007bff',
    borderColor: '#333',
    extendedProps: {
      status: r.status,
      vehicleType: r.vehicleType,
      email: r.user?.email
    }
  }));

  const updateReservationStatus = async (reservationId: string, newStatus: string) => {
    if (!token) return;

    try {
      const response = await fetch(`${API_BASE_URL}/bookings/${reservationId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (response.ok) {
        // Update local state
        setReservations(prev => 
          prev.map(r => r._id === reservationId ? { ...r, status: newStatus } : r)
        );
        
        // Refresh stats
        fetchData(token);
      }
    } catch (error) {
      console.error('Error updating reservation status:', error);
    }
  };

  const createVehicleType = async (vehicleData: any) => {
    if (!token) {
      console.error('No token available for creating vehicle type');
      alert('Authentication required. Please log in again.');
      return;
    }

    try {
      console.log('Creating vehicle type with data:', vehicleData);
      console.log('API URL:', `${API_BASE_URL}/vehicle-types`);
      console.log('Token:', token ? 'Present' : 'Missing');
      console.log('Selected image file:', selectedImageFile);
      
      // Convert image to base64 if selected
      let imageData = vehicleData.mainImage;
      if (selectedImageFile) {
        try {
          console.log('Converting image to Base64...');
          imageData = await convertToBase64(selectedImageFile);
          console.log('Image converted successfully, length:', imageData.length);
        } catch (error) {
          console.error('Error converting image to Base64:', error);
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          alert(`Error processing image: ${errorMessage}`);
          return;
        }
      }

      // Add default pricing values for new vehicle types
      const completeVehicleData = {
        ...vehicleData,
        mainImage: imageData,
        basePrice: 55,
        distanceTiers: [
          { fromMiles: 0, toMiles: 12, pricePerMile: 3.5, description: 'Short distance' },
          { fromMiles: 12, toMiles: 20, pricePerMile: 2.0, description: 'Medium distance' },
          { fromMiles: 20, toMiles: 0, pricePerMile: 2.0, description: 'Long distance' }
        ],
        surgePricing: [],
        stopCharge: 5,
        childSeatCharge: 5,
        roundTripDiscount: 10,
        areaPrices: []
      };
      
      const response = await fetch(`${API_BASE_URL}/vehicle-types`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(completeVehicleData)
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);

      let responseData;
      try {
        responseData = await response.json();
        console.log('Response data:', responseData);
      } catch (jsonError) {
        console.log('Could not parse JSON response');
        const textResponse = await response.text();
        console.log('Text response:', textResponse);
        responseData = { message: 'Invalid JSON response' };
      }

      if (response.ok) {
        await loadVehicleTypes();
        setShowVehicleForm(false);
        setSelectedImageFile(null);
        setSelectedImagePreview(null);
        alert('Vehicle type created successfully!');
      } else {
        alert(`Error creating vehicle type: ${responseData.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error creating vehicle type:', error);
      alert(`Error creating vehicle type: ${error}`);
    }
  };

  const updateVehicleType = async (id: string, vehicleData: any) => {
    if (!token) {
      console.error('No token available for updating vehicle type');
      alert('Authentication required. Please log in again.');
      return;
    }

    try {
      // Get current vehicle data to preserve pricing information
      const currentVehicle = vehicleTypes.find(v => v._id === id);
      if (!currentVehicle) {
        alert('Vehicle not found');
        return;
      }

      console.log('Updating vehicle type:', id);
      console.log('Selected image file:', selectedImageFile);

      // Convert image to base64 if selected
      let imageData = vehicleData.mainImage || currentVehicle.mainImage;
      if (selectedImageFile) {
        try {
          console.log('Converting image to Base64...');
          imageData = await convertToBase64(selectedImageFile);
          console.log('Image converted successfully, length:', imageData.length);
        } catch (error) {
          console.error('Error converting image to Base64:', error);
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          alert(`Error processing image: ${errorMessage}`);
          return;
        }
      }

      // Merge basic info with existing pricing data
      const updatedVehicleData = {
        ...currentVehicle,
        ...vehicleData,
        mainImage: imageData,
        // Preserve existing pricing data if not provided
        distanceTiers: vehicleData.distanceTiers || currentVehicle.distanceTiers || [
          { fromMiles: 0, toMiles: 12, pricePerMile: 3.5, description: 'Short distance' },
          { fromMiles: 12, toMiles: 20, pricePerMile: 2.0, description: 'Medium distance' },
          { fromMiles: 20, toMiles: 0, pricePerMile: 2.0, description: 'Long distance' }
        ],
        surgePricing: vehicleData.surgePricing || currentVehicle.surgePricing || [],
        areaPrices: currentVehicle.areaPrices || []
      };

      const response = await fetch(`${API_BASE_URL}/vehicle-types/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updatedVehicleData)
      });

      if (response.ok) {
        await loadVehicleTypes();
        setSelectedVehicleType(null);
        setSelectedImageFile(null);
        setSelectedImagePreview(null);
        alert('Vehicle type updated successfully!');
      } else {
        alert('Error updating vehicle type');
      }
    } catch (error) {
      console.error('Error updating vehicle type:', error);
      alert('Error updating vehicle type');
    }
  };

  const deleteVehicleType = async (id: string) => {
    if (!token) return;

    try {
      const response = await fetch(`${API_BASE_URL}/vehicle-types/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        await loadVehicleTypes();
        alert('Vehicle type deleted successfully!');
      } else {
        alert('Error deleting vehicle type');
      }
    } catch (error) {
      console.error('Error deleting vehicle type:', error);
      alert('Error deleting vehicle type');
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="admin-login">
        <div className="login-container">
          <h2>Admin Login</h2>
          <form onSubmit={handleLogin}>
              <div className="form-group">
              <label>Email:</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
              <label>Password:</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            {loginError && <div className="error-message">{loginError}</div>}
            <button type="submit" disabled={isLoading}>
              {isLoading ? 'Logging in...' : 'Login'}
              </button>
            </form>
          <button onClick={onBackToMain} className="back-button">
            ← Back to Main
              </button>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-portal">
      <div className="admin-header">
        <div className="header-content">
          <h1>Admin Portal</h1>
          <div className="user-info">
            <span>Welcome, {user?.firstName} {user?.lastName}</span>
          <button onClick={handleLogout} className="logout-button">
            Logout
          </button>
          </div>
        </div>
      </div>

      <div className="admin-navigation">
        <button
          onClick={() => setActiveTab('calendar')}
          className={`nav-button ${activeTab === 'calendar' ? 'active' : ''}`}
        >
          📅 Calendar
        </button>
        <button
          onClick={() => setActiveTab('reservations')}
          className={`nav-button ${activeTab === 'reservations' ? 'active' : ''}`}
        >
          📋 Reservations ({reservations.length})
        </button>
        <button
          onClick={() => setActiveTab('customers')}
          className={`nav-button ${activeTab === 'customers' ? 'active' : ''}`}
        >
          👥 Customers
        </button>
        <button
          onClick={() => setActiveTab('settings')}
          className={`nav-button ${activeTab === 'settings' ? 'active' : ''}`}
        >
          ⚙️ Settings
        </button>
        <button
          onClick={() => setShowTrashManager(true)}
          className="nav-button trash-button"
        >
          🗑️ Trash
        </button>
        <button
          onClick={() => handleCreateBooking()}
          className="nav-button create-booking-button"
          style={{
            backgroundColor: '#28a745',
            color: 'white',
            fontWeight: 'bold',
            border: 'none',
            marginLeft: '10px'
          }}
        >
          ➕ Create Booking
        </button>
      </div>

      <div className={`admin-content${activeTab === 'calendar' ? ' calendar-view' : ''}`}>
        {/* Dashboard Stats */}
        {activeTab === 'calendar' && (
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon">📋</div>
              <div className="stat-content">
                <h3>{stats.totalReservations}</h3>
                <p>Total Reservations</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">⏳</div>
              <div className="stat-content">
                <h3>{stats.pendingReservations}</h3>
                <p>Pending</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">✅</div>
              <div className="stat-content">
                <h3>{stats.completedReservations}</h3>
                <p>Completed</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">👥</div>
              <div className="stat-content">
                <h3>{stats.totalUsers}</h3>
                <p>Total Users</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">💰</div>
              <div className="stat-content">
                <h3>{formatPrice(stats.totalRevenue)}</h3>
                <p>Total Revenue</p>
              </div>
            </div>
          </div>
        )}
        
        {/* Calendar View */}
        {activeTab === 'calendar' && (
          <div className="calendar-container">
            <FullCalendar
              plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
              initialView="dayGridMonth"
              events={calendarEvents}
              eventMouseEnter={handleEventMouseEnter}
              eventMouseLeave={handleEventMouseLeave}
              eventClick={(info) => {
                const reservation = reservations.find(r => r._id === info.event.id);
                if (reservation) {
                  handleEditBooking(reservation);
                }
              }}
              headerToolbar={{
                left: 'prev,next today',
                center: 'title',
                right: 'dayGridMonth,timeGridWeek,timeGridDay'
              }}
              height="auto"
            />
          </div>
        )}

        {/* Reservations Tab */}
        {activeTab === 'reservations' && (
          <div className="reservations-tab">
            <div className="reservations-table">
              <div className="tab-header">
                <h2>All Reservations</h2>
                <button 
                  onClick={() => fetchData(token || '')} 
                  className="action-button"
                  style={{ marginLeft: '10px' }}
                >
                  🔄 Refresh Data
                </button>
              </div>
              {reservations.length === 0 ? (
                <p className="no-data">No reservations found.</p>
              ) : (
                <table>
                  <thead>
                    <tr>
                      <th>Customer</th>
                      <th>Pickup</th>
                      <th>Dropoff</th>
                      <th>Date</th>
                      <th>Passengers</th>
                      <th>Vehicle</th>
                      <th>Status</th>
                      <th>Price</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reservations.map((reservation) => (
                      <tr key={reservation._id}>
                        <td>
                          {reservation.user ? 
                            `${reservation.user.firstName || ''} ${reservation.user.lastName || ''}`.trim() || 'Unknown Customer' : 
                            'No Customer Data'
                          }
                        </td>
                        <td>{reservation.pickup || 'Not specified'}</td>
                        <td>{reservation.dropoff || 'Not specified'}</td>
                        <td>{formatDate(reservation.pickupDate)}</td>
                        <td>{reservation.passengers || 'N/A'}</td>
                        <td>{reservation.vehicleType || 'Not specified'}</td>
                        <td>
                          <select
                            value={reservation.status || 'Unassigned'}
                            onChange={(e) => updateReservationStatus(reservation._id, e.target.value)}
                            className="status-select"
                          >
                            <option value="Unassigned">Unassigned</option>
                            <option value="Assigned">Assigned</option>
                            <option value="On the way">On the way</option>
                            <option value="Arrived">Arrived</option>
                            <option value="Customer in car">Customer in car</option>
                            <option value="Customer dropped off">Customer dropped off</option>
                            <option value="Customer dropped off - Pending payment">Customer dropped off - Pending payment</option>
                            <option value="Done">Done</option>
                            <option value="Canceled">Canceled</option>
                            <option value="No Show">No Show</option>
                          </select>
                        </td>
                        <td>{reservation.totalPrice ? formatPrice(reservation.totalPrice) : 'N/A'}</td>
                        <td>
                          <button
                            onClick={() => handleEditBooking(reservation)}
                            className="action-button"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleOpenGlobalVariables(reservation)}
                            className="action-button"
                          >
                            Variables
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
            )}
            </div>
          </div>
        )}


        {/* Customers Tab */}
        {activeTab === 'customers' && (
          <div className="customers-tab">
            <CustomerManager token={token || ''} />
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <div className="settings-tab">
            <div className="settings-navigation">
              <button
                onClick={() => setActiveSettingsTab('users')}
                className={`settings-nav-button ${activeSettingsTab === 'users' ? 'active' : ''}`}
              >
                👥 Users ({users.length})
              </button>
              <button
                onClick={() => setActiveSettingsTab('vehicles')}
                className={`settings-nav-button ${activeSettingsTab === 'vehicles' ? 'active' : ''}`}
              >
                🚗 Vehicles
              </button>
              <button
                onClick={() => setActiveSettingsTab('areas')}
                className={`settings-nav-button ${activeSettingsTab === 'areas' ? 'active' : ''}`}
              >
                🗺️ Areas
              </button>
              <button
                onClick={() => setActiveSettingsTab('global-variables')}
                className={`settings-nav-button ${activeSettingsTab === 'global-variables' ? 'active' : ''}`}
              >
                🔧 Global Variables
              </button>
              <button
                onClick={() => setActiveSettingsTab('drivers')}
                className={`settings-nav-button ${activeSettingsTab === 'drivers' ? 'active' : ''}`}
              >
                🚗 Drivers
              </button>
              <button
                onClick={() => setActiveSettingsTab('google-calendar')}
                className={`settings-nav-button ${activeSettingsTab === 'google-calendar' ? 'active' : ''}`}
              >
                📅 Google Calendar
              </button>
              <button
                onClick={() => setActiveSettingsTab('email-config')}
                className={`settings-nav-button ${activeSettingsTab === 'email-config' ? 'active' : ''}`}
              >
                📧 Email Configuration
              </button>
              <button
                onClick={() => setActiveSettingsTab('email-variables')}
                className={`settings-nav-button ${activeSettingsTab === 'email-variables' ? 'active' : ''}`}
              >
                📝 Email Variables
              </button>
              <button
                onClick={() => setActiveSettingsTab('service-agreement')}
                className={`settings-nav-button ${activeSettingsTab === 'service-agreement' ? 'active' : ''}`}
              >
                📄 Service Agreement
              </button>
              <button
                onClick={() => setActiveSettingsTab('company-info')}
                className={`settings-nav-button ${activeSettingsTab === 'company-info' ? 'active' : ''}`}
              >
                🏢 Company Info
              </button>
            </div>

            <div className="settings-content">
              {/* Users Sub-tab */}
              {activeSettingsTab === 'users' && token && (
                <UserManager token={token} />
              )}

              {/* Vehicles Sub-tab */}
              {activeSettingsTab === 'vehicles' && (
                <div className="vehicles-tab">
                  <div className="vehicles-main-container">
                    <div className="tab-header">
                      <h2>Vehicle Types Management</h2>
                      <div className="tab-actions">
                        <button onClick={() => setShowVehicleForm(true)} className="action-button primary">
                          + Add Vehicle Type
                        </button>
                      </div>
                    </div>

                    {vehicleTypes.length === 0 ? (
                      <p className="no-data">No vehicle types found.</p>
                    ) : (
                      <div className="vehicles-grid">
                        {vehicleTypes.map((vehicleType) => (
                          <div key={vehicleType._id} className="vehicle-card">
                            <div className="vehicle-image-section">
                              {vehicleType.mainImage ? (
                                <img 
                                  src={vehicleType.mainImage} 
                                  alt={vehicleType.name}
                                  className="vehicle-image"
                                  onError={(e) => {
                                    e.currentTarget.style.display = 'none';
                                  }}
                                />
                              ) : (
                                <div className="vehicle-image-placeholder">
                                  <span>🚗</span>
                                  <p>No Image</p>
                                </div>
                              )}
                            </div>
                            <div className="vehicle-header">
                              <h3>{vehicleType.name}</h3>
                              <div className="vehicle-actions">
                                <button 
                                  onClick={() => {
                                    setSelectedVehicleType(vehicleType);
                                    setShowPricingConfigForm(true);
                                  }}
                                  className="action-button small"
                                  title="Configure Pricing"
                                >
                                  💰 Pricing
                                </button>
                                {vehicleType.averageRating > 0 && (
                                  <button 
                                    onClick={() => {
                                      setSelectedVehicleType(vehicleType);
                                      setShowRatingsModal(true);
                                    }}
                                    className="action-button small"
                                    title="View Ratings"
                                  >
                                    ⭐ Ratings
                                  </button>
                                )}
                                <button 
                                  onClick={() => {
                                    setSelectedVehicleType(vehicleType);
                                    setShowSpecificVehiclesModal(true);
                                  }}
                                  className="action-button small"
                                  title="Manage Specific Vehicles"
                                >
                                  🚙 Vehicles
                                </button>
                                <button 
                                  onClick={() => {
                                    setSelectedVehicleType(vehicleType);
                                    setShowVehicleForm(true);
                                  }}
                                  className="action-button small"
                                  title="Edit Vehicle Type"
                                >
                                  ✏️ Edit
                                </button>
                                <button 
                                  onClick={() => {
                                    if (window.confirm('Are you sure you want to delete this vehicle type?')) {
                                      deleteVehicleType(vehicleType._id);
                                    }
                                  }}
                                  className="action-button small danger"
                                  title="Delete Vehicle"
                                >
                                  🗑️ Delete
                                </button>
                              </div>
                            </div>
                            <div className="vehicle-details">
                              <div className="vehicle-info">
                                <p><strong>Capacity:</strong> {vehicleType.capacity} passengers</p>
                                <p><strong>Base Price:</strong> ${vehicleType.basePrice}</p>
                                <p><strong>Description:</strong> {vehicleType.description}</p>
                                {vehicleType.averageRating > 0 && (
                                  <p><strong>Rating:</strong> ⭐ {vehicleType.averageRating.toFixed(1)} ({vehicleType.totalRatings} reviews)</p>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Areas Sub-tab */}
              {activeSettingsTab === 'areas' && (
                <div className="areas-tab">
                  <div className="tab-header">
                    <h2>Areas Management</h2>
                  </div>
                  <div className="areas-content">
                    <div className="areas-section">
                      <h3>Area Management</h3>
                      <AreaManager />
                    </div>
                  </div>
                </div>
              )}

              {/* Global Variables Sub-tab */}
              {activeSettingsTab === 'global-variables' && (
                <div className="global-variables-tab">
                  <div className="tab-header">
                    <h2>Global Variables</h2>
                    {selectedBookingForVariables && (
                      <div className="selected-booking-info">
                        <h3>Booking: {selectedBookingForVariables.outboundConfirmationNumber}</h3>
                        <p>
                          {selectedBookingForVariables.user?.firstName} {selectedBookingForVariables.user?.lastName} - 
                          {selectedBookingForVariables.pickup} → {selectedBookingForVariables.dropoff}
                        </p>
                      </div>
                    )}
                  </div>
                  
                  <div className="global-variables-content">
                    {selectedBookingForVariables ? (
                      <div className="global-variables-section">
                        <GlobalVariablesEditor 
                          bookingId={selectedBookingForVariables._id}
                          onVariablesChange={(variables) => {
                            console.log('Variables updated:', variables);
                          }}
                        />
                      </div>
                    ) : (
                      <div className="no-booking-selected">
                        <h3>No Booking Selected</h3>
                        <p>Please select a booking from the Reservations tab to view and edit its global variables.</p>
                        <button
                          onClick={() => setActiveTab('reservations')}
                          className="action-button"
                        >
                          Go to Reservations
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Drivers Sub-tab */}
              {activeSettingsTab === 'drivers' && (
                <div className="drivers-tab">
                  <div className="tab-header">
                    <h2>Driver Management</h2>
                  </div>
                  <div className="drivers-content">
                    <DriverManager token={token || ''} />
                  </div>
                </div>
              )}

              {/* Google Calendar Sub-tab */}
              {activeSettingsTab === 'google-calendar' && (
                <div className="google-calendar-tab">
                  <GoogleCalendarManager />
                </div>
              )}

              {/* Email Configuration Sub-tab */}
              {activeSettingsTab === 'email-config' && (
                <div className="email-config-tab">
                  <EmailManager token={token || ''} />
                </div>
              )}

              {/* Email Variables Sub-tab */}
              {activeSettingsTab === 'email-variables' && (
                <div className="email-variables-tab">
                  <EmailVariablesManager />
                </div>
              )}

              {/* Service Agreement Sub-tab */}
              {activeSettingsTab === 'service-agreement' && (
                <div className="service-agreement-tab">
                  <ServiceAgreementManager token={token || ''} />
                </div>
              )}

              {/* Company Info Sub-tab */}
              {activeSettingsTab === 'company-info' && (
                <div className="company-info-tab">
                  <CompanyInfoManager token={token || ''} />
                </div>
              )}

              {/* All sub-tabs are now implemented - no placeholder needed */}
            </div>
          </div>
        )}








      </div>

        {/* Booking Editor Modal */}
        {showBookingEditor && (
          <BookingEditor
            booking={selectedBooking}
            token={token || undefined}
          onSave={async (booking) => {
            if (selectedBooking) {
              // Update existing booking
              setReservations(prev => 
                prev.map(r => r._id === booking._id ? booking : r)
              );
            } else {
              // Add new booking
              setReservations(prev => [...prev, booking]);
            }
            
            // Refresh data from backend to ensure calendar is updated
            if (token) {
              await fetchData(token);
            }
            
            handleCancelEdit();
          }}
          onClose={handleCancelEdit}
          onCancel={handleCancelEdit}
          onDelete={handleBookingDeleted}
        />
      )}

      {/* Vehicle Type Form Modal */}
      {showVehicleForm && (
    <div className="modal-overlay">
      <div className="modal-content large">
        <div className="modal-header">
              <h3>{selectedVehicleType ? 'Edit Vehicle Type' : 'Add New Vehicle Type'}</h3>
              <button onClick={handleVehicleFormClose} className="close-btn">×</button>
        </div>
        <div className="modal-body">
              <form onSubmit={(e) => {
    e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const vehicleData = {
                  name: formData.get('name'),
                  capacity: parseInt(formData.get('capacity') as string),
                  basePrice: parseFloat(formData.get('basePrice') as string),
                  description: formData.get('description'),
                  mainImage: formData.get('mainImage')
                };
                
                if (selectedVehicleType) {
                  updateVehicleType(selectedVehicleType._id, vehicleData);
        } else {
                  createVehicleType(vehicleData);
                }
              }}>
                  <div className="form-group">
                  <label>Vehicle Name *</label>
                    <input
                      type="text"
                    name="name"
                    defaultValue={selectedVehicleType?.name || ''}
                      required
                    />
                  </div>
                  <div className="form-group">
                  <label>Capacity (passengers) *</label>
                    <input
                      type="number"
                    name="capacity"
                    defaultValue={selectedVehicleType?.capacity || ''}
                    min="1"
                    max="20"
                    required
                    />
                  </div>
                  <div className="form-group">
                  <label>Base Price ($) *</label>
                    <input
                      type="number"
                    name="basePrice"
                    defaultValue={selectedVehicleType?.basePrice || ''}
                      min="0"
                    step="0.01"
                    required
                    />
                  </div>
                  <div className="form-group">
                  <label>Description</label>
                    <textarea
                    name="description"
                    defaultValue={selectedVehicleType?.description || ''}
                      rows={3}
                    />
                  </div>
                <div className="form-group">
                  <ImageUpload
                    onImageSelect={handleImageSelect}
                    currentImageUrl={selectedVehicleType?.mainImage}
                    label="Main Image"
                    accept="image/*"
                    maxSizeMB={5}
                  />
                </div>
                <div className="form-actions">
                  <button type="submit" className="action-button primary">
                    {selectedVehicleType ? 'Update Vehicle' : 'Create Vehicle'}
                  </button>
                  <button type="button" onClick={handleVehicleFormClose} className="action-button">
                    Cancel
                  </button>
                </div>
              </form>
            </div>
                        </div>
                      </div>
                    )}

      {/* Pricing Configuration Modal */}
      {showPricingConfigForm && selectedVehicleType && (
        <PricingConfigForm
          vehicleType={selectedVehicleType}
          onSubmit={(data) => updateVehicleType(selectedVehicleType._id, data)}
          onCancel={() => {
            setShowPricingConfigForm(false);
            setSelectedVehicleType(null);
          }}
        />
      )}

      {/* Specific Vehicles Manager Modal */}
      {showSpecificVehiclesModal && selectedVehicleType && token && (
        <SpecificVehiclesManager
          vehicleType={selectedVehicleType}
          token={token}
          onClose={() => {
            setShowSpecificVehiclesModal(false);
            setSelectedVehicleType(null);
          }}
        />
      )}

      {/* Trash Manager Modal */}
      {showTrashManager && (
        <TrashManager
          isOpen={showTrashManager}
          onClose={() => setShowTrashManager(false)}
        />
      )}

      {/* Tooltip */}
      {tooltip.show && (
        <div
          className="tooltip"
          style={{
            position: 'fixed',
            left: tooltip.x,
            top: tooltip.y,
            zIndex: 1000,
            backgroundColor: 'white',
            border: '1px solid #ccc',
            borderRadius: '4px',
            padding: '8px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            maxWidth: '300px'
          }}
          dangerouslySetInnerHTML={{ __html: tooltip.content }}
        />
      )}
    </div>
  );
};

// Pricing Configuration Form Component
const PricingConfigForm: React.FC<{
  vehicleType?: any;
  onSubmit: (data: any) => void;
  onCancel: () => void;
}> = ({ vehicleType, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    basePrice: vehicleType?.basePrice || 55,
    baseDistanceThreshold: vehicleType?.baseDistanceThreshold || 12,
    stopCharge: vehicleType?.stopCharge || 5,
    childSeatCharge: vehicleType?.childSeatCharge || 5,
    roundTripDiscount: vehicleType?.roundTripDiscount || 10,
    cashDiscountPercentage: vehicleType?.cashDiscountPercentage || 0,
    cashDiscountFixedAmount: vehicleType?.cashDiscountFixedAmount || 0,
  });

  const [distanceTiers, setDistanceTiers] = useState<any[]>(
    vehicleType?.distanceTiers || [
      { fromMiles: 0, toMiles: 13, pricePerMile: 3.5, description: 'Short distance (0-13 additional miles)' },
      { fromMiles: 13, toMiles: 25, pricePerMile: 2.0, description: 'Medium distance (13-25 additional miles)' },
      { fromMiles: 25, toMiles: 0, pricePerMile: 2.0, description: 'Long distance (25+ additional miles)' }
    ]
  );

  const [surgePricing, setSurgePricing] = useState<any[]>(
    vehicleType?.surgePricing || []
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.basePrice || formData.basePrice < 0) {
      alert('Base Price must be a positive number');
      return;
    }

    const completeData = {
      ...formData,
      distanceTiers,
      surgePricing
    };

    onSubmit(completeData);
  };

  const addDistanceTier = () => {
    const newTier = {
      fromMiles: 0,
      toMiles: 0,
      pricePerMile: 0,
      description: ''
    };
    setDistanceTiers([...distanceTiers, newTier]);
  };

  const removeDistanceTier = (index: number) => {
    setDistanceTiers(distanceTiers.filter((_, i) => i !== index));
  };

  const updateDistanceTier = (index: number, field: string, value: any) => {
    const updatedTiers = [...distanceTiers];
    updatedTiers[index] = { ...updatedTiers[index], [field]: value };
    setDistanceTiers(updatedTiers);
  };

  const addSurgePricing = () => {
    const newSurge = {
      name: '',
      description: '',
      multiplier: 1.5,
      isActive: true,
      daysOfWeek: [],
      startTime: '',
      endTime: '',
      startDate: '',
      endDate: '',
      specificDates: [],
      priority: 1
    };
    setSurgePricing([...surgePricing, newSurge]);
  };

  const removeSurgePricing = (index: number) => {
    setSurgePricing(surgePricing.filter((_, i) => i !== index));
  };

  const updateSurgePricing = (index: number, field: string, value: any) => {
    const updatedSurges = [...surgePricing];
    updatedSurges[index] = { ...updatedSurges[index], [field]: value };
    setSurgePricing(updatedSurges);
  };

  const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  return (
    <div className="modal-overlay">
      <div className="modal-content large">
        <div className="modal-header">
        <h3>Pricing Configuration - {vehicleType?.name}</h3>
          <button onClick={onCancel} className="close-btn">×</button>
        </div>
        <div className="modal-body">
        <form onSubmit={handleSubmit}>
            <div className="pricing-config-sections">
              
              {/* Basic Pricing Section */}
              <div className="pricing-section">
                <h4 className="section-title">💰 Basic Pricing</h4>
                <div className="form-grid">
              <div className="form-group">
                <label>Base Price ($)</label>
                <input
                  type="number"
                  value={formData.basePrice}
                  onChange={(e) => setFormData({...formData, basePrice: parseFloat(e.target.value)})}
                  min="0"
                  step="0.01"
                />
              </div>
              <div className="form-group">
                <label>Base Distance Threshold (miles)</label>
                <input
                  type="number"
                  value={formData.baseDistanceThreshold}
                  onChange={(e) => setFormData({...formData, baseDistanceThreshold: parseFloat(e.target.value)})}
                  min="0"
                  step="0.1"
                />
              </div>
              <div className="form-group">
                <label>Stop Charge ($)</label>
                <input
                  type="number"
                  value={formData.stopCharge}
                  onChange={(e) => setFormData({...formData, stopCharge: parseFloat(e.target.value)})}
                  min="0"
                  step="0.01"
                />
              </div>
              <div className="form-group">
                <label>Child Seat Charge ($)</label>
                <input
                  type="number"
                  value={formData.childSeatCharge}
                  onChange={(e) => setFormData({...formData, childSeatCharge: parseFloat(e.target.value)})}
                  min="0"
                  step="0.01"
                />
              </div>
              <div className="form-group">
                <label>Round Trip Discount (%)</label>
                <input
                  type="number"
                  value={formData.roundTripDiscount}
                  onChange={(e) => setFormData({...formData, roundTripDiscount: parseFloat(e.target.value)})}
                  min="0"
                  max="100"
                  step="0.01"
                />
              </div>
              </div>
              </div>

              {/* Distance Tiers Section */}
              <div className="pricing-section">
                <h4 className="section-title">📏 Distance Tiers</h4>
                <div className="tiers-container">
                  {distanceTiers.map((tier, index) => (
                    <div key={index} className="tier-card">
                      <div className="tier-header">
                        <span className="tier-number">Tier {index + 1}</span>
                          <button 
                            type="button" 
                            onClick={() => removeDistanceTier(index)}
                            className="remove-button"
                          >
                          ×
                          </button>
                        </div>
                      <div className="tier-content">
                        <div className="tier-fields-grid">
                          <div className="field-group">
                            <label>From Miles</label>
                            <input
                              type="number"
                              value={tier.fromMiles}
                              onChange={(e) => updateDistanceTier(index, 'fromMiles', parseFloat(e.target.value) || 0)}
                              min="0"
                              step="0.1"
                            />
                          </div>
                          <div className="field-group">
                            <label>To Miles</label>
                            <input
                              type="number"
                              value={tier.toMiles}
                              onChange={(e) => updateDistanceTier(index, 'toMiles', parseFloat(e.target.value) || 0)}
                              min="0"
                              step="0.1"
                            />
                          </div>
                          <div className="field-group">
                            <label>Price Per Mile ($)</label>
                              <input
                                type="number"
                                value={tier.pricePerMile}
                              onChange={(e) => updateDistanceTier(index, 'pricePerMile', parseFloat(e.target.value) || 0)}
                                min="0"
                                step="0.01"
                              />
                            </div>
                          <div className="field-group full-width">
                            <label>Description</label>
                            <input
                              type="text"
                              value={tier.description}
                              onChange={(e) => updateDistanceTier(index, 'description', e.target.value)}
                              placeholder="e.g., Short distance, Medium distance"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  <button type="button" onClick={addDistanceTier} className="add-tier-btn">
                    + Add Distance Tier
                  </button>
                </div>
                    </div>

              {/* Surge Pricing Section */}
              <div className="pricing-section">
                <h4 className="section-title">⚡ Surge Pricing</h4>
                <div className="surge-container">
              {surgePricing.map((surge, index) => (
                    <div key={index} className="surge-card">
                  <div className="surge-header">
                        <span className="surge-number">Surge {index + 1}</span>
                    <button 
                      type="button" 
                      onClick={() => removeSurgePricing(index)}
                          className="remove-button"
                    >
                          ×
                    </button>
                  </div>
                      <div className="surge-content">
                        <div className="surge-fields-grid">
                          <div className="field-group">
                            <label>Multiplier</label>
                      <input
                        type="number"
                        value={surge.multiplier}
                              onChange={(e) => updateSurgePricing(index, 'multiplier', parseFloat(e.target.value) || 1)}
                        min="1"
                        step="0.1"
                      />
                    </div>
                          <div className="field-group">
                            <label>Day of Week</label>
                            <select
                              value={surge.dayOfWeek}
                              onChange={(e) => updateSurgePricing(index, 'dayOfWeek', e.target.value)}
                            >
                              {daysOfWeek.map((day) => (
                                <option key={day} value={day}>{day}</option>
                              ))}
                            </select>
                        </div>
                          <div className="field-group">
                            <label>Start Time</label>
                          <input
                            type="time"
                            value={surge.startTime}
                            onChange={(e) => updateSurgePricing(index, 'startTime', e.target.value)}
                          />
                          </div>
                          <div className="field-group">
                            <label>End Time</label>
                          <input
                            type="time"
                            value={surge.endTime}
                            onChange={(e) => updateSurgePricing(index, 'endTime', e.target.value)}
                          />
                        </div>
                          <div className="field-group full-width">
                            <label>Description</label>
                          <input
                              type="text"
                              value={surge.description}
                              onChange={(e) => updateSurgePricing(index, 'description', e.target.value)}
                              placeholder="e.g., Weekend surge, Peak hours"
                          />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
                  <button type="button" onClick={addSurgePricing} className="add-surge-btn">
                    + Add Surge Pricing
                  </button>
            </div>
              </div>
            </div>

          <div className="form-actions">
            <button type="submit" className="action-button primary">
              Save Configuration
            </button>
            <button type="button" onClick={onCancel} className="action-button">
              Cancel
            </button>
          </div>
        </form>
        </div>
      </div>
    </div>
  );
};

export default AdminPortal;
