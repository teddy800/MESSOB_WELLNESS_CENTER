import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import { useAuth } from "../../context/AuthContext";

function extractGlucoseFromNotes(notes) {
  if (!notes || typeof notes !== "string") return null;
  const match = notes.match(/blood glucose:\s*(\d+(?:\.\d+)?)/i);
  return match ? Number(match[1]) : null;
}

function normalizeVitalRecord(record) {
  return {
    ...record,
    systolicBP: record.systolic ?? null,
    diastolicBP: record.diastolic ?? null,
    glucose: extractGlucoseFromNotes(record.notes),
  };
}

function formatDateLabel(isoDate) {
  return new Date(isoDate).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

function getTrendDirection(points) {
  if (!points || points.length < 2) return "stable";
  const first = points[0].value;
  const last = points[points.length - 1].value;
  if (last > first) return "up";
  if (last < first) return "down";
  return "stable";
}

function toChartGeometry(values, width, height, padding) {
  if (!values.length) return { points: [], path: "" };

  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min;

  // For a single data point, create a flat 2-point line so the graph is still visible.
  const workingValues = values.length === 1 ? [values[0], values[0]] : values;
  const xStep =
    workingValues.length > 1
      ? (width - padding * 2) / (workingValues.length - 1)
      : 0;

  const allPoints = workingValues.map((value, index) => {
    const x = padding + index * xStep;
    const y =
      range === 0
        ? height / 2
        : padding + ((max - value) / range) * (height - padding * 2);
    return { x, y, value };
  });

  const path = allPoints
    .map(
      (point, index) =>
        `${index === 0 ? "M" : "L"} ${point.x.toFixed(2)} ${point.y.toFixed(2)}`,
    )
    .join(" ");

  const visiblePoints = values.length === 1 ? [allPoints[0]] : allPoints;
  return { points: visiblePoints, path };
}

function TrendChart({ title, unit, points, colorClass, thresholds = [] }) {
  if (!points.length) {
    return (
      <div className="trend-chart-card">
        <div className="trend-header">
          <h4>{title}</h4>
        </div>
        <p className="trend-empty">No data in selected range</p>
      </div>
    );
  }

  const width = 280;
  const height = 90;
  const padding = 8;
  const values = points.map((p) => p.value);
  const { points: plottedPoints, path } = toChartGeometry(
    values,
    width,
    height,
    padding,
  );

  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min;
  const toY = (value) => {
    if (range === 0) return height / 2;
    return padding + ((max - value) / range) * (height - padding * 2);
  };
  const trend = getTrendDirection(points);
  const trendLabel =
    trend === "up" ? "Increasing" : trend === "down" ? "Decreasing" : "Stable";
  const latest = points[points.length - 1];

  return (
    <div className="trend-chart-card">
      <div className="trend-header">
        <h4>{title}</h4>
        <span className={`trend-badge trend-${trend}`}>{trendLabel}</span>
      </div>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className={`trend-svg ${colorClass}`}
        role="img"
        aria-label={`${title} trend`}
      >
        <line
          x1={padding}
          y1={height - padding}
          x2={width - padding}
          y2={height - padding}
          className="trend-axis"
        />
        {thresholds.map((threshold) => {
          const y = toY(threshold.value);
          return (
            <g key={threshold.label}>
              <line
                x1={padding}
                y1={y}
                x2={width - padding}
                y2={y}
                className={`threshold-line ${threshold.className || ""}`}
              />
              <text
                x={width - padding - 2}
                y={y - 2}
                textAnchor="end"
                className="threshold-label"
              >
                {threshold.label}
              </text>
            </g>
          );
        })}
        <path d={path} fill="none" strokeWidth="3" strokeLinecap="round" />
        {plottedPoints.map((point, index) => (
          <circle
            key={index}
            cx={point.x}
            cy={point.y}
            r="3.4"
            className="trend-point"
          >
            <title>{`${formatDateLabel(points[index].date)}: ${point.value}${unit}`}</title>
          </circle>
        ))}
      </svg>
      <div className="trend-footer">
        <span className="trend-value">
          {latest.value}
          {unit}
        </span>
        <span className="trend-date">{formatDateLabel(latest.date)}</span>
      </div>
    </div>
  );
}

function DualTrendChart({ title, points }) {
  if (!points.length) {
    return (
      <div className="trend-chart-card">
        <div className="trend-header">
          <h4>{title}</h4>
        </div>
        <p className="trend-empty">No data in selected range</p>
      </div>
    );
  }

  const width = 280;
  const height = 90;
  const padding = 8;

  const systolicValues = points.map((p) => p.systolic);
  const diastolicValues = points.map((p) => p.diastolic);

  const min = Math.min(...systolicValues, ...diastolicValues);
  const max = Math.max(...systolicValues, ...diastolicValues);
  const range = max - min;

  const sharedY = (value) => {
    if (range === 0) return height / 2;
    return padding + ((max - value) / range) * (height - padding * 2);
  };

  const bpThresholds = [
    { value: 120, label: "Sys 120", className: "threshold-sys" },
    { value: 140, label: "Sys 140", className: "threshold-sys-high" },
    { value: 80, label: "Dia 80", className: "threshold-dia" },
    { value: 90, label: "Dia 90", className: "threshold-dia-high" },
  ];

  const workingPoints = points.length === 1 ? [points[0], points[0]] : points;
  const xStep =
    workingPoints.length > 1
      ? (width - padding * 2) / (workingPoints.length - 1)
      : 0;

  const buildLine = (key) => {
    const allPoints = workingPoints.map((point, index) => {
      const x = padding + index * xStep;
      const y = sharedY(point[key]);
      return { x, y, value: point[key] };
    });

    const path = allPoints
      .map(
        (point, index) =>
          `${index === 0 ? "M" : "L"} ${point.x.toFixed(2)} ${point.y.toFixed(2)}`,
      )
      .join(" ");

    return {
      path,
      points: points.length === 1 ? [allPoints[0]] : allPoints,
    };
  };

  const systolicLine = buildLine("systolic");
  const diastolicLine = buildLine("diastolic");
  const trend = getTrendDirection(
    points.map((p) => ({ date: p.date, value: p.systolic })),
  );
  const trendLabel =
    trend === "up"
      ? "Systolic Rising"
      : trend === "down"
        ? "Systolic Falling"
        : "Stable";
  const latest = points[points.length - 1];

  return (
    <div className="trend-chart-card">
      <div className="trend-header">
        <h4>{title}</h4>
        <span className={`trend-badge trend-${trend}`}>{trendLabel}</span>
      </div>

      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="trend-svg trend-bp-dual"
        role="img"
        aria-label={`${title} trend`}
      >
        <line
          x1={padding}
          y1={height - padding}
          x2={width - padding}
          y2={height - padding}
          className="trend-axis"
        />
        {bpThresholds.map((threshold) => {
          const y = sharedY(threshold.value);
          return (
            <g key={threshold.label}>
              <line
                x1={padding}
                y1={y}
                x2={width - padding}
                y2={y}
                className={`threshold-line ${threshold.className}`}
              />
              <text
                x={padding + 2}
                y={y - 2}
                textAnchor="start"
                className="threshold-label"
              >
                {threshold.label}
              </text>
            </g>
          );
        })}

        <path
          d={systolicLine.path}
          fill="none"
          strokeWidth="3"
          strokeLinecap="round"
          className="bp-systolic-line"
        />
        {systolicLine.points.map((point, index) => (
          <circle
            key={`sys-${index}`}
            cx={point.x}
            cy={point.y}
            r="3.4"
            className="bp-systolic-point"
          >
            <title>{`${formatDateLabel(points[index].date)}: Systolic ${point.value}`}</title>
          </circle>
        ))}

        <path
          d={diastolicLine.path}
          fill="none"
          strokeWidth="3"
          strokeLinecap="round"
          className="bp-diastolic-line"
        />
        {diastolicLine.points.map((point, index) => (
          <circle
            key={`dia-${index}`}
            cx={point.x}
            cy={point.y}
            r="3.4"
            className="bp-diastolic-point"
          >
            <title>{`${formatDateLabel(points[index].date)}: Diastolic ${point.value}`}</title>
          </circle>
        ))}
      </svg>

      <div className="trend-footer">
        <span className="trend-value">
          {latest.systolic}/{latest.diastolic} mmHg
        </span>
        <span className="trend-date">{formatDateLabel(latest.date)}</span>
      </div>
      <p className="bp-line-legend">
        <span className="legend-dot legend-bp-systolic"></span> Systolic
        <span className="legend-dot legend-bp-diastolic"></span> Diastolic
      </p>
    </div>
  );
}

function HealthJourney() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [vitals, setVitals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [dateRange, setDateRange] = useState("30");
  const [generatingPDF, setGeneratingPDF] = useState(false);
  const ITEMS_PER_PAGE = 10;

  const handleViewWellnessPlan = async () => {
    try {
      const response = await api.get(`/api/v1/plans/${user.id}`);
      const plans = response.data.data;
      const activePlan = Array.isArray(plans) ? plans.find(p => p.isActive) : null;
      
      if (activePlan) {
        navigate('/dashboard?tab=wellness');
      } else {
        setError("No active wellness plan found. Visit a nurse to create one.");
      }
    } catch (err) {
      console.error('Error fetching wellness plan:', err);
      setError("Failed to load wellness plan");
    }
  };

  // Calculate health summary metrics
  const calculateHealthSummary = () => {
    if (!vitals.length) return null;
    
    const latest = vitals[0];
    let healthScore = 100;
    
    // Deduct points based on risk factors
    if (latest.systolicBP >= 140) healthScore -= 20;
    else if (latest.systolicBP >= 130) healthScore -= 10;
    
    if (latest.glucose >= 126) healthScore -= 20;
    else if (latest.glucose >= 100) healthScore -= 10;
    
    if (latest.bmi >= 30) healthScore -= 20;
    else if (latest.bmi >= 25) healthScore -= 10;
    
    if (latest.temperature > 37.5) healthScore -= 15;
    if (latest.oxygenSaturation < 95) healthScore -= 15;
    
    healthScore = Math.max(0, Math.min(100, healthScore));
    
    const recordedDate = new Date(latest.recordedAt);
    const now = new Date();
    const hoursDiff = Math.floor((now - recordedDate) / (1000 * 60 * 60));
    
    return {
      score: healthScore,
      lastCheckIn: recordedDate,
      hoursSince: hoursDiff,
      status: healthScore >= 80 ? 'Healthy' : healthScore >= 60 ? 'Monitor' : 'Attention Needed',
      statusColor: healthScore >= 80 ? 'green' : healthScore >= 60 ? 'yellow' : 'red'
    };
  };

  const exportAsPdf = async () => {
    try {
      setGeneratingPDF(true);
      setError('');
      const response = await api.post(
        `/api/v1/reports/combined/${user.id}?includeVitals=true`,
        {},
        { responseType: 'blob' }
      );
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `health-journey-${user.id}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to download PDF:', err);
      const errorMsg = err.response?.status === 403 
        ? 'You do not have permission to download this report'
        : err.response?.data?.message || 'Failed to generate PDF';
      setError(errorMsg);
    } finally {
      setGeneratingPDF(false);
    }
  };

  useEffect(() => {
    if (!user?.id) return;
    fetchVitals();
  }, [dateRange, user?.id]);

  const fetchVitals = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/api/v1/vitals/history/${user.id}`);
      console.log('Vitals response:', response.data);
      
      const data = response.data.data;
      
      // Handle different response formats
      let records = [];
      if (Array.isArray(data)) {
        records = data;
      } else if (data?.records && Array.isArray(data.records)) {
        records = data.records;
      } else if (data?.vitals && Array.isArray(data.vitals)) {
        records = data.vitals;
      }
      
      console.log('Records found:', records.length);
      
      const now = new Date();
      const cutoff = new Date(now);
      cutoff.setDate(now.getDate() - Number(dateRange));

      console.log('Filtering records from', cutoff, 'to', now);

      const filtered = records.filter((record) => {
        const recordedDate = new Date(record.recordedAt);
        const isValid = !Number.isNaN(recordedDate.getTime());
        const isInRange = isValid && recordedDate >= cutoff;
        console.log('Record:', record.recordedAt, 'Valid:', isValid, 'InRange:', isInRange);
        return isInRange;
      });

      console.log('Filtered records:', filtered.length);
      setVitals(filtered.map(normalizeVitalRecord));
      setError("");
    } catch (err) {
      console.error('Error fetching vitals:', err);
      setVitals([]);
      setError("Failed to load vitals");
    } finally {
      setLoading(false);
    }
  };

  const getLatestVital = () => {
    return vitals.length > 0 ? vitals[0] : null;
  };

  const getPreviousVital = () => {
    return vitals.length > 1 ? vitals[1] : null;
  };

  const calculateComparison = (current, previous, field) => {
    if (!current || !previous || current[field] == null || previous[field] == null) {
      return null;
    }
    const diff = current[field] - previous[field];
    const percent = ((diff / previous[field]) * 100).toFixed(1);
    return { diff: diff.toFixed(1), percent, direction: diff > 0 ? 'up' : diff < 0 ? 'down' : 'stable' };
  };

  const getHealthScore = () => {
    const latest = getLatestVital();
    if (!latest) return 0;
    
    let score = 100;
    if (latest.systolicBP) {
      if (latest.systolicBP >= 140) score -= 20;
      else if (latest.systolicBP >= 130) score -= 10;
    }
    if (latest.glucose) {
      if (latest.glucose >= 200) score -= 20;
      else if (latest.glucose >= 126) score -= 10;
    }
    if (latest.bmi) {
      if (latest.bmi >= 30) score -= 20;
      else if (latest.bmi >= 25) score -= 10;
    }
    return Math.max(0, score);
  };

  const getHealthStatus = () => {
    const score = getHealthScore();
    if (score >= 80) return { label: 'Healthy', color: 'green', icon: '✓' };
    if (score >= 60) return { label: 'Monitor', color: 'yellow', icon: '⚠' };
    return { label: 'Attention Needed', color: 'red', icon: '!' };
  };

  const getDaysSinceLastVital = () => {
    const latest = getLatestVital();
    if (!latest) return null;
    const lastDate = new Date(latest.recordedAt);
    const today = new Date();
    const days = Math.floor((today - lastDate) / (1000 * 60 * 60 * 24));
    return days;
  };

  const getRiskLevel = (value, type) => {
    if (type === "BP_SYSTOLIC") {
      if (value < 120) return { level: "Normal", color: "green" };
      if (value < 140) return { level: "Elevated", color: "yellow" };
      return { level: "High", color: "red" };
    }
    if (type === "BMI") {
      if (value < 18.5) return { level: "Underweight", color: "blue" };
      if (value < 25) return { level: "Normal", color: "green" };
      if (value < 30) return { level: "Overweight", color: "yellow" };
      return { level: "Obese", color: "red" };
    }
    if (type === "GLUCOSE") {
      if (value < 100) return { level: "Normal", color: "green" };
      if (value < 126) return { level: "Prediabetic", color: "yellow" };
      return { level: "Diabetic", color: "red" };
    }
    return { level: "Unknown", color: "gray" };
  };

  const latest = getLatestVital();
  const chronologicalVitals = [...vitals].reverse();

  const bpTrendData = chronologicalVitals
    .filter((v) => v.systolicBP != null && v.diastolicBP != null)
    .map((v) => ({
      date: v.recordedAt,
      systolic: Number(v.systolicBP),
      diastolic: Number(v.diastolicBP),
    }));

  const glucoseTrendData = chronologicalVitals
    .filter((v) => v.glucose != null)
    .map((v) => ({ date: v.recordedAt, value: Number(v.glucose) }));

  const riskIndicators = latest
    ? [
        latest.bmi != null
          ? {
              label: "BMI Risk",
              ...getRiskLevel(latest.bmi, "BMI"),
              value: latest.bmi.toFixed(1),
            }
          : null,
        latest.systolicBP != null
          ? {
              label: "Blood Pressure Risk",
              ...getRiskLevel(latest.systolicBP, "BP_SYSTOLIC"),
              value: `${latest.systolicBP}/${latest.diastolicBP}`,
            }
          : null,
        latest.glucose != null
          ? {
              label: "Glucose Risk",
              ...getRiskLevel(latest.glucose, "GLUCOSE"),
              value: `${latest.glucose}`,
            }
          : null,
      ].filter(Boolean)
    : [];

  return (
    <div className="card health-journey">
      <h2>💪 Health Journey</h2>

      {error && <div className="alert alert-error">{error}</div>}



      <div className="date-range-filter">
        <label>View last:</label>
        <select
          value={dateRange}
          onChange={(e) => setDateRange(e.target.value)}
        >
          <option value="7">7 days</option>
          <option value="30">30 days</option>
          <option value="90">90 days</option>
          <option value="365">1 year</option>
        </select>
        <div className="journey-export-actions">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={exportAsPdf}
            disabled={generatingPDF || !vitals.length}
          >
            {generatingPDF ? '📄 Generating PDF...' : '📄 Download PDF'}
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleViewWellnessPlan}
          >
            🎯 View My Plan
          </button>
        </div>
      </div>

      {loading ? (
        <p className="loading-text">Loading health data...</p>
      ) : (
        <>
          {latest && (
            <>
              <div className="health-summary-card">
                <div className="summary-header">
                  <h3>📊 Your Health Summary</h3>
                </div>
                <div className="summary-content">
                  <div className="summary-score">
                    <div className={`score-circle score-${getHealthStatus().color}`}>
                      <span className="score-number">{getHealthScore()}</span>
                      <span className="score-label">Health Score</span>
                    </div>
                    <div className="summary-info">
                      <p className="summary-status">
                        Status: <span className={`status-badge status-${getHealthStatus().color}`}>
                          {getHealthStatus().icon} {getHealthStatus().label}
                        </span>
                      </p>
                      <p className="summary-date">Last Check-in: {new Date(latest.recordedAt).toLocaleDateString()}</p>
                      <p className="summary-days">Days Since Last Vitals: {getDaysSinceLastVital()} days</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="vital-comparison-grid">
                <h3>📈 Progress Metrics</h3>
                <div className="comparison-cards">
                  {latest.systolicBP && latest.diastolicBP && (
                    <div className="comparison-card">
                      <span className="comparison-label">Blood Pressure</span>
                      <span className="comparison-current">{latest.systolicBP}/{latest.diastolicBP}</span>
                      {calculateComparison(latest, getPreviousVital(), 'systolicBP') && (
                        <span className={`comparison-change change-${calculateComparison(latest, getPreviousVital(), 'systolicBP').direction}`}>
                          {calculateComparison(latest, getPreviousVital(), 'systolicBP').direction === 'up' ? '↑' : '↓'} {Math.abs(calculateComparison(latest, getPreviousVital(), 'systolicBP').diff)} mmHg
                        </span>
                      )}
                    </div>
                  )}
                  {latest.glucose && (
                    <div className="comparison-card">
                      <span className="comparison-label">Glucose</span>
                      <span className="comparison-current">{latest.glucose} mg/dL</span>
                      {calculateComparison(latest, getPreviousVital(), 'glucose') && (
                        <span className={`comparison-change change-${calculateComparison(latest, getPreviousVital(), 'glucose').direction}`}>
                          {calculateComparison(latest, getPreviousVital(), 'glucose').direction === 'up' ? '↑' : '↓'} {Math.abs(calculateComparison(latest, getPreviousVital(), 'glucose').percent)}%
                        </span>
                      )}
                    </div>
                  )}
                  {latest.bmi && (
                    <div className="comparison-card">
                      <span className="comparison-label">BMI</span>
                      <span className="comparison-current">{latest.bmi.toFixed(1)}</span>
                      <span className={`vital-status status-${getRiskLevel(latest.bmi, "BMI").color}`}>
                        {getRiskLevel(latest.bmi, "BMI").level}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {latest && (
            <div className="latest-vitals">
              <h3>Latest Vital Signs</h3>
              <div className="vitals-grid">
                {latest.bmi && (
                  <div className="vital-card">
                    <span className="vital-label">BMI</span>
                    <span className="vital-value">{latest.bmi.toFixed(1)}</span>
                    <span
                      className={`vital-status status-${getRiskLevel(latest.bmi, "BMI").color}`}
                    >
                      {getRiskLevel(latest.bmi, "BMI").level}
                    </span>
                  </div>
                )}

                {latest.systolicBP && latest.diastolicBP && (
                  <div className="vital-card">
                    <span className="vital-label">Blood Pressure</span>
                    <span className="vital-value">
                      {latest.systolicBP}/{latest.diastolicBP}
                    </span>
                    <span
                      className={`vital-status status-${getRiskLevel(latest.systolicBP, "BP_SYSTOLIC").color}`}
                    >
                      {getRiskLevel(latest.systolicBP, "BP_SYSTOLIC").level}
                    </span>
                  </div>
                )}

                {latest.heartRate && (
                  <div className="vital-card">
                    <span className="vital-label">Heart Rate</span>
                    <span className="vital-value">{latest.heartRate}</span>
                    <span className="vital-unit">bpm</span>
                  </div>
                )}

                {latest.glucose && (
                  <div className="vital-card">
                    <span className="vital-label">Glucose</span>
                    <span className="vital-value">{latest.glucose}</span>
                    <span
                      className={`vital-status status-${getRiskLevel(latest.glucose, "GLUCOSE").color}`}
                    >
                      {getRiskLevel(latest.glucose, "GLUCOSE").level}
                    </span>
                  </div>
                )}

                {latest.temperature && (
                  <div className="vital-card">
                    <span className="vital-label">Temperature</span>
                    <span className="vital-value">{latest.temperature}°C</span>
                  </div>
                )}

                {latest.oxygenSaturation && (
                  <div className="vital-card">
                    <span className="vital-label">O₂ Saturation</span>
                    <span className="vital-value">
                      {latest.oxygenSaturation}%
                    </span>
                  </div>
                )}
              </div>
              <p className="vital-timestamp">
                Last recorded:{" "}
                {new Date(latest.recordedAt).toLocaleDateString()}
              </p>


            </div>
          )}

          {/* Comparison Metrics Section */}
          {!loading && vitals.length > 1 && (() => {
            const comparison = calculateComparison();
            return comparison ? (
              <div className="comparison-metrics">
                <h3>Progress & Comparison</h3>
                <div className="comparison-grid">
                  {comparison.bp.systolicChange !== null && (
                    <div className="comparison-card">
                      <span className="comparison-label">Blood Pressure Change</span>
                      <div className="comparison-value">
                        <span className={`change-amount ${comparison.bp.trend}`}>
                          {comparison.bp.trend === 'down' ? '↓' : comparison.bp.trend === 'up' ? '↑' : '→'} {Math.abs(comparison.bp.systolicChange)} mmHg
                        </span>
                        <span className="change-percent">(Systolic)</span>
                      </div>
                    </div>
                  )}
                  {comparison.glucose.change !== null && (
                    <div className="comparison-card">
                      <span className="comparison-label">Glucose Change</span>
                      <div className="comparison-value">
                        <span className={`change-amount ${comparison.glucose.trend}`}>
                          {comparison.glucose.trend === 'down' ? '↓' : comparison.glucose.trend === 'up' ? '↑' : '→'} {Math.abs(comparison.glucose.change)} mg/dL
                        </span>
                        <span className="change-percent">({comparison.glucose.percent}%)</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : null;
          })()}

          {/* Health Recommendations Section - REMOVED */}

          {/* Trend Graphs Section - REMOVED */}

          {vitals.length === 0 && !error && (
            <div className="empty-state-card">
              <p className="empty-text">
                📊 No vital signs recorded in the selected range
              </p>
              <p className="empty-subtext">
                Visit a nurse to record your health vitals and start tracking your health journey!
              </p>
              <button 
                className="btn btn-primary"
                onClick={() => setDateRange('365')}
              >
                View All Time Data
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default HealthJourney;
