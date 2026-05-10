import React, { useState } from 'react';

const WELLNESS_TEMPLATES = [
  {
    id: 'weight-loss',
    title: 'Weight Management Plan',
    nutritionRecommendations: 'Reduce calorie intake by 500 calories per day. Focus on whole foods, lean proteins, vegetables, and fruits. Avoid processed foods and sugary drinks. Eat 5-6 small meals throughout the day.',
    exerciseRecommendations: '30 minutes of moderate cardio 5 days per week (walking, jogging, cycling). Add strength training 2-3 times per week. Start slowly and gradually increase intensity.',
    stressManagementAdvice: 'Practice mindful eating. Get 7-8 hours of sleep. Try meditation or yoga for 10-15 minutes daily. Avoid emotional eating triggers.',
    goals: ['Lose 0.5-1kg per week', 'Exercise 5 times per week', 'Drink 8 glasses of water daily', 'Track food intake'],
    duration: 90,
  },
  {
    id: 'hypertension',
    title: 'Blood Pressure Control Plan',
    nutritionRecommendations: 'Follow DASH diet: low sodium (less than 2300mg/day), high potassium foods (bananas, spinach, sweet potatoes). Limit caffeine and alcohol. Increase fruits, vegetables, and whole grains.',
    exerciseRecommendations: '30 minutes of aerobic exercise daily (brisk walking, swimming). Avoid heavy weightlifting. Focus on consistency over intensity.',
    stressManagementAdvice: 'Practice deep breathing exercises 3 times daily. Reduce work stress through time management. Get adequate sleep (7-8 hours). Consider meditation or tai chi.',
    goals: ['Reduce BP to below 130/80', 'Exercise 30 min daily', 'Reduce sodium intake', 'Monitor BP twice daily'],
    duration: 60,
  },
  {
    id: 'diabetes-prevention',
    title: 'Diabetes Prevention Plan',
    nutritionRecommendations: 'Choose low glycemic index foods. Eat complex carbohydrates (whole grains, legumes). Include fiber-rich foods. Control portion sizes. Avoid sugary foods and refined carbs.',
    exerciseRecommendations: '150 minutes of moderate exercise per week. Mix cardio and resistance training. Take 10-minute walks after meals to control blood sugar.',
    stressManagementAdvice: 'Manage stress to prevent cortisol spikes. Practice relaxation techniques. Maintain regular sleep schedule. Stay socially connected.',
    goals: ['Reduce fasting glucose below 100 mg/dL', 'Lose 5-7% body weight', 'Exercise 150 min/week', 'Check glucose weekly'],
    duration: 90,
  },
  {
    id: 'general-wellness',
    title: 'General Wellness Plan',
    nutritionRecommendations: 'Balanced diet with variety of fruits, vegetables, whole grains, lean proteins. Stay hydrated with 8 glasses of water daily. Limit processed foods and added sugars.',
    exerciseRecommendations: 'Mix of cardio (3x/week) and strength training (2x/week). Include flexibility exercises. Aim for 150 minutes of moderate activity weekly.',
    stressManagementAdvice: 'Practice work-life balance. Engage in hobbies and social activities. Get 7-8 hours of quality sleep. Practice gratitude and positive thinking.',
    goals: ['Maintain healthy weight', 'Exercise regularly', 'Eat balanced meals', 'Annual health checkup'],
    duration: 30,
  },
  {
    id: 'stress-management',
    title: 'Stress Reduction Plan',
    nutritionRecommendations: 'Avoid caffeine and alcohol. Eat regular, balanced meals. Include omega-3 rich foods (fish, nuts). Limit sugar intake which can affect mood.',
    exerciseRecommendations: 'Gentle exercises like yoga, tai chi, or walking. 20-30 minutes daily. Focus on mind-body connection. Avoid high-intensity workouts if overly stressed.',
    stressManagementAdvice: 'Daily meditation (10-15 minutes). Deep breathing exercises. Journaling. Set boundaries at work. Seek social support. Consider professional counseling if needed.',
    goals: ['Practice daily meditation', 'Improve sleep quality', 'Reduce work hours', 'Engage in relaxing activities'],
    duration: 60,
  },
];

function WellnessPlanTemplates({ onSelectTemplate, onClose }) {
  const [selectedTemplate, setSelectedTemplate] = useState(null);

  const handleSelect = (template) => {
    setSelectedTemplate(template);
  };

  const handleApply = () => {
    if (selectedTemplate) {
      onSelectTemplate(selectedTemplate);
      if (onClose) onClose();
    }
  };

  return (
    <div className="wellness-templates-modal">
      <div className="modal-overlay" onClick={onClose}></div>
      <div className="modal-content">
        <div className="modal-header">
          <h3>📋 Wellness Plan Templates</h3>
          <button className="btn-close" onClick={onClose} type="button">✕</button>
        </div>

        <div className="modal-body">
          <p className="modal-instruction">Click on a template to select it, then click Apply</p>
          <div className="templates-grid">
            {WELLNESS_TEMPLATES.map((template) => (
              <div
                key={template.id}
                className={`template-card ${selectedTemplate?.id === template.id ? 'selected' : ''}`}
                onClick={() => handleSelect(template)}
                role="button"
                tabIndex={0}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    handleSelect(template);
                  }
                }}
              >
                <h4>{template.title}</h4>
                <p className="template-duration">Duration: {template.duration} days</p>
                <div className="template-preview">
                  <p><strong>🥗 Nutrition:</strong> {template.nutritionRecommendations.substring(0, 80)}...</p>
                  <p><strong>🏃 Exercise:</strong> {template.exerciseRecommendations.substring(0, 80)}...</p>
                  <p><strong>🧘 Stress:</strong> {template.stressManagementAdvice.substring(0, 80)}...</p>
                </div>
                {selectedTemplate?.id === template.id && (
                  <div className="selected-badge">✓ Selected</div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose} type="button">
            Cancel
          </button>
          <button
            className="btn btn-primary"
            onClick={handleApply}
            disabled={!selectedTemplate}
            type="button"
          >
            {selectedTemplate ? `Apply "${selectedTemplate.title}"` : 'Select a Template'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default WellnessPlanTemplates;
