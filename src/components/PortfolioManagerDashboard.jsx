/* --------------------------------------------------------------- */
/* PortfolioManagerDashboard.jsx – FIXED + DEMAND + PAYLOAD NAMES   */
/* --------------------------------------------------------------- */
import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card.jsx";
import { Button } from "./ui/button.jsx";
import { Badge } from "./ui/badge.jsx";
import { Input } from "./ui/input.jsx";
import {
  Users,
  Activity,
  Clock,
  Target,
  BarChart3,
  Briefcase,
  CheckCircle,
  Calendar,
  Sparkles,
  AlertTriangle,
  FileText,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Mail,
  X,
  Send,
  ChevronDown,
  History,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { EmployeeService } from "../services/EmployeeManagementService.js";
import { SkillMatcherService } from "../services/AI/SkillMatcherService.js";
import { OpportunityService } from "../services/OpportunityService.js";
import { ResourceRequestService } from "../services/RequestResourceService.js";
import { DemandService } from "../services/DemandService.js";
import { ClientService } from "../services/clientListService.js";
import { CandidateService } from "../services/CandidateService.js";

import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "./ui/dialog.jsx";
import { Label } from "./ui/label.jsx";
import { Checkbox } from "./ui/checkbox.jsx";

/* ------------------------------------------------------------------ */
/* Helper */
/* ------------------------------------------------------------------ */
const getUnique = (items, keyFn) => {
  const set = new Set();
  items.forEach((i) => set.add(keyFn(i)));
  return set.size;
};
const getDaysPendingBadge = (days) => {
  if (!days) return <Badge variant="secondary">-</Badge>;
  if (days > 10) return <Badge variant="destructive">{days} days</Badge>;
  if (days > 5) return <Badge variant="secondary">{days} days</Badge>;
  return <Badge variant="default">{days} days</Badge>;
};

/* ------------------------------------------------------------------ */
/* Email Chip Input Component */
/* ------------------------------------------------------------------ */
const EmailChipInput = ({
  label,
  emails,
  setEmails,
  placeholder,
  autoFocus = false,
  rightLabelAction = null
}) => {
  const [inputValue, setInputValue] = useState('');
  const [error, setError] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef(null);

  const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleKeyDown = (e) => {
    if (['Enter', ',', ' '].includes(e.key)) {
      e.preventDefault();
      addEmail();
    } else if (e.key === 'Backspace' && !inputValue && emails.length > 0) {
      setEmails(emails.slice(0, -1));
      setError('');
    }
  };

  const addEmail = () => {
    const emailToAdd = inputValue.trim().replace(/,/g, '');
    if (emailToAdd) {
      if (isValidEmail(emailToAdd)) {
        if (!emails.includes(emailToAdd)) {
          setEmails([...emails, emailToAdd]);
          setInputValue('');
          setError('');
        } else {
          setError('Email already added');
        }
      } else {
        setError('Invalid email format');
      }
    }
  };

  const handleBlur = () => {
    setIsFocused(false);
    addEmail();
  };

  const removeEmail = (emailToRemove) => {
    setEmails(emails.filter(e => e !== emailToRemove));
  };

  return (
    <div className="group">
      <div className="flex justify-between items-end mb-1.5">
        <label className={`text-xs font-semibold uppercase tracking-wider transition-colors ${isFocused ? 'text-indigo-600' : 'text-gray-500'}`}>
          {label}
        </label>
        {rightLabelAction}
      </div>

      <div
        className={`min-h-[56px] p-2 rounded-xl border transition-all duration-200 bg-gray-50/50 flex flex-wrap items-center gap-2 cursor-text
          ${isFocused ? 'border-indigo-500 bg-white ring-4 ring-indigo-500/10 shadow-sm' : 'border-gray-200 hover:border-gray-300'}
          ${error ? 'border-red-300 bg-red-50/30' : ''}
        `}
        onClick={() => inputRef.current?.focus()}
      >
        {emails.map((email, index) => (
          <div key={index} className="bg-white border border-gray-200 text-gray-700 px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-2 shadow-sm animate-in fade-in zoom-in duration-200">
            <div className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-bold">
              {email[0].toUpperCase()}
            </div>
            <span>{email}</span>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); removeEmail(email); }}
              className="text-gray-400 hover:text-red-500 hover:bg-gray-100 rounded-full p-0.5 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}

        <input
          ref={inputRef}
          type="text"
          className="flex-1 min-w-[180px] bg-transparent outline-none text-gray-800 placeholder-gray-400 text-sm py-1 ml-1"
          placeholder={emails.length === 0 ? placeholder : ""}
          value={inputValue}
          onChange={(e) => { setInputValue(e.target.value); setError(''); }}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsFocused(true)}
          onBlur={handleBlur}
          autoFocus={autoFocus}
        />
      </div>

      {error && <p className="mt-1 text-xs text-red-500 font-medium animate-pulse">{error}</p>}
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* Custom Tooltips (payload names added) */
/* ------------------------------------------------------------------ */
const CustomInterviewTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  const data = payload[0].payload;
  if (label !== "Resume") {
    return (
      <div className="bg-white p-4 rounded-xl shadow-xl border border-blue-200">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="w-4 h-4 text-purple-500" />
          <h3 className="font-bold text-purple-800">{label}</h3>
        </div>
        {payload.filter((e) => e.value > 0).map((e, i) => (
          <p key={i} className="flex items-center gap-2 text-sm">
            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: e.color }} />
            <span className="font-semibold capitalize">{e.name}:</span>
            <span className="font-bold">{e.value}</span>
            {e.payload[`_${e.name.toLowerCase()}Names`] && (
              <span className="text-xs text-gray-500 ml-1">
                ({e.payload[`_${e.name.toLowerCase()}Names`].length} items)
              </span>
            )}
          </p>
        ))}

      </div>
    );
  }
  /* Resume tooltip */
  const sharedNames = data._sharedNames ?? [];
  const rejectedNames = data._rejectedNames ?? [];
  return (
    <div className="bg-white p-4 rounded-xl shadow-xl border border-blue-200">
      <div className="flex items-center gap-2 mb-2">
        <FileText className="w-4 h-4 text-indigo-600" />
        <h3 className="font-bold text-indigo-800">Resume Status</h3>
      </div>
      <p className="flex items-center gap-2 text-sm">
        <span className="w-3 h-3 rounded-full" style={{ backgroundColor: "#10b981" }} />
        <span className="font-semibold">Shared:</span>
        <span className="font-bold">{data.shared}</span>
      </p>
      <p className="flex items-center gap-2 text-sm">
        <span className="w-3 h-3 rounded-full" style={{ backgroundColor: "#ef4444" }} />
        <span className="font-semibold">Rejected:</span>
        <span className="font-bold">{data.rejected}</span>
      </p>

    </div>
  );
};

const CustomEmployeeTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;

    // For External Resources, only show Total
    if (label === "External Resources") {
      return (
        <div className="bg-white p-4 rounded-xl shadow-xl border border-blue-200">
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-4 h-4 text-teal-600" />
            <h3 className="font-bold text-teal-800">{label}</h3>
          </div>
          <div className="space-y-1 text-sm">
            <p className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full" style={{ backgroundColor: "#6366f1" }}></span>
              <span className="font-semibold">Total:</span>
              <span className="font-bold text-xl">{data.Total || data.count}</span>
            </p>
          </div>
        </div>
      );
    }

    // Original tooltip for Employees
    return (
      <div className="bg-white p-4 rounded-xl shadow-xl border border-blue-200">
        <div className="flex items-center gap-2 mb-2">
          <Users className="w-4 h-4 text-teal-600" />
          <h3 className="font-bold text-teal-800">
            {label} – {payload[0].name}
          </h3>
        </div>
        <div className="space-y-1 text-sm">
          {payload.map((e, i) => (
            <p key={i} className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full" style={{ backgroundColor: e.color }}></span>
              <span className="font-semibold">{e.name}:</span>
              <span className="font-bold text-xl">{e.value}</span>
            </p>
          ))}
        </div>
      </div>
    );
  }
  return null;
};
const CustomProjectClientTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const names = data._names || [];

    if (label === "Resource Type") {
      return (
        <div className="bg-white p-4 rounded-xl shadow-xl border border-blue-200">
          <div className="flex items-center gap-2 mb-2">
            <Briefcase className="w-4 h-4 text-indigo-600" />
            <h3 className="font-bold text-indigo-800">{label}</h3>
          </div>
          <p className="flex items-center gap-2 text-sm">
            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: payload[0].color }} />
            <span className="font-semibold">Total Resources:</span>
            <span className="font-bold">{data.count}</span>
          </p>
          <p className="flex items-center gap-2 text-sm">
            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: '#3b82f6' }} />
            <span className="font-semibold">Internal:</span>
            <span className="font-bold">{data.internal || 0}</span>
          </p>
          <p className="flex items-center gap-2 text-sm">
            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: '#8b5cf6' }} />
            <span className="font-semibold">External:</span>
            <span className="font-bold">{data.external || 0}</span>
          </p>
        </div>
      );
    }
    return (
      <div className="bg-white p-4 rounded-xl shadow-xl border border-blue-200">
        <div className="flex items-center gap-2 mb-2">
          <Briefcase className="w-4 h-4 text-indigo-600" />
          <h3 className="font-bold text-indigo-800">{label}</h3>
        </div>
        <p className="flex items-center gap-2 text-sm">
          <span className="w-3 h-3 rounded-full" style={{ backgroundColor: payload[0].color }} />
          <span className="font-semibold">Count:</span>
          <span className="font-bold">{data.count}</span>
        </p>
        {names.length > 0 && (
          <>
            <hr className="my-2 border-gray-300" />
            <p className="font-medium text-xs text-gray-600">
              {label === "Projects" ? "Project Names:" :
                label === "Clients" ? "Client Names:" :
                  label === "Today Allocated" ? "Employees:" :
                    label.includes("Opportunity") ? "Opportunities:" :
                      label.includes("Demand") ? "Demands:" :
                        "Names:"}
            </p>
            {names.slice(0, 5).map((n, i) => (
              <p key={i} className="text-xs text-gray-700 ml-2">• {n}</p>
            ))}
            {names.length > 5 && (
              <p className="text-xs text-gray-500 ml-2">+{names.length - 5} more</p>
            )}
          </>
        )}
      </div>
    );
  }
  return null;
};


const CustomDemandTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  const data = payload[0].payload;

  if (label === "Resource Type") {
    return (
      <div className="bg-white p-4 rounded-xl shadow-xl border border-blue-200">
        <div className="flex items-center gap-2 mb-2">
          <Target className="w-4 h-4 text-red-600" />
          <h3 className="font-bold text-red-800">{label}</h3>
        </div>
        <p className="flex items-center gap-2 text-sm">
          <span className="w-3 h-3 rounded-full" style={{ backgroundColor: payload[0].color }} />
          <span className="font-semibold">Total Resources:</span>
          <span className="font-bold">{data.count}</span>
        </p>
        <p className="flex items-center gap-2 text-sm">
          <span className="w-3 h-3 rounded-full" style={{ backgroundColor: '#3b82f6' }} />
          <span className="font-semibold">Internal:</span>
          <span className="font-bold">{data.internal || 0}</span>
        </p>
        <p className="flex items-center gap-2 text-sm">
          <span className="w-3 h-3 rounded-full" style={{ backgroundColor: '#8b5cf6' }} />
          <span className="font-semibold">External:</span>
          <span className="font-bold">{data.external || 0}</span>
        </p>
      </div>
    );
  }
  return (
    <div className="bg-white p-4 rounded-xl shadow-xl border border-blue-200">
      <div className="flex items-center gap-2 mb-2">
        <Target className="w-4 h-4 text-red-600" />
        <h3 className="font-bold text-red-800">{label}</h3>
      </div>
      <p className="flex items-center gap-2 text-sm">
        <span className="w-3 h-3 rounded-full" style={{ backgroundColor: payload[0].color }} />
        <span className="font-semibold">Count:</span>
        <span className="font-bold">{data.count}</span>
      </p>
      {data._names?.length > 0 && (
        <>
          <hr className="my-2 border-gray-300" />
          <p className="font-medium text-xs text-gray-600">Demands:</p>
          {data._names.slice(0, 5).map((n, i) => (
            <p key={i} className="text-xs text-gray-700 ml-2">• {n}</p>
          ))}
          {data._names.length > 5 && (
            <p className="text-xs text-gray-500 ml-2">+{data._names.length - 5} more</p>
          )}
        </>
      )}
    </div>
  );
};


const CustomOverallStatusTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  const data = payload[0].payload;
  return (
    <div className="bg-white p-4 rounded-xl shadow-xl border border-blue-200">
      <div className="flex items-center gap-2 mb-2">
        <Activity className="w-4 h-4 text-purple-600" />
        <h3 className="font-bold text-purple-800">{label}</h3>
      </div>
      <p className="flex items-center gap-2 text-sm">
        <span className="w-3 h-3 rounded-full" style={{ backgroundColor: payload[0].color }} />
        <span className="font-semibold">Count:</span>
        <span className="font-bold">{data.count}</span>
      </p>
      {data._names?.length > 0 && (
        <>
          <hr className="my-2 border-gray-300" />
          <p className="font-medium text-xs text-gray-600">Demands:</p>
          {data._names.slice(0, 5).map((n, i) => (
            <p key={i} className="text-xs text-gray-700 ml-2">• {n}</p>
          ))}
          {data._names.length > 5 && (
            <p className="text-xs text-gray-500 ml-2">+{data._names.length - 5} more</p>
          )}
        </>
      )}
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* Main Component */
/* ------------------------------------------------------------------ */
const PortfolioManagerDashboard = ({ setCurrentPage, currentUser }) => {
  /* ---------- STATE ---------- */
  const [rawItems, setRawItems] = useState([]);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isTodayFilter, setIsTodayFilter] = useState(false);
  const [loading, setLoading] = useState(false);
  const [expandedEmployee, setExpandedEmployee] = useState(null);
  const [isSkillMatcherModalOpen, setIsSkillMatcherModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState("");
  const [modalData, setModalData] = useState([]);
  const [modalMode, setModalMode] = useState("employee");
  const [currentTableFilter, setCurrentTableFilter] = useState(null);
  const [isGroupIdDialogOpen, setIsGroupIdDialogOpen] = useState(false);
  const [selectedGroupIds, setSelectedGroupIds] = useState([]);
  const [groups, setGroups] = useState([]);
  const [isOpportunityModalOpen, setIsOpportunityModalOpen] = useState(false);
  const [opportunityRequests, setOpportunityRequests] = useState([]);
  const [opportunityType, setOpportunityType] = useState("");
  const [activeTab, setActiveTab] = useState("employees");
  const [filterType, setFilterType] = useState("");
  const [selectedClient, setSelectedClient] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedOpportunity, setExpandedOpportunity] = useState(null);
  const [expandedDemand, setExpandedDemand] = useState(null);
  const [apiGroups, setApiGroups] = useState([]);
  const [allApiGroups, setAllApiGroups] = useState([]);
  const [apiLoading, setApiLoading] = useState(false);
  const [apiError, setApiError] = useState(null);
  const [demandList, setDemandList] = useState([]);
  const [demandLoading, setDemandLoading] = useState(false);
  const [clients, setClients] = useState(["All"]); // Initialize with "All"
  const [clientsLoading, setClientsLoading] = useState(false);
  const [clientObjects, setClientObjects] = useState([]); // Store full client objects

  /* ---------- EMAIL MODAL STATE ---------- */
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [toEmail, setToEmails] = useState([]);
  const [ccEmail, setCcEmails] = useState([]);
  const [showCc, setShowCc] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  /* ---------- PAGINATION STATE ---------- */
  const [currentEmployeePage, setCurrentEmployeePage] = useState(1);
  const [currentOpportunityPage, setCurrentOpportunityPage] = useState(1);
  const [currentDemandPage, setCurrentDemandPage] = useState(1);
  const [employeeItemsPerPage, setEmployeeItemsPerPage] = useState(10);
  const [opportunityItemsPerPage, setOpportunityItemsPerPage] = useState(10);
  const [demandItemsPerPage, setDemandItemsPerPage] = useState(10);

  /* ---------- NEW STATE FOR RESOURCE VIEW ---------- */
  const [resourceView, setResourceView] = useState("internal"); // 'internal' or 'external'
  const [externalResources, setExternalResources] = useState([]);
  const [externalLoading, setExternalLoading] = useState(false);
  const [externalItemsPerPage, setExternalItemsPerPage] = useState(10);
  const [currentExternalPage, setCurrentExternalPage] = useState(1);


  /* ---------- INTERVIEW PAGINATION STATE ---------- */
  const [opportunityInterviewPages, setOpportunityInterviewPages] = useState({});
  const [demandInterviewPages, setDemandInterviewPages] = useState({});
  const [interviewsPerPage] = useState(5); // Fixed to 5 per page
  const tableRef = useRef(null);

  /* ---------- DYNAMIC USER ID ---------- */
  const getUserId = () => {
    if (currentUser?.id) return currentUser.id;
    const storedUser = localStorage.getItem('userId') || sessionStorage.getItem('userId');
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        return user.id || user.userId;
      } catch (e) {
        console.error('Error parsing stored user:', e);
      }
    }
    return null;
  };

  /* ---------- GET ACCOUNT ID ---------- */
  const getAccountId = () => {
    if (selectedClient === "All") return null;
    const client = clientObjects.find(c => c.accountName === selectedClient);
    return client?.accountId || null;
  };

  
  const handleExportDemand = async () => {
    setLoading(true);
    try {
      
      const payload = {
        userId: localStorage.getItem('userId') || getUserId(),
        fromDate: startDate || null,
        toDate: endDate || null,
        accountId: getAccountId()
      };

      console.log("Exporting demand report with payload:", payload);

      const response = await DemandService.exportDemandReport(payload);
      const blob = new Blob([response.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });

      // Create a download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;

      // Create filename with date range
      const fromStr = startDate ? startDate.replace(/-/g, '') : 'all';
      const toStr = endDate ? endDate.replace(/-/g, '') : 'all';
      const clientStr = selectedClient !== "All" ? `_${selectedClient.replace(/\s+/g, '_')}` : '';

      link.download = `demand_report_${fromStr}_to_${toStr}${clientStr}.xlsx`;

      document.body.appendChild(link);
      link.click();

      // Clean up
      window.URL.revokeObjectURL(url);
      document.body.removeChild(link);

      toast.success("Demand report exported successfully!");

    } catch (error) {
      console.error("Error exporting demand report:", error);
      toast.error("Failed to export demand report");
    } finally {
      setLoading(false);
    }
  };

  /* ---------- SCROLL ---------- */
  const scrollToTable = useCallback(() => {
    tableRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);
  const handleFilter = useCallback(
    (filter) => {
      setCurrentTableFilter(filter);
      // Reset to first page when filter changes
      if (activeTab === "employees") {
        if (resourceView === "internal") setCurrentEmployeePage(1);
        else setCurrentExternalPage(1);
      }
      if (activeTab === "opportunity") setCurrentOpportunityPage(1);
      if (activeTab === "demand") setCurrentDemandPage(1);
      requestAnimationFrame(() => requestAnimationFrame(scrollToTable));
    },
    [scrollToTable, activeTab, resourceView]
  );

  /* ---------- TODAY FILTER ---------- */
  const handleTodayFilter = () => {
    const today = new Date().toISOString().split("T")[0];
    setStartDate(today);
    setEndDate(today);
    setIsTodayFilter(true);
  };
  const clearTodayFilter = () => {
    setStartDate("");
    setEndDate("");
    setIsTodayFilter(false);
  };

  /* ---------- AI GROUP MATCHER ---------- */
  const handleGroupSkillMatcher = async (groupIds) => {
    if (!groupIds?.length) {
      toast.error("No group selected");
      return;
    }
    setLoading(true);
    try {
      const result = await SkillMatcherService.fetchGroupMatches(groupIds);
      setModalData(result);
      setModalTitle(`AI Matches for Groups: ${groupIds.join(", ")}`);
      setModalMode("group");
      setIsSkillMatcherModalOpen(true);
    } catch (e) {
      toast.error(e.message || "Failed to fetch group matches");
    } finally {
      setLoading(false);
    }
  };

  /* ---------- GENERATE FUNCTION FOR DEMAND REPORT ---------- */
  const handleGenerateDemandReport = async (emailData = { toEmail: [], ccEmail: [] }) => {
    setLoading(true);
    try {
      // Prepare payload with dynamic userId and accountId
      const payload = {
        userId: localStorage.getItem('userId') || getUserId(),
        fromDate: startDate || null,
        toDate: endDate || null,
        accountId: getAccountId(),
        ...emailData  
      };

      console.log("Generating report with payload:", payload);

      const result = await DemandService.generateEmailReport(payload);

      if (result.success) {
        toast.success("Demand report generated and sent successfully!");
      } else {
        toast.error(result.message || "Failed to generate report");
      }
    } catch (error) {
      console.error("Error generating demand report:", error);
      toast.error("Failed to generate demand report");
    } finally {
      setLoading(false);
    }
  };

  /* ---------- EMAIL MODAL HANDLERS ---------- */
  const handleOpenEmailModal = () => {
    setIsEmailModalOpen(true);
    setToEmails([]);
    setCcEmails([]);
    setShowCc(false);
  };

  const handleSendEmail = async () => {
    if (toEmail.length === 0) {
      toast.error("Please add at least one recipient");
      return;
    }

    setIsSending(true);

    try {
      await handleGenerateDemandReport({ toEmail, ccEmail });

      setIsEmailModalOpen(false);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (error) {
      console.error("Error sending email:", error);
      toast.error("Failed to send email");
    } finally {
      setIsSending(false);
    }
  };

  /* ---------- OPPORTUNITY MODAL ---------- */
  const openOpportunityModal = (type) => {
    let requests = [];
    if (type === "Pending") {
      allApiGroups
        .filter((g) => g.groupInfo.status === "Draft")
        .forEach((g) => {
          if (g.childRequestDetails && g.childRequestDetails.length > 0) {
            g.childRequestDetails.forEach((r) => {
              requests.push({
                groupId: g.groupInfo.groupId,
                requestId: r.requestId,
                projectName: g.contextInfo.projectName,
                accountName: g.contextInfo.accountName,
                submittedDate: g.groupInfo.createdAt.split("T")[0],
                daysPending: g.statusSummary?.pendingDays ?? 0,
                skills: r.requiredSkills ?? [],
              });
            });
          } else {
            requests.push({
              groupId: g.groupInfo.groupId,
              requestId: null,
              projectName: g.contextInfo.projectName,
              accountName: g.contextInfo.accountName,
              submittedDate: g.groupInfo.createdAt.split("T")[0],
              daysPending: g.statusSummary?.pendingDays ?? 0,
              skills: [],
            });
          }
        });
    } else {
      allApiGroups
        .filter((g) => g.groupInfo.status === "HRApproved")
        .forEach((g) => {
          g.childRequestDetails.forEach((r) => {
            requests.push({
              groupId: g.groupInfo.groupId,
              requestId: r.requestId,
              projectName: g.contextInfo.projectName,
              accountName: g.contextInfo.accountName,
              submittedDate: g.groupInfo.createdAt.split("T")[0],
              skills: r.requiredSkills ?? [],
            });
          });
        });
    }
    setOpportunityType(type);
    setOpportunityRequests(requests);
    setIsOpportunityModalOpen(true);
  };

  /* ---------- EFFECTS ---------- */
  useEffect(() => {
    if (currentTableFilter !== undefined) {
      requestAnimationFrame(() => requestAnimationFrame(scrollToTable));
    }
  }, [currentTableFilter, scrollToTable]);

  
  useEffect(() => {
    const fetchClients = async () => {
      setClientsLoading(true);
      try {
        const clientList = await ClientService.fetchClientList();
        if (Array.isArray(clientList)) {
          const clientNames = clientList.map(client => client.accountName).filter(Boolean);
          setClients(["All", ...clientNames]);
          setClientObjects(clientList);
        } else {
          toast.error("Failed to load clients");
        }
      } catch (error) {
        console.error("Error fetching clients:", error);
        toast.error("Failed to load clients");
      } finally {
        setClientsLoading(false);
      }
    };
    fetchClients();
  }, []);

  
  useEffect(() => {
    if (isGroupIdDialogOpen) {
      setSelectedGroupIds([]);
      setGroups([]);
      ResourceRequestService.fetchResourceRequestGroups()
        .then((resp) => {
          if (resp.data?.success && Array.isArray(resp.data.result)) {
            setGroups(resp.data.result);
          } else {
            setGroups([]);
            toast.error("No groups found");
          }
        })
        .catch((e) => {
          console.error(e);
          toast.error("Failed to load groups");
          setGroups([]);
        });
    }
  }, [isGroupIdDialogOpen]);

  // 1. EMPLOYEES
  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        const resp = await EmployeeService.fetchEmployeeFlows(0, 10000);
        if (resp.data?.success && Array.isArray(resp.data.result?.items)) {
          setRawItems(resp.data.result.items);
        } else {
          setRawItems([]);
        }
        setLastUpdated(new Date());
      } catch (e) {
        console.error(e);
        setRawItems([]);
        toast.error("Failed to load data");
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  // 2. OPPORTUNITY – UNFILTERED (KPIs)
  useEffect(() => {
    if (activeTab !== "opportunity") return;
    const fetchAll = async () => {
      try {
        const resp = await OpportunityService.fetchGroupFlowList(1, null, null);
        if (resp.data?.success && Array.isArray(resp.data.result)) {
          setAllApiGroups(resp.data.result);
        } else {
          setAllApiGroups([]);
        }
      } catch (e) {
        console.error(e);
        setAllApiGroups([]);
      }
    };
    fetchAll();
  }, [activeTab]);

  // 3. OPPORTUNITY – FILTERED (charts / tables)
  useEffect(() => {
    if (activeTab !== "opportunity") return;
    const fetch = async () => {
      setApiLoading(true);
      setApiError(null);
      try {
        const resp = await OpportunityService.fetchGroupFlowList(
          1,
          startDate || null,
          endDate || null
        );
        if (resp.data?.success && Array.isArray(resp.data.result)) {
          setApiGroups(resp.data.result);
        } else {
          setApiGroups([]);
        }
      } catch (e) {
        console.error(e);
        setApiError("Failed to load opportunities.");
        toast.error("Failed to load opportunities");
      } finally {
        setApiLoading(false);
      }
    };
    fetch();
  }, [activeTab, startDate, endDate]);

  // 4. DEMAND – BOTH FILTERED & UNFILTERED (same call)
  useEffect(() => {
    if (activeTab !== "demand") return;
    const fetch = async () => {
      setDemandLoading(true);
      try {
        const resp = await DemandService.fetchDemandFlowList(
          startDate || null,
          endDate || null
        );
        if (Array.isArray(resp)) {
          setDemandList(resp);
        } else {
          setDemandList([]);
        }
      } catch (e) {
        console.error(e);
        toast.error("Failed to load demands");
        setDemandList([]);
      } finally {
        setDemandLoading(false);
      }
    };
    fetch();
  }, [activeTab, startDate, endDate]);

  // 5. EXTERNAL RESOURCES
  useEffect(() => {
    const fetchExternalResources = async () => {
      if (activeTab === "employees") {
        setExternalLoading(true);
        try {
          const resp = await CandidateService.fetchCandidateFlows(0, 300);
          console.log("External Resources API Response:", resp);
          if (resp.data?.success && Array.isArray(resp.data.result?.items)) {
            setExternalResources(resp.data.result.items);
            console.log("External Resources Count:", resp.data.result.items.length);
          } else {
            console.log("No external resources data found");
            setExternalResources([]);
          }
        } catch (e) {
          console.error("Error fetching external resources:", e);
          setExternalResources([]);
          toast.error("Failed to load external resources");
        } finally {
          setExternalLoading(false);
        }
      }
    };
    fetchExternalResources();
  }, [activeTab]);

  /* ------------------------------------------------------------------ */
  /*  MEMO – OPPORTUNITY (UNFILTERED) – KPI ONLY                         */
  /* ------------------------------------------------------------------ */
  const unfilteredOpportunities = useMemo(() => {
    return allApiGroups.map((group) => {
      const status = group.groupInfo.status === "Draft" ? "Pending" : "Approved";
      const submittedDate = group.groupInfo.createdAt.split("T")[0];
      let scheduled = 0,
        cleared = 0,
        rejected = 0,
        assigned = 0;
      group.childRequestDetails.forEach((req) => {
        req.pipeline.forEach((inter) => {
          scheduled++;
          const levels = inter.interviewLevels;
          if (levels.length > 0) {
            const last = levels[levels.length - 1];
            if (last.status === "Rejected") rejected++;
            else if (last.status === "Selected" || last.level === "ONBOARDING") {
              inter.allocation ? assigned++ : cleared++;
            }
          }
        });
      });
      return {
        id: group.groupInfo.groupId,
        name: group.groupInfo.title,
        project: group.contextInfo.projectName,
        client: group.contextInfo.accountName,
        status,
        submittedDate,
        resourcesRequested: group.groupInfo.totalRequested,
        scheduledInterviews: scheduled,
        cleared,
        rejected,
        assigned,
        pendingDays: group.statusSummary?.pendingDays ?? 0,
      };
    });
  }, [allApiGroups]);

  const totalOpps = useMemo(() => unfilteredOpportunities.length, [unfilteredOpportunities]);
  const totalApproved = useMemo(
    () => unfilteredOpportunities.filter((o) => o.status === "Approved").length,
    [unfilteredOpportunities]
  );
  const totalPending = useMemo(
    () => unfilteredOpportunities.filter((o) => o.status === "Pending").length,
    [unfilteredOpportunities]
  );
  const totalResources = useMemo(
    () => unfilteredOpportunities.reduce((s, o) => s + o.resourcesRequested, 0),
    [unfilteredOpportunities]
  );

  /* ------------------------------------------------------------------ */
  /*  MEMO – OPPORTUNITY (FILTERED) – CHARTS & TABLES                    */
  /* ------------------------------------------------------------------ */
  const opportunities = useMemo(() => {
    let allInterviews = []; 

    return apiGroups.map((group) => {
      const status = group.groupInfo.status === "Draft" ? "Pending" : "Approved";
      const submittedDate = group.groupInfo.createdAt.split("T")[0];
      let scheduled = 0,
        cleared = 0,
        rejected = 0,
        assigned = 0;
      let internalCount = 0;
      let externalCount = 0;
      allInterviews = []; 

      group.childRequestDetails.forEach((req) => {
        req.pipeline.forEach((inter) => {
          scheduled++;

         
          const candidateInfo = inter.candidateInfo || {};
          const resourceType = candidateInfo.resourceType;

          if (resourceType === 'EMPLOYEE') {
            internalCount++;
          } else if (resourceType === 'CANDIDATE') {
            externalCount++;
          } else {
           
            if (candidateInfo.employeeId) {
              internalCount++;
            } else if (candidateInfo.candidateId) {
              externalCount++;
            }
          }

          const levels = inter.interviewLevels;
          if (levels.length > 0) {
            const last = levels[levels.length - 1];
            if (last.status === "Rejected") rejected++;
            else if (last.status === "Selected" || last.level === "ONBOARDING") {
              inter.allocation ? assigned++ : cleared++;
            }
          }

          allInterviews.push({
            candidateInfo: inter.candidateInfo || {},
            interviewLevels: inter.interviewLevels || [],
            interviewOverallStatus: inter.interviewOverallStatus || inter.status || 'N/A',
            allocation: inter.allocation || null,
            interviewId: inter.interviewId
          });
        });
      });

      return {
        id: group.groupInfo.groupId,
        name: group.groupInfo.title,
        project: group.contextInfo.projectName,
        client: group.contextInfo.accountName,
        status,
        submittedDate,
        resourcesRequested: group.groupInfo.totalRequested,
        scheduledInterviews: scheduled,
        cleared,
        rejected,
        assigned,
        pendingDays: group.statusSummary?.pendingDays ?? 0,
        allInterviews, 
        internalResources: internalCount,
        externalResources: externalCount,
        totalResources: internalCount + externalCount,
      };
    });
  }, [apiGroups]);

  
  /* ------------------------------------------------------------------ */
  /*  MEMO – DEMAND (REAL BACKEND FIELDS)                               */
  /* ------------------------------------------------------------------ */
  const demands = useMemo(() => {
    if (!Array.isArray(demandList) || demandList.length === 0) return [];
    return demandList.map((d) => {
      const sc = d.statusSummary ?? {};
      const totalRequests = sc.totalRequests ?? 0;
      const allocated = sc.allocated ?? 0;
      const onboarded = sc.onboarded ?? 0;

      const scheduledInterviews = d.childRequestDetails?.reduce((total, req) => {
        return total + (req.pipeline?.filter(inter =>
          inter.interviewOverallStatus === "Scheduled"
        ).length || 0);
      }, 0) || 0;

      
      let internalCount = 0;
      let externalCount = 0;

      d.childRequestDetails?.forEach(req => {
        req.pipeline?.forEach(interview => {
          const candidateInfo = interview.candidateInfo || {};
          const resourceType = candidateInfo.resourceType;

          if (resourceType === 'EMPLOYEE') {
            internalCount++;
          } else if (resourceType === 'CANDIDATE') {
            externalCount++;
          } else {
            // If resourceType is not specified, check if it has employeeId
            if (candidateInfo.employeeId) {
              internalCount++;
            } else if (candidateInfo.candidateId) {
              externalCount++;
            }
          }
        });
      });

      let actualFulfilmentDt = "Not Fulfilled";

      if (allocated > 0) {
        actualFulfilmentDt = d.demandInfo?.actualFulfilmentDt;

        if (!actualFulfilmentDt || actualFulfilmentDt === d.demandInfo?.fulfilmentDt) {
          const allocationTimestamps = d.childRequestDetails?.flatMap(req =>
            req.pipeline?.filter(inter => inter.allocation && inter.allocation.createdAt)
              .map(inter => inter.allocation.createdAt)
          ).filter(Boolean) || [];

          if (allocationTimestamps.length > 0) {
            const latestAllocation = allocationTimestamps.sort().reverse()[0];
            actualFulfilmentDt = latestAllocation.split('T')[0];
          } else {
            actualFulfilmentDt = new Date().toISOString().split('T')[0];
          }
        }
      } else {
        actualFulfilmentDt = d.demandInfo?.actualFulfilmentDt || "Not Fulfilled";
      }

      return {
        id: d.demandInfo?.demandId,
        name: d.demandInfo?.title,
        project: d.contextInfo?.projectName,
        client: d.contextInfo?.accountName,
        priority: d.demandInfo?.priority || "Medium",
        submittedDate: d.demandInfo?.demandOpenDt,
        demandsRequested: d.demandInfo?.totalRequested || 0,
        scheduledInterviews: scheduledInterviews,
        assigned: allocated,
        onboarded: onboarded,
        pendingDays: sc.pendingDays || 0,
        overallStatus: d.demandInfo?.status,
        
        description: d.demandInfo?.description || "",
        demandOpenDt: d.demandInfo?.demandOpenDt,
        fulfilmentDt: d.demandInfo?.fulfilmentDt,
        actualFulfilmentDt: actualFulfilmentDt,
        statusSummary: sc,
        childRequestDetails: d.childRequestDetails || [],
        targetFulfillment: d.demandInfo?.fulfilmentDt || "N/A",
        // Add resource type counts
        internalResources: internalCount,
        externalResources: externalCount,
        totalResources: internalCount + externalCount,
      };
    });
  }, [demandList]);

  const totalDems = useMemo(() => demands.length, [demands]);
  const highPriority = useMemo(() => demands.filter((d) => d.priority === "High").length, [demands]);
  const mediumPriority = useMemo(() => demands.filter((d) => d.priority === "Medium").length, [demands]);
  const lowPriority = useMemo(() => demands.filter((d) => d.priority === "Low").length, [demands]);
  const totalDemandsReq = useMemo(
    () => demands.reduce((s, d) => s + d.demandsRequested, 0),
    [demands]
  );
  const totalScheduledInterviews = useMemo(
    () => demands.reduce((s, d) => s + d.scheduledInterviews, 0),
    [demands]
  );
  const totalAssigned = useMemo(
    () => demands.reduce((s, d) => s + d.assigned, 0),
    [demands]
  );
  const totalOnboarded = useMemo(
    () => demands.reduce((s, d) => s + d.onboarded, 0),
    [demands]
  );

  const totalRequests = useMemo(
    () => demands.reduce((s, d) => s + (d.statusSummary?.totalRequests || 0), 0),
    [demands]
  );

  /* ---------------------------------...--------------------------------- */
  /*  FILTERED LISTS                                                    */
  /* ---------------------------------...--------------------------------- */
  const filteredItems = useMemo(() => {
    let items = rawItems;
    if (selectedClient !== "All") {
      items = items.filter((it) =>
        (it.allocations ?? []).some((a) => a.accountName === selectedClient)
      );
    }
    if (filterType === "Opportunity") {
      items = items.filter((it) =>
        (it.resourceRequests ?? []).some((r) => r.status === "Approved")
      );
    } else if (filterType === "Demand") {
      items = items.filter((it) =>
        (it.resourceRequests ?? []).some((r) => r.status === "Submitted")
      );
    } else if (filterType === "Resource Request") {
      items = items.filter((it) => (it.resourceRequests ?? []).length > 0);
    }
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      items = items.filter((it) => {
        const name = `${it.profile?.firstName ?? ""} ${it.profile?.lastName ?? ""}`.toLowerCase();
        return name.includes(term);
      });
    }
    if (!startDate && !endDate) return items;
    const s = startDate ? new Date(startDate) : null;
    const e = endDate ? new Date(endDate) : null;
    return items.filter((it) => {
      const allocs = it.allocations ?? [];
      return allocs.some((a) => {
        const aStart = new Date(a.startDate);
        if (s && e) return aStart >= s && aStart <= e;
        if (s) return aStart >= s;
        if (e) return aStart <= e;
        return true;
      });
    });
  }, [rawItems, startDate, endDate, selectedClient, filterType, searchTerm]);

  const filteredOpportunities = useMemo(() => {
    let opps = opportunities;
    if (startDate || endDate) {
      const s = startDate ? new Date(startDate) : null;
      const e = endDate ? new Date(endDate) : null;
      opps = opps.filter((o) => {
        const sub = new Date(o.submittedDate);
        if (s && e) return sub >= s && sub <= e;
        if (s) return sub >= s;
        if (e) return sub <= e;
        return true;
      });
    }
    if (selectedClient !== "All") {
      opps = opps.filter((o) => o.client === selectedClient);
    }
    if (filterType === "Resource Request") {
      opps = opps.filter((o) => o.resourcesRequested > 0);
    }
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      opps = opps.filter(
        (o) =>
          o.name.toLowerCase().includes(term) ||
          o.project.toLowerCase().includes(term) ||
          o.client.toLowerCase().includes(term)
      );
    }
    return opps;
  }, [opportunities, startDate, endDate, selectedClient, filterType, searchTerm]);

  const filteredDemands = useMemo(() => {
    let dems = demands;
    if (startDate || endDate) {
      const s = startDate ? new Date(startDate) : null;
      const e = endDate ? new Date(endDate) : null;
      dems = dems.filter((d) => {
        const sub = new Date(d.submittedDate);
        if (s && e) return sub >= s && sub <= e;
        if (s) return sub >= s;
        if (e) return sub <= e;
        return true;
      });
    }
    if (selectedClient !== "All") {
      dems = dems.filter((d) => d.client === selectedClient);
    }
    if (filterType === "Demand") {
      dems = dems.filter((d) => d.demandsRequested > 0);
    }
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      dems = dems.filter((d) => d.name.toLowerCase().includes(term));
    }
    return dems;
  }, [demands, startDate, endDate, selectedClient, filterType, searchTerm]);

  /* ------------------------------------------------------------------ */
  /*  PAGINATION CALCULATIONS                                           */
  /* ------------------------------------------------------------------ */

  const getCurrentItemsPerPage = () => {
    switch (activeTab) {
      case "employees":
        return resourceView === "internal" ? employeeItemsPerPage : externalItemsPerPage;
      case "opportunity": return opportunityItemsPerPage;
      case "demand": return demandItemsPerPage;
      default: return 10;
    }
  };

  // Employee pagination
  const employeeTableItems = useMemo(() => {
    let items = filteredItems;
    if (currentTableFilter === "bench") {
      items = items.filter((i) => i.profile?.status?.includes("Bench"));
    } else if (currentTableFilter === "allocated") {
      items = items.filter((i) => !i.profile?.status?.includes("Bench"));
    } else if (currentTableFilter === "all-scheduled") {
      items = items.filter((i) =>
        (i.interviews ?? []).some((iv) => (iv.status ?? "").toLowerCase() === "scheduled")
      );
    } else if (currentTableFilter === "all-completed") {
      items = items.filter((i) =>
        (i.interviews ?? []).some((iv) =>
          ["completed", "selected"].includes((iv.status ?? "").toLowerCase())
        )
      );
    } else if (currentTableFilter === "all-rejected") {
      items = items.filter((i) =>
        (i.interviews ?? []).some((iv) => (iv.status ?? "").toLowerCase() === "rejected")
      );
    } else if (currentTableFilter === "resume-shared") {
      items = items.filter((i) => i.profile?.resumeStatus === "Shared");
    } else if (currentTableFilter === "resume-rejected") {
      items = items.filter((i) => i.profile?.resumeStatus === "Rejected");
    } else if (currentTableFilter?.match(/^[lL][1-3]-(scheduled|completed|rejected)$/)) {
      const [lvl, st] = currentTableFilter.split("-");
      const level = `L${lvl.charAt(1).toUpperCase()}`;
      const interviewStatus =
        st === "scheduled" ? "scheduled" :
          st === "completed" ? "completed" :
            st === "rejected" ? "rejected" : null;
      if (interviewStatus) {
        items = items.filter((i) =>
          (i.interviews ?? []).some((iv) => {
            const ivStatus = (iv.status ?? "").toLowerCase();
            const matchesStatus =
              interviewStatus === "completed"
                ? ivStatus === "completed" || ivStatus === "selected"
                : ivStatus === interviewStatus;
            return (
              matchesStatus &&
              (iv.interviewLevels ?? []).some((l) => l.trim().toUpperCase() === level)
            );
          })
        );
      }
    }
    return items;
  }, [filteredItems, currentTableFilter]);

  const indexOfLastEmployee = currentEmployeePage * employeeItemsPerPage;
  const indexOfFirstEmployee = indexOfLastEmployee - employeeItemsPerPage;
  const currentEmployeeItems = employeeTableItems.slice(indexOfFirstEmployee, indexOfLastEmployee);
  const totalEmployeePages = Math.ceil(employeeTableItems.length / employeeItemsPerPage);

  // External Resources pagination
  const externalTableItems = useMemo(() => {
    let items = externalResources;

    // Apply filters similar to internal resources
    if (selectedClient !== "All") {
      items = items.filter((it) =>
        (it.allocations ?? []).some((a) => a.accountName === selectedClient)
      );
    }

    if (currentTableFilter === "bench") {
      items = items.filter((i) => i.profile?.status?.includes("Bench"));
    } else if (currentTableFilter === "allocated") {
      items = items.filter((i) => !i.profile?.status?.includes("Bench"));
    } else if (currentTableFilter === "all-scheduled") {
      items = items.filter((i) =>
        (i.interviews ?? []).some((iv) => (iv.status ?? "").toLowerCase() === "scheduled")
      );
    } else if (currentTableFilter === "all-completed") {
      items = items.filter((i) =>
        (i.interviews ?? []).some((iv) =>
          ["completed", "selected"].includes((iv.status ?? "").toLowerCase())
        )
      );
    } else if (currentTableFilter === "all-rejected") {
      items = items.filter((i) =>
        (i.interviews ?? []).some((iv) => (iv.status ?? "").toLowerCase() === "rejected")
      );
    } else if (currentTableFilter === "resume-shared") {
      items = items.filter((i) => i.profile?.resumeStatus === "Shared");
    } else if (currentTableFilter === "resume-rejected") {
      items = items.filter((i) => i.profile?.resumeStatus === "Rejected");
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      items = items.filter((it) => {
        const name = `${it.profile?.firstName ?? ""} ${it.profile?.lastName ?? ""}`.toLowerCase();
        return name.includes(term);
      });
    }

    return items;
  }, [externalResources, selectedClient, currentTableFilter, searchTerm]);

  const indexOfLastExternal = currentExternalPage * externalItemsPerPage;
  const indexOfFirstExternal = indexOfLastExternal - externalItemsPerPage;
  const currentExternalItems = externalTableItems.slice(indexOfFirstExternal, indexOfLastExternal);
  const totalExternalPages = Math.ceil(externalTableItems.length / externalItemsPerPage);

  // Opportunity pagination
  const opportunityTableItems = useMemo(() => {
    let items = filteredOpportunities;
    if (currentTableFilter === "approved") items = items.filter((o) => o.status === "Approved");
    else if (currentTableFilter === "pending") items = items.filter((o) => o.status === "Pending");
    else if (currentTableFilter === "total-resources") items = items.filter((o) => o.resourcesRequested > 0);
    else if (currentTableFilter === "resource-type") items = items.filter((o) => o.internalResources > 0 || o.externalResources > 0);
    else if (currentTableFilter === "internal-resources") items = items.filter((o) => o.internalResources > 0);
    else if (currentTableFilter === "external-resources") items = items.filter((o) => o.externalResources > 0);
    else if (currentTableFilter === "scheduled-interviews") items = items.filter((o) => o.scheduledInterviews > 0);
    else if (currentTableFilter === "cleared") items = items.filter((o) => o.cleared > 0);
    else if (currentTableFilter === "rejected") items = items.filter((o) => o.rejected > 0);
    else if (currentTableFilter === "assigned") items = items.filter((o) => o.assigned > 0);
    return items;
  }, [filteredOpportunities, currentTableFilter]);

  const indexOfLastOpportunity = currentOpportunityPage * opportunityItemsPerPage;
  const indexOfFirstOpportunity = indexOfLastOpportunity - opportunityItemsPerPage;
  const currentOpportunityItems = opportunityTableItems.slice(indexOfFirstOpportunity, indexOfLastOpportunity);
  const totalOpportunityPages = Math.ceil(opportunityTableItems.length / opportunityItemsPerPage);

  // Demand pagination
  const demandTableItems = useMemo(() => {
    let items = filteredDemands;
    if (currentTableFilter === "total-demands-requested") items = items.filter((d) => d.demandsRequested > 0);
    else if (currentTableFilter === "selected") items = items.filter((d) => (d.statusSummary?.selected || 0) > 0);
    else if (currentTableFilter === "scheduled-interviews") items = items.filter((d) => d.scheduledInterviews > 0);
    else if (currentTableFilter === "allocated") items = items.filter((d) => d.assigned > 0);
    else if (currentTableFilter === "open") items = items.filter((d) => d.overallStatus === "Open");
    else if (currentTableFilter === "completed") items = items.filter((d) => d.overallStatus === "Completed");
    else if (currentTableFilter === "inprogress") items = items.filter((d) => d.overallStatus === "InProgress");
    else if (currentTableFilter === "rejected") items = items.filter((d) => d.overallStatus === "Rejected");
    else if (currentTableFilter === "on-hold") items = items.filter((d) => d.overallStatus === "On Hold");
    else if (currentTableFilter === "internal-resources") items = items.filter((d) => d.internalResources > 0);
    else if (currentTableFilter === "external-resources") items = items.filter((d) => d.externalResources > 0);
    return items;
  }, [filteredDemands, currentTableFilter]);

  const indexOfLastDemand = currentDemandPage * demandItemsPerPage;
  const indexOfFirstDemand = indexOfLastDemand - demandItemsPerPage;
  const currentDemandItems = demandTableItems.slice(indexOfFirstDemand, indexOfLastDemand);
  const totalDemandPages = Math.ceil(demandTableItems.length / demandItemsPerPage);

  /* ------------------------------------------------------------------ */
  /*  BAR DATA                                                          */
  /* ------------------------------------------------------------------ */

  const employeeKpiData = useMemo(() => {
    const employees = rawItems.map((i) => i.profile).filter(Boolean);
    const total = employees.length;
    const bench = employees.filter((e) => e.status?.includes("Bench")).length;
    const allocated = total - bench;
    const totalInterviews = rawItems.flatMap((i) => i.interviews ?? []).length;

    return {
      total,
      bench,
      allocated,
      totalInterviews
    };
  }, [rawItems]);

  const employeeBarData = useMemo(() => {
    const employees = filteredItems.map((i) => i.profile).filter(Boolean);
    const total = employees.length;
    const bench = employees.filter((e) => e.status?.includes("Bench")).length;
    const allocated = total - bench;

    // External resources
    const externalTotal = externalResources.length;
    // const externalAllocated = externalResources.filter(e => 
    //   (e.allocations ?? []).length > 0
    // ).length;
    // const externalBench = externalTotal - externalAllocated;

    return [
      {
        category: "Employees",
        Total: total,
        Bench: bench,
        Allocated: allocated,
      },
      {
        category: "External Resources",
        Total: externalTotal,
        // Bench: externalBench,
        // Allocated: externalAllocated,
      },
    ];
  }, [filteredItems, externalResources]);

  const projectClientBarData = useMemo(() => {
    const today = new Date().toISOString().split("T")[0];
    const allocations = filteredItems.flatMap((emp) =>
      (emp.allocations || []).map((a) => ({
        ...a,
        employeeId: emp.profile?.employeeId,
        firstName: emp.profile?.firstName,
        lastName: emp.profile?.lastName,
      }))
    );
    const projectSet = new Set(allocations.map((a) => a.projectName?.trim()).filter(Boolean));
    const clientSet = new Set();
    allocations.forEach((a) => {
      const n = a.accountName?.trim();
      if (n) clientSet.add(n);
    });
    const todayAllocs = allocations.filter((a) => a.startDate === today);
    const todayNames = todayAllocs.map(
      (a) => `${a.firstName} ${a.lastName} (EMP-${a.employeeId})`.trim()
    );
    return [
      {
        category: "Projects",
        projectsCount: projectSet.size,
        count: projectSet.size,
        _names: Array.from(projectSet),
      },
      {
        category: "Clients",
        clientsCount: clientSet.size,
        count: clientSet.size,
        _names: Array.from(clientSet),
      },
      {
        category: "Today Allocated",
        todayAllocatedCount: todayAllocs.length,
        count: todayAllocs.length,
        _names: todayNames,
      },
    ];
  }, [filteredItems]);

  const opportunityBarData = useMemo(() => {
    const approved = filteredOpportunities.filter((o) => o.status === "Approved");
    const pending = filteredOpportunities.filter((o) => o.status === "Pending");
    const totalResources = filteredOpportunities.reduce((s, o) => s + o.resourcesRequested, 0);
    const totalScheduled = filteredOpportunities.reduce((s, o) => s + o.scheduledInterviews, 0);
    const totalCleared = filteredOpportunities.reduce((s, o) => s + o.cleared, 0);
    const totalRejected = filteredOpportunities.reduce((s, o) => s + o.rejected, 0);
    const totalAssigned = filteredOpportunities.reduce((s, o) => s + o.assigned, 0);

    // Calculate internal vs external resources
    const totalInternalResources = filteredOpportunities.reduce((s, o) => s + o.internalResources, 0);
    const totalExternalResources = filteredOpportunities.reduce((s, o) => s + o.externalResources, 0);

    return [
      { category: "Total Opportunities", count: filteredOpportunities.length, _names: filteredOpportunities.map((o) => o.name) },
      { category: "Approved", count: approved.length, _names: approved.map((o) => o.name) },
      { category: "Pending", count: pending.length, _names: pending.map((o) => o.name) },
      { category: "Total Resources", count: totalResources, _names: filteredOpportunities.map((o) => `${o.name} (${o.resourcesRequested})`) },

      // COMBINED: Resource Type with internal/external in payload
      {
        category: "Resource Type",
        count: totalInternalResources + totalExternalResources,
        _names: filteredOpportunities.map((o) => `${o.name} (Int:${o.internalResources}, Ext:${o.externalResources})`),
        // Add internal and external counts to payload
        internal: totalInternalResources,
        external: totalExternalResources
      },

      { category: "Scheduled Interviews", count: totalScheduled, _names: filteredOpportunities.map((o) => `${o.name} (${o.scheduledInterviews})`) },
      { category: "Cleared", count: totalCleared, _names: filteredOpportunities.filter((o) => o.cleared > 0).map((o) => `${o.name} (${o.cleared})`) },
      { category: "Rejected", count: totalRejected, _names: filteredOpportunities.filter((o) => o.rejected > 0).map((o) => `${o.name} (${o.rejected})`) },
      { category: "Assigned", count: totalAssigned, _names: filteredOpportunities.filter((o) => o.assigned > 0).map((o) => `${o.name} (${o.assigned})`) },
    ];
  }, [filteredOpportunities]);
  const demandBarData = useMemo(() => {
    const high = filteredDemands.filter((d) => d.priority === "High");
    const medium = filteredDemands.filter((d) => d.priority === "Medium");
    const low = filteredDemands.filter((d) => d.priority === "Low");

    const totalRequests = filteredDemands.reduce((s, d) => s + (d.statusSummary?.totalRequests || 0), 0);
    const totalScheduledInterviews = filteredDemands.reduce((s, d) => s + d.scheduledInterviews, 0);
    const totalSelected = filteredDemands.reduce((s, d) => s + (d.statusSummary?.selected || 0), 0);
    const totalAssigned = filteredDemands.reduce((s, d) => s + d.assigned, 0);
    const totalOnboarded = filteredDemands.reduce((s, d) => s + d.onboarded, 0);

    // Calculate total internal and external resources
    const totalInternalResources = filteredDemands.reduce((s, d) => s + d.internalResources, 0);
    const totalExternalResources = filteredDemands.reduce((s, d) => s + d.externalResources, 0);

    return [
      { category: "Total Demands", count: filteredDemands.length, _names: filteredDemands.map((d) => d.name) },
      { category: "Request Resources", count: totalRequests, _names: filteredDemands.map((d) => `${d.name} (${d.statusSummary?.totalRequests || 0})`) },

      // COMBINED: Resource Type with internal/external in payload
      {
        category: "Resource Type",
        count: totalInternalResources + totalExternalResources,
        _names: filteredDemands.map((d) => `${d.name} (Int:${d.internalResources}, Ext:${d.externalResources})`),
        // Add internal and external counts to payload
        internal: totalInternalResources,
        external: totalExternalResources
      },

      { category: "Scheduled Interviews", count: totalScheduledInterviews, _names: filteredDemands.map((d) => `${d.name} (${d.scheduledInterviews})`) },
      { category: "Selected", count: totalSelected, _names: filteredDemands.filter((d) => (d.statusSummary?.selected || 0) > 0).map((d) => `${d.name} (${d.statusSummary?.selected || 0})`) },
      { category: "Allocated", count: totalAssigned, _names: filteredDemands.filter((d) => d.assigned > 0).map((d) => `${d.name} (${d.assigned})`) },
      { category: "Onboarded", count: totalOnboarded, _names: filteredDemands.filter((d) => d.onboarded > 0).map((d) => `${d.name} (${d.onboarded})`) },
    ];
  }, [filteredDemands]);
 const overallStatusBarData = useMemo(() => {
  const open = filteredDemands.filter((d) => 
    (d.overallStatus || "").toLowerCase() === "open"
  );
  const completed = filteredDemands.filter((d) => 
    (d.overallStatus || "").toLowerCase() === "completed"
  );
  const inprogress = filteredDemands.filter((d) => 
    (d.overallStatus || "").toLowerCase() === "inprogress" || 
    (d.overallStatus || "").toLowerCase() === "in progress"
  );
  const rejected = filteredDemands.filter((d) => 
    (d.overallStatus || "").toLowerCase() === "rejected"
  );
  const onhold = filteredDemands.filter((d) => 
    (d.overallStatus || "").toLowerCase().includes("hold") || 
    (d.overallStatus || "").toLowerCase() === "onhold" ||
    (d.overallStatus || "").toLowerCase() === "on_hold"
  );

  return [
    { category: "Open", count: open.length, _names: open.map((d) => d.name) },
    { category: "Completed", count: completed.length, _names: completed.map((d) => d.name) },
    { category: "InProgress", count: inprogress.length, _names: inprogress.map((d) => d.name) },
    { category: "Rejected", count: rejected.length, _names: rejected.map((d) => d.name) },
    { category: "On Hold", count: onhold.length, _names: onhold.map((d) => d.name) },
  ];
}, [filteredDemands]);

  /* ------------------------------------------------------------------ */
  /*  INTERVIEW DATA                                                    */
  /* ------------------------------------------------------------------ */
  const interviewData = useMemo(() => {
    const allScheduledEmps = new Set();
    const allCompletedEmps = new Set();
    const allRejectedEmps = new Set();
    const scheduledNamesSet = new Set();
    const completedNamesSet = new Set();
    const rejectedNamesSet = new Set();
    const resumeShared = { shared: 0 };
    const resumeRejected = { rejected: 0 };
    const sharedNames = [];
    const rejectedNamesResume = [];

    filteredItems.forEach((item) => {
      const empId = item.profile?.employeeId;
      const fullName = `${item.profile?.firstName ?? ""} ${item.profile?.lastName ?? ""}`.trim();
      if (!empId || !fullName) return;
      const rs = item.profile?.resumeStatus;
      const full = `${fullName} (EMP-${empId})`;

      if (rs === "Shared") {
        resumeShared.shared++;
        sharedNames.push(full);
      } else if (rs === "Rejected") {
        resumeRejected.rejected++;
        rejectedNamesResume.push(full);
      }

      (item.interviews ?? []).forEach((iv) => {
        const status = (iv.status ?? "Unknown").toLowerCase();
        if (status === "scheduled") {
          allScheduledEmps.add(empId);
          scheduledNamesSet.add(full);
        } else if (status === "completed" || status === "selected") {
          allCompletedEmps.add(empId);
          completedNamesSet.add(full);
        } else if (status === "rejected") {
          allRejectedEmps.add(empId);
          rejectedNamesSet.add(full);
        }
      });
    });

    const _scheduledNames = Array.from(scheduledNamesSet);
    const _completedNames = Array.from(completedNamesSet);
    const _rejectedNames = Array.from(rejectedNamesSet);
    const _sharedNames = sharedNames;
    const _rejectedNamesResume = rejectedNamesResume;

    const levelEmpSets = {
      L1: { intScheduled: new Set(), completed: new Set(), intRejected: new Set() },
      L2: { intScheduled: new Set(), completed: new Set(), intRejected: new Set() },
      L3: { intScheduled: new Set(), completed: new Set(), intRejected: new Set() },
    };

    filteredItems.forEach((item) => {
      const empId = item.profile?.employeeId;
      if (!empId) return;
      (item.interviews ?? []).forEach((iv) => {
        const status = (iv.status ?? "Unknown").toLowerCase();
        let mapped = null;
        if (status === "completed" || status === "selected") mapped = "completed";
        else if (status === "scheduled") mapped = "intScheduled";
        else if (status === "rejected") mapped = "intRejected";
        if (!mapped) return;
        const levels = iv.interviewLevels ?? [];
        levels.forEach((lvlStr) => {
          const norm = lvlStr.trim().toUpperCase();
          if (levelEmpSets[norm] && levelEmpSets[norm][mapped]) {
            levelEmpSets[norm][mapped].add(empId);
          }
        });
      });
    });

    const levelCounts = {
      L1: {
        intScheduled: levelEmpSets.L1.intScheduled.size,
        completed: levelEmpSets.L1.completed.size,
        intRejected: levelEmpSets.L1.intRejected.size,
      },
      L2: {
        intScheduled: levelEmpSets.L2.intScheduled.size,
        completed: levelEmpSets.L2.completed.size,
        intRejected: levelEmpSets.L2.intRejected.size,
      },
      L3: {
        intScheduled: levelEmpSets.L3.intScheduled.size,
        completed: levelEmpSets.L3.completed.size,
        intRejected: levelEmpSets.L3.intRejected.size,
      },
      ALL: {
        allScheduled: allScheduledEmps.size,
        allCompleted: allCompletedEmps.size,
        allRejected: allRejectedEmps.size,
        _scheduledNames,
        _completedNames,
        _rejectedNames,
      },
      Resume: {
        shared: resumeShared.shared,
        rejected: resumeRejected.rejected,
        _sharedNames,
        _rejectedNames: _rejectedNamesResume,
      },
    };

    return [
      { level: "L1", intScheduled: levelCounts.L1.intScheduled, completed: levelCounts.L1.completed, intRejected: levelCounts.L1.intRejected },
      { level: "L2", intScheduled: levelCounts.L2.intScheduled, completed: levelCounts.L2.completed, intRejected: levelCounts.L2.intRejected },
      { level: "L3", intScheduled: levelCounts.L3.intScheduled, completed: levelCounts.L3.completed, intRejected: levelCounts.L3.intRejected },
      {
        level: "All Interviews",
        allScheduled: levelCounts.ALL.allScheduled,
        allCompleted: levelCounts.ALL.allCompleted,
        allRejected: levelCounts.ALL.allRejected,
        _scheduledNames: levelCounts.ALL._scheduledNames,
        _completedNames: levelCounts.ALL._completedNames,
        _rejectedNames: levelCounts.ALL._rejectedNames,
      },
      {
        level: "Resume",
        shared: levelCounts.Resume.shared,
        rejected: levelCounts.Resume.rejected,
        _sharedNames: levelCounts.Resume._sharedNames,
        _rejectedNames: levelCounts.Resume._rejectedNames,
      },
    ];
  }, [filteredItems]);

  /* ------------------------------------------------------------------ */
  /*  EXPAND HANDLERS                                                   */
  /* ------------------------------------------------------------------ */
  const toggleDetails = (id) => setExpandedEmployee((p) => (p === id ? null : id));
  const toggleOpportunityDetails = (id) => setExpandedOpportunity((p) => (p === id ? null : id));
  const toggleDemandDetails = (id) => setExpandedDemand((p) => (p === id ? null : id));

  /* ------------------------------------------------------------------ */
  /*  PAGINATION COMPONENT                                              */
  /* ------------------------------------------------------------------ */
  const Pagination = ({
    currentPage,
    totalPages,
    onPageChange,
    itemsPerPage,
    onItemsPerPageChange,
    totalItems
  }) => {
    if (totalPages <= 1) return null;

    return (
      <div className="flex items-center justify-between px-4 py-3 bg-white border-t border-gray-200">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-700">Show</span>
            <select
              value={itemsPerPage}
              onChange={(e) => onItemsPerPageChange(Number(e.target.value))}
              className="border border-gray-300 rounded px-2 py-1 text-sm"
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
            <span className="text-sm text-gray-700">entries</span>
          </div>
          <div className="text-sm text-gray-700">
            Page {currentPage} of {totalPages}
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          {[...Array(totalPages)].map((_, i) => {
            const page = i + 1;
            if (
              page === 1 ||
              page === totalPages ||
              (page >= currentPage - 1 && page <= currentPage + 1)
            ) {
              return (
                <Button
                  key={page}
                  variant={currentPage === page ? "default" : "outline"}
                  size="sm"
                  onClick={() => onPageChange(page)}
                >
                  {page}
                </Button>
              );
            } else if (page === currentPage - 2 || page === currentPage + 2) {
              return <span key={page} className="px-2">...</span>;
            }
            return null;
          })}
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    );
  };

  /* ------------------------------------------------------------------ */
  /*  RENDER                                                            */
  /* ------------------------------------------------------------------ */
  return (
    <div className="space-y-6 p-4 min-h-screen bg-gradient-to-br from-indigo-50 via-white to-teal-50">
      {/* Header */}
      <div className="flex flex-col lg:flex-row items-center justify-between gap-4 bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-teal-100">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-600 rounded-xl shadow-md">
              <h1 className="text-2xl font-bold text-white">Portfolio Overview</h1>
            </div>
          </div>
          <p className="text-gray-600">All employees, allocations, requests, interviews & projects</p>
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <Clock className="w-3 h-3" />
            Last update: {lastUpdated?.toLocaleTimeString() ?? "-"}
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setCurrentPage?.("resource-requests")}
            className="border-teal-200 text-teal-600 hover:bg-teal-50"
          >
            <Target className="w-4 h-4 mr-2" /> Requests
          </Button>
          <Button
            variant="outline"
            onClick={() => setCurrentPage?.("interviews-management")}
            className="border-teal-200 text-teal-600 hover:bg-teal-50"
          >
            <BarChart3 className="w-4 h-4 mr-2" /> Interviews
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsGroupIdDialogOpen(true)}
            className="bg-gradient-to-r from-indigo-500 to-indigo-500 text-white hover:from-indigo-600 hover:to-teal-600"
          >
            <Sparkles className="w-4 h-4 mr-2" /> AI Group Matcher
          </Button>
        </div>
      </div>

      {/* TABS */}
      <div className="flex border-b border-gray-200 bg-white/80 backdrop-blur-sm rounded-t-2xl shadow-md">
        {["employees", "opportunity", "demand"].map((tab) => (
          <Button
            key={tab}
            variant={activeTab === tab ? "default" : "ghost"}
            onClick={() => {
              setActiveTab(tab);
              setCurrentEmployeePage(1);
              setCurrentExternalPage(1);
              setCurrentOpportunityPage(1);
              setCurrentDemandPage(1);
            }}
            className="rounded-none capitalize"
          >
            {tab}
          </Button>
        ))}
      </div>

      {/* FILTERS */}
      <Card className="bg-white border border-gray-300 shadow-md">
        <CardHeader className="bg-gray-50 border-b border-gray-300 flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-gray-800">
            <Calendar className="w-5 h-5" /> Allocation Start-Date Filter
          </CardTitle>
          {activeTab === "demand" && (
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 mb-2">
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wide font-semibold">Demand Overview</p>
              </div>
              <div className="flex items-center gap-3 flex-wrap justify-start lg:justify-end">
                <button
                  onClick={handleOpenEmailModal}
                  disabled={loading}
                  className="inline-flex items-center gap-2 h-10 px-4 rounded-full bg-white text-emerald-700 border border-emerald-200 shadow-sm hover:bg-emerald-50 hover:border-emerald-300 font-semibold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
                  Generate Email
                </button>
              </div>
            </div>
          )}
        </CardHeader>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4 items-center">
            <div className="flex items-center gap-2">
              <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="border-gray-300" />
              {startDate && (
                <Button size="icon" variant="ghost" onClick={() => setStartDate("")} className="text-gray-500 hover:text-red-600">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </Button>
              )}
            </div>
            <span className="text-gray-500">to</span>
            <div className="flex items-center gap-2">
              <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="border-gray-300" />
              {endDate && (
                <Button size="icon" variant="ghost" onClick={() => setEndDate("")} className="text-gray-500 hover:text-red-600">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </Button>
              )}
            </div>
            <Button variant={isTodayFilter ? "default" : "outline"} onClick={isTodayFilter ? clearTodayFilter : handleTodayFilter} size="sm">
              {isTodayFilter ? "Clear Today" : "Today"}
            </Button>
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">Client:</label>
              <select
                value={selectedClient}
                onChange={(e) => setSelectedClient(e.target.value)}
                className="border-gray-300 rounded-md p-1 text-sm"
                disabled={clientsLoading}
              >
                {clients.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              {clientsLoading && <Loader2 className="w-4 h-4 animate-spin" />}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* SEARCH */}
      <Card className="bg-white border border-gray-300 shadow-md">
        <CardContent className="p-6">
          <Input
            placeholder={`Search by ${activeTab === "employees" ? "name" : activeTab === "opportunity" ? "opportunity name" : "demand name"}...`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-md"
          />
        </CardContent>
      </Card>

      {/* LOADING OVERLAY */}
      {(loading || apiLoading || demandLoading || externalLoading) && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white p-4 rounded-lg shadow-lg flex items-center gap-2">
            <Loader2 className="w-5 h-5 animate-spin text-teal-600" />
            <span>Loading data…</span>
          </div>
        </div>
      )}

      {/* SUCCESS NOTIFICATION */}
      {showSuccess && (
        <div className="fixed top-6 bg-white border border-green-100 text-green-800 px-6 py-3 rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.12)] flex items-center gap-3 animate-in slide-in-from-top-4 z-50">
          <div className="bg-green-100 p-1 rounded-full"><CheckCircle className="w-4 h-4 text-green-600" /></div>
          <span className="text-sm font-medium">Sent successfully</span>
        </div>
      )}

      {/* ====================== EMPLOYEES TAB ====================== */}
      {activeTab === "employees" && (
        <>

          {/* KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {[
              { title: "Employees", value: employeeKpiData.total, color: "indigo-600", icon: Users },
              { title: "Bench", value: employeeKpiData.bench, color: "amber-600", icon: AlertTriangle },
              { title: "Allocated", value: employeeKpiData.allocated, color: "emerald-600", icon: Briefcase },
              { title: "Interviews", value: employeeKpiData.totalInterviews, color: "orange-600", icon: CheckCircle },
              {
                title: "External Resources",
                value: externalResources.length,
                color: "purple-600",
                icon: Users,
                loading: externalLoading
              },
            ].map((k, i) => {
              const Icon = k.icon;
              return (
                <Card key={i} className="bg-white hover:shadow-md transition-all border border-gray-200">
                  <CardHeader className="pb-2">
                    <CardTitle className={`text-sm flex items-center gap-2 text-${k.color}`}>
                      <Icon className="w-4 h-4" />
                      {k.title}
                      {k.loading && <Loader2 className="w-3 h-3 animate-spin ml-1" />}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className={`text-2xl font-bold text-${k.color}`}>
                      {k.loading ? "..." : k.value}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Resource View Toggle */}
          <Card className="bg-white border border-gray-300 shadow-md">
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium text-gray-700">Resource Type:</span>
                <div className="flex border border-gray-300 rounded-lg overflow-hidden">
                  <Button
                    variant={resourceView === "internal" ? "default" : "ghost"}
                    onClick={() => {
                      setResourceView("internal");
                      setCurrentEmployeePage(1);
                    }}
                    className="rounded-none border-0"
                    size="sm"
                  >
                    Internal Resources
                  </Button>
                  <Button
                    variant={resourceView === "external" ? "default" : "ghost"}
                    onClick={() => {
                      setResourceView("external");
                      setCurrentExternalPage(1);
                    }}
                    className="rounded-none border-0"
                    size="sm"
                  >
                    External Resources
                  </Button>
                </div>
                <span className="text-sm text-gray-500">
                  Showing {resourceView === "internal" ? employeeTableItems.length : externalTableItems.length} items
                  {externalLoading && resourceView === "external" && (
                    <Loader2 className="w-3 h-3 animate-spin ml-2 inline" />
                  )}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Internal Resources Table */}
          {resourceView === "internal" && (
            <Card ref={tableRef} className="bg-white border border-gray-300 shadow-lg scroll-mt-24">
              <CardHeader className="bg-gray-50 border-b border-gray-300">
                <CardTitle className="flex items-center gap-2 text-gray-800">
                  <Users className="w-5 h-5" /> Employee Details
                  {!startDate && !endDate ? (
                    <Badge variant="secondary" className="ml-2 text-xs">All Time</Badge>
                  ) : (
                    <Badge variant="outline" className="ml-2 text-xs border-blue-400 text-blue-700">
                      Filtered: {startDate || "..."} to {endDate || "..."}
                    </Badge>
                  )}
                  {currentTableFilter && (
                    <Badge variant="destructive" className="ml-2 text-xs">
                      {currentTableFilter === "bench" ? "Bench" :
                        currentTableFilter === "allocated" ? "Allocated" :
                          currentTableFilter === "all-scheduled" ? "All Scheduled Interviews" :
                            currentTableFilter === "all-completed" ? "All Completed Interviews" :
                              currentTableFilter === "all-rejected" ? "All Rejected Interviews" :
                                currentTableFilter === "resume-shared" ? "Resume Shared" :
                                  currentTableFilter === "resume-rejected" ? "Resume Rejected" :
                                    (() => {
                                      const match = currentTableFilter.match(/^[lL][1-3]-(scheduled|completed|rejected)$/);
                                      if (match) {
                                        const parts = currentTableFilter.split('-');
                                        const levelStr = parts[0];
                                        const st = parts[1];
                                        const level = `L${levelStr.charAt(1).toUpperCase()}`;
                                        const status = st.charAt(0).toUpperCase() + st.slice(1);
                                        return `${level} ${status} Interviews`;
                                      }
                                      return "Filtered";
                                    })()}
                    </Badge>
                  )}
                </CardTitle>
                <CardDescription>Click details to expand profile, projects, and interviews. Use chart clicks to filter.</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm bg-white">
                    <thead className="bg-gray-100 text-gray-700 border-b border-gray-300">
                      <tr>
                        <th className="p-3 text-left font-medium">Name</th>
                        <th className="p-3 text-left font-medium">Status</th>
                        <th className="p-3 text-left font-medium">Exp (Yrs)</th>
                        <th className="p-3 text-left font-medium">Current Project</th>
                        <th className="p-3 text-left font-medium">Interviews</th>
                        <th className="p-3 text-left font-medium">Sel / Rej</th>
                        <th className="p-3 text-center font-medium">Resume</th>
                        <th className="p-3 text-center font-medium">Details</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentEmployeeItems
                        .map((item) => {
                          const p = item.profile;
                          if (!p) return null;
                          const now = new Date();
                          const curr = (item.allocations ?? []).find(
                            (a) => new Date(a.startDate) <= now && new Date(a.endDate) >= now
                          );
                          const interviews = item.interviews ?? [];
                          const sel = interviews.filter((i) => {
                            const s = (i.status ?? "").toLowerCase();
                            return s === "completed" || s === "selected";
                          }).length;
                          const rej = interviews.filter((i) => (i.status ?? "").toLowerCase() === "rejected").length;

                          const resumeStatus = p.resumeStatus ?? "-";

                          return {
                            profile: p,
                            currentProject: curr?.projectName || "None",
                            interviews,
                            sel,
                            rej,
                            resumeStatus,
                            resumeShareActionByUserName: p.resumeShareActionByUserName,
                            resumeShareActionAt: p.resumeShareActionAt,
                            resumeShareAudit: p.resumeShareAudit ?? [],
                            empId: p.employeeId,
                            item,
                          };
                        })
                        .filter(Boolean)
                        .reverse()
                        .map(({ profile, currentProject, interviews, sel, rej, resumeStatus, resumeShareActionByUserName, resumeShareActionAt, resumeShareAudit, empId, item }) => (
                          <React.Fragment key={empId}>
                            <tr className="border-b border-gray-200 hover:bg-gray-50">
                              <td className="p-3 font-medium text-gray-900">{profile.firstName} {profile.lastName}</td>
                              <td className="p-3">
                                <Badge
                                  variant={
                                    profile.status?.includes("Bench") ? "secondary" :
                                      ["Client", "Billable", "isBillable"].some(s => profile.status?.includes(s)) ? "default" :
                                        "outline"
                                  }
                                  className="text-xs"
                                >
                                  {profile.status || "N/A"}
                                </Badge>
                              </td>
                              <td className="p-3 text-gray-700">{profile.experienceYears ?? 0}</td>
                              <td className="p-3 text-gray-700">{currentProject}</td>
                              <td className="p-3 text-gray-700">{interviews.length}</td>
                              <td className="p-3 text-gray-700">{sel} / {rej}</td>
                              <td className="p-3 text-center">
                                {resumeStatus === "Rejected" ? (
                                  <Badge variant="destructive" className="text-xs">Rejected</Badge>
                                ) : resumeStatus === "Shared" ? (
                                  <Badge variant="secondary" className="text-xs">Shared</Badge>
                                ) : (
                                  <span className="text-gray-400 text-xs">-</span>
                                )}
                              </td>
                              <td className="p-3 text-center">
                                <Button variant="ghost" size="sm" onClick={() => toggleDetails(empId)}>
                                  <CheckCircle
                                    className={`w-4 h-4 transition-transform ${expandedEmployee === empId ? "rotate-90 text-green-600" : "text-gray-600"}`}
                                  />
                                </Button>
                              </td>
                            </tr>

                            {expandedEmployee === empId && (
                              <tr className="bg-gray-50 border-b border-gray-200">
                                <td colSpan={8} className="p-4">
                                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div>
                                      <h4 className="font-semibold text-gray-800 mb-2">Profile</h4>
                                      <p><strong>Employee Id:</strong> {profile.employeeId ?? "N/A"}</p>
                                      <p><strong>Email:</strong> {profile.email ?? "N/A"}</p>
                                      <p><strong>Phone:</strong> {profile.phoneNumber ?? "N/A"}</p>
                                      <p><strong>Location:</strong> {profile.location ?? "N/A"}</p>
                                      <p><strong>Skills:</strong> {profile.skills?.join(", ") ?? "N/A"}</p>
                                    </div>
                                    <div>
                                      <h4 className="font-semibold text-gray-800 mb-2">Projects</h4>
                                      <ul className="space-y-1">
                                        {(item.allocations ?? []).map((a, i) => (
                                          <li key={i} className="text-sm text-gray-600">
                                            {a.projectName} - {a.status} ({a.startDate} to {a.endDate || "Ongoing"})
                                          </li>
                                        ))}
                                        {(!item.allocations || item.allocations.length === 0) && (
                                          <li className="text-sm text-gray-500">No projects</li>
                                        )}
                                      </ul>
                                    </div>
                                    <div>
                                      <h4 className="font-semibold text-gray-800 mb-2">Interviews</h4>
                                      <ul className="space-y-1">
                                        {interviews.map((iv, i) => {
                                          const ivStatus = (iv.status ?? "").toLowerCase();
                                          let variant = "secondary";
                                          if (ivStatus === "completed" || ivStatus === "selected") variant = "default";
                                          else if (ivStatus === "rejected") variant = "destructive";
                                          else if (ivStatus === "scheduled") variant = "outline";

                                          const actualDate = iv.levelProgress?.[0]?.scheduledAt ?? new Date().toLocaleDateString();
                                          const actualComments = iv.levelProgress?.[0]?.feedbackComments ?? "No comments available";

                                          return (
                                            <li key={i} className="text-sm">
                                              <Badge variant={variant}>
                                                {iv.status || "N/A"}
                                              </Badge>{" "}
                                              - {iv.interviewLevels?.join(", ") ?? "N/A"}
                                              <br />
                                              <span className="text-xs text-gray-500">
                                                Date: {actualDate} | Comment: {actualComments}
                                              </span>
                                            </li>
                                          );
                                        })}
                                        {interviews.length === 0 && <li className="text-sm text-gray-500">No interviews</li>}
                                      </ul>
                                    </div>

                                    {resumeStatus !== "-" && (
                                      <div className="md:col-span-3 mt-4">
                                        <h4 className="font-semibold text-gray-800 mb-2">Resume Share History</h4>
                                        <p className="text-sm">
                                          <strong>Shared by:</strong> {resumeShareActionByUserName ?? "Unknown"} on{" "}
                                          {resumeShareActionAt
                                            ? new Date(resumeShareActionAt).toLocaleString()
                                            : "N/A"}
                                        </p>
                                        <ul className="mt-2 space-y-2">
                                          {resumeShareAudit.map((audit, i) => (
                                            <li key={i} className="bg-gray-50 p-2 rounded text-xs">
                                              <strong>{audit.projectName}</strong> ({audit.clientName}) – Group {audit.groupId}
                                              <br />
                                              Email sent to: {audit.emailSentTo}
                                            </li>
                                          ))}
                                          {resumeShareAudit.length === 0 && (
                                            <li className="text-gray-500 text-xs">No audit records</li>
                                          )}
                                        </ul>
                                      </div>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        ))}
                    </tbody>
                  </table>
                  {currentEmployeeItems.length === 0 && (
                    <div className="text-center py-12 text-gray-500 bg-white">
                      <AlertTriangle className="w-12 h-12 mx-auto text-orange-400 mb-4" />
                      <p>No data for selected filters.</p>
                    </div>
                  )}
                </div>
                <Pagination
                  currentPage={currentEmployeePage}
                  totalPages={totalEmployeePages}
                  onPageChange={setCurrentEmployeePage}
                  itemsPerPage={employeeItemsPerPage}
                  onItemsPerPageChange={setEmployeeItemsPerPage}
                  totalItems={employeeTableItems.length}
                />
              </CardContent>
            </Card>
          )}

          {/* External Resources Table */}
          {resourceView === "external" && (
            <Card ref={tableRef} className="bg-white border border-gray-300 shadow-lg scroll-mt-24">
              <CardHeader className="bg-gray-50 border-b border-gray-300">
                <CardTitle className="flex items-center gap-2 text-gray-800">
                  <Users className="w-5 h-5 text-purple-600" /> External Resources (Candidates)
                  {!startDate && !endDate ? (
                    <Badge variant="secondary" className="ml-2 text-xs">All Time</Badge>
                  ) : (
                    <Badge variant="outline" className="ml-2 text-xs border-purple-400 text-purple-700">
                      Filtered: {startDate || "..."} to {endDate || "..."}
                    </Badge>
                  )}
                  {currentTableFilter && (
                    <Badge variant="destructive" className="ml-2 text-xs">
                      {currentTableFilter === "bench" ? "Bench" :
                        currentTableFilter === "allocated" ? "Allocated" :
                          currentTableFilter === "all-scheduled" ? "All Scheduled Interviews" :
                            currentTableFilter === "all-completed" ? "All Completed Interviews" :
                              currentTableFilter === "all-rejected" ? "All Rejected Interviews" :
                                currentTableFilter === "resume-shared" ? "Resume Shared" :
                                  currentTableFilter === "resume-rejected" ? "Resume Rejected" :
                                    (() => {
                                      const match = currentTableFilter.match(/^[lL][1-3]-(scheduled|completed|rejected)$/);
                                      if (match) {
                                        const parts = currentTableFilter.split('-');
                                        const levelStr = parts[0];
                                        const st = parts[1];
                                        const level = `L${levelStr.charAt(1).toUpperCase()}`;
                                        const status = st.charAt(0).toUpperCase() + st.slice(1);
                                        return `${level} ${status} Interviews`;
                                      }
                                      return "Filtered";
                                    })()}
                    </Badge>
                  )}
                </CardTitle>
                <CardDescription>Click details to expand candidate profile, projects, and interviews.</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm bg-white">
                    <thead className="bg-gray-100 text-gray-700 border-b border-gray-300">
                      <tr>
                        <th className="p-3 text-left font-medium">Name</th>
                        <th className="p-3 text-left font-medium">Status</th>
                        <th className="p-3 text-left font-medium">Exp (Yrs)</th>
                        <th className="p-3 text-left font-medium">Current Project</th>
                        <th className="p-3 text-left font-medium">Interviews</th>
                        <th className="p-3 text-left font-medium">Sel / Rej</th>
                        <th className="p-3 text-center font-medium">Resume</th>
                        <th className="p-3 text-center font-medium">Details</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentExternalItems
                        .map((item) => {
                          const p = item.profile;
                          if (!p) return null;
                          const now = new Date();
                          const curr = (item.allocations ?? []).find(
                            (a) => new Date(a.startDate) <= now && new Date(a.endDate) >= now
                          );
                          const interviews = item.interviews ?? [];
                          const sel = interviews.filter((i) => {
                            const s = (i.status ?? "").toLowerCase();
                            return s === "completed" || s === "selected";
                          }).length;
                          const rej = interviews.filter((i) => (i.status ?? "").toLowerCase() === "rejected").length;

                          const resumeStatus = p.resumeStatus ?? "-";

                          return {
                            profile: p,
                            currentProject: curr?.projectName || "None",
                            interviews,
                            sel,
                            rej,
                            resumeStatus,
                            resumeShareActionByUserName: p.resumeShareActionByUserName,
                            resumeShareActionAt: p.resumeShareActionAt,
                            resumeShareAudit: p.resumeShareAudit ?? [],
                            candidateId: p.candidateId,
                            item,
                          };
                        })
                        .filter(Boolean)
                        .reverse()
                        .map(({ profile, currentProject, interviews, sel, rej, resumeStatus, resumeShareActionByUserName, resumeShareActionAt, resumeShareAudit, candidateId, item }) => (
                          <React.Fragment key={candidateId}>
                            <tr className="border-b border-gray-200 hover:bg-gray-50">
                              <td className="p-3 font-medium text-gray-900">
                                {profile.firstName} {profile.lastName}
                                <div className="text-xs text-purple-600 font-mono mt-1">CAD-{candidateId}</div>
                              </td>
                              <td className="p-3">
                                <Badge
                                  variant={
                                    profile.status?.includes("Bench") ? "secondary" :
                                      ["Client", "Billable", "isBillable"].some(s => profile.status?.includes(s)) ? "default" :
                                        "outline"
                                  }
                                  className="text-xs"
                                >
                                  {profile.status || "N/A"}
                                </Badge>
                              </td>
                              <td className="p-3 text-gray-700">{profile.experienceYears ?? 0}</td>
                              <td className="p-3 text-gray-700">{currentProject}</td>
                              <td className="p-3 text-gray-700">{interviews.length}</td>
                              <td className="p-3 text-gray-700">{sel} / {rej}</td>
                              <td className="p-3 text-center">
                                {resumeStatus === "Rejected" ? (
                                  <Badge variant="destructive" className="text-xs">Rejected</Badge>
                                ) : resumeStatus === "Shared" ? (
                                  <Badge variant="secondary" className="text-xs">Shared</Badge>
                                ) : (
                                  <span className="text-gray-400 text-xs">-</span>
                                )}
                              </td>
                              <td className="p-3 text-center">
                                <Button variant="ghost" size="sm" onClick={() => toggleDetails(candidateId)}>
                                  <CheckCircle
                                    className={`w-4 h-4 transition-transform ${expandedEmployee === candidateId ? "rotate-90 text-green-600" : "text-gray-600"}`}
                                  />
                                </Button>
                              </td>
                            </tr>

                            {expandedEmployee === candidateId && (
                              <tr className="bg-gray-50 border-b border-gray-200">
                                <td colSpan={8} className="p-4">
                                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div>
                                      <h4 className="font-semibold text-gray-800 mb-2">Profile</h4>
                                      <p><strong>Candidate Id:</strong> {profile.candidateId ?? "N/A"}</p>
                                      <p><strong>Email:</strong> {profile.email ?? "N/A"}</p>
                                      <p><strong>Phone:</strong> {profile.phoneNumber ?? "N/A"}</p>
                                      <p><strong>Location:</strong> {profile.location ?? "N/A"}</p>
                                      <p><strong>Company:</strong> {profile.companyName ?? "N/A"}</p>
                                      <p><strong>Skills:</strong> {profile.skillNames?.join(", ") ?? profile.skills?.join(", ") ?? "N/A"}</p>
                                    </div>
                                    <div>
                                      <h4 className="font-semibold text-gray-800 mb-2">Projects</h4>
                                      <ul className="space-y-1">
                                        {(item.allocations ?? []).map((a, i) => (
                                          <li key={i} className="text-sm text-gray-600">
                                            {a.projectName} - {a.status} ({a.startDate} to {a.endDate || "Ongoing"})
                                          </li>
                                        ))}
                                        {(!item.allocations || item.allocations.length === 0) && (
                                          <li className="text-sm text-gray-500">No projects</li>
                                        )}
                                      </ul>
                                    </div>
                                    <div>
                                      <h4 className="font-semibold text-gray-800 mb-2">Interviews</h4>
                                      <ul className="space-y-1">
                                        {interviews.map((iv, i) => {
                                          const ivStatus = (iv.status ?? "").toLowerCase();
                                          let variant = "secondary";
                                          if (ivStatus === "completed" || ivStatus === "selected") variant = "default";
                                          else if (ivStatus === "rejected") variant = "destructive";
                                          else if (ivStatus === "scheduled") variant = "outline";

                                          const actualDate = iv.levelProgress?.[0]?.scheduledAt ?? new Date().toLocaleDateString();
                                          const actualComments = iv.levelProgress?.[0]?.feedbackComments ?? "No comments available";

                                          return (
                                            <li key={i} className="text-sm">
                                              <Badge variant={variant}>
                                                {iv.status || "N/A"}
                                              </Badge>{" "}
                                              - {iv.interviewLevels?.join(", ") ?? "N/A"}
                                              <br />
                                              <span className="text-xs text-gray-500">
                                                Date: {actualDate} | Comment: {actualComments}
                                              </span>
                                            </li>
                                          );
                                        })}
                                        {interviews.length === 0 && <li className="text-sm text-gray-500">No interviews</li>}
                                      </ul>
                                    </div>

                                    {resumeStatus !== "-" && (
                                      <div className="md:col-span-3 mt-4">
                                        <h4 className="font-semibold text-gray-800 mb-2">Resume Share History</h4>
                                        <p className="text-sm">
                                          <strong>Shared by:</strong> {resumeShareActionByUserName ?? "Unknown"} on{" "}
                                          {resumeShareActionAt
                                            ? new Date(resumeShareActionAt).toLocaleString()
                                            : "N/A"}
                                        </p>
                                        <ul className="mt-2 space-y-2">
                                          {resumeShareAudit.map((audit, i) => (
                                            <li key={i} className="bg-gray-50 p-2 rounded text-xs">
                                              <strong>{audit.projectName}</strong> ({audit.clientName}) – Group {audit.groupId}
                                              <br />
                                              Email sent to: {audit.emailSentTo}
                                            </li>
                                          ))}
                                          {resumeShareAudit.length === 0 && (
                                            <li className="text-gray-500 text-xs">No audit records</li>
                                          )}
                                        </ul>
                                      </div>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        ))}
                    </tbody>
                  </table>
                  {currentExternalItems.length === 0 && (
                    <div className="text-center py-12 text-gray-500 bg-white">
                      <AlertTriangle className="w-12 h-12 mx-auto text-purple-400 mb-4" />
                      <p>No external resources found for selected filters.</p>
                    </div>
                  )}
                </div>
                <Pagination
                  currentPage={currentExternalPage}
                  totalPages={totalExternalPages}
                  onPageChange={setCurrentExternalPage}
                  itemsPerPage={externalItemsPerPage}
                  onItemsPerPageChange={setExternalItemsPerPage}
                  totalItems={externalTableItems.length}
                />
              </CardContent>
            </Card>
          )}

          {/* Interview Chart */}
          <Card className="bg-white border border-gray-300 shadow-xl">
            <CardHeader className="bg-gray-50 border-b border-gray-300">
              <CardTitle className="flex items-center gap-2 text-gray-800">
                <Sparkles className="w-5 h-5 animate-pulse" />
                <BarChart3 className="w-5 h-5" />
                Interview Outcomes by Level
              </CardTitle>
            </CardHeader>
            <CardContent className="h-[400px] p-6">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={interviewData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }} barCategoryGap={12}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                  <XAxis dataKey="level" tick={{ fill: "#4b5563", fontSize: 12, fontWeight: 600 }} />
                  <YAxis tick={{ fill: "#4b5563", fontSize: 12 }} />
                  <Tooltip content={<CustomInterviewTooltip />} />
                  <Bar dataKey="intScheduled" fill="#82ca9d" name="Scheduled" barSize={70} onClick={(e, i) => interviewData[i]?.level?.match(/L[1-3]/) && handleFilter(`${interviewData[i].level.toLowerCase()}-scheduled`)} className="cursor-pointer" />
                  <Bar dataKey="completed" fill="#ff7300" name="Completed" barSize={70} onClick={(e, i) => interviewData[i]?.level?.match(/L[1-3]/) && handleFilter(`${interviewData[i].level.toLowerCase()}-completed`)} className="cursor-pointer" />
                  <Bar dataKey="intRejected" fill="#8884d8" name="Rejected" barSize={70} onClick={(e, i) => interviewData[i]?.level?.match(/L[1-3]/) && handleFilter(`${interviewData[i].level.toLowerCase()}-rejected`)} className="cursor-pointer" />
                  <Bar dataKey="allScheduled" fill="#82ca9d" name="Scheduled" barSize={70} onClick={() => handleFilter("all-scheduled")} className="cursor-pointer" />
                  <Bar dataKey="allCompleted" fill="#ff7300" name="Completed" barSize={70} onClick={() => handleFilter("all-completed")} className="cursor-pointer" />
                  <Bar dataKey="allRejected" fill="#8884d8" name="Rejected" barSize={70} onClick={() => handleFilter("all-rejected")} className="cursor-pointer" />
                  <Bar dataKey="shared" fill="#10b981" name="Shared" barSize={70} onClick={() => handleFilter("resume-shared")} className="cursor-pointer" />
                  <Bar dataKey="rejected" fill="#ef4444" name="Rejected" barSize={70} onClick={() => handleFilter("resume-rejected")} className="cursor-pointer" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Employee & Project Bar */}
          <Card className="bg-white border border-gray-300 shadow-xl">
            <CardHeader className="bg-gray-50 border-b border-gray-300">
              <CardTitle className="flex items-center gap-2 text-gray-800">
                <Sparkles className="w-5 h-5 animate-pulse" />
                <Users className="w-5 h-5" />
                Employee, External Resources & Project Distribution
                {externalLoading && <Loader2 className="w-4 h-4 animate-spin ml-2" />}
              </CardTitle>
            </CardHeader>
            <CardContent className="h-[400px] p-6">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={[...employeeBarData, ...projectClientBarData]}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  barCategoryGap={12}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                  <XAxis dataKey="category" tick={{ fill: "#4b5563", fontSize: 12, fontWeight: 600 }} />
                  <YAxis tick={{ fill: "#4b5563", fontSize: 12 }} />
                  <Tooltip
                    content={({ active, payload, label }) => {
                      if (label === "External Resources") {
                        // Custom tooltip for External Resources
                        if (active && payload && payload.length) {
                          // Find the payload for ExternalTotal
                          const externalTotalPayload = payload.find(p => p.dataKey === "Total");
                          const totalValue = externalTotalPayload ? externalTotalPayload.value : 0;
                          return (
                            <div className="bg-white p-4 rounded-xl shadow-xl border border-blue-200">
                              <div className="flex items-center gap-2 mb-2">
                                <Users className="w-4 h-4 text-purple-600" />
                                <h3 className="font-bold text-purple-800">External Resources</h3>
                              </div>
                              <p className="flex items-center gap-2 text-sm">
                                <span className="w-3 h-3 rounded-full bg-purple-500"></span>
                                <span className="font-semibold">Total External Resources:</span>
                                <span className="font-bold">{totalValue}</span>
                              </p>
                            </div>
                          );
                        }
                        return null;
                      }
                      return label === "Employees"
                        ? <CustomEmployeeTooltip active={active} payload={payload} label={label} />
                        : <CustomProjectClientTooltip active={active} payload={payload} label={label} />
                    }}
                  />
                  {/* Bars for Employees - show all three */}
                  <Bar dataKey="Total" fill="#6366f1" barSize={60} onClick={() => handleFilter(null)} className="cursor-pointer" />
                  <Bar dataKey="Bench" fill="#f59e0b" barSize={60} onClick={() => handleFilter("bench")} className="cursor-pointer" />
                  <Bar dataKey="Allocated" fill="#10b981" barSize={60} onClick={() => handleFilter("allocated")} className="cursor-pointer" />

                  {/* Bars for Project/Client Data */}
                  <Bar dataKey="projectsCount" fill="#3b82f6" barSize={60} />
                  <Bar dataKey="clientsCount" fill="#8b5cf6" barSize={60} />
                  <Bar dataKey="todayAllocatedCount" fill="#06b6d4" barSize={60} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </>
      )}

      {/* ====================== OPPORTUNITY TAB ====================== */}
      {activeTab === "opportunity" && (
        <>
          {/* KPI Cards (unfiltered) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { title: "Total Opportunities", value: totalOpps, color: "indigo-600", icon: Target },
              { title: "Approved", value: totalApproved, color: "emerald-600", icon: CheckCircle },
              { title: "Pending", value: totalPending, color: "amber-600", icon: Clock },
              { title: "Total Resources", value: totalResources, color: "blue-600", icon: Users },
            ].map((k, i) => {
              const Icon = k.icon;
              return (
                <Card key={i} className="bg-white hover:shadow-md transition-all border border-gray-200">
                  <CardHeader className="pb-2">
                    <CardTitle className={`text-sm flex items-center gap-2 text-${k.color}`}>
                      <Icon className="w-4 h-4" />
                      {k.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className={`text-2xl font-bold text-${k.color}`}>{k.value}</div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Modal Buttons */}
          <div className="flex gap-2">
            <Button onClick={() => openOpportunityModal("Pending")} variant="outline">
              View Pending Requests
            </Button>
            <Button onClick={() => openOpportunityModal("Approved")} variant="default">
              View Approved Requests
            </Button>
          </div>

          {/* Opportunity Table */}
          <Card ref={tableRef} className="bg-white border border-gray-300 shadow-lg scroll-mt-24">
            <CardHeader className="bg-gray-50 border-b border-gray-300">
              <CardTitle className="flex items-center gap-2 text-gray-800">
                <Target className="w-5 h-5" /> Opportunity Details
                {!startDate && !endDate ? (
                  <Badge variant="secondary" className="ml-2 text-xs">All Time</Badge>
                ) : (
                  <Badge variant="outline" className="ml-2 text-xs border-blue-400 text-blue-700">
                    Filtered: {startDate || "..."} to {endDate || "..."}
                  </Badge>
                )}
                {currentTableFilter && (
                  <Badge variant="destructive" className="ml-2 text-xs">
                    {currentTableFilter === 'approved' ? 'Approved' :
                      currentTableFilter === 'pending' ? 'Pending' :
                        currentTableFilter === 'total-resources' ? 'Total Resources' :
                          currentTableFilter === 'resource-type' ? 'Resource Type' :
                            currentTableFilter === 'internal-resources' ? 'Internal Resources' :
                              currentTableFilter === 'external-resources' ? 'External Resources' :
                                currentTableFilter === 'scheduled-interviews' ? 'Scheduled Interviews' :
                                  currentTableFilter === 'cleared' ? 'Cleared' :
                                    currentTableFilter === 'rejected' ? 'Rejected' :
                                      currentTableFilter === 'assigned' ? 'Assigned' :
                                        'Filtered'}
                  </Badge>
                )}
              </CardTitle>
              <CardDescription>Click details to expand. Use chart clicks to filter.</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm bg-white">
                  <thead className="bg-gray-100 text-gray-700 border-b border-gray-300">
                    <tr>
                      <th className="p-3 text-left font-medium">Name</th>
                      <th className="p-3 text-left font-medium">Project</th>
                      <th className="p-3 text-left font-medium">Client</th>
                      <th className="p-3 text-left font-medium">Status</th>
                      <th className="p-3 text-left font-medium">Resources Req</th>
                      <th className="p-3 text-left font-medium">Resource Type</th>
                      {/* <th className="p-3 text-left font-medium">Scheduled</th> */}
                      {/* <th className="p-3 text-left font-medium">Cleared</th> */}
                      {/* <th className="p-3 text-left font-medium">Rejected</th> */}
                      {/* <th className="p-3 text-left font-medium">Assigned</th> */}
                      <th className="p-3 text-center font-medium">Details</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentOpportunityItems.map((opp) => (
                      <React.Fragment key={opp.id}>
                        <tr className="border-b border-gray-200 hover:bg-gray-50">
                          <td className="p-3 font-medium text-gray-900">{opp.name}</td>
                          <td className="p-3 text-gray-700">{opp.project}</td>
                          <td className="p-3 text-gray-700">{opp.client}</td>
                          <td className="p-3">
                            <Badge variant={opp.status === 'Approved' ? 'default' : 'secondary'} className="text-xs">
                              {opp.status}
                            </Badge>
                          </td>
                          <td className="p-3 text-gray-700">{opp.resourcesRequested}</td>

                          <td className="p-3">
                            <div className="space-y-1">
                              <div className="flex items-center gap-1">
                                <Badge variant="default" className="text-xs bg-blue-100 text-blue-800 border-blue-200">
                                  Internal: {opp.internalResources || 0}
                                </Badge>
                              </div>
                              <div className="flex items-center gap-1">
                                <Badge variant="secondary" className="text-xs bg-purple-100 text-purple-800 border-purple-200">
                                  External: {opp.externalResources || 0}
                                </Badge>
                              </div>
                            </div>
                          </td>
                          {/* <td className="p-3 text-gray-700">{opp.scheduledInterviews}</td> */}
                          {/* <td className="p-3 text-gray-700">{opp.cleared}</td> */}
                          {/* <td className="p-3 text-gray-700">{opp.rejected}</td> */}
                          {/* <td className="p-3 text-gray-700">{opp.assigned}</td> */}
                          <td className="p-3 text-center">
                            <Button variant="ghost" size="sm" onClick={() => toggleOpportunityDetails(opp.id)}>
                              <CheckCircle
                                className={`w-4 h-4 transition-transform ${expandedOpportunity === opp.id ? "rotate-90 text-green-600" : "text-gray-600"}`}
                              />
                            </Button>
                          </td>
                        </tr>
                        {expandedOpportunity === opp.id && (
                          <tr className="bg-gray-50 border-b border-gray-200">
                            <td colSpan={7} className="p-4">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 space-y-4">
                                <div>
                                  <h4 className="font-semibold text-gray-800 mb-2">Details</h4>
                                  <p><strong>Opportunity ID:</strong> {opp.id}</p>
                                  <p><strong>Submitted:</strong> {opp.submittedDate}</p>
                                  <p><strong>Status:</strong> {opp.status}</p>
                                  <p><strong>Client:</strong> {opp.client}</p>
                                  {opp.status === 'Pending' && (
                                    <p><strong>Pending Days:</strong> {getDaysPendingBadge(opp.pendingDays)}</p>
                                  )}
                                </div>
                                <div>
                                  <h4 className="font-semibold text-gray-800 mb-2">Counts</h4>
                                  <p><strong>Resources Requested:</strong> {opp.resourcesRequested}</p>
                                  <p><strong>Scheduled Interviews:</strong> {opp.scheduledInterviews}</p>
                                  <p><strong>Cleared:</strong> {opp.cleared}</p>
                                  <p><strong>Rejected:</strong> {opp.rejected}</p>
                                  <p><strong>Assigned to Project:</strong> {opp.assigned}</p>
                                </div>

                                {/* Scheduled Interviews Details Table */}
                                {/* Scheduled Interviews Details Table */}
                                {/* Interview Details Table - CHANGED: Show all interviews */}
                                {/* Interview Details Table with Pagination */}
                                {opp.allInterviews && opp.allInterviews.length > 0 && (
                                  <div className="md:col-span-2">
                                    <div className="flex items-center justify-between mb-2">
                                      <h4 className="font-semibold text-gray-800">Interview Details</h4>
                                      <span className="text-xs text-gray-500">
                                        {opp.allInterviews.length} total interviews
                                      </span>
                                    </div>

                                    {/* Calculate current page and interviews */}
                                    {(() => {
                                      const currentPage = opportunityInterviewPages[opp.id] || 1;
                                      const startIndex = (currentPage - 1) * interviewsPerPage;
                                      const endIndex = startIndex + interviewsPerPage;
                                      const currentInterviews = opp.allInterviews.slice(startIndex, endIndex);
                                      const totalPages = Math.ceil(opp.allInterviews.length / interviewsPerPage);

                                      return (
                                        <>
                                          {/* Pagination controls - TOP */}
                                          {totalPages > 1 && (
                                            <div className="flex items-center justify-between mb-3 bg-gray-50 p-2 rounded-lg">
                                              <div className="flex items-center gap-2">
                                                <span className="text-sm text-gray-600">Page {currentPage} of {totalPages}</span>
                                              </div>
                                              <div className="flex gap-1">
                                                <Button
                                                  variant="outline"
                                                  size="sm"
                                                  onClick={() => setOpportunityInterviewPages(prev => ({ ...prev, [opp.id]: Math.max(1, currentPage - 1) }))}
                                                  disabled={currentPage === 1}
                                                  className="h-7 w-7 p-0"
                                                >
                                                  <ChevronLeft className="w-3 h-3" />
                                                </Button>
                                                {[...Array(totalPages)].map((_, index) => {
                                                  const page = index + 1;
                                                  // Show only limited pages for better UI
                                                  if (
                                                    page === 1 ||
                                                    page === totalPages ||
                                                    (page >= currentPage - 1 && page <= currentPage + 1)
                                                  ) {
                                                    return (
                                                      <Button
                                                        key={page}
                                                        variant={currentPage === page ? "default" : "outline"}
                                                        size="sm"
                                                        onClick={() => setOpportunityInterviewPages(prev => ({ ...prev, [opp.id]: page }))}
                                                        className="h-7 w-7 p-0 text-xs"
                                                      >
                                                        {page}
                                                      </Button>
                                                    );
                                                  } else if (page === currentPage - 2 || page === currentPage + 2) {
                                                    return <span key={page} className="px-1 text-gray-400">...</span>;
                                                  }
                                                  return null;
                                                })}
                                                <Button
                                                  variant="outline"
                                                  size="sm"
                                                  onClick={() => setOpportunityInterviewPages(prev => ({ ...prev, [opp.id]: Math.min(totalPages, currentPage + 1) }))}
                                                  disabled={currentPage === totalPages}
                                                  className="h-7 w-7 p-0"
                                                >
                                                  <ChevronRight className="w-3 h-3" />
                                                </Button>
                                              </div>
                                              <span className="text-xs text-gray-500">
                                                Showing {startIndex + 1}-{Math.min(endIndex, opp.allInterviews.length)} of {opp.allInterviews.length}
                                              </span>
                                            </div>
                                          )}

                                          {/* Interview Table */}
                                          <div className="overflow-x-auto">
                                            <table className="w-full text-sm border border-gray-200">
                                              <thead className="bg-gray-100">
                                                <tr>
                                                  <th className="p-2 text-left font-medium border">Interview ID</th>
                                                  <th className="p-2 text-left font-medium border">Candidate</th>
                                                  <th className="p-2 text-left font-medium border">Resource ID</th>
                                                  <th className="p-2 text-left font-medium border">Resource Type</th>
                                                  <th className="p-2 text-left font-medium border">Email</th>
                                                  <th className="p-2 text-left font-medium border">Overall Status</th>
                                                  <th className="p-2 text-left font-medium border">Interview Levels</th>
                                                </tr>
                                              </thead>
                                              <tbody>
                                                {currentInterviews.map((interview, index) => {
                                                  const candidateInfo = interview.candidateInfo || {};
                                                  const resourceType = candidateInfo.resourceType;
                                                  const resourceId = resourceType === 'CANDIDATE'
                                                    ? `CAD-${candidateInfo.candidateId || 'N/A'}`
                                                    : `EMP-${candidateInfo.employeeId || 'N/A'}`;

                                                  return (
                                                    <tr key={index} className="border-b hover:bg-gray-50">
                                                      <td className="p-2 border font-mono">INT-{interview.interviewId || startIndex + index + 1}</td>
                                                      <td className="p-2 border">{candidateInfo.name || 'N/A'}</td>
                                                      <td className="p-2 border font-mono">
                                                        {resourceId}
                                                      </td>
                                                      <td className="p-2 border">
                                                        {resourceType === 'CANDIDATE' ? (
                                                          <Badge variant="secondary" className="bg-purple-100 text-purple-800 border-purple-200 text-xs">
                                                            External
                                                          </Badge>
                                                        ) : (
                                                          <Badge variant="default" className="bg-blue-100 text-blue-800 border-blue-200 text-xs">
                                                            Internal
                                                          </Badge>
                                                        )}
                                                      </td>
                                                      <td className="p-2 border">{candidateInfo.email || 'N/A'}</td>
                                                      <td className="p-2 border">
                                                        <Badge
                                                          variant={
                                                            interview.interviewOverallStatus === 'Selected' ? 'default' :
                                                              interview.interviewOverallStatus === 'Rejected' ? 'destructive' :
                                                                interview.interviewOverallStatus === 'Scheduled' ? 'outline' : 'secondary'
                                                          }
                                                          className="text-xs"
                                                        >
                                                          {interview.interviewOverallStatus || 'N/A'}
                                                        </Badge>
                                                      </td>
                                                      <td className="p-2 border">
                                                        {interview.interviewLevels && interview.interviewLevels.length > 0 ? (
                                                          <div className="space-y-1">
                                                            {interview.interviewLevels.map((level, levelIndex) => (
                                                              <div key={levelIndex} className="text-xs">
                                                                <Badge
                                                                  variant={
                                                                    level.status === 'Selected' ? 'default' :
                                                                      level.status === 'Rejected' ? 'destructive' :
                                                                        level.status === 'Scheduled' ? 'outline' : 'secondary'
                                                                  }
                                                                  className="text-xs"
                                                                >
                                                                  {level.level}: {level.status}
                                                                </Badge>
                                                                {level.interviewerName && (
                                                                  <span className="text-gray-500 ml-1">by {level.interviewerName}</span>
                                                                )}
                                                              </div>
                                                            ))}
                                                          </div>
                                                        ) : (
                                                          'No levels defined'
                                                        )}
                                                      </td>
                                                    </tr>
                                                  );
                                                })}
                                              </tbody>
                                            </table>
                                          </div>

                                          {/* Pagination controls - BOTTOM */}
                                          {totalPages > 1 && (
                                            <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-200">
                                              <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setOpportunityInterviewPages(prev => ({ ...prev, [opp.id]: Math.max(1, currentPage - 1) }))}
                                                disabled={currentPage === 1}
                                              >
                                                <ChevronLeft className="w-4 h-4 mr-1" />
                                                Previous
                                              </Button>
                                              <span className="text-sm text-gray-600">
                                                Page {currentPage} of {totalPages}
                                              </span>
                                              <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setOpportunityInterviewPages(prev => ({ ...prev, [opp.id]: Math.min(totalPages, currentPage + 1) }))}
                                                disabled={currentPage === totalPages}
                                              >
                                                Next
                                                <ChevronRight className="w-4 h-4 ml-1" />
                                              </Button>
                                            </div>
                                          )}
                                        </>
                                      );
                                    })()}
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
                {currentOpportunityItems.length === 0 && (
                  <div className="text-center py-12 text-gray-500 bg-white">
                    <AlertTriangle className="w-12 h-12 mx-auto text-orange-400 mb-4" />
                    <p>No data for selected filters.</p>
                  </div>
                )}
              </div>
              <Pagination
                currentPage={currentOpportunityPage}
                totalPages={totalOpportunityPages}
                onPageChange={setCurrentOpportunityPage}
                itemsPerPage={opportunityItemsPerPage}
                onItemsPerPageChange={setOpportunityItemsPerPage}
                totalItems={opportunityTableItems.length}
              />
            </CardContent>
          </Card>

          {/* Opportunity Bar */}
          <Card className="bg-white border border-gray-300 shadow-xl">
            <CardHeader className="bg-gray-50 border-b border-gray-300">
              <CardTitle className="flex items-center gap-2 text-gray-800">
                <Sparkles className="w-5 h-5 animate-pulse" />
                <Target className="w-5 h-5" />
                Opportunity Distribution
              </CardTitle>
            </CardHeader>
            <CardContent className="h-[400px] p-6">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={opportunityBarData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }} barCategoryGap={12}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                  <XAxis dataKey="category" tick={{ fill: "#4b5563", fontSize: 12, fontWeight: 600 }} angle={-45} textAnchor="end" height={80} />
                  <YAxis tick={{ fill: "#4b5563", fontSize: 12 }} />
                  <Tooltip content={<CustomProjectClientTooltip />} />
                  <Bar
                    dataKey="count"
                    fill="#6366f1"
                    barSize={60}
                    onClick={(e) => {
                      const key = e?.payload?.category?.toLowerCase().replace(/\s+/g, "-");
                      handleFilter(key);
                    }}
                    className="cursor-pointer"
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </>
      )}

      {/* ====================== DEMAND TAB ====================== */}
      {activeTab === "demand" && (
        <>
          {/* KPI Cards - Updated for Priority */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { title: "Total Demands", value: totalDems, color: "indigo-600", icon: Target },
              { title: "Total Requests", value: totalRequests, color: "red-600", icon: AlertTriangle },
              { title: "Total Interviews", value: totalScheduledInterviews, color: "amber-600", icon: Clock },
              { title: "Total Onboarded", value: totalOnboarded, color: "green-600", icon: Users },
            ].map((k, i) => {
              const Icon = k.icon;
              return (
                <Card key={i} className="bg-white hover:shadow-md transition-all border border-gray-200">
                  <CardHeader className="pb-2">
                    <CardTitle className={`text-sm flex items-center gap-2 text-${k.color}`}>
                      <Icon className="w-4 h-4" />
                      {k.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className={`text-2xl font-bold text-${k.color}`}>{k.value}</div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Demand Table - Updated columns with Target Fulfillment */}
          <Card ref={tableRef} className="bg-white border border-gray-300 shadow-lg scroll-mt-24">
            <CardHeader className="bg-gray-50 border-b border-gray-300">
              <CardTitle className="flex items-center gap-2 text-gray-800">
                <Target className="w-5 h-5" /> Demand Details
                {!startDate && !endDate ? (
                  <Badge variant="secondary" className="ml-2 text-xs">All Time</Badge>
                ) : (
                  <Badge variant="outline" className="ml-2 text-xs border-blue-400 text-blue-700">
                    Filtered: {startDate || "..."} to {endDate || "..."}
                  </Badge>
                )}

                <Button variant="outline"
                  size="sm"
                  onClick={handleExportDemand}
                  className="ml-auto border-green-200 text-green-600 hover:bg-green-50"
                  disabled={demandLoading || currentDemandItems.length === 0}
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <FileText className="w-4 h-4 mr-2" />
                  )}
                  Export
                </Button>

                {currentTableFilter && (
                  <Badge variant="destructive" className="ml-2 text-xs">
                    {
                      currentTableFilter === 'total-demands-requested' ? 'Total Demands Req' :
                        currentTableFilter === 'selected' ? 'Selected' :
                          currentTableFilter === 'scheduled-interviews' ? 'Scheduled Interviews' :
                            currentTableFilter === 'assigned' ? 'Assigned' :
                              currentTableFilter === 'open' ? 'Open' :
                                currentTableFilter === 'completed' ? 'Completed' :
                                  currentTableFilter === 'inprogress' ? 'InProgress' :
                                    currentTableFilter === 'canceled' ? 'Canceled' :
                                      currentTableFilter === 'on-hold' ? 'On Hold' :
                                        'Filtered'}
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm bg-white">
                  <thead className="bg-gray-100 text-gray-700 border-b border-gray-300">
                    <tr>
                      <th className="p-3 text-left font-medium">Name</th>
                      <th className="p-3 text-left font-medium">Project</th>
                      <th className="p-3 text-left font-medium">Client</th>
                      {/* <th className="p-3 text-left font-medium">Priority</th> */}
                      <th className="p-3 text-left font-medium">Overall Status</th>
                      <th className="p-3 text-left font-medium">Demands Req</th>
                      <th className="p-3 text-left font-medium">Resource Type</th>
                      {/* <th className="p-3 text-left font-medium">Scheduled</th> */}
                      {/* <th className="p-3 text-left font-medium">Allocated</th> */}
                      {/* <th className="p-3 text-left font-medium">Onboarded</th> */}
                      <th className="p-3 text-center font-medium">Details</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentDemandItems.map((dem) => (
                      <React.Fragment key={dem.id}>
                        <tr className="border-b border-gray-200 hover:bg-gray-50">

                          <td className="p-3 font-medium text-gray-900">{dem.name}</td>
                          <td className="p-3 text-gray-700">{dem.project}</td>
                          <td className="p-3 text-gray-700">{dem.client}</td>
                          {/* <td className="p-3">
                            <Badge
                              variant={
                                dem.priority === 'High' ? 'destructive' :
                                  dem.priority === 'Medium' ? 'secondary' :
                                    'default'
                              }
                              className="text-xs"
                            >
                              {dem.priority}
                            </Badge>
                          </td> */}
                         <td className="p-3">
  <Badge
    className="text-xs"
    style={{
      backgroundColor: 
        (dem.overallStatus || "").toLowerCase().includes("hold") ? "rgba(139, 92, 246, 0.1)" : // Purple for On Hold
        dem.overallStatus === 'Completed' ? "rgba(16, 185, 129, 0.1)" : // Green for Completed
        dem.overallStatus === 'InProgress' ? "rgba(245, 158, 11, 0.1)" : // Yellow/Orange for InProgress
        dem.overallStatus === 'Open' ? "rgba(59, 130, 246, 0.1)" : // Blue for Open
        dem.overallStatus === 'Canceled' ? "rgba(239, 68, 68, 0.1)" : // Red for Canceled
        dem.overallStatus === 'Rejected' ? "rgba(239, 68, 68, 0.1)" : // Red for Rejected
        "rgba(156, 163, 175, 0.1)", // Gray for others
      color: 
        (dem.overallStatus || "").toLowerCase().includes("hold") ? "#8b5cf6" : // Purple text
        dem.overallStatus === 'Completed' ? "#10b981" : // Green text
        dem.overallStatus === 'InProgress' ? "#f59e0b" : // Orange text
        dem.overallStatus === 'Open' ? "#3b82f6" : // Blue text
        dem.overallStatus === 'Canceled' ? "#ef4444" : // Red text
        dem.overallStatus === 'Rejected' ? "#ef4444" : // Red text
        "#6b7280", // Gray text
      borderColor:
        (dem.overallStatus || "").toLowerCase().includes("hold") ? "#8b5cf6" :
        dem.overallStatus === 'Completed' ? "#10b981" :
        dem.overallStatus === 'InProgress' ? "#f59e0b" :
        dem.overallStatus === 'Open' ? "#3b82f6" :
        dem.overallStatus === 'Canceled' ? "#ef4444" :
        dem.overallStatus === 'Rejected' ? "#ef4444" :
        "#9ca3af",
      borderWidth: "1px",
      borderStyle: "solid"
    }}
  >
    {(dem.overallStatus || "").toLowerCase().includes("hold") ? "On Hold" : dem.overallStatus}
  </Badge>
</td>
                          <td className="p-3 text-gray-700">{dem.demandsRequested}</td>
                          {/* Add Resource Type cell */}
                          <td className="p-3">
                            <div className="space-y-1">
                              <div className="flex items-center gap-1">
                                <Badge variant="default" className="text-xs bg-blue-100 text-blue-800 border-blue-200">
                                  Internal: {dem.internalResources || 0}
                                </Badge>
                              </div>
                              <div className="flex items-center gap-1">
                                <Badge variant="secondary" className="text-xs bg-purple-100 text-purple-800 border-purple-200">
                                  External: {dem.externalResources || 0}
                                </Badge>
                              </div>
                            </div>
                          </td>
                          {/* <td className="p-3 text-gray-700">{dem.scheduledInterviews}</td> */}
                          {/* <td className="p-3 text-gray-700">{dem.assigned}</td> */}
                          {/* <td className="p-3 text-gray-700">{dem.onboarded}</td> */}
                          <td className="p-3 text-center">
                            <Button variant="ghost" size="sm" onClick={() => toggleDemandDetails(dem.id)}>
                              <CheckCircle
                                className={`w-4 h-4 transition-transform ${expandedDemand === dem.id ? "rotate-90 text-green-600" : "text-gray-600"}`}
                              />
                            </Button>
                          </td>
                        </tr>
                        {expandedDemand === dem.id && (
                          <tr className="bg-gray-50 border-b border-gray-200">
                            <td colSpan={8} className="p-4">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                  <h4 className="font-semibold text-gray-800 mb-2">Details</h4>
                                  <p><strong>Demand ID:</strong> {dem.id}</p>
                                  <p><strong>Submitted:</strong> {dem.submittedDate}</p>
                                  <p><strong>Priority:</strong> {dem.priority}</p>
                                  <p><strong>Client:</strong> {dem.client}</p>
                                  <p><strong>Overall Status:</strong> {dem.overallStatus}</p>
                                  <p><strong>Pending Days:</strong> {getDaysPendingBadge(dem.pendingDays)}</p>
                                  <p><strong>Target Headcount:</strong> {dem.demandsRequested}</p>
                                  <p><strong>Submitted Profiles:</strong> {dem.submittedProfilesCount || 0}</p>
                                  <p><strong>Description:</strong> {dem.description}</p>
                                  <p><strong>Demand Opened:</strong> {dem.demandOpenDt}</p>
                                  <p><strong>Target Fulfillment:</strong> {dem.fulfilmentDt}</p>
                                  <p><strong>Demand Fulfillment:</strong> {dem.actualFulfilmentDt}</p>
                                </div>
                                <div>
                                  <h4 className="font-semibold text-gray-800 mb-2">Status Summary</h4>
                                  <ul className="space-y-1 text-sm">
                                    <li className="flex justify-between">
                                      <span>Total Requests:</span>
                                      <span className="font-medium">{dem.statusSummary?.totalRequests || 0}</span>
                                    </li>
                                    <li className="flex justify-between">
                                      <span>Total Interviews:</span>
                                      <span className="font-medium">{dem.statusSummary?.totalInterviews || 0}</span>
                                    </li>
                                    <li className="flex justify-between">
                                      <span>Resume Status:</span>
                                      <span className="font-medium">{dem.statusSummary?.resumeShareStatus || 0}</span>
                                    </li>
                                    <li className="flex justify-between">
                                      <span>Selected:</span>
                                      <span className="font-medium">{dem.statusSummary?.selected || 0}</span>
                                    </li>
                                    <li className="flex justify-between">
                                      <span>Rejected:</span>
                                      <span className="font-medium">{dem.statusSummary?.rejected || 0}</span>
                                    </li>
                                    <li className="flex justify-between">
                                      <span>Onboarded:</span>
                                      <span className="font-medium">{dem.statusSummary?.onboarded || 0}</span>
                                    </li>
                                    <li className="flex justify-between">
                                      <span>Allocated:</span>
                                      <span className="font-medium">{dem.statusSummary?.allocated || 0}</span>
                                    </li>

                                  </ul>
                                </div>

                                {/* Request Summary */}
                                {dem.childRequestDetails?.length > 0 && (
                                  <div className="md:col-span-2">
                                    <h4 className="font-semibold text-gray-800 mb-2">Request Summary</h4>
                                    <div className="overflow-x-auto">
                                      <table className="w-full text-sm border border-gray-200">
                                        <thead className="bg-gray-100">
                                          <tr>
                                            <th className="p-2 text-left font-medium border">Request ID</th>
                                            <th className="p-2 text-left font-medium border">Status</th>
                                            <th className="p-2 text-left font-medium border">Pending Days</th>
                                          </tr>
                                        </thead>
                                        <tbody>
                                          {dem.childRequestDetails.map((req, i) => (
                                            <tr key={i} className="border-b hover:bg-gray-50">
                                              <td className="p-2 border font-mono">REQ-{req.requestId}</td>
                                              <td className="p-2 border">
                                                <Badge
                                                  variant={
                                                    req.requestStatus === 'Approved' ? 'default' :
                                                      req.requestStatus === 'Rejected' ? 'destructive' : 'secondary'
                                                  }
                                                  className="text-xs"
                                                >
                                                  {req.requestStatus}
                                                </Badge>
                                              </td>
                                              <td className="p-2 border">{getDaysPendingBadge(dem.pendingDays)}</td>
                                            </tr>
                                          ))}
                                        </tbody>
                                      </table>
                                    </div>
                                  </div>
                                )}

                               
                                {/* Interview Details Table with Pagination */}
                                {(() => {
                                  // Get all interviews from all child requests
                                  const allInterviews = dem.childRequestDetails?.flatMap((req, reqIndex) =>
                                    req.pipeline?.map((interview, interviewIndex) => ({
                                      ...interview,
                                      requestId: req.requestId,
                                      reqIndex,
                                      interviewIndex
                                    })) || []
                                  ) || [];

                                  if (allInterviews.length === 0) return null;

                                  const currentPage = demandInterviewPages[dem.id] || 1;
                                  const startIndex = (currentPage - 1) * interviewsPerPage;
                                  const endIndex = startIndex + interviewsPerPage;
                                  const currentInterviews = allInterviews.slice(startIndex, endIndex);
                                  const totalPages = Math.ceil(allInterviews.length / interviewsPerPage);

                                  return (
                                    <div className="md:col-span-2">
                                      <div className="flex items-center justify-between mb-2">
                                        <h4 className="font-semibold text-gray-800">Interview Details</h4>
                                        <span className="text-xs text-gray-500">
                                          {allInterviews.length} total interviews
                                        </span>
                                      </div>

                                      {/* Pagination controls - TOP */}
                                      {totalPages > 1 && (
                                        <div className="flex items-center justify-between mb-3 bg-gray-50 p-2 rounded-lg">
                                          <div className="flex items-center gap-2">
                                            <span className="text-sm text-gray-600">Page {currentPage} of {totalPages}</span>
                                          </div>
                                          <div className="flex gap-1">
                                            <Button
                                              variant="outline"
                                              size="sm"
                                              onClick={() => setDemandInterviewPages(prev => ({ ...prev, [dem.id]: Math.max(1, currentPage - 1) }))}
                                              disabled={currentPage === 1}
                                              className="h-7 w-7 p-0"
                                            >
                                              <ChevronLeft className="w-3 h-3" />
                                            </Button>
                                            {[...Array(totalPages)].map((_, index) => {
                                              const page = index + 1;
                                              // Show only limited pages for better UI
                                              if (
                                                page === 1 ||
                                                page === totalPages ||
                                                (page >= currentPage - 1 && page <= currentPage + 1)
                                              ) {
                                                return (
                                                  <Button
                                                    key={page}
                                                    variant={currentPage === page ? "default" : "outline"}
                                                    size="sm"
                                                    onClick={() => setDemandInterviewPages(prev => ({ ...prev, [dem.id]: page }))}
                                                    className="h-7 w-7 p-0 text-xs"
                                                  >
                                                    {page}
                                                  </Button>
                                                );
                                              } else if (page === currentPage - 2 || page === currentPage + 2) {
                                                return <span key={page} className="px-1 text-gray-400">...</span>;
                                              }
                                              return null;
                                            })}
                                            <Button
                                              variant="outline"
                                              size="sm"
                                              onClick={() => setDemandInterviewPages(prev => ({ ...prev, [dem.id]: Math.min(totalPages, currentPage + 1) }))}
                                              disabled={currentPage === totalPages}
                                              className="h-7 w-7 p-0"
                                            >
                                              <ChevronRight className="w-3 h-3" />
                                            </Button>
                                          </div>
                                          <span className="text-xs text-gray-500">
                                            Showing {startIndex + 1}-{Math.min(endIndex, allInterviews.length)} of {allInterviews.length}
                                          </span>
                                        </div>
                                      )}

                                      {/* Interview Table */}
                                      <div className="overflow-x-auto">
                                        <table className="w-full text-sm border border-gray-200">
                                          <thead className="bg-gray-100">
                                            <tr>
                                              <th className="p-2 text-left font-medium border">Interview ID</th>
                                              <th className="p-2 text-left font-medium border">Candidate</th>
                                              <th className="p-2 text-left font-medium border">Resource ID</th>
                                              <th className="p-2 text-left font-medium border">Resource Type</th>
                                              <th className="p-2 text-left font-medium border">Email</th>
                                              <th className="p-2 text-left font-medium border">Overall Status</th>
                                              <th className="p-2 text-left font-medium border">Interview Levels</th>
                                            </tr>
                                          </thead>
                                          <tbody>
                                            {currentInterviews.map((interview, index) => {
                                              const candidateInfo = interview.candidateInfo || {};
                                              const resourceType = candidateInfo.resourceType;
                                              const resourceId = resourceType === 'CANDIDATE'
                                                ? `CAD-${candidateInfo.candidateId || 'N/A'}`
                                                : `EMP-${candidateInfo.employeeId || 'N/A'}`;

                                              return (
                                                <tr key={`${interview.reqIndex}-${interview.interviewIndex}`} className="border-b hover:bg-gray-50">
                                                  <td className="p-2 border font-mono">INT-{interview.interviewId || startIndex + index + 1}</td>
                                                  <td className="p-2 border">{candidateInfo.name || 'N/A'}</td>
                                                  <td className="p-2 border font-mono">
                                                    {resourceId}
                                                  </td>
                                                  <td className="p-2 border">
                                                    {resourceType === 'CANDIDATE' ? (
                                                      <Badge variant="secondary" className="bg-purple-100 text-purple-800 border-purple-200 text-xs">
                                                        External
                                                      </Badge>
                                                    ) : (
                                                      <Badge variant="default" className="bg-blue-100 text-blue-800 border-blue-200 text-xs">
                                                        Internal
                                                      </Badge>
                                                    )}
                                                  </td>
                                                  <td className="p-2 border">{candidateInfo.email || 'N/A'}</td>
                                                  <td className="p-2 border">
                                                    <Badge
                                                      variant={
                                                        interview.interviewOverallStatus === 'Selected' ? 'default' :
                                                          interview.interviewOverallStatus === 'Rejected' ? 'destructive' :
                                                            interview.interviewOverallStatus === 'Scheduled' ? 'outline' : 'secondary'
                                                      }
                                                      className="text-xs"
                                                    >
                                                      {interview.interviewOverallStatus || 'N/A'}
                                                    </Badge>
                                                  </td>
                                                  <td className="p-2 border">
                                                    {interview.interviewLevels && interview.interviewLevels.length > 0 ? (
                                                      <div className="space-y-1">
                                                        {interview.interviewLevels.map((level, levelIndex) => (
                                                          <div key={levelIndex} className="text-xs">
                                                            <Badge
                                                              variant={
                                                                level.status === 'Selected' ? 'default' :
                                                                  level.status === 'Rejected' ? 'destructive' :
                                                                    level.status === 'Scheduled' ? 'outline' : 'secondary'
                                                              }
                                                              className="text-xs"
                                                            >
                                                              {level.level}: {level.status}
                                                            </Badge>
                                                            {level.interviewerName && (
                                                              <span className="text-gray-500 ml-1">by {level.interviewerName}</span>
                                                            )}
                                                          </div>
                                                        ))}
                                                      </div>
                                                    ) : (
                                                      'No levels defined'
                                                    )}
                                                  </td>
                                                </tr>
                                              );
                                            })}
                                          </tbody>
                                        </table>
                                      </div>

                                      {/* Pagination controls - BOTTOM */}
                                      {totalPages > 1 && (
                                        <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-200">
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setDemandInterviewPages(prev => ({ ...prev, [dem.id]: Math.max(1, currentPage - 1) }))}
                                            disabled={currentPage === 1}
                                          >
                                            <ChevronLeft className="w-4 h-4 mr-1" />
                                            Previous
                                          </Button>
                                          <span className="text-sm text-gray-600">
                                            Page {currentPage} of {totalPages}
                                          </span>
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setDemandInterviewPages(prev => ({ ...prev, [dem.id]: Math.min(totalPages, currentPage + 1) }))}
                                            disabled={currentPage === totalPages}
                                          >
                                            Next
                                            <ChevronRight className="w-4 h-4 ml-1" />
                                          </Button>
                                        </div>
                                      )}
                                    </div>
                                  );
                                })()}
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
                {currentDemandItems.length === 0 && (
                  <div className="text-center py-12 text-gray-500 bg-white">
                    <AlertTriangle className="w-12 h-12 mx-auto text-orange-400 mb-4" />
                    <p>No data for selected filters.</p>
                  </div>
                )}
              </div>
              <Pagination
                currentPage={currentDemandPage}
                totalPages={totalDemandPages}
                onPageChange={setCurrentDemandPage}
                itemsPerPage={demandItemsPerPage}
                onItemsPerPageChange={setDemandItemsPerPage}
                totalItems={demandTableItems.length}
              />
            </CardContent>
          </Card>

          {/* Demand Bar – Updated with filtered data */}
          <Card className="bg-white border border-gray-300 shadow-xl">
            <CardHeader className="bg-gray-50 border-b border-gray-300">
              <CardTitle className="flex items-center gap-2 text-gray-800">
                <Sparkles className="w-5 h-5 animate-pulse" />
                <Target className="w-5 h-5" />
                Demand Distribution
              </CardTitle>
            </CardHeader>
            <CardContent className="h-[400px] p-6">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={demandBarData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }} barCategoryGap={12}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                  <XAxis dataKey="category" tick={{ fill: "#4b5563", fontSize: 12, fontWeight: 600 }} angle={-45} textAnchor="end" height={80} />
                  <YAxis tick={{ fill: "#4b5563", fontSize: 12 }} />
                  <Tooltip content={<CustomDemandTooltip />} />
                  <Bar
                    dataKey="count"
                    fill={(data) => {
                      switch (data.category) {
                        case "High Priority": return "#ef4444";
                        case "Medium Priority": return "#f59e0b";
                        case "Low Priority": return "#10b981";
                        case "Request Resources": return "#dc2626";
                        case "Resource Type": return "#6366f1";
                        case "Internal Resources": return "#3b82f6";
                        case "External Resources": return "#8b5cf6";
                        case "Selected": return "#10b981";
                        case "Scheduled Interviews": return "#3b82f6";
                        case "Allocated": return "#8b5cf6";
                        case "Onboarded": return "#06b6d4";
                        default: return "#6366f1";
                      }
                    }}
                    barSize={60}
                    onClick={(e) => {
                      const key = e?.payload?.category?.toLowerCase().replace(/\s+/g, "-");
                      handleFilter(key);
                    }}
                    className="cursor-pointer"
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Overall Status Bar Chart */}
          <Card className="bg-white border border-gray-300 shadow-xl">
            <CardHeader className="bg-gray-50 border-b border-gray-300">
              <CardTitle className="flex items-center gap-2 text-gray-800">
                <Sparkles className="w-5 h-5 animate-pulse" />
                <Activity className="w-5 h-5" />
                Overall Status Distribution
              </CardTitle>
            </CardHeader>
            <CardContent className="h-[400px] p-6">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={overallStatusBarData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }} barCategoryGap={12}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                  <XAxis dataKey="category" tick={{ fill: "#4b5563", fontSize: 12, fontWeight: 600 }} />
                  <YAxis tick={{ fill: "#4b5563", fontSize: 12 }} />
                  <Tooltip content={<CustomOverallStatusTooltip />} />
                  <Bar
                    dataKey="count"
                    fill={(data) => {
                      switch (data.category) {
                        case "Open": return "#3b82f6";
                        case "Completed": return "#10b981";
                        case "InProgress": return "#f59e0b";
                        case "Rejected": return "#dc2626";
                        case "On Hold": return "#8b5cf6";
                        default: return "#6366f1";
                      }
                    }}
                    barSize={60}
                    onClick={(e) => {
                      const key = e?.payload?.category?.toLowerCase().replace(/\s+/g, "-");
                      handleFilter(key);
                    }}
                    className="cursor-pointer"
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </>
      )}

      {/* ====================== EMAIL MODAL ====================== */}
      {isEmailModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
          <div
            className="absolute inset-0 bg-gray-900/20 backdrop-blur-sm transition-opacity duration-300"
            onClick={() => setIsEmailModalOpen(false)}
          />

          <div className="relative bg-white w-full max-w-[500px] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">

            {/* Modal Header */}
            <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center bg-white sticky top-0 z-10">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Share Demand Report</h3>
                <p className="text-xs text-gray-500 mt-0.5">Send via email</p>
              </div>
              <button
                onClick={() => setIsEmailModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 hover:bg-gray-50 p-2 rounded-full transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6 overflow-y-auto custom-scrollbar">

              {/* To Address */}
              <div className="relative">
                <EmailChipInput
                  label="Recipients"
                  emails={toEmail}
                  setEmails={setToEmails}
                  placeholder="Add people..."
                  autoFocus={true}
                  rightLabelAction={
                    !showCc && (
                      <button
                        onClick={() => setShowCc(true)}
                        className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 px-2 py-1 rounded transition-colors"
                      >
                        + CC
                      </button>
                    )
                  }
                />
                {toEmail.length > 0 && (
                  <div className="flex items-center gap-1.5 mt-2 ml-1">
                    <History className="w-3 h-3 text-gray-400" />
                    <span className="text-[10px] text-gray-400 font-medium uppercase tracking-wide">Loaded from recent contacts</span>
                  </div>
                )}
              </div>

              {/* CC Address */}
              {showCc && (
                <div className="animate-in slide-in-from-top-2 fade-in duration-200">
                  <EmailChipInput
                    label="CC"
                    emails={ccEmail}
                    setEmails={setCcEmails}
                    placeholder="Add CC..."
                    rightLabelAction={
                      <button onClick={() => setShowCc(false)} className="text-xs text-gray-400 hover:text-gray-600">Remove</button>
                    }
                  />
                </div>
              )}

              {/* Report Information Card */}
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 flex items-center gap-4 group hover:border-indigo-200 transition-colors cursor-default">
                <div className="w-10 h-10 bg-white rounded-lg border border-gray-200 flex items-center justify-center shadow-sm">
                  <FileText className="w-5 h-5 text-red-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-semibold text-gray-900 truncate">Demand_Report_{startDate || 'All'}_to_{endDate || 'All'}.pdf</h4>
                  <p className="text-xs text-gray-500 mt-0.5">Generated Report • PDF</p>
                </div>
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              </div>

            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-gray-100 bg-gray-50/50 flex justify-between items-center">
              <p className="text-xs text-gray-500 font-medium">
                {toEmail.length + ccEmail.length} recipient(s)
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setIsEmailModalOpen(false)}
                  className="h-10 px-4 rounded-xl border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 font-medium text-sm transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSendEmail}
                  disabled={isSending || toEmail.length === 0}
                  className="h-10 px-5 rounded-xl bg-orange-500 text-white hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-sm flex items-center gap-2 shadow-sm transition-all active:scale-95"
                >
                  {isSending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Sending...</span>
                    </>
                  ) : (
                    <>
                      <span>Send Email</span>
                      <Send className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Rest of the modals and dialogs */}
      <Dialog open={isSkillMatcherModalOpen} onOpenChange={setIsSkillMatcherModalOpen}>
        <DialogContent className="max-w-2xl w-[95vw] max-h-[90vh] flex flex-col p-0 overflow-hidden">
          <DialogHeader className="p-6 pb-4 border-b">
            <DialogTitle>{modalTitle}</DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto p-6">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-100 border-b">
                  <tr>
                    {modalMode === "group" ? (
                      <>
                        <th className="p-3 text-left">Opportunity</th>
                        <th className="p-3 text-left">Matched Employees</th>
                      </>
                    ) : (
                      <>
                        <th className="p-3 text-left">Match Description</th>
                        <th className="p-3 text-left">Status</th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {modalMode === "group" ? (
                    modalData.map((opp) => (
                      <tr key={opp.opportunity_id}>
                        <td className="p-3 font-medium">
                          {opp.opportunity_name} (OPP-ID: {opp.opportunity_id})
                        </td>
                        <td className="p-3">
                          <div className="flex flex-wrap gap-1">
                            {opp["Matched Employees"].map((emp) => (
                              <Badge key={emp.employee_id} variant="outline" className="text-xs">
                                {emp.name} (EMP-{emp.employee_id})
                              </Badge>
                            ))}
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    modalData.map((status, idx) => {
                      const match = status.match(/^(\d+%)\s+(matched|partially matched|unmatched)\s+with\s+(.*)$/);
                      if (!match) return null;
                      const [, pct, type, opp] = match;
                      let badgeClr = "";
                      switch (type) {
                        case "matched": badgeClr = "bg-green-100 text-green-800"; break;
                        case "partially matched": badgeClr = "bg-yellow-100 text-yellow-800"; break;
                        case "unmatched": badgeClr = "bg-red-100 text-red-800"; break;
                      }
                      return (
                        <tr key={idx}>
                          <td className="p-3 font-medium max-w-[300px] truncate" title={opp}>{opp}</td>
                          <td className="p-3">
                            <Badge className={`${badgeClr} font-semibold`}>{pct} {type}</Badge>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
            {modalData.length === 0 && (
              <p className="text-center text-gray-500 mt-4">No matches available.</p>
            )}
          </div>
          <DialogFooter className="sticky bottom-0 bg-white p-4 border-t flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsSkillMatcherModalOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Group ID Multi-Select Dialog */}
      <Dialog open={isGroupIdDialogOpen} onOpenChange={setIsGroupIdDialogOpen}>
        <DialogContent
          className="w-full max-w-3xl mx-4 sm:mx-8 md:mx-auto max-h-[90vh] flex flex-col p-0 overflow-hidden rounded-lg shadow-xl">
          {/* Header */}
          <DialogHeader className="px-6 pt-6 pb-4 border-b bg-white">
            <DialogTitle className="text-xl font-semibold text-gray-900">
              Select Resource Groups
            </DialogTitle>
            <DialogDescription className="text-sm text-gray-600 mt-1">
              Choose one or more groups to analyze with AI.
            </DialogDescription>
          </DialogHeader>

          {/* Scrollable Group List */}
          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-1.5 min-h-0">
            {groups.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <div className="inline-flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-300 border-t-indigo-600"></div>
                  <span className="text-sm">Loading groups...</span>
                </div>
              </div>
            ) : (
              <div className="space-y-1">
                {groups.map((group) => (
                  <label
                    key={group.groupId}
                    htmlFor={`group-${group.groupId}`}
                    className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:bg-indigo-50/70 hover:border-indigo-300 transition-all cursor-pointer group">
                    <Checkbox
                      id={`group-${group.groupId}`}
                      checked={selectedGroupIds.includes(group.groupId)}
                      onCheckedChange={(checked) => {
                        setSelectedGroupIds((prev) =>
                          checked
                            ? [...prev, group.groupId]
                            : prev.filter((id) => id !== group.groupId)
                        );
                      }}
                      className="data-[state=checked]:bg-indigo-600 data-[state=checked]:border-indigo-600"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {group.title}
                      </p>
                      <p className="text-xs text-gray-500 font-mono mt-0.5">
                        OPP-ID: {group.groupId}
                      </p>
                    </div>
                    {selectedGroupIds.includes(group.groupId) && (
                      <div className="ml-auto">
                        <div className="h-2 w-2 rounded-full bg-indigo-600"></div>
                      </div>
                    )}
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <DialogFooter className="px-6 py-4 border-t bg-gray-50/90 backdrop-blur-sm">
            <Button
              variant="outline"
              onClick={() => setIsGroupIdDialogOpen(false)}
              className="min-w-[90px]"
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (selectedGroupIds.length === 0) {
                  toast.error("Please select at least one group.");
                  return;
                }
                setIsGroupIdDialogOpen(false);
                handleGroupSkillMatcher(selectedGroupIds);
              }}
              disabled={selectedGroupIds.length === 0}
              className="bg-gradient-to-r from-indigo-500 to-indigo-500 text-white hover:from-indigo-600 hover:to-teal-600"
            >
              <Sparkles className="w-4 h-4 mr-2" />Analyse Selected
              {selectedGroupIds.length > 0 && (
                <span className="ml-1.5">({selectedGroupIds.length})</span>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Opportunity Details Modal */}
      <Dialog open={isOpportunityModalOpen} onOpenChange={setIsOpportunityModalOpen}>
        <DialogContent className="max-w-4xl w-[95vw] max-h-[90vh] flex flex-col p-0 overflow-hidden">
          <DialogHeader className="p-6 pb-4 border-b bg-white">
            <DialogTitle className="flex items-center gap-2">
              {opportunityType === 'Approved' ? (
                <CheckCircle className="w-5 h-5 text-green-600" />
              ) : (
                <Clock className="w-5 h-5 text-amber-600" />
              )}
              {opportunityType} Opportunities ({opportunityRequests.length})
            </DialogTitle>
            <DialogDescription>
              {opportunityType === 'Approved'
                ? 'All approved resource requests.'
                : 'Requests waiting for approval.'}
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto p-6">
            {opportunityRequests.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="p-3 text-left">Opportunity ID</th>
                      <th className="p-3 text-left">Request ID</th>

                      <th className="p-3 text-left">Project</th>
                      <th className="p-3 text-left">Client</th>
                      {opportunityType === 'Approved' && (
                        <>
                          <th className="p-3 text-left">Submitted</th>
                          <th className="p-3 text-left">Skills</th>
                        </>
                      )}
                      {opportunityType === 'Pending' && (
                        <>
                          <th className="p-3 text-left">Submitted</th>
                          <th className="p-3 text-left">Waiting for approval</th>
                        </>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {opportunityRequests.map((req) => (
                      <tr key={req.requestId} className="border-b hover:bg-gray-50">
                        <td className="p-3 font-mono text-xm">{req.groupId ?? '-'}</td>
                        <td className="p-3 font-mono text-xm">
                          {req.requestId ? `REQ-${req.requestId}` : 'Pending Assignment'}
                        </td>

                        <td className="p-3">{req.projectName ?? '-'}</td>
                        <td className="p-3 text-gray-600">{req.accountName ?? '-'}</td>

                        {opportunityType === 'Approved' && (
                          <>
                            <td className="p-3 text-xs">{req.submittedDate ?? '-'}</td>
                            <td className="p-3">
                              <div className="flex flex-wrap gap-1">
                                {(req.skills || []).slice(0, 3).map((s, i) => (
                                  <Badge key={i} variant="outline" className="text-xs">
                                    {s}
                                  </Badge>
                                ))}
                                {req.skills?.length > 3 && (
                                  <Badge variant="secondary" className="text-xs">
                                    +{req.skills.length - 3}
                                  </Badge>
                                )}
                              </div>
                            </td>
                          </>
                        )}

                        {opportunityType === 'Pending' && (
                          <>
                            <td className="p-3 text-xs">{req.submittedDate ?? '-'}</td>
                            <td className="p-3">{getDaysPendingBadge(req.daysPending)}</td>
                          </>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-center text-gray-500 py-8">
                No {opportunityType.toLowerCase()} requests.
              </p>
            )}
          </div>

          <DialogFooter className="p-4 border-t bg-gray-50">
            <Button variant="outline" onClick={() => setIsOpportunityModalOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
export default PortfolioManagerDashboard;
