import React, { useState, useEffect } from 'react';

interface BookingConfig {
  minNumber: number;
  maxNumber: number;
}

interface Booking {
  id: number;
  outboundConfirmationNumber: number;
  returnConfirmationNumber?: number;
  tripInfo: any;
  userData: any;
  paymentMethod: string;
  checkoutType: string;
  isLoggedIn: boolean;
  status: string;
  createdAt: string;
  totalPrice: number;
}

const AdminConfig: React.FC = () => {
  const [config, setConfig] = useState<BookingConfig>({ minNumber: 10000, maxNumber: 99999 });
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [activeTab, setActiveTab] = useState<'config' | 'bookings'>('config');

  useEffect(() => {
    // Cargar configuración existente
    const savedConfig = localStorage.getItem('bookingConfig');
    if (savedConfig) {
      setConfig(JSON.parse(savedConfig));
    }

    // Cargar reservaciones existentes
    const savedBookings = localStorage.getItem('bookings');
    if (savedBookings) {
      setBookings(JSON.parse(savedBookings));
    }
  }, []);

  const saveConfig = () => {
    if (config.minNumber >= config.maxNumber) {
      alert('Minimum number must be less than maximum number');
      return;
    }
    
    localStorage.setItem('bookingConfig', JSON.stringify(config));
    alert('Configuration saved successfully!');
  };

  const clearAllBookings = () => {
    if (window.confirm('Are you sure you want to clear all bookings? This action cannot be undone.')) {
      localStorage.removeItem('bookings');
      setBookings([]);
      alert('All bookings cleared successfully!');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const formatPrice = (price: number) => {
    return `$${price.toFixed(2)}`;
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
      <h1 style={{ textAlign: 'center', color: '#d32f2f', marginBottom: '32px' }}>
        Admin Configuration
      </h1>

      {/* Tabs */}
      <div style={{ display: 'flex', marginBottom: '24px', borderBottom: '2px solid #e9ecef' }}>
        <button
          onClick={() => setActiveTab('config')}
          style={{
            background: activeTab === 'config' ? '#d32f2f' : 'transparent',
            color: activeTab === 'config' ? '#fff' : '#d32f2f',
            border: 'none',
            padding: '12px 24px',
            fontSize: '1.1rem',
            fontWeight: '600',
            cursor: 'pointer',
            borderBottom: activeTab === 'config' ? '2px solid #d32f2f' : 'none',
            marginRight: '8px'
          }}
        >
          Configuration
        </button>
        <button
          onClick={() => setActiveTab('bookings')}
          style={{
            background: activeTab === 'bookings' ? '#d32f2f' : 'transparent',
            color: activeTab === 'bookings' ? '#fff' : '#d32f2f',
            border: 'none',
            padding: '12px 24px',
            fontSize: '1.1rem',
            fontWeight: '600',
            cursor: 'pointer',
            borderBottom: activeTab === 'bookings' ? '2px solid #d32f2f' : 'none'
          }}
        >
          Bookings ({bookings.length})
        </button>
      </div>

      {activeTab === 'config' && (
        <div style={{ background: '#f8f9fa', borderRadius: '12px', padding: '24px', border: '1px solid #e9ecef' }}>
          <h2 style={{ marginBottom: '24px', color: '#333', borderBottom: '2px solid #d32f2f', paddingBottom: '8px' }}>
            Confirmation Number Range
          </h2>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#333' }}>
                Minimum Number
              </label>
              <input
                type="number"
                value={config.minNumber}
                onChange={(e) => setConfig({ ...config, minNumber: parseInt(e.target.value) || 0 })}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #ced4da',
                  borderRadius: '8px',
                  fontSize: '1rem'
                }}
                min="1"
              />
            </div>
            
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#333' }}>
                Maximum Number
              </label>
              <input
                type="number"
                value={config.maxNumber}
                onChange={(e) => setConfig({ ...config, maxNumber: parseInt(e.target.value) || 0 })}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #ced4da',
                  borderRadius: '8px',
                  fontSize: '1rem'
                }}
                min="1"
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '16px' }}>
            <button
              onClick={saveConfig}
              style={{
                background: '#28a745',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                padding: '12px 24px',
                fontSize: '1.1rem',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#218838';
                e.currentTarget.style.transform = 'translateY(-1px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#28a745';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              Save Configuration
            </button>
          </div>

          <div style={{ marginTop: '24px', padding: '16px', background: '#e8f5e8', borderRadius: '8px', border: '1px solid #c3e6c3' }}>
            <h4 style={{ marginBottom: '8px', color: '#155724' }}>Current Configuration:</h4>
            <p style={{ margin: '0', color: '#155724' }}>
              Confirmation numbers will be generated consecutively starting from <strong>{config.minNumber}</strong> up to <strong>{config.maxNumber}</strong>
            </p>
            <p style={{ margin: '8px 0 0 0', color: '#155724', fontSize: '0.9rem' }}>
              Available numbers: {config.maxNumber - config.minNumber + 1}
            </p>
            <p style={{ margin: '8px 0 0 0', color: '#155724', fontSize: '0.9rem' }}>
              Next available number: {bookings.length > 0 ? Math.max(...bookings.flatMap(b => [b.outboundConfirmationNumber, ...(b.returnConfirmationNumber ? [b.returnConfirmationNumber] : [])])) + 1 : config.minNumber}
            </p>
          </div>
        </div>
      )}

      {activeTab === 'bookings' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <h2 style={{ color: '#333', margin: '0' }}>
              All Bookings ({bookings.length})
            </h2>
            <button
              onClick={clearAllBookings}
              style={{
                background: '#dc3545',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                padding: '10px 16px',
                fontSize: '1rem',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#c82333';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#dc3545';
              }}
            >
              Clear All Bookings
            </button>
          </div>

          {bookings.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px', color: '#6c757d', fontSize: '1.1rem' }}>
              No bookings found
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', background: '#fff', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
                <thead>
                  <tr style={{ background: '#d32f2f', color: '#fff' }}>
                    <th style={{ padding: '16px', textAlign: 'left', fontWeight: '600' }}>Confirmation #</th>
                    <th style={{ padding: '16px', textAlign: 'left', fontWeight: '600' }}>Customer</th>
                    <th style={{ padding: '16px', textAlign: 'left', fontWeight: '600' }}>Trip</th>
                    <th style={{ padding: '16px', textAlign: 'left', fontWeight: '600' }}>Date</th>
                    <th style={{ padding: '16px', textAlign: 'left', fontWeight: '600' }}>Total</th>
                    <th style={{ padding: '16px', textAlign: 'left', fontWeight: '600' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.map((booking, index) => (
                    <tr key={booking.id} style={{ borderBottom: '1px solid #e9ecef', background: index % 2 === 0 ? '#fff' : '#f8f9fa' }}>
                      <td style={{ padding: '16px', fontWeight: '600', color: '#d32f2f' }}>
                        <div>Outbound: #{booking.outboundConfirmationNumber}</div>
                        {booking.returnConfirmationNumber && (
                          <div style={{ fontSize: '0.9rem', color: '#6c757d' }}>
                            Return: #{booking.returnConfirmationNumber}
                          </div>
                        )}
                      </td>
                      <td style={{ padding: '16px' }}>
                        <div style={{ fontWeight: '600' }}>{booking.userData.firstName} {booking.userData.lastName}</div>
                        <div style={{ fontSize: '0.9rem', color: '#6c757d' }}>{booking.userData.email}</div>
                        <div style={{ fontSize: '0.9rem', color: '#6c757d' }}>{booking.userData.phone}</div>
                      </td>
                      <td style={{ padding: '16px' }}>
                        <div style={{ fontWeight: '600' }}>{booking.tripInfo.pickup} → {booking.tripInfo.dropoff}</div>
                        <div style={{ fontSize: '0.9rem', color: '#6c757d' }}>
                          {booking.tripInfo.date} at {booking.tripInfo.pickupHour}:{booking.tripInfo.pickupMinute} {booking.tripInfo.pickupPeriod}
                        </div>
                        {booking.tripInfo.roundTrip && (
                          <div style={{ fontSize: '0.9rem', color: '#6c757d' }}>
                            Return: {booking.tripInfo.returnDate} at {booking.tripInfo.returnHour}:{booking.tripInfo.returnMinute} {booking.tripInfo.returnPeriod}
                          </div>
                        )}
                      </td>
                      <td style={{ padding: '16px', fontSize: '0.9rem', color: '#6c757d' }}>
                        {formatDate(booking.createdAt)}
                      </td>
                      <td style={{ padding: '16px', fontWeight: '600', color: '#28a745' }}>
                        {formatPrice(booking.totalPrice)}
                      </td>
                      <td style={{ padding: '16px' }}>
                        <span style={{
                          background: booking.status === 'Assigned' ? '#d4edda' : booking.status === 'Done' ? '#d1ecf1' : booking.status === 'Canceled' ? '#f8d7da' : '#fff3cd',
                          color: booking.status === 'Assigned' ? '#155724' : booking.status === 'Done' ? '#0c5460' : booking.status === 'Canceled' ? '#721c24' : '#856404',
                          padding: '4px 8px',
                          borderRadius: '4px',
                          fontSize: '0.8rem',
                          fontWeight: '600',
                          textTransform: 'uppercase'
                        }}>
                          {booking.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminConfig; 