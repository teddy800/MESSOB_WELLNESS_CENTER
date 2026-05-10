import React, { useState, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function MainLayout({ children }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [displayUser, setDisplayUser] = useState(user);
  const userMenuRef = useRef(null);
  const dashboardTab =
    new URLSearchParams(location.search).get("tab") || "appointments";
  const nurseTab = new URLSearchParams(location.search).get("tab") || "queue";
  const isCustomerDashboard = location.pathname === "/dashboard";
  const isNurseDashboard = location.pathname === "/nurse";

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setShowUserMenu(false);
      }
    };

    if (showUserMenu) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [showUserMenu]);

  // Close dropdown when location changes
  useEffect(() => {
    setShowUserMenu(false);
  }, [location.pathname, location.search]);

  // Update displayUser when user changes and log it
  useEffect(() => {
    console.log("Auth user after update:", user);
    setDisplayUser(user);
  }, [user]);

  // Check if user has manager access
  const hasManagerAccess = () => {
    return (
      user &&
      ["MANAGER", "REGIONAL_OFFICE", "SYSTEM_ADMIN"].includes(user.role)
    );
  };

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  const handleProfileClick = () => {
    setShowUserMenu(false);
    // Emit a custom event that the dashboard can listen to
    window.dispatchEvent(new CustomEvent('profileClicked'));
  };

  const getInitials = (name) => {
    if (!name) return "U";
    return name.split(" ").map((n) => n[0]).join("").toUpperCase();
  };

  return (
    <div className="layout-shell">
      <header className="app-header">
        <div className="app-header-left">
          <img
            src="/Mesob-short-png.png"
            alt="MESOB Logo"
            className="mesob-logo-img"
          />
        </div>
        <h1>MESOB</h1>
        <div className="app-header-right">
          <select className="language-selector">
            <option value="en">English</option>
            <option value="am">አማርኛ</option>
          </select>
          {user && (
            <div className="user-menu-header" ref={userMenuRef}>
              <button
                type="button"
                className="user-btn-header"
                onClick={() => setShowUserMenu(!showUserMenu)}
              >
                <span className="user-avatar-header">
                  {displayUser?.profilePicture ? (
                    <img src={displayUser.profilePicture} alt={displayUser?.fullName} className="avatar-img-header" />
                  ) : (
                    <span className="avatar-icon-header">👤</span>
                  )}
                </span>
                <span className="dropdown-arrow-header">▼</span>
              </button>

              {showUserMenu && (
                <div className="user-dropdown-header">
                  <button 
                    className="dropdown-item-header"
                    onClick={handleProfileClick}
                  >
                    👤 Profile
                  </button>
                  <hr className="dropdown-divider-header" />
                  <button 
                    className="dropdown-item-header logout-header"
                    onClick={handleLogout}
                  >
                    🚪 Logout
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </header>

      <div className="layout-body">
        <aside className="app-sidebar">
          <nav>
            {location.pathname === "/nurse" ? (
              <Link className="active" to="/nurse">
                Nurse Dashboard
              </Link>
            ) : (
              <Link
                className={location.pathname === "/dashboard" ? "active" : ""}
                to="/dashboard"
              >
                Dashboard
              </Link>
            )}

            {isCustomerDashboard && (
              <div
                className="sidebar-subnav"
                aria-label="Customer dashboard sections"
              >
                <Link
                  className={dashboardTab === "appointments" ? "active" : ""}
                  to="/dashboard?tab=appointments"
                >
                  📋 Appointments
                </Link>
                <Link
                  className={dashboardTab === "health" ? "active" : ""}
                  to="/dashboard?tab=health"
                >
                  💪 Health Journey
                </Link>
                <Link
                  className={dashboardTab === "wellness" ? "active" : ""}
                  to="/dashboard?tab=wellness"
                >
                  💊 Wellness Plan
                </Link>
                <Link
                  className={dashboardTab === "records" ? "active" : ""}
                  to="/dashboard?tab=records"
                >
                  📊 Health Records
                </Link>
                <Link
                  className={dashboardTab === "feedback" ? "active" : ""}
                  to="/dashboard?tab=feedback"
                >
                  📝 Feedback
                </Link>
              </div>
            )}

            {isNurseDashboard && (
              <div
                className="sidebar-subnav"
                aria-label="Nurse dashboard sections"
              >
                <Link
                  className={nurseTab === "queue" ? "active" : ""}
                  to="/nurse?tab=queue"
                >
                  Queue
                </Link>
                <Link
                  className={nurseTab === "vitals" ? "active" : ""}
                  to="/nurse?tab=vitals"
                >
                  Vitals
                </Link>
                <Link
                  className={nurseTab === "walkin" ? "active" : ""}
                  to="/nurse?tab=walkin"
                >
                  Walk-in
                </Link>
                <Link
                  className={nurseTab === "wellness" ? "active" : ""}
                  to="/nurse?tab=wellness"
                >
                  Wellness
                </Link>
                <Link
                  className={nurseTab === "history" ? "active" : ""}
                  to="/nurse?tab=history"
                >
                  History
                </Link>
              </div>
            )}

            {hasManagerAccess() && (
              <Link
                className={location.pathname === "/manager" ? "active" : ""}
                to="/manager"
              >
                Manager Dashboard
              </Link>
            )}
          </nav>
        </aside>

        <main className="app-main">{children}</main>
      </div>
    </div>
  );
}

export default MainLayout;
