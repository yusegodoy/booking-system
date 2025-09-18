import React, { useState, useEffect } from 'react';

interface GlobalVariable {
  key: string;
  value: string;
  description: string;
}

interface GlobalVariablesEditorProps {
  bookingId: string;
  onVariablesChange?: (variables: Record<string, string>) => void;
}

const GlobalVariablesEditor: React.FC<GlobalVariablesEditorProps> = ({ 
  bookingId, 
  onVariablesChange 
}) => {
  const [variables, setVariables] = useState<Record<string, string>>({});
  const [availableVariables, setAvailableVariables] = useState<GlobalVariable[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [template, setTemplate] = useState('');
  const [processedTemplate, setProcessedTemplate] = useState('');

  // Variable categories for better organization
  const variableCategories = {
    'Trip Information': ['PU_DATE', 'PU_TIME', 'PU', 'DO', 'RT_DATE', 'RT_TIME', 'RT', 'IS_ROUND_TRIP'],
    'Passenger & Luggage': ['PASSENGERS', 'CHECKED_LUGGAGE', 'CARRY_ON', 'INFANT_SEATS', 'TODDLER_SEATS', 'BOOSTER_SEATS', 'TOTAL_CHILD_SEATS'],
    'Flight Information': ['FLIGHT', 'MEET_OPTION', 'RETURN_FLIGHT'],
    'Customer Information': ['CUSTOMER_NAME', 'CUSTOMER_EMAIL', 'CUSTOMER_PHONE', 'SPECIAL_INSTRUCTIONS', 'GREETING_SIGN'],
    'Vehicle & Service': ['VEHICLE_TYPE', 'SERVICE_TYPE'],
    'Pricing Information': ['BASE_PRICE', 'BOOKING_FEE', 'CHILD_SEATS_CHARGE', 'DISCOUNT_PERCENTAGE', 'DISCOUNT_FIXED', 'ROUND_TRIP_DISCOUNT', 'GRATUITY_PERCENTAGE', 'GRATUITY_FIXED', 'TAXES_PERCENTAGE', 'TAXES_FIXED', 'CREDIT_CARD_FEE_PERCENTAGE', 'CREDIT_CARD_FEE_FIXED', 'CALCULATED_PRICE', 'TOTAL_PRICE'],
    'Payment & Booking': ['PAYMENT_METHOD', 'CHECKOUT_TYPE', 'BOOKING_STATUS', 'CONFIRMATION_NUMBER', 'RETURN_CONFIRMATION_NUMBER'],
    'Route Information': ['STOPS', 'TOTAL_DISTANCE', 'TOTAL_DURATION'],
    'Assignment': ['ASSIGNED_DRIVER', 'ASSIGNED_VEHICLE', 'NOTES', 'DISPATCH_NOTES'],
    'Communication': ['SEND_CONFIRMATIONS', 'CHANGE_NOTIFICATIONS'],
    'Timestamps': ['CREATED_AT', 'UPDATED_AT']
  };

  // Fetch available variables
  useEffect(() => {
    fetchAvailableVariables();
  }, []);

  // Fetch global variables for the booking
  useEffect(() => {
    if (bookingId) {
      fetchGlobalVariables();
    }
  }, [bookingId]);

  const fetchAvailableVariables = async () => {
    try {
      const response = await fetch('http://localhost:5001/api/global-variables/available/variables');
      if (response.ok) {
        const data = await response.json();
        setAvailableVariables(data.data);
      } else {
        setError('Failed to fetch available variables');
      }
    } catch (error) {
      setError('Error fetching available variables');
      console.error('Error:', error);
    }
  };

  const fetchGlobalVariables = async () => {
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:5001/api/global-variables/${bookingId}`);
      if (response.ok) {
        const data = await response.json();
        setVariables(data.data);
        setError(null);
      } else {
        setError('Failed to fetch global variables');
      }
    } catch (error) {
      setError('Error fetching global variables');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateGlobalVariables = async () => {
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:5001/api/global-variables/${bookingId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        await fetchGlobalVariables();
        setEditing(false);
        setError(null);
      } else {
        setError('Failed to update global variables');
      }
    } catch (error) {
      setError('Error updating global variables');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleVariableChange = (key: string, value: string) => {
    const updatedVariables = { ...variables, [key]: value };
    setVariables(updatedVariables);
    onVariablesChange?.(updatedVariables);
  };

  const testTemplateReplacement = async () => {
    if (!template.trim()) {
      setError('Please enter a template to test');
      return;
    }

    try {
      const response = await fetch('http://localhost:5001/api/global-variables/replace-variables', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bookingId,
          template
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setProcessedTemplate(data.data.processedTemplate);
        setError(null);
      } else {
        setError('Failed to process template');
      }
    } catch (error) {
      setError('Error processing template');
      console.error('Error:', error);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const loadExampleTemplate = () => {
    const exampleTemplate = `Dear {{CUSTOMER_NAME}},

Thank you for your booking with confirmation number {{CONFIRMATION_NUMBER}}.

TRIP DETAILS:
- Pickup Date: {{PU_DATE}}
- Pickup Time: {{PU_TIME}}
- Pickup Location: {{PU}}
- Drop-off Location: {{DO}}
- Round Trip: {{IS_ROUND_TRIP}}
{{#if RT_DATE}}- Return Date: {{RT_DATE}}{{/if}}
{{#if RT_TIME}}- Return Time: {{RT_TIME}}{{/if}}

PASSENGER INFORMATION:
- Total Passengers: {{PASSENGERS}}
- Checked Luggage: {{CHECKED_LUGGAGE}}
- Carry-on Bags: {{CARRY_ON}}
- Child Seats: {{TOTAL_CHILD_SEATS}} ({{INFANT_SEATS}} infant, {{TODDLER_SEATS}} toddler, {{BOOSTER_SEATS}} booster)

FLIGHT INFORMATION:
- Flight Number: {{FLIGHT}}
- Meet Option: {{MEET_OPTION}}
{{#if RETURN_FLIGHT}}- Return Flight: {{RETURN_FLIGHT}}{{/if}}

VEHICLE & SERVICE:
- Vehicle Type: {{VEHICLE_TYPE}}
- Service Type: {{SERVICE_TYPE}}

PRICING BREAKDOWN:
- Base Price: {{BASE_PRICE}}
- Booking Fee: {{BOOKING_FEE}}
- Child Seats Charge: {{CHILD_SEATS_CHARGE}}
- Discount: {{DISCOUNT_PERCENTAGE}} ({{DISCOUNT_FIXED}})
- Round Trip Discount: {{ROUND_TRIP_DISCOUNT}}
- Gratuity: {{GRATUITY_PERCENTAGE}} ({{GRATUITY_FIXED}})
- Taxes: {{TAXES_PERCENTAGE}} ({{TAXES_FIXED}})
- Credit Card Fee: {{CREDIT_CARD_FEE_PERCENTAGE}} ({{CREDIT_CARD_FEE_FIXED}})
- Calculated Price: {{CALCULATED_PRICE}}
- Total Price: {{TOTAL_PRICE}}

PAYMENT INFORMATION:
- Payment Method: {{PAYMENT_METHOD}}
- Checkout Type: {{CHECKOUT_TYPE}}
- Booking Status: {{BOOKING_STATUS}}
{{#if RETURN_CONFIRMATION_NUMBER}}- Return Confirmation: {{RETURN_CONFIRMATION_NUMBER}}{{/if}}

ROUTE INFORMATION:
- Additional Stops: {{STOPS}}
- Total Distance: {{TOTAL_DISTANCE}}
- Total Duration: {{TOTAL_DURATION}}

ASSIGNMENT INFORMATION:
- Assigned Driver: {{ASSIGNED_DRIVER}}
- Assigned Vehicle: {{ASSIGNED_VEHICLE}}
- Notes: {{NOTES}}
- Dispatch Notes: {{DISPATCH_NOTES}}

ADDITIONAL INFORMATION:
- Special Instructions: {{SPECIAL_INSTRUCTIONS}}
- Greeting Sign: {{GREETING_SIGN}}

COMMUNICATION PREFERENCES:
- Send Confirmations: {{SEND_CONFIRMATIONS}}
- Change Notifications: {{CHANGE_NOTIFICATIONS}}

TIMESTAMPS:
- Created: {{CREATED_AT}}
- Updated: {{UPDATED_AT}}

Best regards,
Your Transportation Team

Contact Information:
Email: {{CUSTOMER_EMAIL}}
Phone: {{CUSTOMER_PHONE}}`;

    setTemplate(exampleTemplate);
  };

  const getVariablesByCategory = () => {
    const categorized: Record<string, GlobalVariable[]> = {};
    
    Object.entries(variableCategories).forEach(([category, keys]) => {
      categorized[category] = availableVariables.filter(variable => 
        keys.includes(variable.key)
      );
    });
    
    return categorized;
  };

  if (loading) {
    return <div className="p-4">Loading global variables...</div>;
  }

  const categorizedVariables = getVariablesByCategory();

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Global Variables</h2>
        <div className="space-x-2">
          <button
            onClick={() => setEditing(!editing)}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            {editing ? 'Cancel' : 'Edit'}
          </button>
          {editing && (
            <button
              onClick={updateGlobalVariables}
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
            >
              Save
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      {/* Variables Display/Edit - Organized by Categories */}
      <div className="space-y-6 mb-6">
        {Object.entries(categorizedVariables).map(([category, categoryVariables]) => (
          <div key={category} className="border rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">
              {category}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {categoryVariables.map((variable) => (
                <div key={variable.key} className="border rounded p-3 bg-gray-50">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {variable.key}
                    <span className="text-xs text-gray-500 ml-2">({variable.description})</span>
                  </label>
                  {editing ? (
                    <input
                      type="text"
                      value={variables[variable.key] || ''}
                      onChange={(e) => handleVariableChange(variable.key, e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder={`Enter ${variable.key.toLowerCase()}`}
                    />
                  ) : (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-900 text-sm">
                        {variables[variable.key] || 'Not set'}
                      </span>
                      <button
                        onClick={() => copyToClipboard(variables[variable.key] || '')}
                        className="text-blue-500 hover:text-blue-700 text-xs"
                      >
                        Copy
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Template Testing Section */}
      <div className="border-t pt-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Template Testing</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email Template (use {'{{VARIABLE_NAME}}'} format)
            </label>
            <div className="flex space-x-2 mb-2">
              <button
                onClick={loadExampleTemplate}
                className="px-3 py-1 bg-gray-500 text-white text-sm rounded hover:bg-gray-600 transition-colors"
              >
                Load Complete Example
              </button>
            </div>
            <textarea
              value={template}
              onChange={(e) => setTemplate(e.target.value)}
              className="w-full h-32 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder={`Enter your email template here...
Example:
Dear {{CUSTOMER_NAME}},

Your pickup is scheduled for {{PU_DATE}} at {{PU_TIME}} from {{PU}}.
Total passengers: {{PASSENGERS}}
Vehicle type: {{VEHICLE_TYPE}}
Total price: {{TOTAL_PRICE}}`}
            />
          </div>
          
          <button
            onClick={testTemplateReplacement}
            className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 transition-colors"
          >
            Test Template
          </button>

          {processedTemplate && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Processed Template
              </label>
              <div className="relative">
                <textarea
                  value={processedTemplate}
                  readOnly
                  className="w-full h-32 px-3 py-2 border border-gray-300 rounded bg-gray-50"
                />
                <button
                  onClick={() => copyToClipboard(processedTemplate)}
                  className="absolute top-2 right-2 px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 transition-colors"
                >
                  Copy
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Variable Usage Guide */}
      <div className="border-t pt-6 mt-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Variable Usage Guide</h3>
        <div className="bg-gray-50 p-4 rounded">
          <p className="text-sm text-gray-600 mb-4">
            Use variables in your templates with the format <code className="bg-gray-200 px-1 rounded">{'{{VARIABLE_NAME}}'}</code>
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(categorizedVariables).map(([category, categoryVariables]) => (
              <div key={category} className="space-y-2">
                <h4 className="font-medium text-gray-800 text-sm">{category}:</h4>
                <div className="space-y-1">
                  {categoryVariables.slice(0, 5).map((variable) => (
                    <div key={variable.key} className="flex justify-between text-xs">
                      <code className="bg-gray-200 px-1 rounded">{`{{${variable.key}}}`}</code>
                      <span className="text-gray-600">{variable.description}</span>
                    </div>
                  ))}
                  {categoryVariables.length > 5 && (
                    <div className="text-xs text-gray-500">
                      +{categoryVariables.length - 5} more variables...
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GlobalVariablesEditor; 