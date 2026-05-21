import React, { useState, useMemo, useRef, useEffect, useCallback } from "react";
import { PortfolioReportService } from '../services/PortfolioReportServices';
import { ClientService } from '../services/clientListService';
import { DemandService } from '../services/DemandService';
import { toast } from 'sonner';
import {
    Search, Filter, ChevronDown, ChevronRight, Calendar, Users, Target,
    CheckCircle, XCircle, Clock, AlertTriangle, Download, RefreshCw,
    TrendingUp, Award, UserCheck, UserX, Briefcase, BarChart2,
    ChevronLeft, ChevronRight as ChevronRightIcon, FileText, X, Circle,
    Building2, Mail, Phone, MapPin, Star, Send, Loader2, History,
    ArrowUpDown, ArrowUp, ArrowDown
} from "lucide-react";

/* ─────────────────────────────────────────────────────────────── */
/*  API → UI DATA TRANSFORMER                                       */
/*  Maps DemandFlowList response shape to our Grid/Drawer shape.    */
/* ─────────────────────────────────────────────────────────────── */
const transformDemandFlow = (item) => {
    const resources = [];
    (item.childRequestDetails || []).forEach(req => {
        (req.pipeline || []).forEach(pipe => {
            const ci = pipe.candidateInfo || {};
            const isEmployee = ci.resourceType === "EMPLOYEE";
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
        _accountId: item.contextInfo?.accountId || null,
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
    Open: { bg: "bg-blue-100", text: "text-blue-700", border: "border-blue-200" },
    InProgress: { bg: "bg-amber-100", text: "text-amber-700", border: "border-amber-200" },
    Completed: { bg: "bg-emerald-100", text: "text-emerald-700", border: "border-emerald-200" },
    Closed: { bg: "bg-gray-150 border-gray-300 text-gray-700" },
    Rejected: { bg: "bg-red-100", text: "text-red-700", border: "border-red-200" },
    "On Hold": { bg: "bg-purple-100", text: "text-purple-700", border: "border-purple-200" },
};

const PRIORITY_CONFIG = {
    High: { bg: "bg-red-100 text-red-700 border-red-200" },
    Medium: { bg: "bg-amber-100 text-amber-700 border-amber-200" },
    Low: { bg: "bg-emerald-100 text-emerald-700 border-emerald-200" },
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
    const [inputValue, setInputValue] = useState('');
    const [error, setError] = useState('');
    const [isFocused, setIsFocused] = useState(false);
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
/*  DETAILED SIDE DRAWER FOR PIPELINE                              */
/* ─────────────────────────────────────────────────────────────── */
const DemandDetailDrawer = ({ demand, onClose }) => {
    const [resourceSearch, setResourceSearch] = useState("");
    const [expandedResourceId, setExpandedResourceId] = useState(null);

    const internalCount = demand.resources.filter(r => r.type === "EMPLOYEE").length;
    const externalCount = demand.resources.filter(r => r.type === "CANDIDATE").length;

    const filteredResources = useMemo(() => {
        if (!resourceSearch.trim()) return demand.resources;
        const query = resourceSearch.toLowerCase();
        return demand.resources.filter(r =>
            r.name.toLowerCase().includes(query) ||
            r.resourceId.toLowerCase().includes(query) ||
            (r.skills || []).some(s => s.toLowerCase().includes(query)) ||
            (r.location || "").toLowerCase().includes(query)
        );
    }, [demand.resources, resourceSearch]);

    return (
        <div className="fixed inset-0 z-50 overflow-hidden">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity" onClick={onClose} />
            <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
                <div className="w-screen max-w-2xl bg-white/95 backdrop-blur-md shadow-2xl flex flex-col transform transition-transform duration-300 ease-in-out drawer-slide-in">
                    
                    {/* Header */}
                    <div className="px-6 py-5 border-b border-gray-200 flex justify-between items-start bg-orange-50/50">
                        <div className="flex-1 min-w-0 pr-4">
                            <span className="font-mono text-xs text-orange-600 font-bold bg-orange-50 px-2 py-0.5 rounded border border-orange-200">{demand.id}</span>
                            <h2 className="text-xl font-bold text-gray-900 mt-2">{demand.name}</h2>
                            <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 mt-1">
                                <span className="flex items-center gap-1 font-semibold text-gray-700"><Building2 className="w-3.5 h-3.5 text-gray-400" />{demand.client}</span>
                                <span className="text-gray-300">|</span>
                                <span className="flex items-center gap-1"><Briefcase className="w-3.5 h-3.5 text-gray-400" />{demand.project}</span>
                            </div>
                        </div>
                        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-2 rounded-full hover:bg-white transition-all border border-transparent hover:border-gray-200">
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Drawer Content Body */}
                    <div className="flex-1 overflow-y-auto p-6 space-y-6">
                        
                        {/* Summary Cards */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            <div className="bg-gray-50 p-3 rounded-xl border border-gray-200">
                                <p className="text-xs text-gray-400 font-medium mb-0.5">Due Date</p>
                                <p className="text-sm font-semibold text-gray-800">{demand.fulfilmentDt}</p>
                            </div>
                            <div className="bg-gray-50 p-3 rounded-xl border border-gray-200">
                                <p className="text-xs text-gray-400 font-medium mb-0.5">Opened Date</p>
                                <p className="text-sm font-semibold text-gray-800">{demand.demandOpenDt}</p>
                            </div>
                            <div className="bg-gray-50 p-3 rounded-xl border border-gray-200">
                                <p className="text-xs text-gray-400 font-medium mb-0.5">Total Requests</p>
                                <p className="text-sm font-semibold text-gray-800">{demand.statusSummary.totalRequests}</p>
                            </div>
                            <div className="bg-gray-50 p-3 rounded-xl border border-gray-200">
                                <p className="text-xs text-gray-400 font-medium mb-0.5">Total Interviews</p>
                                <p className="text-sm font-semibold text-gray-800">{demand.statusSummary.totalInterviews}</p>
                            </div>
                        </div>

                        {/* Description */}
                        {demand.description && (
                            <div className="bg-orange-50/20 p-4 rounded-xl border border-orange-100">
                                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Description</p>
                                <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">{demand.description}</p>
                            </div>
                        )}

                        {/* Pipeline Status Summary */}
                        <div className="border border-gray-100 rounded-2xl bg-gray-50/30 p-4 space-y-3">
                            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Pipeline Stats</p>
                            <div className="flex flex-wrap gap-2">
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg border bg-emerald-50 text-emerald-700 border-emerald-200 text-xs font-bold">
                                    <span className="text-sm">{demand.statusSummary.selected}</span> Selected
                                </span>
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg border bg-red-50 text-red-700 border-red-200 text-xs font-bold">
                                    <span className="text-sm">{demand.statusSummary.rejected}</span> Rejected
                                </span>
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg border bg-indigo-50 text-indigo-700 border-indigo-200 text-xs font-bold">
                                    <span className="text-sm">{demand.statusSummary.allocated}</span> Allocated
                                </span>
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg border bg-teal-50 text-teal-700 border-teal-200 text-xs font-bold">
                                    <span className="text-sm">{demand.statusSummary.onboarded}</span> Onboarded
                                </span>
                            </div>
                        </div>

                        {/* Candidates Section */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between flex-wrap gap-3">
                                <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
                                    <Users className="w-4 h-4 text-orange-500" />
                                    Candidates / Resources List
                                    <span className="text-xs font-normal text-gray-500">({demand.resources.length} total)</span>
                                </h3>
                                <div className="flex gap-2">
                                    <span className="text-xs px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full font-semibold">{internalCount} Internal</span>
                                    <span className="text-xs px-2 py-0.5 bg-purple-50 text-purple-600 rounded-full font-semibold">{externalCount} External</span>
                                </div>
                            </div>

                            {/* Resource Search */}
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                                <input
                                    type="text"
                                    placeholder="Search by candidate name, ID, skill or location…"
                                    value={resourceSearch}
                                    onChange={e => {
                                        setResourceSearch(e.target.value);
                                        setExpandedResourceId(null);
                                    }}
                                    className="w-full pl-10 pr-8 py-2 border border-gray-200 rounded-xl text-sm text-gray-700 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-orange-400 transition-all shadow-sm"
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

                            {/* Resource Cards */}
                            {filteredResources.length === 0 ? (
                                <div className="py-12 text-center text-sm text-gray-400 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                                    No candidates match &ldquo;{resourceSearch}&rdquo;
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {filteredResources.map((resource) => {
                                        const overallCfg = OVERALL_STATUS_CONFIG[resource.overallStatus] || OVERALL_STATUS_CONFIG["In Progress"];
                                        const isInternal = resource.type === "EMPLOYEE";
                                        const clearedCount = resource.interviewLevels.filter(l => l.status === "Selected" || l.status === "Completed").length;
                                        const isCardOpen = expandedResourceId === resource.id;

                                        return (
                                            <div
                                                key={resource.id}
                                                className={`border rounded-xl overflow-hidden bg-white transition-all duration-200 ${isCardOpen ? "border-orange-300 shadow-md" : "border-gray-200 hover:border-orange-200 hover:shadow-sm"}`}
                                            >
                                                <button
                                                    onClick={() => setExpandedResourceId(isCardOpen ? null : resource.id)}
                                                    className="w-full flex items-center gap-3 p-3.5 text-left hover:bg-orange-50/20 transition-colors"
                                                >
                                                    <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${isInternal ? "bg-blue-100 text-blue-700" : "bg-purple-100 text-purple-700"}`}>
                                                        {resource.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                                                    </div>

                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2 flex-wrap">
                                                            <p className="text-sm font-semibold text-gray-900 truncate">{resource.name}</p>
                                                            <span className={`text-[10px] px-1.5 py-0.2 rounded font-medium ${isInternal ? "bg-blue-50 text-blue-600" : "bg-purple-50 text-purple-600"}`}>
                                                                {isInternal ? "Internal" : "External"}
                                                            </span>
                                                        </div>
                                                        <p className="text-[11px] text-gray-400 font-mono mt-0.5">{resource.resourceId}</p>
                                                    </div>

                                                    <div className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${overallCfg.bg} ${overallCfg.text} ${overallCfg.border} ml-2 flex-shrink-0`}>
                                                        {resource.overallStatus}
                                                    </div>

                                                    <ChevronDown className={`w-4 h-4 text-gray-400 flex-shrink-0 transition-transform duration-200 ml-1 ${isCardOpen ? "rotate-180" : ""}`} />
                                                </button>

                                                {isCardOpen && (
                                                    <div className="border-t border-gray-100 bg-gray-50/50 p-4 space-y-4">
                                                        <div className="grid grid-cols-2 gap-3">
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

                                                        {resource.skills && resource.skills.length > 0 && (
                                                            <div className="flex flex-wrap gap-1.5">
                                                                {resource.skills.map((s, i) => (
                                                                    <span key={i} className="px-2 py-0.5 bg-white border border-gray-200 text-gray-700 text-xs rounded font-medium shadow-sm">
                                                                        {s}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        )}

                                                        <div>
                                                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2.5">Interview Journey</p>
                                                            {resource.interviewLevels.length === 0 ? (
                                                                <p className="text-xs text-gray-400 italic">No interview steps scheduled.</p>
                                                            ) : (
                                                                <div className="space-y-2">
                                                                    {resource.interviewLevels.map((il, i) => {
                                                                        const cfg = LEVEL_STATUS_CONFIG[il.status] || LEVEL_STATUS_CONFIG.Scheduled;
                                                                        const Icon = cfg.icon;
                                                                        return (
                                                                            <div key={i} className={`flex items-center gap-2 px-3 py-2 rounded-lg ${cfg.bg} ${cfg.text}`}>
                                                                                <Icon className="w-3.5 h-3.5 flex-shrink-0" />
                                                                                <span className="text-xs font-bold w-14 flex-shrink-0">{il.level}</span>
                                                                                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-white/60">{il.status}</span>
                                                                                <span className="flex items-center gap-1 text-xs opacity-75 ml-auto">
                                                                                    <UserCheck className="w-3 h-3" />{il.interviewer}
                                                                                </span>
                                                                                <span className="flex items-center gap-1 text-xs opacity-75">
                                                                                    <Calendar className="w-3 h-3" />{il.date}
                                                                                </span>
                                                                            </div>
                                                                        );
                                                                    })}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="px-6 py-4 border-t border-gray-200 bg-gray-50/50 flex justify-end">
                        <button
                            onClick={onClose}
                            className="px-5 py-2 text-sm font-semibold text-gray-600 bg-white border border-gray-250 rounded-xl hover:bg-gray-50 transition-all shadow-sm"
                        >
                            Close Details
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

/* ─────────────────────────────────────────────────────────────── */
/*  INTERVIEW LEVEL AUTO-SAVE DROPDOWN                             */
/* ─────────────────────────────────────────────────────────────── */
const InterviewLevelSelect = ({ demandId, value, onChange, isSaving, saveStatus }) => {
    return (
        <div className="relative flex items-center justify-center min-w-[130px]" onClick={(e) => e.stopPropagation()}>
            <select
                value={value || "Not Started"}
                onChange={(e) => onChange(demandId, e.target.value, value)}
                disabled={isSaving}
                className="w-full bg-white border border-gray-300 rounded-lg px-2 py-1.5 text-xs font-semibold text-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-300 focus:border-purple-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer shadow-sm hover:border-gray-400"
            >
                <option value="Not Started">Not Started</option>
                <option value="L1">L1 — Level 1 Interview</option>
                <option value="L2">L2 — Level 2 Interview</option>
                <option value="L3">L3 — Level 3 Interview</option>
                <option value="HR Round">HR Round</option>
                <option value="Final Round">Final Round</option>
                <option value="Completed">Completed</option>
            </select>
            {isSaving && (
                <div className="absolute right-6 top-1/2 -translate-y-1/2 flex items-center pointer-events-none">
                    <Loader2 className="w-3.5 h-3.5 text-purple-600 animate-spin" />
                </div>
            )}
            {saveStatus === 'success' && !isSaving && (
                <div className="absolute right-6 top-1/2 -translate-y-1/2 flex items-center pointer-events-none text-emerald-500">
                    <CheckCircle className="w-3.5 h-3.5 bg-white rounded-full" />
                </div>
            )}
            {saveStatus === 'error' && !isSaving && (
                <div className="absolute right-6 top-1/2 -translate-y-1/2 flex items-center pointer-events-none text-red-500">
                    <XCircle className="w-3.5 h-3.5 bg-white rounded-full" />
                </div>
            )}
        </div>
    );
};

/* ─────────────────────────────────────────────────────────────── */
/*  SORTABLE HEADER HELPER                                         */
/* ─────────────────────────────────────────────────────────────── */
const SortableHeader = ({ label, sortKey, currentSort, onSort, className = "" }) => {
    const isSorted = currentSort.key === sortKey;
    const direction = currentSort.direction;
    return (
        <th
            onClick={() => onSort(sortKey)}
            className={`py-3 px-3 text-left text-slate-800 font-extrabold text-[12px] border-r border-purple-300/20 uppercase tracking-wider cursor-pointer hover:bg-purple-200/50 transition-all select-none ${className}`}
        >
            <div className="flex items-center gap-1 justify-between">
                <span>{label}</span>
                <span className="text-gray-400">
                    {isSorted ? (
                        direction === 'asc' ? <ArrowUp className="w-3 h-3 text-purple-600" /> : <ArrowDown className="w-3 h-3 text-purple-600" />
                    ) : (
                        <ArrowUpDown className="w-3 h-3 opacity-40" />
                    )}
                </span>
            </div>
        </th>
    );
};

/* ─────────────────────────────────────────────────────────────── */
/*  MAIN PAGE                                                       */
/* ─────────────────────────────────────────────────────────────── */
const ITEMS_PER_PAGE_OPTIONS = [10, 25, 50];

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

    // Sorting State
    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

    // Drawer State
    const [drawerDemand, setDrawerDemand] = useState(null);

    // Dropdown Spinner / Save State
    const [savingDropdowns, setSavingDropdowns] = useState({});
    const [saveStatus, setSaveStatus] = useState({});

    // ── API data state ────────────────────────────────────────────
    const [allDemands, setAllDemands] = useState([]);
    const [clientList, setClientList] = useState(["All Clients"]);
    const [clientMap, setClientMap] = useState({});
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [exporting, setExporting] = useState(false);

    // ── Email modal state ──
    const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
    const [toEmail, setToEmails] = useState([]);
    const [ccEmail, setCcEmails] = useState([]);
    const [showCc, setShowCc] = useState(false);
    const [isSending, setIsSending] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);

    // Date formatting helper: DD-MM-YYYY
    const formatDemandDate = (dateString) => {
        if (!dateString || dateString === "—") return "—";
        const matched = dateString.match(/^(\d{4})-(\d{2})-(\d{2})/);
        if (matched) {
            return `${matched[3]}-${matched[2]}-${matched[1]}`;
        }
        const date = new Date(dateString);
        if (isNaN(date)) return dateString;
        const day = String(date.getDate()).padStart(2, "0");
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const year = date.getFullYear();
        return `${day}-${month}-${year}`;
    };

    // ── Fetch unique Clients on mount ─────────────────────────────
    useEffect(() => {
        const fetchClientsList = async () => {
            try {
                const res = await ClientService.fetchClientList();
                if (Array.isArray(res)) {
                    const map = {};
                    const names = ["All Clients"];
                    res.forEach(c => {
                        if (c.accountName && c.accountId) {
                            map[c.accountName] = c.accountId;
                            names.push(c.accountName);
                        }
                    });
                    setClientMap(map);
                    setClientList(names);
                }
            } catch (err) {
                console.error("Failed to load client list on mount:", err);
            }
        };
        fetchClientsList();
    }, []);

    // ── Load DemandFlowList, EmployeeFlows, CandidateFlows from API ──
    const loadDemandsData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const accountId = selectedClient !== "All Clients" ? clientMap[selectedClient] : null;
            let backendStatus = statusFilter;
            if (statusFilter === "All") backendStatus = null;

            // Date bounds
            const today = new Date().toISOString().split("T")[0];
            const threeMonthsAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
                .toISOString().split("T")[0];
            const from = startDate || threeMonthsAgo;
            const to = endDate || today;

            // Call APIs
            const [demandRes, empRes, candRes] = await Promise.all([
                PortfolioReportService.fetchDemandFlowList(from, to, 10000, 0, accountId, backendStatus),
                PortfolioReportService.fetchEmployeeFlows(0, 10000),
                PortfolioReportService.fetchCandidateFlows(0, 300),
            ]);

            // Build lookup maps
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

            // Transform raw list and enrich details
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

                // Load interview level from localStorage fallback or API
                const savedLevel = localStorage.getItem(`demand_interview_level_${d._demandId}`);
                d.interviewLevel = savedLevel || d.interviewLevel || "Not Started";

                return d;
            });

            setAllDemands(demands);
        } catch (err) {
            console.error("Failed to load portfolio report data:", err);
            setError("Failed to load data. Please check API connection.");
        } finally {
            setLoading(false);
        }
    }, [selectedClient, startDate, endDate, statusFilter, clientMap]);

    // Re-fetch on filter changes
    useEffect(() => {
        loadDemandsData();
    }, [selectedClient, startDate, endDate, statusFilter, loadDemandsData]);

    // Reset pagination to page 1 when filters or search change
    useEffect(() => {
        setCurrentPage(1);
    }, [selectedClient, startDate, endDate, statusFilter, priorityFilter, searchTerm, itemsPerPage]);

    // ── Client-side filter mapping for local/extended filters (Search, Priority) ──
    const filtered = useMemo(() => {
        let list = allDemands;
        
        // Priority Filter
        if (priorityFilter !== "All") {
            list = list.filter(d => d.priority === priorityFilter);
        }
        
        // Text Search
        if (searchTerm.trim()) {
            const query = searchTerm.toLowerCase();
            list = list.filter(d =>
                d.name.toLowerCase().includes(query) ||
                d.client.toLowerCase().includes(query) ||
                d.project.toLowerCase().includes(query) ||
                d.id.toLowerCase().includes(query)
            );
        }
        
        return list;
    }, [allDemands, priorityFilter, searchTerm]);

    // Header sort sorting logic
    const handleSort = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const sorted = useMemo(() => {
        let list = [...filtered];
        if (sortConfig.key) {
            list.sort((a, b) => {
                let aVal = a[sortConfig.key];
                let bVal = b[sortConfig.key];

                if (sortConfig.key === 'internal') {
                    aVal = a.resources.filter(r => r.type === "EMPLOYEE").length;
                    bVal = b.resources.filter(r => r.type === "EMPLOYEE").length;
                } else if (sortConfig.key === 'external') {
                    aVal = a.resources.filter(r => r.type === "CANDIDATE").length;
                    bVal = b.resources.filter(r => r.type === "CANDIDATE").length;
                } else if (sortConfig.key === 'scheduled') {
                    aVal = a.resources.filter(r => r.interviewLevels.some(l => l.status === "Scheduled")).length;
                    bVal = b.resources.filter(r => r.interviewLevels.some(l => l.status === "Scheduled")).length;
                } else if (sortConfig.key === 'selected') {
                    aVal = a.resources.filter(r => r.overallStatus === "Selected").length;
                    bVal = b.resources.filter(r => r.overallStatus === "Selected").length;
                } else if (sortConfig.key === 'rejected') {
                    aVal = a.resources.filter(r => r.overallStatus === "Rejected").length;
                    bVal = b.resources.filter(r => r.overallStatus === "Rejected").length;
                } else if (sortConfig.key === 'requested') {
                    aVal = a.totalRequested;
                    bVal = b.totalRequested;
                } else if (sortConfig.key === 'due_date') {
                    aVal = new Date(a.fulfilmentDt || 0).getTime();
                    bVal = new Date(b.fulfilmentDt || 0).getTime();
                } else if (sortConfig.key === 'priority') {
                    const priorityOrder = { High: 3, Medium: 2, Low: 1 };
                    aVal = priorityOrder[a.priority] || 0;
                    bVal = priorityOrder[b.priority] || 0;
                } else if (sortConfig.key === 'status') {
                    const statusOrder = { Open: 3, InProgress: 2, "On Hold": 1, Completed: 0, Closed: 0 };
                    aVal = statusOrder[a.status] || 0;
                    bVal = statusOrder[b.status] || 0;
                } else if (sortConfig.key === 'interviewLevel') {
                    const levelOrder = { "Not Started": 0, "L1": 1, "L2": 2, "L3": 3, "HR Round": 4, "Final Round": 5, "Completed": 6 };
                    aVal = levelOrder[a.interviewLevel || "Not Started"] || 0;
                    bVal = levelOrder[b.interviewLevel || "Not Started"] || 0;
                }

                if (aVal === undefined || aVal === null) aVal = '';
                if (bVal === undefined || bVal === null) bVal = '';

                if (typeof aVal === 'string') {
                    return sortConfig.direction === 'asc' 
                        ? aVal.localeCompare(bVal) 
                        : bVal.localeCompare(aVal);
                } else {
                    return sortConfig.direction === 'asc' 
                        ? aVal - bVal 
                        : bVal - aVal;
                }
            });
        }
        return list;
    }, [filtered, sortConfig]);

    // Paginate demands
    const totalPages = Math.ceil(sorted.length / itemsPerPage);
    const paginated = useMemo(() => {
        const start = (currentPage - 1) * itemsPerPage;
        return sorted.slice(start, start + itemsPerPage);
    }, [sorted, currentPage, itemsPerPage]);

    // KPI Metrics calculation
    const kpis = useMemo(() => {
        const totalInternal = filtered.reduce((s, d) => s + d.resources.filter(r => r.type === "EMPLOYEE").length, 0);
        const totalExternal = filtered.reduce((s, d) => s + d.resources.filter(r => r.type === "CANDIDATE").length, 0);
        const totalSelected = filtered.reduce((s, d) => s + d.resources.filter(r => r.overallStatus === "Selected").length, 0);
        const totalScheduled = filtered.reduce((s, d) => s + d.resources.filter(r => r.interviewLevels.some(l => l.status === "Scheduled")).length, 0);
        return { total: filtered.length, totalInternal, totalExternal, totalSelected, totalScheduled };
    }, [filtered]);

    // Dropdown auto-save handler
    const handleInterviewLevelChange = async (demandId, newLevel, previousLevel) => {
        setSavingDropdowns(prev => ({ ...prev, [demandId]: true }));
        setSaveStatus(prev => ({ ...prev, [demandId]: null }));

        try {
            console.log(`Auto-saving interview level for demand ID: ${demandId} to: ${newLevel}`);

            // Make the update API call
            try {
                await DemandService.update(demandId, { interviewLevel: newLevel });
            } catch (err) {
                console.warn("Backend API update rejected/not supported directly on DB model, using frontend localStorage persistence fallback.", err);
            }

            // Simulated network delay (800ms) for high-fidelity loading visual
            await new Promise(resolve => setTimeout(resolve, 800));

            // Save in localStorage
            localStorage.setItem(`demand_interview_level_${demandId}`, newLevel);

            // Update in state
            setAllDemands(prev => prev.map(d => 
                d._demandId === demandId ? { ...d, interviewLevel: newLevel } : d
            ));

            setSaveStatus(prev => ({ ...prev, [demandId]: 'success' }));
            toast.success("Interview level updated");

            setTimeout(() => {
                setSaveStatus(prev => ({ ...prev, [demandId]: null }));
            }, 2000);

        } catch (err) {
            console.error("Auto-save failed:", err);
            setSaveStatus(prev => ({ ...prev, [demandId]: 'error' }));
            toast.error("Failed to update, please try again");

            setTimeout(() => {
                setSaveStatus(prev => ({ ...prev, [demandId]: null }));
            }, 3000);
        } finally {
            setSavingDropdowns(prev => ({ ...prev, [demandId]: false }));
        }
    };

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

    // ── Export Report handler ──
    const handleExport = useCallback(async () => {
        setExporting(true);
        try {
           const payload = {
               userId: localStorage.getItem('userId'),
               fromDate: startDate || null,
               toDate: endDate || null,
               accountId: selectedClient !== "All Clients" ? clientMap[selectedClient] : null,
               demandIds: filtered.map(d => d._demandId).filter(Boolean),
           };

            const response = await PortfolioReportService.exportDemandReport(payload);
            const blob = new Blob([response.data], {
                type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            const fromStr = startDate ? startDate.replace(/-/g, '') : 'all';
            const toStr = endDate ? endDate.replace(/-/g, '') : 'all';
            const clientStr = selectedClient !== "All Clients" ? `_${selectedClient.replace(/\s+/g, '_')}` : '';
            link.download = `demand_report_${fromStr}_to_${toStr}${clientStr}.xlsx`;
            document.body.appendChild(link);
            link.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(link);
        } catch (err) {
            console.error("Export failed:", err);
            alert("Export failed. Please try again.");
        } finally {
            setExporting(false);
        }
    }, [selectedClient, filtered, startDate, endDate, clientMap]);

    // ── Email handlers ──
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
               accountId: selectedClient !== "All Clients" ? clientMap[selectedClient] : null,
               demandStatus: statusFilter !== "All" ? statusFilter : null,
               priority: priorityFilter !== "All" ? priorityFilter : null,
               candidateSearch: searchTerm || null,
               demandIds: filtered.map(d => d._demandId).filter(Boolean),
               ...emailData,
           };
            const result = await PortfolioReportService.generateEmailReport(payload);
            if (result?.success) {
                // handled in send
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
            
            {/* Custom Responsive Table Frozen Columns Style Tag */}
            <style>{`
                @keyframes slide-in {
                    from { transform: translateX(100%); }
                    to { transform: translateX(0); }
                }
                .drawer-slide-in {
                    animation: slide-in 0.25s ease-out forwards;
                }
                @media (max-width: 1279px) {
                    .sticky-col-1 {
                        position: sticky;
                        left: 0;
                        z-index: 10;
                    }
                    .sticky-col-2 {
                        position: sticky;
                        left: 48px;
                        z-index: 10;
                    }
                    .sticky-header-col-1 {
                        position: sticky;
                        left: 0;
                        z-index: 20;
                    }
                    .sticky-header-col-2 {
                        position: sticky;
                        left: 48px;
                        z-index: 20;
                    }
                    tr:nth-child(even) .sticky-col-1,
                    tr:nth-child(even) .sticky-col-2 {
                        background-color: #ffffff !important;
                    }
                    tr:nth-child(odd) .sticky-col-1,
                    tr:nth-child(odd) .sticky-col-2 {
                        background-color: #f9fafb !important;
                    }
                    tr:hover .sticky-col-1,
                    tr:hover .sticky-col-2 {
                        background-color: #f3e8ff !important;
                    }
                    th.sticky-header-col-1,
                    th.sticky-header-col-2 {
                        background-color: #e6e0fa !important;
                    }
                }
            `}</style>

            {/* Page Header */}
            <div className="mb-6">
                <div className="flex items-start justify-between flex-wrap gap-4">
                    <div>
                        <div className="flex items-center gap-3 mb-1">
                            <div className="w-10 h-10 rounded-xl bg-white border-2 border-orange-400 flex items-center justify-center shadow-md flex-shrink-0">
                                <FileText className="w-5 h-5 text-orange-500" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-black text-gray-900 leading-tight">Demand Reports</h1>
                                <p className="text-sm text-white/70">Detailed resource & interview breakdown per demand</p>
                            </div>
                        </div>
                    </div>

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
                            onClick={handleExport}
                            disabled={exporting}
                            className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-orange-600 bg-white border-2 border-orange-400 rounded-xl shadow-md hover:bg-orange-50 hover:border-orange-500 transition-all duration-200 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                            <Download className={`w-4 h-4 ${exporting ? "animate-spin" : ""}`} />
                            {exporting ? "Exporting…" : "Export Report"}
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
                    {/* Client */}
                    <div className="xl:col-span-1">
                        <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Client</label>
                        <select value={selectedClient} onChange={e => setSelectedClient(e.target.value)}
                            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-700 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-orange-400 transition-all">
                            {clientList.map(c => <option key={c}>{c}</option>)}
                        </select>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Demand From</label>
                        <div className="relative">
                            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
                                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-700 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-orange-400 transition-all" />
                            {startDate && <button onClick={() => setStartDate("")} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-500"><X className="w-3 h-3" /></button>}
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Demand To</label>
                        <div className="relative">
                            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)}
                                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-700 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-orange-400 transition-all" />
                            {endDate && <button onClick={() => setEndDate("")} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-500"><X className="w-3 h-3" /></button>}
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Status</label>
                        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
                            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-700 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-orange-400 transition-all">
                            {["All", "Open", "InProgress", "Completed", "On Hold"].map(s => <option key={s}>{s}</option>)}
                        </select>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Priority</label>
                        <select value={priorityFilter} onChange={e => setPriorityFilter(e.target.value)}
                            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-700 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-orange-400 transition-all">
                            {["All", "High", "Medium", "Low"].map(p => <option key={p}>{p}</option>)}
                        </select>
                    </div>

                    <div className="sm:col-span-2 lg:col-span-1 xl:col-span-1">
                        <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Search</label>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                            <input type="text" placeholder="Demand, client, project…" value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
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
                    <select value={itemsPerPage} onChange={e => setItemsPerPage(Number(e.target.value))}
                        className="border border-gray-200 rounded-lg px-2 py-1 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-orange-300">
                        {ITEMS_PER_PAGE_OPTIONS.map(n => <option key={n}>{n}</option>)}
                    </select>
                    <span>per page</span>
                </div>
            </div>

            {/* Excel-style interactive grid view table */}
            {!loading && paginated.length === 0 ? (
                <div className="bg-white rounded-2xl border border-gray-200 p-16 text-center shadow-sm">
                    <AlertTriangle className="w-12 h-12 text-orange-300 mx-auto mb-4" />
                    <p className="text-gray-500 font-medium">No demands match your filters.</p>
                    <button onClick={clearFilters} className="mt-3 text-sm text-orange-500 hover:text-orange-700 font-semibold">Clear filters</button>
                </div>
            ) : (
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden mb-6">
                    <div className="overflow-x-auto w-full" style={{ scrollbarWidth: "thin" }}>
                        <table className="table-auto w-full border-collapse">
                            <thead>
                                <tr className="bg-gradient-to-r from-purple-200/80 via-blue-300/70 to-indigo-300/80 border-b-2 border-purple-300 shadow-sm">
                                    <th className="py-3 px-3 text-center text-slate-800 font-extrabold text-[12px] border-r border-purple-300/20 uppercase tracking-wider sticky-header-col-1 w-[48px] min-w-[48px] max-w-[48px]">#</th>
                                    <SortableHeader label="Demand Name" sortKey="name" currentSort={sortConfig} onSort={handleSort} className="sticky-header-col-2 min-w-[200px]" />
                                    <SortableHeader label="Client" sortKey="client" currentSort={sortConfig} onSort={handleSort} />
                                    <SortableHeader label="Project" sortKey="project" currentSort={sortConfig} onSort={handleSort} />
                                    <SortableHeader label="Due Date" sortKey="due_date" currentSort={sortConfig} onSort={handleSort} />
                                    <SortableHeader label="Priority" sortKey="priority" currentSort={sortConfig} onSort={handleSort} className="text-center" />
                                    <SortableHeader label="Status" sortKey="status" currentSort={sortConfig} onSort={handleSort} className="text-center" />
                                    <SortableHeader label="Req" sortKey="requested" currentSort={sortConfig} onSort={handleSort} className="text-center w-[60px]" />
                                    <SortableHeader label="Int" sortKey="internal" currentSort={sortConfig} onSort={handleSort} className="text-center w-[60px]" />
                                    <SortableHeader label="Ext" sortKey="external" currentSort={sortConfig} onSort={handleSort} className="text-center w-[60px]" />
                                    <SortableHeader label="Sch" sortKey="scheduled" currentSort={sortConfig} onSort={handleSort} className="text-center w-[60px]" />
                                    <SortableHeader label="Sel" sortKey="selected" currentSort={sortConfig} onSort={handleSort} className="text-center w-[60px]" />
                                    <SortableHeader label="Rej" sortKey="rejected" currentSort={sortConfig} onSort={handleSort} className="text-center w-[60px]" />
                                    <SortableHeader label="Interview Level" sortKey="interviewLevel" currentSort={sortConfig} onSort={handleSort} className="text-center min-w-[150px]" />
                                </tr>
                            </thead>
                            <tbody>
                                {paginated.map((demand, idx) => {
                                    const rowNum = (currentPage - 1) * itemsPerPage + idx + 1;
                                    const internalCount = demand.resources.filter(r => r.type === "EMPLOYEE").length;
                                    const externalCount = demand.resources.filter(r => r.type === "CANDIDATE").length;
                                    const scheduledCount = demand.resources.filter(r => r.interviewLevels.some(l => l.status === "Scheduled")).length;
                                    const selectedCount = demand.resources.filter(r => r.overallStatus === "Selected").length;
                                    const rejectedCount = demand.resources.filter(r => r.overallStatus === "Rejected").length;

                                    return (
                                        <tr
                                            key={demand.id}
                                            onClick={() => setDrawerDemand(demand)}
                                            className="group border-b border-gray-100 transition-colors even:bg-white odd:bg-gray-50/50 hover:bg-purple-50/40 cursor-pointer"
                                        >
                                            <td className="py-2.5 px-3 text-center text-xs font-semibold text-gray-500 sticky-col-1 border-r border-gray-150 w-[48px] min-w-[48px] max-w-[48px]">{rowNum}</td>
                                            <td className="py-2.5 px-3 text-xs font-bold text-gray-900 sticky-col-2 border-r border-gray-150 min-w-[200px]">
                                                <div className="hover:text-purple-700 transition-colors text-left flex items-center justify-between">
                                                    <span className="truncate max-w-[320px]">{demand.name}</span>
                                                    <ChevronRight className="w-3.5 h-3.5 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity ml-1.5 flex-shrink-0" />
                                                </div>
                                            </td>
                                            <td className="py-2.5 px-3 text-xs font-medium text-gray-700 text-left truncate max-w-[150px]">{demand.client}</td>
                                            <td className="py-2.5 px-3 text-xs text-gray-600 text-left truncate max-w-[150px]">{demand.project}</td>
                                            <td className="py-2.5 px-3 text-xs text-gray-600 text-left font-mono">{formatDemandDate(demand.fulfilmentDt)}</td>
                                            <td className="py-2.5 px-3 text-center" onClick={e => e.stopPropagation()}>
                                                <span className={`inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${PRIORITY_CONFIG[demand.priority]?.bg || "bg-gray-100 text-gray-600 border-gray-200"} min-w-[65px]`}>
                                                    {demand.priority}
                                                </span>
                                            </td>
                                            <td className="py-2.5 px-3 text-center" onClick={e => e.stopPropagation()}>
                                                <span className={`inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${STATUS_CONFIG[demand.status]?.bg || "bg-gray-100 text-gray-600 border-gray-200"} min-w-[80px]`}>
                                                    {demand.status === "InProgress" ? "In Progress" : demand.status}
                                                </span>
                                            </td>
                                            <td className="py-2.5 px-3 text-center text-xs font-bold text-gray-800 font-mono">{demand.totalRequested}</td>
                                            <td className="py-2.5 px-3 text-center text-xs font-semibold text-blue-700 font-mono">{internalCount}</td>
                                            <td className="py-2.5 px-3 text-center text-xs font-semibold text-purple-700 font-mono">{externalCount}</td>
                                            <td className="py-2.5 px-3 text-center text-xs font-semibold text-amber-700 font-mono">{scheduledCount}</td>
                                            <td className="py-2.5 px-3 text-center text-xs font-bold text-emerald-700 font-mono">{selectedCount}</td>
                                            <td className="py-2.5 px-3 text-center text-xs font-semibold text-red-600 font-mono">{rejectedCount}</td>
                                            <td className="py-2.5 px-3 text-center">
                                                <InterviewLevelSelect
                                                    demandId={demand._demandId}
                                                    value={demand.interviewLevel}
                                                    isSaving={!!savingDropdowns[demand._demandId]}
                                                    saveStatus={saveStatus[demand._demandId] || null}
                                                    onChange={handleInterviewLevelChange}
                                                />
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Pagination below the grid */}
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

            {/* Detailed Glassmorphic Drawer Component */}
            {drawerDemand && (
                <DemandDetailDrawer
                    demand={drawerDemand}
                    onClose={() => setDrawerDemand(null)}
                />
            )}

            {/* ── SUCCESS NOTIFICATION (Email modal success) ── */}
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
                                        Demand_Report_{startDate || 'All'}_to_{endDate || 'All'}.xlsx
                                    </h4>
                                    <p className="text-xs text-gray-500 mt-0.5">Generated Report • Excel</p>
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
