import React, { useState } from "react";
import FilterBar from "../../components/admin/FilterBar";

function UserManagement() {
  const [filters, setFilters] = useState({});

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
    // TODO: Fetch users with filters
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

      <div className="management-content">
        <p>User management table will be implemented in Phase 3</p>
      </div>
    </div>
  );
}

export default UserManagement;
