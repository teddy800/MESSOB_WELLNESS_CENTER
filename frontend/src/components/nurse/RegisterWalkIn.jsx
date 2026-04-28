import { useState, useEffect } from 'react';
import api from '../../services/api';

// Phase 3 Enhanced Walk-in Registration - Updated 2026-04-28
function RegisterWalkIn({ onSuccess, capacityAvailable }) {
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [alert, setAlert] = useState({ type: '', message: '' });
  
  const [formData, setFormData] = useState({
    customerName: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    gender: '',
    reason: '',
    priority: 'MEDIUM',
    medicalHistory: [],
    emergencyContactName: '',
    emergencyContactPhone: '',
  });

  // Load draft from localStorage on mount
  useEffect(() => {
    const savedDraft = localStorage.getItem('walkin_draft');
    if (savedDraft) {
      try {
        setFormData(JSON.parse(savedDraft));
      } catch (err) {
        console.error('Error loading draft:', err);
      }
    }
  }, []);

  // Save draft to localStorage
  useEffect(() => {
    if (showForm) {
      localStorage.setItem('walkin_draft', JSON.stringify(formData));
    }
  }, [formData, showForm]);

  const validateField = (name, value) => {
    const newErrors = { ...errors };

    switch (name) {
      case 'customerName':
        if (!value.trim()) {
          newErrors.customerName = 'Customer name is required';
        } else if (value.trim().length < 2) {
          newErrors.customerName = 'Name must be at least 2 characters';
        } else {
          delete newErrors.customerName;
        }
        break;

      case 'email':
        if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          newErrors.email = 'Please enter a valid email address';
        } else {
          delete newErrors.email;
        }
        break;

      case 'phone':
        if (!value.trim()) {
          newErrors.phone = 'Phone number is required';
        } else if (!/^(\+251|0)[0-9]{9}$/.test(value.replace(/\s/g, ''))) {
          newErrors.phone = 'Please enter a valid Ethiopian phone number';
        } else {
          delete newErrors.phone;
        }
        break;

      case 'dateOfBirth':
        if (value) {
          const age = new Date().getFullYear() - new Date(value).getFullYear();
          if (age < 0 || age > 150) {
            newErrors.dateOfBirth = 'Please enter a valid date of birth';
          } else {
            delete newErrors.dateOfBirth;
          }
        } else {
          delete newErrors.dateOfBirth;
        }
        break;

      case 'reason':
        if (!value.trim()) {
          newErrors.reason = 'Reason for visit is required';
        } else if (value.trim().length < 5) {
          newErrors.reason = 'Please provide more details (at least 5 characters)';
        } else {
          delete newErrors.reason;
        }
        break;

      case 'emergencyContactPhone':
        if (value && !/^(\+251|0)[0-9]{9}$/.test(value.replace(/\s/g, ''))) {
          newErrors.emergencyContactPhone = 'Please enter a valid phone number';
        } else {
          delete newErrors.emergencyContactPhone;
        }
        break;

      default:
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (type === 'checkbox') {
      setFormData(prev => ({
        ...prev,
        medicalHistory: checked
          ? [...prev.medicalHistory, value]
          : prev.medicalHistory.filter(item => item !== value),
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value,
      }));
      
      if (touched[name]) {
        validateField(name, value);
      }
    }

    setAlert({ type: '', message: '' });
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    setTouched(prev => ({ ...prev, [name]: true }));
    validateField(name, value);
  };

  const validateForm = () => {
    const requiredFields = ['customerName', 'phone', 'reason'];
    const newErrors = {};

    requiredFields.forEach(field => {
      if (!formData[field].trim()) {
        newErrors[field] = `${field.replace(/([A-Z])/g, ' $1').trim()} is required`;
      }
    });

    // Validate phone format
    if (formData.phone && !/^(\+251|0)[0-9]{9}$/.test(formData.phone.replace(/\s/g, ''))) {
      newErrors.phone = 'Please enter a valid Ethiopian phone number';
    }

    // Validate email if provided
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Validate emergency contact phone if provided
    if (formData.emergencyContactPhone && !/^(\+251|0)[0-9]{9}$/.test(formData.emergencyContactPhone.replace(/\s/g, ''))) {
      newErrors.emergencyContactPhone = 'Please enter a valid phone number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleClearForm = () => {
    if (window.confirm('Are you sure you want to clear all fields?')) {
      setFormData({
        customerName: '',
        email: '',
        phone: '',
        dateOfBirth: '',
        gender: '',
        reason: '',
        priority: 'MEDIUM',
        medicalHistory: [],
        emergencyContactName: '',
        emergencyContactPhone: '',
      });
      setErrors({});
      setTouched({});
      localStorage.removeItem('walkin_draft');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      setAlert({
        type: 'error',
        message: 'Please fix the errors above before submitting',
      });
      return;
    }

    if (!capacityAvailable) {
      setAlert({
        type: 'error',
        message: 'No available slots for today',
      });
      return;
    }

    try {
      setLoading(true);
      setAlert({ type: '', message: '' });

      const response = await api.post('/api/v1/appointments/walk-in', {
        customerName: formData.customerName,
        email: formData.email || null,
        phone: formData.phone,
        dateOfBirth: formData.dateOfBirth || null,
        gender: formData.gender || null,
        reason: formData.reason,
        priority: formData.priority,
        medicalHistory: formData.medicalHistory,
        emergencyContactName: formData.emergencyContactName || null,
        emergencyContactPhone: formData.emergencyContactPhone || null,
        scheduledAt: new Date().toISOString(),
      });

      setAlert({
        type: 'success',
        message: `Walk-in registered successfully! Appointment ID: ${response.data.data.appointmentId}`,
      });

      // Clear form and draft
      setFormData({
        customerName: '',
        email: '',
        phone: '',
        dateOfBirth: '',
        gender: '',
        reason: '',
        priority: 'MEDIUM',
        medicalHistory: [],
        emergencyContactName: '',
        emergencyContactPhone: '',
      });
      setErrors({});
      setTouched({});
      localStorage.removeItem('walkin_draft');

      setTimeout(() => {
        setShowForm(false);
        setAlert({ type: '', message: '' });
        if (onSuccess) onSuccess();
      }, 2000);
    } catch (err) {
      setAlert({
        type: 'error',
        message: err.response?.data?.message || 'Failed to register walk-in',
      });
    } finally {
      setLoading(false);
    }
  };

  if (!showForm) {
    return (
      <div className="register-walk-in">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
          <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600, color: '#3550A0' }}>
            🚶 Register Walk-in
          </h3>
          <button
            className="walkin-btn-toggle"
            onClick={() => setShowForm(true)}
            disabled={!capacityAvailable}
            style={{ minWidth: '200px' }}
          >
            {capacityAvailable ? '+ Register Walk-in' : '❌ No Capacity'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="register-walk-in form-open" style={{ maxWidth: '100%', overflow: 'auto' }}>
      {/* Form Header */}
      <div className="walkin-form-header">
        <h3>🚶 Register Walk-in Patient</h3>
        <button
          className="walkin-close-btn"
          onClick={() => setShowForm(false)}
          disabled={loading}
        >
          ✕
        </button>
      </div>

      {/* Capacity Status */}
      {capacityAvailable && (
        <div className="walkin-capacity-status available">
          <span className="walkin-capacity-text">✓ Capacity available for today</span>
          <span className="walkin-capacity-badge">Available</span>
        </div>
      )}

      {/* Alert Messages */}
      {alert.message && (
        <div className={`walkin-alert walkin-alert-${alert.type}`}>
          <span>{alert.message}</span>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit}>
        <div className="walkin-form-container">
          {/* Basic Information Section */}
          <div className="walkin-section-title">
            <span>👤</span> Basic Information
          </div>

          {/* Customer Name */}
          <div className="walkin-form-group">
            <label className="walkin-form-label">
              <span className="icon">👤</span>
              Customer Name
              <span className="walkin-required">*</span>
            </label>
            <div className="walkin-input-icon-wrapper">
              <input
                type="text"
                name="customerName"
                value={formData.customerName}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="Full name"
                disabled={loading}
                className={`walkin-form-input ${
                  touched.customerName && errors.customerName ? 'error' : ''
                } ${touched.customerName && !errors.customerName ? 'success' : ''}`}
              />
            </div>
            {touched.customerName && errors.customerName && (
              <span className="walkin-form-error">{errors.customerName}</span>
            )}
          </div>

          {/* Phone */}
          <div className="walkin-form-group">
            <label className="walkin-form-label">
              <span className="icon">📱</span>
              Phone Number
              <span className="walkin-required">*</span>
            </label>
            <div className="walkin-input-icon-wrapper">
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="+251 9XX XXX XXXX"
                disabled={loading}
                className={`walkin-form-input ${
                  touched.phone && errors.phone ? 'error' : ''
                } ${touched.phone && !errors.phone ? 'success' : ''}`}
              />
            </div>
            {touched.phone && errors.phone && (
              <span className="walkin-form-error">{errors.phone}</span>
            )}
          </div>

          {/* Email */}
          <div className="walkin-form-group">
            <label className="walkin-form-label">
              <span className="icon">📧</span>
              Email (Optional)
            </label>
            <div className="walkin-input-icon-wrapper">
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="email@example.com"
                disabled={loading}
                className={`walkin-form-input ${
                  touched.email && errors.email ? 'error' : ''
                } ${touched.email && !errors.email && formData.email ? 'success' : ''}`}
              />
            </div>
            {touched.email && errors.email && (
              <span className="walkin-form-error">{errors.email}</span>
            )}
          </div>

          {/* Date of Birth */}
          <div className="walkin-form-group">
            <label className="walkin-form-label">
              <span className="icon">📅</span>
              Date of Birth (Optional)
            </label>
            <input
              type="date"
              name="dateOfBirth"
              value={formData.dateOfBirth}
              onChange={handleChange}
              onBlur={handleBlur}
              disabled={loading}
              className={`walkin-form-input ${
                touched.dateOfBirth && errors.dateOfBirth ? 'error' : ''
              }`}
            />
            {touched.dateOfBirth && errors.dateOfBirth && (
              <span className="walkin-form-error">{errors.dateOfBirth}</span>
            )}
          </div>

          {/* Gender */}
          <div className="walkin-form-group">
            <label className="walkin-form-label">
              <span className="icon">⚧</span>
              Gender (Optional)
            </label>
            <select
              name="gender"
              value={formData.gender}
              onChange={handleChange}
              disabled={loading}
              className="walkin-form-select"
            >
              <option value="">Select Gender</option>
              <option value="MALE">Male</option>
              <option value="FEMALE">Female</option>
              <option value="OTHER">Other</option>
            </select>
          </div>

          {/* Priority */}
          <div className="walkin-form-group">
            <label className="walkin-form-label">
              <span className="icon">⚡</span>
              Priority Level
            </label>
            <div className="walkin-radio-group">
              <div className="walkin-radio-item">
                <input
                  type="radio"
                  id="priority-low"
                  name="priority"
                  value="LOW"
                  checked={formData.priority === 'LOW'}
                  onChange={handleChange}
                  disabled={loading}
                />
                <label htmlFor="priority-low">Low</label>
              </div>
              <div className="walkin-radio-item">
                <input
                  type="radio"
                  id="priority-medium"
                  name="priority"
                  value="MEDIUM"
                  checked={formData.priority === 'MEDIUM'}
                  onChange={handleChange}
                  disabled={loading}
                />
                <label htmlFor="priority-medium">Medium</label>
              </div>
              <div className="walkin-radio-item">
                <input
                  type="radio"
                  id="priority-high"
                  name="priority"
                  value="HIGH"
                  checked={formData.priority === 'HIGH'}
                  onChange={handleChange}
                  disabled={loading}
                />
                <label htmlFor="priority-high">High</label>
              </div>
            </div>
          </div>

          {/* Visit Information Section */}
          <div className="walkin-section-title">
            <span>🏥</span> Visit Information
          </div>

          {/* Reason for Visit */}
          <div className="walkin-form-group full-width">
            <label className="walkin-form-label">
              <span className="icon">📝</span>
              Reason for Visit
              <span className="walkin-required">*</span>
            </label>
            <textarea
              name="reason"
              value={formData.reason}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="Describe the reason for visit..."
              disabled={loading}
              className={`walkin-form-textarea ${
                touched.reason && errors.reason ? 'error' : ''
              } ${touched.reason && !errors.reason ? 'success' : ''}`}
            />
            {touched.reason && errors.reason && (
              <span className="walkin-form-error">{errors.reason}</span>
            )}
          </div>

          {/* Medical History */}
          <div className="walkin-form-group full-width">
            <label className="walkin-form-label">
              <span className="icon">🏥</span>
              Medical History (Optional)
            </label>
            <div className="walkin-checkbox-group">
              {['Hypertension', 'Diabetes', 'Asthma', 'Heart Disease', 'Allergies', 'Other'].map(
                condition => (
                  <div key={condition} className="walkin-checkbox-item">
                    <input
                      type="checkbox"
                      id={`condition-${condition}`}
                      value={condition}
                      checked={formData.medicalHistory.includes(condition)}
                      onChange={handleChange}
                      disabled={loading}
                    />
                    <label htmlFor={`condition-${condition}`}>{condition}</label>
                  </div>
                )
              )}
            </div>
          </div>

          {/* Emergency Contact Section */}
          <div className="walkin-section-title">
            <span>🆘</span> Emergency Contact (Optional)
          </div>

          {/* Emergency Contact Name */}
          <div className="walkin-form-group">
            <label className="walkin-form-label">
              <span className="icon">👥</span>
              Contact Name
            </label>
            <input
              type="text"
              name="emergencyContactName"
              value={formData.emergencyContactName}
              onChange={handleChange}
              placeholder="Contact person name"
              disabled={loading}
              className="walkin-form-input"
            />
          </div>

          {/* Emergency Contact Phone */}
          <div className="walkin-form-group">
            <label className="walkin-form-label">
              <span className="icon">📞</span>
              Contact Phone
            </label>
            <input
              type="tel"
              name="emergencyContactPhone"
              value={formData.emergencyContactPhone}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="+251 9XX XXX XXXX"
              disabled={loading}
              className={`walkin-form-input ${
                touched.emergencyContactPhone && errors.emergencyContactPhone ? 'error' : ''
              }`}
            />
            {touched.emergencyContactPhone && errors.emergencyContactPhone && (
              <span className="walkin-form-error">{errors.emergencyContactPhone}</span>
            )}
          </div>

          {/* Form Actions */}
          <div className="walkin-form-actions">
            <button
              type="submit"
              className="walkin-btn walkin-btn-primary"
              disabled={loading}
            >
              {loading ? '⏳ Registering...' : '✓ Register Walk-in'}
            </button>
            <button
              type="button"
              className="walkin-btn walkin-btn-secondary"
              onClick={handleClearForm}
              disabled={loading}
            >
              🗑️ Clear Form
            </button>
            <button
              type="button"
              className="walkin-btn walkin-btn-secondary"
              onClick={() => setShowForm(false)}
              disabled={loading}
            >
              ✕ Cancel
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

export default RegisterWalkIn;
