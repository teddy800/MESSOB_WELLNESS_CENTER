import React, { useState, useEffect } from 'react';
import api from '../../services/api';

function QuickHistoryModal({ customerId, customerName, onClose, onViewDetails }) {
  const [vitalsHistory, setVitalsHistory] = useState([]);
  const [wellnessPlans, setWellnessPlans] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('vitals');

  useEffect(() => {
    if (customerId) {
      fetchLatestHistory();
    }
  }, [customerId]);

  const fetchLatestHistory = async () => {
    try {
      setLoading(true);
      setError('');

      // Fetch vitals history (limit to last 5)
      const vitalsResponse = await api.get(`/api/v1/vitals/history/${customerId}`);
      const vitalsData = vitalsResponse.data.data?.records || [];
      setVitalsHistory(Array.isArray(vitalsData) ? vitalsData.slice(0, 5) : []);

      // Fetch wellness plans (limit to last 3)
      const plansResponse = await api.get(`/api/v1/plans/${customerId}`);
      const plansData = plansResponse.data.data;
      setWellnessPlans(Array.isArray(plansData) ? plansData.slice(0, 3) : []);
    } catch (err) {
      setError('Failed to load history');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content quick-history-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>📚 Quick History - {customerName}</h3>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <div className="modal-tabs">
          <button
            className={`tab-btn ${activeTab === 'vitals' ? 'active' : ''}`}
            onClick={() => setActiveTab('vitals')}
          >
            💉 Latest Vitals ({vitalsHistory.length})
          </button>
          <button
            className={`tab-btn ${activeTab === 'plans' ? 'active' : ''}`}
            onClick={() => setActiveTab('plans')}
          >
            🎯 Recent Plans ({wellnessPlans.length})
          </button>
        </div>

        <div className="modal-body">
          {loading ? (
            <p className="loading-text">Loading history...</p>
          ) : activeTab === 'vitals' ? (
            <div className="quick-vitals-list">
              {vitalsHistory.length === 0 ? (
                <p className="empty-text">No vitals recorded</p>
              ) : (
                vitalsHistory.map((vital, idx) => (
                  <div key={idx} className="quick-history-item">
                    <div className="quick-item-header">
                      <span className="quick-date">
                        {new Date(vital.recordedAt).toLocaleDateString()}
                      </span>
                      <span className="quick-time">
                        {new Date(vital.recordedAt).toLocaleTimeString()}
                      </span>
                    </div>
                    <div className="quick-item-content">
                      <div className="vital-row">
                        {vital.systolic && (
                          <span>BP: {vital.systolic}/{vital.diastolic}</span>
                        )}
                        {vital.heartRate && (
                          <span>HR: {vital.heartRate} bpm</span>
                        )}
                        {vital.bmi && (
                          <span>BMI: {vital.bmi.toFixed(1)}</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          ) : (
            <div className="quick-plans-list">
              {wellnessPlans.length === 0 ? (
                <p className="empty-text">No wellness plans created</p>
              ) : (
                wellnessPlans.map((plan, idx) => (
                  <div key={idx} className="quick-history-item">
                    <div className="quick-item-header">
                      <span className="plan-title">{plan.title || 'Wellness Plan'}</span>
                      <span className={`status-badge ${plan.isActive ? 'status-active' : 'status-inactive'}`}>
                        {plan.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <div className="quick-item-content">
                      <p style={{ fontSize: '0.9rem', color: '#666', marginBottom: '0.5rem' }}>
                        {plan.planText?.substring(0, 100)}...
                      </p>
                      <p style={{ fontSize: '0.85rem', color: '#999' }}>
                        Created: {new Date(plan.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button
            className="btn btn-secondary"
            onClick={onClose}
          >
            Close
          </button>
          <button
            className="btn btn-primary"
            onClick={() => {
              onViewDetails();
              onClose();
            }}
          >
            📋 View Full Details
          </button>
        </div>
      </div>
    </div>
  );
}

export default QuickHistoryModal;
