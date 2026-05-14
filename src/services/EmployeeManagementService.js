import api from "./api";

export const EmployeeService = {
  
  fetchEmployeeList: async function () {
    return api.get('/employees/list');
  },

  createEmployee: async function (formData) {
    return api.post('/employees/create', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
  },

// EmployeeManagementService.js
// REPLACE ONLY THIS FUNCTION in EmployeeManagementService.js
updateEmployee: async function (formData) {
  // DO NOT set Content-Type header manually when using FormData
  // Let browser set the correct boundary
  return api.put('/employees/Update', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    }
  );
},
  
  
  deleteEmployee: async function (id) {
    return api.delete(`/employees/${id}`);
  },

  fetchCompanies: async function () {
    return api.get('/companies/list');
  },

  fetchDepartments: async function () {
    return api.get('/departments/list');
  },

  fetchSkills: async function () {
    return api.get('/skills/list');
  },

  createSkill: async function (companyId, name) {
    return api.post('/skills/create', {
      companyId: companyId,
      skillName: name
    });
  },

  exportEmployeeData: async function (format, companyId) {
    return api.get(`/employees/export?format=${format}&companyId=${companyId}`, { responseType: 'blob' });
  },

    // Get employee by ID
  getEmployeeById: async function (id) {
    return api.get(`/employees/list?id=${id}`);
  },

  fetchEmployeeFlows: async function (page = 0, size = 10000, fromDate, toDate) {
    let url = `/employeeFlows?page=${page}&size=${size}`;
    if (fromDate) url += `&fromDate=${fromDate}`;
    if (toDate) url += `&toDate=${toDate}`;
    return api.get(url);
  },
  viewResume: async function (id) {
  return api.get(`/employees/${id}/viewResume`, { responseType: 'blob' });
},
importExcel: async function (formData) {
  return api.post('/employees/importExcel', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
},
  shareResume: async function (employeeId, status, actionByUserId, ids, type = 'opportunity') {
  const payload = {
    employeeId,
    status,
    actionByUserId
  };

  // Add the appropriate IDs field based on type
  if (type === 'opportunity') {
    payload.groupIds = ids;
  } else {
    payload.demandIds = ids;
  }

  return api.post('/employees/share-resume', payload);
},

  /**
   * Parse a resume file and extract structured candidate data.
   * Accepts PDF, DOC, or DOCX files (max 5MB).
   * Uses Apache Tika (text extraction) + LLM (field parsing) on the backend.
   * @param {File} file - The resume file to parse
   */
  parseResume: async function (file) {
    const formData = new FormData();
    formData.append('resume', file);
    return api.post('/resume/parse', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 60000, // LLM can take up to 60s
    });
  },
};
