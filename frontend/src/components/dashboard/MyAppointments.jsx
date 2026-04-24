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
                <span className={`status-badge ${getStatusColor(apt.status)}`}>
                  {apt.status}
                </span>
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
                    className="btn btn-danger"
                    onClick={() => handleCancelAppointment(apt.id)}
                  >
                    Cancel Appointment
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default MyAppointments;
