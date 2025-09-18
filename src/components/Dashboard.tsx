import React, { useState } from 'react';
import AdminConfig from './AdminConfig';

interface Trip {
  id: string;
  date: string;
  from: string;
  to: string;
  status: 'upcoming' | 'past' | 'cancelled';
}

interface UserData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  specialInstructions: string;
}

interface DashboardProps {
  onBackToWizard: () => void;
  onLogout: () => void;
  userData: UserData;
  isLoggedIn: boolean;
}

const mockTrips: Trip[] = [
  { id: '1', date: '2024-07-10', from: 'Tampa', to: 'Orlando', status: 'upcoming' },
  { id: '2', date: '2024-07-15', from: 'Orlando', to: 'Miami', status: 'upcoming' },
  { id: '3', date: '2024-06-01', from: 'Tampa', to: 'Miami', status: 'past' },
  { id: '4', date: '2024-05-20', from: 'Orlando', to: 'Tampa', status: 'past' },
];

const Dashboard: React.FC<DashboardProps> = ({ onBackToWizard, onLogout, userData, isLoggedIn }) => {
  const [activeTab, setActiveTab] = useState<'account' | 'admin'>('account');
  
  // Verificar si el usuario es admin (email específico para demo)
  const isAdmin = userData.email === 'admin@example.com' || userData.email === 'demo@example.com';

  if (!isLoggedIn) {
    return (
      <div className="dashboard-container">
        <div className="dashboard-header">
          <h2>My Account</h2>
        </div>
        <div className="profile-section card">
          <div className="profile-info">
            <h3>No user logged in</h3>
            <p>Please log in to view your account information.</p>
          </div>
        </div>
        <button className="back-btn" onClick={onBackToWizard} style={{marginTop: 24}}>Back to Booking</button>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h2>My Account</h2>
        <button className="logout-btn" onClick={onLogout}>Logout</button>
      </div>

      {/* Tabs de navegación */}
      <div style={{ display: 'flex', marginBottom: '24px', borderBottom: '2px solid #e9ecef' }}>
        <button
          onClick={() => setActiveTab('account')}
          style={{
            background: activeTab === 'account' ? '#d32f2f' : 'transparent',
            color: activeTab === 'account' ? '#fff' : '#d32f2f',
            border: 'none',
            padding: '12px 24px',
            fontSize: '1.1rem',
            fontWeight: '600',
            cursor: 'pointer',
            borderBottom: activeTab === 'account' ? '2px solid #d32f2f' : 'none',
            marginRight: '8px'
          }}
        >
          My Account
        </button>
        {isAdmin && (
          <button
            onClick={() => setActiveTab('admin')}
            style={{
              background: activeTab === 'admin' ? '#d32f2f' : 'transparent',
              color: activeTab === 'admin' ? '#fff' : '#d32f2f',
              border: 'none',
              padding: '12px 24px',
              fontSize: '1.1rem',
              fontWeight: '600',
              cursor: 'pointer',
              borderBottom: activeTab === 'admin' ? '2px solid #d32f2f' : 'none'
            }}
          >
            Admin Panel
          </button>
        )}
      </div>

      {activeTab === 'account' && (
        <>
          <div className="profile-section card">
            <div className="profile-avatar">
              <span role="img" aria-label="avatar" style={{fontSize: '2.5rem'}}>👤</span>
            </div>
            <div className="profile-info">
              <h3>Profile</h3>
              <div><strong>Name:</strong> {userData.firstName} {userData.lastName}</div>
              <div><strong>Email:</strong> {userData.email}</div>
              <div><strong>Phone:</strong> {userData.phone}</div>
            </div>
          </div>
          <hr className="dashboard-separator" />
          <div className="trips-section">
            <h3>Upcoming Trips</h3>
            {mockTrips.filter(t => t.status === 'upcoming').length === 0 ? (
              <div className="empty-msg">No upcoming trips.</div>
            ) : (
              <ul className="trips-list">
                {mockTrips.filter(t => t.status === 'upcoming').map(trip => (
                  <li key={trip.id} className="trip-item upcoming">
                    <span className="trip-icon" role="img" aria-label="car">🚗</span>
                    <span className="trip-info">{trip.date}: {trip.from} → {trip.to}</span>
                    <button className="edit-btn" title="Modify">✏️</button>
                    <button className="cancel-btn" title="Cancel">❌</button>
                  </li>
                ))}
              </ul>
            )}
            <h3>Past Trips</h3>
            {mockTrips.filter(t => t.status === 'past').length === 0 ? (
              <div className="empty-msg">No past trips.</div>
            ) : (
              <ul className="trips-list">
                {mockTrips.filter(t => t.status === 'past').map(trip => (
                  <li key={trip.id} className="trip-item past">
                    <span className="trip-icon" role="img" aria-label="check">✅</span>
                    <span className="trip-info">{trip.date}: {trip.from} → {trip.to}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}

      {activeTab === 'admin' && isAdmin && (
        <AdminConfig />
      )}

      <button className="back-btn" onClick={onBackToWizard} style={{marginTop: 24}}>Back to Booking</button>
    </div>
  );
};

export default Dashboard; 