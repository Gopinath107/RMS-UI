import api from "./api";

export const SkillService = {
  
  fetchSkillList: async function () {
    return api.get('/skills/list');
  },

 
  createSkill: async function (companyId, name) {
    return api.post('/skills/create', {
      companyId: companyId,
      skillName: name
    });
  },
  
  
  updateSkill: async function (id, companyId, name) {
    return api.put(`/skills/update/${id}`, {
      companyId: companyId,
      name: name
    });
  },

  
  deleteSkill: async function (id) {
    return api.delete(`/skills/delete/${id}`);
  },

  
  fetchSkillById: async function (id) {
    return api.get(`/skills/${id}`);
  },
};
