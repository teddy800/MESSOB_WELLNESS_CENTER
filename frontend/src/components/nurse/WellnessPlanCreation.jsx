import React, { useState } from 'react';
import api from '../../services/api';

function WellnessPlanCreation({ customerId, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    nutritionRecommendations: '',
    exerciseRecommendations: '',
    stressManagementAdvice: '',
    goals: '',
    duration: '30',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!customerId) {
      setError('Customer ID is required');
      return;
    }

    if (!formData.title.trim()) {
      setError('Plan title is required');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const goalsArray = formData.goals
        .split('\n')
        .map(g => g.trim())
        .filter(g => g.length > 0);

      const response = await api.post('/api/v1/plans', {
        userId: customerId,
        title: formData.title,
        nutritionRecommendations: formData.nutritionRecommendations,
        exerciseRecommendations: formData.exerciseRecommendations,
        stressManagementAdvice: formData.stressManagementAdvice,
        goals: goalsArray,
        duration: parseInt(formData.duration),
        isActive: true,
      });

      setSuccess('Wellness plan created successfully!');
      setFormData({
        title: '',
        nutritionRecommendations: '',
        exerciseRecommendations: '',
        stressManagementAdvice: '',
        goals: '',
        duration: '30',
      });

      setTimeout(() => {
        setSuccess('');
        if (onSuccess) onSuccess();
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create wellness plan');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card wellness-plan-creation">
      <h3>🎯 Create Wellness Plan</h3>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <form onSubmit={handleSubmit} className="wellness-form">
        <div className="form-group">
          <label className="form-label">Plan Title *</label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            placeholder="e.g., Weight Management Plan"
            disabled={loading}
            required
            className="form-input"
          />
        </div>

        <div className="form-group">
          <label className="form-label">🥗 Nutrition Recommendations</label>
          <textarea
            name="nutritionRecommendations"
            value={formData.nutritionRecommendations}
            onChange={handleChange}
            placeholder="Provide nutrition advice and dietary recommendations..."
            disabled={loading}
            rows="4"
            className="form-input"
          />
        </div>

        <div className="form-group">
          <label className="form-label">🏃 Exercise Recommendations</label>
          <textarea
            name="exerciseRecommendations"
            value={formData.exerciseRecommendations}
            onChange={handleChange}
            placeholder="Suggest exercise routines and physical activities..."
            disabled={loading}
            rows="4"
            className="form-input"
          />
        </div>

        <div className="form-group">
          <label className="form-label">🧘 Stress Management Advice</label>
          <textarea
            name="stressManagementAdvice"
            value={formData.stressManagementAdvice}
            onChange={handleChange}
            placeholder="Provide stress management techniques and mental health advice..."
            disabled={loading}
            rows="4"
            className="form-input"
          />
        </div>

        <div className="form-group">
          <label className="form-label">📍 Goals (one per line)</label>
          <textarea
            name="goals"
            value={formData.goals}
            onChange={handleChange}
            placeholder="Enter goals, one per line&#10;e.g.&#10;Lose 5kg in 3 months&#10;Exercise 3 times per week&#10;Reduce stress levels"
            disabled={loading}
            rows="4"
            className="form-input"
          />
        </div>

        <div className="form-group">
          <label className="form-label">Duration (days)</label>
          <input
            type="number"
            name="duration"
            value={formData.duration}
            onChange={handleChange}
            min="7"
            max="365"
            disabled={loading}
            className="form-input"
          />
        </div>

        <button
          type="submit"
          className="btn btn-primary btn-large"
          disabled={loading}
        >
          {loading ? 'Creating...' : '✓ Create Wellness Plan'}
        </button>
      </form>
    </div>
  );
}

export default WellnessPlanCreation;
