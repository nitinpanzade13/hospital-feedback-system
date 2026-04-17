import React from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

function TimeSeries({ data }) {
  if (!data || data.length === 0) {
    return <p>No time series data available yet.</p>;
  }

  // Format data for chart
  const formattedData = data.map(item => ({
    date: `${item._id.day}/${item._id.month}`,
    feedbackCount: item.count,
    avgRating: item.avg_rating ? parseFloat(item.avg_rating.toFixed(2)) : 0
  }));

  return (
    <div>
      <h3>Feedback Volume & Ratings Over Time</h3>
      <ResponsiveContainer width="100%" height={400}>
        <BarChart data={formattedData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
          <XAxis dataKey="date" />
          <YAxis yAxisId="left" />
          <YAxis yAxisId="right" orientation="right" />
          <Tooltip />
          <Legend />
          <Bar
            yAxisId="left"
            dataKey="feedbackCount"
            fill="#667eea"
            name="Feedback Count"
          />
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="avgRating"
            stroke="#ff7300"
            name="Avg Rating"
          />
        </BarChart>
      </ResponsiveContainer>

      <h3 style={{ marginTop: '3rem' }}>Average Rating Trend</h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={formattedData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
          <XAxis dataKey="date" />
          <YAxis domain={[0, 5]} />
          <Tooltip />
          <Legend />
          <Line
            type="monotone"
            dataKey="avgRating"
            stroke="#667eea"
            dot={{ fill: '#667eea', r: 4 }}
            activeDot={{ r: 6 }}
            name="Average Rating"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export default TimeSeries;
