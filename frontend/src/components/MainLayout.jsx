import { Link, useLocation } from 'react-router-dom';

function MainLayout({ children }) {
  const location = useLocation();

  return (
    <div className="layout-shell">
      <header className="app-header">
        <h1>Mesob Wellness</h1>
        <p>Day 1 MVP Skeleton</p>
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
