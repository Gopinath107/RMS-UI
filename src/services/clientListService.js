import api from "./api";

export const ClientService = {
  fetchClientList: async function (page = null, size = null, q = "", industry = "") {
    try {
      const baseParams = {};
      if (q !== "") baseParams.q = q;
      if (industry !== "" && industry !== "All Industries") baseParams.industry = industry;

      // When pagination arguments are explicitly supplied, return the single-page response object
      // so callers can read both result rows and totalElements/totalPages.
      if (page !== null || size !== null) {
        const params = { ...baseParams };
        if (page !== null) params.page = page;
        if (size !== null) params.size = size;
        return await api.get('/accounts/list', { params });
      }

      // Otherwise fetch every page so dropdowns and selectors receive all available clients.
      const pageSize = 1000;
      const allClients = [];
      let currentPage = 0;
      let totalPages = 1;

      while (currentPage < totalPages) {
        const response = await api.get('/accounts/list', {
          params: { ...baseParams, page: currentPage, size: pageSize },
        });
        const rows = Array.isArray(response.data?.result) ? response.data.result : [];
        allClients.push(...rows);

        const reportedTotalPages = Number(response.data?.totalPages);
        if (Number.isFinite(reportedTotalPages) && reportedTotalPages > 0) {
          totalPages = reportedTotalPages;
        } else if (rows.length < pageSize) {
          break;
        }
        currentPage += 1;
      }

      return allClients;
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
