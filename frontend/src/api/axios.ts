import axios from 'axios';
import { useAuthStore } from '@/store';
import { getApiConfig } from '@/config/api';

// Create axios instance for API server
export const apiClient = axios.create({
  baseURL: getApiConfig().api.baseUrl,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  config => {
    const authStore = useAuthStore();
    const token = authStore.token;

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  error => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle auth errors
apiClient.interceptors.response.use(
  response => {
    return response;
  },
  error => {
    const authStore = useAuthStore();

    // If token is expired or invalid, logout user
    if (error.response?.status === 401 || error.response?.status === 403) {
      // Only logout if we had a token to begin with
      if (authStore.token) {
        authStore.clearUser();
        // Redirect to login page
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;
