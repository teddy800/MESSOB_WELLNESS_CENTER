import React, { useState } from "react";
import FilterBar from "../../components/admin/FilterBar";

function CenterManagement() {
  const [filters, setFilters] = useState({});

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
    // TODO: Fetch centers with filters
  };

  return (
    <div className="management-section">
      <div className="section-header">
        <h2>🏥 Center Management</h2>
        <button className="btn-primary">+ Add Center</button>
      </div>

      <FilterBar 
        onFilterChange={handleFilterChange}
        showRegionFilter={true}
        showCenterFilter={false}
      />

      <div className="management-content">
        <p>Center management table will be implemented in Phase 3</p>
      </div>
    </div>
  );
}

export default CenterManagement;
