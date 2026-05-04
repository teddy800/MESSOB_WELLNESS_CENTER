import React, { useEffect, useState } from "react";
import { adminService } from "../../services/adminService";
import VitalModal from "./VitalModal";

function VitalRecordsList() {
  const [vitals, setVitals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [selectedVital, setSelectedVital] = useState(null);
  const [filters, setFilters] = useState({
    region: "",
    center: "",
    bmiCategory: "",
    bpCategory: "",
    dateFrom: "",
    dateTo: "",
    search: "",
  });

  useEffect(() => {
    fetchVitals();
  }, [page, filters]);

  const fetchVitals = async () => {
    try {
      setLoading(true);
      const response = await adminService.getVitals({
        ...filters,
        page,
        limit: 20,
      });
      setVitals(response.data || []);
      setError(null);
    } catch (err) {
      setError(err.message || "Failed to load vitals");
      console.error("Error fetching vitals:", err);
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
      bmiCategory: "",
      bpCategory: "",
      dateFrom: "",
      dateTo: "",
      search: "",
    });
    setPage(1);
  };

  if (loading) return <div className="loading">Loading vitals...</div>;
  if (error) return <div className="error">Error: {error}</div>;

  return (
    <div className="vitals-list">
      <VitalModal vital={selectedVital} onClose={() => setSelectedVital(null)} />
      
      <div className="list-header">
        <h2>Vital Records</h2>
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
          name="bmiCategory"
          value={filters.bmiCategory}
          onChange={handleFilterChange}
          className="filter-select"
        >
          <option value="">All BMI Categories</option>
          <option value="UNDERWEIGHT">Underweight</option>
          <option value="NORMAL">Normal</option>
          <option value="OVERWEIGHT">Overweight</option>
          <option value="OBESITY">Obesity</option>
        </select>
        <select
          name="bpCategory"
          value={filters.bpCategory}
          onChange={handleFilterChange}
          className="filter-select"
        >
          <option value="">All BP Categories</option>
          <option value="NORMAL">Normal</option>
          <option value="ELEVATED">Elevated</option>
          <option value="HYPERTENSION_STAGE_1">Hypertension Stage 1</option>
          <option value="HYPERTENSION_STAGE_2">Hypertension Stage 2</option>
          <option value="HYPERTENSIVE_CRISIS">Hypertensive Crisis</option>
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
            <th>Weight (kg)</th>
            <th>Height (cm)</th>
            <th>BMI</th>
            <th>BP (Sys/Dia)</th>
            <th>Heart Rate</th>
            <th>Temperature</th>
            <th>O2 Sat</th>
            <th>Recorded At</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {vitals.map((vital) => (
            <tr key={vital.id}>
              <td>{vital.user?.fullName || "N/A"}</td>
              <td>{vital.weightKg?.toFixed(1) || "-"}</td>
              <td>{vital.heightCm?.toFixed(1) || "-"}</td>
              <td>
                <span className={`badge badge-${vital.bmiCategory?.toLowerCase()}`}>
                  {vital.bmi?.toFixed(1) || "-"}
                </span>
              </td>
              <td>{vital.systolic && vital.diastolic ? `${vital.systolic}/${vital.diastolic}` : "-"}</td>
              <td>{vital.heartRate || "-"}</td>
              <td>{vital.temperature?.toFixed(1) || "-"}°C</td>
              <td>{vital.oxygenSaturation || "-"}%</td>
              <td>{new Date(vital.recordedAt).toLocaleDateString()}</td>
              <td>
                <button className="btn-view" onClick={() => setSelectedVital(vital)}>View</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {vitals.length === 0 && (
        <div className="empty-state">No vital records found</div>
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
          disabled={vitals.length < 20}
          className="btn-next"
        >
          Next
        </button>
      </div>
    </div>
  );
}

export default VitalRecordsList;
