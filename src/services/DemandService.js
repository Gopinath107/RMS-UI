// New file: src/services/DemandService.js (assuming standard project structure)
import api from './api';
import { APIConfigurations } from '../constant/AuthPath';

export const DemandService = {
  create: async (payload) => {
    return api.post('/demands/create', payload);
  },
  update: async (demandId, payload) => {
  return api.put(`/demands/${demandId}`, payload);
},
  fetchDemandList: async () => {
  try {
    const response = await api.get('/demands/list?size=1000 ');
    return response;
  } catch (error) {
    console.error("Error fetching demands:", error);
    throw error;
  }
},
    fetchCompanies: async function () {
    return api.get('/companies/list');
  },
    fetchClientList: async function () {
    try {
      const response = await api.get('/accounts/list?size=300');
      // Return only the array of clients
      return response.data.result;
    } catch (error) {
      console.error("Error fetching clients:", error);
      throw error;
    }
  },
  // NEW: Create Account
  createAccount: async (payload) => {
    return api.post('/accounts/create', payload);
  },
    fetchDepartments: async function () {
    return api.get('/departments/list');
  },
createDepartment: async (payload) => {
    // payload must be: { companyId: number, departmentName: string }
    return api.post('/departments/create', payload);
  },

   // NEW: Fetch Demand Flow List (separate from regular demand list)
  fetchDemandFlowList: async function (from = null, to = null) {
    try {
      const params = {};
      if (from) params.from = from;
      if (to) params.to = to;

      const response = await api.get('/demands/DemandFlowList?size=100',
        { params }
      );
      return response.data.result || response.data;   // array of demand objects
    } catch (error) {
      console.error("Error fetching demand flow list:", error);
      throw error;
    }
  },
  generateEmailReport: async function (payload) {
    try {
      const response = await api.post('/demands/generateEmail', payload);
      return response.data;
    } catch (error) {
      console.error("Error generating email report:", error);
      throw error;
    }
  },
    getSkillMatches: async function (demandId) {
    try {
      const response = await api.get(`/demands/${demandId}/matches`);
      return response;
    } catch (error) {
      console.error("Error fetching skill matches:", error);
      throw error;
    }
  },
    exportDemandReport: async function (payload) {
  try {
    console.log("Making export request with payload:", payload);
    
    const response = await api.post(
      `/demands/exportReport`,
      payload,
      {
        ...APIConfigurations.getConfig(),
        responseType: 'blob',
        timeout: 30000
      }
    );
    
    console.log("Export response received:", {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
      dataSize: response.data?.size
    });
    
    return response;
  } catch (error) {
    console.error("Error in exportDemandReport:", {
      message: error.message,
      response: error.response,
      request: error.request
    });
    throw error;
    }
  },

  /**
   * Fetches only real (resume-linked) resource requests for a demand.
   * Used by:
   *  - Demand Details modal (Required vs Submitted counts)
   *  - Schedule Interview modal (RR dropdown filtered by demand)
   * Returns: array of ResourceRequestDto with employeeId/candidateId/candidateName/resourceType
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
