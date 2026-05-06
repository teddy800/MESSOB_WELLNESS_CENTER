import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, Lock, User } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import AnimatedWaveBackground from "../components/AnimatedWaveBackground";
import "../styles/login.css";

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
    <div className="mesob-auth-wrapper">
      <AnimatedWaveBackground className="absolute inset-0 z-20" />

      <div className="mesob-auth-container">
        <div className="mesob-auth-card">
          <div className="mesob-header-image">
            <img
              src="/image.png"
              alt="MESOB Service"
            />
          </div>

          <div className="mesob-welcome-section">
            <div className="mesob-welcome">Welcome</div>
            <div className="mesob-subtitle">Access the Mesob wellness Center System</div>
          </div>

          {serverError && (
            <div className="mesob-alert mesob-alert-error" role="alert">
              {serverError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="mesob-form" noValidate>
            <div className="mesob-form-group">
              <div className="mesob-input-wrapper">
                <User className="mesob-input-icon" style={{ width: '20px', height: '20px' }} />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Username"
                  disabled={loading}
                  autoComplete="username email"
                  list="mesob-email-suggestions"
                  className={`mesob-form-input mesob-form-input--with-icon ${
                    errors.email ? "error" : ""
                  } ${loading ? "opacity-60" : ""}`}
                />
              </div>
              <datalist id="mesob-email-suggestions">
                {Object.keys(cachedCredentials).map((email) => (
                  <option key={email} value={email} />
                ))}
              </datalist>
              {errors.email && (
                <span className="mesob-form-error">{errors.email}</span>
              )}
            </div>

            <div className="mesob-form-group">
              <div className="mesob-input-wrapper mesob-password-wrapper">
                <Lock className="mesob-input-icon" style={{ width: '20px', height: '20px'}} />
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Password"
                  disabled={loading}
                  autoComplete="current-password"
                  className={`mesob-form-input mesob-form-input--with-icon ${
                    errors.password ? "error" : ""
                  } ${loading ? "opacity-60" : ""}`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  disabled={loading}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="mesob-password-toggle"
                >
                  {showPassword ? (
                    <EyeOff style={{ width: '20px', height: '20px' }} />
                  ) : (
                    <Eye style={{ width: '20px', height: '20px' }} />
                  )}
                </button>
              </div>
              {errors.password && (
                <span className="mesob-form-error">{errors.password}</span>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mesob-btn mesob-btn-primary"
            >
              {loading ? "Signing in..." : "Login"}
            </button>
          </form>

          <div className="mesob-footer">
            <div className="mesob-footer-brand">Wellness</div>
            
            <div style={{ marginTop: '1rem', paddingTop: '0.75rem' }}>
              <span style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '0.875rem' }}>Don't have an account? </span>
              <a 
                href="/register" 
                style={{ 
                  color: '#f5b224', 
                  textDecoration: 'none', 
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Create one here
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
