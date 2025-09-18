import React, { useEffect, useState } from 'react';
import axios from 'axios';
import AreaForm from './AreaForm';
import './AreaManager.css';

interface Area {
  _id: string;
  name: string;
  type: 'city' | 'zipcode' | 'polygon';
  value?: string | string[];
  polygon?: Array<{ lat: number; lng: number }>;
}

const AreaManager: React.FC = () => {
  const [areas, setAreas] = useState<Area[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingArea, setEditingArea] = useState<Area | null>(null);

  const fetchAreas = async () => {
    const res = await axios.get<Area[]>('/api/areas');
    setAreas(res.data);
  };

  useEffect(() => {
    fetchAreas();
  }, []);

  const handleSave = async (area: Omit<Area, '_id'>) => {
    if (editingArea) {
      await axios.put(`/api/areas/${editingArea._id}`, area);
    } else {
      await axios.post('/api/areas', area);
    }
    setShowForm(false);
    setEditingArea(null);
    fetchAreas();
  };

  const handleEdit = (area: Area) => {
    setEditingArea(area);
    setShowForm(true);
  };

  const handleDelete = async (areaId: string) => {
    if (window.confirm('Delete this area?')) {
      await axios.delete(`/api/areas/${areaId}`);
      fetchAreas();
    }
  };

  const getAreaDisplayValue = (area: Area) => {
    if (area.type === 'polygon') {
      return 'Custom polygon';
    }
    if (Array.isArray(area.value)) {
      return area.value.join(', ');
    }
    return area.value || '';
  };

  return (
    <div className="area-manager">
      <div className="area-manager-header">
        <h3>Configured Areas</h3>
        <button 
          onClick={() => { setShowForm(true); setEditingArea(null); }}
          className="action-button primary"
        >
          New Area
        </button>
      </div>

      {showForm && (
        <AreaForm 
          area={editingArea}
          onSave={handleSave} 
          onCancel={() => { setShowForm(false); setEditingArea(null); }}
        />
      )}

      {areas.length === 0 ? (
        <p className="no-data">No areas configured. Create your first area to get started.</p>
      ) : (
        <div className="areas-table-container">
          <table className="areas-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Type</th>
                <th>Value</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {areas.map(area => (
                <tr key={area._id}>
                  <td>
                    <strong>{area.name}</strong>
                  </td>
                  <td>
                    <span className={`area-type-badge ${area.type}`}>
                      {area.type === 'city' ? 'City' : 
                       area.type === 'zipcode' ? 'Zip Code' : 'Polygon'}
                    </span>
                  </td>
                  <td>{getAreaDisplayValue(area)}</td>
                  <td>
                    <div className="area-actions">
                      <button onClick={() => handleEdit(area)}>Edit</button>
                      <button onClick={() => handleDelete(area._id)}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AreaManager; 