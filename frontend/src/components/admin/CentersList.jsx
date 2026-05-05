import React, { useEffect, useState } from "react";
import { adminService } from "../../services/adminService";

function CentersList({ filters, onEdit, onDelete }) {
  const [centers, setCenters] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 0 });

  useEffect(() => {
    fetchCenters();
  }, [filters]);

  const fetchCenters = async () => {
    try {
      setLoading(true);
      const result = await adminService.getCenters({ ...filters, page: pagination.page, limit: pagination.limit });
      setCenters(result.data || []);
      setPagination(result.pagination || {});
      setError(null);
    } catch (err) {
      setError(err.message || "Failed to load centers");
      console.error("Error fetching centers:", err);
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (newPage) => {
    setPagination({ ...pagination, page: newPage });
  };

  if (loading) {
    return <div className="table-loading">Loading centers...</div>;
  }

  if (error) {
    return <div className="table-error">Error: {error}</div>;
  }

  return (
    <div className="table-container">
      <table className="data-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Code</th>
            <th>Region</th>
            <th>City</th>
            <th>Status</th>
            <th>Staff</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {centers.length === 0 ? (
            <tr>
              <td colSpan="7" className="table-empty">No centers found</td>
            </tr>
          ) : (
            centers.map((center) => (
              <tr key={center.id}>
                <td className="cell-name">{center.name}</td>
                <td className="cell-code">{center.code}</td>
                <td className="cell-region">{center.region}</td>
                <td className="cell-city">{center.city}</td>
                <td className="cell-status">
                  <span className={`status ${center.status.toLowerCase()}`}>
                    {center.status}
                  </span>
                </td>
                <td className="cell-count">{center._count?.staff || 0}</td>
                <td className="cell-actions">
                  <button 
                    className="btn-icon edit"
                    onClick={() => onEdit(center)}
                    title="Edit"
                  >
                    ✎
                  </button>
                  <button 
                    className="btn-icon delete"
                    onClick={() => onDelete(center.id)}
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

export default CentersList;
