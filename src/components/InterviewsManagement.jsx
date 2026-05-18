// src/components/InterviewsManagement.jsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { DndContext, closestCenter } from '@dnd-kit/core';
import { SortableContext, horizontalListSortingStrategy } from '@dnd-kit/sortable';
import { useDraggableColumns } from './common/useDraggableColumns.js';
import { DraggableTableHead, ColumnOrderResetButton } from './common/DraggableTableHead.jsx';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from './ui/card.jsx';
import { Button } from './ui/button.jsx';
import { Input } from './ui/input.jsx';
import { Label } from './ui/label.jsx';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select.jsx';
import { Badge } from './ui/badge.jsx';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog.jsx';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './ui/table.jsx';
import { Textarea } from './ui/textarea.jsx';
import {
  Plus,
  Calendar as CalendarIcon,
  Clock,
  User,
  FileText,
  Users,
  Award,
  AlertCircle,
  Pencil,
  Trash,
  ChevronLeft,
  ChevronRight,
  Filter,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import { ResourceRequestService } from '../services/RequestResourceService.js';
import { InterviewService } from '../services/InterviewManagementService.js';
import { EmployeeService } from '../services/EmployeeManagementService.js';
import { UserManagementService } from '../services/UserManagementService.js';
import { CandidateService } from '../services/CandidateService.js';
import { DemandService } from '../services/DemandService.js';
import { Checkbox } from './ui/checkbox.jsx';
import Swal from 'sweetalert2';

// ── Interview table column definitions ──────────────────────────────────────
const INTERVIEW_DEFAULT_COLUMNS = ['type', 'date', 'candidate', 'levels', 'overall', 'resources', 'onboard', 'actions'];

const INTERVIEW_COLUMN_LABELS = {
  type: 'Request Type',
  date: 'Created At',
  candidate: 'Candidate',
  levels: 'Interview Levels',
  overall: 'Overall Status',
  resources: 'Resources',
  onboard: 'Onboard Status',
  actions: 'Actions',
};

const InterviewsManagement = ({ setCurrentPage }) => {
  // ── Drag-to-reorder column state ──
  const {
    columnOrder: interviewColOrder,
    sensors: interviewSensors,
    handleDragEnd: handleInterviewColDragEnd,
    resetColumns: resetInterviewCols,
  } = useDraggableColumns('interviews', INTERVIEW_DEFAULT_COLUMNS);

  const [interviews, setInterviews] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterRequestId, setFilterRequestId] = useState('all');
  const [filterRequestType, setFilterRequestType] = useState('all');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedInterview, setSelectedInterview] = useState(null);
  const [activeRequests, setActiveRequests] = useState([]);
  const [allRequests, setAllRequests] = useState([]);
  const [availableResources, setAvailableResources] = useState([]);
  const [allResources, setAllResources] = useState([]);
  const [systemInterviewers, setSystemInterviewers] = useState([]);
  const [onboardingStatuses, setOnboardingStatuses] = useState([]);
  const [currentPage, setCurrentPageState] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [activeOpportunityRequests, setActiveOpportunityRequests] = useState([]);
  const [activeDemandRequests, setActiveDemandRequests] = useState([]);
  const [interviewStatusOptions, setInterviewStatusOptions] = useState([]);
  const [isLevelModalOpen, setIsLevelModalOpen] = useState(false);
  const [selectedLevelInterview, setSelectedLevelInterview] = useState(null);
  const [selectedLevel, setSelectedLevel] = useState(null);
  const [selectedLevelResult, setSelectedLevelResult] = useState(null);
  const [levelNotes, setLevelNotes] = useState('');
  const [formErrors, setFormErrors] = useState({
    general: '',
    requestId: '',
    candidateId: '',
    interviewLevels: '',
    levelsDetails: {}
  });

  // New state for resource type and external resources
  const [externalResources, setExternalResources] = useState([]);
  const [isLoadingExternalResources, setIsLoadingExternalResources] = useState(false);

  const currentUserId = localStorage.getItem('userId');

  const statuses = ['Scheduled', 'Selected', 'Cancelled'];
  const interviewLevelsOptions = ['L1', 'L2', 'L3'];

  const [formData, setFormData] = useState({
    id: '',
    demandId: '', // NEW: Demand selection for the new flow
    requestId: '',
    candidateId: '',
    interviewLevels: [],
    levelsDetails: [],
    originalLevels: [],
    interviewType: 'demand',
    resourceType: 'internal'
  });

  // NEW: State for Demands and Demand-specific Resource Requests
  const [allDemands, setAllDemands] = useState([]);
  const [demandResourceRequests, setDemandResourceRequests] = useState([]);

  const [filterResourceType, setFilterResourceType] = useState('all');

  /* --------------------------------------------------------------------- */
  /*  LOAD SUPPORTING DATA                                                 */
  /* --------------------------------------------------------------------- */
  useEffect(() => {
    const loadActiveRequests = async () => {
      try {
        const response = await ResourceRequestService.fetchRequestList();
        if (response.data.success) {
          const list = response.data.result;
          setAllRequests(list);

          const approved = list.filter(
            r => r.status === 'Approved' || r.status === 'Under Review'
          );

          setActiveOpportunityRequests(approved.filter(r => !r.demandId));
          setActiveDemandRequests(approved.filter(r => !!r.demandId));
        } else {
          toast.error('Failed to fetch resource requests: ' + (response.data.errors?.join(', ') || 'Unknown error'));
        }
      } catch (e) {
        console.error(e);
        toast.error('Error loading resource requests');
      }
    };

    const loadAvailableResources = async () => {
      try {
        const response = await EmployeeService.fetchEmployeeList();
        if (response.data.success) {
          const employees = response.data.result;
          setAllResources(employees);
          const bench = employees
            .filter((e) => e.status === 'Bench')
            .map((e) => ({
              id: e.employeeId,
              name: `${e.firstName} ${e.lastName}`,
              email: e.email,
              role: e.jobTitle || e.departmentName,
              status: e.status,
              resourceType: 'internal' // Mark as internal resource
            }));
          setAvailableResources(bench);
        } else {
          toast.error('Failed to fetch employees: ' + (response.data.errors?.join(', ') || 'Unknown error'));
        }
      } catch (e) {
        console.error(e);
        toast.error('Error loading employees');
      }
    };

    const loadExternalResources = async () => {
      try {
        setIsLoadingExternalResources(true);

        // Call the candidate list API instead
        const response = await CandidateService.fetchCandidateList(); // Adjust method name as needed

        if (response.data.success) {
          // Filter for external candidates or map all candidates as external
          // Adjust the mapping based on your API response structure
          const externalResources = response.data.result
            // .filter(candidate => candidate.resourceType === 'external') // Add if you have a field to distinguish
            .map((candidate) => ({
              id: candidate.candidateId || candidate.id || candidate.employeeId,
              name: candidate.fullName || `${candidate.firstName || ''} ${candidate.lastName || ''}`.trim(),
              email: candidate.email || candidate.emailAddress || '',
              role: candidate.skillNames?.join(', ') ||
                candidate.skills?.join(', ') ||
                candidate.specialization ||
                candidate.jobTitle ||
                'External Candidate',
              status: candidate.status || 'Available',
              resourceType: 'external' // Mark as external resource
            }));

          setExternalResources(externalResources);
        } else {
          toast.error('Failed to fetch external resources: ' + (response.data.errors?.join(', ') || 'Unknown error'));
        }
      } catch (e) {
        console.error(e);
        toast.error('Error loading external resources');
      } finally {
        setIsLoadingExternalResources(false);
      }
    };
    const loadInterviewers = async () => {
      try {
        const response = await UserManagementService.fetchUserList();
        if (response.data.success) {
          const list = response.data.result.map((u) => ({
            id: u.userId,
            name: u.userId.toString(),
            displayName: `${u.employeeName} (${u.roleName})`,
          }));
          setSystemInterviewers(list);
        } else {
          toast.error('Failed to fetch users: ' + (response.data.errors?.join(', ') || 'Unknown error'));
        }
      } catch (e) {
        console.error(e);
        toast.error('Error loading users');
      }
    };

    const loadOnboardingStatuses = async () => {
      try {
        const response = await InterviewService.fetchOnboardingStatuses();
        if (response.data.success) {
          setOnboardingStatuses(response.data.result);
        } else {
          toast.error('Failed to fetch onboarding statuses: ' + (response.data.errors?.join(', ') || 'Unknown error'));
        }
      } catch (e) {
        console.error(e);
        toast.error('Error loading onboarding statuses');
      }
    };

    const loadInterviewStatuses = async () => {
      try {
        const response = await InterviewService.fetchInterviewStatuses();
        if (response.data.success) {
          setInterviewStatusOptions(response.data.result);
        } else {
          toast.error('Failed to fetch interview statuses: ' + (response.data.errors?.join(', ') || 'Unknown error'));
        }
      } catch (e) {
        console.error(e);
        toast.error('Error loading interview statuses');
      }
    };

    const loadDemands = async () => {
      try {
        const response = await DemandService.fetchDemandList();
        if (response.data && response.data.result) {
          setAllDemands(response.data.result);
        }
      } catch (e) {
        console.error('Error loading demands', e);
      }
    };

    loadActiveRequests();
    loadAvailableResources();
    loadExternalResources(); // Load external resources
    loadInterviewers();
    loadOnboardingStatuses();
    loadInterviewStatuses();
    loadDemands(); // NEW: Load demands
  }, []);

  /* --------------------------------------------------------------------- */
  /*  LOAD INTERVIEWS                                                      */
  /* --------------------------------------------------------------------- */
  const loadInterviews = useCallback(async () => {
    if (allRequests.length === 0 || allResources.length === 0) return;

    try {
      const response = await InterviewService.fetchInterviewList();
      if (response.data.success) {
        const apiInterviews = response.data.result;

        const mapped = apiInterviews.map((api) => {
          // Determine interview type
          const isDemand = !!api.demandId;
          const interviewType = isDemand ? 'DR' : 'OPP';

          // Find the corresponding request to get requester info
          const correspondingRequest = allRequests.find(
            req => req.requestId === api.requestId
          );

          const levelResults = {};
          const levelStatus = {};
          let clearanceStatus = 'Pending';

          if (api.levelProgress?.length) {
            api.levelProgress.forEach((p) => {
              const feedback = p.feedbackComments || (p.status === 'Completed' ? 'Cleared' : p.status);
              levelResults[p.level] = feedback;
              levelStatus[p.level] = p.status;
            });
            clearanceStatus = Object.values(levelResults).every(
              (r) => r !== 'Pending' && !r.includes('Not Cleared')
            ) ? 'Cleared' : 'Not Cleared';
          }

          let cancellationReason = api.overallNotes || '';
          if (api.status === 'Cancelled') {
            cancellationReason = cancellationReason.startsWith('Cancelled: ')
              ? cancellationReason.slice('Cancelled: '.length)
              : cancellationReason;
          }

          const first = api.levelProgress?.[0] || {};
          const [datePart, timePart] = (first.scheduledAt || '').split(' ');
          const [day, month, year] = datePart?.split('-') || [];
          const [hour, minute] = timePart?.split('-') || [];

          // For DR interviews, show "HR" as interviewer
          const interviewerDisplay = isDemand ? 'HR' : (first.interviewerName || 'Unknown');

          // Determine resource type (internal/external) - use from API or default to internal
          // Determine resource type based on employeeId and candidateId
          const resourceType = api.employeeId && !api.candidateId ? 'internal' :
            !api.employeeId && api.candidateId ? 'external' :
              'unknown';

          return {
            id: api.interviewId.toString(),
            requestId: `REQ-${api.requestId.toString().padStart(3, '0')}`,
            candidateName: api.employeeName || api.candidateName || 'Unknown',
            candidateEmail: api.employeeEmail || api.candidateEmail || 'Unknown',
            date: datePart ? `${day}-${month}-${year}` : '',
            time: timePart ? `${hour}:${minute}` : '',
            interviewer: interviewerDisplay,
            status: api.status || 'Scheduled',
            notes: api.overallNotes || '',
            interviewLevels: api.interviewLevels || [],
            levelResults,
            levelStatus,
            clearanceStatus,
            cancellationReason,
            candidateId: api.employeeId,
            externalcandidateId: api.candidateId,
            interviewerUserId: first.interviewerUserId,
            levelProgress: api.levelProgress || [],
            companyName: api.companyName,
            accountName: api.accountName,
            projectName: api.projectName,
            onboardingStatus: api.onboardingStatus || '',
            overallStatus: api.overallStatus || '',
            interviewType, // 'OPP' or 'DR'
            demandId: api.demandId,
            groupId: api.groupId,
            createdBy: correspondingRequest?.requesterName || api.createdByUserName || 'Unknown',
            submittedDate: correspondingRequest?.submittedDate || '',
            resourceType: resourceType, // Add resourceType
            rawData: api, // Keep original data for reference
            currentStatus: api.currentStatus
          };
        });

        const enhanced = mapped.map((i) => {
          const req = allRequests.find(
            (r) => `REQ-${r.requestId.toString().padStart(3, '0')}` === i.requestId
          );
          return {
            ...i,
            companyName: req?.companyName || i.companyName,
            accountName: req?.accountName || i.accountName,
            projectName: req?.projectName || i.projectName,
            createdBy: req?.requesterName || i.createdBy,
            submittedDate: req?.submittedDate || i.submittedDate,
          };
        });

        const counts = {};
        enhanced.forEach((i) => {
          const key = `${i.candidateName}-${i.accountName}`;
          counts[key] = (counts[key] || 0) + 1;
        });
        const withCounts = enhanced.map((i) => ({
          ...i,
          interviewCount: counts[`${i.candidateName}-${i.accountName}`] || 1,
        }));

        setInterviews(withCounts);
      } else {
        toast.error('Failed to fetch interviews: ' + (response.data.errors?.join(', ') || 'Unknown error'));
        setInterviews([]);
      }
    } catch (e) {
      console.error(e);
      toast.error('Error loading interviews');
      setInterviews([]);
    }
  }, [allRequests, allResources]);

  useEffect(() => {
    loadInterviews();
  }, [loadInterviews]);

  /* --------------------------------------------------------------------- */
  /*  FORM HANDLERS                                                        */
  /* --------------------------------------------------------------------- */
  const handleFormChange = async (field, value) => {
    if (field === 'interviewLevels') {
      let newLvls = value;
      newLvls = newLvls.sort((a, b) => a.localeCompare(b));
      setFormData((prev) => ({
        ...prev,
        interviewLevels: newLvls,
        levelsDetails: newLvls.map(
          (lvl) =>
            prev.levelsDetails.find((d) => d.level === lvl) || {
              level: lvl,
              interviewer: '',
              date: '',
              time: '',
              notes: '',
            }
        ),
      }));
    } else if (field === 'interviewType') {
      setFormData((prev) => ({
        ...prev,
        interviewType: value,
        demandId: '',
        requestId: '',
        candidateId: '',
      }));
      setDemandResourceRequests([]);
    } else if (field === 'demandId') {
      setFormData((prev) => ({
        ...prev,
        demandId: value,
        requestId: '',
        candidateId: '',
      }));
      try {
        const requests = await InterviewService.getResourceRequestsByDemand(value);
        setDemandResourceRequests(requests || []);
      } catch (error) {
        console.error("Error fetching demand requests", error);
        toast.error('Failed to load resource requests for demand');
      }
    } else if (field === 'requestId') {
      setFormData((prev) => {
        const nextState = { ...prev, requestId: value };
        // For demand interviews, auto-fill candidate and resourceType from the selected Resource Request
        if (prev.interviewType === 'demand') {
          // Note: demandResourceRequests contain 'real' requests linked to candidates
          const selectedRR = demandResourceRequests.find(r => r.requestId.toString() === value.toString());
          if (selectedRR) {
            nextState.candidateId = (selectedRR.employeeId || selectedRR.candidateId)?.toString() || '';
            nextState.resourceType = selectedRR.resourceType ? selectedRR.resourceType.toLowerCase() : 'internal';
          }
        }
        return nextState;
      });
    } else if (field === 'resourceType') {
      // When resource type changes, reset candidateId
      setFormData((prev) => ({
        ...prev,
        [field]: value,
        candidateId: ''
      }));
    } else {
      setFormData((prev) => ({ ...prev, [field]: value }));
    }
  };

  const handleLevelChange = (level, field, value) => {
    setFormData((prev) => ({
      ...prev,
      levelsDetails: prev.levelsDetails.map((d) =>
        d.level === level ? { ...d, [field]: value } : d
      ),
    }));
  };

  // Get candidates based on resource type
  const getCandidatesByResourceType = (type) => {
    if (type === 'internal') {
      return availableResources;
    } else if (type === 'external') {
      return externalResources;
    }
    return [];
  };

  /* --------------------------------------------------------------------- */
  /*  CREATE / UPDATE INTERVIEW                                            */
  /* --------------------------------------------------------------------- */
  const handleSubmitInterview = () => {
    // Clear previous errors
    setFormErrors({
      general: '',
      requestId: '',
      candidateId: '',
      interviewLevels: '',
      levelsDetails: {}
    });

    // Frontend validation - only validate fields that are not disabled
    let hasErrors = false;
    const newErrors = {
      general: '',
      requestId: '',
      candidateId: '',
      interviewLevels: '',
      levelsDetails: {}
    };

    if (!formData.requestId) {
      newErrors.requestId = 'Resource request is required';
      hasErrors = true;
    }

    // if (!formData.candidateId) {
    //   newErrors.candidateId = 'Candidate is required';
    //   hasErrors = true;
    // }

    if (formData.interviewLevels.length === 0) {
      newErrors.interviewLevels = 'At least one interview level is required';
      hasErrors = true;
    }

    const isDemand = formData.interviewType === 'demand';
    formData.levelsDetails.forEach((d, index) => {
      const levelErrors = {};

      // Only validate if the level is not completed (not Selected/Rejected)
      const isCompleted = d.status === 'Selected' || d.status === 'Rejected';

      if (!isCompleted) {
        if (!isDemand && !d.interviewer) {
          levelErrors.interviewer = 'Interviewer is required';
          hasErrors = true;
        }
        if (!d.date) {
          levelErrors.date = 'Date is required';
          hasErrors = true;
        }
        if (!d.time) {
          levelErrors.time = 'Time is required';
          hasErrors = true;
        }
      }

      if (Object.keys(levelErrors).length > 0) {
        newErrors.levelsDetails[d.level] = levelErrors;
      }
    });

    if (hasErrors) {
      setFormErrors(newErrors);

      setTimeout(() => {
        const firstErrorElement = document.querySelector('[data-error="true"]');
        if (firstErrorElement) {
          firstErrorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);

      return;
    }


    const levels = formData.levelsDetails.map((d) => ({
      level: d.level,
      scheduledAt: `${d.date.split('-')[2]}-${d.date.split('-')[1]}-${d.date.split('-')[0]} ${d.time.replace(':', '-')}`,
      interviewNotes: d.notes || '',
      ...(isDemand ? {} : { interviewerUserId: parseInt(d.interviewer) }),
    }));

    let apiCall;
    if (isEditMode) {
      apiCall = InterviewService.updateInterview(
        parseInt(formData.id),
        parseInt(formData.requestId),
        null, // interviewerUserId - handled in levels array
        formData.interviewLevels,
        levels
      );
    } else if (isDemand) {
      // For demand interviews: send either employeeId OR candidateId
      if (formData.resourceType === 'internal') {
        apiCall = InterviewService.createBatchInterview(
          parseInt(formData.requestId),
          parseInt(formData.candidateId), // This is employeeId for internal
          null, // candidateId - not needed for internal
          currentUserId,
          formData.interviewLevels,
          levels
        );
      } else {
        apiCall = InterviewService.createBatchInterview(
          parseInt(formData.requestId),
          null, // employeeId - not needed for external
          parseInt(formData.candidateId), // This is candidateId for external
          currentUserId,
          formData.interviewLevels,
          levels
        );
      }
    } else {
      // For opportunity interviews: send either employeeId OR candidateId
      if (formData.resourceType === 'internal') {
        apiCall = InterviewService.createInterview(
          parseInt(formData.requestId),
          parseInt(formData.candidateId), // This is employeeId for internal
          null, // candidateId - not needed for internal
          null, // interviewerUserId - handled in levels array
          formData.interviewLevels,
          levels
        );
      } else {
        apiCall = InterviewService.createInterview(
          parseInt(formData.requestId),
          null, // employeeId - not needed for external
          parseInt(formData.candidateId), // This is candidateId for external
          null, // interviewerUserId - handled in levels array
          formData.interviewLevels,
          levels
        );
      }
    }

    // Remove toast.promise and handle the API call directly
    const submitAction = async () => {
      try {
        const res = await apiCall;

        if (res.data.success) {
          setIsAddDialogOpen(false);
          loadInterviews();
          toast.success(
            isEditMode
              ? 'Interview updated and mail sent successfully'
              : 'Interview scheduled and mail sent successfully'
          );
        } else {
          // Use the exact error message from backend
          const errorMessage = res.data.errors?.join(', ') || 'Unknown error';
          throw new Error(errorMessage);
        }
      } catch (error) {
        // Handle axios error response (400, 500, etc.)
        let errorMessage = 'Unexpected error occurred';

        if (error.response && error.response.data) {
          const responseData = error.response.data;
          errorMessage = responseData.errors?.join(', ') || responseData.message || error.message;
        } else if (error.message) {
          errorMessage = error.message;
        }

        // Set the general error to display in the form
        setFormErrors(prev => ({
          ...prev,
          general: errorMessage
        }));

        // Scroll to the error message
        setTimeout(() => {
          const errorElement = document.querySelector('[data-general-error="true"]');
          if (errorElement) {
            errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }, 100);
      }
    };

    submitAction();
  };

  // Add this function to clear errors when fields change
  const clearFieldError = (field) => {
    setFormErrors(prev => ({
      ...prev,
      [field]: '',
      general: '' // Also clear general error when user starts fixing fields
    }));
  };

  const clearLevelError = (level) => {
    setFormErrors(prev => ({
      ...prev,
      levelsDetails: {
        ...prev.levelsDetails,
        [level]: {}
      },
      general: ''
    }));
  };

  /* --------------------------------------------------------------------- */
  /*  LEVEL STATUS UPDATE HANDLERS - ONLY FOR DR INTERVIEWS               */
  /* --------------------------------------------------------------------- */
  const openLevelStatusModal = (interview, level, result) => {
    setSelectedLevelInterview(interview);
    setSelectedLevel(level);
    setSelectedLevelResult(result); // Set the selected result
    setLevelNotes('');
    setIsLevelModalOpen(true);
  };

  const handleLevelStatusUpdate = async () => {
    if (!selectedLevelInterview || !selectedLevel || !selectedLevelResult) return;

    try {
      const feedback = levelNotes.trim()
        ? `${selectedLevelResult}: ${levelNotes.trim()}`
        : selectedLevelResult;

      const levelProg = selectedLevelInterview.levelProgress.find(p => p.level === selectedLevel);
      const interviewerUserID = levelProg ? levelProg.interviewerUserId : null;

      const payload = {
        interviewId: parseInt(selectedLevelInterview.id),
        requestId: parseInt(selectedLevelInterview.requestId.replace('REQ-', '')),
        levels: [selectedLevel],
        status: selectedLevelResult,
        interviewerUserID: interviewerUserID,
        feedback: feedback
      };

      const response = await InterviewService.levelsComplete(
        payload.interviewId,
        payload.requestId,
        payload.levels,
        payload.status,
        payload.interviewerUserID,
        payload.feedback
      );

      if (response.data.success) {
        toast.success(`${selectedLevel} updated to ${selectedLevelResult}`);
        await loadInterviews();
        setIsLevelModalOpen(false);
      } else {
        toast.error('Failed: ' + response.data.errors.join(', '));
      }
    } catch (error) {
      console.error('Error updating level:', error);
      toast.error('Failed to update level status');
    }
  };

  /* --------------------------------------------------------------------- */
  /*  EDIT / DELETE HANDLERS                                               */
  /* --------------------------------------------------------------------- */
  const handleEditInterview = (interview) => {
    // Set the selected interview for reference
    setSelectedInterview(interview);

    // Determine interview type based on raw data
    const isDemand = interview.rawData?.demandId || interview.interviewType === 'DR';
    const interviewType = isDemand ? 'demand' : 'opportunity';

    const details = (interview.levelProgress || []).map((p) => {
      const [dp, tp] = (p.scheduledAt || '').split(' ');
      const [day, month, year] = dp?.split('-') || [];

      // Convert dd-mm-yyyy to yyyy-mm-dd for date input
      const formattedDate = dp && day && month && year
        ? `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
        : '';

      const [hour, minute] = tp?.split('-') || [];
      const formattedTime = tp ? `${hour}:${minute}` : '';

      // Get status from levelProgress - use status field
      // Based on API response: status can be "Scheduled", "Selected", "Rejected"
      const levelStatus = p.status || 'Scheduled';

      return {
        level: p.level,
        interviewer: p.interviewerUserId?.toString() || '',
        date: formattedDate,
        time: formattedTime,
        notes: p.interviewNotes || p.feedbackComments || '',
        status: levelStatus, // Add status to each level detail
        completedAt: p.completedAt, // Store completion time
        scheduledAt: p.scheduledAt // Store scheduled time
      };
    });

    // Determine resource type from interview data
    const resourceType = interview.resourceType || 'internal';

    // FIX: Get the correct candidate ID based on resource type
    let candidateId = '';
    if (resourceType === 'internal' && interview.employeeId) {
      candidateId = interview.employeeId.toString();
    } else if (resourceType === 'external' && interview.candidateId) {
      candidateId = interview.candidateId.toString();
    } else {
      // Fallback to any available ID
      candidateId = (interview.candidateId || interview.employeeId)?.toString() || '';
    }

    setFormData({
      id: interview.id,
      requestId: interview.requestId.replace(/^REQ-0*/, ''),
      candidateId: candidateId, // Use the properly extracted candidate ID
      interviewLevels: interview.interviewLevels,
      levelsDetails: details,
      originalLevels: interview.interviewLevels,
      interviewType: interviewType,
      resourceType: resourceType
    });
    setIsEditMode(true);
    setIsAddDialogOpen(true);
  };

  const handleDeleteClick = (interview) => {
    setSelectedInterview(interview);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteSubmit = async () => {
    try {
      const res = await InterviewService.deleteInterview(
        parseInt(selectedInterview.id)
      );
      if (res.data.success) {
        toast.success('Interview deleted successfully');
        setIsDeleteDialogOpen(false);
        loadInterviews();
      } else {
        toast.error(
          'Failed to delete interview: ' + res.data.errors.join(', ')
        );
      }
    } catch (e) {
      console.error(e);
      toast.error('Error deleting interview');
    }
  };

  /* --------------------------------------------------------------------- */
  /*  ONBOARDING STATUS CHANGE                                             */
  /* --------------------------------------------------------------------- */
  const handleOnboardingStatusChange = async (interviewId, newLabel) => {
    const candidateName = interviews.find(i => i.id === interviewId)?.candidateName || 'Candidate';

    const confirmResult = await Swal.fire({
      title: 'Change Onboarding Status?',
      text: `Set status to "${newLabel}" for ${candidateName}?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Yes, Update',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#2563eb',
      cancelButtonColor: '#6b7280',
    });

    if (!confirmResult.isConfirmed) return;

    try {
      const response = await InterviewService.updateOnboardingStatus(
        parseInt(interviewId),
        newLabel,
        ''
      );

      if (response.data.success) {
        let swalConfig = {
          title: '',
          text: '',
          icon: 'success',
          confirmButtonColor: '#10b981',
        };

        const lowerLabel = newLabel.toLowerCase();

        if (lowerLabel.includes('onboarded')) {
          swalConfig.title = 'Candidate Onboarded!';
          swalConfig.text = `${candidateName} has been successfully onboarded.`;
        } else if (lowerLabel.includes('obc')) {
          swalConfig.title = 'OBC Status Updated';
          swalConfig.text = `${candidateName}'s OBC status is now ${newLabel}.`;
        } else if (lowerLabel.includes('hold')) {
          swalConfig.title = 'On Hold';
          swalConfig.text = `${candidateName}'s onboarding is now on hold.`;
        } else {
          swalConfig.title = 'Status Updated';
          swalConfig.text = `${candidateName}'s Onboarding status changed to ${newLabel}`;
        }

        await Swal.fire(swalConfig);

        setInterviews(prev =>
          prev.map(i => (i.id === interviewId ? { ...i, onboardingStatus: newLabel } : i))
        );
      } else {
        const errMsg = response.data.errors?.join(', ') || 'Unknown server error';
        await Swal.fire({
          title: 'Update Failed',
          text: errMsg,
          icon: 'error',
          confirmButtonColor: '#ef4444',
        });
        loadInterviews();
      }
    } catch (err) {
      const errMsg =
        err.response?.data?.errors?.join(', ') ||
        err.message ||
        'Network error';
      await Swal.fire({
        title: 'Error',
        text: `Error updating status: ${errMsg}`,
        icon: 'error',
        confirmButtonColor: '#ef4444',
      });
      loadInterviews();
    }
  };

  /* --------------------------------------------------------------------- */
  /*  UI HELPERS                                                           */
  /* --------------------------------------------------------------------- */
  const getStatusBadgeColor = (status) => {
    switch (status) {
      case 'Scheduled':
        return 'bg-blue-100 text-blue-800';
      case 'Completed':
        return 'bg-green-100 text-green-800';
      case 'Cancelled':
        return 'bg-red-100 text-red-800';
      case 'Pending Feedback':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getLevelBadgeColor = (result) => {
    switch (result) {
      case 'Cleared': case 'Selected': case 'Interview Selected':
        return 'bg-green-100 text-green-800';
      case 'Not Cleared': case 'Rejected': case 'Interview Rejected':
        return 'bg-red-100 text-red-800';
      case 'Hold':
        return 'bg-orange-100 text-orange-800';
      case 'Pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getResourceTypeBadgeColor = (type) => {
    switch (type) {
      case 'internal':
        return 'bg-blue-100 text-blue-800';
      case 'external':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  /* --------------------------------------------------------------------- */
  /*  DATE RANGE HANDLERS                                                  */
  /* --------------------------------------------------------------------- */
  const handleDateRangeChange = (field, value) => {
    setDateRange(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const clearDateRange = () => {
    setDateRange({ start: '', end: '' });
  };

  const isDateRangeActive = dateRange.start || dateRange.end;

  /* --------------------------------------------------------------------- */
  /*  FILTERING & PAGINATION                                               */
  /* --------------------------------------------------------------------- */
  const filteredInterviews = interviews.filter((i) => {
    const matchSearch =
      i.candidateName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      i.interviewer.toLowerCase().includes(searchTerm.toLowerCase()) ||
      i.requestId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      i.createdBy.toLowerCase().includes(searchTerm.toLowerCase());

    const matchStatus = filterStatus === 'all' || i.status === filterStatus;
    const matchReqId = filterRequestId === 'all' || i.requestId === filterRequestId;

    const matchResourceType = filterResourceType === 'all' ||
      i.resourceType === filterResourceType;

    // Request Type filter
    const matchRequestType = filterRequestType === 'all' ||
      (filterRequestType === 'OPP' && i.interviewType === 'OPP') ||
      (filterRequestType === 'DR' && i.interviewType === 'DR');

    // Date Range filter
    let matchDateRange = true;
    if (isDateRangeActive && i.submittedDate) {
      const interviewDate = new Date(i.submittedDate);

      if (dateRange.start) {
        const startDate = new Date(dateRange.start);
        startDate.setHours(0, 0, 0, 0);
        if (interviewDate < startDate) {
          matchDateRange = false;
        }
      }

      if (dateRange.end && matchDateRange) {
        const endDate = new Date(dateRange.end);
        endDate.setHours(23, 59, 59, 999);
        if (interviewDate > endDate) {
          matchDateRange = false;
        }
      }
    }

    return matchSearch && matchStatus && matchReqId && matchRequestType &&
      matchResourceType && matchDateRange;
  });

  const totalPages = Math.ceil(filteredInterviews.length / rowsPerPage);
  const paginated = filteredInterviews.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  const uniqueRequestIds = [...new Set(interviews.map((i) => i.requestId))];

  const stats = {
    total: interviews.length,
    scheduled: interviews.filter((i) => i.status === 'Scheduled').length,
    completed: interviews.filter((i) => i.overallStatus === 'Interview Selected').length,
    cancelled: interviews.filter((i) => i.overallStatus === 'Interview Rejected').length,
  };

  const handleViewInterview = (interview) => {
    setSelectedInterview(interview);
    setIsViewDialogOpen(true);
  };

  // Add this function after the other helper functions, before the return statement
  const isLevelCompleted = (level) => {
    if (!isEditMode || !selectedInterview) return false;

    const levelDetail = formData.levelsDetails.find(d => d.level === level);
    if (!levelDetail) return false;

    // Check if status is "Selected" or "Rejected"
    return levelDetail.status === 'Selected' || levelDetail.status === 'Rejected';
  };

  // Add function to check if previous level is rejected
  const isPreviousLevelRejected = (level) => {
    if (!isEditMode) return false;

    const levelIndex = interviewLevelsOptions.indexOf(level);
    if (levelIndex <= 0) return false;

    const previousLevel = interviewLevelsOptions[levelIndex - 1];
    const previousLevelDetail = formData.levelsDetails.find(d => d.level === previousLevel);

    return previousLevelDetail?.status === 'Rejected';
  };

  /* --------------------------------------------------------------------- */
  /*  RENDER                                                               */
  /* --------------------------------------------------------------------- */
  return (
    <div className="space-y-6">
      {/* ---------- Header ---------- */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Interviews Management</CardTitle>
            <CardDescription>
              Manage and schedule interviews for resource requests
            </CardDescription>
          </div>
          <Button
            className="bg-blue-600 hover:bg-blue-700"
            onClick={() => {
              setFormData({
                id: '',
                requestId: '',
                candidateId: '',
                interviewLevels: [],
                levelsDetails: [],
                originalLevels: [],
                interviewType: 'demand',
                resourceType: 'internal'
              });
              setIsEditMode(false);
              setIsAddDialogOpen(true);
            }}
          >
            <Plus className="mr-2 h-4 w-4" /> Schedule Interview
          </Button>
        </CardHeader>

        <CardContent>
          {/* ---------- Stats ---------- */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card className="bg-blue-50 border-blue-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-blue-800">
                  Total Interviews
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <Users className="h-8 w-8 text-blue-600 mr-2" />
                  <p className="text-2xl font-bold text-blue-800">
                    {stats.total}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-green-50 border-green-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-green-800">
                  Scheduled
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <CalendarIcon className="h-8 w-8 text-green-600 mr-2" />
                  <p className="text-2xl font-bold text-green-800">
                    {stats.scheduled}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-yellow-50 border-yellow-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-yellow-800">
                  Overall Selected
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <Award className="h-8 w-8 text-yellow-600 mr-2" />
                  <p className="text-2xl font-bold text-yellow-800">
                    {stats.completed}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-red-50 border-red-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-red-800">
                  Rejected
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <Trash className="h-8 w-8 text-red-600 mr-2" />
                  <p className="text-2xl font-bold text-red-800">
                    {stats.cancelled}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* ---------- Filters ---------- */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <Input
              placeholder="Search by candidate, interviewer, request ID or created by"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full md:w-[300px] border-gray-300 focus:ring-blue-500"
            />
            <Select value={filterResourceType} onValueChange={setFilterResourceType}>
              <SelectTrigger className="w-full md:w-[180px] border-gray-300 focus:ring-blue-500">
                <SelectValue placeholder="Resource Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Resources</SelectItem>
                <SelectItem value="internal">Internal</SelectItem>
                <SelectItem value="external">External</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-full md:w-[180px] border-gray-300 focus:ring-blue-500">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent className="max-h-40 overflow-y-auto">
                <SelectItem value="all">All Statuses</SelectItem>
                {statuses.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterRequestType} onValueChange={setFilterRequestType}>
              <SelectTrigger className="w-full md:w-[180px] border-gray-300 focus:ring-blue-500">
                <SelectValue placeholder="Request Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Request Types</SelectItem>
                <SelectItem value="OPP">Opportunity</SelectItem>
                <SelectItem value="DR">Demand</SelectItem>
              </SelectContent>
            </Select>

            {/* Custom Date Range Picker */}
            <div className="flex flex-col space-y-2 w-full md:w-auto">
              <div className="flex items-center space-x-2">
                <div className="flex items-center space-x-2 flex-1">
                  <Input
                    type="date"
                    placeholder="Start Date"
                    value={dateRange.start}
                    onChange={(e) => handleDateRangeChange('start', e.target.value)}
                    className="w-30 border-gray-300 focus:ring-blue-500"
                  />
                  <span className="text-gray-500">to</span>
                  <Input
                    type="date"
                    placeholder="End Date"
                    value={dateRange.end}
                    onChange={(e) => handleDateRangeChange('end', e.target.value)}
                    className="w-30 border-gray-300 focus:ring-blue-500"
                  />
                </div>
                {isDateRangeActive && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearDateRange}
                    className="h-9 w-9 p-0 text-gray-500 hover:text-gray-700"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* ---------- Column Reorder Hint ---------- */}
          <div className="flex items-center justify-end mb-2">
            <ColumnOrderResetButton onReset={resetInterviewCols} />
          </div>

          {/* ---------- Table ---------- */}
          {paginated.length > 0 ? (
            <div className="relative">
              <div className="max-h-[400px] overflow-y-auto scrollbar-thin">
                <DndContext
                  sensors={interviewSensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleInterviewColDragEnd}
                >
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <SortableContext
                          items={interviewColOrder}
                          strategy={horizontalListSortingStrategy}
                        >
                          {interviewColOrder.map((colId) => (
                            <DraggableTableHead
                              key={colId}
                              id={colId}
                              label={INTERVIEW_COLUMN_LABELS[colId]}
                            />
                          ))}
                        </SortableContext>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginated.map((i) => (
                        <TableRow key={i.id}>
                          {interviewColOrder.map((colId) => {
                            switch (colId) {
                              case 'type':
                                return (
                                  <TableCell key={colId}>
                                    <Badge className={
                                      i.interviewType === 'OPP'
                                        ? 'bg-purple-100 text-purple-800'
                                        : 'bg-indigo-100 text-indigo-800'
                                    }>
                                      {i.interviewType}
                                    </Badge>
                                  </TableCell>
                                );
                              case 'date':
                                return (
                                  <TableCell key={colId}>
                                    {i.submittedDate && (
                                      <p className="text-sm text-gray-500">
                                        {new Date(i.submittedDate).toLocaleDateString()}
                                      </p>
                                    )}
                                  </TableCell>
                                );
                              case 'candidate':
                                return (
                                  <TableCell key={colId}>
                                    <div>
                                      <div className="flex items-center">
                                        <User className="mr-2 h-4 w-4 text-gray-500" />
                                        {i.candidateName}
                                      </div>
                                      <p className="text-sm text-gray-500">{i.candidateEmail}</p>
                                    </div>
                                  </TableCell>
                                );
                              case 'levels':
                                return (
                                  <TableCell key={colId}>
                                    <div className="space-y-1">
                                      {i.interviewLevels.map((level) => {
                                        const currentStatus = i.levelStatus[level] || 'Pending';
                                        const currentResult = i.levelResults[level] || 'Pending';
                                        return (
                                          <div key={level} className="flex items-center gap-2">
                                            <span className="text-xs font-medium w-6">{level}</span>
                                            {i.interviewType === 'DR' && (currentStatus === 'Scheduled' || currentResult === 'Pending') ? (
                                              <Select value={currentResult} onValueChange={(val) => openLevelStatusModal(i, level, val)}>
                                                <SelectTrigger className="h-7 w-28 text-xs"><SelectValue placeholder="Update" /></SelectTrigger>
                                                <SelectContent>
                                                  {interviewStatusOptions.map((opt) => (
                                                    <SelectItem key={opt.code} value={opt.code} className="text-xs">{opt.label || opt.code}</SelectItem>
                                                  ))}
                                                </SelectContent>
                                              </Select>
                                            ) : (
                                              <Badge className={getStatusBadgeColor(currentResult)}>{currentResult}</Badge>
                                            )}
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </TableCell>
                                );
                              case 'overall':
                                return (
                                  <TableCell key={colId}>
                                    <Badge className={getLevelBadgeColor(i.overallStatus)}>{i.overallStatus}</Badge>
                                  </TableCell>
                                );
                              case 'resources':
                                return (
                                  <TableCell key={colId}>
                                    <Badge className={getResourceTypeBadgeColor(i.resourceType || 'internal')}>
                                      {i.resourceType === 'internal' ? 'Internal' : i.resourceType === 'external' ? 'External' : 'Unknown'}
                                    </Badge>
                                  </TableCell>
                                );
                              case 'onboard':
                                return (
                                  <TableCell key={colId}>
                                    <Select
                                      value={i.onboardingStatus}
                                      onValueChange={(val) => handleOnboardingStatusChange(i.id, val)}
                                      disabled={i.overallStatus && i.overallStatus.toLowerCase().includes('rejected')}
                                    >
                                      <SelectTrigger className="w-[180px] border-gray-300 focus:ring-blue-500">
                                        <SelectValue placeholder="Select status" />
                                      </SelectTrigger>
                                      <SelectContent className="max-h-40 overflow-y-auto">
                                        {onboardingStatuses.map((s) => (
                                          <SelectItem key={s.code} value={s.label}>{s.label}</SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </TableCell>
                                );
                              case 'actions':
                                return (
                                  <TableCell key={colId}>
                                    <div className="flex space-x-2">
                                      <Button variant="ghost" size="sm" onClick={() => handleViewInterview(i)} className="text-blue-600 hover:text-blue-700"><FileText className="h-4 w-4" /></Button>
                                      <Button variant="ghost" size="sm" onClick={() => handleEditInterview(i)} className="text-yellow-600 hover:text-yellow-700"><Pencil className="h-4 w-4" /></Button>
                                      <Button variant="ghost" size="sm" onClick={() => handleDeleteClick(i)} className="text-red-600 hover:text-red-700"><Trash className="h-4 w-4" /></Button>
                                    </div>
                                  </TableCell>
                                );
                              default:
                                return <TableCell key={colId} />;
                            }
                          })}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </DndContext>
              </div>

              {/* ---------- Pagination ---------- */}
              <div className="flex items-center justify-between mt-4">
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600">
                    Rows per page:
                  </span>
                  <Select
                    value={rowsPerPage.toString()}
                    onValueChange={(v) => {
                      setRowsPerPage(Number(v));
                      setCurrentPageState(1);
                    }}
                  >
                    <SelectTrigger className="w-[70px] border-gray-300 focus:ring-blue-500">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[5, 10, 20, 50].map((n) => (
                        <SelectItem key={n} value={n.toString()}>
                          {n}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setCurrentPageState((p) => Math.max(p - 1, 1))
                    }
                    disabled={currentPage === 1}
                    className="border-gray-300 text-gray-600 hover:bg-gray-100"
                  >
                    <ChevronLeft className="h-4 w-4" /> Previous
                  </Button>
                  <span className="text-sm text-gray-600">
                    Page {currentPage} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setCurrentPageState((p) => Math.min(p + 1, totalPages))
                    }
                    disabled={currentPage === totalPages}
                    className="border-gray-300 text-gray-600 hover:bg-gray-100"
                  >
                    Next <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <AlertCircle className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-1">
                No interviews found
              </h3>
              <p className="text-sm text-gray-500">
                {searchTerm || filterStatus !== 'all' || filterRequestId !== 'all' || filterRequestType !== 'all' || isDateRangeActive
                  ? 'No interviews match your criteria.'
                  : 'Get started by scheduling an interview for an approved resource request.'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ====================  LEVEL STATUS UPDATE MODAL - FEEDBACK ONLY  ==================== */}
      <Dialog open={isLevelModalOpen} onOpenChange={setIsLevelModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Feedback Notes</DialogTitle>
            <DialogDescription>
              Adding feedback for <strong>{selectedLevel}</strong> level - Status: <strong>{selectedLevelResult}</strong>
              {selectedLevelInterview && (
                <div className="mt-2 text-sm">
                  <p><strong>Candidate:</strong> {selectedLevelInterview.candidateName}</p>
                  <p><strong>Request:</strong> {selectedLevelInterview.requestId}</p>
                </div>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div>
              <Label>Feedback Notes *</Label>
              <Textarea
                value={levelNotes}
                onChange={(e) => setLevelNotes(e.target.value)}
                placeholder="Enter your feedback notes here..."
                className="border-gray-300 focus:ring-blue-500 min-h-[100px]"
              />
              <p className="text-xs text-gray-500 mt-1">
                The status <strong>{selectedLevelResult}</strong> will be applied along with your feedback.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsLevelModalOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleLevelStatusUpdate}
              disabled={!levelNotes.trim()}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Submit Feedback
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-4xl w-[95vw] max-w-[95vw] max-h-[90vh] flex flex-col p-0 overflow-hidden">
          <DialogHeader className="p-6 pb-4 border-b">
            <DialogTitle>
              {isEditMode ? 'Edit Interview' : 'Schedule New Interview'}
            </DialogTitle>
            <DialogDescription>
              {isEditMode
                ? 'Update the interview details.'
                : 'Select a resource request and candidate to schedule an interview.'}
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
            {/* General Error Display */}
            {formErrors.general && (
              <div
                className="bg-red-50 border border-red-200 rounded-md p-4 md:col-span-2"
                data-general-error="true"
              >
                <div className="flex items-center">
                  <AlertCircle className="h-5 w-5 text-red-400 mr-2" />
                  <p className="text-red-800 text-sm font-medium">Unable to schedule interview</p>
                </div>
                <p className="text-red-700 text-sm mt-1">{formErrors.general}</p>
              </div>
            )}

            {/* Interview Type */}
            {!isEditMode && (
              <div>
                <Label className="block mb-1">Interview Type *</Label>
                <Select
                  value={formData.interviewType}
                  onValueChange={(v) => {
                    handleFormChange('interviewType', v);
                    clearFieldError('general');
                  }}
                >
                  <SelectTrigger className="border-gray-300 focus:ring-blue-500">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="opportunity">Opportunity</SelectItem>
                    <SelectItem value="demand">Demand</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Demand Selection - NEW FIELD for Demand Interviews */}
            {!isEditMode && formData.interviewType === 'demand' && (
              <div data-error={!!formErrors.demandId}>
                <Label className="block mb-1">Demand *</Label>
                <Select
                  value={formData.demandId}
                  onValueChange={(v) => {
                    handleFormChange('demandId', v);
                    clearFieldError('demandId');
                  }}
                >
                  <SelectTrigger className={`border-gray-300 focus:ring-blue-500 ${formErrors.demandId ? 'border-red-500' : ''
                    }`}>
                    <SelectValue placeholder="Select demand" />
                  </SelectTrigger>
                  <SelectContent className="max-h-40 overflow-y-auto">
                    {allDemands.filter(d => d && (d.demandId || d.demandid)).map((d) => (
                      <SelectItem key={(d.demandId || d.demandid)} value={(d.demandId || d.demandid).toString()}>
                        {`${(d.demandTitle || d.demandtitle)}${d.clientName ? ` (${d.clientName})` : ''}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {formErrors.demandId && (
                  <p className="text-red-600 text-sm mt-1 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {formErrors.demandId}
                  </p>
                )}
              </div>
            )}

            {/* Resource Type */}
            <div>
              <Label className="block mb-1" >Resource Type *</Label>
              <Select
                value={formData.resourceType}
                onValueChange={(v) => {
                  handleFormChange('resourceType', v);
                  clearFieldError('general');
                }}
                disabled={isEditMode}
              >
                <SelectTrigger className="border-gray-300 focus:ring-blue-500">
                  <SelectValue placeholder="Select resource type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="internal">Internal Resource</SelectItem>
                  <SelectItem value="external">External Resource</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500 mt-1">
                {formData.resourceType === 'internal'
                  ? 'Internal resources are bench employees from your organization.'
                  : 'External resources are candidates from outside your organization.'}
              </p>
            </div>

            {/* Resource Request */}
            <div data-error={!!formErrors.requestId}>
              <Label className="block mb-1" htmlFor="requestId">Resource Request *</Label>
              {isEditMode ? (
                <div className="space-y-2">
                  <div className="p-3 border border-gray-300 rounded-md bg-gray-50">
                    <div className="flex items-center">
                      <FileText className="h-5 w-5 text-gray-500 mr-2" />
                      <div>
                        <p className="font-medium text-gray-900">
                          {formData.interviewType === 'demand'
                            ? selectedInterview?.candidateName || 'Unknown Candidate'
                            : selectedInterview?.groupTitle || selectedInterview?.projectName || 'Unknown Opportunity'
                          }
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          {formData.interviewType === 'demand' ? 'Demand Request' : 'Opportunity Request'}
                        </p>
                      </div>
                    </div>
                  </div>
                  <input type="hidden" value={formData.requestId} />
                  <p className="text-xs text-gray-500 italic">
                    Resource request cannot be changed in edit mode
                  </p>
                </div>
              ) : (
                <Select
                  value={formData.requestId}
                  onValueChange={(v) => {
                    handleFormChange('requestId', v);
                    clearFieldError('requestId');
                  }}
                  disabled={formData.interviewType === 'demand' && !formData.demandId}
                >
                  <SelectTrigger className={`border-gray-300 focus:ring-blue-500 ${formErrors.requestId ? 'border-red-500' : ''
                    }`}>
                    <SelectValue placeholder="Select request" />
                  </SelectTrigger>
                  <SelectContent className="max-h-40 overflow-y-auto">
                    {formData.interviewType === 'demand'
                      ? (demandResourceRequests || [])
                        .filter(r => !formData.resourceType || (r?.resourceType?.toLowerCase() === formData.resourceType.toLowerCase()))
                        .map((r) => {
                          if (!r || !r.requestId) return null;
                          return (
                            <SelectItem key={r.requestId} value={r.requestId.toString()}>
                              {`${r.candidateName || 'Unknown'} (${r.resourceType || 'Unknown'})`}
                            </SelectItem>
                          );
                        })
                      : activeOpportunityRequests.map((r) => (
                        <SelectItem key={r.requestId} value={r.requestId.toString()}>
                          {r.groupTitle || r.projectName}
                        </SelectItem>
                      ))
                    }
                  </SelectContent>
                </Select>
              )}
              {formErrors.requestId && (
                <p className="text-red-600 text-sm mt-1 flex items-center">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  {formErrors.requestId}
                </p>
              )}
            </div>

            {/* Candidate - Updated to show based on resource type */}
            <div data-error={!!formErrors.candidateId}>
              <Label className="block mb-1" htmlFor="candidateId">Candidate *</Label>

              {/* In edit mode or demand mode, we might want to just show selected candidate info */}
              {isEditMode || formData.interviewType === 'demand' ? (
                <div className="space-y-2">
                  <div className="p-3 border border-gray-300 rounded-md bg-gray-50">
                    <div className="flex items-center">
                      <User className="h-5 w-5 text-gray-500 mr-2" />
                      <div>
                        <p className="font-medium text-gray-900">
                          {isEditMode
                            ? (selectedInterview?.candidateName || 'Unknown Candidate')
                            : (
                              formData.resourceType === 'internal'
                                ? availableResources.find(r => r.id.toString() === formData.candidateId)?.name
                                : externalResources.find(r => r.id.toString() === formData.candidateId)?.name
                            ) || 'No Candidate Selected'
                          }
                        </p>
                        <p className="text-sm text-gray-500">
                          {isEditMode
                            ? (selectedInterview?.candidateEmail || 'No email')
                            : (
                              formData.resourceType === 'internal'
                                ? availableResources.find(r => r.id.toString() === formData.candidateId)?.email
                                : externalResources.find(r => r.id.toString() === formData.candidateId)?.email
                            ) || ''
                          }
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          {formData.resourceType === 'internal' ? 'Internal Resource' : 'External Resource'}
                        </p>
                      </div>
                    </div>
                  </div>
                  <input type="hidden" value={formData.candidateId} />
                  <p className="text-xs text-gray-500 italic">
                    {isEditMode ? 'Candidate cannot be changed in edit mode' : 'Candidate is pre-selected for Demand Interviews'}
                  </p>
                </div>
              ) : (
                <>
                  {isLoadingExternalResources && formData.resourceType === 'external' ? (
                    <div className="flex items-center justify-center p-4 border border-gray-300 rounded-md">
                      <p className="text-gray-500">Loading external resources...</p>
                    </div>
                  ) : (
                    <Select
                      value={formData.candidateId}
                      onValueChange={(v) => {
                        handleFormChange('candidateId', v);
                        clearFieldError('candidateId');
                      }}
                      disabled={isEditMode || (formData.resourceType === 'external' && externalResources.length === 0)}
                    >
                      <SelectTrigger className={`border-gray-300 focus:ring-blue-500 ${formErrors.candidateId ? 'border-red-500' : ''
                        }`}>
                        <SelectValue placeholder={
                          formData.resourceType === 'internal'
                            ? "Select internal candidate"
                            : "Select external candidate"
                        } />
                      </SelectTrigger>
                      <SelectContent className="max-h-40 overflow-y-auto">
                        {formData.resourceType === 'internal' ? (
                          availableResources.map((c) => (
                            <SelectItem key={c.id} value={c.id.toString()}>
                              {c.name} ({c.email})
                            </SelectItem>
                          ))
                        ) : (
                          externalResources.length > 0 ? (
                            externalResources.map((c) => (
                              <SelectItem key={c.id} value={c.id.toString()}>
                                {c.name} ({c.email})
                              </SelectItem>
                            ))
                          ) : (
                            <div className="p-4 text-center text-gray-500">
                              No external resources available
                            </div>
                          )
                        )}
                      </SelectContent>
                    </Select>
                  )}
                </>
              )}

              {formErrors.candidateId && (
                <p className="text-red-600 text-sm mt-1 flex items-center">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  {formErrors.candidateId}
                </p>
              )}

              {!isEditMode && formData.resourceType === 'external' && externalResources.length === 0 && !isLoadingExternalResources && (
                <p className="text-yellow-600 text-sm mt-1 flex items-center">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  No external resources found. Please add external resources first.
                </p>
              )}
            </div>

            {/* Interview Levels */}
            <div data-error={!!formErrors.interviewLevels} className="md:col-span-2">
              <Label>Interview Levels *</Label>
              <div className="flex flex-wrap gap-4 mt-2">
                {interviewLevelsOptions.map((lvl) => {
                  const levelDetail = formData.levelsDetails.find(d => d.level === lvl);
                  const isCompleted = isLevelCompleted(lvl);
                  const isPrevRejected = isPreviousLevelRejected(lvl);
                  const isDisabled = isCompleted || isPrevRejected;
                  const isChecked = formData.interviewLevels.includes(lvl);

                  // For L1, only disable if completed
                  // For L2/L3, disable if completed OR previous level is rejected
                  let disableReason = '';
                  if (isCompleted) {
                    disableReason = `(Status: ${levelDetail?.status})`;
                  } else if (isPrevRejected) {
                    disableReason = '(Previous level rejected)';
                  }

                  return (
                    <div key={lvl} className="flex items-center">
                      <Checkbox
                        id={`level-${lvl}`}
                        checked={isChecked}
                        onCheckedChange={(checked) => {
                          if (isDisabled && !isChecked) return; // Don't allow checking if disabled

                          let newLvls = [...formData.interviewLevels];
                          if (checked) {
                            // Add the selected level
                            if (!newLvls.includes(lvl)) newLvls.push(lvl);

                            // Add prerequisite levels
                            if (lvl === 'L2' && !newLvls.includes('L1')) {
                              newLvls.push('L1');
                            }
                            if (lvl === 'L3') {
                              if (!newLvls.includes('L2')) newLvls.push('L2');
                              if (!newLvls.includes('L1')) newLvls.push('L1');
                            }
                          } else {
                            // Remove the deselected level
                            newLvls = newLvls.filter((l) => l !== lvl);

                            // Remove dependent levels when deselected
                            if (lvl === 'L1') {
                              // If L1 is removed, remove L2 and L3
                              newLvls = newLvls.filter((l) => l !== 'L2' && l !== 'L3');
                            } else if (lvl === 'L2') {
                              // If L2 is removed, remove L3
                              newLvls = newLvls.filter((l) => l !== 'L3');
                            }
                            // If L3 is removed, keep L1 and L2 (no change needed)
                          }
                          handleFormChange('interviewLevels', newLvls);
                          clearFieldError('interviewLevels');
                        }}
                        disabled={isDisabled}
                        className={isDisabled ? 'opacity-50 cursor-not-allowed' : ''}
                      />
                      <label
                        htmlFor={`level-${lvl}`}
                        className={`ml-2 text-sm font-medium ${isDisabled ? 'text-gray-400' : 'text-gray-700'}`}
                      >
                        {lvl}
                        {disableReason && (
                          <span className="ml-1 text-xs text-red-500">{disableReason}</span>
                        )}
                      </label>
                    </div>
                  );
                })}
              </div>
              {formErrors.interviewLevels && (
                <p className="text-red-600 text-sm mt-1 flex items-center">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  {formErrors.interviewLevels}
                </p>
              )}
            </div>

            {/* Level Details */}
            {formData.interviewLevels.map((lvl) => {
              const levelDetail = formData.levelsDetails.find((d) => d.level === lvl);
              const levelErrors = formErrors.levelsDetails[lvl] || {};

              // Determine if fields should be disabled based on status
              const isDisabled = isLevelCompleted(lvl);

              return (
                <div
                  key={lvl}
                  className="space-y-3 border rounded-md bg-gray-50 p-4 md:col-span-2"
                  data-error={Object.keys(levelErrors).length > 0}
                >
                  <div className="flex justify-between items-center">
                    <Label className="text-md font-semibold">{lvl} Details</Label>
                    {isDisabled && (
                      <div className="flex items-center gap-2">
                        <Badge className={
                          levelDetail?.status === 'Selected'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }>
                          {levelDetail?.status}
                        </Badge>
                        <span className="text-xs text-gray-500">
                          Completed on: {levelDetail?.completedAt ?
                            levelDetail.completedAt.split(' ')[0] :
                            'N/A'}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Interviewer – only for Opportunity */}
                  {formData.interviewType === 'opportunity' && (
                    <div>
                      <Label className="block mb-1">Interviewer {isDisabled ? '' : '*'}</Label>
                      <Select
                        value={levelDetail?.interviewer || ''}
                        onValueChange={(v) => {
                          handleLevelChange(lvl, 'interviewer', v);
                          clearLevelError(lvl);
                        }}
                        disabled={isDisabled}
                      >
                        <SelectTrigger className={`border-gray-300 focus:ring-blue-500 ${levelErrors.interviewer ? 'border-red-500' : ''
                          } ${isDisabled ? 'bg-gray-100 cursor-not-allowed' : ''}`}>
                          <SelectValue placeholder="Select interviewer" />
                        </SelectTrigger>
                        <SelectContent>
                          {systemInterviewers.map((i) => (
                            <SelectItem key={i.id} value={i.id.toString()}>
                              {i.displayName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {levelErrors.interviewer && (
                        <p className="text-red-600 text-sm mt-1 flex items-center">
                          <AlertCircle className="h-4 w-4 mr-1" />
                          {levelErrors.interviewer}
                        </p>
                      )}
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label className="block mb-1">Date {isDisabled ? '' : '*'}</Label>
                      <Input
                        type="date"
                        value={levelDetail?.date || ''}
                        onChange={(e) => {
                          handleLevelChange(lvl, 'date', e.target.value);
                          clearLevelError(lvl);
                        }}
                        min={new Date().toISOString().split('T')[0]}
                        className={`block w-full h-10 border-gray-300 focus:ring-blue-500 ${levelErrors.date ? 'border-red-500' : ''
                          } ${isDisabled ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                        disabled={isDisabled}
                      />
                      {levelErrors.date && (
                        <p className="text-red-600 text-sm mt-1 flex items-center">
                          <AlertCircle className="h-4 w-4 mr-1" />
                          {levelErrors.date}
                        </p>
                      )}
                    </div>
                    <div>
                      <Label className="block mb-1">Time {isDisabled ? '' : '*'}</Label>
                      <Input
                        type="time"
                        value={levelDetail?.time || ''}
                        onChange={(e) => {
                          handleLevelChange(lvl, 'time', e.target.value);
                          clearLevelError(lvl);
                        }}
                        className={`block w-full h-10 border-gray-300 focus:ring-blue-500 ${levelErrors.time ? 'border-red-500' : ''
                          } ${isDisabled ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                        disabled={isDisabled}
                      />
                      {levelErrors.time && (
                        <p className="text-red-600 text-sm mt-1 flex items-center">
                          <AlertCircle className="h-4 w-4 mr-1" />
                          {levelErrors.time}
                        </p>
                      )}
                    </div>
                  </div>

                  <div>
                    <Label className="block mb-1">Notes</Label>
                    <Textarea
                      value={levelDetail?.notes || ''}
                      onChange={(e) =>
                        handleLevelChange(lvl, 'notes', e.target.value)
                      }
                      placeholder="Enter notes..."
                      className={`border-gray-300 focus:ring-blue-500 ${isDisabled ? 'bg-gray-100 cursor-not-allowed' : ''
                        }`}
                      disabled={isDisabled}
                    />
                    {isDisabled && levelDetail?.notes && (
                      <p className="text-xs text-gray-500 mt-1">
                        Original feedback: {levelDetail.notes}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <DialogFooter className="sticky bottom-0 bg-white p-4 border-t flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setIsAddDialogOpen(false);
                setFormErrors({
                  general: '',
                  requestId: '',
                  candidateId: '',
                  interviewLevels: '',
                  levelsDetails: {}
                });
              }}
              className="border-gray-300 text-gray-700 hover:bg-gray-100"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmitInterview}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isEditMode ? 'Update' : 'Schedule'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ====================  VIEW DIALOG  ==================== */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="sm:max-w-[700px] overflow-y-auto max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Interview Details</DialogTitle>
          </DialogHeader>
          {selectedInterview && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-700">
                    Interview Type
                  </Label>
                  <Badge className={
                    selectedInterview.interviewType === 'OPP'
                      ? 'bg-purple-100 text-purple-800'
                      : 'bg-indigo-100 text-indigo-800'
                  }>
                    {selectedInterview.interviewType}
                  </Badge>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700">
                    Resource Type
                  </Label>
                  <Badge className={getResourceTypeBadgeColor(selectedInterview.resourceType)}>
                    {selectedInterview.resourceType === 'internal' ? 'Internal Resource' :
                      selectedInterview.resourceType === 'external' ? 'External Resource' : 'Unknown'}
                  </Badge>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700">
                    Interview ID
                  </Label>
                  <p className="text-sm text-gray-600">{selectedInterview.id}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700">
                    Request ID
                  </Label>
                  <p className="text-sm text-gray-600">{selectedInterview.requestId}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700">
                    Candidate
                  </Label>
                  <p className="text-sm text-gray-600">{selectedInterview.candidateName}</p>
                  <p className="text-sm text-gray-500">{selectedInterview.candidateEmail}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700">
                    Created By
                  </Label>
                  <p className="text-sm text-gray-600">{selectedInterview.createdBy}</p>
                  {selectedInterview.submittedDate && (
                    <p className="text-sm text-gray-500">
                      {new Date(selectedInterview.submittedDate).toLocaleDateString()}
                    </p>
                  )}
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700">
                    Client Name
                  </Label>
                  <p className="text-sm text-gray-600">{selectedInterview.accountName}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700">
                    Project
                  </Label>
                  <p className="text-sm text-gray-600">{selectedInterview.projectName}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700">
                    Status
                  </Label>
                  <Badge
                    className={getStatusBadgeColor(selectedInterview.overallStatus)}
                  >
                    {selectedInterview.currentStatus}
                  </Badge>
                </div>
              </div>

              {selectedInterview.interviewLevels.length > 0 && (
                <div>
                  <Label className="text-sm font-medium text-gray-700">
                    Interview Level Results
                  </Label>
                  <Table className="mt-2">
                    <TableHeader className="bg-blue-600 text-white">
                      <TableRow>
                        <TableHead className="text-white border-r border-blue-500">
                          Level
                        </TableHead>
                        <TableHead className="text-white border-r border-blue-500">
                          Interviewer
                        </TableHead>
                        <TableHead className="text-white border-r border-blue-500">
                          Scheduled Date & Time
                        </TableHead>
                        <TableHead className="text-white border-r border-blue-500">
                          Completed Date & Time
                        </TableHead>
                        <TableHead className="text-white border-r border-blue-500">
                          Status
                        </TableHead>
                        <TableHead className="text-white w-1/4">Result & Feedback</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedInterview.interviewLevels.map((lvl) => {
                        const prog = selectedInterview.levelProgress.find(
                          (p) => p.level === lvl
                        );

                        // Format scheduled date/time
                        let scheduledDisplay = 'Not Scheduled';
                        if (prog?.scheduledAt) {
                          const [datePart, timePart] = prog.scheduledAt.split(' ');
                          const [day, month, year] = datePart?.split('-') || [];
                          const [hour, minute] = timePart?.split('-') || [];
                          if (datePart && timePart) {
                            scheduledDisplay = `${day}-${month}-${year} ${hour}:${minute}`;
                          } else if (datePart) {
                            scheduledDisplay = `${day}-${month}-${year}`;
                          }
                        }

                        // Format completed date/time
                        let completedDisplay = 'Not Completed';
                        if (prog?.completedAt) {
                          const [datePart, timePart] = prog.completedAt.split(' ');
                          const [day, month, year] = datePart?.split('-') || [];
                          const [hour, minute] = timePart?.split('-') || [];
                          if (datePart && timePart) {
                            completedDisplay = `${day}-${month}-${year} ${hour}:${minute}`;
                          } else if (datePart) {
                            completedDisplay = `${day}-${month}-${year}`;
                          }
                        }

                        // Get the interviewer name for this specific level
                        const levelInterviewer = prog?.interviewerName || selectedInterview.interviewer || 'Not Assigned';

                        return (
                          <TableRow key={lvl}>
                            <TableCell className="font-medium">{lvl}</TableCell>
                            <TableCell>{levelInterviewer}</TableCell>
                            <TableCell>
                              <div className="text-xs">
                                {scheduledDisplay}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="text-xs">
                                {completedDisplay}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge className={getLevelBadgeColor(selectedInterview.levelStatus[lvl] || 'Pending')}>
                                {selectedInterview.levelStatus[lvl] || 'Pending'}
                              </Badge>
                            </TableCell>
                            <TableCell >
                              {prog?.feedbackComments && (
                                <p className="text-xs text-gray-500 mt-1"   >
                                  {prog.feedbackComments}
                                </p>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}

              {selectedInterview.cancellationReason && (
                <div>
                  <Label className="text-sm font-medium text-gray-700">
                    Cancellation Reason
                  </Label>
                  <p className="text-sm text-gray-600">
                    {selectedInterview.cancellationReason}
                  </p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ====================  DELETE DIALOG  ==================== */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Delete Interview</DialogTitle>
          </DialogHeader>
          <DialogDescription>
            Are you sure you want to delete this interview? This action cannot
            be undone.
          </DialogDescription>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
              className="border-gray-300 text-gray-700 hover:bg-gray-100"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteSubmit}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>



      <style>{`
        .scrollbar-thin {
          scrollbar-width: thin;
          scrollbar-color: #d1d5db #f3f4f6;
        }
        .scrollbar-thin::-webkit-scrollbar {
          width: 6px;
        }
        .scrollbar-thin::-webkit-scrollbar-track {
          background: #f3f4f6;
          border-radius: 3px;
        }
        .scrollbar-thin::-webkit-scrollbar-thumb {
          background: #d1d5db;
          border-radius: 3px;
        }
        .scrollbar-thin::-webkit-scrollbar-thumb:hover {
          background: #9ca3af;
        }
      `}</style>
    </div>
  );
};

export default InterviewsManagement;
