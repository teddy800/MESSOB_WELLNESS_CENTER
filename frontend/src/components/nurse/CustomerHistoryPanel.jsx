import React, { useState, useEffect } from 'react';
import api from '../../services/api';

function CustomerHistoryPanel({ customer, onClose }) {
  const [vitalsHistory, setVitalsHistory] = useState([]);
  const [wellnessPlans, setWellnessPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('vitals');
  const [expandedPlanId, setExpandedPlanId] = useState(null);

  useEffect(() => {
    fetchCustomerHistory();
  }, [customer.customerId]);

  const fetchCustomerHistory = async () => {
    try {
      setLoading(true);
      setError('');

      // Fetch vitals history
      const vitalsResponse = await api.get(`/api/v1/vitals/history/${customer.customerId}`);
      const vitalsData = vitalsResponse.data.data?.records || [];
      setVitalsHistory(Array.isArray(vitalsData) ? vitalsData : []);

      // Fetch wellness plans
      const plansResponse = await api.get(`/api/v1/plans/${customer.customerId}`);
      const plansData = plansResponse.data.data;
      setWellnessPlans(Array.isArray(plansData) ? plansData : []);
    } catch (err) {
      setError('Failed to load customer history');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ marginBottom: '2rem', padding: '1.5rem', backgroundColor: '#f8fafc', borderRadius: '8px', border: '2px solid #284394' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h3 style={{ margin: '0 0 0.5rem 0', color: '#284394' }}>📋 {customer.customerName}</h3>
          <p style={{ margin: 0, fontSize: '0.9rem', color: '#666' }}>
            ID: {customer.customerId} | Appointment: {customer.appointmentId?.substring(0, 12)}...
          </p>
        </div>
        <button 
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            fontSize: '1.5rem',
            cursor: 'pointer',
            color: '#666',
            padding: '0.5rem',
          }}
          title="Close details"
        >
          ✕
        </button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="history-tabs" style={{ marginBottom: '1rem' }}>
        <button
          className={`tab-btn ${activeTab === 'vitals' ? 'active' : ''}`}
          onClick={() => setActiveTab('vitals')}
          style={{
            padding: '0.75rem 1rem',
            border: 'none',
            borderBottom: activeTab === 'vitals' ? '3px solid #284394' : '1px solid #e2e8f0',
            background: 'none',
            cursor: 'pointer',
            fontWeight: activeTab === 'vitals' ? '600' : '400',
            color: activeTab === 'vitals' ? '#284394' : '#666',
          }}
        >
          💉 Vitals ({vitalsHistory.length})
        </button>
        <button
          className={`tab-btn ${activeTab === 'plans' ? 'active' : ''}`}
          onClick={() => setActiveTab('plans')}
          style={{
            padding: '0.75rem 1rem',
            border: 'none',
            borderBottom: activeTab === 'plans' ? '3px solid #284394' : '1px solid #e2e8f0',
            background: 'none',
            cursor: 'pointer',
            fontWeight: activeTab === 'plans' ? '600' : '400',
            color: activeTab === 'plans' ? '#284394' : '#666',
          }}
        >
          🎯 Plans ({wellnessPlans.length})
        </button>
      </div>

      {loading ? (
        <p style={{ textAlign: 'center', color: '#666' }}>Loading history...</p>
      ) : activeTab === 'vitals' ? (
        <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
          {vitalsHistory.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#999' }}>No vitals recorded</p>
          ) : (
            vitalsHistory.map((vital, idx) => (
              <div key={idx} style={{ padding: '1rem', backgroundColor: 'white', borderRadius: '6px', marginBottom: '0.75rem', border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem', fontSize: '0.9rem', color: '#666' }}>
                  <span>{new Date(vital.recordedAt).toLocaleDateString()}</span>
                  <span>{new Date(vital.recordedAt).toLocaleTimeString()}</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', fontSize: '0.95rem' }}>
                  {vital.systolic && <span>BP: {vital.systolic}/{vital.diastolic}</span>}
                  {vital.heartRate && <span>HR: {vital.heartRate} bpm</span>}
                  {vital.weightKg && <span>Weight: {vital.weightKg} kg</span>}
                  {vital.temperature && <span>Temp: {vital.temperature}°C</span>}
                  {vital.bmi && <span>BMI: {vital.bmi.toFixed(1)}</span>}
                  {vital.oxygenSaturation && <span>O₂: {vital.oxygenSaturation}%</span>}
                </div>
                {vital.notes && <p style={{ margin: '0.75rem 0 0 0', fontSize: '0.9rem', color: '#555' }}><strong>Notes:</strong> {vital.notes}</p>}
              </div>
            ))
          )}
        </div>
      ) : (
        <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
          {wellnessPlans.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#999' }}>No wellness plans created</p>
          ) : (
            wellnessPlans.map((plan, idx) => (
              <div key={idx} style={{ backgroundColor: 'white', borderRadius: '6px', marginBottom: '0.75rem', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                <div 
                  onClick={() => setExpandedPlanId(expandedPlanId === plan.id ? null : plan.id)}
                  style={{
                    padding: '1rem',
                    cursor: 'pointer',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    backgroundColor: '#f8fafc',
                  }}
                >
                  <div>
                    <p style={{ margin: '0 0 0.25rem 0', fontWeight: '600', color: '#284394' }}>{plan.title || 'Wellness Plan'}</p>
                    <span style={{ fontSize: '0.85rem', padding: '0.25rem 0.5rem', backgroundColor: plan.isActive ? '#d1fae5' : '#fee2e2', color: plan.isActive ? '#065f46' : '#991b1b', borderRadius: '4px' }}>
                      {plan.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <span style={{ fontSize: '1.2rem', color: '#666' }}>
                    {expandedPlanId === plan.id ? '▼' : '▶'}
                  </span>
                </div>
                {expandedPlanId === plan.id && (
                  <div style={{ padding: '1rem', borderTop: '1px solid #e2e8f0' }}>
                    {plan.planText && (
                      <div style={{ marginBottom: '1rem' }}>
                        <p style={{ margin: '0 0 0.5rem 0', fontWeight: '600', color: '#374151' }}>Plan Details:</p>
                        <p style={{ margin: 0, whiteSpace: 'pre-wrap', lineHeight: '1.6', color: '#555', fontSize: '0.95rem' }}>{plan.planText}</p>
                      </div>
                    )}
                    {plan.goals && (
                      <p style={{ margin: '0.5rem 0', fontSize: '0.95rem', color: '#555' }}><strong>Goals:</strong> {plan.goals}</p>
                    )}
                    {plan.duration && (
                      <p style={{ margin: '0.5rem 0', fontSize: '0.95rem', color: '#555' }}><strong>Duration:</strong> {plan.duration} days</p>
                    )}
                    <p style={{ fontSize: '0.85rem', color: '#999', marginTop: '0.75rem' }}>
                      Created: {new Date(plan.createdAt).toLocaleString()}
                    </p>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      <button
        onClick={fetchCustomerHistory}
        disabled={loading}
        style={{
          marginTop: '1rem',
          padding: '0.5rem 1rem',
          backgroundColor: '#284394',
          color: 'white',
          border: 'none',
          borderRadius: '6px',
          cursor: 'pointer',
          fontSize: '0.9rem',
          fontWeight: '600',
        }}
      >
        🔄 Refresh
      </button>
    </div>
  );
}

export default CustomerHistoryPanel;
