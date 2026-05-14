import React, { useEffect, useState } from "react";
import { adminService } from "../../services/adminService";
import api from "../../services/api";

function AppointmentsList({ filters, onEdit, onDelete }) {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 0 });
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [selectedAppointmentId, setSelectedAppointmentId] = useState(null);
  const [cancellationReason, setCancellationReason] = useState("");
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    fetchAppointments();
  }, [filters]);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const result = await adminService.getAppointments({ ...filters, page: pagination.page, limit: pagination.limit });
      setAppointments(result.data || []);
      setPagination(result.pagination || {});
      setError(null);
    } catch (err) {
      setError(err.message || "Failed to load appointments");
      console.error("Error fetching appointments:", err);
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (newPage) => {
    setPagination({ ...pagination, page: newPage });
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString() + " " + new Date(date).toLocaleTimeString();
  };

  const openCancelModal = (appointmentId) => {
    setSelectedAppointmentId(appointmentId);
    setCancellationReason("");
    setShowCancelModal(true);
    // Auto-scroll to modal after a brief delay to ensure it's rendered
    setTimeout(() => {
      const modal = document.querySelector(".modal-overlay");
      if (modal) {
        modal.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }, 100);
  };

  const closeCancelModal = () => {
    setShowCancelModal(false);
    setSelectedAppointmentId(null);
    setCancellationReason("");
  };

  const confirmCancelAppointment = async () => {
    if (!cancellationReason.trim()) {
      alert("Please provide a cancellation reason");
      return;
    }

    try {
      setCancelling(true);
      await api.delete(`/api/v1/appointments/${selectedAppointmentId}/cancel`, {
        data: {
          cancellationReason,
        },
      });
      closeCancelModal();
      fetchAppointments();
      alert("✅ Appointment cancelled successfully!");
    } catch (err) {
      alert(err.response?.data?.message || "Failed to cancel appointment");
      console.error(err);
    } finally {
      setCancelling(false);
    }
  };

  if (loading) {
    return <div className="table-loading">Loading appointments...</div>;
  }

  if (error) {
    return <div className="table-error">Error: {error}</div>;
  }

  return (
    <div className="table-container">
      <table className="data-table">
        <thead>
          <tr>
            <th>Patient ID</th>
            <th>Patient</th>
            <th>Reason</th>
            <th>Scheduled</th>
            <th>Status</th>
            <th>Center</th>
            <th>Region</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {appointments.length === 0 ? (
            <tr>
              <td colSpan="8" className="table-empty">No appointments found</td>
            </tr>
          ) : (
            appointments.map((apt) => (
              <tr key={apt.id}>
                <td className="cell-id">{apt.user?.userId || "N/A"}</td>
                <td className="cell-name">{apt.user?.fullName || "N/A"}</td>
                <td className="cell-reason">{apt.reason}</td>
                <td className="cell-date">{formatDate(apt.scheduledAt)}</td>
                <td className="cell-status">
                  <span className={`status ${apt.status.toLowerCase()}`}>
                    {apt.status}
                  </span>
                </td>
                <td className="cell-center">{apt.user?.center?.name || "N/A"}</td>
                <td className="cell-region">{apt.user?.center?.region || "N/A"}</td>
                <td className="cell-actions">
                  <button 
                    className="btn-icon edit"
                    onClick={() => onEdit(apt)}
                    title="Edit"
                  >
                    ✎
                  </button>
                  {(apt.status === "WAITING" || apt.status === "CONFIRMED" || apt.status === "IN_PROGRESS" || apt.status === "IN_SERVICE") && (
                    <button 
                      className="btn-icon cancel"
                      onClick={() => openCancelModal(apt.id)}
                      title="Cancel Appointment"
                    >
                      ❌
                    </button>
                  )}
                  <button 
                    className="btn-icon delete"
                    onClick={() => onDelete(apt.id)}
                    title="Delete"
                  >
                    🗑
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {pagination.pages > 1 && (
        <div className="pagination">
          <button 
            onClick={() => handlePageChange(pagination.page - 1)}
            disabled={pagination.page === 1}
            className="btn-pagination"
          >
            ← Previous
          </button>
          <span className="pagination-info">
            Page {pagination.page} of {pagination.pages}
          </span>
          <button 
            onClick={() => handlePageChange(pagination.page + 1)}
            disabled={pagination.page === pagination.pages}
            className="btn-pagination"
          >
            Next →
          </button>
        </div>
      )}

      {showCancelModal && (
        <div className="modal-overlay" onClick={closeCancelModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Cancel Appointment</h3>
              <button className="modal-close" onClick={closeCancelModal}>
                ✕
              </button>
            </div>
            <div className="modal-body">
              <p>Please provide a reason for cancelling this appointment:</p>
              <textarea
                className="cancel-reason-input"
                placeholder="e.g., Staff unavailable, Schedule conflict, etc."
                value={cancellationReason}
                onChange={(e) => setCancellationReason(e.target.value)}
                rows="4"
              />
            </div>
            <div className="modal-footer">
              <button
                className="btn btn-secondary"
                onClick={closeCancelModal}
                disabled={cancelling}
              >
                Keep Appointment
              </button>
              <button
                className="btn btn-danger"
                onClick={confirmCancelAppointment}
                disabled={cancelling || !cancellationReason.trim()}
              >
                {cancelling ? "Cancelling..." : "Confirm Cancellation"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AppointmentsList;
