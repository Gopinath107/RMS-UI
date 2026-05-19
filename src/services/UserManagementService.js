import api from "./api";

export const UserManagementService = {
  fetchUserList: async function () {
    return api.get('/user-accounts/list');
  },

  createUser: async function (companyId, employeeId, roleIds, email, passwordHash, isActive) {
    return api.post('/user-accounts/create', {
      companyId,
      employeeId,
      roleIds,           // send the full array — backend reads roleIds list
      email,
      passwordHash,
      isActive
    });
  },

  updateUser: async function (id, companyId, employeeId, roleIds, email, passwordHash, isActive) {
    return api.put('/user-accounts/update', {
      userId: id,
      companyId,
      employeeId,
      roleIds,           // send the full array — backend REPLACES stored roleIds
      email,
      passwordHash,
      isActive
    });
  },

  deleteUser: async function (id) {
    return api.delete('/user-accounts/delete', {
      data: { userId: id }
    });
  },

  fetchUserById: async function (id) {
    return api.get(`/user-accounts/${id}`);
  },
};
