import React, { useState } from "react";
import FilterBar from "../../components/admin/FilterBar";
import UsersList from "../../components/admin/UsersList";
import EditUserModal from "../../components/admin/EditUserModal";
import CreateUserModal from "../../components/admin/CreateUserModal";
import { adminService } from "../../services/adminService";

function UserManagement() {
  const [filters, setFilters] = useState({});
  const [selectedUser, setSelectedUser] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
  };

  const handleEdit = (user) => {
    setSelectedUser(user);
    setShowEditModal(true);
  };

  const handleDelete = async (userId) => {
    if (window.confirm("Are you sure you want to delete this user?")) {
      try {
        await adminService.deleteUser(userId);
        alert("User deleted successfully");
        setRefreshKey((prev) => prev + 1);
      } catch (err) {
        alert("Failed to delete user: " + (err.response?.data?.message || err.message));
      }
    }
  };

  const handleEditSuccess = () => {
    setRefreshKey((prev) => prev + 1);
  };

  const handleCreateSuccess = () => {
    setRefreshKey((prev) => prev + 1);
  };

  return (
    <div className="management-section">
      <div className="section-header">
        <h2>👥 User Management</h2>
      </div>

      <FilterBar 
        onFilterChange={handleFilterChange}
        showRegionFilter={true}
        showCenterFilter={true}
      />

      <UsersList 
        key={refreshKey}
        filters={filters}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onCreateClick={() => setShowCreateModal(true)}
      />

      <EditUserModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        user={selectedUser}
        onSuccess={handleEditSuccess}
      />

      <CreateUserModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={handleCreateSuccess}
      />
    </div>
  );
}

export default UserManagement;
