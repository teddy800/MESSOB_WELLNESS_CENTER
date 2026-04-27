import React, { useState, useEffect } from 'react';
import api from '../../services/api';

function CustomerHistoryView({ customerId }) {
  const [vitalsHistory, setVitalsHistory] = useState([]);
  const [wellnessPlans, setWellnessPlans] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('vitals');
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState(customerId || '');
  const [selectedCustomerName, setSelectedCustomerName] = useState('');

  useEffect(() => {
    if (selectedCustomerId) {
      fetchCustomerHistory();
    }
  }, [selectedCustomerId]);

  const handleSearch = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!searchTerm.trim()) {
      setError('Please enter a search term');
      return;
    }

    try {
      setSearching(true);
      setError('');
      const response = await api.get(`/api/v1/users?search=${encodeURIComponent(searchTerm)}`);
      setSearchResults(response.data.data || []);
      
      if (response.data.data.length === 0) {
        setError('No customers found');
      }
    } catch (err) {
      setError('Failed to search customers');
      console.error(err);
    } finally {
      setSearching(false);
    }
  };

  const handleSelectCustomer = (customer) => {
    setSelectedCustomerId(customer.id);
    setSelectedCustomerName(customer.fullName);
    setSearchResults([]);
    setSearchTerm('');
    setError('');
  };

  const handleClearCustomer = () => {
    setSelectedCustomerId('');
    setSelectedCustomerName('');
    setVitalsHistory([]);
    setWellnessPlans([]);
  };

  const fetchCustomerHistory = async () => {
    try {
      setLoading(true);
      setError('');

      // Fetch vitals history
      const vitalsResponse = await api.get(`/api/v1/vitals/${selectedCustomerId}`);
      const vitalsData = vitalsResponse.data.data;
      setVitalsHistory(Array.isArray(vitalsData) ? vitalsData : []);

      // Fetch wellness plans
      const plansResponse = await api.get(`/api/v1/plans/${selectedCustomerId}`);
      const plansData = plansResponse.data.data;
      setWellnessPlans(Array.isArray(plansData) ? plansData : []);
    } catch (err) {
      setError('Failed to load customer history');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (!selectedCustomerId) {
    return (
      <div className="card customer-history">
        <h3>📚 Customer History</h3>
        
        <div className="inline-search">
          <h4>🔍 Search Customer</h4>
          <p style={{ fontSize: '0.9rem', color: '#666', marginBottom: '1rem' }}>
            Search by name, email, or customer ID
          </p>
          
          <form onSubmit={handleSearch} className="search-form">
            <div className="search-input-group">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Enter name, email, or ID..."
                className="form-input"
                disabled={searching}
              />
              <button
                type="button"
                onClick={handleSearch}
                className="btn btn-primary"
                disabled={searching || !searchTerm.trim()}
              >
                {searching ? 'Searching...' : '🔍 Search'}
              </button>
            </div>
          </form>

          {error && <div className="alert alert-error">{error}</div>}

          {searchResults.length > 0 && (
            <div className="search-results-inline">
              <p className="results-count">{searchResults.length} customer(s) found</p>
              <div className="results-list-inline">
                {searchResults.map((customer) => (
                  <div key={customer.id} className="result-item-inline">
                    <div className="customer-info-inline">
                      <p className="customer-name-inline">{customer.fullName}</p>
                      <p className="customer-details-inline">Email: {customer.email}</p>
                      <p className="customer-details-inline">ID: {customer.id}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleSelectCustomer(customer)}
                      className="btn btn-small btn-primary"
                    >
                      Select
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="card customer-history">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h3>📚 Customer History</h3>
        <button
          type="button"
          onClick={handleClearCustomer}
          className="btn btn-small btn-secondary"
        >
          Change Customer
        </button>
      </div>

      <div className="customer-id-display" style={{ marginBottom: '1rem' }}>
        <strong>Customer:</strong> {selectedCustomerName}
        <br />
        <small style={{ color: '#666' }}>ID: {selectedCustomerId}</small>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="history-tabs">
        <button
          className={`tab-btn ${activeTab === 'vitals' ? 'active' : ''}`}
          onClick={() => setActiveTab('vitals')}
        >
          💉 Vitals ({vitalsHistory.length})
        </button>
        <button
          className={`tab-btn ${activeTab === 'plans' ? 'active' : ''}`}
          onClick={() => setActiveTab('plans')}
        >
          🎯 Plans ({wellnessPlans.length})
        </button>
      </div>

      {loading ? (
        <p className="loading-text">Loading history...</p>
      ) : activeTab === 'vitals' ? (
        <div className="vitals-history-list">
          {vitalsHistory.length === 0 ? (
            <p className="empty-text">No vitals recorded</p>
          ) : (
            vitalsHistory.map((vital, idx) => (
              <div key={idx} className="history-item">
                <div className="history-item-header">
                  <span className="history-date">
                    {new Date(vital.recordedAt).toLocaleDateString()}
                  </span>
                  <span className="history-time">
                    {new Date(vital.recordedAt).toLocaleTimeString()}
                  </span>
                </div>
                <div className="history-item-content">
                  <div className="vital-row">
                    {vital.systolicBP && (
                      <span>BP: {vital.systolicBP}/{vital.diastolicBP}</span>
                    )}
                    {vital.heartRate && (
                      <span>HR: {vital.heartRate} bpm</span>
                    )}
                    {vital.bmi && (
                      <span>BMI: {vital.bmi.toFixed(1)}</span>
                    )}
                  </div>
                  <div className="vital-row">
                    {vital.glucose && (
                      <span>Glucose: {vital.glucose} mg/dL</span>
                    )}
                    {vital.temperature && (
                      <span>Temp: {vital.temperature}°C</span>
                    )}
                    {vital.oxygenSaturation && (
                      <span>O₂: {vital.oxygenSaturation}%</span>
                    )}
                  </div>
                  {vital.notes && (
                    <p className="vital-notes"><strong>Notes:</strong> {vital.notes}</p>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        <div className="wellness-plans-list">
          {wellnessPlans.length === 0 ? (
            <p className="empty-text">No wellness plans created</p>
          ) : (
            wellnessPlans.map((plan, idx) => (
              <div key={idx} className="history-item">
                <div className="history-item-header">
                  <span className="plan-title">{plan.title}</span>
                  <span className={`status-badge ${plan.isActive ? 'status-active' : 'status-inactive'}`}>
                    {plan.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div className="history-item-content">
                  {plan.nutritionRecommendations && (
                    <p><strong>🥗 Nutrition:</strong> {plan.nutritionRecommendations}</p>
                  )}
                  {plan.exerciseRecommendations && (
                    <p><strong>🏃 Exercise:</strong> {plan.exerciseRecommendations}</p>
                  )}
                  {plan.stressManagementAdvice && (
                    <p><strong>🧘 Stress:</strong> {plan.stressManagementAdvice}</p>
                  )}
                  {plan.duration && (
                    <p><strong>Duration:</strong> {plan.duration} days</p>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      <button
        className="btn btn-secondary btn-small"
        onClick={fetchCustomerHistory}
        disabled={loading}
      >
        🔄 Refresh
      </button>
    </div>
  );
}

export default CustomerHistoryView;
