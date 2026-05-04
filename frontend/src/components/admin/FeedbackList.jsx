import React, { useEffect, useState } from "react";
import { adminService } from "../../services/adminService";
import FeedbackModal from "./FeedbackModal";

function FeedbackList() {
  const [feedback, setFeedback] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [selectedFeedback, setSelectedFeedback] = useState(null);
  const [filters, setFilters] = useState({
    region: "",
    center: "",
    npsScore: "",
    feedbackType: "",
    dateFrom: "",
    dateTo: "",
    search: "",
  });

  useEffect(() => {
    fetchFeedback();
  }, [page, filters]);

  const fetchFeedback = async () => {
    try {
      setLoading(true);
      const response = await adminService.getFeedback({
        ...filters,
        page,
        limit: 20,
      });
      setFeedback(response.data || []);
      setError(null);
    } catch (err) {
      setError(err.message || "Failed to load feedback");
      console.error("Error fetching feedback:", err);
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
      npsScore: "",
      feedbackType: "",
      dateFrom: "",
      dateTo: "",
      search: "",
    });
    setPage(1);
  };

  const getNPSColor = (score) => {
    if (score >= 9) return "promoter";
    if (score >= 7) return "passive";
    return "detractor";
  };

  if (loading) return <div className="loading">Loading feedback...</div>;
  if (error) return <div className="error">Error: {error}</div>;

  return (
    <div className="feedback-list">
      <FeedbackModal feedback={selectedFeedback} onClose={() => setSelectedFeedback(null)} />
      
      <div className="list-header">
        <h2>Customer Feedback</h2>
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
          name="npsScore"
          value={filters.npsScore}
          onChange={handleFilterChange}
          className="filter-select"
        >
          <option value="">All NPS Scores</option>
          <option value="9">Promoter (9-10)</option>
          <option value="7">Passive (7-8)</option>
          <option value="0">Detractor (0-6)</option>
        </select>
        <select
          name="feedbackType"
          value={filters.feedbackType}
          onChange={handleFilterChange}
          className="filter-select"
        >
          <option value="">All Types</option>
          <option value="SERVICE">Service</option>
          <option value="FACILITY">Facility</option>
          <option value="STAFF">Staff</option>
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
            <th>NPS Score</th>
            <th>Service Quality</th>
            <th>Staff Behavior</th>
            <th>Cleanliness</th>
            <th>Wait Time</th>
            <th>Type</th>
            <th>Date</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {feedback.map((item) => (
            <tr key={item.id}>
              <td>{item.user?.fullName || "N/A"}</td>
              <td>
                <span className={`badge badge-nps badge-${getNPSColor(item.npsScore)}`}>
                  {item.npsScore || "-"}/10
                </span>
              </td>
              <td>
                <span className="rating">{item.serviceQuality || "-"}/5</span>
              </td>
              <td>
                <span className="rating">{item.staffBehavior || "-"}/5</span>
              </td>
              <td>
                <span className="rating">{item.cleanliness || "-"}/5</span>
              </td>
              <td>
                <span className="rating">{item.waitTime || "-"}/5</span>
              </td>
              <td>{item.feedbackType || "-"}</td>
              <td>{new Date(item.createdAt).toLocaleDateString()}</td>
              <td>
                <button className="btn-view" onClick={() => setSelectedFeedback(item)}>View</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {feedback.length === 0 && (
        <div className="empty-state">No feedback found</div>
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
          disabled={feedback.length < 20}
          className="btn-next"
        >
          Next
        </button>
      </div>
    </div>
  );
}

export default FeedbackList;
