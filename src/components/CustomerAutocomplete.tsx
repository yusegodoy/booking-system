import React, { useState, useEffect, useRef } from 'react';
import './CustomerAutocomplete.css';

interface Customer {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}

interface CustomerAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onCustomerSelect: (customer: Customer) => void;
  placeholder: string;
  fieldType: 'firstName' | 'lastName' | 'email' | 'phone';
  className?: string;
  isEditing?: boolean; // New prop to indicate if we're editing an existing booking
}

const CustomerAutocomplete: React.FC<CustomerAutocompleteProps> = ({
  value,
  onChange,
  onCustomerSelect,
  placeholder,
  fieldType,
  className = '',
  isEditing = false
}) => {
  const [suggestions, setSuggestions] = useState<Customer[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Debounce search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (value.length >= 1 && !isEditing) {
        searchCustomers(value);
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [value, isEditing]);

  // Hide suggestions when value exactly matches a selected customer
  useEffect(() => {
    const exactMatch = suggestions.find(customer => {
      switch (fieldType) {
        case 'firstName':
          return customer.firstName.toLowerCase() === value.toLowerCase();
        case 'lastName':
          return customer.lastName.toLowerCase() === value.toLowerCase();
        case 'email':
          return customer.email.toLowerCase() === value.toLowerCase();
        case 'phone':
          return customer.phone === value;
        default:
          return false;
      }
    });

    if (exactMatch) {
      setShowSuggestions(false);
    }
  }, [value, suggestions, fieldType]);

  const searchCustomers = async (query: string) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('adminToken') || localStorage.getItem('token');
      
      const response = await fetch(`/api/customers/search/autocomplete?query=${encodeURIComponent(query)}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setSuggestions(data.customers || []);
        setShowSuggestions(data.customers && data.customers.length > 0);
        setSelectedIndex(-1);
      }
    } catch (error) {
      console.error('Error searching customers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
    setShowSuggestions(true);
  };

  const handleSuggestionClick = (customer: Customer) => {
    onCustomerSelect(customer);
    setShowSuggestions(false);
    setSuggestions([]);
    setSelectedIndex(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && suggestions[selectedIndex]) {
          handleSuggestionClick(suggestions[selectedIndex]);
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        setSelectedIndex(-1);
        break;
    }
  };

  const handleFocus = () => {
    if (suggestions.length > 0) {
      setShowSuggestions(true);
    }
  };

  const handleBlur = () => {
    // Delay hiding suggestions to allow for clicks
    setTimeout(() => {
      setShowSuggestions(false);
      setSelectedIndex(-1);
    }, 200);
  };

  const getDisplayText = (customer: Customer) => {
    switch (fieldType) {
      case 'firstName':
        return `${customer.firstName} ${customer.lastName}`;
      case 'lastName':
        return `${customer.firstName} ${customer.lastName}`;
      case 'email':
        return `${customer.firstName} ${customer.lastName} (${customer.email})`;
      case 'phone':
        return `${customer.firstName} ${customer.lastName} (${customer.phone})`;
      default:
        return `${customer.firstName} ${customer.lastName}`;
    }
  };

  const highlightMatch = (text: string, query: string) => {
    if (!query) return text;
    
    const regex = new RegExp(`(${query})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, index) => 
      regex.test(part) ? (
        <span key={index} className="highlight">{part}</span>
      ) : (
        part
      )
    );
  };

  return (
    <div className="customer-autocomplete">
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        onFocus={handleFocus}
        onBlur={handleBlur}
        placeholder={placeholder}
        className={`autocomplete-input ${className}`}
        autoComplete="off"
      />
      
      {loading && (
        <div className="autocomplete-loading">
          <div className="loading-spinner"></div>
          <span>Searching...</span>
        </div>
      )}
      
      {showSuggestions && suggestions.length > 0 && (
        <div ref={suggestionsRef} className="autocomplete-suggestions">
          {suggestions.map((customer, index) => (
            <div
              key={customer._id}
              className={`suggestion-item ${index === selectedIndex ? 'selected' : ''}`}
              onClick={() => handleSuggestionClick(customer)}
            >
              <div className="suggestion-main">
                {highlightMatch(getDisplayText(customer), value)}
              </div>
              <div className="suggestion-details">
                <span className="suggestion-email">{customer.email}</span>
                <span className="suggestion-phone">{customer.phone}</span>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {showSuggestions && suggestions.length === 0 && value.length >= 1 && !loading && (
        <div className="autocomplete-no-results">
          No customers found
        </div>
      )}
    </div>
  );
};

export default CustomerAutocomplete;
