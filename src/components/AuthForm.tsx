import React, { useState } from 'react';

interface AuthFormProps {
  onLogin: (email: string, password: string) => void;
  onRegister: (firstName: string, lastName: string, email: string, password: string, phone: string) => void;
  onBack: () => void;
}

const AuthForm: React.FC<AuthFormProps> = ({ onLogin, onRegister, onBack }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: ''
  });
  const [errors, setErrors] = useState<{[key: string]: string}>({});

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};

    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (!isLogin) {
      if (!formData.firstName) {
        newErrors.firstName = 'First name is required';
      }
      if (!formData.lastName) {
        newErrors.lastName = 'Last name is required';
      }
      // Validar teléfono
      if (!formData.phone) {
        newErrors.phone = 'Phone number is required';
      } else if (!/^\+?\d{7,15}$/.test(formData.phone.replace(/\s|-/g, ''))) {
        newErrors.phone = 'Enter a valid phone number';
      }
      if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      if (isLogin) {
        onLogin(formData.email, formData.password);
      } else {
        onRegister(formData.firstName, formData.lastName, formData.email, formData.password, formData.phone);
      }
    }
  };

  return (
    <div style={{ 
      background: '#fff', 
      borderRadius: '12px', 
      padding: '32px', 
      boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
      maxWidth: '500px',
      margin: '0 auto'
    }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <button
          onClick={onBack}
          style={{
            position: 'absolute',
            left: '20px',
            top: '20px',
            background: 'none',
            border: 'none',
            fontSize: '1.5rem',
            cursor: 'pointer',
            color: '#666'
          }}
        >
          ←
        </button>
        <h2 style={{ 
          color: '#333', 
          fontSize: '1.8rem', 
          fontWeight: '700',
          marginBottom: '8px'
        }}>
          {isLogin ? 'Sign In' : 'Create Account'}
        </h2>
        <p style={{ color: '#666', fontSize: '1rem' }}>
          {isLogin ? 'Welcome back! Sign in to your account.' : 'Create a new account to save your information.'}
        </p>
      </div>

      {/* Toggle between login and register */}
      <div style={{ 
        display: 'flex', 
        background: '#f5f5f5', 
        borderRadius: '8px', 
        padding: '4px',
        marginBottom: '24px'
      }}>
        <button
          onClick={() => setIsLogin(true)}
          style={{
            flex: 1,
            padding: '12px',
            border: 'none',
            borderRadius: '6px',
            background: isLogin ? '#d32f2f' : 'transparent',
            color: isLogin ? '#fff' : '#666',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
        >
          Sign In
        </button>
        <button
          onClick={() => setIsLogin(false)}
          style={{
            flex: 1,
            padding: '12px',
            border: 'none',
            borderRadius: '6px',
            background: !isLogin ? '#d32f2f' : 'transparent',
            color: !isLogin ? '#fff' : '#666',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
        >
          Create Account
        </button>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit}>
        {!isLogin && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', color: '#333' }}>
                First Name *
              </label>
              <input
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleInputChange}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: `1px solid ${errors.firstName ? '#d32f2f' : '#ddd'}`,
                  borderRadius: '8px',
                  fontSize: '14px',
                  boxSizing: 'border-box'
                }}
                placeholder="Enter first name"
              />
              {errors.firstName && (
                <div style={{ color: '#d32f2f', fontSize: '0.8rem', marginTop: '4px' }}>
                  {errors.firstName}
                </div>
              )}
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', color: '#333' }}>
                Last Name *
              </label>
              <input
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleInputChange}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: `1px solid ${errors.lastName ? '#d32f2f' : '#ddd'}`,
                  borderRadius: '8px',
                  fontSize: '14px',
                  boxSizing: 'border-box'
                }}
                placeholder="Enter last name"
              />
              {errors.lastName && (
                <div style={{ color: '#d32f2f', fontSize: '0.8rem', marginTop: '4px' }}>
                  {errors.lastName}
                </div>
              )}
            </div>
          </div>
        )}
        {/* Campo de teléfono solo en registro */}
        {!isLogin && (
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', color: '#333' }}>
              Phone Number *
            </label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleInputChange}
              style={{
                width: '100%',
                padding: '12px',
                border: `1px solid ${errors.phone ? '#d32f2f' : '#ddd'}`,
                borderRadius: '8px',
                fontSize: '14px',
                boxSizing: 'border-box'
              }}
              placeholder="Enter phone number"
            />
            {errors.phone && (
              <div style={{ color: '#d32f2f', fontSize: '0.8rem', marginTop: '4px' }}>
                {errors.phone}
              </div>
            )}
          </div>
        )}

        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', color: '#333' }}>
            Email Address *
          </label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleInputChange}
            style={{
              width: '100%',
              padding: '12px',
              border: `1px solid ${errors.email ? '#d32f2f' : '#ddd'}`,
              borderRadius: '8px',
              fontSize: '14px',
              boxSizing: 'border-box'
            }}
            placeholder="Enter email address"
          />
          {errors.email && (
            <div style={{ color: '#d32f2f', fontSize: '0.8rem', marginTop: '4px' }}>
              {errors.email}
            </div>
          )}
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', color: '#333' }}>
            Password *
          </label>
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleInputChange}
            style={{
              width: '100%',
              padding: '12px',
              border: `1px solid ${errors.password ? '#d32f2f' : '#ddd'}`,
              borderRadius: '8px',
              fontSize: '14px',
              boxSizing: 'border-box'
            }}
            placeholder="Enter password"
          />
          {errors.password && (
            <div style={{ color: '#d32f2f', fontSize: '0.8rem', marginTop: '4px' }}>
              {errors.password}
            </div>
          )}
        </div>

        {!isLogin && (
          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', color: '#333' }}>
              Confirm Password *
            </label>
            <input
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleInputChange}
              style={{
                width: '100%',
                padding: '12px',
                border: `1px solid ${errors.confirmPassword ? '#d32f2f' : '#ddd'}`,
                borderRadius: '8px',
                fontSize: '14px',
                boxSizing: 'border-box'
              }}
              placeholder="Confirm password"
            />
            {errors.confirmPassword && (
              <div style={{ color: '#d32f2f', fontSize: '0.8rem', marginTop: '4px' }}>
                {errors.confirmPassword}
              </div>
            )}
          </div>
        )}

        <button
          type="submit"
          style={{
            width: '100%',
            padding: '14px',
            background: '#d32f2f',
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            fontSize: '1rem',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#b71c1c';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = '#d32f2f';
          }}
        >
          {isLogin ? 'Sign In' : 'Create Account'}
        </button>
      </form>

      {/* Demo credentials for testing */}
      {isLogin && (
        <div style={{ 
          marginTop: '24px', 
          padding: '16px', 
          background: '#f8f9fa', 
          borderRadius: '8px',
          border: '1px solid #e9ecef'
        }}>
          <h4 style={{ marginBottom: '8px', color: '#333', fontSize: '0.9rem', fontWeight: '600' }}>
            Demo Credentials (for testing):
          </h4>
          <div style={{ fontSize: '0.85rem', color: '#666', lineHeight: '1.4' }}>
            <div><strong>Email:</strong> demo@example.com</div>
            <div><strong>Password:</strong> demo123</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AuthForm; 