
import api from "./api";

export const RoleService = {
  fetchRoleList: async function () {
    return api.get('/roles/list');
  },

  createRole: async function (companyId, roleName) {
    return api.post('/roles/create', {
      companyId: companyId,
      roleName: roleName
    });
  },

  updateRole: async function (id) {
    return api.put(`/roles/Update/${id}`, {
           
    });
  },
  deleteRole: async function (id) {
    return api.delete(`/roles/delete/${id}`);
  },
};
