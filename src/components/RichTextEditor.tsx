import React, { useState, useRef, useEffect, useCallback } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import './RichTextEditor.css';

interface EmailVariable {
  _id: string;
  category: string;
  variableName: string;
  codeField: string;
  description: string;
  dataType: string;
  isActive: boolean;
  isRequired: boolean;
  exampleValue?: string;
}

interface VariablesByCategory {
  [category: string]: EmailVariable[];
}

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  variables?: string[];
  variablesByCategory?: VariablesByCategory;
  onVariableInsert?: (variable: string) => void;
  readOnly?: boolean;
}

const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  placeholder = 'Start typing...',
  variables = [],
  variablesByCategory = {},
  onVariableInsert,
  readOnly = false
}) => {
  const [showVariables, setShowVariables] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const quillRef = useRef<ReactQuill>(null);

  // Quill modules configuration - Simplified to avoid module conflicts
  const modules = {
    toolbar: [
      [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'color': [] }, { 'background': [] }],
      [{ 'font': [] }],
      [{ 'size': ['small', false, 'large', 'huge'] }],
      [{ 'align': [] }],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      [{ 'indent': '-1'}, { 'indent': '+1' }],
      ['link', 'image'],
      ['clean']
    ]
  };

  // Quill formats configuration
  const formats = [
    'header', 'font', 'size',
    'bold', 'italic', 'underline', 'strike', 'blockquote',
    'list', 'bullet', 'indent',
    'link', 'image',
    'color', 'background',
    'align', 'clean'
  ];

  const insertVariable = (variable: string) => {
    const quill = quillRef.current?.getEditor();
    if (quill) {
      const range = quill.getSelection();
      if (range) {
        quill.insertText(range.index, `{{${variable}}}`, 'user');
        quill.setSelection(range.index + variable.length + 4);
      } else {
        quill.insertText(quill.getLength(), `{{${variable}}}`, 'user');
      }
    }
    
    if (onVariableInsert) {
      onVariableInsert(variable);
    }
    
    setShowVariables(false);
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

  const getFilteredVariables = useCallback((): VariablesByCategory => {
    let filtered = variablesByCategory;

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = Object.keys(variablesByCategory)
        .filter(category => category === selectedCategory)
        .reduce((obj, key) => {
          obj[key] = variablesByCategory[key];
          return obj;
        }, {} as VariablesByCategory);
    }

    // Filter by search term
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      filtered = Object.keys(filtered).reduce((obj, category) => {
        const categoryVariables = filtered[category].filter(variable =>
          variable.variableName.toLowerCase().includes(searchLower) ||
          variable.description.toLowerCase().includes(searchLower)
        );
        
        if (categoryVariables.length > 0) {
          obj[category] = categoryVariables;
        }
        
        return obj;
      }, {} as VariablesByCategory);
    }

    return filtered;
  }, [variablesByCategory, selectedCategory, searchTerm]);

  // Get all variable names for backward compatibility
  const getAllVariableNames = useCallback((): string[] => {
    if (Object.keys(variablesByCategory).length > 0) {
      return Object.values(variablesByCategory)
        .flat()
        .map(variable => variable.variableName);
    }
    return variables;
  }, [variablesByCategory, variables]);

  const handleChange = (content: string, delta: any, source: any, editor: any) => {
    onChange(content);
  };

  const filteredVariables = getFilteredVariables();
  const categories = Object.keys(filteredVariables);
  const allVariableNames = getAllVariableNames();

  return (
    <div className="rich-text-editor-container">
      <div className="editor-toolbar">
        <button
          className="variables-button"
          onClick={() => setShowVariables(!showVariables)}
          title="Insert Variables"
        >
          📝 Variables ({allVariableNames.length})
        </button>
      </div>

      {showVariables && (
        <div className="variables-panel">
          <div className="variables-header">
            <h4>Available Variables ({allVariableNames.length})</h4>
            <button 
              className="close-variables"
              onClick={() => setShowVariables(false)}
            >
              ✕
            </button>
          </div>

          {/* Search and Filter */}
          <div className="variables-filters">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search variables..."
              className="variables-search"
            />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="variables-category-filter"
            >
              <option value="all">All Categories</option>
              {Object.keys(variablesByCategory).map(category => (
                <option key={category} value={category}>
                  {getCategoryIcon(category)} {category}
                </option>
              ))}
            </select>
          </div>

          {/* Variables List */}
          <div className="variables-content">
            {categories.length === 0 ? (
              <div className="no-variables">
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
                  <div key={category} className="variable-category">
                    <button
                      onClick={() => toggleCategory(category)}
                      className={`category-header ${isExpanded ? 'expanded' : ''}`}
                    >
                      <span className="category-icon">{getCategoryIcon(category)}</span>
                      <span className="category-name">{category}</span>
                      <span className="category-count">({categoryVariables.length})</span>
                      <span className={`expand-icon ${isExpanded ? 'expanded' : ''}`}>▼</span>
                    </button>

                    {isExpanded && (
                      <div className="category-variables">
                        {categoryVariables.map((variable) => (
                          <button
                            key={variable._id}
                            className="variable-item"
                            onClick={() => insertVariable(variable.variableName)}
                            title={`${variable.description} - Insert {{${variable.variableName}}}`}
                          >
                            <div className="variable-name">{`{{${variable.variableName}}}`}</div>
                            <div className="variable-description">{variable.description}</div>
                            {variable.exampleValue && (
                              <div className="variable-example">Example: {variable.exampleValue}</div>
                            )}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      <div className="quill-editor-wrapper">
        <ReactQuill
          ref={quillRef}
          theme="snow"
          value={value}
          onChange={handleChange}
          modules={modules}
          formats={formats}
          placeholder={placeholder}
          readOnly={readOnly}
        />
      </div>

      <div className="editor-footer">
        <div className="word-count">
          Words: {value.replace(/<[^>]*>/g, '').split(/\s+/).filter(word => word.length > 0).length}
        </div>
        <div className="character-count">
          Characters: {value.replace(/<[^>]*>/g, '').length}
        </div>
        <div className="variable-count">
          Variables: {(value.match(/\{\{[^}]+\}\}/g) || []).length}
        </div>
      </div>
    </div>
  );
};

export default RichTextEditor;
