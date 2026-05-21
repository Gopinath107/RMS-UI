import api from "./api";

export const ClientService = {
  fetchClientList: async function (page = null, size = null, q = "", industry = "") {
    try {
      const params = {};
      if (page !== null) params.page = page;
      if (size !== null) params.size = size;
      if (q !== "") params.q = q;
      if (industry !== "" && industry !== "All Industries") params.industry = industry;

      const response = await api.get('/accounts/list', { params });
      
      // If pagination parameters are provided, return the full response object
      // so the caller can read both the content array and the total elements count.
      if (page !== null || size !== null) {
        return response;
      }
      // Return only the array of clients for backward compatibility
      return response.data.result;
    } catch (error) {
      console.error("Error fetching clients:", error);
      throw error;
    }
  },

  createClient: async function (
    companyId,
    AccountName,
    Industry,
    personName,
    email,
    relationshipStartDate,
    Status
  ) {
    try {
      const response = await api.post('/accounts/create', {
        companyId: companyId,
        accountName: AccountName,
        industry: Industry,
        contactPersonName: personName,
        contactPersonEmail: email,
        relationshipStartDate: relationshipStartDate,
        status: Status,
      });
      return response.data;
    } catch (error) {
      console.error("Error creating client:", error);
      throw error;
    }
  },

  getClientById: async function (id) {
    return api.get(`/accounts/${id}`);
  },

  updateClient: async function (id, payload) {
    return api.put(`/accounts/update/${id}`, payload);
  },

  deleteClient: async function (id) {
    return api.delete(`/accounts/${id}`);
  },
};
