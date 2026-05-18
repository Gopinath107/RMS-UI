// Utility functions for handling resource requests and IDs

// Generate the next sequential request ID
export const generateRequestId = () => {
  try {
    const requests = JSON.parse(localStorage.getItem('resourceRequests') || '[]');
    const requestIds = requests
      .map((req) => req.requestId)
      .filter((id) => id && id.startsWith('REQ-'))
      .map((id) => {
        const num = parseInt(id.split('-')[1]);
        return isNaN(num) ? 0 : num;
      })
      .sort((a, b) => b - a);

    const nextNumber = requestIds.length > 0 ? requestIds[0] + 1 : 1;
    return `REQ-${nextNumber.toString().padStart(3, '0')}`;
  } catch (error) {
    console.error('Error generating request ID:', error);
    return 'REQ-001';
  }
};

// Get all active resource requests for dropdown
export const getActiveResourceRequests = () => {
  try {
    const requests = JSON.parse(localStorage.getItem('resourceRequests') || '[]');
    return requests
      .filter((req) => 
        ['Waiting_For_HR_Approval', 'Approved', 'In_Interview_Process'].includes(req.status)
      )
      .map((req) => ({
        requestId: req.requestId,
        projectName: req.projectName,
        position: req.resourceType
      }));
  } catch (error) {
    console.error('Error getting active requests:', error);
    return [];
  }
};

// Update request status when interview process starts
export const updateRequestInterviewStatus = (requestId, status) => {
  try {
    const requests = JSON.parse(localStorage.getItem('resourceRequests') || '[]');
    const updatedRequests = requests.map((req) => {
      if (req.requestId === requestId) {
        return {
          ...req,
          interviewScheduled: status !== 'Not_Scheduled',
          interviewStatus: status,
          status: status === 'Scheduled' || status === 'Completed' ? 'In_Interview_Process' : req.status
        };
      }
      return req;
    });
    localStorage.setItem('resourceRequests', JSON.stringify(updatedRequests));
  } catch (error) {
    console.error('Error updating request interview status:', error);
  }
};

// Get request details by requestId
export const getRequestById = (requestId) => {
  try {
    const requests = JSON.parse(localStorage.getItem('resourceRequests') || '[]');
    return requests.find((req) => req.requestId === requestId) || null;
  } catch (error) {
    console.error('Error getting request by ID:', error);
    return null;
  }
};

// Update request with hired candidate
export const updateRequestWithHiredCandidate = (requestId, candidateName) => {
  try {
    const requests = JSON.parse(localStorage.getItem('resourceRequests') || '[]');
    const updatedRequests = requests.map((req) => {
      if (req.requestId === requestId) {
        return {
          ...req,
          status: 'Hired',
          selectedCandidate: candidateName,
          interviewStatus: 'Selected'
        };
      }
      return req;
    });
    localStorage.setItem('resourceRequests', JSON.stringify(updatedRequests));
  } catch (error) {
    console.error('Error updating request with hired candidate:', error);
  }
};

// Update request status to closed when interview is completed
export const updateRequestStatusToClosed = (requestId, candidateName) => {
  try {
    const requests = JSON.parse(localStorage.getItem('resourceRequests') || '[]');
    const updatedRequests = requests.map((req) => {
      if (req.requestId === requestId) {
        return {
          ...req,
          status: 'Closed',
          selectedCandidate: candidateName,
          interviewStatus: 'Completed'
        };
      }
      return req;
    });
    localStorage.setItem('resourceRequests', JSON.stringify(updatedRequests));
  } catch (error) {
    console.error('Error updating request status to closed:', error);
  }
};

// Initialize request IDs for existing requests (migration helper)
export const initializeRequestIds = () => {
  try {
    const requests = JSON.parse(localStorage.getItem('resourceRequests') || '[]');
    let hasUpdates = false;
    let counter = 1;

    const updatedRequests = requests.map((req) => {
      if (!req.requestId) {
        hasUpdates = true;
        return {
          ...req,
          requestId: `REQ-${counter++}.toString().padStart(3, '0')}`,
          interviewScheduled: false,
          interviewStatus: 'Not_Scheduled'
        };
      }
      return req;
    });

    if (hasUpdates) {
      localStorage.setItem('resourceRequests', JSON.stringify(updatedRequests));
    }
  } catch (error) {
    console.error('Error initializing request IDs:', error);
  }
};
