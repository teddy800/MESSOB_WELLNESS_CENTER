import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Input from '../components/forms/Input';
import Button from '../components/forms/Button';

function Login() {
  const navigate = useNavigate();
  const { login, isAuthenticated, error: authError } = useAuth();
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState('');

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const validateForm = () => {
    const newErrors = {};

    // Email validation
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: '',
      }));
    }
    setServerError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setServerError('');

    const result = await login(formData.email, formData.password);

    if (result.success) {
      navigate('/dashboard', { replace: true });
    } else {
      setServerError(result.error);
      setLoading(false);
    }
  };

  return (
    <div className="login-page-wrapper">
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

      <div className="auth-container">
        <div className="auth-wrapper">
          <div className="auth-left">
            <div className="auth-header">
              <h2>Login to your Account</h2>
              <p>Access the MESOB Wellness Center System</p>
            </div>

            <form onSubmit={handleSubmit} className="auth-form" noValidate>
              {serverError && (
                <div className="alert alert-error" role="alert">
                  {serverError}
                </div>
              )}

              <Input
                label="Email"
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                error={errors.email}
                placeholder="mail@example.com"
                required
                disabled={loading}
              />

              <Input
                label="Password"
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                error={errors.password}
                placeholder="write your password"
                required
                disabled={loading}
              />

              <Button
                type="submit"
                variant="primary"
                fullWidth
                loading={loading}
                disabled={loading}
              >
                Login
              </Button>
            </form>

            <div className="auth-footer">
              <p>Don't have an account? <Link to="/register" className="auth-link">Sign up here</Link></p>
            </div>
          </div>

          <div className="auth-right">
            <div className="auth-branding">
              <div className="auth-logo-container">
                <div className="auth-logo">
                  🏥
                </div>
              </div>
              <h2>MESOB Wellness Center</h2>
              <p>Secure, official digital wellness management for MESOB staff and customers.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
