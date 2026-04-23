import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, Legend, Tooltip, ResponsiveContainer } from 'recharts';
import apiClient from '../config/api';
import '../styles/SentimentPieChart.css';

/**
 * SentimentPieChart Component
 * Displays pie chart showing distribution of positive and negative feedbacks
 */
function SentimentPieChart() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchSentimentData();
  }, []);

  const fetchSentimentData = async () => {
    try {
      const response = await apiClient.get('/api/dashboard/sentiment-distribution');
      
      // Transform data for pie chart
      const chartData = [
        { name: 'Positive', value: response.data.positive_count || 0, fill: '#4CAF50' },
        { name: 'Negative', value: response.data.negative_count || 0, fill: '#f44336' },
        { name: 'Neutral', value: response.data.neutral_count || 0, fill: '#FFC107' }
      ].filter(item => item.value > 0);

      setData(chartData);
      setError(null);
    } catch (err) {
      console.error('Error fetching sentiment data:', err);
      setError('Failed to load sentiment distribution');
      // Set dummy data as fallback
      setData([
        { name: 'Positive', value: 0, fill: '#4CAF50' },
        { name: 'Negative', value: 0, fill: '#f44336' },
        { name: 'Neutral', value: 0, fill: '#FFC107' }
      ]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="sentiment-pie-chart loading">Loading...</div>;
  if (error) return <div className="sentiment-pie-chart error">⚠️ {error}</div>;

  const total = data.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="sentiment-pie-chart-container">
      <h3>📊 Sentiment Distribution</h3>
      {total > 0 ? (
        <div className="pie-chart-wrapper">
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => `${value} feedbacks`} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
          <div className="sentiment-stats">
            {data.map((item, index) => (
              <div key={index} className="stat-item">
                <div className="stat-color" style={{ backgroundColor: item.fill }}></div>
                <div className="stat-content">
                  <span className="stat-name">{item.name}</span>
                  <span className="stat-value">{item.value}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <p className="no-data">No sentiment data available</p>
      )}
    </div>
  );
}

export default SentimentPieChart;
