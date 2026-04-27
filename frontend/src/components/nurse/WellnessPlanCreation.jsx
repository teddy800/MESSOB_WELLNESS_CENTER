import React, { useState } from 'react';
import api from '../../services/api';
import WellnessPlanTemplates from './WellnessPlanTemplates';

function WellnessPlanCreation({ customerId, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showTemplates, setShowTemplates] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState(customerId || '');
  const [selectedCustomerName, setSelectedCustomerName] = useState('');
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
  };

  const handleTemplateSelect = (template) => {
    setFormData({
      title: template.title,
      nutritionRecommendations: template.nutritionRecommendations,
      exerciseRecommendations: template.exerciseRecommendations,
      stressManagementAdvice: template.stressManagementAdvice,
      goals: template.goals.join('\n'),
      duration: template.duration.toString(),
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedCustomerId) {
      setError('Please select a customer first');
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
        userId: selectedCustomerId,
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
      setSelectedCustomerId('');
      setSelectedCustomerName('');

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

      {/* Customer Search Section */}
      {!selectedCustomerId ? (
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
      ) : (
        <div className="customer-id-display">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <strong>Selected Customer:</strong> {selectedCustomerName}
              <br />
              <small style={{ color: '#666' }}>ID: {selectedCustomerId}</small>
            </div>
            <button
              type="button"
              onClick={handleClearCustomer}
              className="btn btn-small btn-secondary"
            >
              Change Customer
            </button>
          </div>
        </div>
      )}

      <div className="template-button-container">
        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => setShowTemplates(true)}
          disabled={!selectedCustomerId}
        >
          📋 Use Template
        </button>
      </div>

      {showTemplates && (
        <WellnessPlanTemplates
          onSelectTemplate={handleTemplateSelect}
          onClose={() => setShowTemplates(false)}
        />
      )}

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
          disabled={loading || !selectedCustomerId}
        >
          {loading ? 'Creating...' : '✓ Create Wellness Plan'}
        </button>
      </form>
    </div>
  );
}

export default WellnessPlanCreation;
