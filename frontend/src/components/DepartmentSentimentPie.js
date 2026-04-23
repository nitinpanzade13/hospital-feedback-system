import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, Legend, Tooltip, ResponsiveContainer } from 'recharts';
import apiClient from '../config/api';
import '../styles/DepartmentSentimentPie.css';

const COLORS = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7DC6F'];

const DepartmentSentimentPie = () => {
  const [positiveData, setPositiveData] = useState([]);
  const [negativeData, setNegativeData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDept, setSelectedDept] = useState(null);
  const [sentimentType, setSentimentType] = useState('positive'); // 'positive' or 'negative'
  const [feedbacks, setFeedbacks] = useState([]);
  const [feedbacksLoading, setFeedbacksLoading] = useState(false);

  useEffect(() => {
    fetchDepartmentData();
  }, []);

  const fetchDepartmentData = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/api/dashboard/department-negative-issues');
      
      if (response.data.status === 'success' && response.data.departments) {
        const departments = response.data.departments;
        
        // Prepare positive feedback data
        const positiveChartData = departments
          .filter(dept => dept.positive_count > 0)
          .map(dept => ({
            name: dept.department_name,
            value: dept.positive_count
          }))
          .sort((a, b) => b.value - a.value);
        
        // Prepare negative feedback data
        const negativeChartData = departments
          .filter(dept => dept.negative_count > 0)
          .map(dept => ({
            name: dept.department_name,
            value: dept.negative_count
          }))
          .sort((a, b) => b.value - a.value);
        
        setPositiveData(positiveChartData);
        setNegativeData(negativeChartData);
        setError(null);
      }
    } catch (err) {
      console.error('Error fetching department sentiment data:', err);
      setError('Failed to load department sentiment data');
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartmentFeedbacks = async (departmentName, type) => {
    try {
      setFeedbacksLoading(true);
      const response = await apiClient.get('/api/feedback', {
        params: {
          department: departmentName,
          sentiment: type // 'positive' or 'negative'
        }
      });
      
      if (response.data.status === 'success') {
        setFeedbacks(response.data.feedback || []);
      }
    } catch (err) {
      console.error('Error fetching feedbacks:', err);
      setFeedbacks([]);
    } finally {
      setFeedbacksLoading(false);
    }
  };

  const handlePieClick = async (data, type) => {
    setSelectedDept(data.name);
    setSentimentType(type);
    await fetchDepartmentFeedbacks(data.name, type);
  };

  const closeModal = () => {
    setSelectedDept(null);
    setFeedbacks([]);
  };

  if (loading) {
    return <div className="department-sentiment-pie-container"><div className="loading">Loading department sentiment data...</div></div>;
  }

  if (error) {
    return <div className="department-sentiment-pie-container"><div className="error">{error}</div></div>;
  }

  return (
    <div className="department-sentiment-pie-container">
      <div className="pie-charts-wrapper">
        {/* Positive Feedback Pie Chart */}
        <div className="pie-chart-box">
          <h3 className="pie-chart-title">Positive Feedback by Department</h3>
          {positiveData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart onClick={(state) => {
                if (state && state.activeTooltipIndex !== undefined) {
                  handlePieClick(positiveData[state.activeTooltipIndex], 'positive');
                }
              }}>
                <Pie
                  data={positiveData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  onClick={(entry) => handlePieClick(entry, 'positive')}
                >
                  {positiveData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} style={{cursor: 'pointer'}} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value) => `${value} feedback`}
                  contentStyle={{ backgroundColor: '#f5f5f5', border: '1px solid #ccc' }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="no-data">No positive feedback available</div>
          )}
          <p className="chart-hint">Click on a slice to view feedbacks</p>
        </div>

        {/* Negative Feedback Pie Chart */}
        <div className="pie-chart-box">
          <h3 className="pie-chart-title">Negative Feedback by Department</h3>
          {negativeData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart onClick={(state) => {
                if (state && state.activeTooltipIndex !== undefined) {
                  handlePieClick(negativeData[state.activeTooltipIndex], 'negative');
                }
              }}>
                <Pie
                  data={negativeData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  onClick={(entry) => handlePieClick(entry, 'negative')}
                >
                  {negativeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} style={{cursor: 'pointer'}} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value) => `${value} feedback`}
                  contentStyle={{ backgroundColor: '#f5f5f5', border: '1px solid #ccc' }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="no-data">No negative feedback available</div>
          )}
          <p className="chart-hint">Click on a slice to view feedbacks</p>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="pie-summary-stats">
        <div className="stat-item">
          <span className="stat-label">Total Positive:</span>
          <span className="stat-value positive">{positiveData.reduce((sum, d) => sum + d.value, 0)}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Total Negative:</span>
          <span className="stat-value negative">{negativeData.reduce((sum, d) => sum + d.value, 0)}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Departments:</span>
          <span className="stat-value">{Math.max(positiveData.length, negativeData.length)}</span>
        </div>
      </div>

      {/* Modal for Feedbacks */}
      {selectedDept && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{selectedDept} - {sentimentType === 'positive' ? '😊 Positive' : '😞 Negative'} Feedbacks</h3>
              <button className="close-btn" onClick={closeModal}>✕</button>
            </div>
            
            <div className="modal-body">
              {feedbacksLoading ? (
                <div className="modal-loading">Loading feedbacks...</div>
              ) : feedbacks.length > 0 ? (
                <div className="feedbacks-list">
                  {feedbacks.map((feedback, index) => (
                    <div key={index} className="feedback-item">
                      <div className="feedback-header">
                        <span className="feedback-patient">{feedback.patient_name}</span>
                        <span className={`feedback-emotion ${feedback.emotion}`}>{feedback.emotion}</span>
                      </div>
                      <p className="feedback-text">{feedback.feedback_text}</p>
                      <div className="feedback-meta">
                        <span className="meta-item">📅 {new Date(feedback.timestamp).toLocaleDateString()}</span>
                        <span className="meta-item">⭐ Rating: {feedback.rating || 'N/A'}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="no-feedbacks">No feedbacks found for {selectedDept}</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DepartmentSentimentPie;
