import React, { useState } from 'react';
import api from '../../services/api';

function RegisterWalkIn({ onSuccess, capacityAvailable }) {
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formData, setFormData] = useState({
    customerName: '',
    email: '',
    phone: '',
    reason: '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.customerName.trim() || !formData.phone.trim() || !formData.reason.trim()) {
      setError('Please fill in all required fields');
      return;
    }

    if (!capacityAvailable) {
      setError('No available slots for today');
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      const response = await api.post('/api/v1/appointments/walk-in', {
        customerName: formData.customerName,
        email: formData.email,
        phone: formData.phone,
        reason: formData.reason,
        scheduledAt: new Date().toISOString(),
      });

      setSuccess(`Walk-in registered! ID: ${response.data.data.appointmentId}`);
      setFormData({
        customerName: '',
        email: '',
        phone: '',
        reason: '',
      });
      
      setTimeout(() => {
        setShowForm(false);
        setSuccess('');
        if (onSuccess) onSuccess();
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to register walk-in');
    } finally {
      setLoading(false);
    }
  };

  if (!showForm) {
    return (
      <div className="card register-walk-in">
        <h3>🚶 Register Walk-in</h3>
        <button 
          className={`btn btn-primary btn-large ${!capacityAvailable ? 'disabled' : ''}`}
          onClick={() => setShowForm(true)}
          disabled={!capacityAvailable}
        >
          {capacityAvailable ? '+ Register Walk-in' : '❌ No Capacity'}
        </button>
      </div>
    );
  }

  return (
    <div className="card register-walk-in">
      <div className="form-header">
        <h3>🚶 Register Walk-in</h3>
        <button 
          className="close-btn"
          onClick={() => setShowForm(false)}
        >
          ✕
        </button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <form onSubmit={handleSubmit} className="walk-in-form">
        <div className="form-group">
          <label className="form-label">Customer Name *</label>
          <input
            type="text"
            name="customerName"
            value={formData.customerName}
            onChange={handleChange}
            placeholder="Full name"
            disabled={loading}
            required
            className="form-input"
          />
        </div>

        <div className="form-group">
          <label className="form-label">Email</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="Email address"
            disabled={loading}
            className="form-input"
          />
        </div>

        <div className="form-group">
          <label className="form-label">Phone *</label>
          <input
            type="tel"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            placeholder="Phone number"
            disabled={loading}
            required
            className="form-input"
          />
        </div>

        <div className="form-group">
          <label className="form-label">Reason for Visit *</label>
          <textarea
            name="reason"
            value={formData.reason}
            onChange={handleChange}
            placeholder="Reason for visit"
            disabled={loading}
            required
            rows="3"
            className="form-input"
          />
        </div>

        <div className="form-actions">
          <button 
            type="submit"
            className="btn btn-primary"
            disabled={loading}
          >
            {loading ? 'Registering...' : 'Register Walk-in'}
          </button>
          <button 
            type="button"
            className="btn btn-secondary"
            onClick={() => setShowForm(false)}
            disabled={loading}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

export default RegisterWalkIn;
