import React, { useState, useEffect, useCallback } from 'react';
import './DriverManager.css';

interface Driver {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  photo?: string;
  licenseNumber: string;
  licenseExpiry: string;
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
  emergencyContact: {
    name: string;
    phone: string;
    relationship: string;
  };
  schedule: {
    monday: { start: string; end: string; available: boolean };
    tuesday: { start: string; end: string; available: boolean };
    wednesday: { start: string; end: string; available: boolean };
    thursday: { start: string; end: string; available: boolean };
    friday: { start: string; end: string; available: boolean };
    saturday: { start: string; end: string; available: boolean };
    sunday: { start: string; end: string; available: boolean };
  };
  documents: {
    license: string;
    insurance: string;
    backgroundCheck: string;
    drugTest: string;
  };
  createdAt: string;
}

interface Vehicle {
  _id: string;
  name: string;
  licensePlate: string;
  vehicleType: string;
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

interface DriverManagerProps {
  token: string;
}

const DriverManager: React.FC<DriverManagerProps> = ({ token }) => {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [showSchedule, setShowSchedule] = useState(false);
  const [driverStats, setDriverStats] = useState<DriverStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Form state
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    phone: '',
    licenseNumber: '',
    licenseExpiry: '',
    emergencyContact: {
      name: '',
      phone: '',
      relationship: ''
    }
  });
  const [selectedPhoto, setSelectedPhoto] = useState<File | null>(null);

  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5001/api';

  const fetchDrivers = useCallback(async () => {
    try {
      setLoading(true);
      
      if (!token) {
        console.error('No admin token found');
        alert('Please log in as admin to view drivers');
        return;
      }
      
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10',
        ...(searchTerm && { search: searchTerm }),
        ...(statusFilter && { status: statusFilter })
      });

      const response = await fetch(`${API_BASE_URL}/drivers?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Drivers data:', data);
        setDrivers(data.drivers || data);
        setTotalPages(data.pagination?.total || 1);
      } else {
        console.error('Error response:', response.status, response.statusText);
        const errorData = await response.text();
        console.error('Error details:', errorData);
        alert(`Error loading drivers: ${response.status} - ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error fetching drivers:', error);
    } finally {
      setLoading(false);
    }
  }, [token, currentPage, searchTerm, statusFilter, API_BASE_URL]);

  const fetchVehicles = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/vehicles`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setVehicles(data.vehicles || data);
      }
    } catch (error) {
      console.error('Error fetching vehicles:', error);
    }
  }, [token, API_BASE_URL]);

  const fetchDriverStats = useCallback(async (driverId: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/drivers/${driverId}/stats`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const stats = await response.json();
        setDriverStats(stats);
      }
    } catch (error) {
      console.error('Error fetching driver stats:', error);
    }
  }, [token, API_BASE_URL]);

  useEffect(() => {
    fetchDrivers();
    fetchVehicles();
  }, [fetchDrivers, fetchVehicles]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      
      // First create the driver
      const response = await fetch(`${API_BASE_URL}/drivers/register`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        const driverData = await response.json();
        const newDriverId = driverData.driver?._id || driverData._id;
        
        // If there's a photo selected, upload it
        if (selectedPhoto && newDriverId) {
          try {
            const photoFormData = new FormData();
            photoFormData.append('photo', selectedPhoto);
            
            const photoResponse = await fetch(`${API_BASE_URL}/drivers/${newDriverId}/photo`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${token}`
              },
              body: photoFormData
            });
            
            if (!photoResponse.ok) {
              console.error('Error uploading photo');
            }
          } catch (photoError) {
            console.error('Error uploading photo:', photoError);
          }
        }
        
        setShowForm(false);
        setFormData({
          firstName: '',
          lastName: '',
          email: '',
          password: '',
          phone: '',
          licenseNumber: '',
          licenseExpiry: '',
          emergencyContact: {
            name: '',
            phone: '',
            relationship: ''
          }
        });
        setSelectedPhoto(null);
        fetchDrivers();
      } else {
        const error = await response.json();
        alert(error.message || 'Error creating driver');
      }
    } catch (error) {
      console.error('Error creating driver:', error);
      alert('Error creating driver');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateDriver = async (driverId: string, updates: Partial<Driver>) => {
    try {
      const response = await fetch(`${API_BASE_URL}/drivers/${driverId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updates)
      });

      if (response.ok) {
        fetchDrivers();
        if (selectedDriver?._id === driverId) {
          const updatedDriver = await response.json();
          setSelectedDriver(updatedDriver.driver);
        }
      }
    } catch (error) {
      console.error('Error updating driver:', error);
    }
  };

  const handleDeleteDriver = async (driverId: string) => {
    if (!window.confirm('Are you sure you want to delete this driver?')) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/drivers/${driverId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        fetchDrivers();
        if (selectedDriver?._id === driverId) {
          setSelectedDriver(null);
        }
      } else {
        const error = await response.json();
        alert(error.message || 'Error deleting driver');
      }
    } catch (error) {
      console.error('Error deleting driver:', error);
    }
  };

  const handleAssignVehicle = async (driverId: string, vehicleId: string | null) => {
    try {
      const response = await fetch(`${API_BASE_URL}/drivers/${driverId}/assign-vehicle`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ vehicleId })
      });

      if (response.ok) {
        fetchDrivers();
      }
    } catch (error) {
      console.error('Error assigning vehicle:', error);
    }
  };

  const handleUploadPhoto = async (driverId: string, file: File) => {
    try {
      const formData = new FormData();
      formData.append('photo', file);

      const response = await fetch(`${API_BASE_URL}/drivers/${driverId}/photo`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (response.ok) {
        fetchDrivers();
        alert('Photo uploaded successfully!');
      } else {
        const error = await response.json();
        alert(error.message || 'Error uploading photo');
      }
    } catch (error) {
      console.error('Error uploading photo:', error);
      alert('Error uploading photo');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const renderDriverForm = () => (
    <div className="driver-form-overlay">
      <div className="driver-form">
        <h3>Add New Driver</h3>
        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label>First Name</label>
              <input
                type="text"
                value={formData.firstName}
                onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                required
              />
            </div>
            <div className="form-group">
              <label>Last Name</label>
              <input
                type="text"
                value={formData.lastName}
                onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                required
              />
            </div>
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                required
              />
            </div>
            <div className="form-group">
              <label>Password</label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Phone</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
              />
            </div>
            <div className="form-group">
              <label>License Number</label>
              <input
                type="text"
                value={formData.licenseNumber}
                onChange={(e) => setFormData({...formData, licenseNumber: e.target.value})}
              />
            </div>
          </div>

          <div className="form-group">
            <label>License Expiry</label>
            <input
              type="date"
              value={formData.licenseExpiry}
              onChange={(e) => setFormData({...formData, licenseExpiry: e.target.value})}
            />
          </div>

          <div className="form-group">
            <label>Profile Photo</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  setSelectedPhoto(file);
                }
              }}
            />
            {selectedPhoto && (
              <div className="photo-preview">
                <img 
                  src={URL.createObjectURL(selectedPhoto)} 
                  alt="Preview" 
                  style={{ width: '100px', height: '100px', objectFit: 'cover', borderRadius: '50%' }}
                />
                <span>{selectedPhoto.name}</span>
              </div>
            )}
          </div>

          <h4>Emergency Contact</h4>
          <div className="form-row">
            <div className="form-group">
              <label>Name</label>
              <input
                type="text"
                value={formData.emergencyContact.name}
                onChange={(e) => setFormData({
                  ...formData, 
                  emergencyContact: {...formData.emergencyContact, name: e.target.value}
                })}
              />
            </div>
            <div className="form-group">
              <label>Phone</label>
              <input
                type="tel"
                value={formData.emergencyContact.phone}
                onChange={(e) => setFormData({
                  ...formData, 
                  emergencyContact: {...formData.emergencyContact, phone: e.target.value}
                })}
              />
            </div>
          </div>

          <div className="form-group">
            <label>Relationship</label>
            <input
              type="text"
              value={formData.emergencyContact.relationship}
              onChange={(e) => setFormData({
                ...formData, 
                emergencyContact: {...formData.emergencyContact, relationship: e.target.value}
              })}
            />
          </div>

          <div className="form-actions">
            <button type="submit" disabled={loading}>
              {loading ? 'Creating...' : 'Create Driver'}
            </button>
            <button type="button" onClick={() => setShowForm(false)}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  const renderDriverStats = () => (
    <div className="driver-stats-overlay">
      <div className="driver-stats">
        <h3>Driver Statistics</h3>
        {driverStats && (
          <div className="stats-grid">
            <div className="stat-card">
              <h4>Total Trips</h4>
              <p>{driverStats.totalTrips}</p>
            </div>
            <div className="stat-card">
              <h4>Completed Trips</h4>
              <p>{driverStats.completedTrips}</p>
            </div>
            <div className="stat-card">
              <h4>Total Earnings</h4>
              <p>{formatCurrency(driverStats.totalEarnings)}</p>
            </div>
            <div className="stat-card">
              <h4>Average Rating</h4>
              <p>{driverStats.averageRating.toFixed(1)} ⭐</p>
            </div>
            <div className="stat-card">
              <h4>This Month Trips</h4>
              <p>{driverStats.thisMonthTrips}</p>
            </div>
            <div className="stat-card">
              <h4>This Month Earnings</h4>
              <p>{formatCurrency(driverStats.thisMonthEarnings)}</p>
            </div>
          </div>
        )}
        <button onClick={() => setShowStats(false)}>Close</button>
      </div>
    </div>
  );

  const renderScheduleEditor = () => (
    <div className="schedule-overlay">
      <div className="schedule-editor">
        <h3>Edit Schedule</h3>
        {selectedDriver && (
          <div className="schedule-grid">
            {Object.entries(selectedDriver.schedule).map(([day, schedule]) => (
              <div key={day} className="schedule-day">
                <h4>{day.charAt(0).toUpperCase() + day.slice(1)}</h4>
                <label>
                  <input
                    type="checkbox"
                    checked={schedule.available}
                    onChange={(e) => {
                      const updatedSchedule = {
                        ...selectedDriver.schedule,
                        [day]: { ...schedule, available: e.target.checked }
                      };
                      handleUpdateDriver(selectedDriver._id, { schedule: updatedSchedule });
                    }}
                  />
                  Available
                </label>
                {schedule.available && (
                  <div className="time-inputs">
                    <input
                      type="time"
                      value={schedule.start}
                      onChange={(e) => {
                        const updatedSchedule = {
                          ...selectedDriver.schedule,
                          [day]: { ...schedule, start: e.target.value }
                        };
                        handleUpdateDriver(selectedDriver._id, { schedule: updatedSchedule });
                      }}
                    />
                    <span>to</span>
                    <input
                      type="time"
                      value={schedule.end}
                      onChange={(e) => {
                        const updatedSchedule = {
                          ...selectedDriver.schedule,
                          [day]: { ...schedule, end: e.target.value }
                        };
                        handleUpdateDriver(selectedDriver._id, { schedule: updatedSchedule });
                      }}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
        <button onClick={() => setShowSchedule(false)}>Close</button>
      </div>
    </div>
  );

  return (
    <div className="driver-manager">
      <div className="driver-manager-header">
        <h2>Driver Management</h2>
        <div className="header-actions">
          <button onClick={() => setShowForm(true)} className="add-driver-btn">
            Add Driver
          </button>
        </div>
      </div>

      <div className="filters">
        <input
          type="text"
          placeholder="Search drivers..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="status-filter"
        >
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="available">Available</option>
          <option value="unavailable">Unavailable</option>
        </select>
      </div>

      <div className="drivers-grid">
        {drivers.map((driver) => (
          <div key={driver._id} className="driver-card">
            <div className="driver-header">
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
                <div className="photo-upload">
                  <input
                    type="file"
                    id={`photo-${driver._id}`}
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        handleUploadPhoto(driver._id, file);
                      }
                    }}
                    style={{ display: 'none' }}
                  />
                  <label htmlFor={`photo-${driver._id}`} className="upload-photo-btn">
                    📷
                  </label>
                </div>
              </div>
              <div className="driver-info-header">
                <h3>{driver.firstName} {driver.lastName}</h3>
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

            <div className="driver-info">
              <p><strong>Email:</strong> {driver.email}</p>
              <p><strong>Phone:</strong> {driver.phone}</p>
              <p><strong>License:</strong> {driver.licenseNumber}</p>
              <p><strong>Expiry:</strong> {formatDate(driver.licenseExpiry)}</p>
              <p><strong>Rating:</strong> {driver.rating.toFixed(1)} ⭐</p>
              <p><strong>Total Trips:</strong> {driver.totalTrips}</p>
              <p><strong>Total Earnings:</strong> {formatCurrency(driver.totalEarnings)}</p>
              {driver.vehicleAssigned && (
                <p><strong>Vehicle:</strong> {driver.vehicleAssigned.name} ({driver.vehicleAssigned.licensePlate})</p>
              )}
            </div>

            <div className="driver-actions">
              <button onClick={() => {
                setSelectedDriver(driver);
                fetchDriverStats(driver._id);
                setShowStats(true);
              }}>
                Stats
              </button>
              <button onClick={() => {
                setSelectedDriver(driver);
                setShowSchedule(true);
              }}>
                Schedule
              </button>
                             <button onClick={() => {
                 setSelectedDriver(driver);
                 // TODO: Implement documents modal
                 alert('Documents feature coming soon!');
               }}>
                 Documents
               </button>
              <select
                value={driver.vehicleAssigned?._id || ''}
                onChange={(e) => handleAssignVehicle(driver._id, e.target.value || null)}
              >
                <option value="">No Vehicle</option>
                {vehicles.map(vehicle => (
                  <option key={vehicle._id} value={vehicle._id}>
                    {vehicle.name} ({vehicle.licensePlate})
                  </option>
                ))}
              </select>
              <button
                onClick={() => handleUpdateDriver(driver._id, { isAvailable: !driver.isAvailable })}
                className={driver.isAvailable ? 'unavailable-btn' : 'available-btn'}
              >
                {driver.isAvailable ? 'Set Unavailable' : 'Set Available'}
              </button>
              <button
                onClick={() => handleUpdateDriver(driver._id, { isActive: !driver.isActive })}
                className={driver.isActive ? 'deactivate-btn' : 'activate-btn'}
              >
                {driver.isActive ? 'Deactivate' : 'Activate'}
              </button>
              <button
                onClick={() => handleDeleteDriver(driver._id)}
                className="delete-btn"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {totalPages > 1 && (
        <div className="pagination">
          <button
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
          >
            Previous
          </button>
          <span>Page {currentPage} of {totalPages}</span>
          <button
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
          >
            Next
          </button>
        </div>
      )}

      {showForm && renderDriverForm()}
      {showStats && renderDriverStats()}
      {showSchedule && renderScheduleEditor()}
    </div>
  );
};

export default DriverManager; 