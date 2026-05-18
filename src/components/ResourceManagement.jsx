import React, { useEffect, useState, useRef, useCallback } from "react";
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
    ExternalLink, Share2,
    ChevronDown,
    ChevronUp,
    BookOpen
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

const validatePDFFile = (file, options = {}) => {
    const defaultOptions = {
        maxSize: 5 * 1024 * 1024, // 5MB default
        allowedExtensions: ['pdf', 'doc', 'docx'],
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
            error: `Only ${extensions} files are allowed for ${config.fieldName}.`
        };
    }

    // Check MIME type as additional validation
    const allowedMimeTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    if (file.type && !allowedMimeTypes.includes(file.type)) {
        return {
            isValid: false,
            error: `Invalid file type. Only PDF and Word files are allowed for ${config.fieldName}.`
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
                <div className="absolute inset-0 z-20 flex items-center justify-between px-4 text-sm font-bold text-white pointer-events-none">
                    <span className={getLabelColor('reject')}>REJECT</span>
                    <span className={getLabelColor('share')}>SHARE</span>
                </div>
                <div
                    className={`
                        thumb absolute top-1 z-10 w-8 h-8 bg-white rounded-full shadow-xl transition-all duration-300
                        flex items-center justify-center font-bold text-sm
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

// PersonalInfoCard — always fully expanded, no toggle
const PersonalInfoCard = ({ resource, resourceType, onEditResource }) => {
    // Helper: one row in the info grid
    const Row = ({ icon, label, value, span = false }) => (
        <div style={{ display: 'contents' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#6B7280', fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', paddingBottom: '8px', borderBottom: '1px solid #F1F5F9', alignSelf: 'center' }}>
                {React.cloneElement(icon, { style: { width: '13px', height: '13px', flexShrink: 0 } })}
                {label}
            </div>
            <div style={{ fontSize: '13px', fontWeight: 500, color: '#111827', paddingBottom: '8px', borderBottom: '1px solid #F1F5F9', wordBreak: 'break-word', alignSelf: 'center' }}>
                {value || <span style={{ color: '#9CA3AF', fontWeight: 400 }}>N/A</span>}
            </div>
        </div>
    );

    return (
        <div className="h-full" style={{ display: 'flex', flexDirection: 'column' }}>
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-blue-100 text-blue-600">
                        <User className="w-4 h-4" />
                    </div>
                    <h3 className="font-semibold text-sm text-gray-800">Personal Information</h3>
                </div>
                <Button
                    onClick={(e) => { e.stopPropagation(); onEditResource(resource); }}
                    variant="ghost"
                    className="h-8 w-8 p-0 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                >
                    <Pencil className="w-4 h-4" />
                </Button>
            </div>

            {/* Name + Role banner */}
            <div style={{ background: 'linear-gradient(135deg,#EEF2FF,#F0F9FF)', borderRadius: '10px', padding: '10px 12px', marginBottom: '12px' }}>
                <div style={{ fontSize: '15px', fontWeight: 700, color: '#1E293B' }}>{resource.name}</div>
                <div style={{ display: 'flex', gap: '10px', marginTop: '3px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '12px', color: '#4F46E5', fontWeight: 500 }}>{resource.role || 'No Role'}</span>
                    <span style={{ fontSize: '11px', color: '#94A3B8' }}>ID: {resource.id}</span>
                </div>
            </div>

            {/* Info grid — 2-col: label | value */}
            <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '0 16px', flex: 1 }}>
                <Row icon={<Phone className="text-orange-500" />} label="Phone" value={resource.phone} />
                <Row icon={<MapPin className="text-red-500" />} label="Location" value={resource.location} />
                {resourceType === 'internal' ? (
                    <>
                        <Row icon={<Globe className="text-blue-500" />} label="Work Email" value={resource.email} />
                        <Row icon={<Mail className="text-purple-500" />} label="Personal Email" value={resource.personalemail} />
                    </>
                ) : (
                    <Row icon={<Mail className="text-purple-500" />} label="Email" value={resource.email} />
                )}
                <Row icon={<Star className="text-amber-500" />} label="Degree" value={resource.degrees} />
                <Row icon={<BookOpen className="text-teal-500" />} label="Specialization" value={resource.specialization} />
                <Row icon={<Calendar className="text-indigo-500" />} label="Batch Year" value={resource.yearOfPassing} />
                <Row icon={<Briefcase className="text-green-500" />} label="Experience" value={resource.experience} />
            </div>
        </div>
    );
};

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
    onEditInterviewFromRow,
    allInterviewsRaw = [],
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
    resourceType = "internal" // "internal" or "external"
}) => {
    const totalPages = Math.ceil(filteredResources.length / itemsPerPage);
    const startIndex = (currentPageNum - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedResources = filteredResources.slice(startIndex, endIndex);



    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
        >
            <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl rounded-lg">
                <div className="relative">
                    <Table className="responsive-table" containerClassName="max-h-[480px] overflow-auto scrollbar-thin scrollbar-track-purple-100 scrollbar-thumb-purple-300 hover:scrollbar-thumb-purple-400">
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
                                        className="cursor-pointer hover:bg-purple-200/60 transition-all duration-200 text-slate-800 font-extrabold text-[15px] border-r border-purple-300/50 py-4 w-[80px] min-w-[80px]"
                                        onClick={() => onSort("projectType")}
                                    >
                                        <div className="flex items-center gap-2">
                                            <span className="text-slate-700 font-bold">Project Type</span>
                                            {getSortIcon("projectType")}
                                        </div>
                                    </TableHead>
                                )}
                                <TableHead
                                    className="cursor-pointer hover:bg-purple-200/60 transition-all duration-200 text-slate-800 font-extrabold text-[15px] border-r border-purple-300/50 py-4 w-[58px] min-w-[58px]"
                                    onClick={() => onSort("experience")}
                                >
                                    <div className="flex items-center gap-2">
                                        <span className="text-slate-700 font-bold">Experience</span>
                                        {getSortIcon("experience")}
                                    </div>
                                </TableHead>
                                <TableHead className="text-slate-800 font-extrabold text-[15px] border-r border-purple-300/50 py-4 w-[205px] min-w-[205px]">
                                    <span className="text-slate-700 font-bold">Resume Actions</span>
                                </TableHead>
                                <TableHead className="text-slate-800 font-extrabold text-[15px] py-4 w-[160px]">
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
                                                    {((Array.isArray(resource.primarySkills) && resource.primarySkills.length > 0)
                                                        ? resource.primarySkills
                                                        : (Array.isArray(resource.skills) ? resource.skills : [])
                                                    ).slice(0, 3).map((skill, idx) => (
                                                        <Badge key={idx} variant="secondary" className="bg-purple-100 text-purple-700 text-xs">
                                                            {skill}
                                                        </Badge>
                                                    ))}
                                                    {(((Array.isArray(resource.primarySkills) && resource.primarySkills.length > 0)
                                                        ? resource.primarySkills
                                                        : (Array.isArray(resource.skills) ? resource.skills : [])
                                                    ).length > 3) && (
                                                            <Badge variant="secondary" className="bg-purple-100 text-purple-700 text-xs">
                                                                +{((Array.isArray(resource.primarySkills) && resource.primarySkills.length > 0)
                                                                    ? resource.primarySkills
                                                                    : (Array.isArray(resource.skills) ? resource.skills : [])
                                                                ).length - 3} more
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
                                                <TableCell className="py-4">{resource.currentClient || resource.client || "N/A"}</TableCell>
                                            )}

                                            {resourceType === "internal" && (
                                                <TableCell className="py-4 w-[80px] min-w-[80px]">{resource.projectType || "Regular"}</TableCell>
                                            )}
                                            <TableCell className="py-4 w-[58px] min-w-[58px]">{resource.experience}</TableCell>

                                            <TableCell className="w-[205px] min-w-[205px]" onClick={(e) => e.stopPropagation()}>
                                                <ResumeToggleSwitch
                                                    status={resource.resumeStatus}
                                                    onShare={() => onResumeShare(resource.id)}
                                                    onReject={() => onResumeReject(resource.id)}
                                                    onPending={() => onResumePending(resource.id)}
                                                    disabled={isResumeToggleLocked(resource)}
                                                />
                                            </TableCell>
                                            <TableCell className="py-4 w-[160px]">
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
                                                        className={`bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-[11px] px-2 py-1 whitespace-nowrap ${resource.resumeStatus !== "shared" ? "opacity-50 cursor-not-allowed" : ""
                                                            }`}
                                                    >
                                                        Schedule
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                        {isExpanded && (
                                            <TableRow>
                                                <TableCell colSpan={10} className="p-0">
                                                    <Card className="m-4">
                                                        <CardContent className="p-4">
                                                            {/* ── 2-column responsive grid layout ── */}
                                                            <div style={{
                                                                display: 'grid',
                                                                gridTemplateColumns: 'repeat(2, 1fr)',
                                                                gap: '16px',
                                                                alignItems: 'stretch',
                                                            }}>
                                                                {/* ── ROW 1 COL 1: Personal Information ── */}
                                                                <Card className="p-4" style={{ minHeight: '100%' }}>
                                                                    <PersonalInfoCard
                                                                        resource={resource}
                                                                        resourceType={resourceType}
                                                                        onEditResource={onEditResource}
                                                                    />
                                                                </Card>

                                                                {/* ── ROW 1 COL 2: Project Information ── */}
                                                                <Card className="p-4" style={{ minHeight: '100%' }}>
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
                                                                            <p className="font-medium">{resource.currentClient || resource.client || "Not assigned"}</p>
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
                                                                        </div>
                                                                        {/* External: Employment Details inline */}
                                                                        {resourceType === "external" && (
                                                                            <>
                                                                                <div className="pt-3 border-t">
                                                                                    <h3 className="font-semibold mb-2 flex items-center gap-2">
                                                                                        <Briefcase className="w-4 h-4 text-blue-600" />
                                                                                        Employment Details
                                                                                    </h3>
                                                                                </div>
                                                                                <div className="grid grid-cols-2 gap-3">
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
                                                                                    <div className="mt-2">
                                                                                        <span className="text-sm text-gray-500">Comments:</span>
                                                                                        <p className="font-medium mt-1 text-sm bg-gray-50 p-3 rounded-lg">
                                                                                            {resource.comments}
                                                                                        </p>
                                                                                    </div>
                                                                                )}
                                                                            </>
                                                                        )}
                                                                    </div>
                                                                </Card>

                                                                {/* ── ROW 2 COL 1: Profile Summary ── */}
                                                                <Card className="p-4" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                                                                    <h3 className="font-semibold mb-3 flex items-center gap-2">
                                                                        <Briefcase className="w-5 h-5 text-green-600" />
                                                                        Profile Summary
                                                                    </h3>
                                                                    <div className="flex flex-col gap-2 mt-2 text-sm flex-1">
                                                                        <div className="bg-slate-50 rounded-lg p-2">
                                                                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Profile</span>
                                                                            <p className="text-gray-700 mt-0.5">{resource.profileSummary || 'N/A'}</p>
                                                                        </div>
                                                                        {/* <div className="bg-slate-50 rounded-lg p-2">
                                                                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Training Summary</span>
                                                                            <p className="text-gray-700 mt-0.5">{resource.trainingSummary || 'N/A'}</p>
                                                                        </div> */}
                                                                        {/* <div className="bg-slate-50 rounded-lg p-2">
                                                                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Certifications</span>
                                                                            <p className="text-gray-700 mt-0.5">{resource.certificationSummary || 'N/A'}</p>
                                                                        </div> */}
                                                                    </div>
                                                                </Card>

                                                                {/* ── ROW 2 COL 2: Skills & Expertise ── */}
                                                                <Card className="p-4" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                                                                    <div className="flex items-center justify-between mb-3">
                                                                        <h3 className="font-semibold flex items-center gap-2">
                                                                            <Star className="w-5 h-5 text-yellow-600" />
                                                                            Skills &amp; Expertise
                                                                        </h3>
                                                                        <Button
                                                                            variant="ghost"
                                                                            size="sm"
                                                                            onClick={() => onViewResume(resource.id)}
                                                                            className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white text-xs px-3 py-1 rounded-md flex items-center gap-1"
                                                                        >
                                                                            <FileText className="h-4 w-4" />
                                                                            <span>View Resume</span>
                                                                        </Button>
                                                                    </div>
                                                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignContent: 'flex-start' }}>
                                                                        {resource.skills?.length > 0 ? (
                                                                            resource.skills.map((skill, idx) => (
                                                                                <span
                                                                                    key={idx}
                                                                                    style={{
                                                                                        display: 'inline-flex',
                                                                                        alignItems: 'center',
                                                                                        background: '#EEF2FF',
                                                                                        color: '#4F46E5',
                                                                                        border: '1px solid #C7D2FE',
                                                                                        borderRadius: '999px',
                                                                                        padding: '4px 14px',
                                                                                        fontSize: '13px',
                                                                                        fontWeight: 500,
                                                                                        lineHeight: '1.4',
                                                                                        whiteSpace: 'nowrap',
                                                                                        cursor: 'default',
                                                                                        transition: 'background 0.15s, border-color 0.15s',
                                                                                    }}
                                                                                >
                                                                                    {skill}
                                                                                </span>
                                                                            ))
                                                                        ) : (
                                                                            <span className="text-gray-500 text-sm">No skills assigned</span>
                                                                        )}
                                                                    </div>
                                                                </Card>

                                                                {/* ── ROW 3 COL 1: Previous Projects ── */}
                                                                {resourceType === "internal" && (
                                                                    <Card className="p-4" style={{ height: '100%' }}>
                                                                        <div className="flex flex-col gap-2">
                                                                            <div className="flex items-center justify-between">
                                                                                <h4 className="font-semibold text-lg text-black">Previous Projects</h4>
                                                                                <span className="text-sm text-black">
                                                                                    Total: {resource.previousProjects?.length || 0}
                                                                                </span>
                                                                            </div>
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
                                                                                </p>
                                                                            )}
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
                                                                    </Card>
                                                                )}

                                                                {/* ── ROW 3 COL 2: Resume Sharing History ── */}
                                                                {(() => {
                                                                    const auditList = resource.resumeShareAudit || [];
                                                                    // Sort descending — newest first
                                                                    const sortedAudits = [...auditList].sort((a, b) => {
                                                                        const dA = new Date(a.sharedAt || a.sharedDate || a.createdAt || 0).getTime();
                                                                        const dB = new Date(b.sharedAt || b.sharedDate || b.createdAt || 0).getTime();
                                                                        return dB - dA;
                                                                    });
                                                                    return (
                                                                        <Card className="p-4 flex flex-col" style={{ minHeight: 0 }}>
                                                                            {/* Header */}
                                                                            <div className="flex items-center gap-2 mb-3 flex-shrink-0">
                                                                                <Share2 className="w-5 h-5 text-blue-600" />
                                                                                <h3 className="font-semibold text-sm">Resume Sharing History</h3>
                                                                                <Badge variant="secondary" className="ml-1 text-xs">
                                                                                    {auditList.length} {auditList.length === 1 ? 'Share' : 'Shares'}
                                                                                </Badge>
                                                                            </div>

                                                                            {sortedAudits.length === 0 ? (
                                                                                <div className="flex flex-col items-center justify-center py-6 text-gray-400">
                                                                                    <Share2 className="w-8 h-8 mb-2 opacity-30" />
                                                                                    <p className="text-sm italic">No resume sharing history found</p>
                                                                                </div>
                                                                            ) : (
                                                                                <div
                                                                                    className="flex flex-col gap-2 overflow-y-auto"
                                                                                    style={{ maxHeight: '280px', scrollbarWidth: 'thin', scrollbarColor: '#cbd5e1 #f8fafc' }}
                                                                                >
                                                                                    {sortedAudits.map((audit, index) => {
                                                                                        const isOpportunity = audit.type === 'GROUP' || audit.type === 'OPPORTUNITY';
                                                                                        const sharedDateTime = audit.sharedAt || audit.sharedDate || audit.createdAt;
                                                                                        const resourceIdNum = parseInt(resource.id, 10);
                                                                                        const auditRequestId = audit.requestId || audit.resourceRequestId;
                                                                                        const matchingInterviews = allInterviewsRaw.filter(iv => {
                                                                                            const matchesRequest = auditRequestId
                                                                                                ? String(iv.requestId) === String(auditRequestId) ||
                                                                                                  String(iv.requestId) === String(auditRequestId).replace(/^REQ-0*/, '')
                                                                                                : false;
                                                                                            const matchesResource =
                                                                                                (resourceType === 'internal' && iv.employeeId === resourceIdNum) ||
                                                                                                (resourceType === 'external' && iv.candidateId === resourceIdNum);
                                                                                            return matchesRequest && matchesResource;
                                                                                        });
                                                                                        const activeInterview = matchingInterviews.find(iv =>
                                                                                            !['selected', 'completed', 'rejected'].includes((iv.status || '').toLowerCase())
                                                                                        );
                                                                                        return (
                                                                                            <div
                                                                                                key={index}
                                                                                                className={`border rounded-xl p-3 transition-colors flex-shrink-0 ${isOpportunity
                                                                                                    ? 'hover:bg-purple-50 border-purple-100 bg-purple-50/40'
                                                                                                    : 'hover:bg-blue-50 border-blue-100 bg-blue-50/30'
                                                                                                }`}
                                                                                            >
                                                                                                {/* Top row: badges + icon */}
                                                                                                <div className="flex items-center justify-between gap-2 mb-2">
                                                                                                    <div className="flex items-center gap-1.5 flex-wrap">
                                                                                                        <Badge className={
                                                                                                            audit.status === 'Shared'
                                                                                                                ? 'bg-green-100 text-green-700 border-green-200 text-xs'
                                                                                                                : audit.status === 'Rejected'
                                                                                                                    ? 'bg-red-100 text-red-700 border-red-200 text-xs'
                                                                                                                    : 'bg-yellow-100 text-yellow-700 border-yellow-200 text-xs'
                                                                                                        }>
                                                                                                            {audit.status}
                                                                                                        </Badge>
                                                                                                        <Badge variant="outline" className={`text-xs ${isOpportunity
                                                                                                            ? 'border-purple-300 text-purple-700 bg-purple-50'
                                                                                                            : 'border-blue-300 text-blue-700 bg-blue-50'
                                                                                                        }`}>
                                                                                                            {isOpportunity ? 'Opportunity' : 'Demand'}
                                                                                                        </Badge>
                                                                                                        <span className={`text-xs font-bold font-mono ${isOpportunity ? 'text-purple-700' : 'text-blue-700'}`}>
                                                                                                            {isOpportunity
                                                                                                                ? (audit.groupId ? `GRP-${audit.groupId}` : '')
                                                                                                                : (audit.demandId ? `DM-${audit.demandId}` : '')}
                                                                                                        </span>
                                                                                                    </div>
                                                                                                    <div className={`w-7 h-7 flex-shrink-0 flex items-center justify-center rounded-full ${isOpportunity ? 'bg-purple-100' : 'bg-blue-100'}`}>
                                                                                                        {isOpportunity
                                                                                                            ? <Users className="w-3.5 h-3.5 text-purple-600" />
                                                                                                            : <FileText className="w-3.5 h-3.5 text-blue-600" />}
                                                                                                    </div>
                                                                                                </div>

                                                                                                {/* Title */}
                                                                                                <p
                                                                                                    className={`text-sm font-semibold truncate mb-1 ${isOpportunity ? 'text-purple-800' : 'text-blue-800'}`}
                                                                                                    title={isOpportunity
                                                                                                        ? (audit.title || audit.projectName || 'Untitled Opportunity')
                                                                                                        : (audit.demandTitle || audit.title || 'Untitled Demand')}
                                                                                                >
                                                                                                    {isOpportunity
                                                                                                        ? (audit.title || audit.projectName || 'Untitled Opportunity')
                                                                                                        : (audit.demandTitle || audit.title || 'Untitled Demand')}
                                                                                                </p>

                                                                                                {/* Client + Date */}
                                                                                                <div className="flex items-center justify-between gap-2 text-xs text-gray-500 mb-2">
                                                                                                    <span className="flex items-center gap-1 truncate">
                                                                                                        <span className="font-medium text-gray-600">Client:</span>
                                                                                                        {audit.clientName || 'N/A'}
                                                                                                    </span>
                                                                                                    {sharedDateTime && (
                                                                                                        <span className="flex items-center gap-1 flex-shrink-0 text-gray-400">
                                                                                                            <Calendar className="w-3 h-3" />
                                                                                                            {new Date(sharedDateTime).toLocaleDateString('en-IN', {
                                                                                                                day: '2-digit', month: 'short', year: 'numeric'
                                                                                                            })}
                                                                                                        </span>
                                                                                                    )}
                                                                                                </div>

                                                                                                {/* Interview action */}
                                                                                                {audit.status === 'Shared' && (
                                                                                                    activeInterview ? (
                                                                                                        <div className="flex items-center gap-2 mt-1">
                                                                                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-xs font-semibold">
                                                                                                                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                                                                                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                                                                                                </svg>
                                                                                                                Interview Scheduled
                                                                                                            </span>
                                                                                                            <Button
                                                                                                                size="sm"
                                                                                                                onClick={(e) => { e.stopPropagation(); onEditInterviewFromRow(activeInterview); }}
                                                                                                                className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium h-6 px-2"
                                                                                                            >
                                                                                                                Edit
                                                                                                            </Button>
                                                                                                        </div>
                                                                                                    ) : (
                                                                                                        <Button
                                                                                                            size="sm"
                                                                                                            onClick={(e) => { e.stopPropagation(); onScheduleInterviewFromAudit(resource, audit); }}
                                                                                                            className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-xs h-6 mt-1"
                                                                                                        >
                                                                                                            Schedule
                                                                                                        </Button>
                                                                                                    )
                                                                                                )}
                                                                                            </div>
                                                                                        );
                                                                                    })}
                                                                                </div>
                                                                            )}
                                                                        </Card>
                                                                    );
                                                                })()}
                                                            </div>{/* end 2-column grid */}

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
    const [selectedResource, setSelectedResource] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
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
    const [selectedOpportunities, setSelectedOpportunities] = useState([]);
    const [selectedEmployeeForReject, setSelectedEmployeeForReject] = useState(null);
    const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
    const [opportunityGroups, setOpportunityGroups] = useState([]);
    const [demandGroups, setDemandGroups] = useState([]);
    const [selectedType, setSelectedType] = useState('demand');
    const [selectedItems, setSelectedItems] = useState([]);

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
        // existing fields
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
        // Personal Info — new
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
        // Professional Info — new
        highestQualification: "", universityName: "",
        dateOfQualification: "", usaDegree: "",
        currentJobTitle: "", mostRecentEmployer: "",
        totalExperience: "",
        relocate: "", currency: "INR",
        frequency: "Monthly", sourcingRate: "",
        // Skills — new
        primarySkills: [], secondarySkills: [],
        suggestedKeywords: "", resumeSummary: "",
    };

    // Add Employee Form State
    const [newEmployee, setNewEmployee] = useState({ ...EMPTY_INTERNAL });

    const EMPTY_EXTERNAL = {
        // existing fields
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
        // Personal Info — new
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
        // Professional Info — new
        highestQualification: "", universityName: "",
        dateOfQualification: "", usaDegree: "",
        currentJobTitle: "", mostRecentEmployer: "",
        totalExperience: "",
        relocate: "", currency: "INR",
        frequency: "Monthly", sourcingRate: "",
        // Skills — new
        primarySkills: [], secondarySkills: [],
        suggestedKeywords: "", resumeSummary: "",
    };

    // Add External Resource Form State
    const [newExternalResource, setNewExternalResource] = useState({ ...EMPTY_EXTERNAL });

    // Social Links state — shared by both internal & external add flows
    const [socialLinks, setSocialLinks] = useState([]);   // [{ linkType: '', link: '' }]

    // Documents state — shared by both flows
    const [resourceDocuments, setResourceDocuments] = useState([]);
    // [{ documentType:'', documentName:'', uploadedDate:'', expiryDate:'', renewalDate:'', file: null }]

    // Interview Modal States
    const [isScheduleDialogOpen, setIsScheduleDialogOpen] = useState(false);
    const [activeRequests, setActiveRequests] = useState([]);
    const [availableResources, setAvailableResources] = useState([]);
    const [systemInterviewers, setSystemInterviewers] = useState([]);
    const interviewLevelsOptions = ['L1', 'L2', 'L3'];
    const [activeOpportunityRequests, setActiveOpportunityRequests] = useState([]);
    const [allRequests, setAllRequests] = useState([]);
    const [activeDemandRequests, setActiveDemandRequests] = useState([]);
    const [allDemands, setAllDemands] = useState([]);
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
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingEmployee, setEditingEmployee] = useState(null);
    const [editResumeFile, setEditResumeFile] = useState(null);
    const [editSelectedSkills, setEditSelectedSkills] = useState([]);
    const [editSkillInput, setEditSkillInput] = useState("");
    const [interviewFormErrors, setInterviewFormErrors] = useState({
        general: '',
        requestId: '',
        candidateId: '',
        interviewLevels: '',
        levelsDetails: {}
    });

    // Raw interview list used for per-demand interview status lookup in expanded rows
    const [allInterviewsRaw, setAllInterviewsRaw] = useState([]);

    // Get current resources based on active tab
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

    // Set filtered resources based on active tab
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

    // Load internal resources
    // Update the loadInternalResources function to include resumeShareAudit
    const loadInternalResources = async () => {
        try {
            const response = await EmployeeService.fetchEmployeeList();
            if (response.data.success) {
                const apiResources = response.data.result;
                const persisted = loadResumeStatusMap();
                const interviewResp = await InterviewService.fetchInterviewList();
                const allInterviews = interviewResp.data.success ? interviewResp.data.result : [];
                setAllInterviewsRaw(allInterviews);

                const mappedResources = apiResources.map((emp) => {
                    // Find interviews for this employee
                    const employeeInterviews = allInterviews.filter(i => i.employeeId === emp.employeeId);
                    let interview = null;
                    if (employeeInterviews.length) {
                        // Sort by interviewId descending (latest first)
                        employeeInterviews.sort((a, b) => b.interviewId - a.interviewId);
                        const latest = employeeInterviews[0];
                        const levelProgress = latest.levelProgress || [];
                        const isSelected = levelProgress.some(l => l.level.startsWith('L') && l.status === 'Selected');
                        interview = {
                            id: latest.interviewId,
                            status: latest.status,
                            isSelected,
                            levelProgress,  // Needed for pending check
                        };
                    }

                    return {
                        id: emp.employeeId.toString(),
                        name: `${emp.firstName} ${emp.lastName || ''}`.trim(),
                        role: emp.jobTitle || emp.departmentName || "Unknown",
                        skills: emp.skills?.map(s => typeof s === 'object' ? s.skillName : s) || [],
                        primarySkills: emp.primarySkills,
                        currentProject: emp.currentProject || null,
                        joiningDate: emp.joiningDate,
                        client: emp.currentClient || emp.client || null,
                        currentClient: emp.currentClient,
                        status: emp.status === "Client" ? "Billable" : emp.status,
                        email: emp.email,
                        phone: emp.phoneNumber,
                        experience: emp.experienceYears ? `${emp.experienceYears} years` : "",
                        location: emp.location,
                        projectType: emp.employmentType,
                        photo: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150&h=150&fit=crop&crop=face",
                        previousProjects: emp.projectHistory,
                        resumeStatus: persisted[emp.employeeId.toString()] || 'pending',
                        interview,  // NEW
                        gender: emp.gender,
                        personalemail: emp.personalEmailId,
                        degrees: emp.degrees,
                        specialization: emp.specialization,
                        yearOfPassing: emp.yearOfPassing,
                        profileSummary: emp.profileSummary,
                        trainingSummary: emp.trainingSummary,
                        certificationSummary: emp.certificationSummary,
                        // ADD THESE FIELDS FROM API RESPONSE
                        resumeShareAudit: emp.resumeShareAudit || [], // This is the array of sharing history
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

    // Load external resources (mock data for demonstration)
    // Replace the existing loadExternalResources function with this:
    const loadExternalResources = async () => {
        try {
            const response = await CandidateService.fetchCandidateList();
            if (response.data.success) {
                const apiCandidates = response.data.result;
                const persisted = loadExternalResumeStatusMap();

                // Fetch all interviews once for external candidates too
                const interviewResp = await InterviewService.fetchInterviewList();
                const allInterviews = interviewResp.data.success ? interviewResp.data.result : [];
                setAllInterviewsRaw(allInterviews);

                const mappedResources = apiCandidates.map(candidate => {
                    // Find interviews for this candidate
                    const candidateInterviews = allInterviews.filter(i => i.candidateId === candidate.candidateId);
                    let interview = null;
                    if (candidateInterviews.length) {
                        // Sort by interviewId descending (latest first)
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

                    const parseSkills = (val) => {
                        if (Array.isArray(val)) return val;
                        if (typeof val === 'string') {
                            try { const p = JSON.parse(val); return Array.isArray(p) ? p : [val]; }
                            catch { return [val].filter(Boolean); }
                        }
                        return [];
                    };
                    const externalSkillNames = parseSkills(candidate.skillNames);
                    const externalPrimarySkills = parseSkills(candidate.primarySkills);
                    const externalSecondarySkills = parseSkills(candidate.secondarySkills);
                    const displaySkills = externalPrimarySkills.length > 0
                        ? externalPrimarySkills
                        : (externalSkillNames.length > 0 ? externalSkillNames : externalSecondarySkills);

                    return {
                        id: candidate.candidateId.toString(),
                        name: candidate.fullName || `${candidate.firstName} ${candidate.lastName || ''}`.trim(),
                        role: candidate.currentJobTitle || candidate.specialization || "Candidate",
                        skills: displaySkills,
                        primarySkills: externalPrimarySkills,
                        secondarySkills: externalSecondarySkills,
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
                        // Use persisted status first, then API resumeStatus (converted to lowercase)
                        resumeStatus: persisted[candidate.candidateId.toString()] ||
                            (candidate.resumeStatus ? candidate.resumeStatus.toLowerCase() : 'pending'),
                        interview, // NEW
                        gender: candidate.gender,
                        personalemail: candidate.personalEmailId || candidate.personalEmailld, // Note: API has typo "personalEmailld"
                        degrees: candidate.degrees,
                        specialization: candidate.specialization,
                        yearOfPassing: candidate.yearOfPassing,
                        profileSummary: candidate.profileSummary,
                        trainingSummary: candidate.trainingSummary,
                        certificationSummary: candidate.certificationSummary,
                        vendorName: candidate.vendorName || "External Vendor",
                        vendorContact: candidate.vendorContact || "N/A",
                        // Add these for consistency with internal resources
                        companyId: candidate.companyId || null,
                        departmentId: candidate.departmentId || null,
                        currentAccountId: candidate.currentAccountId || null,
                        costRatePerHour: candidate.costRatePerHour || "",
                        capacityHoursPerWeek: candidate.capacityHoursPerWeek || "",
                        currentProjectId: candidate.currentProjectId || null,
                        // IMPORTANT: Add resume sharing history fields from API
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

    const mapStatusToCandidate = (status) => {
        const map = {
            'Allocated': 'isBillable',
            'Engaged': 'engaged',
            'Not Allocated': 'notAvailable'
        };
        return map[status] || 'isBillable';
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
            const currentCompanyId = Number(localStorage.getItem('companyId')) || null;
            const response = await ResourceRequestService.fetchRequestList(currentCompanyId);
            if (response.data.success) {
                const list = response.data.result;
                setAllRequests(list);

                const approved = list.filter(
                    req => req.status === 'Approved' || req.status === 'Under Review'
                );

                // Separate demand and opportunity requests
                setActiveOpportunityRequests(approved.filter(req => !req.demandId));
                setActiveDemandRequests(approved.filter(req => !!req.demandId));
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
            const currentCompanyId = Number(localStorage.getItem('companyId')) || null;
            const response = await ResourceRequestService.fetchResourceRequestGroups(currentCompanyId);
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
        // Initialization: load all data on mount
        loadInternalResources();
        loadExternalResources();
        loadCompanies();
        loadDepartments();
        loadSkills();
        loadProjects();
        loadActiveRequests();
        loadInterviewers();
        loadOpportunityGroups();
        loadDemandGroups();
    }, []);

    // Filter effects for both internal and external resources
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

    const addCustomSkill = async () => {
        const skillName = skillInput.trim();
        if (!skillName) {
            toast.error("Please enter a valid skill name.");
            return;
        }
        console.log("Attempting to add skill:", skillName);
        const lower = skillName.toLowerCase();
        const existingSkill = skills.find(s => s.skillName?.toLowerCase() === lower);
        if (existingSkill && existingSkill.skillId > 0) {
            console.log("Existing API skill found:", existingSkill);
            if (!selectedSkills.some(s => s.skillId === existingSkill.skillId)) {
                setSelectedSkills([...selectedSkills, existingSkill]);
                setSkillInput("");
                toast.success("Skill added!");
            } else {
                toast.info("Skill already selected.");
                setSkillInput("");
            }
            return;
        }
        try {
            console.log("Creating new skill via API...");
            const response = await EmployeeService.createSkill(1, skillName);
            console.log("Create Skill Response:", response.data);
            if (response.data.success && response.data.result) {
                const newSkill = response.data.result;
                setSkills(prev => {
                    const filtered = prev.filter(s => s.skillName.toLowerCase() !== lower);
                    return [...filtered, newSkill].sort((a, b) => a.skillName.localeCompare(b.skillName));
                });
                setFilteredSkills(prev => {
                    const filtered = prev.filter(name => name.toLowerCase() !== lower);
                    return [...filtered, newSkill.skillName].sort();
                });
                setSelectedSkills(prev => {
                    if (!prev.some(s => s.skillId === newSkill.skillId)) {
                        return [...prev, newSkill];
                    }
                    return prev;
                });
                setSkillInput("");
                toast.success("Skill added successfully!");
            } else {
                console.error("API returned failure:", response.data.message);
                toast.error(`Failed to add skill: ${response.data.message || "Unknown error"}`);
            }
        } catch (error) {
            console.error("Error adding skill:", error.response?.data || error.message);
            toast.error("Failed to add skill. Please try again.");
        }
    };

    const selectSkillForInput = (skill) => {
        setSkillInput(skill);
    };

    // Handle parsed resume data — maps ALL extracted fields to the form state
    const handleResumeParsed = (parsedData, file, hasPartialData = false) => {
        setIsResumeUploadStepOpen(false);
        setIsAddModalOpen(true);
        setResumeFile(file);

        if (hasPartialData) {
            toast.warning('Some fields could not be extracted — please review and complete the highlighted fields.');
        }

        // Helper — only overwrite if parsed value is non-empty
        const use = (parsed, fallback) =>
            (parsed !== null && parsed !== undefined && parsed !== '') ? parsed : fallback;

        // Helper — map phone string to { countryCode, number }
        const splitPhone = (raw = '') => {
            if (!raw) return { code: '', num: '' };
            const m = raw.match(/^(\+\d{1,3})([\d\s\-]+)$/);
            if (m) return { code: m[1].trim(), num: m[2].replace(/\D/g, '') };
            return { code: '', num: raw.replace(/\D/g, '') };
        };

        // Helper — map degree abbreviation to dropdown label
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

        // Build the merged form patch shared by both resource types
        const commonPatch = (prev) => ({
            // Personal
            firstName: use(parsedData.firstName, prev.firstName),
            middleName: use(parsedData.middleName, prev.middleName),
            lastName: use(parsedData.lastName, prev.lastName),
            email: use(parsedData.email, prev.email),
            personalEmailId: use(parsedData.personalEmail, prev.personalEmailId),
            dateOfBirth: use(parsedData.dateOfBirth, prev.dateOfBirth),
            gender: use(parsedData.gender, prev.gender),
            primaryCountryCode: use(primary.code, prev.primaryCountryCode),
            primaryContactNo: use(primary.num, prev.primaryContactNo),
            secondaryCountryCode: use(secondary.code, prev.secondaryCountryCode),
            secondaryContactNo: use(secondary.num, prev.secondaryContactNo),
            countryOfCitizenship: use(parsedData.countryOfCitizenship, prev.countryOfCitizenship),
            visa: use(parsedData.visa, prev.visa),
            visaType: use(parsedData.visaType, prev.visaType),
            // Address
            country: use(parsedData.country, prev.country),
            state: use(parsedData.state, prev.state),
            city: use(parsedData.city, prev.city),
            zipCode: use(parsedData.zipCode, prev.zipCode),
            street: use(parsedData.street, prev.street),
            location: use(parsedData.location, prev.location),
            // Professional
            totalExperience: use(parsedData.experienceYears, prev.totalExperience),
            currentJobTitle: use(parsedData.role, prev.currentJobTitle),
            mostRecentEmployer: use(parsedData.currentCompany, prev.mostRecentEmployer),
            employmentType: use(parsedData.employmentType, prev.employmentType),
            highestQualification: use(qualLabel, prev.highestQualification),
            universityName: use(parsedData.universityName, prev.universityName),
            specialization: use(parsedData.specialization, prev.specialization),
            degrees: use(parsedData.degrees, prev.degrees),
            yearOfPassing: use(parsedData.yearOfPassing, prev.yearOfPassing),
            dateOfQualification: use(parsedData.dateOfQualification, prev.dateOfQualification),
            usaDegree: use(parsedData.usaDegree, prev.usaDegree),
            // Skills
            primarySkills: parsedData.skills?.length > 0 ? parsedData.skills : prev.primarySkills,
            secondarySkills: parsedData.secondarySkills?.length > 0 ? parsedData.secondarySkills : prev.secondarySkills,
            suggestedKeywords: use(parsedData.suggestedKeywords, prev.suggestedKeywords),
            resumeSummary: use(parsedData.profileSummary, prev.resumeSummary),
            // Legacy fields preserved
            experienceYears: use(parsedData.experienceYears, prev.experienceYears),
            role: use(parsedData.role, prev.role),
            currentCompany: use(parsedData.currentCompany, prev.currentCompany),
            profileSummary: use(parsedData.profileSummary, prev.profileSummary),
            trainingSummary: use(parsedData.trainingSummary, prev.trainingSummary),
            certificationSummary: use(parsedData.certificationSummary, prev.certificationSummary),
        });

        if (activeTab === 'internal') {
            setNewEmployee(prev => ({ ...prev, ...commonPatch(prev) }));
        } else {
            setNewExternalResource(prev => ({ ...prev, ...commonPatch(prev) }));
        }

        // Build per-form-key autoFilledFields map for highlight rendering
        const autoFilled = {};
        const fieldMap = {
            firstName: parsedData.firstName,
            middleName: parsedData.middleName,
            lastName: parsedData.lastName,
            email: parsedData.email,
            personalEmailId: parsedData.personalEmail,
            dateOfBirth: parsedData.dateOfBirth,
            gender: parsedData.gender,
            primaryCountryCode: primary.code,
            primaryContactNo: primary.num,
            secondaryCountryCode: secondary.code,
            secondaryContactNo: secondary.num,
            countryOfCitizenship: parsedData.countryOfCitizenship,
            visa: parsedData.visa,
            visaType: parsedData.visaType,
            country: parsedData.country,
            state: parsedData.state,
            city: parsedData.city,
            zipCode: parsedData.zipCode,
            street: parsedData.street,
            totalExperience: parsedData.experienceYears,
            currentJobTitle: parsedData.role,
            mostRecentEmployer: parsedData.currentCompany,
            employmentType: parsedData.employmentType,
            highestQualification: qualLabel,
            universityName: parsedData.universityName,
            specialization: parsedData.specialization,
            dateOfQualification: parsedData.dateOfQualification,
            usaDegree: parsedData.usaDegree,
            resumeSummary: parsedData.profileSummary,
            primarySkills: parsedData.skills?.length > 0 ? true : null,
            secondarySkills: parsedData.secondarySkills?.length > 0 ? true : null,
            suggestedKeywords: parsedData.suggestedKeywords,
        };
        Object.entries(fieldMap).forEach(([k, v]) => {
            if (v !== null && v !== undefined && v !== '' && !(Array.isArray(v) && v.length === 0)) {
                autoFilled[k] = true;
            }
        });
        setAutoFilledFields(autoFilled);

        // Social links from parsed URLs
        const parsedSocialLinks = [];
        if (parsedData.linkedIn) parsedSocialLinks.push({ linkType: 'LinkedIn', link: parsedData.linkedIn });
        if (parsedData.github) parsedSocialLinks.push({ linkType: 'GitHub', link: parsedData.github });
        if (parsedData.portfolio) parsedSocialLinks.push({ linkType: 'Portfolio', link: parsedData.portfolio });
        if (parsedData.leetcode) parsedSocialLinks.push({ linkType: 'LeetCode', link: parsedData.leetcode });
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

    // Handle Add Internal Resource
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
        // Phase 9: new fields
        if (newEmployee.middleName) formData.append("middleName", newEmployee.middleName);
        if (newEmployee.dateOfBirth) formData.append("dateOfBirth", newEmployee.dateOfBirth);
        if (newEmployee.primaryCountryCode) formData.append("primaryCountryCode", newEmployee.primaryCountryCode);
        if (newEmployee.primaryContactNo) formData.append("primaryContactNo", newEmployee.primaryContactNo);
        if (newEmployee.secondaryCountryCode) formData.append("secondaryCountryCode", newEmployee.secondaryCountryCode);
        if (newEmployee.secondaryContactNo) formData.append("secondaryContactNo", newEmployee.secondaryContactNo);
        if (newEmployee.countryOfCitizenship) formData.append("countryOfCitizenship", newEmployee.countryOfCitizenship);
        if (newEmployee.documentType) formData.append("documentType", newEmployee.documentType);
        if (newEmployee.documentNumber) formData.append("documentNumber", newEmployee.documentNumber);
        if (newEmployee.securityClearance) formData.append("securityClearance", newEmployee.securityClearance);
        if (newEmployee.visa) formData.append("visa", newEmployee.visa);
        if (newEmployee.visaType) formData.append("visaType", newEmployee.visaType);
        if (newEmployee.country) formData.append("country", newEmployee.country);
        if (newEmployee.state) formData.append("state", newEmployee.state);
        if (newEmployee.city) formData.append("city", newEmployee.city);
        if (newEmployee.zipCode) formData.append("zipCode", newEmployee.zipCode);
        if (newEmployee.street) formData.append("street", newEmployee.street);
        if (newEmployee.availabilityToJoin) formData.append("availabilityToJoin", newEmployee.availabilityToJoin);
        if (newEmployee.interviewAvailability) formData.append("interviewAvailability", newEmployee.interviewAvailability);
        if (newEmployee.highestQualification) formData.append("highestQualification", newEmployee.highestQualification);
        if (newEmployee.universityName) formData.append("universityName", newEmployee.universityName);
        if (newEmployee.dateOfQualification) formData.append("dateOfQualification", newEmployee.dateOfQualification);
        if (newEmployee.usaDegree) formData.append("usaDegree", newEmployee.usaDegree);
        if (newEmployee.currentJobTitle) formData.append("currentJobTitle", newEmployee.currentJobTitle);
        if (newEmployee.mostRecentEmployer) formData.append("mostRecentEmployer", newEmployee.mostRecentEmployer);
        if (newEmployee.totalExperience) formData.append("totalExperience", Number(newEmployee.totalExperience));
        if (newEmployee.relocate) formData.append("relocate", newEmployee.relocate);
        if (newEmployee.currency) formData.append("currency", newEmployee.currency);
        if (newEmployee.frequency) formData.append("frequency", newEmployee.frequency);
        if (newEmployee.sourcingRate) formData.append("sourcingRate", Number(newEmployee.sourcingRate));
        if (newEmployee.resumeSummary) formData.append("resumeSummary", newEmployee.resumeSummary);
        if (newEmployee.suggestedKeywords) formData.append("suggestedKeywords", newEmployee.suggestedKeywords);
        if (Array.isArray(newEmployee.primarySkills) && newEmployee.primarySkills.length > 0)
            formData.append("primarySkills", JSON.stringify(newEmployee.primarySkills));
        if (Array.isArray(newEmployee.secondarySkills) && newEmployee.secondarySkills.length > 0)
            formData.append("secondarySkills", JSON.stringify(newEmployee.secondarySkills));
        if (Array.isArray(socialLinks) && socialLinks.length > 0)
            formData.append("socialLinks", JSON.stringify(socialLinks));
        if (resumeFile) {
            formData.append("resume", resumeFile);
            formData.append("storageType", storageType);
        }
        try {
            console.log("Submitting new employee:", Object.fromEntries(formData));
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

                // Check for errors array first (as shown in your screenshot)
                if (response && response.data && response.data.errors && response.data.errors.length > 0) {
                    errorMessage = response.data.errors[0];
                }
                // Check for direct message field
                else if (response && response.data && response.data.message) {
                    errorMessage = response.data.message;
                }
                // Check for error field
                else if (response && response.data && response.data.error) {
                    errorMessage = response.data.error;
                }

                console.error("Failed to add resource:", errorMessage, response?.data);
                toast.error(errorMessage);
            }
        } catch (error) {
            Swal.close();
            console.error("Error adding Internal resource:", error.response?.data || error.message);

            // Extract error message from backend response
            let errorMessage = "Error adding Internal resource";

            if (error.response?.data?.errors && error.response.data.errors.length > 0) {
                // Get the first error message from the errors array
                errorMessage = error.response.data.errors[0];
            } else if (error.response?.data?.message) {
                // Fallback to message field if errors array doesn't exist
                errorMessage = error.response.data.message;
            } else {
                errorMessage = error.message;
            }

            toast.error(errorMessage);
        }
    };

    // Handle Add External Resource
    const handleAddExternalResource = async () => {
        if (!newExternalResource.firstName || !newExternalResource.email) {
            toast.error("Please fill in all required fields (First Name, Email)");
            return;
        }

        const formData = new FormData();

        // Use the first company if available, else default to 1
        const companyId = companies.length > 0 ? companies[0].companyId : 1;
        formData.append("companyId", companyId.toString());

        // Append all form data according to API requirements
        formData.append("firstName", newExternalResource.firstName.trim());
        formData.append("lastName", newExternalResource.lastName ? newExternalResource.lastName.trim() : "");
        formData.append("email", newExternalResource.email);
        formData.append("phoneNumber", newExternalResource.phoneNumber || "");
        formData.append("experienceYears", Number(newExternalResource.experienceYears) || 0);
        formData.append("location", newExternalResource.location || "");
        formData.append("joiningDate", newExternalResource.joiningDate || new Date().toISOString().split("T")[0]);

        // FIXED: Map the selected status to API expected value
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
        // Phase 9 new fields
        if (newExternalResource.middleName) formData.append("middleName", newExternalResource.middleName);
        if (newExternalResource.dateOfBirth) formData.append("dateOfBirth", newExternalResource.dateOfBirth);
        if (newExternalResource.primaryCountryCode) formData.append("primaryCountryCode", newExternalResource.primaryCountryCode);
        if (newExternalResource.primaryContactNo) formData.append("primaryContactNo", newExternalResource.primaryContactNo);
        if (newExternalResource.secondaryCountryCode) formData.append("secondaryCountryCode", newExternalResource.secondaryCountryCode);
        if (newExternalResource.secondaryContactNo) formData.append("secondaryContactNo", newExternalResource.secondaryContactNo);
        if (newExternalResource.countryOfCitizenship) formData.append("countryOfCitizenship", newExternalResource.countryOfCitizenship);
        if (newExternalResource.documentType) formData.append("documentType", newExternalResource.documentType);
        if (newExternalResource.documentNumber) formData.append("documentNumber", newExternalResource.documentNumber);
        if (newExternalResource.securityClearance) formData.append("securityClearance", newExternalResource.securityClearance);
        if (newExternalResource.visa) formData.append("visa", newExternalResource.visa);
        if (newExternalResource.visaType) formData.append("visaType", newExternalResource.visaType);
        if (newExternalResource.country) formData.append("country", newExternalResource.country);
        if (newExternalResource.state) formData.append("state", newExternalResource.state);
        if (newExternalResource.city) formData.append("city", newExternalResource.city);
        if (newExternalResource.zipCode) formData.append("zipCode", newExternalResource.zipCode);
        if (newExternalResource.street) formData.append("street", newExternalResource.street);
        if (newExternalResource.availabilityToJoin) formData.append("availabilityToJoin", newExternalResource.availabilityToJoin);
        if (newExternalResource.interviewAvailability) formData.append("interviewAvailability", newExternalResource.interviewAvailability);
        if (newExternalResource.highestQualification) formData.append("highestQualification", newExternalResource.highestQualification);
        if (newExternalResource.universityName) formData.append("universityName", newExternalResource.universityName);
        if (newExternalResource.dateOfQualification) formData.append("dateOfQualification", newExternalResource.dateOfQualification);
        if (newExternalResource.usaDegree) formData.append("usaDegree", newExternalResource.usaDegree);
        if (newExternalResource.currentJobTitle) formData.append("currentJobTitle", newExternalResource.currentJobTitle);
        if (newExternalResource.mostRecentEmployer) formData.append("mostRecentEmployer", newExternalResource.mostRecentEmployer);
        if (newExternalResource.totalExperience) formData.append("totalExperience", Number(newExternalResource.totalExperience));
        if (newExternalResource.relocate) formData.append("relocate", newExternalResource.relocate);
        if (newExternalResource.currency) formData.append("currency", newExternalResource.currency);
        if (newExternalResource.frequency) formData.append("frequency", newExternalResource.frequency);
        if (newExternalResource.sourcingRate) formData.append("sourcingRate", Number(newExternalResource.sourcingRate));
        if (newExternalResource.resumeSummary) formData.append("resumeSummary", newExternalResource.resumeSummary);
        if (newExternalResource.suggestedKeywords) formData.append("suggestedKeywords", newExternalResource.suggestedKeywords);
        // Always send both arrays so backend can persist skills consistently
        formData.append("primarySkills", JSON.stringify(Array.isArray(newExternalResource.primarySkills) ? newExternalResource.primarySkills : []));
        formData.append("secondarySkills", JSON.stringify(Array.isArray(newExternalResource.secondarySkills) ? newExternalResource.secondarySkills : []));
        if (Array.isArray(socialLinks) && socialLinks.length > 0)
            formData.append("socialLinks", JSON.stringify(socialLinks));

        // Add skills
        selectedSkills.forEach((s) => {
            if (s.skillId > 0) {
                formData.append("skillIds", s.skillId.toString());
            }
        });
        const mergedSkillNames = [
            ...(Array.isArray(newExternalResource.primarySkills) ? newExternalResource.primarySkills : []),
            ...(Array.isArray(newExternalResource.secondarySkills) ? newExternalResource.secondarySkills : []),
        ].map(s => (s || "").trim()).filter(Boolean);
        mergedSkillNames.forEach((name) => formData.append("skillNames", name));

        // Add resume file if available
        if (resumeFile) {
            formData.append("resume", resumeFile);
        }

        Swal.fire({
            title: 'Adding External resource',
            allowOutsideClick: false,
            allowEscapeKey: false,
            showConfirmButton: false,
            didOpen: () => {
                Swal.showLoading();
            }
        });

        try {
            const response = await CandidateService.createCandidate(formData);
            if (response.data.success) {
                toast.success("External candidate added successfully!");
                Swal.close();
                setIsAddModalOpen(false);

                // Refresh the external resources
                await loadExternalResources();

                // Reset form
                setNewExternalResource({ ...EMPTY_EXTERNAL });
                setSelectedSkills([]);
                setSkillInput("");
                setSocialLinks([]);
                setResourceDocuments([]);
                setResumeFile(null);
            } else {
                Swal.close();

                // Handle non-success response from backend
                let errorMessage = "Failed to add external candidate.";

                // Check for errors array first (as shown in your screenshot)
                if (response && response.data && response.data.errors && response.data.errors.length > 0) {
                    errorMessage = response.data.errors[0];
                }
                // Check for direct message field
                else if (response && response.data && response.data.message) {
                    errorMessage = response.data.message;
                }
                // Check for error field
                else if (response && response.data && response.data.error) {
                    errorMessage = response.data.error;
                }

                console.error("Failed to add external candidate:", errorMessage, response?.data);
                toast.error(errorMessage);
            }
        } catch (error) {
            Swal.close();
            console.error("Error adding external candidate:", error.response?.data || error.message);

            // Extract error message from backend response
            let errorMessage = "Error adding external candidate";

            if (error.response?.data?.errors && error.response.data.errors.length > 0) {
                // Get the first error message from the errors array
                errorMessage = error.response.data.errors[0];
            } else if (error.response?.data?.message) {
                // Fallback to message field if errors array doesn't exist
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
                // Import internal employees
                response = await EmployeeService.importExcel(formData);
            } else {
                // Import external candidates
                response = await CandidateService.importExcel(formData);
            }

            // SUCCESS path
            if (response.data.success) {
                const successMessage = activeTab === "internal"
                    ? "Employees imported successfully!"
                    : "Candidates imported successfully!";

                toast.success(successMessage);
                setIsImportModalOpen(false);
                setImportCompanyId(null);
                setImportFile(null);

                // Refresh the appropriate list
                if (activeTab === "internal") {
                    loadInternalResources();
                } else {
                    loadExternalResources();
                }

                return;
            }

            // ---- API returned **failure** (e.g. bad-request with errors array) ----
            if (Array.isArray(response.data.errors) && response.data.errors.length > 0) {
                const errorMsg = response.data.errors.join("\n");
                toast.error(
                    <div className="whitespace-pre-line text-left">
                        {errorMsg}
                    </div>,
                    { duration: 8000 }
                );
                return;
            }

            // Fallback generic message
            toast.error(`Import failed: ${response.data.message || "Unknown error"}`);

        } catch (error) {
            // ---- Network / 400 / 500 errors ----
            console.error("Import error:", error);

            if (error.response?.data?.errors && Array.isArray(error.response.data.errors)) {
                const errorMsg = error.response.data.errors.join("\n");
                toast.error(
                    <div className="whitespace-pre-line text-left">
                        {errorMsg}
                    </div>,
                    { duration: 8000 }
                );
                return;
            }

            // Any other error
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

        // Pre-fill candidate from row context, leave Demand and Request empty for user to select
        setInterviewFormData({
            id: '',
            demandId: '',       // Must start empty — user selects demand
            requestId: '',      // Auto-fills once demand is selected
            candidateId: resource.id.toString(),  // Locked from row context
            candidateName: resource.name,         // For display
            interviewLevels: [],
            levelsDetails: [],
            originalLevels: [],
            interviewType: 'demand'
        });

        setDemandResourceRequests([]);
        setIsScheduleDialogOpen(true);
    };

    // Edit an already-scheduled interview from the expanded row audit card
    const handleEditInterviewFromRow = (interview) => {
        // interview is a raw API interview object from allInterviewsRaw
        const isDemand = !!interview.demandId;
        const interviewType = isDemand ? 'demand' : 'opportunity';

        const details = (interview.levelProgress || []).map((p) => {
            const [dp, tp] = (p.scheduledAt || '').split(' ');
            const [day, month, year] = dp?.split('-') || [];
            const formattedDate = dp && day && month && year
                ? `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
                : '';
            const [hour, minute] = tp?.split('-') || [];
            const formattedTime = tp ? `${hour}:${minute}` : '';
            return {
                level: p.level,
                interviewer: p.interviewerUserId?.toString() || '',
                date: formattedDate,
                time: formattedTime,
                notes: p.interviewNotes || p.feedbackComments || '',
                status: p.status || 'Scheduled',
            };
        });

        const resourceType = interview.employeeId && !interview.candidateId ? 'internal' : 'external';
        const candidateId = resourceType === 'internal'
            ? interview.employeeId?.toString() || ''
            : interview.candidateId?.toString() || '';

        setInterviewFormData({
            id: interview.interviewId?.toString() || '',
            requestId: interview.requestId?.toString() || '',
            candidateId,
            interviewLevels: interview.interviewLevels || [],
            levelsDetails: details,
            originalLevels: interview.interviewLevels || [],
            interviewType,
            resourceType,
            demandId: interview.demandId?.toString() || '',
        });

        // Pre-load demand resource requests so the dropdown populates
        if (isDemand && interview.demandId) {
            InterviewService.getResourceRequestsByDemand(interview.demandId.toString())
                .then(requests => setDemandResourceRequests(requests || []))
                .catch(() => setDemandResourceRequests([]));
        }

        setIsScheduleDialogOpen(true);
    };

    // Add this function in the ResourceManagement component, after the handleScheduleInterview function
    const handleScheduleInterviewFromAudit = (resource, audit) => {
        // Find the corresponding request from allRequests
        let request = null;

        if (audit.type === 'GROUP' || audit.type === 'OPPORTUNITY') {
            // Find opportunity request
            request = allRequests.find(req => req.groupId === audit.groupId);
        } else if (audit.type === 'DEMAND') {
            // Find demand request
            request = allRequests.find(req => req.demandId === audit.demandId);
        }

        if (!request) {
            toast.error('Could not find the corresponding request. Please try again.');
            return;
        }

        // Set the interview form data with pre-filled values
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
            const lockedCandidateId = prev => prev.candidateId; // preserve the locked candidate
            setInterviewFormData((prev) => ({
                ...prev,
                demandId: value,
                requestId: '',
                // Do NOT reset candidateId — candidate is locked from the row context
            }));
            // Fetch resource requests for this demand, then auto-filter to the locked candidate
            InterviewService.getResourceRequestsByDemand(value)
                .then(requests => {
                    setDemandResourceRequests(requests || []);
                    // After loading, auto-match the request for this candidate
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
            general: '' // Also clear general error when user starts fixing fields
        }));
    };

    const clearInterviewLevelError = (level) => {
        setInterviewFormErrors(prev => ({
            ...prev,
            levelsDetails: {
                ...prev.levelsDetails,
                [level]: {}
            },
            general: ''
        }));
    };

    const handleSubmitInterview = () => {
        // Clear previous errors
        setInterviewFormErrors({
            general: '',
            requestId: '',
            candidateId: '',
            interviewLevels: '',
            levelsDetails: {}
        });

        // Frontend validation
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

            // Scroll to first error
            setTimeout(() => {
                const firstErrorElement = document.querySelector('[data-interview-error="true"]');
                if (firstErrorElement) {
                    firstErrorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            }, 100);

            return;
        }

        const levels = interviewFormData.levelsDetails.map((d) => {
            // Format date from "yyyy-mm-dd" to "dd-MM-yyyy"
            const [year, month, day] = d.date.split('-');
            const formattedDate = `${day}-${month}-${year}`;

            // Format time from "HH:mm" to "HH-mm"
            const formattedTime = d.time.replace(':', '-');

            // Ensure time has leading zeros if needed
            const timeParts = formattedTime.split('-');
            const hours = timeParts[0].padStart(2, '0');
            const minutes = timeParts[1].padStart(2, '0');
            const finalTime = `${hours}-${minutes}`;

            console.log('Formatted scheduledAt:', `${formattedDate} ${finalTime}`);

            return {
                level: d.level,
                scheduledAt: `${formattedDate} ${finalTime}`,
                interviewNotes: d.notes || '',
                ...(isDemand ? {} : { interviewerUserId: d.interviewer ? parseInt(d.interviewer) : null }),
            };
        });

        console.log('Final levels array:', levels);

        let apiCall;
        if (isDemand) {
            apiCall = InterviewService.createBatchInterview(
                parseInt(interviewFormData.requestId),
                parseInt(interviewFormData.candidateId),
                currentUserId,
                interviewFormData.interviewLevels,
                levels
            );
        } else {
            apiCall = InterviewService.createInterview(
                parseInt(interviewFormData.requestId),
                parseInt(interviewFormData.candidateId),
                null,
                interviewFormData.interviewLevels,
                levels
            );
        }

        // Remove toast.promise and handle the API call directly
        const submitAction = async () => {
            try {
                console.log('Scheduling interview for:', {
                    activeTab: activeTab,
                    requestId: interviewFormData.requestId,
                    candidateId: interviewFormData.candidateId,
                    interviewLevels: interviewFormData.interviewLevels,
                    levels: levels,
                    interviewType: interviewFormData.interviewType,
                    editMode: !!interviewFormData.id
                });

                let res;
                const isDemand = interviewFormData.interviewType === 'demand';

                // ── EDIT MODE: update existing interview ──────────────────────────
                if (interviewFormData.id) {
                    res = await InterviewService.updateInterview(
                        parseInt(interviewFormData.id),
                        parseInt(interviewFormData.requestId),
                        null, // interviewerUserId is embedded per-level
                        interviewFormData.interviewLevels,
                        levels
                    );
                    if (res.data.success) {
                        setIsScheduleDialogOpen(false);
                        if (activeTab === "internal") { loadInternalResources(); }
                        else { loadExternalResources(); }
                        toast.success('Interview updated successfully');
                    } else {
                        const errorMessage = res.data.errors?.join(', ') || 'Unknown error';
                        throw new Error(errorMessage);
                    }
                    return; // exit early — no need to continue to create path
                }
                // ─────────────────────────────────────────────────────────────────

                if (activeTab === "internal") {
                    // For internal resources: pass employeeId, candidateId = null
                    if (isDemand) {
                        res = await InterviewService.createBatchInterview(
                            parseInt(interviewFormData.requestId),
                            parseInt(interviewFormData.candidateId), // employeeId for internal
                            null, // candidateId should be null for internal
                            currentUserId,
                            interviewFormData.interviewLevels,
                            levels
                        );
                    } else {
                        res = await InterviewService.createInterview(
                            parseInt(interviewFormData.requestId),
                            parseInt(interviewFormData.candidateId), // employeeId for internal
                            null, // candidateId should be null for internal
                            null, // interviewerUserId will be in levels array
                            interviewFormData.interviewLevels,
                            levels
                        );
                    }
                } else {
                    // For external resources: pass candidateId, employeeId = null
                    if (isDemand) {
                        res = await InterviewService.createBatchInterview(
                            parseInt(interviewFormData.requestId),
                            null, // employeeId should be null for external
                            parseInt(interviewFormData.candidateId), // candidateId for external
                            currentUserId,
                            interviewFormData.interviewLevels,
                            levels
                        );
                    } else {
                        res = await InterviewService.createInterview(
                            parseInt(interviewFormData.requestId),
                            null, // employeeId should be null for external
                            parseInt(interviewFormData.candidateId), // candidateId for external
                            null, // interviewerUserId will be in levels array
                            interviewFormData.interviewLevels,
                            levels
                        );
                    }
                }

                if (res.data.success) {
                    setIsScheduleDialogOpen(false);

                    // Refresh appropriate resources based on active tab
                    if (activeTab === "internal") {
                        loadInternalResources();
                    } else {
                        loadExternalResources();
                    }

                    toast.success('Interview scheduled and mail sent successfully');
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
                    console.error('Backend error details:', responseData);
                } else if (error.message) {
                    errorMessage = error.message;
                }

                // Set the general error to display in the form
                setInterviewFormErrors(prev => ({
                    ...prev,
                    general: errorMessage
                }));

                // Scroll to the error message
                setTimeout(() => {
                    const errorElement = document.querySelector('[data-interview-general-error="true"]');
                    if (errorElement) {
                        errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }
                }, 100);
            }
        };

        submitAction();
    };

    // Update the handleViewResume function to handle both internal and external
    const handleViewResume = async (id) => {
        Swal.fire({
            title: 'Loading resume...',
            allowOutsideClick: false,
            allowEscapeKey: false,
            showConfirmButton: false,
            didOpen: () => {
                Swal.showLoading();
            }
        });
        try {
            let response;
            if (activeTab === "internal") {
                response = await EmployeeService.viewResume(id);
            } else {
                response = await CandidateService.viewResume(id);
            }

            Swal.close();
            const contentType = response.headers['content-type'] || 'application/pdf';
            const blob = new Blob([response.data], { type: contentType });
            const url = window.URL.createObjectURL(blob);

            // Set modal data
            setResumeUrl(url);
            setResumeFileName(`${activeTab === "internal" ? "Internal EMP" : "External EMP"}-${id}.${contentType.split('/')[1] || 'pdf'}`);
            setIsResumeModalOpen(true);
        } catch (error) {
            console.error("Error viewing resume:", error);
            toast.error("Failed to load resume. Please check if resume is uploaded and try again.");
            Swal.close();
        }
    };

    const handleSkillMatcher = async (resource) => {
        Swal.fire({
            title: 'Fetching skill matches...',
            allowOutsideClick: false,
            allowEscapeKey: false,
            showConfirmButton: false,
            didOpen: () => {
                Swal.showLoading();
            }
        });

        try {
            const data = await SkillMatcherService.matchSkills();
            Swal.close();

            const matches = data.response || data;
            const employeeMatch = matches.find(em => em.employee_id === parseInt(resource.id));
            if (employeeMatch) {
                setSkillMatches(employeeMatch.status);
                setIsSkillMatcherModalOpen(true);
            } else {
                Swal.fire({
                    icon: 'warning',
                    title: 'No Matches Found',
                    text: "No matching data found for this employee.",
                    confirmButtonText: 'OK'
                });
            }
        } catch (error) {
            Swal.close();
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: "Failed to fetch skill matches. Please try again.",
                confirmButtonText: 'OK'
            });
        }
    };

    const handleResumeShare = (employeeId) => {
        setSelectedEmployeeForShare(employeeId);
        setSelectedItems([]);
        setSelectedType('demand'); // Default to demand when opening share dialog
        setIsShareDialogOpen(true);
    };

    const handleResumeReject = (employeeId) => {
        setSelectedEmployeeForReject(employeeId);
        setSelectedItems([]);
        setSelectedType('demand'); // Default to demand when opening reject dialog
        setIsRejectDialogOpen(true);
    };

    const handleResumePending = (employeeId) => {
        if (activeTab === "internal") {
            const newMap = { ...loadResumeStatusMap(), [employeeId]: "pending" };
            saveResumeStatusMap(newMap);
            setInternalResources(prev => prev.map(r =>
                r.id === employeeId ? { ...r, resumeStatus: "pending" } : r
            ));
        } else {
            const newMap = { ...loadExternalResumeStatusMap(), [employeeId]: "pending" };
            saveExternalResumeStatusMap(newMap);
            setExternalResources(prev => prev.map(r =>
                r.id === employeeId ? { ...r, resumeStatus: "pending" } : r
            ));
        }
    };

    const handleSubmitShare = async () => {
        try {
            const ids = selectedType === 'opportunity'
                ? selectedItems.map(g => g.groupId)
                : selectedItems.map(g => g.demandid);

            let response;

            if (activeTab === "internal") {
                // Internal employee share
                const payload = {
                    employeeId: selectedEmployeeForShare,
                    status: 'Shared',
                    actionByUserId: localStorage.getItem('userId')
                };

                if (selectedType === 'opportunity') {
                    payload.groupIds = ids;
                } else {
                    payload.demandIds = ids;
                }

                response = await EmployeeService.shareResume(
                    payload.employeeId,
                    payload.status,
                    payload.actionByUserId,
                    ids,
                    selectedType
                );
            } else {
                // External candidate share
                const payload = {
                    candidateId: selectedEmployeeForShare,
                    status: 'Shared',
                    actionByUserId: localStorage.getItem('userId')
                };

                if (selectedType === 'opportunity') {
                    payload.groupIds = ids;
                } else {
                    payload.demandIds = ids;
                }

                response = await CandidateService.shareResume(
                    payload.candidateId,
                    payload.status,
                    payload.actionByUserId,
                    ids,
                    selectedType
                );
            }

            if (response.data.success) {
                // Update localStorage
                if (activeTab === "internal") {
                    const newMap = { ...loadResumeStatusMap(), [selectedEmployeeForShare]: "shared" };
                    saveResumeStatusMap(newMap);

                    // Update component state
                    setInternalResources(prev => prev.map(r =>
                        r.id === selectedEmployeeForShare ? { ...r, resumeStatus: "shared" } : r
                    ));
                } else {
                    const newMap = { ...loadExternalResumeStatusMap(), [selectedEmployeeForShare]: "shared" };
                    saveExternalResumeStatusMap(newMap);

                    // Update component state
                    setExternalResources(prev => prev.map(r =>
                        r.id === selectedEmployeeForShare ? { ...r, resumeStatus: "shared" } : r
                    ));
                }

                toast.success('Resume shared successfully!');
                setIsShareDialogOpen(false);
                setSelectedItems([]);
                loadInternalResources();
                loadExternalResources();

            } else {
                const errorMessage = response.data.errors?.[0] || 'Failed to share resume';
                toast.error(errorMessage);
            }
        } catch (error) {
            console.error('Error sharing resume:', error);

            if (error.response?.data) {
                const backendError = error.response.data;
                const errorMessage = backendError.errors?.[0] || backendError.message || 'Error sharing resume';
                toast.error(errorMessage);
            } else if (error.request) {
                toast.error('Network error: Unable to connect to server');
            } else {
                toast.error('Error sharing resume');
            }
        }
    };
    const isResumeToggleLocked = (resource) => {
        if (resource.resumeStatus !== 'shared') return false;
        const i = resource.interview;
        if (!i || !i.isSelected) return false;
        // Over if in final status or (Selected with no pending L* scheduled levels)
        const finalStatuses = ['NoShow', 'Cancelled', 'Rejected', 'Completed'];
        const hasPendingLevels = i.levelProgress.some(l => l.level.startsWith('L') && l.status === 'Scheduled');
        const isOver = finalStatuses.includes(i.status) || (i.status === 'Selected' && !hasPendingLevels);
        return !isOver;
    };

    const handleRejectShare = async () => {
        try {
            const ids = selectedType === 'opportunity'
                ? selectedItems.map(g => g.groupId)
                : selectedItems.map(g => g.demandid);

            let response;

            if (activeTab === "internal") {
                // Internal employee reject
                const payload = {
                    employeeId: selectedEmployeeForReject,
                    status: 'Rejected',
                    actionByUserId: localStorage.getItem('userId')
                };

                if (selectedType === 'opportunity') {
                    payload.groupIds = ids;
                } else {
                    payload.demandIds = ids;
                }

                response = await EmployeeService.shareResume(
                    payload.employeeId,
                    payload.status,
                    payload.actionByUserId,
                    ids,
                    selectedType
                );
            } else {
                // External candidate reject
                const payload = {
                    candidateId: selectedEmployeeForReject,
                    status: 'Rejected',
                    actionByUserId: localStorage.getItem('userId')
                };

                if (selectedType === 'opportunity') {
                    payload.groupIds = ids;
                } else {
                    payload.demandIds = ids;
                }

                response = await CandidateService.shareResume(
                    payload.candidateId,
                    payload.status,
                    payload.actionByUserId,
                    ids,
                    selectedType
                );
            }

            if (response.data.success) {
                // Update localStorage
                if (activeTab === "internal") {
                    const newMap = { ...loadResumeStatusMap(), [selectedEmployeeForReject]: "rejected" };
                    saveResumeStatusMap(newMap);

                    // Update component state
                    setInternalResources(prev => prev.map(r =>
                        r.id === selectedEmployeeForReject ? { ...r, resumeStatus: "rejected" } : r
                    ));
                } else {
                    const newMap = { ...loadExternalResumeStatusMap(), [selectedEmployeeForReject]: "rejected" };
                    saveExternalResumeStatusMap(newMap);

                    // Update component state
                    setExternalResources(prev => prev.map(r =>
                        r.id === selectedEmployeeForReject ? { ...r, resumeStatus: "rejected" } : r
                    ));
                }

                toast.success('Resume rejected successfully!');
                setIsRejectDialogOpen(false);
                setSelectedItems([]);
                loadInternalResources();
                loadExternalResources()
            } else {
                const errorMessage = response.data.errors?.[0] || 'Failed to reject resume';
                toast.error(errorMessage);
            }
        } catch (error) {
            console.error('Error rejecting resume:', error);

            if (error.response?.data) {
                const backendError = error.response.data;
                const errorMessage = backendError.errors?.[0] || backendError.message || 'Error rejecting resume';
                toast.error(errorMessage);
            } else if (error.request) {
                toast.error('Network error: Unable to connect to server');
            } else {
                toast.error('Error rejecting resume');
            }
        }
    };

    // Word count helper function
    const countWords = (text) => {
        return text.trim() === '' ? 0 : text.trim().split(/\s+/).length;
    };

    const loadDemandGroups = async () => {
        try {
            const currentCompanyId = Number(localStorage.getItem('companyId')) || null;
            const response = await DemandService.fetchDemandList(currentCompanyId);
            if (response.data.success) {
                setDemandGroups(response.data.result || []);
            } else {
                toast.error('Failed to fetch demands');
            }
        } catch (error) {
            console.error('Error loading demands:', error);
            toast.error('Error loading demands');
        }
    };

    const handleEditResource = (resource) => {
        const mappedEmployee = {
            employeeId: resource.id,
            companyId: activeTab === "internal" ? resource.companyId : companies[0]?.companyId || 1,
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
            primarySkills: Array.isArray(resource.primarySkills) ? resource.primarySkills : (Array.isArray(resource.skills) ? resource.skills : []),
            secondarySkills: Array.isArray(resource.secondarySkills) ? resource.secondarySkills : [],
            vendorName: resource.vendorName,
            vendorContact: resource.vendorContact,
            role: resource.role, // Added for external
            currentCompany: resource.currentCompany || "",
            currentCtc: resource.currentCtc || "",
            expectedCtc: resource.expectedCtc || "",
            noticePeriod: resource.noticePeriod || "",
            preferredLocation: resource.preferredLocation || "",
            comments: resource.comments || "",
        };
        const mappedSkills = resource.skills.map(skill => ({
            skillId: skills.find(s => s.skillName === skill)?.skillId || -1,
            skillName: skill
        }));

        navigate(`/hr/resources/add?type=${activeTab}`, {
            state: {
                editResource: {
                    id: resource.id,
                    type: activeTab,
                    formData: mappedEmployee,
                    selectedSkills: mappedSkills,
                    socialLinks: Array.isArray(resource.socialLinks) ? resource.socialLinks : [],
                },
            },
        });
    };
    const handleUpdateResource = async () => {
        if (!editingEmployee?.employeeId) {
            toast.error("No resource selected");
            return;
        }

        Swal.fire({
            title: 'Updating resource...',
            allowOutsideClick: false,
            allowEscapeKey: false,
            showConfirmButton: false,
            didOpen: () => {
                Swal.showLoading();
            }
        });
        try {
            if (activeTab === "internal") {
                // === INTERNAL EMPLOYEE UPDATE ===
                const formData = new FormData();
                formData.append("employeeId", editingEmployee.employeeId);
                formData.append("companyId", editingEmployee.companyId || 1);
                formData.append("firstName", editingEmployee.firstName?.trim() || "");
                formData.append("lastName", editingEmployee.lastName?.trim() || "");
                formData.append("email", editingEmployee.email || "");
                formData.append("phoneNumber", editingEmployee.phoneNumber || "");
                formData.append("departmentId", editingEmployee.departmentId || 1);
                formData.append("experienceYears", Number(editingEmployee.experienceYears) || 0);
                formData.append("location", editingEmployee.location || "");
                formData.append("joiningDate", editingEmployee.joiningDate || "");
                formData.append("status", editingEmployee.status === "Billable" ? "Client" : editingEmployee.status);
                formData.append("employmentType", editingEmployee.employmentType || "Regular");

                if (editingEmployee.currentProjectId) {
                    formData.append("currentProjectId", editingEmployee.currentProjectId);
                }
                if (editingEmployee.currentAccountId) {
                    formData.append("currentAccountId", editingEmployee.currentAccountId);
                }

                editSelectedSkills.forEach(skill => {
                    if (skill.skillId > 0) formData.append("skillIds", skill.skillId);
                });

                formData.append("gender", editingEmployee.gender || "");
                formData.append("personalEmailId", editingEmployee.personalEmailId || "");
                formData.append("degrees", editingEmployee.degrees || "");
                formData.append("specialization", editingEmployee.specialization || "");
                formData.append("yearOfPassing", editingEmployee.yearOfPassing || "");
                formData.append("profileSummary", editingEmployee.profileSummary || "");
                formData.append("trainingSummary", editingEmployee.trainingSummary || "");
                formData.append("certificationSummary", editingEmployee.certificationSummary || "");
                // Phase 9 new fields
                if (editingEmployee.middleName) formData.append("middleName", editingEmployee.middleName);
                if (editingEmployee.dateOfBirth) formData.append("dateOfBirth", editingEmployee.dateOfBirth);
                if (editingEmployee.primaryCountryCode) formData.append("primaryCountryCode", editingEmployee.primaryCountryCode);
                if (editingEmployee.primaryContactNo) formData.append("primaryContactNo", editingEmployee.primaryContactNo);
                if (editingEmployee.secondaryCountryCode) formData.append("secondaryCountryCode", editingEmployee.secondaryCountryCode);
                if (editingEmployee.secondaryContactNo) formData.append("secondaryContactNo", editingEmployee.secondaryContactNo);
                if (editingEmployee.countryOfCitizenship) formData.append("countryOfCitizenship", editingEmployee.countryOfCitizenship);
                if (editingEmployee.documentType) formData.append("documentType", editingEmployee.documentType);
                if (editingEmployee.documentNumber) formData.append("documentNumber", editingEmployee.documentNumber);
                if (editingEmployee.securityClearance) formData.append("securityClearance", editingEmployee.securityClearance);
                if (editingEmployee.visa) formData.append("visa", editingEmployee.visa);
                if (editingEmployee.visaType) formData.append("visaType", editingEmployee.visaType);
                if (editingEmployee.country) formData.append("country", editingEmployee.country);
                if (editingEmployee.state) formData.append("state", editingEmployee.state);
                if (editingEmployee.city) formData.append("city", editingEmployee.city);
                if (editingEmployee.zipCode) formData.append("zipCode", editingEmployee.zipCode);
                if (editingEmployee.street) formData.append("street", editingEmployee.street);
                if (editingEmployee.availabilityToJoin) formData.append("availabilityToJoin", editingEmployee.availabilityToJoin);
                if (editingEmployee.interviewAvailability) formData.append("interviewAvailability", editingEmployee.interviewAvailability);
                if (editingEmployee.highestQualification) formData.append("highestQualification", editingEmployee.highestQualification);
                if (editingEmployee.universityName) formData.append("universityName", editingEmployee.universityName);
                if (editingEmployee.dateOfQualification) formData.append("dateOfQualification", editingEmployee.dateOfQualification);
                if (editingEmployee.usaDegree) formData.append("usaDegree", editingEmployee.usaDegree);
                if (editingEmployee.currentJobTitle) formData.append("currentJobTitle", editingEmployee.currentJobTitle);
                if (editingEmployee.mostRecentEmployer) formData.append("mostRecentEmployer", editingEmployee.mostRecentEmployer);
                if (editingEmployee.totalExperience) formData.append("totalExperience", Number(editingEmployee.totalExperience));
                if (editingEmployee.relocate) formData.append("relocate", editingEmployee.relocate);
                if (editingEmployee.currency) formData.append("currency", editingEmployee.currency);
                if (editingEmployee.frequency) formData.append("frequency", editingEmployee.frequency);
                if (editingEmployee.sourcingRate) formData.append("sourcingRate", Number(editingEmployee.sourcingRate));
                if (editingEmployee.resumeSummary) formData.append("resumeSummary", editingEmployee.resumeSummary);
                if (editingEmployee.suggestedKeywords) formData.append("suggestedKeywords", editingEmployee.suggestedKeywords);
                // Always send both arrays so external update retains skills even when one side is empty
                formData.append("primarySkills", JSON.stringify(Array.isArray(editingEmployee.primarySkills) ? editingEmployee.primarySkills : []));
                formData.append("secondarySkills", JSON.stringify(Array.isArray(editingEmployee.secondarySkills) ? editingEmployee.secondarySkills : []));
                if (Array.isArray(editingEmployee.socialLinks) && editingEmployee.socialLinks.length > 0)
                    formData.append("socialLinks", JSON.stringify(editingEmployee.socialLinks));

                if (editResumeFile) {

                    formData.append("resume", editResumeFile);
                    formData.append("storageType", "local"); // or "Database" as per your backend
                }

                const response = await EmployeeService.updateEmployee(formData);

                if (response?.data?.success) {
                    toast.success("Internal employee updated successfully!");
                    Swal.close();
                    setIsEditModalOpen(false);
                    loadInternalResources();
                } else {
                    Swal.close();
                    // Extract the error message from the backend response
                    const errorMessage = response?.data?.errors?.[0] || "Update failed";
                    throw new Error(errorMessage);
                }
            }

            else {
                // === EXTERNAL CANDIDATE UPDATE ===
                const formData = new FormData();
                formData.append("candidateId", editingEmployee.employeeId);
                formData.append("companyId", editingEmployee.companyId || 1);
                formData.append("firstName", editingEmployee.firstName?.trim() || "");
                formData.append("lastName", editingEmployee.lastName?.trim() || "");
                formData.append("email", editingEmployee.email || "");
                formData.append("phoneNumber", editingEmployee.phoneNumber || "");
                formData.append("experienceYears", Number(editingEmployee.experienceYears) || 0);
                formData.append("location", editingEmployee.location || "");
                formData.append("joiningDate", editingEmployee.joiningDate || new Date().toISOString().split('T')[0]);
                formData.append("status", mapStatusToCandidate(editingEmployee.status)); // isBillable / engaged / notAvailable

                editSelectedSkills.forEach(skill => {
                    if (skill.skillId > 0) formData.append("skillIds", skill.skillId);
                });
                const mergedSkillNames = [
                    ...(Array.isArray(editingEmployee.primarySkills) ? editingEmployee.primarySkills : []),
                    ...(Array.isArray(editingEmployee.secondarySkills) ? editingEmployee.secondarySkills : []),
                ].map(s => (s || "").trim()).filter(Boolean);
                mergedSkillNames.forEach((name) => formData.append("skillNames", name));

                formData.append("gender", editingEmployee.gender || "");
                formData.append("personalEmailId", editingEmployee.personalEmailId || "");
                formData.append("degrees", editingEmployee.degrees || "");
                formData.append("specialization", editingEmployee.specialization || "");
                formData.append("yearOfPassing", editingEmployee.yearOfPassing || "");
                formData.append("profileSummary", editingEmployee.profileSummary || "");
                formData.append("trainingSummary", editingEmployee.trainingSummary || "");
                formData.append("certificationSummary", editingEmployee.certificationSummary || "");
                formData.append("vendorName", editingEmployee.vendorName || "");
                formData.append("vendorContact", editingEmployee.vendorContact || "");
                formData.append("currentCompany", editingEmployee.currentCompany || "");
                formData.append("currentCtc", editingEmployee.currentCtc ? Number(editingEmployee.currentCtc) : 0);
                formData.append("expectedCtc", editingEmployee.expectedCtc ? Number(editingEmployee.expectedCtc) : 0);
                formData.append("noticePeriod", editingEmployee.noticePeriod || "");
                formData.append("preferredLocation", editingEmployee.preferredLocation || "");
                formData.append("comments", editingEmployee.comments || "");
                if (editingEmployee.role) formData.append("currentJobTitle", editingEmployee.role);

                if (editResumeFile) {
                    formData.append("resume", editResumeFile);
                    formData.append("storageType", "local");
                }

                const response = await CandidateService.updateCandidate(formData);
                if (response?.data?.success) {
                    toast.success("External candidate updated successfully!");
                    Swal.close();
                    setIsEditModalOpen(false);
                    loadExternalResources();
                } else {
                    Swal.close();
                    // Extract the error message from the backend response
                    const errorMessage = response?.data?.errors?.[0] || "Update failed";
                    throw new Error(errorMessage);

                }
            }
        } catch (error) {
            console.error("Update error:", error.response || error);
            Swal.close();
            const errorMessage = error.message ||
                error.response?.data?.errors?.[0] ||
                error.response?.data?.message ||
                "Failed to update resource";

            toast.error(errorMessage);
        }
    };

    const addCustomSkillForEdit = async (skillName) => {
        if (!skillName) {
            toast.error("Please enter a valid skill name.");
            return;
        }

        const lower = skillName.toLowerCase();
        const existingSkill = skills.find(s => s.skillName?.toLowerCase() === lower);

        if (existingSkill && existingSkill.skillId > 0) {
            if (!editSelectedSkills.some(s => s.skillId === existingSkill.skillId)) {
                setEditSelectedSkills([...editSelectedSkills, existingSkill]);
                setEditSkillInput("");
                toast.success("Skill added!");
            } else {
                toast.info("Skill already selected.");
                setEditSkillInput("");
            }
            return;
        }

        try {
            const response = await EmployeeService.createSkill(1, skillName);
            if (response.data.success && response.data.result) {
                const newSkill = response.data.result;
                setSkills(prev => {
                    const filtered = prev.filter(s => s.skillName.toLowerCase() !== lower);
                    return [...filtered, newSkill].sort((a, b) => a.skillName.localeCompare(b.skillName));
                });
                setFilteredSkills(prev => {
                    const filtered = prev.filter(name => name.toLowerCase() !== lower);
                    return [...filtered, newSkill.skillName].sort();
                });
                setEditSelectedSkills(prev => {
                    if (!prev.some(s => s.skillId === newSkill.skillId)) {
                        return [...prev, newSkill];
                    }
                    return prev;
                });
                setEditSkillInput("");
                toast.success("Skill added successfully!");
            } else {
                toast.error(`Failed to add skill: ${response.data.message || "Unknown error"}`);
            }
        } catch (error) {
            console.error("Error adding skill:", error);
            toast.error("Failed to add skill. Please try again.");
        }
    };

    // Reset page when switching tabs
    useEffect(() => {
        setCurrentPageNum(1);
        setExpandedRows(new Set());
    }, [activeTab]);

    useEffect(() => {
        if (activeTab === "external") {
            loadExternalResources();
        }
    }, [activeTab]);

    return (
        <div className={isAddModalOpen ? "" : "px-6 pb-6 pt-2 space-y-6"}>
            {!isAddModalOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="mb-5 space-y-2"
                    >
                        <h1 className="text-3xl font-bold text-white text-center leading-tight">Resource Management</h1>
                        <div className="flex flex-wrap lg:flex-nowrap justify-between items-center gap-2">
                            <div className="flex bg-gradient-to-r from-purple-50/50 to-blue-50/50 p-1.5 rounded-xl gap-1.5 shadow-sm">
                                <button
                                    className={`py-2 px-4 font-semibold text-base flex items-center gap-2 transition-all duration-200 rounded-lg min-w-[170px] justify-center ${activeTab === "internal"
                                        ? 'text-white bg-gradient-to-r from-purple-500 to-purple-600 shadow-lg'
                                        : 'text-gray-700 bg-white/90 hover:bg-white hover:text-purple-600 hover:shadow-md'
                                        }`}
                                    onClick={() => setActiveTab("internal")}
                                >
                                    <Users className="w-5 h-5" />
                                    Internal Resources
                                    <Badge variant="secondary" className={`ml-2 text-sm ${activeTab === "internal"
                                        ? 'bg-white text-purple-600 font-bold'
                                        : 'bg-purple-100 text-purple-700'
                                        }`}>
                                        {internalResources.length}
                                    </Badge>
                                </button>
                                <button
                                    className={`py-2 px-4 font-semibold text-base flex items-center gap-2 transition-all duration-200 rounded-lg min-w-[170px] justify-center ${activeTab === "external"
                                        ? 'text-white bg-gradient-to-r from-blue-500 to-blue-600 shadow-lg'
                                        : 'text-gray-700 bg-white/90 hover:bg-white hover:text-blue-600 hover:shadow-md'
                                        }`}
                                    onClick={() => setActiveTab("external")}
                                >
                                    <ExternalLink className="w-5 h-5" />
                                    External Resources
                                    <Badge variant="secondary" className={`ml-2 text-sm ${activeTab === "external"
                                        ? 'bg-white text-blue-600 font-bold'
                                        : 'bg-blue-100 text-blue-700'
                                        }`}>
                                        {externalResources.length}
                                    </Badge>
                                </button>
                            </div>
                            <div className="flex flex-wrap justify-end gap-2">
                                <Button
                                    onClick={() => navigate('/hr/resources/add?type=' + activeTab)}
                                    className="h-10 px-4 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 shadow-lg"
                                >
                                    <Plus className="w-4 h-4 mr-2" />
                                    Add {activeTab === "internal" ? "Internal Resource" : "External Resource"}
                                </Button>
                                <Button
                                    onClick={() => navigate('/hr/projects')}
                                    className="h-10 px-4 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 shadow-lg"
                                >
                                    <Search className="w-4 h-4 mr-2" />
                                    View Projects
                                </Button>
                                {/* {activeTab === "internal" && ( */}
                                <Button
                                    onClick={handleImport}
                                    className="h-10 px-4 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 shadow-lg"
                                >
                                    <Download className="w-4 h-4 mr-2" />
                                    Import
                                </Button>
                                {/* )} */}
                            </div>
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.1 }}
                        className="space-y-4 mb-6"
                    >
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <Input
                                placeholder={`Search ${activeTab} resources by name, role, skills, or client...`}
                                value={getCurrentSearchTerm()}
                                onChange={(e) => activeTab === "internal" ? setInternalSearchTerm(e.target.value) : setExternalSearchTerm(e.target.value)}
                                className="pl-10 bg-white/80 backdrop-blur-sm border-purple-200 focus:border-purple-400 transition-all duration-300"
                            />
                        </div>
                        <div className="flex flex-wrap gap-3 items-center">
                            <div className="flex items-center gap-2">
                                <span className="text-sm font-medium text-gray-700">Status:</span>
                                <Button
                                    variant={getCurrentStatusFilter() === "All" ? "default" : "outline"}
                                    onClick={() => activeTab === "internal" ? setInternalStatusFilter("All") : setExternalStatusFilter("All")}
                                    size="sm"
                                    className={getCurrentStatusFilter() === "All" ? "bg-purple-500 hover:bg-purple-600" : "hover:bg-purple-50"}
                                >
                                    All
                                </Button>
                                {activeTab === "internal" ? (
                                    <>
                                        <Button
                                            variant={getCurrentStatusFilter() === "Billable" ? "default" : "outline"}
                                            onClick={() => setInternalStatusFilter("Billable")}
                                            size="sm"
                                            className={getCurrentStatusFilter() === "Billable" ? "bg-blue-500 hover:bg-blue-600" : "hover:bg-blue-50"}
                                        >
                                            Billable
                                        </Button>
                                        <Button
                                            variant={getCurrentStatusFilter() === "Bench" ? "default" : "outline"}
                                            onClick={() => setInternalStatusFilter("Bench")}
                                            size="sm"
                                            className={getCurrentStatusFilter() === "Bench" ? "bg-red-500 hover:bg-red-600" : "hover:bg-red-50"}
                                        >
                                            Bench
                                        </Button>
                                        <Button
                                            variant={getCurrentStatusFilter() === "Bench Shadow" ? "default" : "outline"}
                                            onClick={() => setInternalStatusFilter("Bench Shadow")}
                                            size="sm"
                                            className={getCurrentStatusFilter() === "Bench Shadow" ? "bg-yellow-500 hover:bg-yellow-600" : "hover:bg-yellow-50"}
                                        >
                                            Bench Shadow
                                        </Button>
                                        <Button
                                            variant={getCurrentStatusFilter() === "Internal" ? "default" : "outline"}
                                            onClick={() => setInternalStatusFilter("Internal")}
                                            size="sm"
                                            className={getCurrentStatusFilter() === "Internal" ? "bg-green-500 hover:bg-green-600" : "hover:bg-green-50"}
                                        >
                                            Internal
                                        </Button>
                                    </>
                                ) : (
                                    <>
                                        <Button
                                            variant={getCurrentStatusFilter() === "Allocated" ? "default" : "outline"}
                                            onClick={() => setExternalStatusFilter("Allocated")}
                                            size="sm"
                                            className={getCurrentStatusFilter() === "Allocated" ? "bg-green-500 hover:bg-green-600" : "hover:bg-green-50"}
                                        >
                                            Allocated
                                        </Button>
                                        {/* <Button
                                    variant={getCurrentStatusFilter() === "Engaged" ? "default" : "outline"}
                                    onClick={() => setExternalStatusFilter("Engaged")}
                                    size="sm"
                                    className={getCurrentStatusFilter() === "Engaged" ? "bg-blue-500 hover:bg-blue-600" : "hover:bg-blue-50"}
                                >
                                    Engaged
                                </Button> */}
                                        <Button
                                            variant={getCurrentStatusFilter() === "Not Allocated" ? "default" : "outline"}
                                            onClick={() => setExternalStatusFilter("Not Allocated")}
                                            size="sm"
                                            className={getCurrentStatusFilter() === "Not Allocated" ? "bg-red-500 hover:bg-red-600" : "hover:bg-red-50"}
                                        >
                                            Not Allocated
                                        </Button>
                                    </>
                                )}
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-sm font-medium text-black-700">Role:</span>
                                <Select
                                    value={getCurrentRoleFilter()}
                                    onValueChange={(value) => activeTab === "internal" ? setInternalRoleFilter(value) : setExternalRoleFilter(value)}
                                >
                                    <SelectTrigger className="w-48 bg-white/80 backdrop-blur-sm">
                                        <SelectValue placeholder="Filter by role" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="All">All Roles</SelectItem>
                                        {(activeTab === "internal" ? uniqueInternalRoles : uniqueExternalRoles).map((role) => (
                                            <SelectItem key={role} value={role}>
                                                {role}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="ml-auto flex items-center gap-4">
                                <div className="flex items-center gap-2">
                                    <span className="text-sm font-medium text-white-700">Rows per page:</span>
                                    <Select
                                        value={itemsPerPage.toString()}
                                        onValueChange={(value) => {
                                            setItemsPerPage(Number(value));
                                            setCurrentPageNum(1);
                                        }}
                                    >
                                        <SelectTrigger className="w-20 h-8 bg-white/80 backdrop-blur-sm text-sm">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="5">5</SelectItem>
                                            <SelectItem value="10">10</SelectItem>
                                            <SelectItem value="15">15</SelectItem>
                                            <SelectItem value="20">20</SelectItem>
                                            <SelectItem value="25">25</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    {/* Resource Table */}
                    <ResourceTable
                        resources={getCurrentResources()}
                        filteredResources={getCurrentFilteredResources()}
                        searchTerm={getCurrentSearchTerm()}
                        statusFilter={getCurrentStatusFilter()}
                        roleFilter={getCurrentRoleFilter()}
                        sortField={sortField}
                        sortOrder={sortOrder}
                        currentPageNum={currentPageNum}
                        itemsPerPage={itemsPerPage}
                        expandedRows={expandedRows}
                        onSearchChange={activeTab === "internal" ? setInternalSearchTerm : setExternalSearchTerm}
                        onStatusFilterChange={activeTab === "internal" ? setInternalStatusFilter : setExternalStatusFilter}
                        onRoleFilterChange={activeTab === "internal" ? setInternalRoleFilter : setExternalRoleFilter}
                        onSort={handleSort}
                        onPageChange={goToPage}
                        onItemsPerPageChange={setItemsPerPage}
                        onRowToggle={toggleRow}
                        onScheduleInterview={handleScheduleInterview}
                        onScheduleInterviewFromAudit={handleScheduleInterviewFromAudit}
                        onEditInterviewFromRow={handleEditInterviewFromRow}
                        allInterviewsRaw={allInterviewsRaw}
                        onViewResume={handleViewResume}
                        onSkillMatcher={handleSkillMatcher}
                        onResumeShare={handleResumeShare}
                        onResumeReject={handleResumeReject}
                        onResumePending={handleResumePending}
                        onEditResource={handleEditResource}
                        isResumeToggleLocked={isResumeToggleLocked}
                        getSortIcon={getSortIcon}
                        getStatusColor={getStatusColor}
                        formatDate={formatDate}
                        uniqueRoles={activeTab === "internal" ? uniqueInternalRoles : uniqueExternalRoles}
                        resourceType={activeTab}
                    />
                </>
            )}

            {/* Resume Upload Step */}
            {isResumeUploadStepOpen && (
                <ResumeUploadStep
                    resourceType={activeTab}
                    onParsed={handleResumeParsed}
                    onSkip={handleSkipResume}
                    onClose={() => setIsResumeUploadStepOpen(false)}
                />
            )}

            {/* Add Resource Modal — tabbed */}
            {isAddModalOpen && (
                <AddResourceModal
                    open={isAddModalOpen}
                    onClose={() => {
                        setIsAddModalOpen(false);
                        if (activeTab === 'internal') {
                            setNewEmployee({ ...EMPTY_INTERNAL });
                        } else {
                            setNewExternalResource({ ...EMPTY_EXTERNAL });
                        }
                        setSelectedSkills([]);
                        setSkillInput('');
                        setSocialLinks([]);
                        setResourceDocuments([]);
                        setResumeFile(null);
                        setAutoFilledFields({});
                    }}
                    resourceType={activeTab}
                    formData={activeTab === 'internal' ? newEmployee : newExternalResource}
                    setFormData={activeTab === 'internal' ? setNewEmployee : setNewExternalResource}
                    autoFilledFields={autoFilledFields}
                    companies={companies}
                    departments={departments}
                    resumeFile={resumeFile}
                    socialLinks={socialLinks}
                    setSocialLinks={setSocialLinks}
                    resourceDocuments={resourceDocuments}
                    setResourceDocuments={setResourceDocuments}
                    onSubmit={activeTab === 'internal' ? handleAddResource : handleAddExternalResource}
                />
            )}

            {/* Import Dialog (only for internal resources) */}

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

            {/* Edit Resource Dialog */}
            <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
                <DialogContent className="max-w-3xl max-h-[90vh] overflow-auto">
                    <ErrorBoundary>
                        <DialogHeader>
                            <DialogTitle>
                                {activeTab === "internal" ? "Edit Internal Resource" : "Edit External Resource"}
                            </DialogTitle>
                        </DialogHeader>
                        {editingEmployee && (
                            <div className="space-y-6">
                                {activeTab === "internal" ? (
                                    // Internal Resource Edit Form
                                    <>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="edit-employeeId">Employee ID</Label>
                                                <Input
                                                    id="edit-employeeId"
                                                    value={editingEmployee.employeeId}
                                                    disabled
                                                    className="bg-gray-100"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="edit-company">Company *</Label>
                                                <Select
                                                    value={editingEmployee.companyId ? editingEmployee.companyId.toString() : ""}
                                                    onValueChange={(value) => setEditingEmployee((prev) => ({ ...prev, companyId: Number(value) }))}
                                                    disabled
                                                >
                                                    <SelectTrigger className="bg-gray-100">
                                                        <SelectValue placeholder="Select company" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {companies.map((company) => (
                                                            <SelectItem key={company.companyId} value={company.companyId.toString()}>
                                                                {`${company.companyId} - ${company.companyName}`}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="edit-firstName">First Name *</Label>
                                                <Input
                                                    id="edit-firstName"
                                                    value={editingEmployee.firstName}
                                                    onChange={(e) => setEditingEmployee((prev) => ({ ...prev, firstName: e.target.value }))}
                                                    placeholder="Enter first name"
                                                    disabled
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="edit-lastName">Last Name</Label>
                                                <Input
                                                    id="edit-lastName"
                                                    value={editingEmployee.lastName}
                                                    onChange={(e) => setEditingEmployee((prev) => ({ ...prev, lastName: e.target.value }))}
                                                    placeholder="Enter last name"
                                                    disabled
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Gender</Label>
                                                <RadioGroup
                                                    value={editingEmployee.gender}
                                                    onValueChange={(value) => setEditingEmployee((prev) => ({ ...prev, gender: value }))}
                                                    className="flex space-x-4"
                                                >
                                                    <div className="flex items-center space-x-2">
                                                        <RadioGroupItem value="Male" id="edit-male" className="relative flex items-center justify-center w-5 h-5 border-2 border-gray-300 rounded-full data-[state=checked]:border-blue-600 data-[state=checked]:bg-blue-50 transition-all" />
                                                        <Label htmlFor="edit-male">Male</Label>
                                                    </div>
                                                    <div className="flex items-center space-x-2">
                                                        <RadioGroupItem value="Female" id="edit-female" className="relative flex items-center justify-center w-5 h-5 border-2 border-gray-300 rounded-full data-[state=checked]:border-blue-600 data-[state=checked]:bg-blue-50 transition-all" />
                                                        <Label htmlFor="edit-female">Female</Label>
                                                    </div>
                                                </RadioGroup>
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="edit-email">Email *</Label>
                                                <Input
                                                    id="edit-email"
                                                    type="email"
                                                    value={editingEmployee.email}
                                                    onChange={(e) => setEditingEmployee((prev) => ({ ...prev, email: e.target.value }))}
                                                    placeholder="Enter email address"
                                                    disabled
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="edit-departmentId">Role *</Label>
                                                <Select
                                                    value={editingEmployee.departmentId ? editingEmployee.departmentId.toString() : ""}
                                                    onValueChange={(value) => setEditingEmployee((prev) => ({
                                                        ...prev,
                                                        departmentId: Number(value),
                                                    }))}
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select role" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {departments.map((dept) => (
                                                            <SelectItem key={dept.departmentId} value={dept.departmentId.toString()}>
                                                                {dept.departmentName}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="edit-phoneNumber">Phone</Label>
                                                <Input
                                                    id="edit-phoneNumber"
                                                    value={editingEmployee.phoneNumber}
                                                    onChange={(e) => setEditingEmployee((prev) => ({ ...prev, phoneNumber: e.target.value }))}
                                                    placeholder="Enter phone number"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="edit-experienceYears">Experience (years)</Label>
                                                <Input
                                                    id="edit-experienceYears"
                                                    type="number"
                                                    value={editingEmployee.experienceYears}
                                                    onChange={(e) => setEditingEmployee((prev) => ({ ...prev, experienceYears: e.target.value }))}
                                                    placeholder="no.of years (e.g., 3.5)"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="edit-location">Location</Label>
                                                <Input
                                                    id="edit-location"
                                                    value={editingEmployee.location}
                                                    onChange={(e) => setEditingEmployee((prev) => ({ ...prev, location: e.target.value }))}
                                                    placeholder="City, State"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="edit-joiningDate">Joining Date</Label>
                                                <Input
                                                    id="edit-joiningDate"
                                                    type="date"
                                                    value={editingEmployee.joiningDate}
                                                    onChange={(e) => setEditingEmployee((prev) => ({ ...prev, joiningDate: e.target.value }))}
                                                    disabled
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="edit-personalEmailId">Personal Email ID</Label>
                                                <Input
                                                    id="edit-personalEmailId"
                                                    type="email"
                                                    value={editingEmployee.personalEmailId}
                                                    onChange={(e) => setEditingEmployee((prev) => ({ ...prev, personalEmailId: e.target.value }))}
                                                    placeholder="Enter personal email"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="edit-status">Status</Label>
                                                <Select
                                                    value={editingEmployee.status}
                                                    onValueChange={(value) => setEditingEmployee((prev) => ({ ...prev, status: value }))}
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="Billable">Billable</SelectItem>
                                                        <SelectItem value="Bench">Bench</SelectItem>
                                                        <SelectItem value="Bench Shadow">Bench Shadow</SelectItem>
                                                        <SelectItem value="Internal">Internal</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>
                                        {editingEmployee.status === "Billable" && (
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <Label htmlFor="edit-currentProject">Current Project</Label>
                                                    <Select
                                                        value={editingEmployee.currentProjectId ? editingEmployee.currentProjectId.toString() : ""}
                                                        onValueChange={(value) => {
                                                            const selectedProject = projects.find(
                                                                (project) => project.projectId.toString() === value
                                                            );
                                                            setEditingEmployee((prev) => ({
                                                                ...prev,
                                                                currentProjectId: Number(value),
                                                                currentAccountId: selectedProject?.accountId || null,
                                                                currentProject: selectedProject?.projectName || "",
                                                                client: selectedProject?.accountName || ""
                                                            }));
                                                        }}
                                                    >
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Select project" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {projects.map((project) => (
                                                                <SelectItem
                                                                    key={project.projectId}
                                                                    value={project.projectId.toString()}
                                                                >
                                                                    {project.projectName}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                                <div className="space-y-2">
                                                    <Label htmlFor="edit-client">Client</Label>
                                                    <Input
                                                        id="edit-client"
                                                        value={editingEmployee.client}
                                                        readOnly
                                                        placeholder="Client name (auto-filled)"
                                                    />
                                                </div>
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    // External Resource Edit Form
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="edit-ext-employeeId">Resource ID</Label>
                                            <Input
                                                id="edit-ext-employeeId"
                                                value={editingEmployee.employeeId}
                                                disabled
                                                className="bg-gray-100"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="edit-ext-firstName">First Name *</Label>
                                            <Input
                                                id="edit-ext-firstName"
                                                value={editingEmployee.firstName}
                                                onChange={(e) => setEditingEmployee((prev) => ({ ...prev, firstName: e.target.value }))}
                                                placeholder="Enter first name"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="edit-ext-lastName">Last Name</Label>
                                            <Input
                                                id="edit-ext-lastName"
                                                value={editingEmployee.lastName}
                                                onChange={(e) => setEditingEmployee((prev) => ({ ...prev, lastName: e.target.value }))}
                                                placeholder="Enter last name"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Gender</Label>
                                            <RadioGroup
                                                value={editingEmployee.gender}
                                                onValueChange={(value) => setEditingEmployee((prev) => ({ ...prev, gender: value }))}
                                                className="flex space-x-4"
                                            >
                                                <div className="flex items-center space-x-2">
                                                    <RadioGroupItem value="Male" id="edit-ext-male" className="relative flex items-center justify-center w-5 h-5 border-2 border-gray-300 rounded-full data-[state=checked]:border-blue-600 data-[state=checked]:bg-blue-50 transition-all" />
                                                    <Label htmlFor="edit-ext-male">Male</Label>
                                                </div>
                                                <div className="flex items-center space-x-2">
                                                    <RadioGroupItem value="Female" id="edit-ext-female" className="relative flex items-center justify-center w-5 h-5 border-2 border-gray-300 rounded-full data-[state=checked]:border-blue-600 data-[state=checked]:bg-blue-50 transition-all" />
                                                    <Label htmlFor="edit-ext-female">Female</Label>
                                                </div>
                                            </RadioGroup>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="edit-ext-email">Email *</Label>
                                            <Input
                                                id="edit-ext-email"
                                                type="email"
                                                value={editingEmployee.email}
                                                onChange={(e) => setEditingEmployee((prev) => ({ ...prev, email: e.target.value }))}
                                                placeholder="Enter email address"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="edit-ext-role">Role *</Label>
                                            <Input
                                                id="edit-ext-role"
                                                value={editingEmployee.role}
                                                onChange={(e) => setEditingEmployee((prev) => ({ ...prev, role: e.target.value }))}
                                                placeholder="Enter role"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="edit-ext-phoneNumber">Phone</Label>
                                            <Input
                                                id="edit-ext-phoneNumber"
                                                value={editingEmployee.phoneNumber}
                                                onChange={(e) => setEditingEmployee((prev) => ({ ...prev, phoneNumber: e.target.value }))}
                                                placeholder="Enter phone number"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="edit-ext-experienceYears">Experience (years)</Label>
                                            <Input
                                                id="edit-ext-experienceYears"
                                                type="number"
                                                value={editingEmployee.experienceYears}
                                                onChange={(e) => setEditingEmployee((prev) => ({ ...prev, experienceYears: e.target.value }))}
                                                placeholder="no.of years (e.g., 3.5)"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="edit-ext-location">Location</Label>
                                            <Input
                                                id="edit-ext-location"
                                                value={editingEmployee.location}
                                                onChange={(e) => setEditingEmployee((prev) => ({ ...prev, location: e.target.value }))}
                                                placeholder="City, State"
                                            />
                                        </div>
                                        {/* <div className="space-y-2">
                                            <Label htmlFor="edit-ext-personalEmailId">Personal Email ID</Label>
                                            <Input
                                                id="edit-ext-personalEmailId"
                                                type="email"
                                                value={editingEmployee.personalEmailId}
                                                onChange={(e) => setEditingEmployee((prev) => ({ ...prev, personalEmailId: e.target.value }))}
                                                placeholder="Enter personal email"
                                            />
                                        </div> */}
                                        <div className="space-y-2">
                                            <Label htmlFor="edit-ext-status">Status</Label>
                                            <Select
                                                value={editingEmployee.status}
                                                onValueChange={(value) => setEditingEmployee((prev) => ({ ...prev, status: value }))}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="Allocated">Allocated</SelectItem>
                                                    {/* <SelectItem value="Engaged">Engaged</SelectItem> */}
                                                    <SelectItem value="Not Allocated">Not Allocated</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        {/* <div className="space-y-2">
                                            <Label htmlFor="edit-ext-vendorName">Vendor Name</Label>
                                            <Input
                                                id="edit-ext-vendorName"
                                                value={editingEmployee.vendorName || ""}
                                                onChange={(e) => setEditingEmployee((prev) => ({ ...prev, vendorName: e.target.value }))}
                                                placeholder="Enter vendor name"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="edit-ext-vendorContact">Vendor Contact</Label>
                                            <Input
                                                id="edit-ext-vendorContact"
                                                value={editingEmployee.vendorContact || ""}
                                                onChange={(e) => setEditingEmployee((prev) => ({ ...prev, vendorContact: e.target.value }))}
                                                placeholder="Enter vendor contact"
                                            />
                                        </div> */}
                                    </div>

                                )}

                                {/* <div className="space-y-2">
                                    <Label htmlFor="edit-employmentType">Employment Type</Label>
                                    <Select
                                        value={editingEmployee.employmentType}
                                        onValueChange={(value) => setEditingEmployee((prev) => ({ ...prev, employmentType: value }))}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {activeTab === "internal" ? (
                                                <>
                                                    <SelectItem value="Regular">Regular</SelectItem>
                                                    <SelectItem value="Part-time">Part-time</SelectItem>
                                                    <SelectItem value="Contract">Contract</SelectItem>
                                                    <SelectItem value="Intern">Intern</SelectItem>
                                                </>
                                            ) : (
                                                <>
                                                    <SelectItem value="Contract">Contract</SelectItem>
                                                    <SelectItem value="Part-time">Part-time</SelectItem>
                                                    <SelectItem value="Freelance">Freelance</SelectItem>
                                                    <SelectItem value="Consultant">Consultant</SelectItem>
                                                </>
                                            )}
                                        </SelectContent>
                                    </Select>
                                </div> */}

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="space-y-2">
                                        <Label>Degree</Label>
                                        <Select
                                            value={editingEmployee.degrees}
                                            onValueChange={v => v !== "Others" && setEditingEmployee(p => ({ ...p, degrees: v }))}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select degree" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {["B.E", "M.E", "B.Sc", "M.Sc"].map(d => (
                                                    <SelectItem key={d} value={d}>{d}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        {editingEmployee.degrees === "Others" && (
                                            <Input
                                                value={editingEmployee.degrees}
                                                onChange={e => setEditingEmployee(p => ({ ...p, degrees: e.target.value }))}
                                                placeholder="Type your degree"
                                            />
                                        )}
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="edit-specialization">Specialization</Label>
                                        <Input
                                            id="edit-specialization"
                                            value={editingEmployee.specialization}
                                            onChange={(e) => setEditingEmployee((prev) => ({ ...prev, specialization: e.target.value }))}
                                            placeholder="Enter specialization"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="edit-yearOfPassing">Year of Passing</Label>
                                        <Input
                                            id="edit-yearOfPassing"
                                            type="number"
                                            value={editingEmployee.yearOfPassing}
                                            onChange={(e) => setEditingEmployee((prev) => ({ ...prev, yearOfPassing: e.target.value }))}
                                            placeholder="Enter year (e.g., 2020)"
                                            min="1900"
                                            max={new Date().getFullYear()}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="edit-profileSummary">Profile Summary</Label>
                                    <Textarea
                                        id="edit-profileSummary"
                                        value={editingEmployee.profileSummary}
                                        onChange={(e) => setEditingEmployee((prev) => ({ ...prev, profileSummary: e.target.value }))}
                                        placeholder="Enter profile summary"

                                    />
                                    {/* <div className="text-right text-sm text-gray-500 mt-1">
                                        {countWords(editingEmployee.profileSummary)} / 300 words
                                    </div> */}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="edit-trainingSummary">Training Summary</Label>
                                    <Textarea
                                        id="edit-trainingSummary"
                                        value={editingEmployee.trainingSummary}
                                        onChange={(e) => setEditingEmployee((prev) => ({ ...prev, trainingSummary: e.target.value }))}
                                        placeholder="Enter training summary"

                                    />
                                    {/* <div className="text-right text-sm text-gray-500 mt-1">
                                        {countWords(editingEmployee.trainingSummary)} / 300 words
                                    </div> */}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="edit-certificationSummary">Certification Summary</Label>
                                    <Textarea
                                        id="edit-certificationSummary"
                                        value={editingEmployee.certificationSummary}
                                        onChange={(e) => setEditingEmployee((prev) => ({ ...prev, certificationSummary: e.target.value }))}
                                        placeholder="Enter certification summary"

                                    />
                                </div>
                                {/* Add these new fields in the external resource edit form */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="edit-ext-currentCompany">Current Company</Label>
                                        <Input
                                            id="edit-ext-currentCompany"
                                            value={editingEmployee.currentCompany || ""}
                                            onChange={(e) => setEditingEmployee((prev) => ({ ...prev, currentCompany: e.target.value }))}
                                            placeholder="Enter current company name"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="edit-ext-preferredLocation">Preferred Location</Label>
                                        <Input
                                            id="edit-ext-preferredLocation"
                                            value={editingEmployee.preferredLocation || ""}
                                            onChange={(e) => setEditingEmployee((prev) => ({ ...prev, preferredLocation: e.target.value }))}
                                            placeholder="Enter preferred work location"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="edit-ext-currentCtc">Current CTC (₹)</Label>
                                        <Input
                                            id="edit-ext-currentCtc"
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            value={editingEmployee.currentCtc || ""}
                                            onChange={(e) => setEditingEmployee((prev) => ({ ...prev, currentCtc: e.target.value }))}
                                            placeholder="e.g., 500000"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="edit-ext-expectedCtc">Expected CTC (₹)</Label>
                                        <Input
                                            id="edit-ext-expectedCtc"
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            value={editingEmployee.expectedCtc || ""}
                                            onChange={(e) => setEditingEmployee((prev) => ({ ...prev, expectedCtc: e.target.value }))}
                                            placeholder="e.g., 700000"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="edit-ext-noticePeriod">Notice Period</Label>
                                        <Select
                                            value={editingEmployee.noticePeriod || ""}
                                            onValueChange={(value) => setEditingEmployee((prev) => ({ ...prev, noticePeriod: value }))}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select notice period" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="Immediate">Immediate</SelectItem>
                                                <SelectItem value="15 days">15 days</SelectItem>
                                                <SelectItem value="30 days">30 days</SelectItem>
                                                <SelectItem value="45 days">45 days</SelectItem>
                                                <SelectItem value="60 days">60 days</SelectItem>
                                                <SelectItem value="90 days">90 days</SelectItem>
                                                <SelectItem value="3 months">3 months</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        {editingEmployee.noticePeriod === "Others" && (
                                            <Input
                                                value={editingEmployee.noticePeriod}
                                                onChange={(e) => setEditingEmployee((prev) => ({ ...prev, noticePeriod: e.target.value }))}
                                                placeholder="Specify custom notice period"
                                                className="mt-2"
                                            />
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="edit-ext-comments">Comments</Label>
                                    <Textarea
                                        id="edit-ext-comments"
                                        value={editingEmployee.comments || ""}
                                        onChange={(e) => setEditingEmployee((prev) => ({ ...prev, comments: e.target.value }))}
                                        placeholder="Enter any additional comments"
                                        rows={3}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="edit-resume">Update Resume</Label>
                                    <span className="text-sm text-gray-500">Only .pdf files are supported (max 5MB)</span>
                                    <Input
                                        id="edit-resume"
                                        type="file"
                                        accept=".pdf" // Only show PDF files in file picker
                                        onChange={(e) => {
                                            const file = e.target.files[0];
                                            const validation = validateResumeFile(file);

                                            if (!validation.isValid) {
                                                toast.error(validation.error);
                                                e.target.value = ''; // Clear the file input
                                                setEditResumeFile(null);
                                                return;
                                            }

                                            setEditResumeFile(file);
                                            toast.success("PDF file selected successfully!");
                                        }}
                                        className={!editResumeFile ? 'border-gray-300' : 'border-green-500'}
                                    />
                                    {editResumeFile ? (
                                        <div className="flex items-center gap-2 text-sm text-green-600">
                                            <FileText className="w-4 h-4" />
                                            <span>{editResumeFile.name} ({(editResumeFile.size / 1024 / 1024).toFixed(2)} MB)</span>
                                            <Badge variant="outline" className="ml-auto">New PDF</Badge>
                                        </div>
                                    ) : (
                                        <p className="text-sm text-gray-500"></p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label>Skills</Label>
                                    <div className="flex flex-wrap gap-2 mb-2">
                                        {filteredSkills.length > 0 ? (
                                            filteredSkills.map(skill => (
                                                <Button
                                                    type="button"
                                                    key={skill}
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => {
                                                        setEditSkillInput(skill);
                                                        const skillObj = skills.find(s => s.skillName === skill);
                                                        if (skillObj && !editSelectedSkills.some(s => s.skillId === skillObj.skillId)) {
                                                            setEditSelectedSkills([...editSelectedSkills, skillObj]);
                                                        }
                                                    }}
                                                    className="text-xs"
                                                >
                                                    {skill}
                                                </Button>
                                            ))
                                        ) : (
                                            <span className="text-gray-500">No skills available</span>
                                        )}
                                    </div>
                                    <div className="flex gap-2">
                                        <Input
                                            value={editSkillInput}
                                            onChange={(e) => setEditSkillInput(e.target.value)}
                                            placeholder="Enter custom skill"
                                            className="flex-1"
                                        />
                                        <Button
                                            type="button"
                                            onClick={() => {
                                                if (editSkillInput.trim()) {
                                                    addCustomSkillForEdit(editSkillInput.trim());
                                                }
                                            }}
                                            className="bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-600 hover:to-amber-600 text-sm"
                                        >
                                            <Plus className="w-4 h-4 mr-1" /> Add
                                        </Button>
                                    </div>
                                    {editSelectedSkills.length > 0 && (
                                        <div className="flex flex-wrap gap-2">
                                            {editSelectedSkills.map((skill, idx) => (
                                                <Badge
                                                    key={idx}
                                                    variant="secondary"
                                                    className="bg-purple-100 text-purple-700 cursor-pointer"
                                                    onClick={() => setEditSelectedSkills(editSelectedSkills.filter((_, i) => i !== idx))}
                                                >
                                                    {skill.skillName}
                                                </Badge>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <div className="flex justify-end gap-3 pt-4">
                                    <Button variant="outline" onClick={() => {
                                        setIsEditModalOpen(false);
                                        setEditingEmployee(null);
                                        setEditSelectedSkills([]);
                                        setEditResumeFile(null);
                                    }}>
                                        Cancel
                                    </Button>
                                    <Button onClick={handleUpdateResource} className="bg-green-500 hover:bg-green-600">
                                        Update {activeTab === "internal" ? "Resource" : "External Resource"}
                                    </Button>
                                </div>
                            </div>
                        )}
                    </ErrorBoundary>
                </DialogContent>
            </Dialog>

            {/* Schedule Interview Dialog */}
            <Dialog open={isScheduleDialogOpen} onOpenChange={setIsScheduleDialogOpen}>
                <DialogContent className="sm:max-w-[700px] max-h-[90vh] flex flex-col p-0 overflow-hidden">
                    {/* Header */}
                    <DialogHeader className="p-6 pb-4 border-b">
                        <DialogTitle>
                            {interviewFormData.id ? 'Edit Interview' : 'Schedule New Interview'}
                        </DialogTitle>
                        <DialogDescription>
                            {interviewFormData.id
                                ? 'Update the interview details for this candidate.'
                                : 'Select a resource request and configure interview levels for the candidate.'}
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
                                        className={`w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${interviewFormErrors.demandId ? 'border-red-500' : 'border-gray-300'
                                            }`}
                                        value={interviewFormData._demandSearch ?? (interviewFormData.demandId
                                            ? (() => { const d = demandGroups.find(d => (d.demandid || d.demandId)?.toString() === interviewFormData.demandId); return d ? `${(d.demandTitle || d.demandtitle)}` : ''; })()
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
                                                                    _demandSearch: `${dTitle}`,
                                                                    _demandDropdownOpen: false
                                                                }));
                                                            }}
                                                        >
                                                            {dTitle}
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
                            {interviewFormData.id ? 'Update Interview' : 'Schedule Interview'}
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
                                            className={`mt-0.5 ${isAlreadyShared ? 'border-green-500 bg-green-500' :
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
                                            className={`mt-0.5 ${isAlreadyRejected ? 'border-red-500 bg-red-500' :
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
