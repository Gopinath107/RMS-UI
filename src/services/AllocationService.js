
import api from "./api";

export const AllocationService = {

  fetchAllocationList: async function () {
    return api.get('/allocations/list');
  },

  
createAllocation: async function (projectId, employeeId, requestId, isBillable, startDate, endDate, candidateId, projectRole) {
  const payload = {
    projectId: projectId,
    requestId: requestId,
    isBillable: isBillable,
    startDate: startDate,
    endDate: endDate,
  };
  
  // Add employeeId only if provided and not null
  if (employeeId) {
    payload.employeeId = employeeId;
  }
  
  // Add candidateId only if provided and not null
  if (candidateId) {
    payload.candidateId = candidateId;
  }
  
  // Add projectRole if provided
  if (projectRole) {
    payload.projectRole = projectRole;
  }
  
  return api.post('/allocations/create', payload);
},


  getAllocationById: async function (id) {
    return api.get(`/allocations/${id}`);
  },

  updateAllocation: async function (id, payload) {
    return api.put(`/allocations/update/${id}`, payload);
  },

  // DELETE /allocations/{id} -> delete allocation
  deleteAllocation: async function (id) {
    return api.delete(`/allocations/delete/${id}`);
  },
};
