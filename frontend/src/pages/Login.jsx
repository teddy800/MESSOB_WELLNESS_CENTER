import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
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
      {/* Animated wave background with particles */}
      <AnimatedWaveBackground />
      <div className="mesob-auth-container">
        <div className="mesob-auth-card">
          {/* Logo and Header Section */}
          <div className="mesob-logo-section">
            <div className="mesob-logo-circle">
              <img
                src="/Mesob-short-png.png"
                alt="MESOB Logo"
              />
            </div>
            <div className="mesob-title-amharic">
              በኢትዮጵያ ፌዴራላዊ ዲሞክራሲያዊ ሪፐብሊክ
            </div>
            <div className="mesob-title-amharic">
              የመሶብ አገልግሎት
            </div>
            <div className="mesob-title-english">
              Federal Democratic Republic of Ethiopia
            </div>
            <div className="mesob-service-title">
              MESOB Service
            </div>
            <div className="mesob-welcome">
              Welcome
            </div>
            <div className="mesob-subtitle">
              Sign in to your account
            </div>
          </div>

          <form onSubmit={handleSubmit} className="mesob-form" noValidate>
            {serverError && (
              <div className="mesob-alert mesob-alert-error" role="alert">
                {serverError}
              </div>
            )}

            {/* Email */}
            <div className="mesob-form-group">
              <label className="mesob-form-label">
                Username<span className="mesob-required">*</span>
              </label>
              <div className="mesob-input-icon-wrapper">
                <span className="mesob-input-icon">👤</span>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Username"
                  disabled={loading}
                  className={`mesob-form-input ${errors.email ? "error" : ""}`}
                  autoComplete="username email"
                  list="mesob-email-suggestions"
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

            {/* Password */}
            <div className="mesob-form-group">
              <label className="mesob-form-label">
                Password<span className="mesob-required">*</span>
              </label>
              <div className="mesob-password-wrapper">
                <span className="mesob-input-icon">🔒</span>
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Password"
                  disabled={loading}
                  className={`mesob-form-input ${errors.password ? "error" : ""}`}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="mesob-password-toggle"
                  onClick={() => setShowPassword((prev) => !prev)}
                  disabled={loading}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? "🙈" : "👁"}
                </button>
              </div>
              {errors.password && (
                <span className="mesob-form-error">{errors.password}</span>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="mesob-btn mesob-btn-primary"
              disabled={loading}
            >
              {loading ? "Signing in..." : "Login"}
            </button>
          </form>

          {/* Footer */}
          <div className="mesob-footer">
            <p className="mesob-footer-text">
              Don't have an account?{" "}
              <Link to="/register" className="mesob-link">
                Create one here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
