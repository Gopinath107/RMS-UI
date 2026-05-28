
import api from "./api";

export const RoleService = {
  fetchRoleList: async function (companyId) {
    const url = companyId ? `/roles/list?companyId=${companyId}` : '/roles/list';
    return api.get(url);
  },

  createRole: async function (companyId, roleName) {
    return api.post('/roles/create', {
      companyId: companyId,
      roleName: roleName
    });
  },

  updateRole: async function (id, companyId, roleName) {
    return api.put(`/roles/Update/${id}`, {
      companyId: companyId,
      roleName: roleName
    });
  },
  deleteRole: async function (id) {
    return api.delete(`/roles/delete/${id}`);
  },
};
