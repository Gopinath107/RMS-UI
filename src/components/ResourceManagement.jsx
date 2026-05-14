import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "./ui/card.jsx";
import { Button } from "./ui/button.jsx";
import { Input } from "./ui/input.jsx";
import { Badge } from "./ui/badge.jsx";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "./ui/dialog.jsx";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "./ui/table.jsx";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "./ui/select.jsx";
import { Label } from "./ui/label.jsx";
import {
    Search,
    User,
    Mail,
    Phone,
    Calendar,
    MapPin,
    Briefcase,
    Star,
    Clock,
    ArrowUpDown,
    ArrowUp,
    ArrowDown,
    ChevronLeft,
    ChevronRight,
    Plus,
    Download,
    FileText,
    Sparkles,
    Globe,
    Pencil,
    AlertCircle,
    Users,
    ExternalLink,Share2,
    ChevronDown,
    ChevronUp
} from "lucide-react";
import Swal from 'sweetalert2';
import { toast } from "sonner";
import { EmployeeService } from "../services/EmployeeManagementService.js";
import { ProjectService } from "../services/ProjectmanagementService.js";
import { ResourceRequestService } from '../services/RequestResourceService.js';
import { InterviewService } from '../services/InterviewManagementService.js';
import { UserManagementService } from '../services/UserManagementService.js';
import { Checkbox } from "./ui/checkbox.jsx";
import { Textarea } from "./ui/textarea.jsx";
import { SkillMatcherService } from '../services/AI/SkillMatcherService.js';
import {
    RadioGroup,
    RadioGroupItem
} from "./ui/radio-group.jsx";
import { DemandService } from '../services/DemandService.js';
import { CandidateService } from "../services/CandidateService.js";
import ResumeUploadStep from './ResumeUploadStep.jsx';
import ReusableDataView from "./common/ReusableDataView.jsx";

const validatePDFFile = (file, options = {}) => {
  const defaultOptions = {
    maxSize: 5 * 1024 * 1024, // 5MB default
    allowedExtensions: ['pdf'],
    fieldName: 'Resume'
  };
  
  const config = { ...defaultOptions, ...options };
  
  if (!file) {
    return { isValid: false, error: `Please select a ${config.fieldName} file` };
  }

  // Check file extension
  const fileExtension = file.name.split('.').pop().toLowerCase();
  const isExtensionValid = config.allowedExtensions.includes(fileExtension);
  
  if (!isExtensionValid) {
    const extensions = config.allowedExtensions.map(ext => `.${ext}`).join(', ');
    return { 
      isValid: false, 
      error: `Only ${extensions} files are allowed for ${config.fieldName}. Please upload a .pdf file.` 
    };
  }

  // Check MIME type as additional validation
  const allowedMimeTypes = ['application/pdf'];
  if (file.type && !allowedMimeTypes.includes(file.type)) {
    return { 
      isValid: false, 
      error: `Invalid file type. Only PDF files are allowed for ${config.fieldName}.` 
    };
  }

  // Check file size
  if (file.size > config.maxSize) {
    const maxSizeMB = config.maxSize / (1024 * 1024);
    return { 
      isValid: false, 
      error: `${config.fieldName} file size exceeds ${maxSizeMB}MB limit.` 
    };
  }

  return { isValid: true, error: null };
};

// Specific validation for resume files
const validateResumeFile = (file) => {
  return validatePDFFile(file, {
    maxSize: 5 * 1024 * 1024, // 5MB for resumes
    fieldName: 'Resume'
  });
};

const RESUME_STATUS_KEY = "resource-resume-status";
const EXTERNAL_RESUME_STATUS_KEY = "external-resource-resume-status";
/**
 * Load persisted resume status map from localStorage.
 * @returns {{[key: string]: 'pending'|'shared'|'rejected'}} status map
 */
const loadResumeStatusMap = () => {
    try {
        const raw = localStorage.getItem(RESUME_STATUS_KEY);
        return raw ? JSON.parse(raw) : {};
    } catch {
        return {};
    }
};

const loadExternalResumeStatusMap = () => {
    try {
        const raw = localStorage.getItem(EXTERNAL_RESUME_STATUS_KEY);
        return raw ? JSON.parse(raw) : {};
    } catch {
        return {};
    }
};
/**
 * Save resume status map to localStorage.
 * @param {{[key: string]: 'pending'|'shared'|'rejected'}} map
 */
const saveResumeStatusMap = (map) => {
    try {
        localStorage.setItem(RESUME_STATUS_KEY, JSON.stringify(map));
    } catch {
        // ignore
    }
};

const saveExternalResumeStatusMap = (map) => {
    try {
        localStorage.setItem(EXTERNAL_RESUME_STATUS_KEY, JSON.stringify(map));
    } catch {
        // ignore
    }
};

const ResumeToggleSwitch = ({ status, onShare, onReject, onPending, disabled = false }) => {
    const [isDragging, setIsDragging] = useState(false);
    const [dragX, setDragX] = useState(0);
    const isShared = status === "shared";
    const isRejected = status === "rejected";
    const isPending = status === "pending";
    const MAX_DRAG = 80;

    const getCurrentPosition = () => {
        if (isShared) return MAX_DRAG;
        if (isRejected) return -MAX_DRAG;
        return 0;
    };

    const handleMouseDown = (e) => {
        if (disabled) return;  // Block drag
        e.stopPropagation();
        const startMouseX = e.clientX;
        const startDragX = getCurrentPosition();
        setDragX(startDragX);
        setIsDragging(true);

        const onMove = (moveE) => {
            const delta = moveE.clientX - startMouseX;
            const newX = Math.min(MAX_DRAG, Math.max(-MAX_DRAG, startDragX + delta));
            setDragX(newX);
        };

        const onUp = () => {
            setIsDragging(false);
            document.removeEventListener('mousemove', onMove);
            document.removeEventListener('mouseup', onUp);
            if (dragX > 30) onShare();
            else if (dragX < -30) onReject();
            else onPending();
            setDragX(0);
        };

        document.addEventListener('mousemove', onMove);
        document.addEventListener('mouseup', onUp);
    };

    const getThumbX = () => {
        if (isShared) return 90;
        if (isRejected) return 65;
        return 75; // Pending: center
    };

    const getTrackStyle = () => {
        if (isShared) return 'bg-gradient-to-r from-green-400 to-green-600 border-green-700 shadow-lg shadow-green-500/50';
        if (isRejected) return 'bg-gradient-to-r from-red-400 to-red-600 border-red-700 shadow-lg shadow-red-500/50';
        return 'bg-gradient-to-r from-yellow-300 to-orange-400 border-orange-600 shadow-lg shadow-orange-400/40';
    };

    const getLabelColor = (side) => {
        if (side === 'reject' && isRejected) return 'text-black font-bold';
        if (side === 'share' && isShared) return 'text-black font-bold';
        if (isPending) return 'text-black font-semibold';
        return 'text-white/70';
    };

    return (
        <div onClick={(e) => e.stopPropagation()} className="flex justify-center py-2">
            <div
                className={`
                    relative w-48 h-10 rounded-full border-2 transition-all duration-300 cursor-pointer select-none
                    ${getTrackStyle()}
                    ring-4 ring-white/30
                    ${disabled ? 'opacity-60 cursor-not-allowed' : ''}
                `}
                onClick={(e) => {
                    if (disabled) return;  // Block click
                    const rect = e.currentTarget.getBoundingClientRect();
                    const clickX = e.clientX - rect.left;
                    const width = rect.width;
                    if (clickX < width / 3) {
                        onReject();
                    } else if (clickX > (2 * width) / 3) {
                        onShare();
                    } else {
                        onPending();
                    }
                }}
            >
                <div className="absolute inset-0 flex items-center justify-between px-4 text-sm font-bold text-white">
                    <span className={getLabelColor('reject')}>REJECT</span>
                    <span className={getLabelColor('share')}>SHARE</span>
                </div>
                <div
                    className={`
                        thumb absolute top-1 w-10 h-10 bg-white rounded-full shadow-xl transition-all duration-300
                        flex items-center justify-center font-bold text-lg
                        ${isDragging ? 'scale-110' : ''}
                        ${isShared ? 'text-green-600' : isRejected ? 'text-red-600' : 'text-orange-600'}
                        ${disabled ? 'cursor-not-allowed' : ''}
                    `}
                    style={{ transform: `translateX(${getThumbX()}px)` }}
                    onMouseDown={handleMouseDown}
                >
                    {isShared ? '✓' : isRejected ? '✕' : "?"}
                </div>
            </div>
        </div>
    );
};
const staticSkillOptions = [
    "AIML", "Java",
    "Veeva CRM",
    "Veeva Vault",
    "Salesforce Admin",
    "Salesforce Developer ",
    "Salesforce", "Sales cloud", "health cloud", "service cloud", "data cloud",
    "SFMC",
    "Mulesoft",
    "Commerce cloud",
    "React", "Android", "React Native", "Java", "Python",
    "PHP", "C#", "C++",
    "Golang", "Rust", "Scala", "R", "MATLAB", "Tableau"
];
// Simple Error Boundary Component
class ErrorBoundary extends React.Component {
    state = { hasError: false, error: null };
    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }
    render() {
        if (this.state.hasError) {
            return (
                <div className="text-red-500 p-4">
                    Something went wrong. Please try again or contact support.
                </div>
            );
        }
        return this.props.children;
    }
}

const InfoItem = ({ icon, label, value }) => (
    <div className="flex flex-col gap-1">
        <span className="text-[10px] uppercase font-bold text-gray-400 tracking-tight">{label}</span>
        <div className="flex items-center gap-2 text-sm text-gray-700 font-medium">
            {React.cloneElement(icon, { className: "w-3.5 h-3.5" })}
            <span className="truncate">{value || "N/A"}</span>
        </div>
    </div>
);

// Resource Table Component to avoid code duplication
const ResourceTable = ({ 
    resources, 
    filteredResources, 
    searchTerm, 
    statusFilter, 
    roleFilter, 
    sortField, 
    sortOrder, 
    currentPageNum, 
    itemsPerPage, 
    expandedRows,
    onSearchChange,
    onStatusFilterChange,
    onRoleFilterChange,
    onSort,
    onPageChange,
    onItemsPerPageChange,
    onRowToggle,
    onScheduleInterview,
    onScheduleInterviewFromAudit,
    onViewResume,
    onSkillMatcher,
    onResumeShare,
    onResumeReject,
    onResumePending,
    onEditResource,
    isResumeToggleLocked,
    getSortIcon,
    getStatusColor,
    formatDate,
    uniqueRoles,
    resourceType = "internal", // "internal" or "external"
    renderToolbar
}) => {
    const totalPages = Math.ceil(filteredResources.length / itemsPerPage);
    const startIndex = (currentPageNum - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedResources = filteredResources.slice(startIndex, endIndex);
    const resourceColumns = [
        {
            key: "name",
            label: "Name",
            sortable: true,
            render: (resource) => (
                <div className="flex items-center gap-3">
                    <div>
                        <p className="font-medium">{resource.name}</p>
                        <p className="text-xs text-gray-500">{resource.email}</p>
                    </div>
                </div>
            ),
        },
        ...(resourceType === "internal" ? [{
            key: "role",
            label: "Role",
            sortable: true,
            render: (resource) => resource.role || "N/A",
        }] : []),
        {
            key: "skills",
            label: "Skills",
            render: (resource) => (
                <div className="flex flex-wrap gap-1">
                    {resource.skills?.slice(0, 3).map((skill, idx) => (
                        <Badge key={idx} variant="secondary" className="bg-purple-100 text-purple-700 text-xs">
                            {skill}
                        </Badge>
                    ))}
                    {resource.skills?.length > 3 && (
                        <Badge variant="secondary" className="bg-purple-100 text-purple-700 text-xs">
                            +{resource.skills.length - 3} more
                        </Badge>
                    )}
                </div>
            ),
        },
        {
            key: "status",
            label: "Status",
            sortable: true,
            type: "status",
            render: (resource) => (
                <Badge className={getStatusColor(resource.status)}>
                    {resource.status}
                </Badge>
            ),
        },
        ...(resourceType === "internal" ? [
            {
                key: "client",
                label: "Client",
                sortable: true,
                render: (resource) => resource.client || "N/A",
            },
            {
                key: "joiningDate",
                label: "Joining Date",
                sortable: true,
                render: (resource) => formatDate(resource.joiningDate),
            },
            {
                key: "projectType",
                label: "Project Type",
                sortable: true,
                render: (resource) => resource.projectType || "Regular",
            },
        ] : []),
        {
            key: "experience",
            label: "Experience",
            sortable: true,
            render: (resource) => resource.experience || "N/A",
        },
        {
            key: "resumeActions",
            label: "Resume Actions",
            type: "actions",
            hideable: false,
            render: (resource) => (
                <div onClick={(event) => event.stopPropagation()}>
                    <ResumeToggleSwitch
                        status={resource.resumeStatus}
                        onShare={() => onResumeShare(resource.id)}
                        onReject={() => onResumeReject(resource.id)}
                        onPending={() => onResumePending(resource.id)}
                        disabled={isResumeToggleLocked(resource)}
                    />
                </div>
            ),
        },
        {
            key: "actions",
            label: "Actions",
            type: "actions",
            hideable: false,
            render: (resource) => (
                <Button
                    onClick={(event) => {
                        event.stopPropagation();
                        if (resource.resumeStatus !== "shared") {
                            toast.error("Please share the resume first to schedule an interview.");
                            return;
                        }
                        onScheduleInterview(resource);
                    }}
                    className={`bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-xs ${
                        resource.resumeStatus !== "shared" ? "opacity-50 cursor-not-allowed" : ""
                    }`}
                >
                    Schedule Interview
                </Button>
            ),
        },
    ];

    const renderExpandedResource = (resource) => (
        <Card className="m-4">
            <CardContent className="p-4">
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                    <Card className="p-4">
                        <div className="flex items-center justify-between gap-3">
                            <h3 className="font-semibold flex items-center gap-2">
                                <User className="w-5 h-5 text-blue-600" />
                                Personal Information
                            </h3>
                            <Button
                                onClick={(event) => {
                                    event.stopPropagation();
                                    onEditResource(resource);
                                }}
                                variant="ghost"
                                className="h-8 w-8 p-0 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                            >
                                <Pencil className="w-4 h-4" />
                            </Button>
                        </div>
                        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
                            <InfoItem icon={<Phone className="text-orange-500" />} label="Phone" value={resource.phone} />
                            <InfoItem icon={<MapPin className="text-red-500" />} label="Location" value={resource.location} />
                            <InfoItem icon={<Globe className="text-blue-500" />} label="Work Email" value={resource.email} />
                            <InfoItem icon={<Mail className="text-purple-500" />} label="Personal" value={resource.personalemail} />
                        </div>
                    </Card>

                    <Card className="p-4">
                        <h3 className="font-semibold mb-3 flex items-center gap-2">
                            <Briefcase className="w-5 h-5 text-green-600" />
                            Project Information
                        </h3>
                        <div className="space-y-2 text-sm">
                            <div>
                                <span className="text-gray-500">Status:</span>
                                <Badge className={`ml-2 ${getStatusColor(resource.status)}`}>{resource.status}</Badge>
                            </div>
                            {resourceType === "internal" && (
                                <div>
                                    <span className="text-gray-500">Current Project:</span>
                                    <p className="font-medium">{resource.currentProject || "Not assigned"}</p>
                                </div>
                            )}
                            <div>
                                <span className="text-gray-500">Client:</span>
                                <p className="font-medium">{resource.client || "Not assigned"}</p>
                            </div>
                            <div>
                                <span className="text-gray-500">Employment Type:</span>
                                <Badge variant="outline" className="ml-2">{resource.projectType || "Regular"}</Badge>
                            </div>
                        </div>
                    </Card>

                    {resource.resumeShareAudit && resource.resumeShareAudit.length > 0 && (
                        <Card className="p-4 lg:col-span-2">
                            <h3 className="font-semibold mb-3 flex items-center gap-2">
                                <Share2 className="w-5 h-5 text-blue-600" />
                                Resume Sharing History
                                <Badge variant="secondary">{resource.resumeShareAudit.length}</Badge>
                            </h3>
                            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                                {resource.resumeShareAudit.map((audit, index) => (
                                    <div key={index} className="rounded-lg border border-blue-100 p-3">
                                        <div className="mb-2 flex flex-wrap items-center gap-2">
                                            <Badge className={
                                                audit.status === 'Shared'
                                                    ? 'bg-green-100 text-green-700 border-green-200'
                                                    : audit.status === 'Rejected'
                                                    ? 'bg-red-100 text-red-700 border-red-200'
                                                    : 'bg-yellow-100 text-yellow-700 border-yellow-200'
                                            }>
                                                {audit.status}
                                            </Badge>
                                            <Badge variant="outline">{audit.type === 'GROUP' || audit.type === 'OPPORTUNITY' ? 'Opportunity' : 'Demand'}</Badge>
                                        </div>
                                        <p className="text-sm font-semibold">{audit.title || audit.projectName || audit.demandTitle || 'Untitled'}</p>
                                        <p className="text-sm text-gray-600">Client: {audit.clientName || 'N/A'}</p>
                                        {audit.status === 'Shared' && (
                                            <Button
                                                size="sm"
                                                onClick={(event) => {
                                                    event.stopPropagation();
                                                    onScheduleInterviewFromAudit(resource, audit);
                                                }}
                                                className="mt-2 bg-gradient-to-r from-blue-500 to-indigo-500 text-xs"
                                            >
                                                Schedule Interview
                                            </Button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </Card>
                    )}

                    <Card className="p-4">
                        <h3 className="font-semibold mb-3 flex items-center gap-2">
                            <Star className="w-5 h-5 text-yellow-600" />
                            Skills & Expertise
                        </h3>
                        <div className="flex flex-wrap gap-2">
                            {resource.skills?.length > 0 ? (
                                resource.skills.map((skill, idx) => (
                                    <Badge key={idx} variant="secondary" className="bg-purple-100 text-purple-700">
                                        {skill}
                                    </Badge>
                                ))
                            ) : (
                                <span className="text-gray-500">No skills assigned</span>
                            )}
                        </div>
                        <div className="mt-3 flex flex-wrap gap-2">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={(event) => {
                                    event.stopPropagation();
                                    onViewResume(resource.id);
                                }}
                                className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white"
                            >
                                <FileText className="h-4 w-4" />
                                View Resume
                            </Button>
                            {resourceType === "internal" && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={(event) => {
                                        event.stopPropagation();
                                        onSkillMatcher(resource);
                                    }}
                                >
                                    <Sparkles className="h-4 w-4" />
                                    AI Skill Matcher
                                </Button>
                            )}
                        </div>
                    </Card>

                    {resourceType === "external" && (
                        <Card className="p-4">
                            <h3 className="font-semibold mb-3 flex items-center gap-2">
                                <Briefcase className="w-5 h-5 text-blue-600" />
                                Employment Details
                            </h3>
                            <div className="grid grid-cols-1 gap-3 text-sm md:grid-cols-2">
                                <div><span className="text-gray-500">Current Company:</span><p className="font-medium">{resource.currentCompany || "N/A"}</p></div>
                                <div><span className="text-gray-500">Preferred Location:</span><p className="font-medium">{resource.preferredLocation || "N/A"}</p></div>
                                <div><span className="text-gray-500">Notice Period:</span><p className="font-medium">{resource.noticePeriod || "N/A"}</p></div>
                            </div>
                        </Card>
                    )}
                </div>
            </CardContent>
        </Card>
    );

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
        >
            <ReusableDataView
                tableKey={`resources-${resourceType}-table`}
                data={paginatedResources}
                columns={resourceColumns}
                rowKey="id"
                emptyMessage="No resources match the current filters."
                defaultViewMode="table"
                sortState={{ key: sortField, direction: sortOrder }}
                onSort={onSort}
                pagination={{
                    currentPage: currentPageNum,
                    totalPages,
                    onPageChange,
                    totalItems: filteredResources.length,
                }}
                expandedRowKeys={expandedRows}
                onRowClick={(resource) => onRowToggle(resource.id)}
                renderExpandedContent={renderExpandedResource}
                renderToolbar={renderToolbar}
                tableClassName="responsive-table"
                tableHeaderClassName="sticky top-0 z-10 bg-gradient-to-r from-purple-200/80 via-blue-300/70 to-indigo-300/80 border-b-2 border-purple-300 shadow-sm"
                tableRowClassName="hover:bg-purple-50/50 transition-all duration-200 border-b border-purple-100"
                tableContainerClassName="bg-white/90 backdrop-blur-sm border-0 shadow-xl rounded-lg overflow-hidden"
            />
        </motion.div>
    );

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
        >
            <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl rounded-lg overflow-hidden">
                <div className="relative max-h-[480px] overflow-auto scrollbar-thin scrollbar-track-purple-100 scrollbar-thumb-purple-300 hover:scrollbar-thumb-purple-400">
                    <Table className="responsive-table">
                        <TableHeader className="sticky top-0 z-10">
                            <TableRow className="bg-gradient-to-r from-purple-200/80 via-blue-300/70 to-indigo-300/80 border-b-2 border-purple-300 shadow-sm">
                                <TableHead
                                    className="cursor-pointer hover:bg-purple-200/60 transition-all duration-200 text-slate-800 font-extrabold text-[15px] border-r border-purple-300/50 py-4"
                                    onClick={() => onSort("name")}
                                >
                                    <div className="flex items-center gap-2">
                                        <span className="text-slate-700 font-bold">Name</span>
                                        {getSortIcon("name")}
                                    </div>
                                </TableHead>
                                {resourceType === "internal" && (
                                <TableHead
                                    className="cursor-pointer hover:bg-purple-200/60 transition-all duration-200 text-slate-800 font-extrabold text-[15px] border-r border-purple-300/50 py-4"
                                    onClick={() => onSort("role")}
                                >
                                    <div className="flex items-center gap-2">
                                        <span className="text-slate-700 font-bold">Role</span>
                                        {getSortIcon("role")}
                                    </div>
                                </TableHead>
                                )}
                                <TableHead className="text-slate-800 font-extrabold text-[15px] border-r border-purple-300/50 py-4">
                                    <span className="text-slate-700 font-bold">Skills</span>
                                </TableHead>
                                <TableHead
                                    className="cursor-pointer hover:bg-purple-200/60 transition-all duration-200 text-slate-800 font-extrabold text-[15px] border-r border-purple-300/50 py-4"
                                    onClick={() => onSort("status")}
                                >
                                    <div className="flex items-center gap-2">
                                        <span className="text-slate-700 font-bold">Status</span>
                                        {getSortIcon("status")}
                                    </div>
                                </TableHead>
                                {resourceType === "internal" && (
                                <TableHead
                                    className="cursor-pointer hover:bg-purple-200/60 transition-all duration-200 text-slate-800 font-extrabold text-[15px] border-r border-purple-300/50 py-4"
                                    onClick={() => onSort("client")}
                                >
                                    <div className="flex items-center gap-2">
                                        <span className="text-slate-700 font-bold">Client</span>
                                        {getSortIcon("client")}
                                    </div>
                                </TableHead>
                                )}
                                {resourceType === "internal" && (
                                <TableHead
                                    className="cursor-pointer hover:bg-purple-200/60 transition-all duration-200 text-slate-800 font-extrabold text-[15px] border-r border-purple-300/50 py-4"
                                    onClick={() => onSort("joiningDate")}
                                >
                                    <div className="flex items-center gap-2">
                                        <span className="text-slate-700 font-bold">Joining Date</span>
                                        {getSortIcon("joiningDate")}
                                    </div>
                                </TableHead>
                                )}
                                {resourceType === "internal" && (
                                <TableHead
                                    className="cursor-pointer hover:bg-purple-200/60 transition-all duration-200 text-slate-800 font-extrabold text-[15px] border-r border-purple-300/50 py-4"
                                    onClick={() => onSort("projectType")}
                                >
                                    <div className="flex items-center gap-2">
                                        <span className="text-slate-700 font-bold">Project Type</span>
                                        {getSortIcon("projectType")}
                                    </div>
                                </TableHead>
                                )}
                                <TableHead
                                    className="cursor-pointer hover:bg-purple-200/60 transition-all duration-200 text-slate-800 font-extrabold text-[15px] border-r border-purple-300/50 py-4"
                                    onClick={() => onSort("experience")}
                                >
                                    <div className="flex items-center gap-2">
                                        <span className="text-slate-700 font-bold">Experience</span>
                                        {getSortIcon("experience")}
                                    </div>
                                </TableHead>
                                <TableHead className="text-slate-800 font-extrabold text-[15px] border-r border-purple-300/50 py-4">
                                    <span className="text-slate-700 font-bold">Resume Actions</span>
                                </TableHead>
                                <TableHead className="text-slate-800 font-extrabold text-[15px] py-4">
                                    <span className="text-slate-700 font-bold">Actions</span>
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {paginatedResources.map((resource) => {
                                const isExpanded = expandedRows.has(resource.id);
                                const canSchedule = resource.status === "Bench" && resource.resumeStatus === "shared";
                                return (
                                    <React.Fragment key={resource.id}>
                                        <TableRow
                                            className="hover:bg-purple-50/50 cursor-pointer transition-all duration-200 border-b border-purple-100"
                                            onClick={() => onRowToggle(resource.id)}
                                        >
                                            <TableCell className="py-4">
                                                <div className="flex items-center gap-3">
                                                    {/* <img
                                                        src={resource.photo}
                                                        alt={resource.name}
                                                        className="w-10 h-10 rounded-full object-cover"
                                                    /> */}
                                                    <div>
                                                        <p className="font-medium">{resource.name}</p>
                                                        <p className="text-xs text-gray-500">{resource.email}</p>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            {resourceType === "internal" && (
                                            <TableCell className="py-4 font-medium">{resource.role}</TableCell>)}
                                            <TableCell className="py-4">
                                                <div className="flex flex-wrap gap-1">
                                                    {resource.skills?.slice(0, 3).map((skill, idx) => (
                                                        <Badge key={idx} variant="secondary" className="bg-purple-100 text-purple-700 text-xs">
                                                            {skill}
                                                        </Badge>
                                                    ))}
                                                    {resource.skills?.length > 3 && (
                                                        <Badge variant="secondary" className="bg-purple-100 text-purple-700 text-xs">
                                                            +{resource.skills.length - 3} more
                                                        </Badge>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell className="py-4">
                                                <Badge className={getStatusColor(resource.status)}>
                                                    {resource.status}
                                                </Badge>
                                            </TableCell>
                                            {resourceType === "internal" && (
                                            <TableCell className="py-4">{resource.client || "N/A"}</TableCell>
                                            )}
                                            {resourceType === "internal" && (
                                            <TableCell className="py-4">{formatDate(resource.joiningDate)}</TableCell>
                                            )}
                                            {resourceType === "internal" && (                
                                            <TableCell className="py-4">{resource.projectType || "Regular"}</TableCell>
                                            )}  
                                            <TableCell className="py-4">{resource.experience}</TableCell>
                                           
                                            <TableCell onClick={(e) => e.stopPropagation()}>
                                                <ResumeToggleSwitch
                                                    status={resource.resumeStatus}
                                                    onShare={() => onResumeShare(resource.id)}
                                                    onReject={() => onResumeReject(resource.id)}
                                                    onPending={() => onResumePending(resource.id)}
                                                    disabled={isResumeToggleLocked(resource)}
                                                />
                                            </TableCell>
                                            <TableCell className="py-4">
                                                <div className="flex gap-2">
<Button
    onClick={(e) => {
        e.stopPropagation();
        if (resource.resumeStatus !== "shared") {
            toast.error("Please share the resume first to schedule an interview.");
            return;
        }
        onScheduleInterview(resource);
    }}
    className={`bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-xs ${
        resource.resumeStatus !== "shared" ? "opacity-50 cursor-not-allowed" : ""
    }`}
>
    Schedule Interview
</Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                        {isExpanded && (
                                            <TableRow>
                                                <TableCell colSpan={10} className="p-0">
                                                    <Card className="m-4">
                                                        <CardContent className="p-4">
                                                            <div className="space-y-6">
{resource.resumeShareAudit && resource.resumeShareAudit.length > 0 && (
    <Card className="p-4">
        <h3 className="font-semibold mb-3 flex items-center gap-2">
            <Share2 className="w-5 h-5 text-blue-600" />
            Resume Sharing History
            <Badge variant="secondary" className="ml-2">
                {resource.resumeShareAudit.length} {resource.resumeShareAudit.length === 1 ? 'Share' : 'Shares'}
            </Badge>
        </h3>
        
        <div className="space-y-3">
            {resource.resumeShareAudit.map((audit, index) => (
                <div 
                    key={index} 
                    className={`border rounded-lg p-3 transition-colors ${
                        audit.type === 'GROUP' || audit.type === 'OPPORTUNITY' 
                            ? 'hover:bg-purple-50 border-purple-100' 
                            : 'hover:bg-blue-50 border-blue-100'
                    }`}
                >
                    <div className="flex items-start justify-between">
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                                {/* Status Badge */}
                                <Badge className={
                                    audit.status === 'Shared' 
                                        ? 'bg-green-100 text-green-700 border-green-200' 
                                        : audit.status === 'Rejected'
                                        ? 'bg-red-100 text-red-700 border-red-200'
                                        : 'bg-yellow-100 text-yellow-700 border-yellow-200'
                                }>
                                    {audit.status}
                                </Badge>

                                {/* Type Badge with different colors */}
                                <Badge variant="outline" className={`text-xs ${
                                    audit.type === 'GROUP' || audit.type === 'OPPORTUNITY'
                                        ? 'border-purple-300 text-purple-700 bg-purple-50'
                                        : 'border-blue-300 text-blue-700 bg-blue-50'
                                }`}>
                                    {audit.type === 'GROUP' || audit.type === 'OPPORTUNITY' 
                                        ? 'Opportunity' 
                                        : 'Demand'}
                                </Badge>
                                
                                {/* ID Display */}
                                {audit.type === 'GROUP' || audit.type === 'OPPORTUNITY' ? (
                                    audit.groupId && (
                                        <span className="text-md text-purple-700 font-semibold font-mono">
                                            ID: {audit.groupId}
                                        </span>
                                    )
                                ) : (
                                    audit.demandId && (
                                        <span className="text-xs text-blue-700 font-semibold font-mono">
                                            ID: {audit.demandId}
                                        </span>
                                    )
                                )}
                            </div>
                            
                            {/* Main Content - Different layout for Opportunity vs Demand */}
                            <div className="space-y-2">
                                {/* Title/Name */}
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        {audit.type === 'GROUP' || audit.type === 'OPPORTUNITY' ? (
                                            <>
                                                <span className="text-sm font-medium text-gray-700">Title:</span>
                                                <span className="text-sm font-semibold text-purple-700">
                                                    {audit.title || audit.projectName || 'Untitled Opportunity'}
                                                </span>
                                            </>
                                        ) : (
                                            <>
                                                <span className="text-sm font-medium text-gray-700">Title:</span>
                                                <span className="text-sm font-semibold text-blue-700">
                                                    {audit.demandTitle || audit.title || 'Untitled Demand'}
                                                </span>
                                            </>
                                        )}
                                    </div>
                                    
                                </div>
                                
                                {/* Client Information */}
                                <div className="flex items-center gap-2">
                                    <span className="text-sm text-gray-600">Client:</span>
                                    <span className="text-sm font-medium">{audit.clientName || 'N/A'}</span>
                                
                                </div>
                                                                    {/* Schedule Interview Button - Only show if status is Shared */}
                                    {audit.status === 'Shared' && (
                                        <Button
                                            size="sm"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onScheduleInterviewFromAudit(resource, audit);
                                            }}
                                            className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-xs h-7"
                                        >
                                            Schedule Interview
                                        </Button>
                                    )}
                                
                            </div>
                        </div>
                        
                        {/* Icons for quick identification */}
                        <div className="ml-4">
                            {audit.type === 'GROUP' || audit.type === 'OPPORTUNITY' ? (
                                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-purple-100">
                                    <Users className="w-4 h-4 text-purple-600" />
                                </div>
                            ) : (
                                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100">
                                    <FileText className="w-4 h-4 text-blue-600" />
                                </div>
                            )}
                        </div>
                    </div>
                    
                    {/* Date and Shared By Information */}
                    {/* {(resource.resumeShareActionAt && index === 0) && (
                        <div className="mt-2 pt-2 border-t text-xs text-gray-500 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            <span>
                                Last shared by {resource.resumeShareActionByUserName || 'Unknown'} on{' '}
                                {new Date(resource.resumeShareActionAt).toLocaleDateString('en-IN', {
                                    day: '2-digit',
                                    month: 'short',
                                    year: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                })}
                            </span>
                        </div>
                    )} */}
                    
                    {/* Show specific shared date for each audit item */}
                    {audit.sharedDate && (
                        <div className="mt-1 text-xs text-gray-400 flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            <span>
                                Shared on: {new Date(audit.sharedDate).toLocaleDateString('en-IN', {
                                    day: '2-digit',
                                    month: 'short',
                                    year: 'numeric'
                                })}
                            </span>
                        </div>
                    )}
                </div>
            ))}
        </div>
    </Card>
)}
                                                                <div className="grid grid-cols-1 md:grid-cols-1 gap-6">

                                                                    
                                                                    <Card className="p-4">

                                                                        {/* --- Personal Information Card Start --- */}
{(() => {
    const [isPersonalInfoExpanded, setIsPersonalInfoExpanded] = React.useState(false);

    return (
        <Card className="overflow-hidden border border-gray-100 shadow-sm transition-all duration-300">
            {/* Header: This is always visible and determines the "collapsed" height */}
            <div 
                onClick={(e) => {
                    e.stopPropagation();
                    setIsPersonalInfoExpanded(!isPersonalInfoExpanded);
                }}
                className={`p-4 cursor-pointer flex items-center justify-between transition-colors ${
                    isPersonalInfoExpanded ? 'bg-blue-50/30' : 'bg-white hover:bg-gray-50'
                }`}
            >
                <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg transition-colors ${
                        isPersonalInfoExpanded ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-500'
                    }`}>
                        <User className="w-4 h-4" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-sm text-gray-800 leading-none">Personal Information</h3>
                        {!isPersonalInfoExpanded && (
                            <p className="text-[11px] text-gray-500 mt-1">{resource.name} • {resource.id}</p>
                        )}
                    </div>
                </div>
                
                <div className="flex items-center gap-2">
                    <Button
                        onClick={(e) => {
                            e.stopPropagation();
                            onEditResource(resource);
                        }}
                        variant="ghost"
                        className="h-8 w-8 p-0 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                    >
                        <Pencil className="w-4 h-4" />
                    </Button>
                    <div className="text-gray-400">
                        {isPersonalInfoExpanded ? 
                            <ChevronUp className="w-5 h-5" /> : 
                            <ChevronDown className="w-5 h-5" />
                        }
                    </div>
                </div>
            </div>

            {/* Collapsible Content: Height is determined by content inside */}
            {isPersonalInfoExpanded && (
                <div className="border-t border-gray-100 bg-white animate-in slide-in-from-top-2 duration-200">
                    <div className="p-4 space-y-4">
                        {/* Name and ID Header inside expanded view */}
                        <div className="flex flex-col gap-1 pb-2 border-b border-gray-50">
                            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Full Name</span>
                            <span className="text-sm font-semibold text-gray-900">{resource.name} (ID: {resource.id})</span>
                            {resourceType === "internal" && (
                                <span className="text-xs text-blue-600 font-medium">{resource.role}</span>
                            )}
                        </div>

                        {/* Contact Details Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <InfoItem icon={<Phone className="text-orange-500" />} label="Phone" value={resource.phone} />
                            <InfoItem icon={<MapPin className="text-red-500" />} label="Location" value={resource.location} />
                            {resourceType === "internal" && (
                                <>
                                    <InfoItem icon={<Globe className="text-blue-500" />} label="Work Email" value={resource.email} />
                                    <InfoItem icon={<Mail className="text-purple-500" />} label="Personal" value={resource.personalemail} />
                                </>
                            )}
                        </div>

                        {/* Professional Info */}
                        <div className="bg-slate-50 p-3 rounded-xl space-y-2">
                            <div className="flex items-center gap-2 text-sm">
                                <Star className="w-4 h-4 text-amber-500" />
                                <span className="text-gray-700 font-medium">{resource.degrees}</span>
                                <span className="text-gray-300">|</span>
                                <span className="text-gray-600 text-xs">{resource.specialization}</span>
                            </div>
                            <div className="flex justify-between items-center text-[11px] text-gray-500">
                                <span>Batch: {resource.yearOfPassing}</span>
                                <span>Experience: <strong>{resource.experience}</strong></span>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </Card>
    );
})()}
                                                                        {resourceType === "internal" && (
                                                                        <h3 className="font-semibold mb-3 flex items-center gap-2">
                                                                            <Briefcase className="w-5 h-5 text-green-600" />
                                                                            Project Information
                                                                        </h3>
                                                                        )}
                                                                        <div className="space-y-2 text-sm">
                                                                            <div>
                                                                                <span className="text-gray-500">Status:</span>
                                                                                <Badge className={`ml-2 ${getStatusColor(resource.status)}`}>
                                                                                    {resource.status}
                                                                                </Badge>
                                                                            </div>
                                                                            {resourceType === "internal" && (
                                                                            <div>
                                                                                <span className="text-gray-500">Current Project:</span>
                                                                                <p className="font-medium">{resource.currentProject || "Not assigned"}</p>
                                                                            </div>
                                                                            )}
                                                                            <div>
                                                                                <span className="text-gray-500">Client:</span>
                                                                                <p className="font-medium">{resource.client || "Not assigned"}</p>
                                                                            </div>
                                                                            <div>
                                                                                <span className="text-gray-500">Employement Type:</span>
                                                                                <Badge variant="outline" className="ml-2">
                                                                                    {resource.projectType || "Regular"}
                                                                                </Badge>
                                                                            </div>
<div className="mt-3 pt-3 border-t">
    <div className="flex items-center px-1 gap-2 mb-2">
        <span className="text-gray-500 text-sm">Resume Status:</span>
        <Badge className={
            resource.resumeStatus === 'shared' 
                ? 'bg-green-100 text-green-700 border-green-200' 
                : resource.resumeStatus === 'rejected'
                ? 'bg-red-100 text-red-700 border-red-200'
                : 'bg-yellow-100 text-yellow-700 border-yellow-200'
        }>
            {resource.resumeStatus?.toUpperCase() || 'PENDING'}
        </Badge>
    </div>
    
    {/* {resource.resumeShareAudit && resource.resumeShareAudit.length > 0 && (
        <div className="mt-2">
            <div className="flex items-center gap-2">
                <Share2 className="w-3 h-3 text-blue-500" />
                <span className="text-xs text-gray-600">
                    Shared with {resource.resumeShareAudit.length} {resource.resumeShareAudit.length === 1 ? 'entry' : 'entries'} 
                    ({resource.resumeShareAudit.filter(a => a.type === 'GROUP' || a.type === 'OPPORTUNITY').length} opportunity, 
                     {resource.resumeShareAudit.filter(a => a.type === 'DEMAND').length} demand)
                </span>
            </div>
            {resource.resumeShareActionByUserName && (
                <div className="text-xs text-gray-500 mt-1">
                    by {resource.resumeShareActionByUserName}
                </div>
            )}
        </div>
    )} */}
</div>

                                                                        </div>
                                                                    </Card>
                                                                </div>
                                                                        <Card className="p-4">
                                                                            <h3 className="font-semibold mb-3 flex items-center gap-2">
                                                                                <Briefcase className="w-5 h-5 text-green-600" />
                                                                                Profile Summary
                                                                            </h3>
                                                                            <div className="flex flex-col gap-1 mt-2 text-sm">
                                                                                <div>
                                                                                    <span className="text-gray-500">Profile:</span>
                                                                                    <Badge className={`ml-2 ${getStatusColor(resource.status)}`}>
                                                                                        {resource.profileSummary}
                                                                                    </Badge>
                                                                                </div>
                                                                                <div>
                                                                                    <span className="text-gray-500">Training summary:</span>
                                                                                    <Badge className={`ml-2 ${getStatusColor(resource.status)}`}>
                                                                                        {resource.trainingSummary}
                                                                                    </Badge>
                                                                                </div>
                                                                                <div>
                                                                                    <span className="text-gray-500">Certifications:</span>
                                                                                    <Badge className={`ml-2 ${getStatusColor(resource.status)}`}>
                                                                                        {resource.certificationSummary}
                                                                                    </Badge>
                                                                                </div>
                                                                            </div>
                                                                        </Card>
                                                                        {resourceType === "external" && (
    <Card className="p-4">
        <h3 className="font-semibold mb-3 flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-blue-600" />
            Employment Details
        </h3>
        <div className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <span className="text-sm text-gray-500">Current Company:</span>
                    <p className="font-medium">{resource.currentCompany || "N/A"}</p>
                </div>
                <div>
                    <span className="text-sm text-gray-500">Preferred Location:</span>
                    <p className="font-medium">{resource.preferredLocation || "N/A"}</p>
                </div>
                <div>
                    <span className="text-sm text-gray-500">Current CTC:</span>
                    <p className="font-medium">
                        {resource.currentCtc ? `₹${Number(resource.currentCtc).toLocaleString('en-IN')}` : "N/A"}
                    </p>
                </div>
                <div>
                    <span className="text-sm text-gray-500">Expected CTC:</span>
                    <p className="font-medium">
                        {resource.expectedCtc ? `₹${Number(resource.expectedCtc).toLocaleString('en-IN')}` : "N/A"}
                    </p>
                </div>
                <div>
                    <span className="text-sm text-gray-500">Notice Period:</span>
                    <p className="font-medium">{resource.noticePeriod || "N/A"}</p>
                </div>
            </div>
            {resource.comments && (
                <div>
                    <span className="text-sm text-gray-500">Comments:</span>
                    <p className="font-medium mt-1 text-sm bg-gray-50 p-3 rounded-lg">
                        {resource.comments}
                    </p>
                </div>
            )}
        </div>
    </Card>
)}


                                                                <Card className="p-4">
                                                                    <h3 className="font-semibold mb-3 flex items-center gap-2">
                                                                        <Star className="w-5 h-5 text-yellow-600" />
                                                                        Skills & Expertise
                                                                    </h3>
                                                                    <div className="flex flex-wrap gap-2">
                                                                        {resource.skills?.length > 0 ? (
                                                                            resource.skills.map((skill, idx) => (
                                                                                <Badge key={idx} variant="secondary" className="bg-purple-100 text-purple-700">
                                                                                    {skill}
                                                                                </Badge>
                                                                            ))
                                                                        ) : (
                                                                            <span className="text-gray-500">No skills assigned</span>
                                                                        )}
                                                                        <Button
                                                                            variant="ghost"
                                                                            size="sm"
                                                                            onClick={() => onViewResume(resource.id)}
                                                                            className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white text-xs px-3 py-1 rounded-md flex items-center gap-1 ml-2"
                                                                        >
                                                                            <FileText className="h-4 w-4" />
                                                                            <span>View Resume</span>
                                                                        </Button>
                                                                    </div>
                                                                </Card>
                                                                
                                                                <Card className="p-4">
                                                                    {resourceType === "internal" && (
                                                                    <div className="flex flex-col gap-2 mt-4">
                                                                        <div className="flex items-center justify-between">
                                                                            <h4 className="font-semibold text-lg text-black">Previous Projects</h4>
                                                                            <span className="text-sm text-black">
                                                                                Total: {resource.previousProjects?.length || 0}
                                                                            </span>
                                                                        </div>

                                                                        {/* Table for Previous Projects */}
                                                                        {resource.previousProjects && resource.previousProjects.length > 0 ? (
                                                                            <div className="overflow-x-auto mt-2 flex justify-center">
                                                                                <table className="w-full max-w-3xl text-sm text-left text-black border-4 border-black rounded-lg shadow-lg">
                                                                                    <thead className="text-xs text-black uppercase bg-gradient-to-r from-blue-400 to-blue-600 border-b-2 border-black">
                                                                                        <tr>
                                                                                            <th className="px-4 py-3 border-r-2 border-black font-bold">Project Name</th>
                                                                                            <th className="px-4 py-3 border-r-2 border-black font-bold">Client Name</th>
                                                                                            <th className="px-4 py-3 border-r-2 border-black font-bold">Start Date</th>
                                                                                            <th className="px-4 py-3 font-bold">End Date</th>
                                                                                        </tr>
                                                                                    </thead>
                                                                                    <tbody>
                                                                                        {resource.previousProjects.map((proj, index) => (
                                                                                            <tr key={index} className="bg-white border-b-2 border-black hover:bg-blue-50 transition-colors">
                                                                                                <td className="px-4 py-3 font-medium text-black border-r-2 border-black">
                                                                                                    {proj.projectName?.trim() || "Unnamed Project"}
                                                                                                </td>
                                                                                                <td className="px-4 py-3 border-r-2 border-black">
                                                                                                    {proj.clientName || "N/A"}
                                                                                                </td>
                                                                                                <td className="px-4 py-3 border-r-2 border-black">
                                                                                                    {proj.startDate || "N/A"}
                                                                                                </td>
                                                                                                <td className="px-4 py-3">
                                                                                                    {proj.endDate || "Ongoing"}
                                                                                                </td>
                                                                                            </tr>
                                                                                        ))}
                                                                                    </tbody>
                                                                                </table>
                                                                            </div>
                                                                        ) : (
                                                                            <p className="text-sm text-black italic text-center py-4">
                                                                                No previous projects found
                                                                            </p>   )}

                                                                        <div className="flex justify-center mt-3">
                                                                            <Button
                                                                                variant="outline"
                                                                                size="sm"
                                                                                onClick={() => onSkillMatcher(resource)}
                                                                                className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white hover:from-blue-600 hover:to-indigo-600"
                                                                            >
                                                                                <Sparkles className="w-4 h-4 mr-2" />
                                                                                AI Skill Matcher
                                                                            </Button>
                                                                        </div>
                                                                    </div>
                                                                    )}
                                                                </Card>
                                                            </div>
                                                        </CardContent>
                                                    </Card>
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </React.Fragment>
                                );
                            })}
                        </TableBody>
                    </Table>
                </div>
                <div className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-b-lg">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onPageChange(1)}
                        disabled={currentPageNum === 1}
                        className="hover:bg-purple-50 disabled:opacity-50"
                    >
                        First
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onPageChange(currentPageNum - 1)}
                        disabled={currentPageNum === 1}
                        className="hover:bg-purple-50 disabled:opacity-50"
                    >
                        <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <span className="text-sm font-medium text-gray-700">
                        {currentPageNum} / {totalPages}
                    </span>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onPageChange(currentPageNum + 1)}
                        disabled={currentPageNum === totalPages}
                        className="hover:bg-purple-50 disabled:opacity-50"
                    >
                        <ChevronRight className="w-4 h-4" />
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onPageChange(totalPages)}
                        disabled={currentPageNum === totalPages}
                        className="hover:bg-purple-50 disabled:opacity-50"
                    >
                        Last
                    </Button>
                </div>
            </Card>
        </motion.div>
    );
};

export default function ResourceManagement() {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState("internal");
    
    // Internal Resources State
    const [internalResources, setInternalResources] = useState([]);
    const [internalFilteredResources, setInternalFilteredResources] = useState([]);
    const [internalSearchTerm, setInternalSearchTerm] = useState("");
    const [internalStatusFilter, setInternalStatusFilter] = useState("All");
    const [internalRoleFilter, setInternalRoleFilter] = useState("All");
    
    // External Resources State
    const [externalResources, setExternalResources] = useState([]);
    const [externalFilteredResources, setExternalFilteredResources] = useState([]);
    const [externalSearchTerm, setExternalSearchTerm] = useState("");
    const [externalStatusFilter, setExternalStatusFilter] = useState("All");
    const [externalRoleFilter, setExternalRoleFilter] = useState("All");
    
    // Common State
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isResumeUploadStepOpen, setIsResumeUploadStepOpen] = useState(false);
    const [autoFilledFields, setAutoFilledFields] = useState({});
    const [sortField, setSortField] = useState(null);
    const [sortOrder, setSortOrder] = useState("asc");
    const [currentPageNum, setCurrentPageNum] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(5);
    const [resumeFile, setResumeFile] = useState(null);
    const [storageType, setStorageType] = useState("Local");
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [importCompanyId, setImportCompanyId] = useState(null);
    const [importFile, setImportFile] = useState(null);
    const [isResumeModalOpen, setIsResumeModalOpen] = useState(false);
    const [resumeUrl, setResumeUrl] = useState("");
    const [resumeFileName, setResumeFileName] = useState("");
    const [isSkillMatcherModalOpen, setIsSkillMatcherModalOpen] = useState(false);
    const [skillMatches, setSkillMatches] = useState([]);
    const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
    const [selectedEmployeeForShare, setSelectedEmployeeForShare] = useState(null);
    const [selectedItems, setSelectedItems] = useState([]);
    const [selectedEmployeeForReject, setSelectedEmployeeForReject] = useState(null);
    const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
    const [opportunityGroups, setOpportunityGroups] = useState([]);
    const [demandGroups, setDemandGroups] = useState([]);
    const [selectedType, setSelectedType] = useState('demand');

    // API data
    const [companies, setCompanies] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [skills, setSkills] = useState([]);
    const [selectedSkills, setSelectedSkills] = useState([]);
    const [filteredSkills, setFilteredSkills] = useState([]);
    const [skillInput, setSkillInput] = useState("");
    const [projects, setProjects] = useState([]);
    
    // ── EMPTY FORM TEMPLATES (used for reset) ──────────────────────────────
    const EMPTY_INTERNAL = {
        companyId: null, firstName: "", middleName: "", lastName: "",
        email: "", phoneNumber: "", departmentId: null,
        experienceYears: "", location: "",
        currentProjectId: null, currentAccountId: null,
        currentProject: "", client: "",
        joiningDate: "", status: "Bench",
        employmentType: "Regular",
        costRatePerHour: "", capacityHoursPerWeek: "",
        gender: "", personalEmailId: "",
        degrees: "", specialization: "", yearOfPassing: "",
        profileSummary: "", trainingSummary: "", certificationSummary: "",
        dateOfBirth: "",
        primaryCountryCode: "+91", primaryContactNo: "",
        secondaryCountryCode: "", secondaryContactNo: "",
        countryOfCitizenship: "",
        documentType: "", documentNumber: "",
        country: "", state: "", city: "",
        zipCode: "", street: "",
        securityClearance: "",
        visa: "", visaType: "",
        availabilityToJoin: "", interviewAvailability: "",
        highestQualification: "", universityName: "",
        dateOfQualification: "", usaDegree: "",
        currentJobTitle: "", mostRecentEmployer: "",
        totalExperience: "",
        relocate: "", currency: "INR",
        frequency: "Monthly", sourcingRate: "",
        primarySkills: [], secondarySkills: [],
        suggestedKeywords: "", resumeSummary: "",
    };

    // Add Employee Form State
    const [newEmployee, setNewEmployee] = useState({ ...EMPTY_INTERNAL });

    const EMPTY_EXTERNAL = {
        firstName: "", middleName: "", lastName: "",
        email: "", phoneNumber: "",
        role: "", experienceYears: "", location: "",
        currentProject: "", client: "",
        joiningDate: "", status: "Not Allocated",
        employmentType: "Contract",
        costRatePerHour: "", capacityHoursPerWeek: "",
        gender: "", personalEmailId: "",
        degrees: "", specialization: "", yearOfPassing: "",
        profileSummary: "", trainingSummary: "", certificationSummary: "",
        vendorName: "", vendorContact: "",
        currentCompany: "", currentCtc: "", expectedCtc: "",
        noticePeriod: "", preferredLocation: "", comments: "",
        dateOfBirth: "",
        primaryCountryCode: "+91", primaryContactNo: "",
        secondaryCountryCode: "", secondaryContactNo: "",
        countryOfCitizenship: "",
        documentType: "", documentNumber: "",
        country: "", state: "", city: "",
        zipCode: "", street: "",
        securityClearance: "",
        visa: "", visaType: "",
        availabilityToJoin: "", interviewAvailability: "",
        highestQualification: "", universityName: "",
        dateOfQualification: "", usaDegree: "",
        currentJobTitle: "", mostRecentEmployer: "",
        totalExperience: "",
        relocate: "", currency: "INR",
        frequency: "Monthly", sourcingRate: "",
        primarySkills: [], secondarySkills: [],
        suggestedKeywords: "", resumeSummary: "",
    };

    // Add External Resource Form State
    const [newExternalResource, setNewExternalResource] = useState({ ...EMPTY_EXTERNAL });

    // Social Links state — shared by both internal & external add flows
    const [socialLinks, setSocialLinks] = useState([]);

    // Documents state — shared by both flows
    const [resourceDocuments, setResourceDocuments] = useState([]);

    // Interview Modal States
    const [isScheduleDialogOpen, setIsScheduleDialogOpen] = useState(false);
    const [availableResources, setAvailableResources] = useState([]);
    const [systemInterviewers, setSystemInterviewers] = useState([]);
    const [allRequests, setAllRequests] = useState([]);
    const [demandResourceRequests, setDemandResourceRequests] = useState([]);
    const currentUserId = localStorage.getItem('userId');
    
    const [interviewFormData, setInterviewFormData] = useState({
        id: '',
        demandId: '',
        requestId: '',
        candidateId: '',
        interviewLevels: [],
        levelsDetails: [],
        originalLevels: [],
        interviewType: 'demand'
    });
    
    const [expandedRows, setExpandedRows] = useState(new Set());
    const [interviewFormErrors, setInterviewFormErrors] = useState({
        general: '',
        requestId: '',
        candidateId: '',
        interviewLevels: '',
        levelsDetails: {}
    });

    const getCurrentResources = () => {
        return activeTab === "internal" ? internalResources : externalResources;
    };

    const getCurrentFilteredResources = () => {
        return activeTab === "internal" ? internalFilteredResources : externalFilteredResources;
    };

    const getCurrentSearchTerm = () => {
        return activeTab === "internal" ? internalSearchTerm : externalSearchTerm;
    };

    const getCurrentStatusFilter = () => {
        return activeTab === "internal" ? internalStatusFilter : externalStatusFilter;
    };

    const getCurrentRoleFilter = () => {
        return activeTab === "internal" ? internalRoleFilter : externalRoleFilter;
    };

    const setCurrentFilteredResources = (filtered) => {
        if (activeTab === "internal") {
            setInternalFilteredResources(filtered);
        } else {
            setExternalFilteredResources(filtered);
        }
    };



    useEffect(() => {
        const bench = internalResources
            .filter((r) => r.status === 'Bench')
            .map((r) => ({
                id: r.id,
                name: r.name,
                email: r.email,
                role: r.role,
                status: r.status,
            }));
        setAvailableResources(bench);
    }, [internalResources]);

    useEffect(() => {
    if (activeTab === "external" && externalResources.length === 0) {
        loadExternalResources();
    }
}, [activeTab]);

useEffect(() => {
    setCurrentPageNum(1);
    setExpandedRows(new Set());
    setSortField(null);
    setSortOrder("asc");
}, [activeTab]);

const loadInternalResources = async () => {
    try {
        const response = await EmployeeService.fetchEmployeeList();
        if (response.data.success) {
            const apiResources = response.data.result;
            const persisted = loadResumeStatusMap();
            const interviewResp = await InterviewService.fetchInterviewList();
            const allInterviews = interviewResp.data.success ? interviewResp.data.result : [];

            const mappedResources = apiResources.map((emp) => {
                const employeeInterviews = allInterviews.filter(i => i.employeeId === emp.employeeId);
                let interview = null;
                if (employeeInterviews.length) {
                    employeeInterviews.sort((a, b) => b.interviewId - a.interviewId);
                    const latest = employeeInterviews[0];
                    const levelProgress = latest.levelProgress || [];
                    const isSelected = levelProgress.some(l => l.level.startsWith('L') && l.status === 'Selected');
                    interview = {
                        id: latest.interviewId,
                        status: latest.status,
                        isSelected,
                        levelProgress,
                    };
                }

                return {
                    id: emp.employeeId.toString(),
                    name: `${emp.firstName} ${emp.lastName || ''}`.trim(),
                    role: emp.jobTitle || emp.departmentName || "Unknown",
                    skills: emp.skills?.map(s => typeof s === 'object' ? s.skillName : s) || [],
                    currentProject: emp.currentProject || null,
                    joiningDate: emp.joiningDate,
                    client: emp.currentClient || null,
                    status: emp.status === "Client" ? "Billable" : emp.status,
                    email: emp.email,
                    phone: emp.phoneNumber,
                    experience: emp.experienceYears ? `${emp.experienceYears} years` : "",
                    location: emp.location,
                    projectType: emp.employmentType,
                    photo: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150&h=150&fit=crop&crop=face",
                    previousProjects: emp.projectHistory,
                    resumeStatus: persisted[emp.employeeId.toString()] || 'pending',
                    interview,
                    gender: emp.gender,
                    personalemail: emp.personalEmailId,
                    degrees: emp.degrees,
                    specialization: emp.specialization,
                    yearOfPassing: emp.yearOfPassing,
                    profileSummary: emp.profileSummary,
                    trainingSummary: emp.trainingSummary,
                    certificationSummary: emp.certificationSummary,
                    resumeShareAudit: emp.resumeShareAudit || [],
                    resumeShareActionByUserId: emp.resumeShareActionByUserId,
                    resumeShareActionByUserName: emp.resumeShareActionByUserName,
                    resumeShareActionAt: emp.resumeShareActionAt,
                };
            });
            setInternalResources(mappedResources);
        } else {
            throw new Error("API returned failure");
        }
    } catch (error) {
        console.error('Error loading internal resources:', error);
        setInternalResources([]);
        toast.error("Failed to load internal resources from server.");
    }
};

const loadExternalResources = async () => {
    try {
        const response = await CandidateService.fetchCandidateList();
        if (response.data.success) {
            const apiCandidates = response.data.result;
            const persisted = loadExternalResumeStatusMap();

            const interviewResp = await InterviewService.fetchInterviewList();
            const allInterviews = interviewResp.data.success ? interviewResp.data.result : [];

            const mappedResources = apiCandidates.map(candidate => {
                const candidateInterviews = allInterviews.filter(i => i.candidateId === candidate.candidateId);
                let interview = null;
                if (candidateInterviews.length) {
                    candidateInterviews.sort((a, b) => b.interviewId - a.interviewId);
                    const latest = candidateInterviews[0];
                    const levelProgress = latest.levelProgress || [];
                    const isSelected = levelProgress.some(l => l.level.startsWith('L') && l.status === 'Selected');
                    interview = {
                        id: latest.interviewId,
                        status: latest.status,
                        isSelected,
                        levelProgress,
                    };
                }

                return {
                    id: candidate.candidateId.toString(),
                    name: candidate.fullName || `${candidate.firstName} ${candidate.lastName || ''}`.trim(),
                    role: candidate.specialization || "Candidate",
                    skills: candidate.skillNames || [],
                    currentProject: candidate.currentProject || null,
                    joiningDate: candidate.joiningDate,
                    client: candidate.companyName || null,
                    status: mapCandidateStatus(candidate.status),
                    email: candidate.email,
                    phone: candidate.phoneNumber,
                    experience: candidate.experienceYears ? `${candidate.experienceYears} years` : "",
                    location: candidate.location,
                    projectType: "External",
                    photo: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
                    previousProjects: [],
                    resumeStatus: persisted[candidate.candidateId.toString()] || 
                                 (candidate.resumeStatus ? candidate.resumeStatus.toLowerCase() : 'pending'),
                    interview,
                    gender: candidate.gender,
                    personalemail: candidate.personalEmailId || candidate.personalEmailld,
                    degrees: candidate.degrees,
                    specialization: candidate.specialization,
                    yearOfPassing: candidate.yearOfPassing,
                    profileSummary: candidate.profileSummary,
                    trainingSummary: candidate.trainingSummary,
                    certificationSummary: candidate.certificationSummary,
                    vendorName: candidate.vendorName || "External Vendor",
                    vendorContact: candidate.vendorContact || "N/A",
                    companyId: candidate.companyId || null,
                    departmentId: candidate.departmentId || null,
                    currentAccountId: candidate.currentAccountId || null,
                    costRatePerHour: candidate.costRatePerHour || "",
                    capacityHoursPerWeek: candidate.capacityHoursPerWeek || "",
                    currentProjectId: candidate.currentProjectId || null,
                    resumeShareAudit: candidate.resumeShareAudit || [],
                    resumeShareActionByUserId: candidate.resumeShareActionByUserId,
                    resumeShareActionByUserName: candidate.resumeShareActionByUserName,
                    resumeShareActionAt: candidate.resumeShareActionAt,
                    currentCompany: candidate.currentCompany || "",
                    currentCtc: candidate.currentCtc || "",
                    expectedCtc: candidate.expectedCtc || "",
                    noticePeriod: candidate.noticePeriod || "",
                    preferredLocation: candidate.preferredLocation || "",
                    comments: candidate.comments || "",
                };
            });

            setExternalResources(mappedResources);
            setExternalFilteredResources(mappedResources);
        } else {
            throw new Error("API returned failure");
        }
    } catch (error) {
        console.error('Error loading external resources:', error);
        setExternalResources([]);
        setExternalFilteredResources([]);
        toast.error("Failed to load external resources from server.");
    }
};

const mapCandidateStatus = (status) => {
    const statusMap = {
        'isBillable': 'Allocated',
        'available': 'Allocated',
        'engaged': 'Engaged',
        'notAvailable': 'Not Allocated'
    };
    return statusMap[status] || 'Allocated';
};

    const loadCompanies = async () => {
        try {
            const response = await EmployeeService.fetchCompanies();
            if (response.data.success) {
                setCompanies(response.data.result || []);
            }
        } catch (error) {
            console.error("Failed to load companies:", error);
            toast.error("Failed to load companies.");
        }
    };

    const loadDepartments = async () => {
        try {
            const response = await EmployeeService.fetchDepartments();
            if (response.data.success) {
                setDepartments(response.data.result || []);
            }
        } catch (error) {
            console.error("Failed to load departments:", error);
            toast.error("Failed to load departments.");
        }
    };

    const loadSkills = async () => {
        try {
            const response = await EmployeeService.fetchSkills();
            if (response.data.success) {
                const fetchedSkills = response.data.result || [];
                const fetchedNames = new Set(fetchedSkills.map(s => s.skillName.toLowerCase()));
                const uniqueStatic = staticSkillOptions
                    .filter(name => !fetchedNames.has(name.toLowerCase()))
                    .map((name, index) => ({
                        skillId: -(index + 1),
                        skillName: name
                    }));
                const combinedSkills = [...uniqueStatic, ...fetchedSkills].sort((a, b) => a.skillName.localeCompare(b.skillName));
                setSkills(combinedSkills);
                setFilteredSkills(combinedSkills.slice(0, 30).map(s => s.skillName));
            } else {
                throw new Error("API returned failure for skills");
            }
        } catch (error) {
            console.error("Error fetching skills:", error);
            const staticSkills = staticSkillOptions.map((name, index) => ({
                skillId: -(index + 1),
                skillName: name
            })).sort((a, b) => a.skillName.localeCompare(b.skillName));
            setSkills(staticSkills);
            setFilteredSkills(staticSkills.slice(0, 30).map(s => s.skillName));
            toast.error("Failed to fetch skills, using static skills");
        }
    };

    const loadProjects = async () => {
        try {
            const response = await ProjectService.fetchProjectList();
            if (response.data.success) {
                setProjects(response.data.result || []);
            } else {
                throw new Error("API returned failure for projects");
            }
        } catch (error) {
            console.error("Failed to load projects:", error);
            toast.error("Failed to load projects.");
        }
    };

    const loadActiveRequests = async () => {
        try {
            const response = await ResourceRequestService.fetchRequestList();
            if (response.data.success) {
                setAllRequests(response.data.result);
            } else {
                toast.error('Failed to fetch resource requests');
            }
        } catch (error) {
            console.error('Error loading active requests:', error);
            toast.error('Error loading resource requests');
        }
    };

    const loadInterviewers = async () => {
        try {
            const response = await UserManagementService.fetchUserList();
            if (response.data.success) {
                const interviewersList = response.data.result.map(user => ({
                    id: user.userId,
                    displayName: `${user.employeeName} (${user.roleName})`
                }));
                setSystemInterviewers(interviewersList);
            } else {
                toast.error('Failed to fetch users');
            }
        } catch (error) {
            console.error('Error loading interviewers:', error);
            toast.error('Error loading users');
        }
    };

    const loadOpportunityGroups = async () => {
        try {
            const response = await ResourceRequestService.fetchResourceRequestGroups();
            if (response.data.success) {
                setOpportunityGroups(response.data.result || []);
            } else {
                toast.error('Failed to fetch opportunity groups');
            }
        } catch (error) {
            console.error('Error loading opportunity groups:', error);
            toast.error('Error loading opportunity groups');
        }
    };

    useEffect(() => {
        loadInternalResources();
        loadCompanies();
        loadDepartments();
        loadSkills();
        loadProjects();
        loadActiveRequests();
        loadInterviewers();
        loadOpportunityGroups();
        loadDemandGroups();
    }, []);

    useEffect(() => {
        let filtered = activeTab === "internal" ? internalResources : externalResources;
        const searchTerm = activeTab === "internal" ? internalSearchTerm : externalSearchTerm;
        const statusFilter = activeTab === "internal" ? internalStatusFilter : externalStatusFilter;
        const roleFilter = activeTab === "internal" ? internalRoleFilter : externalRoleFilter;

        if (searchTerm) {
            filtered = filtered.filter(
                (resource) =>
                    resource.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    resource.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    resource.skills.some((skill) =>
                        skill.toLowerCase().includes(searchTerm.toLowerCase())
                    ) ||
                    (resource.client && resource.client.toLowerCase().includes(searchTerm.toLowerCase())) ||
                    (resource.currentProject && resource.currentProject.toLowerCase().includes(searchTerm.toLowerCase()))
            );
        }
        if (statusFilter !== "All") {
            filtered = filtered.filter((resource) => resource.status === statusFilter);
        }
        if (roleFilter !== "All") {
            filtered = filtered.filter((resource) => resource.role === roleFilter);
        }
        if (sortField) {
            filtered.sort((a, b) => {
                let aValue = a[sortField];
                let bValue = b[sortField];
                if (aValue === null) aValue = "";
                if (bValue === null) bValue = "";
                const aStr = String(aValue).toLowerCase();
                const bStr = String(bValue).toLowerCase();
                if (sortOrder === "asc") {
                    return aStr.localeCompare(bStr);
                } else {
                    return bStr.localeCompare(aStr);
                }
            });
        }
        setCurrentFilteredResources(filtered);
    }, [internalSearchTerm, internalStatusFilter, internalRoleFilter, internalResources, externalSearchTerm, externalStatusFilter, externalRoleFilter, externalResources, sortField, sortOrder, activeTab]);

    const toggleRow = (id) => {
        setExpandedRows(prev => {
            const newSet = new Set(prev);
            if (newSet.has(id)) {
                newSet.clear();
            } else {
                newSet.clear();
                newSet.add(id);
            }
            return newSet;
        });
    };

    const handleSort = (field) => {
        if (sortField === field) {
            setSortOrder(sortOrder === "asc" ? "desc" : "asc");
        } else {
            setSortField(field);
            setSortOrder("asc");
        }
    };

    const getSortIcon = (field) => {
        if (sortField !== field) {
            return <ArrowUpDown className="w-4 h-4" />;
        }
        return sortOrder === "asc" ? (
            <ArrowUp className="w-4 h-4" />
        ) : (
            <ArrowDown className="w-4 h-4" />
        );
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${day}-${month}-${year}`;
    };

    const uniqueInternalRoles = Array.from(new Set(internalResources.map((r) => r.role)));
    const uniqueExternalRoles = Array.from(new Set(externalResources.map((r) => r.role)));

    const goToPage = (page) => {
        const totalPages = Math.ceil(getCurrentFilteredResources().length / itemsPerPage);
        setCurrentPageNum(Math.max(1, Math.min(page, totalPages)));
    };

    const handleResumeParsed = (parsedData, file, hasPartialData = false) => {
        setIsResumeUploadStepOpen(false);
        setIsAddModalOpen(true);
        setResumeFile(file);

        if (hasPartialData) {
            toast.warning('Some fields could not be extracted — please review and complete the highlighted fields.');
        }

        const use = (parsed, fallback) =>
            (parsed !== null && parsed !== undefined && parsed !== '') ? parsed : fallback;

        const splitPhone = (raw = '') => {
            if (!raw) return { code: '', num: '' };
            const m = raw.match(/^(\+\d{1,3})([\d\s\-]+)$/);
            if (m) return { code: m[1].trim(), num: m[2].replace(/\D/g, '') };
            return { code: '', num: raw.replace(/\D/g, '') };
        };

        const mapQualification = (deg = '') => {
            const d = deg.toLowerCase();
            if (d.includes('phd') || d.includes('ph.d') || d.includes('doctorate')) return "PhD";
            if (d.includes('master') || d.includes('m.tech') || d.includes('mca') || d.includes('mba') || d.includes('m.sc') || d.includes('m.e')) return "Master's Degree";
            if (d.includes('bachelor') || d.includes('b.tech') || d.includes('be') || d.includes('bca') || d.includes('b.sc') || d.includes('b.com') || d.includes('b.e')) return "Bachelor's Degree";
            if (d.includes('diploma')) return "Diploma";
            if (d.includes('certif')) return "Certification";
            return deg ? 'Other' : '';
        };

        const primary = splitPhone(parsedData.phoneNumber);
        const secondary = splitPhone(parsedData.secondaryPhone);
        const qualLabel = use(parsedData.highestQualification, mapQualification(parsedData.degrees));

        const commonPatch = (prev) => ({
            firstName:            use(parsedData.firstName, prev.firstName),
            middleName:           use(parsedData.middleName, prev.middleName),
            lastName:             use(parsedData.lastName, prev.lastName),
            email:                use(parsedData.email, prev.email),
            personalEmailId:      use(parsedData.personalEmail, prev.personalEmailId),
            dateOfBirth:          use(parsedData.dateOfBirth, prev.dateOfBirth),
            gender:               use(parsedData.gender, prev.gender),
            primaryCountryCode:   use(primary.code, prev.primaryCountryCode),
            primaryContactNo:     use(primary.num, prev.primaryContactNo),
            secondaryCountryCode: use(secondary.code, prev.secondaryCountryCode),
            secondaryContactNo:   use(secondary.num, prev.secondaryContactNo),
            countryOfCitizenship: use(parsedData.countryOfCitizenship, prev.countryOfCitizenship),
            visa:                 use(parsedData.visa, prev.visa),
            visaType:             use(parsedData.visaType, prev.visaType),
            country:              use(parsedData.country, prev.country),
            state:                use(parsedData.state, prev.state),
            city:                 use(parsedData.city, prev.city),
            zipCode:              use(parsedData.zipCode, prev.zipCode),
            street:               use(parsedData.street, prev.street),
            location:             use(parsedData.location, prev.location),
            totalExperience:      use(parsedData.experienceYears, prev.totalExperience),
            currentJobTitle:      use(parsedData.role, prev.currentJobTitle),
            mostRecentEmployer:   use(parsedData.currentCompany, prev.mostRecentEmployer),
            employmentType:       use(parsedData.employmentType, prev.employmentType),
            highestQualification: use(qualLabel, prev.highestQualification),
            universityName:       use(parsedData.universityName, prev.universityName),
            specialization:       use(parsedData.specialization, prev.specialization),
            degrees:              use(parsedData.degrees, prev.degrees),
            yearOfPassing:        use(parsedData.yearOfPassing, prev.yearOfPassing),
            dateOfQualification:  use(parsedData.dateOfQualification, prev.dateOfQualification),
            usaDegree:            use(parsedData.usaDegree, prev.usaDegree),
            primarySkills:        parsedData.skills?.length > 0 ? parsedData.skills : prev.primarySkills,
            secondarySkills:      parsedData.secondarySkills?.length > 0 ? parsedData.secondarySkills : prev.secondarySkills,
            suggestedKeywords:    use(parsedData.suggestedKeywords, prev.suggestedKeywords),
            resumeSummary:        use(parsedData.profileSummary, prev.resumeSummary),
            experienceYears:      use(parsedData.experienceYears, prev.experienceYears),
            role:                 use(parsedData.role, prev.role),
            currentCompany:       use(parsedData.currentCompany, prev.currentCompany),
            profileSummary:       use(parsedData.profileSummary, prev.profileSummary),
            trainingSummary:      use(parsedData.trainingSummary, prev.trainingSummary),
            certificationSummary: use(parsedData.certificationSummary, prev.certificationSummary),
        });

        if (activeTab === 'internal') {
            setNewEmployee(prev => ({ ...prev, ...commonPatch(prev) }));
        } else {
            setNewExternalResource(prev => ({ ...prev, ...commonPatch(prev) }));
        }

        const autoFilled = {};
        const fieldMap = {
            firstName:            parsedData.firstName,
            middleName:           parsedData.middleName,
            lastName:             parsedData.lastName,
            email:                parsedData.email,
            personalEmailId:      parsedData.personalEmail,
            dateOfBirth:          parsedData.dateOfBirth,
            gender:               parsedData.gender,
            primaryCountryCode:   primary.code,
            primaryContactNo:     primary.num,
            secondaryCountryCode: secondary.code,
            secondaryContactNo:   secondary.num,
            countryOfCitizenship: parsedData.countryOfCitizenship,
            visa:                 parsedData.visa,
            visaType:             parsedData.visaType,
            country:              parsedData.country,
            state:                parsedData.state,
            city:                 parsedData.city,
            zipCode:              parsedData.zipCode,
            street:               parsedData.street,
            totalExperience:      parsedData.experienceYears,
            currentJobTitle:      parsedData.role,
            mostRecentEmployer:   parsedData.currentCompany,
            employmentType:       parsedData.employmentType,
            highestQualification: qualLabel,
            universityName:       parsedData.universityName,
            specialization:       parsedData.specialization,
            dateOfQualification:  parsedData.dateOfQualification,
            usaDegree:            parsedData.usaDegree,
            resumeSummary:        parsedData.profileSummary,
            primarySkills:        parsedData.skills?.length > 0 ? true : null,
            secondarySkills:      parsedData.secondarySkills?.length > 0 ? true : null,
            suggestedKeywords:    parsedData.suggestedKeywords,
        };
        Object.entries(fieldMap).forEach(([k, v]) => {
            if (v !== null && v !== undefined && v !== '' && !(Array.isArray(v) && v.length === 0)) {
                autoFilled[k] = true;
            }
        });
        setAutoFilledFields(autoFilled);

        const parsedSocialLinks = [];
        if (parsedData.linkedIn)  parsedSocialLinks.push({ linkType: 'LinkedIn',  link: parsedData.linkedIn });
        if (parsedData.github)    parsedSocialLinks.push({ linkType: 'GitHub',    link: parsedData.github });
        if (parsedData.portfolio) parsedSocialLinks.push({ linkType: 'Portfolio', link: parsedData.portfolio });
        if (parsedData.leetcode)  parsedSocialLinks.push({ linkType: 'LeetCode',  link: parsedData.leetcode });
        if (parsedData.hackerrank) parsedSocialLinks.push({ linkType: 'HackerRank', link: parsedData.hackerrank });
        if (parsedSocialLinks.length > 0) {
            setSocialLinks(parsedSocialLinks);
        }
    };


    const handleSkipResume = () => {
        setIsResumeUploadStepOpen(false);
        setAutoFilledFields({});
        setIsAddModalOpen(true);
    };

    const handleAddResource = async () => {
        if (
            !newEmployee.companyId ||
            !newEmployee.firstName ||
            !newEmployee.email ||
            !newEmployee.departmentId
        ) {
            toast.error("Please fill in all required fields (Company, First Name, Email, Role)");
            return;
        }
        const formData = new FormData();
        formData.append("companyId", newEmployee.companyId.toString());
        formData.append("firstName", newEmployee.firstName.trim());
        formData.append("lastName", newEmployee.lastName ? newEmployee.lastName.trim() : "");
        formData.append("email", newEmployee.email);
        formData.append("phoneNumber", newEmployee.phoneNumber);
        formData.append("departmentId", newEmployee.departmentId.toString());
        formData.append("experienceYears", Number(newEmployee.experienceYears) || 0);
        formData.append("location", newEmployee.location);
        formData.append("joiningDate", newEmployee.joiningDate || new Date().toISOString().split("T")[0]);
        formData.append("employmentType", newEmployee.employmentType);
        formData.append("costRatePerHour", Number(newEmployee.costRatePerHour) || 0);
        formData.append("capacityHoursPerWeek", Number(newEmployee.capacityHoursPerWeek) || 0);
        formData.append("status", newEmployee.status === "Billable" ? "Billable" : newEmployee.status);
        if (newEmployee.status === "Billable" && newEmployee.currentProjectId) {
            formData.append("currentProjectId", newEmployee.currentProjectId.toString());
            if (newEmployee.currentAccountId) {
                formData.append("currentAccountId", newEmployee.currentAccountId.toString());
            }
        }
        selectedSkills.forEach((s) => {
            if (s.skillId > 0) {
                formData.append("skillIds", s.skillId.toString());
            }
        });
        formData.append("gender", newEmployee.gender);
        formData.append("personalEmailId", newEmployee.personalEmailId);
        formData.append("degrees", newEmployee.degrees);
        formData.append("specialization", newEmployee.specialization);
        formData.append("yearOfPassing", newEmployee.yearOfPassing ? Number(newEmployee.yearOfPassing) : "");
        formData.append("profileSummary", newEmployee.profileSummary || "");
        formData.append("trainingSummary", newEmployee.trainingSummary || "");
        formData.append("certificationSummary", newEmployee.certificationSummary || "");
        if (newEmployee.middleName)           formData.append("middleName", newEmployee.middleName);
        if (newEmployee.dateOfBirth)          formData.append("dateOfBirth", newEmployee.dateOfBirth);
        if (newEmployee.primaryCountryCode)   formData.append("primaryCountryCode", newEmployee.primaryCountryCode);
        if (newEmployee.primaryContactNo)     formData.append("primaryContactNo", newEmployee.primaryContactNo);
        if (newEmployee.secondaryCountryCode) formData.append("secondaryCountryCode", newEmployee.secondaryCountryCode);
        if (newEmployee.secondaryContactNo)   formData.append("secondaryContactNo", newEmployee.secondaryContactNo);
        if (newEmployee.countryOfCitizenship) formData.append("countryOfCitizenship", newEmployee.countryOfCitizenship);
        if (newEmployee.documentType)         formData.append("documentType", newEmployee.documentType);
        if (newEmployee.documentNumber)       formData.append("documentNumber", newEmployee.documentNumber);
        if (newEmployee.securityClearance)    formData.append("securityClearance", newEmployee.securityClearance);
        if (newEmployee.visa)                 formData.append("visa", newEmployee.visa);
        if (newEmployee.visaType)             formData.append("visaType", newEmployee.visaType);
        if (newEmployee.country)              formData.append("country", newEmployee.country);
        if (newEmployee.state)                formData.append("state", newEmployee.state);
        if (newEmployee.city)                 formData.append("city", newEmployee.city);
        if (newEmployee.zipCode)              formData.append("zipCode", newEmployee.zipCode);
        if (newEmployee.street)               formData.append("street", newEmployee.street);
        if (newEmployee.availabilityToJoin)   formData.append("availabilityToJoin", newEmployee.availabilityToJoin);
        if (newEmployee.interviewAvailability) formData.append("interviewAvailability", newEmployee.interviewAvailability);
        if (newEmployee.highestQualification) formData.append("highestQualification", newEmployee.highestQualification);
        if (newEmployee.universityName)       formData.append("universityName", newEmployee.universityName);
        if (newEmployee.dateOfQualification)  formData.append("dateOfQualification", newEmployee.dateOfQualification);
        if (newEmployee.usaDegree)            formData.append("usaDegree", newEmployee.usaDegree);
        if (newEmployee.currentJobTitle)      formData.append("currentJobTitle", newEmployee.currentJobTitle);
        if (newEmployee.mostRecentEmployer)   formData.append("mostRecentEmployer", newEmployee.mostRecentEmployer);
        if (newEmployee.totalExperience)      formData.append("totalExperience", Number(newEmployee.totalExperience));
        if (newEmployee.relocate)             formData.append("relocate", newEmployee.relocate);
        if (newEmployee.currency)             formData.append("currency", newEmployee.currency);
        if (newEmployee.frequency)            formData.append("frequency", newEmployee.frequency);
        if (newEmployee.sourcingRate)         formData.append("sourcingRate", Number(newEmployee.sourcingRate));
        if (newEmployee.resumeSummary)        formData.append("resumeSummary", newEmployee.resumeSummary);
        if (newEmployee.suggestedKeywords)    formData.append("suggestedKeywords", newEmployee.suggestedKeywords);
        if (Array.isArray(newEmployee.primarySkills)   && newEmployee.primarySkills.length > 0)
            formData.append("primarySkills",   JSON.stringify(newEmployee.primarySkills));
        if (Array.isArray(newEmployee.secondarySkills) && newEmployee.secondarySkills.length > 0)
            formData.append("secondarySkills", JSON.stringify(newEmployee.secondarySkills));
        if (Array.isArray(socialLinks) && socialLinks.length > 0)
            formData.append("socialLinks", JSON.stringify(socialLinks));
        if (resumeFile) {
            formData.append("resume", resumeFile);
            formData.append("storageType", storageType);
        }
        try {
            const response = await EmployeeService.createEmployee(formData);
            if (response.data.success) {
                toast.success("Resource added successfully!");
                setIsAddModalOpen(false);
                loadInternalResources();
                setNewEmployee({ ...EMPTY_INTERNAL });
                setSelectedSkills([]);
                setSkillInput("");
                setSocialLinks([]);
                setResourceDocuments([]);
                setResumeFile(null);
                setStorageType("aws");
            } else {
            let errorMessage = "Failed to add resource.";
            if (response && response.data && response.data.errors && response.data.errors.length > 0) {
                errorMessage = response.data.errors[0];
            } 
            else if (response && response.data && response.data.message) {
                errorMessage = response.data.message;
            }
            else if (response && response.data && response.data.error) {
                errorMessage = response.data.error;
            }
            toast.error(errorMessage);
            }
} catch (error) {
    console.error("Error adding Internal resource:", error.response?.data || error.message);
    let errorMessage = "Error adding Internal resource";
    if (error.response?.data?.errors && error.response.data.errors.length > 0) {
        errorMessage = error.response.data.errors[0];
    } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
    } else {
        errorMessage = error.message;
    }
    toast.error(errorMessage);
}
    };

const handleAddExternalResource = async () => {
    if (!newExternalResource.firstName || !newExternalResource.email) {
        toast.error("Please fill in all required fields (First Name, Email)");
        return;
    }

    const formData = new FormData();
    const companyId = companies.length > 0 ? companies[0].companyId : 1;
    formData.append("companyId", companyId.toString());
    
    formData.append("firstName", newExternalResource.firstName.trim());
    formData.append("lastName", newExternalResource.lastName ? newExternalResource.lastName.trim() : "");
    formData.append("email", newExternalResource.email);
    formData.append("phoneNumber", newExternalResource.phoneNumber || "");
    formData.append("experienceYears", Number(newExternalResource.experienceYears) || 0);
    formData.append("location", newExternalResource.location || "");
    formData.append("joiningDate", newExternalResource.joiningDate || new Date().toISOString().split("T")[0]);
    
    const statusMapping = {
        'Allocated': 'isBillable',
        'Engaged': 'engaged',
        'Not Allocated': 'notAvailable'
    };
    const apiStatus = statusMapping[newExternalResource.status] || 'isBillable';
    formData.append("status", apiStatus);
    
    formData.append("gender", newExternalResource.gender || "");
    formData.append("personalEmailld", newExternalResource.personalEmailId || "");
    formData.append("degrees", newExternalResource.degrees || "");
    formData.append("specialization", newExternalResource.specialization || "");
    formData.append("yearOfPassing", newExternalResource.yearOfPassing ? Number(newExternalResource.yearOfPassing) : "");
    formData.append("profileSummary", newExternalResource.profileSummary || "");
    formData.append("trainingSummary", newExternalResource.trainingSummary || "");
    formData.append("certificationSummary", newExternalResource.certificationSummary || "");
    formData.append("currentCompany", newExternalResource.currentCompany || "");
    formData.append("currentCtc", newExternalResource.currentCtc ? Number(newExternalResource.currentCtc) : 0);
    formData.append("expectedCtc", newExternalResource.expectedCtc ? Number(newExternalResource.expectedCtc) : 0);
    formData.append("noticePeriod", newExternalResource.noticePeriod || "");
    formData.append("preferredLocation", newExternalResource.preferredLocation || "");
    formData.append("comments", newExternalResource.comments || "");
    formData.append("vendorName", newExternalResource.vendorName || "");
    formData.append("vendorContact", newExternalResource.vendorContact || "");
    if (newExternalResource.middleName)           formData.append("middleName", newExternalResource.middleName);
    if (newExternalResource.dateOfBirth)          formData.append("dateOfBirth", newExternalResource.dateOfBirth);
    if (newExternalResource.primaryCountryCode)   formData.append("primaryCountryCode", newExternalResource.primaryCountryCode);
    if (newExternalResource.primaryContactNo)     formData.append("primaryContactNo", newExternalResource.primaryContactNo);
    if (newExternalResource.secondaryCountryCode) formData.append("secondaryCountryCode", newExternalResource.secondaryCountryCode);
    if (newExternalResource.secondaryContactNo)   formData.append("secondaryContactNo", newExternalResource.secondaryContactNo);
    if (newExternalResource.countryOfCitizenship) formData.append("countryOfCitizenship", newExternalResource.countryOfCitizenship);
    if (newExternalResource.documentType)         formData.append("documentType", newExternalResource.documentType);
    if (newExternalResource.documentNumber)       formData.append("documentNumber", newExternalResource.documentNumber);
    if (newExternalResource.securityClearance)    formData.append("securityClearance", newExternalResource.securityClearance);
    if (newExternalResource.visa)                 formData.append("visa", newExternalResource.visa);
    if (newExternalResource.visaType)             formData.append("visaType", newExternalResource.visaType);
    if (newExternalResource.country)              formData.append("country", newExternalResource.country);
    if (newExternalResource.state)                formData.append("state", newExternalResource.state);
    if (newExternalResource.city)                 formData.append("city", newExternalResource.city);
    if (newExternalResource.zipCode)              formData.append("zipCode", newExternalResource.zipCode);
    if (newExternalResource.street)               formData.append("street", newExternalResource.street);
    if (newExternalResource.availabilityToJoin)   formData.append("availabilityToJoin", newExternalResource.availabilityToJoin);
    if (newExternalResource.interviewAvailability) formData.append("interviewAvailability", newExternalResource.interviewAvailability);
    if (newExternalResource.highestQualification) formData.append("highestQualification", newExternalResource.highestQualification);
    if (newExternalResource.universityName)       formData.append("universityName", newExternalResource.universityName);
    if (newExternalResource.dateOfQualification)  formData.append("dateOfQualification", newExternalResource.dateOfQualification);
    if (newExternalResource.usaDegree)            formData.append("usaDegree", newExternalResource.usaDegree);
    if (newExternalResource.currentJobTitle)      formData.append("currentJobTitle", newExternalResource.currentJobTitle);
    if (newExternalResource.mostRecentEmployer)   formData.append("mostRecentEmployer", newExternalResource.mostRecentEmployer);
    if (newExternalResource.totalExperience)      formData.append("totalExperience", Number(newExternalResource.totalExperience));
    if (newExternalResource.relocate)             formData.append("relocate", newExternalResource.relocate);
    if (newExternalResource.currency)             formData.append("currency", newExternalResource.currency);
    if (newExternalResource.frequency)            formData.append("frequency", newExternalResource.frequency);
    if (newExternalResource.sourcingRate)         formData.append("sourcingRate", Number(newExternalResource.sourcingRate));
    if (newExternalResource.resumeSummary)        formData.append("resumeSummary", newExternalResource.resumeSummary);
    if (newExternalResource.suggestedKeywords)    formData.append("suggestedKeywords", newExternalResource.suggestedKeywords);
    if (Array.isArray(newExternalResource.primarySkills)   && newExternalResource.primarySkills.length > 0)
        formData.append("primarySkills",   JSON.stringify(newExternalResource.primarySkills));
    if (Array.isArray(newExternalResource.secondarySkills) && newExternalResource.secondarySkills.length > 0)
        formData.append("secondarySkills", JSON.stringify(newExternalResource.secondarySkills));
    if (Array.isArray(socialLinks) && socialLinks.length > 0)
        formData.append("socialLinks", JSON.stringify(socialLinks));

    selectedSkills.forEach((s) => {
        if (s.skillId > 0) {
            formData.append("skillIds", s.skillId.toString());
        }
    });

    if (resumeFile) {
        formData.append("resume", resumeFile);
    }
    
    try {
        const response = await CandidateService.createCandidate(formData);
        if (response.data.success) {
            toast.success("External candidate added successfully!");
            setIsAddModalOpen(false);
            await loadExternalResources();
            setNewExternalResource({ ...EMPTY_EXTERNAL });
            setSelectedSkills([]);
            setSkillInput("");
            setSocialLinks([]);
            setResourceDocuments([]);
            setResumeFile(null);
        } else {
            let errorMessage = "Failed to add external candidate.";
            if (response && response.data && response.data.errors && response.data.errors.length > 0) {
                errorMessage = response.data.errors[0];
            } 
            else if (response && response.data && response.data.message) {
                errorMessage = response.data.message;
            }
            else if (response && response.data && response.data.error) {
                errorMessage = response.data.error;
            }
            toast.error(errorMessage);
        }
} catch (error) {
    console.error("Error adding external candidate:", error.response?.data || error.message);
    let errorMessage = "Error adding external candidate";
    if (error.response?.data?.errors && error.response.data.errors.length > 0) {
        errorMessage = error.response.data.errors[0];
    } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
    } else {
        errorMessage = error.message;
    }
    toast.error(errorMessage);
}
};

    const handleImport = () => {
        setIsImportModalOpen(true);
    };

    const handleImportFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const fileName = file.name.toLowerCase();
            if (!fileName.endsWith('.csv') && !fileName.endsWith('.xlsx') && !fileName.endsWith('.xls')) {
                toast.error("Please upload only CSV or Excel files (.csv, .xls, .xlsx)");
                return;
            }
            setImportFile(file);
        }
    };

const handleSubmitImport = async () => {
    if (!importCompanyId) {
        toast.error("Please select a company");
        return;
    }
    if (!importFile) {
        toast.error("Please select a file");
        return;
    }
    
    const formData = new FormData();
    formData.append("companyId", importCompanyId);
    formData.append("file", importFile);
    
    try {
        let response;
        if (activeTab === "internal") {
            response = await EmployeeService.importExcel(formData);
        } else {
            response = await CandidateService.importExcel(formData);
        }
        if (response.data.success) {
            const successMessage = activeTab === "internal" 
                ? "Employees imported successfully!" 
                : "Candidates imported successfully!";
            toast.success(successMessage);
            setIsImportModalOpen(false);
            setImportCompanyId(null);
            setImportFile(null);
            if (activeTab === "internal") {
                loadInternalResources();
            } else {
                loadExternalResources();
            }
            return;
        }
        if (Array.isArray(response.data.errors) && response.data.errors.length > 0) {
            const errorMsg = response.data.errors.join("\n");
            toast.error(<div className="whitespace-pre-line text-left">{errorMsg}</div>, { duration: 8000 });
            return;
        }
        toast.error(`Import failed: ${response.data.message || "Unknown error"}`);
    } catch (error) {
        console.error("Import error:", error);
        if (error.response?.data?.errors && Array.isArray(error.response.data.errors)) {
            const errorMsg = error.response.data.errors.join("\n");
            toast.error(<div className="whitespace-pre-line text-left">{errorMsg}</div>, { duration: 8000 });
            return;
        }
        const errorMessage = activeTab === "internal"
            ? "Failed to import employees. Please try again."
            : "Failed to import candidates. Please try again.";
        toast.error(errorMessage);
    }
};

    const getStatusColor = (status) => {
        switch (status) {
            case "Billable":
                return "bg-blue-100 text-blue-700 border-blue-200";
            case "Bench":
                return "bg-red-100 text-red-700 border-red-200";
            case "Bench Shadow":
                return "bg-yellow-100 text-yellow-700 border-yellow-200";
            case "Internal":
                return "bg-green-100 text-green-700 border-green-200";
            case "Allocated":
                return "bg-green-100 text-green-700 border-green-200";
            case "Engaged":
                return "bg-blue-100 text-blue-700 border-blue-200";
            case "Not Allocated":
                return "bg-red-100 text-red-700 border-red-200";
            default:
                return "bg-gray-100 text-gray-700 border-gray-200";
        }
    };

const handleScheduleInterview = (resource) => {
    const sharedDemands = (resource.resumeShareAudit || []).filter(audit => audit.status === 'Shared' && audit.type === 'DEMAND');
    if (sharedDemands.length === 0) {
        toast.error("This resource is not linked to any demand yet. Please share the resume to a demand before scheduling interview.");
        return;
    }
    setInterviewFormData({
        id: '',
        demandId: '',
        requestId: '',
        candidateId: resource.id.toString(),
        candidateName: resource.name,
        interviewLevels: [],
        levelsDetails: [],
        originalLevels: [],
        interviewType: 'demand'
    });
    setDemandResourceRequests([]);
    setIsScheduleDialogOpen(true);
};

const handleScheduleInterviewFromAudit = (resource, audit) => {
    let request = null;
    if (audit.type === 'GROUP' || audit.type === 'OPPORTUNITY') {
        request = allRequests.find(req => req.groupId === audit.groupId);
    } else if (audit.type === 'DEMAND') {
        request = allRequests.find(req => req.demandId === audit.demandId);
    }
    if (!request) {
        toast.error('Could not find the corresponding request. Please try again.');
        return;
    }
    setInterviewFormData({
        id: '',
        requestId: request.requestId.toString(),
        candidateId: resource.id,
        interviewLevels: [],
        levelsDetails: [],
        originalLevels: [],
        interviewType: audit.type === 'DEMAND' ? 'demand' : 'opportunity'
    });
    setIsScheduleDialogOpen(true);
};

const handleFormChange = (field, value) => {
    if (field === 'interviewLevels') {
        let newLvls = value;
        newLvls = newLvls.sort((a, b) => a.localeCompare(b));
        setInterviewFormData((prev) => ({
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
        setInterviewFormData((prev) => ({
            ...prev,
            interviewType: value,
            demandId: '',
            requestId: '', 
            candidateId: '' 
        }));
        setDemandResourceRequests([]);
    } else if (field === 'demandId') {
        setInterviewFormData((prev) => ({
            ...prev,
            demandId: value,
            requestId: '',
        }));
        InterviewService.getResourceRequestsByDemand(value)
            .then(requests => {
                setDemandResourceRequests(requests || []);
                setInterviewFormData((prev) => {
                    const matchingReq = (requests || []).find(r =>
                        r.employeeId?.toString() === prev.candidateId?.toString() ||
                        r.candidateId?.toString() === prev.candidateId?.toString()
                    );
                    return {
                        ...prev,
                        requestId: matchingReq ? matchingReq.requestId.toString() : ''
                    };
                });
            })
            .catch(error => {
                console.error("Error fetching demand requests", error);
                toast.error('Failed to load resource requests for demand');
            });
    } else if (field === 'requestId') {
        setInterviewFormData((prev) => {
            const nextState = { ...prev, requestId: value };
            if (prev.interviewType === 'demand') {
                const selectedRR = demandResourceRequests.find(r => r.requestId.toString() === value.toString());
                if (selectedRR) {
                    nextState.candidateId = (selectedRR.employeeId || selectedRR.candidateId)?.toString() || '';
                }
            }
            return nextState;
        });
    } else if (field === 'candidateId') {
        setInterviewFormData((prev) => ({ 
            ...prev, 
            [field]: value 
        }));
        clearInterviewFieldError('candidateId');
    } else {
        setInterviewFormData((prev) => ({ ...prev, [field]: value }));
    }
};

const handleLevelChange = (level, field, value) => {
    setInterviewFormData((prev) => ({
        ...prev,
        levelsDetails: prev.levelsDetails.map((d) =>
            d.level === level ? { ...d, [field]: value } : d
        ),
    }));
};

const clearInterviewFieldError = (field) => {
    setInterviewFormErrors(prev => ({
        ...prev,
        [field]: '',
        general: ''
    }));
};

const handleSubmitInterview = () => {
    setInterviewFormErrors({
        general: '',
        requestId: '',
        candidateId: '',
        interviewLevels: '',
        levelsDetails: {}
    });

    let hasErrors = false;
    const newErrors = {
        general: '',
        requestId: '',
        candidateId: '',
        interviewLevels: '',
        levelsDetails: {}
    };

    if (!interviewFormData.requestId) {
        newErrors.requestId = 'Resource request is required';
        hasErrors = true;
    }
    if (interviewFormData.interviewType === 'demand' && !interviewFormData.demandId) {
        newErrors.demandId = 'Demand is required';
        hasErrors = true;
    }
    if (!interviewFormData.candidateId) {
        newErrors.candidateId = 'Candidate is required';
        hasErrors = true;
    }
    if (interviewFormData.interviewLevels.length === 0) {
        newErrors.interviewLevels = 'At least one interview level is required';
        hasErrors = true;
    }

    const isDemand = interviewFormData.interviewType === 'demand';
    interviewFormData.levelsDetails.forEach((d, index) => {
        const levelErrors = {};
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
        if (Object.keys(levelErrors).length > 0) {
            newErrors.levelsDetails[d.level] = levelErrors;
        }
    });

    if (hasErrors) {
        setInterviewFormErrors(newErrors);
        return;
    }

    const levels = interviewFormData.levelsDetails.map((d) => {
        const [year, month, day] = d.date.split('-');
        const formattedDate = `${day}-${month}-${year}`;
        const formattedTime = d.time.replace(':', '-');
        const timeParts = formattedTime.split('-');
        const hours = timeParts[0].padStart(2, '0');
        const minutes = timeParts[1].padStart(2, '0');
        const finalTime = `${hours}-${minutes}`;
        return {
            level: d.level,
            scheduledAt: `${formattedDate} ${finalTime}`,
            interviewNotes: d.notes || '',
            ...(isDemand ? {} : { interviewerUserId: d.interviewer ? parseInt(d.interviewer) : null }),
        };
    });

    const submitAction = async () => {
        try {
            let res;
            const isDemand = interviewFormData.interviewType === 'demand';
            if (activeTab === "internal") {
                if (isDemand) {
                    res = await InterviewService.createBatchInterview(parseInt(interviewFormData.requestId), parseInt(interviewFormData.candidateId), null, currentUserId, interviewFormData.interviewLevels, levels);
                } else {
                    res = await InterviewService.createInterview(parseInt(interviewFormData.requestId), parseInt(interviewFormData.candidateId), null, null, interviewFormData.interviewLevels, levels);
                }
            } else {
                if (isDemand) {
                    res = await InterviewService.createBatchInterview(parseInt(interviewFormData.requestId), null, parseInt(interviewFormData.candidateId), currentUserId, interviewFormData.interviewLevels, levels);
                } else {
                    res = await InterviewService.createInterview(parseInt(interviewFormData.requestId), null, parseInt(interviewFormData.candidateId), null, interviewFormData.interviewLevels, levels);
                }
            }
            if (res.data.success) {
                setIsScheduleDialogOpen(false);
                if (activeTab === "internal") loadInternalResources(); else loadExternalResources();
                toast.success('Interview scheduled and mail sent successfully');
            } else {
                const errorMessage = res.data.errors?.join(', ') || 'Unknown error';
                throw new Error(errorMessage);
            }
        } catch (error) {
            let errorMessage = 'Unexpected error occurred';
            if (error.response && error.response.data) {
                const responseData = error.response.data;
                errorMessage = responseData.errors?.join(', ') || responseData.message || error.message;
            } else if (error.message) {
                errorMessage = error.message;
            }
            setInterviewFormErrors(prev => ({ ...prev, general: errorMessage }));
        }
    };
    submitAction();
};

const handleViewResume = async (id) => {
    try {
        let response;
        if (activeTab === "internal") response = await EmployeeService.viewResume(id);
        else response = await CandidateService.viewResume(id);
        const contentType = response.headers['content-type'] || 'application/pdf';
        const blob = new Blob([response.data], { type: contentType });
        const url = window.URL.createObjectURL(blob);
        setResumeUrl(url);
        setResumeFileName(`${activeTab === "internal" ? "Internal EMP" : "External EMP"}-${id}.${contentType.split('/')[1] || 'pdf'}`);
        setIsResumeModalOpen(true);
    } catch (error) {
        console.error("Error viewing resume:", error);
        toast.error("Failed to load resume.");
    }
};

    const handleSkillMatcher = async (resource) => {
        try {
            const data = await SkillMatcherService.matchSkills();
            const matches = data.response || data;
            const employeeMatch = matches.find(em => em.employee_id === parseInt(resource.id));
            if (employeeMatch) {
                setSkillMatches(employeeMatch.status);
                setIsSkillMatcherModalOpen(true);
            } else {
                toast.warning('No matching data found for this resource.');
            }
        } catch (error) {
            toast.error("Failed to fetch skill matches.");
        }
    };

    const handleResumeShare = (employeeId) => {
        setSelectedEmployeeForShare(employeeId);
        setSelectedItems([]);
        setSelectedType('demand');
        setIsShareDialogOpen(true);
    };

    const handleResumeReject = (employeeId) => {
        setSelectedEmployeeForReject(employeeId);
        setSelectedItems([]);
        setSelectedType('demand');
        setIsRejectDialogOpen(true);
    };

    const handleResumePending = (employeeId) => {
        if (activeTab === "internal") {
            const newMap = { ...loadResumeStatusMap(), [employeeId]: "pending" };
            saveResumeStatusMap(newMap);
            setInternalResources(prev => prev.map(r => r.id === employeeId ? { ...r, resumeStatus: "pending" } : r));
        } else {
            const newMap = { ...loadExternalResumeStatusMap(), [employeeId]: "pending" };
            saveExternalResumeStatusMap(newMap);
            setExternalResources(prev => prev.map(r => r.id === employeeId ? { ...r, resumeStatus: "pending" } : r));
        }
    };

const handleSubmitShare = async () => {
    try {
        const ids = selectedType === 'opportunity' ? selectedItems.map(g => g.groupId) : selectedItems.map(g => g.demandid);
        let response;
        if (activeTab === "internal") {
            response = await EmployeeService.shareResume(selectedEmployeeForShare, 'Shared', localStorage.getItem('userId'), ids, selectedType);
        } else {
            response = await CandidateService.shareResume(selectedEmployeeForShare, 'Shared', localStorage.getItem('userId'), ids, selectedType);
        }
        if (response.data.success) {
            if (activeTab === "internal") {
                const newMap = { ...loadResumeStatusMap(), [selectedEmployeeForShare]: "shared" };
                saveResumeStatusMap(newMap);
                setInternalResources(prev => prev.map(r => r.id === selectedEmployeeForShare ? { ...r, resumeStatus: "shared" } : r));
            } else {
                const newMap = { ...loadExternalResumeStatusMap(), [selectedEmployeeForShare]: "shared" };
                saveExternalResumeStatusMap(newMap);
                setExternalResources(prev => prev.map(r => r.id === selectedEmployeeForShare ? { ...r, resumeStatus: "shared" } : r));
            }
            toast.success('Resume shared successfully!');
            setIsShareDialogOpen(false);
            setSelectedItems([]);
            loadInternalResources();
            loadExternalResources();
        } else {
            toast.error(response.data.errors?.[0] || 'Failed to share resume');
        }
    } catch (error) {
        toast.error('Error sharing resume');
    }
};

    const isResumeToggleLocked = (resource) => {
        if (resource.resumeStatus !== 'shared') return false;
        const i = resource.interview;
        if (!i || !i.isSelected) return false;
        const finalStatuses = ['NoShow', 'Cancelled', 'Rejected', 'Completed'];
        const hasPendingLevels = i.levelProgress.some(l => l.level.startsWith('L') && l.status === 'Scheduled');
        const isOver = finalStatuses.includes(i.status) || (i.status === 'Selected' && !hasPendingLevels);
        return !isOver;
    };

const handleRejectShare = async () => {
    try {
        const ids = selectedType === 'opportunity' ? selectedItems.map(g => g.groupId) : selectedItems.map(g => g.demandid);
        let response;
        if (activeTab === "internal") {
            response = await EmployeeService.shareResume(selectedEmployeeForReject, 'Rejected', localStorage.getItem('userId'), ids, selectedType);
        } else {
            response = await CandidateService.shareResume(selectedEmployeeForReject, 'Rejected', localStorage.getItem('userId'), ids, selectedType);
        }
        if (response.data.success) {
            if (activeTab === "internal") {
                const newMap = { ...loadResumeStatusMap(), [selectedEmployeeForReject]: "rejected" };
                saveResumeStatusMap(newMap);
                setInternalResources(prev => prev.map(r => r.id === selectedEmployeeForReject ? { ...r, resumeStatus: "rejected" } : r));
            } else {
                const newMap = { ...loadExternalResumeStatusMap(), [selectedEmployeeForReject]: "rejected" };
                saveExternalResumeStatusMap(newMap);
                setExternalResources(prev => prev.map(r => r.id === selectedEmployeeForReject ? { ...r, resumeStatus: "rejected" } : r));
            }
            toast.success('Resume rejected successfully!');
            setIsRejectDialogOpen(false);
            setSelectedItems([]);
            loadInternalResources();
            loadExternalResources();
        } else {
            toast.error(response.data.errors?.[0] || 'Failed to reject resume');
        }
    } catch (error) {
        toast.error('Error rejecting resume');
    }
};

    const loadDemandGroups = async () => {
        try {
            const response = await DemandService.fetchDemandList();
            if (response.data.success) {
                setDemandGroups(response.data.result || []);
            }
        } catch (error) {
            console.error('Error loading demands:', error);
        }
    };

const handleEditResource = (resource) => {
    const mappedEmployee = {
        employeeId: resource.id,
        companyId: activeTab === "internal" ? resource.companyId : (companies[0]?.companyId || 1),
        firstName: resource.name.split(" ")[0],
        lastName: resource.name.split(" ").slice(1).join(" ") || "",
        email: resource.email,
        phoneNumber: resource.phone,
        departmentId: activeTab === "internal" ? resource.departmentId : null,
        experienceYears: parseFloat(resource.experience) || 0,
        location: resource.location,
        currentProjectId: projects.find(p => p.projectName === resource.currentProject)?.projectId,
        currentAccountId: resource.currentAccountId,
        currentProject: resource.currentProject,
        client: resource.client,
        joiningDate: resource.joiningDate?.split("-").reverse().join("-") || "",
        status: resource.status === "Billable" ? "Client" : resource.status,
        employmentType: resource.projectType,
        costRatePerHour: resource.costRatePerHour || "",
        capacityHoursPerWeek: resource.capacityHoursPerWeek || "",
        gender: resource.gender,
        personalEmailId: resource.personalemail,
        degrees: resource.degrees,
        specialization: resource.specialization,
        yearOfPassing: resource.yearOfPassing,
        profileSummary: resource.profileSummary,
        trainingSummary: resource.trainingSummary,
        certificationSummary: resource.certificationSummary,
        vendorName: resource.vendorName,
        vendorContact: resource.vendorContact,
        role: resource.role,
        currentCompany: resource.currentCompany || "",
        currentCtc: resource.currentCtc || "",
        expectedCtc: resource.expectedCtc || "",
        noticePeriod: resource.noticePeriod || "",
        preferredLocation: resource.preferredLocation || "",
        comments: resource.comments || "",
    };

    navigate(`/hr/resources/add?type=${activeTab}`, {
        state: {
            isEditMode: true,
            resourceData: mappedEmployee,
            originalSkills: resource.skills.map(skill => ({
                skillId: skills.find(s => s.skillName === skill)?.skillId || -1,
                skillName: skill
            }))
        }
    });
};

return (
    <div>
{/* Import Dialog */}
<Dialog open={isImportModalOpen} onOpenChange={setIsImportModalOpen}>
    <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
            <DialogTitle>
                {activeTab === "internal" ? "Import Employees" : "Import External Candidates"}
            </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="importCompany">Company *</Label>
                <Select
                    value={importCompanyId || ""}
                    onValueChange={(value) => setImportCompanyId(value)}
                >
                    <SelectTrigger>
                        <SelectValue placeholder="Select company" />
                    </SelectTrigger>
                    <SelectContent>
                        {companies.map((company) => (
                            <SelectItem
                                key={company.companyId}
                                value={company.companyId.toString()}
                            >
                                {company.companyName}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
            <div className="space-y-2">
                <Label htmlFor="importFile">Upload File (CSV or Excel) *</Label>
                <Input
                    id="importFile"
                    type="file"
                    accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
                    onChange={handleImportFileChange}
                />
                <p className="text-sm text-gray-500">
                    {activeTab === "internal" 
                        ? "Upload employee data in CSV or Excel format" 
                        : "Upload candidate data in CSV or Excel format"}
                </p>
            </div>
        </div>
        <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={() => {
                setIsImportModalOpen(false);
                setImportCompanyId(null);
                setImportFile(null);
            }}>
                Cancel
            </Button>
            <Button onClick={handleSubmitImport} className="bg-green-500 hover:bg-green-600">
                {activeTab === "internal" ? "Import Employees" : "Import Candidates"}
            </Button>
        </div>
    </DialogContent>
</Dialog>
            

            {/* The rest of the dialogs (Schedule Interview, Resume Viewer, Skill Matcher, Share/Reject) remain the same */}
            {/* They are not modified for the external resources tab */}

            {/* No Resources Found Message */}
            {getCurrentFilteredResources().length === 0 && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-12">
                    <User className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-600 mb-2">No {activeTab} resources found</h3>
                    <p className="text-gray-500">Try adjusting your search criteria or add a new resource.</p>
                </motion.div>
            )}

{/* Schedule Interview Dialog */}
<Dialog open={isScheduleDialogOpen} onOpenChange={setIsScheduleDialogOpen}>
    <DialogContent className="sm:max-w-[700px] max-h-[90vh] flex flex-col p-0 overflow-hidden">
        {/* Header */}
        <DialogHeader className="p-6 pb-4 border-b">
            <DialogTitle>Schedule New Interview</DialogTitle>
            <DialogDescription>
                Select a resource request and configure interview levels for the candidate.
            </DialogDescription>
        </DialogHeader>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* General Error Display */}
            {interviewFormErrors.general && (
                <div className="bg-red-50 border border-red-200 rounded-md p-4" data-interview-general-error="true">
                    <div className="flex items-center">
                        <AlertCircle className="h-5 w-5 text-red-400 mr-2" />
                        <p className="text-red-800 text-sm font-medium">Unable to schedule interview</p>
                    </div>
                    <p className="text-red-700 text-sm mt-1">{interviewFormErrors.general}</p>
                </div>
            )}

            {/* Interview Type */}
<div>
    <Label className="mb-1">Interview Type *</Label>
    <Select
        value={interviewFormData.interviewType}
        onValueChange={(v) => {
            handleFormChange('interviewType', v);
            clearInterviewFieldError('general');
        }}
    >
        <SelectTrigger className="border-gray-300 focus:ring-blue-500">
            <SelectValue placeholder="Select type" />
        </SelectTrigger>
        <SelectContent>
            <SelectItem value="demand">Demand</SelectItem>
            <SelectItem value="opportunity">Opportunity</SelectItem>
        </SelectContent>
    </Select>
</div>

{interviewFormData.interviewType === 'demand' && (
    <div data-interview-error={!!interviewFormErrors.demandId} className="mt-4">
        <Label className="mb-1" htmlFor="demandId">Demand *</Label>
        {/* Searchable demand combobox */}
        <div className="relative">
            <input
                type="text"
                placeholder="Search demand by ID or title..."
                className={`w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    interviewFormErrors.demandId ? 'border-red-500' : 'border-gray-300'
                }`}
                value={interviewFormData._demandSearch ?? (interviewFormData.demandId
                    ? (() => { const d = demandGroups.find(d => (d.demandid || d.demandId)?.toString() === interviewFormData.demandId); return d ? `DM-${(d.demandid || d.demandId)} - ${(d.demandTitle || d.demandtitle)}` : ''; })()
                    : '')}
                onChange={(e) => {
                    const searchVal = e.target.value;
                    setInterviewFormData(prev => ({ ...prev, _demandSearch: searchVal, demandId: '', requestId: '' }));
                    setDemandResourceRequests([]);
                }}
                onFocus={(e) => {
                    setInterviewFormData(prev => ({ ...prev, _demandDropdownOpen: true }));
                }}
                onBlur={() => {
                    setTimeout(() => setInterviewFormData(prev => ({ ...prev, _demandDropdownOpen: false })), 200);
                }}
            />
            {interviewFormData._demandDropdownOpen && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-48 overflow-y-auto">
                    {demandGroups
                        .filter(d => {
                            const search = (interviewFormData._demandSearch || '').toLowerCase();
                            const dId = (d.demandid || d.demandId);
                            const dTitle = (d.demandTitle || d.demandtitle);
                            return !search ||
                                `DM-${dId}`.toLowerCase().includes(search) ||
                                (dTitle || '').toLowerCase().includes(search);
                        })
                        .map(d => {
                            const dId = (d.demandid || d.demandId);
                            const dTitle = (d.demandTitle || d.demandtitle);
                            return (
                                <div
                                    key={dId}
                                    className="px-3 py-2 text-sm hover:bg-blue-50 cursor-pointer"
                                    onMouseDown={() => {
                                        handleFormChange('demandId', dId.toString());
                                        clearInterviewFieldError('demandId');
                                        setInterviewFormData(prev => ({
                                            ...prev,
                                            _demandSearch: `DM-${dId} - ${dTitle}`,
                                            _demandDropdownOpen: false
                                        }));
                                    }}
                                >
                                    DM-{dId} - {dTitle}
                                </div>
                            );
                        })
                    }
                    {demandGroups.filter(d => {
                        const search = (interviewFormData._demandSearch || '').toLowerCase();
                        const dId = (d.demandid || d.demandId);
                        const dTitle = (d.demandTitle || d.demandtitle);
                        return !search ||
                            `DM-${dId}`.toLowerCase().includes(search) ||
                            (dTitle || '').toLowerCase().includes(search);
                    }).length === 0 && (
                        <div className="px-3 py-2 text-sm text-gray-400">No demands found</div>
                    )}
                </div>
            )}
        </div>
        {interviewFormErrors.demandId && (
            <p className="text-red-600 text-sm mt-1 flex items-center">
                <AlertCircle className="h-4 w-4 mr-1" />
                {interviewFormErrors.demandId}
            </p>
        )}
    </div>
)}

            {/* Resource Request - auto-filled read-only after demand selection */}
<div data-interview-error={!!interviewFormErrors.requestId}>
    <Label className="mb-1" htmlFor="requestId">Resource Request *</Label>
    {interviewFormData.demandId && interviewFormData.requestId ? (
        <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm text-gray-700">
            <span className="font-mono font-semibold text-blue-700">
                REQ-{interviewFormData.requestId.toString().padStart(3, '0')}
            </span>
            <span className="text-gray-500 text-xs">(Auto-filled from candidate + demand)</span>
        </div>
    ) : interviewFormData.demandId && !interviewFormData.requestId ? (
        <div className="px-3 py-2 bg-amber-50 border border-amber-200 rounded-md text-sm text-amber-700 flex items-center gap-2">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            No resource request found for this candidate and demand.
        </div>
    ) : (
        <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm text-gray-400">
            Select a demand above to auto-fill this field.
        </div>
    )}
    {interviewFormErrors.requestId && (
        <p className="text-red-600 text-sm mt-1 flex items-center">
            <AlertCircle className="h-4 w-4 mr-1" />
            {interviewFormErrors.requestId}
        </p>
    )}
</div>

{/* Candidate - Read-only, locked from row context */}
<div data-interview-error={!!interviewFormErrors.candidateId}>
    <Label className="mb-1" htmlFor="candidateId">Candidate *</Label>
    <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm">
        <User className="h-4 w-4 text-gray-400 flex-shrink-0" />
        <span className="font-medium text-gray-800">
            {interviewFormData.candidateName || (
                // Fallback: look up name from resources
                [...internalResources, ...externalResources].find(r => r.id?.toString() === interviewFormData.candidateId?.toString())?.name
            ) || 'Candidate'}
        </span>
        <span className="ml-auto text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded">Locked</span>
    </div>
    {interviewFormErrors.candidateId && (
        <p className="text-red-600 text-sm mt-1 flex items-center">
            <AlertCircle className="h-4 w-4 mr-1" />
            {interviewFormErrors.candidateId}
        </p>
    )}
</div>

            {/* Candidate Selection - Make it editable */}
            {/* <div data-interview-error={!!interviewFormErrors.candidateId}>
                <Label className="mb-1" htmlFor="candidateId">Candidate *</Label>
                <Select
                    value={interviewFormData.candidateId}
                    disabled
                    onValueChange={(v) => {
                        handleFormChange('candidateId', v);
                        clearInterviewFieldError('candidateId');
                    }}
                >
                    <SelectTrigger className={`border-gray-300 focus:ring-blue-500 ${interviewFormErrors.candidateId ? 'border-red-500' : ''}`}>
                        <SelectValue placeholder="Select candidate" />
                    </SelectTrigger>
                    <SelectContent className="max-h-60 overflow-y-auto">
                        
                        {activeTab === "internal" ? (
                            internalResources
                                .filter(r => r.resumeStatus === "shared")
                                .map((resource) => (
                                    <SelectItem key={resource.id} value={resource.id.toString()}>
                                        {resource.name}
                                    </SelectItem>
                                ))
                        ) : (
                            externalResources
                                .filter(r => r.resumeStatus === "shared")
                                .map((resource) => (
                                    <SelectItem key={resource.id} value={resource.id.toString()}>
                                        {resource.name}
                                    </SelectItem>
                                ))
                        )}
                    </SelectContent>
                </Select>
                {interviewFormErrors.candidateId && (
                    <p className="text-red-600 text-sm mt-1 flex items-center">
                        <AlertCircle className="h-4 w-4 mr-1" />
                        {interviewFormErrors.candidateId}
                    </p>
                )}
            </div> */}

            {/* Interview Levels */}
            <div data-interview-error={!!interviewFormErrors.interviewLevels}>
                <Label>Interview Levels *</Label>
                <div className="flex flex-wrap gap-4 mt-2">
                    {interviewLevelsOptions.map((lvl) => (
                        <div key={lvl} className="flex items-center">
                            <Checkbox
                                id={`level-${lvl}`}
                                checked={interviewFormData.interviewLevels.includes(lvl)}
                                onCheckedChange={(checked) => {
                                    let newLvls = [...interviewFormData.interviewLevels];
                                    
                                    if (checked) {
                                        // Add the level if not already present
                                        if (!newLvls.includes(lvl)) {
                                            newLvls.push(lvl);
                                        }
                                        
                                        // Ensure prerequisite levels are added
                                        if (lvl === 'L2' && !newLvls.includes('L1')) {
                                            newLvls.push('L1');
                                        }
                                        if (lvl === 'L3' && !newLvls.includes('L2')) {
                                            newLvls.push('L2');
                                            if (!newLvls.includes('L1')) {
                                                newLvls.push('L1');
                                            }
                                        }
                                    } else {
                                        // Remove the level and any dependent levels
                                        newLvls = newLvls.filter((l) => l !== lvl);
                                        
                                        // Remove dependent levels
                                        if (lvl === 'L1') {
                                            newLvls = newLvls.filter((l) => l !== 'L2' && l !== 'L3');
                                        } else if (lvl === 'L2') {
                                            newLvls = newLvls.filter((l) => l !== 'L3');
                                        }
                                    }
                                    
                                    // Sort the levels
                                    newLvls.sort((a, b) => a.localeCompare(b));
                                    
                                    handleFormChange('interviewLevels', newLvls);
                                    clearInterviewFieldError('interviewLevels');
                                }}
                                // disabled={interviewFormData.interviewType === 'demand' && lvl === 'L3'}
                            />
                            <label
                                htmlFor={`level-${lvl}`}
                                className="ml-2 text-sm font-medium text-gray-700"
                            >
                                {lvl}
                                {/* {interviewFormData.interviewType === 'demand' && lvl === 'L3' && (
                                    <span className="text-xs text-gray-500 ml-1">(Not available for Demand)</span>
                                )} */}
                            </label>
                        </div>
                    ))}
                </div>
                {interviewFormErrors.interviewLevels && (
                    <p className="text-red-600 text-sm mt-1 flex items-center">
                        <AlertCircle className="h-4 w-4 mr-1" />
                        {interviewFormErrors.interviewLevels}
                    </p>
                )}
                <p className="text-xs text-gray-500 mt-1">
                    Note: L1 is prerequisite for L2, L2 is prerequisite for L3
                </p>
            </div>

            {/* Per-Level Details */}
            {interviewFormData.interviewLevels.map((lvl) => {
                const levelDetail = interviewFormData.levelsDetails.find((d) => d.level === lvl);
                const levelErrors = interviewFormErrors.levelsDetails[lvl] || {};

                return (
                    <div
                        key={lvl}
                        className="space-y-3 border rounded-md bg-gray-50 p-4"
                        data-interview-error={Object.keys(levelErrors).length > 0}
                    >
                        <Label className="text-md font-semibold">{lvl} Details</Label>

                        {/* Interviewer - only for Opportunity */}
                        {interviewFormData.interviewType === 'opportunity' && (
                            <div>
                                <Label className="mb-1">Interviewer *</Label>
                                <Select
                                    value={levelDetail?.interviewer || ''}
                                    onValueChange={(v) => {
                                        handleLevelChange(lvl, 'interviewer', v);
                                        clearInterviewLevelError(lvl);
                                    }}
                                >
                                    <SelectTrigger className={`border-gray-300 focus:ring-blue-500 ${levelErrors.interviewer ? 'border-red-500' : ''}`}>
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

                        {/* Date & Time */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <Label className="mb-1">Date *</Label>
                                <Input
                                    type="date"
                                    value={levelDetail?.date || ''}
                                    onChange={(e) => {
                                        handleLevelChange(lvl, 'date', e.target.value);
                                        clearInterviewLevelError(lvl);
                                    }}
                                    min={new Date().toISOString().split('T')[0]}
                                    className={`border-gray-300 focus:ring-blue-500 ${levelErrors.date ? 'border-red-500' : ''}`}
                                />
                                {levelErrors.date && (
                                    <p className="text-red-600 text-sm mt-1 flex items-center">
                                        <AlertCircle className="h-4 w-4 mr-1" />
                                        {levelErrors.date}
                                    </p>
                                )}
                            </div>
                            <div>
                                <Label className="mb-1">Time *</Label>
                                <Input
                                    type="time"
                                    value={levelDetail?.time || ''}
                                    onChange={(e) => {
                                        handleLevelChange(lvl, 'time', e.target.value);
                                        clearInterviewLevelError(lvl);
                                    }}
                                    className={`border-gray-300 focus:ring-blue-500 ${levelErrors.time ? 'border-red-500' : ''}`}
                                />
                                {levelErrors.time && (
                                    <p className="text-red-600 text-sm mt-1 flex items-center">
                                        <AlertCircle className="h-4 w-4 mr-1" />
                                        {levelErrors.time}
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Notes */}
                        <div>
                            <Label className="mb-1">Notes</Label>
                            <Textarea
                                value={levelDetail?.notes || ''}
                                onChange={(e) => handleLevelChange(lvl, 'notes', e.target.value)}
                                placeholder="Enter interview notes..."
                                className="border-gray-300 focus:ring-blue-500"
                                rows={2}
                            />
                        </div>
                    </div>
                );
            })}
        </div>

        {/* Sticky Footer */}
        <DialogFooter className="sticky bottom-0 bg-white p-4 border-t flex justify-end gap-2">
            <Button
                variant="outline"
                onClick={() => {
                    setIsScheduleDialogOpen(false);
                    setInterviewFormErrors({
                        general: '',
                        requestId: '',
                        candidateId: '',
                        interviewLevels: '',
                        levelsDetails: {}
                    });
                    // Reset form data
                    setInterviewFormData({
                        id: '',
                        requestId: '',
                        candidateId: '',
                        interviewLevels: [],
                        levelsDetails: [],
                        originalLevels: [],
                        interviewType: 'opportunity'
                    });
                }}
                className="border-gray-300 text-gray-700 hover:bg-gray-100"
            >
                Cancel
            </Button>
            <Button
                onClick={handleSubmitInterview}
                className="bg-blue-600 hover:bg-blue-700 text-white"
                disabled={!interviewFormData.requestId || !interviewFormData.candidateId || interviewFormData.interviewLevels.length === 0}
            >
                Schedule Interview
            </Button>
        </DialogFooter>
    </DialogContent>
</Dialog>

            {/* Resume Viewer Modal */}
            <Dialog open={isResumeModalOpen} onOpenChange={(open) => {
                setIsResumeModalOpen(open);
                if (!open && resumeUrl) {
                    window.URL.revokeObjectURL(resumeUrl);
                    setResumeUrl("");
                    setResumeFileName("");
                }
            }}>
                <DialogContent className="sm:max-w-2xl max-h-[80vh] w-full h-fit p-0 overflow-hidden bg-white rounded-xl shadow-2xl">
                                   <div className="flex items-center justify-between p-4 border-b border-purple-100 bg-gradient-to-r from-purple-50 to-indigo-50">
                                       <div className="flex items-center gap-2 flex-1 min-w-0">
                                           <FileText className="w-5 h-5 text-purple-600 flex-shrink-0" />
                                           <h3 className="text-lg font-semibold text-gray-800 truncate">{resumeFileName}</h3>
                                       </div>
                                       <Button
                                           variant="ghost"
                                           size="icon"
                                           onClick={() => {
                                               setIsResumeModalOpen(false);
                                               if (resumeUrl) {
                                                   window.URL.revokeObjectURL(resumeUrl);
                                                   setResumeUrl("");
                                                   setResumeFileName("");
                                               }
                                           }}
                                       // className="hover:bg-purple-100 rounded-full h-9 w-9 flex-shrink-0 ml-2"
                                       >
                                           {/* <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                               </svg> */}
                                       </Button>
                                   </div>
                                   <div className="max-h-[60vh] p-4 bg-gray-50 overflow-auto">
                                       {resumeUrl ? (
                                           <iframe
                                               src={resumeUrl}
                                               className="w-full h-[500px] md:h-[550px] border-0 rounded-lg shadow-inner"
                                               title="Resume Preview"
                                               style={{ width: '100%', height: '100%', minHeight: '400px' }}
                                           />
                                       ) : (
                                           <div className="flex items-center justify-center h-[400px] text-gray-500">
                                               <div className="text-center">
                                                   <FileText className="w-16 h-16 mx-auto mb-3 text-gray-300" />
                                                   <p className="text-lg">Loading resume...</p>
                                               </div>
                                           </div>
                                       )}
                                   </div>
                                   <div className="flex justify-end p-3 border-t border-purple-100 bg-gradient-to-r from-purple-50 to-indigo-50">
                                       <Button
                                           onClick={() => {
                                               if (resumeUrl) {
                                                   const link = document.createElement('a');
                                                   link.href = resumeUrl;
                                                   link.download = resumeFileName;
                                                   link.click();
                                               }
                                           }}
                                           className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white text-sm px-4 h-10"
                                       >
                                           <Download className="w-4 h-4 mr-2" />
                                           Download
                                       </Button>
                                   </div>
                               </DialogContent>
                           </Dialog>

            {/* Skill Matcher Modal */}
             <Dialog open={isSkillMatcherModalOpen} onOpenChange={setIsSkillMatcherModalOpen}>
                <DialogContent className="max-w-2xl w-[95vw] max-w-[95vw] max-h-[90vh] flex flex-col p-0 overflow-hidden ">
                    {/* Header */}
                    <DialogHeader className="p-6 pb-4 border-b">
                        <DialogTitle>AI Skill Matcher Results</DialogTitle>
                    </DialogHeader>

                    {/* Scrollable Body */}
                    <div className="flex-1 overflow-y-auto p-6">
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="min-w-[300px]">Opportunity</TableHead>
                                        <TableHead className="w-[200px]">Match Status</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {skillMatches.map((status, index) => {
                                        const matchResult = status.match(/^(\d+%)\s+(matched|partially matched|unmatched)\s+with\s+(.*)$/);
                                        if (!matchResult) return null;
                                        const [, percentage, matchType, opportunity] = matchResult;
                                        let badgeColor = '';
                                        switch (matchType) {
                                            case 'matched':
                                                badgeColor = 'bg-green-100 text-green-800';
                                                break;
                                            case 'partially matched':
                                                badgeColor = 'bg-yellow-100 text-yellow-800';
                                                break;
                                            case 'unmatched':
                                                badgeColor = 'bg-red-100 text-red-800';
                                                break;
                                        }
                                        return (
                                            <TableRow key={index}>
                                                <TableCell className="font-medium max-w-[300px] truncate">{opportunity}</TableCell>
                                                <TableCell>
                                                    <Badge className={`${badgeColor} font-semibold`}>
                                                        {percentage} {matchType}
                                                    </Badge>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </div>
                        {skillMatches.length === 0 && (
                            <p className="text-center text-gray-500 mt-4">No matches available.</p>
                        )}
                    </div>

                    {/* Sticky Footer (optional - add if you want a close button like the interview dialog) */}
                    <DialogFooter className="sticky bottom-0 bg-white p-4 border-t flex justify-end gap-2">
                        <Button
                            variant="outline"
                            onClick={() => setIsSkillMatcherModalOpen(false)}
                            className="border-gray-300 text-gray-700 hover:bg-gray-100"
                        >
                            Close
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
{/* Share Dialog - Updated with highlight for already shared items */}
<Dialog open={isShareDialogOpen} onOpenChange={setIsShareDialogOpen}>
    <DialogContent
        className=" w-full  max-w-3xl mx-4 sm:mx-8 md:mx-auto max-h-[90vh] flex flex-col p-0 overflow-hidden rounded-lg ">
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
            <DialogTitle className="text-lg font-semibold">
                Select {selectedType === 'demand' ? 'Demands' : 'Opportunities'} to Share Resume
            </DialogTitle>
        </DialogHeader>

        <div className="px-6 py-2">
            <Select value={selectedType} onValueChange={(v) => { setSelectedType(v); setSelectedItems([]); }}>
                <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="demand">Demand</SelectItem>
                    <SelectItem value="opportunity">Opportunity</SelectItem>
                </SelectContent>
            </Select>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
            {(() => {
                const groupsToShow = selectedType === 'opportunity' ? opportunityGroups : demandGroups;
                if (groupsToShow.length === 0) {
                    return (
                        <p className="text-center text-sm text-gray-500 py-8">
                            No {selectedType === 'demand' ? 'demands' : 'opportunities'} available
                        </p>
                    );
                }
                
                // Get current employee's resume share audit
                const currentEmployee = activeTab === "internal" 
                    ? internalResources.find(emp => emp.id === selectedEmployeeForShare)
                    : externalResources.find(emp => emp.id === selectedEmployeeForShare);
                
                const resumeShareAudit = currentEmployee?.resumeShareAudit || [];

                return groupsToShow.map((group) => {
                    // Check if this demand/opportunity is already shared with the employee
                    const isAlreadyShared = resumeShareAudit.some(audit => {
                        if (selectedType === 'demand') {
                            return audit.type === 'DEMAND' && audit.demandId === group.demandid && audit.status === 'Shared';
                        } else {
                            return audit.type === 'GROUP' && audit.groupId === group.groupId && audit.status === 'Shared';
                        }
                    });

                    // Check if this demand/opportunity is already rejected
                    const isAlreadyRejected = resumeShareAudit.some(audit => {
                        if (selectedType === 'demand') {
                            return audit.type === 'DEMAND' && audit.demandId === group.demandid && audit.status === 'Rejected';
                        } else {
                            return audit.type === 'GROUP' && audit.groupId === group.groupId && audit.status === 'Rejected';
                        }
                    });

                    return (
                        <div
                            key={group.groupId || group.demandid}
                            className={`
                                flex items-start gap-3 p-3 rounded-md border transition-colors 
                                ${isAlreadyShared 
                                    ? 'bg-green-50 border-green-200 hover:bg-green-100' 
                                    : isAlreadyRejected
                                    ? 'bg-red-50 border-red-200 hover:bg-red-100'
                                    : 'hover:bg-gray-50 border-gray-200'
                                }
                                cursor-pointer
                            `}
                        >
                            <Checkbox
                                checked={selectedItems.some(s => (s.groupId || s.demandid) === (group.groupId || group.demandid))}
                                onCheckedChange={(checked) => {
                                    if (checked) {
                                        setSelectedItems(prev => [...prev, group]);
                                    } else {
                                        setSelectedItems(prev =>
                                            prev.filter(s => (s.groupId || s.demandid) !== (group.groupId || group.demandid))
                                        );
                                    }
                                }}
                                disabled={isAlreadyShared} // Disable if already shared
                                className={`mt-0.5 ${
                                    isAlreadyShared ? 'border-green-500 bg-green-500' : 
                                    isAlreadyRejected ? 'border-red-500 bg-red-500' : ''
                                }`}
                            />
                            <div className="flex-1 text-sm">
                                <div className="flex items-center gap-2">
                                    <div className="font-medium text-gray-900">{group.title || group.demandTitle}</div>
                                    {isAlreadyShared && (
                                        <Badge className="bg-green-100 text-green-800 border-green-200 text-xs">
                                            Already Shared
                                        </Badge>
                                    )}
                                    {isAlreadyRejected && (
                                        <Badge className="bg-red-100 text-red-800 border-red-200 text-xs">
                                            Already Rejected
                                        </Badge>
                                    )}
                                </div>
                                <div className="text-xs text-gray-600 mt-1 space-x-2">
                                    <span>
                                        {selectedType.charAt(0).toUpperCase() + selectedType.slice(1)} ID: 
                                        <span className="font-mono ml-1">{group.groupId || group.demandid}</span>
                                    </span>
                                    <span className="text-gray-400">|</span>
                                    <span>
                                        Client: <strong>{group.projectDetails?.accountName || group.accountName || 'N/A'}</strong>
                                    </span>
                                    <span className="text-gray-400">|</span>
                                    <span>
                                        Project: {group.projectDetails?.projectName || group.projectName || 'N/A'}
                                    </span>
                                </div>
                                {/* Show sharing history if exists */}
                                {isAlreadyShared && (
                                    <div className="mt-2 text-xs text-gray-500">
                                        <div className="flex items-center gap-1">
                                            <Clock className="w-3 h-3" />
                                            <span>Already shared</span>
                                            {resumeShareAudit
                                                .filter(audit => 
                                                    (selectedType === 'demand' && audit.demandId === group.demandid) ||
                                                    (selectedType === 'opportunity' && audit.groupId === group.groupId)
                                                )
                                                .map((audit, idx) => (
                                                    <span key={idx} className="ml-1">
                                                        on {audit.sharedAt ? new Date(audit.sharedAt).toLocaleDateString() : 'previously'}
                                                    </span>
                                                ))
                                            }
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                });
            })()}
        </div>

        <DialogFooter className="px-6 py-4 border-t bg-gray-50/80">
            <Button
                variant="outline"
                onClick={() => setIsShareDialogOpen(false)}
                className="min-w-[80px]"
            >
                Cancel
            </Button>
            <Button
                onClick={handleSubmitShare}
                disabled={selectedItems.length === 0}
                className="min-w-[140px]"
            >
                Share Resume
                {selectedItems.length > 0 && (
                    <span className="ml-1">({selectedItems.length})</span>
                )}
            </Button>
        </DialogFooter>
    </DialogContent>
</Dialog>

{/* Reject Dialog - Updated with highlight for already shared/rejected items */}
<Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
    <DialogContent 
        className="
            w-full 
            max-w-3xl           
            mx-4               
            sm:mx-8            
            md:mx-auto         
            max-h-[90vh] 
            flex flex-col 
            p-0 
            overflow-hidden 
            rounded-lg
        "
    >
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
            <DialogTitle className="text-lg font-semibold">
                Select {selectedType === 'demand' ? 'Demands' : 'Opportunities'} to Reject Resume
            </DialogTitle>
        </DialogHeader>

        <div className="px-6 py-2">
            <Select value={selectedType} onValueChange={(v) => { setSelectedType(v); setSelectedItems([]); }}>
                <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="demand">Demand</SelectItem>
                    <SelectItem value="opportunity">Opportunity</SelectItem>
                </SelectContent>
            </Select>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
            {(() => {
                const groupsToShow = selectedType === 'opportunity' ? opportunityGroups : demandGroups;
                if (groupsToShow.length === 0) {
                    return (
                        <p className="text-center text-sm text-gray-500 py-8">
                            No {selectedType === 'demand' ? 'demands' : 'opportunities'} available
                        </p>
                    );
                }
                
                // Get current employee's resume share audit
                const currentEmployee = activeTab === "internal" 
                    ? internalResources.find(emp => emp.id === selectedEmployeeForReject)
                    : externalResources.find(emp => emp.id === selectedEmployeeForReject);
                
                const resumeShareAudit = currentEmployee?.resumeShareAudit || [];

                return groupsToShow.map((group) => {
                    // Check if this demand/opportunity is already rejected
                    const isAlreadyRejected = resumeShareAudit.some(audit => {
                        if (selectedType === 'demand') {
                            return audit.type === 'DEMAND' && audit.demandId === group.demandid && audit.status === 'Rejected';
                        } else {
                            return audit.type === 'GROUP' && audit.groupId === group.groupId && audit.status === 'Rejected';
                        }
                    });

                    // Check if this demand/opportunity is already shared
                    const isAlreadyShared = resumeShareAudit.some(audit => {
                        if (selectedType === 'demand') {
                            return audit.type === 'DEMAND' && audit.demandId === group.demandid && audit.status === 'Shared';
                        } else {
                            return audit.type === 'GROUP' && audit.groupId === group.groupId && audit.status === 'Shared';
                        }
                    });

                    return (
                        <div
                            key={group.groupId || group.demandid}
                            className={`
                                flex items-start gap-3 
                                p-3 rounded-md border 
                                transition-colors
                                ${isAlreadyRejected 
                                    ? 'bg-red-50 border-red-200 hover:bg-red-100' 
                                    : isAlreadyShared
                                    ? 'bg-green-50 border-green-200 hover:bg-green-100'
                                    : 'hover:bg-gray-50 border-gray-200'
                                }
                                cursor-pointer
                            `}
                        >
                            <Checkbox
                                checked={selectedItems.some(s => (s.groupId || s.demandid) === (group.groupId || group.demandid))}
                                onCheckedChange={(checked) => {
                                    if (checked) {
                                        setSelectedItems(prev => [...prev, group]);
                                    } else {
                                        setSelectedItems(prev =>
                                            prev.filter(s => (s.groupId || s.demandid) !== (group.groupId || group.demandid))
                                        );
                                    }
                                }}
                                disabled={isAlreadyRejected} // Disable if already rejected
                                className={`mt-0.5 ${
                                    isAlreadyRejected ? 'border-red-500 bg-red-500' : 
                                    isAlreadyShared ? 'border-green-500 bg-green-500' : ''
                                }`}
                            />
                            <div className="flex-1 text-sm">
                                <div className="flex items-center gap-2">
                                    <div className="font-medium text-gray-900">{group.title || group.demandTitle}</div>
                                    {isAlreadyRejected && (
                                        <Badge className="bg-red-100 text-red-800 border-red-200 text-xs">
                                            Already Rejected
                                        </Badge>
                                    )}
                                    {isAlreadyShared && (
                                        <Badge className="bg-green-100 text-green-800 border-green-200 text-xs">
                                            Already Shared
                                        </Badge>
                                    )}
                                </div>
                                <div className="text-xs text-gray-600 mt-1 space-x-2">
                                    <span>
                                        {selectedType.charAt(0).toUpperCase() + selectedType.slice(1)} ID: 
                                        <span className="font-mono ml-1">{group.groupId || group.demandid}</span>
                                    </span>
                                    <span className="text-gray-400">|</span>
                                    <span>
                                        Client: <strong>{group.projectDetails?.accountName || group.accountName || 'N/A'}</strong>
                                    </span>
                                    <span className="text-gray-400">|</span>
                                    <span>
                                        Project: {group.projectDetails?.projectName || group.projectName || 'N/A'}
                                    </span>
                                </div>
                                {/* Show rejection history if exists */}
                                {isAlreadyRejected && (
                                    <div className="mt-2 text-xs text-gray-500">
                                        <div className="flex items-center gap-1">
                                            <Clock className="w-3 h-3" />
                                            <span>Already rejected</span>
                                            {resumeShareAudit
                                                .filter(audit => 
                                                    (selectedType === 'demand' && audit.demandId === group.demandid) ||
                                                    (selectedType === 'opportunity' && audit.groupId === group.groupId)
                                                )
                                                .map((audit, idx) => (
                                                    <span key={idx} className="ml-1">
                                                        on {audit.sharedAt ? new Date(audit.sharedAt).toLocaleDateString() : 'previously'}
                                                    </span>
                                                ))
                                            }
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                });
            })()}
        </div>

        <DialogFooter className="px-6 py-4 border-t bg-gray-50/80">
            <Button 
                variant="outline" 
                onClick={() => setIsRejectDialogOpen(false)}
                className="min-w-[80px]"
            >
                Cancel
            </Button>
            <Button
                onClick={handleRejectShare}
                disabled={selectedItems.length === 0}
                className="min-w-[140px]"
            >
                Reject Resume 
                {selectedItems.length > 0 && (
                    <span className="ml-1">({selectedItems.length})</span>
                )}
            </Button>
        </DialogFooter>
    </DialogContent>
</Dialog>
        </div>
    );
}
