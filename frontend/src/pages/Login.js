import React, { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import '../styles/Login.css';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [forgotPasswordMode, setForgotPasswordMode] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetSent, setResetSent] = useState(false);
  const navigate = useNavigate();
  const { login, requestPasswordReset, currentUser } = useContext(AuthContext);

  useEffect(() => {
    if (currentUser) {
      navigate('/dashboard');
    }
  }, [currentUser, navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      if (err.response?.status === 403) {
        setError('Account is inactive or email not verified');
      } else {
        setError(err.response?.data?.detail || 'Invalid email or password');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await requestPasswordReset(resetEmail);
      setResetSent(true);
      setResetEmail('');
    } catch (err) {
      setError('Error sending reset email. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <h1>🏥 Hospital Admin Portal</h1>
        
        {!forgotPasswordMode ? (
          <>
            <h2>Admin Login</h2>
            
            <form onSubmit={handleLogin}>
              <div className="form-group">
                <label htmlFor="email">Email:</label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                  placeholder="admin@hospital.com"
                />
              </div>

              <div className="form-group">
                <label htmlFor="password">Password:</label>
                <div className="password-input-wrapper">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={loading}
                    placeholder="Enter password"
                  />
                  <button
                    type="button"
                    className="password-toggle-btn"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={loading}
                    title={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? '👁️' : '👁️‍🗨️'}
                  </button>
                </div>
              </div>

              {error && <div className="error-message">{error}</div>}

              <button type="submit" disabled={loading} className="login-btn">
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>

            <p className="forgot-password-text">
              Forgot your password?{' '}
              <button
                type="button"
                className="toggle-btn"
                onClick={() => {
                  setForgotPasswordMode(true);
                  setError('');
                }}
              >
                Reset it here
              </button>
            </p>

            <p className="info-text">
              Only authorized admins can access this portal. If you don't have an account, please contact your superadmin.
            </p>
          </>
        ) : (
          <>
            <h2>Reset Password</h2>
            
            {resetSent ? (
              <div className="reset-sent-message">
                <p>✓ Password reset link has been sent to your email!</p>
                <p className="small-text">Please check your email for the reset link. It expires in 1 hour.</p>
                <button
                  type="button"
                  className="back-btn"
                  onClick={() => {
                    setForgotPasswordMode(false);
                    setResetSent(false);
                  }}
                >
                  Back to Login
                </button>
              </div>
            ) : (
              <form onSubmit={handleForgotPassword}>
                <div className="form-group">
                  <label htmlFor="reset-email">Email:</label>
                  <input
                    type="email"
                    id="reset-email"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    required
                    disabled={loading}
                    placeholder="admin@hospital.com"
                  />
                </div>

                <p className="small-text">We'll send a password reset link to your email.</p>

                {error && <div className="error-message">{error}</div>}

                <button type="submit" disabled={loading} className="login-btn">
                  {loading ? 'Sending...' : 'Send Reset Link'}
                </button>

                <button
                  type="button"
                  className="back-btn"
                  onClick={() => {
                    setForgotPasswordMode(false);
                    setError('');
                  }}
                >
                  Back to Login
                </button>
              </form>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default Login;
