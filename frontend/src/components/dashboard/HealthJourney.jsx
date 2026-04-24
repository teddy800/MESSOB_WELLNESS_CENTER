import React, { useState, useEffect } from 'react';
import api from '../../services/api';

function HealthJourney() {
  const [vitals, setVitals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [dateRange, setDateRange] = useState('30');

  useEffect(() => {
    fetchVitals();
  }, [dateRange]);

  const fetchVitals = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/v1/vitals');
      const data = response.data.data;
      setVitals(Array.isArray(data) ? data : []);
      setError('');
    } catch (err) {
      setVitals([]);
      setError('Failed to load vitals');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getLatestVital = () => {
    return vitals.length > 0 ? vitals[0] : null;
  };

  const getRiskLevel = (value, type) => {
    if (type === 'BP_SYSTOLIC') {
      if (value < 120) return { level: 'Normal', color: 'green' };
      if (value < 140) return { level: 'Elevated', color: 'yellow' };
      return { level: 'High', color: 'red' };
    }
    if (type === 'BMI') {
      if (value < 18.5) return { level: 'Underweight', color: 'blue' };
      if (value < 25) return { level: 'Normal', color: 'green' };
      if (value < 30) return { level: 'Overweight', color: 'yellow' };
      return { level: 'Obese', color: 'red' };
    }
    if (type === 'GLUCOSE') {
      if (value < 100) return { level: 'Normal', color: 'green' };
      if (value < 126) return { level: 'Prediabetic', color: 'yellow' };
      return { level: 'Diabetic', color: 'red' };
    }
    return { level: 'Unknown', color: 'gray' };
  };

  const latest = getLatestVital();

  return (
    <div className="card health-journey">
      <h2>💪 Health Journey</h2>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="date-range-filter">
        <label>View last:</label>
        <select value={dateRange} onChange={(e) => setDateRange(e.target.value)}>
          <option value="7">7 days</option>
          <option value="30">30 days</option>
          <option value="90">90 days</option>
          <option value="365">1 year</option>
        </select>
      </div>

      {loading ? (
        <p className="loading-text">Loading health data...</p>
      ) : (
        <>
          {latest && (
            <div className="latest-vitals">
              <h3>Latest Vital Signs</h3>
              <div className="vitals-grid">
                {latest.bmi && (
                  <div className="vital-card">
                    <span className="vital-label">BMI</span>
                    <span className="vital-value">{latest.bmi.toFixed(1)}</span>
                    <span className={`vital-status status-${getRiskLevel(latest.bmi, 'BMI').color}`}>
                      {getRiskLevel(latest.bmi, 'BMI').level}
                    </span>
                  </div>
                )}

                {latest.systolicBP && (
                  <div className="vital-card">
                    <span className="vital-label">Blood Pressure</span>
                    <span className="vital-value">{latest.systolicBP}/{latest.diastolicBP}</span>
                    <span className={`vital-status status-${getRiskLevel(latest.systolicBP, 'BP_SYSTOLIC').color}`}>
                      {getRiskLevel(latest.systolicBP, 'BP_SYSTOLIC').level}
                    </span>
                  </div>
                )}

                {latest.heartRate && (
                  <div className="vital-card">
                    <span className="vital-label">Heart Rate</span>
                    <span className="vital-value">{latest.heartRate}</span>
                    <span className="vital-unit">bpm</span>
                  </div>
                )}

                {latest.glucose && (
                  <div className="vital-card">
                    <span className="vital-label">Glucose</span>
                    <span className="vital-value">{latest.glucose}</span>
                    <span className={`vital-status status-${getRiskLevel(latest.glucose, 'GLUCOSE').color}`}>
                      {getRiskLevel(latest.glucose, 'GLUCOSE').level}
                    </span>
                  </div>
                )}

                {latest.temperature && (
                  <div className="vital-card">
                    <span className="vital-label">Temperature</span>
                    <span className="vital-value">{latest.temperature}°C</span>
                  </div>
                )}

                {latest.oxygenSaturation && (
                  <div className="vital-card">
                    <span className="vital-label">O₂ Saturation</span>
                    <span className="vital-value">{latest.oxygenSaturation}%</span>
                  </div>
                )}
              </div>
              <p className="vital-timestamp">
                Last recorded: {new Date(latest.recordedAt).toLocaleDateString()}
              </p>
            </div>
          )}

          {vitals.length > 0 && (
            <div className="vitals-history">
              <h3>Vital Signs History</h3>
              <div className="history-list">
                {vitals.map((vital, idx) => (
                  <div key={idx} className="history-item">
                    <span className="history-date">
                      {new Date(vital.recordedAt).toLocaleDateString()}
                    </span>
                    <div className="history-values">
                      {vital.bmi && <span>BMI: {vital.bmi.toFixed(1)}</span>}
                      {vital.systolicBP && <span>BP: {vital.systolicBP}/{vital.diastolicBP}</span>}
                      {vital.glucose && <span>Glucose: {vital.glucose}</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {vitals.length === 0 && !error && (
            <p className="empty-text">No vital signs recorded yet. Visit a nurse to get started!</p>
          )}
        </>
      )}
    </div>
  );
}

export default HealthJourney;
