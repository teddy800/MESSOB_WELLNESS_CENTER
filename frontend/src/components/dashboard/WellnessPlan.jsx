import React, { useState, useEffect } from 'react';
import api from '../../services/api';

function WellnessPlan() {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchWellnessPlans();
  }, []);

  const fetchWellnessPlans = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/v1/plans');
      const data = response.data.data;
      setPlans(Array.isArray(data) ? data : []);
      setError('');
    } catch (err) {
      setPlans([]);
      setError('Failed to load wellness plans');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkGoalComplete = async (planId, goalIndex) => {
    try {
      const plan = plans.find(p => p.id === planId);
      if (!plan) return;

      const updatedGoals = [...(plan.goals || [])];
      updatedGoals[goalIndex] = {
        ...updatedGoals[goalIndex],
        completed: !updatedGoals[goalIndex].completed,
      };

      await api.put(`/api/v1/plans/${planId}`, {
        goals: updatedGoals,
      });

      fetchWellnessPlans();
    } catch (err) {
      setError('Failed to update goal');
    }
  };

  const getProgressPercentage = (plan) => {
    if (!plan.goals || plan.goals.length === 0) return 0;
    const completed = plan.goals.filter(g => g.completed).length;
    return Math.round((completed / plan.goals.length) * 100);
  };

  return (
    <div className="card wellness-plan">
      <h2>🎯 Wellness Plans</h2>

      {error && <div className="alert alert-error">{error}</div>}

      {loading ? (
        <p className="loading-text">Loading wellness plans...</p>
      ) : plans.length === 0 ? (
        <p className="empty-text">No wellness plans assigned yet. Visit a nurse to get a personalized plan!</p>
      ) : (
        <div className="plans-list">
          {plans.map(plan => (
            <div key={plan.id} className="plan-card">
              <div className="plan-header">
                <h3>{plan.title || 'Wellness Plan'}</h3>
                <span className={`plan-status ${plan.isActive ? 'active' : 'inactive'}`}>
                  {plan.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>

              {plan.description && (
                <p className="plan-description">{plan.description}</p>
              )}

              <div className="plan-sections">
                {plan.nutritionRecommendations && (
                  <div className="plan-section">
                    <h4>🥗 Nutrition Recommendations</h4>
                    <p>{plan.nutritionRecommendations}</p>
                  </div>
                )}

                {plan.exerciseRecommendations && (
                  <div className="plan-section">
                    <h4>🏃 Exercise Recommendations</h4>
                    <p>{plan.exerciseRecommendations}</p>
                  </div>
                )}

                {plan.stressManagementAdvice && (
                  <div className="plan-section">
                    <h4>🧘 Stress Management</h4>
                    <p>{plan.stressManagementAdvice}</p>
                  </div>
                )}
              </div>

              {plan.goals && plan.goals.length > 0 && (
                <div className="goals-section">
                  <h4>📍 Goals & Progress</h4>
                  <div className="progress-bar">
                    <div 
                      className="progress-fill" 
                      style={{ width: `${getProgressPercentage(plan)}%` }}
                    ></div>
                  </div>
                  <p className="progress-text">
                    {plan.goals.filter(g => g.completed).length} of {plan.goals.length} goals completed
                  </p>

                  <div className="goals-list">
                    {plan.goals.map((goal, idx) => (
                      <div key={idx} className="goal-item">
                        <input
                          type="checkbox"
                          checked={goal.completed || false}
                          onChange={() => handleMarkGoalComplete(plan.id, idx)}
                          className="goal-checkbox"
                        />
                        <span className={`goal-text ${goal.completed ? 'completed' : ''}`}>
                          {goal.title || goal}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {plan.duration && (
                <p className="plan-duration">
                  Duration: {plan.duration} days
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default WellnessPlan;
