import React, { useEffect, useState } from "react";
import { adminService } from "../../services/adminService";

function FeedbackAnalytics() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    region: "",
    center: "",
    dateFrom: "",
    dateTo: "",
  });

  useEffect(() => {
    fetchAnalytics();
  }, [filters]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const response = await adminService.getFeedback({
        ...filters,
        page: 1,
        limit: 1000,
      });
      
      // Calculate analytics from feedback data
      const feedbackData = response.data || [];
      const analytics = calculateAnalytics(feedbackData);
      setAnalytics(analytics);
      setError(null);
    } catch (err) {
      setError(err.message || "Failed to load analytics");
      console.error("Error fetching analytics:", err);
    } finally {
      setLoading(false);
    }
  };

  const calculateAnalytics = (feedbackData) => {
    if (feedbackData.length === 0) {
      return {
        totalFeedback: 0,
        averageNPS: 0,
        averageServiceQuality: 0,
        npsDistribution: { promoter: 0, passive: 0, detractor: 0 },
        serviceQualityDistribution: {},
      };
    }

    const totalFeedback = feedbackData.length;
    const averageNPS = (
      feedbackData.reduce((sum, f) => sum + (f.npsScore || 0), 0) / totalFeedback
    ).toFixed(1);
    const averageServiceQuality = (
      feedbackData.reduce((sum, f) => sum + (f.serviceQuality || 0), 0) / totalFeedback
    ).toFixed(1);

    const npsDistribution = {
      promoter: feedbackData.filter((f) => f.npsScore >= 9).length,
      passive: feedbackData.filter((f) => f.npsScore >= 7 && f.npsScore < 9).length,
      detractor: feedbackData.filter((f) => f.npsScore < 7).length,
    };

    return {
      totalFeedback,
      averageNPS,
      averageServiceQuality,
      npsDistribution,
    };
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  if (loading) return <div className="loading">Loading analytics...</div>;
  if (error) return <div className="error">Error: {error}</div>;
  if (!analytics) return <div className="empty-state">No data available</div>;

  const npsScore = (
    ((analytics.npsDistribution.promoter - analytics.npsDistribution.detractor) /
      analytics.totalFeedback) *
    100
  ).toFixed(1);

  return (
    <div className="feedback-analytics">
      <div className="analytics-header">
        <h2>Feedback Analytics</h2>
        <div className="filters">
          <input
            type="date"
            name="dateFrom"
            value={filters.dateFrom}
            onChange={handleFilterChange}
            className="filter-input"
          />
          <input
            type="date"
            name="dateTo"
            value={filters.dateTo}
            onChange={handleFilterChange}
            className="filter-input"
          />
        </div>
      </div>

      <div className="analytics-grid">
        {/* Total Feedback Card */}
        <div className="analytics-card">
          <h3>Total Feedback</h3>
          <div className="metric-value">{analytics.totalFeedback}</div>
          <p className="metric-label">Responses collected</p>
        </div>

        {/* Average NPS Card */}
        <div className="analytics-card">
          <h3>Average NPS</h3>
          <div className="metric-value">{analytics.averageNPS}</div>
          <p className="metric-label">Out of 10</p>
        </div>

        {/* NPS Score Card */}
        <div className="analytics-card">
          <h3>NPS Score</h3>
          <div className={`metric-value ${npsScore >= 0 ? "positive" : "negative"}`}>
            {npsScore}%
          </div>
          <p className="metric-label">Promoter - Detractor</p>
        </div>

        {/* Service Quality Card */}
        <div className="analytics-card">
          <h3>Service Quality</h3>
          <div className="metric-value">{analytics.averageServiceQuality}</div>
          <p className="metric-label">Out of 5</p>
        </div>
      </div>

      <div className="analytics-charts">
        {/* NPS Distribution */}
        <div className="chart-container">
          <h3>NPS Distribution</h3>
          <div className="distribution-bars">
            <div className="bar-item">
              <div className="bar-label">Promoter (9-10)</div>
              <div className="bar-value">{analytics.npsDistribution.promoter}</div>
              <div className="bar-percentage">
                {(
                  (analytics.npsDistribution.promoter / analytics.totalFeedback) *
                  100
                ).toFixed(0)}%
              </div>
            </div>
            <div className="bar-item">
              <div className="bar-label">Passive (7-8)</div>
              <div className="bar-value">{analytics.npsDistribution.passive}</div>
              <div className="bar-percentage">
                {(
                  (analytics.npsDistribution.passive / analytics.totalFeedback) *
                  100
                ).toFixed(0)}%
              </div>
            </div>
            <div className="bar-item">
              <div className="bar-label">Detractor (0-6)</div>
              <div className="bar-value">{analytics.npsDistribution.detractor}</div>
              <div className="bar-percentage">
                {(
                  (analytics.npsDistribution.detractor / analytics.totalFeedback) *
                  100
                ).toFixed(0)}%
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default FeedbackAnalytics;
