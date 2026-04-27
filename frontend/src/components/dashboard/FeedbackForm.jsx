import React, { useState } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

function FeedbackForm() {
  const { user } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({
    npsScore: 5,
    serviceQuality: 5,
    staffBehavior: 5,
    cleanliness: 5,
    waitTime: 5,
    comments: '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'comments' ? value : parseInt(value),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      await api.post('/api/v1/feedback', {
        userId: user.id,
        npsScore: formData.npsScore,
        serviceQuality: formData.serviceQuality,
        staffBehavior: formData.staffBehavior,
        cleanliness: formData.cleanliness,
        waitTime: formData.waitTime,
        comments: formData.comments,
        feedbackType: 'SERVICE',
      });

      setSuccess(true);
      setTimeout(() => {
        setShowForm(false);
        setSuccess(false);
        setFormData({
          npsScore: 5,
          serviceQuality: 5,
          staffBehavior: 5,
          cleanliness: 5,
          waitTime: 5,
          comments: '',
        });
      }, 2000);
    } catch (err) {
      alert('Failed to submit feedback');
    } finally {
      setLoading(false);
    }
  };

  const getNpsColor = (score) => {
    if (score <= 6) return 'red';
    if (score <= 8) return 'yellow';
    return 'green';
  };

  const getNpsLabel = (score) => {
    if (score <= 6) return 'Detractor';
    if (score <= 8) return 'Passive';
    return 'Promoter';
  };

  if (!showForm) {
    return (
      <div className="card feedback-form">
        <h3>📝 Share Your Feedback</h3>
        <p>Help us improve our services by sharing your experience</p>
        <button 
          className="btn btn-primary"
          onClick={() => setShowForm(true)}
        >
          Give Feedback
        </button>
      </div>
    );
  }

  return (
    <div className="card feedback-form">
      <div className="form-header">
        <h3>📝 Service Feedback</h3>
        <button 
          className="close-btn"
          onClick={() => setShowForm(false)}
        >
          ✕
        </button>
      </div>

      {success && (
        <div className="alert alert-success">
          ✅ Thank you! Your feedback has been submitted.
        </div>
      )}

      <form onSubmit={handleSubmit} className="feedback-form-content">
        
        <div className="form-group">
          <label className="form-label">
            How likely are you to recommend our wellness center? (0-10)
          </label>
          <div className="nps-scale">
            {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(score => (
              <button
                key={score}
                type="button"
                className={`nps-btn ${formData.npsScore === score ? 'active' : ''}`}
                onClick={() => setFormData(prev => ({ ...prev, npsScore: score }))}
              >
                {score}
              </button>
            ))}
          </div>
          <div className={`nps-label nps-${getNpsColor(formData.npsScore)}`}>
            {getNpsLabel(formData.npsScore)}
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Service Quality (1-5)</label>
          <div className="rating-scale">
            {[1, 2, 3, 4, 5].map(score => (
              <button
                key={score}
                type="button"
                className={`rating-btn ${formData.serviceQuality === score ? 'active' : ''}`}
                onClick={() => setFormData(prev => ({ ...prev, serviceQuality: score }))}
              >
                {'⭐'.repeat(score)}
              </button>
            ))}
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Staff Behavior (1-5)</label>
          <div className="rating-scale">
            {[1, 2, 3, 4, 5].map(score => (
              <button
                key={score}
                type="button"
                className={`rating-btn ${formData.staffBehavior === score ? 'active' : ''}`}
                onClick={() => setFormData(prev => ({ ...prev, staffBehavior: score }))}
              >
                {'⭐'.repeat(score)}
              </button>
            ))}
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Cleanliness (1-5)</label>
          <div className="rating-scale">
            {[1, 2, 3, 4, 5].map(score => (
              <button
                key={score}
                type="button"
                className={`rating-btn ${formData.cleanliness === score ? 'active' : ''}`}
                onClick={() => setFormData(prev => ({ ...prev, cleanliness: score }))}
              >
                {'⭐'.repeat(score)}
              </button>
            ))}
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Wait Time (1-5)</label>
          <div className="rating-scale">
            {[1, 2, 3, 4, 5].map(score => (
              <button
                key={score}
                type="button"
                className={`rating-btn ${formData.waitTime === score ? 'active' : ''}`}
                onClick={() => setFormData(prev => ({ ...prev, waitTime: score }))}
              >
                {'⭐'.repeat(score)}
              </button>
            ))}
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Additional Comments</label>
          <textarea
            name="comments"
            value={formData.comments}
            onChange={handleChange}
            placeholder="Tell us what we can improve..."
            rows="4"
            className="form-input"
            disabled={loading}
          />
        </div>

        <div className="form-actions">
          <button 
            type="submit"
            className="btn btn-primary"
            disabled={loading}
          >
            {loading ? 'Submitting...' : 'Submit Feedback'}
          </button>
          <button 
            type="button"
            className="btn btn-secondary"
            onClick={() => setShowForm(false)}
            disabled={loading}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

export default FeedbackForm;
