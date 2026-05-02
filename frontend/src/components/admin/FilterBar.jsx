import React, { useState, useEffect } from "react";
import { adminService } from "../../services/adminService";

function FilterBar({ onFilterChange, showRegionFilter = true, showCenterFilter = true, showDateFilter = false }) {
  const [filters, setFilters] = useState({
    region: "",
    center: "",
    search: "",
    dateFrom: "",
    dateTo: "",
  });

  const [regions, setRegions] = useState([]);
  const [centers, setCenters] = useState([]);
  const [loadingRegions, setLoadingRegions] = useState(false);
  const [loadingCenters, setLoadingCenters] = useState(false);

  // Load regions on mount
  useEffect(() => {
    loadRegions();
  }, []);

  // Load centers when region changes
  useEffect(() => {
    if (filters.region) {
      loadCenters(filters.region);
    } else {
      setCenters([]);
    }
  }, [filters.region]);

  const loadRegions = async () => {
    try {
      setLoadingRegions(true);
      const data = await adminService.getRegions();
      setRegions(data || []);
    } catch (err) {
      console.error("Error loading regions:", err);
    } finally {
      setLoadingRegions(false);
    }
  };

  const loadCenters = async (region) => {
    try {
      setLoadingCenters(true);
      const data = await adminService.getCenters({ region, limit: 100 });
      setCenters(data?.data || []);
    } catch (err) {
      console.error("Error loading centers:", err);
    } finally {
      setLoadingCenters(false);
    }
  };

  const handleFilterChange = (field, value) => {
    const newFilters = { ...filters, [field]: value };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handleReset = () => {
    const resetFilters = {
      region: "",
      center: "",
      search: "",
      dateFrom: "",
      dateTo: "",
    };
    setFilters(resetFilters);
    onFilterChange(resetFilters);
  };

  return (
    <div className="filter-bar">
      <div className="filter-container">
        {/* Search */}
        <div className="filter-group">
          <label htmlFor="search">Search</label>
          <input
            id="search"
            type="text"
            placeholder="Search..."
            value={filters.search}
            onChange={(e) => handleFilterChange("search", e.target.value)}
            className="filter-input"
          />
        </div>

        {/* Region Filter */}
        {showRegionFilter && (
          <div className="filter-group">
            <label htmlFor="region">Region</label>
            <select
              id="region"
              value={filters.region}
              onChange={(e) => handleFilterChange("region", e.target.value)}
              className="filter-select"
              disabled={loadingRegions}
            >
              <option value="">All Regions</option>
              {regions.map((region) => (
                <option key={region} value={region}>
                  {region}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Center Filter */}
        {showCenterFilter && (
          <div className="filter-group">
            <label htmlFor="center">Center</label>
            <select
              id="center"
              value={filters.center}
              onChange={(e) => handleFilterChange("center", e.target.value)}
              className="filter-select"
              disabled={!filters.region || loadingCenters}
            >
              <option value="">All Centers</option>
              {centers.map((center) => (
                <option key={center.id} value={center.id}>
                  {center.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Date Range Filter */}
        {showDateFilter && (
          <>
            <div className="filter-group">
              <label htmlFor="dateFrom">From</label>
              <input
                id="dateFrom"
                type="date"
                value={filters.dateFrom}
                onChange={(e) => handleFilterChange("dateFrom", e.target.value)}
                className="filter-input"
              />
            </div>

            <div className="filter-group">
              <label htmlFor="dateTo">To</label>
              <input
                id="dateTo"
                type="date"
                value={filters.dateTo}
                onChange={(e) => handleFilterChange("dateTo", e.target.value)}
                className="filter-input"
              />
            </div>
          </>
        )}

        {/* Action Buttons */}
        <div className="filter-actions">
          <button 
            className="btn-reset"
            onClick={handleReset}
          >
            Reset
          </button>
        </div>
      </div>
    </div>
  );
}

export default FilterBar;
