import api from "./api";

export const CompanyService = {
  
  fetchCompanyList: async function () {
    return api.get('/companies/list');
  },

  createCompany: async function (companyName, companyEmail, address) {
    return api.post('/companies/create', {
      companyName: companyName,
      companyEmail: companyEmail,
      address: address
    });
  },

  updateCompany: async function (id, companyName, companyEmail, address) {
    return api.put(`/companies/update/${id}`, {
      companyName: companyName,
      companyEmail: companyEmail,
      address: address
    });
  },

 
  deleteCompany: async function (id) {
    return api.delete(`/companies/delete/${id}`);
  },

  
  fetchCompanyById: async function (id) {
    return api.get(`/companies/${id}`);
  },
};
