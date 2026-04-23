import React from 'react';
import { Link, useLocation } from 'react-router-dom';

function MainLayout({ children }) {
  const location = useLocation();

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
            <Link className={location.pathname === '/login' ? 'active' : ''} to="/login">
              Login
            </Link>
          </nav>
        </aside>

        <main className="app-main">{children}</main>
      </div>
    </div>
  );
}

export default MainLayout;
