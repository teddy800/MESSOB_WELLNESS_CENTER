import React, { useState, useRef, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import api from "../../services/api";
import ChangePasswordModal from "../../components/admin/ChangePasswordModal";
import "../../styles/admin-settings.css";

function AdminProfile() {
  const { user, updateUser } = useAuth();
  const fileInputRef = useRef(null);
  const [isEditing, setIsEditing] = useState(false);
  const [profilePicture, setProfilePicture] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [showPictureMenu, setShowPictureMenu] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    role: "SYSTEM_ADMIN",
  });

  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        const response = await api.get("/api/v1/users/me");
        const userData = response.data.data;
        setFormData({
          fullName: userData.fullName || "",
          email: userData.email || "",
          phone: userData.phone || "",
          role: userData.roleId || "SYSTEM_ADMIN",
        });
        if (userData.profilePicture) {
          setProfilePicture(userData.profilePicture);
        }
      } catch (error) {
        console.error("Error fetching profile data:", error);
      }
    };
    if (user?.id) {
      fetchProfileData();
    }
  }, [user?.id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    setErrorMessage("");
    setSuccessMessage("");
    try {
      const updatePayload = { 
        fullName: formData.fullName, 
        phone: formData.phone 
      };
      if (profilePicture !== undefined) updatePayload.profilePicture = profilePicture;
      
      await api.put("/api/v1/users/me", updatePayload);
      
      // Fetch fresh user data from backend to ensure consistency
      const response = await api.get("/api/v1/users/me");
      const freshUserData = response.data.data;
      
      // Merge fresh data with existing user to preserve all fields
      const mergedUser = {
        ...user,
        id: freshUserData.id,
        fullName: freshUserData.fullName,
        email: freshUserData.email,
        phone: freshUserData.phone,
        profilePicture: freshUserData.profilePicture,
        // Map roleId to role if needed
        role: user.role || freshUserData.roleId
      };
      
      localStorage.setItem("mesob_user", JSON.stringify(mergedUser));
      if (updateUser) updateUser(mergedUser);
      
      setIsEditing(false);
      setShowPictureMenu(false);
      setSuccessMessage("Profile updated successfully!");
    } catch (error) {
      console.error("Error saving profile:", error);
      setErrorMessage("Failed to save profile.");
    } finally {
      setIsSaving(false);
    }
  };

  const handlePictureClick = () => {
    setIsEditing(true);
    if (profilePicture) {
      setShowPictureMenu(!showPictureMenu);
    } else {
      fileInputRef.current?.click();
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          let width = img.width, height = img.height;
          const maxWidth = 300, maxHeight = 300;
          if (width > height && width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
          canvas.width = width;
          canvas.height = height;
          canvas.getContext("2d")?.drawImage(img, 0, 0, width, height);
          const base64Image = canvas.toDataURL("image/jpeg", 0.7);
          setProfilePicture(base64Image);
        };
        img.src = event.target?.result;
      };
      reader.readAsDataURL(file);
    }
    setShowPictureMenu(false);
  };

  const handleDeletePicture = () => {
    setProfilePicture(null);
    setShowPictureMenu(false);
  };

  const handleChangePicture = () => {
    setShowPictureMenu(false);
    fileInputRef.current?.click();
  };

  const handleCancel = () => {
    setIsEditing(false);
    setShowPictureMenu(false);
    setErrorMessage("");
    setSuccessMessage("");
    // Reload profile data to discard changes
    const fetchProfileData = async () => {
      try {
        const response = await api.get("/api/v1/users/me");
        const userData = response.data.data;
        setFormData({
          fullName: userData.fullName || "",
          email: userData.email || "",
          phone: userData.phone || "",
          role: userData.roleId || "SYSTEM_ADMIN",
        });
        if (userData.profilePicture) {
          setProfilePicture(userData.profilePicture);
        } else {
          setProfilePicture(null);
        }
      } catch (error) {
        console.error("Error fetching profile data:", error);
      }
    };
    fetchProfileData();
  };

  // Auto-dismiss success message
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(""), 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  // Auto-dismiss error message
  useEffect(() => {
    if (errorMessage) {
      const timer = setTimeout(() => setErrorMessage(""), 3000);
      return () => clearTimeout(timer);
    }
  }, [errorMessage]);

  return (
    <div className="settings-page">
      {successMessage && (
        <div style={{
          position: "fixed",
          top: "20px",
          right: "20px",
          backgroundColor: "#4caf50",
          color: "white",
          padding: "16px 24px",
          borderRadius: "4px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
          zIndex: 1000,
          animation: "slideIn 0.3s ease-out"
        }}>
          ✓ {successMessage}
        </div>
      )}
      {errorMessage && (
        <div style={{
          position: "fixed",
          top: "20px",
          right: "20px",
          backgroundColor: "#f44336",
          color: "white",
          padding: "16px 24px",
          borderRadius: "4px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
          zIndex: 1000,
          animation: "slideIn 0.3s ease-out"
        }}>
          ✗ {errorMessage}
        </div>
      )}
      <div className="page-header">
        <h1>Admin Profile</h1>
        <p>Manage your profile information</p>
      </div>
      <div className="settings-container">
        <div className="profile-picture-card">
          <div className="profile-picture-container">
            <div className="profile-avatar-large">
              {profilePicture ? (
                <img src={profilePicture} alt={formData.fullName} />
              ) : (
                <span className="avatar-icon">👤</span>
              )}
            </div>
            <button
              className="btn-camera-overlay"
              onClick={handlePictureClick}
              title="Change profile picture"
            >
              📷
            </button>
            {showPictureMenu && profilePicture && (
              <div className="picture-menu">
                <button className="menu-item" onClick={handleChangePicture}>
                  Change
                </button>
                <button className="menu-item delete" onClick={handleDeletePicture}>
                  Delete
                </button>
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              style={{ display: "none" }}
            />
          </div>
          <div className="profile-info-text">
            <h2>{formData.fullName || "System Admin"}</h2>
            <p className="role-badge">{formData.role || "SYSTEM_ADMIN"}</p>
            <p className="email-text">{formData.email}</p>
          </div>
        </div>
        <div className="settings-card">
          <div className="card-header">
            <h2>Profile Information</h2>
            {!isEditing && (
              <button
                className="btn-edit"
                onClick={() => setIsEditing(true)}
              >
                Edit
              </button>
            )}
          </div>
          <div className="card-body">
            <div className="form-group">
              <label>Full Name</label>
              <input
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                disabled={!isEditing}
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                disabled={!isEditing}
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label>Phone</label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                disabled={!isEditing}
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label>Role</label>
              <input
                type="text"
                name="role"
                value={formData.role}
                disabled
                className="form-input"
              />
            </div>
            {isEditing && (
              <div className="form-actions">
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={handleCancel}
                  disabled={isSaving}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn-save"
                  onClick={handleSave}
                  disabled={isSaving}
                >
                  {isSaving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            )}
          </div>
        </div>
        <div className="settings-card">
          <div className="card-header">
            <h2>Account Security</h2>
          </div>
          <div className="card-body">
            <div className="security-item">
              <div className="security-info">
                <h3>Change Password</h3>
                <p>Update your password regularly</p>
              </div>
              <button
                className="btn-action"
                onClick={() => setShowChangePasswordModal(true)}
              >
                Change Password
              </button>
            </div>
          </div>
        </div>
      </div>

      <ChangePasswordModal
        isOpen={showChangePasswordModal}
        onClose={() => setShowChangePasswordModal(false)}
        userName={formData.fullName}
      />
    </div>
  );
}

export default AdminProfile;
