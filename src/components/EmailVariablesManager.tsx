import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../config/constants';

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

const EmailVariablesManager: React.FC = () => {
  const [variables, setVariables] = useState<VariablesByCategory>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  useEffect(() => {
    fetchVariables();
  }, []);

  const fetchVariables = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`${API_BASE_URL}/email/variables/categories`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setVariables(data);
      setError(null);
    } catch (error) {
      console.error('Error fetching variables:', error);
      setError(error instanceof Error ? error.message : 'Error desconocido');
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

  const getDataTypeColor = (dataType: string): string => {
    const colors: { [key: string]: string } = {
      'string': 'bg-blue-100 text-blue-800',
      'number': 'bg-green-100 text-green-800',
      'boolean': 'bg-yellow-100 text-yellow-800',
      'date': 'bg-purple-100 text-purple-800',
      'array': 'bg-red-100 text-red-800'
    };
    return colors[dataType] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">
              Error al cargar variables
            </h3>
            <div className="mt-2 text-sm text-red-700">
              {error}
            </div>
            <div className="mt-4">
              <button
                onClick={fetchVariables}
                className="bg-red-100 hover:bg-red-200 text-red-800 px-3 py-1 rounded text-sm"
              >
                Reintentar
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const filteredVariables = getFilteredVariables();
  const categories = Object.keys(filteredVariables);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Variables de Email</h2>
            <p className="mt-1 text-sm text-gray-600">
              Gestiona las variables disponibles para las plantillas de email
            </p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={fetchVariables}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
            >
              Actualizar
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Buscar variables
            </label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por nombre, descripción o campo..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Category Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Filtrar por categoría
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Todas las categorías</option>
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
      <div className="space-y-4">
        {categories.length === 0 ? (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
            <div className="text-gray-500">
              {searchTerm || selectedCategory !== 'all' 
                ? 'No se encontraron variables que coincidan con los filtros'
                : 'No hay variables disponibles'
              }
            </div>
          </div>
        ) : (
          categories.map(category => {
            const categoryVariables = filteredVariables[category];
            const isExpanded = expandedCategories.has(category);
            
            return (
              <div key={category} className="bg-white shadow rounded-lg overflow-hidden">
                {/* Category Header */}
                <button
                  onClick={() => toggleCategory(category)}
                  className="w-full px-6 py-4 bg-gray-50 hover:bg-gray-100 transition-colors duration-200 flex items-center justify-between"
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">{getCategoryIcon(category)}</span>
                    <div className="text-left">
                      <h3 className="text-lg font-semibold text-gray-900">{category}</h3>
                      <p className="text-sm text-gray-600">
                        {categoryVariables.length} variable{categoryVariables.length !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                  <svg
                    className={`w-5 h-5 text-gray-500 transition-transform duration-200 ${
                      isExpanded ? 'rotate-180' : ''
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Variables List */}
                {isExpanded && (
                  <div className="border-t border-gray-200">
                    {categoryVariables.map((variable, index) => (
                      <div
                        key={variable._id}
                        className={`px-6 py-4 ${
                          index !== categoryVariables.length - 1 ? 'border-b border-gray-100' : ''
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <h4 className="text-sm font-medium text-gray-900">
                                {`{{${variable.variableName}}}`}
                              </h4>
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getDataTypeColor(variable.dataType)}`}>
                                {variable.dataType}
                              </span>
                              {variable.isRequired && (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                  Requerido
                                </span>
                              )}
                              {!variable.isActive && (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                  Inactivo
                                </span>
                              )}
                            </div>
                            
                            <p className="text-sm text-gray-600 mb-2">
                              {variable.description}
                            </p>
                            
                            <div className="text-xs text-gray-500 space-y-1">
                              <div>
                                <span className="font-medium">Campo:</span> <code className="bg-gray-100 px-1 py-0.5 rounded">{variable.codeField}</code>
                              </div>
                              {variable.exampleValue && (
                                <div>
                                  <span className="font-medium">Ejemplo:</span> <code className="bg-gray-100 px-1 py-0.5 rounded">{variable.exampleValue}</code>
                                </div>
                              )}
                            </div>
                          </div>
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
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center">
            <svg className="h-5 w-5 text-blue-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <div className="text-sm text-blue-800">
              <strong>Total:</strong> {Object.values(filteredVariables).reduce((sum, vars) => sum + vars.length, 0)} variables en {categories.length} categoría{categories.length !== 1 ? 's' : ''}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmailVariablesManager;

