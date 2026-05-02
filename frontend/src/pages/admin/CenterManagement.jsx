import React, { useState } from "react";
import FilterBar from "../../components/admin/FilterBar";
import CentersList from "../../components/admin/CentersList";

function CenterManagement() {
  const [filters, setFilters] = useState({});
  const [selectedCenter, setSelectedCenter] = useState(null);

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
  };

  const handleEdit = (center) => {
    setSelectedCenter(center);
    // TODO: Open edit modal
  };

  const handleDelete = (centerId) => {
    if (window.confirm("Are you sure you want to delete this center?")) {
      // TODO: Call delete API
      console.log("Delete center:", centerId);
    }
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

      <CentersList 
        filters={filters}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />
    </div>
  );
}

export default CenterManagement;
