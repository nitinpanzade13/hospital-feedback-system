import React, { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import axios from 'axios';
import DashboardSummary from '../components/DashboardSummary';
import EmotionHeatmap from '../components/EmotionHeatmap';
import DepartmentTrends from '../components/DepartmentTrends';
import RecentFeedback from '../components/RecentFeedback';
import TimeSeries from '../components/TimeSeries';
import ExportButton from '../components/ExportButton';
import FeedbackFormQR from '../components/FeedbackFormQR';
import DepartmentQuestionsManager from '../components/DepartmentQuestionsManager';
import '../styles/Dashboard.css';

const API_BASE_URL = '';

function Dashboard() {
  const { currentUser, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState(null);
  const [timeSeriesData, setTimeSeriesData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('connecting');
  const [retryCount, setRetryCount] = useState(0);
  const [dataEmpty, setDataEmpty] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchDashboardData = async () => {
    try {
      setConnectionStatus('connecting');
      const [summaryResponse, timeSeriesResponse] = await Promise.all([
        axios.get(`${API_BASE_URL}/api/dashboard/summary`, { timeout: 10000 }),
        axios.get(`${API_BASE_URL}/api/dashboard/time-series`, { timeout: 10000 })
      ]);

      setDashboardData(summaryResponse.data);
      setTimeSeriesData(timeSeriesResponse.data.time_series || []);
      setLastUpdate(new Date());
      setError(null);
      setConnectionStatus('connected');
      setRetryCount(0);

      if (!summaryResponse.data.overall_stats || summaryResponse.data.overall_stats.total_feedback === 0) {
        setDataEmpty(true);
      } else {
        setDataEmpty(false);
      }
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setConnectionStatus('error');

      if (err.code === 'ECONNABORTED') {
        setError('Request timeout - Backend server may be slow or unresponsive');
      } else if (err.response?.status === 503) {
        setError('Backend service temporarily unavailable');
      } else if (!err.response) {
        setError('Cannot connect to backend - Please check if the server is running');
      } else {
        setError(`Backend error: ${err.response?.status || 'Unknown error'}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="dashboard">
      <nav className="navbar">
        <div className="navbar-left">
          <h1>🏥 Hospital Feedback Dashboard</h1>
        </div>
        <div className="navbar-center">
          {lastUpdate && (
            <div className={`connection-status ${connectionStatus}`}>
              <span className={`status-dot ${connectionStatus}`}></span>
              Last updated: {lastUpdate.toLocaleTimeString()}
            </div>
          )}
        </div>
        <div className="navbar-right">
          <div className="user-info">
            <div className="user-details">
              <p className="user-name">{currentUser?.full_name}</p>
              <p className="user-email">{currentUser?.email}</p>
              <p className="user-role">{currentUser?.role.charAt(0).toUpperCase() + currentUser?.role.slice(1)}</p>
            </div>
            {currentUser?.role === 'superadmin' && (
              <button 
                className="admin-btn" 
                onClick={() => navigate('/admin')}
                title="Admin Management (Superadmin only)"
              >
                👥 Admin Management
              </button>
            )}
            <button onClick={handleLogout} className="logout-btn">
              Logout
            </button>
          </div>
        </div>
      </nav>

      {loading && !dashboardData ? (
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading dashboard...</p>
        </div>
      ) : error && !dashboardData ? (
        <div className="error-container">
          <p className="error-message">⚠️ {error}</p>
          <button onClick={fetchDashboardData} className="retry-btn">
            Retry
          </button>
        </div>
      ) : (
        <div className="dashboard-content">
          <div className="tabs-container">
            <button
              className={`tab ${activeTab === 'dashboard' ? 'active' : ''}`}
              onClick={() => setActiveTab('dashboard')}
            >
              📊 Dashboard
            </button>
            <button
              className={`tab ${activeTab === 'questions' ? 'active' : ''}`}
              onClick={() => setActiveTab('questions')}
            >
              ❓ Questions Manager
            </button>
          </div>

          {activeTab === 'dashboard' && (
            <>
              <div className="top-actions-bar">
                <FeedbackFormQR />
                <ExportButton data={dashboardData?.recent_feedback} />
              </div>
              <div className="dashboard-panels">
                {dataEmpty ? (
                  <div className="empty-state">
                    <p>📭 No feedback data available yet</p>
                    <p className="small-text">Feedback will appear here once patients start submitting responses</p>
                  </div>
                ) : (
                  <>
                    <DashboardSummary data={dashboardData?.overall_stats} />
                    <EmotionHeatmap data={dashboardData?.emotion_distribution} />
                    <DepartmentTrends data={dashboardData?.department_trends} />
                    <TimeSeries data={timeSeriesData} />
                    <RecentFeedback feedbacks={dashboardData?.recent_feedback} />
                  </>
                )}
              </div>
            </>
          )}

          {activeTab === 'questions' && (
            <div className="questions-panel">
              <DepartmentQuestionsManager />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default Dashboard;
