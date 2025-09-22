import React, { useState, useEffect } from 'react';
import './EmailManager.css';
import RichTextEditor from './RichTextEditor';
import EmailPreview from './EmailPreview';

interface EmailConfig {
  _id?: string;
  smtpHost: string;
  smtpPort: number;
  smtpUser: string;
  smtpPassword?: string;
  smtpSecure: boolean;
  fromEmail: string;
  fromName: string;
  adminEmail: string;
  isActive: boolean;
}

interface EmailTemplate {
  _id?: string;
  name: string;
  subject: string;
  htmlContent: string;
  textContent: string;
  type: 'confirmation' | 'receipt' | 'custom';
  isActive: boolean;
  variables: string[];
  createdAt?: string;
  updatedAt?: string;
}

interface EmailManagerProps {
  token: string;
}

const EmailManager: React.FC<EmailManagerProps> = ({ token }) => {
  const [activeSection, setActiveSection] = useState<'config' | 'templates'>('config');
  const [emailConfig, setEmailConfig] = useState<EmailConfig>({
    smtpHost: 'smtp.ionos.com',
    smtpPort: 587,
    smtpUser: '',
    smtpPassword: '',
    smtpSecure: false,
    fromEmail: 'info@airportshuttletpa.com',
    fromName: 'Airport Shuttle TPA',
    adminEmail: 'info@airportshuttletpa.com',
    isActive: false
  });
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
  const [showTemplateEditor, setShowTemplateEditor] = useState(false);
  const [availableVariables, setAvailableVariables] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [previewData, setPreviewData] = useState<{ [key: string]: any }>({});
  const [showTestModal, setShowTestModal] = useState(false);
  const [testEmail, setTestEmail] = useState('');
  const [testingTemplate, setTestingTemplate] = useState<EmailTemplate | null>(null);
  const [testLoading, setTestLoading] = useState(false);

  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5001/api';

  useEffect(() => {
    fetchEmailConfig();
    fetchTemplates();
    fetchAvailableVariables();
  }, [token]);

  const fetchEmailConfig = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/email/config`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const config = await response.json();
        setEmailConfig(config);
      } else if (response.status === 404) {
        // No config found, use defaults
        console.log('No email configuration found, using defaults');
      }
    } catch (error) {
      console.error('Error fetching email config:', error);
    }
  };

  const fetchTemplates = async () => {
    try {
      console.log('Fetching templates from:', `${API_BASE_URL}/email/templates`);
      const response = await fetch(`${API_BASE_URL}/email/templates`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('Response status:', response.status);
      if (response.ok) {
        const templatesData = await response.json();
        console.log('Templates received:', templatesData);
        setTemplates(templatesData);
      } else {
        const errorText = await response.text();
        console.error('Error response:', errorText);
      }
    } catch (error) {
      console.error('Error fetching templates:', error);
    }
  };

  const fetchAvailableVariables = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/email/variables`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const variables = await response.json();
        setAvailableVariables(variables);
        
        // Generate sample data for preview
        const sampleData: { [key: string]: any } = {};
        variables.forEach((variable: string) => {
          switch (variable) {
            case 'customerName':
              sampleData[variable] = 'John Doe';
              break;
            case 'customerEmail':
              sampleData[variable] = 'john.doe@example.com';
              break;
            case 'customerPhone':
              sampleData[variable] = '+1 (555) 123-4567';
              break;
            case 'bookingId':
              sampleData[variable] = 'BK123456789';
              break;
            case 'confirmationNumber':
              sampleData[variable] = 'CONF-2024-001';
              break;
            case 'bookingDate':
              sampleData[variable] = '2024-01-15';
              break;
            case 'bookingTime':
              sampleData[variable] = '14:30:00';
              break;
            case 'pickupLocation':
              sampleData[variable] = 'Tampa International Airport';
              break;
            case 'dropoffLocation':
              sampleData[variable] = 'Downtown Tampa Hotel';
              break;
            case 'tripDate':
              sampleData[variable] = '2024-01-20';
              break;
            case 'tripTime':
              sampleData[variable] = '09:00 AM';
              break;
            case 'vehicleType':
              sampleData[variable] = 'Luxury Sedan';
              break;
            case 'vehicleCapacity':
              sampleData[variable] = '4 passengers';
              break;
            case 'basePrice':
              sampleData[variable] = 85.00;
              break;
            case 'additionalFees':
              sampleData[variable] = 15.00;
              break;
            case 'totalPrice':
              sampleData[variable] = 100.00;
              break;
            case 'companyName':
              sampleData[variable] = 'Airport Shuttle TPA';
              break;
            case 'companyEmail':
              sampleData[variable] = 'info@airportshuttletpa.com';
              break;
            case 'companyPhone':
              sampleData[variable] = '+1 (813) 555-0123';
              break;
            default:
              sampleData[variable] = `Sample ${variable}`;
          }
        });
        setPreviewData(sampleData);
      }
    } catch (error) {
      console.error('Error fetching variables:', error);
    }
  };

  const handleConfigSave = async () => {
    setLoading(true);
    try {
      // Add timeout to prevent hanging
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

      const response = await fetch(`${API_BASE_URL}/email/config`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(emailConfig),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        setMessage({ type: 'success', text: 'Email configuration saved successfully!' });
        setTimeout(() => setMessage(null), 3000);
      } else {
        const error = await response.json();
        setMessage({ type: 'error', text: error.message || 'Failed to save configuration' });
      }
    } catch (error) {
      if (error.name === 'AbortError') {
        setMessage({ type: 'error', text: 'Request timed out. Please try again.' });
      } else {
        setMessage({ type: 'error', text: 'Error saving configuration' });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleTestEmail = async () => {
    setLoading(true);
    try {
      // Add timeout to prevent hanging
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout for email

      const response = await fetch(`${API_BASE_URL}/email/config/test`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        setMessage({ type: 'success', text: 'Test email sent successfully! Check your inbox.' });
      } else {
        const error = await response.json();
        setMessage({ type: 'error', text: error.message || 'Failed to send test email' });
      }
    } catch (error) {
      if (error.name === 'AbortError') {
        setMessage({ type: 'error', text: 'Test email timed out. Please check your SMTP settings.' });
      } else {
        setMessage({ type: 'error', text: 'Error sending test email' });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleTemplateSave = async (template: EmailTemplate) => {
    setLoading(true);
    try {
      const url = template._id 
        ? `${API_BASE_URL}/email/templates/${template._id}`
        : `${API_BASE_URL}/email/templates`;
      
      const method = template._id ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(template)
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'Template saved successfully!' });
        setTimeout(() => setMessage(null), 3000);
        setShowTemplateEditor(false);
        setSelectedTemplate(null);
        fetchTemplates();
      } else {
        const error = await response.json();
        setMessage({ type: 'error', text: error.message || 'Failed to save template' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error saving template' });
    } finally {
      setLoading(false);
    }
  };

  const handleTemplateDelete = async (templateId: string) => {
    if (!window.confirm('Are you sure you want to delete this template?')) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/email/templates/${templateId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'Template deleted successfully!' });
        setTimeout(() => setMessage(null), 3000);
        fetchTemplates();
      } else {
        const error = await response.json();
        setMessage({ type: 'error', text: error.message || 'Failed to delete template' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error deleting template' });
    } finally {
      setLoading(false);
    }
  };

  const handleTestTemplate = (template: EmailTemplate) => {
    setTestingTemplate(template);
    setTestEmail('');
    setShowTestModal(true);
  };

  const sendTestEmail = async () => {
    if (!testingTemplate || !testEmail) {
      setMessage({ type: 'error', text: 'Please enter a valid email address' });
      return;
    }

    setTestLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/email/templates/test`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          templateId: testingTemplate._id,
          testEmail: testEmail
        })
      });

      const result = await response.json();

      if (response.ok) {
        setMessage({ 
          type: 'success', 
          text: `Test email sent successfully to ${testEmail}! Check your inbox.` 
        });
        setShowTestModal(false);
        setTestEmail('');
        setTestingTemplate(null);
      } else {
        setMessage({ type: 'error', text: result.message || 'Failed to send test email' });
      }
    } catch (error) {
      console.error('Error sending test email:', error);
      setMessage({ type: 'error', text: 'Network error. Please try again.' });
    } finally {
      setTestLoading(false);
    }
  };

  return (
    <div className="email-manager">
      <div className="email-manager-header">
        <h2>📧 Email Configuration</h2>
        <div className="email-manager-tabs">
          <button
            className={`tab-button ${activeSection === 'config' ? 'active' : ''}`}
            onClick={() => setActiveSection('config')}
          >
            ⚙️ SMTP Configuration
          </button>
          <button
            className={`tab-button ${activeSection === 'templates' ? 'active' : ''}`}
            onClick={() => setActiveSection('templates')}
          >
            📝 Email Templates
          </button>
        </div>
      </div>

      {message && (
        <div className={`message ${message.type}`}>
          {message.text}
        </div>
      )}

      {activeSection === 'config' && (
        <div className="email-config-section">
          <div className="config-form">
            <h3>SMTP Server Configuration</h3>
            
            <div className="form-group">
              <label>SMTP Host:</label>
              <input
                type="text"
                value={emailConfig.smtpHost}
                onChange={(e) => setEmailConfig({...emailConfig, smtpHost: e.target.value})}
                placeholder="smtp.ionos.com"
              />
            </div>

            <div className="form-group">
              <label>SMTP Port:</label>
              <input
                type="number"
                value={emailConfig.smtpPort}
                onChange={(e) => setEmailConfig({...emailConfig, smtpPort: parseInt(e.target.value)})}
                placeholder="587"
              />
            </div>

            <div className="form-group">
              <label>SMTP Username:</label>
              <input
                type="text"
                value={emailConfig.smtpUser}
                onChange={(e) => setEmailConfig({...emailConfig, smtpUser: e.target.value})}
                placeholder="info@airportshuttletpa.com"
              />
            </div>

            <div className="form-group">
              <label>SMTP Password:</label>
              <input
                type="password"
                value={emailConfig.smtpPassword || ''}
                onChange={(e) => setEmailConfig({...emailConfig, smtpPassword: e.target.value})}
                placeholder="Enter your password"
              />
            </div>

            <div className="form-group">
              <label>
                <input
                  type="checkbox"
                  checked={emailConfig.smtpSecure}
                  onChange={(e) => setEmailConfig({...emailConfig, smtpSecure: e.target.checked})}
                />
                Use SSL/TLS
              </label>
            </div>

            <div className="form-group">
              <label>From Email:</label>
              <input
                type="email"
                value={emailConfig.fromEmail}
                onChange={(e) => setEmailConfig({...emailConfig, fromEmail: e.target.value})}
                placeholder="info@airportshuttletpa.com"
              />
            </div>

            <div className="form-group">
              <label>From Name:</label>
              <input
                type="text"
                value={emailConfig.fromName}
                onChange={(e) => setEmailConfig({...emailConfig, fromName: e.target.value})}
                placeholder="Airport Shuttle TPA"
              />
            </div>

            <div className="form-group">
              <label>Admin Email (for CC):</label>
              <input
                type="email"
                value={emailConfig.adminEmail}
                onChange={(e) => setEmailConfig({...emailConfig, adminEmail: e.target.value})}
                placeholder="info@airportshuttletpa.com"
              />
            </div>

            <div className="form-group">
              <label>
                <input
                  type="checkbox"
                  checked={emailConfig.isActive}
                  onChange={(e) => setEmailConfig({...emailConfig, isActive: e.target.checked})}
                />
                Enable Email Service
              </label>
            </div>

            <div className="form-actions">
              <button
                className="btn btn-primary"
                onClick={handleConfigSave}
                disabled={loading}
              >
                {loading ? 'Saving...' : 'Save Configuration'}
              </button>
              <button
                className="btn btn-secondary"
                onClick={handleTestEmail}
                disabled={loading || !emailConfig.isActive}
              >
                {loading ? 'Sending...' : 'Send Test Email'}
              </button>
            </div>
          </div>
        </div>
      )}

      {activeSection === 'templates' && (
        <div className="email-templates-section">
          <div className="templates-header">
            <h3>Email Templates</h3>
            <button
              className="btn btn-primary"
              onClick={() => {
                setSelectedTemplate({
                  name: '',
                  subject: '',
                  htmlContent: '',
                  textContent: '',
                  type: 'custom',
                  isActive: true,
                  variables: []
                });
                setShowTemplateEditor(true);
              }}
            >
              ➕ Create Template
            </button>
          </div>

          <div className="templates-list">
            {templates.map((template) => (
              <div key={template._id} className="template-card">
                <div className="template-header">
                  <h4>{template.name}</h4>
                  <div className="template-actions">
                    <button
                      className="btn btn-small btn-secondary"
                      onClick={() => {
                        setSelectedTemplate(template);
                        setShowTemplateEditor(true);
                      }}
                    >
                      ✏️ Edit
                    </button>
                    <button
                      className="btn btn-small btn-primary"
                      onClick={() => handleTestTemplate(template)}
                      title="Send test email"
                    >
                      📧 Test
                    </button>
                    <button
                      className="btn btn-small btn-danger"
                      onClick={() => template._id && handleTemplateDelete(template._id)}
                    >
                      🗑️ Delete
                    </button>
                  </div>
                </div>
                <div className="template-info">
                  <p><strong>Subject:</strong> {template.subject}</p>
                  <p><strong>Type:</strong> {template.type}</p>
                  <p><strong>Status:</strong> {template.isActive ? 'Active' : 'Inactive'}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {showTemplateEditor && selectedTemplate && (
        <div className="template-editor-modal">
          <div className="modal-content">
            <div className="modal-header">
              <h3>{selectedTemplate._id ? 'Edit Template' : 'Create Template'}</h3>
              <button
                className="close-button"
                onClick={() => {
                  setShowTemplateEditor(false);
                  setSelectedTemplate(null);
                }}
              >
                ✕
              </button>
            </div>

            <div className="template-editor">
              <div className="form-group">
                <label>Template Name:</label>
                <input
                  type="text"
                  value={selectedTemplate.name}
                  onChange={(e) => setSelectedTemplate({...selectedTemplate, name: e.target.value})}
                  placeholder="confirmation"
                />
              </div>

              <div className="form-group">
                <label>Subject:</label>
                <input
                  type="text"
                  value={selectedTemplate.subject}
                  onChange={(e) => setSelectedTemplate({...selectedTemplate, subject: e.target.value})}
                  placeholder="Booking Confirmation - {{confirmationNumber}}"
                />
              </div>

              <div className="form-group">
                <label>Type:</label>
                <select
                  value={selectedTemplate.type}
                  onChange={(e) => setSelectedTemplate({...selectedTemplate, type: e.target.value as any})}
                >
                  <option value="custom">Custom</option>
                  <option value="confirmation">Confirmation</option>
                  <option value="receipt">Receipt</option>
                </select>
              </div>

              <div className="form-group">
                <label>
                  <input
                    type="checkbox"
                    checked={selectedTemplate.isActive}
                    onChange={(e) => setSelectedTemplate({...selectedTemplate, isActive: e.target.checked})}
                  />
                  Active
                </label>
              </div>

                             <div className="form-group">
                 <label>HTML Content:</label>
                 <RichTextEditor
                   value={selectedTemplate.htmlContent}
                   onChange={(value) => setSelectedTemplate({...selectedTemplate, htmlContent: value})}
                   placeholder="Start writing your email template..."
                   variables={availableVariables}
                   onVariableInsert={(variable) => console.log(`Variable inserted: ${variable}`)}
                 />
               </div>

                                              <div className="form-group">
                   <label>Text Content (Plain Text Version):</label>
                   <textarea
                     value={selectedTemplate.textContent}
                     onChange={(e) => setSelectedTemplate({...selectedTemplate, textContent: e.target.value})}
                     placeholder="Plain text version of the email (for email clients that don't support HTML)"
                     rows={8}
                     style={{ fontFamily: 'Courier New, monospace', fontSize: '14px' }}
                   />
                   <div style={{ color: '#666', marginTop: '5px', display: 'block', fontSize: '12px' }}>
                     This is the plain text version that will be sent to email clients that don't support HTML.
                     You can use the same variables here: {'{{customerName}}'}, {'{{confirmationNumber}}'}, etc.
                   </div>
                 </div>

                             <div className="form-actions">
                 <button
                   className="btn btn-primary"
                   onClick={() => handleTemplateSave(selectedTemplate)}
                   disabled={loading}
                 >
                   {loading ? 'Saving...' : 'Save Template'}
                 </button>
                 <button
                   className="btn btn-info"
                   onClick={() => setShowPreview(true)}
                   disabled={!selectedTemplate.htmlContent.trim()}
                 >
                   👁️ Preview Email
                 </button>
                 <button
                   className="btn btn-secondary"
                   onClick={() => {
                     setShowTemplateEditor(false);
                     setSelectedTemplate(null);
                   }}
                 >
                   Cancel
                 </button>
               </div>
            </div>
          </div>
        </div>
      )}

      {showPreview && selectedTemplate && (
        <EmailPreview
          htmlContent={selectedTemplate.htmlContent}
          textContent={selectedTemplate.textContent}
          subject={selectedTemplate.subject}
          variables={previewData}
          onClose={() => setShowPreview(false)}
        />
      )}

      {/* Test Email Modal */}
      {showTestModal && testingTemplate && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>📧 Test Email Template</h3>
              <button
                className="close-button"
                onClick={() => {
                  setShowTestModal(false);
                  setTestingTemplate(null);
                  setTestEmail('');
                }}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <div className="test-email-info">
                <h4>Testing: {testingTemplate.name}</h4>
                <p><strong>Subject:</strong> {testingTemplate.subject}</p>
                <p><strong>Type:</strong> {testingTemplate.type}</p>
              </div>
              
              <div className="form-group">
                <label htmlFor="testEmail">Test Email Address:</label>
                <input
                  id="testEmail"
                  type="email"
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                  placeholder="Enter email address to send test to"
                  required
                />
                <small className="form-help">
                  A test email will be sent to this address with sample data
                </small>
              </div>

              <div className="test-sample-data">
                <h5>Sample Data Used:</h5>
                <div className="sample-data-grid">
                  <div><strong>Customer:</strong> John Doe</div>
                  <div><strong>Email:</strong> {testEmail || 'test@example.com'}</div>
                  <div><strong>Confirmation:</strong> TEST-001</div>
                  <div><strong>Pickup:</strong> Tampa International Airport (TPA)</div>
                  <div><strong>Dropoff:</strong> Downtown Tampa Hotel</div>
                  <div><strong>Date:</strong> Today</div>
                  <div><strong>Time:</strong> 2:30 PM</div>
                  <div><strong>Vehicle:</strong> Standard Sedan</div>
                  <div><strong>Price:</strong> $45.00</div>
                </div>
              </div>

              <div className="form-actions">
                <button
                  className="btn btn-primary"
                  onClick={sendTestEmail}
                  disabled={testLoading || !testEmail}
                >
                  {testLoading ? 'Sending...' : '📧 Send Test Email'}
                </button>
                <button
                  className="btn btn-secondary"
                  onClick={() => {
                    setShowTestModal(false);
                    setTestingTemplate(null);
                    setTestEmail('');
                  }}
                  disabled={testLoading}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmailManager;
