import api from './api';
import { APIConfigurations } from '../constant/AuthPath'; // ADD THIS IMPORT

export const PortfolioReportService = {

    fetchDemandFlowList: async (from, to, size = 100) => {
        return api.get('/demands/DemandFlowList', {
            params: { size, from, to }
        });
    },

    fetchEmployeeFlows: async (page = 0, size = 10000) => {
        return api.get('/employeeFlows', { params: { page, size } });
    },

    fetchCandidateFlows: async (page = 0, size = 300) => {
        return api.get('/candidateFlows', { params: { page, size } });
    },

    searchPortfolioReport: async ({ companyId, clientId = null, demandId = null, fromDate, toDate,
        candidateSearch = '', interviewStatus = 'ALL', demandStatus = 'ALL', page = 0, size = 10 }) => {
        return api.post('/portfolio-manager/employee-report/search', {
            companyId, clientId, demandId, fromDate, toDate,
            candidateSearch, interviewStatus, demandStatus, page, size
        });
    },


    exportDemandReport: async (payload) => {
    return api.post('/demands/exportDetailedReport', payload, {
        responseType: 'blob',
        timeout: 30000
    });
},
    // ── NEW: email report, same as dashboard ──
    generateEmailReport: async (payload) => {
        const response = await api.post('/demands/generateEmail', payload);
        return response.data;
    },
};