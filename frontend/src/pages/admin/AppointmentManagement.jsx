import React, { useState } from "react";
import FilterBar from "../../components/admin/FilterBar";
import AppointmentsList from "../../components/admin/AppointmentsList";

function AppointmentManagement() {
  const [filters, setFilters] = useState({});
  const [selectedAppointment, setSelectedAppointment] = useState(null);

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
  };

  const handleEdit = (appointment) => {
    setSelectedAppointment(appointment);
    // TODO: Open edit modal
  };

  const handleDelete = (appointmentId) => {
    if (window.confirm("Are you sure you want to delete this appointment?")) {
      // TODO: Call delete API
      console.log("Delete appointment:", appointmentId);
    }
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
        filters={filters}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />
    </div>
  );
}

export default AppointmentManagement;
