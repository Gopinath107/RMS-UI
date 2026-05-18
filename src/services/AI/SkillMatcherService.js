// src/services/SkillMatcherService.js
import axios from 'axios'; // Assuming axios is used in other services

export const SkillMatcherService = {
    async matchSkills() {
        try {
            const response = await axios.post('http://localhost:8087/match');
            return response.data.response;
        } catch (error) {
            throw new Error('Failed to fetch skill matches: ' + (error.response?.data?.message || error.message));
        }
    },
async fetchGroupMatches(groupIds = [1]) {
    try {
      const { data } = await axios.post("http://localhost:8087/match", {
        group_ids: groupIds,
      });
      return data.response;               // <-- array of opportunities
    } catch (error) {
      const msg = error.response?.data?.message || error.message;
      throw new Error("Failed to fetch group skill matches: " + msg);
    }
  },

};
