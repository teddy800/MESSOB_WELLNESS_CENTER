import React, { useState, useEffect } from "react";
import { adminService } from "../../services/adminService";

function EditUserModal({ isOpen, onClose, user, onSuccess }) {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    role: "",
    isActive: true,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const roles = ["STAFF", "NURSE_OFFICER", "MANAGER", "REGIONAL_OFFICE", "FEDERAL_OFFICE", "SYSTEM_ADMIN"];

  useEffect(() => {
    if (user && isOpen) {
      setFormData({
        fullName: user.fullName || "",
        email: user.email || "",
        role: user.role || "",
        isActive: user.isActive !== false,
      });
      setError("");
    }
  }, [user, isOpen]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!formData.fullName || !formData.email || !formData.role) {
      setError("Please fill in all required fields");
      return;
    }

    try {
      setLoading(true);
      await adminService.updateUser(user.id, formData);
      onSuccess?.();
      onClose();
    } catch (err) {
      const errorMsg = err.response?.data?.message || "Failed to update user";
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !user) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Edit User</h3>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          {error && <div className="error-message">{error}</div>}

          <div className="form-group">
            <label htmlFor="fullName">Full Name *</label>
            <input
              id="fullName"
              type="text"
              name="fullName"
              value={formData.fullName}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">Email *</label>
            <input
              id="email"
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="role">Role *</label>
            <select
              id="role"
              name="role"
              value={formData.role}
              onChange={handleChange}
              required
            >
              <option value="">Select Role</option>
              {roles.map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="isActive">
              <input
                id="isActive"
                type="checkbox"
                name="isActive"
                checked={formData.isActive}
                onChange={handleChange}
              />
              Active
            </label>
          </div>

          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? "Updating..." : "Update User"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EditUserModal;
