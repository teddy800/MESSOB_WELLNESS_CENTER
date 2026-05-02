import React from "react";
import FilterBar from "../../components/admin/FilterBar";

function FeedbackQuality() {
  const handleFilterChange = (newFilters) => {
    // TODO: Fetch feedback with filters
  };

  return (
    <div className="management-section">
      <div className="section-header">
        <h2>⭐ Feedback & Quality</h2>
      </div>

      <FilterBar 
        onFilterChange={handleFilterChange}
        showRegionFilter={true}
        showCenterFilter={true}
        showDateFilter={true}
      />

      <div className="management-content">
        <p>Feedback analytics will be implemented in Phase 4</p>
      </div>
    </div>
  );
}

export default FeedbackQuality;
