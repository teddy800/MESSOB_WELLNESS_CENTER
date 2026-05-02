import React, { useState } from "react";
import FilterBar from "../../components/admin/FilterBar";
import UsersList from "../../components/admin/UsersList";

function UserManagement() {
  const [filters, setFilters] = useState({});
  const [selectedUser, setSelectedUser] = useState(null);

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
  };

  const handleEdit = (user) => {
    setSelectedUser(user);
    // TODO: Open edit modal
  };

  const handleDelete = (userId) => {
    if (window.confirm("Are you sure you want to delete this user?")) {
      // TODO: Call delete API
      console.log("Delete user:", userId);
    }
  };

  return (
    <div className="management-section">
      <div className="section-header">
        <h2>👥 User Management</h2>
        <button className="btn-primary">+ Add User</button>
      </div>

      <FilterBar 
        onFilterChange={handleFilterChange}
        showRegionFilter={true}
        showCenterFilter={true}
      />

      <UsersList 
        filters={filters}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />
    </div>
  );
}

export default UserManagement;
