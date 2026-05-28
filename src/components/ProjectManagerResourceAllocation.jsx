// ProjectManagerResourceAllocation.jsx
import React, { useState, useEffect, useCallback, useMemo, memo } from 'react';
import { 
  Search, Users, CheckCircle, XCircle, Mail, UserCheck, Calendar, Clock, 
  Link, Award, ChevronLeft, ChevronRight, Filter, RefreshCw 
} from 'lucide-react';
import { toast } from 'sonner';
import Swal from 'sweetalert2';
import { 
  Card, CardContent, CardDescription, CardHeader, CardTitle 
} from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { 
  Dialog, DialogContent, DialogDescription, DialogFooter, 
  DialogHeader, DialogTitle 
} from './ui/dialog';
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from './ui/table';
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from './ui/select';
import { Label } from './ui/label';
import { Checkbox } from './ui/checkbox';
import { InterviewService } from '../services/InterviewManagementService';
import { EmployeeService } from '../services/EmployeeManagementService';
import { ProjectService } from '../services/ProjectmanagementService';
import { ResourceRequestService } from '../services/RequestResourceService';
import { DemandService } from '../services/DemandService';
import { AllocationService } from '../services/AllocationService';

const InterviewResultsTable = memo(({ 
  filteredResults, handleAllocateToClient, getStatusBadgeColor, 
  getClearanceBadgeColor, formatDateTime, formatRequestId 
}) => {
  const [currentPageResults, setCurrentPageResults] = useState(1);
  const [rowsPerPageResults, setRowsPerPageResults] = useState(5);

  const totalPagesResults = useMemo(() => 
    Math.ceil(filteredResults.length / rowsPerPageResults), 
    [filteredResults.length, rowsPerPageResults]
  );

  const paginatedResults = useMemo(() => 
    filteredResults.slice(
      (currentPageResults - 1) * rowsPerPageResults, 
      currentPageResults * rowsPerPageResults
    ), 
    [filteredResults, currentPageResults, rowsPerPageResults]
  );

  

  useEffect(() => {
    const newTotalPages = Math.ceil(filteredResults.length / rowsPerPageResults);
    if (currentPageResults > newTotalPages && newTotalPages > 0) {
      setCurrentPageResults(newTotalPages);
    } else if (filteredResults.length === 0) {
      setCurrentPageResults(1);
    }
  }, [filteredResults.length, rowsPerPageResults, currentPageResults]);

  return (
    <Card className="shadow-md bg-white/95 backdrop-blur-sm border border-gray-200">
      <CardHeader>
        <CardTitle className="text-lg sm:text-xl lg:text-2xl">
          Interview Results ({filteredResults.length})
        </CardTitle>
        <CardDescription className="text-sm">
          Track interview outcomes and allocate cleared candidates to client projects
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="relative">
          <div className="overflow-x-auto max-h-[60vh] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
            <Table className="table-layout-auto">
              <TableHeader>
                <TableRow className="bg-green-50 hover:bg-green-100">
                  <TableHead className="text-left border border-gray-300">Request ID</TableHead>
                  <TableHead className="text-left border border-gray-300">Request Type</TableHead>
                  <TableHead className="text-left border border-gray-300">Candidate</TableHead>
                  <TableHead className="text-left border border-gray-300">Resource Type</TableHead>
                  <TableHead className="text-left border border-gray-300">Project</TableHead>
                  <TableHead className="text-left border border-gray-300">Requested Date</TableHead>
                  <TableHead className="text-left border border-gray-300">Fulfilment Date</TableHead>
                  <TableHead className="text-left border border-gray-300">Status</TableHead>
                  <TableHead className="text-left border border-gray-300">Result</TableHead>
                  <TableHead className="text-left border border-gray-300">Onboarding Status</TableHead>
                  <TableHead className="text-left border border-gray-300">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedResults.map((result) => (
                  <TableRow key={result.id} className="hover:bg-gray-50">
                    <TableCell className="border border-gray-300">
                      <div className="flex items-center gap-1">
                        <Link className="w-3 h-3 sm:w-4 sm:h-4 text-green-600" />
                        <span className="font-mono text-xs sm:text-sm text-green-600 whitespace-nowrap">
                          {formatRequestId(result.requestId)}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="border border-gray-300">
                      <div className="flex flex-col gap-1">
                        <Badge className={`text-xs ${
                          result.requestType === 'OPP' 
                            ? 'bg-blue-100 text-blue-800' 
                            : 'bg-purple-100 text-purple-800'
                        }`}>
                          {result.requestType}
                        </Badge>
                        {result.requestType === 'DR' && result.demandId && (
                          <span className="text-xs text-gray-600">
                            Demand: {result.demandId}
                          </span>
                        )}
                        {result.groupId && (
                          <span className="text-xs text-gray-600">
                            Group: {result.groupId}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="border border-gray-300">
                      <div className="text-xs sm:text-sm whitespace-nowrap">
                        <div>
                          <span className="truncate text-xs sm:text-sm" title={result.employeeName}>
                            {result.employeeName}  {result.candidateName}
                          </span>
                        </div>
                        <div>
                          <span className="truncate text-xs sm:text-sm" title={result.candidateEmail}>
                            {result.candidateEmail}
                          </span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="border border-gray-300">
  <div className="flex flex-col gap-1">
    <Badge className={`text-xs ${
      result.resourceType === 'Internal' 
        ? 'bg-blue-100 text-blue-800 border border-blue-200' 
        : 'bg-purple-100 text-purple-800 border border-purple-200'
    }`}>
      {result.resourceType}
    </Badge>
    {result.resourceId && result.resourceId !== 'N/A' && (
      <span className="text-xs text-gray-600 font-mono">
        ID: {result.resourceId}
      </span>
    )}
  </div>
</TableCell>
                    <TableCell className="border border-gray-300">
                      <div>
                        <div className="truncate text-xs sm:text-sm font-medium">{result.projectName}</div>
                        <div className="truncate text-xs text-gray-500">{result.accountName}</div>
                      </div>
                    </TableCell>
<TableCell className="border border-gray-300">
  <div className="text-xs sm:text-sm whitespace-nowrap">
    {result.requestedDate ? (
      formatDateTime(result.requestedDate, 'date')
    ) : (
      <span className="text-gray-400">-</span>
    )}
  </div>
</TableCell>
<TableCell className="border border-gray-300">
  <div className="text-xs sm:text-sm whitespace-nowrap">
    {result.fulfilmentDate ? (
      formatDateTime(result.fulfilmentDate, 'date')
    ) : (
      <span className="text-gray-400">- </span>
    )}
  </div>
</TableCell>
                    <TableCell className="border border-gray-300">
                      <div className="space-y-1">
                        <Badge className={`${getStatusBadgeColor(result.status)} text-xs sm:text-sm`}>
                          {result.status}
                        </Badge>
                        {result.status === 'Cancelled' && result.cancellationReason && (
                          <div className="text-xs text-red-600 truncate" title={result.cancellationReason}>
                            Reason: {result.cancellationReason}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="border border-gray-300">
                      <div className="flex items-center gap-1">
                        <Badge className={`${getClearanceBadgeColor(result.clearanceStatus)} text-xs sm:text-sm`}>
                          {result.clearanceStatus || 'Pending'}
                        </Badge>
                        {result.clearanceStatus === 'Cleared' && (
                          <Award className="w-3 h-3 sm:w-4 sm:h-4 text-green-600" />
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="border border-gray-300">
                      <Badge className={`text-xs sm:text-sm ${
                        result.onboardingStatus === 'Onboarded' ? 'bg-green-100 text-green-800' :
                        result.onboardingStatus === 'Onboarding' ? 'bg-blue-100 text-blue-800' :
                        result.onboardingStatus === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {result.onboardingStatus || 'Pending'}
                      </Badge>
                    </TableCell>
                    <TableCell className="border border-gray-300">
                      <div className="flex items-center gap-2 flex-wrap">
                        {result.clearanceStatus === 'Cleared' && 
                         result.status === 'Selected' && 
                         result.onboardingStatus === 'Onboarded' && 
                         !result.allocatedToClient && (
                          <Button
                            size="sm"
                            onClick={() => handleAllocateToClient(result)}
                            className="h-6 sm:h-8 px-2 sm:px-3 text-xs sm:text-sm bg-green-600 hover:bg-green-700 text-white"
                          >
                            <UserCheck className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                            Allocate
                          </Button>
                        )}
                        {result.allocatedToClient && (
                          <Badge className="bg-blue-100 text-blue-800 text-xs sm:text-sm font-medium">
                            Allocated
                          </Badge>
                        )}
                        {result.clearanceStatus === 'Cleared' && 
                         result.status === 'Selected' && 
                         result.onboardingStatus !== 'Onboarded' && 
                         !result.allocatedToClient && (
                          <Badge className="bg-orange-100 text-orange-800 text-xs sm:text-sm">
                            Awaiting Onboarding
                          </Badge>
                        )}
                        {result.status === 'Selected' && result.clearanceStatus === 'Pending' && (
                          <Badge className="bg-orange-100 text-orange-800 text-xs sm:text-sm">
                            Awaiting HR Update
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {paginatedResults.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={11} className="text-center py-8 text-gray-500 text-sm sm:text-base">
                      No interview results found. Interviews scheduled in HR management will appear here.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between mt-4 gap-4">
            <div className="flex items-center space-x-2">
              <span className="text-xs sm:text-sm text-gray-600">Rows per page:</span>
              <Select
                value={rowsPerPageResults.toString()}
                onValueChange={(value) => {
                  setRowsPerPageResults(Number(value));
                  setCurrentPageResults(1);
                }}
              >
                <SelectTrigger className="w-[70px] h-8 sm:h-10 text-xs sm:text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5</SelectItem>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPageResults(prev => Math.max(prev - 1, 1))}
                disabled={currentPageResults === 1 || filteredResults.length === 0}
                className="h-8 sm:h-10 text-xs sm:text-sm border-gray-300 text-gray-700"
              >
                <ChevronLeft className="h-3 w-3 sm:h-4 sm:w-4" />
                Previous
              </Button>
              <span className="text-xs sm:text-sm text-gray-600">
                Page {currentPageResults} of {totalPagesResults || 1}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPageResults(prev => Math.min(prev + 1, totalPagesResults))}
                disabled={currentPageResults === totalPagesResults || filteredResults.length === 0}
                className="h-8 sm:h-10 text-xs sm:text-sm border-gray-300 text-gray-700"
              >
                Next
                <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4" />
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

const ProjectManagerResourceAllocation = () => {
  const [interviewResults, setInterviewResults] = useState([]);
  const [filteredResults, setFilteredResults] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [projects, setProjects] = useState([]);
  const [resourceRequests, setResourceRequests] = useState([]);
  const [demands, setDemands] = useState([]);
  const [allocations, setAllocations] = useState([]);
  const [localAllocations, setLocalAllocations] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterResult, setFilterResult] = useState('all');
  const [filterRequestType, setFilterRequestType] = useState('all');
  const [dateRange, setDateRange] = useState({ from: '', to: '' });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [isAllocationDialogOpen, setIsAllocationDialogOpen] = useState(false);
  const [allocationForm, setAllocationForm] = useState({ 
    projectRole: '', startDate: '', endDate: '',projectName: ''
  });
  const [filterResourceType, setFilterResourceType] = useState('all');

  

  // Load demands data
  const loadDemands = useCallback(async () => {
    try { 
      const res = await DemandService.fetchDemandList(); 
      setDemands(res.data.result || []); 
    } catch (err) { 
      console.error('Error loading demands:', err);
      setDemands([]);
    }
  }, []);

  // Load employees
  const loadEmployees = useCallback(async () => {
    try { 
      const res = await EmployeeService.fetchEmployeeList(); 
      setEmployees(res.data.result || []); 
    } catch (err) { console.error(err); }
  }, []);

  // Load projects
  const loadProjects = useCallback(async () => {
    try { 
      const res = await ProjectService.fetchProjectList(); 
      setProjects(res.data.result || []); 
    } catch (err) { console.error(err); }
  }, []);

  // Load resource requests
  const loadResourceRequests = useCallback(async () => {
    try { 
      const res = await ResourceRequestService.fetchResourceRequestList(); 
      setResourceRequests(res.data.result || []); 
    } catch (err) { console.error(err); }
  }, []);

  // Load allocations
  const loadAllocations = useCallback(async () => {
    try { 
      const res = await AllocationService.fetchAllocationList(); 
      if (res.data && res.data.success) {
        setAllocations(res.data.result || []); 
      } else {
        console.error('Failed to load allocations:', res.data);
        setAllocations([]);
      }
    } catch (err) { 
      console.error('Error loading allocations:', err);
      setAllocations([]);
    }
  }, []);

  // Load interview results - FIXED VERSION
// Load interview results - FIXED VERSION with proper date extraction
// Load interview results - FIXED VERSION with proper date extraction
// Load interview results - FIXED without state dependencies
// Load interview results - ROBUST VERSION with better error handling
const loadInterviewResults = useCallback(async () => {
  try {
    console.log('Loading interview results...');
    
    // Fetch interview data first
    const interviewResponse = await InterviewService.fetchInterviewList();
    
    if (!interviewResponse.data.success) {
      throw new Error('Failed to fetch interview results from API');
    }

    const interviews = interviewResponse.data.result || [];
    console.log('Interviews loaded:', interviews.length);

    // If no interviews, set empty array and return
    if (interviews.length === 0) {
      setInterviewResults([]);
      return;
    }

    // Try to load demands and requests, but don't fail if they error
    let freshDemands = [];
    let freshResourceRequests = [];
    
    try {
      const demandsResponse = await DemandService.fetchDemandList();
      freshDemands = demandsResponse.data.result || [];
      console.log('Demands loaded:', freshDemands.length);
    } catch (demandError) {
      console.warn('Failed to load demands, continuing without demand data:', demandError);
    }

    try {
      const requestsResponse = await ResourceRequestService.fetchResourceRequestList();
      freshResourceRequests = requestsResponse.data.result || [];
      console.log('Resource requests loaded:', freshResourceRequests.length);
    } catch (requestError) {
      console.warn('Failed to load resource requests, continuing without request data:', requestError);
    }

    const enrichedResults = interviews.map((interview) => {
      // Find matching request and demand from available data
      const request = freshResourceRequests.find((req) => 
        req.requestId === interview.requestId
      );

      const demand = freshDemands.find((d) => 
        d.demandid === interview.demandId
      );

      // Determine request type
      let requestType = 'OPP';
      if (interview.demandId) {
        requestType = 'DR';
      } else if (interview.groupId) {
        requestType = 'OPP';
      }

        let resourceType = '';
        let resourceId = '';
        
        if (interview.employeeId && !interview.candidateId) {
          resourceType = 'Internal';
          resourceId = interview.employeeId;
        } else if (interview.candidateId && !interview.employeeId) {
          resourceType = 'External';
          resourceId = interview.candidateId;
        } else if (interview.employeeId && interview.candidateId) {
          // If both exist, prefer employee (internal)
          resourceType = 'Internal';
          resourceId = interview.employeeId;
        } else {
          resourceType = 'Unknown';
          resourceId = 'N/A';
        }

      // Get project name and dates from different sources
      let projectName = interview.projectName ;
      let accountName = interview.accountName;
      let requestedDate = null;
      let fulfilmentDate = null;

      // For demand requests, get data from demand
      if (requestType === 'DR' && demand) {
        projectName = demand.projectName || projectName;
        accountName = demand.accountName || accountName;
        requestedDate = demand.demandOpenDt || null;
        fulfilmentDate = demand.fulfilmentDt || null;
      }

      // For opportunity requests, get data from request
      if (requestType === 'OPP' && request) {
        projectName = request.projectName || projectName;
        accountName = request.accountName || accountName;
        requestedDate = request.submittedDate || null;
      }

      // If still no requestedDate, try from interview submittedDate
      if (!requestedDate && interview.submittedDate) {
        requestedDate = interview.submittedDate;
      }

      // If still no requestedDate, try from created date
      if (!requestedDate && interview.createddt) {
        requestedDate = interview.createddt.split('T')[0];
      }

      let date = null;
      const dateStr = interview.levelProgress?.reduce((minStr, lp) => {
        if (lp.scheduledAt && (!minStr || lp.scheduledAt < minStr)) return lp.scheduledAt;
        return minStr;
      }, null);

      if (dateStr) {
        try {
          const [datePart, timePart] = dateStr.split(' ');
          const [day, month, year] = datePart.split('-').map(Number);
          const [hour, minute] = timePart ? timePart.split('-').map(Number) : [0, 0];
          date = new Date(year, month - 1, day, hour, minute);
        } catch (dateError) {
          console.warn('Failed to parse date:', dateStr, dateError);
          date = new Date();
        }
      }

      const apiStatus = interview.status || 'Unknown';
      const apiOverallStatus = interview.overallStatus || 'Pending';
      const apiOnboardingStatus = interview.onboardingStatus;

      const normalizedOnboardingStatus = apiOnboardingStatus?.trim() === "On Boarded" 
        ? "Onboarded" 
        : (apiOnboardingStatus || "Pending");

      let clearanceStatus = "Pending";
      if (apiOverallStatus === "Interview Selected") {
        clearanceStatus = "Cleared";
      } else if (apiOverallStatus === "Interview Rejected") {
        clearanceStatus = "Not Cleared";
      }

      let cancellationReason = null;
      if (apiStatus === 'Cancelled' && interview.overallNotes) {
        const match = interview.overallNotes.match(/Cancelled: (.*)/);
        if (match) cancellationReason = match[1];
      }

      const result = {
        ...interview,
        id: interview.interviewId ||  Math.random(),
        candidateEmail: interview.employeeEmail || interview.candidateEmail || 'No email',
        date: date || new Date(),
        status: apiStatus,
        clearanceStatus,
        onboardingStatus: normalizedOnboardingStatus,
        cancellationReason,
        projectName,
        accountName,
        companyName: interview.companyName || 'Unknown',
        requestType,
        demandId: interview.demandId,
        groupId: interview.groupId,
        requestedDate,
        fulfilmentDate,
        resourceType,
        resourceId
      };

      return result;
    });

    console.log('Enriched results:', enrichedResults.length);
    setInterviewResults(enrichedResults);
    
  } catch (err) {
    console.error('Error loading interview results:', err);
    setError('Failed to load interview results: ' + (err.message || 'Unknown error'));
    // Set empty array to prevent further errors
    setInterviewResults([]);
  }
}, []); // No dependencies

  // Main data loading effect - FIXED
// Main data loading effect - FIXED
// Main data loading effect - FIXED without infinite loop
// Main data loading effect - IMPROVED with individual error handling
useEffect(() => {
  const loadAllData = async () => {
    setIsLoading(true);
    setError(null); // Reset error state
    
    try {
      console.log('Loading all data...');
      
      // Load all base data with individual error handling
      const loadPromises = [
        loadDemands().catch(err => console.warn('Failed to load demands:', err)),
        loadResourceRequests().catch(err => console.warn('Failed to load resource requests:', err)),
        loadEmployees().catch(err => console.warn('Failed to load employees:', err)),
        loadProjects().catch(err => console.warn('Failed to load projects:', err)),
        loadAllocations().catch(err => console.warn('Failed to load allocations:', err))
      ];

      await Promise.all(loadPromises);

      console.log('Base data loading attempts completed, loading interview results...');
      
      // Load interview results (this function has its own error handling)
      await loadInterviewResults();
      
      console.log('All data loading completed');
      
    } catch (err) {
      console.error('Error in main data loading:', err);
      setError('Failed to load some data. Please try refreshing.');
    } finally {
      setIsLoading(false);
    }
  };

  loadAllData();
}, []); // Empty dependencies - run only once on mount

  // Enrich interview results with allocation status
// Replace the current enrichedInterviewResults useMemo with this:
const enrichedInterviewResults = useMemo(() => 
  interviewResults.map(ir => {
    // Check for allocations from API
    const apiAllocated = allocations.some(a => {
      // For internal resources, check employeeId match
      if (ir.resourceType === 'Internal' && ir.employeeId) {
        return a.employeeId === ir.employeeId && 
               String(a.requestId) === String(ir.requestId);
      }
      // For external resources, check candidateId match
      else if (ir.resourceType === 'External' && ir.candidateId) {
        return a.candidateId === ir.candidateId && 
               String(a.requestId) === String(ir.requestId);
      }
      // Fallback: check by requestId and resource details
      return String(a.requestId) === String(ir.requestId) &&
             ((a.employeeId && a.employeeId === ir.employeeId) ||
              (a.candidateId && a.candidateId === ir.candidateId));
    });
    
    // Check for local allocations
    const localAllocated = localAllocations.some(a => {
      if (ir.resourceType === 'Internal' && ir.employeeId) {
        return a.employeeId === ir.employeeId && 
               a.requestId === ir.requestId;
      }
      else if (ir.resourceType === 'External' && ir.candidateId) {
        return a.candidateId === ir.candidateId && 
               a.requestId === ir.requestId;
      }
      return a.requestId === ir.requestId &&
             ((a.employeeId && a.employeeId === ir.employeeId) ||
              (a.candidateId && a.candidateId === ir.candidateId));
    });
    
    const isAllocated = apiAllocated || localAllocated;
    
    return { ...ir, allocatedToClient: isAllocated };
  }), 
  [interviewResults, allocations, localAllocations]
);

  // Filter results
  useEffect(() => {
    let filtered = enrichedInterviewResults.filter((result) =>
      (result.candidateEmail?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      String(result.requestId || '').includes(searchTerm) ||
      (result.projectName?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (result.employeeName?.toLowerCase() || '').includes(searchTerm.toLowerCase())
    );

    if (filterStatus !== 'all') filtered = filtered.filter(r => r.status === filterStatus);
    if (filterResult === 'cleared') filtered = filtered.filter(r => r.clearanceStatus === 'Cleared');
    else if (filterResult === 'not-cleared') filtered = filtered.filter(r => r.clearanceStatus === 'Not Cleared');
    else if (filterResult === 'pending') filtered = filtered.filter(r => !r.clearanceStatus || r.clearanceStatus === 'Pending');
    if (filterRequestType !== 'all') filtered = filtered.filter(r => r.requestType === filterRequestType);
    if (dateRange.from) {
      const fromDate = new Date(dateRange.from);
      filtered = filtered.filter(r => {
        const interviewDate = new Date(r.date);
        return interviewDate >= fromDate;
      });
    }
    if (dateRange.to) {
      const toDate = new Date(dateRange.to);
      toDate.setHours(23, 59, 59, 999);
      filtered = filtered.filter(r => {
        const interviewDate = new Date(r.date);
        return interviewDate <= toDate;
      });
    }
    if (filterResourceType !== 'all') filtered = filtered.filter(r => r.resourceType === filterResourceType);

    setFilteredResults(filtered);
  }, [searchTerm, filterStatus, filterResult, filterRequestType,filterResourceType, dateRange, enrichedInterviewResults]);

  const handleAllocateToClient = useCallback((candidate) => {
    if (candidate.clearanceStatus !== 'Cleared') return toast.error('Only cleared candidates can be allocated');
    if (candidate.onboardingStatus !== 'Onboarded') return toast.error('Candidate must be Onboarded');

    const today = new Date();
    const sixMonthsLater = new Date();
    sixMonthsLater.setMonth(today.getMonth() + 6);

    setSelectedCandidate(candidate);
    setAllocationForm({
      projectRole: '',
      startDate: today.toISOString().split('T')[0],
      endDate: sixMonthsLater.toISOString().split('T')[0],
      projectName: candidate.projectName || ''
    });
    setIsAllocationDialogOpen(true);
  }, []);

const confirmAllocation = useCallback(async () => {
  if (!allocationForm.startDate || !allocationForm.endDate) {
    return toast.error('Start date and end date are required');
  }
  const projectName = allocationForm.projectName || selectedCandidate.projectName;

try {
  const res = await AllocationService.createAllocation(
    allocationForm.projectId,
    selectedCandidate.employeeId || null, // employeeId (only if exists)
    selectedCandidate.requestId,
    true,
    allocationForm.startDate,
    allocationForm.endDate,
    selectedCandidate.candidateId || null, // candidateId (only if exists)
    'Client', // projectRole
    projectName

  );

    if (res.data && res.data.success) {
      setLocalAllocations(prev => [...prev, {
        employeeId: selectedCandidate.employeeId,
        requestId: selectedCandidate.requestId,
        allocationId: res.data.result.allocationId
      }]);

      // Close allocation dialog FIRST
      setIsAllocationDialogOpen(false);
      setSelectedCandidate(null);
      setAllocationForm({ projectRole: '', startDate: '', endDate: '' });

      // Then show success message
      Swal.fire({
        title: 'Success!',
        text: `Candidate ${selectedCandidate.candidateEmail} has been allocated successfully!`,
        icon: 'success',
        confirmButtonText: 'OK',
        confirmButtonColor: '#16a34a'
      });

      await loadAllocations();
      
    } else {
      throw new Error(res.data?.errors?.[0] || 'Failed to allocate candidate');
    }
  } catch (err) {
    console.error('Allocation error:', err);
    
    // Close allocation dialog FIRST, then show error
    setIsAllocationDialogOpen(false);
    
    // Small delay to ensure dialog is closed before showing alert
    setTimeout(() => {
      Swal.fire({
        title: 'Error!',
        text: err.message || 'Failed to allocate candidate. Please try again.',
        icon: 'error',
        confirmButtonText: 'OK',
        confirmButtonColor: '#dc2626'
      });
    }, 100);
  }
}, [allocationForm, selectedCandidate, loadAllocations]);

  const getStatusBadgeColor = useCallback((status) => {
    const map = { 
      Scheduled: 'bg-blue-100 text-blue-800', 
      Completed: 'bg-green-100 text-green-800', 
      'Pending Feedback': 'bg-yellow-100 text-yellow-800', 
      Cancelled: 'bg-red-100 text-red-800', 
      NoShow: 'bg-orange-100 text-orange-800', 
      Selected: 'bg-green-100 text-green-800' 
    };
    return map[status] || 'bg-gray-100 text-gray-800';
  }, []);

  const getClearanceBadgeColor = useCallback((status) => {
    const map = { 
      Cleared: 'bg-green-100 text-green-800', 
      'Not Cleared': 'bg-red-100 text-red-800', 
      Pending: 'bg-yellow-100 text-yellow-800' 
    };
    return map[status] || 'bg-gray-100 text-gray-800';
  }, []);

  const stats = useMemo(() => {
    const total = enrichedInterviewResults.length;
    const cleared = enrichedInterviewResults.filter(r => r.clearanceStatus === 'Cleared').length;
    const notCleared = enrichedInterviewResults.filter(r => r.clearanceStatus === 'Not Cleared').length;
    const pending = enrichedInterviewResults.filter(r => !r.clearanceStatus || r.clearanceStatus === 'Pending').length;
    const allocated = enrichedInterviewResults.filter(r => r.allocatedToClient).length;
    const oppCount = enrichedInterviewResults.filter(r => r.requestType === 'OPP').length;
    const drCount = enrichedInterviewResults.filter(r => r.requestType === 'DR').length;
    
    return { total, cleared, notCleared, pending, allocated, oppCount, drCount };
  }, [enrichedInterviewResults]);

const formatDateTime = useCallback((date, type) => {
  if (!date) return 'N/A';
  
  // Handle both string dates and Date objects
  let dateObj;
  if (typeof date === 'string') {
    // Handle different date formats from API
    if (date.includes('-')) {
      // Handle "2025-11-12" format
      const [year, month, day] = date.split('-').map(Number);
      dateObj = new Date(year, month - 1, day);
    } else if (date.includes('/')) {
      // Handle other formats if needed
      const parts = date.split('/');
      dateObj = new Date(parts[2], parts[1] - 1, parts[0]);
    } else {
      dateObj = new Date(date);
    }
  } else {
    dateObj = date;
  }
  
  if (isNaN(dateObj.getTime())) return 'N/A';
  
  const day = String(dateObj.getDate()).padStart(2, '0');
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const year = dateObj.getFullYear();
  
  if (type === 'date') return `${day}-${month}-${year}`;
  if (type === 'time') return dateObj.toLocaleTimeString('en-US', { 
    hour: '2-digit', 
    minute: '2-digit', 
    hour12: false 
  });
  return 'N/A';
}, []);
  
  const formatRequestId = useCallback((id) => `REQ-${String(id).padStart(3, '0')}`, []);

  const clearDateFilters = () => {
    setDateRange({ from: '', to: '' });
  };

const handleRefresh = async () => {
  setIsLoading(true);
  setError(null);
  try {
    // Clear current data first
    setInterviewResults([]);
    setFilteredResults([]);
    
    // Reload interview results (it will handle its own dependencies)
    await loadInterviewResults();
    toast.success('Data refreshed successfully');
  } catch (err) {
    console.error('Refresh error:', err);
    toast.error('Failed to refresh data');
  } finally {
    setIsLoading(false);
  }
};
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading resource allocation data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-center text-red-500">
          <p className="text-lg font-semibold">{error}</p>
          <Button 
            onClick={() => window.location.reload()} 
            className="mt-4 bg-green-600 hover:bg-green-700"
          >
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[95vw] mx-auto px-4 py-8 space-y-6 sm:px-6 lg:px-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Resource Allocation</h1>
          </div>
        </div>
        <Button 
          onClick={handleRefresh}
          variant="outline"
          className="flex items-center gap-2"
          disabled={isLoading}
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh Data
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 lg:grid-cols-3 gap-2 ">
        <Card className="shadow-md bg-white/95 backdrop-blur-sm border border-gray-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Interviews</CardTitle>
            <Users className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold text-green-600">{stats.total}</div>
            <p className="text-xs text-gray-500">All interviews</p>
          </CardContent>
        </Card>

        <Card className="shadow-md bg-white/95 backdrop-blur-sm border border-gray-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cleared</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold text-green-600">{stats.cleared}</div>
            <p className="text-xs text-gray-500">Candidates cleared</p>
          </CardContent>
        </Card>

        <Card className="shadow-md bg-white/95 backdrop-blur-sm border border-gray-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Not Cleared</CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold text-red-600">{stats.notCleared}</div>
            <p className="text-xs text-gray-500">Candidates rejected</p>
          </CardContent>
        </Card>

        {/* <Card className="shadow-md bg-white/95 backdrop-blur-sm border border-gray-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Calendar className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold text-yellow-600">{stats.pending}</div>
            <p className="text-xs text-gray-500">Awaiting results</p>
          </CardContent>
        </Card> */}

        <Card className="shadow-md bg-white/95 backdrop-blur-sm border border-gray-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Allocated</CardTitle>
            <UserCheck className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold text-blue-600">{stats.allocated}</div>
            <p className="text-xs text-gray-500">Allocated to clients</p>
          </CardContent>
        </Card>

        <Card className="shadow-md bg-white/95 backdrop-blur-sm border border-gray-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Opportunities</CardTitle>
            <Award className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold text-blue-600">{stats.oppCount}</div>
            <p className="text-xs text-gray-500">OPP requests</p>
          </CardContent>
        </Card>

        <Card className="shadow-md bg-white/95 backdrop-blur-sm border border-gray-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Demand Requests</CardTitle>
            <Award className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold text-purple-600">{stats.drCount}</div>
            <p className="text-xs text-gray-500">DR requests</p>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-md bg-white/95 backdrop-blur-sm border border-gray-200" style={{ overflow: 'visible', position: 'relative', zIndex: 10 }}>
        <CardContent className="pt-6" style={{ overflow: 'visible' }}>
          <div className="flex flex-col gap-4">
            {/* Row 1: Search | All Status | All Results */}
            <div className="flex flex-col sm:flex-row gap-4 items-center">
              <div className="relative flex-1 min-w-0 w-full">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5" />
                <Input 
                  placeholder="Search by email, request ID, project, or candidate name..." 
                  value={searchTerm} 
                  onChange={(e) => setSearchTerm(e.target.value)} 
                  className="pl-10 sm:pl-12 h-10 sm:h-12 border-gray-300 focus:border-green-500 text-sm sm:text-base w-full" 
                />
              </div>
              <div className="flex-1 min-w-0 w-full">
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-full h-10 sm:h-12 border-gray-300 focus:border-green-500 text-sm sm:text-base">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="Scheduled">Scheduled</SelectItem>
                    <SelectItem value="Completed">Completed</SelectItem>
                    {/* <SelectItem value="Pending Feedback">Pending Feedback</SelectItem> */}
                    <SelectItem value="Cancelled">Cancelled</SelectItem>
                    <SelectItem value="NoShow">No Show</SelectItem>
                    <SelectItem value="Selected">Selected</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex-1 min-w-0 w-full">
                <Select value={filterResult} onValueChange={setFilterResult}>
                  <SelectTrigger className="w-full h-10 sm:h-12 border-gray-300 focus:border-green-500 text-sm sm:text-base">
                    <SelectValue placeholder="Filter by result" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Results</SelectItem>
                    <SelectItem value="cleared">Cleared</SelectItem>
                    <SelectItem value="not-cleared">Not Cleared</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Row 2: Request Type | Resource Type | Start Date | End Date */}
            <div className="flex flex-col sm:flex-row gap-4 items-center">
              <div className="flex-1 min-w-0 w-full">
                <Select value={filterRequestType} onValueChange={setFilterRequestType}>
                  <SelectTrigger className="w-full h-10 sm:h-12 border-gray-300 focus:border-green-500 text-sm sm:text-base">
                    <SelectValue placeholder="Request Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Request Types</SelectItem>
                    <SelectItem value="OPP">Opportunity (OPP)</SelectItem>
                    <SelectItem value="DR">Demand Request (DR)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex-1 min-w-0 w-full">
                <Select value={filterResourceType} onValueChange={setFilterResourceType}>
                  <SelectTrigger className="w-full h-10 sm:h-12 border-gray-300 focus:border-green-500 text-sm sm:text-base">
                    <SelectValue placeholder="Resource Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Resource Types</SelectItem>
                    <SelectItem value="Internal">Internal</SelectItem>
                    <SelectItem value="External">External</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex-1 min-w-0 w-full">
                <Input
                  id="dateFrom"
                  type="date"
                  value={dateRange.from}
                  onChange={(e) => setDateRange(prev => ({ ...prev, from: e.target.value }))}
                  className="h-10 sm:h-12 border-gray-300 focus:border-green-500 text-sm sm:text-base w-full"
                />
              </div>
              <div className="flex-1 min-w-0 w-full">
                <Input
                  id="dateTo"
                  type="date"
                  value={dateRange.to}
                  onChange={(e) => setDateRange(prev => ({ ...prev, to: e.target.value }))}
                  className="h-10 sm:h-12 border-gray-300 focus:border-green-500 text-sm sm:text-base w-full"
                />
              </div>
              {(dateRange.from || dateRange.to) && (
                <Button
                  variant="outline"
                  onClick={clearDateFilters}
                  className="h-10 sm:h-12 text-xs sm:text-sm border-gray-300 text-gray-700 whitespace-nowrap"
                >
                  Clear
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <InterviewResultsTable 
        filteredResults={filteredResults} 
        handleAllocateToClient={handleAllocateToClient} 
        getStatusBadgeColor={getStatusBadgeColor} 
        getClearanceBadgeColor={getClearanceBadgeColor} 
        formatDateTime={formatDateTime} 
        formatRequestId={formatRequestId} 
      />

      <Dialog open={isAllocationDialogOpen} onOpenChange={setIsAllocationDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Allocate Resource to Client</DialogTitle>
            <DialogDescription>
              Confirm allocation details for this candidate.
            </DialogDescription>
          </DialogHeader>
          {selectedCandidate && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-3 text-sm">
                <div>
                  <Label className="text-xs font-medium text-gray-600">Candidate Email</Label>
                  <p className="font-medium truncate" title={selectedCandidate.candidateEmail}>
                    {selectedCandidate.candidateEmail}
                  </p>
                </div>
                <div>
                  <Label className="text-xs font-medium text-gray-600">Request Type</Label>
                  <Badge className={`text-xs ${
                    selectedCandidate.requestType === 'OPP' 
                      ? 'bg-blue-100 text-blue-800' 
                      : 'bg-purple-100 text-purple-800'
                  }`}>
                    {selectedCandidate.requestType}
                  </Badge>
                </div>
<div>
  <Label htmlFor="projectName" className="text-xs font-medium text-gray-600">Project</Label>
  <Input
    id="projectName"
    value={allocationForm.projectName || selectedCandidate.projectName || ''}
    onChange={(e) => setAllocationForm({ ...allocationForm, projectName: e.target.value })}
    disabled={!!selectedCandidate.projectName }
    // disabled={!!selectedCandidate.projectName && !allocationForm.projectName}
    className={`h-10 border-gray-300 text-sm ${
      (selectedCandidate.projectName && !allocationForm.projectName) 
        ? 'bg-gray-100' 
        : 'bg-white'
    }`}
    placeholder={selectedCandidate.projectName ? undefined : "Enter project name..."}
  />
  {selectedCandidate.projectName && !allocationForm.projectName && (
    <p className="text-xs text-gray-500 mt-1">
      Project name is from the candidate record. To edit, start typing above.
    </p>
  )}
</div>
                <div>
                  <Label className="text-xs font-medium text-gray-600">Request ID</Label>
                  <p className="font-medium text-green-600 whitespace-nowrap">
                    {formatRequestId(selectedCandidate.requestId)}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="startDate" className="text-xs font-medium text-gray-600">Start Date *</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={allocationForm.startDate}
                    onChange={(e) => setAllocationForm({ ...allocationForm, startDate: e.target.value })}
                    className="h-10 border-gray-300 focus:border-green-500 text-sm"
                  />
                </div>
                <div>
                  <Label htmlFor="endDate" className="text-xs font-medium text-gray-600">End Date *</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={allocationForm.endDate}
                    onChange={(e) => setAllocationForm({ ...allocationForm, endDate: e.target.value })}
                    className="h-10 border-gray-300 focus:border-green-500 text-sm"
                  />
                </div>
              </div>

              {/* <div className="bg-blue-50 p-3 rounded-md">
                <div className="flex items-start gap-2">
                  <div className="mt-0.5">
                    <CheckCircle className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-blue-800">Billable Resource</p>
                    <p className="text-xs text-blue-600">This allocation will be marked as billable to the client.</p>
                  </div>
                </div>
              </div> */}
            </div>
          )}
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setIsAllocationDialogOpen(false);
                setAllocationForm({
                  projectRole: '',
                  startDate: '',
                  endDate: '',
                  projectName: ''
                });
              }}
              className="h-9 text-xs border-gray-300 text-gray-700"
            >
              Cancel
            </Button>
            <Button 
              onClick={confirmAllocation} 
              className="h-9 text-xs bg-green-600 hover:bg-green-700 text-white"
            >
              Confirm Allocation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <style>{`
        .scrollbar-thin{scrollbar-width:thin;scrollbar-color:#d1d5db #f3f4f6;}
        .scrollbar-thin::-webkit-scrollbar{width:6px;height:6px;}
        .scrollbar-thin::-webkit-scrollbar-track{background:#f3f4f6;border-radius:3px;}
        .scrollbar-thin::-webkit-scrollbar-thumb{background:#d1d5db;border-radius:3px;}
        .scrollbar-thin::-webkit-scrollbar-thumb:hover{background:#9ca3af;}
        .table-layout-auto{table-layout:auto;}
        table{width:100%;border-collapse:collapse;}
        .truncate{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
      `}</style>
    </div>
  );
};

export default ProjectManagerResourceAllocation;
