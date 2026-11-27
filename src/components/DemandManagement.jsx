import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSearchParams } from 'react-router-dom';
import {
  Briefcase,
  Search,
  Filter,
  RefreshCw,
  Clock,
  UserCheck,
  Users,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Building,
  Calendar,
  CalendarCheck,
  CheckCircle,
  AlertCircle,
  XCircle,
  Award,
  FileText,
  Layers,
  ArrowRight,
  TrendingUp,
  X,
  Mail,
  Phone,
  User,
  ShieldCheck,
  Check,
  Sparkles,
  MapPin,
  ChevronLeft,
  Target,
  FileCheck,
  CheckCircle2,
  ListFilter,
  LayoutGrid,
  Table as TableIcon,
  ArrowUpDown,
  Eye,
  History as HistoryIcon,
  Star,
  ExternalLink,
  Send,
  Globe,
  Columns
} from 'lucide-react';
import { Card, CardContent } from './ui/card.jsx';
import { Button } from './ui/button.jsx';
import { Input } from './ui/input.jsx';
import { Badge } from './ui/badge.jsx';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from './ui/dialog.jsx';
import { DemandService } from '../services/DemandService.js';
import { InterviewService } from '../services/InterviewManagementService.js';
import { format } from 'date-fns';
import { toast } from 'sonner';

// Timezone helpers for Asia/Kolkata (IST, UTC+05:30)
const getISTDateString = (dateVal) => {
  if (!dateVal) return null;
  try {
    if (typeof dateVal === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateVal)) {
      return dateVal;
    }
    if (typeof dateVal === 'string' && /^\d{2}[-/]\d{2}[-/]\d{4}/.test(dateVal)) {
      const parts = dateVal.split(/[-/]/);
      return `${parts[2].slice(0, 4)}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
    }
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return null;
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Kolkata',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).format(d);
  } catch {
    return null;
  }
};

const getTodayISTString = () => {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(new Date());
};

const getYesterdayISTString = () => {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(d);
};

const getInterviewScheduledDate = (iv) => {
  if (!iv) return null;
  if (iv.scheduledAt) return iv.scheduledAt;
  if (iv.scheduledAtText) return iv.scheduledAtText;
  if (Array.isArray(iv.levelProgress)) {
    for (const lvl of iv.levelProgress) {
      if (lvl.level !== '__META__' && lvl.scheduledAt) {
        return lvl.scheduledAt;
      }
    }
  }
  return null;
};

const matchesDateFilter = (dateVal, filterType, fromDate, toDate) => {
  if (!filterType || filterType === 'all') return true;
  if (!dateVal) return false;
  const dateStr = getISTDateString(dateVal);
  if (!dateStr) return false;
  const todayStr = getTodayISTString();
  const yesterdayStr = getYesterdayISTString();

  if (filterType === 'today') {
    return dateStr === todayStr;
  }
  if (filterType === 'yesterday') {
    return dateStr === yesterdayStr;
  }
  if (filterType === 'last7days') {
    const d7 = new Date();
    d7.setDate(d7.getDate() - 7);
    const d7Str = getISTDateString(d7);
    return dateStr >= d7Str && dateStr <= todayStr;
  }
  if (filterType === 'custom') {
    if (fromDate && dateStr < fromDate) return false;
    if (toDate && dateStr > toDate) return false;
    return true;
  }
  return true;
};

const formatISTDateTime = (dateVal) => {
  if (!dateVal) return 'N/A';
  try {
    if (typeof dateVal === 'string' && /^\d{2}-\d{2}-\d{4}\s+\d{2}[-:]\d{2}/.test(dateVal)) {
      const [dPart, tPart] = dateVal.split(/\s+/);
      const [day, month, year] = dPart.split('-');
      const [hour, min] = tPart.split(/[-:]/);
      const d = new Date(Number(year), Number(month) - 1, Number(day), Number(hour), Number(min));
      return new Intl.DateTimeFormat('en-IN', {
        timeZone: 'Asia/Kolkata',
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      }).format(d);
    }
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return String(dateVal);
    return new Intl.DateTimeFormat('en-IN', {
      timeZone: 'Asia/Kolkata',
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    }).format(d);
  } catch {
    return String(dateVal);
  }
};

const getInterviewScheduledAt = (iv) => {
  if (!iv) return null;
  if (iv.scheduledAt || iv.scheduledAtText) return iv.scheduledAt || iv.scheduledAtText;
  if (Array.isArray(iv.levelProgress) && iv.levelProgress.length > 0) {
    const realLevels = iv.levelProgress.filter(
      (l) => l && l.level !== '__META__' && l.level !== 'ONBOARDING' && (l.scheduledAt || l.scheduledAtText)
    );
    if (realLevels.length > 0) {
      const last = realLevels[realLevels.length - 1];
      return last.scheduledAt || last.scheduledAtText;
    }
    const anyLvl = iv.levelProgress.find((l) => l && (l.scheduledAt || l.scheduledAtText));
    if (anyLvl) return anyLvl.scheduledAt || anyLvl.scheduledAtText;
  }
  return null;
};

const getInterviewLevel = (iv) => {
  if (!iv) return 'L1';
  if (Array.isArray(iv.levelProgress) && iv.levelProgress.length > 0) {
    const realLevels = iv.levelProgress.filter((l) => l && l.level !== '__META__' && l.level !== 'ONBOARDING');
    if (realLevels.length > 0) {
      const last = realLevels[realLevels.length - 1];
      if (last && last.level) return last.level;
    }
  }
  if (Array.isArray(iv.interviewLevels) && iv.interviewLevels.length > 0) {
    return iv.interviewLevels[0];
  }
  return 'L1';
};

const formatISTDate = (dateVal) => {
  if (!dateVal) return 'N/A';
  try {
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return String(dateVal);
    return new Intl.DateTimeFormat('en-IN', {
      timeZone: 'Asia/Kolkata',
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    }).format(d);
  } catch {
    return String(dateVal);
  }
};

// Clean, deduplicate, and order profile timeline events according to true lifecycle progression:
// SUBMITTED (10) -> INTERVIEW_SCHEDULED (20) -> INTERVIEW_COMPLETED (30) -> SELECTED (40) -> ALLOCATED (50)
const cleanAndSortProfileEvents = (events, defaultDate = null) => {
  if (!Array.isArray(events) || events.length === 0) return [];

  const getStageRank = (evt) => {
    const type = evt?.eventType || '';
    const status = (evt?.newStatus || '').toLowerCase();
    const round = (evt?.roundLevel || '').toUpperCase();
    if (type === 'SUBMITTED') return 10;
    if (type === 'INTERVIEW_SCHEDULED') {
      if (round === 'ONBOARDING' || status.includes('onboard')) return 50;
      return 20;
    }
    if (type === 'INTERVIEW_COMPLETED') {
      if (round === 'ONBOARDING' || status.includes('onboard')) return 50;
      return 30;
    }
    if (type === 'SELECTED') return 40;
    if (type === 'ALLOCATED') return 50;
    if (type === 'REJECTED') return 45;
    return 35;
  };

  // Check if an interview round already has explicit Selection/Clearance
  const hasSpecificSelection = events.some(
    e => e?.eventType === 'INTERVIEW_COMPLETED' &&
         (e?.newStatus || '').toLowerCase().match(/select|clear/)
  );

  // Check if an ALLOCATED milestone is present
  const hasAllocated = events.some(
    e => e?.eventType === 'ALLOCATED'
  );

  // 1. Filter out redundant events (duplicate Selection or fake Onboarding interviews)
  const cleaned = [];
  for (const rawEvt of events) {
    if (!rawEvt) continue;
    const type = rawEvt.eventType || '';
    const status = (rawEvt.newStatus || '').toLowerCase();
    const round = (rawEvt.roundLevel || '').toUpperCase();

    // If a round already states "L1 Selected" / "L2 Selected", drop generic standalone "Selected"
    if (hasSpecificSelection && type === 'SELECTED' && status === 'selected') {
      continue;
    }

    // If candidate has an ALLOCATED event, drop duplicate "ONBOARDING" interview events
    if (hasAllocated && (round === 'ONBOARDING' || status.includes('onboard'))) {
      continue;
    }

    // If no ALLOCATED event exists, convert ONBOARDING interview round to ALLOCATED so it is never shown as "INTERVIEW COMPLETED"
    if (!hasAllocated && (round === 'ONBOARDING' || status.includes('onboard'))) {
      cleaned.push({
        ...rawEvt,
        eventType: 'ALLOCATED',
        roundLevel: null,
        newStatus: rawEvt.newStatus?.replace(/^ONBOARDING\s*/i, '') || 'On Boarded',
      });
      continue;
    }

    cleaned.push(rawEvt);
  }

  // 2. Deduplicate exact matching events
  const deduped = [];
  const seenKeys = new Set();
  for (const evt of cleaned) {
    const key = `${evt.eventType}_${evt.roundLevel || ''}_${(evt.newStatus || '').toLowerCase().trim()}`;
    if (!seenKeys.has(key)) {
      seenKeys.add(key);
      deduped.push(evt);
    }
  }

  // 3. Sort strictly by lifecycle progression, respecting timestamps when > 24 hours apart
  const sorted = [...deduped].sort((a, b) => {
    const rankA = getStageRank(a);
    const rankB = getStageRank(b);

    const timeA = a.timestamp ? new Date(a.timestamp).getTime() : 0;
    const timeB = b.timestamp ? new Date(b.timestamp).getTime() : 0;

    // When events are more than 24 hours apart, verify lifecycle order
    if (timeA && timeB && Math.abs(timeA - timeB) > 86400000) {
      if (rankA < rankB && timeA > timeB) return rankA - rankB;
      if (rankA > rankB && timeA < timeB) return rankA - rankB;
      return timeA - timeB;
    }

    // Same day, within 24h, or missing timestamps: lifecycle progression order is absolute
    if (rankA !== rankB) {
      return rankA - rankB;
    }

    if (timeA && timeB) {
      return timeA - timeB;
    }

    return 0;
  });

  // 4. Fill in missing timestamps progressively so "N/A" is never shown
  for (let i = 0; i < sorted.length; i++) {
    if (!sorted[i].timestamp) {
      let fallback = null;
      for (let j = i - 1; j >= 0; j--) {
        if (sorted[j]?.timestamp) {
          fallback = sorted[j].timestamp;
          break;
        }
      }
      if (!fallback) {
        for (let j = i + 1; j < sorted.length; j++) {
          if (sorted[j]?.timestamp) {
            fallback = sorted[j].timestamp;
            break;
          }
        }
      }
      sorted[i].timestamp = fallback || defaultDate;
    }
  }

  return sorted;
};

// Safe accessors for demand dates
const getDemandOpenDate = (demand) => demand?.demandOpenDt || demand?.demandopendt || demand?.createddt || demand?.createdAt;
const getDemandFulfilmentDate = (demand) => demand?.fulfilmentDt || demand?.fulfilmentdt || demand?.actualFulfilmentDt || demand?.targetDate;

// Avatar background generator matching RMS styling
const getAvatarStyle = (initials) => {
  if (!initials) return { backgroundColor: '#6b7280', color: '#ffffff' };
  const clean = initials.trim().toUpperCase();
  if (clean === 'RV') return { backgroundColor: '#7c3aed', color: '#ffffff' };
  if (clean === 'AS') return { backgroundColor: '#0d9488', color: '#ffffff' };
  const charSum = clean.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
  const colors = [
    '#7c3aed', // purple-600
    '#0d9488', // teal-600
    '#2563eb', // blue-600
    '#4f46e5', // indigo-600
    '#db2777', // pink-600
    '#059669', // emerald-600
  ];
  return { backgroundColor: colors[charSum % colors.length], color: '#ffffff' };
};

// Search Filter Component — Premium RMS Glass style
const SearchFilter = ({ value, onChange, placeholder = 'Search...' }) => (
  <div className="relative w-full group">
    <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-500/10 to-indigo-500/10 opacity-0 group-focus-within:opacity-100 transition-all duration-300 blur-sm pointer-events-none" />
    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 w-4 h-4 transition-colors duration-200" />
    <Input
      type="text"
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="relative pl-10 pr-9 py-2 w-full bg-white/90 backdrop-blur-sm border border-gray-200 rounded-xl shadow-xs focus:ring-2 focus:ring-blue-400/50 focus:border-blue-400 focus:bg-white transition-all duration-200 text-sm placeholder:text-gray-400"
    />
    {value && (
      <button
        onClick={() => onChange('')}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    )}
  </div>
);

// Pagination Component — Professional Enterprise Style
const Pagination = ({
  currentPage,
  totalPages,
  onPageChange,
  itemsPerPage,
  onItemsPerPageChange,
  totalItems,
  label = 'demands'
}) => {
  const itemsPerPageOptions = [3, 5, 10, 15, 20];
  const start = Math.min((currentPage - 1) * itemsPerPage + 1, totalItems);
  const end = Math.min(currentPage * itemsPerPage, totalItems);

  if (totalItems <= 0) return null;

  // Generate numbered page array with ellipsis logic
  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 3) {
        pages.push(1, 2, 3, 4, '...', totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
      }
    }
    return pages;
  };

  return (
    <div className="flex flex-col sm:flex-row justify-between items-center gap-3 py-1 text-xs">
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-slate-500 font-medium">
          Showing <span className="font-bold text-slate-800">{start}</span> to{' '}
          <span className="font-bold text-slate-800">{end}</span> of{' '}
          <span className="font-bold text-slate-800">{totalItems}</span> {label}
        </span>
        {onItemsPerPageChange && (
          <div className="flex items-center gap-2 border-l border-slate-200 pl-3">
            <span className="text-slate-400 font-medium">Per page:</span>
            <select
              value={itemsPerPage}
              onChange={(e) => {
                onItemsPerPageChange(Number(e.target.value));
                onPageChange(1);
              }}
              className="bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-xs text-slate-700 font-semibold focus:ring-2 focus:ring-blue-400 focus:outline-none shadow-xs cursor-pointer hover:border-slate-300"
            >
              {itemsPerPageOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div className="flex items-center gap-1.5">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-xs"
        >
          <ChevronLeft className="w-3.5 h-3.5" /> Prev
        </button>

        <div className="flex items-center gap-1">
          {getPageNumbers().map((p, idx) => {
            if (p === '...') {
              return (
                <span key={`dots-${idx}`} className="px-1.5 text-slate-400 font-bold select-none">
                  ...
                </span>
              );
            }
            const isActive = p === currentPage;
            return (
              <button
                key={p}
                onClick={() => onPageChange(p)}
                className={`w-7 h-7 rounded-lg text-xs font-bold transition-all ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300'
                }`}
              >
                {p}
              </button>
            );
          })}
        </div>

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-xs"
        >
          Next <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};

export default function DemandManagement() {
  const [searchParams, setSearchParams] = useSearchParams();
  const urlTab = searchParams.get('tab');

  // Main 3-Tab Navigation State: 'active-demands' | 'submitted' | 'history'
  const [activeMainTab, setActiveMainTab] = useState(
    urlTab === 'interviews' ? 'interviews' : urlTab === 'submitted' ? 'submitted' : urlTab === 'history' ? 'history' : 'active-demands'
  );

  // Sync tab with URL
  const handleTabChange = (tabId) => {
    setActiveMainTab(tabId);
    setSearchParams({ tab: tabId });
  };

  const [demands, setDemands] = useState([]);
  const [demandFlows, setDemandFlows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // User Identification from localStorage
  const currentUserId = useMemo(() => {
    const raw = localStorage.getItem('userId');
    if (raw) return Number(raw);
    try {
      const u = JSON.parse(localStorage.getItem('user') || '{}');
      if (u.userId || u.id) return Number(u.userId || u.id);
    } catch {}
    return 1;
  }, []);
  const currentUserName = useMemo(() => {
    return localStorage.getItem('userName') || localStorage.getItem('employeeName') || 'HR Manager';
  }, []);
  const currentUserEmail = useMemo(() => {
    return localStorage.getItem('email') || '';
  }, []);

  // ── Tab 1: Active Demands Controls ──
  const [viewMode, setViewMode] = useState('split'); // 'split' | 'table'
  const [selectedSplitDemandId, setSelectedSplitDemandId] = useState(null);
  const [scopeFilter, setScopeFilter] = useState('MY'); // Dedicated User Report: strictly 'MY'
  const [demandDateFilter, setDemandDateFilter] = useState('all'); // 'all' | 'today' | 'yesterday' | 'last7days' | 'custom'
  const [demandFromDate, setDemandFromDate] = useState('');
  const [demandToDate, setDemandToDate] = useState('');

  // ── Tab: Interviews Scheduled State ──
  const [interviews, setInterviews] = useState([]);
  const [interviewsLoading, setInterviewsLoading] = useState(false);
  const [interviewDateFilter, setInterviewDateFilter] = useState('all'); // 'all' | 'today' | 'yesterday' | 'last7days' | 'custom'
  const [interviewFromDate, setInterviewFromDate] = useState('');
  const [interviewToDate, setInterviewToDate] = useState('');
  const [interviewStatusFilter, setInterviewStatusFilter] = useState('ALL');
  const [interviewClientFilter, setInterviewClientFilter] = useState('ALL');
  const [interviewDemandFilter, setInterviewDemandFilter] = useState('ALL');
  const [interviewLevelFilter, setInterviewLevelFilter] = useState('ALL');
  const [interviewSearchQuery, setInterviewSearchQuery] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [clientFilter, setClientFilter] = useState('ALL');
  const [sortField, setSortField] = useState('demandid');
  const [sortOrder, setSortOrder] = useState('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(3);
  const [expandedProfiles, setExpandedProfiles] = useState(new Set());
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [selectedDemandForDetails, setSelectedDemandForDetails] = useState(null);

  // ── Tab 2: Submitted Profiles State ──
  const [submittedProfiles, setSubmittedProfiles] = useState([]);
  const [submittedProfilesLoading, setSubmittedProfilesLoading] = useState(false);
  const [submittedProfilesTotal, setSubmittedProfilesTotal] = useState(0);
  const [submittedProfilesPage, setSubmittedProfilesPage] = useState(1);
  const [submittedProfilesPerPage, setSubmittedProfilesPerPage] = useState(15);
  const [subDateFilter, setSubDateFilter] = useState('all'); // 'all' | 'today' | 'yesterday' | 'last7days' | 'custom'
  const [subFromDate, setSubFromDate] = useState('');
  const [subToDate, setSubToDate] = useState('');
  const [subClientFilter, setSubClientFilter] = useState('ALL');
  const [subDemandFilter, setSubDemandFilter] = useState('ALL');
  const [subStatusFilter, setSubStatusFilter] = useState('ALL');
  const [subSearchQuery, setSubSearchQuery] = useState('');
  const [subSearchInput, setSubSearchInput] = useState('');

  // Debounce subSearchInput into subSearchQuery to prevent unnecessary API calls on every keystroke
  useEffect(() => {
    const timer = setTimeout(() => {
      setSubSearchQuery(subSearchInput);
      setSubmittedProfilesPage(1);
    }, 350);
    return () => clearTimeout(timer);
  }, [subSearchInput]);

  // ── Shared Profiles Activity Summary State (Synchronized with HR Dashboard) ──
  const [sharedSummary, setSharedSummary] = useState(null);
  const [sharedSummaryLoading, setSharedSummaryLoading] = useState(false);

  // ── Tab 3: Profile History State ──
  const [historySelectedDemandId, setHistorySelectedDemandId] = useState('');
  const [historySelectedProfile, setHistorySelectedProfile] = useState(null);
  const [historyEvents, setHistoryEvents] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // ── Modal Profile History Dialog State ──
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [activeHistoryProfile, setActiveHistoryProfile] = useState(null);
  const [activeHistoryDemand, setActiveHistoryDemand] = useState(null);
  const [modalHistoryEvents, setModalHistoryEvents] = useState([]);
  const [modalHistoryLoading, setModalHistoryLoading] = useState(false);

  // Deduplicated & strictly ordered timeline events for Tab 3
  const processedTab3Events = useMemo(() => {
    return cleanAndSortProfileEvents(historyEvents, historySelectedProfile?.sharedAt);
  }, [historyEvents, historySelectedProfile?.sharedAt]);

  // Deduplicated & strictly ordered timeline events for Modal Dialog
  const processedModalEvents = useMemo(() => {
    return cleanAndSortProfileEvents(modalHistoryEvents, activeHistoryProfile?.sharedAt);
  }, [modalHistoryEvents, activeHistoryProfile?.sharedAt]);

  // Check if a demand was created by the currently logged-in user
  const isCreatedByCurrentUser = useCallback(
    (demand) => {
      if (!demand) return false;
      if (currentUserId && demand.requesterUserId && Number(demand.requesterUserId) === currentUserId) {
        return true;
      }
      if (currentUserEmail && demand.requesterEmail && demand.requesterEmail.toLowerCase() === currentUserEmail.toLowerCase()) {
        return true;
      }
      if (currentUserName && demand.requesterName && demand.requesterName.toLowerCase() === currentUserName.toLowerCase()) {
        return true;
      }
      if (demand.createdBy && currentUserName && demand.createdBy.toLowerCase() === currentUserName.toLowerCase()) {
        return true;
      }
      if (currentUserId === 1 && (!demand.requesterUserId || Number(demand.requesterUserId) === 1)) {
        return true;
      }
      return false;
    },
    [currentUserId, currentUserEmail, currentUserName]
  );

  // Check if an interview was scheduled by or assigned to the current user
  const isInterviewScheduledByCurrentUser = useCallback(
    (iv) => {
      if (!iv) return false;
      if (currentUserId && iv.createdByUserId && Number(iv.createdByUserId) === currentUserId) return true;
      if (currentUserId && iv.interviewerUserId && Number(iv.interviewerUserId) === currentUserId) return true;
      if (Array.isArray(iv.levelProgress)) {
        const meta = iv.levelProgress.find((l) => l.level === '__META__');
        if (meta && meta.interviewerUserId && Number(meta.interviewerUserId) === currentUserId) return true;
        const userLvl = iv.levelProgress.find((l) => l.interviewerUserId && Number(l.interviewerUserId) === currentUserId);
        if (userLvl) return true;
      }
      if (currentUserName && iv.createdByUserName && iv.createdByUserName.toLowerCase() === currentUserName.toLowerCase()) return true;
      if (currentUserName && iv.interviewerName && iv.interviewerName.toLowerCase() === currentUserName.toLowerCase()) return true;
      if (iv.demandId) {
        const parentDemand = demands.find((d) => Number(d.demandid) === Number(iv.demandId));
        if (parentDemand && isCreatedByCurrentUser(parentDemand)) return true;
      }
      if (currentUserId === 1) return true;
      return false;
    },
    [currentUserId, currentUserName, demands, isCreatedByCurrentUser]
  );

  // Load demands and flow data
  const loadData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const [listRes, flowRes, ivRes] = await Promise.allSettled([
        DemandService.fetchDemandList(),
        DemandService.fetchDemandFlowList(),
        InterviewService.fetchInterviewList()
      ]);

      let rawDemands = [];
      if (listRes.status === 'fulfilled' && listRes.value?.data?.result) {
        rawDemands = Array.isArray(listRes.value.data.result) ? listRes.value.data.result : [];
      } else if (listRes.status === 'fulfilled' && Array.isArray(listRes.value?.data)) {
        rawDemands = listRes.value.data;
      }

      let rawFlows = [];
      if (flowRes.status === 'fulfilled') {
        const val = flowRes.value;
        if (Array.isArray(val)) rawFlows = val;
        else if (val?.result && Array.isArray(val.result)) rawFlows = val.result;
        else if (val?.data && Array.isArray(val.data)) rawFlows = val.data;
      }

      let rawInterviews = [];
      if (ivRes.status === 'fulfilled') {
        const val = ivRes.value;
        if (Array.isArray(val?.data?.result)) rawInterviews = val.data.result;
        else if (Array.isArray(val?.data)) rawInterviews = val.data;
        else if (Array.isArray(val?.result)) rawInterviews = val.result;
        else if (Array.isArray(val)) rawInterviews = val;
      }

      // Sort newest first by demandid desc
      const sorted = [...rawDemands].sort((a, b) => (b.demandid || 0) - (a.demandid || 0));
      setDemands(sorted);
      setDemandFlows(rawFlows);
      setInterviews(rawInterviews);
    } catch (err) {
      console.error('Failed to load demands data:', err);
      toast.error('Unable to load demands. Please try refreshing.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const loadSharedSummary = useCallback(async () => {
    try {
      setSharedSummaryLoading(true);
      const data = await DemandService.fetchSharedProfilesSummary(currentUserId);
      setSharedSummary(data);
    } catch (err) {
      console.error('Failed to load shared profiles summary in DemandManagement:', err);
    } finally {
      setSharedSummaryLoading(false);
    }
  }, [currentUserId]);

  useEffect(() => {
    loadData();
    loadSharedSummary();
  }, [loadData, loadSharedSummary]);

  // Load Tab 2 Submitted Profiles from Authoritative Backend Endpoint
  const loadSubmittedProfiles = useCallback(async () => {
    setSubmittedProfilesLoading(true);
    try {
      const params = {
        page: submittedProfilesPage - 1,
        size: submittedProfilesPerPage,
        dateFilter: subDateFilter,
      };
      if (currentUserId) {
        params.userId = currentUserId;
      }
      if (subDateFilter === 'custom') {
        if (subFromDate) params.fromDate = subFromDate;
        if (subToDate) params.toDate = subToDate;
      }
      if (subClientFilter !== 'ALL') {
        // find clientId matching accountName
        const found = demands.find(d => (d.accountName || d.companyName) === subClientFilter);
        if (found?.accountId) params.clientId = found.accountId;
      }
      if (subDemandFilter !== 'ALL') {
        params.demandId = Number(subDemandFilter);
      }
      if (subStatusFilter !== 'ALL') {
        params.status = subStatusFilter;
      }
      if (subSearchQuery.trim()) {
        params.search = subSearchQuery.trim();
      }

      const res = await DemandService.fetchSharedProfilesList(params);
      let records = [];
      if (res && res.content) {
        records = res.content;
      } else if (Array.isArray(res)) {
        records = res;
      }

      setSubmittedProfiles(records);
      setSubmittedProfilesTotal(records.length);
    } catch (err) {
      console.error('Failed to load submitted profiles list:', err);
      toast.error('Failed to load submitted profiles');
    } finally {
      setSubmittedProfilesLoading(false);
    }
  }, [
    currentUserId,
    submittedProfilesPage,
    submittedProfilesPerPage,
    subDateFilter,
    subFromDate,
    subToDate,
    subClientFilter,
    subDemandFilter,
    subStatusFilter,
    subSearchQuery,
    demands
  ]);

  useEffect(() => {
    if (activeMainTab === 'submitted') {
      loadSubmittedProfiles();
    }
  }, [activeMainTab, loadSubmittedProfiles]);

  // Load Tab 3 History for Selected Profile
  const fetchHistoryForProfile = useCallback(async (demandId, resourceType, resourceId) => {
    if (!demandId || !resourceId) return;
    setHistoryLoading(true);
    try {
      const events = await DemandService.fetchProfileHistory(demandId, resourceType || 'INTERNAL', resourceId);
      setHistoryEvents(Array.isArray(events) ? events : []);
    } catch (err) {
      console.error('Failed to fetch profile history:', err);
      toast.error('Failed to load profile history');
      setHistoryEvents([]);
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  // Extract all profiles associated with a demand by unifying sharedResumes & demandFlow childRequestDetails
  const getProfilesForDemand = useCallback(
    (demand) => {
      if (!demand) return [];

      const demandFlow = demandFlows.find((f) => {
        const flowId = f.demandInfo?.demandid || f.demandid || f.id;
        return Number(flowId) === Number(demand.demandid);
      });

      const profilesMap = new Map();

      // 1. Enrich from demand.sharedResumes
      if (Array.isArray(demand.sharedResumes)) {
        demand.sharedResumes.forEach((resume) => {
          const resType = (resume.resourceType || 'CANDIDATE').toUpperCase();
          const resId = resume.employeeId || resume.candidateId || resume.resourceId;
          const name = resume.resourceName || resume.employeeName || resume.candidateName || 'Resource';
          const key = `${resType}_${resId}_${name}`;

          profilesMap.set(key, {
            key,
            resourceId: resId,
            resourceName: name,
            resourceType: resType === 'INTERNAL' || resType === 'EMPLOYEE' ? 'EMPLOYEE' : 'CANDIDATE',
            email: resume.email || '',
            phoneNumber: resume.phoneNumber || '',
            designation: resume.designation || demand.demandTitle || '',
            experienceYears: resume.experienceYears || '',
            sharedBy: resume.sharedBy || 'HR Team',
            sharedByEmail: resume.sharedByEmail || '',
            sharedAt: resume.sharedAt,
            status: resume.status || 'Submitted',
            resumeUrl: resume.resumeUrl || resume.filePath || '',
            interviews: [],
            allocation: null,
            childRequests: []
          });
        });
      }

      // 2. Enrich from demandFlows childRequestDetails
      if (demandFlow && Array.isArray(demandFlow.childRequestDetails)) {
        demandFlow.childRequestDetails.forEach((req) => {
          const pipeline = Array.isArray(req.pipeline) ? req.pipeline : [];
          pipeline.forEach((iv) => {
            const cInfo = iv.candidateInfo || {};
            const resType = (cInfo.resourceType || 'CANDIDATE').toUpperCase();
            const resId = resType === 'EMPLOYEE' ? cInfo.employeeId : cInfo.candidateId;
            if (!resId) return;

            const name = cInfo.name || 'Resource';
            const key = `${resType}_${resId}_${name}`;

            let item = profilesMap.get(key);
            if (!item) {
              item = {
                key,
                resourceId: resId,
                resourceName: name,
                resourceType: resType,
                email: cInfo.email || '',
                phoneNumber: cInfo.phoneNumber || '',
                designation: cInfo.designation || demand.demandTitle || '',
                experienceYears: cInfo.experienceYears || '',
                sharedBy: req.createdBy || 'HR Team',
                sharedByEmail: '',
                sharedAt: req.createdDt || null,
                status: cInfo.resumeStatus || req.requestStatus || 'In Pipeline',
                resumeUrl: cInfo.resumeUrl || '',
                interviews: [],
                allocation: null,
                childRequests: []
              };
              profilesMap.set(key, item);
            }

            if (!item.designation && cInfo.designation) item.designation = cInfo.designation;
            if (!item.experienceYears && cInfo.experienceYears) item.experienceYears = cInfo.experienceYears;
            if (!item.phoneNumber && cInfo.phoneNumber) item.phoneNumber = cInfo.phoneNumber;
            if (!item.email && cInfo.email) item.email = cInfo.email;
            if (cInfo.resumeStatus) item.status = cInfo.resumeStatus;

            if (iv.interviewId) {
              const alreadyHas = item.interviews.some((x) => x.interviewId === iv.interviewId);
              if (!alreadyHas) {
                item.interviews.push({
                  interviewId: iv.interviewId,
                  interviewTitle: iv.interviewTitle || `Interview #${iv.interviewId}`,
                  overallStatus: iv.interviewOverallStatus || 'Pending',
                  levels: iv.interviewLevels || []
                });
              }
            }

            if (iv.allocation && !item.allocation) {
              item.allocation = iv.allocation;
            }
          });
        });
      }

      return Array.from(profilesMap.values());
    },
    [demandFlows]
  );

  // When user selects demand in Tab 3, update available profiles using unified demand profile extractor
  const profilesForSelectedDemandTab3 = useMemo(() => {
    if (!historySelectedDemandId) return [];
    const d = demands.find(item => String(item.demandid) === String(historySelectedDemandId));
    if (!d) return [];
    return getProfilesForDemand(d);
  }, [historySelectedDemandId, demands, getProfilesForDemand]);

  // Helper to calculate profile status breakdown for a demand
  const getDemandProfileStats = useCallback(
    (demand) => {
      const profiles = getProfilesForDemand(demand);
      let total = profiles.length;
      let cleared = 0;
      let allocated = 0;
      let interviewing = 0;
      let screening = 0;
      let rejected = 0;

      profiles.forEach((p) => {
        const s = (p.status || '').toLowerCase();
        if (p.allocation || s.includes('allocat')) {
          allocated++;
        }
        if (s.includes('clear') || s.includes('select') || s.includes('allocat') || s.includes('accept') || s.includes('complete')) {
          cleared++;
        } else if (s.includes('interview') || s.includes('l1') || s.includes('l2') || s.includes('l3') || s.includes('schedul') || s.includes('progress') || s.includes('panel')) {
          interviewing++;
        } else if (s.includes('reject') || s.includes('decline')) {
          rejected++;
        } else {
          screening++;
        }
      });

      const targetPositions = demand.resourceRequestsCount || demand.requestsSummary?.total || 1;
      const isCompleted = (demand.overallStatus || '').toLowerCase() === 'completed' || (cleared >= targetPositions && targetPositions > 0);

      return {
        profiles,
        total,
        cleared,
        allocated,
        interviewing,
        screening,
        rejected,
        targetPositions,
        isCompleted
      };
    },
    [getProfilesForDemand]
  );

  // Demands created by the logged-in user (Strict User Scope)
  const scopedDemands = useMemo(() => {
    return demands.filter((d) => isCreatedByCurrentUser(d));
  }, [demands, isCreatedByCurrentUser]);

  // User-scoped submitted profiles filter
  const userDemandIds = useMemo(() => {
    return new Set(scopedDemands.map((d) => Number(d.demandid)));
  }, [scopedDemands]);

  const isProfileAccordingToUser = useCallback(
    (profile) => {
      if (!profile) return false;
      if (currentUserId && profile.submittedByUserId && Number(profile.submittedByUserId) === currentUserId) {
        return true;
      }
      if (currentUserName && profile.submittedByName && profile.submittedByName.trim().toLowerCase() === currentUserName.trim().toLowerCase()) {
        return true;
      }
      if (profile.demandId && userDemandIds.has(Number(profile.demandId))) {
        return true;
      }
      return false;
    },
    [currentUserId, currentUserName, userDemandIds]
  );

  const userSubmittedProfiles = useMemo(() => {
    return submittedProfiles.filter((p) => isProfileAccordingToUser(p));
  }, [submittedProfiles, isProfileAccordingToUser]);

  const userTodaySubmissionsCount = useMemo(() => {
    return userSubmittedProfiles.filter((p) => matchesDateFilter(p.submittedAt || p.submittedDate, 'today')).length;
  }, [userSubmittedProfiles]);

  const userYesterdaySubmissionsCount = useMemo(() => {
    return userSubmittedProfiles.filter((p) => matchesDateFilter(p.submittedAt || p.submittedDate, 'yesterday')).length;
  }, [userSubmittedProfiles]);

  const userTodayUnique = useMemo(() => {
    const set = new Set();
    userSubmittedProfiles
      .filter((p) => matchesDateFilter(p.submittedAt || p.submittedDate, 'today'))
      .forEach((p) => set.add(`${p.resourceType}_${p.resourceId}`));
    return set.size;
  }, [userSubmittedProfiles]);

  const userYesterdayUnique = useMemo(() => {
    const set = new Set();
    userSubmittedProfiles
      .filter((p) => matchesDateFilter(p.submittedAt || p.submittedDate, 'yesterday'))
      .forEach((p) => set.add(`${p.resourceType}_${p.resourceId}`));
    return set.size;
  }, [userSubmittedProfiles]);

  const userTotalUnique = useMemo(() => {
    const set = new Set();
    userSubmittedProfiles.forEach((p) => set.add(`${p.resourceType}_${p.resourceId}`));
    return set.size;
  }, [userSubmittedProfiles]);

  // Date counts for Demands created by current user
  const demandsTodayCount = useMemo(() => {
    return scopedDemands.filter((d) => matchesDateFilter(d.createddt || d.demandOpenDt || d.demandopendt, 'today')).length;
  }, [scopedDemands]);

  const demandsYesterdayCount = useMemo(() => {
    return scopedDemands.filter((d) => matchesDateFilter(d.createddt || d.demandOpenDt || d.demandopendt, 'yesterday')).length;
  }, [scopedDemands]);

  const demandsLast7Count = useMemo(() => {
    return scopedDemands.filter((d) => matchesDateFilter(d.createddt || d.demandOpenDt || d.demandopendt, 'last7days')).length;
  }, [scopedDemands]);

  // Date-filtered demands
  const dateFilteredDemands = useMemo(() => {
    return scopedDemands.filter((d) =>
      matchesDateFilter(d.createddt || d.demandOpenDt || d.demandopendt, demandDateFilter, demandFromDate, demandToDate)
    );
  }, [scopedDemands, demandDateFilter, demandFromDate, demandToDate]);

  // Interviews scheduled by current user
  const myInterviews = useMemo(() => {
    return interviews.filter((iv) => isInterviewScheduledByCurrentUser(iv));
  }, [interviews, isInterviewScheduledByCurrentUser]);

  const interviewsTodayCount = useMemo(() => {
    return myInterviews.filter((iv) => matchesDateFilter(getInterviewScheduledAt(iv), 'today')).length;
  }, [myInterviews]);

  const interviewsYesterdayCount = useMemo(() => {
    return myInterviews.filter((iv) => matchesDateFilter(getInterviewScheduledAt(iv), 'yesterday')).length;
  }, [myInterviews]);

  const interviewsLast7Count = useMemo(() => {
    return myInterviews.filter((iv) => matchesDateFilter(getInterviewScheduledAt(iv), 'last7days')).length;
  }, [myInterviews]);

  const interviewClientOptions = useMemo(() => {
    const set = new Set();
    myInterviews.forEach((iv) => {
      const c = (iv.accountName || iv.projectName || '').trim();
      if (c) set.add(c);
    });
    return Array.from(set).sort();
  }, [myInterviews]);

  const interviewDemandOptions = useMemo(() => {
    const set = new Set();
    myInterviews.forEach((iv) => {
      const t = (iv.demandTitle || '').trim();
      if (t) set.add(t);
    });
    return Array.from(set).sort();
  }, [myInterviews]);

  const interviewLevelOptions = useMemo(() => {
    const set = new Set();
    myInterviews.forEach((iv) => {
      const lvl = getInterviewLevel(iv);
      if (lvl) set.add(lvl);
    });
    return Array.from(set).sort();
  }, [myInterviews]);

  // Filtered interviews list based on date, status, client, demand, level, and search
  const filteredMyInterviews = useMemo(() => {
    return myInterviews.filter((iv) => {
      // Date filter
      if (!matchesDateFilter(getInterviewScheduledAt(iv), interviewDateFilter, interviewFromDate, interviewToDate)) {
        return false;
      }
      // Status filter
      if (interviewStatusFilter !== 'ALL') {
        const st = (iv.status || '').toLowerCase();
        if (interviewStatusFilter === 'SCHEDULED' && !st.includes('scheduled')) return false;
        if (interviewStatusFilter === 'SELECTED' && !st.includes('selected') && !st.includes('cleared')) return false;
        if (interviewStatusFilter === 'REJECTED' && !st.includes('reject')) return false;
        if (interviewStatusFilter === 'COMPLETED' && !st.includes('complet')) return false;
        if (interviewStatusFilter === 'CANCELLED' && !st.includes('cancel')) return false;
      }
      // Client filter
      if (interviewClientFilter !== 'ALL') {
        const c = (iv.accountName || iv.projectName || '').trim();
        if (c !== interviewClientFilter) return false;
      }
      // Demand filter (by Demand Title, no Demand ID)
      if (interviewDemandFilter !== 'ALL') {
        const t = (iv.demandTitle || '').trim();
        if (t !== interviewDemandFilter) return false;
      }
      // Interview Level filter
      if (interviewLevelFilter !== 'ALL') {
        if (getInterviewLevel(iv) !== interviewLevelFilter) return false;
      }
      // Search across candidate, demand, level, client, notes
      if (interviewSearchQuery.trim()) {
        const q = interviewSearchQuery.toLowerCase();
        const cand = (iv.candidateName || iv.employeeName || '').toLowerCase();
        const dem = (iv.demandTitle || '').toLowerCase();
        const proj = (iv.projectName || iv.accountName || '').toLowerCase();
        const lvl = (getInterviewLevel(iv) || '').toLowerCase();
        const notes = (iv.feedback || iv.overallNotes || '').toLowerCase();
        const id = String(iv.interviewId || '');
        if (!cand.includes(q) && !dem.includes(q) && !proj.includes(q) && !lvl.includes(q) && !notes.includes(q) && !id.includes(q)) {
          return false;
        }
      }
      return true;
    });
  }, [
    myInterviews,
    interviewDateFilter,
    interviewFromDate,
    interviewToDate,
    interviewStatusFilter,
    interviewClientFilter,
    interviewDemandFilter,
    interviewLevelFilter,
    interviewSearchQuery,
  ]);

  // Overall Statistics calculated across the active scope
  const stats = useMemo(() => {
    let totalDemands = scopedDemands.length;
    let myDemandsTotal = demands.filter((d) => isCreatedByCurrentUser(d)).length;
    let totalProfilesShared = 0;
    let inPipelineCount = 0;
    let clearedDemandsCount = 0;
    let totalClearedProfiles = 0;

    scopedDemands.forEach((d) => {
      const pStats = getDemandProfileStats(d);
      totalProfilesShared += pStats.total;
      inPipelineCount += (pStats.screening + pStats.interviewing);
      totalClearedProfiles += pStats.cleared;

      if (pStats.isCompleted || (d.overallStatus || '').toLowerCase() === 'completed') {
        clearedDemandsCount++;
      }
    });

    return {
      totalDemands,
      myDemandsTotal,
      totalProfilesShared,
      inPipelineCount,
      clearedDemandsCount,
      totalClearedProfiles
    };
  }, [scopedDemands, demands, isCreatedByCurrentUser, getDemandProfileStats]);

  // 4 Top KPI Cards tailored to recruitment & demand metrics
  // 4 KPI Summary Cards Definition with Enterprise Pastel Palettes
  const kpiCards = useMemo(() => {
    return [
      {
        title: 'Demands Created by You',
        value: demandDateFilter === 'all' ? scopedDemands.length : dateFilteredDemands.length,
        icon: Briefcase,
        onClick: () => handleTabChange('active-demands'),
        desc: `${demandsTodayCount} created today • ${demandsYesterdayCount} yesterday`,
        bg: 'linear-gradient(150deg, #faf8ff 0%, #f0ecff 100%)',
        border: 'rgba(196, 181, 253, 0.6)',
        topBorder: '#8b5cf6',
        labelColor: '#6d28d9',
        valueColor: '#4c3d8f',
        descColor: '#7c3aed',
        iconBg: 'rgba(139, 92, 246, 0.12)',
        iconColor: '#7c3aed',
        hoverShadow: '0 12px 28px rgba(139, 92, 246, 0.18)',
      },
      {
        title: 'Interviews Scheduled by You',
        value: interviewDateFilter === 'all' ? myInterviews.length : filteredMyInterviews.length,
        icon: CalendarCheck,
        onClick: () => handleTabChange('interviews'),
        desc: `${interviewsTodayCount} scheduled today • ${interviewsYesterdayCount} yesterday`,
        bg: 'linear-gradient(150deg, #f7fbff 0%, #eaf4ff 100%)',
        border: 'rgba(147, 210, 250, 0.6)',
        topBorder: '#3b82f6',
        labelColor: '#1d4ed8',
        valueColor: '#1e5f8a',
        descColor: '#2563eb',
        iconBg: 'rgba(37, 99, 235, 0.12)',
        iconColor: '#2563eb',
        hoverShadow: '0 12px 28px rgba(37, 99, 235, 0.18)',
      },
      {
        title: 'In Recruitment Pipeline',
        value: stats.inPipelineCount,
        icon: Clock,
        onClick: () => handleTabChange('submitted'),
        desc: `${stats.totalProfilesShared} candidate profiles in process`,
        bg: 'linear-gradient(150deg, #fffdf5 0%, #fff8e0 100%)',
        border: 'rgba(251, 211, 141, 0.6)',
        topBorder: '#f59e0b',
        labelColor: '#b45309',
        valueColor: '#7a5212',
        descColor: '#d97706',
        iconBg: 'rgba(217, 119, 6, 0.12)',
        iconColor: '#d97706',
        hoverShadow: '0 12px 28px rgba(217, 119, 6, 0.16)',
      },
      {
        title: 'Demands Cleared / Fulfilled',
        value: stats.clearedDemandsCount,
        icon: CheckCircle2,
        onClick: () => handleTabChange('active-demands'),
        desc: `${stats.totalClearedProfiles} candidate profiles cleared`,
        bg: 'linear-gradient(150deg, #f4fdf9 0%, #e6f9f1 100%)',
        border: 'rgba(134, 225, 182, 0.6)',
        topBorder: '#10b981',
        labelColor: '#047857',
        valueColor: '#1a5e40',
        descColor: '#059669',
        iconBg: 'rgba(16, 185, 129, 0.12)',
        iconColor: '#059669',
        hoverShadow: '0 12px 28px rgba(16, 185, 129, 0.16)',
      },
    ];
  }, [
    stats,
    scopedDemands,
    dateFilteredDemands,
    myInterviews,
    filteredMyInterviews,
    demandsTodayCount,
    demandsYesterdayCount,
    interviewsTodayCount,
    interviewsYesterdayCount,
    demandDateFilter,
    interviewDateFilter
  ]);

  // Unique clients list for dropdown filters
  const clientOptions = useMemo(() => {
    const set = new Set();
    demands.forEach((d) => {
      const c = d.accountName || d.companyName;
      if (c) set.add(c);
    });
    return Array.from(set).sort();
  }, [demands]);

  // Tab 1 Filtering & Sorting
  const filteredDemands = useMemo(() => {
    let result = dateFilteredDemands.filter((demand) => {
      // Status filter
      if (statusFilter !== 'ALL') {
        const s = (demand.overallStatus || '').toLowerCase();
        if (statusFilter === 'OPEN' && s !== 'open') return false;
        if (statusFilter === 'INPROGRESS' && s !== 'inprogress') return false;
        if (statusFilter === 'COMPLETED' && s !== 'completed' && s !== 'closed') return false;
      }

      // Priority filter
      if (priorityFilter !== 'ALL') {
        if ((demand.priority || '').toLowerCase() !== priorityFilter.toLowerCase()) return false;
      }

      // Client filter
      if (clientFilter !== 'ALL') {
        const c = demand.accountName || demand.companyName;
        if (c !== clientFilter) return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesId = String(demand.demandid).includes(q) || `dm-${demand.demandid}`.includes(q);
        const matchesTitle = (demand.demandTitle || '').toLowerCase().includes(q);
        const matchesClient = (demand.accountName || demand.companyName || '').toLowerCase().includes(q);
        const matchesDept = (demand.departmentName || '').toLowerCase().includes(q);
        const matchesRequester = (demand.requesterName || '').toLowerCase().includes(q);
        const matchesSkills = Array.isArray(demand.skillName) && demand.skillName.some((s) => s.toLowerCase().includes(q));

        if (!matchesId && !matchesTitle && !matchesClient && !matchesDept && !matchesRequester && !matchesSkills) {
          return false;
        }
      }

      return true;
    });

    // Sorting
    result.sort((a, b) => {
      let valA = a[sortField];
      let valB = b[sortField];
      if (sortField === 'clientName') {
        valA = a.accountName || a.companyName || '';
        valB = b.accountName || b.companyName || '';
      }
      if (sortField === 'openings') {
        valA = a.resourceRequestsCount || 0;
        valB = b.resourceRequestsCount || 0;
      }
      if (sortField === 'demandopendt') {
        valA = getDemandOpenDate(a) || '';
        valB = getDemandOpenDate(b) || '';
      }
      if (valA == null) return 1;
      if (valB == null) return -1;
      if (typeof valA === 'string') {
        const cmp = valA.localeCompare(String(valB));
        return sortOrder === 'asc' ? cmp : -cmp;
      }
      return sortOrder === 'asc' ? (valA > valB ? 1 : -1) : (valA < valB ? 1 : -1);
    });

    return result;
  }, [scopedDemands, statusFilter, priorityFilter, clientFilter, searchQuery, sortField, sortOrder]);

  // Paginated demands for Tab 1
  const paginatedDemands = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredDemands.slice(start, start + itemsPerPage);
  }, [filteredDemands, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredDemands.length / itemsPerPage);

  // Active selected demand for Split-Pane Master-Detail View
  const activeSplitDemand = useMemo(() => {
    if (selectedSplitDemandId) {
      const found = filteredDemands.find((d) => d.demandid === selectedSplitDemandId);
      if (found) return found;
    }
    return paginatedDemands[0] || filteredDemands[0] || null;
  }, [selectedSplitDemandId, paginatedDemands, filteredDemands]);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  // Toggle profile drawer per demand
  const toggleProfiles = (demandId) => {
    setExpandedProfiles((prev) => {
      const next = new Set(prev);
      if (next.has(demandId)) next.delete(demandId);
      else next.add(demandId);
      return next;
    });
  };

  // Status visual configs
  const getDemandStatusConfig = (status) => {
    switch (status) {
      case 'Open':
        return { bg: '#eff6ff', color: '#1d4ed8', dot: '#3b82f6', border: '#bfdbfe' };
      case 'InProgress':
        return { bg: '#fffbeb', color: '#b45309', dot: '#f59e0b', border: '#fde68a' };
      case 'Completed':
        return { bg: '#f0fdf4', color: '#15803d', dot: '#22c55e', border: '#bbf7d0' };
      case 'Cancelled':
        return { bg: '#fef2f2', color: '#b91c1c', dot: '#ef4444', border: '#fecaca' };
      default:
        return { bg: '#f9fafb', color: '#4b5563', dot: '#9ca3af', border: '#e5e7eb' };
    }
  };

  const getPriorityConfig = (priority) => {
    switch (priority?.toLowerCase()) {
      case 'urgent':
      case 'high':
        return { bg: '#fef2f2', color: '#b91c1c', border: '#fecaca' };
      case 'medium':
        return { bg: '#fffbeb', color: '#b45309', border: '#fde68a' };
      case 'low':
        return { bg: '#f0fdf4', color: '#15803d', border: '#bbf7d0' };
      default:
        return { bg: '#f9fafb', color: '#6b7280', border: '#e5e7eb' };
    }
  };

  // Open Profile History Dialog (Modal) & load genuine history
  const handleOpenProfileHistory = async (profile, demand, e) => {
    if (e) e.stopPropagation();
    setActiveHistoryProfile(profile);
    setActiveHistoryDemand(demand);
    setHistoryModalOpen(true);
    setModalHistoryEvents([]);

    const dId = demand?.demandid || profile?.demandId;
    const rType = profile?.resourceType || (profile?.employeeId ? 'INTERNAL' : 'EXTERNAL');
    const rId = profile?.resourceId || profile?.employeeId || profile?.candidateId;

    if (dId && rId) {
      setModalHistoryLoading(true);
      try {
        const events = await DemandService.fetchProfileHistory(dId, rType, rId);
        setModalHistoryEvents(Array.isArray(events) ? events : []);
      } catch (err) {
        console.error('Failed to load modal history events:', err);
      } finally {
        setModalHistoryLoading(false);
      }
    }
  };

  // Jump directly to Tab 3 for a specific profile
  const handleJumpToHistoryTab = (demandId, resourceType, resourceId, profileObj) => {
    setActiveMainTab('history');
    setSearchParams({ tab: 'history' });
    setHistorySelectedDemandId(String(demandId));
    setHistorySelectedProfile(profileObj || { resourceId, resourceType });
    fetchHistoryForProfile(demandId, resourceType, resourceId);
  };

  // Open Demand Details View Modal
  const handleOpenDemandDetails = (demand, e) => {
    if (e) e.stopPropagation();
    setSelectedDemandForDetails(demand);
    setDetailsModalOpen(true);
  };

  // Reset all filters in Tab 2 (Submitted Profiles)
  const handleResetSubmittedFilters = () => {
    setSubDateFilter('all');
    setSubClientFilter('ALL');
    setSubDemandFilter('ALL');
    setSubStatusFilter('ALL');
    setSubFromDate('');
    setSubToDate('');
    setSubSearchInput('');
    setSubSearchQuery('');
    setSubmittedProfilesPage(1);
  };

  const hasActiveSubmittedFilters =
    subDateFilter !== 'all' ||
    subClientFilter !== 'ALL' ||
    subDemandFilter !== 'ALL' ||
    subStatusFilter !== 'ALL' ||
    Boolean(subSearchInput) ||
    Boolean(subFromDate) ||
    Boolean(subToDate);

  return (
    <div className="space-y-6 w-full text-left">
      {/* ── Light Enterprise Header & KPI Hero Container ── */}
      <div
        className="w-full relative overflow-hidden mb-6"
        style={{
          background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 250, 252, 0.95) 100%)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          border: '1.5px solid #e2e8f0',
          borderRadius: '24px',
          padding: '24px 26px',
          boxShadow: '0 8px 30px rgba(15, 23, 42, 0.08)',
        }}
      >
        {/* Row 1: Header Title & Subtitle + User Badge + Refresh Button */}
        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between mb-6" style={{ display: 'flex', gap: '16px' }}>
          <div className="flex items-center" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
              style={{
                background: 'linear-gradient(135deg, #2563eb 0%, #4f46e5 100%)',
                boxShadow: '0 4px 14px rgba(37, 99, 235, 0.35)',
                marginRight: '16px',
                flexShrink: 0,
              }}
            >
              <Briefcase className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center flex-wrap" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight leading-tight" style={{ margin: 0 }}>
                  Demand Management
                </h1>
                {currentUserName && (
                  <span
                    className="px-3 py-1 rounded-full font-bold inline-flex items-center shadow-xs"
                    style={{
                      background: '#eff6ff',
                      color: '#1d4ed8',
                      border: '1px solid #bfdbfe',
                      fontSize: '12px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      marginLeft: '8px',
                    }}
                  >
                    <User className="w-3.5 h-3.5 text-blue-600" />
                    <span>{currentUserName}</span>
                  </span>
                )}
              </div>
              <p className="text-sm font-medium mt-1 leading-normal text-slate-500">
                Manage active demands, review submitted candidate profiles, and inspect recruitment timeline history
              </p>
            </div>
          </div>

          {/* Right-aligned Refresh Action */}
          <div className="flex items-center self-start sm:self-center" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              onClick={() => {
                loadData(true);
                if (activeMainTab === 'submitted') loadSubmittedProfiles();
              }}
              disabled={refreshing || loading}
              className="h-10 px-5 rounded-xl font-bold text-sm transition-all duration-200 flex items-center cursor-pointer hover:bg-slate-50 hover:border-slate-300 active:scale-95 shadow-xs"
              style={{
                background: '#ffffff',
                border: '1.5px solid #e2e8f0',
                color: '#334155',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <RefreshCw className={`w-4 h-4 text-slate-600 ${refreshing ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Row 2: 4 Pastel KPI Metric Cards Grid — Guaranteed 20px Gap */}
        <div
          className="relative grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"
          style={{ gap: '20px' }}
        >
          {kpiCards.map((kpi, index) => {
            const IconComponent = kpi.icon;
            return (
              <div
                key={index}
                onClick={kpi.onClick}
                className="relative cursor-pointer overflow-hidden group transition-all duration-200 text-left hover:-translate-y-0.5 hover:shadow-md"
                style={{
                  borderRadius: '20px',
                  background: kpi.bg,
                  border: `1.5px solid ${kpi.border}`,
                  borderTop: `4px solid ${kpi.topBorder}`,
                  boxShadow: '0 4px 16px rgba(15, 23, 42, 0.06)',
                  padding: '20px 22px',
                  minHeight: '144px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                }}
              >
                {/* Top row: Label + Icon */}
                <div className="flex items-center justify-between gap-3">
                  <span
                    style={{
                      fontSize: '14px',
                      fontWeight: 800,
                      color: kpi.labelColor,
                      letterSpacing: '0.01em',
                      lineHeight: '1.3',
                    }}
                  >
                    {kpi.title}
                  </span>
                  <div
                    className="flex items-center justify-center flex-shrink-0"
                    style={{
                      width: '44px',
                      height: '44px',
                      borderRadius: '14px',
                      background: kpi.iconBg,
                      color: kpi.iconColor,
                      border: `1.5px solid ${kpi.border}`,
                      boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                    }}
                  >
                    <IconComponent className="w-5 h-5" />
                  </div>
                </div>

                {/* Metric Value */}
                <div style={{ margin: '8px 0 6px 0' }}>
                  <span
                    style={{
                      fontSize: '34px',
                      fontWeight: 900,
                      color: kpi.valueColor,
                      lineHeight: '1',
                      letterSpacing: '-0.02em',
                    }}
                  >
                    {kpi.value}
                  </span>
                </div>

                {/* Supporting Text */}
                <p
                  style={{
                    fontSize: '12.5px',
                    fontWeight: 600,
                    color: kpi.descColor,
                    margin: 0,
                    lineHeight: '1.4',
                  }}
                >
                  {kpi.desc}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── 3 Main Navigation Tabs (High-Contrast, Prominent & Accessible) ── */}
      <div className="flex justify-center mb-6">
        <div
          role="tablist"
          aria-label="Demand management views"
          className="inline-flex items-center p-2 rounded-2xl max-w-full overflow-x-auto no-scrollbar"
          style={{
            background: '#ffffff',
            border: '1.5px solid #e2e8f0',
            boxShadow: '0 6px 24px rgba(15, 23, 42, 0.08)',
            gap: '10px',
          }}
        >
          {/* Tab 1: My Demands */}
          <button
            role="tab"
            id="tab-active-demands"
            aria-selected={activeMainTab === 'active-demands'}
            aria-controls="panel-active-demands"
            tabIndex={activeMainTab === 'active-demands' ? 0 : -1}
            onClick={() => handleTabChange('active-demands')}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleTabChange('active-demands');
              }
            }}
            className="flex items-center cursor-pointer whitespace-nowrap focus:outline-none transition-all duration-200"
            style={
              activeMainTab === 'active-demands'
                ? {
                    background: 'linear-gradient(135deg, #2563eb 0%, #4f46e5 100%)',
                    color: '#ffffff',
                    boxShadow: '0 4px 14px rgba(37, 99, 235, 0.35)',
                    padding: '10px 22px',
                    borderRadius: '14px',
                    fontSize: '14px',
                    fontWeight: 700,
                    gap: '10px',
                  }
                : {
                    background: 'transparent',
                    color: '#475569',
                    padding: '10px 22px',
                    borderRadius: '14px',
                    fontSize: '14px',
                    fontWeight: 600,
                    gap: '10px',
                  }
            }
          >
            <Briefcase className="w-5 h-5 flex-shrink-0" />
            <span>My Demands</span>
            <span
              style={
                activeMainTab === 'active-demands'
                  ? {
                      background: 'rgba(255, 255, 255, 0.28)',
                      color: '#ffffff',
                      padding: '3px 10px',
                      borderRadius: '9999px',
                      fontSize: '12px',
                      fontWeight: 800,
                    }
                  : {
                      background: '#f1f5f9',
                      color: '#475569',
                      padding: '3px 10px',
                      borderRadius: '9999px',
                      fontSize: '12px',
                      fontWeight: 800,
                    }
              }
            >
              {filteredDemands.length}
            </span>
          </button>

          {/* Tab 2: Interviews Scheduled */}
          <button
            role="tab"
            id="tab-interviews"
            aria-selected={activeMainTab === 'interviews'}
            aria-controls="panel-interviews"
            tabIndex={activeMainTab === 'interviews' ? 0 : -1}
            onClick={() => handleTabChange('interviews')}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleTabChange('interviews');
              }
            }}
            className="flex items-center cursor-pointer whitespace-nowrap focus:outline-none transition-all duration-200"
            style={
              activeMainTab === 'interviews'
                ? {
                    background: 'linear-gradient(135deg, #2563eb 0%, #4f46e5 100%)',
                    color: '#ffffff',
                    boxShadow: '0 4px 14px rgba(37, 99, 235, 0.35)',
                    padding: '10px 22px',
                    borderRadius: '14px',
                    fontSize: '14px',
                    fontWeight: 700,
                    gap: '10px',
                  }
                : {
                    background: 'transparent',
                    color: '#475569',
                    padding: '10px 22px',
                    borderRadius: '14px',
                    fontSize: '14px',
                    fontWeight: 600,
                    gap: '10px',
                  }
            }
          >
            <CalendarCheck className="w-5 h-5 flex-shrink-0" />
            <span>Interviews Scheduled</span>
            <span
              style={
                activeMainTab === 'interviews'
                  ? {
                      background: 'rgba(255, 255, 255, 0.28)',
                      color: '#ffffff',
                      padding: '3px 10px',
                      borderRadius: '9999px',
                      fontSize: '12px',
                      fontWeight: 800,
                    }
                  : {
                      background: '#f1f5f9',
                      color: '#475569',
                      padding: '3px 10px',
                      borderRadius: '9999px',
                      fontSize: '12px',
                      fontWeight: 800,
                    }
              }
            >
              {filteredMyInterviews.length}
            </span>
          </button>

          {/* Tab 2 */}
          <button
            role="tab"
            id="tab-submitted-profiles"
            aria-selected={activeMainTab === 'submitted'}
            aria-controls="panel-submitted-profiles"
            tabIndex={activeMainTab === 'submitted' ? 0 : -1}
            onClick={() => handleTabChange('submitted')}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleTabChange('submitted');
              }
            }}
            className="flex items-center cursor-pointer whitespace-nowrap focus:outline-none transition-all duration-200"
            style={
              activeMainTab === 'submitted'
                ? {
                    background: 'linear-gradient(135deg, #2563eb 0%, #4f46e5 100%)',
                    color: '#ffffff',
                    boxShadow: '0 4px 14px rgba(37, 99, 235, 0.35)',
                    padding: '10px 22px',
                    borderRadius: '14px',
                    fontSize: '14px',
                    fontWeight: 700,
                    gap: '10px',
                  }
                : {
                    background: 'transparent',
                    color: '#475569',
                    padding: '10px 22px',
                    borderRadius: '14px',
                    fontSize: '14px',
                    fontWeight: 600,
                    gap: '10px',
                  }
            }
          >
            <Users className="w-5 h-5 flex-shrink-0" />
            <span>Submitted Profiles</span>
            <span
              style={
                activeMainTab === 'submitted'
                  ? {
                      background: 'rgba(255, 255, 255, 0.28)',
                      color: '#ffffff',
                      padding: '3px 10px',
                      borderRadius: '9999px',
                      fontSize: '12px',
                      fontWeight: 800,
                    }
                  : {
                      background: '#f1f5f9',
                      color: '#475569',
                      padding: '3px 10px',
                      borderRadius: '9999px',
                      fontSize: '12px',
                      fontWeight: 800,
                    }
              }
            >
              {submittedProfilesTotal || stats.totalProfilesShared}
            </span>
          </button>

          {/* Tab 3 */}
          <button
            role="tab"
            id="tab-profile-history"
            aria-selected={activeMainTab === 'history'}
            aria-controls="panel-profile-history"
            tabIndex={activeMainTab === 'history' ? 0 : -1}
            onClick={() => handleTabChange('history')}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleTabChange('history');
              }
            }}
            className="flex items-center cursor-pointer whitespace-nowrap focus:outline-none transition-all duration-200"
            style={
              activeMainTab === 'history'
                ? {
                    background: 'linear-gradient(135deg, #2563eb 0%, #4f46e5 100%)',
                    color: '#ffffff',
                    boxShadow: '0 4px 14px rgba(37, 99, 235, 0.35)',
                    padding: '10px 22px',
                    borderRadius: '14px',
                    fontSize: '14px',
                    fontWeight: 700,
                    gap: '10px',
                  }
                : {
                    background: 'transparent',
                    color: '#475569',
                    padding: '10px 22px',
                    borderRadius: '14px',
                    fontSize: '14px',
                    fontWeight: 600,
                    gap: '10px',
                  }
            }
          >
            <HistoryIcon className="w-5 h-5 flex-shrink-0" />
            <span>Profile History</span>
          </button>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* TAB 1: ACTIVE DEMANDS                                         */}
      {/* ══════════════════════════════════════════════════════════════ */}
      {activeMainTab === 'active-demands' && (
        <div
          id="panel-active-demands"
          role="tabpanel"
          aria-labelledby="tab-active-demands"
          className="space-y-5 text-left rounded-2xl p-5 sm:p-6"
          style={{
            background: '#ffffff',
            border: '1.5px solid #e2e8f0',
            boxShadow: '0 8px 30px rgba(15, 23, 42, 0.08)',
          }}
        >
          {/* ── Active Demands Filter Toolbar (Clean Structured Layout) ── */}
          <div
            style={{
              background: 'rgba(248, 250, 252, 0.85)',
              borderRadius: '16px',
              border: '1px solid #e2e8f0',
              padding: '16px 20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
              textAlign: 'left',
            }}
          >
            {/* Primary Row: Scope Badge + Date Quick-Filters + Refresh */}
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '12px',
              }}
            >
              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '12px' }}>
                {/* User Scope Badge */}
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '6px 14px',
                    background: '#eff6ff',
                    border: '1px solid #bfdbfe',
                    borderRadius: '10px',
                    height: '36px',
                  }}
                >
                  <div style={{ width: '8px', height: '8px', borderRadius: '9999px', background: '#2563eb' }} />
                  <span style={{ fontSize: '12px', fontWeight: 700, color: '#1e293b', whiteSpace: 'nowrap' }}>
                    {currentUserName}
                  </span>
                  <span
                    style={{
                      fontSize: '11.5px',
                      fontWeight: 800,
                      color: '#2563eb',
                      background: '#dbeafe',
                      padding: '2px 8px',
                      borderRadius: '9999px',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {scopedDemands.length} {scopedDemands.length === 1 ? 'Demand' : 'Demands'}
                  </span>
                </div>

                {/* Demand Date Quick-Filters */}
                <div style={{ display: 'inline-flex', flexWrap: 'wrap', alignItems: 'center', gap: '8px' }}>
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: 700,
                      color: '#64748b',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      marginRight: '2px',
                    }}
                  >
                    <Calendar className="w-3.5 h-3.5 text-blue-600" />
                    Created:
                  </span>
                  {[
                    { id: 'all', label: 'All', count: scopedDemands.length },
                    { id: 'today', label: 'Today', count: demandsTodayCount },
                    { id: 'yesterday', label: 'Yesterday', count: demandsYesterdayCount },
                    { id: 'last7days', label: 'Last 7 Days', count: demandsLast7Count },
                    { id: 'custom', label: 'Custom Date', count: null },
                  ].map((df) => {
                    const isAct = demandDateFilter === df.id;
                    return (
                      <button
                        key={df.id}
                        type="button"
                        onClick={() => {
                          setDemandDateFilter(df.id);
                          setCurrentPage(1);
                        }}
                        style={{
                          height: '34px',
                          padding: '0 14px',
                          borderRadius: '10px',
                          fontSize: '12px',
                          fontWeight: isAct ? 700 : 600,
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '8px',
                          whiteSpace: 'nowrap',
                          border: isAct ? '1.5px solid #2563eb' : '1.5px solid #e2e8f0',
                          background: isAct ? '#2563eb' : '#ffffff',
                          color: isAct ? '#ffffff' : '#334155',
                          boxShadow: isAct ? '0 2px 6px rgba(37,99,235,0.25)' : '0 1px 2px rgba(0,0,0,0.03)',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        <span>{df.label}</span>
                        {df.count !== null && (
                          <span
                            style={{
                              padding: '1px 7px',
                              borderRadius: '9999px',
                              fontSize: '10.5px',
                              fontWeight: 800,
                              background: isAct ? 'rgba(29, 78, 216, 0.9)' : '#f1f5f9',
                              color: isAct ? '#ffffff' : '#475569',
                            }}
                          >
                            {df.count}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Right: Refresh Button (Split View only) */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => loadData(true)}
                  disabled={refreshing || loading}
                  title="Refresh Active Demands"
                  style={{
                    height: '36px',
                    padding: '0 14px',
                    borderRadius: '10px',
                    border: '1.5px solid #e2e8f0',
                    background: '#ffffff',
                    color: '#334155',
                    fontSize: '12px',
                    fontWeight: 600,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    cursor: 'pointer',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
                  }}
                >
                  <RefreshCw className={`w-3.5 h-3.5 text-slate-600 ${refreshing ? 'animate-spin' : ''}`} />
                  <span>Refresh</span>
                </button>
              </div>
            </div>

            {/* Custom Date Drawer (Only rendered when Custom Date filter is active) */}
            {demandDateFilter === 'custom' && (
              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  alignItems: 'center',
                  gap: '12px',
                  background: '#ffffff',
                  padding: '10px 14px',
                  borderRadius: '12px',
                  border: '1px solid #bfdbfe',
                }}
              >
                <span
                  style={{
                    fontSize: '12px',
                    fontWeight: 700,
                    color: '#1d4ed8',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <Calendar className="w-3.5 h-3.5 text-blue-600" />
                  Custom Date Range:
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '12px', fontWeight: 600, color: '#64748b' }}>From:</span>
                  <input
                    type="date"
                    value={demandFromDate}
                    onChange={(e) => {
                      setDemandFromDate(e.target.value);
                      setCurrentPage(1);
                    }}
                    style={{
                      height: '32px',
                      fontSize: '12px',
                      border: '1px solid #cbd5e1',
                      borderRadius: '8px',
                      padding: '0 10px',
                      color: '#1e293b',
                      background: '#f8fafc',
                    }}
                  />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '12px', fontWeight: 600, color: '#64748b' }}>To:</span>
                  <input
                    type="date"
                    value={demandToDate}
                    onChange={(e) => {
                      setDemandToDate(e.target.value);
                      setCurrentPage(1);
                    }}
                    style={{
                      height: '32px',
                      fontSize: '12px',
                      border: '1px solid #cbd5e1',
                      borderRadius: '8px',
                      padding: '0 10px',
                      color: '#1e293b',
                      background: '#f8fafc',
                    }}
                  />
                </div>
                {(demandFromDate || demandToDate) && (
                  <button
                    type="button"
                    onClick={() => {
                      setDemandFromDate('');
                      setDemandToDate('');
                      setCurrentPage(1);
                    }}
                    style={{
                      fontSize: '12px',
                      fontWeight: 700,
                      color: '#e11d48',
                      background: '#fff1f2',
                      border: '1px solid #fecdd3',
                      borderRadius: '8px',
                      padding: '4px 10px',
                      cursor: 'pointer',
                    }}
                  >
                    Clear Dates
                  </button>
                )}
              </div>
            )}

            {/* Secondary Row: Status Filter Pills on left, Client Filter + Search Field on right */}
            <div
              style={{
                paddingTop: '12px',
                borderTop: '1px solid #e2e8f0',
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '12px',
              }}
            >
              {/* Left: Status Filter Pills */}
              <div style={{ display: 'inline-flex', flexWrap: 'wrap', alignItems: 'center', gap: '8px' }}>
                {[
                  { id: 'ALL', label: 'All Statuses', dot: null },
                  { id: 'INPROGRESS', label: 'In Progress', dot: '#f59e0b' },
                  { id: 'OPEN', label: 'Open', dot: '#3b82f6' },
                  { id: 'COMPLETED', label: 'Completed', dot: '#10b981' },
                ].map((tab) => {
                  const isActive = statusFilter === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => {
                        setStatusFilter(tab.id);
                        setCurrentPage(1);
                      }}
                      style={{
                        height: '34px',
                        padding: '0 14px',
                        fontSize: '12px',
                        fontWeight: isActive ? 700 : 600,
                        borderRadius: '10px',
                        border: isActive ? '1.5px solid #2563eb' : '1.5px solid #e2e8f0',
                        background: isActive ? '#2563eb' : '#ffffff',
                        color: isActive ? '#ffffff' : '#334155',
                        boxShadow: isActive ? '0 2px 6px rgba(37,99,235,0.25)' : '0 1px 2px rgba(0,0,0,0.03)',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '7px',
                        whiteSpace: 'nowrap',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      {tab.dot && (
                        <span
                          style={{
                            width: '7px',
                            height: '7px',
                            borderRadius: '9999px',
                            backgroundColor: isActive ? '#ffffff' : tab.dot,
                            display: 'inline-block',
                            flexShrink: 0,
                          }}
                        />
                      )}
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Right: Client Filter & Search Field */}
              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '10px' }}>
                <select
                  value={clientFilter}
                  onChange={(e) => {
                    setClientFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  style={{
                    height: '36px',
                    fontSize: '12px',
                    fontWeight: 600,
                    borderRadius: '10px',
                    border: '1.5px solid #e2e8f0',
                    background: '#ffffff',
                    color: '#334155',
                    padding: '0 12px',
                    cursor: 'pointer',
                  }}
                >
                  <option value="ALL">All Clients ({clientOptions.length})</option>
                  {clientOptions.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>

                {(searchQuery || statusFilter !== 'ALL' || clientFilter !== 'ALL' || demandDateFilter !== 'all') && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                      setStatusFilter('ALL');
                      setClientFilter('ALL');
                      setDemandDateFilter('all');
                      setDemandFromDate('');
                      setDemandToDate('');
                      setCurrentPage(1);
                    }}
                    style={{
                      height: '36px',
                      padding: '0 12px',
                      fontSize: '12px',
                      fontWeight: 700,
                      color: '#e11d48',
                      background: '#fff1f2',
                      border: '1px solid #fecdd3',
                      borderRadius: '10px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    <X className="w-3.5 h-3.5" />
                    Reset
                  </button>
                )}

                <div style={{ width: '280px', flexShrink: 0 }}>
                  <SearchFilter
                    value={searchQuery}
                    onChange={(val) => {
                      setSearchQuery(val);
                      setCurrentPage(1);
                    }}
                    placeholder="Search by demand ID, title, client..."
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Demands Content */}
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center gap-3 bg-white/70 rounded-2xl border border-white">
              <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
              <p className="text-sm font-semibold text-gray-700">Loading Active Demands...</p>
            </div>
          ) : filteredDemands.length === 0 ? (
            <div className="py-16 text-center bg-white/80 rounded-2xl border border-gray-200/80 shadow-xs">
              <Briefcase className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <h3 className="text-base font-bold text-gray-800">No demands found</h3>
              <p className="text-xs text-gray-500 max-w-md mx-auto mt-1">
                {searchQuery || statusFilter !== 'ALL' || priorityFilter !== 'ALL' || clientFilter !== 'ALL'
                  ? 'Try clearing or modifying your search filters above.'
                  : 'No active demands currently exist.'}
              </p>
              {(searchQuery || statusFilter !== 'ALL' || priorityFilter !== 'ALL' || clientFilter !== 'ALL') && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSearchQuery('');
                    setStatusFilter('ALL');
                    setPriorityFilter('ALL');
                    setClientFilter('ALL');
                    setScopeFilter('ALL');
                  }}
                  className="mt-4 text-xs"
                >
                  Clear All Filters
                </Button>
              )}
            </div>
          ) : viewMode === 'table' ? (
            /* ── Professional Data Table View ── */
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden text-left">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse min-w-[1200px]">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-extrabold uppercase tracking-wider text-xs">
                      {/* 1. Demand */}
                      <th
                        onClick={() => handleSort('demandTitle')}
                        className="py-4 px-4 cursor-pointer hover:bg-slate-100 transition-colors w-[270px]"
                      >
                        <div className="flex items-center gap-1.5">
                          Demand <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                        </div>
                      </th>

                      {/* 2. Client */}
                      <th
                        onClick={() => handleSort('clientName')}
                        className="py-4 px-3.5 cursor-pointer hover:bg-slate-100 transition-colors w-[150px]"
                      >
                        <div className="flex items-center gap-1.5">
                          Client <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                        </div>
                      </th>

                      {/* 3. Required Skills */}
                      <th className="py-4 px-3.5 w-[200px]">Required Skills</th>

                      {/* 4. Openings */}
                      <th
                        onClick={() => handleSort('openings')}
                        className="py-4 px-3 text-center cursor-pointer hover:bg-slate-100 transition-colors w-[90px]"
                      >
                        <div className="flex items-center justify-center gap-1.5">
                          Openings <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                        </div>
                      </th>

                      {/* 5. Submitted */}
                      <th className="py-4 px-3 text-center w-[100px]">Submitted</th>

                      {/* 6. Selected */}
                      <th className="py-4 px-3 text-center w-[90px]">Selected</th>

                      {/* 7. Allocated */}
                      <th className="py-4 px-3 text-center w-[90px]">Allocated</th>

                      {/* 8. Owner */}
                      <th className="py-4 px-3.5 w-[130px]">Owner</th>

                      {/* 9. Created */}
                      <th
                        onClick={() => handleSort('demandopendt')}
                        className="py-4 px-3.5 cursor-pointer hover:bg-slate-100 transition-colors w-[120px]"
                      >
                        <div className="flex items-center gap-1.5">
                          Created <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                        </div>
                      </th>

                      {/* 10. Target Date */}
                      <th className="py-4 px-3.5 w-[120px]">Target Date</th>

                      {/* 11. Status */}
                      <th className="py-4 px-3.5 w-[125px]">Status</th>

                      {/* 12. Actions */}
                      <th className="py-4 px-4 text-right w-[150px]">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {paginatedDemands.map((demand) => {
                      const pStats = getDemandProfileStats(demand);
                      const statusCfg = getDemandStatusConfig(demand.overallStatus);
                      const isOwner = isCreatedByCurrentUser(demand);
                      const isExpanded = expandedProfiles.has(demand.demandid);

                      return (
                        <React.Fragment key={demand.demandid}>
                          <tr className="hover:bg-slate-50/80 transition-colors">
                            {/* 1. Demand */}
                            <td className="py-4 px-4 min-w-[260px] max-w-[300px]">
                              <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
                                <span className="font-extrabold text-xs bg-blue-50 text-blue-700 px-2.5 py-0.5 rounded-md border border-blue-200 whitespace-nowrap">
                                  #DM-{demand.demandid}
                                </span>
                                {demand.projectName && (
                                  <span
                                    className="text-xs text-slate-600 font-semibold truncate max-w-[150px] bg-slate-100 px-2 py-0.5 rounded border border-slate-200/60"
                                    title={`Project: ${demand.projectName}`}
                                  >
                                    {demand.projectName}
                                  </span>
                                )}
                              </div>
                              <div
                                className="font-bold text-slate-900 text-sm leading-snug hover:text-blue-600 transition-colors cursor-pointer truncate block"
                                onClick={(e) => handleOpenDemandDetails(demand, e)}
                                title={demand.demandTitle}
                              >
                                {demand.demandTitle}
                              </div>
                            </td>

                            {/* 2. Client */}
                            <td className="py-4 px-3.5 font-semibold text-slate-800 whitespace-nowrap">
                              <div className="flex items-center gap-2 text-sm">
                                <Building className="w-4 h-4 text-slate-500 flex-shrink-0" />
                                <span className="truncate max-w-[140px]" title={demand.accountName || demand.companyName || '—'}>
                                  {demand.accountName || demand.companyName || '—'}
                                </span>
                              </div>
                            </td>

                            {/* 3. Required Skills */}
                            <td className="py-4 px-3.5">
                              <div className="flex flex-wrap gap-1.5 items-center">
                                {Array.isArray(demand.skillName) && demand.skillName.length > 0 ? (
                                  <>
                                    {demand.skillName.slice(0, 2).map((sk, idx) => (
                                      <span
                                        key={idx}
                                        className="inline-block px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-700 text-xs font-semibold border border-slate-200/80 truncate max-w-[95px]"
                                        title={sk}
                                      >
                                        {sk}
                                      </span>
                                    ))}
                                    {demand.skillName.length > 2 && (
                                      <span
                                        className="inline-block px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 text-xs font-bold border border-blue-200 cursor-help"
                                        title={`Additional skills: ${demand.skillName.slice(2).join(', ')}`}
                                      >
                                        +{demand.skillName.length - 2}
                                      </span>
                                    )}
                                  </>
                                ) : (
                                  <span className="text-slate-400 text-xs italic">None specified</span>
                                )}
                              </div>
                            </td>

                            {/* 4. Openings */}
                            <td className="py-4 px-3 text-center font-extrabold text-slate-800 text-sm">
                              {demand.resourceRequestsCount || demand.requestsSummary?.total || 1}
                            </td>

                            {/* 5. Submitted */}
                            <td className="py-4 px-3 text-center">
                              <button
                                onClick={() => toggleProfiles(demand.demandid)}
                                title={pStats.total > 0 ? 'Click to inspect submitted profiles' : 'No profiles submitted'}
                                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-bold text-xs transition-all ${
                                  pStats.total > 0
                                    ? 'bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 cursor-pointer shadow-xs'
                                    : 'bg-slate-50 text-slate-400 cursor-default border border-slate-200/60'
                                }`}
                              >
                                <span>{pStats.total}</span>
                                {pStats.total > 0 && (
                                  <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
                                )}
                              </button>
                            </td>

                            {/* 6. Selected */}
                            <td className="py-4 px-3 text-center text-sm">
                              {pStats.cleared > 0 ? (
                                <span className="px-2.5 py-0.5 rounded-md font-bold inline-block" style={{ background: '#ecfdf5', color: '#047857', border: '1px solid #a7f3d0' }}>
                                  {pStats.cleared}
                                </span>
                              ) : (
                                <span className="text-slate-400 font-semibold">0</span>
                              )}
                            </td>

                            {/* 7. Allocated */}
                            <td className="py-4 px-3 text-center text-sm">
                              {pStats.allocated > 0 ? (
                                <span className="px-2.5 py-0.5 rounded-md font-bold inline-block" style={{ background: '#eef2ff', color: '#4338ca', border: '1px solid #c7d2fe' }}>
                                  {pStats.allocated}
                                </span>
                              ) : (
                                <span className="text-slate-400 font-semibold">0</span>
                              )}
                            </td>

                            {/* 8. Owner */}
                            <td className="py-4 px-3.5 whitespace-nowrap">
                              <div className="flex items-center gap-1.5">
                                <span className="font-semibold text-slate-800 text-sm truncate max-w-[100px]" title={demand.requesterName || 'Admin'}>
                                  {demand.requesterName || 'Admin'}
                                </span>
                                {isOwner && (
                                  <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 text-xs font-bold border border-blue-200">
                                    You
                                  </span>
                                )}
                              </div>
                            </td>

                            {/* 9. Created Date */}
                            <td className="py-4 px-3.5 whitespace-nowrap text-slate-600 font-semibold text-xs">
                              {formatISTDate(getDemandOpenDate(demand)) || <span className="text-slate-400">—</span>}
                            </td>

                            {/* 10. Target Date */}
                            <td className="py-4 px-3.5 whitespace-nowrap text-slate-600 font-semibold text-xs">
                              {formatISTDate(getDemandFulfilmentDate(demand)) || <span className="text-slate-400">Not Set</span>}
                            </td>

                            {/* 11. Status */}
                            <td className="py-4 px-3.5 whitespace-nowrap">
                              <span
                                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border shadow-2xs"
                                style={{
                                  backgroundColor: statusCfg.bg,
                                  color: statusCfg.color,
                                  borderColor: statusCfg.border,
                                }}
                              >
                                <span
                                  className="w-2 h-2 rounded-full flex-shrink-0"
                                  style={{ backgroundColor: statusCfg.dot }}
                                />
                                {demand.overallStatus || 'Open'}
                              </span>
                            </td>

                            {/* 12. Actions */}
                            <td className="py-4 px-4 text-right whitespace-nowrap">
                              <div className="flex items-center justify-end gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  title="View Demand Details"
                                  onClick={(e) => handleOpenDemandDetails(demand, e)}
                                  className="h-9 w-9 p-0 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-xl border border-transparent hover:border-blue-200 transition-colors"
                                >
                                  <Eye className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  title="View Submitted Profiles"
                                  onClick={() => toggleProfiles(demand.demandid)}
                                  className={`h-9 px-3 text-xs font-bold rounded-xl transition-all ${
                                    isExpanded
                                      ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                      : 'text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 border border-transparent hover:border-indigo-200'
                                  }`}
                                >
                                  Profiles ({pStats.total})
                                </Button>
                              </div>
                            </td>
                          </tr>

                          {/* Expandable Submitted Profiles Row */}
                          {isExpanded && (
                            <tr>
                              <td colSpan={12} className="bg-slate-50/70 p-4 border-b border-gray-200">
                                <div className="space-y-3">
                                  <div className="flex items-center justify-between">
                                    <h5 className="font-bold text-gray-800 text-xs flex items-center gap-2">
                                      <Users className="w-4 h-4 text-blue-600" />
                                      Profiles Submitted for #{demand.demandid}: {demand.demandTitle}
                                    </h5>
                                    <span className="text-[11px] text-gray-500 font-medium">
                                      {pStats.profiles.length} total submitted profiles
                                    </span>
                                  </div>

                                  {pStats.profiles.length === 0 ? (
                                    <div className="text-center py-4 text-xs text-gray-400 bg-white rounded-xl border border-gray-200/70">
                                      No profiles submitted against this demand yet.
                                    </div>
                                  ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                      {pStats.profiles.map((profile, pIdx) => {
                                        const isEmp = profile.resourceType === 'EMPLOYEE';
                                        return (
                                          <div
                                            key={profile.key || pIdx}
                                            onClick={(e) => handleOpenProfileHistory(profile, demand, e)}
                                            className="bg-white p-3 rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-xs transition-all cursor-pointer flex flex-col justify-between text-left"
                                          >
                                            <div>
                                              <div className="flex items-start justify-between gap-2">
                                                <div>
                                                  <h6 className="font-bold text-gray-900 text-xs">
                                                    {profile.resourceName}
                                                  </h6>
                                                  {profile.email && (
                                                    <p className="text-[10.5px] text-gray-500">{profile.email}</p>
                                                  )}
                                                </div>
                                                <Badge
                                                  className={`text-[9.5px] ${
                                                    isEmp
                                                      ? 'bg-blue-50 text-blue-700 border-blue-200'
                                                      : 'bg-purple-50 text-purple-700 border-purple-200'
                                                  }`}
                                                >
                                                  {isEmp ? 'Internal' : 'External'}
                                                </Badge>
                                              </div>

                                              <div className="mt-2 flex items-center justify-between text-[11px]">
                                                <span className="text-gray-500 font-medium">Status:</span>
                                                <span className="font-bold text-blue-700">{profile.status}</span>
                                              </div>
                                            </div>

                                            <div className="mt-3 pt-2 border-t border-gray-100 flex items-center justify-between text-[10.5px]">
                                              <span className="text-gray-400 font-medium">
                                                {formatISTDateTime(profile.sharedAt)}
                                              </span>
                                              <span className="text-blue-600 font-bold hover:underline flex items-center gap-0.5">
                                                View Timeline <ChevronRight className="w-3 h-3" />
                                              </span>
                                            </div>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  )}
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Table Pagination */}
              <div className="p-4 border-t border-gray-200">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                  itemsPerPage={itemsPerPage}
                  onItemsPerPageChange={setItemsPerPage}
                  totalItems={filteredDemands.length}
                  label="demands"
                />
              </div>
            </div>
          ) : (
            /* ── Split-Pane Master-Detail View ── */
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '380px minmax(0, 1fr)',
                gap: '20px',
                alignItems: 'start',
                minHeight: '620px',
                width: '100%',
                textAlign: 'left',
                marginTop: '16px',
              }}
            >
              {/* ── Left Pane: Master Demands List ── */}
              <div
                style={{
                  background: '#ffffff',
                  border: '1.5px solid #e2e8f0',
                  borderRadius: '16px',
                  boxShadow: '0 4px 16px rgba(15, 23, 42, 0.05)',
                  display: 'flex',
                  flexDirection: 'column',
                  overflow: 'hidden',
                  width: '380px',
                }}
              >
                <div
                  style={{
                    padding: '16px',
                    background: '#f8fafc',
                    borderBottom: '1px solid #e2e8f0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <div>
                    <h3
                      style={{
                        fontWeight: 800,
                        color: '#0f172a',
                        fontSize: '14px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        margin: 0,
                      }}
                    >
                      <Briefcase className="w-4 h-4 text-blue-600" />
                      <span>Demands</span>
                      <span
                        style={{
                          fontSize: '11px',
                          background: '#dbeafe',
                          color: '#1e40af',
                          fontWeight: 700,
                          padding: '2px 8px',
                          borderRadius: '9999px',
                        }}
                      >
                        {filteredDemands.length}
                      </span>
                    </h3>
                    <p style={{ fontSize: '11px', color: '#64748b', margin: '4px 0 0 0' }}>
                      Select a demand to inspect details
                    </p>
                  </div>
                </div>

                {/* Scrollable list */}
                <div
                  style={{
                    overflowY: 'auto',
                    maxHeight: '580px',
                    padding: '12px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px',
                  }}
                >
                  {paginatedDemands.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '48px 16px', color: '#94a3b8', fontSize: '12px' }}>
                      No demands found matching your filters.
                    </div>
                  ) : (
                    paginatedDemands.map((demand) => {
                      const isSelected = activeSplitDemand && activeSplitDemand.demandid === demand.demandid;
                      const pStats = getDemandProfileStats(demand);
                      const statusCfg = getDemandStatusConfig(demand.overallStatus);

                      return (
                        <div
                          key={demand.demandid}
                          onClick={() => setSelectedSplitDemandId(demand.demandid)}
                          style={{
                            background: isSelected ? '#f0f7ff' : '#ffffff',
                            border: isSelected ? '1.5px solid #3b82f6' : '1px solid #e2e8f0',
                            borderLeft: `5px solid ${isSelected ? '#2563eb' : statusCfg.dot || '#94a3b8'}`,
                            borderRadius: '12px',
                            padding: '14px',
                            boxShadow: isSelected ? '0 4px 14px rgba(37, 99, 235, 0.15)' : '0 1px 3px rgba(0, 0, 0, 0.04)',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease',
                            textAlign: 'left',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', marginBottom: '8px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                              <span
                                style={{
                                  fontWeight: 800,
                                  fontSize: '11px',
                                  background: '#dbeafe',
                                  color: '#1e40af',
                                  padding: '2px 7px',
                                  borderRadius: '6px',
                                  border: '1px solid #bfdbfe',
                                }}
                              >
                                #DM-{demand.demandid}
                              </span>
                              {demand.projectName && (
                                <span
                                  style={{
                                    fontSize: '11px',
                                    color: '#475569',
                                    fontWeight: 600,
                                    maxWidth: '120px',
                                    whiteSpace: 'nowrap',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                  }}
                                  title={demand.projectName}
                                >
                                  {demand.projectName}
                                </span>
                              )}
                            </div>
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '5px',
                                padding: '2px 8px',
                                borderRadius: '9999px',
                                fontSize: '11px',
                                fontWeight: 700,
                                backgroundColor: statusCfg.bg,
                                color: statusCfg.color,
                                border: `1px solid ${statusCfg.border}`,
                              }}
                            >
                              <span style={{ width: '6px', height: '6px', borderRadius: '9999px', backgroundColor: statusCfg.dot }} />
                              {demand.overallStatus || 'Open'}
                            </span>
                          </div>

                          <h4
                            style={{
                              fontWeight: 800,
                              color: '#0f172a',
                              fontSize: '14px',
                              lineHeight: '1.3',
                              margin: '0 0 8px 0',
                            }}
                          >
                            {demand.demandTitle}
                          </h4>

                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12px', color: '#64748b' }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '5px', fontWeight: 600, color: '#334155' }}>
                              <Building className="w-3.5 h-3.5 text-slate-400" />
                              <span style={{ maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {demand.accountName || demand.companyName || '—'}
                              </span>
                            </span>
                            <span
                              style={{
                                fontWeight: 700,
                                color: '#475569',
                                background: '#f1f5f9',
                                padding: '2px 6px',
                                borderRadius: '6px',
                                fontSize: '11px',
                              }}
                            >
                              {demand.resourceRequestsCount || demand.openings || 1} Openings
                            </span>
                          </div>

                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              marginTop: '10px',
                              paddingTop: '8px',
                              borderTop: '1px solid #f1f5f9',
                              fontSize: '11px',
                            }}
                          >
                            <span style={{ color: '#64748b', fontWeight: 500 }}>
                              Profiles: <strong style={{ color: '#0f172a' }}>{pStats.total}</strong>
                              {pStats.cleared > 0 && (
                                <span style={{ color: '#16a34a', fontWeight: 700, marginLeft: '6px' }}>
                                  ({pStats.cleared} Cleared)
                                </span>
                              )}
                            </span>
                            <span style={{ color: '#94a3b8', fontWeight: 500 }}>
                              {formatISTDate(getDemandOpenDate(demand))}
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Left Pane Pagination */}
                <div style={{ padding: '12px', background: '#f8fafc', borderTop: '1px solid #e2e8f0' }}>
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                    itemsPerPage={itemsPerPage}
                    onItemsPerPageChange={setItemsPerPage}
                    totalItems={filteredDemands.length}
                    label="demands"
                  />
                </div>
              </div>

              {/* ── Right Pane: Detail Workspace ── */}
              {activeSplitDemand ? (() => {
                const activeStatusCfg = getDemandStatusConfig(activeSplitDemand.overallStatus);
                const activePriorityCfg = getPriorityConfig(activeSplitDemand.priority);
                const activePStats = getDemandProfileStats(activeSplitDemand);
                const isOwnerOfActive = isCreatedByCurrentUser(activeSplitDemand);

                return (
                  <div
                    style={{
                      background: '#ffffff',
                      border: '1.5px solid #e2e8f0',
                      borderRadius: '16px',
                      boxShadow: '0 4px 16px rgba(15, 23, 42, 0.05)',
                      padding: '24px',
                      display: 'flex',
                      flexDirection: 'column',
                      overflow: 'hidden',
                      textAlign: 'left',
                    }}
                  >
                    {/* Header */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        justifyContent: 'space-between',
                        gap: '16px',
                        paddingBottom: '16px',
                        borderBottom: '1px solid #f1f5f9',
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '8px' }}>
                          <span
                            style={{
                              fontWeight: 800,
                              fontSize: '12px',
                              background: '#eff6ff',
                              color: '#1d4ed8',
                              padding: '3px 10px',
                              borderRadius: '8px',
                              border: '1px solid #bfdbfe',
                            }}
                          >
                            #DM-{activeSplitDemand.demandid}
                          </span>
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              padding: '3px 10px',
                              borderRadius: '9999px',
                              fontSize: '12px',
                              fontWeight: 700,
                              backgroundColor: activeStatusCfg.bg,
                              color: activeStatusCfg.color,
                              border: `1px solid ${activeStatusCfg.border}`,
                            }}
                          >
                            <span style={{ width: '7px', height: '7px', borderRadius: '9999px', backgroundColor: activeStatusCfg.dot }} />
                            {activeSplitDemand.overallStatus || 'Open'}
                          </span>
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              padding: '3px 10px',
                              borderRadius: '8px',
                              fontSize: '12px',
                              fontWeight: 700,
                              backgroundColor: activePriorityCfg.bg,
                              color: activePriorityCfg.color,
                              border: `1px solid ${activePriorityCfg.border}`,
                            }}
                          >
                            Priority: {activeSplitDemand.priority || 'Medium'}
                          </span>
                          {isOwnerOfActive && (
                            <span
                              style={{
                                padding: '3px 10px',
                                borderRadius: '8px',
                                background: '#e0e7ff',
                                color: '#4338ca',
                                fontSize: '12px',
                                fontWeight: 700,
                                border: '1px solid #c7d2fe',
                              }}
                            >
                              Created by You
                            </span>
                          )}
                        </div>
                        <h2
                          style={{
                            fontSize: '22px',
                            fontWeight: 900,
                            color: '#0f172a',
                            letterSpacing: '-0.02em',
                            margin: '4px 0',
                          }}
                        >
                          {activeSplitDemand.demandTitle}
                        </h2>
                        {activeSplitDemand.projectName && (
                          <p style={{ fontSize: '12px', color: '#64748b', fontWeight: 500, margin: '2px 0 0 0' }}>
                            Project: <strong style={{ color: '#334155' }}>{activeSplitDemand.projectName}</strong>
                          </p>
                        )}
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => handleOpenDemandDetails(activeSplitDemand, e)}
                          className="h-9 px-4 text-xs font-bold rounded-xl border-slate-200 hover:bg-slate-50 text-slate-700 flex items-center gap-1.5"
                          style={{ border: '1.5px solid #cbd5e1' }}
                        >
                          <Eye className="w-4 h-4 text-slate-500" />
                          <span>Full Details</span>
                        </Button>
                      </div>
                    </div>

                    {/* 4 Metric Tiles Grid */}
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(4, 1fr)',
                        gap: '12px',
                        margin: '18px 0',
                      }}
                    >
                      {/* Client */}
                      <div
                        style={{
                          background: '#f8fafc',
                          border: '1px solid #e2e8f0',
                          borderRadius: '12px',
                          padding: '14px',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'space-between',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#64748b', fontSize: '11px', fontWeight: 700, marginBottom: '6px' }}>
                          <Building className="w-4 h-4 text-blue-600" />
                          Client / Account
                        </div>
                        <div
                          style={{
                            fontWeight: 800,
                            color: '#0f172a',
                            fontSize: '14px',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                          title={activeSplitDemand.accountName || activeSplitDemand.companyName || '—'}
                        >
                          {activeSplitDemand.accountName || activeSplitDemand.companyName || '—'}
                        </div>
                      </div>

                      {/* Target Openings */}
                      <div
                        style={{
                          background: '#f8fafc',
                          border: '1px solid #e2e8f0',
                          borderRadius: '12px',
                          padding: '14px',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'space-between',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#64748b', fontSize: '11px', fontWeight: 700, marginBottom: '6px' }}>
                          <Target className="w-4 h-4 text-indigo-600" />
                          Openings Target
                        </div>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                          <span style={{ fontWeight: 900, color: '#0f172a', fontSize: '18px' }}>
                            {activeSplitDemand.resourceRequestsCount || activeSplitDemand.openings || 1}
                          </span>
                          <span style={{ fontSize: '11px', fontWeight: 600, color: '#64748b' }}>
                            positions ({activePStats.allocated} allocated)
                          </span>
                        </div>
                      </div>

                      {/* Opened Date */}
                      <div
                        style={{
                          background: '#f8fafc',
                          border: '1px solid #e2e8f0',
                          borderRadius: '12px',
                          padding: '14px',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'space-between',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#64748b', fontSize: '11px', fontWeight: 700, marginBottom: '6px' }}>
                          <Calendar className="w-4 h-4 text-emerald-600" />
                          Date Opened
                        </div>
                        <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '14px' }}>
                          {formatISTDate(getDemandOpenDate(activeSplitDemand))}
                        </div>
                      </div>

                      {/* Target Fulfillment */}
                      <div
                        style={{
                          background: '#f8fafc',
                          border: '1px solid #e2e8f0',
                          borderRadius: '12px',
                          padding: '14px',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'space-between',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#64748b', fontSize: '11px', fontWeight: 700, marginBottom: '6px' }}>
                          <Clock className="w-4 h-4 text-amber-600" />
                          Target Date
                        </div>
                        <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '14px' }}>
                          {formatISTDate(getDemandFulfilmentDate(activeSplitDemand)) || 'Not Set'}
                        </div>
                      </div>
                    </div>

                    {/* Required Skills */}
                    <div style={{ marginBottom: '16px' }}>
                      <h4 style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#64748b', margin: '0 0 8px 0' }}>
                        Required Skills & Technologies
                      </h4>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                        {Array.isArray(activeSplitDemand.skillName) && activeSplitDemand.skillName.length > 0 ? (
                          activeSplitDemand.skillName.map((sk, idx) => (
                            <span
                              key={idx}
                              style={{
                                padding: '4px 10px',
                                borderRadius: '8px',
                                background: '#eff6ff',
                                color: '#1d4ed8',
                                fontSize: '12px',
                                fontWeight: 700,
                                border: '1px solid #bfdbfe',
                              }}
                            >
                              {sk}
                            </span>
                          ))
                        ) : (
                          <span style={{ color: '#94a3b8', fontSize: '12px', fontStyle: 'italic' }}>No specific skills listed</span>
                        )}
                      </div>
                    </div>

                    {/* Candidate Pipeline Section */}
                    <div style={{ paddingTop: '16px', borderTop: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <Users className="w-4 h-4 text-blue-600" />
                          <h3 style={{ fontWeight: 800, color: '#0f172a', fontSize: '14px', margin: 0 }}>
                            Submitted Candidates & Pipeline ({activePStats.profiles.length})
                          </h3>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', fontWeight: 600 }}>
                          <span style={{ padding: '2px 8px', borderRadius: '6px', background: '#ecfdf5', color: '#047857', border: '1px solid #a7f3d0' }}>
                            {activePStats.cleared} Selected / Cleared
                          </span>
                          <span style={{ padding: '2px 8px', borderRadius: '6px', background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe' }}>
                            {activePStats.interviewing} Interviewing
                          </span>
                        </div>
                      </div>

                      {activePStats.profiles.length === 0 ? (
                        <div
                          style={{
                            padding: '48px 16px',
                            borderRadius: '12px',
                            border: '1.5px dashed #cbd5e1',
                            textAlign: 'center',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: '#f8fafc',
                            margin: 'auto 0',
                          }}
                        >
                          <div style={{ width: '48px', height: '48px', borderRadius: '9999px', background: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', marginBottom: '10px' }}>
                            <Users className="w-6 h-6" />
                          </div>
                          <p style={{ fontWeight: 800, color: '#334155', fontSize: '14px', margin: 0 }}>No profiles submitted yet</p>
                          <p style={{ fontSize: '12px', color: '#94a3b8', margin: '4px 0 0 0', maxWidth: '360px' }}>
                            Candidate resumes or employee profiles submitted for this demand will appear here with live interview stages.
                          </p>
                        </div>
                      ) : (
                        <div
                          style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                            gap: '12px',
                            overflowY: 'auto',
                            maxHeight: '340px',
                            paddingRight: '4px',
                          }}
                        >
                          {activePStats.profiles.map((profile, pIdx) => {
                            const isEmp = profile.resourceType === 'EMPLOYEE';
                            return (
                              <div
                                key={profile.key || pIdx}
                                onClick={(e) => handleOpenProfileHistory(profile, activeSplitDemand, e)}
                                style={{
                                  background: '#ffffff',
                                  border: '1.5px solid #e2e8f0',
                                  borderRadius: '12px',
                                  padding: '14px',
                                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  flexDirection: 'column',
                                  justifyContent: 'space-between',
                                  transition: 'all 0.15s ease',
                                }}
                              >
                                <div>
                                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px' }}>
                                    <div>
                                      <h5 style={{ fontWeight: 800, color: '#0f172a', fontSize: '13px', margin: 0 }}>{profile.resourceName}</h5>
                                      {profile.email && <p style={{ fontSize: '11px', color: '#64748b', margin: '2px 0 0 0' }}>{profile.email}</p>}
                                    </div>
                                    <span
                                      style={{
                                        fontSize: '10px',
                                        fontWeight: 700,
                                        padding: '2px 6px',
                                        borderRadius: '6px',
                                        background: isEmp ? '#eff6ff' : '#faf5ff',
                                        color: isEmp ? '#1d4ed8' : '#7e22ce',
                                        border: `1px solid ${isEmp ? '#bfdbfe' : '#e9d5ff'}`,
                                      }}
                                    >
                                      {isEmp ? 'Internal' : 'External'}
                                    </span>
                                  </div>
                                  <div style={{ marginTop: '10px', fontSize: '11px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <span style={{ color: '#64748b', fontWeight: 600 }}>Status:</span>
                                    <span
                                      style={{
                                        fontWeight: 800,
                                        color: '#1d4ed8',
                                        background: '#eff6ff',
                                        padding: '2px 8px',
                                        borderRadius: '6px',
                                        border: '1px solid #bfdbfe',
                                      }}
                                    >
                                      {profile.status}
                                    </span>
                                  </div>
                                </div>

                                <div style={{ marginTop: '12px', paddingTop: '10px', borderTop: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '11px' }}>
                                  <span style={{ color: '#94a3b8', fontWeight: 500 }}>
                                    {formatISTDateTime(profile.sharedAt)}
                                  </span>
                                  <span style={{ color: '#2563eb', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '2px' }}>
                                    Timeline <ChevronRight className="w-3.5 h-3.5" />
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })() : (
                <div
                  style={{
                    background: '#ffffff',
                    border: '1.5px solid #e2e8f0',
                    borderRadius: '16px',
                    boxShadow: '0 4px 16px rgba(15, 23, 42, 0.05)',
                    padding: '48px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    textAlign: 'center',
                  }}
                >
                  <Briefcase className="w-12 h-12 text-slate-300" style={{ marginBottom: '12px' }} />
                  <h3 style={{ fontWeight: 800, color: '#334155', fontSize: '16px', margin: 0 }}>Select a Demand</h3>
                  <p style={{ fontSize: '12px', color: '#94a3b8', margin: '4px 0 0 0' }}>
                    Choose a demand from the left list to view its complete details and submission pipeline.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* TAB: INTERVIEWS SCHEDULED BY USER (User Activity & Reports)   */}
      {/* ══════════════════════════════════════════════════════════════ */}
      {activeMainTab === 'interviews' && (
        <div
          id="panel-interviews"
          role="tabpanel"
          aria-labelledby="tab-interviews"
          className="space-y-5 text-left rounded-2xl p-5 sm:p-6"
          style={{
            background: '#ffffff',
            border: '1.5px solid #e2e8f0',
            boxShadow: '0 8px 30px rgba(15, 23, 42, 0.08)',
          }}
        >
          {/* ── Scheduled Interviews Filter Toolbar ── */}
          <div
            style={{
              background: 'rgba(248, 250, 252, 0.85)',
              borderRadius: '16px',
              border: '1px solid #e2e8f0',
              padding: '16px 20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
              textAlign: 'left',
            }}
          >
            {/* Primary Row: Scope Badge + Date Quick-Filters + Refresh */}
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '12px',
              }}
            >
              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '12px' }}>
                {/* User Scope Badge */}
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '6px 14px',
                    background: '#eff6ff',
                    border: '1px solid #bfdbfe',
                    borderRadius: '10px',
                    height: '36px',
                  }}
                >
                  <div style={{ width: '8px', height: '8px', borderRadius: '9999px', background: '#2563eb' }} />
                  <span style={{ fontSize: '12px', fontWeight: 700, color: '#1e293b', whiteSpace: 'nowrap' }}>
                    {currentUserName}
                  </span>
                  <span
                    style={{
                      fontSize: '11.5px',
                      fontWeight: 800,
                      color: '#2563eb',
                      background: '#dbeafe',
                      padding: '2px 8px',
                      borderRadius: '9999px',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {myInterviews.length} {myInterviews.length === 1 ? 'Interview' : 'Interviews'} Scheduled
                  </span>
                </div>

                {/* Date Quick-Filters */}
                <div style={{ display: 'inline-flex', flexWrap: 'wrap', alignItems: 'center', gap: '8px' }}>
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: 700,
                      color: '#64748b',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      marginRight: '2px',
                    }}
                  >
                    <Calendar className="w-3.5 h-3.5 text-blue-600" />
                    Scheduled:
                  </span>
                  {[
                    { id: 'all', label: 'All Time', count: myInterviews.length },
                    { id: 'today', label: 'Today', count: interviewsTodayCount },
                    { id: 'yesterday', label: 'Yesterday', count: interviewsYesterdayCount },
                    { id: 'last7days', label: 'Last 7 Days', count: interviewsLast7Count },
                    { id: 'custom', label: 'Custom Date', count: null },
                  ].map((df) => {
                    const isAct = interviewDateFilter === df.id;
                    return (
                      <button
                        key={df.id}
                        type="button"
                        onClick={() => setInterviewDateFilter(df.id)}
                        style={{
                          height: '34px',
                          padding: '0 14px',
                          borderRadius: '10px',
                          fontSize: '12px',
                          fontWeight: isAct ? 700 : 600,
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '8px',
                          whiteSpace: 'nowrap',
                          border: isAct ? '1.5px solid #2563eb' : '1.5px solid #e2e8f0',
                          background: isAct ? '#2563eb' : '#ffffff',
                          color: isAct ? '#ffffff' : '#334155',
                          boxShadow: isAct ? '0 2px 6px rgba(37,99,235,0.25)' : '0 1px 2px rgba(0,0,0,0.03)',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        <span>{df.label}</span>
                        {df.count !== null && (
                          <span
                            style={{
                              padding: '1px 7px',
                              borderRadius: '9999px',
                              fontSize: '10.5px',
                              fontWeight: 800,
                              background: isAct ? 'rgba(29, 78, 216, 0.9)' : '#f1f5f9',
                              color: isAct ? '#ffffff' : '#475569',
                            }}
                          >
                            {df.count}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Refresh Interviews Button */}
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <button
                  type="button"
                  onClick={() => loadData(true)}
                  disabled={refreshing || loading}
                  title="Refresh Scheduled Interviews"
                  style={{
                    height: '36px',
                    padding: '0 14px',
                    borderRadius: '10px',
                    border: '1.5px solid #e2e8f0',
                    background: '#ffffff',
                    color: '#334155',
                    fontSize: '12px',
                    fontWeight: 600,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    cursor: 'pointer',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
                  }}
                >
                  <RefreshCw className={`w-3.5 h-3.5 text-slate-600 ${refreshing ? 'animate-spin' : ''}`} />
                  <span>Refresh</span>
                </button>
              </div>
            </div>

            {/* Custom Date Inputs if Custom is selected */}
            {interviewDateFilter === 'custom' && (
              <div className="flex items-center flex-wrap gap-3 bg-white p-2.5 rounded-xl border border-blue-200 shadow-2xs">
                <span className="text-xs font-bold text-blue-700 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-blue-600" />
                  Custom Date Range:
                </span>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-semibold text-slate-500">From:</span>
                  <input
                    type="date"
                    value={interviewFromDate}
                    onChange={(e) => setInterviewFromDate(e.target.value)}
                    className="h-8 text-xs border border-slate-200 rounded-lg px-2.5 text-slate-800 focus:outline-blue-500 bg-slate-50/50"
                  />
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-semibold text-slate-500">To:</span>
                  <input
                    type="date"
                    value={interviewToDate}
                    onChange={(e) => setInterviewToDate(e.target.value)}
                    className="h-8 text-xs border border-slate-200 rounded-lg px-2.5 text-slate-800 focus:outline-blue-500 bg-slate-50/50"
                  />
                </div>
                {(interviewFromDate || interviewToDate) && (
                  <button
                    type="button"
                    onClick={() => {
                      setInterviewFromDate('');
                      setInterviewToDate('');
                    }}
                    className="text-xs text-rose-600 hover:text-rose-700 font-bold ml-1 cursor-pointer bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-200"
                    title="Clear Dates"
                  >
                    Clear Dates
                  </button>
                )}
              </div>
            )}

            {/* Secondary Row: Status Pills on left + Search Input on right */}
            <div
              style={{
                paddingTop: '12px',
                borderTop: '1px solid #e2e8f0',
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '12px',
              }}
            >
              {/* Status Pills */}
              <div style={{ display: 'inline-flex', flexWrap: 'wrap', alignItems: 'center', gap: '8px' }}>
                {[
                  { id: 'ALL', label: 'All Statuses', dot: null },
                  { id: 'SCHEDULED', label: 'Scheduled', dot: '#3b82f6' },
                  { id: 'SELECTED', label: 'Selected / Cleared', dot: '#10b981' },
                  { id: 'COMPLETED', label: 'Completed', dot: '#0d9488' },
                  { id: 'CANCELLED', label: 'Cancelled', dot: '#64748b' },
                ].map((st) => {
                  const isActive = interviewStatusFilter === st.id;
                  return (
                    <button
                      key={st.id}
                      type="button"
                      onClick={() => setInterviewStatusFilter(st.id)}
                      style={{
                        height: '34px',
                        padding: '0 14px',
                        fontSize: '12px',
                        fontWeight: isActive ? 700 : 600,
                        borderRadius: '10px',
                        border: isActive ? '1.5px solid #2563eb' : '1.5px solid #e2e8f0',
                        background: isActive ? '#2563eb' : '#ffffff',
                        color: isActive ? '#ffffff' : '#334155',
                        boxShadow: isActive ? '0 2px 6px rgba(37,99,235,0.25)' : '0 1px 2px rgba(0,0,0,0.03)',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '7px',
                        whiteSpace: 'nowrap',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      {st.dot && (
                        <span
                          style={{
                            width: '7px',
                            height: '7px',
                            borderRadius: '9999px',
                            backgroundColor: isActive ? '#ffffff' : st.dot,
                            display: 'inline-block',
                            flexShrink: 0,
                          }}
                        />
                      )}
                      <span>{st.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Dropdown Filters & Search Bar */}
              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '10px' }}>
                <select
                  value={interviewClientFilter}
                  onChange={(e) => setInterviewClientFilter(e.target.value)}
                  style={{
                    height: '36px',
                    fontSize: '12px',
                    fontWeight: 600,
                    borderRadius: '10px',
                    border: '1.5px solid #e2e8f0',
                    background: '#ffffff',
                    color: '#334155',
                    padding: '0 12px',
                    cursor: 'pointer',
                  }}
                >
                  <option value="ALL">All Clients ({interviewClientOptions.length})</option>
                  {interviewClientOptions.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>

                <select
                  value={interviewDemandFilter}
                  onChange={(e) => setInterviewDemandFilter(e.target.value)}
                  style={{
                    height: '36px',
                    fontSize: '12px',
                    fontWeight: 600,
                    borderRadius: '10px',
                    border: '1.5px solid #e2e8f0',
                    background: '#ffffff',
                    color: '#334155',
                    padding: '0 12px',
                    maxWidth: '200px',
                    cursor: 'pointer',
                  }}
                >
                  <option value="ALL">All Demands ({interviewDemandOptions.length})</option>
                  {interviewDemandOptions.map((title) => (
                    <option key={title} value={title}>
                      {title}
                    </option>
                  ))}
                </select>

                <select
                  value={interviewLevelFilter}
                  onChange={(e) => setInterviewLevelFilter(e.target.value)}
                  style={{
                    height: '36px',
                    fontSize: '12px',
                    fontWeight: 600,
                    borderRadius: '10px',
                    border: '1.5px solid #e2e8f0',
                    background: '#ffffff',
                    color: '#334155',
                    padding: '0 12px',
                    cursor: 'pointer',
                  }}
                >
                  <option value="ALL">All Levels ({interviewLevelOptions.length})</option>
                  {interviewLevelOptions.map((lvl) => (
                    <option key={lvl} value={lvl}>
                      {lvl}
                    </option>
                  ))}
                </select>

                <div style={{ width: '280px', flexShrink: 0 }}>
                  <SearchFilter
                    value={interviewSearchQuery}
                    onChange={(val) => setInterviewSearchQuery(val)}
                    placeholder="Search candidate, demand, level, client..."
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Active Filter Pills Bar */}
          {(interviewDateFilter !== 'all' ||
            interviewStatusFilter !== 'ALL' ||
            interviewClientFilter !== 'ALL' ||
            interviewDemandFilter !== 'ALL' ||
            interviewLevelFilter !== 'ALL' ||
            interviewSearchQuery) && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: '12px',
                background: '#eff6ff',
                border: '1px solid #bfdbfe',
                borderRadius: '12px',
                padding: '8px 16px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <span style={{ fontWeight: 700, color: '#1e3a8a' }}>Active Filters:</span>
                {interviewDateFilter !== 'all' && (
                  <span style={{ background: '#ffffff', border: '1px solid #bfdbfe', color: '#1e40af', padding: '2px 10px', borderRadius: '6px', fontWeight: 600 }}>
                    Date: <strong className="capitalize">{interviewDateFilter}</strong>
                  </span>
                )}
                {interviewStatusFilter !== 'ALL' && (
                  <span style={{ background: '#ffffff', border: '1px solid #bfdbfe', color: '#1e40af', padding: '2px 10px', borderRadius: '6px', fontWeight: 600 }}>
                    Status: <strong>{interviewStatusFilter}</strong>
                  </span>
                )}
                {interviewClientFilter !== 'ALL' && (
                  <span style={{ background: '#ffffff', border: '1px solid #bfdbfe', color: '#1e40af', padding: '2px 10px', borderRadius: '6px', fontWeight: 600 }}>
                    Client: <strong>{interviewClientFilter}</strong>
                  </span>
                )}
                {interviewDemandFilter !== 'ALL' && (
                  <span style={{ background: '#ffffff', border: '1px solid #bfdbfe', color: '#1e40af', padding: '2px 10px', borderRadius: '6px', fontWeight: 600 }}>
                    Demand: <strong>{interviewDemandFilter}</strong>
                  </span>
                )}
                {interviewLevelFilter !== 'ALL' && (
                  <span style={{ background: '#ffffff', border: '1px solid #bfdbfe', color: '#1e40af', padding: '2px 10px', borderRadius: '6px', fontWeight: 600 }}>
                    Level: <strong>{interviewLevelFilter}</strong>
                  </span>
                )}
                {interviewSearchQuery && (
                  <span style={{ background: '#ffffff', border: '1px solid #bfdbfe', color: '#1e40af', padding: '2px 10px', borderRadius: '6px', fontWeight: 600 }}>
                    Search: <strong>"{interviewSearchQuery}"</strong>
                  </span>
                )}
                <span style={{ color: '#64748b', fontWeight: 600, marginLeft: '6px' }}>
                  Showing {filteredMyInterviews.length} of {myInterviews.length} interviews
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setInterviewDateFilter('all');
                  setInterviewFromDate('');
                  setInterviewToDate('');
                  setInterviewStatusFilter('ALL');
                  setInterviewClientFilter('ALL');
                  setInterviewDemandFilter('ALL');
                  setInterviewLevelFilter('ALL');
                  setInterviewSearchQuery('');
                }}
                style={{ fontSize: '12px', color: '#1d4ed8', fontWeight: 700, textDecoration: 'underline', cursor: 'pointer' }}
              >
                Reset All
              </button>
            </div>
          )}

          {/* Interviews Table View */}
          <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-2xs">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100/80 text-slate-700 font-bold border-b border-slate-200 uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4">Candidate / Resource</th>
                  <th className="py-3 px-4">Demand & Client</th>
                  <th className="py-3 px-4">Round Level</th>
                  <th className="py-3 px-4">Scheduled At (IST)</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800 bg-white">
                {filteredMyInterviews.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-500">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <CalendarCheck className="w-10 h-10 text-slate-300 stroke-1" />
                        <span className="font-bold text-sm text-slate-700">No Scheduled Interviews Found</span>
                        <span className="text-xs text-slate-400">
                          {interviewDateFilter !== 'all' ||
                          interviewStatusFilter !== 'ALL' ||
                          interviewClientFilter !== 'ALL' ||
                          interviewDemandFilter !== 'ALL' ||
                          interviewLevelFilter !== 'ALL' ||
                          interviewSearchQuery
                            ? 'Try clearing active filters'
                            : 'Interviews scheduled by you will appear here.'}
                        </span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredMyInterviews.map((iv, idx) => {
                    const resourceName = iv.candidateName || iv.employeeName || 'Resource';
                    const isExternal = Boolean(iv.candidateId) || !iv.employeeId;
                    const schedStr = getInterviewScheduledAt(iv);
                    const dateStr = getISTDateString(schedStr);
                    const todayStr = getTodayISTString();
                    const yesterdayStr = getYesterdayISTString();
                    const isToday = dateStr === todayStr;
                    const isYesterday = dateStr === yesterdayStr;
                    const isUpcoming = dateStr && dateStr > todayStr;
                    const roundName = getInterviewLevel(iv);

                    const statusStr = (iv.status || 'Scheduled').trim();
                    const isSelected = statusStr.toLowerCase().includes('select') || statusStr.toLowerCase().includes('clear');
                    const isScheduled = statusStr.toLowerCase().includes('sched');
                    const isRejected = statusStr.toLowerCase().includes('reject');
                    const isCompleted = statusStr.toLowerCase().includes('complet');

                    return (
                      <tr key={iv.interviewId || idx} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4">
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs flex-shrink-0">
                              {resourceName.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div style={{ fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <span>{resourceName}</span>
                                <span
                                  style={{
                                    padding: '2px 8px',
                                    borderRadius: '9999px',
                                    fontSize: '10px',
                                    fontWeight: 700,
                                    background: isExternal ? '#ecfdf5' : '#eef2ff',
                                    color: isExternal ? '#047857' : '#4338ca',
                                    border: isExternal ? '1px solid #a7f3d0' : '1px solid #c7d2fe',
                                    whiteSpace: 'nowrap',
                                  }}
                                >
                                  {isExternal ? 'External' : 'Internal'}
                                </span>
                              </div>
                              {(iv.candidateEmail || iv.employeeEmail) && (
                                <div className="text-[11px] text-slate-500 font-medium">
                                  {iv.candidateEmail || iv.employeeEmail}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-semibold text-slate-800">
                            {iv.demandTitle || `Demand #${iv.demandId || 'N/A'}`}
                          </div>
                          {(iv.accountName || iv.projectName) && (
                            <div className="text-[11px] text-slate-500">
                              {iv.accountName || iv.projectName}
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              padding: '3px 10px',
                              borderRadius: '8px',
                              fontWeight: 700,
                              fontSize: '11px',
                              background: '#f1f5f9',
                              color: '#1e293b',
                              border: '1px solid #e2e8f0',
                            }}
                          >
                            {roundName}
                          </span>
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <div className="font-medium text-slate-800">
                            {formatISTDateTime(schedStr)}
                          </div>
                          {(isToday || isYesterday || isUpcoming) && (
                            <div style={{ marginTop: '3px' }}>
                              {isToday && (
                                <span style={{ padding: '2px 8px', borderRadius: '9999px', fontSize: '10px', fontWeight: 700, background: '#dbeafe', color: '#1d4ed8' }}>
                                  Today
                                </span>
                              )}
                              {isYesterday && (
                                <span style={{ padding: '2px 8px', borderRadius: '9999px', fontSize: '10px', fontWeight: 700, background: '#fef3c7', color: '#92400e' }}>
                                  Yesterday
                                </span>
                              )}
                              {isUpcoming && (
                                <span style={{ padding: '2px 8px', borderRadius: '9999px', fontSize: '10px', fontWeight: 700, background: '#f3e8ff', color: '#7e22ce' }}>
                                  Upcoming
                                </span>
                              )}
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              padding: '4px 12px',
                              borderRadius: '9999px',
                              fontSize: '11.5px',
                              fontWeight: 700,
                              whiteSpace: 'nowrap',
                              background: isSelected
                                ? '#d1fae5'
                                : isScheduled
                                ? '#dbeafe'
                                : isRejected
                                ? '#ffe4e6'
                                : isCompleted
                                ? '#ccfbf1'
                                : '#f1f5f9',
                              color: isSelected
                                ? '#065f46'
                                : isScheduled
                                ? '#1e40af'
                                : isRejected
                                ? '#9f1239'
                                : isCompleted
                                ? '#115e59'
                                : '#334155',
                              border: isSelected
                                ? '1px solid #a7f3d0'
                                : isScheduled
                                ? '1px solid #bfdbfe'
                                : isRejected
                                ? '1px solid #fecdd3'
                                : isCompleted
                                ? '1px solid #99f6e4'
                                : '1px solid #e2e8f0',
                            }}
                          >
                            <span
                              style={{
                                width: '6px',
                                height: '6px',
                                borderRadius: '9999px',
                                background: isSelected
                                  ? '#059669'
                                  : isScheduled
                                  ? '#2563eb'
                                  : isRejected
                                  ? '#e11d48'
                                  : isCompleted
                                  ? '#0d9488'
                                  : '#64748b',
                              }}
                            />
                            {statusStr}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenProfileHistory(
                                {
                                  resourceId: iv.candidateId || iv.employeeId,
                                  resourceType: iv.candidateId ? 'EXTERNAL' : 'INTERNAL',
                                  resourceName: resourceName,
                                  demandId: iv.demandId
                                },
                                {
                                  demandid: iv.demandId,
                                  demandTitle: iv.demandTitle
                                },
                                e
                              );
                            }}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              height: '32px',
                              padding: '0 12px',
                              borderRadius: '10px',
                              background: '#eff6ff',
                              color: '#1d4ed8',
                              border: '1px solid #bfdbfe',
                              fontSize: '12px',
                              fontWeight: 700,
                              cursor: 'pointer',
                              whiteSpace: 'nowrap',
                              boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
                            }}
                            title="Inspect Profile Lifecycle History"
                          >
                            <HistoryIcon className="w-3.5 h-3.5" />
                            <span>Timeline</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* TAB 2: SUBMITTED PROFILES (Authoritative Backend Data)         */}
      {/* ══════════════════════════════════════════════════════════════ */}
      {activeMainTab === 'submitted' && (
        <div
          id="panel-submitted-profiles"
          role="tabpanel"
          aria-labelledby="tab-submitted-profiles"
          className="space-y-5 text-left rounded-2xl p-5 sm:p-6"
          style={{
            background: '#ffffff',
            border: '1.5px solid #e2e8f0',
            boxShadow: '0 8px 30px rgba(15, 23, 42, 0.08)',
          }}
        >
          {/* Executive Shared Profiles Activity Block */}
          <div className="bg-slate-50/70 rounded-2xl border border-slate-200/80 shadow-xs p-4 sm:p-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 border-b border-slate-200/60">
              <div className="flex items-center gap-3">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center text-white shadow-xs shrink-0"
                  style={{
                    background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)',
                  }}
                >
                  <Send className="w-4 h-4 text-white" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-extrabold text-slate-900 tracking-tight">Shared Profiles Activity</h3>
                    <span className="inline-flex items-center gap-1 text-[11px] bg-slate-100 text-slate-700 font-semibold px-2 py-0.5 rounded-full border border-slate-200">
                      <Globe className="w-3 h-3 text-slate-500" />
                      Asia/Kolkata (IST)
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">Real-time candidate & employee profiles submitted against active client demands</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    loadSharedSummary();
                    loadSubmittedProfiles();
                  }}
                  disabled={sharedSummaryLoading || submittedProfilesLoading}
                  className="h-9 px-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 hover:text-blue-600 shadow-xs transition-colors flex items-center gap-1.5"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${sharedSummaryLoading || submittedProfilesLoading ? 'animate-spin' : ''}`} />
                  <span>Refresh</span>
                </button>
              </div>
            </div>

            {/* 3 Executive Metric Cards as Interactive Date Selectors - Forced 3-Column Grid */}
            <div
              className="mt-4"
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
                gap: '16px',
              }}
            >
              {/* Today Card */}
              <button
                type="button"
                onClick={() => {
                  setSubDateFilter('today');
                  setSubmittedProfilesPage(1);
                }}
                className={`text-left p-4 rounded-xl border transition-all cursor-pointer ${
                  subDateFilter === 'today'
                    ? 'border-blue-500 ring-2 ring-blue-500/20 bg-blue-50/40 shadow-xs'
                    : 'border-slate-200/90 bg-white hover:bg-slate-50 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-extrabold text-slate-700 flex items-center gap-1.5 uppercase text-[10.5px] tracking-wider">
                    <Calendar className="w-3.5 h-3.5 text-blue-600" />
                    Shared Today
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-600 text-white">Today</span>
                </div>
                <div className="mt-2.5 flex items-baseline gap-2">
                  <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 leading-none">
                    {sharedSummary?.todayEvents ?? userTodaySubmissionsCount}
                  </span>
                  <span className="text-xs text-slate-500 font-medium">submission events</span>
                </div>
                <div className="mt-3 text-xs text-slate-600 flex items-center gap-1.5 pt-2 border-t border-slate-200/70">
                  <UserCheck className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                  <span className="font-semibold text-blue-800 truncate">
                    {sharedSummary?.todayUnique ?? userTodayUnique} unique resources
                  </span>
                </div>
              </button>

              {/* Yesterday Card */}
              <button
                type="button"
                onClick={() => {
                  setSubDateFilter('yesterday');
                  setSubmittedProfilesPage(1);
                }}
                className={`text-left p-4 rounded-xl border transition-all cursor-pointer ${
                  subDateFilter === 'yesterday'
                    ? 'border-purple-500 ring-2 ring-purple-500/20 bg-purple-50/40 shadow-xs'
                    : 'border-slate-200/90 bg-white hover:bg-slate-50 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-extrabold text-slate-700 flex items-center gap-1.5 uppercase text-[10.5px] tracking-wider">
                    <Clock className="w-3.5 h-3.5 text-purple-600" />
                    Shared Yesterday
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-600 text-white">Yesterday</span>
                </div>
                <div className="mt-2.5 flex items-baseline gap-2">
                  <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 leading-none">
                    {sharedSummary?.yesterdayEvents ?? userYesterdaySubmissionsCount}
                  </span>
                  <span className="text-xs text-slate-500 font-medium">submission events</span>
                </div>
                <div className="mt-3 text-xs text-slate-600 flex items-center gap-1.5 pt-2 border-t border-slate-200/70">
                  <UserCheck className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                  <span className="font-semibold text-purple-800 truncate">
                    {sharedSummary?.yesterdayUnique ?? userYesterdayUnique} unique resources
                  </span>
                </div>
              </button>

              {/* All-Time Card */}
              <button
                type="button"
                onClick={() => {
                  setSubDateFilter('all');
                  setSubmittedProfilesPage(1);
                }}
                className={`text-left p-4 rounded-xl border transition-all cursor-pointer ${
                  subDateFilter === 'all'
                    ? 'border-emerald-500 ring-2 ring-emerald-500/20 bg-emerald-50/40 shadow-xs'
                    : 'border-slate-200/90 bg-white hover:bg-slate-50 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-extrabold text-slate-700 flex items-center gap-1.5 uppercase text-[10.5px] tracking-wider">
                    <Layers className="w-3.5 h-3.5 text-emerald-600" />
                    All-Time Submissions
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-600 text-white">All Records</span>
                </div>
                <div className="mt-2.5 flex items-baseline gap-2">
                  <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 leading-none">
                    {sharedSummary?.totalEvents ?? userSubmittedProfiles.length}
                  </span>
                  <span className="text-xs text-slate-500 font-medium">total submissions</span>
                </div>
                <div className="mt-3 text-xs text-slate-600 flex items-center gap-1.5 pt-2 border-t border-slate-200/70">
                  <UserCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span className="font-semibold text-emerald-800 truncate">
                    {sharedSummary?.totalUnique ?? userTotalUnique} unique resources
                  </span>
                </div>
              </button>
            </div>
          </div>

          {/* Filter Toolbar for Submitted Profiles */}
          <div
            style={{
              background: 'rgba(248, 250, 252, 0.85)',
              borderRadius: '16px',
              border: '1px solid #e2e8f0',
              padding: '16px 20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
            }}
          >
            {/* Row 1: Date Presets & Reset Filters */}
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '12px',
              }}
            >
              <div style={{ display: 'inline-flex', flexWrap: 'wrap', alignItems: 'center', gap: '8px' }}>
                {[
                  { id: 'today', label: 'Today', count: sharedSummary?.todayEvents ?? userTodaySubmissionsCount },
                  { id: 'yesterday', label: 'Yesterday', count: sharedSummary?.yesterdayEvents ?? userYesterdaySubmissionsCount },
                  { id: 'last7days', label: 'Last 7 Days', count: null },
                  { id: 'all', label: 'All Recent', count: sharedSummary?.totalEvents ?? userSubmittedProfiles.length },
                  { id: 'custom', label: 'Custom Range', count: null },
                ].map((preset) => {
                  const isActive = subDateFilter === preset.id;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => {
                        setSubDateFilter(preset.id);
                        setSubmittedProfilesPage(1);
                      }}
                      style={{
                        height: '34px',
                        padding: '0 14px',
                        borderRadius: '10px',
                        fontSize: '12px',
                        fontWeight: isActive ? 700 : 600,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '8px',
                        whiteSpace: 'nowrap',
                        border: isActive ? '1.5px solid #2563eb' : '1.5px solid #e2e8f0',
                        background: isActive ? '#2563eb' : '#ffffff',
                        color: isActive ? '#ffffff' : '#334155',
                        boxShadow: isActive ? '0 2px 6px rgba(37,99,235,0.25)' : '0 1px 2px rgba(0,0,0,0.03)',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <span>{preset.label}</span>
                      {preset.count !== null && (
                        <span
                          style={{
                            padding: '1px 7px',
                            borderRadius: '9999px',
                            fontSize: '10.5px',
                            fontWeight: 800,
                            background: isActive ? 'rgba(29, 78, 216, 0.9)' : '#f1f5f9',
                            color: isActive ? '#ffffff' : '#475569',
                          }}
                        >
                          {preset.count}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {hasActiveSubmittedFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleResetSubmittedFilters}
                  className="h-8 px-2.5 text-xs font-semibold text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg flex items-center gap-1.5 transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Reset Filters</span>
                </Button>
              )}
            </div>

            {/* Custom Date Pickers Drawer */}
            {subDateFilter === 'custom' && (
              <div className="flex items-center flex-wrap gap-3 bg-white p-2.5 rounded-xl border border-blue-200 shadow-2xs">
                <span className="text-xs font-bold text-blue-700 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-blue-600" />
                  Custom Date Range:
                </span>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-semibold text-slate-500">From:</span>
                  <input
                    type="date"
                    value={subFromDate}
                    onChange={(e) => {
                      setSubFromDate(e.target.value);
                      setSubmittedProfilesPage(1);
                    }}
                    className="h-8 text-xs font-medium bg-slate-50/50 border border-slate-200 rounded-lg px-2.5 w-36 focus:outline-blue-500"
                  />
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-semibold text-slate-500">To:</span>
                  <input
                    type="date"
                    value={subToDate}
                    onChange={(e) => {
                      setSubToDate(e.target.value);
                      setSubmittedProfilesPage(1);
                    }}
                    className="h-8 text-xs font-medium bg-slate-50/50 border border-slate-200 rounded-lg px-2.5 w-36 focus:outline-blue-500"
                  />
                </div>
                {(subFromDate || subToDate) && (
                  <button
                    type="button"
                    onClick={() => {
                      setSubFromDate('');
                      setSubToDate('');
                      setSubmittedProfilesPage(1);
                    }}
                    className="text-xs text-rose-600 hover:text-rose-700 font-bold ml-1 cursor-pointer bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-200"
                  >
                    Clear Dates
                  </button>
                )}
              </div>
            )}

            {/* Row 2: Dropdowns on left, Search Box + Refresh on right */}
            <div className="pt-3.5 border-t border-slate-200/70 flex flex-col md:flex-row md:items-center justify-between gap-3">
              {/* Left: Dropdowns */}
              <div className="flex flex-wrap items-center gap-2.5">
                {/* Client Filter */}
                <select
                  value={subClientFilter}
                  onChange={(e) => {
                    setSubClientFilter(e.target.value);
                    setSubmittedProfilesPage(1);
                  }}
                  className="h-8 text-xs font-semibold rounded-xl border border-slate-200 shadow-2xs bg-white text-slate-700 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="ALL">All Clients ({clientOptions.length})</option>
                  {clientOptions.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>

                {/* Demand Filter - scoped to user's demands */}
                <select
                  value={subDemandFilter}
                  onChange={(e) => {
                    setSubDemandFilter(e.target.value);
                    setSubmittedProfilesPage(1);
                  }}
                  className="h-8 text-xs font-semibold rounded-xl border border-slate-200 shadow-2xs bg-white text-slate-700 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 max-w-[220px] truncate"
                >
                  <option value="ALL">All Demands ({scopedDemands.length})</option>
                  {scopedDemands.map((d) => (
                    <option key={d.demandid} value={d.demandid}>
                      #DM-{d.demandid} - {d.demandTitle}
                    </option>
                  ))}
                </select>

                {/* Status Filter */}
                <select
                  value={subStatusFilter}
                  onChange={(e) => {
                    setSubStatusFilter(e.target.value);
                    setSubmittedProfilesPage(1);
                  }}
                  className="h-8 text-xs font-semibold rounded-xl border border-slate-200 shadow-2xs bg-white text-slate-700 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="Submitted">Submitted</option>
                  <option value="Scheduled">Interview Scheduled</option>
                  <option value="Selected">Selected</option>
                  <option value="Allocated">Allocated</option>
                  <option value="Rejected">Rejected</option>
                </select>
              </div>

              {/* Right: Search Box & Refresh */}
              <div className="flex items-center gap-2.5 w-full md:w-auto">
                <div className="w-full sm:w-72 md:w-80">
                  <SearchFilter
                    value={subSearchInput}
                    onChange={(val) => setSubSearchInput(val)}
                    placeholder="Search candidate, email, demand, client..."
                  />
                </div>
                <button
                  type="button"
                  onClick={loadSubmittedProfiles}
                  disabled={submittedProfilesLoading}
                  title="Reload submitted profiles"
                  className="h-8 w-8 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 hover:text-blue-600 shadow-2xs flex items-center justify-center shrink-0 transition-colors"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${submittedProfilesLoading ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>
          </div>

          {/* Submitted Profiles Table */}
          {submittedProfilesLoading ? (
            <div className="py-20 flex flex-col items-center justify-center gap-3 bg-white rounded-2xl border border-slate-200/90 shadow-xs">
              <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
              <p className="text-sm font-semibold text-slate-700">Loading Submitted Profiles...</p>
            </div>
          ) : userSubmittedProfiles.length === 0 ? (
            <div className="py-16 text-center bg-white rounded-2xl border border-slate-200/90 shadow-xs p-6">
              <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-800">
                {subDateFilter === 'today'
                  ? 'No profile submissions for today'
                  : subDateFilter === 'yesterday'
                  ? 'No profile submissions for yesterday'
                  : 'No submitted profiles found'}
              </h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                {subDateFilter === 'today'
                  ? 'When resumes are shared to demands today, they will automatically appear here.'
                  : 'No profiles match your selected date range or filter criteria.'}
              </p>
              {hasActiveSubmittedFilters && (
                <button
                  type="button"
                  onClick={handleResetSubmittedFilters}
                  className="mt-4 px-4 py-2 text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-xl border border-blue-200 transition-all inline-flex items-center gap-1.5 shadow-xs"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Clear Filters</span>
                </button>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse min-w-[1150px]">
                  <thead>
                    <tr className="bg-slate-50/80 border-b border-slate-200/80 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                      <th className="py-3.5 px-4">Candidate / Employee</th>
                      <th className="py-3.5 px-3">Resource Type</th>
                      <th className="py-3.5 px-3.5">Demand</th>
                      <th className="py-3.5 px-3">Client</th>
                      <th className="py-3.5 px-3 whitespace-nowrap">Submitted At (IST)</th>
                      <th className="py-3.5 px-3">Submitted By</th>
                      <th className="py-3.5 px-3">Recruitment Status</th>
                      <th className="py-3.5 px-3 text-center">Interview Stage</th>
                      <th className="py-3.5 px-3 whitespace-nowrap">Last Update</th>
                      <th className="py-3.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {userSubmittedProfiles.map((p, idx) => {
                      const isInternal = p.resourceType === 'INTERNAL' || p.resourceType === 'EMPLOYEE';
                      const stableKey = p.requestId || `${p.demandId}_${p.resourceType}_${p.resourceId}_${p.submittedAt || idx}`;
                      const matchedDemand = demands.find(d => String(d.demandid) === String(p.demandId));

                      return (
                        <tr key={stableKey} className="hover:bg-slate-50/70 transition-colors">
                          {/* Candidate / Employee info */}
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-2.5">
                              <div
                                className="w-8 h-8 rounded-full flex items-center justify-center text-white font-extrabold text-xs shadow-xs shrink-0"
                                style={{
                                  background: isInternal
                                    ? 'linear-gradient(135deg, #6366f1, #8b5cf6)'
                                    : 'linear-gradient(135deg, #10b981, #059669)',
                                }}
                              >
                                {p.resourceName ? p.resourceName.charAt(0).toUpperCase() : 'R'}
                              </div>
                              <div className="min-w-0 max-w-[200px]">
                                <div className="font-bold text-slate-900 leading-snug truncate" title={p.resourceName}>
                                  {p.resourceName || 'Resource'}
                                </div>
                                {p.resourceEmail && (
                                  <div className="text-[11px] text-slate-500 truncate" title={p.resourceEmail}>{p.resourceEmail}</div>
                                )}
                                {p.designation && (
                                  <div className="text-[10px] text-slate-400 font-medium truncate" title={p.designation}>
                                    {p.designation} {p.experienceYears ? `• ${p.experienceYears}y` : ''}
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>

                          {/* Resource Type */}
                          <td className="py-3.5 px-3 whitespace-nowrap">
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10.5px] font-semibold border ${
                                isInternal
                                  ? 'bg-purple-50 text-purple-700 border-purple-200'
                                  : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              }`}
                            >
                              {isInternal ? 'Internal' : 'External'}
                            </span>
                          </td>

                          {/* Demand */}
                          <td className="py-3.5 px-3.5 max-w-[220px]">
                            <div
                              onClick={() => matchedDemand && handleOpenDemandDetails(matchedDemand)}
                              className={`font-semibold text-slate-900 leading-snug truncate ${
                                matchedDemand ? 'hover:text-blue-600 cursor-pointer' : ''
                              }`}
                              title={p.demandTitle || `Demand #${p.demandId}`}
                            >
                              {p.demandTitle || `Demand #${p.demandId}`}
                            </div>
                            <span className="inline-block text-[10.5px] font-bold text-blue-700 bg-blue-50 px-1.5 py-0.2 rounded border border-blue-100 mt-0.5">
                              #DM-{p.demandId}
                            </span>
                          </td>

                          {/* Client */}
                          <td className="py-3.5 px-3 whitespace-nowrap">
                            <div className="flex items-center gap-1.5 font-semibold text-slate-700">
                              <Building className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span className="truncate max-w-[120px]" title={p.clientName}>{p.clientName || '-'}</span>
                            </div>
                          </td>

                          {/* Submitted Date & Time (IST) */}
                          <td className="py-3.5 px-3 whitespace-nowrap text-slate-600 font-medium">
                            {formatISTDateTime(p.submittedAt || p.submittedDate)}
                          </td>

                          {/* Submitted By */}
                          <td className="py-3.5 px-3 max-w-[160px]">
                            <div className="font-semibold text-slate-800 truncate" title={p.submittedByName}>{p.submittedByName || 'HR Team'}</div>
                            {p.submittedByEmail && (
                              <div className="text-[10px] text-slate-400 truncate" title={p.submittedByEmail}>{p.submittedByEmail}</div>
                            )}
                          </td>

                          {/* Recruitment Status */}
                          <td className="py-3.5 px-3 whitespace-nowrap">
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                                (p.status || '').toLowerCase() === 'selected'
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                  : (p.status || '').toLowerCase() === 'submitted'
                                  ? 'bg-blue-50 text-blue-700 border-blue-200'
                                  : (p.status || '').toLowerCase().includes('sched')
                                  ? 'bg-amber-50 text-amber-700 border-amber-200'
                                  : (p.status || '').toLowerCase() === 'allocated'
                                  ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                                  : (p.status || '').toLowerCase() === 'rejected'
                                  ? 'bg-rose-50 text-rose-700 border-rose-200'
                                  : 'bg-blue-50 text-blue-700 border-blue-200'
                              }`}
                            >
                              {p.status || 'Submitted'}
                            </span>
                          </td>

                          {/* Interview Stage */}
                          <td className="py-3.5 px-3 text-center whitespace-nowrap">
                            <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[10.5px] font-bold">
                              {p.interviewStage || '-'}
                            </span>
                          </td>

                          {/* Last Update */}
                          <td className="py-3.5 px-3 whitespace-nowrap text-slate-500 font-medium">
                            {p.lastStatusUpdate ? formatISTDateTime(p.lastStatusUpdate) : formatISTDate(p.submittedDate)}
                          </td>

                          {/* Actions */}
                          <td className="py-3.5 px-4 text-right whitespace-nowrap">
                            <div className="inline-flex items-center justify-end gap-1.5">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={(e) =>
                                  handleOpenProfileHistory(
                                    {
                                      resourceId: p.resourceId,
                                      resourceType: p.resourceType,
                                      resourceName: p.resourceName,
                                      email: p.resourceEmail,
                                      status: p.status,
                                      sharedAt: p.submittedAt || p.submittedDate,
                                      sharedBy: p.submittedByName,
                                    },
                                    { demandid: p.demandId, demandTitle: p.demandTitle },
                                    e
                                  )
                                }
                                className="text-xs h-7 px-2.5 font-semibold text-blue-700 border-blue-200 hover:bg-blue-50 rounded-lg shadow-2xs"
                              >
                                <HistoryIcon className="w-3.5 h-3.5 mr-1 text-blue-600" />
                                <span>Timeline</span>
                              </Button>
                              {matchedDemand && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => handleOpenDemandDetails(matchedDemand, e)}
                                  className="text-xs h-7 px-2 text-slate-600 hover:text-blue-600 hover:bg-slate-100 rounded-lg"
                                  title="View Demand Details"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Submitted Profiles Pagination */}
              <div className="p-4 border-t border-slate-200 bg-slate-50/50">
                <Pagination
                  currentPage={submittedProfilesPage}
                  totalPages={Math.max(1, Math.ceil(userSubmittedProfiles.length / submittedProfilesPerPage))}
                  onPageChange={setSubmittedProfilesPage}
                  itemsPerPage={submittedProfilesPerPage}
                  onItemsPerPageChange={setSubmittedProfilesPerPage}
                  totalItems={userSubmittedProfiles.length}
                  label="submitted profiles"
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* TAB 3: PROFILE HISTORY (Dedicated Chronological Audit Trail)   */}
      {/* ══════════════════════════════════════════════════════════════ */}
      {activeMainTab === 'history' && (
        <div
          id="panel-profile-history"
          role="tabpanel"
          aria-labelledby="tab-profile-history"
          className="space-y-5 text-left rounded-2xl p-5 sm:p-6"
          style={{
            background: '#ffffff',
            border: '1.5px solid #e2e8f0',
            boxShadow: '0 8px 30px rgba(15, 23, 42, 0.08)',
          }}
        >
          {/* Demand & Profile Selector Card */}
          <div className="bg-slate-50/70 rounded-2xl border border-slate-200/80 shadow-xs p-5">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-xs shrink-0"
                  style={{
                    background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)',
                  }}
                >
                  <HistoryIcon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-extrabold text-slate-900 tracking-tight">Profile Recruitment History</h3>
                    <span className="inline-flex items-center gap-1 text-[11px] bg-slate-100 text-slate-700 font-semibold px-2 py-0.5 rounded-full border border-slate-200">
                      <Globe className="w-3 h-3 text-slate-500" />
                      Asia/Kolkata (IST)
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Chronological audit trail of genuine pipeline events & status transitions
                  </p>
                </div>
              </div>

              {/* Selector Controls */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto">
                {/* Demand Selector */}
                <div className="w-full sm:w-64">
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Select Demand:</label>
                  <select
                    value={historySelectedDemandId}
                    onChange={(e) => {
                      const dId = e.target.value;
                      setHistorySelectedDemandId(dId);
                      setHistorySelectedProfile(null);
                      setHistoryEvents([]);
                    }}
                    className="w-full h-10 bg-white border border-slate-200 text-slate-800 text-xs font-semibold rounded-xl px-3 shadow-xs focus:outline-none focus:ring-2 focus:ring-blue-500 truncate"
                  >
                    <option value="">-- Choose Demand ({demands.length}) --</option>
                    {demands.map((d) => (
                      <option key={d.demandid} value={d.demandid}>
                        #{d.demandid}: {d.demandTitle} ({d.accountName || d.companyName || 'Client'})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Profile Selector */}
                <div className="w-full sm:w-72">
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Select Submitted Profile:</label>
                  <select
                    disabled={!historySelectedDemandId || profilesForSelectedDemandTab3.length === 0}
                    value={historySelectedProfile?.resourceId || ''}
                    onChange={(e) => {
                      const resId = Number(e.target.value);
                      const found = profilesForSelectedDemandTab3.find(p => Number(p.resourceId) === resId);
                      setHistorySelectedProfile(found || null);
                      if (found && historySelectedDemandId) {
                        fetchHistoryForProfile(historySelectedDemandId, found.resourceType, found.resourceId);
                      }
                    }}
                    className="w-full h-10 bg-white border border-slate-200 text-slate-800 text-xs font-semibold rounded-xl px-3 shadow-xs focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-50 disabled:text-slate-400 truncate"
                  >
                    <option value="">
                      {!historySelectedDemandId
                        ? 'Select a demand first'
                        : profilesForSelectedDemandTab3.length === 0
                        ? 'No profiles submitted to this demand'
                        : `-- Choose Profile (${profilesForSelectedDemandTab3.length}) --`}
                    </option>
                    {profilesForSelectedDemandTab3.map((p, idx) => (
                      <option key={p.key || idx} value={p.resourceId}>
                        {p.resourceName} ({p.resourceType === 'INTERNAL' || p.resourceType === 'EMPLOYEE' ? 'Internal' : 'External'}) - {p.status || 'Submitted'}
                      </option>
                    ))}
                  </select>
                </div>

                {historySelectedProfile && (
                  <div className="self-end pb-0.5">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setHistorySelectedProfile(null);
                        setHistoryEvents([]);
                      }}
                      className="h-10 px-3 text-xs font-semibold text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl"
                    >
                      Clear
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Profile Details & Timeline */}
          {!historySelectedDemandId || !historySelectedProfile ? (
            <div className="py-16 text-center bg-white rounded-2xl border border-slate-200/90 shadow-xs p-6">
              <HistoryIcon className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-800">Select a Demand & Profile</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                Choose an active demand and submitted profile from the dropdowns above to inspect their genuine chronological audit history.
              </p>
            </div>
          ) : historyLoading ? (
            <div className="py-20 flex flex-col items-center justify-center gap-3 bg-white rounded-2xl border border-slate-200/90 shadow-xs">
              <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
              <p className="text-sm font-semibold text-slate-700">Loading profile event history...</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Profile Summary Card */}
              <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs text-left">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <div
                      style={{
                        width: '44px',
                        height: '44px',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '15px',
                        fontWeight: 700,
                        ...getAvatarStyle(historySelectedProfile.resourceName?.slice(0, 2)),
                      }}
                    >
                      {historySelectedProfile.resourceName?.slice(0, 2).toUpperCase() || 'R'}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-extrabold text-slate-900 text-base">{historySelectedProfile.resourceName}</h4>
                        <Badge
                          className={
                            historySelectedProfile.resourceType === 'INTERNAL' || historySelectedProfile.resourceType === 'EMPLOYEE'
                              ? 'bg-purple-100 text-purple-700 border-purple-200'
                              : 'bg-emerald-100 text-emerald-700 border-emerald-200'
                          }
                        >
                          {historySelectedProfile.resourceType === 'INTERNAL' || historySelectedProfile.resourceType === 'EMPLOYEE'
                            ? 'Internal Employee'
                            : 'Candidate'}
                        </Badge>
                      </div>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-1">
                        {historySelectedProfile.email && (
                          <span className="flex items-center gap-1">
                            <Mail className="w-3.5 h-3.5 text-slate-400" />
                            {historySelectedProfile.email}
                          </span>
                        )}
                        <span className="text-blue-700 font-semibold">
                          Demand #{historySelectedDemandId}:{' '}
                          {demands.find(d => String(d.demandid) === String(historySelectedDemandId))?.demandTitle}
                        </span>
                      </div>
                    </div>
                  </div>

                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200 shadow-2xs">
                    Current Status: {historySelectedProfile.status}
                  </span>
                </div>

                {/* Historical Events Count */}
                <div className="pt-3 flex items-center justify-between text-xs text-slate-500">
                  <span>Authoritative timeline records from recruitment pipeline</span>
                  <span className="font-bold text-slate-800">{processedTab3Events.length} genuine events recorded</span>
                </div>
              </div>

              {/* Chronological Timeline & Events */}
              <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs text-left">
                <h4 className="text-sm font-extrabold text-slate-900 mb-6 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-blue-600" />
                  <span>Chronological Event Timeline</span>
                </h4>

                {processedTab3Events.length === 0 ? (
                  <div className="text-center py-10 text-xs text-slate-400 bg-slate-50 rounded-xl border border-slate-200/70">
                    <HistoryIcon className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="font-semibold text-slate-700">No historical events recorded for this submission.</p>
                    <p className="text-slate-400 mt-0.5">When interview rounds or status changes are made, they will appear here in chronological order.</p>
                  </div>
                ) : (
                  <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                    {processedTab3Events.map((evt, eIdx) => {
                      const isSchedule = evt.eventType === 'INTERVIEW_SCHEDULED';
                      const isSelect = evt.eventType === 'SELECTED' || (evt.eventType === 'INTERVIEW_COMPLETED' && (evt.newStatus || '').toLowerCase().includes('select'));
                      const isReject = evt.eventType === 'REJECTED';
                      const isAlloc = evt.eventType === 'ALLOCATED';

                      let badgeColor = 'bg-blue-100 text-blue-800 border-blue-200';
                      let dotColor = 'bg-blue-600';
                      if (isSelect || isAlloc) {
                        badgeColor = 'bg-emerald-100 text-emerald-800 border-emerald-200';
                        dotColor = 'bg-emerald-600';
                      } else if (isReject) {
                        badgeColor = 'bg-rose-100 text-rose-800 border-rose-200';
                        dotColor = 'bg-rose-600';
                      } else if (isSchedule) {
                        badgeColor = 'bg-indigo-100 text-indigo-800 border-indigo-200';
                        dotColor = 'bg-indigo-600';
                      }

                      return (
                        <div key={eIdx} className="relative group text-left">
                          {/* Timeline node dot */}
                          <div
                            className={`absolute -left-[27px] top-1.5 w-3.5 h-3.5 rounded-full border-2 border-white shadow-xs ${dotColor}`}
                          />

                          <div className="bg-slate-50/80 rounded-xl border border-slate-200/80 p-4 hover:bg-slate-50 transition-colors">
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-2">
                              <div className="flex items-center gap-2">
                                <Badge className={`text-xs font-bold ${badgeColor}`}>
                                  {evt.eventType ? evt.eventType.replace(/_/g, ' ') : 'EVENT'}
                                </Badge>
                                <span className="font-bold text-slate-900 text-sm">
                                  {evt.newStatus || evt.eventType}
                                </span>
                              </div>
                              <span className="text-xs text-slate-500 font-medium whitespace-nowrap">
                                {formatISTDateTime(evt.timestamp)}
                              </span>
                            </div>

                            {/* Event details */}
                            <div className="text-xs text-slate-600 space-y-1.5 mt-2">
                              {evt.actionByName && (
                                <p className="font-semibold text-slate-700">
                                  Action by: <span className="text-slate-900">{evt.actionByName}</span>
                                  {evt.actionByEmail && (
                                    <span className="text-slate-400 font-normal ml-1">({evt.actionByEmail})</span>
                                  )}
                                </p>
                              )}
                              {evt.roundLevel && (
                                <p className="text-slate-700">
                                  Interview Round:{' '}
                                  <span className="font-bold text-indigo-700">{evt.roundLevel}</span>
                                </p>
                              )}
                              {evt.rating && (
                                <div className="flex items-center gap-1 text-amber-600 font-bold">
                                  <span>Rating:</span>
                                  <div className="flex items-center">
                                    {[...Array(5)].map((_, i) => (
                                      <Star
                                        key={i}
                                        className={`w-3.5 h-3.5 ${
                                          i < evt.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-300'
                                        }`}
                                      />
                                    ))}
                                    <span className="ml-1 text-slate-700 text-xs">({evt.rating}/5)</span>
                                  </div>
                                </div>
                              )}
                              {evt.remarks && (
                                <div className="mt-2 p-2.5 rounded-lg bg-white border border-slate-200 text-slate-700 text-xs">
                                  <span className="font-semibold text-slate-500 block mb-0.5">Notes / Feedback:</span>
                                  {evt.remarks}
                                </div>
                              )}
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
      )}

      {/* ── Demand Details View Modal ── */}
      <Dialog open={detailsModalOpen} onOpenChange={setDetailsModalOpen}>
        <DialogContent
          className="max-w-2xl flex flex-col !p-0 bg-white shadow-2xl rounded-2xl overflow-hidden"
          style={{
            position: 'fixed',
            top: 0,
            right: 0,
            bottom: 0,
            left: 0,
            margin: 'auto',
            maxWidth: '680px',
            width: '92vw',
            maxHeight: '82vh',
            height: 'fit-content',
            display: 'flex',
            flexDirection: 'column',
            padding: 0,
            background: '#ffffff',
            borderRadius: '16px',
            boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.25)',
            border: '1.5px solid #e2e8f0',
            overflow: 'hidden',
            transform: 'none',
            translate: 'none',
            zIndex: 9999,
          }}
        >
          {selectedDemandForDetails && (() => {
            const statusCfg = getDemandStatusConfig(selectedDemandForDetails.overallStatus);
            const priorityCfg = getPriorityConfig(selectedDemandForDetails.priority);
            const pStats = getDemandProfileStats(selectedDemandForDetails);

            return (
              <>
                {/* Modal Header */}
                <DialogHeader
                  className="p-5 sm:p-6 border-b border-slate-100"
                  style={{
                    background: 'linear-gradient(135deg, #f8faff 0%, #eef2ff 100%)',
                  }}
                >
                  <div className="flex items-start justify-between gap-3 text-left pr-8">
                    <div className="flex items-start gap-3.5">
                      <div
                        className="w-11 h-11 rounded-2xl flex items-center justify-center text-white shadow-md shrink-0 mt-0.5"
                        style={{
                          background: 'linear-gradient(135deg, #2563eb 0%, #4f46e5 100%)',
                          boxShadow: '0 4px 12px rgba(37, 99, 235, 0.35)',
                        }}
                      >
                        <Briefcase className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        {/* Badges Row */}
                        <div className="flex items-center gap-2 flex-wrap mb-1.5">
                          <span className="font-mono font-bold text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-md border border-blue-200">
                            #DM-{selectedDemandForDetails.demandid}
                          </span>
                          <span
                            className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border"
                            style={{
                              backgroundColor: statusCfg.bg,
                              color: statusCfg.color,
                              borderColor: statusCfg.border,
                            }}
                          >
                            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: statusCfg.dot }} />
                            {selectedDemandForDetails.overallStatus || 'Open'}
                          </span>
                          <span
                            className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold border"
                            style={{
                              backgroundColor: priorityCfg.bg,
                              color: priorityCfg.color,
                              borderColor: priorityCfg.border,
                            }}
                          >
                            {selectedDemandForDetails.priority || 'Medium'} Priority
                          </span>
                        </div>

                        {/* Title */}
                        <DialogTitle className="text-xl font-extrabold text-slate-900 tracking-tight leading-snug">
                          {selectedDemandForDetails.demandTitle}
                        </DialogTitle>

                        {/* Subtitle / Metadata */}
                        <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-500 font-medium flex-wrap">
                          <span className="flex items-center gap-1 text-slate-700 font-semibold">
                            <Building className="w-3.5 h-3.5 text-slate-400" />
                            {selectedDemandForDetails.accountName || selectedDemandForDetails.companyName || 'Client'}
                          </span>
                          {selectedDemandForDetails.departmentName && (
                            <>
                              <span className="text-slate-300">•</span>
                              <span>{selectedDemandForDetails.departmentName}</span>
                            </>
                          )}
                          <span className="text-slate-300">•</span>
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5 text-slate-400" />
                            Opened {formatISTDate(getDemandOpenDate(selectedDemandForDetails))}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </DialogHeader>

                {/* Modal Body */}
                <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4 text-xs text-left scrollbar-thin">
                  {/* Top 4 Quick KPI Metric Cards */}
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
                      gap: '12px',
                    }}
                  >
                    <div className="p-3 bg-blue-50/70 border border-blue-100 rounded-xl">
                      <div className="flex items-center gap-1.5 text-blue-600 mb-1">
                        <Target className="w-3.5 h-3.5" />
                        <span className="text-[10.5px] font-bold uppercase tracking-wider text-blue-700">Openings</span>
                      </div>
                      <div className="text-base font-black text-slate-900 leading-none">
                        {selectedDemandForDetails.resourceRequestsCount || 1} pos
                      </div>
                      <span className="text-[10px] text-slate-500 font-medium">Target positions</span>
                    </div>

                    <div className="p-3 bg-indigo-50/70 border border-indigo-100 rounded-xl">
                      <div className="flex items-center gap-1.5 text-indigo-600 mb-1">
                        <Users className="w-3.5 h-3.5" />
                        <span className="text-[10.5px] font-bold uppercase tracking-wider text-indigo-700">Submissions</span>
                      </div>
                      <div className="text-base font-black text-slate-900 leading-none">
                        {pStats.total} profiles
                      </div>
                      <span className="text-[10px] text-slate-500 font-medium">{pStats.cleared} selected</span>
                    </div>

                    <div className="p-3 bg-purple-50/70 border border-purple-100 rounded-xl">
                      <div className="flex items-center gap-1.5 text-purple-600 mb-1">
                        <Award className="w-3.5 h-3.5" />
                        <span className="text-[10.5px] font-bold uppercase tracking-wider text-purple-700">Experience</span>
                      </div>
                      <div className="text-base font-black text-slate-900 leading-none">
                        {selectedDemandForDetails.yearsofexp ? `${selectedDemandForDetails.yearsofexp} yrs` : 'Not specified'}
                      </div>
                      <span className="text-[10px] text-slate-500 font-medium">Minimum required</span>
                    </div>

                    <div className="p-3 bg-emerald-50/70 border border-emerald-100 rounded-xl">
                      <div className="flex items-center gap-1.5 text-emerald-600 mb-1">
                        <Clock className="w-3.5 h-3.5" />
                        <span className="text-[10.5px] font-bold uppercase tracking-wider text-emerald-700">Target Date</span>
                      </div>
                      <div className="text-xs font-black text-slate-900 leading-tight">
                        {formatISTDate(getDemandFulfilmentDate(selectedDemandForDetails)) || 'Not Set'}
                      </div>
                      <span className="text-[10px] text-slate-500 font-medium">Target fulfilment</span>
                    </div>
                  </div>

                  {/* Attributes Grid (2 balanced cards) */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    {/* Card 1: Account & Role Specs */}
                    <div className="p-4 bg-slate-50/80 rounded-xl border border-slate-200/80 space-y-2.5">
                      <h5 className="font-extrabold text-[11px] text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                        <Building className="w-3.5 h-3.5 text-blue-600" />
                        Client & Department Details
                      </h5>
                      <div className="space-y-2 pt-1 border-t border-slate-200/60 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500">Client Account:</span>
                          <span className="font-bold text-slate-800">
                            {selectedDemandForDetails.accountName || selectedDemandForDetails.companyName || '-'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500">Department:</span>
                          <span className="font-bold text-slate-800">{selectedDemandForDetails.departmentName || '-'}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500">Work Mode:</span>
                          <span className="font-bold text-slate-800">
                            {selectedDemandForDetails.workMode || 'FullTime'} ({selectedDemandForDetails.locationType || 'Hybrid'})
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500">Project:</span>
                          <span className="font-bold text-slate-800">{selectedDemandForDetails.projectName || 'Not Assigned'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Card 2: Ownership & Timeline */}
                    <div className="p-4 bg-slate-50/80 rounded-xl border border-slate-200/80 space-y-2.5">
                      <h5 className="font-extrabold text-[11px] text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-indigo-600" />
                        Ownership & Timeline
                      </h5>
                      <div className="space-y-2 pt-1 border-t border-slate-200/60 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500">Demand Owner:</span>
                          <span className="font-bold text-slate-800">{selectedDemandForDetails.requesterName || 'Admin'}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500">Created Date:</span>
                          <span className="font-bold text-slate-800">{formatISTDate(getDemandOpenDate(selectedDemandForDetails))}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500">Target Fulfilment:</span>
                          <span className="font-bold text-slate-800">{formatISTDate(getDemandFulfilmentDate(selectedDemandForDetails)) || 'Not Set'}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500">Budget / Rate:</span>
                          <span className="font-bold text-slate-800">
                            {selectedDemandForDetails.budget ? `$${selectedDemandForDetails.budget}` : 'Not Specified'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Skills Section */}
                  <div className="p-4 bg-white rounded-xl border border-slate-200/80 space-y-2">
                    <h5 className="font-extrabold text-[11px] text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                      Required Skills & Competencies
                    </h5>
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {Array.isArray(selectedDemandForDetails.skillName) && selectedDemandForDetails.skillName.length > 0 ? (
                        selectedDemandForDetails.skillName.map((sk, idx) => (
                          <span
                            key={idx}
                            className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 font-bold text-xs border border-blue-200 flex items-center gap-1"
                          >
                            <Check className="w-3 h-3 text-blue-500" />
                            {sk}
                          </span>
                        ))
                      ) : (
                        <span className="text-slate-400 italic">No specific skills listed for this demand.</span>
                      )}
                    </div>
                  </div>

                  {/* Description Section if available */}
                  {selectedDemandForDetails.description && (
                    <div className="p-4 bg-slate-50/70 rounded-xl border border-slate-200/80 space-y-1.5">
                      <h5 className="font-extrabold text-[11px] text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5 text-slate-400" />
                        Job Description / Notes
                      </h5>
                      <p className="text-slate-600 leading-relaxed text-xs pt-1">
                        {selectedDemandForDetails.description}
                      </p>
                    </div>
                  )}
                </div>

                {/* Modal Footer */}
                <DialogFooter className="p-4 sm:px-6 border-t border-slate-100 bg-slate-50/90 flex flex-row items-center justify-between gap-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setDetailsModalOpen(false)}
                    className="text-xs font-semibold px-4 rounded-xl border-slate-300 text-slate-700 hover:bg-slate-100"
                  >
                    Close
                  </Button>
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => {
                      setDetailsModalOpen(false);
                      toggleProfiles(selectedDemandForDetails.demandid);
                    }}
                    className="text-xs bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2 rounded-xl shadow-sm hover:shadow transition-all flex items-center gap-1.5"
                  >
                    <Users className="w-3.5 h-3.5 mr-0.5" />
                    <span>View Submitted Profiles ({pStats.total})</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Button>
                </DialogFooter>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* ── Profile History Dialog (Modal) ── */}
      <Dialog open={historyModalOpen} onOpenChange={setHistoryModalOpen}>
        <DialogContent
          className="max-w-2xl flex flex-col !p-0 bg-white shadow-2xl rounded-2xl overflow-hidden"
          style={{
            position: 'fixed',
            top: 0,
            right: 0,
            bottom: 0,
            left: 0,
            margin: 'auto',
            maxWidth: '640px',
            width: '92vw',
            maxHeight: '82vh',
            height: 'fit-content',
            display: 'flex',
            flexDirection: 'column',
            padding: 0,
            background: '#ffffff',
            borderRadius: '16px',
            boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.25)',
            border: '1.5px solid #e2e8f0',
            overflow: 'hidden',
            transform: 'none',
            translate: 'none',
            zIndex: 9999,
          }}
        >
          {activeHistoryProfile && (
            <>
              {/* Modal Header — Compact & Clear */}
              <DialogHeader
                style={{
                  padding: '12px 18px',
                  background: 'linear-gradient(135deg, #f8faff 0%, #eef2ff 100%)',
                  borderBottom: '1px solid #e2e8f0',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', textAlign: 'left', paddingRight: '28px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    {/* Compact Avatar */}
                    <div
                      style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '13px',
                        fontWeight: 800,
                        flexShrink: 0,
                        ...getAvatarStyle(activeHistoryProfile.resourceName?.slice(0, 2)),
                      }}
                    >
                      {activeHistoryProfile.resourceName?.slice(0, 2).toUpperCase() || 'R'}
                    </div>

                    <div>
                      <DialogTitle style={{ fontSize: '15px', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                        {activeHistoryProfile.resourceName}
                        <span
                          style={{
                            fontSize: '10px',
                            fontWeight: 700,
                            padding: '1px 7px',
                            borderRadius: '6px',
                            background:
                              activeHistoryProfile.resourceType === 'EMPLOYEE' || activeHistoryProfile.resourceType === 'INTERNAL'
                                ? '#dbeafe'
                                : '#f3e8ff',
                            color:
                              activeHistoryProfile.resourceType === 'EMPLOYEE' || activeHistoryProfile.resourceType === 'INTERNAL'
                                ? '#1e40af'
                                : '#7e22ce',
                            border: `1px solid ${
                              activeHistoryProfile.resourceType === 'EMPLOYEE' || activeHistoryProfile.resourceType === 'INTERNAL'
                                ? '#bfdbfe'
                                : '#e9d5ff'
                            }`,
                          }}
                        >
                          {activeHistoryProfile.resourceType === 'EMPLOYEE' || activeHistoryProfile.resourceType === 'INTERNAL'
                            ? 'Internal'
                            : 'Candidate'}
                        </span>
                      </DialogTitle>
                      <DialogDescription style={{ fontSize: '11px', color: '#64748b', margin: '2px 0 0 0', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        {activeHistoryProfile.email && (
                          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Mail className="w-3 h-3 text-slate-400" />
                            {activeHistoryProfile.email}
                          </span>
                        )}
                        {activeHistoryDemand && (
                          <span style={{ fontWeight: 700, color: '#1d4ed8', background: '#eff6ff', padding: '1px 6px', borderRadius: '4px' }}>
                            #DM-{activeHistoryDemand.demandid}: {activeHistoryDemand.demandTitle}
                          </span>
                        )}
                      </DialogDescription>
                    </div>
                  </div>

                  {/* Status badge */}
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      fontWeight: 700,
                      fontSize: '11px',
                      borderRadius: '9999px',
                      padding: '2px 10px',
                      background: '#ecfdf5',
                      color: '#065f46',
                      border: '1px solid #a7f3d0',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    <CheckCircle className="w-3 h-3 text-emerald-600" />
                    {activeHistoryProfile.status}
                  </span>
                </div>
              </DialogHeader>

              {/* Modal Body / Timeline with INVISIBLE Scrollbar */}
              <div
                className="timeline-scroll-container"
                style={{
                  flex: 1,
                  overflowY: 'auto',
                  padding: '14px 18px',
                  scrollbarWidth: 'none',
                  msOverflowStyle: 'none',
                  textAlign: 'left',
                }}
              >
                <style>{`
                  .timeline-scroll-container::-webkit-scrollbar {
                    display: none !important;
                    width: 0 !important;
                    height: 0 !important;
                  }
                `}</style>

                {modalHistoryLoading ? (
                  <div style={{ padding: '36px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#64748b' }}>
                    <RefreshCw className="w-5 h-5 text-blue-600 animate-spin" />
                    <span>Loading timeline history...</span>
                  </div>
                ) : processedModalEvents.length === 0 ? (
                  <div style={{ padding: '24px', textAlign: 'center', fontSize: '12px', color: '#64748b', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                    <HistoryIcon className="w-6 h-6 text-slate-300 mx-auto" style={{ marginBottom: '6px' }} />
                    <p style={{ fontWeight: 800, color: '#334155', margin: 0 }}>Submission Recorded</p>
                    <p style={{ color: '#94a3b8', margin: '4px 0 0 0', fontSize: '11px' }}>
                      Submitted on {formatISTDateTime(activeHistoryProfile.sharedAt)} by{' '}
                      {activeHistoryProfile.sharedBy || 'HR Team'}. No further interview rounds have occurred yet.
                    </p>
                  </div>
                ) : (
                  <div style={{ position: 'relative', paddingLeft: '20px' }}>
                    {/* Vertical timeline rule */}
                    <div
                      style={{
                        position: 'absolute',
                        left: '6px',
                        top: '8px',
                        bottom: '8px',
                        width: '2px',
                        background: '#dbeafe',
                      }}
                    />

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {processedModalEvents.map((evt, idx) => {
                        const isSubmit = evt.eventType === 'SUBMITTED';
                        const isSchedule = evt.eventType === 'INTERVIEW_SCHEDULED';
                        const isSelect = evt.eventType === 'SELECTED' || (evt.eventType === 'INTERVIEW_COMPLETED' && (evt.newStatus || '').toLowerCase().includes('select'));
                        const isReject = evt.eventType === 'REJECTED';
                        const isAlloc = evt.eventType === 'ALLOCATED';

                        const effectiveDate = evt.timestamp || activeHistoryProfile?.sharedAt;

                        let dotBg = '#2563eb';
                        let badgeBg = '#dbeafe';
                        let badgeColor = '#1e40af';
                        let badgeBorder = '#bfdbfe';

                        if (isSelect || isAlloc) {
                          dotBg = '#059669';
                          badgeBg = '#d1fae5';
                          badgeColor = '#065f46';
                          badgeBorder = '#a7f3d0';
                        } else if (isReject) {
                          dotBg = '#e11d48';
                          badgeBg = '#ffe4e6';
                          badgeColor = '#9f1239';
                          badgeBorder = '#fecdd3';
                        } else if (isSchedule) {
                          dotBg = '#4f46e5';
                          badgeBg = '#e0e7ff';
                          badgeColor = '#3730a3';
                          badgeBorder = '#c7d2fe';
                        }

                        return (
                          <div key={idx} style={{ position: 'relative' }}>
                            {/* Bullet dot */}
                            <div
                              style={{
                                position: 'absolute',
                                left: '-20px',
                                top: '10px',
                                width: '10px',
                                height: '10px',
                                borderRadius: '9999px',
                                border: '2px solid #ffffff',
                                boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                                backgroundColor: dotBg,
                              }}
                            />

                            {/* Compact Timeline Card — Reduced Height */}
                            <div
                              style={{
                                background: '#f8fafc',
                                borderRadius: '10px',
                                border: '1px solid #e2e8f0',
                                padding: '8px 12px',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '3px',
                                boxShadow: '0 1px 2px rgba(0, 0, 0, 0.03)',
                              }}
                            >
                              {/* Row 1: Event Badge + Status + Timestamp */}
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  <span
                                    style={{
                                      fontSize: '10px',
                                      fontWeight: 800,
                                      padding: '1px 6px',
                                      borderRadius: '4px',
                                      backgroundColor: badgeBg,
                                      color: badgeColor,
                                      border: `1px solid ${badgeBorder}`,
                                      whiteSpace: 'nowrap',
                                    }}
                                  >
                                    {evt.eventType.replace('_', ' ')}
                                  </span>
                                  <span style={{ fontWeight: 800, color: '#0f172a', fontSize: '12px' }}>
                                    {evt.newStatus || evt.eventType}
                                  </span>
                                </div>
                                <span style={{ fontSize: '10.5px', color: '#64748b', fontWeight: 500 }}>
                                  {formatISTDateTime(effectiveDate)}
                                </span>
                              </div>

                              {/* Row 2: Action by & Round info in one single line */}
                              {(evt.actionByName || evt.roundLevel || evt.rating) && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '11px', color: '#475569', flexWrap: 'wrap' }}>
                                  {evt.actionByName && (
                                    <span>
                                      Action by: <strong style={{ color: '#0f172a' }}>{evt.actionByName}</strong>
                                      {evt.actionByEmail && <span style={{ color: '#94a3b8', marginLeft: '4px' }}>({evt.actionByEmail})</span>}
                                    </span>
                                  )}
                                  {evt.roundLevel && (
                                    <span>
                                      Round: <strong style={{ color: '#4338ca' }}>{evt.roundLevel}</strong>
                                    </span>
                                  )}
                                  {evt.rating && (
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '2px', color: '#d97706', fontWeight: 700 }}>
                                      Rating: {evt.rating}/5
                                    </span>
                                  )}
                                </div>
                              )}

                              {/* Row 3: Notes (compact and slim) */}
                              {evt.remarks && (
                                <div
                                  style={{
                                    marginTop: '2px',
                                    padding: '4px 8px',
                                    background: '#ffffff',
                                    borderRadius: '6px',
                                    border: '1px solid #e2e8f0',
                                    fontSize: '11px',
                                    color: '#334155',
                                    lineHeight: '1.3',
                                  }}
                                >
                                  <span style={{ fontWeight: 700, color: '#64748b', marginRight: '6px' }}>Notes:</span>
                                  {evt.remarks}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Footer — Compact */}
              <DialogFooter
                style={{
                  padding: '8px 18px',
                  borderTop: '1px solid #e2e8f0',
                  background: '#f8fafc',
                  display: 'flex',
                  justifyContent: 'flex-end',
                }}
              >
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setHistoryModalOpen(false)}
                  style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    height: '32px',
                    padding: '0 14px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                  }}
                >
                  Close
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
