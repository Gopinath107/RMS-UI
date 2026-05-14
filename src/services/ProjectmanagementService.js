
import api from "./api";

export const ProjectService = {
  fetchProjectList: async function () {
    return api.get('/projects/list');
  },

  createProject: async function (
    companyId,
    accountId,
    managerUserId,
    projectName,
    description,
    startDate,
    endDate,
    budget,
    revenueAmount,
    priority,
    status,
    skillIds
  ) {
    return api.post('/projects/create', {
      companyId: companyId,
      accountId: accountId,
      managerUserId: managerUserId,
      projectName: projectName,
      description: description,
      startDate: startDate,
      endDate: endDate,
      budget: budget,
      revenueAmount: revenueAmount,
      priority: priority,
      status: status,
      skillIds: skillIds
    });
  },

  updateProject: async function (
    id,
    companyId,
    accountId,
    managerUserId,
    projectName,
    description,
    startDate,
    endDate,
    budget,
    revenueAmount,
    priority,
    status,
    skillIds
  ) {
    return api.put('/projects/Update', {
      projectId: id,
      companyId: companyId,
      accountId: accountId,
      managerUserId: managerUserId,
      projectName: projectName,
      description: description,
      startDate: startDate,
      endDate: endDate,
      budget: budget,
      revenueAmount: revenueAmount,
      priority: priority,
      status: status,
      skillIds: skillIds
    });
  },

  deleteProject: async function (id) {
    return api.delete('/projects/delete', {
      data: { projectId: id }
    });
  },
};
