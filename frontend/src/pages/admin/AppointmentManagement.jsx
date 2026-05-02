import React, { useState } from "react";
import FilterBar from "../../components/admin/FilterBar";

function AppointmentManagement() {
  const [filters, setFilters] = useState({});

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
    // TODO: Fetch appointments with filters
  };

  return (
    <div className="management-section">
      <div className="section-header">
        <h2>📅 Appointment Management</h2>
      </div>

      <FilterBar 
        onFilterChange={handleFilterChange}
        showRegionFilter={true}
        showCenterFilter={true}
        showDateFilter={true}
      />

      <div className="management-content">
        <p>Appointment management table will be implemented in Phase 3</p>
      </div>
    </div>
  );
}

export default AppointmentManagement;
