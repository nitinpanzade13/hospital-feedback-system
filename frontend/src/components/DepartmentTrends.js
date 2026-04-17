import React from 'react';

function DepartmentTrends({ data }) {
  if (!data || data.length === 0) {
    return <p>No department data available yet.</p>;
  }

  return (
    <div className="department-list">
      {data.map((dept, index) => (
        <div key={index} className="department-item">
          <div className="dept-name">{dept._id || 'Unknown'}</div>
          <div className="dept-stats">
            <span>📊 Feedback: <strong>{dept.count}</strong></span>
            <span>⭐ Avg Rating: <strong>{dept.avg_rating?.toFixed(1)}</strong>/5</span>
            <span>
              😊 Top Emotion: <strong>
                {dept.emotions && dept.emotions.length > 0
                  ? getMostCommon(dept.emotions)
                  : 'N/A'}
              </strong>
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

function getMostCommon(arr) {
  const frequency = {};
  for (const item of arr) {
    frequency[item] = (frequency[item] || 0) + 1;
  }
  return Object.keys(frequency).reduce((a, b) =>
    frequency[a] > frequency[b] ? a : b
  );
}

export default DepartmentTrends;
