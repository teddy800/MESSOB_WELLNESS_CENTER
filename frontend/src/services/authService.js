import api from './api';

const TOKEN_KEY = 'mesob_auth_token';

export const authService = {
  // Login user
  async login(email, password) {
    const response = await api.post('/auth/login', { email, password });
    const { token, user } = response.data.data;
    
    // Store token in localStorage
    localStorage.setItem(TOKEN_KEY, token);
    
    // Set token in axios default headers
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    
    return { token, user };
  },

  // Register user
  async register(userData) {
    const response = await api.post('/auth/register', userData);
    const { token, user } = response.data.data;
    
    localStorage.setItem(TOKEN_KEY, token);
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    
    return { token, user };
  },

  // Get current user
  async getCurrentUser() {
    const response = await api.get('/auth/me');
    return response.data.data.user;
  },

  // Logout user
  logout() {
    localStorage.removeItem(TOKEN_KEY);
    delete api.defaults.headers.common['Authorization'];
  },

  // Get stored token
  getToken() {
    return localStorage.getItem(TOKEN_KEY);
  },

  // Check if user is authenticated
  isAuthenticated() {
    return !!this.getToken();
  },

  // Set token in axios headers (for page refresh)
  setAuthHeader() {
    const token = this.getToken();
    if (token) {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
  },
};

// Set auth header on app load
authService.setAuthHeader();
