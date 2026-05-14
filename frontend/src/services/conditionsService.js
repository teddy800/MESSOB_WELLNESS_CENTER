import api from './api';

/**
 * Fetch patient conditions by patient ID
 * @param {string} patientId - Patient user ID
 * @returns {Promise<Array<string>>} Array of condition strings
 */
export async function fetchPatientConditions(patientId) {
  try {
    const response = await api.get(`/api/v1/conditions/${patientId}`);
    return response.data.data.conditions || [];
  } catch (error) {
    console.error('Failed to fetch patient conditions:', error);
    return [];
  }
}

/**
 * Update patient conditions
 * @param {string} patientId - Patient user ID
 * @param {Array<string>} conditions - Array of condition strings
 * @param {boolean} isNurseApproved - Whether conditions are nurse-approved
 * @returns {Promise<Object>} Updated conditions data
 */
export async function updatePatientConditions(patientId, conditions, isNurseApproved = true) {
  const response = await api.put(`/api/v1/conditions/${patientId}`, {
    conditions,
    isNurseApproved,
  });
  return response.data.data;
}
