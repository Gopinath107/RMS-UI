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
  Trash2,
  CheckCircle,
  Search,
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

const InterviewHub = ({ setCurrentPage }) => {
  const [myInterviews, setMyInterviews] = useState([]);
  const [currentUser, setCurrentUser] = useState('');
  const [userRole, setUserRole] = useState('');
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

  // Calculation for Stats Cards
  const stats = useMemo(() => {
    return {
      total: myInterviews.length,
      scheduled: myInterviews.filter(i => i.status === 'Scheduled').length,
      selected: myInterviews.filter(i => i.ostatus === 'Interview Selected' || i.ostatus === 'Selected').length,
      rejected: myInterviews.filter(i => i.ostatus === 'Rejected' || i.ostatus === 'Interview Rejected').length
    };
  }, [myInterviews]);

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
    const role = localStorage.getItem('userRole') || '';
    const userName = localStorage.getItem('userName');
    setUserRole(role);
    if (role && userName) {
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
      setCurrentUser(defaultUsers[role] || 'panel');
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
          const assignedProgress = levelProgress.filter(p => {
            if (!p.interviewerName) return false;
            const interviewerLower = p.interviewerName.toLowerCase().trim();
            const currentUserLower = currentUser.toLowerCase().trim();
            const userRoleLower = userRole.toLowerCase().trim();

            // 1. Direct username match
            if (interviewerLower === currentUserLower) return true;

            // 2. Role keywords match
            const hrKeywords = ['hr', 'hr manager', 'human resources'];
            const pmKeywords = ['pm', 'project manager', 'project-manager'];
            const pmoKeywords = ['pmo'];
            const portfolioKeywords = ['portfolio', 'portfolio manager', 'portfolio-manager'];
            const salesKeywords = ['sales', 'sales manager', 'sales-manager'];
            const panelKeywords = ['panel', 'interview panel', 'interview-panel'];
            const adminKeywords = ['admin', 'system admin', 'system-admin'];

            if (userRoleLower === 'hr' && hrKeywords.includes(interviewerLower)) return true;
            if (userRoleLower === 'project-manager' && pmKeywords.includes(interviewerLower)) return true;
            if (userRoleLower === 'pmo' && pmoKeywords.includes(interviewerLower)) return true;
            if (userRoleLower === 'portfolio-manager' && portfolioKeywords.includes(interviewerLower)) return true;
            if (userRoleLower === 'sales-manager' && salesKeywords.includes(interviewerLower)) return true;
            if (userRoleLower === 'interview-panel' && panelKeywords.includes(interviewerLower)) return true;
            if (userRoleLower === 'system-admin' && adminKeywords.includes(interviewerLower)) return true;

            return false;
          });
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
            assignedLevels,
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
          if (interview.assignedLevels.length > 0) return true;

          const levelInterviewers = (interview.levelProgress || [])
            .map(p => p.interviewerName?.toLowerCase())
            .filter(Boolean);

          const isPanelAndNotSystem = currentUser === 'panel' &&
            !systemRoles.some(role => levelInterviewers.includes(role));

          return isPanelAndNotSystem;
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
  }, [currentUser, userRole]);

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
      const feedback = notes.trim() ? `${selectedResult}: ${notes.trim()}` : selectedResult;
      const levelProg = interview.levelProgress.find(p => p.level === selectedLevel);
      const interviewerUserID = levelProg ? levelProg.interviewerUserId : null;

      const response = await InterviewService.levelsComplete(
        parseInt(selectedInterviewId),
        parseInt(interview.requestId.replace('REQ-', '')),
        [selectedLevel],
        selectedResult,
        currentUser === 'panel' ? null : interviewerUserID,
        feedback
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

  const handleNoShow = async (interviewId, requestId, level) => {
    pageScrollRef.current = window.scrollY;
    try {
      const response = await InterviewService.noShow(
        parseInt(interviewId),
        parseInt(requestId.replace('REQ-', '')),
        'Candidate',
        [level],
        `No show for ${level}`
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
      const response = await InterviewService.cancel(interviewId, requestId.replace('REQ-', ''), 'Client conflict');
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

      let matchesStatus = filterStatus === 'all';
      if (filterStatus === 'Scheduled') matchesStatus = interview.status === 'Scheduled';
      else if (filterStatus === 'Selected') matchesStatus = interview.ostatus === 'Selected' || interview.ostatus === 'Interview Selected';
      else if (filterStatus === 'Rejected') matchesStatus = interview.ostatus === 'Rejected' || interview.ostatus === 'Interview Rejected';
      else if (filterStatus !== 'all') matchesStatus = interview.status === filterStatus;

      return matchesSearch && matchesStatus;
    });
  }, [myInterviews, searchTerm, filterStatus]);

  const totalPages = Math.ceil(filteredInterviews.length / rowsPerPage);
  const paginatedInterviews = filteredInterviews.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  const getLevelBadgeColor = (result) => {
    switch (result) {
      case 'Cleared': case 'Selected': case 'Interview Selected': return 'bg-green-100 text-green-800';
      case 'Not Cleared': case 'Rejected': return 'bg-red-100 text-red-800';
      case 'NoShow': return 'bg-purple-100 text-purple-800';
      case 'Hold': return 'bg-orange-100 text-orange-800';
      case 'Pending': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getClearanceBadgeColor = (status) => {
    switch (status) {
      case 'Interview Selected': case 'Cleared': case 'Selected': return 'bg-green-100 text-green-800';
      case 'Interview Rejected': case 'Rejected': case 'Not Cleared': case 'Cancelled': return 'bg-red-100 text-red-800';
      case 'Pending': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Header Section */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-white">Interview Hub</h1>
        {/* <Button
          variant="outline"
          onClick={() => setCurrentPage('dashboard')}
          className="border-gray-300 text-gray-700 hover:bg-gray-100"
        >
          Back to Dashboard
        </Button> */}
      </div>

      {/* 1. Summary Cards Section (Matching image_55843d.png) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-6">
            <p className="text-blue-600 font-semibold mb-2">Total candidates</p>
            <div className="flex items-center justify-between">
              <Users className="h-8 w-8 text-blue-600" />
              <span className="text-3xl font-bold text-blue-900">{stats.total}</span>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-green-50 border-green-200">
          <CardContent className="p-6">
            <p className="text-green-600 font-semibold mb-2">Scheduled</p>
            <div className="flex items-center justify-between">
              <Calendar className="h-8 w-8 text-green-600" />
              <span className="text-3xl font-bold text-green-900">{stats.scheduled}</span>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-yellow-50 border-yellow-200">
          <CardContent className="p-6">
            <p className="text-yellow-600 font-semibold mb-2">Overall Selected</p>
            <div className="flex items-center justify-between">
              <Award className="h-8 w-8 text-yellow-600" />
              <span className="text-3xl font-bold text-yellow-900">{stats.selected}</span>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-red-50 border-red-200">
          <CardContent className="p-6">
            <p className="text-red-600 font-semibold mb-2">Rejected</p>
            <div className="flex items-center justify-between">
              <Trash2 className="h-8 w-8 text-red-600" />
              <span className="text-3xl font-bold text-red-900">{stats.rejected}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 2. Filters Section (Aligned like image_55843d.png) */}
      <div className="flex flex-wrap gap-4 mb-6 items-center">
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search by candidate, client..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-gray-50 border-gray-200"
          />
        </div>
        <div className="flex-1 min-w-[150px]">
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-full bg-gray-50 border-gray-200">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="Scheduled">Scheduled</SelectItem>
              <SelectItem value="Selected">Selected</SelectItem>
              <SelectItem value="Rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex-1 min-w-[150px]">
          <Select disabled>
            <SelectTrigger className="w-full bg-gray-50 border-gray-200">
              <SelectValue placeholder="All Request Types" />
            </SelectTrigger>
          </Select>
        </div>
      </div>

      {/* 3. Main Content Table (Restyled Header) */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-visible">
        {isLoading ? (
          <div className="text-center py-20 text-gray-500">Loading interviews...</div>
        ) : error ? (
          <div className="text-center py-20 text-red-500">{error}</div>
        ) : paginatedInterviews.length > 0 ? (
          <div className="overflow-x-auto">
            <Table>
              {/* Removed blue background to match first screenshot */}
              <TableHeader className="bg-gray-50/50">
                <TableRow>
                  <TableHead className="text-gray-500 font-semibold">Request ID</TableHead>
                  <TableHead className="text-gray-500 font-semibold">Candidate</TableHead>
                  <TableHead className="text-gray-500 font-semibold">Client</TableHead>
                  <TableHead className="text-gray-500 font-semibold">Date & Time</TableHead>
                  <TableHead className="text-gray-500 font-semibold">Levels</TableHead>
                  <TableHead className="text-gray-500 font-semibold">Overall Status</TableHead>
                  <TableHead className="text-gray-500 font-semibold">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedInterviews.map((interview) => (
                  <TableRow key={interview.id} className="hover:bg-gray-50/50 transition-colors">
                    <TableCell className="font-medium text-gray-700">{interview.requestId}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center text-xs text-gray-500">
                          {interview.candidateName.charAt(0)}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">{interview.candidateName}</div>
                          <div className="text-xs text-gray-400">{interview.candidateEmail}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-gray-500 text-sm">{interview.clientName}</TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-1.5 text-xs text-gray-600">
                          <Calendar className="h-3.5 w-3.5 text-gray-400" /> {interview.date}
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-gray-600">
                          <Clock className="h-3.5 w-3.5 text-gray-400" /> {interview.time}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-2">
                        {interview.assignedLevels.map((level) => {
                          const currentResult = interview.levelResults[level] || 'Pending';
                          const levelProg = interview.levelProgress?.find(p => p.level === level);
                          const isScheduled = (levelProg?.status === 'Scheduled' || currentResult === 'Pending') && interview.status !== 'Cancelled';

                          return (
                            <div key={level} className="flex items-center gap-2">
                              <span className="text-xs font-bold text-gray-400 w-4">{level}</span>
                              {isScheduled ? (
                                <Select
                                  value={getValidSelectValue(currentResult)}
                                  onValueChange={(val) => openFeedbackModal(interview.id, level, val)}
                                >
                                  <SelectTrigger className="h-8 w-32 text-[10px] bg-white">
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
                              ) : (
                                <Badge className={`${getLevelBadgeColor(currentResult)} text-[10px] font-medium shadow-none border-none`}>
                                  {currentResult}
                                </Badge>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={`${getClearanceBadgeColor(interview.status === 'Cancelled' ? 'Cancelled' : interview.ostatus)} text-[10px] py-1 px-3 shadow-none border-none`}>
                        {interview.status === 'Cancelled' ? 'Cancelled' : (interview.ostatus || 'Pending')}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-blue-500 hover:text-blue-600 hover:bg-blue-50"
                          onClick={() => {
                            const feedback = Object.values(interview.levelFeedback).find(f => f.trim()) || 'No feedback available';
                            showFeedback(feedback);
                          }}
                        >
                          <FileText className="h-4 w-4" />
                        </Button>
                        {interview.status === 'Scheduled' && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50"
                            onClick={() => handleCancel(interview.id, interview.requestId)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="text-center py-20 text-gray-400">No interviews found.</div>
        )}

        {/* Pagination Section */}
        <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between bg-gray-50/30">
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">Rows per page:</span>
            <Select value={rowsPerPage.toString()} onValueChange={(v) => { setRowsPerPage(Number(v)); setCurrentPageState(1); }}>
              <SelectTrigger className="h-8 w-[70px] text-xs bg-white border-gray-200"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="5">5</SelectItem>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="20">20</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-xs text-gray-500 font-medium">Page {currentPage} of {totalPages}</span>
            <div className="flex gap-1">
              <Button
                variant="outline"
                size="sm"
                className="h-8 w-8 p-0 bg-white border-gray-200"
                onClick={() => setCurrentPageState(p => Math.max(p - 1, 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-8 w-8 p-0 bg-white border-gray-200"
                onClick={() => setCurrentPageState(p => Math.min(p + 1, totalPages))}
                disabled={currentPage === totalPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Existing Dialogs for Feedback and No-Show remain here... */}
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
              className={`w-full transition-colors ${selectedResult === 'Rejected' ? 'border-red-500' : selectedResult === 'Selected' ? 'border-green-500' : ''}`}
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
          <p className="py-4 whitespace-pre-wrap text-sm text-gray-600">{selectedFeedback}</p>
          <DialogFooter><Button variant="outline" onClick={() => setFeedbackModalOpen(false)}>Close</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default InterviewHub;