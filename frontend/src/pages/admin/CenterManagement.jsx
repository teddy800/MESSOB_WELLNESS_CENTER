import React, { useState, useEffect } from "react";
import FilterBar from "../../components/admin/FilterBar";
import CentersList from "../../components/admin/CentersList";
import AddCenterModal from "../../components/admin/AddCenterModal";
import EditCenterModal from "../../components/admin/EditCenterModal";
import { adminService } from "../../services/adminService";

function CenterManagement() {
  const [filters, setFilters] = useState({});
  const [selectedCenter, setSelectedCenter] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [regions, setRegions] = useState([]);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    loadRegions();
  }, []);

  const loadRegions = async () => {
    try {
      const data = await adminService.getRegions();
      setRegions(data || []);
    } catch (err) {
      console.error("Error loading regions:", err);
    }
  };

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
  };

  const handleEdit = (center) => {
    setSelectedCenter(center);
    setShowEditModal(true);
  };

  const handleDelete = async (centerId) => {
    if (window.confirm("Are you sure you want to delete this center?")) {
      try {
        await adminService.deleteCenter(centerId);
        alert("Center deleted successfully");
        setRefreshKey((prev) => prev + 1);
      } catch (err) {
        alert("Failed to delete center: " + (err.response?.data?.message || err.message));
      }
    }
  };

  const handleAddSuccess = () => {
    setRefreshKey((prev) => prev + 1);
    loadRegions();
  };

  const handleEditSuccess = () => {
    setRefreshKey((prev) => prev + 1);
  };

  return (
    <div className="management-section">
      <div className="section-header">
        <h2>🏥 Center Management</h2>
        <button 
          className="btn-primary"
          onClick={() => setShowAddModal(true)}
        >
          + Add Center
        </button>
      </div>

      <FilterBar 
        onFilterChange={handleFilterChange}
        showRegionFilter={true}
        showCenterFilter={false}
      />

      <CentersList 
        key={refreshKey}
        filters={filters}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      <AddCenterModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={handleAddSuccess}
        regions={regions}
      />

      <EditCenterModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        center={selectedCenter}
        onSuccess={handleEditSuccess}
        regions={regions}
      />
    </div>
  );
}

export default CenterManagement;
