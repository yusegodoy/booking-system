import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../config/constants';
import './EmailVariablesManager.css';

interface EmailVariable {
  _id: string;
  category: string;
  variableName: string;
  codeField: string;
  description: string;
  dataType: string;
  isActive: boolean;
  isRequired: boolean;
  defaultValue?: string;
  exampleValue?: string;
}

interface VariablesByCategory {
  [category: string]: EmailVariable[];
}

interface EmailVariablesManagerProps {
  token: string;
}

const EmailVariablesManager: React.FC<EmailVariablesManagerProps> = ({ token }) => {
  const [variables, setVariables] = useState<VariablesByCategory>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  useEffect(() => {
    fetchVariables();
  }, [token]);

  const fetchVariables = async () => {
    try {
      console.log('🔄 EmailVariablesManager: Starting fetchVariables...');
      console.log('🔑 Token available:', !!token);
      console.log('🌐 API_BASE_URL:', API_BASE_URL);
      
      setLoading(true);
      
      if (!token) {
        throw new Error('No authentication token found');
      }

      const url = `${API_BASE_URL}/email/variables/categories`;
      console.log('📡 Fetching URL:', url);

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('📊 Response status:', response.status);
      console.log('📋 Response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Error response:', errorText);
        throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log('✅ Variables data received:', data);
      console.log('📊 Number of categories:', Object.keys(data).length);
      
      setVariables(data);
      setError(null);
    } catch (error) {
      console.error('❌ Error fetching variables:', error);
      setError(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  const toggleCategory = (category: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(category)) {
      newExpanded.delete(category);
    } else {
      newExpanded.add(category);
    }
    setExpandedCategories(newExpanded);
  };

  const getFilteredVariables = (): VariablesByCategory => {
    let filtered = variables;

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = Object.keys(variables)
        .filter(category => category === selectedCategory)
        .reduce((obj, key) => {
          obj[key] = variables[key];
          return obj;
        }, {} as VariablesByCategory);
    }

    // Filter by search term
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      filtered = Object.keys(filtered).reduce((obj, category) => {
        const categoryVariables = filtered[category].filter(variable =>
          variable.variableName.toLowerCase().includes(searchLower) ||
          variable.description.toLowerCase().includes(searchLower) ||
          variable.codeField.toLowerCase().includes(searchLower)
        );
        
        if (categoryVariables.length > 0) {
          obj[category] = categoryVariables;
        }
        
        return obj;
      }, {} as VariablesByCategory);
    }

    return filtered;
  };

  const getCategoryIcon = (category: string): string => {
    const icons: { [key: string]: string } = {
      'Customer Information': '👤',
      'Trip Information': '🚗',
      'Vehicle Information': '🚙',
      'Pricing & Payment': '💰',
      'Child Safety': '🪑',
      'Driver Assignment': '👨‍✈️',
      'Booking Details': '📋',
      'Company Information': '🏢'
    };
    return icons[category] || '📝';
  };

  const getDataTypeClass = (dataType: string): string => {
    const classes: { [key: string]: string } = {
      'string': 'data-type-string',
      'number': 'data-type-number',
      'boolean': 'data-type-boolean',
      'date': 'data-type-date',
      'array': 'data-type-array'
    };
    return classes[dataType] || 'data-type-default';
  };

  if (loading) {
    return (
      <div className="email-variables-manager">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading email variables...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="email-variables-manager">
        <div className="message error">
          <h3>Error loading email variables</h3>
          <p>{error}</p>
          <button onClick={fetchVariables} className="btn btn-secondary btn-small">
            Retry
          </button>
        </div>
      </div>
    );
  }

  const filteredVariables = getFilteredVariables();
  const categories = Object.keys(filteredVariables);

  return (
    <div className="email-variables-manager">
      {/* Header */}
      <div className="email-variables-header">
        <div className="header-content">
          <div>
            <h2>Email Variables</h2>
            <p>Manage the variables available for email templates</p>
          </div>
          <div className="header-actions">
            <button
              onClick={fetchVariables}
              className="btn btn-primary"
            >
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="filters-section">
        <div className="filters-grid">
          {/* Search */}
          <div className="form-group">
            <label>Search Variables</label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name, description or field..."
              className="form-input"
            />
          </div>

          {/* Category Filter */}
          <div className="form-group">
            <label>Filter by Category</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="form-select"
            >
              <option value="all">All Categories</option>
              {Object.keys(variables).map(category => (
                <option key={category} value={category}>
                  {getCategoryIcon(category)} {category}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Variables List */}
      <div className="variables-list">
        {categories.length === 0 ? (
          <div className="no-variables-message">
            <div className="no-variables-icon">📝</div>
            <p>
              {searchTerm || selectedCategory !== 'all' 
                ? 'No variables found matching the filters'
                : 'No variables available'
              }
            </p>
          </div>
        ) : (
          categories.map(category => {
            const categoryVariables = filteredVariables[category];
            const isExpanded = expandedCategories.has(category);
            
            return (
              <div key={category} className="category-block">
                {/* Category Header */}
                <button
                  onClick={() => toggleCategory(category)}
                  className={`category-header ${isExpanded ? 'expanded' : ''}`}
                >
                  <div className="category-info">
                    <span className="category-icon">{getCategoryIcon(category)}</span>
                    <div className="category-details">
                      <h3>{category}</h3>
                      <p>
                        {categoryVariables.length} variable{categoryVariables.length !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                  <span className={`expand-icon ${isExpanded ? 'expanded' : ''}`}>
                    ▼
                  </span>
                </button>

                {/* Variables List */}
                {isExpanded && (
                  <div className="category-content">
                    {categoryVariables.map((variable, index) => (
                      <div
                        key={variable._id}
                        className={`variable-item ${index !== categoryVariables.length - 1 ? 'with-border' : ''}`}
                      >
                        <div className="variable-header">
                          <h4 className="variable-name">
                            {`{{${variable.variableName}}}`}
                          </h4>
                          <div className="variable-badges">
                            <span className={`data-type-badge ${getDataTypeClass(variable.dataType)}`}>
                              {variable.dataType}
                            </span>
                            {variable.isRequired && (
                              <span className="badge badge-required">Required</span>
                            )}
                            {!variable.isActive && (
                              <span className="badge badge-inactive">Inactive</span>
                            )}
                          </div>
                        </div>
                        
                        <p className="variable-description">
                          {variable.description}
                        </p>
                        
                        <div className="variable-details">
                          <div className="detail-item">
                            <span className="detail-label">Field:</span> 
                            <code className="code-field">{variable.codeField}</code>
                          </div>
                          {variable.exampleValue && (
                            <div className="detail-item">
                              <span className="detail-label">Example:</span> 
                              <code className="code-field">{variable.exampleValue}</code>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Summary */}
      {categories.length > 0 && (
        <div className="summary-section">
          <div className="summary-info">
            <span className="summary-icon">ℹ️</span>
            <div className="summary-text">
              <strong>Total:</strong> {Object.values(filteredVariables).reduce((sum, vars) => sum + vars.length, 0)} variables in {categories.length} categor{categories.length !== 1 ? 'ies' : 'y'}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmailVariablesManager;

