import api from "./api";

export const ClientService = {
  fetchClientList: async function () {
    try {
      const response = await api.get('/accounts/list');
      // Return only the array of clients
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
