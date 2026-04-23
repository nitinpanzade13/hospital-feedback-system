import React, { useState, useEffect } from 'react';
import apiClient from '../config/api';
import './DepartmentQuestionsManager.css';

const DepartmentQuestionsManager = () => {
  const [departments, setDepartments] = useState([]);
  const [selectedDept, setSelectedDept] = useState('');
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showAddQuestion, setShowAddQuestion] = useState(false);
  const [showTranslations, setShowTranslations] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [newQuestion, setNewQuestion] = useState({
    question_text: '',
    translations: {
      hindi: '',
      marathi: ''
    },
    question_type: 'short_answer',
    required: true,
    options: []
  });

  // Fetch departments on load
  useEffect(() => {
    fetchDepartments();
  }, []);

  // Fetch questions when department changes
  useEffect(() => {
    if (selectedDept) {
      fetchQuestions(selectedDept);
    }
  }, [selectedDept]);

  const fetchDepartments = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/api/departments');
      setDepartments(response.data.departments || []);
      if (response.data.departments && response.data.departments.length > 0) {
        setSelectedDept(response.data.departments[0].name);
      }
      setError('');
    } catch (err) {
      setError('Failed to fetch departments');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchQuestions = async (dept) => {
    try {
      setLoading(true);
      const response = await apiClient.get(`/api/departments/${dept}/questions`);
      setQuestions(response.data.questions || []);
      setError('');
    } catch (err) {
      setError('Failed to fetch questions');
      console.error(err);
      setQuestions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddQuestion = async (e) => {
    e.preventDefault();
    
    if (!newQuestion.question_text.trim()) {
      setError('Question text cannot be empty');
      return;
    }

    try {
      setLoading(true);
      await apiClient.post(
        `/api/departments/${selectedDept}/questions`,
        newQuestion
      );
      
      // Refresh questions
      await fetchQuestions(selectedDept);
      
      // Reset form
      setNewQuestion({
        question_text: '',
        question_type: 'short_answer',
        required: true,
        options: []
      });
      setShowAddQuestion(false);
      setError('');
    } catch (err) {
      setError('Failed to add question');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateQuestion = async (e) => {
    e.preventDefault();
    
    if (!editingQuestion.question_text.trim()) {
      setError('Question text cannot be empty');
      return;
    }

    try {
      setLoading(true);
      await apiClient.put(
        `/api/departments/${selectedDept}/questions/${editingQuestion._id}`,
        editingQuestion
      );
      
      // Refresh questions
      await fetchQuestions(selectedDept);
      setEditingQuestion(null);
      setError('');
    } catch (err) {
      setError('Failed to update question');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteQuestion = async (questionId) => {
    if (!window.confirm('Are you sure you want to delete this question?')) {
      return;
    }

    try {
      setLoading(true);
      await apiClient.delete(
        `/api/departments/${selectedDept}/questions/${questionId}`
      );
      
      // Refresh questions
      await fetchQuestions(selectedDept);
      setError('');
    } catch (err) {
      setError('Failed to delete question');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOptionChange = (index, value) => {
    const updated = editingQuestion ? { ...editingQuestion } : { ...newQuestion };
    const options = updated.options || [];
    options[index] = value;
    updated.options = options;
    
    if (editingQuestion) {
      setEditingQuestion(updated);
    } else {
      setNewQuestion(updated);
    }
  };

  const handleAddOption = () => {
    const updated = editingQuestion ? { ...editingQuestion } : { ...newQuestion };
    updated.options = [...(updated.options || []), ''];
    
    if (editingQuestion) {
      setEditingQuestion(updated);
    } else {
      setNewQuestion(updated);
    }
  };

  const handleRemoveOption = (index) => {
    const updated = editingQuestion ? { ...editingQuestion } : { ...newQuestion };
    updated.options = updated.options.filter((_, i) => i !== index);
    
    if (editingQuestion) {
      setEditingQuestion(updated);
    } else {
      setNewQuestion(updated);
    }
  };

  const currentQuestion = editingQuestion || newQuestion;

  return (
    <div className="dept-questions-manager">
      <div className="dqm-header">
        <h2>📋 Department Question Manager</h2>
        <p>Customize feedback questions for each department</p>
      </div>

      {error && <div className="dqm-error">{error}</div>}

      <div className="dqm-container">
        {/* Department Selector */}
        <div className="dqm-dept-selector">
          <label>Select Department:</label>
          <select 
            value={selectedDept} 
            onChange={(e) => setSelectedDept(e.target.value)}
            disabled={loading}
          >
            {departments.map(dept => (
              <option key={dept._id || dept.name} value={dept.name}>
                {dept.name}
              </option>
            ))}
          </select>
        </div>

        {/* Questions List */}
        <div className="dqm-questions-list">
          <div className="dqm-list-header">
            <h3>Questions for {selectedDept}</h3>
            <button 
              className="btn-add-question"
              onClick={() => {
                setShowAddQuestion(!showAddQuestion);
                setEditingQuestion(null);
              }}
              disabled={loading}
            >
              {showAddQuestion ? '✕ Cancel' : '+ Add Question'}
            </button>
          </div>

          {/* Add/Edit Question Form */}
          {(showAddQuestion || editingQuestion) && (
            <form className="dqm-question-form" onSubmit={editingQuestion ? handleUpdateQuestion : handleAddQuestion}>
              <div className="form-group">
                <label>Question Text (English) *</label>
                <textarea
                  value={currentQuestion.question_text}
                  onChange={(e) => {
                    if (editingQuestion) {
                      setEditingQuestion({ ...editingQuestion, question_text: e.target.value });
                    } else {
                      setNewQuestion({ ...newQuestion, question_text: e.target.value });
                    }
                  }}
                  placeholder="Enter your question in English"
                  rows="3"
                />
              </div>

              {/* Translation Toggle */}
              <div className="form-group">
                <button 
                  type="button"
                  className="btn-toggle-translations"
                  onClick={() => setShowTranslations(!showTranslations)}
                >
                  {showTranslations ? '✕ Hide Translations' : '➕ Add Translations'}
                </button>
              </div>

              {/* Translation Fields */}
              {showTranslations && (
                <>
                  <div className="form-group">
                    <label>Question in Hindi</label>
                    <textarea
                      value={currentQuestion.translations?.hindi || ''}
                      onChange={(e) => {
                        const translations = currentQuestion.translations || {};
                        if (editingQuestion) {
                          setEditingQuestion({ 
                            ...editingQuestion, 
                            translations: { ...translations, hindi: e.target.value }
                          });
                        } else {
                          setNewQuestion({ 
                            ...newQuestion, 
                            translations: { ...translations, hindi: e.target.value }
                          });
                        }
                      }}
                      placeholder="प्रश्न को हिंदी में दर्ज करें"
                      rows="3"
                    />
                  </div>

                  <div className="form-group">
                    <label>Question in Marathi</label>
                    <textarea
                      value={currentQuestion.translations?.marathi || ''}
                      onChange={(e) => {
                        const translations = currentQuestion.translations || {};
                        if (editingQuestion) {
                          setEditingQuestion({ 
                            ...editingQuestion, 
                            translations: { ...translations, marathi: e.target.value }
                          });
                        } else {
                          setNewQuestion({ 
                            ...newQuestion, 
                            translations: { ...translations, marathi: e.target.value }
                          });
                        }
                      }}
                      placeholder="प्रश्न मराठीमध्ये दर्ज करा"
                      rows="3"
                    />
                  </div>
                </>
              )}

              <div className="form-row">
                <div className="form-group">
                  <label>Question Type *</label>
                  <select
                    value={currentQuestion.question_type}
                    onChange={(e) => {
                      if (editingQuestion) {
                        setEditingQuestion({ ...editingQuestion, question_type: e.target.value });
                      } else {
                        setNewQuestion({ ...newQuestion, question_type: e.target.value });
                      }
                    }}
                  >
                    <option value="short_answer">Short Answer</option>
                    <option value="paragraph">Paragraph</option>
                    <option value="multiple_choice">Multiple Choice</option>
                    <option value="rating">Rating (1-5)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>
                    <input
                      type="checkbox"
                      checked={currentQuestion.required}
                      onChange={(e) => {
                        if (editingQuestion) {
                          setEditingQuestion({ ...editingQuestion, required: e.target.checked });
                        } else {
                          setNewQuestion({ ...newQuestion, required: e.target.checked });
                        }
                      }}
                    />
                    Required Field
                  </label>
                </div>
              </div>

              {/* Options for Multiple Choice */}
              {currentQuestion.question_type === 'multiple_choice' && (
                <div className="form-group">
                  <label>Options</label>
                  {(currentQuestion.options || []).map((option, index) => (
                    <div key={index} className="option-input-group">
                      <input
                        type="text"
                        value={option}
                        onChange={(e) => handleOptionChange(index, e.target.value)}
                        placeholder={`Option ${index + 1}`}
                      />
                      <button
                        type="button"
                        className="btn-remove-option"
                        onClick={() => handleRemoveOption(index)}
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    className="btn-add-option"
                    onClick={handleAddOption}
                  >
                    + Add Option
                  </button>
                </div>
              )}

              <div className="form-actions">
                <button type="submit" className="btn-save" disabled={loading}>
                  {loading ? 'Saving...' : editingQuestion ? 'Update Question' : 'Add Question'}
                </button>
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={() => {
                    setEditingQuestion(null);
                    setShowAddQuestion(false);
                    setNewQuestion({
                      question_text: '',
                      question_type: 'short_answer',
                      required: true,
                      options: []
                    });
                  }}
                  disabled={loading}
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          {/* Questions Display */}
          <div className="dqm-questions">
            {loading && !selectedDept ? (
              <p className="loading">Loading questions...</p>
            ) : questions.length === 0 ? (
              <p className="no-questions">No questions configured for this department</p>
            ) : (
              questions.map((question, index) => (
                <div key={question._id || index} className="question-item">
                  <div className="question-number">{index + 1}</div>
                  <div className="question-content">
                    <p className="question-text">
                      <strong>🇬🇧 English:</strong> {question.question_text}
                    </p>
                    
                    {/* Display Translations */}
                    {question.translations && (
                      <div className="question-translations">
                        {question.translations.hindi && (
                          <p className="translation-item hindi">
                            <strong>🇮🇳 हिन्दी:</strong> {question.translations.hindi}
                          </p>
                        )}
                        {question.translations.marathi && (
                          <p className="translation-item marathi">
                            <strong>मराठी:</strong> {question.translations.marathi}
                          </p>
                        )}
                      </div>
                    )}
                    
                    <div className="question-meta">
                      <span className="badge badge-type">{question.question_type}</span>
                      {question.required && <span className="badge badge-required">Required</span>}
                      {question.question_type === 'multiple_choice' && (
                        <div className="options-preview">
                          {(question.options || []).map((opt, i) => (
                            <span key={i} className="option">{opt}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="question-actions">
                    <button
                      className="btn-edit"
                      onClick={() => {
                        setEditingQuestion(question);
                        setShowAddQuestion(false);
                      }}
                      disabled={loading}
                    >
                      ✎ Edit
                    </button>
                    <button
                      className="btn-delete"
                      onClick={() => handleDeleteQuestion(question._id)}
                      disabled={loading}
                    >
                      🗑 Delete
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Info Section */}
      <div className="dqm-info">
        <h4>💡 How It Works</h4>
        <ul>
          <li>Add/edit questions specific to each department</li>
          <li>Questions appear in the Google Form for that department</li>
          <li>When patients scan QR code, they see department-specific questions</li>
          <li>All questions are sent to Google Forms via Apps Script</li>
          <li>Feedback is automatically collected in the dashboard</li>
        </ul>
      </div>
    </div>
  );
};

export default DepartmentQuestionsManager;
