import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { notificationService } from "../../services/notificationService";
import NotificationPanel from "./NotificationPanel";

function AdminHeader({ 
  onToggleSidebar, 
  onTabChange, 
  title = "MESOB Wellness System",
  dashboardType = "admin",
  onRefresh,
  loading,
  lastUpdated,
  selectedCenter,
  setSelectedCenter,
  centers = [],
  activeTab
}) {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showCenterFilter, setShowCenterFilter] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchUnreadCount = async () => {
    try {
      const count = await notificationService.getUnreadCount();
      setUnreadCount(count);
    } catch (error) {
      console.error("Error fetching unread count:", error);
    }
  };

  const handleNotificationClick = () => {
    setShowNotifications(true);
    if (unreadCount > 0) {
      notificationService.markAllAsRead().then(() => {
        setUnreadCount(0);
      });
    }
  };

  const [currentTime, setCurrentTime] = useState(new Date());
  useEffect(() => {
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

  const getInitials = (name) => {
    if (!name) return "SA";
    return name.split(" ").map((n) => n[0]).join("").toUpperCase();
  };

  const getHeaderActions = () => {
    if (dashboardType === "manager" || dashboardType === "regional") {
      return (
        <div className="header-actions" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
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

    return (
      <div className="header-actions">
        <button 
          className="notification-btn" 
          title="Notifications"
          onClick={handleNotificationClick}
        >
          🔔
          {unreadCount > 0 && (
            <span className="notification-badge">{unreadCount > 99 ? "99+" : unreadCount}</span>
          )}
        </button>
      </div>
    );
  };

  return (
    <>
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
          
          {/* Advanced Filter Centers - Regional Dashboard */}
          {dashboardType === "regional" && selectedCenter !== undefined && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              marginLeft: '2.5rem',
              paddingLeft: '2.5rem',
              borderLeft: '2px solid rgba(255,255,255,0.2)',
              height: '100%'
            }}>
              {/* Filter Centers Dropdown */}
              <div style={{ position: 'relative' }}>
                <button
                  onClick={() => setShowCenterFilter(!showCenterFilter)}
                  style={{
                    background: 'rgba(255,255,255,0.12)',
                    border: '1.5px solid rgba(255,255,255,0.3)',
                    borderRadius: '8px',
                    padding: '0.65rem 1.3rem',
                    color: 'white',
                    fontSize: '0.95rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    transition: 'all 0.25s ease',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.6rem',
                    whiteSpace: 'nowrap',
                    boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.1)'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.background = 'rgba(255,255,255,0.18)';
                    e.target.style.borderColor = 'rgba(255,255,255,0.5)';
                    e.target.style.boxShadow = 'inset 0 1px 2px rgba(255,255,255,0.15), 0 4px 12px rgba(0,0,0,0.15)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = 'rgba(255,255,255,0.12)';
                    e.target.style.borderColor = 'rgba(255,255,255,0.3)';
                    e.target.style.boxShadow = 'inset 0 1px 2px rgba(255,255,255,0.1)';
                  }}
                >
                  <span style={{ fontSize: '1.1rem' }}>🔍</span>
                  <span>Filter Centers</span>
                  <span style={{ fontSize: '0.75rem', opacity: 0.9, marginLeft: '0.25rem' }}>▼</span>
                </button>

                {/* Advanced Dropdown Menu */}
                {showCenterFilter && (
                  <div style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    marginTop: '0.75rem',
                    background: '#1e3a8a',
                    border: '1px solid rgba(255,255,255,0.2)',
                    borderRadius: '8px',
                    boxShadow: '0 12px 32px rgba(0,0,0,0.3)',
                    zIndex: 1000,
                    minWidth: '280px',
                    maxHeight: '500px',
                    overflowY: 'auto',
                    overflow: 'hidden'
                  }}>
                    {/* Header Section */}
                    <div style={{
                      padding: '1rem',
                      borderBottom: '1px solid rgba(255,255,255,0.1)',
                      fontWeight: 700,
                      fontSize: '0.95rem',
                      color: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}>
                      <span style={{ fontSize: '1.2rem' }}>🏥</span>
                      <span>All Centers ({centers.length})</span>
                    </div>

                    {/* All Centers Option */}
                    <button
                      onClick={() => {
                        setSelectedCenter('all');
                        setShowCenterFilter(false);
                      }}
                      style={{
                        width: '100%',
                        padding: '0.75rem 1rem',
                        border: 'none',
                        background: selectedCenter === 'all' ? 'rgba(255,255,255,0.15)' : 'transparent',
                        textAlign: 'left',
                        cursor: 'pointer',
                        fontSize: '0.9rem',
                        color: 'white',
                        fontWeight: selectedCenter === 'all' ? 600 : 500,
                        transition: 'all 0.15s ease',
                        borderBottom: '1px solid rgba(255,255,255,0.1)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.6rem'
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.background = 'rgba(255,255,255,0.1)';
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.background = selectedCenter === 'all' ? 'rgba(255,255,255,0.15)' : 'transparent';
                      }}
                    >
                      <span style={{ fontSize: '1rem' }}>✅</span>
                      <span style={{ flex: 1 }}>All Centers</span>
                      {selectedCenter === 'all' && <span style={{ color: '#4ade80', fontWeight: 700 }}>✓</span>}
                    </button>

                    {/* Individual Centers */}
                    {centers && centers.length > 0 && centers.map((center, index) => (
                      <button
                        key={center.id}
                        onClick={() => {
                          setSelectedCenter(center.id);
                          setShowCenterFilter(false);
                        }}
                        style={{
                          width: '100%',
                          padding: '0.75rem 1rem',
                          border: 'none',
                          background: selectedCenter === center.id ? 'rgba(255,255,255,0.15)' : 'transparent',
                          textAlign: 'left',
                          cursor: 'pointer',
                          fontSize: '0.9rem',
                          color: 'white',
                          fontWeight: selectedCenter === center.id ? 600 : 500,
                          transition: 'all 0.15s ease',
                          borderBottom: index < centers.length - 1 ? '1px solid rgba(255,255,255,0.1)' : 'none',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.6rem'
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.background = 'rgba(255,255,255,0.1)';
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.background = selectedCenter === center.id ? 'rgba(255,255,255,0.15)' : 'transparent';
                        }}
                      >
                        <span style={{ fontSize: '1rem' }}>
                          {center.status === 'ACTIVE' ? '✅' : '⚠️'}
                        </span>
                        <span style={{ flex: 1 }}>
                          <div style={{ fontWeight: 500 }}>{center.name}</div>
                          <div style={{ 
                            fontSize: '0.7rem', 
                            opacity: 0.7,
                            marginTop: '0.1rem'
                          }}>
                            {center.status === 'ACTIVE' ? '🟢 Active' : '🟡 Inactive'}
                          </div>
                        </span>
                        {selectedCenter === center.id && (
                          <span style={{ color: '#4ade80', fontWeight: 700 }}>✓</span>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
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
                  <div className="avatar-initials">{getInitials(user?.fullName)}</div>
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
                {dashboardType === "manager" && (
                  <>
                    <button 
                      className="dropdown-item"
                      onClick={() => {
                        setShowUserMenu(false);
                        navigate("/manager-profile");
                      }}
                    >
                      👤 Profile
                    </button>
                    <hr className="dropdown-divider" />
                  </>
                )}
                {dashboardType === "regional" && (
                  <>
                    <button 
                      className="dropdown-item"
                      onClick={() => {
                        setShowUserMenu(false);
                        navigate("/regional-profile");
                      }}
                    >
                      👤 Profile
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
      <NotificationPanel isOpen={showNotifications} onClose={() => setShowNotifications(false)} />
    </>
  );
}

export default AdminHeader;
