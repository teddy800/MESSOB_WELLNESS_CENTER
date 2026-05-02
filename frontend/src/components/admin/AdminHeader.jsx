import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

function AdminHeader({ user, onToggleSidebar }) {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/login");
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
          <span className="search-icon">🔍</span>
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
              <span className="user-avatar">👤</span>
              <span className="user-name">{user?.fullName}</span>
              <span className="dropdown-arrow">▼</span>
            </button>

            {showUserMenu && (
              <div className="user-dropdown">
                <a href="#profile" className="dropdown-item">
                  👤 Profile
                </a>
                <a href="#settings" className="dropdown-item">
                  ⚙️ Settings
                </a>
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
