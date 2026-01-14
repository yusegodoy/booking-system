import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../config/constants';
import './GoogleCalendarManager.css';
import GoogleCalendarConfigForm from './GoogleCalendarConfigForm';

interface GoogleCalendarConfig {
  isEnabled: boolean;
  calendarId: string;
  calendarName: string;
  syncEnabled: boolean;
  autoSync: boolean;
  syncInterval: number;
  lastSync?: string;
  syncStatus: 'idle' | 'syncing' | 'error' | 'success';
  errorMessage?: string;
  hasValidTokens: boolean;
}

interface Calendar {
  id: string;
  summary: string;
  primary?: boolean;
}

interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  config?: GoogleCalendarConfig;
  calendars?: Calendar[];
  authUrl?: string;
  synced?: number;
  errors?: number;
  data?: T;
}

const GoogleCalendarManager: React.FC = () => {
  const [config, setConfig] = useState<GoogleCalendarConfig | null>(null);
  const [calendars, setCalendars] = useState<Calendar[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showConfig, setShowConfig] = useState(false);
  const [showAdvancedConfig, setShowAdvancedConfig] = useState(false);
  const [formData, setFormData] = useState({
    clientId: '',
    clientSecret: '',
    calendarId: 'primary',
    calendarName: 'Booking System',
    syncEnabled: true,
    autoSync: true,
    syncInterval: 15
  });

  // Flags to prevent multiple simultaneous calls
  const loadingCalendarsRef = React.useRef(false);
  const authWindowRef = React.useRef<Window | null>(null);
  const intervalsRef = React.useRef<NodeJS.Timeout[]>([]);

  const token = localStorage.getItem('adminToken') || localStorage.getItem('token');

  useEffect(() => {
    loadConfig();
    // Only load calendars after config is loaded and has valid tokens
    // This will be handled by a separate effect that watches config
    
    // Cleanup intervals on unmount
    return () => {
      intervalsRef.current.forEach(interval => clearInterval(interval));
      intervalsRef.current = [];
    };
  }, []);

  // Load calendars when config changes and has valid tokens
  useEffect(() => {
    if (config?.hasValidTokens && !loadingCalendarsRef.current) {
      loadCalendars();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config?.hasValidTokens]);

  const loadConfig = async () => {
    try {
      const response = await axios.get<ApiResponse>(`${API_BASE_URL}/google-calendar/config`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setConfig(response.data.config || null);
    } catch (error: any) {
      if (error.response?.status !== 404) {
        setMessage({ type: 'error', text: 'Failed to load configuration' });
      }
    }
  };

  const loadCalendars = async () => {
    // Prevent multiple simultaneous calls
    if (loadingCalendarsRef.current) {
      return;
    }

    // Only try to load calendars if we have valid tokens
    if (config && !config.hasValidTokens) {
      return;
    }

    try {
      loadingCalendarsRef.current = true;
      const response = await axios.get<ApiResponse>(`${API_BASE_URL}/google-calendar/calendars`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCalendars(response.data.calendars || []);
    } catch (error: any) {
      // Only show error if it's not a 400 (which means token expired/invalid)
      // In that case, we'll wait for user to reconnect
      if (error.response?.status === 400) {
        // Token expired or invalid - don't spam errors
        console.log('⚠️ Cannot load calendars: authentication required');
      } else if (error.response?.status !== 401) {
        // Other errors can be silently ignored
        console.log('⚠️ Failed to load calendars:', error.response?.status);
      }
    } finally {
      loadingCalendarsRef.current = false;
    }
  };

  const handleAuth = async () => {
    try {
      setLoading(true);
      
      // Clear any existing intervals
      intervalsRef.current.forEach(interval => clearInterval(interval));
      intervalsRef.current = [];
      
      const response = await axios.get<ApiResponse>(`${API_BASE_URL}/google-calendar/auth/url`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.authUrl) {
        // Open Google OAuth in new window
        const authWindow = window.open(
          response.data.authUrl,
          'Google Calendar Auth',
          'width=500,height=600'
        );
        
        authWindowRef.current = authWindow;

        // Poll for window close with proper error handling
        const checkClosed = setInterval(() => {
          try {
            if (authWindow?.closed) {
              clearInterval(checkClosed);
              intervalsRef.current = intervalsRef.current.filter(i => i !== checkClosed);
              // Wait a bit for the backend to process the callback
              setTimeout(() => {
                loadConfig();
                loadCalendars();
                setLoading(false);
                setMessage({ type: 'success', text: 'Google Calendar authentication completed! Please check the connection status.' });
              }, 2000);
            }
          } catch (error) {
            // window.closed can throw due to COOP policy - ignore it
            // We'll rely on the callback check instead
          }
        }, 1000);
        intervalsRef.current.push(checkClosed);

        // Check the callback URL every 2 seconds
        const checkCallback = setInterval(async () => {
          try {
            const response = await axios.get(`${API_BASE_URL}/google-calendar/config`, {
              headers: { Authorization: `Bearer ${token}` }
            });
            
            if ((response.data as ApiResponse).config?.hasValidTokens) {
              // Clear all intervals
              intervalsRef.current.forEach(interval => clearInterval(interval));
              intervalsRef.current = [];
              
              try {
                authWindow?.close();
              } catch (error) {
                // Ignore errors closing window
              }
              
              loadConfig();
              loadCalendars();
              setLoading(false);
              setMessage({ type: 'success', text: 'Google Calendar connected successfully!' });
            }
          } catch (error) {
            // Ignore errors during polling
          }
        }, 2000);
        intervalsRef.current.push(checkCallback);

        // Clear callback check after 60 seconds
        setTimeout(() => {
          clearInterval(checkCallback);
          intervalsRef.current = intervalsRef.current.filter(i => i !== checkCallback);
        }, 60000);

      } else {
        setLoading(false);
        setMessage({ type: 'error', text: 'No authentication URL received from server' });
      }

    } catch (error: any) {
      setLoading(false);
      let errorMessage = 'Failed to start authentication';
      
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.status === 400) {
        errorMessage = 'Google Calendar credentials not configured. Please check your environment variables.';
      } else if (error.response?.status === 500) {
        errorMessage = 'Server error while generating authentication URL. Please try again.';
      } else if (error.response?.status === 401) {
        errorMessage = 'Authentication required. Please log in again.';
      }
      
      setMessage({ type: 'error', text: errorMessage });
    }
  };

  const handleSaveConfig = async () => {
    try {
      setLoading(true);
      await axios.put<ApiResponse>(`${API_BASE_URL}/google-calendar/config`, formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setMessage({ type: 'success', text: 'Configuration saved successfully' });
      setShowConfig(false);
      loadConfig();
    } catch (error: any) {
      setMessage({ type: 'error', text: 'Failed to save configuration' });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAdvancedConfig = async (advancedConfig: any) => {
    try {
      setLoading(true);
      await axios.put<ApiResponse>(`${API_BASE_URL}/google-calendar/config`, advancedConfig, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setMessage({ type: 'success', text: 'Advanced configuration saved successfully' });
      setShowAdvancedConfig(false);
      loadConfig();
    } catch (error: any) {
      setMessage({ type: 'error', text: 'Failed to save advanced configuration' });
    } finally {
      setLoading(false);
    }
  };

  const handleTestConnection = async () => {
    try {
      setLoading(true);
      const response = await axios.post<ApiResponse>(`${API_BASE_URL}/google-calendar/test-connection`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setMessage({ type: 'success', text: response.data.message || 'Connection test successful' });
    } catch (error: any) {
      setMessage({ type: 'error', text: error.response?.data?.message || 'Connection test failed' });
    } finally {
      setLoading(false);
    }
  };

  const handleSyncAll = async () => {
    try {
      setLoading(true);
      const response = await axios.post<ApiResponse>(`${API_BASE_URL}/google-calendar/sync/all`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setMessage({ 
        type: 'success', 
        text: `${response.data.message || 'Sync completed'} (${response.data.synced || 0} synced, ${response.data.errors || 0} errors)` 
      });
      loadConfig();
    } catch (error: any) {
      setMessage({ type: 'error', text: error.response?.data?.message || 'Sync failed' });
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = async () => {
    if (!window.confirm('Are you sure you want to disconnect Google Calendar? This will remove all authentication tokens.')) {
      return;
    }

    try {
      setLoading(true);
      await axios.post<ApiResponse>(`${API_BASE_URL}/google-calendar/disconnect`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setMessage({ type: 'success', text: 'Google Calendar disconnected successfully' });
      loadConfig();
    } catch (error: any) {
      setMessage({ type: 'error', text: 'Failed to disconnect' });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return '#4caf50';
      case 'error': return '#f44336';
      case 'syncing': return '#ff9800';
      default: return '#9e9e9e';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'success': return 'Success';
      case 'error': return 'Error';
      case 'syncing': return 'Syncing...';
      default: return 'Idle';
    }
  };

  return (
    <div className="google-calendar-manager">
      <div className="header">
        <h2>📅 Google Calendar Integration</h2>
        <p>Sync your bookings with Google Calendar for better organization</p>
      </div>

      {message && (
        <div className={`message ${message.type}`}>
          {message.text}
          <button onClick={() => setMessage(null)}>×</button>
        </div>
      )}

      <div className="status-card">
        <div className="status-header">
          <h3>Connection Status</h3>
          <div 
            className="status-indicator"
            style={{ backgroundColor: config ? getStatusColor(config.syncStatus) : '#9e9e9e' }}
          >
            {config ? getStatusText(config.syncStatus) : 'Not Configured'}
          </div>
        </div>

        {config && (
          <div className="status-details">
            <div className="detail">
              <span>Calendar:</span>
              <span>{config.calendarName}</span>
            </div>
            <div className="detail">
              <span>Auto Sync:</span>
              <span>{config.autoSync ? 'Enabled' : 'Disabled'}</span>
            </div>
            <div className="detail">
              <span>Sync Interval:</span>
              <span>{config.syncInterval} minutes</span>
            </div>
            {config.lastSync && (
              <div className="detail">
                <span>Last Sync:</span>
                <span>{new Date(config.lastSync).toLocaleString()}</span>
              </div>
            )}
            {config.errorMessage && (
              <div className="detail error">
                <span>Error:</span>
                <span>{config.errorMessage}</span>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="actions">
        {!config?.hasValidTokens ? (
          <div className="auth-section">
            <h3>🔐 Authentication Required</h3>
            <p>Connect your Google Calendar account to start syncing bookings</p>
            <button 
              onClick={handleAuth} 
              disabled={loading}
              className="btn-primary"
            >
              {loading ? 'Connecting...' : 'Connect Google Calendar'}
            </button>
          </div>
        ) : (
          <div className="connected-section">
            <h3>✅ Connected to Google Calendar</h3>
            <div className="action-buttons">
              <button 
                onClick={handleTestConnection} 
                disabled={loading}
                className="btn-secondary"
              >
                {loading ? 'Testing...' : 'Test Connection'}
              </button>
              <button 
                onClick={() => { 
                  loadConfig(); 
                  // Only load calendars if we have valid tokens
                  if (config?.hasValidTokens) {
                    loadCalendars(); 
                  }
                  setMessage({ type: 'success', text: 'Configuration refreshed!' }); 
                }} 
                className="btn-secondary"
              >
                🔄 Refresh Status
              </button>
              <button 
                onClick={handleSyncAll} 
                disabled={loading}
                className="btn-primary"
              >
                {loading ? 'Syncing...' : 'Sync All Bookings'}
              </button>
              <button 
                onClick={() => setShowConfig(true)} 
                className="btn-secondary"
              >
                Basic Config
              </button>
              <button 
                onClick={() => setShowAdvancedConfig(true)} 
                className="btn-secondary"
              >
                Event Settings
              </button>
              <button 
                onClick={handleDisconnect} 
                disabled={loading}
                className="btn-danger"
              >
                Disconnect
              </button>
            </div>
          </div>
        )}
      </div>

      {showConfig && (
        <div className="config-modal">
          <div className="config-content">
            <h3>⚙️ Configuration</h3>
            <form onSubmit={(e) => { e.preventDefault(); handleSaveConfig(); }}>
              <div className="form-group">
                <label>Google Client ID:</label>
                <input
                  type="text"
                  value={formData.clientId}
                  onChange={(e) => setFormData({...formData, clientId: e.target.value})}
                  placeholder="Enter Google Client ID"
                  required
                />
              </div>
              
              <div className="form-group">
                <label>Google Client Secret:</label>
                <input
                  type="password"
                  value={formData.clientSecret}
                  onChange={(e) => setFormData({...formData, clientSecret: e.target.value})}
                  placeholder="Enter Google Client Secret"
                  required
                />
              </div>

              <div className="form-group">
                <label>Calendar:</label>
                <select
                  value={formData.calendarId}
                  onChange={(e) => setFormData({...formData, calendarId: e.target.value})}
                >
                  {calendars.map(cal => (
                    <option key={cal.id} value={cal.id}>
                      {cal.summary} {cal.primary ? '(Primary)' : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Calendar Name:</label>
                <input
                  type="text"
                  value={formData.calendarName}
                  onChange={(e) => setFormData({...formData, calendarName: e.target.value})}
                  placeholder="Booking System"
                />
              </div>

              <div className="form-group">
                <label>Sync Interval (minutes):</label>
                <input
                  type="number"
                  value={formData.syncInterval}
                  onChange={(e) => setFormData({...formData, syncInterval: parseInt(e.target.value)})}
                  min="5"
                  max="1440"
                />
              </div>

              <div className="form-group checkbox">
                <label>
                  <input
                    type="checkbox"
                    checked={formData.autoSync}
                    onChange={(e) => setFormData({...formData, autoSync: e.target.checked})}
                  />
                  Enable Auto Sync
                </label>
              </div>

              <div className="form-actions">
                <button 
                  type="button" 
                  onClick={() => setShowConfig(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={loading}
                  className="btn-primary"
                >
                  {loading ? 'Saving...' : 'Save Configuration'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showAdvancedConfig && config && (
        <GoogleCalendarConfigForm
          config={config}
          onSave={handleSaveAdvancedConfig}
          onCancel={() => setShowAdvancedConfig(false)}
        />
      )}

      <div className="info-section">
        <h3>ℹ️ How it works</h3>
        <ul>
          <li>✅ Each booking creates an event in your Google Calendar</li>
          <li>✅ Events include customer details, pickup/dropoff locations, and flight info</li>
          <li>✅ Events are color-coded based on booking status</li>
          <li>✅ Automatic reminders are set (1 day and 1 hour before)</li>
          <li>✅ Round trips create separate events for outbound and return</li>
          <li>✅ Events are updated when booking status changes</li>
        </ul>
      </div>
    </div>
  );
};

export default GoogleCalendarManager;
