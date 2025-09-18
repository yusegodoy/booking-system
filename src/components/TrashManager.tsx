import React, { useState, useEffect } from 'react';
import './TrashManager.css';

interface TrashManagerProps {
  isOpen: boolean;
  onClose: () => void;
  onBookingRestored?: () => void;
}

interface DeletedBooking {
  _id: string;
  outboundConfirmationNumber: string;
  userData: {
    firstName: string;
    lastName: string;
    email: string;
  };
  tripInfo: {
    pickup: string;
    dropoff: string;
    date: string;
    pickupHour: string;
    pickupMinute: string;
    pickupPeriod: string;
  };
  status: string;
  totalPrice: number;
  deletedAt: string;
  deletedBy: string;
}

const TrashManager: React.FC<TrashManagerProps> = ({ isOpen, onClose, onBookingRestored }) => {
  const [deletedBookings, setDeletedBookings] = useState<DeletedBooking[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedBookings, setSelectedBookings] = useState<string[]>([]);

  useEffect(() => {
    if (isOpen) {
      loadDeletedBookings();
    }
  }, [isOpen]);

  const loadDeletedBookings = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('adminToken') || localStorage.getItem('token');
      const response = await fetch('/api/bookings/trash/list', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to load deleted bookings');
      }

      const data = await response.json();
      setDeletedBookings(data);
    } catch (error) {
      console.error('Error loading deleted bookings:', error);
      alert('Error loading deleted bookings. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRestore = async (bookingId: string) => {
    if (!window.confirm('Are you sure you want to restore this booking?')) {
      return;
    }

    try {
      const token = localStorage.getItem('adminToken') || localStorage.getItem('token');
      const response = await fetch(`/api/bookings/trash/${bookingId}/restore`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to restore booking');
      }

      alert('Booking restored successfully!');
      loadDeletedBookings(); // Reload the list
      
      // Notify parent component that a booking was restored
      if (onBookingRestored) {
        onBookingRestored();
      }
    } catch (error) {
      console.error('Error restoring booking:', error);
      alert('Error restoring booking. Please try again.');
    }
  };

  const handlePermanentlyDelete = async (bookingId: string) => {
    if (!window.confirm('Are you sure you want to permanently delete this booking? This action cannot be undone.')) {
      return;
    }

    try {
      const token = localStorage.getItem('adminToken') || localStorage.getItem('token');
      const response = await fetch(`/api/bookings/trash/${bookingId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to permanently delete booking');
      }

      alert('Booking permanently deleted!');
      loadDeletedBookings(); // Reload the list
    } catch (error) {
      console.error('Error permanently deleting booking:', error);
      alert('Error permanently deleting booking. Please try again.');
    }
  };

  const handleSelectAll = () => {
    if (selectedBookings.length === deletedBookings.length) {
      setSelectedBookings([]);
    } else {
      setSelectedBookings(deletedBookings.map(booking => booking._id));
    }
  };

  const handleSelectBooking = (bookingId: string) => {
    setSelectedBookings(prev => 
      prev.includes(bookingId) 
        ? prev.filter(id => id !== bookingId)
        : [...prev, bookingId]
    );
  };

  const handleBulkRestore = async () => {
    if (selectedBookings.length === 0) {
      alert('Please select bookings to restore.');
      return;
    }

    if (!window.confirm(`Are you sure you want to restore ${selectedBookings.length} booking(s)?`)) {
      return;
    }

    setIsLoading(true);
    try {
      const token = localStorage.getItem('adminToken') || localStorage.getItem('token');
      const promises = selectedBookings.map(bookingId =>
        fetch(`/api/bookings/trash/${bookingId}/restore`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        })
      );

      await Promise.all(promises);
      alert(`${selectedBookings.length} booking(s) restored successfully!`);
      setSelectedBookings([]);
      loadDeletedBookings();
      
      // Notify parent component that bookings were restored
      if (onBookingRestored) {
        onBookingRestored();
      }
    } catch (error) {
      console.error('Error bulk restoring bookings:', error);
      alert('Error restoring bookings. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedBookings.length === 0) {
      alert('Please select bookings to permanently delete.');
      return;
    }

    if (!window.confirm(`Are you sure you want to permanently delete ${selectedBookings.length} booking(s)? This action cannot be undone.`)) {
      return;
    }

    setIsLoading(true);
    try {
      const token = localStorage.getItem('adminToken') || localStorage.getItem('token');
      const promises = selectedBookings.map(bookingId =>
        fetch(`/api/bookings/trash/${bookingId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
            }
          })
        );

      await Promise.all(promises);
      alert(`${selectedBookings.length} booking(s) permanently deleted!`);
      setSelectedBookings([]);
      loadDeletedBookings();
    } catch (error) {
      console.error('Error bulk deleting bookings:', error);
      alert('Error permanently deleting bookings. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!isOpen) return null;

  return (
    <div className="trash-manager-overlay">
      <div className="trash-manager-modal">
        <div className="trash-manager-header">
          <h2>🗑️ Trash / Recycle Bin</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="trash-manager-content">
          <div className="trash-actions">
            <div className="bulk-actions">
              <button 
                className="action-btn restore"
                onClick={handleBulkRestore}
                disabled={isLoading || selectedBookings.length === 0}
              >
                🔄 Restore Selected ({selectedBookings.length})
              </button>
              <button 
                className="action-btn delete"
                onClick={handleBulkDelete}
                disabled={isLoading || selectedBookings.length === 0}
              >
                🗑️ Delete Selected ({selectedBookings.length})
              </button>
            </div>
            <button 
              className="action-btn refresh"
              onClick={loadDeletedBookings}
              disabled={isLoading}
            >
              🔄 Refresh
            </button>
          </div>

          {isLoading ? (
            <div className="loading">Loading deleted bookings...</div>
          ) : deletedBookings.length === 0 ? (
            <div className="empty-trash">
              <p>🗑️ No deleted bookings found</p>
              <p>The trash is empty!</p>
            </div>
          ) : (
            <div className="deleted-bookings-list">
              <table className="bookings-table">
                <thead>
                  <tr>
                    <th>
                      <input
                        type="checkbox"
                        checked={selectedBookings.length === deletedBookings.length && deletedBookings.length > 0}
                        onChange={handleSelectAll}
                      />
                    </th>
                    <th>Confirmation #</th>
                    <th>Customer</th>
                    <th>Trip Details</th>
                    <th>Status</th>
                    <th>Price</th>
                    <th>Deleted</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {deletedBookings.map((booking) => (
                    <tr key={booking._id}>
                      <td>
                        <input
                          type="checkbox"
                          checked={selectedBookings.includes(booking._id)}
                          onChange={() => handleSelectBooking(booking._id)}
                        />
                      </td>
                      <td>{booking.outboundConfirmationNumber}</td>
                      <td>
                        <div className="customer-info">
                          <div>{booking.userData.firstName} {booking.userData.lastName}</div>
                          <div className="email">{booking.userData.email}</div>
                        </div>
                      </td>
                      <td>
                        <div className="trip-info">
                          <div><strong>From:</strong> {booking.tripInfo.pickup}</div>
                          <div><strong>To:</strong> {booking.tripInfo.dropoff}</div>
                          <div><strong>Date:</strong> {booking.tripInfo.date}</div>
                          <div><strong>Time:</strong> {booking.tripInfo.pickupHour}:{booking.tripInfo.pickupMinute} {booking.tripInfo.pickupPeriod}</div>
                        </div>
                      </td>
                      <td>
                        <span className={`status-badge ${booking.status.toLowerCase().replace(/\s+/g, '-')}`}>
                          {booking.status}
                        </span>
                      </td>
                      <td>${booking.totalPrice.toFixed(2)}</td>
                      <td>
                        <div className="deleted-info">
                          <div>{formatDate(booking.deletedAt)}</div>
                          <div className="deleted-by">by {booking.deletedBy}</div>
                        </div>
                      </td>
                      <td>
                        <div className="action-buttons">
                          <button
                            className="btn-restore"
                            onClick={() => handleRestore(booking._id)}
                            title="Restore booking"
                          >
                            🔄
                          </button>
                          <button
                            className="btn-delete"
                            onClick={() => handlePermanentlyDelete(booking._id)}
                            title="Permanently delete"
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TrashManager; 