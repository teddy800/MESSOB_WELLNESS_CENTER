import React, { useEffect, useState } from "react";
import { adminService } from "../../services/adminService";

function UsersList({ filters, onEdit, onDelete }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 0 });

  useEffect(() => {
    fetchUsers();
  }, [filters]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const result = await adminService.getUsers({ ...filters, page: pagination.page, limit: pagination.limit });
      setUsers(result.data || []);
      setPagination(result.pagination || {});
      setError(null);
    } catch (err) {
      setError(err.message || "Failed to load users");
      console.error("Error fetching users:", err);
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (newPage) => {
    setPagination({ ...pagination, page: newPage });
  };

  if (loading) {
    return <div className="table-loading">Loading users...</div>;
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
            <th>Email</th>
            <th>Role</th>
            <th>Center</th>
            <th>Status</th>
            <th>Verified</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.length === 0 ? (
            <tr>
              <td colSpan="7" className="table-empty">No users found</td>
            </tr>
          ) : (
            users.map((user) => (
              <tr key={user.id}>
                <td className="cell-name">{user.fullName}</td>
                <td className="cell-email">{user.email || "N/A"}</td>
                <td className="cell-role">
                  <span className={`badge badge-${user.role.toLowerCase()}`}>
                    {user.role}
                  </span>
                </td>
                <td className="cell-center">{user.center?.name || "N/A"}</td>
                <td className="cell-status">
                  <span className={`status ${user.isActive ? "active" : "inactive"}`}>
                    {user.isActive ? "Active" : "Inactive"}
                  </span>
                </td>
                <td className="cell-verified">
                  <span className={`badge ${user.isVerified ? "verified" : "unverified"}`}>
                    {user.isVerified ? "✓" : "✗"}
                  </span>
                </td>
                <td className="cell-actions">
                  <button 
                    className="btn-icon edit"
                    onClick={() => onEdit(user)}
                    title="Edit"
                  >
                    ✎
                  </button>
                  <button 
                    className="btn-icon delete"
                    onClick={() => onDelete(user.id)}
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

export default UsersList;
