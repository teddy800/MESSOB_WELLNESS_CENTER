import React, { useState, useEffect } from "react";
import { adminService } from "../../services/adminService";
import AddCenterModal from "../../components/admin/AddCenterModal";
import "../../styles/admin-regions.css";

function RegionManagement() {
  const [regions, setRegions] = useState([]);
  const [newRegion, setNewRegion] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [regionStats, setRegionStats] = useState({});
  const [showAddCenterModal, setShowAddCenterModal] = useState(false);
  const [selectedRegion, setSelectedRegion] = useState(null);

  useEffect(() => {
    loadRegions();
  }, []);

  const loadRegions = async () => {
    try {
      setLoading(true);
      const data = await adminService.getRegions();
      setRegions(data || []);
      
      // Load stats for each region
      const stats = {};
      for (const region of data || []) {
        const centers = await adminService.getCentersByRegion(region);
        stats[region] = centers.length;
      }
      setRegionStats(stats);
    } catch (err) {
      console.error("Error loading regions:", err);
      setError("Failed to load regions");
    } finally {
      setLoading(false);
    }
  };

  const handleAddRegion = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!newRegion.trim()) {
      setError("Please enter a region name");
      return;
    }

    if (regions.includes(newRegion.trim())) {
      setError("This region already exists");
      return;
    }

    try {
      setLoading(true);
      // Create a center with the new region to establish it in the system
      await adminService.createCenter({
        name: `${newRegion} Regional Center`,
        code: `${newRegion.toUpperCase().substring(0, 3)}-001`,
        region: newRegion.trim(),
        city: newRegion.trim(),
        address: "To be updated",
        status: "ACTIVE",
      });

      setSuccess(`Region "${newRegion}" created successfully!`);
      setNewRegion("");
      await loadRegions();
    } catch (err) {
      const errorMsg = err.response?.data?.message || "Failed to create region";
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleAddCenterClick = (region) => {
    setSelectedRegion(region);
    setShowAddCenterModal(true);
  };

  const handleCenterAdded = async () => {
    setShowAddCenterModal(false);
    setSelectedRegion(null);
    await loadRegions();
  };

  return (
    <div className="management-section">
      <div className="section-header">
        <h2>🌍 Region Management</h2>
      </div>

      <div className="region-management-container">
        {/* Add Region Form */}
        <div className="add-region-card">
          <h3>Add New Region</h3>
          <form onSubmit={handleAddRegion} className="add-region-form">
            {error && <div className="error-message">{error}</div>}
            {success && <div className="success-message">{success}</div>}

            <div className="form-group">
              <label htmlFor="regionName">Region Name</label>
              <input
                id="regionName"
                type="text"
                value={newRegion}
                onChange={(e) => setNewRegion(e.target.value)}
                placeholder="e.g., Addis Ababa, Oromia, Amhara"
                disabled={loading}
              />
            </div>

            <button 
              type="submit" 
              className="btn-primary"
              disabled={loading}
            >
              {loading ? "Creating..." : "Create Region"}
            </button>
          </form>
        </div>

        {/* Regions List */}
        <div className="regions-list-card">
          <h3>Existing Regions ({regions.length})</h3>
          
          {loading && regions.length === 0 ? (
            <div className="loading-state">Loading regions...</div>
          ) : regions.length === 0 ? (
            <div className="empty-state">
              <p>No regions found. Create your first region above.</p>
            </div>
          ) : (
            <div className="regions-grid">
              {regions.map((region) => (
                <div key={region} className="region-card">
                  <div className="region-card-header">
                    <div className="region-title">
                      <h4>{region}</h4>
                      <span className="region-badge">{regionStats[region] || 0} centers</span>
                    </div>
                  </div>
                  <div className="region-card-body">
                    <div className="region-stats">
                      <div className="stat-item">
                        <span className="stat-label">Centers</span>
                        <span className="stat-value">{regionStats[region] || 0}</span>
                      </div>
                    </div>
                  </div>
                  <div className="region-card-footer">
                    <button 
                      className="btn-secondary"
                      onClick={() => handleAddCenterClick(region)}
                    >
                      + Add Center
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {selectedRegion && (
        <AddCenterModal
          isOpen={showAddCenterModal}
          onClose={() => {
            setShowAddCenterModal(false);
            setSelectedRegion(null);
          }}
          region={selectedRegion}
          onSuccess={handleCenterAdded}
        />
      )}
    </div>
  );
}

export default RegionManagement;
