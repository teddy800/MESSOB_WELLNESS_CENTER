import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function MainLayout({ children }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const dashboardTab =
    new URLSearchParams(location.search).get("tab") || "appointments";
  const nurseTab = new URLSearchParams(location.search).get("tab") || "queue";
  const isCustomerDashboard = location.pathname === "/dashboard";
  const isNurseDashboard = location.pathname === "/nurse";

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
            <button
              type="button"
              className="logout-button"
              onClick={handleLogout}
            >
              Logout
            </button>
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
                <Link
                  className={dashboardTab === "profile" ? "active" : ""}
                  to="/dashboard?tab=profile"
                >
                  👤 Profile
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
