import React, { useState, useEffect } from "react";
import { adminService } from "../../services/adminService";

function EditCenterModal({ isOpen, onClose, center, onSuccess, regions = [] }) {
  const [formData, setFormData] = useState({
    name: "",
    region: "",
    city: "",
    address: "",
    phone: "",
    email: "",
    status: "ACTIVE",
    capacity: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [localRegions, setLocalRegions] = useState(regions);

  const statuses = ["ACTIVE", "INACTIVE", "MAINTENANCE"];

  useEffect(() => {
    if (center && isOpen) {
      setFormData({
        name: center.name || "",
        region: center.region || "",
        city: center.city || "",
        address: center.address || "",
        phone: center.phone || "",
        email: center.email || "",
        status: center.status || "ACTIVE",
        capacity: center.capacity || "",
      });
      setError("");
    }
  }, [center, isOpen]);

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
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!formData.name || !formData.region || !formData.city || !formData.address) {
      setError("Please fill in all required fields");
      return;
    }

    try {
      setLoading(true);
      const updateData = {
        ...formData,
        capacity: formData.capacity ? parseInt(formData.capacity) : null,
      };
      await adminService.updateCenter(center.id, updateData);
      onSuccess?.();
      onClose();
    } catch (err) {
      const errorMsg = err.response?.data?.message || "Failed to update center";
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !center) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Edit Center</h3>
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
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="status">Status *</label>
              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleChange}
                required
              >
                {statuses.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
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
              min="1"
            />
          </div>

          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? "Updating..." : "Update Center"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EditCenterModal;
