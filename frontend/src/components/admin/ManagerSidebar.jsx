import React from "react";
import { useAuth } from "../../context/AuthContext";

function ManagerSidebar({ 
  activeTab, 
  onTabChange, 
  isOpen, 
  user, 
  capacityInfo, 
  staffCount = 0, 
  onRefresh, 
  loading 
}) {
  const { user: authUser } = useAuth();
  const currentUser = user || authUser;

  // Calculate capacity percentage for urgency indicator
  const usedPct = capacityInfo
    ? Math.round((capacityInfo.slotsUsed / (capacityInfo.dailyLimit || 1)) * 100)
    : 0;
  const capacityColor = usedPct > 85 ? '#ef4444' : usedPct > 60 ? '#f59e0b' : '#22c55e';

  const menuItems = [
    { id: "overview", label: "Overview", icon: "📊" },
    { id: "capacity", label: "Capacity", icon: "🎛️" },
    { id: "analytics", label: "Analytics", icon: "📈" },
    { id: "users", label: "Staff", icon: "👥", count: staffCount },
    { id: "audit", label: "Audit", icon: "🔍" },
    { id: "settings", label: "Settings", icon: "⚙️" },
  ];

  return (
    <aside className={`admin-sidebar ${isOpen ? "open" : "closed"}`}>
      <div className="sidebar-header">
        <div className="sidebar-logo">
          <span className="logo-icon">🏥</span>
          <span className="logo-text">MESOB Manager</span>
        </div>
        <div className="user-info">
          <p className="user-name">{currentUser?.fullName}</p>
          <p className="user-role">Center Manager</p>
          {currentUser?.center?.name && (
            <p className="user-center" style={{ 
              fontSize: '0.75rem', 
              opacity: 0.7, 
              margin: '0.25rem 0 0 0',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}>
              📍 {currentUser.center.name}
            </p>
          )}
        </div>
      </div>

      <nav className="sidebar-nav">
        {menuItems.map((item) => (
          <button
            key={item.id}
            className={`nav-item ${activeTab === item.id ? "active" : ""}`}
            onClick={() => onTabChange(item.id)}
            title={item.label}
          >
            <span className="nav-icon">{item.icon}</span>
            <span className="nav-label">
              {item.label}
              {item.count !== undefined && (
                <span className="nav-count" style={{
                  marginLeft: '0.5rem',
                  background: 'rgba(255,255,255,0.2)',
                  borderRadius: '12px',
                  padding: '0.125rem 0.5rem',
                  fontSize: '0.75rem',
                  fontWeight: 600
                }}>
                  {item.count}
                </span>
              )}
            </span>
          </button>
        ))}
      </nav>

      <div className="sidebar-footer">
        {/* Capacity Indicator */}
        <div style={{
          padding: '1rem',
          borderTop: '1px solid rgba(255,255,255,0.1)',
          marginBottom: '1rem'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            marginBottom: '0.5rem'
          }}>
            <span style={{ fontSize: '1rem' }}>
              {usedPct > 85 ? '🔴' : usedPct > 60 ? '🟡' : '🟢'}
            </span>
            <span style={{ 
              fontSize: '0.875rem', 
              fontWeight: 600,
              color: capacityColor 
            }}>
              Capacity {usedPct}%
            </span>
          </div>
          <div style={{
            width: '100%',
            height: '6px',
            background: 'rgba(255,255,255,0.2)',
            borderRadius: '3px',
            overflow: 'hidden'
          }}>
            <div style={{
              width: `${Math.min(usedPct, 100)}%`,
              height: '100%',
              background: capacityColor,
              borderRadius: '3px',
              transition: 'width 0.3s ease'
            }} />
          </div>
          <div style={{
            fontSize: '0.75rem',
            opacity: 0.7,
            marginTop: '0.25rem'
          }}>
            {capacityInfo?.slotsUsed || 0} of {capacityInfo?.dailyLimit || 100} slots
          </div>
        </div>

        {/* Refresh Button */}
        <div style={{ padding: '0 1rem 1rem' }}>
          <button
            onClick={onRefresh}
            disabled={loading}
            style={{
              width: '100%',
              background: 'rgba(255,255,255,0.1)',
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: '6px',
              padding: '0.5rem',
              color: 'white',
              fontSize: '0.875rem',
              fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              if (!loading) {
                e.target.style.background = 'rgba(255,255,255,0.2)';
              }
            }}
            onMouseLeave={(e) => {
              e.target.style.background = 'rgba(255,255,255,0.1)';
            }}
          >
            {loading ? '⏳ Updating...' : '🔄 Refresh Data'}
          </button>
        </div>

        <p className="version">Manager v1.0.0</p>
      </div>
    </aside>
  );
}

export default ManagerSidebar;