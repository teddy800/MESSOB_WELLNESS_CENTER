import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Activity, Calendar, Heart, Home, LogOut, Menu,
  MessageSquare, Settings, Users, Building2, BarChart3, ChevronRight, Shield,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

// Role-based nav — roles: null means all authenticated users
const NAV_ITEMS = [
  { path: '/dashboard',    label: 'Dashboard',     icon: Home,          roles: null },
  { path: '/vitals',       label: 'Vitals',         icon: Activity,      roles: null },
  { path: '/appointments', label: 'Appointments',   icon: Calendar,      roles: null },
  { path: '/wellness',     label: 'Wellness Plans', icon: Heart,         roles: null },
  { path: '/feedback',     label: 'Feedback',       icon: MessageSquare, roles: null },
  // NURSE_OFFICER and above
  { path: '/centers',      label: 'Centers',        icon: Building2,     roles: ['NURSE_OFFICER','MANAGER','REGIONAL_OFFICE','FEDERAL_ADMIN'] },
  { path: '/analytics',    label: 'Analytics',      icon: BarChart3,     roles: ['NURSE_OFFICER','MANAGER','REGIONAL_OFFICE','FEDERAL_ADMIN'] },
  // MANAGER and above
  { path: '/manager',      label: 'Manager Dashboard', icon: Shield,     roles: ['MANAGER','REGIONAL_OFFICE','FEDERAL_ADMIN'] },
  { path: '/users',        label: 'Users',          icon: Users,         roles: ['MANAGER','FEDERAL_ADMIN'] },
  { path: '/profile',      label: 'Profile',        icon: Settings,      roles: null },
];

const ROLE_COLORS = {
  CUSTOMER_STAFF:  'bg-sky-100 text-sky-700',
  NURSE_OFFICER:   'bg-emerald-100 text-emerald-700',
  MANAGER:         'bg-purple-100 text-purple-700',
  REGIONAL_OFFICE: 'bg-amber-100 text-amber-700',
  FEDERAL_ADMIN:   'bg-red-100 text-red-700',
};

const ROLE_LABELS = {
  CUSTOMER_STAFF:  'Customer / Staff',
  NURSE_OFFICER:   'Nurse / Officer',
  MANAGER:         'Manager',
  REGIONAL_OFFICE: 'Regional Office',
  FEDERAL_ADMIN:   'Federal Admin',
};

export default function MainLayout({ children }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    toast.success('Logged out successfully');
    navigate('/login');
  };

  const visibleNav = NAV_ITEMS.filter(item =>
    !item.roles || item.roles.includes(user?.role)
  );

  const currentPage = visibleNav.find(n => n.path === location.pathname)?.label || 'MESOB Wellness';

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-teal-500 to-teal-700 flex items-center justify-center shadow-sm">
            <Heart size={18} className="text-white" />
          </div>
          <div>
            <p className="font-bold text-slate-800 text-sm leading-tight">MESOB Wellness</p>
            <p className="text-xs text-slate-400">Health Platform</p>
          </div>
        </div>
      </div>

      {/* User info */}
      <div className="px-4 py-3 mx-3 mt-3 rounded-xl bg-slate-50 border border-slate-100">
        <p className="text-sm font-semibold text-slate-800 truncate">{user?.fullName}</p>
        <p className="text-xs text-slate-400 truncate">{user?.email}</p>
        <span className={`mt-1.5 inline-block text-xs font-semibold px-2 py-0.5 rounded-full ${ROLE_COLORS[user?.role] || 'bg-slate-100 text-slate-600'}`}>
          {ROLE_LABELS[user?.role] || user?.role}
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto">
        {visibleNav.map(({ path, label, icon: Icon }) => {
          const active = location.pathname === path;
          return (
            <Link
              key={path}
              to={path}
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group
                ${active
                  ? 'bg-teal-600 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-800'
                }`}
            >
              <Icon size={17} className={active ? 'text-white' : 'text-slate-400 group-hover:text-slate-600'} />
              <span className="flex-1">{label}</span>
              {active && <ChevronRight size={14} className="text-teal-200" />}
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="px-3 py-3 border-t border-slate-100">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium text-slate-600 hover:bg-red-50 hover:text-red-600 transition-all"
        >
          <LogOut size={17} />
          Sign Out
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-64 bg-white border-r border-slate-200 flex-shrink-0">
        <SidebarContent />
      </aside>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setSidebarOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-64 bg-white shadow-2xl z-50">
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <header className="bg-white border-b border-slate-200 px-4 lg:px-6 py-3 flex items-center gap-3 flex-shrink-0">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 rounded-lg hover:bg-slate-100 text-slate-500"
            aria-label="Open menu"
          >
            <Menu size={20} />
          </button>
          <div className="flex-1">
            <h1 className="text-base font-bold text-slate-800">{currentPage}</h1>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-teal-600 flex items-center justify-center text-white text-sm font-bold">
              {user?.fullName?.[0]?.toUpperCase() || 'U'}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
