import React, { useEffect, useState } from "react";
import { adminService } from "../../services/adminService";

function WellnessPlansList() {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({
    region: "",
    center: "",
    status: "active",
    dateFrom: "",
    dateTo: "",
    search: "",
  });

  useEffect(() => {
    fetchPlans();
  }, [page, filters]);

  const fetchPlans = async () => {
    try {
      setLoading(true);
      // Using wellness endpoint if available, otherwise using vitals
      const response = await adminService.getVitals({
        ...filters,
        page,
        limit: 20,
      });
      setPlans(response.data || []);
      setError(null);
    } catch (err) {
      setError(err.message || "Failed to load wellness plans");
      console.error("Error fetching plans:", err);
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
      region: "",
      center: "",
      status: "active",
      dateFrom: "",
      dateTo: "",
      search: "",
    });
    setPage(1);
  };

  if (loading) return <div className="loading">Loading wellness plans...</div>;
  if (error) return <div className="error">Error: {error}</div>;

  return (
    <div className="wellness-plans-list">
      <div className="list-header">
        <h2>Wellness Plans</h2>
        <button className="btn-export">Export</button>
      </div>

      <div className="filters">
        <input
          type="text"
          name="search"
          placeholder="Search by patient..."
          value={filters.search}
          onChange={handleFilterChange}
          className="filter-input"
        />
        <select
          name="status"
          value={filters.status}
          onChange={handleFilterChange}
          className="filter-select"
        >
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
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
            <th>Patient</th>
            <th>Plan Text</th>
            <th>Goals</th>
            <th>Duration (days)</th>
            <th>Status</th>
            <th>Created</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {plans.map((plan) => (
            <tr key={plan.id}>
              <td>{plan.user?.fullName || "N/A"}</td>
              <td className="truncate">{plan.planText?.substring(0, 50) || "-"}...</td>
              <td className="truncate">{plan.goals?.substring(0, 50) || "-"}...</td>
              <td>{plan.duration || "-"}</td>
              <td>
                <span className={`badge badge-${plan.isActive ? "active" : "inactive"}`}>
                  {plan.isActive ? "Active" : "Inactive"}
                </span>
              </td>
              <td>{new Date(plan.createdAt).toLocaleDateString()}</td>
              <td>
                <button className="btn-view">View</button>
                <button className="btn-edit">Edit</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {plans.length === 0 && (
        <div className="empty-state">No wellness plans found</div>
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
          disabled={plans.length < 20}
          className="btn-next"
        >
          Next
        </button>
      </div>
    </div>
  );
}

export default WellnessPlansList;
