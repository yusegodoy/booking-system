import React, { useState, useEffect } from 'react';
import RichTextEditor from './RichTextEditor';
import './ServiceAgreementManager.css';

interface ServiceAgreement {
  _id?: string;
  title: string;
  content: string;
  htmlContent: string;
  isActive: boolean;
  version: number;
  lastModified: Date;
  lastModifiedBy: string;
  createdAt?: string;
  updatedAt?: string;
}

interface ServiceAgreementManagerProps {
  token: string;
}

const ServiceAgreementManager: React.FC<ServiceAgreementManagerProps> = ({ token }) => {
  const [agreement, setAgreement] = useState<ServiceAgreement | null>(null);
  const [history, setHistory] = useState<ServiceAgreement[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  
  // Form data
  const [formData, setFormData] = useState({
    title: 'Service Agreement',
    content: '',
    htmlContent: ''
  });

  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5001/api';

  useEffect(() => {
    fetchServiceAgreement();
    fetchHistory();
  }, [token]);

  const fetchServiceAgreement = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/service-agreement`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setAgreement(data);
        setFormData({
          title: data.title,
          content: data.content,
          htmlContent: data.htmlContent
        });
      } else if (response.status === 404) {
        // No agreement found, use defaults
        console.log('No service agreement found, using defaults');
      }
    } catch (error) {
      console.error('Error fetching service agreement:', error);
    }
  };

  const fetchHistory = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/service-agreement/history`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setHistory(data);
      }
    } catch (error) {
      console.error('Error fetching service agreement history:', error);
    }
  };

  const handleSave = async () => {
    if (!formData.title.trim() || !formData.content.trim()) {
      setMessage({ type: 'error', text: 'Title and content are required' });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/service-agreement`, {
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
        setMessage({ type: 'success', text: 'Service agreement updated successfully!' });
        setTimeout(() => setMessage(null), 3000);
        fetchServiceAgreement();
        fetchHistory();
      } else {
        setMessage({ type: 'error', text: result.message || 'Failed to update service agreement' });
      }
    } catch (error) {
      console.error('Error updating service agreement:', error);
      setMessage({ type: 'error', text: 'Network error. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async (versionId: string) => {
    if (!window.confirm('Are you sure you want to restore this version? This will create a new version.')) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/service-agreement/restore/${versionId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          lastModifiedBy: 'Admin'
        })
      });

      const result = await response.json();

      if (response.ok) {
        setMessage({ type: 'success', text: 'Service agreement restored successfully!' });
        setTimeout(() => setMessage(null), 3000);
        fetchServiceAgreement();
        fetchHistory();
        setShowHistory(false);
      } else {
        setMessage({ type: 'error', text: result.message || 'Failed to restore service agreement' });
      }
    } catch (error) {
      console.error('Error restoring service agreement:', error);
      setMessage({ type: 'error', text: 'Network error. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (versionId: string) => {
    if (!window.confirm('Are you sure you want to delete this version? This action cannot be undone.')) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/service-agreement/${versionId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const result = await response.json();

      if (response.ok) {
        setMessage({ type: 'success', text: 'Service agreement version deleted successfully!' });
        setTimeout(() => setMessage(null), 3000);
        fetchHistory();
      } else {
        setMessage({ type: 'error', text: result.message || 'Failed to delete service agreement' });
      }
    } catch (error) {
      console.error('Error deleting service agreement:', error);
      setMessage({ type: 'error', text: 'Network error. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const handleContentChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      content: value,
      htmlContent: value
    }));
  };

  const formatDate = (date: Date | string) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="service-agreement-manager">
      <div className="service-agreement-header">
        <h2>📋 Service Agreement Management</h2>
        <div className="header-actions">
          <button
            className="btn btn-secondary"
            onClick={() => setShowHistory(!showHistory)}
          >
            📚 History ({history.length})
          </button>
          <button
            className="btn btn-info"
            onClick={() => setShowPreview(!showPreview)}
          >
            👁️ Preview
          </button>
        </div>
      </div>

      {message && (
        <div className={`message ${message.type}`}>
          {message.text}
        </div>
      )}

      <div className="service-agreement-content">
        <div className="form-section">
          <div className="form-group">
            <label htmlFor="title">Agreement Title:</label>
            <input
              id="title"
              type="text"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Service Agreement"
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label>Agreement Content:</label>
            <RichTextEditor
              value={formData.htmlContent}
              onChange={handleContentChange}
              placeholder="Enter the service agreement content..."
            />
          </div>

          <div className="form-actions">
            <button
              className="btn btn-primary"
              onClick={handleSave}
              disabled={loading}
            >
              {loading ? 'Saving...' : '💾 Save Agreement'}
            </button>
          </div>
        </div>

        {showPreview && (
          <div className="preview-section">
            <h3>📄 Preview</h3>
            <div className="preview-content">
              <h4>{formData.title}</h4>
              <div 
                dangerouslySetInnerHTML={{ __html: formData.htmlContent || '<p>No content available</p>' }}
              />
            </div>
          </div>
        )}

        {showHistory && (
          <div className="history-section">
            <h3>📚 Version History</h3>
            <div className="history-list">
              {history.length === 0 ? (
                <p className="no-history">No version history available</p>
              ) : (
                history.map((version) => (
                  <div key={version._id} className={`history-item ${version.isActive ? 'active' : ''}`}>
                    <div className="history-header">
                      <div className="history-info">
                        <h4>Version {version.version}</h4>
                        <p className="history-meta">
                          {formatDate(version.lastModified)} by {version.lastModifiedBy}
                          {version.isActive && <span className="active-badge">Active</span>}
                        </p>
                      </div>
                      <div className="history-actions">
                        {!version.isActive && (
                          <>
                            <button
                              className="btn btn-small btn-primary"
                              onClick={() => handleRestore(version._id!)}
                              disabled={loading}
                            >
                              🔄 Restore
                            </button>
                            <button
                              className="btn btn-small btn-danger"
                              onClick={() => handleDelete(version._id!)}
                              disabled={loading}
                            >
                              🗑️ Delete
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="history-content">
                      <p><strong>Title:</strong> {version.title}</p>
                      <div className="history-preview">
                        <div 
                          dangerouslySetInnerHTML={{ 
                            __html: version.htmlContent.substring(0, 200) + (version.htmlContent.length > 200 ? '...' : '')
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      <div className="service-agreement-info">
        <h4>ℹ️ Information</h4>
        <ul>
          <li>The Service Agreement will be available as <code>{'{{serviceAgreement}}'}</code> variable in email templates</li>
          <li>Only one version can be active at a time</li>
          <li>Creating a new version will automatically deactivate the previous one</li>
          <li>You can restore any previous version, which will create a new version</li>
          <li>Inactive versions can be deleted to clean up the history</li>
        </ul>
      </div>
    </div>
  );
};

export default ServiceAgreementManager;
