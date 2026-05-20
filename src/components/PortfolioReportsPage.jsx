import React, { useState, useMemo, useRef, useEffect, useCallback } from "react";
import { PortfolioReportService } from '../services/PortfolioReportServices';
import {
    Search, Filter, ChevronDown, ChevronRight, Calendar, Users, Target,
    CheckCircle, XCircle, Clock, AlertTriangle, RefreshCw,
    TrendingUp, Award, UserCheck, UserX, Briefcase, BarChart2,
    ChevronLeft, ChevronRight as ChevronRightIcon, FileText, X, Circle,
    Building2, Mail, Phone, MapPin, Star, Send, Loader2, History, FileSpreadsheet
} from "lucide-react";

const DUMMY_CLIENTS = ["All Clients"];  // populated dynamically from API data

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
            const id = isEmployee ? ci.employeeId : ci.candidateId;
            resources.push({
                id: `${req.requestId}-${pipe.interviewId}`,
                type: isEmployee ? "EMPLOYEE" : "CANDIDATE",
                resourceId: isEmployee ? `EMP-${ci.employeeId}` : `CAD-${ci.candidateId}`,
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
/*  CONFIG                                                          */
/* ─────────────────────────────────────────────────────────────── */
const STATUS_CONFIG = {
    Open: { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200", dot: "bg-blue-500" },
    InProgress: { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200", dot: "bg-amber-500" },
    Completed: { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200", dot: "bg-emerald-500" },
    Rejected: { bg: "bg-red-50", text: "text-red-700", border: "border-red-200", dot: "bg-red-500" },
    "On Hold": { bg: "bg-purple-50", text: "text-purple-700", border: "border-purple-200", dot: "bg-purple-500" },
};
const PRIORITY_CONFIG = {
    High: { bg: "bg-red-100", text: "text-red-700" },
    Medium: { bg: "bg-amber-100", text: "text-amber-700" },
    Low: { bg: "bg-emerald-100", text: "text-emerald-700" },
};
const LEVEL_STATUS_CONFIG = {
    Selected: { bg: "bg-emerald-100", text: "text-emerald-700", icon: CheckCircle },
    Rejected: { bg: "bg-red-100", text: "text-red-700", icon: XCircle },
    Scheduled: { bg: "bg-blue-100", text: "text-blue-700", icon: Clock },
    Completed: { bg: "bg-teal-100", text: "text-teal-700", icon: Award },
};
const OVERALL_STATUS_CONFIG = {
    Selected: { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-300" },
    Rejected: { bg: "bg-red-50", text: "text-red-700", border: "border-red-300" },
    "In Progress": { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-300" },
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
                if (!emails.includes(emailToAdd)) { setEmails([...emails, emailToAdd]); setInputValue(''); setError(''); }
                else setError('Email already added');
            } else setError('Invalid email format');
        }
    };
    const handleBlur = () => { setIsFocused(false); addEmail(); };
    const removeEmail = (emailToRemove) => setEmails(emails.filter(e => e !== emailToRemove));

    return (
        <div className="group">
            <div className="flex justify-between items-end mb-1.5">
                <label className={`text-xs font-semibold uppercase tracking-wider transition-colors ${isFocused ? 'text-orange-600' : 'text-gray-500'}`}>{label}</label>
                {rightLabelAction}
            </div>
            <div
                className={`min-h-[56px] p-2 rounded-xl border transition-all duration-200 bg-gray-50/50 flex flex-wrap items-center gap-2 cursor-text
                    ${isFocused ? 'border-orange-400 bg-white ring-4 ring-orange-400/10 shadow-sm' : 'border-gray-200 hover:border-gray-300'}
                    ${error ? 'border-red-300 bg-red-50/30' : ''}`}
                onClick={() => inputRef.current?.focus()}
            >
                {emails.map((email, index) => (
                    <div key={index} className="bg-white border border-gray-200 text-gray-700 px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-2 shadow-sm">
                        <div className="w-5 h-5 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center text-xs font-bold">{email[0].toUpperCase()}</div>
                        <span>{email}</span>
                        <button type="button" onClick={(e) => { e.stopPropagation(); removeEmail(email); }} className="text-gray-400 hover:text-red-500 hover:bg-gray-100 rounded-full p-0.5 transition-colors">
                            <X className="w-3.5 h-3.5" />
                        </button>
                    </div>
                ))}
                <input ref={inputRef} type="text"
                    className="flex-1 min-w-[180px] bg-transparent outline-none text-gray-800 placeholder-gray-400 text-sm py-1 ml-1"
                    placeholder={emails.length === 0 ? placeholder : ""}
                    value={inputValue} onChange={(e) => { setInputValue(e.target.value); setError(''); }}
                    onKeyDown={handleKeyDown} onFocus={() => setIsFocused(true)} onBlur={handleBlur} autoFocus={autoFocus}
                />
            </div>
            {error && <p className="mt-1 text-xs text-red-500 font-medium">{error}</p>}
        </div>
    );
};

/* ─────────────────────────────────────────────────────────────── */
/*  SHARED COMPONENTS                                               */
/* ─────────────────────────────────────────────────────────────── */

// FIX 3: Uniform badge sizing — fixed min-width so all badges same size
const StatusBadge = ({ status, config }) => {
    const cfg = config[status] || { bg: "bg-gray-100", text: "text-gray-600", border: "border-gray-200", dot: "bg-gray-400" };
    const label = status === "InProgress" ? "In Progress" : status;
    return (
        <span
            className={`inline-flex items-center justify-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${cfg.bg} ${cfg.text} ${cfg.border || ""}`}
            style={{ minWidth: "90px", whiteSpace: "nowrap" }}
        >
            {cfg.dot && <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${cfg.dot}`} />}
            {label}
        </span>
    );
};

// FIX 3: Priority badge with uniform fixed width
const PriorityBadge = ({ priority }) => {
    const cfg = PRIORITY_CONFIG[priority] || PRIORITY_CONFIG.Medium;
    return (
        <span
            className={`inline-flex items-center justify-center text-xs px-2.5 py-1 rounded-full font-semibold ${cfg.bg} ${cfg.text}`}
            style={{ minWidth: "90px", whiteSpace: "nowrap" }}
        >
            {priority}
        </span>
    );
};

const InterviewLevelPill = ({ level, status }) => {
    const cfg = LEVEL_STATUS_CONFIG[status] || LEVEL_STATUS_CONFIG.Scheduled;
    const Icon = cfg.icon;
    return (
        <div className={`flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium ${cfg.bg} ${cfg.text}`}>
            <Icon className="w-3 h-3 flex-shrink-0" />
            <span>{level}</span>
        </div>
    );
};

const MiniProgress = ({ cleared, total }) => {
    const pct = total > 0 ? Math.round((cleared / total) * 100) : 0;
    return (
        <div className="flex items-center gap-2">
            <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
            </div>
            <span className="text-xs text-gray-500 font-medium w-8 text-right">{pct}%</span>
        </div>
    );
};

/* ─────────────────────────────────────────────────────────────── */
/*  CANDIDATE CARD  — FIX 1: accordion via expandedId prop         */
/* ─────────────────────────────────────────────────────────────── */
const CandidateCard = ({ resource, isOpen, onToggle }) => {
    const overallCfg = OVERALL_STATUS_CONFIG[resource.overallStatus] || OVERALL_STATUS_CONFIG["In Progress"];
    const isInternal = resource.type === "EMPLOYEE";
    const clearedCount = resource.interviewLevels.filter(l => l.status === "Selected" || l.status === "Completed").length;

    return (
        <div className={`border rounded-xl overflow-hidden transition-all duration-200 ${isOpen ? "border-orange-300 shadow-md" : "border-gray-200 hover:border-orange-200 hover:shadow-sm"}`}>
            <button
                onClick={onToggle}
                className="w-full flex items-center gap-3 p-3.5 text-left hover:bg-orange-50/40 transition-colors"
            >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${isInternal ? "bg-blue-100 text-blue-700" : "bg-purple-100 text-purple-700"}`}>
                    {resource.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                </div>

                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold text-gray-900 truncate">{resource.name}</p>
                        <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${isInternal ? "bg-blue-50 text-blue-600" : "bg-purple-50 text-purple-600"}`}>
                            {isInternal ? "Internal" : "External"}
                        </span>
                    </div>
                    <p className="text-xs text-gray-500 font-mono">{resource.resourceId}</p>
                </div>

                <div className="hidden sm:flex items-center gap-1 flex-wrap justify-end max-w-[240px]">
                    {resource.interviewLevels.map((il, i) => (
                        <InterviewLevelPill key={i} level={il.level} status={il.status} />
                    ))}
                </div>

                <div className={`hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${overallCfg.bg} ${overallCfg.text} ${overallCfg.border} ml-2 flex-shrink-0`}>
                    {resource.overallStatus}
                </div>

                <div className="w-20 flex-shrink-0 hidden lg:block ml-2">
                    <MiniProgress cleared={clearedCount} total={resource.interviewLevels.length} />
                </div>

                <ChevronDown className={`w-4 h-4 text-gray-400 flex-shrink-0 transition-transform duration-200 ml-1 ${isOpen ? "rotate-180" : ""}`} />
            </button>

            {isOpen && (
                <div className="border-t border-gray-100 bg-gray-50/50 p-4 space-y-4">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div className="flex items-center gap-2 text-xs text-gray-600">
                            <Mail className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                            <span className="truncate">{resource.email}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-600">
                            <Phone className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                            <span>{resource.phone}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-600">
                            <MapPin className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                            <span>{resource.location}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-600">
                            <Briefcase className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                            <span>{resource.experience} yr exp{resource.company ? ` · ${resource.company}` : ""}</span>
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-1.5">
                        {resource.skills.map((s, i) => (
                            <span key={i} className="px-2 py-0.5 bg-white border border-gray-200 text-gray-700 text-xs rounded-md font-medium shadow-sm">
                                {s}
                            </span>
                        ))}
                    </div>

                    <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2.5">Interview Journey</p>
                        <div className="space-y-2">
                            {resource.interviewLevels.map((il, i) => {
                                const cfg = LEVEL_STATUS_CONFIG[il.status] || LEVEL_STATUS_CONFIG.Scheduled;
                                const Icon = cfg.icon;
                                return (
                                    <div key={i} className={`flex items-center gap-2 px-3 py-2 rounded-lg ${cfg.bg} ${cfg.text}`}>
                                        <Icon className="w-3.5 h-3.5 flex-shrink-0" />
                                        <span className="text-xs font-bold w-16 flex-shrink-0">{il.level}</span>
                                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-white/60">{il.status}</span>
                                        <span className="flex items-center gap-1 text-xs opacity-70 ml-auto">
                                            <UserCheck className="w-3 h-3" />{il.interviewer}
                                        </span>
                                        <span className="flex items-center gap-1 text-xs opacity-70">
                                            <Calendar className="w-3 h-3" />{il.date}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

/* ─────────────────────────────────────────────────────────────── */
/*  DEMAND ROW                                                      */
/* ─────────────────────────────────────────────────────────────── */
const DemandRow = ({ demand, isExpanded, onToggle }) => {
    // FIX 1: accordion state for resources — only one open at a time
    const [expandedResourceId, setExpandedResourceId] = useState(null);
    // FIX 2: search state for resources
    const [resourceSearch, setResourceSearch] = useState("");

    const handleResourceToggle = (id) => {
        setExpandedResourceId(prev => (prev === id ? null : id));
    };

    // filter resources by search term (name, id, skill)
    const filteredResources = useMemo(() => {
        if (!resourceSearch.trim()) return demand.resources;
        const t = resourceSearch.toLowerCase();
        return demand.resources.filter(r =>
            r.name.toLowerCase().includes(t) ||
            r.resourceId.toLowerCase().includes(t) ||
            r.skills.some(s => s.toLowerCase().includes(t)) ||
            r.location.toLowerCase().includes(t)
        );
    }, [demand.resources, resourceSearch]);

    const internal = demand.resources.filter(r => r.type === "EMPLOYEE").length;
    const external = demand.resources.filter(r => r.type === "CANDIDATE").length;
    const scheduled = demand.resources.filter(r => r.interviewLevels.some(l => l.status === "Scheduled")).length;
    const selected = demand.resources.filter(r => r.overallStatus === "Selected").length;
    const rejected = demand.resources.filter(r => r.overallStatus === "Rejected").length;

    return (
        <div className={`border rounded-2xl overflow-hidden transition-all duration-300 ${isExpanded ? "border-orange-300 shadow-lg" : "border-gray-200 hover:border-orange-200 hover:shadow-md"}`}>
            {/* Demand Header Row */}
            <button
                onClick={onToggle}
                className={`w-full flex items-start gap-4 p-6 text-left transition-colors ${isExpanded ? "bg-orange-50 border-b border-orange-100" : "bg-white hover:bg-orange-50/30"}`}
            >
                <div className={`mt-0.5 w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${isExpanded ? "bg-orange-500" : "bg-gray-100"}`}>
                    <ChevronRight className={`w-3.5 h-3.5 transition-transform duration-200 ${isExpanded ? "rotate-90 text-white" : "text-gray-500"}`} />
                </div>

                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="font-mono text-xs text-orange-600 font-bold bg-orange-50 px-2 py-0.5 rounded border border-orange-100">{demand.id}</span>
                        <h3 className="text-base font-bold text-gray-900 leading-snug">{demand.name}</h3>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 mt-1">
                        <span className="flex items-center gap-1"><Building2 className="w-3 h-3" />{demand.client}</span>
                        <span className="flex items-center gap-1"><Briefcase className="w-3 h-3" />{demand.project}</span>
                        <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />Due: {demand.fulfilmentDt}</span>
                    </div>
                </div>

                <div className="hidden md:flex flex-wrap items-center gap-2 flex-shrink-0 mr-2">
                    <StatPill label="Requested" value={demand.totalRequested} color="indigo" />
                    <StatPill label="Internal" value={internal} color="blue" />
                    <StatPill label="External" value={external} color="purple" />
                    <StatPill label="Scheduled" value={scheduled} color="amber" />
                    <StatPill label="Selected" value={selected} color="emerald" />
                    <StatPill label="Rejected" value={rejected} color="red" />
                </div>

                {/* FIX 3: Both badges use the same component with uniform sizing */}
                <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                    <StatusBadge status={demand.status} config={STATUS_CONFIG} />
                    <PriorityBadge priority={demand.priority} />
                </div>
            </button>

            {/* Stats row (mobile) */}
            <div className="md:hidden flex flex-wrap gap-2 px-6 py-3 bg-white border-t border-gray-100">
                <StatPill label="Requested" value={demand.totalRequested} color="indigo" />
                <StatPill label="Int" value={internal} color="blue" />
                <StatPill label="Ext" value={external} color="purple" />
                <StatPill label="Scheduled" value={scheduled} color="amber" />
                <StatPill label="Selected" value={selected} color="emerald" />
                <StatPill label="Rejected" value={rejected} color="red" />
            </div>

            {/* Expanded Panel */}
            {isExpanded && (
                <div className="border-t border-orange-100 bg-white">
                    <div className="p-5 pl-10 pb-4 grid grid-cols-2 sm:grid-cols-4 gap-4 border-b border-gray-100 bg-orange-50/20">
                        <InfoBlock label="Demand Opened" value={demand.demandOpenDt} />
                        <InfoBlock label="Target Fulfillment" value={demand.fulfilmentDt} />
                        <InfoBlock label="Total Requests" value={demand.statusSummary.totalRequests} />
                        <InfoBlock label="Total Interviews" value={demand.statusSummary.totalInterviews} />
                        <div className="col-span-2 sm:col-span-4">
                            <p className="text-xs text-gray-500 font-medium mb-1">Description</p>
                            <p className="text-sm text-gray-700">{demand.description}</p>
                        </div>
                    </div>

                    <div className="px-6 py-4 flex flex-wrap gap-2 border-b border-gray-100">
                        {[
                            { label: "Selected", value: demand.statusSummary.selected, color: "emerald" },
                            { label: "Rejected", value: demand.statusSummary.rejected, color: "red" },
                            { label: "Allocated", value: demand.statusSummary.allocated, color: "indigo" },
                            { label: "Onboarded", value: demand.statusSummary.onboarded, color: "teal" },
                            { label: "Internal", value: internal, color: "blue" },
                            { label: "External", value: external, color: "purple" },
                        ].map((s, i) => (
                            <SummaryPill key={i} {...s} />
                        ))}
                    </div>

                    {/* Resource List */}
                    <div className="p-5 pl-10">
                        {/* Header + search */}
                        <div className="flex items-center justify-between mb-3 flex-wrap gap-3">
                            <p className="text-sm font-bold text-gray-800 flex items-center gap-2">
                                <Users className="w-4 h-4 text-orange-500" />
                                Candidate / Employee Details
                                <span className="text-xs font-normal text-gray-500">({demand.resources.length} resources)</span>
                            </p>
                            <div className="flex items-center gap-2 flex-wrap">
                                <span className="flex items-center gap-1 text-xs px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full font-medium">
                                    <span className="w-2 h-2 rounded-full bg-blue-500" /> {internal} Internal
                                </span>
                                <span className="flex items-center gap-1 text-xs px-2 py-0.5 bg-purple-50 text-purple-600 rounded-full font-medium">
                                    <span className="w-2 h-2 rounded-full bg-purple-500" /> {external} External
                                </span>
                            </div>
                        </div>

                        {/* FIX 2: Resource search bar */}
                        <div className="relative mb-3">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                            <input
                                type="text"
                                placeholder="Search by name, ID, skill or location…"
                                value={resourceSearch}
                                onChange={e => {
                                    setResourceSearch(e.target.value);
                                    setExpandedResourceId(null);
                                }}
                                className="w-full pl-10 pr-8 py-2 border border-gray-200 rounded-xl text-sm text-gray-700 bg-gray-50 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-orange-400 transition-all"
                            />
                            {resourceSearch && (
                                <button
                                    onClick={() => { setResourceSearch(""); setExpandedResourceId(null); }}
                                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-500"
                                >
                                    <X className="w-3.5 h-3.5" />
                                </button>
                            )}
                        </div>

                        {filteredResources.length === 0 ? (
                            <div className="py-8 text-center text-sm text-gray-400">
                                No resources match &ldquo;{resourceSearch}&rdquo;
                            </div>
                        ) : (
                            <div
                                className="space-y-3 overflow-y-auto max-h-[420px]"
                                style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
                            >
                                {filteredResources.map((r) => (
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
/*  SMALL SHARED COMPONENTS                                         */
/* ─────────────────────────────────────────────────────────────── */
const StatPill = ({ label, value, color }) => {
    const colors = {
        indigo: "bg-indigo-50 text-indigo-700 border-indigo-200",
        blue: "bg-blue-50 text-blue-700 border-blue-200",
        purple: "bg-purple-50 text-purple-700 border-purple-200",
        amber: "bg-amber-50 text-amber-700 border-amber-200",
        emerald: "bg-emerald-50 text-emerald-700 border-emerald-200",
        red: "bg-red-50 text-red-700 border-red-200",
        teal: "bg-teal-50 text-teal-700 border-teal-200",
    };
    return (
        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg border text-xs font-semibold ${colors[color]}`}>
            <span className="font-bold text-sm">{value}</span>
            <span className="font-normal opacity-80">{label}</span>
        </span>
    );
};

const InfoBlock = ({ label, value }) => (
    <div>
        <p className="text-xs text-gray-400 font-medium mb-0.5">{label}</p>
        <p className="text-sm font-semibold text-gray-800">{value}</p>
    </div>
);

const SummaryPill = ({ label, value, color }) => {
    const colors = {
        emerald: "bg-emerald-50 text-emerald-700 border-emerald-200",
        red: "bg-red-50 text-red-700 border-red-200",
        indigo: "bg-indigo-50 text-indigo-700 border-indigo-200",
        teal: "bg-teal-50 text-teal-700 border-teal-200",
        blue: "bg-blue-50 text-blue-700 border-blue-200",
        purple: "bg-purple-50 text-purple-700 border-purple-200",
    };
    return (
        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold ${colors[color]}`}>
            <span className="font-bold text-sm">{value}</span>
            <span className="font-normal opacity-75">{label}</span>
        </span>
    );
};

/* ─────────────────────────────────────────────────────────────── */
/*  MAIN PAGE                                                       */
/* ─────────────────────────────────────────────────────────────── */
const ITEMS_PER_PAGE_OPTIONS = [5, 10, 20];

export default function PortfolioReportsPage() {
    // ── filter state ──────────────────────────────────────────────
    const [selectedClient, setSelectedClient] = useState("All Clients");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("All");
    const [priorityFilter, setPriorityFilter] = useState("All");
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [expandedDemandId, setExpandedDemandId] = useState(null);

    // ── API data state ────────────────────────────────────────────
    const [allDemands, setAllDemands] = useState([]);   // transformed from DemandFlowList
    const [clientList, setClientList] = useState(["All Clients"]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [detailedExporting, setDetailedExporting] = useState(false);

    // ── Email modal state (same as dashboard) ──
const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
const [toEmail, setToEmails] = useState([]);
const [ccEmail, setCcEmails] = useState([]);
const [showCc, setShowCc] = useState(false);
const [isSending, setIsSending] = useState(false);
const [showSuccess, setShowSuccess] = useState(false);

    // ── 1 + 2 + 3: Load DemandFlowList, EmployeeFlows, CandidateFlows on mount ──
    useEffect(() => {
        const today = new Date().toISOString().split("T")[0];
        const threeMonthsAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
            .toISOString().split("T")[0];

        const loadAll = async () => {
            setLoading(true);
            setError(null);
            try {
                // API 1: demand flow list (date range: last 90 days → today)
                const [demandRes, empRes, candRes] = await Promise.all([
                    PortfolioReportService.fetchDemandFlowList(threeMonthsAgo, today, 100),
                    PortfolioReportService.fetchEmployeeFlows(0, 10000),
                    PortfolioReportService.fetchCandidateFlows(0, 300),
                ]);

                // Build employee & candidate lookup maps for enriching resources
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

                // Transform demands and enrich resource skills/location from maps
                const rawList = demandRes.data?.result || [];
                const demands = rawList.map(item => {
                    const d = transformDemandFlow(item);
                    d.resources = d.resources.map(r => {
                        const isEmp = r.type === "EMPLOYEE";
                        const lookup = isEmp
                            ? empMap[parseInt(r.resourceId.replace("EMP-", ""))]
                            : candMap[parseInt(r.resourceId.replace("CAD-", ""))];
                        if (lookup) {
                            r.skills = lookup.skills;
                            r.location = lookup.location;
                            r.experience = lookup.experience;
                        }
                        return r;
                    });
                    return d;
                });

                // Derive unique client list for the filter dropdown
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

    // ── Client-side filtering (mirrors original logic, now on live data) ──
    const filtered = useMemo(() => {
        let list = allDemands;
        if (selectedClient !== "All Clients")
            list = list.filter(d => d.client === selectedClient);
        if (startDate)
            list = list.filter(d => new Date(d.demandOpenDt) >= new Date(startDate));
        if (endDate)
            list = list.filter(d => new Date(d.demandOpenDt) <= new Date(endDate));
        if (statusFilter !== "All")
            list = list.filter(d => d.status === statusFilter);
        if (priorityFilter !== "All")
            list = list.filter(d => d.priority === priorityFilter);
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
    const paginated = useMemo(() => {
        const start = (currentPage - 1) * itemsPerPage;
        return filtered.slice(start, start + itemsPerPage);
    }, [filtered, currentPage, itemsPerPage]);

    const kpis = useMemo(() => {
        const totalInternal = filtered.reduce((s, d) => s + d.resources.filter(r => r.type === "EMPLOYEE").length, 0);
        const totalExternal = filtered.reduce((s, d) => s + d.resources.filter(r => r.type === "CANDIDATE").length, 0);
        const totalSelected = filtered.reduce((s, d) => s + d.resources.filter(r => r.overallStatus === "Selected").length, 0);
        const totalScheduled = filtered.reduce((s, d) => s + d.resources.filter(r => r.interviewLevels.some(l => l.status === "Scheduled")).length, 0);
        return { total: filtered.length, totalInternal, totalExternal, totalSelected, totalScheduled };
    }, [filtered]);

    const clearFilters = () => {
        setSelectedClient("All Clients");
        setStartDate("");
        setEndDate("");
        setSearchTerm("");
        setStatusFilter("All");
        setPriorityFilter("All");
        setCurrentPage(1);
    };

    const hasActiveFilters = selectedClient !== "All Clients" || startDate || endDate || searchTerm || statusFilter !== "All" || priorityFilter !== "All";

// ── Detailed Export — new 3-sheet Excel ──
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
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
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

// ── Email handlers — same as dashboard ──
const handleOpenEmailModal = () => {
    setIsEmailModalOpen(true);
    setToEmails([]); setCcEmails([]); setShowCc(false);
};

const handleGenerateEmailReport = async (emailData = { toEmail: [], ccEmail: [] }) => {
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
           demandIds: filtered.map(d => d._demandId).filter(Boolean),  // exact filtered IDs
           ...emailData,
       };
        const result = await PortfolioReportService.generateEmailReport(payload);
        if (result?.success) {
            // success handled in handleSendEmail
        }
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
    return (
        <div className="min-h-screen bg-transparent p-6 md:p-8">
            {/* Page Header */}
            <div className="mb-6">
                <div className="flex items-start justify-between flex-wrap gap-4">
                    <div>
                        <div className="flex items-center gap-3 mb-1">
                            <div className="w-10 h-10 rounded-xl bg-white border-2 border-orange-400 flex items-center justify-center shadow-md flex-shrink-0">
                                <FileText className="w-5 h-5 text-orange-500" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-extrabold text-white tracking-tight">Demand Reports</h1>
                                <p className="text-sm text-white/70">Detailed resource & interview breakdown per demand</p>
                            </div>
                        </div>
                    </div>
                    {/* Export button — wired to API 5 */}
                    {/* Action buttons */}
                        <div className="flex items-center gap-3">
                            <button
                            onClick={handleOpenEmailModal}
                            disabled={loading}
                            className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-green-600 bg-white border-2 border-green-400 rounded-xl shadow-md hover:bg-green-50 hover:border-green-500 transition-all duration-200 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
                            Generate Report
                        </button>

                        <button
                            onClick={handleDetailedExport}
                            disabled={detailedExporting}
                            className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-orange-600 bg-white border-2 border-orange-400 rounded-xl shadow-md hover:bg-orange-50 hover:border-orange-500 transition-all duration-200 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                            {detailedExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileSpreadsheet className="w-4 h-4" />}
                            {detailedExporting ? "Generating…" : "Export Report"}
                        </button>
                        </div>
                </div>
            </div>

            {/* Loading / Error states */}
            {loading && (
                <div className="flex items-center justify-center py-16 text-orange-500">
                    <RefreshCw className="w-6 h-6 animate-spin mr-2" />
                    <span className="text-sm font-medium">Loading demands…</span>
                </div>
            )}
            {error && !loading && (
                <div className="bg-red-50 border border-red-200 rounded-2xl p-4 mb-6 flex items-center gap-3 text-red-700 text-sm">
                    <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                    {error}
                </div>
            )}

            {/* KPI Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
                {[
                    { label: "Active Demands", value: kpis.total, icon: Target, iconColor: "text-orange-500", valueColor: "text-orange-600" },
                    { label: "Internal Resources", value: kpis.totalInternal, icon: UserCheck, iconColor: "text-blue-500", valueColor: "text-blue-600" },
                    { label: "External Resources", value: kpis.totalExternal, icon: Users, iconColor: "text-purple-500", valueColor: "text-purple-600" },
                    { label: "Interviews Ongoing", value: kpis.totalScheduled, icon: Clock, iconColor: "text-amber-500", valueColor: "text-red-500" },
                    { label: "Selected", value: kpis.totalSelected, icon: Award, iconColor: "text-emerald-500", valueColor: "text-emerald-600" },
                ].map((k, i) => {
                    const Icon = k.icon;
                    return (
                        <div key={i} className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex items-center gap-2 mb-2">
                                <Icon className={`w-4 h-4 ${k.iconColor}`} />
                                <p className="text-sm text-gray-600 font-medium">{k.label}</p>
                            </div>
                            <p className={`text-2xl font-bold ${k.valueColor}`}>{k.value}</p>
                        </div>
                    );
                })}
            </div>

            {/* Filters Card */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 mb-6">
                <div className="flex items-center gap-2 mb-4">
                    <Filter className="w-4 h-4 text-orange-500" />
                    <span className="text-sm font-bold text-gray-700">Filters</span>
                    {hasActiveFilters && (
                        <button onClick={clearFilters} className="ml-auto flex items-center gap-1 text-xs text-red-500 hover:text-red-700 font-medium transition-colors">
                            <X className="w-3 h-3" /> Clear all
                        </button>
                    )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                    {/* Client — now populated from live API data */}
                    <div className="xl:col-span-1">
                        <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Client</label>
                        <select value={selectedClient} onChange={e => { setSelectedClient(e.target.value); setCurrentPage(1); }}
                            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-700 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-orange-400 transition-all">
                            {clientList.map(c => <option key={c}>{c}</option>)}
                        </select>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Demand From</label>
                        <div className="relative">
                            <input type="date" value={startDate} onChange={e => { setStartDate(e.target.value); setCurrentPage(1); }}
                                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-700 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-orange-400 transition-all" />
                            {startDate && <button onClick={() => setStartDate("")} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-500"><X className="w-3 h-3" /></button>}
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Demand To</label>
                        <div className="relative">
                            <input type="date" value={endDate} onChange={e => { setEndDate(e.target.value); setCurrentPage(1); }}
                                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-700 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-orange-400 transition-all" />
                            {endDate && <button onClick={() => setEndDate("")} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-500"><X className="w-3 h-3" /></button>}
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Status</label>
                        <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setCurrentPage(1); }}
                            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-700 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-orange-400 transition-all">
                            {["All", "Open", "InProgress", "Completed", "On Hold"].map(s => <option key={s}>{s}</option>)}
                        </select>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Priority</label>
                        <select value={priorityFilter} onChange={e => { setPriorityFilter(e.target.value); setCurrentPage(1); }}
                            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-700 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-orange-400 transition-all">
                            {["All", "High", "Medium", "Low"].map(p => <option key={p}>{p}</option>)}
                        </select>
                    </div>

                    <div className="sm:col-span-2 lg:col-span-1 xl:col-span-1">
                        <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Search</label>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                            <input type="text" placeholder="Demand, client, project…" value={searchTerm}
                                onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                                className="w-full pl-10 pr-8 py-2 border border-gray-200 rounded-xl text-sm text-gray-700 bg-gray-50 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-orange-400 transition-all" />
                            {searchTerm && (
                                <button onClick={() => setSearchTerm("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-500">
                                    <X className="w-3.5 h-3.5" />
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Results header */}
            <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
                <div className="flex items-center gap-3">
                    <p className="text-sm text-gray-600">
                        Showing <span className="font-bold text-gray-900">{paginated.length}</span> of <span className="font-bold text-gray-900">{filtered.length}</span> demands
                    </p>
                    {hasActiveFilters && (
                        <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-medium">Filtered</span>
                    )}
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                    <span>Show</span>
                    <select value={itemsPerPage} onChange={e => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                        className="border border-gray-200 rounded-lg px-2 py-1 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-orange-300">
                        {ITEMS_PER_PAGE_OPTIONS.map(n => <option key={n}>{n}</option>)}
                    </select>
                    <span>per page</span>
                </div>
            </div>

            {/* Demand List */}
            {!loading && paginated.length === 0 ? (
                <div className="bg-white rounded-2xl border border-gray-200 p-16 text-center shadow-sm">
                    <AlertTriangle className="w-12 h-12 text-orange-300 mx-auto mb-4" />
                    <p className="text-gray-500 font-medium">No demands match your filters.</p>
                    <button onClick={clearFilters} className="mt-3 text-sm text-orange-500 hover:text-orange-700 font-semibold">Clear filters</button>
                </div>
            ) : (
                <div className="space-y-4">
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

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="mt-6 flex items-center justify-between bg-white border border-gray-200 rounded-2xl px-5 py-3 shadow-sm">
                    <p className="text-sm text-gray-500">
                        Page <span className="font-bold text-gray-800">{currentPage}</span> of <span className="font-bold text-gray-800">{totalPages}</span>
                    </p>
                    <div className="flex items-center gap-1.5">
                        <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}
                            className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-orange-50 hover:border-orange-300 hover:text-orange-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all">
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
                                        className={`w-8 h-8 rounded-lg border text-sm font-semibold transition-all ${currentPage === p ? "bg-orange-500 border-orange-500 text-white shadow-sm" : "border-gray-200 text-gray-600 hover:bg-orange-50 hover:border-orange-300 hover:text-orange-600"}`}>
                                        {p}
                                    </button>
                                )
                            )}
                        <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}
                            className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-orange-50 hover:border-orange-300 hover:text-orange-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all">
                            <ChevronRightIcon className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )}

            {/* ── SUCCESS NOTIFICATION ── */}
{showSuccess && (
    <div className="fixed top-6 left-1/2 -translate-x-1/2 bg-white border border-green-100 text-green-800 px-6 py-3 rounded-full shadow-xl flex items-center gap-3 z-50">
        <CheckCircle className="w-4 h-4 text-green-600" />
        <span className="text-sm font-medium">Report sent successfully</span>
    </div>
)}

{/* ── EMAIL MODAL ── */}
{isEmailModalOpen && (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-gray-900/20 backdrop-blur-sm" onClick={() => setIsEmailModalOpen(false)} />
        <div className="relative bg-white w-full max-w-[500px] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">

            {/* Header */}
            <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center">
                <div>
                    <h3 className="text-lg font-bold text-gray-900">Share Demand Report</h3>
                    <p className="text-xs text-gray-500 mt-0.5">Send via email</p>
                </div>
                <button onClick={() => setIsEmailModalOpen(false)} className="text-gray-400 hover:text-gray-600 p-2 rounded-full hover:bg-gray-50 transition-all">
                    <X className="w-5 h-5" />
                </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-6 overflow-y-auto">
                <EmailChipInput
                    label="Recipients"
                    emails={toEmail}
                    setEmails={setToEmails}
                    placeholder="Add people..."
                    autoFocus={true}
                    rightLabelAction={
                        !showCc && (
                            <button onClick={() => setShowCc(true)} className="text-xs font-semibold text-orange-500 hover:text-orange-600 hover:bg-orange-50 px-2 py-1 rounded transition-colors">
                                + CC
                            </button>
                        )
                    }
                />
                {showCc && (
                    <EmailChipInput
                        label="CC"
                        emails={ccEmail}
                        setEmails={setCcEmails}
                        placeholder="Add CC..."
                        rightLabelAction={
                            <button onClick={() => setShowCc(false)} className="text-xs text-gray-400 hover:text-gray-600">Remove</button>
                        }
                    />
                )}
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 flex items-center gap-4">
                    <div className="w-10 h-10 bg-white rounded-lg border border-gray-200 flex items-center justify-center shadow-sm">
                        <FileText className="w-5 h-5 text-orange-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-semibold text-gray-900 truncate">
                            Demand_Report_{startDate || 'All'}_to_{endDate || 'All'}.pdf
                        </h4>
                        <p className="text-xs text-gray-500 mt-0.5">Generated Report • PDF</p>
                    </div>
                    <div className="w-2 h-2 bg-green-500 rounded-full" />
                </div>
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-gray-100 bg-gray-50/50 flex justify-between items-center">
                <p className="text-xs text-gray-500 font-medium">{toEmail.length + ccEmail.length} recipient(s)</p>
                <div className="flex gap-3">
                    <button onClick={() => setIsEmailModalOpen(false)}
                        className="px-5 py-2.5 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-all shadow-sm">
                        Cancel
                    </button>
                    <button onClick={handleSendEmail} disabled={isSending || toEmail.length === 0}
                        className="px-6 py-2.5 text-sm font-medium text-white bg-orange-500 rounded-xl hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed shadow-md transition-all flex items-center gap-2 active:scale-95">
                        {isSending ? <><Loader2 className="w-4 h-4 animate-spin" /><span>Sending...</span></> : <><span>Send</span><Send className="w-3.5 h-3.5" /></>}
                    </button>
                </div>
            </div>
        </div>
    </div>
)}
        </div>
    );
}
