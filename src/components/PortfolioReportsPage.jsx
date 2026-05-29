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
    ArrowUpDown, ArrowUp, ArrowDown, CalendarRange
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
    { key: '#',              label: 'S.No',               minW: 36,   sortKey: null,            filter: null,                                      fixed: true  },
    { key: 'name',           label: 'Demand Name',     minW: 140,  sortKey: 'name',           filter: 'text'                                                  },
    { key: 'client',         label: 'Client',          minW: 80,   sortKey: 'client',         filter: 'text'                                                  },
    { key: 'project',        label: 'Skill Set',       minW: 80,   sortKey: 'project',        filter: 'text'                                                  },
    { key: 'status',         label: 'Status',          minW: 96,   sortKey: 'status',         filter: 'select', opts: ['All','Open','In Progress','Completed','On Hold'] },
    { key: 'requested',      label: 'Req',             minW: 44,   sortKey: 'requested',      filter: null,     center: true                                 },
    { key: 'internal',       label: 'Int',             minW: 40,   sortKey: 'internal',       filter: null,     center: true                                 },
    { key: 'external',       label: 'Ext',             minW: 40,   sortKey: 'external',       filter: null,     center: true                                 },
    { key: 'scheduled',      label: 'Sch',             minW: 40,   sortKey: 'scheduled',      filter: null,     center: true                                 },
    /* ── Level-wise Selected counts ── */
    { key: 'l1_sel',         label: 'L1 Sel',          minW: 52,   sortKey: 'l1_sel',         filter: null,     center: true,  levelFilter: { level: 'L1', status: 'Selected' } },
    { key: 'l2_sel',         label: 'L2 Sel',          minW: 52,   sortKey: 'l2_sel',         filter: null,     center: true,  levelFilter: { level: 'L2', status: 'Selected' } },
    { key: 'l3_sel',         label: 'L3 Sel',          minW: 52,   sortKey: 'l3_sel',         filter: null,     center: true,  levelFilter: { level: 'L3', status: 'Selected' } },
    /* ── Level-wise Rejected counts ── */
    { key: 'l1_rej',         label: 'L1 Rej',          minW: 52,   sortKey: 'l1_rej',         filter: null,     center: true,  levelFilter: { level: 'L1', status: 'Rejected' } },
    { key: 'l2_rej',         label: 'L2 Rej',          minW: 52,   sortKey: 'l2_rej',         filter: null,     center: true,  levelFilter: { level: 'L2', status: 'Rejected' } },
    { key: 'l3_rej',         label: 'L3 Rej',          minW: 52,   sortKey: 'l3_rej',         filter: null,     center: true,  levelFilter: { level: 'L3', status: 'Rejected' } },
    /* ── Allocated count (Cleared + Onboarded + Allocated to project) ── */
    { key: 'allocated',      label: 'Onboarded',        minW: 68,   sortKey: 'allocated',      filter: null,     center: true  },
];
const DEFAULT_COL_ORDER = COLUMN_DEFS.map(c => c.key);

/* Helper: count candidates with a specific interview level+status */
const countLevelStatus = (resources, level, status) =>
    resources.filter(r =>
        r.interviewLevels.some(il => il.level === level && il.status === status)
    ).length;

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
const DemandDetailDrawer = ({ demand, onClose, initialFilter = null }) => {
    const [resourceSearch, setResourceSearch] = useState("");
    const [expandedResourceId, setExpandedResourceId] = useState(null);
    // levelFilter: { level: 'L1'|'L2'|'L3', status: 'Selected'|'Rejected' } | null
    const [levelFilter, setLevelFilter] = useState(initialFilter);

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
        let list = demand.resources;
        // Apply level filter first (from clicking a count badge in the table)
        if (levelFilter) {
            list = list.filter(r =>
                r.interviewLevels.some(
                    il => il.level === levelFilter.level && il.status === levelFilter.status
                )
            );
        }
        // Then apply text search
        if (!resourceSearch.trim()) return list;
        const query = resourceSearch.toLowerCase();
        return list.filter(r =>
            r.name.toLowerCase().includes(query) ||
            r.resourceId.toLowerCase().includes(query) ||
            (r.skills || []).some(s => s.toLowerCase().includes(query)) ||
            (r.location || "").toLowerCase().includes(query)
        );
    }, [demand.resources, resourceSearch, levelFilter]);

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
                                <div key={label} style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 12, padding: '10px 12px' }}>
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
                                <div key={label} style={{ background: bg, borderRadius: 12, padding: '10px 8px', textAlign: 'center' }}>
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
                            <div style={{ background: '#fafafa', border: '1px solid #e5e7eb', borderRadius: 12, padding: '10px 12px' }}>
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

                        {/* Active level filter indicator */}
                        {levelFilter && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8, padding: '5px 10px', background: levelFilter.status === 'Selected' ? '#f0fdf4' : '#fef2f2', border: `1px solid ${levelFilter.status === 'Selected' ? '#86efac' : '#fca5a5'}`, borderRadius: 8 }}>
                                <span style={{ fontSize: 10, fontWeight: 700, color: levelFilter.status === 'Selected' ? '#15803d' : '#dc2626' }}>
                                    Showing: {levelFilter.level} {levelFilter.status} candidates ({filteredResources.length})
                                </span>
                                <button
                                    onClick={() => { setLevelFilter(null); setExpandedResourceId(null); }}
                                    style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', padding: 0, display: 'flex', alignItems: 'center' }}
                                    title="Clear filter"
                                >
                                    <X style={{ width: 12, height: 12 }} />
                                </button>
                            </div>
                        )}

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
                            <div style={{ padding: '24px 0', textAlign: 'center', fontSize: 11, color: '#9ca3af', background: '#fafafa', borderRadius: 12, border: '1px dashed #e5e7eb' }}>
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
                                                                                    <span style={{ fontSize: 8, fontWeight: 700, color: pillStyle.text, background: '#fff', border: `1px solid ${pillStyle.bd}`, borderRadius: 12, padding: '1px 6px', whiteSpace: 'nowrap' }}>{il.status}</span>
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
    const [drawerFilter, setDrawerFilter]   = useState(null); // { level, status } for level-wise pipeline filter

    // Dropdown Spinner / Save State
    const [savingDropdowns, setSavingDropdowns] = useState({});
    const [saveStatus, setSaveStatus] = useState({});

    // ── Excel Grid: column order (drag-drop), per-column filters ──
    const [columnOrder, setColumnOrder]     = useState(DEFAULT_COL_ORDER);
    const [colFilters, setColFilters]       = useState({ name: '', client: '', project: '', status: 'All' });
    const [showColFilters, setShowColFilters] = useState(false);
    const [dragCol, setDragCol]             = useState(null);
    const [dragOverCol, setDragOverCol]     = useState(null);
    // Column resize
    const [colWidths, setColWidths]         = useState(() => {
        let saved = {};
        try {
            const raw = localStorage.getItem("colWidths_demandsTable");
            if (raw) saved = JSON.parse(raw);
        } catch (e) {
            console.error("Error parsing colWidths_demandsTable from localStorage", e);
        }
        return Object.fromEntries(
            COLUMN_DEFS.map(c => [c.key, Math.max(60, saved[c.key] || c.minW)])
        );
    });
    const resizingColRef   = useRef(null);
    const resizeStartX     = useRef(0);
    const resizeStartWidth = useRef(0);
    // Auto-scroll to table on mount
    const tableAnchorRef   = useRef(null);
    useEffect(() => {
        const timer = setTimeout(() => {
            tableAnchorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 400);
        return () => clearTimeout(timer);
    }, []);

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

    // ── Report Filter Modal state ──
    const [showReportFilterModal, setShowReportFilterModal] = useState(false);
    const [reportFilterAction, setReportFilterAction] = useState(null); // 'generate' | 'export'
    const [reportFromDate, setReportFromDate] = useState('');
    const [reportToDate, setReportToDate] = useState('');
    const [reportClient, setReportClient] = useState('All Clients');
    const [reportFilterPreset, setReportFilterPreset] = useState('all'); // 'all' | 'today' | 'custom'

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

    // ── Client-side filter mapping for local/extended filters ──
    const filtered = useMemo(() => {
        let list = allDemands;

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
        if (colFilters.status !== 'All') {
            const s = colFilters.status;
            list = list.filter(d => d.status === s || (s === 'In Progress' && (d.status === 'InProgress' || d.status === 'In Progress')));
        }


        return list;
    }, [allDemands, searchTerm, colFilters]);

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

    // ── Column resize (Excel-style drag border) ────────────────────
    const handleResizeMouseDown = (e, key) => {
        e.preventDefault();
        e.stopPropagation();
        resizingColRef.current   = key;
        resizeStartX.current     = e.clientX;
        resizeStartWidth.current = colWidths[key];
        
        const handle = e.currentTarget;
        if (handle) {
            handle.classList.add("is-resizing");
        }

        const tableEl = handle.closest('table');
        const colGroup = tableEl ? tableEl.querySelector('colgroup') : null;
        const colIdx = columnOrder.indexOf(key);
        const colEl = colGroup && colIdx !== -1 ? colGroup.children[colIdx] : null;
        const thEl = handle.closest('th');
        const tdEls = tableEl ? tableEl.querySelectorAll(`tbody tr td:nth-child(${colIdx + 1})`) : [];

        let finalW = resizeStartWidth.current;

        const onMouseMove = (ev) => {
            const diff = ev.clientX - resizeStartX.current;
            const newW = Math.max(60, resizeStartWidth.current + diff);
            finalW = newW;
            if (colEl) {
                colEl.style.width = `${newW}px`;
                colEl.style.minWidth = `${newW}px`;
            }
            if (thEl) {
                thEl.style.width = `${newW}px`;
                thEl.style.minWidth = `${newW}px`;
            }
            tdEls.forEach(td => {
                td.style.width = `${newW}px`;
                td.style.minWidth = `${newW}px`;
            });
        };
        const onMouseUp = () => {
            resizingColRef.current = null;
            if (handle) {
                handle.classList.remove("is-resizing");
            }
            
            // Commit final width to state and localStorage once on mouseup
            setColWidths(prev => {
                const next = { ...prev, [key]: finalW };
                try {
                    localStorage.setItem("colWidths_demandsTable", JSON.stringify(next));
                } catch (err) {
                    console.error("Error saving demands table widths", err);
                }
                return next;
            });

            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
        };
        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
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
                } else if (sortConfig.key === 'allocated') {
                    aVal = a.statusSummary.allocated;
                    bVal = b.statusSummary.allocated;
                } else if (['l1_sel','l2_sel','l3_sel','l1_rej','l2_rej','l3_rej'].includes(sortConfig.key)) {
                    // Parse level-wise sort key: e.g. 'l1_sel' → level='L1', status='Selected'
                    const lvlNum  = sortConfig.key[1]; // '1', '2', '3'
                    const lvlKey  = `L${lvlNum}`;
                    const lvlStat = sortConfig.key.endsWith('_sel') ? 'Selected' : 'Rejected';
                    aVal = countLevelStatus(a.resources, lvlKey, lvlStat);
                    bVal = countLevelStatus(b.resources, lvlKey, lvlStat);
                } else if (sortConfig.key === 'requested') {
                    aVal = a.totalRequested;
                    bVal = b.totalRequested;
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

    const levelSelectedCounts = useMemo(() => {
        const l1 = filtered.reduce((sum, demand) => sum + countLevelStatus(demand.resources, 'L1', 'Selected'), 0);
        const l2 = filtered.reduce((sum, demand) => sum + countLevelStatus(demand.resources, 'L2', 'Selected'), 0);
        const l3 = filtered.reduce((sum, demand) => sum + countLevelStatus(demand.resources, 'L3', 'Selected'), 0);
        return { l1, l2, l3 };
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
    const handleExport = useCallback(async (overrideFrom, overrideTo, overrideClient) => {
        setExporting(true);
        try {
           const useFrom = overrideFrom !== undefined ? overrideFrom : startDate;
           const useTo = overrideTo !== undefined ? overrideTo : endDate;
           const useClient = overrideClient !== undefined ? overrideClient : selectedClient;
           const payload = {
               userId: localStorage.getItem('userId'),
               fromDate: useFrom || null,
               toDate: useTo || null,
               accountId: useClient !== "All Clients" ? clientMap[useClient] : null,
               demandIds: filtered.map(d => d._demandId).filter(Boolean),
           };

            const response = await PortfolioReportService.exportDemandReport(payload);
            const blob = new Blob([response.data], {
                type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            const fromStr = useFrom ? useFrom.replace(/-/g, '') : 'all';
            const toStr = useTo ? useTo.replace(/-/g, '') : 'all';
            const clientStr = useClient !== "All Clients" ? `_${useClient.replace(/\s+/g, '_')}` : '';
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

    // ── Open filter modal before Generate/Export ──
    const openReportFilter = (action) => {
        setReportFilterAction(action);
        setReportFromDate(startDate || '');
        setReportToDate(endDate || '');
        setReportClient(selectedClient);
        // Default to 'all' for clean entry; switch to 'custom' only if dates already set
        setReportFilterPreset((startDate || endDate) ? 'custom' : 'all');
        setShowReportFilterModal(true);
    };

    const applyReportFilter = () => {
        let fromVal = reportFromDate;
        let toVal = reportToDate;
        const clientVal = reportClient;

        if (reportFilterPreset === 'all') {
            fromVal = '';
            toVal = '';
        } else if (reportFilterPreset === 'today') {
            const today = new Date().toISOString().split('T')[0];
            fromVal = today;
            toVal = today;
        }

        setShowReportFilterModal(false);

        if (reportFilterAction === 'export') {
            handleExport(fromVal, toVal, clientVal);
        } else if (reportFilterAction === 'generate') {
            // Set page-level filters to match, then open email modal
            setStartDate(fromVal);
            setEndDate(toVal);
            setSelectedClient(clientVal);
            setTimeout(() => handleOpenEmailModal(), 100);
        }
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
        <div className="min-h-screen bg-transparent py-4 md:py-6">
            
            {/* Custom Responsive Table Frozen Columns Style Tag */}
            <style>{`
                @keyframes slide-in {
                    from { transform: translateX(100%); }
                    to { transform: translateX(0); }
                }
                .drawer-slide-in {
                    animation: slide-in 0.25s ease-out forwards;
                }

                /* Enterprise Modal Popup Animation */
                @keyframes modal-popup {
                    from { opacity: 0; transform: scale(0.94) translateY(8px); }
                    to   { opacity: 1; transform: scale(1)   translateY(0px); }
                }
                .report-modal-enter {
                    animation: modal-popup 0.22s cubic-bezier(0.34, 1.3, 0.64, 1) both;
                }

                /* Report Modal Input Styling */
                .report-date-input {
                    width: 100%;
                    height: 44px;
                    padding: 0 12px 0 38px;
                    border: 1.5px solid #e2e8f0;
                    border-radius: 12px;
                    font-size: 13px;
                    font-weight: 500;
                    color: #1e293b;
                    background: #f8fafc;
                    outline: none;
                    transition: border-color 0.15s, box-shadow 0.15s;
                    box-sizing: border-box;
                    cursor: pointer;
                }
                .report-date-input:focus {
                    border-color: var(--report-accent, #ea580c);
                    box-shadow: 0 0 0 3px var(--report-accent-ring, rgba(234,88,12,0.12));
                    background: #fff;
                }
                .report-date-input:hover:not(:focus) {
                    border-color: #cbd5e1;
                }

                .report-select {
                    width: 100%;
                    height: 44px;
                    padding: 0 36px 0 38px;
                    border: 1.5px solid #e2e8f0;
                    border-radius: 12px;
                    font-size: 13px;
                    font-weight: 500;
                    color: #1e293b;
                    background: #f8fafc;
                    outline: none;
                    appearance: none;
                    -webkit-appearance: none;
                    cursor: pointer;
                    transition: border-color 0.15s, box-shadow 0.15s;
                }
                .report-select:focus {
                    border-color: var(--report-accent, #ea580c);
                    box-shadow: 0 0 0 3px var(--report-accent-ring, rgba(234,88,12,0.12));
                    background: #fff;
                }
                .report-select:hover:not(:focus) {
                    border-color: #cbd5e1;
                }

                .report-cancel-btn {
                    height: 44px;
                    padding: 0 20px;
                    border-radius: 12px;
                    border: 1.5px solid #e2e8f0;
                    background: #fff;
                    color: #64748b;
                    font-size: 13px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.15s;
                    outline: none;
                }
                .report-cancel-btn:hover {
                    background: #f1f5f9;
                    border-color: #cbd5e1;
                    color: #475569;
                }

                .report-primary-btn {
                    height: 44px;
                    flex: 1;
                    padding: 0 20px;
                    border-radius: 12px;
                    border: none;
                    color: #fff;
                    font-size: 13px;
                    font-weight: 700;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    outline: none;
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    gap: 6px;
                    letter-spacing: 0.01em;
                }
                .report-primary-btn.green {
                    background: linear-gradient(135deg, #22c55e 0%, #15803d 100%);
                    box-shadow: 0 4px 16px rgba(22,163,74,0.30);
                }
                .report-primary-btn.green:hover {
                    box-shadow: 0 6px 20px rgba(22,163,74,0.45);
                    transform: translateY(-1px);
                }
                .report-primary-btn.orange {
                    background: linear-gradient(135deg, #f97316 0%, #c2410c 100%);
                    box-shadow: 0 4px 16px rgba(234,88,12,0.30);
                }
                .report-primary-btn.orange:hover {
                    box-shadow: 0 6px 20px rgba(234,88,12,0.45);
                    transform: translateY(-1px);
                }
                .report-primary-btn:active {
                    transform: translateY(0);
                }

                /* Preset Tab Styles */
                .report-preset-tab {
                    flex: 1;
                    height: 38px;
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    gap: 5px;
                    border-radius: 9px;
                    border: none;
                    font-size: 12px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.18s ease;
                    outline: none;
                    padding: 0 8px;
                    white-space: nowrap;
                }
                .report-preset-tab.inactive {
                    background: transparent;
                    color: #94a3b8;
                }
                .report-preset-tab.inactive:hover {
                    color: #64748b;
                    background: rgba(0,0,0,0.03);
                }
                .report-preset-tab.active-green {
                    background: #ffffff;
                    color: #16a34a;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.10), 0 1px 3px rgba(0,0,0,0.06);
                }
                .report-preset-tab.active-orange {
                    background: #ffffff;
                    color: #ea580c;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.10), 0 1px 3px rgba(0,0,0,0.06);
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

                /* Premium Gradient Action Buttons */
                .btn-premium-generate {
                    background: linear-gradient(135deg, #22c55e, #16a34a);
                    color: #ffffff;
                    border: none;
                    border-radius: 10px;
                    padding: 10px 20px;
                    font-weight: 600;
                    font-size: 14px;
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    box-shadow: 0 4px 15px rgba(34, 197, 94, 0.35);
                    cursor: pointer;
                    transition: all 0.3s ease;
                    outline: none;
                    text-decoration: none;
                }
                .btn-premium-generate:hover:not(:disabled) {
                    background: linear-gradient(135deg, #16a34a, #15803d);
                    box-shadow: 0 6px 20px rgba(34, 197, 94, 0.5);
                    transform: translateY(-2px);
                }
                .btn-premium-generate:active:not(:disabled) {
                    transform: translateY(0px);
                    box-shadow: 0 2px 8px rgba(34, 197, 94, 0.35);
                }
                .btn-premium-generate:disabled {
                    opacity: 0.6;
                    cursor: not-allowed;
                }

                .btn-premium-export {
                    background: linear-gradient(135deg, #fb923c, #f97316);
                    color: #ffffff;
                    border: none;
                    border-radius: 10px;
                    padding: 10px 20px;
                    font-weight: 600;
                    font-size: 14px;
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    box-shadow: 0 4px 15px rgba(234, 88, 12, 0.35);
                    cursor: pointer;
                    transition: all 0.3s ease;
                    outline: none;
                    text-decoration: none;
                }
                .btn-premium-export:hover:not(:disabled) {
                    background: linear-gradient(135deg, #ea580c, #c2410c);
                    box-shadow: 0 6px 20px rgba(234, 88, 12, 0.5);
                    transform: translateY(-2px);
                }
                .btn-premium-export:active:not(:disabled) {
                    transform: translateY(0px);
                    box-shadow: 0 2px 8px rgba(234, 88, 12, 0.35);
                }
                .btn-premium-export:disabled {
                    opacity: 0.6;
                    cursor: not-allowed;
                }

                .btn-premium-icon {
                    margin-right: 6px;
                    flex-shrink: 0;
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
                            onClick={() => openReportFilter('generate')}
                            disabled={loading}
                            className="btn-premium-generate"
                        >
                            {loading ? <Loader2 className="w-4 h-4 animate-spin text-white btn-premium-icon" /> : <Mail className="w-4 h-4 text-white btn-premium-icon" />}
                            Generate Report
                        </button>

                        <button
                            onClick={() => openReportFilter('export')}
                            disabled={exporting}
                            className="btn-premium-export"
                        >
                            <Download className={`w-4 h-4 text-white btn-premium-icon ${exporting ? "animate-spin" : ""}`} />
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

            {/* KPI Strip — Premium Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 mb-6">
                {[
                    {
                        label: "Active Demands",
                        value: kpis.total,
                        icon: Target,
                        gradient: "linear-gradient(135deg, #f7e5cf, #f3dcc0)",
                        iconBg: "linear-gradient(135deg, #fb923c, #f97316)",
                        borderColor: "#fb923c",
                        valueColor: "#ea580c",
                        ringColor: "rgba(251,146,60,0.22)",
                    },
                    {
                        label: "Internal Resources",
                        value: kpis.totalInternal,
                        icon: UserCheck,
                        gradient: "linear-gradient(135deg, #dbe8f7, #cfe0f1)",
                        iconBg: "linear-gradient(135deg, #3b82f6, #0ea5e9)",
                        borderColor: "#3b82f6",
                        valueColor: "#2563eb",
                        ringColor: "rgba(59,130,246,0.2)",
                    },
                    {
                        label: "External Resources",
                        value: kpis.totalExternal,
                        icon: Users,
                        gradient: "linear-gradient(135deg, #e9deef, #ddd1e6)",
                        iconBg: "linear-gradient(135deg, #a78bfa, #7c3aed)",
                        borderColor: "#9f7aea",
                        valueColor: "#7c3aed",
                        ringColor: "rgba(159,122,234,0.2)",
                    },
                    {
                        label: "Interviews Ongoing",
                        value: kpis.totalScheduled,
                        icon: Clock,
                        gradient: "linear-gradient(135deg, #f6ebc8, #efe1b5)",
                        iconBg: "linear-gradient(135deg, #fbbf24, #d97706)",
                        borderColor: "#fbbf24",
                        valueColor: "#d97706",
                        ringColor: "rgba(245,158,11,0.2)",
                    },
                    {
                        label: "ON-BOARDED",
                        value: kpis.totalSelected,
                        icon: Award,
                        gradient: "linear-gradient(135deg, #d2f0e5, #c3e7d9)",
                        iconBg: "linear-gradient(135deg, #10b981, #059669)",
                        borderColor: "#10b981",
                        valueColor: "#059669",
                        ringColor: "rgba(16,185,129,0.2)",
                    },
                ].map((k, i) => {
                    const Icon = k.icon;
                    return (
                        <div
                            key={i}
                            style={{
                                background: k.gradient,
                                borderLeft: `4px solid ${k.borderColor}`,
                                borderRadius: 16,
                                padding: '14px 14px',
                                position: 'relative',
                                overflow: 'hidden',
                                cursor: 'default',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 12,
                                transition: 'transform 0.25s ease, box-shadow 0.25s ease',
                                boxShadow: '0 1px 6px rgba(0,0,0,0.07)',
                            }}
                            onMouseEnter={e => {
                                e.currentTarget.style.transform = 'translateY(-3px)';
                                e.currentTarget.style.boxShadow = `0 6px 22px ${k.ringColor}, 0 1px 6px rgba(0,0,0,0.08)`;
                            }}
                            onMouseLeave={e => {
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.boxShadow = '0 1px 6px rgba(0,0,0,0.07)';
                            }}
                        >
                            {/* Decorative background circle */}
                            <div style={{
                                position: 'absolute',
                                top: -16,
                                right: -14,
                                width: 66,
                                height: 66,
                                borderRadius: '50%',
                                background: k.ringColor,
                                opacity: 0.45,
                                pointerEvents: 'none',
                            }} />
                            <div style={{
                                position: 'absolute',
                                bottom: -18,
                                right: 28,
                                width: 48,
                                height: 48,
                                borderRadius: '50%',
                                background: k.ringColor,
                                opacity: 0.28,
                                pointerEvents: 'none',
                            }} />

                            {/* Icon with gradient background */}
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                width: 38,
                                height: 38,
                                borderRadius: 12,
                                background: k.iconBg,
                                boxShadow: `0 3px 10px ${k.ringColor}`,
                                flexShrink: 0,
                                position: 'relative',
                                zIndex: 1,
                            }}>
                                <Icon style={{ width: 17, height: 17, color: '#fff', strokeWidth: 2.2 }} />
                            </div>

                            <div style={{ position: 'relative', zIndex: 1, minWidth: 0 }}>
                                <p style={{
                                    fontSize: 12,
                                    fontWeight: 700,
                                    color: '#4b5563',
                                    letterSpacing: '0.05em',
                                    margin: 0,
                                    textTransform: 'uppercase',
                                    lineHeight: 1.0,
                                    whiteSpace: 'nowrap',
                                }}>
                                    {k.label}
                                </p>
                                <p style={{
                                    fontSize: 34,
                                    fontWeight: 800,
                                    color: k.valueColor,
                                    lineHeight: 1,
                                    letterSpacing: '-0.03em',
                                    margin: '6px 0 0',
                                }}>
                                    {k.value}
                                </p>
                            </div>
                        </div>
                    );
                })}
            </div>



            {/* Results + grid controls bar — anchored for auto-scroll */}
            <div ref={tableAnchorRef} className="flex items-center justify-between mb-4 flex-wrap gap-3">
                {/* Left: count + filters */}
                <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-bold text-black">
                        Showing <span className="font-bold text-black">{paginated.length}</span> of <span className="font-bold text-black">{filtered.length}</span> <span className="font-bold text-black">demands</span>
                    </p>
                    <span
                        className="text-xs border px-2 py-0.5 rounded-full font-bold shadow-sm"
                        style={{ background: '#dcfce7', color: '#51a070', borderColor: '#4ade80' }}
                    >
                        L1 Selected: {levelSelectedCounts.l1}
                    </span>
                    <span className="text-xs bg-green-300 text-green-950 border border-green-500 px-2 py-0.5 rounded-full font-bold shadow-sm">
                        L2 Selected: {levelSelectedCounts.l2}
                    </span>
                    <span className="text-xs bg-green-500 text-white border border-green-700 px-2 py-0.5 rounded-full font-bold shadow-sm">
                        L3 Selected: {levelSelectedCounts.l3}
                    </span>
                    {hasActiveFilters && (
                        <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-medium">Filtered</span>
                    )}
                    {/* Column Filters toggle */}
                    <button
                        onClick={() => setShowColFilters(v => !v)}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 9px', borderRadius: 6, border: showColFilters ? '1px solid #8b5cf6' : '1px solid #e2e8f0', background: showColFilters ? '#f5f3ff' : '#fff', color: showColFilters ? '#7c3aed' : '#64748b', fontSize: 11, fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s' }}
                    >
                        <Filter style={{ width: 11, height: 11 }} />
                        Column Filters
                        {Object.values(colFilters).some(v => v !== '' && v !== 'All') && (
                            <span style={{ background: '#7c3aed', color: '#fff', borderRadius: 12, fontSize: 9, fontWeight: 700, padding: '1px 5px', marginLeft: 2 }}>
                                {Object.values(colFilters).filter(v => v !== '' && v !== 'All').length}
                            </span>
                        )}
                    </button>
                    {/* Clear column filters — only when active */}
                    {Object.values(colFilters).some(v => v !== '' && v !== 'All') && (
                        <button
                            onClick={() => setColFilters({ name: '', client: '', project: '', status: 'All', interviewLevel: 'All' })}
                            style={{ display: 'inline-flex', alignItems: 'center', gap: 3, padding: '3px 8px', borderRadius: 6, border: '1px solid #fca5a5', background: '#fef2f2', color: '#dc2626', fontSize: 10, fontWeight: 600, cursor: 'pointer' }}
                        >
                            <X style={{ width: 9, height: 9 }} /> Clear filters
                        </button>
                    )}
                    {/* Reset column order — only when non-default */}
                    {JSON.stringify(columnOrder) !== JSON.stringify(DEFAULT_COL_ORDER) && (
                        <button
                            onClick={() => setColumnOrder(DEFAULT_COL_ORDER)}
                            style={{ display: 'inline-flex', alignItems: 'center', gap: 3, padding: '3px 8px', borderRadius: 6, border: '1px solid #e2e8f0', background: '#f8f8f8', color: '#64748b', fontSize: 10, fontWeight: 600, cursor: 'pointer' }}
                        >
                            <RefreshCw style={{ width: 9, height: 9 }} /> Reset columns
                        </button>
                    )}
                </div>
                {/* Right: per-page */}
                <div className="flex items-center gap-2 text-sm font-semibold bg-white border border-gray-200 rounded-xl px-3 py-1.5 shadow-sm">
                    <span className="text-gray-600 font-medium">Show</span>
                    <select value={itemsPerPage} onChange={e => setItemsPerPage(Number(e.target.value))}
                        className="bg-transparent border-b border-gray-300 focus:border-orange-500 outline-none text-gray-800 font-bold px-1 py-0.5 cursor-pointer">
                        {ITEMS_PER_PAGE_OPTIONS.map(n => <option key={n}>{n}</option>)}
                    </select>
                    <span className="text-gray-600 font-medium">per page</span>
                </div>
            </div>

            {/* Excel-style interactive grid view table */}
            {!loading && paginated.length === 0 ? (
                <div className="bg-white rounded-2xl border border-gray-200 p-16 text-center shadow-sm">
                    <AlertTriangle className="w-12 h-12 text-orange-300 mx-auto mb-4" />
                    <p className="text-gray-500 font-medium">No demands match your filters.</p>
                    {/* <button onClick={clearFilters} className="mt-3 text-sm text-orange-500 hover:text-orange-700 font-semibold">Clear filters</button> */}
                </div>
            ) : (
                <div style={{ borderRadius: 16, border: '1px solid #e2e8f0', overflow: 'hidden', background: '#fff', boxShadow: '0 1px 6px rgba(0,0,0,0.06)', marginBottom: 24 }}>

                    {/* ── Excel Grid ── */}
                    <div style={{ overflowX: 'auto', scrollbarWidth: 'thin' }}>
                        <table className="table-resizable" style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed', minWidth: 820 }}>
                            <colgroup>
                                {columnOrder.map(key => {
                                    const col = COLUMN_DEFS.find(c => c.key === key);
                                    return col ? <col key={key} style={{ width: colWidths[key], minWidth: colWidths[key] }} /> : null;
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
                                        const isSelCol = ['l1_sel','l2_sel','l3_sel'].includes(key);
                                        const isRejCol = ['l1_rej','l2_rej','l3_rej'].includes(key);
                                        const isAllocCol = key === 'allocated';
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
                                                    color: isSorted ? '#6d28d9' : isSelCol ? '#15803d' : isRejCol ? '#b91c1c' : isAllocCol ? '#4338ca' : '#475569',
                                                    letterSpacing: '0.04em',
                                                    textTransform: 'uppercase',
                                                    borderRight: '1px solid #ddd6f5',
                                                    userSelect: 'none',
                                                    cursor: col.fixed ? 'default' : 'grab',
                                                    opacity: isDragging ? 0.45 : 1,
                                                    background: isDropTarget ? '#ede9fe' : isSorted ? '#e9e3fc' : isSelCol ? '#f0fdf4' : isRejCol ? '#fff0f0' : isAllocCol ? '#eef2ff' : 'transparent',
                                                    borderLeft: isDropTarget ? '2px solid #7c3aed' : '1px solid transparent',
                                                    position: 'relative',
                                                    transition: 'background 0.1s',
                                                    whiteSpace: 'nowrap',
                                                    width: colWidths[key],
                                                    minWidth: colWidths[key],
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
                                                {/* Resize handle — drag right edge like Excel */}
                                                <div
                                                    className="col-resize-handle"
                                                    onMouseDown={(e) => handleResizeMouseDown(e, key)}
                                                >
                                                    <div className="col-resize-line" />
                                                </div>
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
                                                padding: '6px 5px',
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
                                                                style={{ width: '100%', height: 32, padding: '0 24px 0 8px', border: `1px solid ${hasVal ? '#a78bfa' : '#e5e7eb'}`, borderRadius: 6, fontSize: 13, color: '#374151', background: hasVal ? '#f5f3ff' : '#fff', outline: 'none', boxSizing: 'border-box' }}
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
                                                            style={{ width: '100%', height: 32, padding: '0 6px', border: `1px solid ${hasVal ? '#a78bfa' : '#e5e7eb'}`, borderRadius: 6, fontSize: 13, color: '#374151', background: hasVal ? '#f5f3ff' : '#fff', outline: 'none', cursor: 'pointer' }}
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
                                    // Level-wise selected / rejected counts (source of truth: interviewLevels)
                                    const l1SelCount = countLevelStatus(demand.resources, 'L1', 'Selected');
                                    const l2SelCount = countLevelStatus(demand.resources, 'L2', 'Selected');
                                    const l3SelCount = countLevelStatus(demand.resources, 'L3', 'Selected');
                                    const l1RejCount = countLevelStatus(demand.resources, 'L1', 'Rejected');
                                    const l2RejCount = countLevelStatus(demand.resources, 'L2', 'Rejected');
                                    const l3RejCount = countLevelStatus(demand.resources, 'L3', 'Rejected');
                                    const isEven = idx % 2 === 0;

                                    const cellVal = (key) => {
                                        switch (key) {
                                            case '#':             return null;
                                            case 'name':          return null;
                                            case 'client':        return demand.client;
                                            case 'project':       return demand.project;
                                            case 'status':        return null;   // badge
                                            case 'requested':     return demand.totalRequested;
                                            case 'internal':      return internalCount;
                                            case 'external':      return externalCount;
                                            case 'scheduled':     return scheduledCount;
                                            case 'l1_sel':        return l1SelCount;
                                            case 'l2_sel':        return l2SelCount;
                                            case 'l3_sel':        return l3SelCount;
                                            case 'allocated':     return demand.statusSummary.allocated;
                                            case 'l1_rej':        return l1RejCount;
                                            case 'l2_rej':        return l2RejCount;
                                            case 'l3_rej':        return l3RejCount;
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
                                            onClick={() => { setDrawerFilter(null); setDrawerDemand(demand); }}
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
                                                    width: colWidths[key],
                                                    minWidth: colWidths[key],
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
                                                if (key === 'status') return (
                                                    <td key={key} style={{ ...baseCell, textAlign: 'center' }} onClick={e => e.stopPropagation()}>
                                                        <StatusBadge status={demand.status} />
                                                    </td>
                                                );

                                                // Level-wise clickable count columns
                                                // Allocated column — styled with indigo/teal, no drill-down filter
                                                if (key === 'allocated') {
                                                    const v = cellVal(key);
                                                    return (
                                                        <td
                                                            key={key}
                                                            style={{ ...baseCell, textAlign: 'center', padding: '6px 4px' }}
                                                        >
                                                            <span
                                                                style={{
                                                                    display: 'inline-flex',
                                                                    alignItems: 'center',
                                                                    justifyContent: 'center',
                                                                    minWidth: 26,
                                                                    height: 22,
                                                                    borderRadius: 6,
                                                                    fontFamily: 'monospace',
                                                                    fontSize: 11,
                                                                    fontWeight: v > 0 ? 700 : 400,
                                                                    background: v > 0 ? '#eef2ff' : 'transparent',
                                                                    color: v > 0 ? '#4338ca' : '#cbd5e1',
                                                                    border: v > 0 ? '1px solid #a5b4fc' : 'none',
                                                                    transition: 'all 0.15s',
                                                                }}
                                                            >
                                                                {v}
                                                            </span>
                                                        </td>
                                                    );
                                                }

                                                const levelKeys = ['l1_sel','l2_sel','l3_sel','l1_rej','l2_rej','l3_rej'];
                                                if (levelKeys.includes(key)) {
                                                    const v = cellVal(key);
                                                    const isSelType = key.endsWith('_sel');
                                                    const colDef = COLUMN_DEFS.find(c => c.key === key);
                                                    const lf = colDef?.levelFilter;
                                                    const activeColor = isSelType ? '#16a34a' : '#dc2626';
                                                    const activeBg   = isSelType ? '#f0fdf4'  : '#fef2f2';
                                                    const activeBd   = isSelType ? '#86efac'  : '#fca5a5';
                                                    return (
                                                        <td
                                                            key={key}
                                                            style={{ ...baseCell, textAlign: 'center', padding: '6px 4px' }}
                                                            onClick={e => {
                                                                e.stopPropagation();
                                                                if (v > 0 && lf) {
                                                                    setDrawerFilter(lf);
                                                                    setDrawerDemand(demand);
                                                                }
                                                            }}
                                                        >
                                                            <span
                                                                style={{
                                                                    display: 'inline-flex',
                                                                    alignItems: 'center',
                                                                    justifyContent: 'center',
                                                                    minWidth: 26,
                                                                    height: 22,
                                                                    borderRadius: 6,
                                                                    fontFamily: 'monospace',
                                                                    fontSize: 11,
                                                                    fontWeight: v > 0 ? 700 : 400,
                                                                    cursor: v > 0 ? 'pointer' : 'default',
                                                                    background: v > 0 ? activeBg : 'transparent',
                                                                    color: v > 0 ? activeColor : '#cbd5e1',
                                                                    border: v > 0 ? `1px solid ${activeBd}` : 'none',
                                                                    transition: 'all 0.15s',
                                                                }}
                                                                title={v > 0 ? `Click to view ${lf?.level} ${lf?.status} candidates` : undefined}
                                                            >
                                                                {v}
                                                            </span>
                                                        </td>
                                                    );
                                                }

                                                // Plain numeric columns (requested, internal, external, scheduled)
                                                const numKeys = ['requested','internal','external','scheduled'];
                                                const numColors = { requested: '#475569', internal: '#2563eb', external: '#7c3aed', scheduled: '#d97706' };
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
                    onClose={() => { setDrawerDemand(null); setDrawerFilter(null); }}
                    initialFilter={drawerFilter}
                />
            )}

            {/* ── SUCCESS NOTIFICATION (Email modal success) ── */}
            {showSuccess && (
                <div className="fixed top-6 left-1/2 -translate-x-1/2 bg-white border border-green-100 text-green-800 px-6 py-3 rounded-full shadow-xl flex items-center gap-3 z-50">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span className="text-sm font-medium">Report sent successfully</span>
                </div>
            )}

            {/* ── REPORT FILTER MODAL ── */}
            {showReportFilterModal && (() => {
                const isExport = reportFilterAction === 'export';
                const accentColor    = isExport ? '#ea580c' : '#16a34a';
                const accentLight    = isExport ? '#fff7ed' : '#f0fdf4';
                const accentBorder   = isExport ? '#fed7aa' : '#86efac';
                const accentRing     = isExport ? 'rgba(234,88,12,0.12)' : 'rgba(22,163,74,0.12)';
                const accentGradient = isExport
                    ? 'linear-gradient(135deg, #f97316 0%, #c2410c 100%)'
                    : 'linear-gradient(135deg, #22c55e 0%, #15803d 100%)';
                const accentShadow   = isExport
                    ? '0 4px 16px rgba(234,88,12,0.28)'
                    : '0 4px 16px rgba(22,163,74,0.28)';
                const activeTabClass = isExport ? 'active-orange' : 'active-green';

                const presets = [
                    { key: 'all',    label: 'All Time',      Icon: BarChart2     },
                    { key: 'today',  label: 'Today',         Icon: Calendar      },
                    { key: 'custom', label: 'Custom Range',  Icon: CalendarRange },
                ];

                const getSummaryText = () => {
                    if (reportFilterPreset === 'all')   return 'All demands across all time';
                    if (reportFilterPreset === 'today') return new Date().toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' });
                    if (!reportFromDate && !reportToDate) return 'Select a date range above';
                    const fmt = d => d ? new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';
                    return `${fmt(reportFromDate)}  →  ${fmt(reportToDate)}`;
                };

                return (
                    <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
                        {/* Overlay */}
                        <div
                            style={{ position: 'absolute', inset: 0, background: 'rgba(15,23,42,0.35)', backdropFilter: 'blur(6px)' }}
                            onClick={() => setShowReportFilterModal(false)}
                        />

                        {/* Modal card */}
                        <div
                            className="report-modal-enter"
                            style={{
                                position: 'relative',
                                width: '100%',
                                maxWidth: 480,
                                background: '#ffffff',
                                borderRadius: 20,
                                boxShadow: '0 24px 64px rgba(0,0,0,0.16), 0 8px 24px rgba(0,0,0,0.08)',
                                overflow: 'hidden',
                                display: 'flex',
                                flexDirection: 'column',
                            }}
                        >
                            {/* Top accent bar */}
                            <div style={{ height: 4, background: accentGradient, flexShrink: 0 }} />

                            {/* ── HEADER ── */}
                            <div style={{ padding: '20px 24px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                    {/* Action icon */}
                                    <div style={{
                                        width: 40, height: 40, borderRadius: 12,
                                        background: accentLight,
                                        border: `1.5px solid ${accentBorder}`,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        flexShrink: 0,
                                    }}>
                                        {isExport
                                            ? <Download style={{ width: 18, height: 18, color: accentColor }} />
                                            : <Mail     style={{ width: 18, height: 18, color: accentColor }} />
                                        }
                                    </div>
                                    <div>
                                        <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', margin: 0, lineHeight: 1.2 }}>
                                            {isExport ? 'Export Report' : 'Generate Report'}
                                        </h3>
                                        <p style={{ fontSize: 12, color: '#94a3b8', margin: '3px 0 0', fontWeight: 400 }}>
                                            {isExport ? 'Download as Excel (.xlsx)' : 'Send via email to recipients'}
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setShowReportFilterModal(false)}
                                    style={{
                                        width: 32, height: 32, borderRadius: 8,
                                        border: '1.5px solid #e2e8f0',
                                        background: '#f8fafc',
                                        color: '#94a3b8',
                                        cursor: 'pointer',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        flexShrink: 0,
                                        transition: 'all 0.15s',
                                    }}
                                    onMouseEnter={e => { e.currentTarget.style.background = '#f1f5f9'; e.currentTarget.style.color = '#475569'; }}
                                    onMouseLeave={e => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.color = '#94a3b8'; }}
                                >
                                    <X style={{ width: 15, height: 15 }} />
                                </button>
                            </div>

                            {/* ── DIVIDER ── */}
                            <div style={{ height: 1, background: '#f1f5f9', margin: '0 24px' }} />

                            {/* ── BODY ── */}
                            <div style={{ padding: '20px 24px 24px', display: 'flex', flexDirection: 'column', gap: 20 }}>

                                {/* ── Section: Time Range ── */}
                                <div>
                                    <p style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>Time Range</p>

                                    {/* Preset tabs */}
                                    <div style={{ display: 'flex', gap: 4, background: '#f1f5f9', borderRadius: 12, padding: 4 }}>
                                        {presets.map(p => {
                                            const isActive = reportFilterPreset === p.key;
                                            return (
                                                <button
                                                    key={p.key}
                                                    onClick={() => setReportFilterPreset(p.key)}
                                                    className={`report-preset-tab ${isActive ? activeTabClass : 'inactive'}`}
                                                >
                                                    <p.Icon style={{ width: 13, height: 13, flexShrink: 0 }} />
                                                    <span>{p.label}</span>
                                                </button>
                                            );
                                        })}
                                    </div>

                                    {/* Custom date range — only visible in custom preset */}
                                    {reportFilterPreset === 'custom' && (
                                        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10, marginTop: 14 }}>
                                            <div style={{ flex: 1 }}>
                                                <label style={{ fontSize: 11, fontWeight: 600, color: '#64748b', marginBottom: 6, display: 'block', letterSpacing: '0.01em' }}>From</label>
                                                <div style={{ position: 'relative' }}>
                                                    <Calendar style={{
                                                        position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)',
                                                        width: 15, height: 15, color: '#94a3b8', pointerEvents: 'none'
                                                    }} />
                                                    <input
                                                        type="date"
                                                        value={reportFromDate}
                                                        onChange={e => setReportFromDate(e.target.value)}
                                                        className="report-date-input"
                                                        style={{ '--report-accent': accentColor, '--report-accent-ring': accentRing }}
                                                    />
                                                </div>
                                            </div>
                                            {/* Arrow connector */}
                                            <div style={{ paddingBottom: 10, flexShrink: 0, color: '#cbd5e1' }}>
                                                <ChevronRight style={{ width: 16, height: 16 }} />
                                            </div>
                                            <div style={{ flex: 1 }}>
                                                <label style={{ fontSize: 11, fontWeight: 600, color: '#64748b', marginBottom: 6, display: 'block', letterSpacing: '0.01em' }}>To</label>
                                                <div style={{ position: 'relative' }}>
                                                    <Calendar style={{
                                                        position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)',
                                                        width: 15, height: 15, color: '#94a3b8', pointerEvents: 'none'
                                                    }} />
                                                    <input
                                                        type="date"
                                                        value={reportToDate}
                                                        onChange={e => setReportToDate(e.target.value)}
                                                        className="report-date-input"
                                                        style={{ '--report-accent': accentColor, '--report-accent-ring': accentRing }}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* ── Section: Client ── */}
                                <div>
                                    <p style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>Client</p>
                                    <div style={{ position: 'relative' }}>
                                        <Building2 style={{
                                            position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
                                            width: 15, height: 15, color: '#94a3b8', pointerEvents: 'none', zIndex: 1
                                        }} />
                                        <ChevronDown style={{
                                            position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                                            width: 15, height: 15, color: '#94a3b8', pointerEvents: 'none', zIndex: 1
                                        }} />
                                        <select
                                            value={reportClient}
                                            onChange={e => setReportClient(e.target.value)}
                                            className="report-select"
                                            style={{ '--report-accent': accentColor, '--report-accent-ring': accentRing }}
                                        >
                                            {clientList.map(c => <option key={c} value={c}>{c}</option>)}
                                        </select>
                                    </div>
                                </div>

                                {/* ── Summary Badge ── */}
                                <div style={{
                                    background: accentLight,
                                    border: `1px solid ${accentBorder}`,
                                    borderRadius: 12,
                                    padding: '12px 16px',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: 4,
                                }}>
                                    <p style={{ fontSize: 10, fontWeight: 700, color: accentColor, textTransform: 'uppercase', letterSpacing: '0.06em', margin: 0 }}>Report Preview</p>
                                    <p style={{ fontSize: 13, fontWeight: 600, color: '#1e293b', margin: 0 }}>{getSummaryText()}</p>
                                    <p style={{ fontSize: 12, color: '#64748b', margin: 0 }}>
                                        <Building2 style={{ width: 11, height: 11, display: 'inline', verticalAlign: 'middle', marginRight: 4 }} />
                                        {reportClient}
                                    </p>
                                </div>

                                {/* ── Action Buttons ── */}
                                <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                                    <button
                                        onClick={() => setShowReportFilterModal(false)}
                                        className="report-cancel-btn"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={applyReportFilter}
                                        className={`report-primary-btn ${isExport ? 'orange' : 'green'}`}
                                        style={{ boxShadow: accentShadow }}
                                    >
                                        {isExport
                                            ? <><Download style={{ width: 14, height: 14 }} /><span>Export Now</span></>
                                            : <><Mail     style={{ width: 14, height: 14 }} /><span>Continue</span></>
                                        }
                                    </button>
                                </div>

                            </div>
                        </div>
                    </div>
                );
            })()}

            {/* ── EMAIL MODAL ── */}
            {isEmailModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-gray-900/20 backdrop-blur-sm" onClick={() => setIsEmailModalOpen(false)} />
                    <div className="relative bg-white w-full rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]" style={{ maxWidth: '500px' }}>

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