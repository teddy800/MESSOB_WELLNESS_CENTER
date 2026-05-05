import React from "react";
import { useAuth } from "../../context/AuthContext";

function RegionalSidebar({ 
  activeTab, 
  onTabChange, 
  isOpen, 
  user, 
  centerStats, 
  centersCount = 0,
  selectedCenter,
  setSelectedCenter,
  centers = []
}) {
  const { user: authUser } = useAuth();
  const currentUser = user || authUser;

  const roleLabel = currentUser?.role === 'FEDERAL_OFFICE' ? 'Federal Office'
    : currentUser?.role === 'SYSTEM_ADMIN' ? 'System Admin'
    : 'Regional Office';

  const menuItems = [
    { id: "overview", label: "Overview", icon: "📊" },
    { id: "centers", label: "Centers", icon: "🏥", count: centersCount },
    { id: "managers", label: "Managers", icon: "👔" },
    { id: "performance", label: "Performance", icon: "📈" },
  ];

  return (
    <aside className={`admin-sidebar ${isOpen ? "open" : "closed"}`}>
      <div className="sidebar-header">
        <div className="sidebar-logo">
          <span className="logo-icon">🌍</span>
          <span className="logo-text">MESOB Regional</span>
        </div>
        <div className="user-info">
          <p className="user-name">{currentUser?.fullName}</p>
          <p className="user-role">{roleLabel}</p>
          <div style={{
            fontSize: '0.75rem',
            opacity: 0.7,
            margin: '0.25rem 0 0 0',
            display: 'flex',
            alignItems: 'center',
            gap: '0.25rem'
          }}>
            <span>🏥</span>
            <span>{centerStats?.total || centersCount} Centers</span>
            <span style={{ margin: '0 0.25rem' }}>•</span>
            <span>👥 {centerStats?.totalStaff || 0} Staff</span>
          </div>
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
        {/* Center Selector */}
        {centers.length > 0 && setSelectedCenter && (
          <div style={{
            padding: '1rem',
            borderTop: '1px solid rgba(255,255,255,0.1)',
            marginBottom: '1rem'
          }}>
            <div style={{
              fontSize: '0.875rem',
              fontWeight: 600,
              marginBottom: '0.5rem',
              color: 'rgba(255,255,255,0.9)'
            }}>
              🔍 Filter Centers
            </div>
            <select
              value={selectedCenter || 'all'}
              onChange={(e) => setSelectedCenter(e.target.value)}
              style={{
                width: '100%',
                padding: '0.5rem',
                borderRadius: '6px',
                border: '1px solid rgba(255,255,255,0.2)',
                background: 'rgba(255,255,255,0.1)',
                color: 'white',
                fontSize: '0.75rem',
                fontWeight: 500,
                cursor: 'pointer',
                outline: 'none',
                WebkitAppearance: 'none',
                appearance: 'none',
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23ffffff' d='M6 8L1 3h10z'/%3E%3C/svg%3E")`,
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'right 0.5rem center',
              }}
            >
              <option value="all" style={{ background: '#1e3a8a', color: '#ffffff' }}>
                🏥 All Centers ({centers.length})
              </option>
              {centers.map((c) => (
                <option key={c.id} value={c.id} style={{ background: '#1e3a8a', color: '#ffffff' }}>
                  {c.status === 'ACTIVE' ? '✅' : '⚠️'} {c.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Center Statistics */}
        {centerStats && (
          <div style={{
            padding: '1rem',
            borderTop: centers.length > 0 ? 'none' : '1px solid rgba(255,255,255,0.1)',
            marginBottom: '1rem'
          }}>
            <div style={{
              fontSize: '0.875rem',
              fontWeight: 600,
              marginBottom: '0.75rem',
              color: 'rgba(255,255,255,0.9)'
            }}>
              📊 System Status
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.75rem', opacity: 0.8 }}>Active Centers</span>
                <span style={{ 
                  fontSize: '0.875rem', 
                  fontWeight: 700,
                  color: '#22c55e'
                }}>
                  {centerStats.active}/{centerStats.total}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.75rem', opacity: 0.8 }}>Total Capacity</span>
                <span style={{ 
                  fontSize: '0.875rem', 
                  fontWeight: 700,
                  color: '#3b82f6'
                }}>
                  {centerStats.totalCapacity}
                </span>
              </div>
              <div style={{
                width: '100%',
                height: '4px',
                background: 'rgba(255,255,255,0.2)',
                borderRadius: '2px',
                overflow: 'hidden',
                marginTop: '0.25rem'
              }}>
                <div style={{
                  width: `${Math.min((centerStats.active / centerStats.total) * 100, 100)}%`,
                  height: '100%',
                  background: '#22c55e',
                  borderRadius: '2px',
                  transition: 'width 0.3s ease'
                }} />
              </div>
            </div>
          </div>
        )}

        <p className="version">Regional v1.0.0</p>
      </div>
    </aside>
  );
}

export default RegionalSidebar;