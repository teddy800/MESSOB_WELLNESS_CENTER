import React, { useEffect, useState } from "react";
import api from "../../services/api";
import { suggestWellnessPlan } from "../../utils/wellnessAI";

// Post-Vitals Actions Component
function PostVitalsActions({ vitals, appointmentId, onSuccess, onStartNewRecord, onNavigateToWellness }) {
  const [customerInfo, setCustomerInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const actionsRef = React.useRef(null);

  useEffect(() => {
    // Fetch customer info using userId from vitals
    const fetchCustomer = async () => {
      try {
        const response = await api.get(`/api/v1/users/${vitals.userId}`);
        setCustomerInfo(response.data.data);
      } catch (err) {
        console.error('Failed to fetch customer:', err);
      } finally {
        setLoading(false);
      }
    };

    if (vitals?.userId) {
      fetchCustomer();
    }
  }, [vitals]);

  useEffect(() => {
    // Scroll to actions when they appear
    if (!loading && customerInfo && actionsRef.current) {
      actionsRef.current.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'nearest' 
      });
    }
  }, [loading, customerInfo]);

  if (loading || !customerInfo) {
    return null;
  }

  return (
    <div 
      ref={actionsRef}
      style={{
        marginTop: '1.5rem',
        padding: '1.5rem',
        backgroundColor: '#F0FDF4',
        border: '2px solid #10B981',
        borderRadius: '8px',
        animation: 'slideDown 0.3s ease-out',
      }}
    >
      <p style={{ margin: '0 0 1rem 0', color: '#065F46', fontWeight: 600 }}>
        ✓ Vitals recorded successfully for {customerInfo.fullName}!
        {appointmentId && ' (Appointment)'}
        {!appointmentId && ' (Walk-in)'}
      </p>
      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
        <button
          onClick={() => {
            if (onNavigateToWellness) {
              onNavigateToWellness({
                customerId: customerInfo.id,
                customerName: customerInfo.fullName,
                appointmentId: appointmentId || null,
                vitals: vitals,
              });
            }
          }}
          className="btn btn-primary"
          style={{ flex: 1, minWidth: '200px' }}
        >
          📋 Create Wellness Plan
        </button>
        <button
          onClick={() => {
            const suggested = suggestWellnessPlan(vitals);
            if (onNavigateToWellness) {
              onNavigateToWellness({
                customerId: customerInfo.id,
                customerName: customerInfo.fullName,
                appointmentId: appointmentId || null,
                vitals: vitals,
                suggestedPlan: suggested,
              });
            }
          }}
          className="btn btn-primary"
          style={{ flex: 1, minWidth: '200px', backgroundColor: '#F59E0B' }}
        >
          🤖 Generate AI-Suggested Plan
        </button>
        <button
          onClick={onStartNewRecord}
          className="btn btn-secondary"
          style={{ flex: 1, minWidth: '200px' }}
        >
          ➕ Record New Vitals
        </button>
      </div>
    </div>
  );
}

function VitalsEntry({ customerId, appointmentId, onSuccess, onNavigateToWellness }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [customerIdInput, setCustomerIdInput] = useState(customerId || "");
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [showSearch, setShowSearch] = useState(false);
  const [showPostVitalsActions, setShowPostVitalsActions] = useState(false);
  const [lastRecordedVitals, setLastRecordedVitals] = useState(null);
  const [currentAppointmentId, setCurrentAppointmentId] = useState(appointmentId || null);
  
  // Search states
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState('');
  
  const [vitals, setVitals] = useState({
    systolicBP: "",
    diastolicBP: "",
    heartRate: "",
    bmi: "",
    glucose: "",
    temperature: "",
    oxygenSaturation: "",
    notes: "",
  });

  const [alerts, setAlerts] = useState({});

  useEffect(() => {
    setCustomerIdInput(customerId || "");
    setCurrentAppointmentId(appointmentId || null);
  }, [customerId, appointmentId]);

  const handleCustomerSelect = (customer) => {
    setSelectedCustomer(customer);
    setCustomerIdInput(customer.id);
    setShowSearch(false);
    setSearchResults([]);
    setSearchTerm('');
    setError('');
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    e.stopPropagation(); // Prevent bubbling to parent form
    
    if (!searchTerm.trim()) {
      setSearchError('Please enter a customer ID, name, or email');
      return;
    }

    try {
      setSearching(true);
      setSearchError('');
      
      // Search by ID first (exact match)
      try {
        const userResponse = await api.get(`/api/v1/users/${searchTerm.trim()}`);
        if (userResponse.data.data) {
          setSearchResults([userResponse.data.data]);
          setSearching(false);
          return;
        }
      } catch (err) {
        // Not found by ID, continue to search by name/email
      }

      // Search by name or email (partial match)
      const response = await api.get('/api/v1/users', {
        params: { search: searchTerm.trim() }
      });
      
      const users = response.data.data || [];
      setSearchResults(users);
      
      if (users.length === 0) {
        setSearchError('No customers found');
      }
    } catch (err) {
      setSearchError('Failed to search customers');
      console.error(err);
    } finally {
      setSearching(false);
    }
  };

  const getRiskLevel = (value, type) => {
    let level = "normal";
    let color = "green";

    if (type === "systolicBP") {
      if (value < 120) level = "normal";
      else if (value < 140) {
        level = "caution";
        color = "yellow";
      } else {
        level = "high";
        color = "red";
      }
    } else if (type === "diastolicBP") {
      if (value < 80) level = "normal";
      else if (value < 90) {
        level = "caution";
        color = "yellow";
      } else {
        level = "high";
        color = "red";
      }
    } else if (type === "heartRate") {
      if (value >= 60 && value <= 100) level = "normal";
      else if ((value >= 50 && value < 60) || (value > 100 && value <= 120)) {
        level = "caution";
        color = "yellow";
      } else {
        level = "high";
        color = "red";
      }
    } else if (type === "bmi") {
      if (value >= 18.5 && value < 25) level = "normal";
      else if (value < 18.5 || (value >= 25 && value < 30)) {
        level = "caution";
        color = "yellow";
      } else {
        level = "high";
        color = "red";
      }
    } else if (type === "glucose") {
      if (value < 100) level = "normal";
      else if (value < 126) {
        level = "caution";
        color = "yellow";
      } else {
        level = "high";
        color = "red";
      }
    } else if (type === "temperature") {
      if (value >= 36.5 && value <= 37.5) level = "normal";
      else if ((value >= 35 && value < 36.5) || (value > 37.5 && value <= 38.5)) {
        level = "caution";
        color = "yellow";
      } else {
        level = "high";
        color = "red";
      }
    } else if (type === "oxygenSaturation") {
      if (value >= 95) level = "normal";
      else if (value >= 90) {
        level = "caution";
        color = "yellow";
      } else {
        level = "high";
        color = "red";
      }
    }

    return { level, color };
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setVitals((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear error message when field changes
    if (error) {
      setError("");
    }

    // Show risk indicators only (no validation, no blocking)
    if (name !== 'notes' && value && value.trim() !== '') {
      const numValue = parseFloat(value);
      if (!isNaN(numValue)) {
        const risk = getRiskLevel(numValue, name);
        setAlerts((prev) => ({
          ...prev,
          [name]: risk,
        }));
      }
    } else {
      // Clear alert if field is empty
      setAlerts((prev) => {
        const newAlerts = { ...prev };
        delete newAlerts[name];
        return newAlerts;
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const targetCustomerId = customerIdInput.trim() || customerId;

    if (!targetCustomerId) {
      setError("Customer ID is required");
      return;
    }

    // No validation - nurses know what they're doing
    // Just submit the vitals directly

    try {
      setLoading(true);
      setError("");

      const response = await api.post("/api/v1/vitals", {
        userId: targetCustomerId,
        systolicBP: vitals.systolicBP ? parseInt(vitals.systolicBP) : null,
        diastolicBP: vitals.diastolicBP ? parseInt(vitals.diastolicBP) : null,
        heartRate: vitals.heartRate ? parseInt(vitals.heartRate) : null,
        bmi: vitals.bmi ? parseFloat(vitals.bmi) : null,
        glucose: vitals.glucose ? parseInt(vitals.glucose) : null,
        temperature: vitals.temperature ? parseFloat(vitals.temperature) : null,
        oxygenSaturation: vitals.oxygenSaturation
          ? parseInt(vitals.oxygenSaturation)
          : null,
        notes: vitals.notes,
      });

      setSuccess("Vitals recorded successfully!");
      
      // Store vitals and customer BEFORE resetting form
      const recordedVitals = response.data.data;
      
      setLastRecordedVitals(recordedVitals);
      setShowPostVitalsActions(true);
      
      // Now reset form
      setVitals({
        systolicBP: "",
        diastolicBP: "",
        heartRate: "",
        bmi: "",
        glucose: "",
        temperature: "",
        oxygenSaturation: "",
        notes: "",
      });
      setAlerts({});

      // Keep success message and actions visible until user takes action
      // No auto-hide timeout
    } catch (err) {
      setError(err.response?.data?.message || "Failed to record vitals");
    } finally {
      setLoading(false);
    }
  };

  const handleStartNewRecord = () => {
    setSuccess("");
    setShowPostVitalsActions(false);
    setLastRecordedVitals(null);
    setSelectedCustomer(null);
    setCustomerIdInput('');
  };

  return (
    <div className="card vitals-entry">
      <h3>💉 Record Vitals</h3>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <form onSubmit={handleSubmit} className="vitals-form">
        <div className="form-group">
          <label className="form-label">Customer</label>
          {selectedCustomer ? (
            <div className="selected-customer">
              <div className="customer-info">
                <p><strong>{selectedCustomer.fullName}</strong></p>
                <p>ID: {selectedCustomer.id}</p>
                <p>Email: {selectedCustomer.email}</p>
              </div>
              <button
                type="button"
                className="btn btn-small btn-secondary"
                onClick={() => {
                  setSelectedCustomer(null);
                  setCustomerIdInput('');
                  setShowSearch(true);
                }}
              >
                Change
              </button>
            </div>
          ) : (
            <>
              <div className="customer-input-group">
                <input
                  type="text"
                  name="customerId"
                  value={customerIdInput}
                  onChange={(e) => {
                    setCustomerIdInput(e.target.value);
                    if (error) {
                      setError("");
                    }
                  }}
                  placeholder="Enter customer ID or search below"
                  disabled={loading}
                  className="form-input"
                  required
                />
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowSearch(!showSearch)}
                  disabled={loading}
                >
                  {showSearch ? '✕ Close' : '🔍 Search'}
                </button>
              </div>
              
              {showSearch && (
                <div className="inline-search">
                  <div className="search-form-wrapper">
                    <div className="search-input-group">
                      <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => {
                          setSearchTerm(e.target.value);
                          setSearchError('');
                        }}
                        placeholder="Search by name or email..."
                        className="form-input"
                        disabled={searching}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleSearch(e);
                          }
                        }}
                      />
                      <button 
                        type="button"
                        className="btn btn-primary btn-small"
                        disabled={searching}
                        onClick={handleSearch}
                      >
                        {searching ? 'Searching...' : 'Search'}
                      </button>
                    </div>
                  </div>

                  {searchError && <div className="alert alert-error">{searchError}</div>}

                  {searchResults.length > 0 && (
                    <div className="search-results-inline">
                      <p className="results-count">Found {searchResults.length} customer(s)</p>
                      <div className="results-list-inline">
                        {searchResults.map((customer) => (
                          <div key={customer.id} className="result-item-inline">
                            <div className="customer-info-inline">
                              <p className="customer-name-inline">{customer.fullName}</p>
                              <p className="customer-details-inline">
                                Email: {customer.email}
                              </p>
                              {customer.phone && (
                                <p className="customer-details-inline">Phone: {customer.phone}</p>
                              )}
                            </div>
                            <button
                              type="button"
                              className="btn btn-small btn-primary"
                              onClick={() => handleCustomerSelect(customer)}
                            >
                              Select
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        <div className="vitals-grid">
          <div className="form-group">
            <label className="form-label">Systolic BP</label>
            <div className="input-with-alert">
              <input
                type="number"
                name="systolicBP"
                value={vitals.systolicBP}
                onChange={handleChange}
                placeholder="mmHg"
                disabled={loading}
                className="form-input"
              />
              {alerts.systolicBP && (
                <span className={`risk-alert risk-${alerts.systolicBP.color}`}>
                  {alerts.systolicBP.level}
                </span>
              )}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Diastolic BP</label>
            <div className="input-with-alert">
              <input
                type="number"
                name="diastolicBP"
                value={vitals.diastolicBP}
                onChange={handleChange}
                placeholder="mmHg"
                disabled={loading}
                className="form-input"
              />
              {alerts.diastolicBP && (
                <span className={`risk-alert risk-${alerts.diastolicBP.color}`}>
                  {alerts.diastolicBP.level}
                </span>
              )}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Heart Rate</label>
            <div className="input-with-alert">
              <input
                type="number"
                name="heartRate"
                value={vitals.heartRate}
                onChange={handleChange}
                placeholder="bpm"
                disabled={loading}
                className="form-input"
              />
              {alerts.heartRate && (
                <span className={`risk-alert risk-${alerts.heartRate.color}`}>
                  {alerts.heartRate.level}
                </span>
              )}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">BMI</label>
            <div className="input-with-alert">
              <input
                type="number"
                step="0.1"
                name="bmi"
                value={vitals.bmi}
                onChange={handleChange}
                placeholder="kg/m²"
                disabled={loading}
                className="form-input"
              />
              {alerts.bmi && (
                <span className={`risk-alert risk-${alerts.bmi.color}`}>
                  {alerts.bmi.level}
                </span>
              )}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Glucose</label>
            <div className="input-with-alert">
              <input
                type="number"
                name="glucose"
                value={vitals.glucose}
                onChange={handleChange}
                placeholder="mg/dL"
                disabled={loading}
                className="form-input"
              />
              {alerts.glucose && (
                <span className={`risk-alert risk-${alerts.glucose.color}`}>
                  {alerts.glucose.level}
                </span>
              )}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Temperature</label>
            <div className="input-with-alert">
              <input
                type="number"
                step="0.1"
                name="temperature"
                value={vitals.temperature}
                onChange={handleChange}
                placeholder="°C"
                disabled={loading}
                className="form-input"
              />
              {alerts.temperature && (
                <span className={`risk-alert risk-${alerts.temperature.color}`}>
                  {alerts.temperature.level}
                </span>
              )}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">O₂ Saturation</label>
            <div className="input-with-alert">
              <input
                type="number"
                name="oxygenSaturation"
                value={vitals.oxygenSaturation}
                onChange={handleChange}
                placeholder="%"
                disabled={loading}
                className="form-input"
              />
              {alerts.oxygenSaturation && (
                <span
                  className={`risk-alert risk-${alerts.oxygenSaturation.color}`}
                >
                  {alerts.oxygenSaturation.level}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Notes</label>
          <textarea
            name="notes"
            value={vitals.notes}
            onChange={handleChange}
            placeholder="Additional notes (optional)"
            disabled={loading}
            rows="3"
            className="form-input"
          />
        </div>

        <button
          type="submit"
          className="btn btn-primary btn-large"
          disabled={loading}
        >
          {loading ? "Recording..." : "Submit Vitals"}
        </button>
      </form>

      {/* Post-Vitals Action Buttons */}
      {showPostVitalsActions && lastRecordedVitals && (
        <PostVitalsActions
          vitals={lastRecordedVitals}
          appointmentId={currentAppointmentId}
          onSuccess={onSuccess}
          onStartNewRecord={handleStartNewRecord}
          onNavigateToWellness={onNavigateToWellness}
        />
      )}
    </div>
  );
}

export default VitalsEntry;
