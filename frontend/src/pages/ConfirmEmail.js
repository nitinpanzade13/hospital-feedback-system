import React, { useState, useContext } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import '../styles/Login.css';

function ConfirmEmail() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { confirmEmail } = useContext(AuthContext);

  const token = searchParams.get('token');

  const handleConfirmEmail = async (e) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    setLoading(true);

    try {
      await confirmEmail(token, password);
      setSuccess(true);
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);
    } catch (err) {
      if (err.response?.status === 400) {
        setError('Invalid or expired verification link. Please contact your superadmin.');
      } else {
        setError(err.response?.data?.detail || 'Error verifying email');
      }
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="login-container">
        <div className="login-box">
          <h1>🏥 Hospital Admin Portal</h1>
          <div className="error-message">Invalid verification link</div>
          <p className="info-text">Please check your email for the correct verification link.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="login-container">
      <div className="login-box">
        <h1>🏥 Hospital Admin Portal</h1>
        <h2>Set Your Password</h2>

        {success ? (
          <div className="success-message">
            <p>✓ Email verified successfully!</p>
            <p>Redirecting to dashboard...</p>
          </div>
        ) : (
          <form onSubmit={handleConfirmEmail}>
            <p className="form-description">
              Welcome! Please set your password to complete your account setup.
            </p>

            <div className="form-group">
              <label htmlFor="password">Password:</label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
                placeholder="Enter at least 8 characters"
              />
              <span className="helper-text">At least 8 characters</span>
            </div>

            <div className="form-group">
              <label htmlFor="confirm-password">Confirm Password:</label>
              <input
                type="password"
                id="confirm-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                disabled={loading}
                placeholder="Confirm your password"
              />
            </div>

            {error && <div className="error-message">{error}</div>}

            <button type="submit" disabled={loading} className="login-btn">
              {loading ? 'Setting up...' : 'Complete Setup'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default ConfirmEmail;
