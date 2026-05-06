import React, { useState, useRef, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../services/adminService";
import "../../styles/admin-settings.css";

function AdminProfile() {
  const { user, updateUser } = useAuth();
  const fileInputRef = useRef(null);
  const [isEditing, setIsEditing] = useState(false);
  const [profilePicture, setProfilePicture] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    role: "SYSTEM_ADMIN",
  });

  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        const response = await api.get("/users/me");
        const userData = response.data.data;
        setFormData({
          fullName: userData.fullName || "",
          email: userData.email || "",
          phone: userData.phone || "",
          role: userData.role || "SYSTEM_ADMIN",
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
    try {
      const updatePayload = { name: formData.fullName, phone: formData.phone };
      if (profilePicture) updatePayload.profilePicture = profilePicture;
      await api.put("/users/me", updatePayload);
      const updatedUser = { ...user, ...formData, profilePicture };
      localStorage.setItem("mesob_user", JSON.stringify(updatedUser));
      if (updateUser) updateUser(updatedUser);
      setIsEditing(false);
      alert("Profile updated successfully!");
    } catch (error) {
      console.error("Error saving profile:", error);
      alert("Failed to save profile.");
    } finally {
      setIsSaving(false);
    }
  };

  const handlePictureClick = () => fileInputRef.current?.click();

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
          setProfilePicture(canvas.toDataURL("image/jpeg", 0.7));
        };
        img.src = event.target?.result;
      };
      reader.readAsDataURL(file);
    }
  };

  const getInitials = (name) => name.split(" ").map((n) => n[0]).join("").toUpperCase();

  return (
    <div className="settings-page">
      <div className="page-header">
        <h1>Admin Profile</h1>
        <p>Manage your profile information</p>
      </div>
      <div className="settings-container">
        <div className="profile-picture-card">
          <div className="profile-picture-container">
            <div className="profile-avatar-large">
              {profilePicture ? <img src={profilePicture} alt={formData.fullName} /> : <div className="avatar-initials">{getInitials(formData.fullName || "SA")}</div>}
            </div>
            {isEditing && <button className="btn-camera-overlay" onClick={handlePictureClick} title="Change profile picture">í³·</button>}
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} style={{ display: "none" }} />
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
            <button className="btn-edit" onClick={() => setIsEditing(!isEditing)}>{isEditing ? "Cancel" : "Edit"}</button>
          </div>
          <div className="card-body">
            <div className="form-group">
              <label>Full Name</label>
              <input type="text" name="fullName" value={formData.fullName} onChange={handleChange} disabled={!isEditing} className="form-input" />
            </div>
            <div className="form-group">
              <label>Email</label>
              <input type="email" name="email" value={formData.email} onChange={handleChange} disabled={!isEditing} className="form-input" />
            </div>
            <div className="form-group">
              <label>Phone</label>
              <input type="tel" name="phone" value={formData.phone} onChange={handleChange} disabled={!isEditing} className="form-input" />
            </div>
            <div className="form-group">
              <label>Role</label>
              <input type="text" name="role" value={formData.role} disabled className="form-input" />
            </div>
            {isEditing && <div className="form-actions"><button className="btn-save" onClick={handleSave} disabled={isSaving}>{isSaving ? "Saving..." : "Save Changes"}</button></div>}
          </div>
        </div>
        <div className="settings-card">
          <div className="card-header"><h2>Account Security</h2></div>
          <div className="card-body">
            <div className="security-item">
              <div className="security-info"><h3>Change Password</h3><p>Update your password regularly</p></div>
              <button className="btn-action" onClick={() => alert("Coming soon")}>Change Password</button>
            </div>
            <hr className="divider" />
            <div className="security-item">
              <div className="security-info"><h3>Two-Factor Authentication</h3><p>Add extra security</p></div>
              <button className="btn-action" onClick={() => alert("Coming soon")}>Enable 2FA</button>
            </div>
            <hr className="divider" />
            <div className="security-item">
              <div className="security-info"><h3>Active Sessions</h3><p>Manage login sessions</p></div>
              <button className="btn-action" onClick={() => alert("Coming soon")}>View Sessions</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminProfile;
