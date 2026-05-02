import React from "react";
import FilterBar from "../../components/admin/FilterBar";

function Analytics() {
  const handleFilterChange = (newFilters) => {
    // TODO: Fetch analytics with filters
  };

  return (
    <div className="management-section">
      <div className="section-header">
        <h2>📈 Analytics & Reports</h2>
      </div>

      <FilterBar 
        onFilterChange={handleFilterChange}
        showRegionFilter={true}
        showCenterFilter={true}
        showDateFilter={true}
      />

      <div className="management-content">
        <p>Analytics dashboard will be implemented in Phase 5</p>
      </div>
    </div>
  );
}

export default Analytics;
