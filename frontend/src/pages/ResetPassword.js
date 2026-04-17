import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import apiClient from '../config/api';
import '../styles/Login.css';

function ResetPassword() {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const token = searchParams.get('token');

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    setLoading(true);

    try {
      await apiClient.post('/api/auth/reset-password', {
        token,
        new_password: newPassword,
      });
      setSuccess(true);
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err) {
      if (err.response?.status === 400) {
        setError('Invalid or expired reset link. Please request a new one.');
      } else {
        setError(err.response?.data?.detail || 'Error resetting password');
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
          <div className="error-message">Invalid reset link</div>
          <p className="info-text">Please check your email for the correct reset link.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="login-container">
      <div className="login-box">
        <h1>🏥 Hospital Admin Portal</h1>
        <h2>Reset Password</h2>

        {success ? (
          <div className="success-message">
            <p>✓ Password reset successfully!</p>
            <p>Redirecting to login...</p>
          </div>
        ) : (
          <form onSubmit={handleResetPassword}>
            <p className="form-description">
              Enter your new password below. Make sure it's secure and different from your old password.
            </p>

            <div className="form-group">
              <label htmlFor="new-password">New Password:</label>
              <input
                type="password"
                id="new-password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                disabled={loading}
                placeholder="Enter at least 8 characters"
              />
              <span className="helper-text">At least 8 characters, mix of upper and lowercase recommended</span>
            </div>

            <div className="form-group">
              <label htmlFor="confirm-password">Confirm New Password:</label>
              <input
                type="password"
                id="confirm-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                disabled={loading}
                placeholder="Confirm your new password"
              />
            </div>

            {error && <div className="error-message">{error}</div>}

            <button type="submit" disabled={loading} className="login-btn">
              {loading ? 'Resetting...' : 'Reset Password'}
            </button>

            <p className="forgot-password-text">
              Remember your password?{' '}
              <button
                type="button"
                className="toggle-btn"
                onClick={() => navigate('/login')}
              >
                Go to login
              </button>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}

export default ResetPassword;
