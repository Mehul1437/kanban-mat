import axios from 'axios';
import useUserStore from '../store/userStore';

const api = axios.create({
  baseURL: 'http://localhost:5000/api',
});

// Add request interceptor
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Add response interceptor for better error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
    if (error.response?.status === 401) {
      // Clear both token and user data
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // Use window.location for a hard redirect
      window.location.href = '/auth';
    }
    return Promise.reject(error);
  }
);

export default api; 