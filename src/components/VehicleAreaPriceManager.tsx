import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './VehicleAreaPriceManager.css';

interface Area {
  _id: string;
  name: string;
  type: 'city' | 'zipcode' | 'polygon';
  value?: string;
  polygon?: Array<{ lat: number; lng: number }>;
}

interface VehicleType {
  _id: string;
  name: string;
  description: string;
  capacity: number;
  basePrice: number;
  areaPrices: Array<{
    area: string;
    fixedPrice: number;
  }>;
}

interface AreaPrice {
  area: string;
  fixedPrice: number;
}

const VehicleAreaPriceManager: React.FC = () => {
  const [vehicleTypes, setVehicleTypes] = useState<VehicleType[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<string>('');
  const [areaPrices, setAreaPrices] = useState<AreaPrice[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchVehicleTypes();
    fetchAreas();
  }, []);

  useEffect(() => {
    if (selectedVehicle) {
      const vehicle = vehicleTypes.find(v => v._id === selectedVehicle);
      if (vehicle) {
        setAreaPrices(vehicle.areaPrices || []);
      }
    }
  }, [selectedVehicle, vehicleTypes]);

  const fetchVehicleTypes = async () => {
    try {
      const res = await axios.get<VehicleType[]>('/api/vehicle-types');
      setVehicleTypes(res.data);
    } catch (error) {
      console.error('Error fetching vehicle types:', error);
    }
  };

  const fetchAreas = async () => {
    try {
      const res = await axios.get<Area[]>('/api/areas');
      setAreas(res.data);
    } catch (error) {
      console.error('Error fetching areas:', error);
    }
  };

  const handlePriceChange = (areaId: string, price: number) => {
    setAreaPrices(prev => {
      const existing = prev.find(ap => ap.area === areaId);
      if (existing) {
        // Update existing price
        return prev.map(ap => ap.area === areaId ? { ...ap, fixedPrice: price } : ap);
      } else {
        // Add new area price
        return [...prev, { area: areaId, fixedPrice: price }];
      }
    });
  };

  const handleSavePrices = async () => {
    if (!selectedVehicle) return;

    setLoading(true);
    try {
      // Only send areas that have prices > 0
      const areasWithPrices = areaPrices.filter(ap => ap.fixedPrice > 0);
      
      await axios.put(`/api/vehicle-area-prices/${selectedVehicle}/area-prices`, {
        areaPrices: areasWithPrices
      });
      await fetchVehicleTypes(); // Refresh data
      alert('Prices saved successfully');
    } catch (error) {
      console.error('Error saving prices:', error);
      alert('Error saving prices');
    } finally {
      setLoading(false);
    }
  };

  const getAreaDisplayName = (area: Area) => {
    if (area.type === 'polygon') {
      return `${area.name} (Polygon)`;
    }
    return `${area.name} (${area.type === 'city' ? 'City' : 'Zip Code'}: ${area.value})`;
  };

  return (
    <div className="vehicle-area-price-manager">
      <h3>Manage Area and Vehicle Pricing</h3>
      
      <div className="vehicle-selector">
        <label htmlFor="vehicle-select">Select Vehicle Type:</label>
        <select
          id="vehicle-select"
          value={selectedVehicle}
          onChange={(e) => setSelectedVehicle(e.target.value)}
        >
          <option value="">Select vehicle...</option>
          {vehicleTypes.map(vehicle => (
            <option key={vehicle._id} value={vehicle._id}>
              {vehicle.name} - ${vehicle.basePrice} base
            </option>
          ))}
        </select>
      </div>

      {selectedVehicle && (
        <div className="price-configuration">
          <h4>Configure Fixed Prices by Area</h4>
          <p className="info-text">
            Fixed prices override per-mile calculation when pickup or dropoff is within the area.
          </p>
          
          <div className="areas-grid">
            {areas.map(area => {
              const currentPrice = areaPrices.find(ap => ap.area === area._id)?.fixedPrice || 0;
              return (
                <div key={area._id} className="area-price-item">
                  <div className="area-info">
                    <strong>{getAreaDisplayName(area)}</strong>
                  </div>
                  <div className="price-input">
                    <label>Fixed Price ($):</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={currentPrice}
                      onChange={(e) => handlePriceChange(area._id, parseFloat(e.target.value) || 0)}
                      placeholder="0.00"
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="actions">
            <button 
              onClick={handleSavePrices} 
              disabled={loading}
              className="save-button"
            >
              {loading ? 'Saving...' : 'Save Prices'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default VehicleAreaPriceManager; 