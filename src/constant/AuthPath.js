
const isDevelopment = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
const isAWS = window.location.hostname === '98.130.57.74';

export const APIConfigurations = {
 
  rootURL: isDevelopment
    ? "http://localhost:8081/api"        // Direct to backend in dev (CORS allowed)
    : isAWS
    ? "http://98.130.57.74:8081/api"    // AWS backend URL
    : "/api",                            // Relative URL — Nginx proxy in prod
  

  
  getConfig: function (token = null) {
    const headers = {
      "Content-Type": "application/json",
    };
    
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
    return { headers };
  },
  
  // Helper to check if running in secure context
  isSecure: function() {
    return window.location.protocol === 'https:';
  },
  
  // Get full base URL
  getFullURL: function() {
    if (isDevelopment) {
      return this.rootURL;
    }
    return `${window.location.protocol}//${window.location.host}/api`;
  }
};
