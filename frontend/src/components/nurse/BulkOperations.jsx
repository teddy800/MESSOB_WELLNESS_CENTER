import React, { useState } from 'react';
import api from '../../services/api';

function BulkOperations({ queueItems, onSuccess }) {
  const [selectedItems, setSelectedItems] = useState([]);
  const [bulkAction, setBulkAction] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedItems(queueItems.map(item => item.id));
    } else {
      setSelectedItems([]);
    }
  };

  const handleSelectItem = (itemId) => {
    setSelectedItems(prev => {
      if (prev.includes(itemId)) {
        return prev.filter(id => id !== itemId);
      } else {
        return [...prev, itemId];
      }
    });
  };

  const handleBulkAction = async () => {
    if (selectedItems.length === 0) {
      setError('Please select at least one item');
      return;
    }

    if (!bulkAction) {
      setError('Please select an action');
      return;
    }

    try {
      setLoading(true);
      setError('');
      setSuccess('');

      // Process bulk action
      const promises = selectedItems.map(itemId => 
        api.patch(`/api/v1/appointments/${itemId}`, {
          status: bulkAction
        })
      );

      await Promise.all(promises);

      setSuccess(`Successfully updated ${selectedItems.length} appointment(s)`);
      setSelectedItems([]);
      setBulkAction('');

      setTimeout(() => {
        setSuccess('');
        if (onSuccess) onSuccess();
      }, 2000);
    } catch (err) {
      setError('Failed to perform bulk action');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bulk-operations">
      <h3>⚡ Bulk Operations</h3>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <div className="bulk-controls">
        <div className="select-all">
          <label>
            <input
              type="checkbox"
              checked={selectedItems.length === queueItems.length && queueItems.length > 0}
              onChange={handleSelectAll}
              disabled={loading || queueItems.length === 0}
            />
            <span>Select All ({selectedItems.length} selected)</span>
          </label>
        </div>

        <div className="bulk-action-select">
          <select
            value={bulkAction}
            onChange={(e) => setBulkAction(e.target.value)}
            disabled={loading || selectedItems.length === 0}
            className="form-input"
          >
            <option value="">Choose action...</option>
            <option value="IN_PROGRESS">Mark as In Progress</option>
            <option value="COMPLETED">Mark as Completed</option>
            <option value="CANCELLED">Cancel Selected</option>
          </select>
        </div>

        <button
          className="btn btn-primary"
          onClick={handleBulkAction}
          disabled={loading || selectedItems.length === 0 || !bulkAction}
        >
          {loading ? 'Processing...' : 'Apply to Selected'}
        </button>
      </div>

      <div className="items-list">
        {queueItems.length === 0 ? (
          <p className="empty-text">No items available</p>
        ) : (
          queueItems.map((item) => (
            <div key={item.id} className="bulk-item">
              <label className="bulk-item-checkbox">
                <input
                  type="checkbox"
                  checked={selectedItems.includes(item.id)}
                  onChange={() => handleSelectItem(item.id)}
                  disabled={loading}
                />
                <div className="item-info">
                  <span className="item-name">{item.customerName}</span>
                  <span className="item-id">ID: {item.appointmentId}</span>
                  <span className={`item-status status-${item.status.toLowerCase()}`}>
                    {item.status}
                  </span>
                </div>
              </label>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default BulkOperations;
