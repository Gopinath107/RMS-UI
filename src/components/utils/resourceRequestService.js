// Resource Request Service - JavaScript version

const STORAGE_KEY = 'resourceRequests';

// Generate unique ID
const generateId = () => {
  return `REQ-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

// Get next request ID in sequence (REQ-001, REQ-002, etc.)
const getNextRequestId = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    let requests = [];
    
    if (stored) {
      requests = JSON.parse(stored);
    }
    
    // Find the highest numeric ID
    let maxNum = 0;
    requests.forEach(request => {
      if (request.requestId && request.requestId.startsWith('REQ-')) {
        const num = parseInt(request.requestId.split('-')[1]);
        if (num > maxNum) {
          maxNum = num;
        }
      }
    });
    
    const nextNum = maxNum + 1;
    return `REQ-${nextNum.toString().padStart(3, '0')}`;
  } catch (error) {
    console.error('Error generating request ID:', error);
    return 'REQ-001';
  }
};

class ResourceRequestService {
  // Get all requests
  static getAllRequests() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error getting requests:', error);
      return [];
    }
  }

  // Get request by ID
  static getRequestById(requestId) {
    try {
      const requests = this.getAllRequests();
      return requests.find(req => req.requestId === requestId || req.id === requestId);
    } catch (error) {
      console.error('Error getting request by ID:', error);
      return null;
    }
  }

  // Create new request
  static createRequest(requestData) {
    try {
      const requests = this.getAllRequests();
      
      const newRequest = {
        ...requestData,
        requestId: getNextRequestId(),
        id: generateId(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        status: requestData.status || 'Pending Approval',
        source: requestData.requestedBy || 'project-manager'
      };

      requests.push(newRequest);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(requests));
      
      return newRequest;
    } catch (error) {
      console.error('Error creating request:', error);
      throw error;
    }
  }

  // Update request
  static updateRequest(requestId, updateData) {
    try {
      const requests = this.getAllRequests();
      const index = requests.findIndex(req => 
        req.requestId === requestId || req.id === requestId
      );
      
      if (index === -1) {
        throw new Error('Request not found');
      }

      requests[index] = {
        ...requests[index],
        ...updateData,
        updatedAt: new Date().toISOString()
      };

      localStorage.setItem(STORAGE_KEY, JSON.stringify(requests));
      return requests[index];
    } catch (error) {
      console.error('Error updating request:', error);
      throw error;
    }
  }

  // Delete request
  static deleteRequest(requestId) {
    try {
      const requests = this.getAllRequests();
      const filteredRequests = requests.filter(req => 
        req.requestId !== requestId && req.id !== requestId
      );
      
      localStorage.setItem(STORAGE_KEY, JSON.stringify(filteredRequests));
      return true;
    } catch (error) {
      console.error('Error deleting request:', error);
      return false;
    }
  }

  // Get requests by status
  static getRequestsByStatus(status) {
    try {
      const requests = this.getAllRequests();
      return requests.filter(req => req.status === status);
    } catch (error) {
      console.error('Error getting requests by status:', error);
      return [];
    }
  }

  // Get requests by user/role
  static getRequestsByUser(userRole) {
    try {
      const requests = this.getAllRequests();
      return requests.filter(req => 
        req.requestedBy === userRole || 
        req.createdBy === userRole ||
        req.source === userRole
      );
    } catch (error) {
      console.error('Error getting requests by user:', error);
      return [];
    }
  }

  // Update request status
  static updateRequestStatus(requestId, newStatus, additionalData = {}) {
    try {
      return this.updateRequest(requestId, {
        status: newStatus,
        ...additionalData
      });
    } catch (error) {
      console.error('Error updating request status:', error);
      throw error;
    }
  }

  // Get pending requests for HR approval
  static getPendingRequests() {
    try {
      return this.getRequestsByStatus('Pending Approval');
    } catch (error) {
      console.error('Error getting pending requests:', error);
      return [];
    }
  }

  // Approve request
  static approveRequest(requestId, approverData = {}) {
    try {
      return this.updateRequest(requestId, {
        status: 'Approved',
        approvedBy: 'hr',
        approvedAt: new Date().toISOString(),
        ...approverData
      });
    } catch (error) {
      console.error('Error approving request:', error);
      throw error;
    }
  }

  // Reject request
  static rejectRequest(requestId, rejectionReason = '') {
    try {
      return this.updateRequest(requestId, {
        status: 'Rejected',
        rejectedBy: 'hr',
        rejectedAt: new Date().toISOString(),
        rejectionReason: rejectionReason
      });
    } catch (error) {
      console.error('Error rejecting request:', error);
      throw error;
    }
  }

  // Schedule interview for request
  static scheduleInterview(requestId, interviewData) {
    try {
      return this.updateRequest(requestId, {
        status: 'Interview Scheduled',
        ...interviewData,
        interviewScheduledAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error scheduling interview:', error);
      throw error;
    }
  }

  // Complete interview
  static completeInterview(requestId, interviewResults) {
    try {
      return this.updateRequest(requestId, {
        status: 'Interview Completed',
        ...interviewResults,
        interviewCompletedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error completing interview:', error);
      throw error;
    }
  }

  // Allocate resource
  static allocateResource(requestId, allocationData) {
    try {
      return this.updateRequest(requestId, {
        status: 'Allocated',
        ...allocationData,
        allocatedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error allocating resource:', error);
      throw error;
    }
  }

  // Get statistics
  static getStatistics() {
    try {
      const requests = this.getAllRequests();
      
      const stats = {
        total: requests.length,
        pending: requests.filter(r => r.status === 'Pending Approval').length,
        approved: requests.filter(r => r.status === 'Approved').length,
        rejected: requests.filter(r => r.status === 'Rejected').length,
        inInterview: requests.filter(r => r.status === 'Interview Scheduled' || r.status === 'Interview Completed').length,
        allocated: requests.filter(r => r.status === 'Allocated').length,
        bySource: {
          projectManager: requests.filter(r => r.source === 'project-manager').length,
          salesManager: requests.filter(r => r.source === 'sales-manager').length
        }
      };

      return stats;
    } catch (error) {
      console.error('Error getting statistics:', error);
      return {
        total: 0,
        pending: 0,
        approved: 0,
        rejected: 0,
        inInterview: 0,
        allocated: 0,
        bySource: { projectManager: 0, salesManager: 0 }
      };
    }
  }

  // Import legacy data (for backward compatibility)
  static importLegacyData(legacyRequests) {
    try {
      const currentRequests = this.getAllRequests();
      const convertedRequests = legacyRequests.map(req => ({
        ...req,
        requestId: req.requestId || getNextRequestId(),
        id: req.id || generateId(),
        createdAt: req.createdAt || new Date().toISOString(),
        updatedAt: req.updatedAt || new Date().toISOString(),
        source: req.requestedBy || 'project-manager'
      }));

      const mergedRequests = [...currentRequests, ...convertedRequests];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(mergedRequests));
      
      return mergedRequests.length;
    } catch (error) {
      console.error('Error importing legacy data:', error);
      throw error;
    }
  }

  // Clear all data (for testing/reset)
  static clearAllData() {
    try {
      localStorage.removeItem(STORAGE_KEY);
      return true;
    } catch (error) {
      console.error('Error clearing data:', error);
      return false;
    }
  }
}

export default ResourceRequestService;
