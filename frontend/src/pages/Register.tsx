import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';

const Register: React.FC = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [formError, setFormError] = useState('');

  const { register, loading, error } = useAuth();
  const navigate = useNavigate();

  // Password validation requirements
  const passwordRequirements = {
    minLength: password.length >= 8,
    hasUppercase: /[A-Z]/.test(password),
    hasLowercase: /[a-z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    hasSpecial: /[^A-Za-z0-9]/.test(password),
  };

  const allRequirementsMet = Object.values(passwordRequirements).every(Boolean);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    // Basic validation
    if (!username || !email || !password || !confirmPassword || !displayName) {
      setFormError('Please fill in all fields');
      return;
    }

    if (!allRequirementsMet) {
      setFormError('Password does not meet all requirements');
      return;
    }

    if (password !== confirmPassword) {
      setFormError('Passwords do not match');
      return;
    }

    try {
      await register(username, email, password, displayName);
      navigate('/');
    } catch (err) {
      // Error is handled by the auth context
    }
  };

  return (
    <div className="register-container">
      <h2>Create an Account</h2>
      <form onSubmit={handleSubmit}>
        {(formError || error) && (
          <div className="error-message">
            {formError || error}
          </div>
        )}

        <div className="form-group">
          <label htmlFor="username">Username</label>
          <input
            type="text"
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            disabled={loading}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="email">Email</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="displayName">Display Name</label>
          <input
            type="text"
            id="displayName"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            disabled={loading}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="password">Password</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
            required
          />
          <div className="password-requirements">
            <div className={`requirement ${passwordRequirements.minLength ? 'met' : ''}`}>
              <span className="checkmark">{passwordRequirements.minLength ? '✓' : '○'}</span>
              At least 8 characters
            </div>
            <div className={`requirement ${passwordRequirements.hasUppercase ? 'met' : ''}`}>
              <span className="checkmark">{passwordRequirements.hasUppercase ? '✓' : '○'}</span>
              One uppercase letter
            </div>
            <div className={`requirement ${passwordRequirements.hasLowercase ? 'met' : ''}`}>
              <span className="checkmark">{passwordRequirements.hasLowercase ? '✓' : '○'}</span>
              One lowercase letter
            </div>
            <div className={`requirement ${passwordRequirements.hasNumber ? 'met' : ''}`}>
              <span className="checkmark">{passwordRequirements.hasNumber ? '✓' : '○'}</span>
              One number
            </div>
            <div className={`requirement ${passwordRequirements.hasSpecial ? 'met' : ''}`}>
              <span className="checkmark">{passwordRequirements.hasSpecial ? '✓' : '○'}</span>
              One special character
            </div>
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="confirmPassword">Confirm Password</label>
          <input
            type="password"
            id="confirmPassword"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            disabled={loading}
            required
          />
        </div>

        <button type="submit" disabled={loading || !allRequirementsMet}>
          {loading ? 'Creating Account...' : 'Register'}
        </button>
      </form>

      <p>
        Already have an account? <Link to="/login">Login</Link>
      </p>
    </div>
  );
}

export default Register;