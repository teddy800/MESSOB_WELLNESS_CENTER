import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import AnimatedWaveBackground from "../components/AnimatedWaveBackground";
import "../styles/register.css";

function Register() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    employeeId: "",
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
    dateOfBirth: "",
    gender: "",
    region: "",
    centerId: "",
    emergencyContactName: "",
    emergencyContactPhone: "",
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  
  // HR lookup state
  const [hrLoading, setHrLoading] = useState(false);
  const [hrError, setHrError] = useState("");
  const [hrSuccess, setHrSuccess] = useState("");
  
  // Regions and centers state
  const [regions, setRegions] = useState([]);
  const [centers, setCenters] = useState([]);
  const [regionsLoading, setRegionsLoading] = useState(false);
  const [centersLoading, setCentersLoading] = useState(false);

  // Fetch regions on mount
  useEffect(() => {
    fetchRegions();
  }, []);

  // Fetch centers when region changes
  useEffect(() => {
    if (formData.region) {
      fetchCenters(formData.region);
    } else {
      setCenters([]);
      setFormData(prev => ({ ...prev, centerId: "" }));
    }
  }, [formData.region]);

  const fetchRegions = async () => {
    setRegionsLoading(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/regions`);
      const data = await response.json();
      if (data.success) {
        setRegions(data.data);
      }
    } catch (error) {
      console.error("Error fetching regions:", error);
    } finally {
      setRegionsLoading(false);
    }
  };

  const fetchCenters = async (region) => {
    setCentersLoading(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/v1/centers?region=${encodeURIComponent(region)}`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token') || ''}`,
          },
        }
      );
      const data = await response.json();
      if (data.success) {
        setCenters(data.data);
      }
    } catch (error) {
      console.error("Error fetching centers:", error);
      setCenters([]);
    } finally {
      setCentersLoading(false);
    }
  };

  const handleFetchFromHR = async () => {
    if (!formData.employeeId.trim()) {
      setHrError("Please enter an employee ID");
      return;
    }

    setHrLoading(true);
    setHrError("");
    setHrSuccess("");

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/v1/hr/employee/${formData.employeeId}`,
      );
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Employee not found in HR system");
      }

      // Auto-fill form with HR data
      const employee = data.data;
      setFormData(prev => ({
        ...prev,
        fullName: employee.fullName || prev.fullName,
        email: employee.email || prev.email,
        phone: employee.phone || prev.phone,
        dateOfBirth: employee.dateOfBirth || prev.dateOfBirth,
        gender: employee.gender || prev.gender,
        region: employee.region || prev.region,
        centerId: employee.centerId || prev.centerId,
      }));

      setHrSuccess("Employee data loaded successfully! Please review and complete the form.");
    } catch (error) {
      setHrError(error.message || "Failed to fetch employee data");
    } finally {
      setHrLoading(false);
    }
  };

  const scrollToFirstError = (errorFields) => {
    const fieldOrder = [
      "employeeId",
      "fullName",
      "email",
      "password",
      "confirmPassword",
      "phone",
      "dateOfBirth",
      "gender",
      "region",
      "centerId",
      "emergencyContactName",
      "emergencyContactPhone",
    ];

    const firstErrorField = fieldOrder.find((field) => errorFields[field]);
    if (firstErrorField) {
      const element = document.querySelector(`[name="${firstErrorField}"]`);
      if (element) {
        const scrollContainer = document.querySelector(".mesob-form-scroll");
        if (scrollContainer) {
          const elementRect = element.getBoundingClientRect();
          const containerRect = scrollContainer.getBoundingClientRect();
          const scrollTop = scrollContainer.scrollTop;
          const elementTop = elementRect.top - containerRect.top + scrollTop;
          scrollContainer.scrollTo({
            top: elementTop - 50,
            behavior: "smooth",
          });
        }
      }
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = "Full name is required";
    } else if (formData.fullName.trim().length < 2) {
      newErrors.fullName = "Full name must be at least 2 characters";
    }

    if (!formData.email) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters";
    } else if (
      !/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>])/.test(
        formData.password,
      )
    ) {
      newErrors.password =
        "Password must contain uppercase, lowercase, numbers, and special characters (!@#$%^&*...)";
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password";
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    if (!formData.phone) {
      newErrors.phone = "Phone number is required";
    } else if (!/^\d{10,}$/.test(formData.phone.replace(/\D/g, ""))) {
      newErrors.phone = "Please enter a valid phone number";
    }

    if (!formData.dateOfBirth) {
      newErrors.dateOfBirth = "Date of birth is required";
    } else {
      const age =
        new Date().getFullYear() - new Date(formData.dateOfBirth).getFullYear();
      if (age < 18) {
        newErrors.dateOfBirth = "You must be at least 18 years old";
      }
    }

    if (!formData.gender) {
      newErrors.gender = "Gender is required";
    }

    if (!formData.region) {
      newErrors.region = "Region is required";
    }

    if (!formData.centerId) {
      newErrors.centerId = "Health center is required";
    }

    if (!formData.emergencyContactName.trim()) {
      newErrors.emergencyContactName = "Emergency contact name is required";
    }

    if (!formData.emergencyContactPhone) {
      newErrors.emergencyContactPhone = "Emergency contact phone is required";
    } else if (
      !/^\d{10,}$/.test(formData.emergencyContactPhone.replace(/\D/g, ""))
    ) {
      newErrors.emergencyContactPhone = "Please enter a valid phone number";
    }

    setErrors(newErrors);
    
    // Auto-scroll to first error field
    if (Object.keys(newErrors).length > 0) {
      setTimeout(() => scrollToFirstError(newErrors), 0);
    }
    
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
    setServerError("");
    setHrError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setServerError("");
    setSuccessMessage("");

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/v1/auth/register`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            fullName: formData.fullName,
            email: formData.email,
            password: formData.password,
            phone: formData.phone,
            dateOfBirth: formData.dateOfBirth,
            gender: formData.gender,
            centerId: formData.centerId,
            emergencyContactName: formData.emergencyContactName,
            emergencyContactPhone: formData.emergencyContactPhone,
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Registration failed. Please try again.",
        );
      }

      setSuccessMessage("Registration successful! Redirecting to login...");
      setTimeout(() => {
        navigate("/login", { replace: true });
      }, 2000);
    } catch (err) {
      setServerError(err.message || "Registration failed. Please try again.");
    } finally {
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
              Create Account
            </div>
            <div className="mesob-subtitle">
              Join the MESOB Wellness Center System
            </div>
          </div>

          <form onSubmit={handleSubmit} className="mesob-form" noValidate>
            {serverError && (
              <div className="mesob-alert mesob-alert-error" role="alert">
                {serverError}
              </div>
            )}

            {successMessage && (
              <div className="mesob-alert mesob-alert-success" role="alert">
                {successMessage}
              </div>
            )}

            {/* Scrollable Form Content */}
            <div className="mesob-form-scroll">
              {/* Employee ID Lookup Section */}
              <div className="mesob-hr-section">
                <div className="mesob-form-group">
                  <label className="mesob-form-label">
                    Employee ID (Optional)
                    <span className="mesob-form-hint"> - Auto-fill from HR system</span>
                  </label>
                  <div className="mesob-input-with-button">
                    <input
                      type="text"
                      name="employeeId"
                      value={formData.employeeId}
                      onChange={handleChange}
                      placeholder="e.g., EMP001"
                      disabled={loading || hrLoading}
                      className="mesob-form-input"
                    />
                    <button
                      type="button"
                      className="mesob-btn mesob-btn-secondary"
                      onClick={handleFetchFromHR}
                      disabled={loading || hrLoading || !formData.employeeId.trim()}
                    >
                      {hrLoading ? "Loading..." : "Search"}
                    </button>
                  </div>
                  {hrError && (
                    <span className="mesob-form-error">{hrError}</span>
                  )}
                  {hrSuccess && (
                    <span className="mesob-form-success">{hrSuccess}</span>
                  )}
                </div>
              </div>

              {/* Full Name */}
              <div className="mesob-form-group">
                <label className="mesob-form-label">
                  Full Name<span className="mesob-required">*</span>
                </label>
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  placeholder="John Doe"
                  disabled={loading}
                  className={`mesob-form-input ${errors.fullName ? "error" : ""}`}
                />
                {errors.fullName && (
                  <span className="mesob-form-error">{errors.fullName}</span>
                )}
              </div>

              {/* Email */}
              <div className="mesob-form-group">
                <label className="mesob-form-label">
                  Email<span className="mesob-required">*</span>
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="mail@example.com"
                  disabled={loading}
                  className={`mesob-form-input ${errors.email ? "error" : ""}`}
                />
                {errors.email && (
                  <span className="mesob-form-error">{errors.email}</span>
                )}
              </div>

              {/* Password */}
              <div className="mesob-form-group">
                <label className="mesob-form-label">
                  Password<span className="mesob-required">*</span>
                </label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Min 8 chars with uppercase, lowercase, numbers, special chars"
                  disabled={loading}
                  className={`mesob-form-input ${errors.password ? "error" : ""}`}
                />
                {errors.password && (
                  <span className="mesob-form-error">{errors.password}</span>
                )}
              </div>

              {/* Confirm Password */}
              <div className="mesob-form-group">
                <label className="mesob-form-label">
                  Confirm Password<span className="mesob-required">*</span>
                </label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Confirm your password"
                  disabled={loading}
                  className={`mesob-form-input ${errors.confirmPassword ? "error" : ""}`}
                />
                {errors.confirmPassword && (
                  <span className="mesob-form-error">{errors.confirmPassword}</span>
                )}
              </div>

              {/* Phone */}
              <div className="mesob-form-group">
                <label className="mesob-form-label">
                  Phone Number<span className="mesob-required">*</span>
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="+251 9XX XXX XXXX"
                  disabled={loading}
                  className={`mesob-form-input ${errors.phone ? "error" : ""}`}
                />
                {errors.phone && (
                  <span className="mesob-form-error">{errors.phone}</span>
                )}
              </div>

              {/* Date of Birth */}
              <div className="mesob-form-group">
                <label className="mesob-form-label">
                  Date of Birth<span className="mesob-required">*</span>
                </label>
                <input
                  type="date"
                  name="dateOfBirth"
                  value={formData.dateOfBirth}
                  onChange={handleChange}
                  disabled={loading}
                  className={`mesob-form-input ${errors.dateOfBirth ? "error" : ""}`}
                />
                {errors.dateOfBirth && (
                  <span className="mesob-form-error">{errors.dateOfBirth}</span>
                )}
              </div>

              {/* Gender */}
              <div className="mesob-form-group">
                <label className="mesob-form-label">
                  Gender<span className="mesob-required">*</span>
                </label>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  disabled={loading}
                  className={`mesob-form-select ${errors.gender ? "error" : ""}`}
                >
                  <option value="">Select Gender</option>
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                  <option value="OTHER">Other</option>
                </select>
                {errors.gender && (
                  <span className="mesob-form-error">{errors.gender}</span>
                )}
              </div>

              {/* Region */}
              <div className="mesob-form-group">
                <label className="mesob-form-label">
                  Region<span className="mesob-required">*</span>
                </label>
                <select
                  name="region"
                  value={formData.region}
                  onChange={handleChange}
                  disabled={loading || regionsLoading}
                  className={`mesob-form-select ${errors.region ? "error" : ""}`}
                >
                  <option value="">
                    {regionsLoading ? "Loading regions..." : "Select Region"}
                  </option>
                  {regions.map((region) => (
                    <option key={region} value={region}>
                      {region}
                    </option>
                  ))}
                </select>
                {errors.region && (
                  <span className="mesob-form-error">{errors.region}</span>
                )}
              </div>

              {/* Health Center */}
              <div className="mesob-form-group">
                <label className="mesob-form-label">
                  Health Center<span className="mesob-required">*</span>
                </label>
                <select
                  name="centerId"
                  value={formData.centerId}
                  onChange={handleChange}
                  disabled={loading || centersLoading || !formData.region}
                  className={`mesob-form-select ${errors.centerId ? "error" : ""}`}
                >
                  <option value="">
                    {!formData.region
                      ? "Select region first"
                      : centersLoading
                      ? "Loading centers..."
                      : centers.length === 0
                      ? "No centers available"
                      : "Select Health Center"}
                  </option>
                  {centers.map((center) => (
                    <option key={center.id} value={center.id}>
                      {center.name} - {center.city}
                    </option>
                  ))}
                </select>
                {errors.centerId && (
                  <span className="mesob-form-error">{errors.centerId}</span>
                )}
              </div>

              {/* Emergency Contact Name */}
              <div className="mesob-form-group">
                <label className="mesob-form-label">
                  Emergency Contact Name<span className="mesob-required">*</span>
                </label>
                <input
                  type="text"
                  name="emergencyContactName"
                  value={formData.emergencyContactName}
                  onChange={handleChange}
                  placeholder="Contact person name"
                  disabled={loading}
                  className={`mesob-form-input ${errors.emergencyContactName ? "error" : ""}`}
                />
                {errors.emergencyContactName && (
                  <span className="mesob-form-error">{errors.emergencyContactName}</span>
                )}
              </div>

              {/* Emergency Contact Phone */}
              <div className="mesob-form-group">
                <label className="mesob-form-label">
                  Emergency Contact Phone<span className="mesob-required">*</span>
                </label>
                <input
                  type="tel"
                  name="emergencyContactPhone"
                  value={formData.emergencyContactPhone}
                  onChange={handleChange}
                  placeholder="+251 9XX XXX XXXX"
                  disabled={loading}
                  className={`mesob-form-input ${errors.emergencyContactPhone ? "error" : ""}`}
                />
                {errors.emergencyContactPhone && (
                  <span className="mesob-form-error">{errors.emergencyContactPhone}</span>
                )}
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="mesob-btn mesob-btn-primary"
              disabled={loading}
            >
              {loading ? "Creating Account..." : "Create Account"}
            </button>
          </form>

          {/* Footer */}
          <div className="mesob-footer">
            <p className="mesob-footer-text">
              Already have an account?{" "}
              <Link to="/login" className="mesob-link">
                Sign in here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Register;
