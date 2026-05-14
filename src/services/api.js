import axios from 'axios';
import { APIConfigurations } from '../constant/AuthPath';
import { logout } from '../utils/authUtils';

// Create axios instance with HTTPS-ready configuration
const api = axios.create({
  baseURL: APIConfigurations.rootURL,
  headers: {
    'Content-Type': 'application/json',
  },
  // Enable credentials (cookies, authorization headers, TLS client certificates)
  withCredentials: true,
  // Timeout for requests (30 seconds)
  timeout: 30000,
  // Validate status codes
  validateStatus: (status) => status >= 200 && status < 500,
});


api.interceptors.request.use(
  (config) => {
    
    const token = localStorage.getItem('token');
    
    if (token) {
      
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    
    return Promise.reject(error);
  }
);


api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response) {
      const { status } = error.response;
      
      if (status === 401) {
        console.error('Authentication failed: Token expired or invalid');
        logout();
      }
      
      if (status === 403) {
        console.error('Access denied: Insufficient permissions');
      }
    }
    
    return Promise.reject(error);
  }
);

export default api;
