import React from 'react';

const emotionColors = {
  joy: '#FFD700',
  happiness: '#FFD700',
  satisfaction: '#90EE90',
  neutral: '#87CEEB',
  dissatisfaction: '#FFA500',
  anger: '#FF6347',
  frustration: '#FF6347',
  sadness: '#B0C4DE',
  fear: '#9932CC',
  trust: '#20B2AA',
  surprise: '#FF69B4',
  anticipation: '#00CED1'
};

function EmotionHeatmap({ data }) {
  console.log('EmotionHeatmap received data:', data); // Debug log
  
  if (!data) {
    return <p>No emotion data available yet (data is null).</p>;
  }
  
  if (!Array.isArray(data)) {
    console.error('EmotionHeatmap: data is not an array:', typeof data);
    return <p>Emotion data format error - expected array.</p>;
  }
  
  if (data.length === 0) {
    return <p>No emotion data available yet (empty array).</p>;
  }

  const getEmotionColor = (emotion) => {
    return emotionColors[emotion?.toLowerCase()] || '#667eea';
  };

  const getEmotionEmoji = (emotion) => {
    const emojiMap = {
      joy: '😊',
      happiness: '😄',
      satisfaction: '👍',
      neutral: '😐',
      dissatisfaction: '😕',
      anger: '😠',
      frustration: '😤',
      sadness: '😢',
      fear: '😨',
      trust: '🤝',
      surprise: '😲',
      anticipation: '🤔'
    };
    return emojiMap[emotion?.toLowerCase()] || '💭';
  };

  return (
    <div className="emotion-heatmap">
      {data.map((item, index) => (
        <div
          key={index}
          className="emotion-item"
          style={{ backgroundColor: getEmotionColor(item._id) }}
        >
          <div className="emotion-name">
            {getEmotionEmoji(item._id)} {item._id || 'Unknown'}
          </div>
          <div className="emotion-count">{item.count}</div>
          <div className="emotion-confidence">
            {item.avg_confidence ? `${(item.avg_confidence * 100).toFixed(0)}% confidence` : ''}
          </div>
        </div>
      ))}
    </div>
  );
}

export default EmotionHeatmap;
