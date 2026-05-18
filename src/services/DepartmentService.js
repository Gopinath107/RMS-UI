import api from "./api";

export const DepartmentService = {
 
  fetchDepartmentList: async function () {
    return api.get('/departments/list');
  },

  createDepartment: async function (companyId, departmentName) {
    return api.post('/departments/create', {
      companyId: companyId,
      departmentName: departmentName,
    });
  },

  
  updateDepartment: async function (id, companyId, departmentName, parentDepartmentId = null) {
    return api.put(`/departments/Update/${id}`, {
      companyId: companyId,
      departmentName: departmentName,
      parentDepartmentId: parentDepartmentId
    });
  },

  // DELETE /departments/delete/{id} -> delete a department
  deleteDepartment: async function (id) {
    return api.delete(`/departments/delete/${id}`);
  },

  // GET /departments/{id} -> fetch a single department by ID
  fetchDepartmentById: async function (id) {
    return api.get(`/departments/${id}`);
  },
};
