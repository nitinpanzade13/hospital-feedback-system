import React, { useState, useEffect } from 'react';
import apiClient from '../config/api';
import '../styles/DepartmentNegativePoints.css';

/**
 * DepartmentNegativePoints Component
 * Displays a detailed breakdown of negative feedback points by department
 */
function DepartmentNegativePoints() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sortBy, setSortBy] = useState('negative_count'); // 'negative_count' or 'percentage'

  useEffect(() => {
    fetchNegativeData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // Re-sort data when sortBy changes
    if (data.length > 0) {
      const sortedData = [...data].sort((a, b) => {
        if (sortBy === 'negative_count') {
          return b.negative_count - a.negative_count;
        } else {
          return b.negative_percentage - a.negative_percentage;
        }
      });
      setData(sortedData);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sortBy]);

  const fetchNegativeData = async () => {
    try {
      const response = await apiClient.get('/api/dashboard/department-negative-issues');
      
      // Transform and sort data
      let departmentData = response.data.departments || [];
      
      // Sort by selected criteria
      departmentData.sort((a, b) => {
        if (sortBy === 'negative_count') {
          return b.negative_count - a.negative_count;
        } else {
          return b.negative_percentage - a.negative_percentage;
        }
      });

      setData(departmentData);
      setError(null);
    } catch (err) {
      console.error('Error fetching negative points data:', err);
      setError('Failed to load department negative issues');
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="negative-points-container loading">Loading...</div>;
  if (error) return <div className="negative-points-container error">⚠️ {error}</div>;

  if (data.length === 0) {
    return (
      <div className="negative-points-container">
        <h3>🚨 Department Negative Issues</h3>
        <p className="no-data">No negative feedback data available</p>
      </div>
    );
  }

  return (
    <div className="negative-points-container">
      <div className="section-header">
        <h3>🚨 Department Negative Issues</h3>
        <div className="sort-controls">
          <label>Sort by:</label>
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
            <option value="negative_count">Count (High to Low)</option>
            <option value="percentage">Percentage (High to Low)</option>
          </select>
        </div>
      </div>

      <div className="negative-issues-list">
        {data.map((dept, index) => (
          <div key={index} className="department-issue-card">
            <div className="card-header">
              <h4>{dept.department_name}</h4>
              <div className="issue-badges">
                <span className="badge count-badge">
                  {dept.negative_count} negative
                </span>
                <span className="badge percentage-badge">
                  {dept.negative_percentage?.toFixed(1) || 0}%
                </span>
              </div>
            </div>

            <div className="issue-details">
              <div className="detail-item">
                <span className="label">Total Feedback:</span>
                <span className="value">{dept.total_feedback || 0}</span>
              </div>
              <div className="detail-item">
                <span className="label">Positive:</span>
                <span className="value positive">{dept.positive_count || 0}</span>
              </div>
              <div className="detail-item">
                <span className="label">Neutral:</span>
                <span className="value neutral">{dept.neutral_count || 0}</span>
              </div>
            </div>

            {dept.common_issues && dept.common_issues.length > 0 && (
              <div className="common-issues">
                <p className="issues-title">Common Issues:</p>
                <ul className="issues-list">
                  {dept.common_issues.map((issue, i) => (
                    <li key={i}>
                      <span className="issue-text">{issue.issue}</span>
                      <span className="issue-count">({issue.count})</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="progress-bar">
              <div 
                className="progress-fill negative" 
                style={{ width: `${dept.negative_percentage || 0}%` }}
              ></div>
            </div>
          </div>
        ))}
      </div>

      {/* Summary Statistics */}
      <div className="summary-stats">
        <h4>Summary</h4>
        <div className="stats-grid">
          <div className="stat-box">
            <span className="stat-title">Total Departments</span>
            <span className="stat-value">{data.length}</span>
          </div>
          <div className="stat-box">
            <span className="stat-title">Most Issues</span>
            <span className="stat-value">
              {data[0]?.department_name} ({data[0]?.negative_count})
            </span>
          </div>
          <div className="stat-box">
            <span className="stat-title">Average Negative %</span>
            <span className="stat-value">
              {(data.reduce((sum, d) => sum + (d.negative_percentage || 0), 0) / data.length).toFixed(1)}%
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DepartmentNegativePoints;
