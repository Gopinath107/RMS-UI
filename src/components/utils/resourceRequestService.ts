// Shared service for managing resource requests from both Project Managers and Sales Managers

export interface ResourceRequest {
  id: string;
  clientName: string;
  numberOfResources?: number; // Only for opportunity requests
  requiredSkills: string[];
  primarySkills?: string[]; // Primary skills (required)
  secondarySkills?: string[]; // Secondary skills (nice to have)
  experienceRange: string;
  projectStartDate: string;
  projectEndDate: string;
  projectDuration: string;
  status: "Pending" | "Waiting_For_HR_Approval" | "In Review" | "Approved" | "Rejected" | "Interview Scheduled" | "Interview Completed" | "Partially Fulfilled";
  submittedDate: string;
  description: string;
  location: string;
  workArrangement?: string; // Remote/Onsite/Hybrid
  workPriority?: string; // Low/Medium/High/Urgent
  estimatedBudget?: string;
  projectDocument?: string;
  
  // Source tracking
  source: "project-manager" | "sales-manager";
  opportunityId?: string; // For sales manager requests
  resourceNumber?: number; // For individual resources from opportunities (1 of 5, 2 of 5, etc.)
  
  // Interview tracking
  interviewDate?: string;
  interviewTime?: string;
  interviewNotes?: string;
  hrComments?: string;
}

class ResourceRequestService {
  private static STORAGE_KEY = 'allResourceRequests';

  // Get all resource requests from localStorage
  static getAllRequests(): ResourceRequest[] {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      const requests = stored ? JSON.parse(stored) : [];
      console.log('Retrieved all requests:', requests.length, 'requests');
      return requests;
    } catch (error) {
      console.error('Error loading resource requests:', error);
      return [];
    }
  }

  // Save all resource requests to localStorage
  static saveAllRequests(requests: ResourceRequest[]): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(requests));
      console.log('Saved all requests:', requests.length, 'requests');
    } catch (error) {
      console.error('Error saving resource requests:', error);
    }
  }

  // Add a new resource request
  static addRequest(request: ResourceRequest): void {
    const allRequests = this.getAllRequests();
    allRequests.unshift(request); // Add to beginning
    console.log('Adding single request:', request.id, 'Total requests now:', allRequests.length);
    this.saveAllRequests(allRequests);
  }

  // Add multiple resource requests (for opportunities)
  static addMultipleRequests(requests: ResourceRequest[]): void {
    const allRequests = this.getAllRequests();
    allRequests.unshift(...requests); // Add all to beginning
    console.log('Adding multiple requests:', requests.map(r => r.id), 'Total requests now:', allRequests.length);
    this.saveAllRequests(allRequests);
  }

  // Update a resource request
  static updateRequest(id: string, updates: Partial<ResourceRequest>): void {
    const allRequests = this.getAllRequests();
    const index = allRequests.findIndex(req => req.id === id);
    if (index !== -1) {
      allRequests[index] = { ...allRequests[index], ...updates };
      this.saveAllRequests(allRequests);
    }
  }

  // Get requests by source
  static getRequestsBySource(source: "project-manager" | "sales-manager"): ResourceRequest[] {
    return this.getAllRequests().filter(req => req.source === source);
  }

  // Get requests by opportunity ID
  static getRequestsByOpportunity(opportunityId: string): ResourceRequest[] {
    return this.getAllRequests().filter(req => req.opportunityId === opportunityId);
  }

  // Get next available request ID
  static getNextRequestId(): string {
    const allRequests = this.getAllRequests();
    const allIds = allRequests.map(req => {
      const match = req.id.match(/REQ-(\d+)/);
      return match ? parseInt(match[1]) : 0;
    });
    const maxId = Math.max(...allIds, 0);
    const nextId = `REQ-${String(maxId + 1).padStart(3, '0')}`;
    console.log('Generated next request ID:', nextId, 'from existing IDs:', allIds);
    return nextId;
  }

  // Initialize with existing data if needed
  static initializeFromLegacyData(): void {
    const existingRequests = this.getAllRequests();
    console.log('Initializing service, existing requests:', existingRequests.length);
    
    if (existingRequests.length === 0) {
      // Migration: Get data from old storage keys if they exist
      const legacyPMRequests = localStorage.getItem('resourceRequests');
      const legacySMRequests = localStorage.getItem('opportunityResourceRequests');
      
      const migratedRequests: ResourceRequest[] = [];
      
      if (legacyPMRequests) {
        try {
          const pmRequests = JSON.parse(legacyPMRequests);
          console.log('Migrating PM requests:', pmRequests.length);
          pmRequests.forEach((req: any) => {
            migratedRequests.push({
              ...req,
              source: "project-manager" as const
            });
          });
        } catch (error) {
          console.error('Error migrating PM requests:', error);
        }
      }
      
      if (legacySMRequests) {
        try {
          const smRequests = JSON.parse(legacySMRequests);
          console.log('Migrating SM requests:', smRequests.length);
          smRequests.forEach((req: any) => {
            migratedRequests.push({
              ...req,
              source: "sales-manager" as const
            });
          });
        } catch (error) {
          console.error('Error migrating SM requests:', error);
        }
      }
      
      if (migratedRequests.length > 0) {
        console.log('Saving migrated requests:', migratedRequests.length);
        this.saveAllRequests(migratedRequests);
      }
    }
  }

  // Clear all data (for testing)
  static clearAllData(): void {
    localStorage.removeItem(this.STORAGE_KEY);
    console.log('Cleared all resource request data');
  }
}

export default ResourceRequestService;
