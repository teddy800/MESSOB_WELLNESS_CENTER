import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

function AdminHeader({ 
  user, 
  onToggleSidebar, 
  onTabChange, 
  title = "MESOB Wellness System",
  dashboardType = "admin",
  onRefresh,
  loading,
  lastUpdated
}) {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);

  // Live clock
  const [currentTime, setCurrentTime] = useState(new Date());
  React.useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

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

  const getHeaderActions = () => {
    if (dashboardType === "manager" || dashboardType === "regional") {
      return (
        <div className="header-actions" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          {/* Live Clock */}
          <div style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'flex-end',
            color: 'white'
          }}>
            <div style={{ 
              fontSize: '1.1rem', 
              fontWeight: 700, 
              fontVariantNumeric: 'tabular-nums',
              letterSpacing: '0.05em'
            }}>
              {currentTime.toLocaleTimeString('en-US', { 
                hour: '2-digit', 
                minute: '2-digit', 
                second: '2-digit' 
              })}
            </div>
            <div style={{ 
              fontSize: '0.75rem', 
              opacity: 0.8,
              marginTop: '-0.125rem'
            }}>
              {currentTime.toLocaleDateString('en-US', { 
                weekday: 'short', 
                month: 'short', 
                day: 'numeric' 
              })}
            </div>
          </div>

          {/* Last Updated */}
          {lastUpdated && (
            <div style={{ 
              fontSize: '0.75rem', 
              color: 'rgba(255,255,255,0.7)',
              textAlign: 'right'
            }}>
              <div>Last Updated</div>
              <div style={{ fontWeight: 600, marginTop: '0.125rem' }}>
                {lastUpdated.toLocaleTimeString('en-US', { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              </div>
            </div>
          )}

          {/* Refresh Button */}
          {onRefresh && (
            <button
              onClick={onRefresh}
              disabled={loading}
              style={{
                background: 'rgba(255,255,255,0.15)',
                border: '1px solid rgba(255,255,255,0.3)',
                borderRadius: '8px',
                padding: '0.5rem 1rem',
                color: 'white',
                fontSize: '0.875rem',
                fontWeight: 600,
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
              onMouseEnter={(e) => {
                if (!loading) {
                  e.target.style.background = 'rgba(255,255,255,0.25)';
                  e.target.style.borderColor = 'rgba(255,255,255,0.5)';
                }
              }}
              onMouseLeave={(e) => {
                e.target.style.background = 'rgba(255,255,255,0.15)';
                e.target.style.borderColor = 'rgba(255,255,255,0.3)';
              }}
            >
              <span>{loading ? '⏳' : '🔄'}</span>
              <span>{loading ? 'Updating...' : 'Refresh'}</span>
            </button>
          )}
        </div>
      );
    }

    // Default admin actions
    return (
      <div className="header-actions">
        <button className="notification-btn" title="Notifications">
          🔔
          <span className="notification-badge">3</span>
        </button>
      </div>
    );
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
        <h1 className="page-title">{title}</h1>
      </div>

      <div className="header-right">
        {dashboardType === "admin" && (
          <div className="search-bar">
            <input 
              type="text" 
              placeholder="Search..." 
              className="search-input"
            />
          </div>
        )}

        {getHeaderActions()}

        <div className="user-menu">
          <button 
            className="user-btn"
            onClick={() => setShowUserMenu(!showUserMenu)}
          >
            <span className="user-avatar">
              {user?.profilePicture ? (
                <img src={user.profilePicture} alt={user?.fullName} className="avatar-img" />
              ) : (
                "👤"
              )}
            </span>
            <span className="user-name">{user?.fullName}</span>
            <span className="dropdown-arrow">▼</span>
          </button>

          {showUserMenu && (
            <div className="user-dropdown">
              {dashboardType === "admin" && (
                <>
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
                </>
              )}
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
    </header>
  );
}

export default AdminHeader;
