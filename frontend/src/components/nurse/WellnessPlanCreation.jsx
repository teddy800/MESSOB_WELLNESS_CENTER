import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import WellnessPlanTemplates from './WellnessPlanTemplates';

function WellnessPlanCreation({ customerId, onSuccess, appointmentId, onBackToQueue }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showTemplates, setShowTemplates] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState(customerId || '');
  const [selectedCustomerName, setSelectedCustomerName] = useState('');
  const [latestVitals, setLatestVitals] = useState(null);
  const [vitalsLoading, setVitalsLoading] = useState(false);
  const [showVitalsCollapsed, setShowVitalsCollapsed] = useState(false);
  const [suggestedPlan, setSuggestedPlan] = useState(null);
  const [createdPlanId, setCreatedPlanId] = useState(null);
  const [generatingPDF, setGeneratingPDF] = useState(false);
  const successRef = React.useRef(null);
  const [formData, setFormData] = useState({
    title: '',
    nutritionRecommendations: '',
    exerciseRecommendations: '',
    stressManagementAdvice: '',
    goals: '',
    duration: '30',
  });

  useEffect(() => {
    // Load suggested plan and vitals from sessionStorage if available
    const storedPlan = sessionStorage.getItem('suggestedWellnessPlan');
    const storedVitals = sessionStorage.getItem('latestVitals');
    
    if (storedPlan) {
      const plan = JSON.parse(storedPlan);
      setSuggestedPlan(plan);
      setFormData({
        title: plan.title,
        nutritionRecommendations: plan.nutrition,
        exerciseRecommendations: plan.exercise,
        stressManagementAdvice: plan.stressManagement,
        goals: plan.goals,
        duration: '30',
      });
      sessionStorage.removeItem('suggestedWellnessPlan');
    }
    
    if (storedVitals) {
      setLatestVitals(JSON.parse(storedVitals));
      sessionStorage.removeItem('latestVitals');
    }
  }, []);

  useEffect(() => {
    // Fetch latest vitals when customer is selected
    if (selectedCustomerId && !latestVitals) {
      fetchLatestVitals();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCustomerId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const fetchLatestVitals = async () => {
    try {
      setVitalsLoading(true);
      const response = await api.get(`/api/v1/vitals/latest/${selectedCustomerId}`);
      if (response.data.data) {
        setLatestVitals(response.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch vitals:', err);
    } finally {
      setVitalsLoading(false);
    }
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
      setCreatedPlanId(response.data.data.id);
      
      // Scroll to success message
      setTimeout(() => {
        if (successRef.current) {
          successRef.current.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center' 
          });
        }
      }, 100);
      
      // Hide success message after 5 seconds, but keep PDF button visible
      setTimeout(() => {
        setSuccess('');
      }, 5000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create wellness plan');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = async () => {
    try {
      setGeneratingPDF(true);
      const response = await api.post(
        `/api/v1/reports/combined/${selectedCustomerId}?includeVitals=true&includeWellnessPlan=true`,
        {},
        { responseType: 'blob' }
      );
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `health-report-${selectedCustomerId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      // Keep the buttons visible - don't reset form
    } catch (err) {
      console.error('Failed to download PDF:', err);
      setError('Failed to generate PDF');
    } finally {
      setGeneratingPDF(false);
    }
  };

  return (
    <div className="card wellness-plan-creation">
      <h3>🎯 Create Wellness Plan</h3>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div ref={successRef} className="alert alert-success">{success}</div>}
      
      {/* PDF Download and Back to Queue Buttons */}
      {createdPlanId && !success && (
        <div style={{
          marginBottom: '1.5rem',
          padding: '1rem',
          backgroundColor: '#EFF6FF',
          border: '2px solid #3550A0',
          borderRadius: '8px',
        }}>
          <p style={{ margin: '0 0 1rem 0', color: '#1E40AF', fontWeight: 600 }}>
            📄 Your wellness plan is ready!
          </p>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={handleDownloadPDF}
              disabled={generatingPDF}
              className="btn btn-primary"
              style={{
                cursor: generatingPDF ? 'not-allowed' : 'pointer',
                opacity: generatingPDF ? 0.6 : 1,
                flex: 1,
                minWidth: '200px',
              }}
            >
              {generatingPDF ? '📄 Generating PDF...' : '📄 Download Health Report PDF'}
            </button>
            {onBackToQueue && (
              <button
                onClick={onBackToQueue}
                className="btn btn-secondary"
                style={{
                  flex: 1,
                  minWidth: '150px',
                }}
              >
                ← Back to Queue
              </button>
            )}
          </div>
        </div>
      )}

      {/* Latest Vitals Display */}
      {latestVitals && (
        <div style={{
          marginBottom: '1.5rem',
          padding: '1rem',
          backgroundColor: '#F9FAFB',
          border: '2px solid #E5E7EB',
          borderRadius: '8px',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h4 style={{ margin: 0, color: '#3550A0', fontSize: '1rem', fontWeight: 600 }}>
              📊 Latest Vitals
            </h4>
            <button
              type="button"
              onClick={() => setShowVitalsCollapsed(!showVitalsCollapsed)}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontSize: '1.2rem',
                color: '#6B7280',
              }}
            >
              {showVitalsCollapsed ? '▶' : '▼'}
            </button>
          </div>
          
          {!showVitalsCollapsed && (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
              gap: '1rem',
            }}>
              {latestVitals.systolicBP && (
                <div style={{ padding: '0.75rem', backgroundColor: '#FFFFFF', borderRadius: '6px', border: '1px solid #E5E7EB' }}>
                  <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.8rem', color: '#6B7280', fontWeight: 600 }}>BP</p>
                  <p style={{ margin: 0, fontSize: '1rem', fontWeight: 600, color: '#1F2937' }}>
                    {latestVitals.systolicBP}/{latestVitals.diastolicBP}
                  </p>
                </div>
              )}
              {latestVitals.heartRate && (
                <div style={{ padding: '0.75rem', backgroundColor: '#FFFFFF', borderRadius: '6px', border: '1px solid #E5E7EB' }}>
                  <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.8rem', color: '#6B7280', fontWeight: 600 }}>Heart Rate</p>
                  <p style={{ margin: 0, fontSize: '1rem', fontWeight: 600, color: '#1F2937' }}>{latestVitals.heartRate} bpm</p>
                </div>
              )}
              {latestVitals.bmi && (
                <div style={{ padding: '0.75rem', backgroundColor: '#FFFFFF', borderRadius: '6px', border: '1px solid #E5E7EB' }}>
                  <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.8rem', color: '#6B7280', fontWeight: 600 }}>BMI</p>
                  <p style={{ margin: 0, fontSize: '1rem', fontWeight: 600, color: '#1F2937' }}>{latestVitals.bmi.toFixed(1)}</p>
                </div>
              )}
              {latestVitals.glucose && (
                <div style={{ padding: '0.75rem', backgroundColor: '#FFFFFF', borderRadius: '6px', border: '1px solid #E5E7EB' }}>
                  <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.8rem', color: '#6B7280', fontWeight: 600 }}>Glucose</p>
                  <p style={{ margin: 0, fontSize: '1rem', fontWeight: 600, color: '#1F2937' }}>{latestVitals.glucose} mg/dL</p>
                </div>
              )}
              {latestVitals.temperature && (
                <div style={{ padding: '0.75rem', backgroundColor: '#FFFFFF', borderRadius: '6px', border: '1px solid #E5E7EB' }}>
                  <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.8rem', color: '#6B7280', fontWeight: 600 }}>Temp</p>
                  <p style={{ margin: 0, fontSize: '1rem', fontWeight: 600, color: '#1F2937' }}>{latestVitals.temperature}°C</p>
                </div>
              )}
              {latestVitals.oxygenSaturation && (
                <div style={{ padding: '0.75rem', backgroundColor: '#FFFFFF', borderRadius: '6px', border: '1px solid #E5E7EB' }}>
                  <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.8rem', color: '#6B7280', fontWeight: 600 }}>O₂</p>
                  <p style={{ margin: 0, fontSize: '1rem', fontWeight: 600, color: '#1F2937' }}>{latestVitals.oxygenSaturation}%</p>
                </div>
              )}
            </div>
          )}
          
          <p style={{ margin: '0.75rem 0 0 0', fontSize: '0.8rem', color: '#6B7280' }}>
            Recorded: {new Date(latestVitals.recordedAt).toLocaleString()}
          </p>
          
          {suggestedPlan && (
            <p style={{ margin: '0.75rem 0 0 0', fontSize: '0.85rem', color: '#0C4A6E', backgroundColor: '#DBEAFE', padding: '0.5rem', borderRadius: '4px' }}>
              💡 AI-suggested plan based on vitals. Please review and edit as needed.
            </p>
          )}
        </div>
      )}

      {vitalsLoading && (
        <div style={{ padding: '1rem', textAlign: 'center', color: '#6B7280' }}>
          Loading vitals...
        </div>
      )}

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
