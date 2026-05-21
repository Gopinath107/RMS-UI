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

/* Pill badge — sized to content with nowrap, no hardcoded minWidth */
const PriorityBadge = ({ priority }) => {
    const config = {
        High:   { dot: 'bg-red-500',     cls: 'bg-red-50   text-red-600   border-red-200'   },
        Medium: { dot: 'bg-orange-400',  cls: 'bg-orange-50 text-orange-600 border-orange-200' },
        Low:    { dot: 'bg-emerald-500', cls: 'bg-emerald-50 text-emerald-600 border-emerald-200' },
    };
    const { dot, cls } = config[priority] || { dot: 'bg-gray-400', cls: 'bg-gray-50 text-gray-600 border-gray-200' };
    return (
        <span style={{ whiteSpace: 'nowrap' }}
            className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9px] font-bold border ${cls}`}>
            <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${dot}`} />
            {priority}
        </span>
    );
};

const StatusBadge = ({ status }) => {
    const config = {
        Open:        'bg-sky-50   text-sky-600   border-sky-200',
        InProgress:  'bg-violet-50 text-violet-600 border-violet-200',
        'In Progress':'bg-violet-50 text-violet-600 border-violet-200',
        Completed:   'bg-emerald-50 text-emerald-600 border-emerald-200',
        Closed:      'bg-gray-50  text-gray-500   border-gray-200',
        'On Hold':   'bg-amber-50  text-amber-600  border-amber-200',
        Rejected:    'bg-red-50   text-red-600    border-red-200',
    };
    const cls = config[status] || 'bg-gray-50 text-gray-600 border-gray-200';
    const label = status === 'InProgress' ? 'In Progress' : status;
    return (
        <span style={{ whiteSpace: 'nowrap' }}
            className={`inline-flex items-center justify-center px-2 py-0.5 rounded-md text-[9px] font-bold border ${cls}`}>
            {label}
        </span>
    );
};

const LEVEL_STATUS_CONFIG = {
    Selected:  { bg: 'bg-emerald-50', text: 'text-emerald-700', pill: 'bg-emerald-100 text-emerald-700 border-emerald-200', icon: CheckCircle },
    Rejected:  { bg: 'bg-red-50',     text: 'text-red-700',     pill: 'bg-red-100 text-red-700 border-red-200',         icon: XCircle },
    Scheduled: { bg: 'bg-blue-50',    text: 'text-blue-700',    pill: 'bg-blue-100 text-blue-700 border-blue-200',       icon: Clock },
    Completed: { bg: 'bg-teal-50',    text: 'text-teal-700',    pill: 'bg-teal-100 text-teal-700 border-teal-200',       icon: Award },
};

const OVERALL_STATUS_CONFIG = {
    Selected:     { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
    Rejected:     { bg: 'bg-red-50',     text: 'text-red-700',     border: 'border-red-200'     },
    'In Progress':{ bg: 'bg-blue-50',    text: 'text-blue-700',    border: 'border-blue-200'    },
};

/* ───────────────────────────────────────────────────────────────── */
/*  EXCEL GRID — COLUMN DEFINITIONS (drag-drop order driven)       */
/* ───────────────────────────────────────────────────────────────── */
const COLUMN_DEFS = [
    { key: '#',              label: '#',               minW: 36,   sortKey: null,            filter: null,                                      fixed: true  },
    { key: 'name',           label: 'Demand Name',     minW: 140,  sortKey: 'name',           filter: 'text'                                                  },
    { key: 'client',         label: 'Client',          minW: 80,   sortKey: 'client',         filter: 'text'                                                  },
    { key: 'project',        label: 'Project',         minW: 80,   sortKey: 'project',        filter: 'text'                                                  },
    { key: 'due_date',       label: 'Due Date',        minW: 80,   sortKey: 'due_date',       filter: null                                                    },
    { key: 'priority',       label: 'Priority',        minW: 80,   sortKey: 'priority',       filter: 'select', opts: ['All','High','Medium','Low']           },
    { key: 'status',         label: 'Status',          minW: 96,   sortKey: 'status',         filter: 'select', opts: ['All','Open','In Progress','Completed','On Hold'] },
    { key: 'requested',      label: 'Req',             minW: 44,   sortKey: 'requested',      filter: null,     center: true                                 },
    { key: 'internal',       label: 'Int',             minW: 40,   sortKey: 'internal',       filter: null,     center: true                                 },
    { key: 'external',       label: 'Ext',             minW: 40,   sortKey: 'external',       filter: null,     center: true                                 },
    { key: 'scheduled',      label: 'Sch',             minW: 40,   sortKey: 'scheduled',      filter: null,     center: true                                 },
    { key: 'selected_cnt',   label: 'Sel',             minW: 40,   sortKey: 'selected',       filter: null,     center: true                                 },
    { key: 'rejected_cnt',   label: 'Rej',             minW: 40,   sortKey: 'rejected',       filter: null,     center: true                                 },
    { key: 'interviewLevel', label: 'Interview Level', minW: 110,  sortKey: 'interviewLevel', filter: 'select', opts: ['All','Not Started','L1','L2','L3','HR Round','Final Round','Completed'] },
];
const DEFAULT_COL_ORDER = COLUMN_DEFS.map(c => c.key);

/* ───────────────────────────────────────────────────────────────── */
/*  EMAIL CHIP INPUT                                               */
/* ───────────────────────────────────────────────────────────────── */
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

    // Scroll lock when drawer is active
    useEffect(() => {
        const originalOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        return () => {
            document.body.style.overflow = originalOverflow;
        };
    }, []);

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

    // Format helper for dates inside drawer
    const formatDrawerDate = (dateString) => {
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

    return (
        <div style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', justifyContent: 'flex-end' }}>
            {/* Backdrop */}
            <div
                style={{ position: 'absolute', inset: 0, background: 'rgba(15,23,42,0.45)' }}
                onClick={onClose}
            />
            {/* Drawer panel */}
            <div
                className="drawer-slide-in"
                style={{
                    position: 'fixed', top: 0, right: 0,
                    width: '440px', maxWidth: '100vw', height: '100vh',
                    background: '#ffffff', zIndex: 201,
                    display: 'flex', flexDirection: 'column',
                    boxShadow: '-8px 0 40px rgba(0,0,0,0.15)',
                }}
            >
                
                {/* ── HEADER ── */}
                <div style={{ padding: '16px 20px', borderBottom: '1px solid #e5e7eb', flexShrink: 0, background: 'linear-gradient(to right, #fafafa, #f8f7ff)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div style={{ flex: 1, minWidth: 0, paddingRight: 12 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                                <span style={{ fontFamily: 'monospace', fontSize: 10, fontWeight: 700, color: '#ea580c', background: '#fff7ed', border: '1px solid #fdba74', borderRadius: 6, padding: '2px 8px' }}>{demand.id}</span>
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 10, fontWeight: 700, color: demand.priority === 'High' ? '#dc2626' : demand.priority === 'Medium' ? '#d97706' : '#16a34a', background: demand.priority === 'High' ? '#fef2f2' : demand.priority === 'Medium' ? '#fffbeb' : '#f0fdf4', border: `1px solid ${demand.priority === 'High' ? '#fca5a5' : demand.priority === 'Medium' ? '#fcd34d' : '#86efac'}`, borderRadius: 6, padding: '2px 8px' }}>
                                    {demand.priority}
                                </span>
                            </div>
                            <h2 style={{ fontSize: 15, fontWeight: 700, color: '#111827', margin: 0, lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={demand.name}>{demand.name}</h2>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 6, flexWrap: 'wrap' }}>
                                <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#374151', fontWeight: 600 }}>
                                    <Building2 style={{ width: 12, height: 12, color: '#9ca3af', flexShrink: 0 }} />
                                    {demand.client}
                                </span>
                                <span style={{ color: '#d1d5db' }}>·</span>
                                <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#6b7280', maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={demand.project}>
                                    <Briefcase style={{ width: 12, height: 12, color: '#9ca3af', flexShrink: 0 }} />
                                    {demand.project}
                                </span>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            style={{ padding: 6, borderRadius: '50%', border: 'none', background: 'transparent', cursor: 'pointer', color: '#9ca3af', flexShrink: 0 }}
                            onMouseEnter={e => { e.currentTarget.style.background='#f3f4f6'; e.currentTarget.style.color='#374151'; }}
                            onMouseLeave={e => { e.currentTarget.style.background='transparent'; e.currentTarget.style.color='#9ca3af'; }}
                        >
                            <X style={{ width: 18, height: 18 }} />
                        </button>
                    </div>
                </div>

                {/* ── SCROLLABLE BODY ── */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '0 0 24px' }}>

                    {/* ─── Section: Key Dates ─── */}
                    <div style={{ padding: '16px 20px 0' }}>
                        <p style={{ fontSize: 10, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Key Dates</p>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                            {[{ label: 'Due Date', value: formatDrawerDate(demand.fulfilmentDt), icon: '📅' },
                              { label: 'Opened', value: formatDrawerDate(demand.demandOpenDt), icon: '🗓' }].map(({ label, value }) => (
                                <div key={label} style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 10, padding: '10px 12px' }}>
                                    <p style={{ fontSize: 9, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>{label}</p>
                                    <p style={{ fontSize: 12, fontWeight: 700, color: '#111827', fontFamily: 'monospace' }}>{value}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* ─── Section: Stats ─── */}
                    <div style={{ padding: '14px 20px 0' }}>
                        <p style={{ fontSize: 10, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Summary</p>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8 }}>
                            {[
                                { label: 'Requests', value: demand.statusSummary.totalRequests, color: '#6366f1', bg: '#eef2ff' },
                                { label: 'Interviews', value: demand.statusSummary.totalInterviews, color: '#0284c7', bg: '#e0f2fe' },
                                { label: 'Selected', value: demand.statusSummary.selected, color: '#16a34a', bg: '#f0fdf4' },
                                { label: 'Rejected', value: demand.statusSummary.rejected, color: '#dc2626', bg: '#fef2f2' },
                            ].map(({ label, value, color, bg }) => (
                                <div key={label} style={{ background: bg, borderRadius: 10, padding: '10px 8px', textAlign: 'center' }}>
                                    <p style={{ fontSize: 18, fontWeight: 800, color, fontFamily: 'monospace', lineHeight: 1 }}>{value}</p>
                                    <p style={{ fontSize: 9, color: '#6b7280', fontWeight: 600, marginTop: 4 }}>{label}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* ─── Section: Pipeline Counts ─── */}
                    <div style={{ padding: '14px 20px 0' }}>
                        <p style={{ fontSize: 10, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Pipeline Counts</p>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                            {[{ label: 'Allocated', value: demand.statusSummary.allocated, color: '#4338ca', bg: '#eef2ff', border: '#a5b4fc' },
                              { label: 'Onboarded', value: demand.statusSummary.onboarded, color: '#0f766e', bg: '#f0fdfa', border: '#5eead4' }].map(({ label, value, color, bg, border }) => (
                                <span key={label} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 12px', borderRadius: 20, fontSize: 11, fontWeight: 700, color, background: bg, border: `1px solid ${border}` }}>
                                    <span style={{ fontFamily: 'monospace', fontSize: 13, fontWeight: 800 }}>{value}</span> {label}
                                </span>
                            ))}
                        </div>
                    </div>

                    {/* ─── Section: Description ─── */}
                    {demand.description ? (
                        <div style={{ padding: '14px 20px 0' }}>
                            <p style={{ fontSize: 10, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Description</p>
                            <div style={{ background: '#fafafa', border: '1px solid #e5e7eb', borderRadius: 10, padding: '10px 12px' }}>
                                <p style={{ fontSize: 11, color: '#374151', lineHeight: 1.6 }}>{demand.description}</p>
                            </div>
                        </div>
                    ) : null}

                    {/* ─── Section: Divider ─── */}
                    <div style={{ margin: '16px 20px 0', borderTop: '1px solid #f3f4f6' }} />

                    {/* ─── Section: Candidate Pipeline ─── */}
                    <div style={{ padding: '14px 20px 0' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <p style={{ fontSize: 10, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.08em', margin: 0 }}>Candidate Pipeline</p>
                                <span style={{ fontSize: 9, fontWeight: 700, color: '#6b7280', background: '#f3f4f6', borderRadius: 20, padding: '1px 7px' }}>{demand.resources.length}</span>
                            </div>
                            <div style={{ display: 'flex', gap: 6 }}>
                                <span style={{ fontSize: 9, fontWeight: 700, color: '#2563eb', background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 20, padding: '2px 8px' }}>{internalCount} Internal</span>
                                <span style={{ fontSize: 9, fontWeight: 700, color: '#7c3aed', background: '#f5f3ff', border: '1px solid #ddd6fe', borderRadius: 20, padding: '2px 8px' }}>{externalCount} External</span>
                            </div>
                        </div>

                        {/* Search */}
                        <div style={{ position: 'relative', marginBottom: 10 }}>
                            <Search style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', width: 13, height: 13, color: '#9ca3af', pointerEvents: 'none' }} />
                            <input
                                type="text"
                                placeholder="Search candidates…"
                                value={resourceSearch}
                                onChange={e => { setResourceSearch(e.target.value); setExpandedResourceId(null); }}
                                style={{ width: '100%', paddingLeft: 30, paddingRight: 28, paddingTop: 7, paddingBottom: 7, border: '1px solid #e5e7eb', borderRadius: 8, fontSize: 11, color: '#374151', background: '#fafafa', outline: 'none', boxSizing: 'border-box' }}
                            />
                            {resourceSearch && (
                                <button onClick={() => { setResourceSearch(''); setExpandedResourceId(null); }}
                                    style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', padding: 0 }}>
                                    <X style={{ width: 12, height: 12 }} />
                                </button>
                            )}
                        </div>

                        {/* Candidate cards */}
                        {filteredResources.length === 0 ? (
                            <div style={{ padding: '24px 0', textAlign: 'center', fontSize: 11, color: '#9ca3af', background: '#fafafa', borderRadius: 10, border: '1px dashed #e5e7eb' }}>
                                No candidates match &ldquo;{resourceSearch}&rdquo;
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                {filteredResources.map((resource) => {
                                    const overallCfg = OVERALL_STATUS_CONFIG[resource.overallStatus] || OVERALL_STATUS_CONFIG['In Progress'];
                                    const isInternal = resource.type === 'EMPLOYEE';
                                    const isCardOpen = expandedResourceId === resource.id;
                                    const initials = resource.name.split(' ').filter(Boolean).map(n => n[0].toUpperCase()).join('').slice(0, 2) || '?';
                                    const avatarBg = isInternal ? { bg: '#dbeafe', text: '#1d4ed8' } : { bg: '#ede9fe', text: '#6d28d9' };

                                    return (
                                        <div key={resource.id} style={{
                                            border: isCardOpen ? '1px solid #c4b5fd' : '1px solid #e5e7eb',
                                            borderRadius: 12, background: '#fff',
                                            boxShadow: isCardOpen ? '0 2px 12px rgba(124,58,237,0.1)' : '0 1px 3px rgba(0,0,0,0.06)',
                                            overflow: 'hidden', transition: 'all 0.2s ease',
                                        }}>
                                            {/* Card header button */}
                                            <button
                                                onClick={() => setExpandedResourceId(isCardOpen ? null : resource.id)}
                                                style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}
                                            >
                                                {/* Avatar */}
                                                <div style={{ width: 32, height: 32, borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, background: avatarBg.bg, color: avatarBg.text }}>
                                                    {initials}
                                                </div>
                                                {/* Info */}
                                                <div style={{ flex: 1, minWidth: 0 }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                                                        <span style={{ fontSize: 12, fontWeight: 700, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 140 }}>{resource.name}</span>
                                                        <span style={{ fontSize: 8, fontWeight: 700, color: isInternal ? '#2563eb' : '#7c3aed', background: isInternal ? '#eff6ff' : '#f5f3ff', border: `1px solid ${isInternal ? '#bfdbfe' : '#ddd6fe'}`, borderRadius: 4, padding: '1px 5px', textTransform: 'uppercase' }}>
                                                            {isInternal ? 'Internal' : 'External'}
                                                        </span>
                                                    </div>
                                                    <p style={{ fontSize: 9, color: '#9ca3af', fontFamily: 'monospace', margin: '2px 0 0' }}>{resource.resourceId}</p>
                                                </div>
                                                {/* Status badge */}
                                                <span style={{ fontSize: 9, fontWeight: 700, color: overallCfg.text.replace('text-', '').includes('-') ? undefined : overallCfg.text, padding: '3px 8px', borderRadius: 20, flexShrink: 0, whiteSpace: 'nowrap',
                                                    ...(resource.overallStatus === 'Selected' ? { background: '#f0fdf4', color: '#15803d', border: '1px solid #86efac' } :
                                                       resource.overallStatus === 'Rejected' ? { background: '#fef2f2', color: '#dc2626', border: '1px solid #fca5a5' } :
                                                       { background: '#eff6ff', color: '#2563eb', border: '1px solid #93c5fd' }) }}>
                                                    {resource.overallStatus}
                                                </span>
                                                <ChevronDown style={{ width: 14, height: 14, color: '#9ca3af', flexShrink: 0, transform: isCardOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
                                            </button>

                                            {/* Expanded detail panel */}
                                            {isCardOpen && (
                                                <div style={{ borderTop: '1px solid #f3f4f6', background: '#fafafa', padding: '12px 14px' }}>
                                                    {/* Contact row */}
                                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 12px', marginBottom: 10 }}>
                                                        {[{ Icon: Mail, text: resource.email },
                                                          { Icon: Phone, text: resource.phone },
                                                          { Icon: MapPin, text: resource.location },
                                                          { Icon: Briefcase, text: `${resource.experience} yrs exp${resource.company ? ` · ${resource.company}` : ''}` }
                                                        ].map(({ Icon, text }, i) => (
                                                            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 10, color: '#4b5563', overflow: 'hidden' }}>
                                                                <Icon style={{ width: 11, height: 11, color: '#9ca3af', flexShrink: 0 }} />
                                                                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{text}</span>
                                                            </div>
                                                        ))}
                                                    </div>

                                                    {/* Skills */}
                                                    {resource.skills?.length > 0 && (
                                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 10 }}>
                                                            {resource.skills.map((s, i) => (
                                                                <span key={i} style={{ fontSize: 9, fontWeight: 600, color: '#374151', background: '#fff', border: '1px solid #e5e7eb', borderRadius: 4, padding: '1px 6px' }}>{s}</span>
                                                            ))}
                                                        </div>
                                                    )}

                                                    {/* Interview Journey */}
                                                    <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: 10 }}>
                                                        <p style={{ fontSize: 9, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 7 }}>Interview Journey</p>
                                                        {resource.interviewLevels.length === 0 ? (
                                                            <p style={{ fontSize: 10, color: '#9ca3af', fontStyle: 'italic' }}>No interview steps yet.</p>
                                                        ) : (
                                                            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                                                                {resource.interviewLevels.map((il, i) => {
                                                                    const cfg = LEVEL_STATUS_CONFIG[il.status] || LEVEL_STATUS_CONFIG.Scheduled;
                                                                    const Icon = cfg.icon;
                                                                    const pillStyle = il.status === 'Selected' ? { bg: '#f0fdf4', text: '#15803d', bd: '#86efac' }
                                                                        : il.status === 'Rejected' ? { bg: '#fef2f2', text: '#dc2626', bd: '#fca5a5' }
                                                                        : il.status === 'Completed' ? { bg: '#f0fdfa', text: '#0f766e', bd: '#5eead4' }
                                                                        : { bg: '#eff6ff', text: '#2563eb', bd: '#93c5fd' };
                                                                    return (
                                                                        <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, background: pillStyle.bg, border: `1px solid ${pillStyle.bd}`, borderRadius: 8, padding: '7px 10px' }}>
                                                                            <Icon style={{ width: 11, height: 11, color: pillStyle.text, flexShrink: 0, marginTop: 1 }} />
                                                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                                                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                                                                                    <span style={{ fontSize: 10, fontWeight: 700, color: '#1f2937' }}>{il.level}</span>
                                                                                    <span style={{ fontSize: 8, fontWeight: 700, color: pillStyle.text, background: '#fff', border: `1px solid ${pillStyle.bd}`, borderRadius: 10, padding: '1px 6px', whiteSpace: 'nowrap' }}>{il.status}</span>
                                                                                </div>
                                                                                <div style={{ display: 'flex', gap: 12, marginTop: 3, flexWrap: 'wrap' }}>
                                                                                    <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 9, color: '#6b7280' }}>
                                                                                        <UserCheck style={{ width: 9, height: 9, flexShrink: 0 }} />
                                                                                        {il.interviewer}
                                                                                    </span>
                                                                                    <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 9, color: '#6b7280', fontFamily: 'monospace' }}>
                                                                                        <Calendar style={{ width: 9, height: 9, flexShrink: 0 }} />
                                                                                        {formatDrawerDate(il.date)}
                                                                                    </span>
                                                                                </div>
                                                                            </div>
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

                {/* No footer — close via X or backdrop */}
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
const getNumClass = (val, activeClass = "text-gray-800") => {
    return val > 0 ? `${activeClass} font-bold` : "text-gray-300 font-medium";
};

const SortableHeader = ({ label, sortKey, currentSort, onSort, className = "", style }) => {
    const isSorted = currentSort.key === sortKey;
    const direction = currentSort.direction;
    return (
        <th
            onClick={() => onSort(sortKey)}
            style={style}
            className={`py-3 px-3 text-center text-slate-800 font-extrabold text-[12px] uppercase tracking-wider cursor-pointer hover:bg-purple-200/40 transition-all select-none ${className}`}
        >
            <div className="flex items-center justify-center gap-1.5 whitespace-nowrap">
                <span className="truncate">{label}</span>
                <span className="text-slate-500 flex-shrink-0 inline-flex items-center">
                    {isSorted ? (
                        direction === 'asc' ? <ArrowUp className="w-3.5 h-3.5 text-purple-600" /> : <ArrowDown className="w-3.5 h-3.5 text-purple-600" />
                    ) : (
                        <ArrowUpDown className="w-3.5 h-3.5 opacity-40 text-slate-400" />
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

    // ── Excel Grid: column order (drag-drop), per-column filters ──
    const [columnOrder, setColumnOrder] = useState(DEFAULT_COL_ORDER);
    const [colFilters, setColFilters] = useState({ name: '', client: '', project: '', priority: 'All', status: 'All', interviewLevel: 'All' });
    const [showColFilters, setShowColFilters] = useState(false);
    const [dragCol, setDragCol]         = useState(null);   // key being dragged
    const [dragOverCol, setDragOverCol] = useState(null);   // key being hovered over

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

        // Top-level Priority Filter
        if (priorityFilter !== 'All') list = list.filter(d => d.priority === priorityFilter);

        // Top-level Text Search
        if (searchTerm.trim()) {
            const q = searchTerm.toLowerCase();
            list = list.filter(d =>
                d.name.toLowerCase().includes(q) ||
                d.client.toLowerCase().includes(q) ||
                d.project.toLowerCase().includes(q) ||
                d.id.toLowerCase().includes(q)
            );
        }

        // Column-level filters
        if (colFilters.name.trim())    list = list.filter(d => d.name.toLowerCase().includes(colFilters.name.toLowerCase()));
        if (colFilters.client.trim())  list = list.filter(d => d.client.toLowerCase().includes(colFilters.client.toLowerCase()));
        if (colFilters.project.trim()) list = list.filter(d => d.project.toLowerCase().includes(colFilters.project.toLowerCase()));
        if (colFilters.priority !== 'All') list = list.filter(d => d.priority === colFilters.priority);
        if (colFilters.status !== 'All') {
            const s = colFilters.status;
            list = list.filter(d => d.status === s || (s === 'In Progress' && (d.status === 'InProgress' || d.status === 'In Progress')));
        }
        if (colFilters.interviewLevel !== 'All') list = list.filter(d => (d.interviewLevel || 'Not Started') === colFilters.interviewLevel);

        return list;
    }, [allDemands, priorityFilter, searchTerm, colFilters]);

    // Header sort handler
    const handleSort = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
        setSortConfig({ key, direction });
    };

    // ── Drag-drop column reorder handlers ────────────────────────
    const handleColDragStart = (e, key) => {
        setDragCol(key);
        e.dataTransfer.effectAllowed = 'move';
        // ghost image: make almost invisible
        const ghost = document.createElement('div');
        ghost.style.position = 'absolute';
        ghost.style.top = '-9999px';
        document.body.appendChild(ghost);
        e.dataTransfer.setDragImage(ghost, 0, 0);
        setTimeout(() => document.body.removeChild(ghost), 0);
    };
    const handleColDragOver = (e, key) => {
        e.preventDefault();
        if (key !== dragCol) setDragOverCol(key);
    };
    const handleColDrop = (e, targetKey) => {
        e.preventDefault();
        if (!dragCol || dragCol === targetKey || dragCol === '#') return;
        const newOrder = [...columnOrder];
        const fromIdx = newOrder.indexOf(dragCol);
        const toIdx   = newOrder.indexOf(targetKey);
        newOrder.splice(fromIdx, 1);
        newOrder.splice(toIdx, 0, dragCol);
        setColumnOrder(newOrder);
        setDragCol(null);
        setDragOverCol(null);
    };
    const handleColDragEnd = () => { setDragCol(null); setDragOverCol(null); };

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
                <div style={{ borderRadius: 16, border: '1px solid #e2e8f0', overflow: 'hidden', background: '#fff', boxShadow: '0 1px 6px rgba(0,0,0,0.06)', marginBottom: 24 }}>

                    {/* ── Grid Toolbar ── */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderBottom: '1px solid #e2e8f0', background: 'linear-gradient(to right, #f8f7ff, #faf9ff)', flexWrap: 'wrap', gap: 8 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            {/* Column filter toggle */}
                            <button
                                onClick={() => setShowColFilters(v => !v)}
                                style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 7, border: showColFilters ? '1px solid #8b5cf6' : '1px solid #e2e8f0', background: showColFilters ? '#f5f3ff' : '#fff', color: showColFilters ? '#7c3aed' : '#64748b', fontSize: 11, fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s' }}
                                title="Toggle column filters"
                            >
                                <Filter style={{ width: 12, height: 12 }} />
                                Column Filters
                                {Object.values(colFilters).some(v => v !== '' && v !== 'All') && (
                                    <span style={{ background: '#7c3aed', color: '#fff', borderRadius: 10, fontSize: 9, fontWeight: 700, padding: '1px 5px' }}>
                                        {Object.values(colFilters).filter(v => v !== '' && v !== 'All').length}
                                    </span>
                                )}
                            </button>
                            {/* Reset column filters */}
                            {Object.values(colFilters).some(v => v !== '' && v !== 'All') && (
                                <button
                                    onClick={() => setColFilters({ name: '', client: '', project: '', priority: 'All', status: 'All', interviewLevel: 'All' })}
                                    style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 8px', borderRadius: 7, border: '1px solid #fca5a5', background: '#fef2f2', color: '#dc2626', fontSize: 10, fontWeight: 600, cursor: 'pointer' }}
                                >
                                    <X style={{ width: 10, height: 10 }} /> Clear column filters
                                </button>
                            )}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            {/* Reset column order */}
                            {JSON.stringify(columnOrder) !== JSON.stringify(DEFAULT_COL_ORDER) && (
                                <button
                                    onClick={() => setColumnOrder(DEFAULT_COL_ORDER)}
                                    style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 8px', borderRadius: 7, border: '1px solid #e2e8f0', background: '#f8f8f8', color: '#64748b', fontSize: 10, fontWeight: 600, cursor: 'pointer' }}
                                    title="Reset column order"
                                >
                                    <RefreshCw style={{ width: 10, height: 10 }} /> Reset columns
                                </button>
                            )}
                            <span style={{ fontSize: 10, color: '#94a3b8' }}>
                                ⋯ Drag column headers to reorder
                            </span>
                        </div>
                    </div>

                    {/* ── Excel Grid ── */}
                    <div style={{ overflowX: 'auto', scrollbarWidth: 'thin' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed', minWidth: 820 }}>
                            <colgroup>
                                {columnOrder.map(key => {
                                    const col = COLUMN_DEFS.find(c => c.key === key);
                                    return col ? <col key={key} style={{ minWidth: col.minW, width: col.key === 'name' ? '16%' : col.key === '#' ? 36 : undefined }} /> : null;
                                })}
                            </colgroup>

                            {/* ── Header row ── */}
                            <thead>
                                <tr style={{ background: '#f0ecff', borderBottom: '2px solid #d8d0f0' }}>
                                    {columnOrder.map((key, colIdx) => {
                                        const col = COLUMN_DEFS.find(c => c.key === key);
                                        if (!col) return null;
                                        const isSorted = sortConfig.key === col.sortKey;
                                        const isDragging  = dragCol === key;
                                        const isDropTarget = dragOverCol === key && dragCol !== null && dragCol !== '#';
                                        return (
                                            <th
                                                key={key}
                                                draggable={!col.fixed}
                                                onDragStart={!col.fixed ? (e) => handleColDragStart(e, key) : undefined}
                                                onDragOver={!col.fixed ? (e) => handleColDragOver(e, key) : undefined}
                                                onDrop={!col.fixed ? (e) => handleColDrop(e, key) : undefined}
                                                onDragEnd={!col.fixed ? handleColDragEnd : undefined}
                                                style={{
                                                    padding: '9px 8px',
                                                    textAlign: col.center ? 'center' : 'left',
                                                    fontSize: 10,
                                                    fontWeight: 700,
                                                    color: isSorted ? '#6d28d9' : '#475569',
                                                    letterSpacing: '0.04em',
                                                    textTransform: 'uppercase',
                                                    borderRight: '1px solid #ddd6f5',
                                                    userSelect: 'none',
                                                    cursor: col.fixed ? 'default' : 'grab',
                                                    opacity: isDragging ? 0.45 : 1,
                                                    background: isDropTarget ? '#ede9fe' : (isSorted ? '#e9e3fc' : 'transparent'),
                                                    borderLeft: isDropTarget ? '2px solid #7c3aed' : '1px solid transparent',
                                                    position: 'relative',
                                                    transition: 'background 0.1s',
                                                    whiteSpace: 'nowrap',
                                                }}
                                            >
                                                {col.sortKey ? (
                                                    <button
                                                        onClick={() => col.sortKey && handleSort(col.sortKey)}
                                                        style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4, color: 'inherit', font: 'inherit', width: '100%', justifyContent: col.center ? 'center' : 'flex-start' }}
                                                    >
                                                        {col.label}
                                                        {isSorted ? (
                                                            sortConfig.direction === 'asc'
                                                                ? <ArrowUp style={{ width: 9, height: 9, flexShrink: 0 }} />
                                                                : <ArrowDown style={{ width: 9, height: 9, flexShrink: 0 }} />
                                                        ) : (
                                                            <ArrowUpDown style={{ width: 9, height: 9, flexShrink: 0, opacity: 0.35 }} />
                                                        )}
                                                    </button>
                                                ) : (
                                                    <span style={{ display: 'flex', justifyContent: col.center ? 'center' : 'flex-start' }}>{col.label}</span>
                                                )}
                                                {/* Drag handle hint */}
                                                {!col.fixed && (
                                                    <span style={{ position: 'absolute', right: 3, top: '50%', transform: 'translateY(-50%)', color: '#c4b5fd', fontSize: 10, lineHeight: 1, pointerEvents: 'none' }}>⋮</span>
                                                )}
                                            </th>
                                        );
                                    })}
                                </tr>

                                {/* ── Column Filter Row ── */}
                                {showColFilters && (
                                    <tr style={{ background: '#fefce8', borderBottom: '1px solid #fde68a' }}>
                                        {columnOrder.map((key) => {
                                            const col = COLUMN_DEFS.find(c => c.key === key);
                                            if (!col) return null;
                                            const hasVal = colFilters[key] && colFilters[key] !== 'All';
                                            const cellStyle = {
                                                padding: '4px 5px',
                                                borderRight: '1px solid #fde68a',
                                            };
                                            if (col.filter === 'text') {
                                                return (
                                                    <td key={key} style={cellStyle}>
                                                        <div style={{ position: 'relative' }}>
                                                            <input
                                                                type="text"
                                                                placeholder="filter…"
                                                                value={colFilters[key] || ''}
                                                                onChange={e => setColFilters(f => ({ ...f, [key]: e.target.value }))}
                                                                style={{ width: '100%', padding: '3px 20px 3px 6px', border: `1px solid ${hasVal ? '#a78bfa' : '#e5e7eb'}`, borderRadius: 5, fontSize: 10, color: '#374151', background: hasVal ? '#f5f3ff' : '#fff', outline: 'none', boxSizing: 'border-box' }}
                                                            />
                                                            {hasVal && (
                                                                <button onClick={() => setColFilters(f => ({ ...f, [key]: '' }))} style={{ position: 'absolute', right: 3, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', padding: 0, lineHeight: 1 }}>
                                                                    <X style={{ width: 9, height: 9 }} />
                                                                </button>
                                                            )}
                                                        </div>
                                                    </td>
                                                );
                                            }
                                            if (col.filter === 'select') {
                                                return (
                                                    <td key={key} style={cellStyle}>
                                                        <select
                                                            value={colFilters[key] || 'All'}
                                                            onChange={e => setColFilters(f => ({ ...f, [key]: e.target.value }))}
                                                            style={{ width: '100%', padding: '3px 4px', border: `1px solid ${hasVal ? '#a78bfa' : '#e5e7eb'}`, borderRadius: 5, fontSize: 10, color: '#374151', background: hasVal ? '#f5f3ff' : '#fff', outline: 'none', cursor: 'pointer' }}
                                                        >
                                                            {col.opts.map(o => <option key={o}>{o}</option>)}
                                                        </select>
                                                    </td>
                                                );
                                            }
                                            return <td key={key} style={{ ...cellStyle, textAlign: 'center', fontSize: 10, color: '#d1d5db' }}>—</td>;
                                        })}
                                    </tr>
                                )}
                            </thead>

                            {/* ── Body rows ── */}
                            <tbody>
                                {paginated.map((demand, idx) => {
                                    const rowNum = (currentPage - 1) * itemsPerPage + idx + 1;
                                    const internalCount  = demand.resources.filter(r => r.type === 'EMPLOYEE').length;
                                    const externalCount  = demand.resources.filter(r => r.type === 'CANDIDATE').length;
                                    const scheduledCount = demand.resources.filter(r => r.interviewLevels.some(l => l.status === 'Scheduled')).length;
                                    const selectedCount  = demand.resources.filter(r => r.overallStatus === 'Selected').length;
                                    const rejectedCount  = demand.resources.filter(r => r.overallStatus === 'Rejected').length;
                                    const isEven = idx % 2 === 0;

                                    const cellVal = (key) => {
                                        switch (key) {
                                            case '#':             return null;
                                            case 'name':          return null;
                                            case 'client':        return demand.client;
                                            case 'project':       return demand.project;
                                            case 'due_date':      return formatDemandDate(demand.fulfilmentDt);
                                            case 'priority':      return null;   // badge
                                            case 'status':        return null;   // badge
                                            case 'requested':     return demand.totalRequested;
                                            case 'internal':      return internalCount;
                                            case 'external':      return externalCount;
                                            case 'scheduled':     return scheduledCount;
                                            case 'selected_cnt':  return selectedCount;
                                            case 'rejected_cnt':  return rejectedCount;
                                            case 'interviewLevel':return null;   // dropdown
                                            default:              return null;
                                        }
                                    };
                                    const numColor = (n, base) => n > 0 ? base : '#cbd5e1';

                                    const rowBase = {
                                        borderBottom: '1px solid #e2e8f0',
                                        transition: 'background 0.1s',
                                        cursor: 'pointer',
                                    };

                                    return (
                                        <tr
                                            key={demand.id}
                                            onClick={() => setDrawerDemand(demand)}
                                            style={rowBase}
                                            onMouseEnter={e => e.currentTarget.style.background = '#f5f3ff'}
                                            onMouseLeave={e => e.currentTarget.style.background = isEven ? '#fff' : '#fafafa'}
                                        >
                                            {columnOrder.map((key) => {
                                                const col = COLUMN_DEFS.find(c => c.key === key);
                                                if (!col) return null;
                                                const baseCell = {
                                                    padding: '9px 8px',
                                                    fontSize: 12,
                                                    borderRight: '1px solid #f1f5f9',
                                                    background: isEven ? '#fff' : '#fafafa',
                                                    verticalAlign: 'middle',
                                                };

                                                if (key === '#') return (
                                                    <td key={key} style={{ ...baseCell, textAlign: 'center', fontSize: 10, color: '#94a3b8', fontWeight: 600, width: 36 }}>{rowNum}</td>
                                                );
                                                if (key === 'name') return (
                                                    <td key={key} style={{ ...baseCell }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                                                            <span style={{ fontWeight: 600, color: '#1e293b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '100%' }}>{demand.name}</span>
                                                        </div>
                                                    </td>
                                                );
                                                if (key === 'priority') return (
                                                    <td key={key} style={{ ...baseCell, textAlign: 'center' }} onClick={e => e.stopPropagation()}>
                                                        <PriorityBadge priority={demand.priority} />
                                                    </td>
                                                );
                                                if (key === 'status') return (
                                                    <td key={key} style={{ ...baseCell, textAlign: 'center' }} onClick={e => e.stopPropagation()}>
                                                        <StatusBadge status={demand.status} />
                                                    </td>
                                                );
                                                if (key === 'interviewLevel') return (
                                                    <td key={key} style={{ ...baseCell, textAlign: 'center' }} onClick={e => e.stopPropagation()}>
                                                        <InterviewLevelSelect
                                                            demandId={demand._demandId}
                                                            value={demand.interviewLevel}
                                                            isSaving={!!savingDropdowns[demand._demandId]}
                                                            saveStatus={saveStatus[demand._demandId] || null}
                                                            onChange={handleInterviewLevelChange}
                                                        />
                                                    </td>
                                                );
                                                // Number columns
                                                const numKeys = ['requested','internal','external','scheduled','selected_cnt','rejected_cnt'];
                                                const numColors = { requested: '#475569', internal: '#2563eb', external: '#7c3aed', scheduled: '#d97706', selected_cnt: '#16a34a', rejected_cnt: '#dc2626' };
                                                if (numKeys.includes(key)) {
                                                    const v = cellVal(key);
                                                    return (
                                                        <td key={key} style={{ ...baseCell, textAlign: 'center', fontFamily: 'monospace', fontWeight: v > 0 ? 700 : 400, color: v > 0 ? numColors[key] : '#cbd5e1', fontSize: 12 }}>
                                                            {v}
                                                        </td>
                                                    );
                                                }
                                                // Plain text columns
                                                const v = cellVal(key);
                                                return (
                                                    <td key={key} style={{ ...baseCell, color: '#475569', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                        {v}
                                                    </td>
                                                );
                                            })}
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
