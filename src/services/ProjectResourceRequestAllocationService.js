import api from "./api";

export const createAllocation = async (allocationData) => {
  try {
    const response = await api.post('/allocations/create', allocationData);
    return response.data;
  } catch (error) {
    console.error('Error creating allocation:', error);
    throw error;
  }
};

export const fetchAllocationList = async () => {
  try {
    const response = await api.get('/allocations/list');
    return response.data;
  } catch (error) {
    console.error('Error fetching allocation list:', error);
    throw error;
  }
};
