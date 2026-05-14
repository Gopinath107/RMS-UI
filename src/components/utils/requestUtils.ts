// Utility functions for handling resource requests and IDs

export interface ResourceRequest {
  id: string;
  requestId: string; // REQ-001, REQ-002, etc.
  projectName: string;
  clientName: string;
  resourceType: string;
  skillsRequired: string[];
  experienceLevel: string;
  startDate: string;
  endDate: string;
  priority: string;
  workMode: string;
  locationType: string;
  estimatedBudget: string;
  primarySkills: string[];
  secondarySkills: string[];
  status: 'Draft' | 'Submitted' | 'Waiting_For_HR_Approval' | 'Approved' | 'Rejected' | 'In_Interview_Process' | 'Hired' | 'Cancelled' | 'Closed';
  submittedBy: string;
  submittedDate: string;
  approvedBy?: string;
  approvedDate?: string;
  rejectionReason?: string;
  comments?: string;
  interviewScheduled?: boolean;
  interviewStatus?: 'Not_Scheduled' | 'Scheduled' | 'Completed' | 'Selected' | 'Rejected';
  selectedCandidate?: string;
}

export interface Interview {
  id: string;
  requestId: string; // Links to ResourceRequest.requestId
  candidateName: string;
  position: string;
  date: string;
  time: string;
  interviewer: string;
  status: 'Scheduled' | 'Completed' | 'Pending Feedback' | 'Cancelled';
  notes: string;
  resumeUrl?: string;
  feedback?: string;
  result?: 'Hired' | 'Rejected' | 'On Hold';
  skillsAssessed?: string[];
  interviewType?: 'Technical' | 'HR' | 'Managerial' | 'Final';
}

// Generate the next sequential request ID
export const generateRequestId = (): string => {
  try {
    const requests = JSON.parse(localStorage.getItem('resourceRequests') || '[]');
    const requestIds = requests
      .map((req: ResourceRequest) => req.requestId)
      .filter((id: string) => id && id.startsWith('REQ-'))
      .map((id: string) => {
        const num = parseInt(id.split('-')[1]);
        return isNaN(num) ? 0 : num;
      })
      .sort((a: number, b: number) => b - a);

    const nextNumber = requestIds.length > 0 ? requestIds[0] + 1 : 1;
    return `REQ-${nextNumber.toString().padStart(3, '0')}`;
  } catch (error) {
    console.error('Error generating request ID:', error);
    return 'REQ-001';
  }
};

// Get all active resource requests for dropdown
export const getActiveResourceRequests = (): Array<{requestId: string, projectName: string, position: string}> => {
  try {
    const requests = JSON.parse(localStorage.getItem('resourceRequests') || '[]');
    return requests
      .filter((req: ResourceRequest) => 
        ['Waiting_For_HR_Approval', 'Approved', 'In_Interview_Process'].includes(req.status)
      )
      .map((req: ResourceRequest) => ({
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
export const updateRequestInterviewStatus = (requestId: string, status: ResourceRequest['interviewStatus']) => {
  try {
    const requests = JSON.parse(localStorage.getItem('resourceRequests') || '[]');
    const updatedRequests = requests.map((req: ResourceRequest) => {
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
export const getRequestById = (requestId: string): ResourceRequest | null => {
  try {
    const requests = JSON.parse(localStorage.getItem('resourceRequests') || '[]');
    return requests.find((req: ResourceRequest) => req.requestId === requestId) || null;
  } catch (error) {
    console.error('Error getting request by ID:', error);
    return null;
  }
};

// Update request with hired candidate
export const updateRequestWithHiredCandidate = (requestId: string, candidateName: string) => {
  try {
    const requests = JSON.parse(localStorage.getItem('resourceRequests') || '[]');
    const updatedRequests = requests.map((req: ResourceRequest) => {
      if (req.requestId === requestId) {
        return {
          ...req,
          status: 'Hired' as const,
          selectedCandidate: candidateName,
          interviewStatus: 'Selected' as const
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
export const updateRequestStatusToClosed = (requestId: string, candidateName: string) => {
  try {
    const requests = JSON.parse(localStorage.getItem('resourceRequests') || '[]');
    const updatedRequests = requests.map((req: ResourceRequest) => {
      if (req.requestId === requestId) {
        return {
          ...req,
          status: 'Closed' as const,
          selectedCandidate: candidateName,
          interviewStatus: 'Completed' as const
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

    const updatedRequests = requests.map((req: ResourceRequest) => {
      if (!req.requestId) {
        hasUpdates = true;
        return {
          ...req,
          requestId: `REQ-${counter++.toString().padStart(3, '0')}`,
          interviewScheduled: false,
          interviewStatus: 'Not_Scheduled' as const
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
