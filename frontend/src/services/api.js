import axios from 'axios';

const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL,
  timeout: 10000,
});

// Request interceptor to add token to every request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('mesob_auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle 401 errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token is invalid or expired
      const currentPath = window.location.pathname;
      
      // Don't redirect if already on login page or if it's a login request
      if (!currentPath.includes('/login') && !error.config.url.includes('/auth/login')) {
        console.log('Token expired or invalid, clearing auth data');
        localStorage.removeItem('mesob_auth_token');
        delete api.defaults.headers.common['Authorization'];
        
        // Redirect to login page
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
