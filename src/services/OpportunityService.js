// Updated OpportunityService.js
import api from "./api";
import { APIConfigurations } from '../constant/AuthPath';

export const OpportunityService = {
  createBulkOpportunityRequests: async function (
    projectId,
    requesterUserId,
    count,
    experienceRange,
    locationType,
    workMode,
    location,
    priority,
    primarySkillIds,
    secondarySkillIds,
    groupTitle,
    autoSubmit = true
  ) {
    const currentDate = new Date().toISOString().split("T")[0]; // Format as YYYY-MM-DD

    return api.post('/resource-requests/bulk-create', {
      projectId: projectId,
      requesterUserId: requesterUserId,
      count: count,
      experienceRange: experienceRange || null,
      locationType: locationType || null,
      workMode: workMode || null,
      location: location || null,
      priority: priority || null,
      primarySkillIds: primarySkillIds || [],
      secondarySkillIds: secondarySkillIds || [],
      autoSubmit: autoSubmit,
      groupTitle: groupTitle || null,
    });
  },

  fetchResourceRequestGroups: async function () {
    return api.get('/resource-requests/groups/list');
  },

  approveResourceRequest: async function (groupId, comments, approverUserId,token = null) {
    if (!groupId) {
      throw new Error("Invalid or missing groupId");
    }

    const url = `/resource-requests/hr/DecideGroup`;
    const config = APIConfigurations.getConfig(token);

    const payload = {
      groupId: groupId,
      approverUserId: approverUserId,
      decision: "Approved",
      comments: comments || "Approved by hr",
    };

    console.log("Approving opportunity request with payload:", payload, "Config:", config);

    try {
      const response = await api.put(url, payload, config); // Changed to PUT
      console.log("Approve API response:", response.data);
      return response;
    } catch (error) {
      console.error("Approve API error:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        headers: error.response?.headers,
      });
      throw error;
    }
  },

  rejectResourceRequest: async function (groupId, rejectionReason, approverUserId,token = null) {
    if (!groupId) {
      throw new Error("Invalid or missing groupId");
    }
    if (!rejectionReason || typeof rejectionReason !== "string" || rejectionReason.trim() === "") {
      throw new Error("Invalid or missing rejection reason");
    }

    const url = `/resource-requests/hr/DecideGroup`;
    const config = APIConfigurations.getConfig(token);

    const payload = {
      groupId: groupId,
      approverUserId: approverUserId,
      decision: "Rejected",
      comments: rejectionReason || "Rejected by hr",
    };

    console.log("Rejecting opportunity request with payload:", payload, "Config:", config);

    try {
      const response = await api.put(url, payload, config); // Changed to PUT
      console.log("Reject API response:", response.data);
      return response;
    } catch (error) {
      console.error("Reject API error:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        headers: error.response?.headers,
      });
      throw error;
    }
  },
    fetchGroupFlowList: async function (companyId, fromDate = null, toDate = null, accountId = null, page = 0, size = 200, token = null) {
    let url = `/resource-requests/GroupFlowList?companyId=${companyId}&page=${page}&size=${size}`;
    if (accountId) url += `&accountId=${accountId}`;
    if (fromDate) url += `&fromDate=${fromDate}`;
    if (toDate) url += `&toDate=${toDate}`;
    const config = APIConfigurations.getConfig(token);
    return api.get(url, config);
  },
};
