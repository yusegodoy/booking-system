import React, { useState, useEffect } from 'react';
import './SpecificVehiclesManager.css';

interface Vehicle {
  _id: string;
  licensePlate: string;
  description?: string;
  vehicleType: string;
  year?: number;
  make?: string;
  modelName?: string;
  color?: string;
  features: string[];
  maxLuggage?: number;
  isActive: boolean;
  isAvailable: boolean;
  images: string[];
  mainImage?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

interface VehicleType {
  _id: string;
  name: string;
  description: string;
  category: string;
  capacity: number;
}

interface SpecificVehiclesManagerProps {
  vehicleType: VehicleType;
  token: string;
  onClose: () => void;
}

const SpecificVehiclesManager: React.FC<SpecificVehiclesManagerProps> = ({
  vehicleType,
  token,
  onClose
}) => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [showVehicleForm, setShowVehicleForm] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [formData, setFormData] = useState({
    licensePlate: '',
    description: '',
    year: '',
    make: '',
    modelName: '',
    color: '',
    features: [] as string[],
    maxLuggage: '',
    isActive: true,
    isAvailable: true,
    notes: ''
  });
  const [newFeature, setNewFeature] = useState('');

  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5001/api';

  useEffect(() => {
    loadVehicles();
  }, [vehicleType._id]);

  const loadVehicles = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/vehicles?vehicleType=${vehicleType._id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setVehicles(data.vehicles || []);
      } else {
        console.error('Error loading vehicles');
      }
    } catch (error) {
      console.error('Error loading vehicles:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const vehicleData = {
        ...formData,
        vehicleType: vehicleType._id,
        year: formData.year ? parseInt(formData.year) : undefined,
        maxLuggage: formData.maxLuggage ? parseInt(formData.maxLuggage) : undefined,
        features: formData.features,
        images: [],
        mainImage: ''
      };

      const url = selectedVehicle 
        ? `${API_BASE_URL}/vehicles/${selectedVehicle._id}`
        : `${API_BASE_URL}/vehicles`;
      
      const method = selectedVehicle ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(vehicleData)
      });

      if (response.ok) {
        await loadVehicles();
        setShowVehicleForm(false);
        setSelectedVehicle(null);
        resetForm();
        alert(selectedVehicle ? 'Vehicle updated successfully!' : 'Vehicle created successfully!');
      } else {
        const errorData = await response.json();
        alert(`Error: ${errorData.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error saving vehicle:', error);
      alert('Error saving vehicle');
    }
  };

  const handleDelete = async (vehicleId: string) => {
    if (!window.confirm('Are you sure you want to delete this vehicle?')) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/vehicles/${vehicleId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        await loadVehicles();
        alert('Vehicle deleted successfully!');
      } else {
        alert('Error deleting vehicle');
      }
    } catch (error) {
      console.error('Error deleting vehicle:', error);
      alert('Error deleting vehicle');
    }
  };

  const handleEdit = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle);
    setFormData({
      licensePlate: vehicle.licensePlate,
      description: vehicle.description || '',
      year: vehicle.year?.toString() || '',
      make: vehicle.make || '',
      modelName: vehicle.modelName || '',
      color: vehicle.color || '',
      features: vehicle.features || [],
      maxLuggage: vehicle.maxLuggage?.toString() || '',
      isActive: vehicle.isActive,
      isAvailable: vehicle.isAvailable,
      notes: vehicle.notes || ''
    });
    setShowVehicleForm(true);
  };

  const resetForm = () => {
    setFormData({
      licensePlate: '',
      description: '',
      year: '',
      make: '',
      modelName: '',
      color: '',
      features: [],
      maxLuggage: '',
      isActive: true,
      isAvailable: true,
      notes: ''
    });
    setNewFeature('');
  };

  const addFeature = () => {
    if (newFeature.trim() && !formData.features.includes(newFeature.trim())) {
      setFormData({
        ...formData,
        features: [...formData.features, newFeature.trim()]
      });
      setNewFeature('');
    }
  };

  const removeFeature = (feature: string) => {
    setFormData({
      ...formData,
      features: formData.features.filter(f => f !== feature)
    });
  };

  const toggleAvailability = async (vehicle: Vehicle) => {
    try {
      const response = await fetch(`${API_BASE_URL}/vehicles/${vehicle._id}/availability`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          isAvailable: !vehicle.isAvailable
        })
      });

      if (response.ok) {
        await loadVehicles();
      } else {
        alert('Error updating vehicle availability');
      }
    } catch (error) {
      console.error('Error updating availability:', error);
      alert('Error updating vehicle availability');
    }
  };

  if (loading) {
    return (
      <div className="modal-overlay">
        <div className="modal-content large">
          <div className="modal-header">
            <h3>Loading vehicles...</h3>
            <button onClick={onClose} className="close-btn">×</button>
          </div>
          <div className="modal-body">
            <div className="loading">Loading...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-overlay">
      <div className="modal-content large">
        <div className="modal-header">
          <h3>Manage Vehicles - {vehicleType.name}</h3>
          <button onClick={onClose} className="close-btn">×</button>
        </div>
        <div className="modal-body">
          <div className="vehicles-manager">
            <div className="manager-header">
              <div className="header-info">
                <h4>Vehicle Type: {vehicleType.name}</h4>
                <p>Category: {vehicleType.category} | Capacity: {vehicleType.capacity} passengers</p>
                <p>Total Vehicles: {vehicles.length}</p>
              </div>
              <button 
                onClick={() => {
                  resetForm();
                  setSelectedVehicle(null);
                  setShowVehicleForm(true);
                }}
                className="action-button primary"
              >
                ➕ Add New Vehicle
              </button>
            </div>

            {vehicles.length === 0 ? (
              <div className="no-vehicles">
                <p>No vehicles found for this vehicle type.</p>
                <button 
                  onClick={() => {
                    resetForm();
                    setSelectedVehicle(null);
                    setShowVehicleForm(true);
                  }}
                  className="action-button primary"
                >
                  ➕ Add First Vehicle
                </button>
              </div>
            ) : (
              <div className="vehicles-list">
                {vehicles.map((vehicle) => (
                  <div key={vehicle._id} className="vehicle-item">
                    <div className="vehicle-info">
                      <div className="vehicle-main">
                        <h5>{vehicle.licensePlate}</h5>
                        <p>{vehicle.year} {vehicle.make} {vehicle.modelName}</p>
                        <p className="vehicle-color">Color: {vehicle.color || 'N/A'}</p>
                        {vehicle.description && <p>{vehicle.description}</p>}
                      </div>
                      <div className="vehicle-status">
                        <span className={`status-badge ${vehicle.isActive ? 'active' : 'inactive'}`}>
                          {vehicle.isActive ? 'Active' : 'Inactive'}
                        </span>
                        <span className={`status-badge ${vehicle.isAvailable ? 'available' : 'unavailable'}`}>
                          {vehicle.isAvailable ? 'Available' : 'Unavailable'}
                        </span>
                      </div>
                    </div>
                    <div className="vehicle-actions">
                      <button
                        onClick={() => toggleAvailability(vehicle)}
                        className={`action-button small ${vehicle.isAvailable ? 'warning' : 'success'}`}
                        title={vehicle.isAvailable ? 'Mark as Unavailable' : 'Mark as Available'}
                      >
                        {vehicle.isAvailable ? '🚫 Unavailable' : '✅ Available'}
                      </button>
                      <button
                        onClick={() => handleEdit(vehicle)}
                        className="action-button small"
                        title="Edit Vehicle"
                      >
                        ✏️ Edit
                      </button>
                      <button
                        onClick={() => handleDelete(vehicle._id)}
                        className="action-button small danger"
                        title="Delete Vehicle"
                      >
                        🗑️ Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {showVehicleForm && (
              <div className="vehicle-form-modal">
                <div className="form-header">
                  <h4>{selectedVehicle ? 'Edit Vehicle' : 'Add New Vehicle'}</h4>
                  <button onClick={() => setShowVehicleForm(false)} className="close-btn">×</button>
                </div>
                <form onSubmit={handleSubmit} className="vehicle-form">
                  <div className="form-row">
                    <div className="form-group">
                      <label>License Plate *</label>
                      <input
                        type="text"
                        value={formData.licensePlate}
                        onChange={(e) => setFormData({...formData, licensePlate: e.target.value})}
                        required
                        placeholder="ABC-123"
                      />
                    </div>
                    <div className="form-group">
                      <label>Year</label>
                      <input
                        type="number"
                        value={formData.year}
                        onChange={(e) => setFormData({...formData, year: e.target.value})}
                        placeholder="2023"
                        min="1900"
                        max="2030"
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Make</label>
                      <input
                        type="text"
                        value={formData.make}
                        onChange={(e) => setFormData({...formData, make: e.target.value})}
                        placeholder="Toyota"
                      />
                    </div>
                    <div className="form-group">
                      <label>Model</label>
                      <input
                        type="text"
                        value={formData.modelName}
                        onChange={(e) => setFormData({...formData, modelName: e.target.value})}
                        placeholder="Camry"
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Color</label>
                      <input
                        type="text"
                        value={formData.color}
                        onChange={(e) => setFormData({...formData, color: e.target.value})}
                        placeholder="White"
                      />
                    </div>
                    <div className="form-group">
                      <label>Max Luggage</label>
                      <input
                        type="number"
                        value={formData.maxLuggage}
                        onChange={(e) => setFormData({...formData, maxLuggage: e.target.value})}
                        placeholder="4"
                        min="0"
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Description</label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                      placeholder="Additional vehicle details..."
                      rows={3}
                    />
                  </div>

                  <div className="form-group">
                    <label>Features</label>
                    <div className="features-input">
                      <input
                        type="text"
                        value={newFeature}
                        onChange={(e) => setNewFeature(e.target.value)}
                        placeholder="Add a feature (e.g., GPS, WiFi)"
                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addFeature())}
                      />
                      <button type="button" onClick={addFeature} className="add-feature-btn">
                        Add
                      </button>
                    </div>
                    {formData.features.length > 0 && (
                      <div className="features-list">
                        {formData.features.map((feature, index) => (
                          <span key={index} className="feature-tag">
                            {feature}
                            <button type="button" onClick={() => removeFeature(feature)}>×</button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="form-group">
                    <label>Notes</label>
                    <textarea
                      value={formData.notes}
                      onChange={(e) => setFormData({...formData, notes: e.target.value})}
                      placeholder="Internal notes about this vehicle..."
                      rows={2}
                    />
                  </div>

                  <div className="form-row">
                    <div className="form-group checkbox-group">
                      <label>
                        <input
                          type="checkbox"
                          checked={formData.isActive}
                          onChange={(e) => setFormData({...formData, isActive: e.target.checked})}
                        />
                        Active
                      </label>
                    </div>
                    <div className="form-group checkbox-group">
                      <label>
                        <input
                          type="checkbox"
                          checked={formData.isAvailable}
                          onChange={(e) => setFormData({...formData, isAvailable: e.target.checked})}
                        />
                        Available
                      </label>
                    </div>
                  </div>

                  <div className="form-actions">
                    <button type="submit" className="action-button primary">
                      {selectedVehicle ? 'Update Vehicle' : 'Create Vehicle'}
                    </button>
                    <button type="button" onClick={() => setShowVehicleForm(false)} className="action-button">
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SpecificVehiclesManager;
