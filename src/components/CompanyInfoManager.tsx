import React, { useState, useEffect } from 'react';
import RichTextEditor from './RichTextEditor';
import './CompanyInfoManager.css';

interface CompanyInfo {
  _id?: string;
  companyName: string;
  companyEmail: string;
  companyPhone: string;
  companyWebsite: string;
  companyAddress: string;
  companyCity: string;
  companyState: string;
  companyZipCode: string;
  companyCountry: string;
  businessLicense: string;
  taxId: string;
  operatingHours: string;
  emergencyContact: string;
  logoUrl: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  backgroundColor: string;
  textColor: string;
  facebookUrl: string;
  instagramUrl: string;
  twitterUrl: string;
  linkedinUrl: string;
  description: string;
  missionStatement: string;
  termsOfService: string;
  privacyPolicy: string;
  isActive: boolean;
  lastModified: Date;
  lastModifiedBy: string;
  createdAt?: string;
  updatedAt?: string;
}

interface CompanyInfoManagerProps {
  token: string;
}

const CompanyInfoManager: React.FC<CompanyInfoManagerProps> = ({ token }) => {
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [activeTab, setActiveTab] = useState<'basic' | 'branding' | 'social' | 'legal' | 'preview'>('basic');
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>('');
  
  // Form data
  const [formData, setFormData] = useState({
    companyName: '',
    companyEmail: '',
    companyPhone: '',
    companyWebsite: '',
    companyAddress: '',
    companyCity: '',
    companyState: '',
    companyZipCode: '',
    companyCountry: '',
    businessLicense: '',
    taxId: '',
    operatingHours: '',
    emergencyContact: '',
    primaryColor: '#007bff',
    secondaryColor: '#6c757d',
    accentColor: '#28a745',
    backgroundColor: '#ffffff',
    textColor: '#333333',
    facebookUrl: '',
    instagramUrl: '',
    twitterUrl: '',
    linkedinUrl: '',
    description: '',
    missionStatement: '',
    termsOfService: '',
    privacyPolicy: ''
  });

  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5001/api';

  useEffect(() => {
    fetchCompanyInfo();
  }, [token]);

  const fetchCompanyInfo = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/company-info`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setCompanyInfo(data);
        setFormData({
          companyName: data.companyName || '',
          companyEmail: data.companyEmail || '',
          companyPhone: data.companyPhone || '',
          companyWebsite: data.companyWebsite || '',
          companyAddress: data.companyAddress || '',
          companyCity: data.companyCity || '',
          companyState: data.companyState || '',
          companyZipCode: data.companyZipCode || '',
          companyCountry: data.companyCountry || '',
          businessLicense: data.businessLicense || '',
          taxId: data.taxId || '',
          operatingHours: data.operatingHours || '',
          emergencyContact: data.emergencyContact || '',
          primaryColor: data.primaryColor || '#007bff',
          secondaryColor: data.secondaryColor || '#6c757d',
          accentColor: data.accentColor || '#28a745',
          backgroundColor: data.backgroundColor || '#ffffff',
          textColor: data.textColor || '#333333',
          facebookUrl: data.facebookUrl || '',
          instagramUrl: data.instagramUrl || '',
          twitterUrl: data.twitterUrl || '',
          linkedinUrl: data.linkedinUrl || '',
          description: data.description || '',
          missionStatement: data.missionStatement || '',
          termsOfService: data.termsOfService || '',
          privacyPolicy: data.privacyPolicy || ''
        });
        if (data.logoUrl) {
          setLogoPreview(data.logoUrl);
        }
      }
    } catch (error) {
      console.error('Error fetching company info:', error);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/company-info`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...formData,
          lastModifiedBy: 'Admin'
        })
      });

      const result = await response.json();

      if (response.ok) {
        setMessage({ type: 'success', text: 'Company information updated successfully!' });
        setTimeout(() => setMessage(null), 3000);
        fetchCompanyInfo();
      } else {
        setMessage({ type: 'error', text: result.message || 'Failed to update company information' });
      }
    } catch (error) {
      console.error('Error updating company info:', error);
      setMessage({ type: 'error', text: 'Network error. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const handleLogoUpload = async () => {
    if (!logoFile) {
      setMessage({ type: 'error', text: 'Please select a logo file' });
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('logo', logoFile);

      const response = await fetch(`${API_BASE_URL}/company-info/upload-logo`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const result = await response.json();

      if (response.ok) {
        setMessage({ type: 'success', text: 'Logo uploaded successfully!' });
        setTimeout(() => setMessage(null), 3000);
        setLogoPreview(result.logoUrl);
        setLogoFile(null);
        fetchCompanyInfo();
      } else {
        setMessage({ type: 'error', text: result.message || 'Failed to upload logo' });
      }
    } catch (error) {
      console.error('Error uploading logo:', error);
      setMessage({ type: 'error', text: 'Network error. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const handleLogoDelete = async () => {
    if (!window.confirm('Are you sure you want to delete the logo?')) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/company-info/logo`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const result = await response.json();

      if (response.ok) {
        setMessage({ type: 'success', text: 'Logo deleted successfully!' });
        setTimeout(() => setMessage(null), 3000);
        setLogoPreview('');
        fetchCompanyInfo();
      } else {
        setMessage({ type: 'error', text: result.message || 'Failed to delete logo' });
      }
    } catch (error) {
      console.error('Error deleting logo:', error);
      setMessage({ type: 'error', text: 'Network error. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setLogoPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleRichTextChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const applyColorsToDocument = () => {
    const root = document.documentElement;
    root.style.setProperty('--primary-color', formData.primaryColor);
    root.style.setProperty('--secondary-color', formData.secondaryColor);
    root.style.setProperty('--accent-color', formData.accentColor);
    root.style.setProperty('--background-color', formData.backgroundColor);
    root.style.setProperty('--text-color', formData.textColor);
  };

  useEffect(() => {
    applyColorsToDocument();
  }, [formData.primaryColor, formData.secondaryColor, formData.accentColor, formData.backgroundColor, formData.textColor]);

  return (
    <div className="company-info-manager">
      <div className="company-info-header">
        <h2>🏢 Company Information Management</h2>
        <div className="header-actions">
          <button
            className="btn btn-primary"
            onClick={handleSave}
            disabled={loading}
          >
            {loading ? 'Saving...' : '💾 Save Changes'}
          </button>
        </div>
      </div>

      {message && (
        <div className={`message ${message.type}`}>
          {message.text}
        </div>
      )}

      <div className="company-info-tabs">
        <button
          className={`tab-button ${activeTab === 'basic' ? 'active' : ''}`}
          onClick={() => setActiveTab('basic')}
        >
          📋 Basic Info
        </button>
        <button
          className={`tab-button ${activeTab === 'branding' ? 'active' : ''}`}
          onClick={() => setActiveTab('branding')}
        >
          🎨 Branding
        </button>
        <button
          className={`tab-button ${activeTab === 'social' ? 'active' : ''}`}
          onClick={() => setActiveTab('social')}
        >
          📱 Social Media
        </button>
        <button
          className={`tab-button ${activeTab === 'legal' ? 'active' : ''}`}
          onClick={() => setActiveTab('legal')}
        >
          ⚖️ Legal
        </button>
        <button
          className={`tab-button ${activeTab === 'preview' ? 'active' : ''}`}
          onClick={() => setActiveTab('preview')}
        >
          👁️ Preview
        </button>
      </div>

      <div className="company-info-content">
        {activeTab === 'basic' && (
          <div className="tab-content">
            <h3>📋 Basic Company Information</h3>
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="companyName">Company Name:</label>
                <input
                  id="companyName"
                  type="text"
                  value={formData.companyName}
                  onChange={(e) => handleInputChange('companyName', e.target.value)}
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label htmlFor="companyEmail">Email:</label>
                <input
                  id="companyEmail"
                  type="email"
                  value={formData.companyEmail}
                  onChange={(e) => handleInputChange('companyEmail', e.target.value)}
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label htmlFor="companyPhone">Phone:</label>
                <input
                  id="companyPhone"
                  type="tel"
                  value={formData.companyPhone}
                  onChange={(e) => handleInputChange('companyPhone', e.target.value)}
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label htmlFor="companyWebsite">Website:</label>
                <input
                  id="companyWebsite"
                  type="url"
                  value={formData.companyWebsite}
                  onChange={(e) => handleInputChange('companyWebsite', e.target.value)}
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label htmlFor="companyAddress">Address:</label>
                <input
                  id="companyAddress"
                  type="text"
                  value={formData.companyAddress}
                  onChange={(e) => handleInputChange('companyAddress', e.target.value)}
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label htmlFor="companyCity">City:</label>
                <input
                  id="companyCity"
                  type="text"
                  value={formData.companyCity}
                  onChange={(e) => handleInputChange('companyCity', e.target.value)}
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label htmlFor="companyState">State:</label>
                <input
                  id="companyState"
                  type="text"
                  value={formData.companyState}
                  onChange={(e) => handleInputChange('companyState', e.target.value)}
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label htmlFor="companyZipCode">Zip Code:</label>
                <input
                  id="companyZipCode"
                  type="text"
                  value={formData.companyZipCode}
                  onChange={(e) => handleInputChange('companyZipCode', e.target.value)}
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label htmlFor="companyCountry">Country:</label>
                <input
                  id="companyCountry"
                  type="text"
                  value={formData.companyCountry}
                  onChange={(e) => handleInputChange('companyCountry', e.target.value)}
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label htmlFor="operatingHours">Operating Hours:</label>
                <input
                  id="operatingHours"
                  type="text"
                  value={formData.operatingHours}
                  onChange={(e) => handleInputChange('operatingHours', e.target.value)}
                  className="form-input"
                  placeholder="e.g., 24/7, Mon-Fri 8AM-6PM"
                />
              </div>
              <div className="form-group">
                <label htmlFor="emergencyContact">Emergency Contact:</label>
                <input
                  id="emergencyContact"
                  type="tel"
                  value={formData.emergencyContact}
                  onChange={(e) => handleInputChange('emergencyContact', e.target.value)}
                  className="form-input"
                />
              </div>
              <div className="form-group full-width">
                <label htmlFor="description">Company Description:</label>
                <textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  className="form-textarea"
                  rows={3}
                />
              </div>
              <div className="form-group full-width">
                <label htmlFor="missionStatement">Mission Statement:</label>
                <textarea
                  id="missionStatement"
                  value={formData.missionStatement}
                  onChange={(e) => handleInputChange('missionStatement', e.target.value)}
                  className="form-textarea"
                  rows={3}
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'branding' && (
          <div className="tab-content">
            <h3>🎨 Branding & Colors</h3>
            
            <div className="logo-section">
              <h4>Company Logo</h4>
              <div className="logo-upload">
                {logoPreview && (
                  <div className="logo-preview">
                    <img src={logoPreview} alt="Company Logo" />
                    <button
                      className="btn btn-danger btn-small"
                      onClick={handleLogoDelete}
                      disabled={loading}
                    >
                      🗑️ Delete
                    </button>
                  </div>
                )}
                <div className="logo-upload-controls">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="file-input"
                    id="logo-upload"
                  />
                  <label htmlFor="logo-upload" className="file-input-label">
                    📁 Choose Logo
                  </label>
                  {logoFile && (
                    <button
                      className="btn btn-primary btn-small"
                      onClick={handleLogoUpload}
                      disabled={loading}
                    >
                      {loading ? 'Uploading...' : '📤 Upload'}
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="color-section">
              <h4>Color Palette</h4>
              <div className="color-grid">
                <div className="color-group">
                  <label htmlFor="primaryColor">Primary Color:</label>
                  <div className="color-input-group">
                    <input
                      id="primaryColor"
                      type="color"
                      value={formData.primaryColor}
                      onChange={(e) => handleInputChange('primaryColor', e.target.value)}
                      className="color-input"
                    />
                    <input
                      type="text"
                      value={formData.primaryColor}
                      onChange={(e) => handleInputChange('primaryColor', e.target.value)}
                      className="color-text-input"
                    />
                  </div>
                </div>
                <div className="color-group">
                  <label htmlFor="secondaryColor">Secondary Color:</label>
                  <div className="color-input-group">
                    <input
                      id="secondaryColor"
                      type="color"
                      value={formData.secondaryColor}
                      onChange={(e) => handleInputChange('secondaryColor', e.target.value)}
                      className="color-input"
                    />
                    <input
                      type="text"
                      value={formData.secondaryColor}
                      onChange={(e) => handleInputChange('secondaryColor', e.target.value)}
                      className="color-text-input"
                    />
                  </div>
                </div>
                <div className="color-group">
                  <label htmlFor="accentColor">Accent Color:</label>
                  <div className="color-input-group">
                    <input
                      id="accentColor"
                      type="color"
                      value={formData.accentColor}
                      onChange={(e) => handleInputChange('accentColor', e.target.value)}
                      className="color-input"
                    />
                    <input
                      type="text"
                      value={formData.accentColor}
                      onChange={(e) => handleInputChange('accentColor', e.target.value)}
                      className="color-text-input"
                    />
                  </div>
                </div>
                <div className="color-group">
                  <label htmlFor="backgroundColor">Background Color:</label>
                  <div className="color-input-group">
                    <input
                      id="backgroundColor"
                      type="color"
                      value={formData.backgroundColor}
                      onChange={(e) => handleInputChange('backgroundColor', e.target.value)}
                      className="color-input"
                    />
                    <input
                      type="text"
                      value={formData.backgroundColor}
                      onChange={(e) => handleInputChange('backgroundColor', e.target.value)}
                      className="color-text-input"
                    />
                  </div>
                </div>
                <div className="color-group">
                  <label htmlFor="textColor">Text Color:</label>
                  <div className="color-input-group">
                    <input
                      id="textColor"
                      type="color"
                      value={formData.textColor}
                      onChange={(e) => handleInputChange('textColor', e.target.value)}
                      className="color-input"
                    />
                    <input
                      type="text"
                      value={formData.textColor}
                      onChange={(e) => handleInputChange('textColor', e.target.value)}
                      className="color-text-input"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'social' && (
          <div className="tab-content">
            <h3>📱 Social Media Links</h3>
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="facebookUrl">Facebook URL:</label>
                <input
                  id="facebookUrl"
                  type="url"
                  value={formData.facebookUrl}
                  onChange={(e) => handleInputChange('facebookUrl', e.target.value)}
                  className="form-input"
                  placeholder="https://facebook.com/yourcompany"
                />
              </div>
              <div className="form-group">
                <label htmlFor="instagramUrl">Instagram URL:</label>
                <input
                  id="instagramUrl"
                  type="url"
                  value={formData.instagramUrl}
                  onChange={(e) => handleInputChange('instagramUrl', e.target.value)}
                  className="form-input"
                  placeholder="https://instagram.com/yourcompany"
                />
              </div>
              <div className="form-group">
                <label htmlFor="twitterUrl">Twitter URL:</label>
                <input
                  id="twitterUrl"
                  type="url"
                  value={formData.twitterUrl}
                  onChange={(e) => handleInputChange('twitterUrl', e.target.value)}
                  className="form-input"
                  placeholder="https://twitter.com/yourcompany"
                />
              </div>
              <div className="form-group">
                <label htmlFor="linkedinUrl">LinkedIn URL:</label>
                <input
                  id="linkedinUrl"
                  type="url"
                  value={formData.linkedinUrl}
                  onChange={(e) => handleInputChange('linkedinUrl', e.target.value)}
                  className="form-input"
                  placeholder="https://linkedin.com/company/yourcompany"
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'legal' && (
          <div className="tab-content">
            <h3>⚖️ Legal Information</h3>
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="businessLicense">Business License:</label>
                <input
                  id="businessLicense"
                  type="text"
                  value={formData.businessLicense}
                  onChange={(e) => handleInputChange('businessLicense', e.target.value)}
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label htmlFor="taxId">Tax ID:</label>
                <input
                  id="taxId"
                  type="text"
                  value={formData.taxId}
                  onChange={(e) => handleInputChange('taxId', e.target.value)}
                  className="form-input"
                />
              </div>
              <div className="form-group full-width">
                <label>Terms of Service:</label>
                <RichTextEditor
                  value={formData.termsOfService}
                  onChange={(value) => handleRichTextChange('termsOfService', value)}
                  placeholder="Enter terms of service..."
                />
              </div>
              <div className="form-group full-width">
                <label>Privacy Policy:</label>
                <RichTextEditor
                  value={formData.privacyPolicy}
                  onChange={(value) => handleRichTextChange('privacyPolicy', value)}
                  placeholder="Enter privacy policy..."
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'preview' && (
          <div className="tab-content">
            <h3>👁️ Company Information Preview</h3>
            <div className="preview-container">
              <div className="company-card" style={{
                backgroundColor: formData.backgroundColor,
                color: formData.textColor,
                borderColor: formData.primaryColor
              }}>
                {logoPreview && (
                  <div className="company-logo">
                    <img src={logoPreview} alt="Company Logo" />
                  </div>
                )}
                <h2 style={{ color: formData.primaryColor }}>{formData.companyName}</h2>
                <p className="company-description">{formData.description}</p>
                <p className="company-mission">{formData.missionStatement}</p>
                
                <div className="company-details">
                  <div className="detail-item">
                    <strong>📧 Email:</strong> {formData.companyEmail}
                  </div>
                  <div className="detail-item">
                    <strong>📞 Phone:</strong> {formData.companyPhone}
                  </div>
                  <div className="detail-item">
                    <strong>🌐 Website:</strong> {formData.companyWebsite}
                  </div>
                  <div className="detail-item">
                    <strong>📍 Address:</strong> {formData.companyAddress}, {formData.companyCity}, {formData.companyState} {formData.companyZipCode}, {formData.companyCountry}
                  </div>
                  <div className="detail-item">
                    <strong>🕒 Hours:</strong> {formData.operatingHours}
                  </div>
                  <div className="detail-item">
                    <strong>🚨 Emergency:</strong> {formData.emergencyContact}
                  </div>
                </div>

                <div className="social-links">
                  {formData.facebookUrl && (
                    <a href={formData.facebookUrl} target="_blank" rel="noopener noreferrer">
                      📘 Facebook
                    </a>
                  )}
                  {formData.instagramUrl && (
                    <a href={formData.instagramUrl} target="_blank" rel="noopener noreferrer">
                      📷 Instagram
                    </a>
                  )}
                  {formData.twitterUrl && (
                    <a href={formData.twitterUrl} target="_blank" rel="noopener noreferrer">
                      🐦 Twitter
                    </a>
                  )}
                  {formData.linkedinUrl && (
                    <a href={formData.linkedinUrl} target="_blank" rel="noopener noreferrer">
                      💼 LinkedIn
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="company-info-footer">
        <h4>ℹ️ Available Email Variables</h4>
        <div className="variables-grid">
          <div className="variable-group">
            <h5>Basic Info:</h5>
            <code>{'{{companyName}}'}</code>
            <code>{'{{companyEmail}}'}</code>
            <code>{'{{companyPhone}}'}</code>
            <code>{'{{companyWebsite}}'}</code>
            <code>{'{{fullAddress}}'}</code>
          </div>
          <div className="variable-group">
            <h5>Business:</h5>
            <code>{'{{businessLicense}}'}</code>
            <code>{'{{taxId}}'}</code>
            <code>{'{{operatingHours}}'}</code>
            <code>{'{{emergencyContact}}'}</code>
          </div>
          <div className="variable-group">
            <h5>Branding:</h5>
            <code>{'{{logoUrl}}'}</code>
            <code>{'{{primaryColor}}'}</code>
            <code>{'{{secondaryColor}}'}</code>
            <code>{'{{accentColor}}'}</code>
          </div>
          <div className="variable-group">
            <h5>Social:</h5>
            <code>{'{{facebookUrl}}'}</code>
            <code>{'{{instagramUrl}}'}</code>
            <code>{'{{twitterUrl}}'}</code>
            <code>{'{{linkedinUrl}}'}</code>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompanyInfoManager;
