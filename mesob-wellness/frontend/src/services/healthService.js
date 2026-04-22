import api from './api';

export async function fetchHealth() {
  const response = await api.get('/api/health');
  return response.data;
}
