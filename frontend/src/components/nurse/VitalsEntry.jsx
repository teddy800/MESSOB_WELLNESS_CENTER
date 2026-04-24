import React, { useEffect, useState } from "react";
import api from "../../services/api";

function VitalsEntry({ customerId, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [customerIdInput, setCustomerIdInput] = useState(customerId || "");
  const [vitals, setVitals] = useState({
    systolicBP: "",
    diastolicBP: "",
    heartRate: "",
    bmi: "",
    glucose: "",
    temperature: "",
    oxygenSaturation: "",
    notes: "",
  });

  const [alerts, setAlerts] = useState({});

  useEffect(() => {
    setCustomerIdInput(customerId || "");
  }, [customerId]);

  const getRiskLevel = (value, type) => {
    let level = "normal";
    let color = "green";

    if (type === "systolicBP") {
      if (value < 120) level = "normal";
      else if (value < 140) {
        level = "caution";
        color = "yellow";
      } else {
        level = "high";
        color = "red";
      }
    } else if (type === "diastolicBP") {
      if (value < 80) level = "normal";
      else if (value < 90) {
        level = "caution";
        color = "yellow";
      } else {
        level = "high";
        color = "red";
      }
    } else if (type === "heartRate") {
      if (value >= 60 && value <= 100) level = "normal";
      else if (value > 100 || value < 60) {
        level = "caution";
        color = "yellow";
      }
    } else if (type === "bmi") {
      if (value >= 18.5 && value < 25) level = "normal";
      else if (value < 18.5 || value >= 25) {
        level = "caution";
        color = "yellow";
      }
      if (value >= 30) {
        level = "high";
        color = "red";
      }
    } else if (type === "glucose") {
      if (value < 100) level = "normal";
      else if (value < 126) {
        level = "caution";
        color = "yellow";
      } else {
        level = "high";
        color = "red";
      }
    } else if (type === "temperature") {
      if (value >= 36.5 && value <= 37.5) level = "normal";
      else if (value > 37.5 || value < 36.5) {
        level = "caution";
        color = "yellow";
      }
      if (value > 38.5) {
        level = "high";
        color = "red";
      }
    } else if (type === "oxygenSaturation") {
      if (value >= 95) level = "normal";
      else if (value >= 90) {
        level = "caution";
        color = "yellow";
      } else {
        level = "high";
        color = "red";
      }
    }

    return { level, color };
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setVitals((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Check risk level
    if (value) {
      const numValue = parseFloat(value);
      const risk = getRiskLevel(numValue, name);
      setAlerts((prev) => ({
        ...prev,
        [name]: risk,
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const targetCustomerId = customerIdInput.trim() || customerId;

    if (!targetCustomerId) {
      setError("Customer ID is required");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = await api.post("/api/v1/vitals", {
        userId: targetCustomerId,
        systolicBP: vitals.systolicBP ? parseInt(vitals.systolicBP) : null,
        diastolicBP: vitals.diastolicBP ? parseInt(vitals.diastolicBP) : null,
        heartRate: vitals.heartRate ? parseInt(vitals.heartRate) : null,
        bmi: vitals.bmi ? parseFloat(vitals.bmi) : null,
        glucose: vitals.glucose ? parseInt(vitals.glucose) : null,
        temperature: vitals.temperature ? parseFloat(vitals.temperature) : null,
        oxygenSaturation: vitals.oxygenSaturation
          ? parseInt(vitals.oxygenSaturation)
          : null,
        notes: vitals.notes,
      });

      setSuccess("Vitals recorded successfully!");
      setVitals({
        systolicBP: "",
        diastolicBP: "",
        heartRate: "",
        bmi: "",
        glucose: "",
        temperature: "",
        oxygenSaturation: "",
        notes: "",
      });
      setAlerts({});

      setTimeout(() => {
        setSuccess("");
        if (onSuccess) onSuccess();
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to record vitals");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card vitals-entry">
      <h3>💉 Record Vitals</h3>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <form onSubmit={handleSubmit} className="vitals-form">
        <div className="form-group">
          <label className="form-label">Customer ID</label>
          <input
            type="text"
            name="customerId"
            value={customerIdInput}
            onChange={(e) => {
              setCustomerIdInput(e.target.value);
              if (error) {
                setError("");
              }
            }}
            placeholder="Enter target user ID"
            disabled={loading}
            className="form-input"
            required
          />
        </div>

        <div className="vitals-grid">
          <div className="form-group">
            <label className="form-label">Systolic BP</label>
            <div className="input-with-alert">
              <input
                type="number"
                name="systolicBP"
                value={vitals.systolicBP}
                onChange={handleChange}
                placeholder="mmHg"
                disabled={loading}
                className="form-input"
              />
              {alerts.systolicBP && (
                <span className={`risk-alert risk-${alerts.systolicBP.color}`}>
                  {alerts.systolicBP.level}
                </span>
              )}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Diastolic BP</label>
            <div className="input-with-alert">
              <input
                type="number"
                name="diastolicBP"
                value={vitals.diastolicBP}
                onChange={handleChange}
                placeholder="mmHg"
                disabled={loading}
                className="form-input"
              />
              {alerts.diastolicBP && (
                <span className={`risk-alert risk-${alerts.diastolicBP.color}`}>
                  {alerts.diastolicBP.level}
                </span>
              )}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Heart Rate</label>
            <div className="input-with-alert">
              <input
                type="number"
                name="heartRate"
                value={vitals.heartRate}
                onChange={handleChange}
                placeholder="bpm"
                disabled={loading}
                className="form-input"
              />
              {alerts.heartRate && (
                <span className={`risk-alert risk-${alerts.heartRate.color}`}>
                  {alerts.heartRate.level}
                </span>
              )}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">BMI</label>
            <div className="input-with-alert">
              <input
                type="number"
                step="0.1"
                name="bmi"
                value={vitals.bmi}
                onChange={handleChange}
                placeholder="kg/m²"
                disabled={loading}
                className="form-input"
              />
              {alerts.bmi && (
                <span className={`risk-alert risk-${alerts.bmi.color}`}>
                  {alerts.bmi.level}
                </span>
              )}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Glucose</label>
            <div className="input-with-alert">
              <input
                type="number"
                name="glucose"
                value={vitals.glucose}
                onChange={handleChange}
                placeholder="mg/dL"
                disabled={loading}
                className="form-input"
              />
              {alerts.glucose && (
                <span className={`risk-alert risk-${alerts.glucose.color}`}>
                  {alerts.glucose.level}
                </span>
              )}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Temperature</label>
            <div className="input-with-alert">
              <input
                type="number"
                step="0.1"
                name="temperature"
                value={vitals.temperature}
                onChange={handleChange}
                placeholder="°C"
                disabled={loading}
                className="form-input"
              />
              {alerts.temperature && (
                <span className={`risk-alert risk-${alerts.temperature.color}`}>
                  {alerts.temperature.level}
                </span>
              )}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">O₂ Saturation</label>
            <div className="input-with-alert">
              <input
                type="number"
                name="oxygenSaturation"
                value={vitals.oxygenSaturation}
                onChange={handleChange}
                placeholder="%"
                disabled={loading}
                className="form-input"
              />
              {alerts.oxygenSaturation && (
                <span
                  className={`risk-alert risk-${alerts.oxygenSaturation.color}`}
                >
                  {alerts.oxygenSaturation.level}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Notes</label>
          <textarea
            name="notes"
            value={vitals.notes}
            onChange={handleChange}
            placeholder="Additional notes (optional)"
            disabled={loading}
            rows="3"
            className="form-input"
          />
        </div>

        <button
          type="submit"
          className="btn btn-primary btn-large"
          disabled={loading}
        >
          {loading ? "Recording..." : "Submit Vitals"}
        </button>
      </form>
    </div>
  );
}

export default VitalsEntry;
