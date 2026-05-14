import React, { useState } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

function FeedbackForm() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({
    npsScore: null,
    serviceQuality: null,
    staffBehavior: null,
    cleanliness: null,
    waitTime: null,
    comments: '',
  });

  const handleRatingChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleCommentChange = (e) => {
    setFormData(prev => ({
      ...prev,
      comments: e.target.value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.npsScore === null) {
      alert('Please provide your NPS rating');
      return;
    }

    try {
      setLoading(true);
      const payload = {
        userId: user.id,
        npsScore: formData.npsScore,
        feedbackType: 'SERVICE',
      };

      // Only include optional fields if they have values
      if (formData.serviceQuality !== null) payload.serviceQuality = formData.serviceQuality;
      if (formData.staffBehavior !== null) payload.staffBehavior = formData.staffBehavior;
      if (formData.cleanliness !== null) payload.cleanliness = formData.cleanliness;
      if (formData.waitTime !== null) payload.waitTime = formData.waitTime;
      if (formData.comments) payload.comments = formData.comments;

      await api.post('/api/v1/feedback', payload);

      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setFormData({
          npsScore: null,
          serviceQuality: null,
          staffBehavior: null,
          cleanliness: null,
          waitTime: null,
          comments: '',
        });
      }, 2500);
    } catch (err) {
      console.error('Feedback submission error:', err);
      const errorMsg = err.response?.data?.message || 'Failed to submit feedback';
      alert(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const RatingScale = ({ label, field, value, onChange, description }) => {
    return (
      <div className="rating-group">
        <div className="rating-header">
          <label className="rating-label">{label}</label>
          {description && <p className="rating-description">{description}</p>}
        </div>
        <div className="rating-buttons">
          {[1, 2, 3, 4, 5].map(score => (
            <button
              key={score}
              type="button"
              className={`rating-button ${value === score ? 'active' : ''}`}
              onClick={() => onChange(field, score)}
              title={`Rate ${score} out of 5`}
            >
              <span className="rating-number">{score}</span>
              <span className="rating-stars">{'★'.repeat(score)}</span>
            </button>
          ))}
        </div>
      </div>
    );
  };

  const getNpsDescription = (score) => {
    if (score === null) return 'Select a score';
    if (score <= 6) return '😞 Detractor - We\'re sorry to hear that';
    if (score <= 8) return '😐 Passive - Thank you for your feedback';
    return '😊 Promoter - We\'re thrilled you\'re happy!';
  };

  const getNpsEmoji = (score) => {
    if (score === null) return '❓';
    if (score <= 6) return '😞';
    if (score <= 8) return '😐';
    return '😊';
  };

  return (
    <div className="card feedback-form">
      <div className="feedback-header">
        <h2>Share Your Feedback</h2>
        <p className="feedback-subtitle">Your feedback helps us improve our services</p>
      </div>

      {success && (
        <div className="alert alert-success feedback-success">
          <span className="success-icon">✅</span>
          <div>
            <strong>Thank you!</strong>
            <p>Your feedback has been submitted successfully.</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="feedback-form-content">
        
        {/* NPS Question */}
        <div className="nps-section">
          <div className="nps-header">
            <h3>How likely are you to recommend us?</h3>
            <p className="nps-scale-label">0 = Not at all likely &nbsp; • &nbsp; 10 = Extremely likely</p>
          </div>
          
          <div className="nps-scale">
            {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(score => (
              <button
                key={score}
                type="button"
                className={`nps-button ${formData.npsScore === score ? 'active' : ''}`}
                onClick={() => handleRatingChange('npsScore', score)}
              >
                {score}
              </button>
            ))}
          </div>

          {formData.npsScore !== null && (
            <div className={`nps-feedback nps-feedback-${formData.npsScore <= 6 ? 'detractor' : formData.npsScore <= 8 ? 'passive' : 'promoter'}`}>
              <span className="nps-emoji">{getNpsEmoji(formData.npsScore)}</span>
              <span className="nps-text">{getNpsDescription(formData.npsScore)}</span>
            </div>
          )}
        </div>

        {/* Additional Ratings */}
        <div className="ratings-section">
          <h3 className="section-title">Rate Your Experience</h3>
          
          <RatingScale
            label="Service Quality"
            field="serviceQuality"
            value={formData.serviceQuality}
            onChange={handleRatingChange}
            description="How would you rate the quality of service?"
          />

          <RatingScale
            label="Staff Behavior"
            field="staffBehavior"
            value={formData.staffBehavior}
            onChange={handleRatingChange}
            description="How professional and courteous was our staff?"
          />

          <RatingScale
            label="Cleanliness"
            field="cleanliness"
            value={formData.cleanliness}
            onChange={handleRatingChange}
            description="How clean and well-maintained was the facility?"
          />

          <RatingScale
            label="Wait Time"
            field="waitTime"
            value={formData.waitTime}
            onChange={handleRatingChange}
            description="How satisfied are you with the wait time?"
          />
        </div>

        {/* Comments */}
        <div className="comments-section">
          <label className="form-label">Additional Comments</label>
          <p className="form-hint">Tell us what we did well or how we can improve</p>
          <textarea
            value={formData.comments}
            onChange={handleCommentChange}
            placeholder="Your feedback is valuable to us..."
            rows="4"
            className="form-input feedback-textarea"
            disabled={loading}
          />
        </div>

        {/* Submit Button */}
        <div className="form-actions">
          <button 
            type="submit"
            className="btn btn-primary btn-large"
            disabled={loading || formData.npsScore === null}
          >
            {loading ? (
              <>
                <span className="spinner"></span>
                Submitting...
              </>
            ) : (
              'Submit Feedback'
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

export default FeedbackForm;
