// src/services/api.js
// Centralized Axios instance with auth + error interceptors.
import axios from 'axios';
import { APIConfigurations } from '../constant/AuthPath';

/** Clear all auth keys from localStorage. */
function clearAuthStorage() {
  [
    'token', 'user', 'employeeName', 'roleName', 'companyName',
    'userId', 'companyId', 'employeeId', 'roleId',
    'isAuthenticated', 'userRole', 'userName',
  ].forEach(k => localStorage.removeItem(k));
}

// Create a single axios instance
const api = axios.create({
  baseURL: APIConfigurations.rootURL,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
  timeout: 30000,
  // Accept both 2xx and 4xx so our code can handle 4xx errors gracefully
  validateStatus: status => status >= 200 && status < 500,
});

// ── Request interceptor: attach JWT ───────────────────────────────────────────
api.interceptors.request.use(
  config => {
    const token = localStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  error => Promise.reject(error),
);

// ── Response interceptor: handle 401/403 ───────────────────────────────────────
api.interceptors.response.use(
  response => {
    // 401 within validateStatus range: session expired
    if (response.status === 401) {
      console.warn('[api] 401 Unauthorized — clearing session');
      clearAuthStorage();
      window.location.href = '/login';
    }
    // 403 within validateStatus range: log access denied
    if (response.status === 403) {
      console.warn('[api] 403 Forbidden — insufficient permissions for:', response.config?.url);
    }
    return response;
  },
  error => {
    // Network errors, timeouts, etc.
    if (error.response) {
      const { status } = error.response;
      if (status === 401) {
        console.error('[api] 401 — token expired or invalid');
        clearAuthStorage();
        window.location.href = '/login';
      }
      if (status === 403) {
        console.error('[api] 403 — access denied');
      }
    } else {
      console.error('[api] Network error:', error.message);
    }
    return Promise.reject(error);
  },
);

export default api;
