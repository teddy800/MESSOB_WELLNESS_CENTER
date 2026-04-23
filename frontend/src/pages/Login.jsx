import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Heart, Eye, EyeOff, LogIn } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

// Both credential sets from the main repo README
const TEST_CREDENTIALS = [
  { role: 'Customer/Staff',  email: 'customer@mesob.et',          password: 'Customer123!' },
  { role: 'Nurse/Officer',   email: 'nurse@mesob.et',             password: 'Nurse123!'    },
  { role: 'Manager',         email: 'manager@mesob.et',           password: 'Manager123!'  },
  { role: 'Regional Office', email: 'regional@mesob.et',          password: 'Regional123!' },
  { role: 'Federal Admin',   email: 'admin@mesob.et',             password: 'Admin123!'    },
  // Local dev credentials
  { role: 'Customer (local)',  email: 'customer.staff@mesob.local',  password: 'Mesob@2026!' },
  { role: 'Nurse (local)',     email: 'nurse.officer@mesob.local',   password: 'Mesob@2026!' },
  { role: 'Manager (local)',   email: 'manager@mesob.local',         password: 'Mesob@2026!' },
  { role: 'Regional (local)',  email: 'regional.office@mesob.local', password: 'Mesob@2026!' },
  { role: 'Federal (local)',   email: 'federal.admin@mesob.local',   password: 'Mesob@2026!' },
];

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showAll, setShowAll] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) {
      toast.error('Email and password are required');
      return;
    }
    setLoading(true);
    try {
      await login(form.email, form.password);
      toast.success('Welcome back!');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed. Check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const visibleCreds = showAll ? TEST_CREDENTIALS : TEST_CREDENTIALS.slice(0, 5);

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-sky-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-teal-500 to-teal-700 shadow-lg mb-4">
            <Heart size={30} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800">MESOB Wellness</h1>
          <p className="text-slate-500 text-sm mt-1">Preventive Health Management Platform</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-8">
          <h2 className="text-xl font-bold text-slate-800 mb-1">Sign in</h2>
          <p className="text-sm text-slate-500 mb-6">Enter your credentials to access the platform</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Email address</label>
              <input
                type="email"
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                placeholder="you@mesob.et"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-teal-400 transition-colors"
                autoComplete="email"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Password</label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  placeholder="••••••••"
                  className="w-full px-4 py-2.5 pr-11 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-teal-400 transition-colors"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPw ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-teal-600 hover:bg-teal-700 disabled:opacity-60 text-white font-semibold py-2.5 rounded-xl transition-colors mt-2"
            >
              {loading ? (
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                </svg>
              ) : <LogIn size={17} />}
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>

          {/* Test credentials */}
          <div className="mt-6 pt-5 border-t border-slate-100">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs text-slate-500 font-semibold uppercase tracking-wide">Quick fill — test accounts</p>
              <button
                type="button"
                onClick={() => setShowAll(v => !v)}
                className="text-xs text-teal-600 hover:underline font-medium"
              >
                {showAll ? 'Show less' : 'Show local dev'}
              </button>
            </div>
            <div className="grid grid-cols-1 gap-1.5 text-xs max-h-64 overflow-y-auto">
              {visibleCreds.map(({ role, email, password }) => (
                <button
                  key={email}
                  type="button"
                  onClick={() => setForm({ email, password })}
                  className="flex items-center justify-between px-3 py-2 rounded-lg bg-slate-50 hover:bg-teal-50 border border-slate-200 hover:border-teal-200 transition-colors text-left group"
                >
                  <span className="font-semibold text-slate-700 group-hover:text-teal-700 w-32 flex-shrink-0">{role}</span>
                  <span className="text-slate-400 truncate">{email}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-slate-400 mt-4">
          Don't have an account?{' '}
          <Link to="/register" className="text-teal-600 font-semibold hover:underline">Register</Link>
        </p>
      </div>
    </div>
  );
}
