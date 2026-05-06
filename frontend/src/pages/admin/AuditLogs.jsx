import React, { useEffect, useState } from "react";
import { adminService } from "../../services/adminService";
import "../../styles/admin-audit.css";

function AuditLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({
    action: "",
    resource: "",
    dateFrom: "",
    dateTo: "",
    search: "",
  });

  useEffect(() => {
    fetchLogs();
  }, [page, filters]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const response = await adminService.getAuditLogs({
        ...filters,
        page,
        limit: 20,
      });
      setLogs(response.data || []);
      setError(null);
    } catch (err) {
      setError(err.message || "Failed to load audit logs");
      console.error("Error fetching logs:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
    setPage(1);
  };

  const handleResetFilters = () => {
    setFilters({
      action: "",
      resource: "",
      dateFrom: "",
      dateTo: "",
      search: "",
    });
    setPage(1);
  };

  const getActionColor = (action) => {
    if (action?.includes("CREATE")) return "create";
    if (action?.includes("UPDATE")) return "update";
    if (action?.includes("DELETE")) return "delete";
    if (action?.includes("LOGIN")) return "login";
    return "default";
  };

  if (loading) return <div className="loading">Loading audit logs...</div>;
  if (error) return <div className="error">Error: {error}</div>;

  return (
    <div className="audit-logs-page">
      <div className="page-header">
        <h1>Audit Logs</h1>
        <p>Track all system activities and changes</p>
      </div>

      <div className="filters">
        <input
          type="text"
          name="search"
          placeholder="Search by user or resource..."
          value={filters.search}
          onChange={handleFilterChange}
          className="filter-input"
        />
        <select
          name="action"
          value={filters.action}
          onChange={handleFilterChange}
          className="filter-select"
        >
          <option value="">All Actions</option>
          <option value="CREATE">Create</option>
          <option value="UPDATE">Update</option>
          <option value="DELETE">Delete</option>
          <option value="LOGIN">Login</option>
          <option value="LOGOUT">Logout</option>
        </select>
        <select
          name="resource"
          value={filters.resource}
          onChange={handleFilterChange}
          className="filter-select"
        >
          <option value="">All Resources</option>
          <option value="USER">User</option>
          <option value="CENTER">Center</option>
          <option value="APPOINTMENT">Appointment</option>
          <option value="VITAL">Vital</option>
          <option value="FEEDBACK">Feedback</option>
        </select>
        <input
          type="date"
          name="dateFrom"
          value={filters.dateFrom}
          onChange={handleFilterChange}
          className="filter-input"
        />
        <input
          type="date"
          name="dateTo"
          value={filters.dateTo}
          onChange={handleFilterChange}
          className="filter-input"
        />
        <button onClick={handleResetFilters} className="btn-reset">
          Reset
        </button>
      </div>

      <table className="data-table">
        <thead>
          <tr>
            <th>Timestamp</th>
            <th>User</th>
            <th>Action</th>
            <th>Resource</th>
            <th>Details</th>
            <th>IP Address</th>
          </tr>
        </thead>
        <tbody>
          {logs.map((log) => (
            <tr key={log.id}>
              <td>{new Date(log.timestamp).toLocaleString()}</td>
              <td>{log.user?.fullName || "System"}</td>
              <td>
                <span className={`badge badge-action badge-${getActionColor(log.action)}`}>
                  {log.action || "-"}
                </span>
              </td>
              <td>{log.resource || "-"}</td>
              <td className="truncate">{log.details ? JSON.stringify(log.details).substring(0, 50) : "-"}...</td>
              <td className="monospace">{log.ipAddress || "-"}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {logs.length === 0 && (
        <div className="empty-state">No audit logs found</div>
      )}

      <div className="pagination">
        <button
          onClick={() => setPage(Math.max(1, page - 1))}
          disabled={page === 1}
          className="btn-prev"
        >
          Previous
        </button>
        <span className="page-info">Page {page}</span>
        <button
          onClick={() => setPage(page + 1)}
          disabled={logs.length < 20}
          className="btn-next"
        >
          Next
        </button>
      </div>
    </div>
  );
}

export default AuditLogs;
