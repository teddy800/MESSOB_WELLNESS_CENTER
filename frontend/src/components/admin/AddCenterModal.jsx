import React, { useState, useEffect } from "react";
import { adminService } from "../../services/adminService";
import "../../../src/styles/admin-modals.css";

function AddCenterModal({ isOpen, onClose, onSuccess, regions = [] }) {
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    region: "",
    city: "",
    address: "",
    phone: "",
    email: "",
    capacity: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [localRegions, setLocalRegions] = useState(regions);

  useEffect(() => {
    if (isOpen && localRegions.length === 0) {
      loadRegions();
    }
  }, [isOpen]);

  const loadRegions = async () => {
    try {
      const data = await adminService.getRegions();
      setLocalRegions(data || []);
    } catch (err) {
      console.error("Error loading regions:", err);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // Validation
    if (!formData.name || !formData.code || !formData.region || !formData.city || !formData.address) {
      setError("Please fill in all required fields");
      return;
    }

    try {
      setLoading(true);
      const centerData = {
        ...formData,
        capacity: formData.capacity ? parseInt(formData.capacity) : null,
      };

      await adminService.createCenter(centerData);
      
      // Reset form
      setFormData({
        name: "",
        code: "",
        region: "",
        city: "",
        address: "",
        phone: "",
        email: "",
        capacity: "",
      });

      onSuccess?.();
      onClose();
    } catch (err) {
      const errorMsg = err.response?.data?.message || "Failed to create center";
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Add New Center</h3>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          {error && <div className="error-message">{error}</div>}

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="name">Center Name *</label>
              <input
                id="name"
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="e.g., Addis Ababa Health Center"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="code">Center Code *</label>
              <input
                id="code"
                type="text"
                name="code"
                value={formData.code}
                onChange={handleChange}
                placeholder="e.g., AA-001"
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="region">Region *</label>
              <select
                id="region"
                name="region"
                value={formData.region}
                onChange={handleChange}
                required
              >
                <option value="">Select Region</option>
                {localRegions.map((region) => (
                  <option key={region} value={region}>
                    {region}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="city">City *</label>
              <input
                id="city"
                type="text"
                name="city"
                value={formData.city}
                onChange={handleChange}
                placeholder="e.g., Addis Ababa"
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="address">Address *</label>
            <input
              id="address"
              type="text"
              name="address"
              value={formData.address}
              onChange={handleChange}
              placeholder="e.g., 123 Main Street"
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="phone">Phone</label>
              <input
                id="phone"
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="e.g., +251-11-123-4567"
              />
            </div>

            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="e.g., center@mesob.com"
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="capacity">Capacity (patients/day)</label>
            <input
              id="capacity"
              type="number"
              name="capacity"
              value={formData.capacity}
              onChange={handleChange}
              placeholder="e.g., 50"
              min="1"
            />
          </div>

          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? "Creating..." : "Create Center"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AddCenterModal;
