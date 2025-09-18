import React, { useState } from 'react';

interface RegisterProps {
  onSwitchToLogin: () => void;
  onRegisterSuccess: () => void;
}

const Register: React.FC<RegisterProps> = ({ onSwitchToLogin, onRegisterSuccess }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !phone || !password || !confirmPassword) {
      setError('Please fill in all fields.');
      return;
    }
    // Validar formato de teléfono (simple, internacional o nacional)
    if (!/^\+?\d{7,15}$/.test(phone.replace(/\s|-/g, ''))) {
      setError('Please enter a valid phone number.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    setError('');
    onRegisterSuccess();
  };

  return (
    <div className="auth-container">
      <h2>Register</h2>
      <form onSubmit={handleSubmit} className="auth-form">
        <label>Full Name
          <input type="text" value={name} onChange={e => setName(e.target.value)} required />
        </label>
        <label>Email
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} required />
        </label>
        <label>Phone Number
          <input 
            type="tel" 
            value={phone} 
            onChange={e => setPhone(e.target.value)} 
            required 
            placeholder="e.g. +1234567890"
            style={{
              padding: '12px',
              border: '2px solid #e0e0e0',
              borderRadius: '8px',
              fontSize: '1.09rem',
              marginTop: '2px',
              background: '#f7fafd',
              transition: 'border 0.2s'
            }}
            onFocus={e => e.currentTarget.style.border = '2px solid #d32f2f'}
            onBlur={e => e.currentTarget.style.border = '2px solid #e0e0e0'}
          />
        </label>
        <label>Password
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} required />
        </label>
        <label>Confirm Password
          <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required />
        </label>
        {error && <div className="auth-error">{error}</div>}
        <button type="submit">Register</button>
      </form>
      <div className="auth-switch">
        Already have an account?{' '}
        <button type="button" onClick={onSwitchToLogin} className="link-btn">Login</button>
      </div>
    </div>
  );
};

export default Register; 