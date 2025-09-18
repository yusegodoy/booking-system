import React from 'react';

interface ConfirmationPopupProps {
  isOpen: boolean;
  onClose: () => void;
  outboundNumber: number;
  returnNumber?: number;
}

const ConfirmationPopup: React.FC<ConfirmationPopupProps> = ({ 
  isOpen, 
  onClose, 
  outboundNumber, 
  returnNumber 
}) => {
  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px'
    }}>
      <div style={{
        background: '#fff',
        borderRadius: '16px',
        padding: '32px',
        maxWidth: '500px',
        width: '100%',
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.15)',
        position: 'relative',
        border: '2px solid #d32f2f'
      }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{
            width: '60px',
            height: '60px',
            background: '#28a745',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px',
            fontSize: '2rem'
          }}>
            ✅
          </div>
          <h2 style={{
            color: '#d32f2f',
            fontSize: '1.8rem',
            fontWeight: '700',
            margin: '0 0 8px 0'
          }}>
            Booking Confirmed!
          </h2>
          <p style={{
            color: '#666',
            fontSize: '1rem',
            margin: '0'
          }}>
            Your reservation has been successfully created
          </p>
        </div>

        {/* Confirmation Numbers */}
        <div style={{
          background: '#f8f9fa',
          borderRadius: '12px',
          padding: '24px',
          marginBottom: '24px',
          border: '1px solid #e9ecef'
        }}>
          <h3 style={{
            marginBottom: '16px',
            color: '#333',
            fontSize: '1.2rem',
            fontWeight: '600',
            textAlign: 'center'
          }}>
            Confirmation Numbers
          </h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '12px 16px',
              background: '#fff',
              borderRadius: '8px',
              border: '1px solid #dee2e6'
            }}>
              <span style={{ fontWeight: '600', color: '#333' }}>Outbound Trip:</span>
              <span style={{
                fontWeight: '700',
                color: '#d32f2f',
                fontSize: '1.1rem',
                background: '#fff5f5',
                padding: '6px 12px',
                borderRadius: '6px',
                border: '1px solid #ffcdd2'
              }}>
                #{outboundNumber}
              </span>
            </div>
            
            {returnNumber && (
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '12px 16px',
                background: '#fff',
                borderRadius: '8px',
                border: '1px solid #dee2e6'
              }}>
                <span style={{ fontWeight: '600', color: '#333' }}>Return Trip:</span>
                <span style={{
                  fontWeight: '700',
                  color: '#d32f2f',
                  fontSize: '1.1rem',
                  background: '#fff5f5',
                  padding: '6px 12px',
                  borderRadius: '6px',
                  border: '1px solid #ffcdd2'
                }}>
                  #{returnNumber}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Additional Info */}
        <div style={{
          background: '#e8f5e8',
          borderRadius: '8px',
          padding: '16px',
          marginBottom: '24px',
          border: '1px solid #c3e6c3'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '1.2rem' }}>📧</span>
            <span style={{ color: '#155724', fontSize: '0.95rem' }}>
              You will receive a confirmation email shortly with all the details.
            </span>
          </div>
        </div>

        {/* Close Button */}
        <div style={{ textAlign: 'center' }}>
          <button
            onClick={onClose}
            style={{
              background: '#d32f2f',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              padding: '14px 32px',
              fontSize: '1.1rem',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: '0 2px 8px rgba(211, 47, 47, 0.2)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#b71c1c';
              e.currentTarget.style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#d32f2f';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationPopup; 