import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "../styles/maintenance.css";

function MaintenanceMode() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleAdminAccess = () => {
    navigate("/admin");
  };

  return (
    <div className="maintenance-container">
      <div className="maintenance-content">
        <div className="maintenance-icon">🔧</div>
        <h1>System Maintenance</h1>
        <p>We're currently performing scheduled maintenance to improve your experience.</p>
        <div className="maintenance-details">
          <p>Expected downtime: 1-2 hours</p>
          <p>We apologize for any inconvenience.</p>
        </div>
        <div className="maintenance-footer">
          <p>For urgent issues, contact: support@mesob.com</p>
        </div>
        {user?.role === "SYSTEM_ADMIN" && (
          <button className="btn-admin-access" onClick={handleAdminAccess}>
            Admin Access
          </button>
        )}
      </div>
    </div>
  );
}

export default MaintenanceMode;
