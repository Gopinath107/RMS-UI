import React, { useState, useMemo, useRef, useEffect, useCallback } from "react";
import { PortfolioReportService } from '../services/PortfolioReportServices';
import {
    Search, Filter, ChevronDown, ChevronRight, Calendar, Users, Target,
    CheckCircle, XCircle, Clock, AlertTriangle, RefreshCw,
    TrendingUp, Award, UserCheck, UserX, Briefcase, BarChart2,
    ChevronLeft, ChevronRight as ChevronRightIcon, FileText, X, Circle,
    Building2, Mail, Phone, MapPin, Star, Send, Loader2, History,
    FileSpreadsheet
} from "lucide-react";

const INTERVIEW_LEVELS = ["L1", "L2", "L3", "HR", "ONBOARDING"];

/* ─────────────────────────────────────────────────────────────── */
/*  API → UI DATA TRANSFORMER                                       */
/*  Maps DemandFlowList response shape to the shape DemandRow      */
/*  and CandidateCard already expect.                              */
/* ─────────────────────────────────────────────────────────────── */
const transformDemandFlow = (item) => {
    // Flatten all pipeline entries across every childRequestDetail
    const resources = [];
    (item.childRequestDetails || []).forEach(req => {
        (req.pipeline || []).forEach(pipe => {
            const ci = pipe.candidateInfo || {};
            const isEmployee = ci.resourceType === "EMPLOYEE";
            resources.push({
                id: `${req.requestId}-${pipe.interviewId}`,
                type: isEmployee ? "EMPLOYEE" : "CANDIDATE",
                resourceId: isEmployee
                    ? `EMP-${ci.employeeId}`
                    : `CAD-${ci.candidateId}`,
                name: ci.name || "—",
                email: ci.email || "—",
                phone: ci.phoneNumber || "—",
                location: "—",
                experience: ci.experienceYears || 0,
                skills: [],
                company: isEmployee ? null : "External",
                resumeStatus: ci.resumeStatus || "—",
                overallStatus:
                    pipe.interviewOverallStatus === "Selected" ? "Selected" :
                        pipe.interviewOverallStatus === "Rejected" ? "Rejected" : "In Progress",
                interviewLevels: (pipe.interviewLevels || []).map(lvlObj => ({
                    level: lvlObj.level,
                    status: lvlObj.status,
                    interviewer: lvlObj.interviewerName || "—",
                    date: lvlObj.completedAt || "—",
                    feedback: lvlObj.notes || "",
                })),
            });
        });
    });

    const ss = item.statusSummary || {};
    return {
        id: `DEM-${item.demandInfo?.demandId}`,
        _demandId: item.demandInfo?.demandId,
        _accountId: item.contextInfo?.accountId ?? null,
        name: item.demandInfo?.title || "—",
        project: item.contextInfo?.projectName || "—",
        client: item.contextInfo?.accountName || "—",
        status: item.demandInfo?.status || "Open",
        priority: item.demandInfo?.priority || "Medium",
        demandOpenDt: item.demandInfo?.demandOpenDt || "—",
        fulfilmentDt: item.demandInfo?.fulfilmentDt || "—",
        totalRequested: item.demandInfo?.totalRequested || 0,
        description: item.demandInfo?.description || "",
        statusSummary: {
            totalRequests: ss.totalRequests || 0,
            totalInterviews: ss.totalInterviews || 0,
            selected: ss.selected || 0,
            rejected: ss.rejected || 0,
            allocated: ss.allocated || 0,
            onboarded: ss.onboarded || 0,
        },
        resources,
    };
};

/* ─────────────────────────────────────────────────────────────── */
/*  STATUS / PRIORITY CONFIG                                        */
/* ─────────────────────────────────────────────────────────────── */
const STATUS_CONFIG = {
    Open:       { bg: "bg-blue-100",   text: "text-blue-700"   },
    InProgress: { bg: "bg-amber-100",  text: "text-amber-700"  },
    Completed:  { bg: "bg-green-100",  text: "text-green-700"  },
    Rejected:   { bg: "bg-red-100",    text: "text-red-700"    },
    "On Hold":  { bg: "bg-purple-100", text: "text-purple-700" },
};
const PRIORITY_CONFIG = {
    High:   { bg: "bg-red-100",   text: "text-red-700"   },
    Medium: { bg: "bg-amber-100", text: "text-amber-700" },
    Low:    { bg: "bg-green-100", text: "text-green-700" },
};
const LEVEL_STATUS_CONFIG = {
    Selected:  { bg: "bg-green-100",  text: "text-green-700",  icon: CheckCircle },
    Rejected:  { bg: "bg-red-100",    text: "text-red-700",    icon: XCircle     },
    Scheduled: { bg: "bg-blue-100",   text: "text-blue-700",   icon: Clock       },
    Completed: { bg: "bg-teal-100",   text: "text-teal-700",   icon: Award       },
};

/* ─────────────────────────────────────────────────────────────── */
/*  EMAIL CHIP INPUT                                               */
/* ─────────────────────────────────────────────────────────────── */
const EmailChipInput = ({ label, emails, setEmails, placeholder, autoFocus = false, rightLabelAction = null }) => {
    const [inputValue, setInputValue] = React.useState('');
    const [error, setError] = React.useState('');
    const [isFocused, setIsFocused] = React.useState(false);
    const inputRef = useRef(null);
    const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

    const handleKeyDown = (e) => {
        if (['Enter', ',', ' '].includes(e.key)) {
            e.preventDefault(); addEmail();
        } else if (e.key === 'Backspace' && !inputValue && emails.length > 0) {
            setEmails(emails.slice(0, -1)); setError('');
        }
    };
    const addEmail = () => {
        const emailToAdd = inputValue.trim().replace(/,/g, '');
        if (emailToAdd) {
            if (isValidEmail(emailToAdd)) {
                if (!emails.includes(emailToAdd)) {
                    setEmails([...emails, emailToAdd]); setInputValue(''); setError('');
                } else setError('Email already added');
            } else setError('Invalid email format');
        }
    };
    const handleBlur = () => { setIsFocused(false); addEmail(); };
    const removeEmail = (emailToRemove) => setEmails(emails.filter(e => e !== emailToRemove));

    return (
        <div>
            <div className="flex justify-between items-end mb-1.5">
                <label className="text-xs font-medium text-gray-600">{label}</label>
                {rightLabelAction}
            </div>
            <div
                className={`min-h-[48px] p-2 rounded-lg border transition-all flex flex-wrap items-center gap-2 cursor-text bg-white
                    ${isFocused ? 'border-orange-400 ring-2 ring-orange-100' : 'border-gray-300'}
                    ${error ? 'border-red-400' : ''}`}
                onClick={() => inputRef.current?.focus()}
            >
                {emails.map((email, idx) => (
                    <div key={idx} className="bg-orange-50 border border-orange-200 text-orange-800 px-2.5 py-1 rounded-md text-xs font-medium flex items-center gap-1.5">
                        <span>{email}</span>
                        <button type="button" onClick={(e) => { e.stopPropagation(); removeEmail(email); }}
                            className="text-orange-400 hover:text-red-500 transition-colors">
                            <X className="w-3 h-3" />
                        </button>
                    </div>
                ))}
                <input ref={inputRef} type="text"
                    className="flex-1 min-w-[160px] bg-transparent outline-none text-sm text-gray-800 placeholder-gray-400 py-1"
                    placeholder={emails.length === 0 ? placeholder : ""}
                    value={inputValue}
                    onChange={(e) => { setInputValue(e.target.value); setError(''); }}
                    onKeyDown={handleKeyDown}
                    onFocus={() => setIsFocused(true)}
                    onBlur={handleBlur}
                    autoFocus={autoFocus}
                />
            </div>
            {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
        </div>
    );
};

/* ─────────────────────────────────────────────────────────────── */
/*  STATUS BADGE                                                    */
/* ─────────────────────────────────────────────────────────────── */
const StatusBadge = ({ status }) => {
    const cfg = STATUS_CONFIG[status] || { bg: "bg-gray-100", text: "text-gray-600" };
    const label = status === "InProgress" ? "In Progress" : status;
    return (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${cfg.bg} ${cfg.text}`}>
            {label}
        </span>
    );
};

const PriorityBadge = ({ priority }) => {
    const cfg = PRIORITY_CONFIG[priority] || PRIORITY_CONFIG.Medium;
    return (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${cfg.bg} ${cfg.text}`}>
            {priority}
        </span>
    );
};

/* ─────────────────────────────────────────────────────────────── */
/*  INTERVIEW LEVEL PILL                                            */
/* ─────────────────────────────────────────────────────────────── */
const InterviewLevelPill = ({ level, status }) => {
    const cfg = LEVEL_STATUS_CONFIG[status] || LEVEL_STATUS_CONFIG.Scheduled;
    const Icon = cfg.icon;
    return (
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${cfg.bg} ${cfg.text}`}>
            <Icon className="w-3 h-3" />
            {level}
        </span>
    );
};

/* ─────────────────────────────────────────────────────────────── */
/*  CANDIDATE CARD                                                  */
/* ─────────────────────────────────────────────────────────────── */
const CandidateCard = ({ resource, isOpen, onToggle }) => {
    const isInternal = resource.type === "EMPLOYEE";

    return (
        <div className={`border rounded-xl overflow-hidden transition-all ${isOpen ? "border-orange-300 shadow-sm" : "border-gray-200 hover:border-gray-300"}`}>
            <button
                onClick={onToggle}
                className="w-full flex items-center gap-3 p-3 text-left hover:bg-gray-50 transition-colors"
            >
                {/* Avatar */}
                <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${isInternal ? "bg-blue-100 text-blue-700" : "bg-purple-100 text-purple-700"}`}>
                    {resource.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
                </div>

                {/* Name + ID */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-gray-800 truncate">{resource.name}</p>
                        <span className={`text-xs px-1.5 py-0.5 rounded font-medium flex-shrink-0 ${isInternal ? "bg-blue-50 text-blue-600" : "bg-purple-50 text-purple-600"}`}>
                            {isInternal ? "Internal" : "External"}
                        </span>
                    </div>
                    <p className="text-xs text-gray-400 font-mono">{resource.resourceId}</p>
                </div>

                {/* Interview level pills */}
                <div className="hidden sm:flex items-center gap-1 flex-wrap justify-end max-w-[200px]">
                    {resource.interviewLevels.map((il, i) => (
                        <InterviewLevelPill key={i} level={il.level} status={il.status} />
                    ))}
                </div>

                {/* Overall status */}
                <StatusBadge status={resource.overallStatus} />

                <ChevronDown className={`w-4 h-4 text-gray-400 flex-shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`} />
            </button>

            {isOpen && (
                <div className="border-t border-gray-100 bg-gray-50 p-4 space-y-3">
                    {/* Contact info */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs text-gray-600">
                        <div className="flex items-center gap-1.5">
                            <Mail className="w-3.5 h-3.5 text-gray-400" />
                            <span className="truncate">{resource.email}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <Phone className="w-3.5 h-3.5 text-gray-400" />
                            <span>{resource.phone}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5 text-gray-400" />
                            <span>{resource.location}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <Briefcase className="w-3.5 h-3.5 text-gray-400" />
                            <span>{resource.experience} yrs exp</span>
                        </div>
                    </div>

                    {/* Skills */}
                    {resource.skills.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                            {resource.skills.map((s, i) => (
                                <span key={i} className="px-2 py-0.5 bg-white border border-gray-200 text-gray-600 text-xs rounded font-medium">
                                    {s}
                                </span>
                            ))}
                        </div>
                    )}

                    {/* Interview Journey */}
                    {resource.interviewLevels.length > 0 && (
                        <div>
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Interview Journey</p>
                            <div className="space-y-1.5">
                                {resource.interviewLevels.map((il, i) => {
                                    const cfg = LEVEL_STATUS_CONFIG[il.status] || LEVEL_STATUS_CONFIG.Scheduled;
                                    const Icon = cfg.icon;
                                    return (
                                        <div key={i} className={`flex items-center gap-2 px-3 py-2 rounded-lg ${cfg.bg} ${cfg.text} text-xs`}>
                                            <Icon className="w-3.5 h-3.5 flex-shrink-0" />
                                            <span className="font-bold w-14 flex-shrink-0">{il.level}</span>
                                            <span className="font-medium">{il.status}</span>
                                            <span className="ml-auto text-xs opacity-70 flex items-center gap-1">
                                                <UserCheck className="w-3 h-3" />{il.interviewer}
                                            </span>
                                            {il.date && il.date !== "—" && (
                                                <span className="text-xs opacity-70 flex items-center gap-1">
                                                    <Calendar className="w-3 h-3" />{il.date}
                                                </span>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

/* ─────────────────────────────────────────────────────────────── */
/*  DEMAND ROW                                                      */
/* ─────────────────────────────────────────────────────────────── */
const DemandRow = ({ demand, isExpanded, onToggle }) => {
    const [expandedResourceId, setExpandedResourceId] = useState(null);
    const [resourceSearch, setResourceSearch] = useState("");

    const handleResourceToggle = (id) =>
        setExpandedResourceId(prev => prev === id ? null : id);

    const filteredResources = useMemo(() => {
        if (!resourceSearch.trim()) return demand.resources;
        const t = resourceSearch.toLowerCase();
        return demand.resources.filter(r =>
            r.name.toLowerCase().includes(t) ||
            r.resourceId.toLowerCase().includes(t) ||
            r.skills.some(s => s.toLowerCase().includes(t))
        );
    }, [demand.resources, resourceSearch]);

    const internal  = demand.resources.filter(r => r.type === "EMPLOYEE").length;
    const external  = demand.resources.filter(r => r.type === "CANDIDATE").length;
    const scheduled = demand.resources.filter(r => r.interviewLevels.some(l => l.status === "Scheduled")).length;
    const selected  = demand.resources.filter(r => r.overallStatus === "Selected").length;
    const rejected  = demand.resources.filter(r => r.overallStatus === "Rejected").length;

    return (
        <div className={`bg-white border rounded-xl overflow-hidden transition-all ${isExpanded ? "border-orange-300 shadow-md" : "border-gray-200 hover:border-gray-300 hover:shadow-sm"}`}>

            {/* ── Demand Header ── */}
            <button
                onClick={onToggle}
                className={`w-full flex items-center gap-4 px-5 py-4 text-left transition-colors ${isExpanded ? "bg-orange-50 border-b border-orange-100" : "hover:bg-gray-50"}`}
            >
                {/* Expand icon */}
                <ChevronRight className={`w-4 h-4 text-gray-400 flex-shrink-0 transition-transform ${isExpanded ? "rotate-90" : ""}`} />

                {/* Demand ID badge */}
                <span className="font-mono text-xs font-bold text-orange-600 bg-orange-50 border border-orange-200 px-2 py-0.5 rounded flex-shrink-0">
                    {demand.id}
                </span>

                {/* Title + meta */}
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{demand.name}</p>
                    <div className="flex items-center gap-3 mt-0.5 text-xs text-gray-500 flex-wrap">
                        <span className="flex items-center gap-1">
                            <Building2 className="w-3 h-3" />{demand.client}
                        </span>
                        <span className="flex items-center gap-1">
                            <Briefcase className="w-3 h-3" />{demand.project}
                        </span>
                        <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />Due: {demand.fulfilmentDt}
                        </span>
                    </div>
                </div>

                {/* Status + Priority */}
                <div className="flex items-center gap-2 flex-shrink-0">
                    <StatusBadge status={demand.status} />
                    <PriorityBadge priority={demand.priority} />
                </div>
            </button>

            {/* ── Stat strip ── */}
            <div className="flex flex-wrap items-center gap-3 px-5 py-2.5 bg-gray-50 border-b border-gray-100 text-xs">
                <StatChip label="Requested" value={demand.totalRequested} color="text-indigo-600 bg-indigo-50" />
                <StatChip label="Int"        value={internal}             color="text-blue-600 bg-blue-50"   />
                <StatChip label="Ext"        value={external}             color="text-purple-600 bg-purple-50" />
                <StatChip label="Scheduled"  value={scheduled}            color="text-amber-600 bg-amber-50"  />
                <StatChip label="Selected"   value={selected}             color="text-green-600 bg-green-50"  />
                <StatChip label="Rejected"   value={rejected}             color="text-red-600 bg-red-50"      />
            </div>

            {/* ── Expanded Panel ── */}
            {isExpanded && (
                <div className="p-5 space-y-4">
                    {/* Description */}
                    {demand.description && (
                        <p className="text-sm text-gray-600">{demand.description}</p>
                    )}

                    {/* Summary counts */}
                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                        {[
                            { label: "Total Requests",   value: demand.statusSummary.totalRequests   },
                            { label: "Total Interviews", value: demand.statusSummary.totalInterviews  },
                            { label: "Selected",         value: demand.statusSummary.selected         },
                            { label: "Rejected",         value: demand.statusSummary.rejected         },
                            { label: "Allocated",        value: demand.statusSummary.allocated        },
                            { label: "Onboarded",        value: demand.statusSummary.onboarded        },
                        ].map((s, i) => (
                            <div key={i} className="bg-gray-50 rounded-lg p-3 text-center border border-gray-100">
                                <p className="text-lg font-bold text-gray-800">{s.value}</p>
                                <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
                            </div>
                        ))}
                    </div>

                    {/* Resource list */}
                    <div>
                        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                            <p className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
                                <Users className="w-4 h-4 text-orange-500" />
                                Resources
                                <span className="text-xs font-normal text-gray-400">({demand.resources.length})</span>
                                {internal > 0 && (
                                    <span className="text-xs bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded">{internal} Internal</span>
                                )}
                                {external > 0 && (
                                    <span className="text-xs bg-purple-50 text-purple-600 px-1.5 py-0.5 rounded">{external} External</span>
                                )}
                            </p>

                            {/* Resource search */}
                            {demand.resources.length > 2 && (
                                <div className="relative">
                                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                                    <input
                                        type="text"
                                        placeholder="Search resources…"
                                        value={resourceSearch}
                                        onChange={e => { setResourceSearch(e.target.value); setExpandedResourceId(null); }}
                                        className="pl-8 pr-3 py-1.5 border border-gray-200 rounded-lg text-xs text-gray-700 bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-400 transition-all w-48"
                                    />
                                    {resourceSearch && (
                                        <button onClick={() => { setResourceSearch(""); setExpandedResourceId(null); }}
                                            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-500">
                                            <X className="w-3 h-3" />
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>

                        {filteredResources.length === 0 ? (
                            <p className="text-sm text-gray-400 text-center py-6">No resources match your search.</p>
                        ) : (
                            <div className="space-y-2">
                                {filteredResources.map(r => (
                                    <CandidateCard
                                        key={r.id}
                                        resource={r}
                                        isOpen={expandedResourceId === r.id}
                                        onToggle={() => handleResourceToggle(r.id)}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

/* ─────────────────────────────────────────────────────────────── */
/*  STAT CHIP                                                       */
/* ─────────────────────────────────────────────────────────────── */
const StatChip = ({ label, value, color }) => (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded font-medium text-xs ${color}`}>
        <span className="font-bold">{value}</span> {label}
    </span>
);

/* ─────────────────────────────────────────────────────────────── */
/*  MAIN PAGE                                                       */
/* ─────────────────────────────────────────────────────────────── */
const ITEMS_PER_PAGE_OPTIONS = [5, 10, 20];

export default function PortfolioReportsPage() {

    /* ── filter state ── */
    const [selectedClient, setSelectedClient] = useState("All Clients");
    const [startDate,      setStartDate]      = useState("");
    const [endDate,        setEndDate]        = useState("");
    const [searchTerm,     setSearchTerm]     = useState("");
    const [statusFilter,   setStatusFilter]   = useState("All");
    const [priorityFilter, setPriorityFilter] = useState("All");
    const [currentPage,    setCurrentPage]    = useState(1);
    const [itemsPerPage,   setItemsPerPage]   = useState(10);
    const [expandedDemandId, setExpandedDemandId] = useState(null);

    /* ── API data state ── */
    const [allDemands,  setAllDemands]  = useState([]);
    const [clientList,  setClientList]  = useState(["All Clients"]);
    const [loading,     setLoading]     = useState(false);
    const [error,       setError]       = useState(null);
    const [detailedExporting, setDetailedExporting] = useState(false);

    /* ── email modal state ── */
    const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
    const [toEmail,   setToEmails]   = useState([]);
    const [ccEmail,   setCcEmails]   = useState([]);
    const [showCc,    setShowCc]     = useState(false);
    const [isSending, setIsSending]  = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);

    /* ── Load data on mount ── */
    useEffect(() => {
        const today = new Date().toISOString().split("T")[0];
        const threeMonthsAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

        const loadAll = async () => {
            setLoading(true);
            setError(null);
            try {
                const [demandRes, empRes, candRes] = await Promise.all([
                    PortfolioReportService.fetchDemandFlowList(threeMonthsAgo, today, 100),
                    PortfolioReportService.fetchEmployeeFlows(0, 10000),
                    PortfolioReportService.fetchCandidateFlows(0, 300),
                ]);

                const empMap = {};
                ((empRes.data?.result?.items) || []).forEach(item => {
                    const p = item.profile || {};
                    empMap[p.employeeId] = {
                        skills: p.primarySkills || p.skills || [],
                        location: p.location || "—",
                        experience: p.experienceYears || p.totalExperience || 0,
                    };
                });
                const candMap = {};
                ((candRes.data?.result?.items) || []).forEach(item => {
                    const p = item.profile || {};
                    candMap[p.candidateId] = {
                        skills: p.primarySkills || p.skillNames || [],
                        location: p.location || "—",
                        experience: p.experienceYears || p.totalExperience || 0,
                    };
                });

                const rawList = demandRes.data?.result || [];
                const demands = rawList.map(item => {
                    const d = transformDemandFlow(item);
                    d.resources = d.resources.map(r => {
                        const isEmp = r.type === "EMPLOYEE";
                        const lookup = isEmp
                            ? empMap[parseInt(r.resourceId.replace("EMP-", ""))]
                            : candMap[parseInt(r.resourceId.replace("CAD-", ""))];
                        if (lookup) {
                            r.skills    = lookup.skills;
                            r.location  = lookup.location;
                            r.experience = lookup.experience;
                        }
                        return r;
                    });
                    return d;
                });

                const clients = ["All Clients", ...new Set(demands.map(d => d.client).filter(Boolean))];
                setClientList(clients);
                setAllDemands(demands);
            } catch (err) {
                console.error("Failed to load portfolio report data:", err);
                setError("Failed to load data. Please try again.");
            } finally {
                setLoading(false);
            }
        };

        loadAll();
    }, []);

    /* ── Client-side filtering ── */
    const filtered = useMemo(() => {
        let list = allDemands;
        if (selectedClient !== "All Clients") list = list.filter(d => d.client === selectedClient);
        if (startDate) list = list.filter(d => new Date(d.demandOpenDt) >= new Date(startDate));
        if (endDate)   list = list.filter(d => new Date(d.demandOpenDt) <= new Date(endDate));
        if (statusFilter !== "All")   list = list.filter(d => d.status === statusFilter);
        if (priorityFilter !== "All") list = list.filter(d => d.priority === priorityFilter);
        if (searchTerm.trim()) {
            const t = searchTerm.toLowerCase();
            list = list.filter(d =>
                d.name.toLowerCase().includes(t) ||
                d.client.toLowerCase().includes(t) ||
                d.project.toLowerCase().includes(t) ||
                d.id.toLowerCase().includes(t)
            );
        }
        return list;
    }, [allDemands, selectedClient, startDate, endDate, searchTerm, statusFilter, priorityFilter]);

    const totalPages = Math.ceil(filtered.length / itemsPerPage);
    const paginated  = useMemo(() => {
        const start = (currentPage - 1) * itemsPerPage;
        return filtered.slice(start, start + itemsPerPage);
    }, [filtered, currentPage, itemsPerPage]);

    /* ── KPIs ── */
    const kpis = useMemo(() => {
        const totalInternal  = filtered.reduce((s, d) => s + d.resources.filter(r => r.type === "EMPLOYEE").length, 0);
        const totalExternal  = filtered.reduce((s, d) => s + d.resources.filter(r => r.type === "CANDIDATE").length, 0);
        const totalSelected  = filtered.reduce((s, d) => s + d.resources.filter(r => r.overallStatus === "Selected").length, 0);
        const totalScheduled = filtered.reduce((s, d) => s + d.resources.filter(r => r.interviewLevels.some(l => l.status === "Scheduled")).length, 0);
        return { total: filtered.length, totalInternal, totalExternal, totalSelected, totalScheduled };
    }, [filtered]);

    const clearFilters = () => {
        setSelectedClient("All Clients"); setStartDate(""); setEndDate("");
        setSearchTerm(""); setStatusFilter("All"); setPriorityFilter("All"); setCurrentPage(1);
    };

    /* ── Detailed Export ── */
    const handleDetailedExport = useCallback(async () => {
        setDetailedExporting(true);
        try {
            const payload = {
                userId: localStorage.getItem('userId'),
                fromDate: startDate || null,
                toDate: endDate || null,
                accountId: selectedClient !== "All Clients"
                    ? (filtered.find(d => d.client === selectedClient)?._accountId ?? null)
                    : null,
                demandIds: filtered.map(d => d._demandId).filter(Boolean),
            };
            const response = await PortfolioReportService.exportDetailedResourceReport(payload);
            const blob = new Blob([response.data], {
                type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            });
            const url  = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href  = url;
            link.download = `detailed_resource_report_${new Date().toISOString().split('T')[0]}.xlsx`;
            document.body.appendChild(link);
            link.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(link);
        } catch (err) {
            console.error("Detailed export failed:", err);
            alert("Detailed export failed. Please try again.");
        } finally {
            setDetailedExporting(false);
        }
    }, [selectedClient, filtered, startDate, endDate]);

    /* ── Email ── */
    const handleOpenEmailModal = () => {
        setIsEmailModalOpen(true);
        setToEmails([]); setCcEmails([]); setShowCc(false);
    };

    const handleGenerateEmailReport = async (emailData = {}) => {
        setLoading(true);
        try {
            const payload = {
                userId: localStorage.getItem('userId'),
                fromDate: startDate || null,
                toDate: endDate || null,
                accountId: selectedClient !== "All Clients"
                    ? (filtered.find(d => d.client === selectedClient)?._accountId ?? null)
                    : null,
                demandStatus: statusFilter !== "All" ? statusFilter : null,
                priority: priorityFilter !== "All" ? priorityFilter : null,
                candidateSearch: searchTerm || null,
                demandIds: filtered.map(d => d._demandId).filter(Boolean),
                ...emailData,
            };
            await PortfolioReportService.generateEmailReport(payload);
        } catch (err) {
            console.error("Email report failed:", err);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const handleSendEmail = async () => {
        if (toEmail.length === 0) { alert("Please add at least one recipient"); return; }
        setIsSending(true);
        try {
            await handleGenerateEmailReport({ toEmail, ccEmail });
            setIsEmailModalOpen(false);
            setShowSuccess(true);
            setTimeout(() => setShowSuccess(false), 3000);
        } catch {
            alert("Failed to send email");
        } finally {
            setIsSending(false);
        }
    };

    /* ─────────────────────────────────────────────────────────── */
    /*  RENDER                                                      */
    /* ─────────────────────────────────────────────────────────── */
    return (
        <div className="min-h-screen bg-transparent p-6 md:p-8">

            {/* ══════════════════════════════════════════════════ */}
            {/* PAGE HEADER                                        */}
            {/* ══════════════════════════════════════════════════ */}
            <div className="mb-6">
                <div className="flex items-start justify-between flex-wrap gap-4">
                    <div>
                        <div className="flex items-center gap-3 mb-1">
                            <div className="w-9 h-9 rounded-lg bg-orange-100 flex items-center justify-center flex-shrink-0">
                                <BarChart2 className="w-5 h-5 text-orange-600" />
                            </div>
                            <h1 className="text-2xl font-bold text-white">Demand Reports</h1>
                        </div>
                        <p className="text-sm text-white/60 ml-12">Detailed resource &amp; interview breakdown per demand</p>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-2 flex-wrap">
                        {/* Generate Report (email) */}
                        <button
                            onClick={handleOpenEmailModal}
                            disabled={loading}
                            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg shadow-sm hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading
                                ? <Loader2 className="w-4 h-4 animate-spin text-gray-500" />
                                : <Mail className="w-4 h-4 text-gray-500" />
                            }
                            Generate Report
                        </button>

                        {/* Export Detailed Report (NEW) */}
                        <button
                            onClick={handleDetailedExport}
                            disabled={detailedExporting}
                            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-orange-500 border border-orange-500 rounded-lg shadow-sm hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {detailedExporting
                                ? <Loader2 className="w-4 h-4 animate-spin" />
                                : <FileSpreadsheet className="w-4 h-4" />
                            }
                            {detailedExporting ? "Generating…" : "Detailed Export"}
                        </button>
                    </div>
                </div>
            </div>

            {/* Loading / Error */}
            {loading && (
                <div className="flex items-center justify-center py-12 text-orange-500">
                    <RefreshCw className="w-5 h-5 animate-spin mr-2" />
                    <span className="text-sm font-medium">Loading demands…</span>
                </div>
            )}
            {error && !loading && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 flex items-center gap-3 text-red-700 text-sm">
                    <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                    {error}
                </div>
            )}

            {/* ══════════════════════════════════════════════════ */}
            {/* KPI CARDS                                          */}
            {/* ══════════════════════════════════════════════════ */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
                {[
                    { label: "Active Demands",      value: kpis.total,          icon: Target,    color: "text-orange-500 bg-orange-50" },
                    { label: "Internal Resources",  value: kpis.totalInternal,  icon: UserCheck, color: "text-blue-500 bg-blue-50"     },
                    { label: "External Resources",  value: kpis.totalExternal,  icon: Users,     color: "text-purple-500 bg-purple-50" },
                    { label: "Interviews Ongoing",  value: kpis.totalScheduled, icon: Clock,     color: "text-amber-500 bg-amber-50"   },
                    { label: "Selected",            value: kpis.totalSelected,  icon: Award,     color: "text-green-500 bg-green-50"   },
                ].map((k, i) => {
                    const Icon = k.icon;
                    return (
                        <div key={i} className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3 shadow-sm">
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${k.color}`}>
                                <Icon className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-xl font-bold text-gray-800">{k.value}</p>
                                <p className="text-xs text-gray-500">{k.label}</p>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* ══════════════════════════════════════════════════ */}
            {/* FILTERS                                            */}
            {/* ══════════════════════════════════════════════════ */}
            <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                    <Filter className="w-4 h-4 text-orange-500" />
                    <span className="text-sm font-semibold text-gray-700">Filters</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                    {/* Client */}
                    <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Client</label>
                        <select value={selectedClient} onChange={e => { setSelectedClient(e.target.value); setCurrentPage(1); }}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-400 transition-all">
                            {clientList.map(c => <option key={c}>{c}</option>)}
                        </select>
                    </div>

                    {/* Demand From */}
                    <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Demand From</label>
                        <input type="date" value={startDate} onChange={e => { setStartDate(e.target.value); setCurrentPage(1); }}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-400 transition-all" />
                    </div>

                    {/* Demand To */}
                    <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Demand To</label>
                        <input type="date" value={endDate} onChange={e => { setEndDate(e.target.value); setCurrentPage(1); }}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-400 transition-all" />
                    </div>

                    {/* Status */}
                    <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Status</label>
                        <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setCurrentPage(1); }}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-400 transition-all">
                            {["All", "Open", "InProgress", "Completed", "On Hold"].map(s => <option key={s}>{s}</option>)}
                        </select>
                    </div>

                    {/* Priority */}
                    <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Priority</label>
                        <select value={priorityFilter} onChange={e => { setPriorityFilter(e.target.value); setCurrentPage(1); }}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-400 transition-all">
                            {["All", "High", "Medium", "Low"].map(p => <option key={p}>{p}</option>)}
                        </select>
                    </div>

                    {/* Search */}
                    <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Search</label>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                            <input
                                type="text"
                                placeholder="Demand, client, project…"
                                value={searchTerm}
                                onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                                className="w-full pl-9 pr-8 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-400 transition-all"
                            />
                            {searchTerm && (
                                <button onClick={() => setSearchTerm("")}
                                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-500">
                                    <X className="w-3.5 h-3.5" />
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* ══════════════════════════════════════════════════ */}
            {/* RESULTS BAR                                        */}
            {/* ══════════════════════════════════════════════════ */}
            <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
                <p className="text-sm text-white/70">
                    Showing <span className="font-bold text-white">{paginated.length}</span> of{" "}
                    <span className="font-bold text-white">{filtered.length}</span> demands
                </p>
                <div className="flex items-center gap-2 text-sm text-white/70">
                    <span>Show</span>
                    <select value={itemsPerPage} onChange={e => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                        className="border border-white/20 rounded-lg px-2 py-1 text-sm text-white bg-white/10 backdrop-blur focus:outline-none">
                        {ITEMS_PER_PAGE_OPTIONS.map(n => <option key={n} className="text-gray-800 bg-white">{n}</option>)}
                    </select>
                    <span>per page</span>
                </div>
            </div>

            {/* ══════════════════════════════════════════════════ */}
            {/* DEMAND LIST                                        */}
            {/* ══════════════════════════════════════════════════ */}
            {!loading && paginated.length === 0 ? (
                <div className="bg-white rounded-xl border border-gray-200 p-12 text-center shadow-sm">
                    <AlertTriangle className="w-10 h-10 text-orange-300 mx-auto mb-3" />
                    <p className="text-gray-500">No demands match your filters.</p>
                    <button onClick={clearFilters} className="mt-2 text-sm text-orange-500 hover:text-orange-700 font-medium">
                        Clear filters
                    </button>
                </div>
            ) : (
                <div className="space-y-3">
                    {paginated.map(demand => (
                        <DemandRow
                            key={demand.id}
                            demand={demand}
                            isExpanded={expandedDemandId === demand.id}
                            onToggle={() => setExpandedDemandId(expandedDemandId === demand.id ? null : demand.id)}
                        />
                    ))}
                </div>
            )}

            {/* ══════════════════════════════════════════════════ */}
            {/* PAGINATION                                         */}
            {/* ══════════════════════════════════════════════════ */}
            {totalPages > 1 && (
                <div className="mt-6 flex items-center justify-between bg-white border border-gray-200 rounded-xl px-5 py-3 shadow-sm">
                    <p className="text-sm text-gray-500">
                        Page <span className="font-semibold text-gray-800">{currentPage}</span> of{" "}
                        <span className="font-semibold text-gray-800">{totalPages}</span>
                    </p>
                    <div className="flex items-center gap-1">
                        <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}
                            className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-orange-50 hover:border-orange-300 hover:text-orange-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                        {Array.from({ length: totalPages }, (_, i) => i + 1)
                            .filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                            .reduce((acc, p, idx, arr) => {
                                if (idx > 0 && p - arr[idx - 1] > 1) acc.push("…");
                                acc.push(p);
                                return acc;
                            }, [])
                            .map((p, i) =>
                                p === "…" ? (
                                    <span key={`e${i}`} className="px-1 text-gray-400 text-sm">…</span>
                                ) : (
                                    <button key={p} onClick={() => setCurrentPage(p)}
                                        className={`w-8 h-8 rounded-lg border text-sm font-medium transition-colors
                                            ${currentPage === p
                                                ? "bg-orange-500 border-orange-500 text-white"
                                                : "border-gray-200 text-gray-600 hover:bg-orange-50 hover:border-orange-300 hover:text-orange-600"
                                            }`}>
                                        {p}
                                    </button>
                                )
                            )
                        }
                        <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}
                            className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-orange-50 hover:border-orange-300 hover:text-orange-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                            <ChevronRightIcon className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )}

            {/* ── SUCCESS TOAST ── */}
            {showSuccess && (
                <div className="fixed bottom-6 right-6 bg-white border border-green-200 text-green-800 px-5 py-3 rounded-xl shadow-xl flex items-center gap-2 z-50">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span className="text-sm font-medium">Report sent successfully!</span>
                </div>
            )}

            {/* ══════════════════════════════════════════════════ */}
            {/* EMAIL MODAL                                        */}
            {/* ══════════════════════════════════════════════════ */}
            {isEmailModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setIsEmailModalOpen(false)} />
                    <div className="relative bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden">

                        {/* Modal header */}
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                            <div>
                                <h3 className="text-base font-bold text-gray-900">Share Report via Email</h3>
                                <p className="text-xs text-gray-500 mt-0.5">Recipients will receive the report as an attachment</p>
                            </div>
                            <button onClick={() => setIsEmailModalOpen(false)}
                                className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Modal body */}
                        <div className="p-6 space-y-4">
                            <EmailChipInput
                                label="To"
                                emails={toEmail}
                                setEmails={setToEmails}
                                placeholder="Add recipients…"
                                autoFocus={true}
                                rightLabelAction={
                                    !showCc && (
                                        <button onClick={() => setShowCc(true)}
                                            className="text-xs text-orange-500 hover:text-orange-700 font-medium">
                                            + Add CC
                                        </button>
                                    )
                                }
                            />
                            {showCc && (
                                <EmailChipInput
                                    label="CC"
                                    emails={ccEmail}
                                    setEmails={setCcEmails}
                                    placeholder="Add CC recipients…"
                                    rightLabelAction={
                                        <button onClick={() => setShowCc(false)}
                                            className="text-xs text-gray-400 hover:text-gray-600">
                                            Remove CC
                                        </button>
                                    }
                                />
                            )}

                            {/* Attachment preview */}
                            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 flex items-center gap-3">
                                <div className="w-9 h-9 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                    <FileText className="w-4 h-4 text-orange-600" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs font-semibold text-gray-800 truncate">
                                        Demand_Report_{startDate || 'All'}_to_{endDate || 'All'}.pdf
                                    </p>
                                    <p className="text-xs text-gray-400">Generated Report</p>
                                </div>
                            </div>
                        </div>

                        {/* Modal footer */}
                        <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
                            <button onClick={() => setIsEmailModalOpen(false)}
                                className="px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                                Cancel
                            </button>
                            <button onClick={handleSendEmail} disabled={isSending || toEmail.length === 0}
                                className="px-5 py-2 text-sm font-medium text-white bg-orange-500 rounded-lg hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2">
                                {isSending
                                    ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /><span>Sending…</span></>
                                    : <><Send className="w-3.5 h-3.5" /><span>Send Report</span></>
                                }
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
