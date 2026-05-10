import React from "react";

function VitalModal({ vital, onClose }) {
  if (!vital) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Vital Record Details</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body">
          <div className="detail-section">
            <h3>Patient Information</h3>
            <div className="detail-row">
              <span className="label">Name:</span>
              <span className="value">{vital.user?.fullName || "N/A"}</span>
            </div>
            <div className="detail-row">
              <span className="label">Email:</span>
              <span className="value">{vital.user?.email || "N/A"}</span>
            </div>
          </div>

          <div className="detail-section">
            <h3>Body Measurements</h3>
            <div className="detail-row">
              <span className="label">Weight:</span>
              <span className="value">{vital.weightKg?.toFixed(1) || "-"} kg</span>
            </div>
            <div className="detail-row">
              <span className="label">Height:</span>
              <span className="value">{vital.heightCm?.toFixed(1) || "-"} cm</span>
            </div>
            <div className="detail-row">
              <span className="label">BMI:</span>
              <span className="value">
                {vital.bmi?.toFixed(1) || "-"}
                <span className={`badge badge-${vital.bmiCategory?.toLowerCase()}`}>
                  {vital.bmiCategory || "N/A"}
                </span>
              </span>
            </div>
          </div>

          <div className="detail-section">
            <h3>Vital Signs</h3>
            <div className="detail-row">
              <span className="label">Blood Pressure:</span>
              <span className="value">
                {vital.systolic && vital.diastolic ? `${vital.systolic}/${vital.diastolic}` : "-"} mmHg
                <span className={`badge badge-${vital.bpCategory?.toLowerCase()}`}>
                  {vital.bpCategory || "N/A"}
                </span>
              </span>
            </div>
            <div className="detail-row">
              <span className="label">Heart Rate:</span>
              <span className="value">{vital.heartRate || "-"} bpm</span>
            </div>
            <div className="detail-row">
              <span className="label">Temperature:</span>
              <span className="value">{vital.temperature?.toFixed(1) || "-"}°C</span>
            </div>
            <div className="detail-row">
              <span className="label">Oxygen Saturation:</span>
              <span className="value">{vital.oxygenSaturation || "-"}%</span>
            </div>
          </div>

          <div className="detail-section">
            <h3>Additional Information</h3>
            <div className="detail-row">
              <span className="label">Recorded At:</span>
              <span className="value">{new Date(vital.recordedAt).toLocaleString()}</span>
            </div>
            <div className="detail-row">
              <span className="label">Notes:</span>
              <span className="value">{vital.notes || "No notes"}</span>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn-close" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}

export default VitalModal;
