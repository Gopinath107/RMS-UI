// src/services/InterviewManagementService.js
import api from "./api";

export const InterviewService = {
  fetchInterviewList: async function () {
    return api.get('/interviews/list');
  },

  createInterview: async function (
    requestId,
    employeeId,     // For internal resources
    candidateId,    // For external resources
    interviewerUserId,
    interviewLevels,
    levels
  ) {
    const payload = {
      requestId,
      interviewLevels,
      levels,
      interviewerUserId
    };

    // Add either employeeId or candidateId (not both)
    if (employeeId) {
      payload.employeeId = employeeId;
    } else if (candidateId) {
      payload.candidateId = candidateId;
    }

    return api.post('/interviews/create', payload);
  },

// ────── NEW: BATCH (Demand) ──────
  createBatchInterview: async function (
    requestId,
    employeeId,     // For internal resources
    candidateId,    // For external resources
    createdByUserId,
    interviewLevels,
    levels
  ) {
    const payload = {
      requestId,
      createdByUserId,
      interviewLevels,
      levels
    };

    // Add either employeeId or candidateId (not both)
    if (employeeId) {
      payload.employeeId = employeeId;
    } else if (candidateId) {
      payload.candidateId = candidateId;
    }

    return api.post('/interviews/batch', payload);
  },

  updateInterview: async function (
    interviewId,
    requestId,
    interviewerUserId,
    interviewLevels,
    levels
  ) {
    return api.put('/interviews/Update', {
      interviewId,
      requestId,
      interviewerUserId,
      interviewLevels,
      levels
    });
  },

  deleteInterview: async function (interviewId) {
    return api.delete('/interviews/delete', {
      data: { interviewId }
    });
  },

  // NEW: Update onboarding status
  updateOnboardingStatus: async function (interviewId, status, notes = '') {
    return api.put('/interviews/onboarding', {
      interviewID: interviewId,
      status,
      notes
    });
  },

  // NEW: Fetch onboarding statuses with ?category=ONBOARDING
  fetchOnboardingStatuses: async function () {
    return api.get('/interviews/meta/statuses', {
      params: { category: 'ONBOARDING' }
    });
  },

  // NEW: Fetch interview statuses with ?category=INTERVIEW
  fetchInterviewStatuses: async function () {
    return api.get(`/interviews/meta/statuses`, {
      params: { category: 'INTERVIEW' }
    });
  },

  levelsComplete: async function (
    interviewId,
    requestId,
    levels,
    status,
    interviewerUserId,
    feedback
  ) {
    return api.put(`/interviews/LevelsComplete`, {
      interviewId,
      requestId,
      levels,
      status,
      interviewerUserId,
      feedback
    });
  },

noShow: async function (interviewId, requestId, who, levels, feedback) {
  return api.put(`/interviews/NoShow`, {
    interviewId,
    requestId,
    who,
    levels,
    feedback
  });
},

  cancel: async function (interviewId, requestId, reason) {
    return api.put(`/interviews/Cancel`, {
      interviewId,
      requestId,
      reason
    });
  },

  /**
   * Fetch real (resume-linked) resource requests for a demand.
   * Used by Schedule Interview modal: Demand → Resource Request dropdown chain.
   * Returns: array of { requestId, candidateName, resourceType, employeeId, candidateId, status, ... }
   */
  getResourceRequestsByDemand: async function (demandId) {
    try {
      const response = await api.get(`/resource-requests/by-demand/${demandId}`);
      return response.data.result || [];
    } catch (error) {
      console.error('Error fetching resource requests by demand:', error);
      throw error;
    }
  },
};
