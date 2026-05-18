import api from "./api";

export const ResourceRequestService = {
  fetchRequestList: async function () {
    return api.get('/resource-requests/list');
  },

  createRequest: async function (
    projectId,
    requesterUserId,
    numberOfResources,
    experienceRange,
    locationType,
    workMode,
    location,
    priority,
    skillIds
  ) {
    return api.post('/resource-requests/create', {
      projectId: projectId,
      requesterUserId: requesterUserId,
      numberOfResources: numberOfResources,
      experienceRange: experienceRange,
      locationType: locationType,
      workMode: workMode,
      location: location,
      priority: priority,
      skillIds: skillIds,
    });
  },

  actOnRequest: async function (requestIds, approverUserId, decision, comments) {
    return api.put('/resource-requests/hr/Decide', {
      requestIds: requestIds,
      approverUserId: approverUserId,
      decision: decision,
      comments: comments,
    });
  },

  hrActOnRequestGroup: async function (requestIds, approverUserId, decision, comments) {
    return api.put('/resource-requests/hr/DecideGroup', {
      requestIds: requestIds,
      approverUserId: approverUserId,
      decision: decision,
      comments: comments,
    });
  },

  deleteRequest: async function (id) {
    return api.delete(`/resource-requests/delete/${id}`);
  },
    fetchResourceRequestGroups: async function () {
    return api.get('/resource-requests/groups/list');
  },
};
