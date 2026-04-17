import React from 'react';

function DashboardSummary({ data }) {
  return (
    <div className="summary-cards">
      <div className="stat-card">
        <h3>Total Feedback</h3>
        <div className="value">{data.total_feedback || 0}</div>
      </div>

      <div className="stat-card">
        <h3>Processed</h3>
        <div className="value">{data.processed || 0}</div>
      </div>

      <div className="stat-card">
        <h3>Pending</h3>
        <div className="value">{data.pending || 0}</div>
      </div>

      <div className="stat-card">
        <h3>Processing Rate</h3>
        <div className="value">
          {data.total_feedback > 0 
            ? ((data.processed / data.total_feedback) * 100).toFixed(1) 
            : 0}%
        </div>
      </div>
    </div>
  );
}

export default DashboardSummary;
