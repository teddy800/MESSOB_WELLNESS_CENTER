import React, { useState } from 'react';
import api from '../../services/api';

function CustomerSearch({ onSelectCustomer }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSearch = async (e) => {
    e.preventDefault();
    
    if (!searchTerm.trim()) {
      setError('Please enter a customer ID, name, or email');
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      // Search by ID first (exact match)
      try {
        const userResponse = await api.get(`/api/v1/users/${searchTerm.trim()}`);
        if (userResponse.data.data) {
          setSearchResults([userResponse.data.data]);
          setLoading(false);
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
        setError('No customers found');
      }
    } catch (err) {
      setError('Failed to search customers');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (customer) => {
    if (onSelectCustomer) {
      onSelectCustomer(customer);
    }
    setSearchTerm('');
    setSearchResults([]);
    setError('');
  };

  return (
    <div className="customer-search">
      <form onSubmit={handleSearch} className="search-form">
        <div className="search-input-group">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setError('');
            }}
            placeholder="Search by ID, name, or email..."
            className="form-input"
            disabled={loading}
          />
          <button 
            type="submit" 
            className="btn btn-primary"
            disabled={loading}
          >
            {loading ? '🔍 Searching...' : '🔍 Search'}
          </button>
        </div>
      </form>

      {error && <div className="alert alert-error">{error}</div>}

      {searchResults.length > 0 && (
        <div className="search-results">
          <h4>Search Results ({searchResults.length})</h4>
          <div className="results-list">
            {searchResults.map((customer) => (
              <div key={customer.id} className="result-item">
                <div className="customer-info">
                  <p className="customer-name">{customer.fullName}</p>
                  <p className="customer-details">
                    ID: {customer.id}
                  </p>
                  <p className="customer-details">
                    Email: {customer.email}
                  </p>
                  {customer.phone && (
                    <p className="customer-details">Phone: {customer.phone}</p>
                  )}
                </div>
                <button
                  type="button"
                  className="btn btn-small btn-primary"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleSelect(customer);
                  }}
                >
                  Select
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default CustomerSearch;
