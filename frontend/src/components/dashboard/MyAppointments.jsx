import React, { useState, useEffect } from "react";
import api from "../../services/api";

const normalizeAppointments = (items) => {
  if (!Array.isArray(items)) return [];

  return items.map((appointment) => ({
    ...appointment,
    status:
      typeof appointment.status === "string"
        ? appointment.status.toUpperCase()
        : appointment.status,
  }));
};

function MyAppointments() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("all");
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [selectedAppointmentId, setSelectedAppointmentId] = useState(null);
  const [cancellationReason, setCancellationReason] = useState("");
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    fetchAppointments();

    const onAppointmentsUpdated = (event) => {
      const incoming = normalizeAppointments([event?.detail?.appointment])[0];

      if (incoming && incoming.id) {
        setAppointments((prev) => {
          const exists = prev.some((item) => item.id === incoming.id);
          if (exists) {
            return prev.map((item) =>
              item.id === incoming.id ? incoming : item,
            );
          }
          return [...prev, incoming];
        });
      }

      // Keep a refetch as fallback to stay in sync with server truth.
      fetchAppointments();
    };

    window.addEventListener("appointments-updated", onAppointmentsUpdated);
    return () => {
      window.removeEventListener("appointments-updated", onAppointmentsUpdated);
    };
  }, []);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const response = await api.get("/api/v1/appointments");
      const data = response.data.data;

      // Handle both array and object responses
      let appointmentsList = [];
      if (Array.isArray(data)) {
        appointmentsList = data;
      } else if (
        data &&
        data.appointments &&
        Array.isArray(data.appointments)
      ) {
        appointmentsList = data.appointments;
      }

      setAppointments(normalizeAppointments(appointmentsList));
      setError("");
    } catch (err) {
      setAppointments([]);
      setError("Failed to load appointments");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      PENDING: "status-pending",
      CONFIRMED: "status-confirmed",
      IN_PROGRESS: "status-in-progress",
      COMPLETED: "status-completed",
      CANCELLED: "status-cancelled",
    };
    return colors[status] || "status-pending";
  };

  const generateQRCode = (appointmentId) => {
    return `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${appointmentId}`;
  };

  const handleCancelAppointment = async (appointmentId) => {
    if (!window.confirm("Are you sure you want to cancel this appointment?"))
      return;

    try {
      await api.patch(`/api/v1/appointments/${appointmentId}`, {
        status: "CANCELLED",
      });
      fetchAppointments();
    } catch (err) {
      setError("Failed to cancel appointment");
    }
  };

  const handleSendReminder = async (appointmentId) => {
    try {
      await api.post(`/api/v1/appointments/${appointmentId}/send-reminder`);
      alert("✅ SMS reminder sent successfully!");
    } catch (err) {
      alert("❌ Failed to send SMS reminder");
      console.error(err);
    }
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
      setError("");
      closeCancelModal();
      fetchAppointments();
      alert("✅ Appointment cancelled successfully!");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to cancel appointment");
      console.error(err);
    } finally {
      setCancelling(false);
    }
  };

  const filteredAppointments = appointments.filter((apt) => {
    if (filter === "all") return true;
    return apt.status === filter;
  });

  return (
    <div className="card my-appointments">
      <h2>📋 My Appointments</h2>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="filter-tabs">
        <button
          className={`filter-btn ${filter === "all" ? "active" : ""}`}
          onClick={() => setFilter("all")}
        >
          All ({appointments.length})
        </button>
        <button
          className={`filter-btn ${filter === "CONFIRMED" ? "active" : ""}`}
          onClick={() => setFilter("CONFIRMED")}
        >
          Upcoming
        </button>
        <button
          className={`filter-btn ${filter === "COMPLETED" ? "active" : ""}`}
          onClick={() => setFilter("COMPLETED")}
        >
          Completed
        </button>
        <button
          className={`filter-btn ${filter === "CANCELLED" ? "active" : ""}`}
          onClick={() => setFilter("CANCELLED")}
        >
          Cancelled
        </button>
      </div>

      {loading ? (
        <p className="loading-text">Loading appointments...</p>
      ) : filteredAppointments.length === 0 ? (
        <p className="empty-text">No appointments found</p>
      ) : (
        <div className="appointments-list">
          {filteredAppointments.map((apt) => (
            <div key={apt.id} className="appointment-card">
              <div className="appointment-header">
                <div className="appointment-date">
                  <span className="date-label">
                    {new Date(apt.scheduledAt).toLocaleDateString()}
                  </span>
                  <span className="time-label">
                    {new Date(apt.scheduledAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
                <div className="appointment-status-section">
                  <span className={`status-badge ${getStatusColor(apt.status)}`}>
                    {apt.status}
                  </span>
                  {(apt.status === "CONFIRMED" || apt.status === "WAITING" || apt.status === "IN_PROGRESS") && (
                    <button
                      className="btn btn-cancel-small"
                      onClick={() => openCancelModal(apt.id)}
                      title="Cancel this appointment"
                    >
                      ❌ Cancel
                    </button>
                  )}
                </div>
              </div>

              <div className="appointment-body">
                <div className="appointment-info">
                  <p>
                    <strong>Reason:</strong> {apt.reason}
                  </p>
                  <p>
                    <strong>Appointment ID:</strong> {apt.id}
                  </p>
                  {apt.diagnosis && (
                    <p>
                      <strong>Diagnosis:</strong> {apt.diagnosis}
                    </p>
                  )}
                  {apt.prescription && (
                    <p>
                      <strong>Prescription:</strong> {apt.prescription}
                    </p>
                  )}
                </div>

                {apt.status === "CONFIRMED" && (
                  <div className="qr-code-section">
                    <p className="qr-label">
                      Digital Ticket (Show at check-in)
                    </p>
                    <img
                      src={generateQRCode(apt.id)}
                      alt="QR Code"
                      className="qr-code"
                    />
                  </div>
                )}
              </div>

              <div className="appointment-footer">
                {apt.status === "CONFIRMED" && (
                  <button
                    className="btn btn-primary"
                    onClick={() => handleSendReminder(apt.id)}
                  >
                    📱 Send SMS Reminder
                  </button>
                )}
              </div>
            </div>
          ))}
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

export default MyAppointments;
