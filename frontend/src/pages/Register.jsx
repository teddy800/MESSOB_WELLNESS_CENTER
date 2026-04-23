import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Heart, Eye, EyeOff } from 'lucide-react';
import { authService } from '../services/authService';
import toast from 'react-hot-toast';

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    fullName: '', email: '', password: '', confirmPassword: '',
    phone: '', gender: '', dateOfBirth: '',
  });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      await authService.register({
        fullName: form.fullName,
        email: form.email,
        password: form.password,
        phone: form.phone || undefined,
        gender: form.gender || undefined,
        dateOfBirth: form.dateOfBirth || undefined,
      });
      toast.success('Account created! Please sign in.');
      navigate('/login');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-sky-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-teal-500 to-teal-700 shadow-lg mb-4">
            <Heart size={30} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800">Create Account</h1>
          <p className="text-slate-500 text-sm mt-1">Join the MESOB Wellness Platform</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Full Name *</label>
              <input required value={form.fullName} onChange={set('fullName')}
                placeholder="Abebe Kebede"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 transition-colors" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Email *</label>
              <input required type="email" value={form.email} onChange={set('email')}
                placeholder="you@example.com"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 transition-colors" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Phone</label>
                <input value={form.phone} onChange={set('phone')} placeholder="+251..."
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 transition-colors" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Gender</label>
                <select value={form.gender} onChange={set('gender')}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 transition-colors">
                  <option value="">Select</option>
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                  <option value="OTHER">Other</option>
                  <option value="PREFER_NOT_TO_SAY">Prefer not to say</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Date of Birth</label>
              <input type="date" value={form.dateOfBirth} onChange={set('dateOfBirth')}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 transition-colors" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Password *</label>
              <div className="relative">
                <input required type={showPw ? 'text' : 'password'} value={form.password} onChange={set('password')}
                  placeholder="Min 8 chars, uppercase, number"
                  className="w-full px-4 py-2.5 pr-11 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 transition-colors" />
                <button type="button" onClick={() => setShowPw(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  {showPw ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Confirm Password *</label>
              <input required type="password" value={form.confirmPassword} onChange={set('confirmPassword')}
                placeholder="Repeat password"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 transition-colors" />
            </div>
            <button type="submit" disabled={loading}
              className="w-full bg-teal-600 hover:bg-teal-700 disabled:opacity-60 text-white font-semibold py-2.5 rounded-xl transition-colors mt-2">
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-slate-400 mt-4">
          Already have an account?{' '}
          <Link to="/login" className="text-teal-600 font-semibold hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
