import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card.jsx";
import { Button } from "./ui/button.jsx";
import { Input } from "./ui/input.jsx";
import { Badge } from "./ui/badge.jsx";
import { Label } from "./ui/label.jsx";
import { Textarea } from "./ui/textarea.jsx";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select.jsx";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog.jsx";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "./ui/alert-dialog.jsx";
import {
  Users,
  Calendar,
  Clock,
  CheckCircle,
  X,
  Send,
  Plus,
  AlertTriangle,
  Eye,
  FolderOpen,
  Target,
  FileText,
  DollarSign,
  MapPin,
  Monitor,
  Home,
  Building,
  Briefcase,
  Search,
  ChevronLeft,
  ChevronRight,
  FileCheck,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { generateRequestId } from "./utils/requestUtils.jsx";
import { ResourceRequestService } from "../services/RequestResourceService.js";
import { ProjectService } from "../services/ProjectmanagementService.js";
import { SkillService } from "../services/SkillsService.js";
import api from "../services/api.js";

// Search Filter Component
const SearchFilter = ({ value, onChange, placeholder = "Search..." }) => (
  <div className="relative w-full max-w-md">
    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
    <Input
      type="text"
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
    />
  </div>
);

// Pagination Component
const Pagination = ({ currentPage, totalPages, onPageChange, itemsPerPage, onItemsPerPageChange, totalItems }) => {
  const itemsPerPageOptions = [5, 10, 20, 50];

  return (
    <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-6 p-4 bg-gray-50 rounded-lg">
      <div className="flex items-center gap-4">
        <span className="text-sm text-gray-600">
          Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems} requests
        </span>
        
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Requests per page:</span>
          <select
            value={itemsPerPage}
            onChange={(e) => onItemsPerPageChange(Number(e.target.value))}
            className="px-2 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {itemsPerPageOptions.map(option => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="flex items-center gap-1"
        >
          <ChevronLeft className="w-4 h-4" />
          Previous
        </Button>
        
        <div className="flex items-center gap-1">
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            let pageNum;
            if (totalPages <= 5) {
              pageNum = i + 1;
            } else if (currentPage <= 3) {
              pageNum = i + 1;
            } else if (currentPage >= totalPages - 2) {
              pageNum = totalPages - 4 + i;
            } else {
              pageNum = currentPage - 2 + i;
            }

            return (
              <Button
                key={pageNum}
                variant={currentPage === pageNum ? "default" : "outline"}
                size="sm"
                onClick={() => onPageChange(pageNum)}
                className={`w-8 h-8 p-0 ${currentPage === pageNum ? 'bg-blue-600 text-white' : ''}`}
              >
                {pageNum}
              </Button>
            );
          })}
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="flex items-center gap-1"
        >
          Next
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};

const staticSkillOptions = [
  "React", "Node.js",   "Veeva CRM",
  "Veeva Vault",
  "Salesforce Admin",
  "Salesforce Developer",
  "Salesforce",
  "Sales Cloud",
  "Health Cloud",
  "Service Cloud",
  "Data Cloud",
  "SFMC",
  "Mulesoft",
  "Commerce Cloud","TypeScript", "Python", "Java", "JavaScript",
  "Angular", "Vue.js", "Spring Boot", "Django", "Flask",
  "AWS", "Azure", "GCP", "Docker", "Kubernetes", "DevOps",
  "Machine Learning", "TensorFlow", "PyTorch", "Data Science",
];

export default function ProjectManagerDashboard() {
  const [requests, setRequests] = useState([]);
  const [projects, setProjects] = useState([]);
  const [skills, setSkills] = useState([]);
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [submittedRequestId, setSubmittedRequestId] = useState("");
  const [primarySkillInput, setPrimarySkillInput] = useState("");
  const [secondarySkillInput, setSecondarySkillInput] = useState("");
  
  // New states for enhanced features
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [workModeFilter, setWorkModeFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [sortField, setSortField] = useState("submittedDate");
  const [sortDirection, setSortDirection] = useState("desc");
  
  const [requestForm, setRequestForm] = useState({
    projectName: "",
    clientName: "",
    numberOfResources: "",
    primarySkills: [],
    secondarySkills: [],
    experienceRange: "",
    projectStartDate: "",
    projectEndDate: "",
    description: "",
    location: "",
    priority: "Medium",
    workMode: "Remote",
    locationType: "Office Based",
    estimatedBudget: "",
  });

  const [filteredPrimary, setFilteredPrimary] = useState([]);
  const [filteredSecondary, setFilteredSecondary] = useState([]);

  const userName = localStorage.getItem('userName');
  const userId = localStorage.getItem('userId');

  const fetchRequests = async () => {
    try {
      const response = await ResourceRequestService.fetchRequestList();
      const data = response.data.result;
      const mapped = data.map((req) => ({
        numericId: req.requestId,
        id: `REQ-${String(req.requestId).padStart(3, '0')}`,
        requestId: `REQ-${String(req.requestId).padStart(3, '0')}`,
        projectName: req.projectName?.trim() || req.demandTitle || req.groupTitle,
        requestTitle:req.demandTitle || req.groupTitle,
        clientName: req.accountName || "-",
        numberOfResources: req.numberOfResources || 0,
        primarySkills: req.primarySkills || [],
        secondarySkills: req.secondarySkills || [],
        experienceRange: req.experienceRange ? `${req.experienceRange}` : "Not Specified",
        projectStartDate: req.projectStartDate || "",
        projectEndDate: req.projectEndDate || "",
        projectDuration: req.projectDuration || "",
        priority: req.priority || "Medium",
        workMode: req.workMode || "Remote",
        locationType: req.locationType || "Office Based",
        estimatedBudget: req.estimatedCostTotal ? `$${req.estimatedCostTotal}` : "",
        status: req.status === "Submitted" ? "Waiting_For_HR_Approval" : req.status,
        submittedDate: req.submittedDate || new Date().toISOString().split("T")[0],
        description: req.description || "",
        location: req.location || "Not Specified",
        requestedBy: req.requesterName || userName,
        hrComments: req.remarks || "",
        approvedDate: req.status === "Approved" ? req.submittedDate : "",
        rejectionReason: req.rejectionReason || "",
        interviewScheduled: false,
        interviewStatus: 'Not_Scheduled',
        groupId: req.groupId || null,
        demandId: req.demandId || null,
      }));
      setRequests(mapped);
    } catch (error) {
      console.error(error);
      toast.error("Failed to fetch requests");
    }
  };

  const fetchProjects = async () => {
    try {
      const response = await ProjectService.fetchProjectList();
      setProjects(response.data.result);
    } catch (error) {
      console.error(error);
      toast.error("Failed to fetch projects");
    }
  };

  const fetchSkills = async () => {
    try {
      const response = await SkillService.fetchSkillList();
      const fetchedSkills = response.data.result;
      const fetchedNames = new Set(fetchedSkills.map(s => s.skillName.toLowerCase()));
      const uniqueStatic = staticSkillOptions
        .filter(name => !fetchedNames.has(name.toLowerCase()))
        .map((name, index) => ({
          skillId: - (index + 1),
          skillName: name
        }));
      const combinedSkills = [...uniqueStatic, ...fetchedSkills].sort((a, b) => a.skillName.localeCompare(b.skillName));
      setSkills(combinedSkills);
      
      const primaryCommon = combinedSkills.slice(0, 20).map(s => s.skillName);
      setFilteredPrimary(primaryCommon);
      
      const secondaryCommon = combinedSkills.slice(15, 40).map(s => s.skillName);
      setFilteredSecondary(secondaryCommon);
    } catch (error) {
      console.error(error);
      const staticSkills = staticSkillOptions.map((name, index) => ({
        skillId: - (index + 1),
        skillName: name
      })).sort((a, b) => a.skillName.localeCompare(b.skillName));
      setSkills(staticSkills);
      
      const primaryCommon = staticSkills.slice(0, 15).map(s => s.skillName);
      setFilteredPrimary(primaryCommon);
      
      const secondaryCommon = staticSkills.slice(15, 30).map(s => s.skillName);
      setFilteredSecondary(secondaryCommon);
      
      toast.error("Failed to fetch skills, using static skills");
    }
  };

  useEffect(() => {
    fetchRequests();
    fetchProjects();
    fetchSkills();
  }, []);

  // Filter and sort requests
  const myRequests = useMemo(() => {
    return requests
    // return requests.filter(req => req.requestedBy === userName);
  }, [requests, userName]);

  const searchedRequests = useMemo(() => {
    if (!searchQuery.trim()) return myRequests;

    const query = searchQuery.toLowerCase().trim();
    return myRequests.filter(request => {
      return (
        request.requestId?.toLowerCase().includes(query) ||
        request.projectName?.toLowerCase().includes(query) ||
        request.clientName?.toLowerCase().includes(query) ||
        request.description?.toLowerCase().includes(query) ||
        request.status?.toLowerCase().includes(query) ||
        request.priority?.toLowerCase().includes(query) ||
        request.location?.toLowerCase().includes(query) ||
        (request.primarySkills && request.primarySkills.some(skill => 
          skill.toLowerCase().includes(query)
        ))
      );
    });
  }, [myRequests, searchQuery]);

  const filteredRequests = useMemo(() => {
    return searchedRequests.filter(request => {
      if (statusFilter !== "all" && request.status !== statusFilter) return false;
      if (priorityFilter !== "all" && request.priority !== priorityFilter) return false;
      if (workModeFilter !== "all" && request.workMode !== workModeFilter) return false;
      return true;
    });
  }, [searchedRequests, statusFilter, priorityFilter, workModeFilter]);

  const sortedRequests = useMemo(() => {
    const sorted = [...filteredRequests];
    if (sortField === "submittedDate") {
      return sorted.sort((a, b) =>
        sortDirection === "asc"
          ? new Date(a.submittedDate) - new Date(b.submittedDate)
          : new Date(b.submittedDate) - new Date(a.submittedDate)
      );
    } else if (sortField === "priority") {
      const priorityOrder = { Urgent: 1, High: 2, Medium: 3, Low: 4 };
      return sorted.sort((a, b) => {
        const priorityA = priorityOrder[a.priority] || 5;
        const priorityB = priorityOrder[b.priority] || 5;
        return sortDirection === "asc" ? priorityA - priorityB : priorityB - priorityA;
      });
    } else if (sortField === "projectName") {
      return sorted.sort((a, b) =>
        sortDirection === "asc"
          ? a.projectName.localeCompare(b.projectName)
          : b.projectName.localeCompare(a.projectName)
      );
    }
    return sorted;
  }, [filteredRequests, sortField, sortDirection]);

  const paginatedRequests = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return sortedRequests.slice(startIndex, startIndex + itemsPerPage);
  }, [sortedRequests, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(sortedRequests.length / itemsPerPage);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter, priorityFilter, workModeFilter]);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  const handleItemsPerPageChange = (newItemsPerPage) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1);
  };

  const calculateDuration = (startDate, endDate) => {
    if (!startDate || !endDate) return "";
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const months = Math.floor(diffDays / 30);
    const days = diffDays % 30;
    
    if (months > 0) {
      return days > 0 ? `${months} months, ${days} days` : `${months} months`;
    }
    return `${diffDays} days`;
  };

  const submitRequest = async () => {
    if (!requestForm.projectName || !requestForm.clientName || !requestForm.numberOfResources || 
        !requestForm.projectStartDate || !requestForm.projectEndDate) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (requestForm.primarySkills.length === 0) {
      toast.error("Please add at least one primary skill");
      return;
    }

    const selectedProject = projects.find(p => p.projectName === requestForm.projectName);
    if (!selectedProject) {
      toast.error("Invalid project selected");
      return;
    }

    const skillNames = [...requestForm.primarySkills, ...requestForm.secondarySkills];
    const skillIds = skillNames
      .map(name => skills.find(s => s.skillName === name)?.skillId)
      .filter(id => id > 0);

    try {
      const response = await ResourceRequestService.createRequest(
        selectedProject.projectId,
        userId,
        parseInt(requestForm.numberOfResources),
        requestForm.experienceRange,
        requestForm.locationType,
        requestForm.workMode,
        requestForm.location,
        requestForm.priority,
        skillIds
      );
      
      const newRequestId = response.data.result?.requestId || generateRequestId();
      setSubmittedRequestId(`REQ-${String(newRequestId).padStart(3, '0')}`);
      
      toast.success(`Request submitted successfully!`);
      
      fetchRequests();
      
      setRequestForm({
        projectName: "",
        clientName: "",
        numberOfResources: "",
        primarySkills: [],
        secondarySkills: [],
        experienceRange: "",
        projectStartDate: "",
        projectEndDate: "",
        description: "",
        location: "",
        priority: "Medium",
        workMode: "Remote",
        locationType: "Office Based",
        estimatedBudget: "",
      });
      
      setPrimarySkillInput("");
      setSecondarySkillInput("");
      setIsRequestModalOpen(false);
      setIsSuccessModalOpen(true);
    } catch (error) {
      console.error(error);
      toast.error("Failed to submit request");
    }
  };

  const addSkillFromInput = async (skillInput, skillType) => {
    const skill = skillInput.trim();
    if (!skill) return;

    const skillsField = `${skillType}Skills`;
    if (requestForm[skillsField].includes(skill)) {
      toast.info("Skill already added");
      return;
    }

    let skillId;
    let existing = skills.find(s => s.skillName.toLowerCase() === skill.toLowerCase());
    if (existing) {
      skillId = existing.skillId;
      if (skillId < 0) {
        try {
          const res = await api.post(`/skills/create`, {
            companyId: 1,
            skillName: skill
          });
          skillId = res.data.result.skillId;
          const newSkill = { skillId, skillName: skill };
          setSkills(prev => {
            const updated = [...prev.filter(s => s.skillId !== existing.skillId), newSkill].sort((a, b) => a.skillName.localeCompare(b.skillName));
            return updated;
          });
        } catch (error) {
          console.error(error);
          toast.error("Failed to create skill");
          return;
        }
      }
    } else {
      try {
        const res = await api.post(`/skills/create`, {
          companyId: 1,
          skillName: skill
        });
        skillId = res.data.result.skillId;
        const newSkill = { skillId, skillName: skill };
        setSkills(prev => {
          const updated = [...prev, newSkill].sort((a, b) => a.skillName.localeCompare(b.skillName));
          return updated;
        });
      } catch (error) {
        console.error(error);
        toast.error("Failed to create skill");
        return;
      }
    }

    setRequestForm(prev => ({
      ...prev,
      [skillsField]: [...prev[skillsField], skill]
    }));

    // Reset input and filtered suggestions
    if (skillType === 'primary') {
      setPrimarySkillInput("");
      const primaryCommon = skills.slice(0, 15).map(s => s.skillName);
      setFilteredPrimary(primaryCommon);
    } else {
      setSecondarySkillInput("");
      const secondaryCommon = skills.slice(15, 30).map(s => s.skillName);
      setFilteredSecondary(secondaryCommon);
    }
  };

  const removeSkill = (skillToRemove, skillType) => {
    const skillsField = `${skillType}Skills`;
    setRequestForm(prev => ({
      ...prev,
      [skillsField]: prev[skillsField].filter(s => s !== skillToRemove)
    }));
  };

  const handleCommonSkillClick = (skill, skillType) => {
    if (skillType === 'primary') {
      setPrimarySkillInput(skill);
    } else {
      setSecondarySkillInput(skill);
    }
  };

  const handlePrimaryInputChange = (e) => {
    const value = e.target.value;
    setPrimarySkillInput(value);
    
    if (value.trim() === '') {
      const primaryCommon = skills.slice(0, 15).map(s => s.skillName);
      setFilteredPrimary(primaryCommon);
    } else {
      const filtered = skills
        .filter(s => s.skillName.toLowerCase().includes(value.toLowerCase()))
        .slice(0, 15)
        .map(s => s.skillName);
      setFilteredPrimary(filtered);
    }
  };

  const handleSecondaryInputChange = (e) => {
    const value = e.target.value;
    setSecondarySkillInput(value);
    
    if (value.trim() === '') {
      const secondaryCommon = skills.slice(15, 30).map(s => s.skillName);
      setFilteredSecondary(secondaryCommon);
    } else {
      const filtered = skills
        .filter(s => s.skillName.toLowerCase().includes(value.toLowerCase()))
        .slice(0, 15)
        .map(s => s.skillName);
      setFilteredSecondary(filtered);
    }
  };

  const handleViewRequest = (request) => {
    setSelectedRequest(request);
    setIsViewModalOpen(true);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Pending":
      case "Waiting_For_HR_Approval":
      case "Submitted":
        return "bg-yellow-100 text-yellow-700 border-yellow-200";
      case "Approved":
        return "bg-green-100 text-green-700 border-green-200";
      case "Rejected":
        return "bg-red-100 text-red-700 border-red-200";
      case "In_Interview_Process":
        return "bg-purple-100 text-purple-700 border-purple-200";
      case "Hired":
        return "bg-emerald-100 text-emerald-700 border-emerald-200";
      case "Cancelled":
      case "Closed":
        return "bg-gray-100 text-gray-700 border-gray-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "Low":
        return "bg-green-100 text-green-700";
      case "Medium":
        return "bg-yellow-100 text-yellow-700";
      case "High":
        return "bg-orange-100 text-orange-700";
      case "Urgent":
        return "bg-red-100 text-red-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const getWorkModeIcon = (workMode) => {
    switch (workMode) {
      case "Remote":
        return <Home className="w-4 h-4" />;
      case "Hybrid":
        return <Monitor className="w-4 h-4" />;
      case "Onsite":
        return <Building className="w-4 h-4" />;
      default:
        return <Briefcase className="w-4 h-4" />;
    }
  };

  // Render Request Card - Similar to HRDashboard
  const renderRequestCard = (request, index) => (
    <motion.div
      key={request.id}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
    >
      <Card className="bg-white/90 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer">
        <CardContent className="p-6" onClick={() => handleViewRequest(request)}>
          <div className="flex items-start mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h3 className="text-xl font-bold text-gray-800">{request.projectName}</h3>
                <Badge className={`${getStatusColor(request.status)} border`}>
                  {request.status.replace(/_/g, " ")}
                </Badge>
                <Badge className={getPriorityColor(request.priority)}>
                  {request.priority}
                </Badge>
                {request.groupId && (
                  <Badge className="bg-purple-100 text-purple-700 border-purple-200">
                    Opportunity
                  </Badge>
                )}
                {request.demandId && (
                  <Badge className="bg-orange-100 text-orange-700 border-orange-200">
                    Demand
                  </Badge>
                )}
              </div>
              <p className="text-gray-600 mb-2">{request.clientName}</p>
              <div className="flex items-center gap-4 text-sm text-gray-500">
                <span className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  {request.numberOfResources} resources
                </span>
                <span className="flex items-center gap-1">
                  <Target className="w-4 h-4" />
                  {request.experienceRange}
                </span>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">Request ID</p>
              <p className="font-mono font-bold text-blue-600">{request.requestId}</p>
              <p className="text-xs text-gray-500">Submitted: {request.submittedDate}</p>
              {request.groupId && (
                <p className="text-xs text-gray-500">Group ID: {request.groupId}</p>
              )}
              {request.demandId && (
                <p className="text-xs text-gray-500">Demand ID: {request.demandId}</p>
              )}
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm text-gray-500">
              <div className="flex items-center gap-2">
                {getWorkModeIcon(request.workMode)}
                <span>{request.workMode}</span>
                <MapPin className="w-4 h-4" />
                <span>{request.location}</span>
              </div>
              {request.estimatedBudget && (
                <div className="flex items-center gap-1">
                  <DollarSign className="w-4 h-4 text-green-500" />
                  <span>{request.estimatedBudget}</span>
                </div>
              )}
            </div>
            {request.primarySkills && request.primarySkills.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {request.primarySkills.slice(0, 3).map((skill, idx) => (
                  <Badge key={idx} variant="outline" className="text-xs">
                    {skill}
                  </Badge>
                ))}
                {request.primarySkills.length > 3 && (
                  <Badge variant="outline" className="text-xs">
                    +{request.primarySkills.length - 3} more
                  </Badge>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-8"
      >
        <div className="text-center bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-8 border border-green-200 shadow-lg">
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.6 }}
            className="mb-6"
          >
            <div className="w-20 h-20 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
              <FolderOpen className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-gray-800 mb-3">
              Project Manager Dashboard
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Request resources for your projects and track approval status
            </p>
          </motion.div>
          
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Button
              onClick={() => setIsRequestModalOpen(true)}
              size="lg"
              className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white px-12 py-4 text-lg font-semibold shadow-xl hover:shadow-2xl transition-all duration-300"
            >
              <Plus className="w-6 h-6 mr-3" />
              Request Resources
            </Button>
          </motion.div>
        </div>
      </motion.div>

      {/* Statistics Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8"
      >
        {[
          { 
            title: "Total Requests", 
            value: myRequests.length, 
            icon: FileText, 
            color: "from-blue-400 to-blue-600" 
          },
          { 
            title: "Waiting for HR", 
            value: myRequests.filter(r => r.status === "Waiting_For_HR_Approval").length, 
            icon: Clock, 
            color: "from-yellow-400 to-yellow-600" 
          },
          { 
            title: "Approved", 
            value: myRequests.filter(r => r.status === "Approved").length, 
            icon: CheckCircle, 
            color: "from-green-400 to-green-600" 
          },
          { 
            title: "High Priority", 
            value: myRequests.filter(r => r.priority === "High" || r.priority === "Urgent").length, 
            icon: AlertTriangle, 
            color: "from-red-400 to-red-600" 
          },
        ].map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index} className="bg-white/90 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm font-medium mb-1">{stat.title}</p>
                    <p className="text-3xl font-bold text-gray-800">{stat.value}</p>
                  </div>
                  <motion.div
                    className={`w-14 h-14 rounded-xl bg-gradient-to-r ${stat.color} flex items-center justify-center shadow-lg`}
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Icon className="w-7 h-7 text-white" />
                  </motion.div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </motion.div>

      {/* Search and Filter Controls - Similar to HRDashboard */}
      <div className="space-y-6">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold text-gray-800">My Resource Requests</h2>
          </div>
          <div className="flex flex-col lg:flex-row items-start lg:items-center gap-4 w-full lg:w-auto">
            {/* Search Input */}
            <SearchFilter
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search by ID or Title"
            />
            
            {/* Filter Dropdowns */}
            <div className="flex flex-wrap gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="all">All Status</option>
                <option value="Waiting_For_HR_Approval">Pending</option>
                <option value="Approved">Approved</option>
                <option value="Rejected">Rejected</option>
              </select>
              
            </div>
          </div>
        </div>

        {/* Search Results Info */}
        {searchQuery && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-sm text-blue-700">
              Showing {sortedRequests.length} result{sortedRequests.length !== 1 ? 's' : ''} for "{searchQuery}"
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSearchQuery("")}
                className="ml-2 text-blue-600 hover:text-blue-800"
              >
                Clear search
              </Button>
            </p>
          </div>
        )}

        {/* Pagination */}
        {sortedRequests.length > 0 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            itemsPerPage={itemsPerPage}
            onItemsPerPageChange={handleItemsPerPageChange}
            totalItems={sortedRequests.length}
          />
        )}

        {/* Requests List - Full width cards */}
        <div className="space-y-4">
          {paginatedRequests.length > 0 ? (
            paginatedRequests.map((request, index) => renderRequestCard(request, index))
          ) : (
            <Card className="bg-white/90 backdrop-blur-sm shadow-lg">
              <CardContent className="p-8 text-center">
                <FileCheck className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-600 mb-2">
                  {searchQuery || statusFilter !== "all" || priorityFilter !== "all" 
                    ? "No matching requests found" 
                    : "No Requests Found"}
                </h3>
                <p className="text-gray-500">
                  {searchQuery 
                    ? "Try adjusting your search terms" 
                    : "You haven't created any resource requests yet. Click 'Request Resources' to get started."
                  }
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Pagination at bottom */}
        {/* {sortedRequests.length > 0 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            itemsPerPage={itemsPerPage}
            onItemsPerPageChange={handleItemsPerPageChange}
            totalItems={sortedRequests.length}
          />
        )} */}
      </div>

      {/* Request Resource Modal */}
      <Dialog open={isRequestModalOpen} onOpenChange={setIsRequestModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3 text-xl">
              <Users className="w-5 h-5 text-green-500" />
              Request New Resources
            </DialogTitle>
            <DialogDescription>
              Fill in the details to request resources for your project.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-8">
            {/* Project and Client Selection */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="projectName" className="text-sm font-medium">Project Name *</Label>
                <Select
                  value={requestForm.projectName}
                  onValueChange={(value) => {
                    const selected = projects.find(p => p.projectName === value);
                    if (selected) {
                      setRequestForm(prev => ({
                        ...prev,
                        projectName: selected.projectName,
                        clientName: selected.accountName || '',
                        projectStartDate: selected.startDate || '',
                        projectEndDate: selected.endDate || '',
                        estimatedBudget: selected.budget ? `$${selected.budget.toFixed(2)}` : '',
                      }));
                    }
                  }}
                >
                  <SelectTrigger className="h-11">
                    <SelectValue placeholder="Select project" />
                  </SelectTrigger>
                  <SelectContent>
                    {projects.map((project) => (
                      <SelectItem key={project.projectId} value={project.projectName}>
                        {project.projectName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="clientName" className="text-sm font-medium">Client Name *</Label>
                <Input
                  id="clientName"
                  value={requestForm.clientName}
                  // disabled
                  className="h-11"
                />
              </div>
            </div>

            {/* Resource Details */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label htmlFor="numberOfResources" className="text-sm font-medium">Number of Resources *</Label>
                <Input
                  id="numberOfResources"
                  type="number"
                  min="1"
                  value={requestForm.numberOfResources}
                  onChange={(e) => setRequestForm(prev => ({ ...prev, numberOfResources: e.target.value }))}
                  className="h-11"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="experienceRange" className="text-sm font-medium">Experience Range</Label>
                <Select
                  value={requestForm.experienceRange}
                  onValueChange={(value) => setRequestForm(prev => ({ ...prev, experienceRange: value }))}
                >
                  <SelectTrigger className="h-11">
                    <SelectValue placeholder="Select experience range" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0-2 years">0-2 years</SelectItem>
                    <SelectItem value="2-5 years">2-5 years</SelectItem>
                    <SelectItem value="5-8 years">5-8 years</SelectItem>
                    <SelectItem value="8+ years">8+ years</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="estimatedBudget" className="text-sm font-medium">Estimated Budget ($)</Label>
                <Input
                  id="estimatedBudget"
                  value={requestForm.estimatedBudget}
                  // disabled
                  className="h-11"
                />
              </div>
            </div>

            {/* Skills Selection */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Primary Skills */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Primary Skills (Required) *</Label>
                <div className="flex gap-2">
                  <Input
                    value={primarySkillInput}
                    onChange={handlePrimaryInputChange}
                    placeholder="Add skill"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addSkillFromInput(primarySkillInput, 'primary');
                      }
                    }}
                    className="h-11"
                  />
                  <Button 
                    type="button" 
                    onClick={() => addSkillFromInput(primarySkillInput, 'primary')}
                    className="h-11"
                  >
                    Add
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {requestForm.primarySkills.map((skill, index) => (
                    <Badge key={index} className="bg-green-100 text-green-700 border border-green-200 px-2 py-1 rounded-full">
                      {skill}
                      <button 
                        onClick={() => removeSkill(skill, 'primary')} 
                        className="ml-1 text-green-700 hover:text-red-500"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
                <div className="text-xs text-gray-500 mt-2">Common skills:</div>
                <div className="flex flex-wrap gap-1">
                  {filteredPrimary.map((skill) => (
                    <Badge 
                      key={skill} 
                      variant="outline" 
                      className="cursor-pointer hover:bg-gray-100"
                      onClick={() => handleCommonSkillClick(skill, 'primary')}
                    >
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Secondary Skills */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Secondary Skills (Nice to have)</Label>
                <div className="flex gap-2">
                  <Input
                    value={secondarySkillInput}
                    onChange={handleSecondaryInputChange}
                    placeholder="Add skill"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addSkillFromInput(secondarySkillInput, 'secondary');
                      }
                    }}
                    className="h-11"
                  />
                  <Button 
                    type="button" 
                    onClick={() => addSkillFromInput(secondarySkillInput, 'secondary')}
                    className="h-11"
                  >
                    Add
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {requestForm.secondarySkills.map((skill, index) => (
                    <Badge key={index} className="bg-blue-100 text-blue-700 border border-blue-200 px-2 py-1 rounded-full">
                      {skill}
                      <button 
                        onClick={() => removeSkill(skill, 'secondary')} 
                        className="ml-1 text-blue-700 hover:text-red-500"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
                <div className="text-xs text-gray-500 mt-2">Common skills:</div>
                <div className="flex flex-wrap gap-1">
                  {filteredSecondary.map((skill) => (
                    <Badge 
                      key={skill} 
                      variant="outline" 
                      className="cursor-pointer hover:bg-gray-100"
                      onClick={() => handleCommonSkillClick(skill, 'secondary')}
                    >
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description" className="text-sm font-medium">Description</Label>
              <Textarea
                id="description"
                value={requestForm.description}
                onChange={(e) => setRequestForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Provide additional details about the resource requirements..."
                rows={4}
              />
            </div>

            {/* Dates and Configurations */}
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="projectStartDate" className="text-sm font-medium">Project Start Date *</Label>
                  <Input
                    id="projectStartDate"
                    type="date"
                    value={requestForm.projectStartDate}
                    // disabled
                    className="h-11"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="projectEndDate" className="text-sm font-medium">Project End Date *</Label>
                  <Input
                    id="projectEndDate"
                    type="date"
                    value={requestForm.projectEndDate}
                    // disabled
                    className="h-11"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="priority" className="text-sm font-medium">Priority</Label>
                  <Select value={requestForm.priority} onValueChange={(value) => setRequestForm(prev => ({ ...prev, priority: value }))}>
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Low">Low</SelectItem>
                      <SelectItem value="Medium">Medium</SelectItem>
                      <SelectItem value="High">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="workMode" className="text-sm font-medium">Work Mode</Label>
                  <Select value={requestForm.workMode} onValueChange={(value) => setRequestForm(prev => ({ ...prev, workMode: value }))}>
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder="Select work mode" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Remote">Remote</SelectItem>
                      <SelectItem value="Hybrid">Hybrid</SelectItem>
                      <SelectItem value="Onsite">Onsite</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="locationType" className="text-sm font-medium">Location Type</Label>
                  <Select value={requestForm.locationType} onValueChange={(value) => setRequestForm(prev => ({ ...prev, locationType: value }))}>
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder="Select location type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Office Based">Office Based</SelectItem>
                      <SelectItem value="Remote">Remote</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="location" className="text-sm font-medium">Location</Label>
                <Input
                  id="location"
                  value={requestForm.location}
                  onChange={(e) => setRequestForm(prev => ({ ...prev, location: e.target.value }))}
                  placeholder="e.g., San Francisco, CA"
                  className="h-11"
                />
              </div>
            </div>

            {/* Project Duration Display */}
            {requestForm.projectStartDate && requestForm.projectEndDate && (
              <div className="bg-yellow-50 rounded-xl p-6 border border-yellow-200">
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-yellow-600" />
                  <div>
                    <p className="font-medium text-gray-800">Calculated Duration</p>
                    <p className="text-yellow-700 font-semibold">
                      {calculateDuration(requestForm.projectStartDate, requestForm.projectEndDate)}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-4 pt-6 border-t border-gray-200">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsRequestModalOpen(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={submitRequest}
                className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
              >
                <Send className="w-4 h-4 mr-2" />
                Submit Request
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Success Modal */}
      <AlertDialog open={isSuccessModalOpen} onOpenChange={setIsSuccessModalOpen}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader className="text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5 }}
              className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4"
            >
              <CheckCircle className="w-8 h-8 text-green-600" />
            </motion.div>
            <AlertDialogTitle className="text-xl text-green-700">
              Request Submitted Successfully!
            </AlertDialogTitle>
            <AlertDialogDescription className="text-gray-600">
              Your resource request <span className="font-mono font-bold text-green-600">{submittedRequestId}</span> has been submitted and is now waiting for HR approval.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction
              onClick={() => setIsSuccessModalOpen(false)}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              Continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* View Request Details Modal - Enhanced like HRDashboard */}
      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedRequest?.projectName}</DialogTitle>
            <DialogDescription>
              Request ID: {selectedRequest?.requestId} | Status: {selectedRequest?.status?.replace(/_/g, " ")}
              {selectedRequest?.groupId && ` | GRP-${selectedRequest.groupId}`}
              {selectedRequest?.demandId && ` | DM-${selectedRequest.demandId}`}
            </DialogDescription>
          </DialogHeader>
          {selectedRequest && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="font-semibold mb-2">Project Details</h3>
                  <p className="text-gray-600 mb-2">{selectedRequest.description || "No description provided"}</p>
                  <div className="space-y-1 text-sm">
                    <p><span className="font-medium">Client:</span> {selectedRequest.clientName}</p>
                    <p><span className="font-medium">Priority:</span> <Badge className={getPriorityColor(selectedRequest.priority)}>{selectedRequest.priority}</Badge></p>
                    <p><span className="font-medium">Status:</span> <Badge className={getStatusColor(selectedRequest.status)}>{selectedRequest.status.replace(/_/g, " ")}</Badge></p>
                    <p><span className="font-medium">Work Mode:</span> {selectedRequest.workMode}</p>
                    <p><span className="font-medium">Location:</span> {selectedRequest.location}</p>
                    {selectedRequest.groupId && (
                      <p><span className="font-medium">Linked to Opportunity:</span> GRP-{selectedRequest.groupId}</p>
                    )}
                    {selectedRequest.demandId && (
                      <p><span className="font-medium">Linked to Demand:</span> DM-{selectedRequest.demandId}</p>
                    )}
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Timeline</h3>
                  <div className="space-y-1 text-sm">
                    <p><span className="font-medium">Submitted:</span> {selectedRequest.submittedDate}</p>
                    <p><span className="font-medium">Requested By:</span> {selectedRequest.requestedBy}</p>
                    {selectedRequest.approvedDate && (
                      <p><span className="font-medium">Approved:</span> {selectedRequest.approvedDate}</p>
                    )}
                  </div>
                </div>
              </div>
              
              {selectedRequest.primarySkills && selectedRequest.primarySkills.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-2">Skills Required</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedRequest.primarySkills.map((skill, idx) => (
                      <Badge key={idx} className="bg-green-100 text-green-700">
                        {skill}
                      </Badge>
                    ))}
                    {selectedRequest.secondarySkills && selectedRequest.secondarySkills.map((skill, idx) => (
                      <Badge key={idx} className="bg-blue-100 text-blue-700">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {selectedRequest.hrComments && (
                <div>
                  <h3 className="font-semibold mb-2">HR Comments</h3>
                  <p className="text-gray-600 bg-gray-50 p-3 rounded">{selectedRequest.hrComments}</p>
                </div>
              )}
              {selectedRequest.rejectionReason && (
                <div>
                  <h3 className="font-semibold mb-2">Rejection Reason</h3>
                  <div className="bg-red-50 border border-red-200 p-3 rounded">
                    <p className="text-red-700">{selectedRequest.rejectionReason}</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
