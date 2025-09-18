import React, { useState, useEffect } from 'react';
import './GoogleCalendarConfigForm.css';

interface EventFields {
  confirmationNumber: boolean;
  customerName: boolean;
  customerEmail: boolean;
  customerPhone: boolean;
  passengers: boolean;
  luggage: boolean;
  vehicleType: boolean;
  totalPrice: boolean;
  date: boolean;
  time: boolean;
  flight: boolean;
  roundTrip: boolean;
  returnDate: boolean;
  returnFlight: boolean;
  specialInstructions: boolean;
  childSeats: boolean;
  pickupAddress: boolean;
  dropoffAddress: boolean;
}

interface GoogleCalendarConfigFormProps {
  config: any;
  onSave: (config: any) => void;
  onCancel: () => void;
}

const GoogleCalendarConfigForm: React.FC<GoogleCalendarConfigFormProps> = ({
  config,
  onSave,
  onCancel
}) => {
  const [formData, setFormData] = useState({
    calendarId: config?.calendarId || 'primary',
    calendarName: config?.calendarName || 'Primary Calendar',
    syncEnabled: config?.syncEnabled ?? true,
    autoSync: config?.autoSync ?? true,
    syncInterval: config?.syncInterval || 15,
    eventTitleTemplate: config?.eventTitleTemplate || '🚗 {{customerName}} - {{pickupAddress}} to {{dropoffAddress}}',
    eventLocationTemplate: config?.eventLocationTemplate || '{{pickupAddress}} to {{dropoffAddress}}',
    includeAttendees: config?.includeAttendees ?? true,
    includeReminders: config?.includeReminders ?? true,
    reminderMinutes: config?.reminderMinutes || [1440, 60]
  });

  const [eventFields, setEventFields] = useState<EventFields>(
    config?.eventFields || {
      confirmationNumber: true,
      customerName: true,
      customerEmail: true,
      customerPhone: true,
      passengers: true,
      luggage: true,
      vehicleType: true,
      totalPrice: true,
      date: true,
      time: true,
      flight: true,
      roundTrip: true,
      returnDate: true,
      returnFlight: true,
      specialInstructions: true,
      childSeats: true,
      pickupAddress: true,
      dropoffAddress: true
    }
  );

  const [newReminder, setNewReminder] = useState('');

  const fieldLabels: { [key in keyof EventFields]: string } = {
    confirmationNumber: '📋 Confirmation Number',
    customerName: '👤 Customer Name',
    customerEmail: '📧 Customer Email',
    customerPhone: '📞 Customer Phone',
    passengers: '👥 Passengers',
    luggage: '🛄 Luggage Info',
    vehicleType: '🚗 Vehicle Type',
    totalPrice: '💰 Total Price',
    date: '📅 Date',
    time: '⏰ Time',
    flight: '✈️ Flight Info',
    roundTrip: '🔄 Round Trip',
    returnDate: '🛬 Return Date',
    returnFlight: '✈️ Return Flight',
    specialInstructions: '📝 Special Instructions',
    childSeats: '👶 Child Seats',
    pickupAddress: '📍 Pickup Address',
    dropoffAddress: '📍 Dropoff Address'
  };

  const handleFieldChange = (field: keyof EventFields) => {
    setEventFields(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const addReminder = () => {
    const minutes = parseInt(newReminder);
    if (minutes > 0 && !formData.reminderMinutes.includes(minutes)) {
      setFormData(prev => ({
        ...prev,
        reminderMinutes: [...prev.reminderMinutes, minutes].sort((a, b) => b - a)
      }));
      setNewReminder('');
    }
  };

  const removeReminder = (index: number) => {
    setFormData(prev => ({
      ...prev,
      reminderMinutes: prev.reminderMinutes.filter((_: number, i: number) => i !== index)
    }));
  };

  const formatReminderTime = (minutes: number): string => {
    if (minutes >= 1440) {
      const days = Math.floor(minutes / 1440);
      return `${days} day${days > 1 ? 's' : ''} before`;
    } else if (minutes >= 60) {
      const hours = Math.floor(minutes / 60);
      return `${hours} hour${hours > 1 ? 's' : ''} before`;
    } else {
      return `${minutes} minute${minutes > 1 ? 's' : ''} before`;
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...formData,
      eventFields
    });
  };

  return (
    <div className="google-calendar-config-form">
      <div className="form-header">
        <h3>Google Calendar Event Configuration</h3>
        <p>Customize which information appears in your calendar events</p>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Basic Settings */}
        <div className="form-section">
          <h4>📅 Basic Settings</h4>
          <div className="form-row">
            <div className="form-group">
              <label>Calendar ID</label>
              <input
                type="text"
                value={formData.calendarId}
                onChange={(e) => handleInputChange('calendarId', e.target.value)}
                placeholder="primary"
              />
            </div>
            <div className="form-group">
              <label>Calendar Name</label>
              <input
                type="text"
                value={formData.calendarName}
                onChange={(e) => handleInputChange('calendarName', e.target.value)}
                placeholder="Primary Calendar"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Sync Interval (minutes)</label>
              <input
                type="number"
                value={formData.syncInterval}
                onChange={(e) => handleInputChange('syncInterval', parseInt(e.target.value))}
                min="1"
                max="1440"
              />
            </div>
            <div className="form-group checkbox-group">
              <label>
                <input
                  type="checkbox"
                  checked={formData.syncEnabled}
                  onChange={(e) => handleInputChange('syncEnabled', e.target.checked)}
                />
                Enable Sync
              </label>
            </div>
            <div className="form-group checkbox-group">
              <label>
                <input
                  type="checkbox"
                  checked={formData.autoSync}
                  onChange={(e) => handleInputChange('autoSync', e.target.checked)}
                />
                Auto Sync
              </label>
            </div>
          </div>
        </div>

        {/* Event Templates */}
        <div className="form-section">
          <h4>📝 Event Templates</h4>
          <div className="form-group">
            <label>Event Title Template</label>
            <input
              type="text"
              value={formData.eventTitleTemplate}
              onChange={(e) => handleInputChange('eventTitleTemplate', e.target.value)}
              placeholder="🚗 {{customerName}} - {{pickupAddress}} to {{dropoffAddress}}"
            />
            <small>Available variables: {'{{customerName}}'}, {'{{pickupAddress}}'}, {'{{dropoffAddress}}'}, {'{{confirmationNumber}}'}, {'{{vehicleType}}'}, {'{{totalPrice}}'}, {'{{date}}'}, {'{{time}}'}, {'{{flight}}'}</small>
          </div>

          <div className="form-group">
            <label>Event Location Template</label>
            <input
              type="text"
              value={formData.eventLocationTemplate}
              onChange={(e) => handleInputChange('eventLocationTemplate', e.target.value)}
              placeholder="{{pickupAddress}} to {{dropoffAddress}}"
            />
            <small>Available variables: {'{{pickupAddress}}'}, {'{{dropoffAddress}}'}, {'{{customerName}}'}, {'{{confirmationNumber}}'}</small>
          </div>
        </div>

        {/* Event Fields */}
        <div className="form-section">
          <h4>📋 Event Description Fields</h4>
          <p>Select which information to include in the event description:</p>
          
          <div className="fields-grid">
            {Object.entries(fieldLabels).map(([field, label]) => (
              <div key={field} className="field-checkbox">
                <label>
                  <input
                    type="checkbox"
                    checked={eventFields[field as keyof EventFields]}
                    onChange={() => handleFieldChange(field as keyof EventFields)}
                  />
                  {label}
                </label>
              </div>
            ))}
          </div>
        </div>

        {/* Event Options */}
        <div className="form-section">
          <h4>⚙️ Event Options</h4>
          <div className="form-row">
            <div className="form-group checkbox-group">
              <label>
                <input
                  type="checkbox"
                  checked={formData.includeAttendees}
                  onChange={(e) => handleInputChange('includeAttendees', e.target.checked)}
                />
                Include Customer as Attendee
              </label>
            </div>
            <div className="form-group checkbox-group">
              <label>
                <input
                  type="checkbox"
                  checked={formData.includeReminders}
                  onChange={(e) => handleInputChange('includeReminders', e.target.checked)}
                />
                Include Reminders
              </label>
            </div>
          </div>

          {formData.includeReminders && (
            <div className="form-group">
              <label>Reminder Times</label>
              <div className="reminders-container">
                {formData.reminderMinutes.map((minutes: number, index: number) => (
                  <div key={index} className="reminder-tag">
                    {formatReminderTime(minutes)}
                    <button type="button" onClick={() => removeReminder(index)}>×</button>
                  </div>
                ))}
                <div className="add-reminder">
                  <input
                    type="number"
                    value={newReminder}
                    onChange={(e) => setNewReminder(e.target.value)}
                    placeholder="Minutes before event"
                    min="1"
                  />
                  <button type="button" onClick={addReminder}>Add</button>
                </div>
              </div>
              <small>Enter minutes before the event (e.g., 60 for 1 hour, 1440 for 1 day)</small>
            </div>
          )}
        </div>

        <div className="form-actions">
          <button type="submit" className="action-button primary">
            💾 Save Configuration
          </button>
          <button type="button" onClick={onCancel} className="action-button">
            ❌ Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default GoogleCalendarConfigForm;
