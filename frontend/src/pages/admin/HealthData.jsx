import React from "react";
import FilterBar from "../../components/admin/FilterBar";

function HealthData() {
  const handleFilterChange = (newFilters) => {
    // TODO: Fetch health data with filters
  };

  return (
    <div className="management-section">
      <div className="section-header">
        <h2>💊 Health Data</h2>
      </div>

      <FilterBar 
        onFilterChange={handleFilterChange}
        showRegionFilter={true}
        showCenterFilter={true}
        showDateFilter={true}
      />

      <div className="management-content">
        <p>Health data (vitals & wellness plans) will be implemented in Phase 4</p>
      </div>
    </div>
  );
}

export default HealthData;
