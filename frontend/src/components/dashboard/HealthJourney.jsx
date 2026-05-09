import React, { useState, useEffect } from "react";
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
    weight: record.weightKg ?? null,
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
  const [vitals, setVitals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [dateRange, setDateRange] = useState("30");
  const [generatingPDF, setGeneratingPDF] = useState(false);

  const exportHistoryCsv = () => {
    if (!vitals.length) return;

    const headers = [
      "RecordedAt",
      "WeightKg",
      "BMI",
      "Systolic",
      "Diastolic",
      "HeartRate",
      "Glucose",
      "Temperature",
      "OxygenSaturation",
    ];
    const rows = vitals.map((v) => [
      v.recordedAt,
      v.weight ?? "",
      v.bmi ?? "",
      v.systolicBP ?? "",
      v.diastolicBP ?? "",
      v.heartRate ?? "",
      v.glucose ?? "",
      v.temperature ?? "",
      v.oxygenSaturation ?? "",
    ]);

    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `health-journey-${dateRange}d.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
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
      const data = response.data.data;
      const records = Array.isArray(data?.records) ? data.records : [];
      const now = new Date();
      const cutoff = new Date(now);
      cutoff.setDate(now.getDate() - Number(dateRange));

      const filtered = records.filter((record) => {
        const recordedDate = new Date(record.recordedAt);
        return Number.isNaN(recordedDate.getTime())
          ? false
          : recordedDate >= cutoff;
      });

      setVitals(filtered.map(normalizeVitalRecord));
      setError("");
    } catch (err) {
      setVitals([]);
      setError("Failed to load vitals");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getLatestVital = () => {
    return vitals.length > 0 ? vitals[0] : null;
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

  const weightTrendData = chronologicalVitals
    .filter((v) => v.weight != null)
    .map((v) => ({ date: v.recordedAt, value: Number(v.weight) }));

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
            onClick={exportHistoryCsv}
            disabled={!vitals.length}
          >
            Export CSV
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={exportAsPdf}
            disabled={generatingPDF || !vitals.length}
          >
            {generatingPDF ? '📄 Generating PDF...' : '📄 Download PDF'}
          </button>
        </div>
      </div>

      {loading ? (
        <p className="loading-text">Loading health data...</p>
      ) : (
        <>
          {latest && (
            <div className="latest-vitals">
              <h3>Latest Vital Signs</h3>
              <div className="vitals-grid">
                {latest.weight != null && (
                  <div className="vital-card">
                    <span className="vital-label">Weight</span>
                    <span className="vital-value">
                      {latest.weight.toFixed(1)}
                    </span>
                    <span className="vital-unit">kg</span>
                  </div>
                )}

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

              <div className="risk-indicators">
                <h4>Health Risk Indicators</h4>
                {riskIndicators.length === 0 ? (
                  <p className="risk-empty">
                    No risk indicators available for this latest record.
                  </p>
                ) : (
                  <div className="risk-grid">
                    {riskIndicators.map((risk, idx) => (
                      <div key={idx} className={`risk-card risk-${risk.color}`}>
                        <span className="risk-title">{risk.label}</span>
                        <span className="risk-value">{risk.value}</span>
                        <span className="risk-level">{risk.level}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="trend-charts">
            <h3>Trend Graphs</h3>
            <p className="trend-legend">
              <span className="legend-dot legend-weight"></span> Weight
              <span className="legend-dot legend-bp"></span> Blood Pressure
              (Systolic/Diastolic)
              <span className="legend-dot legend-glucose"></span> Glucose
            </p>
            <div className="trend-grid">
              <TrendChart
                title="Weight Trend"
                unit=" kg"
                points={weightTrendData}
                colorClass="trend-weight"
                thresholds={[]}
              />
              <DualTrendChart
                title="Blood Pressure Trend"
                points={bpTrendData}
              />
              <TrendChart
                title="Glucose Trend"
                unit=" mg/dL"
                points={glucoseTrendData}
                colorClass="trend-glucose"
                thresholds={[
                  { value: 100, label: "100", className: "threshold-glucose" },
                  {
                    value: 126,
                    label: "126",
                    className: "threshold-glucose-high",
                  },
                ]}
              />
            </div>
          </div>

          {vitals.length > 0 && (
            <div className="vitals-history">
              <h3>Vital Signs History</h3>
              <div className="history-list">
                {vitals.map((vital, idx) => (
                  <div key={idx} className="history-item">
                    <span className="history-date">
                      {new Date(vital.recordedAt).toLocaleDateString()}
                    </span>
                    <div className="history-values">
                      {vital.bmi && <span>BMI: {vital.bmi.toFixed(1)}</span>}
                      {vital.systolicBP && vital.diastolicBP && (
                        <span>
                          BP: {vital.systolicBP}/{vital.diastolicBP}
                        </span>
                      )}
                      {vital.glucose && <span>Glucose: {vital.glucose}</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {vitals.length === 0 && !error && (
            <p className="empty-text">
              No vital signs recorded yet. Visit a nurse to get started!
            </p>
          )}
        </>
      )}
    </div>
  );
}

export default HealthJourney;
