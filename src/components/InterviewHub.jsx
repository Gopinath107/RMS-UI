// src/components/InterviewHub.jsx
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from './ui/card.jsx';
import { Button } from './ui/button.jsx';
import { Badge } from './ui/badge.jsx';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './ui/table.jsx';
import {
  Calendar,
  Clock,
  Users,
  Award,
  ChevronLeft,
  ChevronRight,
  FileText,
} from 'lucide-react';
import { toast } from 'sonner';
import { InterviewService } from '../services/InterviewManagementService.js';
import { Input } from './ui/input.jsx';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select.jsx';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog.jsx';
import ReusableDataView from './common/ReusableDataView.jsx';

const InterviewHub = ({ setCurrentPage }) => {
  const [myInterviews, setMyInterviews] = useState([]);
  const [currentUser, setCurrentUser] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const pageScrollRef = useRef(0);
  const [currentPage, setCurrentPageState] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(5);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedInterviewId, setSelectedInterviewId] = useState(null);
  const [selectedLevel, setSelectedLevel] = useState(null);
  const [selectedResult, setSelectedResult] = useState(null);
  const [notes, setNotes] = useState('');

  const [feedbackModalOpen, setFeedbackModalOpen] = useState(false);
  const [selectedFeedback, setSelectedFeedback] = useState('');

  const [interviewStatusOptions, setInterviewStatusOptions] = useState([]);
  const [noShowModalOpen, setNoShowModalOpen] = useState(false);
const [selectedForNoShow, setSelectedForNoShow] = useState({ interviewId: null, requestId: null });

const openNoShowModal = (interviewId, requestId) => {
  setSelectedForNoShow({ interviewId, requestId });
  setNoShowModalOpen(true);
};

  const getValidSelectValue = (rawValue) => {
    if (!rawValue) return undefined;
    const exists = interviewStatusOptions.some(opt => opt.code === rawValue);
    return exists ? rawValue : undefined;
  };

  const loadInterviewStatuses = useCallback(async () => {
    try {
      const resp = await InterviewService.fetchInterviewStatuses();
      if (resp.data.success) {
        const filtered = resp.data.result.filter(opt => opt.code !== 'Scheduled');
        setInterviewStatusOptions(filtered);
      }
    } catch (err) {
      console.error('Failed to load interview statuses', err);
    }
  }, []);

  useEffect(() => {
    loadInterviewStatuses();
  }, [loadInterviewStatuses]);

  useEffect(() => {
    const userRole = localStorage.getItem('userRole');
    const userName = localStorage.getItem('userName');
    if (userRole && userName) {
      setCurrentUser(userName.toLowerCase());
    } else {
      const defaultUsers = {
        'project-manager': 'pm',
        hr: 'hr',
        pmo: 'pmo',
        'portfolio-manager': 'portfolio',
        'sales-manager': 'sales',
        'interview-panel': 'panel',
      };
      setCurrentUser(defaultUsers[userRole] || 'panel');
    }
  }, []);

  useEffect(() => {
    const handlePageScroll = () => {
      pageScrollRef.current = window.scrollY;
    };
    window.addEventListener('scroll', handlePageScroll);
    return () => window.removeEventListener('scroll', handlePageScroll);
  }, []);

  const loadMyInterviews = useCallback(async () => {
    if (!currentUser) return;
    setIsLoading(true);
    setError(null);
    try {
      const response = await InterviewService.fetchInterviewList();
      if (response.data.success) {
        const apiInterviews = response.data.result;
        const systemRoles = ['pm', 'hr', 'pmo', 'portfolio', 'sales'];

        const loadedInterviews = apiInterviews.map((apiInterview) => {
          const levelProgress = apiInterview.levelProgress || [];

          // Find levels assigned to current user
          const assignedProgress = levelProgress.filter(p =>
            p.interviewerName?.toLowerCase() === currentUser.toLowerCase()
          );
          const assignedLevels = assignedProgress.map(p => p.level);

          const levelResults = {};
          const levelFeedback = {};
          let allEvaluated = true;
          let anyNotCleared = false;

          (apiInterview.interviewLevels || []).forEach((level) => {
            const progress = levelProgress.find(p => p.level === level);
            levelFeedback[level] = progress?.feedbackComments || '';

            if (!progress || progress.status === 'Scheduled') {
              levelResults[level] = 'Pending';
              allEvaluated = false;
            } else if (progress.status === 'Completed') {
              levelResults[level] = progress.feedbackComments?.includes('Not Cleared')
                ? 'Not Cleared'
                : 'Cleared';
            } else if (progress.status === 'Rejected') {
              levelResults[level] = 'Rejected';
              anyNotCleared = true;
            } else if (progress.status === 'Selected') {
              levelResults[level] = 'Selected';
            } else if (progress.status === 'Hold') {
              levelResults[level] = 'Hold';
              anyNotCleared = true;
            } else {
              levelResults[level] = progress.status;
            }
          });

          const allCleared = (apiInterview.interviewLevels || []).every(l =>
            levelResults[l] === 'Cleared' || levelResults[l] === 'Selected'
          );
          const clearanceStatus = anyNotCleared
            ? 'Not Cleared'
            : allEvaluated
              ? (allCleared ? 'Cleared' : 'Not Cleared')
              : 'Pending';

          const status = apiInterview.status || 'Scheduled';

          // Use first assigned level's date/time
          let date = '', time = '';
          if (assignedProgress.length > 0) {
            const first = assignedProgress[0];
            const [datePart = '', timePart = ''] = (first.scheduledAt || '').split(' ');
            const [day, month, year] = datePart.split('-');
            const [hour, minute] = timePart.split('-');
            date = `${day}-${month}-${year}`;
            time = `${hour}:${minute}`;
          }

          return {
            id: apiInterview.interviewId.toString(),
            requestId: apiInterview.requestId
              ? `REQ-${String(apiInterview.requestId).padStart(3, '0')}`
              : 'REQ-000',
            candidateName: apiInterview.employeeName || apiInterview.candidateName,
            candidateEmail: apiInterview.employeeEmail || apiInterview.candidateEmail,
            position: 'Not specified',
            date,
            time,
            status,
            notes: apiInterview.feedback || '',
            resumeUrl: '',
            interviewType: 'HR',
            companyName: apiInterview.companyName || 'Unknown Company',
            clientName: apiInterview.accountName || 'Unknown Client',
            projectName: apiInterview.projectName || 'Unknown Project',
            clearanceStatus,
            cancellationReason: '',
            interviewLevels: apiInterview.interviewLevels || [],
            assignedLevels, // ← Only user's levels
            levelResults,
            levelFeedback,
            candidateId: apiInterview.employeeId || null,
            levelProgress,
            raw: apiInterview,
            ostatus: apiInterview.overallStatus,
            currentStatus: apiInterview.currentStatus || 'Not Available',
          overallNotes: apiInterview.overallNotes || '',
          };
        });

        const assignedInterviews = loadedInterviews.filter((interview) => {
          const levelInterviewers = (interview.levelProgress || [])
            .map(p => p.interviewerName?.toLowerCase())
            .filter(Boolean);

          const isAssignedToAnyLevel = levelInterviewers.includes(currentUser.toLowerCase());
          const isPanelAndNotSystem = currentUser === 'panel' &&
            !systemRoles.some(role => levelInterviewers.includes(role));

          return isAssignedToAnyLevel || isPanelAndNotSystem;
        });

        setMyInterviews(assignedInterviews);
        setTimeout(() => window.scrollTo(0, pageScrollRef.current), 0);
      } else {
        setError('Failed to fetch interviews: ' + response.data.errors.join(', '));
        toast.error('Failed to fetch interviews');
        setMyInterviews([]);
      }
    } catch (error) {
      console.error('Error loading interviews:', error);
      setError('Error loading interviews');
      toast.error('Error loading interviews');
      setMyInterviews([]);
    } finally {
      setIsLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    if (currentUser) loadMyInterviews();
  }, [currentUser, loadMyInterviews]);

  const openFeedbackModal = (interviewId, level, resultCode) => {
    setSelectedInterviewId(interviewId);
    setSelectedLevel(level);
    setSelectedResult(resultCode);
    setNotes('');
    setIsModalOpen(true);
  };

  const handleLevelResultUpdate = async () => {
    if (!selectedInterviewId || !selectedLevel || !selectedResult) return;

    const interview = myInterviews.find(i => i.id === selectedInterviewId);
    if (!interview) return;

    pageScrollRef.current = window.scrollY;

    try {
      const feedback = notes.trim()
        ? `${selectedResult}: ${notes.trim()}`
        : selectedResult;

      const levelProg = interview.levelProgress.find(p => p.level === selectedLevel);
      const interviewerUserID = levelProg ? levelProg.interviewerUserId : null;

      const payload = {
        interviewId: parseInt(selectedInterviewId),
        requestId: parseInt(interview.requestId.replace('REQ-', '')),
        levels: [selectedLevel],
        status: selectedResult,
        interviewerUserID: currentUser === 'panel' ? null : interviewerUserID,
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
        toast.success(`${selectedLevel} to ${selectedResult}`);
        await loadMyInterviews();
      } else {
        toast.error('Failed: ' + response.data.errors.join(', '));
      }
    } catch (error) {
      console.error('Error updating level:', error);
      toast.error('Failed to update result');
    } finally {
      setIsModalOpen(false);
      setSelectedInterviewId(null);
      setSelectedLevel(null);
      setSelectedResult(null);
      setNotes('');
    }
  };

  const showFeedback = (text) => {
    setSelectedFeedback(text);
    setFeedbackModalOpen(true);
  };
  
    /* ---------- NO-SHOW / CANCEL ---------- */
const handleNoShow = async (interviewId, requestId, level) => {
  pageScrollRef.current = window.scrollY;
  try {
    const interview = myInterviews.find(i => i.id === interviewId);
    const feedback = `No show for ${level}`;
    
    const response = await InterviewService.noShow(
      parseInt(interviewId),
      parseInt(requestId.replace('REQ-', '')),
      'Candidate',
      [level],
      feedback
    );
    
    if (response.data.success) {
      toast.success(`Marked ${level} as No-Show`);
      await loadMyInterviews();
    } else {
      toast.error('Failed: ' + response.data.errors.join(', '));
    }
  } catch (error) {
    console.error('No-show error:', error);
    toast.error('Failed to mark no-show');
  }
};

  const handleCancel = async (interviewId, requestId) => {
    pageScrollRef.current = window.scrollY;
    try {
      const response = await InterviewService.cancel(
        interviewId,
        requestId.replace('REQ-', ''),
        'Client conflict'
      );
      if (response.data.success) {
        toast.success('Interview cancelled');
        await loadMyInterviews();
      } else {
        toast.error('Failed: ' + response.data.errors.join(', '));
      }
    } catch (error) {
      console.error('Cancel error:', error);
      toast.error('Failed to cancel');
    }
  };
	
  const filteredInterviews = useMemo(() => {
    return myInterviews.filter((interview) => {
      const matchesSearch = interview.candidateName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        interview.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        interview.projectName.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = filterStatus === 'all' || interview.status === filterStatus;
      return matchesSearch && matchesStatus;
    });
  }, [myInterviews, searchTerm, filterStatus]);

  const totalPages = Math.ceil(filteredInterviews.length / rowsPerPage);
  const paginatedInterviews = filteredInterviews.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );
  const assignedInterviewColumns = [
    { key: 'requestId', label: 'Request ID', render: (interview) => interview.requestId },
    {
      key: 'candidate',
      label: 'Candidate',
      render: (interview) => (
        <div>
          <div className="text-xs sm:text-sm font-medium truncate">{interview.candidateName}</div>
          <div className="text-xs text-gray-500 truncate">{interview.candidateEmail}</div>
        </div>
      ),
    },
    { key: 'clientName', label: 'Client', render: (interview) => interview.clientName },
    {
      key: 'dateTime',
      label: 'Date & Time',
      render: (interview) => (
        <div>
          <div className="flex items-center gap-2 text-xs sm:text-sm">
            <Calendar className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
            <span className="truncate">{interview.date}</span>
          </div>
          <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-500">
            <Clock className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
            <span className="truncate">{interview.time}</span>
          </div>
        </div>
      ),
    },
    {
      key: 'levels',
      label: 'Levels',
      render: (interview) => (
        <div className="space-y-2">
          {interview.assignedLevels.map((level) => {
            const currentResult = interview.levelResults[level] || 'Pending';
            const hasFeedback = !!interview.levelFeedback?.[level]?.trim();
            const levelProg = interview.levelProgress?.find(p => p.level === level);
            const isScheduled = levelProg?.status === 'Scheduled' || currentResult === 'Pending';

            return (
              <div key={level} className="flex items-center gap-2 flex-wrap">
                <span className="text-xs sm:text-sm font-medium min-w-[2rem]">{level}</span>
                {isScheduled ? (
                  <div className="flex items-center gap-1">
                    <Select
                      value={getValidSelectValue(currentResult)}
                      onValueChange={(val) => openFeedbackModal(interview.id, level, val)}
                    >
                      <SelectTrigger className="h-7 w-28 text-xs">
                        <SelectValue placeholder="Result" />
                      </SelectTrigger>
                      <SelectContent>
                        {interviewStatusOptions.map((opt) => (
                          <SelectItem key={opt.code} value={opt.code} className="text-xs">
                            {opt.label || opt.code}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button size="sm" variant="outline" className="h-6 px-2 text-xs" onClick={() => handleNoShow(interview.id, interview.requestId, level)}>
                      No-Show
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-1">
                    <Badge className={getLevelBadgeColor(currentResult)}>
                      {currentResult === 'NoShow' ? 'No-Show' : currentResult}
                    </Badge>
                    {hasFeedback && (
                      <Button variant="ghost" size="icon" className="h-4 w-4 p-0" onClick={() => showFeedback(interview.levelFeedback[level])}>
                        <FileText className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ),
    },
    { key: 'currentStatus', label: 'Current Status', type: 'status', render: (interview) => interview.currentStatus },
    {
      key: 'clearanceStatus',
      label: 'Overall Status',
      type: 'status',
      render: (interview) => (
        <Badge className={getClearanceBadgeColor(interview.clearanceStatus)}>
          <Award className="h-3 w-3 mr-1" />
          {interview.ostatus}
        </Badge>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      type: 'actions',
      hideable: false,
      render: (interview) => interview.status === 'Scheduled' ? (
        <Button size="sm" variant="destructive" className="h-6 px-2 text-xs" onClick={() => handleCancel(interview.id, interview.requestId)}>
          Cancel Interview
        </Button>
      ) : null,
    },
  ];

  const getLevelBadgeColor = (result) => {
    switch (result) {
      case 'Cleared': case 'Selected': case 'Interview Selected': return 'bg-green-100 text-green-800';
      case 'Not Cleared': case 'Rejected': return 'bg-red-100 text-red-800';
          case 'NoShow': 
      return 'bg-purple-100 text-purple-800';
      case 'Hold': return 'bg-orange-100 text-orange-800';
      case 'Pending': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getClearanceBadgeColor = (status) => {
    switch (status) {
      case 'Cleared': return 'bg-green-100 text-green-800';
      case 'Not Cleared': return 'bg-red-100 text-red-800';
      case 'Pending': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h1 className="text-2xl font-bold">Interview Hub</h1>
        <Button
          variant="outline"
          onClick={() => setCurrentPage('dashboard')}
          className="border-gray-300 text-gray-700 hover:bg-gray-100"
        >
          Back to Dashboard
        </Button>
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>My Assigned Interviews</CardTitle>
          <CardDescription>View and manage your upcoming interviews</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Loading interviews...</div>
          ) : error ? (
            <div className="text-center py-8 text-red-600">{error}</div>
          ) : paginatedInterviews.length > 0 ? (
            <div className="overflow-x-auto scrollbar-thin">
              <div className="flex flex-col sm:flex-row gap-4 mb-4">
                <Input
                  placeholder="Search by candidate, client, or project..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="max-w-sm"
                />
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="Scheduled">Scheduled</SelectItem>
                    <SelectItem value="Completed">Completed</SelectItem>
                    <SelectItem value="Cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="overflow-x-auto">
                <ReusableDataView
                  tableKey="interview-hub-table"
                  data={paginatedInterviews}
                  columns={assignedInterviewColumns}
                  rowKey="id"
                  emptyMessage="No interviews assigned"
                  defaultViewMode="table"
                  pagination={{
                    currentPage,
                    totalPages,
                    onPageChange: setCurrentPageState,
                    pageSize: rowsPerPage,
                    onPageSizeChange: (value) => {
                      setRowsPerPage(value);
                      setCurrentPageState(1);
                    },
                    pageSizeOptions: [5, 10, 20, 50],
                    totalItems: filteredInterviews.length,
                  }}
                  tableHeaderClassName="bg-blue-600 text-white"
                />
                {false && <Table>
                  <TableHeader className="bg-blue-600 text-white">
                    <TableRow>
                      <TableHead className="text-white border-r border-blue-500">Request ID</TableHead>
                      <TableHead className="text-white border-r border-blue-500">Candidate</TableHead>
                      <TableHead className="text-white border-r border-blue-500">Client</TableHead>
                      <TableHead className="text-white border-r border-blue-500">Date & Time</TableHead>
                      <TableHead className="text-white border-r border-blue-500">Levels</TableHead>
                      <TableHead className="text-white border-r border-blue-500">Current Status</TableHead>
                      <TableHead className="text-white border-r border-blue-500">Overall Status</TableHead>
                      <TableHead className="text-white">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedInterviews.map((interview) => (
                      <TableRow key={interview.id} className="hover:bg-gray-50">
                        <TableCell className="font-medium border-r border-gray-200">
                          {interview.requestId}
                        </TableCell>
                        <TableCell className="border-r border-gray-200">
                          <div className="text-xs sm:text-sm font-medium truncate">{interview.candidateName}</div>
                          <div className="text-xs text-gray-500 truncate">{interview.candidateEmail}</div>
                        </TableCell>
                        <TableCell className="border-r border-gray-200">
                          <div className="text-xs sm:text-sm text-gray-500 truncate">{interview.clientName}</div>
                        </TableCell>
                        <TableCell className="text-left border-r border-gray-200">
                          <div className="flex items-center gap-2 text-xs sm:text-sm">
                            <Calendar className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                            <span className="truncate">{interview.date}</span>
                          </div>
                          <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-500">
                            <Clock className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                            <span className="truncate">{interview.time}</span>
                          </div>
                        </TableCell>

<TableCell className="text-left border-r border-gray-200">
  <div className="space-y-2">
    {interview.assignedLevels.map((level) => {
      const currentResult = interview.levelResults[level] || 'Pending';
      const hasFeedback = !!interview.levelFeedback?.[level]?.trim();
      const levelProg = interview.levelProgress?.find(p => p.level === level);
      const isScheduled = levelProg?.status === 'Scheduled' || currentResult === 'Pending';

      return (
        <div key={level} className="flex items-center gap-2 flex-wrap">
          <span className="text-xs sm:text-sm font-medium min-w-[2rem]">{level}</span>

          {isScheduled ? (
            <div className="flex items-center gap-1">
              <Select
                value={getValidSelectValue(currentResult)}
                onValueChange={(val) => openFeedbackModal(interview.id, level, val)}
              >
                <SelectTrigger className="h-7 w-28 text-xs">
                  <SelectValue placeholder="Result" />
                </SelectTrigger>
                <SelectContent>
                  {interviewStatusOptions.map((opt) => (
                    <SelectItem key={opt.code} value={opt.code} className="text-xs">
                      {opt.label || opt.code}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              {/* No-Show button for scheduled levels */}
              <Button 
                size="sm" 
                variant="outline" 
                className="h-6 px-2 text-xs"
                onClick={() => handleNoShow(interview.id, interview.requestId, level)}
              >
                No-Show
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-1">
              <Badge className={getLevelBadgeColor(currentResult)}>
                {currentResult === 'NoShow' ? 'No-Show' : currentResult}
              </Badge>
              {hasFeedback && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-4 w-4 p-0"
                  onClick={() => showFeedback(interview.levelFeedback[level])}
                >
                  <FileText className="h-3 w-3" />
                </Button>
              )}
            </div>
          )}
        </div>
      );
    })}
  </div>
</TableCell>
                        <TableCell className="text-left border-r border-gray-200"><div className="text-xs sm:text-sm font-medium truncate">{interview.currentStatus}</div></TableCell>

                        <TableCell className="text-left border-r border-gray-200">
                          <Badge className={getClearanceBadgeColor(interview.clearanceStatus)}>
                            <Award className="h-3 w-3 mr-1" />
                            {interview.ostatus}
                          </Badge>
                        </TableCell>
<TableCell className="text-left">
  {interview.status === 'Scheduled' ? (
    <div className="flex gap-1 flex-wrap">
      <Button 
        size="sm" 
        variant="destructive" 
        className="h-6 px-2 text-xs" 
        onClick={() => handleCancel(interview.id, interview.requestId)}
      >
        Cancel Interview
      </Button>
    </div>
  ) : null}
</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>}
              </div>

              {false && <div className="flex flex-col sm:flex-row items-center justify-between mt-4 gap-4">
                <div className="flex items-center space-x-2">
                  <span className="text-xs sm:text-sm text-gray-600">Rows per page:</span>
                  <Select value={rowsPerPage.toString()} onValueChange={(v) => { setRowsPerPage(Number(v)); setCurrentPageState(1); }}>
                    <SelectTrigger className="w-[70px]"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5">5</SelectItem>
                      <SelectItem value="10">10</SelectItem>
                      <SelectItem value="20">20</SelectItem>
                      <SelectItem value="50">50</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center space-x-2">
                  <Button variant="outline" size="sm" onClick={() => setCurrentPageState(p => Math.max(p - 1, 1))} disabled={currentPage === 1}>
                    <ChevronLeft className="h-4 w-4" /> Previous
                  </Button>
                  <span className="text-xs sm:text-sm text-gray-600">Page {currentPage} of {totalPages}</span>
                  <Button variant="outline" size="sm" onClick={() => setCurrentPageState(p => Math.min(p + 1, totalPages))} disabled={currentPage === totalPages}>
                    Next <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>}
            </div>
          ) : (
            <div className="text-center py-8">
              <Users className="mx-auto h-10 w-10 sm:h-12 sm:w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No interviews assigned</h3>
              <p className="mt-1 text-sm text-gray-500">You don't have any interviews assigned to you at the moment.</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enter Feedback Notes</DialogTitle>
            <DialogDescription>Provide notes for <strong>{selectedLevel}</strong> to <strong>{selectedResult}</strong></DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Enter your feedback notes here..."
              className={`w-full transition-colors ${
                selectedResult === 'Rejected' ? 'border-red-500 focus:border-red-600 focus:ring-red-600'
                : selectedResult === 'Selected' ? 'border-green-500 focus:border-green-600 focus:ring-green-600'
                : selectedResult === 'Hold' ? 'border-orange-500 focus:border-orange-600 focus:ring-orange-600' : ''
              }`}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button onClick={handleLevelResultUpdate} disabled={!notes.trim()}>Submit</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={feedbackModalOpen} onOpenChange={setFeedbackModalOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Feedback Notes</DialogTitle></DialogHeader>
          <p className="py-4 whitespace-pre-wrap">{selectedFeedback}</p>
          <DialogFooter><Button variant="outline" onClick={() => setFeedbackModalOpen(false)}>Close</Button></DialogFooter>
        </DialogContent>
      </Dialog>
      
<Dialog open={noShowModalOpen} onOpenChange={setNoShowModalOpen}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Select Level for No-Show</DialogTitle>
      <DialogDescription>
        Choose which level to mark as No-Show
      </DialogDescription>
    </DialogHeader>
    <div className="py-4">
      {selectedForNoShow.interviewId && (
        <div className="space-y-2">
          {myInterviews
            .find(i => i.id === selectedForNoShow.interviewId)
            ?.assignedLevels
            .filter(level => {
              const currentResult = myInterviews
                .find(i => i.id === selectedForNoShow.interviewId)
                ?.levelResults[level];
              return currentResult === 'Pending';
            })
            .map(level => (
              <Button
                key={level}
                variant="outline"
                className="w-full justify-start"
                onClick={() => {
                  handleNoShow(selectedForNoShow.interviewId, selectedForNoShow.requestId, level);
                  setNoShowModalOpen(false);
                }}
              >
                Mark {level} as No-Show
              </Button>
            ))}
        </div>
      )}
    </div>
    <DialogFooter>
      <Button variant="outline" onClick={() => setNoShowModalOpen(false)}>Cancel</Button>
    </DialogFooter>
  </DialogContent>
</Dialog> 

      <style jsx>{`
        .scrollbar-thin { scrollbar-width: thin; scrollbar-color: #d1d5db #f3f4f6; }
        .scrollbar-thin::-webkit-scrollbar { width: 6px; height: 6px; }
        .scrollbar-thin::-webkit-scrollbar-track { background: #f3f4f6; border-radius: 3px; }
        .scrollbar-thin::-webkit-scrollbar-thumb { background: #d1d5db; border-radius: 3px; }
        .scrollbar-thin::-webkit-scrollbar-thumb:hover { background: #9ca3af; }
        table { width: 100%; min-width: 600px; }
        .truncate { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        @media (max-width: 640px) { .max-w-7xl { max-width: 100%; padding-left: 1rem; padding-right: 1rem; } table { min-width: 100%; } .text-xs { font-size: 0.65rem; } .text-sm { font-size: 0.75rem; } .h-6 { height: 1.25rem; padding: 0 0.5rem; } .px-2 { padding-left: 0.25rem; padding-right: 0.25rem; } }
        @media (min-width: 641px) and (max-width: 1024px) { .max-w-7xl { max-width: 95vw; } table { min-width: 800px; } }
        @media (min-width: 1025px) { .max-w-7xl { max-width: 1200px; } }
      `}</style>
    </div>
  );
};

export default InterviewHub;
