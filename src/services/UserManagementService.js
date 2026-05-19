import api from "./api";

export const UserManagementService = {
  fetchUserList: async function () {
    return api.get('/user-accounts/list');
  },

  createUser: async function (companyId, employeeId, roleIds, email, passwordHash, isActive) {
    return api.post('/user-accounts/create', {
      companyId,
      employeeId,
      roleIds,          // backend reads List<Long> roleIds
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
      roleIds,          // backend REPLACES stored roleIds with this list
      email,
      passwordHash: passwordHash || null,   // null = don't change password
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
