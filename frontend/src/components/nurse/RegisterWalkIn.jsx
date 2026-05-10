import React, { useState } from 'react';
import api from '../../services/api';

function RegisterWalkIn({ onSuccess }) {
  const [step, setStep] = useState('search'); // search, register, vitals
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [registering, setRegistering] = useState(false);
  const [alert, setAlert] = useState({ type: '', message: '' });

  const [registerForm, setRegisterForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    gender: '',
  });

  const [registerErrors, setRegisterErrors] = useState({});

  // Task 3.1: Search for existing patients
  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchTerm.trim()) {
      setAlert({ type: 'error', message: 'Please enter a search term' });
      return;
    }

    try {
      setSearching(true);
      setAlert({ type: '', message: '' });
      const response = await api.get(`/api/v1/users?search=${encodeURIComponent(searchTerm)}`);
      setSearchResults(response.data.data || []);
      
      if (!response.data.data || response.data.data.length === 0) {
        setAlert({ type: 'info', message: 'No patients found. Register a new external patient.' });
      }
    } catch (err) {
      setAlert({ type: 'error', message: 'Failed to search patients' });
      console.error(err);
    } finally {
      setSearching(false);
    }
  };

  // Task 3.2: Select patient and navigate to vitals
  const handleSelectPatient = (patient) => {
    setSelectedPatient(patient);
    setAlert({ type: 'success', message: `Selected: ${patient.fullName}` });
    // Trigger navigation to vitals tab via parent
    if (onSuccess) {
      onSuccess({ patientId: patient.id, action: 'recordVitals' });
    }
  };

  // Task 3.3: Open registration modal
  const handleOpenRegisterModal = () => {
    setShowRegisterModal(true);
    setRegisterForm({
      fullName: '',
      email: '',
      phone: '',
      dateOfBirth: '',
      gender: '',
    });
    setRegisterErrors({});
  };

  // Validate registration form
  const validateRegisterForm = () => {
    const errors = {};
    
    if (!registerForm.fullName.trim()) {
      errors.fullName = 'Full name is required';
    }
    
    if (!registerForm.phone.trim()) {
      errors.phone = 'Phone number is required';
    } else if (!/^(\+251|0)[0-9]{9}$/.test(registerForm.phone.replace(/\s/g, ''))) {
      errors.phone = 'Invalid Ethiopian phone number';
    }
    
    if (registerForm.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(registerForm.email)) {
      errors.email = 'Invalid email address';
    }
    
    if (!registerForm.dateOfBirth) {
      errors.dateOfBirth = 'Date of birth is required';
    }
    
    if (!registerForm.gender) {
      errors.gender = 'Gender is required';
    }

    setRegisterErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Task 3.4 & 3.5: Register external patient
  const handleRegisterPatient = async (e) => {
    e.preventDefault();

    if (!validateRegisterForm()) {
      setAlert({ type: 'error', message: 'Please fix the errors below' });
      return;
    }

    try {
      setRegistering(true);
      setAlert({ type: '', message: '' });

      const response = await api.post('/api/v1/patients/external', {
        fullName: registerForm.fullName,
        email: registerForm.email || null,
        phone: registerForm.phone,
        dateOfBirth: registerForm.dateOfBirth,
        gender: registerForm.gender,
      });

      const newPatient = response.data.data;
      setAlert({ type: 'success', message: `Patient registered: ${newPatient.fullName}` });
      setShowRegisterModal(false);
      setSelectedPatient(newPatient);

      // Navigate to vitals entry
      setTimeout(() => {
        if (onSuccess) {
          onSuccess({ patientId: newPatient.id, action: 'recordVitals' });
        }
      }, 1500);
    } catch (err) {
      setAlert({ type: 'error', message: err.response?.data?.message || 'Failed to register patient' });
    } finally {
      setRegistering(false);
    }
  };

  const handleRegisterFormChange = (e) => {
    const { name, value } = e.target;
    setRegisterForm(prev => ({ ...prev, [name]: value }));
    if (registerErrors[name]) {
      setRegisterErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  return (
    <div className="card">
      {/* Alert */}
      {alert.message && (
        <div style={{
          padding: '1rem',
          borderRadius: '8px',
          marginBottom: '1rem',
          backgroundColor: alert.type === 'error' ? '#FEE2E2' : alert.type === 'success' ? '#D1FAE5' : '#DBEAFE',
          color: alert.type === 'error' ? '#991B1B' : alert.type === 'success' ? '#065F46' : '#0C4A6E',
          border: `1px solid ${alert.type === 'error' ? '#FECACA' : alert.type === 'success' ? '#6EE7B7' : '#93C5FD'}`,
        }}>
          {alert.message}
        </div>
      )}

      {/* Search Section */}
      <div>
        <h3 style={{ margin: '0 0 1.5rem 0', color: '#3550A0', fontSize: '1.25rem', fontWeight: 700 }}>
          🔍 Search Patient
        </h3>

        <form onSubmit={handleSearch} style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem' }}>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by name, email, phone, or ID..."
            className="form-input"
            style={{ flex: 1, padding: '0.75rem 1rem', border: '2px solid #E5E7EB', borderRadius: '8px' }}
          />
          <button
            type="submit"
            className="btn btn-primary"
            disabled={searching}
            style={{ minWidth: '120px' }}
          >
            {searching ? '⏳ Searching...' : '🔍 Search'}
          </button>
        </form>

        {/* Search Results */}
        {searchResults.length > 0 && (
          <div style={{ marginBottom: '1.5rem' }}>
            <h4 style={{ margin: '0 0 1rem 0', color: '#374151', fontSize: '0.95rem', fontWeight: 600 }}>
              Found {searchResults.length} patient(s)
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {searchResults.map(patient => (
                <div
                  key={patient.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '1rem',
                    border: '1px solid #E5E7EB',
                    borderRadius: '8px',
                    backgroundColor: '#F9FAFB',
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <p style={{ margin: '0 0 0.25rem 0', fontWeight: 600, color: '#1F2937' }}>
                      {patient.fullName}
                    </p>
                    <p style={{ margin: '0.25rem 0', fontSize: '0.875rem', color: '#6B7280' }}>
                      📧 {patient.email || 'N/A'} | 📱 {patient.phone}
                    </p>
                    <p style={{ margin: '0.25rem 0', fontSize: '0.875rem', color: '#6B7280' }}>
                      ID: {patient.id}
                    </p>
                    <span style={{
                      display: 'inline-block',
                      marginTop: '0.5rem',
                      padding: '0.25rem 0.75rem',
                      borderRadius: '12px',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      backgroundColor: patient.role === 'EXTERNAL_PATIENT' ? '#FEF3C7' : '#DBEAFE',
                      color: patient.role === 'EXTERNAL_PATIENT' ? '#92400E' : '#0C4A6E',
                    }}>
                      {patient.role === 'EXTERNAL_PATIENT' ? '🟠 External' : '🔵 Staff'}
                    </span>
                  </div>
                  <button
                    onClick={() => handleSelectPatient(patient)}
                    className="btn btn-primary"
                    style={{ minWidth: '150px' }}
                  >
                    💉 Record Vitals
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* No Results - Register New Patient */}
        {searchResults.length === 0 && searchTerm && !searching && (
          <div style={{
            padding: '1.5rem',
            borderRadius: '8px',
            backgroundColor: '#F3F4F6',
            textAlign: 'center',
            marginBottom: '1.5rem',
          }}>
            <p style={{ margin: '0 0 1rem 0', color: '#6B7280' }}>
              No patient found with "{searchTerm}"
            </p>
            <button
              onClick={handleOpenRegisterModal}
              className="btn btn-primary"
              style={{ minWidth: '200px' }}
            >
              ➕ Register New External Patient
            </button>
          </div>
        )}

        {/* Initial State - Register Button */}
        {searchResults.length === 0 && !searchTerm && (
          <div style={{
            padding: '1.5rem',
            borderRadius: '8px',
            backgroundColor: '#F3F4F6',
            textAlign: 'center',
          }}>
            <p style={{ margin: '0 0 1rem 0', color: '#6B7280' }}>
              Or register a new external patient
            </p>
            <button
              onClick={handleOpenRegisterModal}
              className="btn btn-primary"
              style={{ minWidth: '200px' }}
            >
              ➕ Register New Patient
            </button>
          </div>
        )}
      </div>

      {/* Registration Modal */}
      {showRegisterModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
        }}>
          <div style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '12px',
            padding: '2rem',
            maxWidth: '500px',
            width: '90%',
            maxHeight: '90vh',
            overflow: 'auto',
            boxShadow: '0 10px 40px rgba(0, 0, 0, 0.2)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ margin: 0, color: '#3550A0', fontSize: '1.25rem', fontWeight: 700 }}>
                ➕ Register External Patient
              </h3>
              <button
                onClick={() => setShowRegisterModal(false)}
                disabled={registering}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '1.5rem',
                  cursor: 'pointer',
                  color: '#6B7280',
                }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleRegisterPatient}>
              <div style={{ display: 'grid', gap: '1rem' }}>
                {/* Full Name */}
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: '#3550A0', fontSize: '0.875rem' }}>
                    Full Name *
                  </label>
                  <input
                    type="text"
                    name="fullName"
                    value={registerForm.fullName}
                    onChange={handleRegisterFormChange}
                    placeholder="Full name"
                    disabled={registering}
                    className="form-input"
                    style={{
                      width: '100%',
                      padding: '0.75rem 1rem',
                      border: `2px solid ${registerErrors.fullName ? '#EF4444' : '#E5E7EB'}`,
                      borderRadius: '8px',
                    }}
                  />
                  {registerErrors.fullName && (
                    <span style={{ fontSize: '0.8rem', color: '#EF4444', marginTop: '0.25rem', display: 'block' }}>
                      {registerErrors.fullName}
                    </span>
                  )}
                </div>

                {/* Email */}
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: '#3550A0', fontSize: '0.875rem' }}>
                    Email (Optional)
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={registerForm.email}
                    onChange={handleRegisterFormChange}
                    placeholder="email@example.com"
                    disabled={registering}
                    className="form-input"
                    style={{
                      width: '100%',
                      padding: '0.75rem 1rem',
                      border: `2px solid ${registerErrors.email ? '#EF4444' : '#E5E7EB'}`,
                      borderRadius: '8px',
                    }}
                  />
                  {registerErrors.email && (
                    <span style={{ fontSize: '0.8rem', color: '#EF4444', marginTop: '0.25rem', display: 'block' }}>
                      {registerErrors.email}
                    </span>
                  )}
                </div>

                {/* Phone */}
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: '#3550A0', fontSize: '0.875rem' }}>
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={registerForm.phone}
                    onChange={handleRegisterFormChange}
                    placeholder="+251 9XX XXX XXXX"
                    disabled={registering}
                    className="form-input"
                    style={{
                      width: '100%',
                      padding: '0.75rem 1rem',
                      border: `2px solid ${registerErrors.phone ? '#EF4444' : '#E5E7EB'}`,
                      borderRadius: '8px',
                    }}
                  />
                  {registerErrors.phone && (
                    <span style={{ fontSize: '0.8rem', color: '#EF4444', marginTop: '0.25rem', display: 'block' }}>
                      {registerErrors.phone}
                    </span>
                  )}
                </div>

                {/* Date of Birth */}
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: '#3550A0', fontSize: '0.875rem' }}>
                    Date of Birth *
                  </label>
                  <input
                    type="date"
                    name="dateOfBirth"
                    value={registerForm.dateOfBirth}
                    onChange={handleRegisterFormChange}
                    disabled={registering}
                    className="form-input"
                    style={{
                      width: '100%',
                      padding: '0.75rem 1rem',
                      border: `2px solid ${registerErrors.dateOfBirth ? '#EF4444' : '#E5E7EB'}`,
                      borderRadius: '8px',
                    }}
                  />
                  {registerErrors.dateOfBirth && (
                    <span style={{ fontSize: '0.8rem', color: '#EF4444', marginTop: '0.25rem', display: 'block' }}>
                      {registerErrors.dateOfBirth}
                    </span>
                  )}
                </div>

                {/* Gender */}
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: '#3550A0', fontSize: '0.875rem' }}>
                    Gender *
                  </label>
                  <select
                    name="gender"
                    value={registerForm.gender}
                    onChange={handleRegisterFormChange}
                    disabled={registering}
                    className="form-input"
                    style={{
                      width: '100%',
                      padding: '0.75rem 1rem',
                      border: `2px solid ${registerErrors.gender ? '#EF4444' : '#E5E7EB'}`,
                      borderRadius: '8px',
                    }}
                  >
                    <option value="">Select Gender</option>
                    <option value="MALE">Male</option>
                    <option value="FEMALE">Female</option>
                    <option value="OTHER">Other</option>
                  </select>
                  {registerErrors.gender && (
                    <span style={{ fontSize: '0.8rem', color: '#EF4444', marginTop: '0.25rem', display: 'block' }}>
                      {registerErrors.gender}
                    </span>
                  )}
                </div>

                {/* Buttons */}
                <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={registering}
                    style={{ flex: 1 }}
                  >
                    {registering ? '⏳ Registering...' : '✓ Register'}
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setShowRegisterModal(false)}
                    disabled={registering}
                    style={{ flex: 1 }}
                  >
                    ✕ Cancel
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default RegisterWalkIn;
