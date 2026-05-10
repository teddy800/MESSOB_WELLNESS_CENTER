import React, { useEffect, useState } from "react";
import { adminService } from "../../services/adminService";

function AppointmentsList({ filters, onEdit, onDelete }) {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 0 });

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
              <td colSpan="7" className="table-empty">No appointments found</td>
            </tr>
          ) : (
            appointments.map((apt) => (
              <tr key={apt.id}>
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
    </div>
  );
}

export default AppointmentsList;
