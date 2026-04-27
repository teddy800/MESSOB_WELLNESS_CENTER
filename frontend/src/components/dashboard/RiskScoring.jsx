import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

function RiskScoring() {
  const { user } = useAuth();
  const [riskScores, setRiskScores] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user?.id) {
      fetchRiskScores();
    }
  }, [user?.id]);

  const fetchRiskScores = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/api/v1/vitals/risk-score/${user.id}`);
      const data = response.data.data;
      setRiskScores(data);
      setError('');
    } catch (err) {
      console.error('Failed to fetch risk scores:', err);
      // Calculate locally if API fails
      calculateLocalRiskScores();
    } finally {
      setLoading(false);
    }
  };

  const calculateLocalRiskScores = async () => {
    try {
      const response = await api.get(`/api/v1/vitals`);
      const vitals = response.data.data;
      
      if (!vitals || vitals.length === 0) {
        setRiskScores(null);
        return;
      }

      const latest = vitals[0];
      const scores = calculateRiskScores(latest);
      setRiskScores(scores);
    } catch (err) {
      setError('Unable to calculate risk scores');
    }
  };

  const calculateRiskScores = (vital) => {
    const scores = {
      hypertension: 0,
      diabetes: 0,
      obesity: 0,
      overall: 0,
    };

    // Hypertension Risk (0-100)
    if (vital.systolicBP) {
      if (vital.systolicBP < 120) scores.hypertension = 0;
      else if (vital.systolicBP < 130) scores.hypertension = 20;
      else if (vital.systolicBP < 140) scores.hypertension = 50;
      else scores.hypertension = 100;
    }

    // Diabetes Risk (0-100)
    if (vital.glucose) {
      if (vital.glucose < 100) scores.diabetes = 0;
      else if (vital.glucose < 126) scores.diabetes = 50;
      else scores.diabetes = 100;
    }

    // Obesity Risk (0-100)
    if (vital.bmi) {
      if (vital.bmi < 25) scores.obesity = 0;
      else if (vital.bmi < 30) scores.obesity = 50;
      else scores.obesity = 100;
    }

    // Overall Risk (average)
    const validScores = Object.values(scores).filter(s => s !== 0);
    scores.overall = validScores.length > 0 
      ? Math.round(validScores.reduce((a, b) => a + b) / validScores.length)
      : 0;

    return scores;
  };

  const getRiskColor = (score) => {
    if (score < 30) return 'green';
    if (score < 70) return 'yellow';
    return 'red';
  };

  const getRiskLabel = (score) => {
    if (score < 30) return 'Low Risk';
    if (score < 70) return 'Moderate Risk';
    return 'High Risk';
  };

  if (loading) return <p className="loading-text">Calculating risk scores...</p>;

  if (!riskScores) {
    return (
      <div className="card risk-scoring">
        <h3>📊 Risk Scoring</h3>
        <p className="empty-text">No vitals recorded yet. Risk scores will appear after your first health screening.</p>
      </div>
    );
  }

  return (
    <div className="card risk-scoring">
      <h3>📊 Risk Scoring Analysis</h3>
      
      {error && <div className="alert alert-error">{error}</div>}

      <div className="overall-risk">
        <div className={`risk-circle risk-${getRiskColor(riskScores.overall)}`}>
          <span className="risk-score">{riskScores.overall}</span>
          <span className="risk-label">{getRiskLabel(riskScores.overall)}</span>
        </div>
      </div>

      <div className="risk-breakdown">
        <div className={`risk-item risk-${getRiskColor(riskScores.hypertension)}`}>
          <span className="risk-name">Hypertension Risk</span>
          <div className="risk-bar">
            <div 
              className="risk-fill" 
              style={{ width: `${riskScores.hypertension}%` }}
            ></div>
          </div>
          <span className="risk-value">{riskScores.hypertension}%</span>
        </div>

        <div className={`risk-item risk-${getRiskColor(riskScores.diabetes)}`}>
          <span className="risk-name">Diabetes Risk</span>
          <div className="risk-bar">
            <div 
              className="risk-fill" 
              style={{ width: `${riskScores.diabetes}%` }}
            ></div>
          </div>
          <span className="risk-value">{riskScores.diabetes}%</span>
        </div>

        <div className={`risk-item risk-${getRiskColor(riskScores.obesity)}`}>
          <span className="risk-name">Obesity Risk</span>
          <div className="risk-bar">
            <div 
              className="risk-fill" 
              style={{ width: `${riskScores.obesity}%` }}
            ></div>
          </div>
          <span className="risk-value">{riskScores.obesity}%</span>
        </div>
      </div>

      <div className="risk-recommendations">
        <h4>Recommendations</h4>
        <ul>
          {riskScores.hypertension > 50 && (
            <li>🩺 Monitor blood pressure regularly. Consider reducing salt intake.</li>
          )}
          {riskScores.diabetes > 50 && (
            <li>🍎 Reduce sugar intake and maintain regular exercise routine.</li>
          )}
          {riskScores.obesity > 50 && (
            <li>💪 Increase physical activity and follow your wellness plan.</li>
          )}
          {riskScores.overall < 30 && (
            <li>✅ Great! Keep maintaining your healthy lifestyle.</li>
          )}
        </ul>
      </div>
    </div>
  );
}

export default RiskScoring;
