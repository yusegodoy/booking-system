import React, { useState, useEffect } from 'react';

import AreaPolygonEditor from './AreaPolygonEditor';
import './AreaForm.css';

interface Area {
  _id: string;
  name: string;
  type: 'city' | 'zipcode' | 'polygon';
  value?: string | string[];
  polygon?: Array<{ lat: number; lng: number }>;
}

interface Props {
  area?: Area | null;
  onSave: (area: Omit<Area, '_id'>) => void;
  onCancel: () => void;
}

const AreaForm: React.FC<Props> = ({ area, onSave, onCancel }) => {
  const [type, setType] = useState<'city' | 'zipcode' | 'polygon'>(area?.type || 'city');
  const [name, setName] = useState(area?.name || '');
  const [value, setValue] = useState(area?.value || '');
  const [polygon, setPolygon] = useState<Array<{ lat: number; lng: number }> | null>(
    area?.polygon ? area.polygon : null
  );
  const [zipcodes, setZipcodes] = useState<string[]>(
    area && Array.isArray(area.value)
      ? area.value as string[]
      : area && typeof area.value === 'string'
        ? [area.value]
        : []
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (area) {
      setType(area.type);
      setName(area.name);
      setValue(typeof area.value === 'string' ? area.value : '');
      setZipcodes(Array.isArray(area.value) ? area.value : area.value ? [area.value] : []);
      setPolygon(area.polygon ? area.polygon : null);
    }
  }, [area]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      alert('Area name is required');
      return;
    }

    if (type !== 'polygon' && typeof value === 'string' && !value.trim()) {
      alert('Area value is required');
      return;
    }

    if (type === 'polygon' && (!polygon || polygon.length < 3)) {
      alert('You must draw a valid polygon with at least 3 points');
      return;
    }

    if (type === 'zipcode' && zipcodes.length === 0) {
      alert('At least one zip code is required');
      return;
    }

    setIsSubmitting(true);
    try {
      const areaData = {
        name: name.trim(),
        type,
        value: type === 'zipcode' ? zipcodes : (type === 'polygon' ? '' : (typeof value === 'string' ? value.trim() : '')),
        polygon: type === 'polygon' && polygon ? polygon : undefined
      };
      
      await onSave(areaData);
    } catch (error) {
      console.error('Error saving area:', error);
      alert('Error saving area');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTypeChange = (newType: 'city' | 'zipcode' | 'polygon') => {
    setType(newType);
    setValue('');
    setPolygon(null);
  };

  return (
    <div className="area-form-modal">
      <div className={`area-form-content ${type === 'polygon' ? 'polygon-mode' : ''}`}>
        <div className="area-form-header">
          <h3>{area ? 'Edit Area' : 'New Area'}</h3>
          <button onClick={onCancel} className="close-button">×</button>
        </div>

        <form onSubmit={handleSubmit} className="area-form">
          <div className="form-group">
            <label htmlFor="area-name">Area Name *</label>
            <input
              id="area-name"
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g., Downtown, North Zone, etc."
              required
              disabled={isSubmitting}
            />
          </div>

          <div className="form-group">
            <label htmlFor="area-type">Area Type *</label>
            <select
              id="area-type"
              value={type}
              onChange={e => handleTypeChange(e.target.value as any)}
              disabled={isSubmitting}
            >
              <option value="city">City</option>
              <option value="zipcode">Zip Code</option>
              <option value="polygon">Drawn Area (Polygon)</option>
            </select>
          </div>

          {type === 'city' && (
            <div className="form-group">
              <label>City Name</label>
              <input
                type="text"
                value={value}
                onChange={e => setValue(e.target.value)}
                placeholder="Enter city name..."
                disabled={isSubmitting}
              />
            </div>
          )}

          {type === 'zipcode' && (
            <div className="form-group">
              <label>Add Zip Codes</label>
              <div className="zipcode-input-container">
                <input
                  type="text"
                  placeholder="Enter zip code..."
                  onKeyPress={e => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      const code = e.currentTarget.value.trim();
                      if (code && !zipcodes.includes(code)) {
                        setZipcodes([...zipcodes, code]);
                        e.currentTarget.value = '';
                      }
                    }
                  }}
                  disabled={isSubmitting}
                />
                <button 
                  type="button" 
                  onClick={() => {
                    const input = document.querySelector('input[placeholder="Enter zip code..."]') as HTMLInputElement;
                    const code = input?.value.trim();
                    if (code && !zipcodes.includes(code)) {
                      setZipcodes([...zipcodes, code]);
                      input.value = '';
                    }
                  }}
                  disabled={isSubmitting}
                >
                  Add
                </button>
              </div>
              <div className="zipcodes-chips">
                {zipcodes.map((z, i) => (
                  <span key={i} className="zipcode-chip">
                    {z}
                    <button type="button" onClick={() => setZipcodes(zipcodes.filter((_, idx) => idx !== i))}>&times;</button>
                  </span>
                ))}
              </div>
            </div>
          )}

          {type === 'polygon' && (
            <div className="form-group">
              <label>Draw Area on Map</label>
              <div className="polygon-instructions">
                <p>Click on the map to draw polygon points. Click on the first point to close the area.</p>
              </div>
              <AreaPolygonEditor 
                onPolygonComplete={poly => setPolygon(poly)}
                initialPolygon={polygon}
                disabled={isSubmitting}
              />
              {polygon && polygon.length >= 3 && (
                <div className="selected-value">
                  <strong>Polygon drawn:</strong> {polygon.length} points
                </div>
              )}
            </div>
          )}

          <div className="form-actions">
            <button 
              type="button" 
              onClick={onCancel}
              className="cancel-button"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button 
              type="submit"
              className="save-button"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Saving...' : (area ? 'Update' : 'Create')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AreaForm; 