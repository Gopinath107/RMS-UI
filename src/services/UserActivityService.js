import api from './api';

export const UserActivityService = {
  // ── Tracking (background) ──────────────────────────────────────────
  trackEvent: async (eventData) => api.post('/user-activity/track', eventData),
  trackBatchEvents: async (events) => api.post('/user-activity/track-batch', events),

  // ── Legacy endpoints (backward compat) ─────────────────────────────
  getActivitySummary: async (filters) => api.get('/user-activity/summary', { params: filters }),
  getDashboardStats: async (date) => api.get('/user-activity/dashboard-stats', { params: { date } }),
  getUserActivityDetail: async (userId, sessionId) => api.get(`/user-activity/detail/${userId}`, { params: { sessionId } }),

  // ── Analytics endpoints ────────────────────────────────────────────
  getRealtime: async () => api.get('/user-activity/realtime'),
  getOverview: async (from, to, granularity = 'hourly') => api.get('/user-activity/overview', { params: { from, to, granularity } }),
  getModuleUsage: async (from, to) => api.get('/user-activity/module-usage', { params: { from, to } }),
  getScreenUsage: async (from, to, module) => api.get('/user-activity/screen-usage', { params: { from, to, module } }),
  getSessions: async (filters) => api.get('/user-activity/sessions', { params: filters }),
  getSessionTimeline: async (sessionId) => api.get(`/user-activity/session-detail/${sessionId}`),
  exportCsv: async (filters) => api.get('/user-activity/export', { params: filters, responseType: 'blob' }),
};
