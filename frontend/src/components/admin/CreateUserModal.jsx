import React, { useState, useEffect } from "react";
import { adminService } from "../../services/adminService";

function CreateUserModal({ isOpen, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "STAFF",
    region: "",
    centerId: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  // Regions and centers state
  const [regions, setRegions] = useState([]);
  const [centers, setCenters] = useState([]);
  const [regionsLoading, setRegionsLoading] = useState(false);
  const [centersLoading, setCentersLoading] = useState(false);

  const roles = ["STAFF", "NURSE_OFFICER", "MANAGER", "REGIONAL_OFFICE", "FEDERAL_OFFICE", "SYSTEM_ADMIN"];

  // Fetch regions when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchRegions();
    }
  }, [isOpen]);

  // Fetch centers when region changes
  useEffect(() => {
    if (formData.region) {
      fetchCenters(formData.region);
    } else {
      setCenters([]);
      setFormData(prev => ({ ...prev, centerId: "" }));
    }
  }, [formData.region]);

  const fetchRegions = async () => {
    setRegionsLoading(true);
    try {
      const regions = await adminService.getRegions();
      setRegions(regions);
    } catch (error) {
      console.error("Error fetching regions:", error);
    } finally {
      setRegionsLoading(false);
    }
  };

  const fetchCenters = async (region) => {
    setCentersLoading(true);
    try {
      const centers = await adminService.getCentersByRegion(region);
      setCenters(centers);
    } catch (error) {
      console.error("Error fetching centers:", error);
      setCenters([]);
    } finally {
      setCentersLoading(false);
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

    if (!formData.fullName || !formData.email || !formData.password || !formData.role) {
      setError("Please fill in all required fields");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    // Require center for STAFF role
    if (formData.role === "STAFF" && !formData.centerId) {
      setError("Please select a center for staff users");
      return;
    }

    try {
      setLoading(true);
      await adminService.createUser({
        fullName: formData.fullName,
        email: formData.email,
        password: formData.password,
        role: formData.role,
        centerId: formData.centerId || null,
      });
      onSuccess?.();
      onClose();
      setFormData({
        fullName: "",
        email: "",
        password: "",
        confirmPassword: "",
        role: "STAFF",
        region: "",
        centerId: "",
      });
    } catch (err) {
      const errorMsg = err.response?.data?.message || "Failed to create user";
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
          <h3>Create New User</h3>
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
              placeholder="Enter full name"
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
              placeholder="Enter email address"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password *</label>
            <input
              id="password"
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Enter password (min 6 characters)"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm Password *</label>
            <input
              id="confirmPassword"
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="Confirm password"
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
              {roles.map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="region">Region *</label>
            <select
              id="region"
              name="region"
              value={formData.region}
              onChange={handleChange}
              disabled={regionsLoading}
              required
            >
              <option value="">
                {regionsLoading ? "Loading regions..." : "Select Region"}
              </option>
              {regions.map((region) => (
                <option key={region} value={region}>
                  {region}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="centerId">Center *</label>
            <select
              id="centerId"
              name="centerId"
              value={formData.centerId}
              onChange={handleChange}
              disabled={centersLoading || !formData.region}
              required
            >
              <option value="">
                {!formData.region
                  ? "Select region first"
                  : centersLoading
                  ? "Loading centers..."
                  : centers.length === 0
                  ? "No centers available"
                  : "Select Center"}
              </option>
              {centers.map((center) => (
                <option key={center.id} value={center.id}>
                  {center.name} - {center.city}
                </option>
              ))}
            </select>
          </div>

          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? "Creating..." : "Create User"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CreateUserModal;
