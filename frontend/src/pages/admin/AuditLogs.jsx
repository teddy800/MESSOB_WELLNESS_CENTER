import React from "react";
import FilterBar from "../../components/admin/FilterBar";

function AuditLogs() {
  const handleFilterChange = (newFilters) => {
    // TODO: Fetch audit logs with filters
  };

  return (
    <div className="management-section">
      <div className="section-header">
        <h2>📋 Audit Logs</h2>
      </div>

      <FilterBar 
        onFilterChange={handleFilterChange}
        showRegionFilter={true}
        showCenterFilter={true}
        showDateFilter={true}
      />

      <div className="management-content">
        <p>Audit logs will be implemented in Phase 5</p>
      </div>
    </div>
  );
}

export default AuditLogs;
