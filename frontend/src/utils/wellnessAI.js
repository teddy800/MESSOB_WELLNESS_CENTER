// Wellness AI suggestion logic based on vitals

export const WELLNESS_TEMPLATES = {
  GENERAL: {
    id: 'general',
    title: 'General Wellness Plan',
    nutrition: 'Maintain balanced diet with adequate fruits, vegetables, and whole grains',
    exercise: '150 minutes of moderate aerobic activity per week',
    stressManagement: 'Practice relaxation techniques, meditation, or yoga',
    goals: 'Maintain overall health and wellness',
  },
  WEIGHT_MANAGEMENT: {
    id: 'weight_management',
    title: 'Weight Management Plan',
    nutrition: 'Reduce caloric intake, increase fiber, limit processed foods and sugary drinks',
    exercise: '300 minutes of moderate aerobic activity per week with strength training',
    stressManagement: 'Address emotional eating, practice mindfulness',
    goals: 'Achieve healthy BMI through gradual weight loss (0.5-1 kg per week)',
  },
  HYPERTENSION: {
    id: 'hypertension',
    title: 'Hypertension Management Plan',
    nutrition: 'DASH diet: reduce sodium to <2300mg/day, increase potassium-rich foods',
    exercise: '150 minutes of moderate aerobic activity per week',
    stressManagement: 'Stress reduction techniques, limit caffeine and alcohol',
    goals: 'Reduce blood pressure to <140/90 mmHg',
  },
  DIABETES: {
    id: 'diabetes',
    title: 'Diabetes Management Plan',
    nutrition: 'Control carbohydrate intake, monitor blood sugar, eat at regular intervals',
    exercise: '150 minutes of moderate aerobic activity per week with resistance training',
    stressManagement: 'Manage stress to prevent blood sugar spikes',
    goals: 'Maintain fasting glucose <126 mg/dL, HbA1c <7%',
  },
  INFECTION: {
    id: 'infection',
    title: 'Infection Management Plan',
    nutrition: 'Increase protein and vitamin C intake, stay hydrated',
    exercise: 'Rest and light activity until fever subsides',
    stressManagement: 'Adequate sleep and rest for immune recovery',
    goals: 'Reduce fever, support immune system recovery',
  },
  RESPIRATORY: {
    id: 'respiratory',
    title: 'Respiratory Support Plan',
    nutrition: 'Anti-inflammatory foods, adequate hydration',
    exercise: 'Breathing exercises, light activity as tolerated',
    stressManagement: 'Avoid respiratory irritants and stress',
    goals: 'Improve oxygen saturation to >95%',
  },
};

export function suggestWellnessPlan(vitals) {
  if (!vitals) {
    return WELLNESS_TEMPLATES.GENERAL;
  }

  const { bmi, systolicBP, diastolicBP, glucose, temperature, oxygenSaturation } = vitals;

  // Check conditions in priority order
  if (temperature && temperature > 38.5) {
    return WELLNESS_TEMPLATES.INFECTION;
  }

  if (oxygenSaturation && oxygenSaturation < 90) {
    return WELLNESS_TEMPLATES.RESPIRATORY;
  }

  if (bmi && bmi >= 30) {
    return WELLNESS_TEMPLATES.WEIGHT_MANAGEMENT;
  }

  if ((systolicBP && systolicBP >= 140) || (diastolicBP && diastolicBP >= 90)) {
    return WELLNESS_TEMPLATES.HYPERTENSION;
  }

  if (glucose && glucose >= 126) {
    return WELLNESS_TEMPLATES.DIABETES;
  }

  return WELLNESS_TEMPLATES.GENERAL;
}

export function getVitalsStatus(vitals) {
  if (!vitals) return null;

  const status = {
    bmi: getStatusColor(vitals.bmi, 18.5, 25, 30),
    bloodPressure: getStatusColor(vitals.systolicBP, 120, 140, 180),
    glucose: getStatusColor(vitals.glucose, 100, 126, 200),
    temperature: getStatusColor(vitals.temperature, 36.5, 37.5, 38.5),
    oxygenSaturation: getStatusColor(vitals.oxygenSaturation, 95, 90, 80, true), // inverted
    heartRate: getStatusColor(vitals.heartRate, 60, 100, 120),
  };

  return status;
}

function getStatusColor(value, normal, caution, critical, inverted = false) {
  if (value === null || value === undefined) return 'gray';

  if (inverted) {
    if (value >= normal) return 'green';
    if (value >= caution) return 'yellow';
    return 'red';
  } else {
    if (value <= normal) return 'green';
    if (value <= caution) return 'yellow';
    return 'red';
  }
}

export function formatVitalsForDisplay(vitals) {
  if (!vitals) return null;

  return {
    bloodPressure: vitals.systolicBP && vitals.diastolicBP 
      ? `${vitals.systolicBP}/${vitals.diastolicBP} mmHg`
      : 'N/A',
    heartRate: vitals.heartRate ? `${vitals.heartRate} bpm` : 'N/A',
    bmi: vitals.bmi ? vitals.bmi.toFixed(1) : 'N/A',
    glucose: vitals.glucose ? `${vitals.glucose} mg/dL` : 'N/A',
    temperature: vitals.temperature ? `${vitals.temperature}°C` : 'N/A',
    oxygenSaturation: vitals.oxygenSaturation ? `${vitals.oxygenSaturation}%` : 'N/A',
    recordedAt: vitals.recordedAt ? new Date(vitals.recordedAt).toLocaleString() : 'N/A',
  };
}
