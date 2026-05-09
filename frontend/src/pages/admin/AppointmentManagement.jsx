import React, { useState } from "react";
import FilterBar from "../../components/admin/FilterBar";
import AppointmentsList from "../../components/admin/AppointmentsList";
import EditAppointmentModal from "../../components/admin/EditAppointmentModal";
import { adminService } from "../../services/adminService";

function AppointmentManagement() {
  const [filters, setFilters] = useState({});
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
  };

  const handleEdit = (appointment) => {
    setSelectedAppointment(appointment);
    setShowEditModal(true);
  };

  const handleDelete = async (appointmentId) => {
    if (window.confirm("Are you sure you want to delete this appointment?")) {
      try {
        await adminService.deleteAppointment(appointmentId);
        alert("Appointment deleted successfully");
        setRefreshKey((prev) => prev + 1);
      } catch (err) {
        alert("Failed to delete appointment: " + (err.response?.data?.message || err.message));
      }
    }
  };

  const handleEditSuccess = () => {
    setRefreshKey((prev) => prev + 1);
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

      <AppointmentsList 
        key={refreshKey}
        filters={filters}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      <EditAppointmentModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        appointment={selectedAppointment}
        onSuccess={handleEditSuccess}
      />
    </div>
  );
}

export default AppointmentManagement;
