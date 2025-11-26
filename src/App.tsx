import React, { useState } from 'react';
import './App.css';
import Login from './components/Login';
import Register from './components/Register';
import Dashboard from './components/Dashboard';
import Wizard from './components/Wizard';
import AdminPortal from './components/AdminPortal';

import { RouteCalculationProvider } from './contexts/RouteCalculationContext';
import { GoogleMapsProvider } from './contexts/GoogleMapsContext';

// Remove TripInfo and UserData interfaces

interface AppProps {
  embedded?: boolean;
}

function App({ embedded = false }: AppProps = {}) {
  const [authScreen, setAuthScreen] = useState<'login' | 'register'>('login');
  const [showDashboard, setShowDashboard] = useState(false);
  // New state for login modal
  const [showLoginModal, setShowLoginModal] = useState(false);
  // State for admin portal
  const [showAdminPortal, setShowAdminPortal] = useState(false);

  
  // Preserved wizard state
  const [wizardState, setWizardState] = useState({
    currentStep: 0,
    tripInfo: {
      pickup: '',
      dropoff: '',
      date: '',
      pickupHour: '',
      pickupMinute: '',
      pickupPeriod: '',
      passengers: 1,
      checkedLuggage: 0,
      carryOn: 0,
      infantSeats: 0,
      toddlerSeats: 0,
      boosterSeats: 0,
      flight: '',
      roundTrip: false,
      returnDate: '',
      returnHour: '',
      returnMinute: '',
      returnPeriod: '',
      returnFlight: '',
      stops: [] as string[]
    },
    userData: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      specialInstructions: ''
    },
    isLoggedIn: false,
    checkoutType: null as 'guest' | 'account' | null,
    showAuthForm: false,
    vehicleSelected: false,
    paymentMethod: 'cash' as 'cash' | 'invoice'
  });

  const goToWizard = () => {
    setAuthScreen('login');
    setShowDashboard(false);
    setShowLoginModal(false);
    setShowAdminPortal(false);

  };

  const updateWizardState = (updates: Partial<typeof wizardState>) => {
    setWizardState(prev => ({
      ...prev,
      ...updates
    }));
  };

  // Change My Account button in Wizard to open modal if not logged in
  const handleOpenDashboard = () => {
    if (!wizardState.isLoggedIn) {
      setAuthScreen('login');
      setShowLoginModal(true);
    } else {
      setShowDashboard(true);
    }
  };

  // Wizard is always the main render by default
  return (
    <GoogleMapsProvider>
      <RouteCalculationProvider>
        <>
      {showAdminPortal ? (
        <AdminPortal onBackToMain={goToWizard} />
      ) : (
        <>
          <Wizard 
            onOpenDashboard={handleOpenDashboard}
            onOpenLoginModal={() => { setAuthScreen('login'); setShowLoginModal(true); }}
            wizardState={wizardState}
            updateWizardState={updateWizardState}
            embedded={embedded}
          />
          {/* Button to access admin portal */}
          <button 
            onClick={() => setShowAdminPortal(true)}
            style={{
              position: 'fixed',
              top: '20px',
              left: '20px',
              zIndex: 1000,
              padding: '10px 15px',
              backgroundColor: '#d32f2f',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '600',
              boxShadow: '0 2px 8px rgba(211, 47, 47, 0.3)',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#b71c1c';
              e.currentTarget.style.transform = 'translateY(-1px)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(211, 47, 47, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#d32f2f';
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 2px 8px rgba(211, 47, 47, 0.3)';
            }}
          >
            🔧 Admin Portal
          </button>
          

        </>
      )}
      {/* Login modal */}
      {showLoginModal && authScreen === 'login' && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          background: 'rgba(0,0,0,0.35)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: '#fff',
            borderRadius: '16px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
            padding: '40px 32px 32px 32px',
            minWidth: 350,
            maxWidth: '90vw',
            position: 'relative',
            animation: 'fadeIn 0.2s'
          }}>
            <button
              onClick={() => setShowLoginModal(false)}
              style={{
                position: 'absolute',
                top: 16,
                right: 16,
                background: 'none',
                border: 'none',
                fontSize: '1.5rem',
                color: '#d32f2f',
                cursor: 'pointer',
                fontWeight: 700
              }}
              title="Close"
            >
              ×
            </button>
            <Login 
              onSwitchToRegister={() => setAuthScreen('register')} 
              onLoginSuccess={() => { setShowLoginModal(false); setShowDashboard(true); setAuthScreen('login'); }} 
            />
          </div>
        </div>
      )}
      {/* Register modal if changed from login */}
      {showLoginModal && authScreen === 'register' && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          background: 'rgba(0,0,0,0.35)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: '#fff',
            borderRadius: '16px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
            padding: '40px 32px 32px 32px',
            minWidth: 350,
            maxWidth: '90vw',
            position: 'relative',
            animation: 'fadeIn 0.2s'
          }}>
            <button
              onClick={() => { setAuthScreen('login'); }}
              style={{
                position: 'absolute',
                top: 16,
                right: 16,
                background: 'none',
                border: 'none',
                fontSize: '1.5rem',
                color: '#d32f2f',
                cursor: 'pointer',
                fontWeight: 700
              }}
              title="Close"
            >
              ×
            </button>
            <Register
              onSwitchToLogin={() => setAuthScreen('login')}
              onRegisterSuccess={() => { setShowLoginModal(false); setShowDashboard(true); setAuthScreen('login'); }}
            />
          </div>
        </div>
      )}
      {/* Dashboard modal */}
      {showDashboard && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          background: 'rgba(0,0,0,0.35)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: '#fff',
            borderRadius: '16px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
            padding: '40px 32px 32px 32px',
            minWidth: 350,
            maxWidth: '90vw',
            position: 'relative',
            animation: 'fadeIn 0.2s'
          }}>
            <button
              onClick={() => setShowDashboard(false)}
              style={{
                position: 'absolute',
                top: 16,
                right: 16,
                background: 'none',
                border: 'none',
                fontSize: '1.5rem',
                color: '#d32f2f',
                cursor: 'pointer',
                fontWeight: 700
              }}
              title="Close"
            >
              ×
            </button>
            <Dashboard
              onBackToWizard={() => setShowDashboard(false)}
              onLogout={() => {
                setShowDashboard(false);
                updateWizardState({ isLoggedIn: false, userData: { firstName: '', lastName: '', email: '', phone: '', specialInstructions: '' } });
              }}
              userData={wizardState.userData}
              isLoggedIn={wizardState.isLoggedIn}
            />
          </div>
        </div>
      )}
        </>
      </RouteCalculationProvider>
    </GoogleMapsProvider>
  );
}

export default App;
