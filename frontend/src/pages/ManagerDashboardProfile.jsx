import React, { useState, useRef, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { api } from "../services/adminService";
import ChangePasswordModal from "../components/admin/ChangePasswordModal";
import "../styles/admin-settings.css";

function ManagerDashboardProfile() {
  const navigate = useNavigate();
  const { user, updateUser } = useAuth();
  const fileInputRef = useRef(null);
  const [isEditing, setIsEditing] = useState(false);
  const [profilePicture, setProfilePicture] = useState(user?.profilePicture || null);
  const [isSaving, setIsSaving] = useState(false);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [formData, setFormData] = useState({
    fullName: user?.fullName || "",
    email: user?.email || "",
    phone: user?.phone || "",
    role: user?.role || "CENTER_MANAGER",
    center: user?.center || "",
    department: user?.department || "Center Management",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const updatePayload = { 
        name: formData.fullName, 
        phone: formData.phone,
        center: formData.center,
      };
      if (profilePicture && profilePicture !== user?.profilePicture) {
        updatePayload.profilePicture = profilePicture;
      }
      await api.put("/users/me", updatePayload);
      const updatedUser = { ...user, ...formData, profilePicture };
      localStorage.setItem("mesob_user", JSON.stringify(updatedUser));
      if (updateUser) updateUser(updatedUser);
      setIsEditing(false);
    } catch (error) {
      console.error("Error saving profile:", error);
      alert("Failed to save profile.");
    }
    setIsSaving(false);
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

  const getInitials = (name) => {
    if (!name) return "CM";
    return name.split(" ").map((n) => n[0]).join("").toUpperCase();
  };

  return (
    <div style={{ minHeight: "100vh", background: "#f5f5f5" }}>
      <div style={{ background: "#1e3a8a", color: "white", padding: "1rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1 style={{ margin: 0, fontSize: "1.5rem" }}>Center Manager Profile</h1>
        <button onClick={() => navigate(-1)} style={{ background: "rgba(255,255,255,0.2)", border: "none", color: "white", padding: "0.5rem 1rem", borderRadius: "4px", cursor: "pointer", fontSize: "0.9rem" }}>← Back</button>
      </div>

      <div style={{ maxWidth: "900px", margin: "2rem auto", padding: "0 1rem" }}>
        {/* Profile Card */}
        <div style={{ background: "white", borderRadius: "8px", padding: "2rem", marginBottom: "2rem", boxShadow: "0 2px 4px rgba(0,0,0,0.1)" }}>
          <div style={{ display: "flex", gap: "2rem", alignItems: "flex-start" }}>
            <div style={{ position: "relative" }}>
              <div style={{ width: "120px", height: "120px", borderRadius: "50%", background: "#e0e7ff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "2rem", fontWeight: "bold", color: "#4f46e5", overflow: "hidden" }}>
                {profilePicture ? <img src={profilePicture} alt={formData.fullName} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : getInitials(formData.fullName)}
              </div>
              {isEditing && (
                <button onClick={handlePictureClick} style={{ position: "absolute", bottom: "0", right: "0", background: "#4f46e5", color: "white", border: "none", borderRadius: "50%", width: "40px", height: "40px", cursor: "pointer", fontSize: "1.2rem" }}>📷</button>
              )}
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} style={{ display: "none" }} />
            </div>
            <div style={{ flex: 1 }}>
              <h2 style={{ margin: "0 0 0.5rem 0", fontSize: "1.5rem" }}>{formData.fullName || "Center Manager"}</h2>
              <p style={{ margin: "0.25rem 0", color: "#666", fontSize: "0.9rem" }}>
                <span style={{ background: "#4f46e5", color: "white", padding: "0.25rem 0.75rem", borderRadius: "20px", fontSize: "0.8rem" }}>{formData.role}</span>
              </p>
              <p style={{ margin: "0.5rem 0 0 0", color: "#999", fontSize: "0.9rem" }}>{formData.email}</p>
              <p style={{ margin: "0.25rem 0 0 0", color: "#999", fontSize: "0.9rem" }}>Center: {formData.center || "Not assigned"}</p>
            </div>
          </div>
        </div>

        {/* Profile Information */}
        <div style={{ background: "white", borderRadius: "8px", padding: "2rem", marginBottom: "2rem", boxShadow: "0 2px 4px rgba(0,0,0,0.1)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", borderBottom: "1px solid #e5e7eb", paddingBottom: "1rem" }}>
            <h3 style={{ margin: 0, fontSize: "1.1rem" }}>Profile Information</h3>
            <button onClick={() => setIsEditing(!isEditing)} style={{ background: isEditing ? "#ef4444" : "#4f46e5", color: "white", border: "none", padding: "0.5rem 1rem", borderRadius: "4px", cursor: "pointer", fontSize: "0.9rem" }}>
              {isEditing ? "Cancel" : "Edit"}
            </button>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
            <div>
              <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "500", fontSize: "0.9rem" }}>Full Name</label>
              <input type="text" name="fullName" value={formData.fullName} onChange={handleChange} disabled={!isEditing} style={{ width: "100%", padding: "0.75rem", border: "1px solid #d1d5db", borderRadius: "4px", fontSize: "0.9rem", background: isEditing ? "white" : "#f9fafb" }} />
            </div>
            <div>
              <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "500", fontSize: "0.9rem" }}>Email</label>
              <input type="email" name="email" value={formData.email} onChange={handleChange} disabled={!isEditing} style={{ width: "100%", padding: "0.75rem", border: "1px solid #d1d5db", borderRadius: "4px", fontSize: "0.9rem", background: isEditing ? "white" : "#f9fafb" }} />
            </div>
            <div>
              <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "500", fontSize: "0.9rem" }}>Phone</label>
              <input type="tel" name="phone" value={formData.phone} onChange={handleChange} disabled={!isEditing} style={{ width: "100%", padding: "0.75rem", border: "1px solid #d1d5db", borderRadius: "4px", fontSize: "0.9rem", background: isEditing ? "white" : "#f9fafb" }} />
            </div>
            <div>
              <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "500", fontSize: "0.9rem" }}>Center</label>
              <input type="text" name="center" value={formData.center} onChange={handleChange} disabled={!isEditing} style={{ width: "100%", padding: "0.75rem", border: "1px solid #d1d5db", borderRadius: "4px", fontSize: "0.9rem", background: isEditing ? "white" : "#f9fafb" }} />
            </div>
            <div>
              <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "500", fontSize: "0.9rem" }}>Department</label>
              <input type="text" value={formData.department} disabled style={{ width: "100%", padding: "0.75rem", border: "1px solid #d1d5db", borderRadius: "4px", fontSize: "0.9rem", background: "#f9fafb" }} />
            </div>
            <div>
              <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "500", fontSize: "0.9rem" }}>Role</label>
              <input type="text" value={formData.role} disabled style={{ width: "100%", padding: "0.75rem", border: "1px solid #d1d5db", borderRadius: "4px", fontSize: "0.9rem", background: "#f9fafb" }} />
            </div>
          </div>

          {isEditing && (
            <div style={{ marginTop: "1.5rem", display: "flex", gap: "1rem" }}>
              <button onClick={handleSave} disabled={isSaving} style={{ background: "#4f46e5", color: "white", border: "none", padding: "0.75rem 1.5rem", borderRadius: "4px", cursor: isSaving ? "not-allowed" : "pointer", fontSize: "0.9rem", opacity: isSaving ? 0.6 : 1 }}>
                {isSaving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          )}
        </div>

        {/* Account Security */}
        <div style={{ background: "white", borderRadius: "8px", padding: "2rem", boxShadow: "0 2px 4px rgba(0,0,0,0.1)" }}>
          <h3 style={{ margin: "0 0 1.5rem 0", fontSize: "1.1rem", borderBottom: "1px solid #e5e7eb", paddingBottom: "1rem" }}>Account Security</h3>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "1rem 0", borderBottom: "1px solid #e5e7eb" }}>
            <div>
              <h4 style={{ margin: "0 0 0.25rem 0", fontSize: "0.95rem" }}>Change Password</h4>
              <p style={{ margin: 0, color: "#666", fontSize: "0.85rem" }}>Update your password regularly</p>
            </div>
            <button onClick={() => setShowChangePasswordModal(true)} style={{ background: "#4f46e5", color: "white", border: "none", padding: "0.5rem 1rem", borderRadius: "4px", cursor: "pointer", fontSize: "0.9rem" }}>Change</button>
          </div>
        </div>
      </div>

      <ChangePasswordModal isOpen={showChangePasswordModal} onClose={() => setShowChangePasswordModal(false)} userName={formData.fullName} />
    </div>
  );
}

export default ManagerDashboardProfile;
