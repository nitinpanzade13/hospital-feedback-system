import React from 'react';
import moment from 'moment';
import { LANGUAGE_NAMES } from '../translations';

function RecentFeedback({ feedbacks }) {
  if (!feedbacks || feedbacks.length === 0) {
    return <p>No feedback available yet.</p>;
  }

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

  const getRatingStars = (rating) => {
    return '⭐'.repeat(rating) + '☆'.repeat(5 - rating);
  };

  const getLanguageBadge = (language) => {
    const langCode = (language || 'english').toLowerCase();
    const langName = LANGUAGE_NAMES[langCode] || 'English';
    return langName;
  };

  return (
    <div className="feedback-list">
      {feedbacks.map((feedback) => (
        <div key={feedback._id} className="feedback-item">
          <div className="feedback-header">
            <span className="feedback-patient">
              👤 {feedback.patient_name || 'Anonymous'}
            </span>
            {feedback.emotion && (
              <span className="feedback-emotion">
                {getEmotionEmoji(feedback.emotion)} {feedback.emotion}
              </span>
            )}
            {feedback.language && (
              <span className="feedback-language">
                🌐 {getLanguageBadge(feedback.language)}
              </span>
            )}
          </div>

          <div className="feedback-department">
            🏥 Department: <strong>{feedback.department}</strong>
          </div>

          <div className="feedback-text">
            "{feedback.feedback_text}"
          </div>

          {feedback.all_responses && Object.keys(feedback.all_responses).length > 0 && (
            <div className="feedback-all-responses">
              <strong>📋 All Responses:</strong>
              <div className="responses-grid">
                {Object.entries(feedback.all_responses).map(([question, answer], idx) => (
                  <div key={idx} className="response-item">
                    <div className="response-question">{question}</div>
                    <div className="response-answer">{answer}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {feedback.detailed_analysis && Object.keys(feedback.detailed_analysis).length > 0 && (
            <div className="detailed-analysis">
              <strong>🔍 Question-wise Analysis:</strong>
              <div className="analysis-grid">
                {Object.entries(feedback.detailed_analysis).map(([question, analysis], idx) => (
                  <div key={idx} className="analysis-item">
                    <div className="analysis-question">{question}</div>
                    <div className="analysis-emotion">
                      {getEmotionEmoji(analysis.emotion)} {analysis.emotion}
                      <span className="analysis-confidence">
                        {(analysis.confidence * 100).toFixed(0)}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="feedback-meta">
            <span className="feedback-rating">
              {getRatingStars(feedback.rating)}
            </span>
            <span>
              {feedback.language && `🌍 ${feedback.language.toUpperCase()}`}
            </span>
            <span>
              {moment(feedback.timestamp).fromNow()}
            </span>
            {feedback.confidence_score && (
              <span>
                Confidence: {(feedback.confidence_score * 100).toFixed(0)}%
              </span>
            )}
            {feedback.processed_at && (
              <span className="processed-badge">✓ Analyzed</span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

export default RecentFeedback;
