import React, { useState, useEffect, useCallback } from 'react';
import './DriverDashboard.css';

interface Driver {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  photo?: string;
  isActive: boolean;
  isAvailable: boolean;
  rating: number;
  totalTrips: number;
  totalEarnings: number;
  vehicleAssigned?: {
    _id: string;
    name: string;
    licensePlate: string;
  };
  currentLocation?: {
    lat: number;
    lng: number;
    address: string;
  };
  schedule?: {
    monday: { start: string; end: string; available: boolean };
    tuesday: { start: string; end: string; available: boolean };
    wednesday: { start: string; end: string; available: boolean };
    thursday: { start: string; end: string; available: boolean };
    friday: { start: string; end: string; available: boolean };
    saturday: { start: string; end: string; available: boolean };
    sunday: { start: string; end: string; available: boolean };
  };
}

interface Booking {
  _id: string;
  outboundConfirmationNumber: string;
  tripInfo: {
    pickup: string;
    dropoff: string;
    date: string;
    pickupHour: string;
    pickupMinute: string;
    pickupPeriod: string;
    passengers: number;
  };
  userData: {
    firstName: string;
    lastName: string;
    phone: string;
  };
  status: string;
  totalPrice: number;
  createdAt: string;
}

interface DriverStats {
  totalTrips: number;
  completedTrips: number;
  pendingTrips: number;
  inProgressTrips: number;
  totalEarnings: number;
  averageRating: number;
  thisMonthTrips: number;
  thisMonthEarnings: number;
}

const DriverDashboard: React.FC = () => {
  const [driver, setDriver] = useState<Driver | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [stats, setStats] = useState<DriverStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAvailable, setIsAvailable] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'overview' | 'bookings' | 'schedule' | 'earnings'>('overview');

  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5001/api';

  const fetchDriverProfile = useCallback(async () => {
    try {
      const token = localStorage.getItem('driverToken');
      if (!token) {
        throw new Error('No driver token found');
      }

      const response = await fetch(`${API_BASE_URL}/drivers/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const driverData = await response.json();
        setDriver(driverData);
        setIsAvailable(driverData.isAvailable);
      }
    } catch (error) {
      console.error('Error fetching driver profile:', error);
    }
  }, [API_BASE_URL]);

  const fetchDriverBookings = useCallback(async () => {
    try {
      const token = localStorage.getItem('driverToken');
      if (!token) return;

      const response = await fetch(`${API_BASE_URL}/drivers/bookings`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setBookings(data.bookings || []);
      }
    } catch (error) {
      console.error('Error fetching driver bookings:', error);
    }
  }, [API_BASE_URL]);

  const fetchDriverStats = useCallback(async () => {
    try {
      const token = localStorage.getItem('driverToken');
      if (!token || !driver) return;

      const response = await fetch(`${API_BASE_URL}/drivers/${driver._id}/stats`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const statsData = await response.json();
        setStats(statsData);
      }
    } catch (error) {
      console.error('Error fetching driver stats:', error);
    }
  }, [API_BASE_URL, driver]);

  const updateAvailability = async (available: boolean) => {
    try {
      const token = localStorage.getItem('driverToken');
      if (!token || !driver) return;

      const response = await fetch(`${API_BASE_URL}/drivers/${driver._id}/availability`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ isAvailable: available })
      });

      if (response.ok) {
        setIsAvailable(available);
        setDriver(prev => prev ? { ...prev, isAvailable: available } : null);
      }
    } catch (error) {
      console.error('Error updating availability:', error);
    }
  };

  const updateLocation = async () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by this browser.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const token = localStorage.getItem('driverToken');
          if (!token || !driver) return;

          const { latitude, longitude } = position.coords;
          
          // Reverse geocoding to get address
          const geocodeResponse = await fetch(
            `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${process.env.REACT_APP_GOOGLE_MAPS_API_KEY}`
          );
          
          let address = 'Location updated';
          if (geocodeResponse.ok) {
            const geocodeData = await geocodeResponse.json();
            if (geocodeData.results && geocodeData.results[0]) {
              address = geocodeData.results[0].formatted_address;
            }
          }

          const response = await fetch(`${API_BASE_URL}/drivers/${driver._id}/availability`, {
            method: 'PUT',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              currentLocation: {
                lat: latitude,
                lng: longitude,
                address
              }
            })
          });

          if (response.ok) {
            setCurrentLocation(address);
            setDriver(prev => prev ? {
              ...prev,
              currentLocation: { lat: latitude, lng: longitude, address }
            } : null);
          }
        } catch (error) {
          console.error('Error updating location:', error);
        }
      },
      (error) => {
        console.error('Error getting location:', error);
        alert('Unable to get your location. Please check your browser settings.');
      }
    );
  };

  const handleLogout = () => {
    localStorage.removeItem('driverToken');
    localStorage.removeItem('driverData');
    window.location.reload();
  };

  useEffect(() => {
    const initializeDashboard = async () => {
      setLoading(true);
      await fetchDriverProfile();
      await fetchDriverBookings();
      setLoading(false);
    };

    initializeDashboard();
  }, [fetchDriverProfile, fetchDriverBookings]);

  useEffect(() => {
    if (driver) {
      fetchDriverStats();
    }
  }, [driver, fetchDriverStats]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatTime = (hour: string, minute: string, period: string) => {
    return `${hour}:${minute.padStart(2, '0')} ${period}`;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="driver-dashboard-loading">
        <div className="loading-spinner"></div>
        <p>Loading driver dashboard...</p>
      </div>
    );
  }

  if (!driver) {
    return (
      <div className="driver-dashboard-error">
        <h2>Driver Login Required</h2>
        <p>Please log in to access the driver dashboard.</p>
        <button onClick={() => window.location.href = '/driver-login'}>
          Go to Login
        </button>
      </div>
    );
  }

  return (
    <div className="driver-dashboard">
      <div className="driver-header">
        <div className="driver-info">
          <div className="driver-photo-section">
            {driver.photo ? (
              <img 
                src={`${API_BASE_URL.replace('/api', '')}${driver.photo}`} 
                alt={`${driver.firstName} ${driver.lastName}`}
                className="driver-photo"
              />
            ) : (
              <div className="driver-photo-placeholder">
                {driver.firstName.charAt(0)}{driver.lastName.charAt(0)}
              </div>
            )}
          </div>
          <div className="driver-details">
            <h1>Welcome, {driver.firstName} {driver.lastName}</h1>
            <p className="driver-email">{driver.email}</p>
            <div className="driver-status">
              <span className={`status ${driver.isActive ? 'active' : 'inactive'}`}>
                {driver.isActive ? 'Active' : 'Inactive'}
              </span>
              <span className={`availability ${driver.isAvailable ? 'available' : 'unavailable'}`}>
                {driver.isAvailable ? 'Available' : 'Unavailable'}
              </span>
            </div>
          </div>
        </div>
        <div className="driver-actions">
          <button
            onClick={() => updateAvailability(!isAvailable)}
            className={`availability-toggle ${isAvailable ? 'unavailable' : 'available'}`}
          >
            {isAvailable ? 'Set Unavailable' : 'Set Available'}
          </button>
          <button onClick={updateLocation} className="location-btn">
            📍 Update Location
          </button>
          <button onClick={handleLogout} className="logout-btn">
            Logout
          </button>
        </div>
      </div>

      {driver.currentLocation && (
        <div className="location-info">
          <strong>Current Location:</strong> {driver.currentLocation.address}
        </div>
      )}

      <div className="dashboard-navigation">
        <button
          onClick={() => setActiveTab('overview')}
          className={`nav-btn ${activeTab === 'overview' ? 'active' : ''}`}
        >
          📊 Overview
        </button>
        <button
          onClick={() => setActiveTab('bookings')}
          className={`nav-btn ${activeTab === 'bookings' ? 'active' : ''}`}
        >
          📋 Bookings ({bookings.length})
        </button>
        <button
          onClick={() => setActiveTab('schedule')}
          className={`nav-btn ${activeTab === 'schedule' ? 'active' : ''}`}
        >
          📅 Schedule
        </button>
        <button
          onClick={() => setActiveTab('earnings')}
          className={`nav-btn ${activeTab === 'earnings' ? 'active' : ''}`}
        >
          💰 Earnings
        </button>
      </div>

      <div className="dashboard-content">
        {activeTab === 'overview' && (
          <div className="overview-tab">
            <div className="stats-grid">
              <div className="stat-card">
                <h3>Total Trips</h3>
                <p className="stat-number">{stats?.totalTrips || driver.totalTrips}</p>
              </div>
              <div className="stat-card">
                <h3>Completed Trips</h3>
                <p className="stat-number">{stats?.completedTrips || 0}</p>
              </div>
              <div className="stat-card">
                <h3>Total Earnings</h3>
                <p className="stat-number">{formatCurrency(stats?.totalEarnings || driver.totalEarnings)}</p>
              </div>
              <div className="stat-card">
                <h3>Average Rating</h3>
                <p className="stat-number">{driver.rating.toFixed(1)} ⭐</p>
              </div>
              <div className="stat-card">
                <h3>This Month Trips</h3>
                <p className="stat-number">{stats?.thisMonthTrips || 0}</p>
              </div>
              <div className="stat-card">
                <h3>This Month Earnings</h3>
                <p className="stat-number">{formatCurrency(stats?.thisMonthEarnings || 0)}</p>
              </div>
            </div>

            {driver.vehicleAssigned && (
              <div className="vehicle-info">
                <h3>Assigned Vehicle</h3>
                <p><strong>Vehicle:</strong> {driver.vehicleAssigned.name}</p>
                <p><strong>License Plate:</strong> {driver.vehicleAssigned.licensePlate}</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'bookings' && (
          <div className="bookings-tab">
            <h2>My Bookings</h2>
            {bookings.length === 0 ? (
              <div className="no-bookings">
                <p>No bookings assigned yet.</p>
              </div>
            ) : (
              <div className="bookings-grid">
                {bookings.map((booking) => (
                  <div key={booking._id} className="booking-card">
                    <div className="booking-header">
                      <h3>Booking #{booking.outboundConfirmationNumber}</h3>
                      <span className={`status ${booking.status}`}>
                        {booking.status}
                      </span>
                    </div>
                    <div className="booking-details">
                      <p><strong>Date:</strong> {formatDate(booking.tripInfo.date)}</p>
                      <p><strong>Time:</strong> {formatTime(
                        booking.tripInfo.pickupHour,
                        booking.tripInfo.pickupMinute,
                        booking.tripInfo.pickupPeriod
                      )}</p>
                      <p><strong>Pickup:</strong> {booking.tripInfo.pickup}</p>
                      <p><strong>Dropoff:</strong> {booking.tripInfo.dropoff}</p>
                      <p><strong>Passengers:</strong> {booking.tripInfo.passengers}</p>
                      <p><strong>Customer:</strong> {booking.userData.firstName} {booking.userData.lastName}</p>
                      <p><strong>Phone:</strong> {booking.userData.phone}</p>
                      <p><strong>Total:</strong> {formatCurrency(booking.totalPrice)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'schedule' && (
          <div className="schedule-tab">
            <h2>My Schedule</h2>
            <div className="schedule-grid">
              {driver.schedule && Object.entries(driver.schedule).map(([day, schedule]) => (
                <div key={day} className="schedule-day">
                  <h3>{day.charAt(0).toUpperCase() + day.slice(1)}</h3>
                  <div className={`schedule-status ${schedule.available ? 'available' : 'unavailable'}`}>
                    {schedule.available ? 'Available' : 'Unavailable'}
                  </div>
                  {schedule.available && (
                    <div className="schedule-times">
                      <p><strong>Start:</strong> {schedule.start}</p>
                      <p><strong>End:</strong> {schedule.end}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'earnings' && (
          <div className="earnings-tab">
            <h2>Earnings Overview</h2>
            <div className="earnings-stats">
              <div className="earnings-card">
                <h3>Total Earnings</h3>
                <p className="earnings-amount">{formatCurrency(stats?.totalEarnings || driver.totalEarnings)}</p>
              </div>
              <div className="earnings-card">
                <h3>This Month</h3>
                <p className="earnings-amount">{formatCurrency(stats?.thisMonthEarnings || 0)}</p>
              </div>
              <div className="earnings-card">
                <h3>Average per Trip</h3>
                <p className="earnings-amount">
                  {stats?.totalTrips ? formatCurrency((stats.totalEarnings / stats.totalTrips)) : '$0.00'}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DriverDashboard; 