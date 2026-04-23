import React, { useState, useEffect, useCallback } from 'react';
import apiClient from '../config/api';
import { t, LANGUAGE_NAMES } from '../translations';
import { redirectToForm, validateConfiguration } from '../config/FORM_REDIRECT_CONFIG';

function FeedbackFormQR() {
  const [departments, setDepartments] = useState([]);
  const [selectedDept, setSelectedDept] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('english');
  const [qrCode, setQrCode] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [configValid, setConfigValid] = useState(true);

  const fetchDepartments = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.get(`/api/departments`, { timeout: 5000 });
      
      if (!response.data || !response.data.departments) {
        throw new Error('Invalid response format');
      }
      
      const depts = response.data.departments;
      setDepartments(depts);
      
      if (depts.length > 0) {
        setSelectedDept(depts[0].name);
      } else {
        setError(t('Could not load departments', 'english'));
      }
    } catch (err) {
      console.error('Error fetching departments:', err);
      setError(`${t('Could not load departments', 'english')}: ${err.message}`);
      setDepartments([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Check if form configuration is valid on component mount
    const isValid = validateConfiguration();
    setConfigValid(isValid);
    if (!isValid) {
      console.warn('⚠️ Form configuration incomplete. Please update FORM_REDIRECT_CONFIG.js with all form URLs.');
    }
    
    fetchDepartments();
  }, [fetchDepartments]);

  const handleOpenForm = () => {
    try {
      if (!selectedDept) {
        alert('Please select a department first');
        return;
      }

      if (!configValid) {
        alert('⚠️ Form URLs not configured. Please contact administrator.');
        return;
      }
      
      console.log('🔄 Redirecting to form for:', selectedDept);
      
      // This will redirect to the department-specific form
      // The form will have all questions pre-loaded for that department
      redirectToForm(selectedDept);
      
    } catch (error) {
      console.error('Error opening form:', error);
      alert('Error opening form. Please check console.');
    }
  };

  const handleGenerateQRCode = async () => {
    try {
      if (!selectedDept) {
        alert('Please select a department first');
        return;
      }

      setLoading(true);
      
      // Import the config to get the form URL
      const { DEPARTMENT_FORM_URLS } = await import('../config/FORM_REDIRECT_CONFIG');
      const formUrl = DEPARTMENT_FORM_URLS[selectedDept];
      
      if (!formUrl || formUrl.includes('REPLACE')) {
        alert(`Form URL not configured for ${selectedDept}. Please update FORM_REDIRECT_CONFIG.js`);
        setLoading(false);
        return;
      }
      
      // Generate QR code for the department form URL
      // Using a public QR code generator API
      const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(formUrl)}`;
      
      setQrCode(qrUrl);
      console.log('✅ QR Code generated for:', selectedDept);
      
    } catch (error) {
      console.error('Error generating QR code:', error);
      setError('Could not generate QR code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (loading && departments.length === 0) {
    return (
      <div className="feedback-qr-container">
        <div className="loading-spinner">
          <p>Loading departments...</p>
        </div>
      </div>
    );
  }

  if (error && departments.length === 0) {
    return (
      <div className="feedback-qr-container">
        <div className="error-message">
          <p>❌ {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="feedback-qr-container">
      <div className="form-header">
        <h2>📋 Feedback Form</h2>
        <p>Select your department and provide feedback</p>
      </div>
      
      {!configValid && (
        <div className="warning-box">
          <p>⚠️ <strong>Configuration Warning:</strong> Not all form URLs are configured. Please update FORM_REDIRECT_CONFIG.js</p>
        </div>
      )}

      <div className="dept-selector">
        <label htmlFor="dept-select">📌 Select Department:</label>
        <select 
          id="dept-select"
          value={selectedDept} 
          onChange={(e) => {
            setSelectedDept(e.target.value);
            setQrCode(null); // Clear QR code when department changes
          }}
          className="dept-dropdown"
          disabled={loading}
        >
          <option value="">-- Select a department --</option>
          {departments.map(dept => (
            <option key={dept._id || dept.name} value={dept.name}>
              {dept.name}
            </option>
          ))}
        </select>
      </div>

      <div className="language-selector">
        <label>🌐 Select Language:</label>
        <div className="language-buttons">
          {Object.entries(LANGUAGE_NAMES).map(([langCode, langName]) => (
            <button
              key={langCode}
              onClick={() => {
                setSelectedLanguage(langCode);
                setQrCode(null); // Clear QR code when language changes
              }}
              className={`lang-btn ${selectedLanguage === langCode ? 'active' : ''}`}
              disabled={loading}
            >
              {langName}
            </button>
          ))}
        </div>
      </div>

      <div className="form-actions">
        <button 
          onClick={handleOpenForm} 
          className="btn-primary"
          disabled={!selectedDept || loading || !configValid}
          title={!configValid ? 'Form URLs not configured' : ''}
        >
          ✍️ Open Feedback Form
        </button>
        
        <button 
          onClick={handleGenerateQRCode}
          className="btn-secondary"
          disabled={!selectedDept || loading || !configValid}
          title={!configValid ? 'Form URLs not configured' : ''}
        >
          📱 Generate QR Code
        </button>
      </div>

      {qrCode && (
        <div className="qr-display">
          <h3>📱 Scan QR Code</h3>
          <img 
            src={qrCode} 
            alt="Department Feedback Form QR Code" 
            className="qr-image"
            loading="lazy"
          />
          <p className="qr-hint">
            Scan with your phone camera to access the {selectedDept} feedback form
          </p>
          <a 
            href={qrCode} 
            download={`feedback-${selectedDept.replace(/\s+/g, '-')}-qr.png`}
            className="qr-download-link"
          >
            💾 Download QR Code
          </a>
        </div>
      )}

      <div className="info-box">
        <h4>ℹ️ How It Works</h4>
        <ul>
          <li>✅ <strong>Select</strong> your department from the dropdown</li>
          <li>✅ <strong>Click</strong> "Open Feedback Form"</li>
          <li>✅ You'll be <strong>redirected</strong> to the department form</li>
          <li>✅ <strong>Fill in</strong> your feedback (all relevant questions included)</li>
          <li>✅ <strong>Submit</strong> automatically</li>
          <li>✅ View results on <strong>dashboard immediately</strong></li>
        </ul>
      </div>

      <div className="features-box">
        <h4>🎯 Key Features</h4>
        <ul>
          <li>🚀 <strong>No Refresh Required:</strong> Each department has its own form</li>
          <li>⚡ <strong>Instant Load:</strong> Forms have pre-loaded questions for your department</li>
          <li>📱 <strong>Mobile Friendly:</strong> Scan QR code on any mobile device</li>
          <li>🔒 <strong>Department-Specific:</strong> Only relevant questions for your area</li>
          <li>📊 <strong>Live Dashboard:</strong> See results immediately after submission</li>
        </ul>
      </div>
    </div>
  );
}

export default FeedbackFormQR;
