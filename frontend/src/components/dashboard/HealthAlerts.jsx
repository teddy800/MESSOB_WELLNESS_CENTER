import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

function HealthAlerts() {
  const { user } = useAuth();
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dismissedAlerts, setDismissedAlerts] = useState([]);

  useEffect(() => {
    if (user?.id) {
      fetchAlerts();
    }
  }, [user?.id]);

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/api/v1/vitals`);
      const vitals = response.data.data;
      
      if (!vitals || vitals.length === 0) {
        setAlerts([]);
        return;
      }

      const generatedAlerts = generateAlerts(vitals[0]);
      setAlerts(generatedAlerts);
    } catch (err) {
      console.error('Failed to fetch alerts:', err);
      setAlerts([]);
    } finally {
      setLoading(false);
    }
  };

  const generateAlerts = (vital) => {
    const alerts = [];

    // Blood Pressure Alerts
    if (vital.systolicBP) {
      if (vital.systolicBP >= 180 || vital.diastolicBP >= 120) {
        alerts.push({
          id: 'bp-critical',
          type: 'critical',
          title: 'Critical Blood Pressure',
          message: `Your BP is ${vital.systolicBP}/${vital.diastolicBP}. Seek immediate medical attention.`,
          icon: '🚨',
          action: 'Contact Doctor',
        });
      } else if (vital.systolicBP >= 140 || vital.diastolicBP >= 90) {
        alerts.push({
          id: 'bp-high',
          type: 'warning',
          title: 'High Blood Pressure',
          message: `Your BP is ${vital.systolicBP}/${vital.diastolicBP}. Monitor closely and follow your wellness plan.`,
          icon: '⚠️',
          action: 'View Plan',
        });
      } else if (vital.systolicBP >= 130 || vital.diastolicBP >= 80) {
        alerts.push({
          id: 'bp-elevated',
          type: 'info',
          title: 'Elevated Blood Pressure',
          message: `Your BP is ${vital.systolicBP}/${vital.diastolicBP}. Maintain healthy habits.`,
          icon: 'ℹ️',
          action: 'Learn More',
        });
      }
    }

    // Glucose Alerts
    if (vital.glucose) {
      if (vital.glucose >= 300) {
        alerts.push({
          id: 'glucose-critical',
          type: 'critical',
          title: 'Critical Blood Glucose',
          message: `Your glucose is ${vital.glucose} mg/dL. Seek immediate medical attention.`,
          icon: '🚨',
          action: 'Contact Doctor',
        });
      } else if (vital.glucose >= 200) {
        alerts.push({
          id: 'glucose-high',
          type: 'warning',
          title: 'High Blood Glucose',
          message: `Your glucose is ${vital.glucose} mg/dL. This may indicate diabetes.`,
          icon: '⚠️',
          action: 'View Plan',
        });
      } else if (vital.glucose >= 126) {
        alerts.push({
          id: 'glucose-elevated',
          type: 'info',
          title: 'Elevated Blood Glucose',
          message: `Your glucose is ${vital.glucose} mg/dL. You may be prediabetic.`,
          icon: 'ℹ️',
          action: 'Learn More',
        });
      }
    }

    // BMI Alerts
    if (vital.bmi) {
      if (vital.bmi >= 40) {
        alerts.push({
          id: 'bmi-critical',
          type: 'warning',
          title: 'Severe Obesity',
          message: `Your BMI is ${vital.bmi.toFixed(1)}. Consider consulting a healthcare provider.`,
          icon: '⚠️',
          action: 'View Plan',
        });
      } else if (vital.bmi >= 30) {
        alerts.push({
          id: 'bmi-high',
          type: 'info',
          title: 'Obesity',
          message: `Your BMI is ${vital.bmi.toFixed(1)}. Follow your exercise plan.`,
          icon: 'ℹ️',
          action: 'View Plan',
        });
      } else if (vital.bmi >= 25) {
        alerts.push({
          id: 'bmi-overweight',
          type: 'info',
          title: 'Overweight',
          message: `Your BMI is ${vital.bmi.toFixed(1)}. Maintain healthy habits.`,
          icon: 'ℹ️',
          action: 'Learn More',
        });
      }
    }

    // Temperature Alerts
    if (vital.temperature) {
      if (vital.temperature >= 39) {
        alerts.push({
          id: 'temp-critical',
          type: 'critical',
          title: 'High Fever',
          message: `Your temperature is ${vital.temperature}°C. Seek medical attention.`,
          icon: '🚨',
          action: 'Contact Doctor',
        });
      } else if (vital.temperature >= 38) {
        alerts.push({
          id: 'temp-high',
          type: 'warning',
          title: 'Fever',
          message: `Your temperature is ${vital.temperature}°C. Rest and monitor.`,
          icon: '⚠️',
          action: 'View Tips',
        });
      }
    }

    // Oxygen Saturation Alerts
    if (vital.oxygenSaturation) {
      if (vital.oxygenSaturation < 90) {
        alerts.push({
          id: 'o2-critical',
          type: 'critical',
          title: 'Low Oxygen Saturation',
          message: `Your O₂ saturation is ${vital.oxygenSaturation}%. Seek immediate medical attention.`,
          icon: '🚨',
          action: 'Contact Doctor',
        });
      } else if (vital.oxygenSaturation < 95) {
        alerts.push({
          id: 'o2-low',
          type: 'warning',
          title: 'Low Oxygen Saturation',
          message: `Your O₂ saturation is ${vital.oxygenSaturation}%. Monitor closely.`,
          icon: '⚠️',
          action: 'Learn More',
        });
      }
    }

    return alerts;
  };

  const dismissAlert = (alertId) => {
    setDismissedAlerts([...dismissedAlerts, alertId]);
  };

  const visibleAlerts = alerts.filter(a => !dismissedAlerts.includes(a.id));

  if (loading) return <p className="loading-text">Checking health alerts...</p>;

  if (visibleAlerts.length === 0) {
    return (
      <div className="card health-alerts">
        <h3>🔔 Health Alerts</h3>
        <div className="alert alert-success">
          ✅ No health alerts. Keep up the good work!
        </div>
      </div>
    );
  }

  return (
    <div className="card health-alerts">
      <h3>🔔 Health Alerts ({visibleAlerts.length})</h3>
      
      <div className="alerts-list">
        {visibleAlerts.map((alert) => (
          <div key={alert.id} className={`alert-item alert-${alert.type}`}>
            <div className="alert-header">
              <span className="alert-icon">{alert.icon}</span>
              <span className="alert-title">{alert.title}</span>
              <button 
                className="alert-close"
                onClick={() => dismissAlert(alert.id)}
              >
                ✕
              </button>
            </div>
            <p className="alert-message">{alert.message}</p>
            <button className="btn btn-small btn-primary">
              {alert.action}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default HealthAlerts;
