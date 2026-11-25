// CandidateService.js
import api from './api';

export const CandidateService = {
    fetchCandidateList: async () => {
        return api.get('/candidates/list');
    },
    getCandidateById: async (id) => {
        return api.get(`/candidates/${id}`);
    },
    fetchCandidateFlows: async (page = 0, size = 300) => {
        return api.get(`/candidateFlows?page=${page}&size=${size}`);
    },
    createCandidate: async (formData) => {
        return api.post('/candidates/create', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
    },
    // CandidateService.js
    // REPLACE ONLY THIS FUNCTION in CandidateService.js
    updateCandidate: async (formData) => {
        // DO NOT set Content-Type — this was causing "Unsupported Media Type"
        return api.put('/candidates/update', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
    },
    updateStatus: async (id, status) => {
        return api.patch(`/candidates/${id}/status?status=${encodeURIComponent(status)}`);
    },
    fetchCompanies: async () => {
        // Assuming same endpoint as employees or adjust if different
        return api.get('/companies/list');
    },
    fetchSkills: async () => {
        // Assuming same endpoint as employees or adjust if different
        return api.get('/skills/list');
    },
    createSkill: async (companyId, skillName) => {
        // Assuming same endpoint as employees
        return api.post('/skills/create', { companyId, skillName });
    },
    shareResume: async (candidateId, status, actionByUserId, ids, type) => {
        const payload = {
            candidateId: parseInt(candidateId),
            status: status,
            actionByUserId: parseInt(actionByUserId)
        };

        // Add the appropriate IDs based on type
        if (type === 'opportunity') {
            payload.groupIds = ids;
        } else {
            payload.demandIds = ids;
        }

        return api.post('/candidates/share-resume', payload);
    },
    deleteShare: async (candidateId, demandId, groupId, type = 'demand') => {
        const params = new URLSearchParams({ candidateId: String(candidateId), type });
        if (demandId) params.append('demandId', String(demandId));
        if (groupId) params.append('groupId', String(groupId));
        return api.delete(`/candidates/delete-share?${params.toString()}`);
    },
    viewResume: async function (id) {
        return api.get(`/candidates/${id}/viewResume`, { responseType: 'blob' });
    },
    importExcel: async (formData) => {
        return api.post('/candidates/importExcel', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
    },
    downloadImportTemplate: async (companyId) => {
        const qs = companyId ? `?companyId=${encodeURIComponent(companyId)}` : '';
        return api.get(`/candidates/import-template${qs}`, { responseType: 'blob' });
    }

};