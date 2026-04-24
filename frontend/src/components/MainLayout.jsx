import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function MainLayout({ children }) {
  const location = useLocation();
  const { user } = useAuth();

  // Check if user has manager access
  const hasManagerAccess = () => {
    return user && ['MANAGER', 'REGIONAL_OFFICE', 'FEDERAL_ADMIN'].includes(user.role);
  };

  return (
    <div className="layout-shell">
      <header className="app-header">
        <div className="app-header-left">
          <img src="/Mesob-short-png.png" alt="MESOB Logo" className="mesob-logo-img" />
        </div>
        <h1>MESOB</h1>
        <div className="app-header-right">
          <select className="language-selector">
            <option value="en">English</option>
            <option value="am">አማርኛ</option>
          </select>
        </div>
      </header>

      <div className="layout-body">
        <aside className="app-sidebar">
          <nav>
            <Link
              className={location.pathname === '/dashboard' ? 'active' : ''}
              to="/dashboard"
            >
              Dashboard
            </Link>
            {hasManagerAccess() && (
              <Link
                className={location.pathname === '/manager' ? 'active' : ''}
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
