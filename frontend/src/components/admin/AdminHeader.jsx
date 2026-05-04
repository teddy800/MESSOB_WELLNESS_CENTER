import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

function AdminHeader({ onToggleSidebar, onTabChange }) {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);

  const handleProfileClick = () => {
    setShowUserMenu(false);
    onTabChange("profile");
  };

  const handleSettingsClick = () => {
    setShowUserMenu(false);
    onTabChange("settings");
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const getInitials = (name) => {
    if (!name) return "SA";
    return name.split(" ").map((n) => n[0]).join("").toUpperCase();
  };

  return (
    <header className="admin-header">
      <div className="header-left">
        <button 
          className="sidebar-toggle"
          onClick={onToggleSidebar}
          title="Toggle sidebar"
        >
          ☰
        </button>
        <h1 className="page-title">MESOB Wellness System</h1>
      </div>

      <div className="header-right">
        <div className="search-bar">
          <input 
            type="text" 
            placeholder="Search..." 
            className="search-input"
          />
         
        </div>

        <div className="header-actions">
          <button className="notification-btn" title="Notifications">
            🔔
            <span className="notification-badge">3</span>
          </button>

          <div className="user-menu">
            <button 
              className="user-btn"
              onClick={() => setShowUserMenu(!showUserMenu)}
            >
              <span className="user-avatar">
                {user?.profilePicture ? (
                  <img src={user.profilePicture} alt={user?.fullName} className="avatar-img" />
                ) : (
                  <div className="avatar-initials">{getInitials(user?.fullName)}</div>
                )}
              </span>
              <span className="user-name">{user?.fullName}</span>
              <span className="dropdown-arrow">▼</span>
            </button>

            {showUserMenu && (
              <div className="user-dropdown">
                <button 
                  className="dropdown-item"
                  onClick={handleProfileClick}
                >
                  👤 Profile
                </button>
                <button 
                  className="dropdown-item"
                  onClick={handleSettingsClick}
                >
                  ⚙️ Settings
                </button>
                <hr className="dropdown-divider" />
                <button 
                  className="dropdown-item logout"
                  onClick={handleLogout}
                >
                  🚪 Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

export default AdminHeader;
