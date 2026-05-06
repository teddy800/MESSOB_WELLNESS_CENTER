import React, { useState, useEffect } from "react";
import { adminService } from "../../services/adminService";

function EditAppointmentModal({ isOpen, onClose, appointment, onSuccess }) {
  const [formData, setFormData] = useState({
    reason: "",
    status: "WAITING",
    notes: "",
    diagnosis: "",
    prescription: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const statuses = ["WAITING", "IN_PROGRESS", "IN_SERVICE", "COMPLETED", "CANCELLED", "NO_SHOW"];

  useEffect(() => {
    if (appointment && isOpen) {
      setFormData({
        reason: appointment.reason || "",
        status: appointment.status || "WAITING",
        notes: appointment.notes || "",
        diagnosis: appointment.diagnosis || "",
        prescription: appointment.prescription || "",
      });
      setError("");
    }
  }, [appointment, isOpen]);

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

    if (!formData.reason || !formData.status) {
      setError("Please fill in all required fields");
      return;
    }

    try {
      setLoading(true);
      await adminService.updateAppointment(appointment.id, formData);
      onSuccess?.();
      onClose();
    } catch (err) {
      const errorMsg = err.response?.data?.message || "Failed to update appointment";
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !appointment) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Edit Appointment</h3>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          {error && <div className="error-message">{error}</div>}

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="reason">Reason *</label>
              <input
                id="reason"
                type="text"
                name="reason"
                value={formData.reason}
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

          <div className="form-group">
            <label htmlFor="notes">Notes</label>
            <textarea
              id="notes"
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              placeholder="Additional notes..."
            />
          </div>

          <div className="form-group">
            <label htmlFor="diagnosis">Diagnosis</label>
            <textarea
              id="diagnosis"
              name="diagnosis"
              value={formData.diagnosis}
              onChange={handleChange}
              placeholder="Diagnosis details..."
            />
          </div>

          <div className="form-group">
            <label htmlFor="prescription">Prescription</label>
            <textarea
              id="prescription"
              name="prescription"
              value={formData.prescription}
              onChange={handleChange}
              placeholder="Prescription details..."
            />
          </div>

          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? "Updating..." : "Update Appointment"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EditAppointmentModal;
