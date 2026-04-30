import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, Lock, User } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import AnimatedWaveBackground from "../components/AnimatedWaveBackground";

// Key for localStorage
const CACHED_CREDENTIALS_KEY = 'mesob_cached_credentials';

// Default test credentials
const DEFAULT_CREDENTIALS = {
  "staff@mesob.et": "Staff123!",
  "nurse@mesob.et": "Nurse123!",
  "manager@mesob.et": "Manager123!",
  "regional@mesob.et": "Regional123!",
  "federal@mesob.et": "Federal123!",
  "admin@mesob.et": "Admin123!",
};

function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [cachedCredentials, setCachedCredentials] = useState({});

  // Load cached credentials on mount
  useEffect(() => {
    try {
      const cached = localStorage.getItem(CACHED_CREDENTIALS_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        setCachedCredentials({ ...DEFAULT_CREDENTIALS, ...parsed });
      } else {
        setCachedCredentials(DEFAULT_CREDENTIALS);
      }
    } catch (error) {
      console.error('Error loading cached credentials:', error);
      setCachedCredentials(DEFAULT_CREDENTIALS);
    }
  }, []);

  // Save credentials to cache
  const cacheCredentials = (email, password) => {
    try {
      const cached = localStorage.getItem(CACHED_CREDENTIALS_KEY);
      const existing = cached ? JSON.parse(cached) : {};
      const updated = { ...existing, [email]: password };
      localStorage.setItem(CACHED_CREDENTIALS_KEY, JSON.stringify(updated));
      setCachedCredentials({ ...DEFAULT_CREDENTIALS, ...updated });
    } catch (error) {
      console.error('Error caching credentials:', error);
    }
  };
  const validateForm = () => {
    const newErrors = {};

    // Email validation
    if (!formData.email) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    const nextFormData = {
      ...formData,
      [name]: value,
    };

    // Auto-fill password when email is selected or matches cached credential
    if (name === "email") {
      const emailLower = value.trim().toLowerCase();
      const cachedPassword = cachedCredentials[emailLower];
      if (cachedPassword) {
        nextFormData.password = cachedPassword;
      }
    }

    setFormData(nextFormData);
    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
    setServerError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setServerError("");

    const result = await login(formData.email, formData.password);

    if (result.success) {
      // Cache credentials on successful login
      cacheCredentials(formData.email.toLowerCase(), formData.password);
      
      const roleRoutes = {
        EXTERNAL_PATIENT: "/dashboard",
        STAFF: "/dashboard",
        NURSE_OFFICER: "/nurse",
        MANAGER: "/manager",
        REGIONAL_OFFICE: "/regional",
        FEDERAL_OFFICE: "/admin",
        SYSTEM_ADMIN: "/admin",
      };
      const route = roleRoutes[result?.user?.role] || "/dashboard";
      navigate(route, { replace: true });
      setLoading(false);
    } else {
      setServerError(result.error);
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[linear-gradient(90deg,#15234b_0%,#1f2f63_40%,#2e4c92_75%,#3a5eb4_100%)]">
      <div
        className="pointer-events-none absolute inset-0 z-10 bg-[linear-gradient(rgba(255,255,255,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.06)_1px,transparent_1px)]"
        style={{ backgroundSize: "56px 56px" }}
      />
      <AnimatedWaveBackground className="absolute inset-0 z-20" />

      <div className="relative z-30 flex min-h-screen items-center justify-center px-4 py-10">
        <div className="w-full max-w-[540px] rounded-2xl border border-white/15 bg-[#3550A0]/85 p-12 text-center shadow-[0_20px_50px_rgba(12,18,40,0.5)] backdrop-blur-[20px]">
          <div className="flex justify-center">
            <img
              src="/image.png"
              alt="MESOB Service"
              className="h-auto w-[440px]"
            />
          </div>

          <div className="mb-8 mt-10">
            <div className="text-lg font-bold tracking-wide text-[#f7b718]">Welcome</div>
            <div className="mt-1 text-sm font-medium text-white/95">Sign in to your account</div>
          </div>

          {serverError && (
            <div
              className="mb-4 rounded-md border border-red-300/60 bg-red-100/90 px-4 py-2.5 text-left text-sm font-medium text-red-800"
              role="alert"
            >
              {serverError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div>
              <div className="relative">
                <User className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#4a66b8]" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Username"
                  disabled={loading}
                  autoComplete="username email"
                  list="mesob-email-suggestions"
                  className={`h-14 w-full rounded-lg bg-white pl-12 pr-4 text-sm text-slate-800 placeholder:text-slate-400 shadow-sm transition focus:outline-none focus:ring-2 focus:ring-blue-200 ${
                    errors.email ? "ring-2 ring-red-300" : "ring-1 ring-slate-200"
                  } ${loading ? "opacity-60" : ""}`}
                />
              </div>
              <datalist id="mesob-email-suggestions">
                {Object.keys(cachedCredentials).map((email) => (
                  <option key={email} value={email} />
                ))}
              </datalist>
              {errors.email && (
                <p className="mt-1.5 text-left text-xs text-red-200">{errors.email}</p>
              )}
            </div>

            <div>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#4a66b8]" />
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Password"
                  disabled={loading}
                  autoComplete="current-password"
                  className={`h-14 w-full rounded-lg bg-white pl-12 pr-12 text-sm text-slate-800 placeholder:text-slate-400 shadow-sm transition focus:outline-none focus:ring-2 focus:ring-blue-200 ${
                    errors.password ? "ring-2 ring-red-300" : "ring-1 ring-slate-200"
                  } ${loading ? "opacity-60" : ""}`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  disabled={loading}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[#4a66b8] transition hover:text-[#3955a8]"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1.5 text-left text-xs text-red-200">{errors.password}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="h-14 w-full rounded-lg bg-white text-base font-bold text-[#2d3f7f] shadow-md transition hover:bg-white/95 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Signing in..." : "Login"}
            </button>
          </form>

          <div className="mt-8 space-y-1">
            <div className="text-sm font-bold tracking-wider text-[#facc15]">
              FDRE MESOB Dashboard
            </div>
            <div className="text-xs text-white/70">© EAI</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
