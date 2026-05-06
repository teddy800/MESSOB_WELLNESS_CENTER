import React from "react";

function FeedbackModal({ feedback, onClose }) {
  if (!feedback) return null;

  const getNPSColor = (score) => {
    if (score >= 9) return "promoter";
    if (score >= 7) return "passive";
    return "detractor";
  };

  const renderRating = (rating) => {
    if (!rating) return "N/A";
    return (
      <div className="rating-display">
        {[...Array(5)].map((_, i) => (
          <span key={i} className={`star ${i < rating ? "filled" : ""}`}>
            ★
          </span>
        ))}
        <span className="rating-value">{rating}/5</span>
      </div>
    );
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Feedback Details</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body">
          <div className="detail-section">
            <h3>Patient Information</h3>
            <div className="detail-row">
              <span className="label">Name:</span>
              <span className="value">{feedback.user?.fullName || "N/A"}</span>
            </div>
            <div className="detail-row">
              <span className="label">Email:</span>
              <span className="value">{feedback.user?.email || "N/A"}</span>
            </div>
          </div>

          <div className="detail-section">
            <h3>NPS & Satisfaction</h3>
            <div className="detail-row">
              <span className="label">NPS Score:</span>
              <span className="value">
                <span className={`badge badge-nps badge-${getNPSColor(feedback.npsScore)}`}>
                  {feedback.npsScore || "-"}/10
                </span>
              </span>
            </div>
            <div className="detail-row">
              <span className="label">Feedback Type:</span>
              <span className="value">{feedback.feedbackType || "-"}</span>
            </div>
          </div>

          <div className="detail-section">
            <h3>Service Ratings</h3>
            <div className="detail-row">
              <span className="label">Service Quality:</span>
              <span className="value">{renderRating(feedback.serviceQuality)}</span>
            </div>
            <div className="detail-row">
              <span className="label">Staff Behavior:</span>
              <span className="value">{renderRating(feedback.staffBehavior)}</span>
            </div>
            <div className="detail-row">
              <span className="label">Cleanliness:</span>
              <span className="value">{renderRating(feedback.cleanliness)}</span>
            </div>
            <div className="detail-row">
              <span className="label">Wait Time:</span>
              <span className="value">{renderRating(feedback.waitTime)}</span>
            </div>
          </div>

          <div className="detail-section">
            <h3>Comments</h3>
            <div className="comments-box">
              {feedback.comments || "No comments provided"}
            </div>
          </div>

          <div className="detail-section">
            <h3>Submission Date</h3>
            <div className="detail-row">
              <span className="label">Date:</span>
              <span className="value">{new Date(feedback.createdAt).toLocaleString()}</span>
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

export default FeedbackModal;
