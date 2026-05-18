import api from "./api";

export const UserManagementService = {
  fetchUserList: async function () {
    return api.get('/user-accounts/list');
  },

  createUser: async function (companyId, employeeId, roleId, email, passwordHash, isActive) {
    return api.post('/user-accounts/create', {
      companyId,
      employeeId,
      roleId,
      email,
      passwordHash,
      isActive
    });
  },

  updateUser: async function (id, companyId, employeeId, roleId, email, passwordHash, isActive) {
    return api.put('/user-accounts/update', {
      userId: id,
      companyId,
      employeeId,
      roleId,
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
