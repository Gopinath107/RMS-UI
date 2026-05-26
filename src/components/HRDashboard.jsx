import React, { useState, useEffect, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "./ui/alert-dialog";
import {
  Users,
  Clock,
  CheckCircle,
  XCircle,
  UserCheck,
  Target,
  FileCheck,
  Building,
  Home,
  Monitor,
  Briefcase,
  DollarSign,
  MapPin,
  Bot,
  User,
  Loader,
  MessageCircle,
  Send,
  RefreshCw,
  Plus,
  X,
  Search,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Edit,
  ChevronDown,
  ChevronUp,
  Mail,
  ExternalLink,
  Calendar,
  FileText
} from "lucide-react";
import { Input } from "./ui/input";
import { SearchableSelect } from "./ui/select";
import { format } from "date-fns";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "./ui/tabs";
import { toast } from "sonner";
import { ResourceRequestService } from "../services/RequestResourceService";
import { OpportunityService } from "../services/OpportunityService";
import { ChatService } from "../services/AI/ChatbotService";
import { DemandService } from "../services/DemandService";
import { SkillService } from "../services/SkillsService";

const normalizeOptionName = (value) =>
  String(value || '').trim().replace(/\s+/g, ' ').toLowerCase();

// Search Filter Component — Premium glass style
const SearchFilter = ({ value, onChange, placeholder = "Search..." }) => (
  <div className="relative w-full max-w-md group">
    <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-500/10 to-indigo-500/10 opacity-0 group-focus-within:opacity-100 transition-all duration-300 blur-sm" />
    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 w-4 h-4 transition-colors duration-200" />
    <Input
      type="text"
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="relative pl-10 pr-4 py-2.5 w-full bg-white/80 backdrop-blur-sm border border-gray-200 rounded-xl shadow-sm focus:ring-2 focus:ring-blue-400/50 focus:border-blue-400 focus:bg-white transition-all duration-200 text-sm placeholder:text-gray-400"
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

// Pagination Component — Premium pill style
const Pagination = ({ currentPage, totalPages, onPageChange, itemsPerPage, onItemsPerPageChange, totalItems, label = "requests" }) => {
  const itemsPerPageOptions = [5, 10, 20, 50];
  const start = Math.min(((currentPage - 1) * itemsPerPage) + 1, totalItems);
  const end = Math.min(currentPage * itemsPerPage, totalItems);

  return (
    <div className="flex flex-col sm:flex-row justify-between items-center gap-3 py-3">
      <div className="flex items-center gap-3">
        <span className="text-xs text-gray-500 font-medium">
          Showing <span className="text-gray-700 font-bold">{start}–{end}</span> of <span className="text-gray-700 font-bold">{totalItems}</span> {label}
        </span>
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-gray-400">Per page:</span>
          <select
            value={itemsPerPage}
            onChange={(e) => onItemsPerPageChange(Number(e.target.value))}
            className="px-2 py-1 bg-white border border-gray-200 rounded-lg text-xs font-medium text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-400/50 shadow-sm cursor-pointer"
          >
            {itemsPerPageOptions.map(option => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 hover:border-gray-300 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-150 shadow-sm"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
          Prev
        </button>

        <div className="flex items-center gap-1 mx-1">
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            let pageNum;
            if (totalPages <= 5) pageNum = i + 1;
            else if (currentPage <= 3) pageNum = i + 1;
            else if (currentPage >= totalPages - 2) pageNum = totalPages - 4 + i;
            else pageNum = currentPage - 2 + i;

            const isActive = currentPage === pageNum;
            return (
              <button
                key={pageNum}
                onClick={() => onPageChange(pageNum)}
                className={`w-8 h-8 rounded-lg text-xs font-bold transition-all duration-200 ${
                  isActive
                    ? 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-md shadow-blue-200'
                    : 'bg-white border border-gray-200 text-gray-600 hover:border-blue-300 hover:text-blue-600'
                }`}
              >
                {pageNum}
              </button>
            );
          })}
        </div>

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 hover:border-gray-300 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-150 shadow-sm"
        >
          Next
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};

// Resource Group Card Component
const ResourceGroupCard = ({
  group,
  type, // "demand" or "opportunity"
  isExpanded,
  onToggle,
  selectedRequests,
  toggleSelection,
  handleViewRequest,
  handleApproveRequest,
  handleRejectRequest,
  getStatusColor,
  getPriorityColor,
  getWorkModeIcon
}) => {
  const allSelected = group.requests.every(req =>
    selectedRequests.includes(req.numericId)
  );
  const allActionable = group.requests.every(req =>
    req.status === "Submitted"
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="bg-white/90 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300 border-2 border-blue-100">
        <CardContent className="p-6">
          {/* Group Header */}
          <div className="flex items-start mb-4">
            {/* Select All for Group */}
            {allActionable && (
              <input
                type="checkbox"
                checked={allSelected}
                onChange={(e) => {
                  e.stopPropagation();
                  group.requests.forEach(req => {
                    if (req.status === "Submitted") {
                      toggleSelection(req.numericId);
                    }
                  });
                }}
                className="mt-2 mr-3 w-6 h-5 text-sky-600 border-gray-300 rounded focus:ring-sky-500"
                onClick={(e) => e.stopPropagation()}
              />
            )}

            <div
              className="flex-1 cursor-pointer"
              onClick={() => onToggle(group.groupKey)}
            >
              <div className="flex items-center gap-3 mb-2">
                {/* <h3 className="text-xl font-bold text-gray-800">
                  {type === "demand" 
                    ? `Demand: DM-${group.groupId}` 
                    : `Opportunity: GRP-${group.groupId}`}
                </h3> */}
                <h3 className="text-gray-800 text-xl font-bold">{group.title}</h3>
                <Badge className="bg-purple-100 text-purple-700 border-purple-200">
                  {type === "demand" ? "Demand" : "Opportunity"}
                </Badge>
                <Badge className={getPriorityColor(group.priority)}>
                  {group.priority}
                </Badge>
                <Badge className={`${getStatusColor(group.status)} border`}>
                  {group.status.replace("_", " ")}
                </Badge>
              </div>

              <div className="space-y-1">
                {/* <h3 className="text-gray-700 text-xl font-bold">{group.title}</h3> */}
                <p className="text-gray-600 text-sm">{group.description}</p>

                <div className="flex flex-wrap gap-4 text-sm text-gray-500 mt-2">
                  <span className="flex items-center gap-1">
                    <Target className="w-4 h-4" />
                    {group.clientName}
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    {group.requests.length} resource{group.requests.length > 1 ? 's' : ''}
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    {group.location}
                  </span>
                  <span className="flex items-center gap-1">
                    {getWorkModeIcon(group.workMode)}
                    {group.workMode}
                  </span>
                </div>
              </div>
            </div>

            <div className="text-right">
              <div className="flex items-center gap-2">
                <div>

                  <p className="font-mono font-bold text-blue-600">
                    {type === "demand" ? `DM-${group.groupId}` : `GRP-${group.groupId}`}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="ml-2"
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggle(group.groupKey);
                  }}
                >
                  {isExpanded ? (
                    <ChevronUp className="w-5 h-5" />
                  ) : (
                    <ChevronDown className="w-5 h-5" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Submitted: {formatDisplayDate(group.submittedDate)}
              </p>
            </div>
          </div>

          {/* Group Actions - Only show if any request is actionable */}
          {group.requests.some(req => req.status === "Submitted") && (
            <div className="flex gap-3 mb-4">
              <Button
                onClick={(e) => {
                  e.stopPropagation();
                  // Get all actionable request IDs in this group
                  const actionableIds = group.requests
                    .filter(req => req.status === "Submitted")
                    .map(req => req.numericId);
                  if (actionableIds.length > 0) {
                    // Select all actionable requests in this group
                    actionableIds.forEach(id => {
                      if (!selectedRequests.includes(id)) {
                        toggleSelection(id);
                      }
                    });
                    // Then open approval modal
                    handleApproveRequest();
                  }
                }}
                className="flex-1 bg-green-500 hover:bg-green-600"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Approve All ({group.requests.filter(req => req.status === "Submitted").length})
              </Button>
              <Button
                onClick={(e) => {
                  e.stopPropagation();
                  // Get all actionable request IDs in this group
                  const actionableIds = group.requests
                    .filter(req => req.status === "Submitted")
                    .map(req => req.numericId);
                  if (actionableIds.length > 0) {
                    // Select all actionable requests in this group
                    actionableIds.forEach(id => {
                      if (!selectedRequests.includes(id)) {
                        toggleSelection(id);
                      }
                    });
                    // Then open rejection modal
                    handleRejectRequest();
                  }
                }}
                variant="destructive"
                className="flex-1"
              >
                <XCircle className="w-4 h-4 mr-2" />
                Reject All
              </Button>
            </div>
          )}

          {/* Expanded Content */}
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="mt-4 pt-4 border-t border-gray-200"
            >
              <div className="space-y-3">
                {group.requests.map((request, index) => (
                  <div key={request.id} className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors">
                    <div className="flex items-start">
                      <input
                        type="checkbox"
                        checked={selectedRequests.includes(request.numericId)}
                        onChange={(e) => {
                          e.stopPropagation();
                          toggleSelection(request.numericId);
                        }}
                        className="mt-1 mr-3 w-5 h-4 text-sky-600 border-gray-300 rounded focus:ring-sky-500"
                        onClick={(e) => e.stopPropagation()}
                      />

                      <div
                        className="flex-1 cursor-pointer"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewRequest(request);
                        }}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold text-gray-800">{request.requestTitle}</h4>
                          <Badge className={getPriorityColor(request.priority)} size="sm">
                            {request.priority}
                          </Badge>
                          <Badge className={`${getStatusColor(request.status)} border text-xs`}>
                            {request.status.replace("_", " ")}
                          </Badge>
                        </div>

                        <div className="text-sm text-gray-600 space-y-1">
                          <p>Experience: {request.experienceRange}</p>
                          {request.primarySkills?.length > 0 && (
                            <div className="flex items-center gap-2">
                              <span>Skills:</span>
                              <div className="flex flex-wrap gap-1">
                                {request.primarySkills.slice(0, 3).map((skill, idx) => (
                                  <Badge key={idx} variant="outline" size="sm">
                                    {skill}
                                  </Badge>
                                ))}
                                {request.primarySkills.length > 3 && (
                                  <Badge variant="outline" size="sm">
                                    +{request.primarySkills.length - 3} more
                                  </Badge>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="text-right">
                        <p className="text-sm font-medium text-blue-600">{request.requestId}</p>
                        <p className="text-xs text-gray-500">Request ID</p>
                      </div>
                    </div>

                    {request.status === "Submitted" && (
                      <div className="flex gap-2 mt-3 pl-8">
                        <Button
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleApproveRequest(request);
                          }}
                          className="bg-green-500 hover:bg-green-600"
                        >
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRejectRequest(request);
                          }}
                        >
                          <XCircle className="w-3 h-3 mr-1" />
                          Reject
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

const formatDisplayDate = (dateVal) => {
  if (!dateVal) return "N/A";
  try {
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return dateVal;
    return format(d, "MM/dd/yyyy");
  } catch (e) {
    return dateVal;
  }
};

const getAvatarStyle = (initials) => {
  if (!initials) return { backgroundColor: "#6b7280", color: "#ffffff" }; // gray-500
  const clean = initials.trim().toUpperCase();
  if (clean === "RV") return { backgroundColor: "#7c3aed", color: "#ffffff" }; // purple-600
  if (clean === "AS") return { backgroundColor: "#0d9488", color: "#ffffff" }; // teal-600
  
  const charSum = clean.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
  const colors = [
    "#7c3aed", // purple-600
    "#0d9488", // teal-600
    "#2563eb", // blue-600
    "#4f46e5", // indigo-600
    "#db2777", // pink-600
    "#059669"  // emerald-600
  ];
  return { backgroundColor: colors[charSum % colors.length], color: "#ffffff" };
};


// Statistics Cards Component — Premium animated cards
const StatisticsCards = ({ activeTab, onTabChange, resourceRequests, opportunityRequests, demands }) => {
  const getTabSpecificCounts = () => {
    switch (activeTab) {
      case "resource":
        const pendingResource = resourceRequests.filter(req => req.status === "Submitted").length;
        const processedResource = resourceRequests.filter(req =>
          req.status === "Approved" || req.status === "Rejected"
        ).length;
        return [
          {
            title: "Total Resource Requests",
            value: resourceRequests.length,
            icon: FileCheck,
            color: "from-purple-400 to-purple-600",
            description: "All resource requests"
          },
          {
            title: "Pending Review",
            value: pendingResource,
            icon: Clock,
            color: "from-blue-400 to-blue-600",
            description: "Awaiting approval"
          },
          {
            title: "Processed",
            value: processedResource,
            icon: CheckCircle,
            color: "from-green-400 to-green-600",
            description: "Approved/Rejected"
          },
          {
            title: "Linked to Demands",
            value: resourceRequests.filter(req => req.demandId).length,
            icon: Target,
            color: "from-orange-400 to-orange-600",
            description: "Demand-based requests"
          }
        ];

      case "opportunity":
        const pendingOpportunity = opportunityRequests.filter(req => req.status === "Draft").length;
        const processedOpportunity = opportunityRequests.filter(req =>
          req.status === "HRApproved" || req.status === "Rejected"
        ).length;
        return [
          {
            title: "Opportunity Groups",
            value: opportunityRequests.length,
            icon: FileCheck,
            color: "from-purple-400 to-purple-600",
            description: "All opportunity groups"
          },
          {
            title: "Pending Review",
            value: pendingOpportunity,
            icon: Clock,
            color: "from-blue-400 to-blue-600",
            description: "Draft groups"
          },
          {
            title: "Processed",
            value: processedOpportunity,
            icon: CheckCircle,
            color: "from-green-400 to-green-600",
            description: "HR Approved/Rejected"
          },
          {
            title: "Total Resources",
            value: opportunityRequests.reduce((sum, group) => sum + (group.numberOfResources || 0), 0),
            icon: Users,
            color: "from-orange-400 to-orange-600",
            description: "Total resources requested"
          }
        ];

      case "demands":
        const openDemands = demands.filter(demand => demand.overallStatus === "Open").length;
        const inProgressDemands = demands.filter(demand => demand.overallStatus === "InProgress").length;
        const completedDemands = demands.filter(demand => demand.overallStatus === "Completed").length;

        return [
          {
            title: "Total Demands",
            value: demands.length,
            icon: FileCheck,
            color: "from-purple-400 to-purple-600",
            description: "All active demands"
          },
          {
            title: "Open",
            value: openDemands,
            icon: Clock,
            color: "from-blue-400 to-blue-600",
            description: "Open demands"
          },
          {
            title: "In Progress",
            value: inProgressDemands,
            icon: CheckCircle,
            color: "from-yellow-400 to-yellow-600",
            description: "Demands in progress"
          },
          {
            title: "Completed",
            value: completedDemands,
            icon: CheckCircle,
            color: "from-green-400 to-green-600",
            description: "Fulfilled demands"
          }
        ];

      default:
        return [
          {
            title: "Total Requests",
            value: resourceRequests.length + opportunityRequests.length,
            icon: FileCheck,
            color: "from-purple-400 to-purple-600",
            description: "All requests"
          },
          {
            title: "Pending Review",
            value: resourceRequests.filter(req => req.status === "Submitted").length +
              opportunityRequests.filter(req => req.status === "Draft").length,
            icon: Clock,
            color: "from-blue-400 to-blue-600",
            description: "Awaiting approval"
          },
          {
            title: "Processed",
            value: resourceRequests.filter(req => req.status === "Approved" || req.status === "Rejected").length +
              opportunityRequests.filter(req => req.status === "HRApproved" || req.status === "Rejected").length,
            icon: CheckCircle,
            color: "from-green-400 to-green-600",
            description: "Approved/Rejected"
          },
          {
            title: "Active Demands",
            value: demands.length,
            icon: Target,
            color: "from-orange-400 to-orange-600",
            description: "Current demand pipeline"
          },
        ];
    }
  };

  const getCardStyles = (colorStr) => {
    if (colorStr.includes("purple")) {
      return {
        bg: "bg-purple-100/60 hover:bg-purple-100/80",
        border: "border-purple-200/70",
        title: "text-purple-700 font-bold",
        val: "text-purple-950",
        desc: "text-purple-700/80",
        borderT: "border-purple-200/40"
      };
    }
    if (colorStr.includes("blue")) {
      return {
        bg: "bg-blue-100/60 hover:bg-blue-100/80",
        border: "border-blue-200/70",
        title: "text-blue-700 font-bold",
        val: "text-blue-950",
        desc: "text-blue-700/80",
        borderT: "border-blue-200/40"
      };
    }
    if (colorStr.includes("yellow") || colorStr.includes("orange")) {
      return {
        bg: "bg-amber-100/60 hover:bg-amber-100/80",
        border: "border-amber-200/70",
        title: "text-amber-800 font-bold",
        val: "text-amber-950",
        desc: "text-amber-800/80",
        borderT: "border-amber-200/40"
      };
    }
    if (colorStr.includes("green") || colorStr.includes("emerald")) {
      return {
        bg: "bg-emerald-100/60 hover:bg-emerald-100/80",
        border: "border-emerald-200/70",
        title: "text-emerald-800 font-bold",
        val: "text-emerald-950",
        desc: "text-emerald-800/80",
        borderT: "border-emerald-200/40"
      };
    }
    return {
      bg: "bg-gray-100/60 hover:bg-gray-100/80",
      border: "border-gray-200/70",
      title: "text-gray-700 font-bold",
      val: "text-gray-950",
      desc: "text-gray-700/80",
      borderT: "border-gray-200/40"
    };
  };

  const stats = getTabSpecificCounts();

  const cardThemes = [
    {
      gradient: "from-violet-500 to-purple-600",
      lightBg: "bg-gradient-to-br from-violet-50 to-purple-50",
      border: "border-violet-200/60",
      glow: "shadow-violet-100",
      title: "text-violet-600",
      val: "text-violet-900",
      desc: "text-violet-500",
      bar: "from-violet-400 to-purple-500",
    },
    {
      gradient: "from-sky-500 to-blue-600",
      lightBg: "bg-gradient-to-br from-sky-50 to-blue-50",
      border: "border-sky-200/60",
      glow: "shadow-sky-100",
      title: "text-sky-600",
      val: "text-sky-900",
      desc: "text-sky-500",
      bar: "from-sky-400 to-blue-500",
    },
    {
      gradient: "from-amber-500 to-orange-500",
      lightBg: "bg-gradient-to-br from-amber-50 to-orange-50",
      border: "border-amber-200/60",
      glow: "shadow-amber-100",
      title: "text-amber-600",
      val: "text-amber-900",
      desc: "text-amber-500",
      bar: "from-amber-400 to-orange-500",
    },
    {
      gradient: "from-emerald-500 to-green-600",
      lightBg: "bg-gradient-to-br from-emerald-50 to-green-50",
      border: "border-emerald-200/60",
      glow: "shadow-emerald-100",
      title: "text-emerald-600",
      val: "text-emerald-900",
      desc: "text-emerald-500",
      bar: "from-emerald-400 to-green-500",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        const theme = cardThemes[index % cardThemes.length];
        return (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: index * 0.08 }}
            whileHover={{ y: -4, scale: 1.02 }}
            className={`${theme.lightBg} rounded-2xl border ${theme.border} shadow-md hover:shadow-lg ${theme.glow} p-4 md:p-5 flex flex-col justify-between transition-all duration-300 cursor-pointer text-left relative overflow-hidden group`}
            onClick={() => onTabChange(activeTab)}
          >
            {/* Top gradient bar */}
            <div className={`absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r ${theme.bar} rounded-t-2xl`} />
            {/* Subtle bg glow on hover */}
            <div className={`absolute inset-0 bg-gradient-to-br ${theme.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-300 rounded-2xl`} />

            <div className="flex justify-between items-start relative">
              <div className="min-w-0 flex-1 pr-2">
                <p className={`${theme.title} text-[10px] md:text-[11px] font-bold uppercase tracking-widest truncate`}>
                  {stat.title}
                </p>
                <motion.h3
                  className={`text-3xl md:text-4xl font-black ${theme.val} mt-2 tracking-tight leading-none`}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, delay: index * 0.1 + 0.2 }}
                >
                  {stat.value}
                </motion.h3>
              </div>
              <div className={`w-11 h-11 rounded-2xl bg-gradient-to-br ${theme.gradient} flex items-center justify-center text-white shadow-md flex-shrink-0 group-hover:scale-110 transition-transform duration-200`}>
                <Icon className="w-5 h-5" />
              </div>
            </div>

            <p className={`text-[10px] ${theme.desc} font-semibold mt-4 pt-2.5 border-t border-current/10 truncate relative`}>
              {stat.description}
            </p>
          </motion.div>
        );
      })}
    </div>
  );
};

// RequestTab Component with Pagination
const RequestTab = ({ type, service, approverUserId, requests, refresh }) => {
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [selectedGroupId, setSelectedGroupId] = useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isApprovalModalOpen, setIsApprovalModalOpen] = useState(false);
  const [isRejectionModalOpen, setIsRejectionModalOpen] = useState(false);
  const [isGroupApprovalModalOpen, setIsGroupApprovalModalOpen] = useState(false);
  const [isGroupRejectionModalOpen, setIsGroupRejectionModalOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [approvalComments, setApprovalComments] = useState("");
  const [groupApprovalComments, setGroupApprovalComments] = useState("");
  const [groupRejectionReason, setGroupRejectionReason] = useState("");
  const [actionSuccess, setActionSuccess] = useState({ show: false, type: "", requestId: "" });
  const [sortField, setSortField] = useState("default");
  const [sortDirection, setSortDirection] = useState("desc");
  const [requestFilter, setRequestFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [selectedRequests, setSelectedRequests] = useState([]);
  const [expandedGroups, setExpandedGroups] = useState([]);
  const [expandedAll, setExpandedAll] = useState(false);

  // Helper functions
  const toggleSelection = (requestId) => {
    setSelectedRequests(prev =>
      prev.includes(requestId)
        ? prev.filter(id => id !== requestId)
        : [...prev, requestId]
    );
  };

  const toggleAllSelection = () => {
    const actionableRequests = (type === "resource"
      ? requests.filter(req => req.status === "Submitted")
      : requests.filter(req => req.status === "Draft")
    ).map(req => req.numericId);

    if (selectedRequests.length === actionableRequests.length) {
      setSelectedRequests([]);
    } else {
      setSelectedRequests(actionableRequests);
    }
  };

  const clearSelection = () => {
    setSelectedRequests([]);
  };

  // Group management functions
  const toggleGroup = (groupKey) => {
    setExpandedGroups(prev =>
      prev.includes(groupKey)
        ? prev.filter(key => key !== groupKey)
        : [...prev, groupKey]
    );
  };

  const expandAll = () => {
    if (!resourceGroupedRequests) return;

    const allGroupKeys = [
      ...Object.keys(resourceGroupedRequests.demand || {}),
      ...Object.keys(resourceGroupedRequests.opportunity || {}),
      ...(resourceGroupedRequests.single?.map(req => req.groupKey) || [])
    ];
    setExpandedGroups(allGroupKeys);
    setExpandedAll(true);
  };

  const collapseAll = () => {
    setExpandedGroups([]);
    setExpandedAll(false);
  };

  const toggleAllGroups = () => {
    if (expandedAll) {
      collapseAll();
    } else {
      expandAll();
    }
  };

  // Filter requests based on selection
  const filteredRequests = useMemo(() => {
    if (type !== "resource") return requests;

    return requests.filter(request => {
      if (requestFilter === "all") return true;
      if (requestFilter === "opportunity") return request.groupId !== null;
      if (requestFilter === "demand") return request.demandId !== null;
      if (requestFilter === "approved") return request.status === "Approved";
      if (requestFilter === "rejected") return request.status === "Rejected";
      return true;
    });
  }, [requests, requestFilter, type]);

  // Apply search filter to requests
  const searchedRequests = useMemo(() => {
    if (!searchQuery.trim()) return filteredRequests;

    const query = searchQuery.toLowerCase().trim();
    return filteredRequests.filter(request => {
      return (
        request.requestId?.toLowerCase().includes(query) ||
        `DM-${request.demandId}`.toLowerCase().includes(query) ||
        `GRP-${request.groupId}`.toLowerCase().includes(query) ||
        request.projectName?.toLowerCase().includes(query) ||
        request.clientName?.toLowerCase().includes(query) ||
        request.description?.toLowerCase().includes(query) ||
        request.requestedBy?.toLowerCase().includes(query) ||
        request.location?.toLowerCase().includes(query) ||
        request.status?.toLowerCase().includes(query) ||
        request.priority?.toLowerCase().includes(query)
      );
    });
  }, [filteredRequests, searchQuery]);

  // Reset to first page when search or filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, requestFilter]);

  const priorityOrder = { Urgent: 1, High: 2, Medium: 3, Low: 4 };

  // Sort requests
  const sortedRequests = useMemo(() => {
    const sorted = [...searchedRequests];
    if (sortField === "default") {
      if (type === "opportunity") {
        return sorted.sort((a, b) => b.numericId - a.numericId);
      }
      return sorted.sort((a, b) => {
        const isAActionable = a.status === "Submitted";
        const isBActionable = b.status === "Submitted";
        if (isAActionable && !isBActionable) return -1;
        if (!isAActionable && isBActionable) return 1;
        return new Date(b.submittedDate) - new Date(a.submittedDate);
      });
    } else if (sortField === "id") {
      return sorted.sort((a, b) =>
        sortDirection === "asc"
          ? a.id.localeCompare(b.id)
          : b.id.localeCompare(a.id)
      );
    } else if (sortField === "priority") {
      return sorted.sort((a, b) => {
        const priorityA = priorityOrder[a.priority] || 5;
        const priorityB = priorityOrder[b.priority] || 5;
        return sortDirection === "asc" ? priorityA - priorityB : priorityB - priorityA;
      });
    } else if (sortField === "submittedDate") {
      return sorted.sort((a, b) =>
        sortDirection === "asc"
          ? new Date(a.submittedDate) - new Date(b.submittedDate)
          : new Date(b.submittedDate) - new Date(a.submittedDate)
      );
    }
    return sorted;
  }, [searchedRequests, sortField, sortDirection, type]);

  // Group requests by demandId and groupId for resource tab
  const resourceGroupedRequests = useMemo(() => {
    if (type !== "resource" || requestFilter !== "all") return null;

    const groups = {
      demand: {},
      opportunity: {},
      single: []
    };

    sortedRequests.forEach(request => {
      if (request.demandId) {
        const key = `demand-${request.demandId}`;
        if (!groups.demand[key]) {
          groups.demand[key] = {
            groupKey: key,
            groupId: request.demandId,
            title: request.requestTitle || request.demandTitle || request.projectName,
            description: request.description,
            clientName: request.clientName,
            projectName: request.projectName,
            priority: request.priority,
            status: request.status,
            submittedDate: request.submittedDate,
            location: request.location,
            workMode: request.workMode,
            requestedBy: request.requestedBy,
            requests: []
          };
        }
        groups.demand[key].requests.push(request);
      } else if (request.groupId) {
        const key = `group-${request.groupId}`;
        if (!groups.opportunity[key]) {
          groups.opportunity[key] = {
            groupKey: key,
            groupId: request.groupId,
            title: request.requestTitle || request.groupTitle || request.projectName,
            description: request.description,
            clientName: request.clientName,
            projectName: request.projectName,
            priority: request.priority,
            status: request.status,
            submittedDate: request.submittedDate,
            location: request.location,
            workMode: request.workMode,
            requestedBy: request.requestedBy,
            requests: []
          };
        }
        groups.opportunity[key].requests.push(request);
      } else {
        groups.single.push({
          ...request,
          groupKey: `single-${request.id}`
        });
      }
    });

    return groups;
  }, [sortedRequests, type, requestFilter]);

  // Group requests for opportunity tab
  const opportunityGroupedRequests = useMemo(() => {
    if (type === "resource") return [];

    const groups = {};
    sortedRequests.forEach((req) => {
      if (!req.groupId) return;
      const key = req.groupId;
      if (!groups[key]) {
        groups[key] = {
          groupId: req.groupId,
          requests: [],
          projectName: req.projectName,
          totalResources: 0,
          status: req.status,
          priority: req.priority,
          submittedDate: req.submittedDate,
          clientName: req.clientName,
          description: req.description || "",
          workMode: req.workMode,
          locationType: req.locationType,
          location: req.location,
          requestedBy: req.requestedBy,
          estimatedCostTotal: req.estimatedCostTotal,
        };
      }
      groups[key].requests.push(req);
      groups[key].totalResources += req.numberOfResources;
    });
    return Object.values(groups).sort((a, b) => b.groupId - a.groupId);
  }, [sortedRequests, type]);

  // Pagination calculations
  const shouldShowGroups = type === "resource" && requestFilter === "all" && resourceGroupedRequests;

  // Calculate total items for pagination
  const totalGroupedItems = shouldShowGroups
    ? (Object.keys(resourceGroupedRequests.demand || {}).length +
      Object.keys(resourceGroupedRequests.opportunity || {}).length +
      resourceGroupedRequests.single.length)
    : sortedRequests.length;

  // Get paginated items based on view type
  const paginatedItems = useMemo(() => {
    if (shouldShowGroups) {
      const allItems = [
        ...Object.values(resourceGroupedRequests.demand || {}),
        ...Object.values(resourceGroupedRequests.opportunity || {}),
        ...(resourceGroupedRequests.single || [])
      ];
      const startIndex = (currentPage - 1) * itemsPerPage;
      return allItems.slice(startIndex, startIndex + itemsPerPage);
    } else {
      const startIndex = (currentPage - 1) * itemsPerPage;
      return sortedRequests.slice(startIndex, startIndex + itemsPerPage);
    }
  }, [shouldShowGroups, resourceGroupedRequests, sortedRequests, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(totalGroupedItems / itemsPerPage);

  // Paginate grouped requests for opportunity tab
  const paginatedGroupedRequests = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return opportunityGroupedRequests.slice(startIndex, startIndex + itemsPerPage);
  }, [opportunityGroupedRequests, currentPage, itemsPerPage]);

  const totalGroupPages = Math.ceil(opportunityGroupedRequests.length / itemsPerPage);

  // Regular paginated requests for non-grouped view
  const paginatedRequests = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return sortedRequests.slice(startIndex, startIndex + itemsPerPage);
  }, [sortedRequests, currentPage, itemsPerPage]);

  const handleViewRequest = (request) => {
    setSelectedRequest(request);
    setIsViewModalOpen(true);
  };

  const handleApproveRequest = (request = null) => {
    if (request) {
      setSelectedRequest(request);
      setSelectedRequests([]); // Clear bulk selection if single approval
    }
    setApprovalComments("");
    setIsApprovalModalOpen(true);
  };

  const handleRejectRequest = (request = null) => {
    if (request) {
      setSelectedRequest(request);
      setSelectedRequests([]); // Clear bulk selection if single rejection
    }
    setRejectionReason("");
    setIsRejectionModalOpen(true);
  };

  const handleBulkApprove = () => {
    setSelectedRequest(null); // Clear single selection if bulk approval
    setApprovalComments("");
    setIsApprovalModalOpen(true);
  };

  const handleBulkReject = () => {
    setSelectedRequest(null); // Clear single selection if bulk rejection
    setRejectionReason("");
    setIsRejectionModalOpen(true);
  };

  const handleGroupApprove = (groupId) => {
    setSelectedGroupId(groupId);
    setGroupApprovalComments("");
    setIsGroupApprovalModalOpen(true);
  };

  const handleGroupReject = (groupId) => {
    setSelectedGroupId(groupId);
    setGroupRejectionReason("");
    setIsGroupRejectionModalOpen(true);
  };

  const confirmApproval = async () => {
    // Get request IDs - handle both single request and multiple selected requests
    let requestIds = [];
    let singleRequestId = [];

    if (selectedRequests.length > 0) {
      // Multiple selected requests from bulk approval
      requestIds = selectedRequests;
    } else if (selectedRequest && selectedRequest.numericId) {
      // Single request approval from individual card
      requestIds = [selectedRequest.numericId];
      singleRequestId = selectedRequest.id; // Store the display ID for success message
    }

    if (requestIds.length === 0) return;

    try {
      // Use same API call for both single and bulk approval
      const response = await service.actOnRequest(
        requestIds,
        approverUserId,
        "Approved",
        approvalComments
      );

      // Check response success based on your API structure
      if (response.data.success) {
        refresh();
        setIsApprovalModalOpen(false);
        setApprovalComments("");
        setSelectedRequests([]);

        // Success message logic
        const successMessage = requestIds.length === 1
          ? `Request ${singleRequestId || requestIds[0]} approved successfully!`
          : `${requestIds.length} requests approved successfully!`;

        setActionSuccess({
          show: true,
          type: "approved",
          requestId: requestIds.length === 1 ? (singleRequestId || requestIds[0]) : `${requestIds.length} requests`
        });

        toast.success(successMessage);
      } else {
        // Handle cases where API returns success: false
        if (response.data.errors && response.data.errors.length > 0) {
          toast.error(`Failed to approve request${requestIds.length > 1 ? 's' : ''}: ${response.data.errors.join(', ')}`);
        } else {
          toast.error("Failed to approve request" + (requestIds.length > 1 ? 's' : ''));
        }
      }
    } catch (error) {
      console.error("Approval error:", error);

      // Enhanced error handling
      if (error.response && error.response.data) {
        const errorData = error.response.data;
        if (errorData.errors && errorData.errors.length > 0) {
          toast.error(`Failed to approve request${requestIds.length > 1 ? 's' : ''}: ${errorData.errors.join(', ')}`);
        } else if (errorData.message) {
          toast.error(`Failed to approve request${requestIds.length > 1 ? 's' : ''}: ${errorData.message}`);
        } else {
          toast.error("Failed to approve request" + (requestIds.length > 1 ? 's' : ''));
        }
      } else {
        toast.error("Failed to approve request" + (requestIds.length > 1 ? 's' : ''));
      }
    }
  };

  const confirmRejection = async () => {
    // Get request IDs - handle both single request and multiple selected requests
    let requestIds = [];
    let singleRequestId = [];

    if (selectedRequests.length > 0) {
      // Multiple selected requests from bulk rejection
      requestIds = selectedRequests;
    } else if (selectedRequest && selectedRequest.numericId) {
      // Single request rejection from individual card
      requestIds = [selectedRequest.numericId];
      singleRequestId = selectedRequest.id; // Store the display ID for success message
    }

    if (requestIds.length === 0 || !rejectionReason.trim()) {
      toast.error("Please provide a rejection reason");
      return;
    }

    try {
      // Use same API call for both single and bulk rejection
      const response = await service.actOnRequest(
        requestIds,
        approverUserId,
        "Rejected",
        rejectionReason.trim()
      );

      // Check response success based on your API structure
      if (response.data.success) {
        refresh();
        setIsRejectionModalOpen(false);
        setRejectionReason("");
        setSelectedRequests([]);

        // Success message logic
        const successMessage = requestIds.length === 1
          ? `Request ${singleRequestId || requestIds[0]} rejected with reason provided.`
          : `${requestIds.length} requests rejected with reason provided.`;

        setActionSuccess({
          show: true,
          type: "rejected",
          requestId: requestIds.length === 1 ? (singleRequestId || requestIds[0]) : `${requestIds.length} requests`
        });

        toast.success(successMessage);
      } else {
        // Handle cases where API returns success: false
        if (response.data.errors && response.data.errors.length > 0) {
          toast.error(`Failed to reject request${requestIds.length > 1 ? 's' : ''}: ${response.data.errors.join(', ')}`);
        } else {
          toast.error("Failed to reject request" + (requestIds.length > 1 ? 's' : ''));
        }
      }
    } catch (error) {
      console.error("Rejection error:", error);

      // Enhanced error handling
      if (error.response && error.response.data) {
        const errorData = error.response.data;
        if (errorData.errors && errorData.errors.length > 0) {
          toast.error(`Failed to reject request${requestIds.length > 1 ? 's' : ''}: ${errorData.errors.join(', ')}`);
        } else if (errorData.message) {
          toast.error(`Failed to reject request${requestIds.length > 1 ? 's' : ''}: ${errorData.message}`);
        } else {
          toast.error("Failed to reject request" + (requestIds.length > 1 ? 's' : ''));
        }
      } else {
        toast.error("Failed to reject request" + (requestIds.length > 1 ? 's' : ''));
      }
    }
  };

  const confirmGroupApproval = async () => {
    if (!selectedGroupId) return;

    try {
      const response = await service.approveResourceRequest(
        selectedGroupId,
        groupApprovalComments,
        approverUserId
      );

      if (response.data.success) {
        refresh();
        setIsGroupApprovalModalOpen(false);
        setSelectedGroupId(null);
        toast.success(`Group GRP-${selectedGroupId} approved successfully!`);
        setActionSuccess({ show: true, type: "approved", requestId: `GRP-${selectedGroupId}` });
      } else {
        toast.error("Failed to approve group");
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to approve group");
    }
  };

  const confirmGroupRejection = async () => {
    if (!selectedGroupId || !groupRejectionReason.trim()) {
      toast.error("Please provide a rejection reason");
      return;
    }

    try {
      const response = await service.rejectResourceRequest(
        selectedGroupId,
        groupRejectionReason.trim(),
        approverUserId
      );

      if (response.data.success) {
        refresh();
        setIsGroupRejectionModalOpen(false);
        setSelectedGroupId(null);
        toast.success(`Group GRP-${selectedGroupId} rejected with reason provided.`);
        setActionSuccess({ show: true, type: "rejected", requestId: `GRP-${selectedGroupId}` });
      } else {
        toast.error("Failed to reject group");
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to reject group");
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Pending":
      case "Submitted":
      case "Draft":
      case "Approved (Opportunity), Pending Resource":
        return "bg-yellow-100 text-yellow-700 border-yellow-200";
      case "Approved":
      case "HRApproved":
        return "bg-green-100 text-green-700 border-green-200";
      case "Rejected":
        return "bg-red-100 text-red-700 border-red-200";
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

  const getSharedResumeStatus = (resume) => {
    return "Shared"; // Default status
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

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection(field === "priority" ? "asc" : "desc");
    }
  };

  const handleItemsPerPageChange = (newItemsPerPage) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1); // Reset to first page when changing items per page
  };

  // Render Single Request Card (for non-grouped view)
  const renderRequestCard = (request, index) => (
    <motion.div
      key={request.id}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
    >
      <Card className={`bg-white/90 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer ${selectedRequests.includes(request.numericId) ? 'ring-2 ring-blue-500' : ''
        }`}>
        <CardContent className="p-6" onClick={() => handleViewRequest(request)}>
          <div className="flex items-start mb-4">
            <input
              type="checkbox"
              checked={selectedRequests.includes(request.numericId)}
              onChange={(e) => {
                e.stopPropagation();
                toggleSelection(request.numericId);
              }}
              className="mt-2 mr-3 w-6 h-5 text-sky-600 border-gray-300 rounded focus:ring-sky-500"
              onClick={(e) => e.stopPropagation()}
            />

            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h3 className="text-xl font-bold text-gray-800">{request.requestTitle}</h3>
                <Badge className={`${getStatusColor(request.status)} border`}>
                  {request.status.replace("_", " ")}
                </Badge>
                {request.status === "Approved (Opportunity), Pending Resource" && (
                  <Badge className="bg-blue-100 text-blue-700 border-blue-200">Group Approved</Badge>
                )}
                <Badge className={getPriorityColor(request.priority)}>{request.priority}</Badge>

                {/* Show groupId and demandId badges */}
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
              <p className="text-gray-600 mb-2">{request.description}</p>
              <div className="flex items-center gap-4 text-sm text-gray-500">
                <span className="flex items-center gap-1">
                  <Target className="w-4 h-4" />
                  {request.clientName}
                </span>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">Request ID</p>
              <p className="font-mono font-bold text-blue-600">{request.requestId}</p>
              <p className="text-xs text-gray-500">Submitted: {formatDisplayDate(request.submittedDate)}</p>
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
              <span>Created by: {request.requestedBy}</span>
            </div>
            {(type === "resource" ? request.status === "Submitted" : request.status === "Draft") && (
              <div className="flex gap-3">
                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleApproveRequest(request);
                  }}
                  className="flex-1 bg-green-500 hover:bg-green-600"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Approve
                </Button>
                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRejectRequest(request);
                  }}
                  variant="destructive"
                  className="flex-1"
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Reject
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );

  // Render Group Card for opportunity tab
  const renderGroupCard = (group, index) => (
    <motion.div
      key={group.groupId}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
    >
      <Card className="bg-white/90 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer">
        <CardContent className="p-6" onClick={() => handleViewRequest(group)}>
          <div className="flex items-start mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h3 className="text-xl font-bold text-gray-800">{group.description}</h3>
                <Badge className={`${getStatusColor(group.status)} border`}>{group.status}</Badge>
                <Badge className={getPriorityColor(group.priority)}>{group.priority}</Badge>
                <Badge className="bg-purple-100 text-purple-700 border-purple-200">
                  Opportunity
                </Badge>
              </div>
              <div className="flex items-center gap-4 text-sm text-gray-500">
                <span className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  {group.totalResources} resources
                </span>
                <span className="flex items-center gap-1">
                  <Target className="w-4 h-4" />
                  {group.clientName}
                </span>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">Group ID</p>
              <p className="font-mono font-bold text-blue-600">GRP-{group.groupId}</p>
              <p className="text-xs text-gray-500">Submitted: {formatDisplayDate(group.submittedDate)}</p>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm text-gray-500">
              <div className="flex items-center gap-2">
                {getWorkModeIcon(group.workMode)}
                <span>{group.workMode}</span>
                <MapPin className="w-4 h-4" />
                <span>{group.location}</span>
              </div>
              <span>Created by: {group.requestedBy}</span>
            </div>
            {group.status === "Draft" && (
              <div className="flex gap-3">
                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleGroupApprove(group.groupId);
                  }}
                  className="flex-1 bg-green-500 hover:bg-green-600"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Approve
                </Button>
                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleGroupReject(group.groupId);
                  }}
                  variant="destructive"
                  className="flex-1"
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Reject
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );

  return (
    <div className="space-y-6">
      {/* Search and Filter Controls */}
      <div className="br-2 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div className="px-2 flex items-center gap-3">
          <h2 className="text-2xl font-bold text-gray-800">
            {type === "resource" ? "Requests" : "Opportunities"}
          </h2>

          {/* Group Controls - Only show for resource tab with "all" filter */}
          {type === "resource" && requestFilter === "all" && resourceGroupedRequests && (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={toggleAllGroups}
                className="flex items-center gap-1"
              >
                {expandedAll ? (
                  <>
                    <ChevronUp className="w-4 h-4" />
                    Collapse All
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-4 h-4" />
                    Expand All
                  </>
                )}
              </Button>
              <Badge variant="outline" className="bg-blue-50 text-blue-700">
                {Object.keys(resourceGroupedRequests.demand || {}).length} Demands
              </Badge>
              <Badge variant="outline" className="bg-purple-50 text-purple-700">
                {Object.keys(resourceGroupedRequests.opportunity || {}).length} Opportunities
              </Badge>
              <Badge variant="outline" className="bg-gray-100 text-gray-700">
                {resourceGroupedRequests.single.length} Single
              </Badge>
            </div>
          )}
        </div>
        <div className="px-2 py-1 flex flex-col lg:flex-row items-start lg:items-center gap-4 w-full lg:w-auto">
          {/* Search Input */}
          <SearchFilter
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder={`Search by Id or Title`}
          />

          {/* Filter Dropdown - Only show for resource requests */}
          {type === "resource" && (
            <div className="py-1 px-2 flex items-center gap-2">
              <select
                value={requestFilter}
                onChange={(e) => {
                  setRequestFilter(e.target.value);
                  // Reset expanded groups when filter changes
                  setExpandedGroups([]);
                  setExpandedAll(false);
                }}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="all">All Requests</option>
                <option value="opportunity">Opportunity Requests</option>
                <option value="demand">Demand Requests</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Search Results Info */}
      {searchQuery && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <p className="text-sm text-blue-700">
            Showing {type === "opportunity" ? opportunityGroupedRequests.length : totalGroupedItems} result{type === "opportunity" ? (opportunityGroupedRequests.length !== 1 ? 's' : '') : (totalGroupedItems !== 1 ? 's' : '')} for "{searchQuery}"
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

      {/* Select All Checkbox - Only show for non-grouped view */}
      {type === "resource" && requestFilter !== "all" && paginatedRequests.length > 0 && (
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={selectedRequests.length > 0 && selectedRequests.length === paginatedRequests.filter(request =>
              request.status === "Submitted"
            ).length}
            onChange={toggleAllSelection}
            className="w-6 h-4 text-sky-600 border-gray-300 rounded focus:ring-sky-500"
          />
          <Label className="text-sm text-black-600">Select all actionable requests</Label>
        </div>
      )}

      {/* Bulk Actions Bar */}
      {selectedRequests.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Badge className="bg-blue-500 text-white">
                {selectedRequests.length} selected
              </Badge>
              <span className="text-sm text-blue-700">
                {selectedRequests.length} request{selectedRequests.length !== 1 ? 's' : ''} selected for bulk action
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={handleBulkApprove}
                className="bg-green-500 hover:bg-green-600"
                size="sm"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Approve Selected
              </Button>
              <Button
                onClick={handleBulkReject}
                variant="destructive"
                size="sm"
              >
                <XCircle className="w-4 h-4 mr-2" />
                Reject Selected
              </Button>
              <Button
                onClick={clearSelection}
                variant="outline"
                size="sm"
              >
                <X className="w-4 h-4 mr-2" />
                Clear
              </Button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Pagination */}
      {(type === "opportunity" ? opportunityGroupedRequests.length > 0 : totalGroupedItems > 0) && (
        <Pagination
          currentPage={currentPage}
          totalPages={type === "opportunity" ? totalGroupPages : totalPages}
          onPageChange={setCurrentPage}
          itemsPerPage={itemsPerPage}
          onItemsPerPageChange={handleItemsPerPageChange}
          totalItems={type === "opportunity" ? opportunityGroupedRequests.length : totalGroupedItems}
        />
      )}

      {/* Requests List */}
      <div className="space-y-4">
        {type === "opportunity" ? (
          paginatedGroupedRequests.length > 0 ? (
            paginatedGroupedRequests.map((group, index) => renderGroupCard(group, index))
          ) : (
            <Card className="bg-white/90 backdrop-blur-sm shadow-lg">
              <CardContent className="p-8 text-center">
                <FileCheck className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-600 mb-2">
                  {searchQuery ? "No matching opportunities found" : "No Opportunity Requests Found"}
                </h3>
                <p className="text-gray-500">
                  {searchQuery
                    ? "Try adjusting your search terms"
                    : "There are currently no opportunity requests to display."
                  }
                </p>
              </CardContent>
            </Card>
          )
        ) : (
          // Resource Requests
          (() => {
            if (shouldShowGroups && resourceGroupedRequests) {
              // Render grouped view
              if (paginatedItems.length === 0) {
                return (
                  <Card className="bg-white/90 backdrop-blur-sm shadow-lg">
                    <CardContent className="p-8 text-center">
                      <FileCheck className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-gray-600 mb-2">
                        {searchQuery ? "No matching requests found" : "No Requests Found"}
                      </h3>
                      <p className="text-gray-500">
                        {searchQuery
                          ? "Try adjusting your search terms"
                          : "There are currently no resource requests to display."
                        }
                      </p>
                    </CardContent>
                  </Card>
                );
              }

              return (
                <div className="space-y-6">
                  {/* Demand Groups */}
                  {paginatedItems.filter(item => item.groupKey?.startsWith('demand-')).length > 0 && (
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-gray-700 border-b pb-2">
                        Demand-Based Requests
                      </h3>
                      {paginatedItems
                        .filter(item => item.groupKey?.startsWith('demand-'))
                        .map((group, index) => (
                          <ResourceGroupCard
                            key={group.groupKey}
                            group={group}
                            type="demand"
                            isExpanded={expandedGroups.includes(group.groupKey)}
                            onToggle={toggleGroup}
                            selectedRequests={selectedRequests}
                            toggleSelection={toggleSelection}
                            handleViewRequest={handleViewRequest}
                            handleApproveRequest={handleApproveRequest}
                            handleRejectRequest={handleRejectRequest}
                            getStatusColor={getStatusColor}
                            getPriorityColor={getPriorityColor}
                            getWorkModeIcon={getWorkModeIcon}
                          />
                        ))
                      }
                    </div>
                  )}

                  {/* Opportunity Groups */}
                  {paginatedItems.filter(item => item.groupKey?.startsWith('group-')).length > 0 && (
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-gray-700 border-b pb-2">
                        Opportunity-Based Requests
                      </h3>
                      {paginatedItems
                        .filter(item => item.groupKey?.startsWith('group-'))
                        .map((group, index) => (
                          <ResourceGroupCard
                            key={group.groupKey}
                            group={group}
                            type="opportunity"
                            isExpanded={expandedGroups.includes(group.groupKey)}
                            onToggle={toggleGroup}
                            selectedRequests={selectedRequests}
                            toggleSelection={toggleSelection}
                            handleViewRequest={handleViewRequest}
                            handleApproveRequest={handleApproveRequest}
                            handleRejectRequest={handleRejectRequest}
                            getStatusColor={getStatusColor}
                            getPriorityColor={getPriorityColor}
                            getWorkModeIcon={getWorkModeIcon}
                          />
                        ))
                      }
                    </div>
                  )}

                  {/* Single Requests */}
                  {paginatedItems.filter(item => item.groupKey?.startsWith('single-')).length > 0 && (
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-gray-700 border-b pb-2">
                        Individual Requests
                      </h3>
                      {paginatedItems
                        .filter(item => item.groupKey?.startsWith('single-'))
                        .map((request, index) => renderRequestCard(request, index))
                      }
                    </div>
                  )}
                </div>
              );
            } else {
              // Render non-grouped view (for other filters)
              return paginatedRequests.length > 0 ? (
                paginatedRequests.map((request, index) => renderRequestCard(request, index))
              ) : (
                <Card className="bg-white/90 backdrop-blur-sm shadow-lg">
                  <CardContent className="p-8 text-center">
                    <FileCheck className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-600 mb-2">
                      {searchQuery
                        ? "No matching requests found"
                        : requestFilter === "all"
                          ? "No Requests Found"
                          : requestFilter === "opportunity"
                            ? "No Opportunity Requests Found"
                            : requestFilter === "demand"
                              ? "No Demand Requests Found"
                              : requestFilter === "approved"
                                ? "No Approved Requests Found"
                                : "No Rejected Requests Found"
                      }
                    </h3>
                    <p className="text-gray-500">
                      {searchQuery
                        ? "Try adjusting your search terms"
                        : requestFilter === "all"
                          ? "There are currently no resource requests to display."
                          : requestFilter === "opportunity"
                            ? "There are no resource requests linked to opportunities."
                            : requestFilter === "demand"
                              ? "There are no resource requests linked to demands."
                              : requestFilter === "approved"
                                ? "There are no approved requests."
                                : "There are no rejected requests."
                      }
                    </p>
                  </CardContent>
                </Card>
              );
            }
          })()
        )}
      </div>

      {/* View Modal */}
      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedRequest?.requestTitle}</DialogTitle>
            <DialogDescription>
              Request ID: {selectedRequest?.requestId} | Status: {selectedRequest?.status}
              {selectedRequest?.groupId && ` | Group ID: ${selectedRequest.groupId}`}
              {selectedRequest?.demandId && ` | Demand ID: ${selectedRequest.demandId}`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="font-semibold mb-2">Project Details</h3>
                <p className="text-gray-600 mb-2">{selectedRequest?.description}</p>
                <div className="space-y-1 text-sm">
                  <p><span className="font-medium">Client:</span> {selectedRequest?.clientName}</p>
                  <p><span className="font-medium">Priority:</span> <Badge className={getPriorityColor(selectedRequest?.priority)}>{selectedRequest?.priority}</Badge></p>
                  <p><span className="font-medium">Status:</span> <Badge className={getStatusColor(selectedRequest?.status)}>{selectedRequest?.status}</Badge></p>

                  <p><span className="font-medium">Work Mode:</span> {selectedRequest?.workMode}</p>
                  <p><span className="font-medium">Location:</span> {selectedRequest?.location}</p>
                </div>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Timeline</h3>
                <div className="space-y-1 text-sm">
                  <p><span className="font-medium">Submitted:</span> {formatDisplayDate(selectedRequest?.submittedDate)}</p>
                  <p><span className="font-medium">Created By:</span> {selectedRequest?.requestedBy}</p>
                </div>
              </div>
            </div>
            {selectedRequest?.hrComments && (
              <div>
                <h3 className="font-semibold mb-2">HR Comments</h3>
                <p className="text-gray-600 bg-gray-50 p-3 rounded">{selectedRequest.hrComments}</p>
              </div>
            )}
            {selectedRequest?.rejectionReason && (
              <div>
                <h3 className="font-semibold mb-2">Rejection Reason</h3>
                <div className="bg-red-50 border border-red-200 p-3 rounded">
                  <p className="text-red-700">{selectedRequest.rejectionReason}</p>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Unified Approval Modal */}
      <Dialog open={isApprovalModalOpen} onOpenChange={(open) => {
        setIsApprovalModalOpen(open);
        if (!open) {
          setApprovalComments("");
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-green-600">
              <CheckCircle className="w-5 h-5" />
              {selectedRequests.length > 0
                ? `Approve ${selectedRequests.length} Request${selectedRequests.length !== 1 ? 's' : ''}`
                : `Approve Request - ${selectedRequest?.id}`
              }
            </DialogTitle>
            <DialogDescription>
              {selectedRequests.length > 0
                ? `This will approve ${selectedRequests.length} selected request${selectedRequests.length !== 1 ? 's' : ''} and notify the project manager${selectedRequests.length !== 1 ? 's' : ''}.`
                : `This will approve the ${type} request and notify the project manager.`
              }
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="approvalComments">Comments (Optional)</Label>
              <Textarea
                id="approvalComments"
                placeholder="Add any comments or notes about this approval..."
                value={approvalComments}
                onChange={(e) => setApprovalComments(e.target.value)}
                className="min-h-[100px] focus-visible:ring-0"
              />
            </div>
            <div className="flex gap-3">
              <Button
                onClick={confirmApproval}
                className="flex-1 bg-green-500 hover:bg-green-600"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                {selectedRequests.length > 0
                  ? `Approve ${selectedRequests.length} Request${selectedRequests.length !== 1 ? 's' : ''}`
                  : 'Confirm Approval'
                }
              </Button>
              <Button
                onClick={() => setIsApprovalModalOpen(false)}
                variant="outline"
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Unified Rejection Modal */}
      <Dialog open={isRejectionModalOpen} onOpenChange={(open) => {
        setIsRejectionModalOpen(open);
        if (!open) {
          setRejectionReason("");
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <XCircle className="w-5 h-5" />
              {selectedRequests.length > 0
                ? `Reject ${selectedRequests.length} Request${selectedRequests.length !== 1 ? 's' : ''}`
                : `Reject Request - ${selectedRequest?.id}`
              }
            </DialogTitle>
            <DialogDescription>
              {selectedRequests.length > 0
                ? `Please provide a reason for rejecting ${selectedRequests.length} selected request${selectedRequests.length !== 1 ? 's' : ''}.`
                : `Please provide a reason for rejecting this ${type} request.`
              }
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="rejectionReason">Rejection Reason *</Label>
              <Textarea
                id="rejectionReason"
                placeholder="Please explain why this request is being rejected..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="min-h-[100px]"
                required
              />
            </div>
            <div className="flex gap-3">
              <Button
                onClick={confirmRejection}
                variant="destructive"
                className="flex-1"
                disabled={!rejectionReason.trim()}
              >
                <XCircle className="w-4 h-4 mr-2" />
                {selectedRequests.length > 0
                  ? `Reject ${selectedRequests.length} Request${selectedRequests.length !== 1 ? 's' : ''}`
                  : 'Confirm Rejection'
                }
              </Button>
              <Button
                onClick={() => setIsRejectionModalOpen(false)}
                variant="outline"
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Group Approval Modal */}
      <Dialog open={isGroupApprovalModalOpen} onOpenChange={setIsGroupApprovalModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-green-600">
              <CheckCircle className="w-5 h-5" />
              Approve Group - GRP-{selectedGroupId}
            </DialogTitle>
            <DialogDescription>
              This will approve the {type} request group and notify the project manager.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="groupApprovalComments">Comments (Optional)</Label>
              <Textarea
                id="groupApprovalComments"
                placeholder="Add any comments or notes about this approval..."
                value={groupApprovalComments}
                onChange={(e) => setGroupApprovalComments(e.target.value)}
                className="min-h-[100px] focus-visible:ring-0"
              />
            </div>
            <div className="flex gap-3">
              <Button
                onClick={confirmGroupApproval}
                className="flex-1 bg-green-500 hover:bg-green-600"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Confirm Approval
              </Button>
              <Button
                onClick={() => setIsGroupApprovalModalOpen(false)}
                variant="outline"
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Group Rejection Modal */}
      <Dialog open={isGroupRejectionModalOpen} onOpenChange={setIsGroupRejectionModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <XCircle className="w-5 h-5" />
              Reject Group - GRP-{selectedGroupId}
            </DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this {type} request group.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="groupRejectionReason">Rejection Reason *</Label>
              <Textarea
                id="groupRejectionReason"
                placeholder="Please explain why this group is being rejected..."
                value={groupRejectionReason}
                onChange={(e) => setGroupRejectionReason(e.target.value)}
                className="min-h-[100px]"
                required
              />
            </div>
            <div className="flex gap-3">
              <Button
                onClick={confirmGroupRejection}
                variant="destructive"
                className="flex-1"
                disabled={!groupRejectionReason.trim()}
              >
                <XCircle className="w-4 h-4 mr-2" />
                Confirm Rejection
              </Button>
              <Button
                onClick={() => setIsGroupRejectionModalOpen(false)}
                variant="outline"
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Success Alert */}
      <AlertDialog open={actionSuccess.show} onOpenChange={(open) => setActionSuccess({ ...actionSuccess, show: open })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              {actionSuccess.type === "approved" ? (
                <CheckCircle className="w-5 h-5 text-green-500" />
              ) : (
                <XCircle className="w-5 h-5 text-red-500" />
              )}
              {actionSuccess.requestId.includes("GRP") ? "Group" : "Request"} {actionSuccess.type === "approved" ? "Approved" : "Rejected"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {actionSuccess.requestId.includes("GRP") ? `Group ${actionSuccess.requestId}` : `Request ${actionSuccess.requestId}`} has been successfully {actionSuccess.type}.
              The project manager has been notified of this decision.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setActionSuccess({ show: false, type: "", requestId: "" })}>
              Got it
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

// DemandsTab Component with Pagination
const DemandsTab = ({ demands, onEditDemand }) => {
  const [selectedDemand, setSelectedDemand] = useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [sortField, setSortField] = useState("default");
  const [sortDirection, setSortDirection] = useState("desc");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [resumeCurrentPage, setResumeCurrentPage] = useState(1);
  const [resumeItemsPerPage, setResumeItemsPerPage] = useState(10);
  const [isDemandDetailsOpen, setIsDemandDetailsOpen] = useState(false);

  const [isSkillMatcherOpen, setIsSkillMatcherOpen] = useState(false);
  const [skillMatches, setSkillMatches] = useState(null);
  const [isLoadingMatches, setIsLoadingMatches] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState(null);

  const handleSkillMatcher = async (demand) => {
    setIsLoadingMatches(true);
    setIsSkillMatcherOpen(true);
    setSelectedDemand(demand);

    try {
      const response = await DemandService.getSkillMatches(demand.demandid);
      if (response.data.success) {
        setSkillMatches(response.data.result);
      } else {
        toast.error("Failed to fetch skill matches");
        setSkillMatches(null);
      }
    } catch (error) {
      console.error("Error fetching skill matches:", error);
      toast.error("Error fetching skill matches");
      setSkillMatches(null);
    } finally {
      setIsLoadingMatches(false);
    }
  };

  const handleViewMatch = (match) => {
    setSelectedMatch(match);
  };

  const getMatchScoreColor = (score) => {
    if (score >= 70) return "bg-green-100 text-green-700 border-green-200";
    if (score >= 50) return "bg-yellow-100 text-yellow-700 border-yellow-200";
    if (score >= 30) return "bg-orange-100 text-orange-700 border-orange-200";
    return "bg-red-100 text-red-700 border-red-200";
  };

  const handleViewDemand = (demand) => {
    setSelectedDemand(demand);
    setResumeCurrentPage(1);
    setIsDemandDetailsOpen(false);
    setIsViewModalOpen(true);
  };

  // Apply search filter to demands
  const searchedDemands = useMemo(() => {
    if (!searchQuery.trim()) return demands;

    const query = searchQuery.toLowerCase().trim();
    return demands.filter(demand => {
      return (
        `DM-${demand.demandid}`.toLowerCase().includes(query) ||
        demand.demandTitle?.toLowerCase().includes(query) ||
        demand.projectName?.toLowerCase().includes(query) ||
        demand.accountName?.toLowerCase().includes(query) ||
        demand.departmentName?.toLowerCase().includes(query) ||
        demand.requesterName?.toLowerCase().includes(query) ||
        demand.workLocPref?.toLowerCase().includes(query) ||
        demand.overallStatus?.toLowerCase().includes(query) ||
        demand.priority?.toLowerCase().includes(query) ||
        (demand.skillName && demand.skillName.some(skill =>
          skill.toLowerCase().includes(query)
        ))
      );
    });
  }, [demands, searchQuery]);

  // Reset to first page when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  // Status colors mapping - UPDATED
  const getStatusColor = (status) => {
    switch (status) {
      case "Open":
        return "bg-blue-100 text-blue-700 border-blue-200";
      case "InProgress":
        return "bg-yellow-100 text-yellow-700 border-yellow-200";
      case "Completed":
        return "bg-green-100 text-green-700 border-green-200";
      case "Rejected":
        return "bg-red-100 text-red-700 border-red-200";
      case "Hold":
        return "bg-orange-100 text-orange-700 border-orange-200";
      case "Closed":
        return "bg-purple-100 text-purple-700 border-purple-200";
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

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  const sortedDemands = useMemo(() => {
    const sorted = [...searchedDemands];
    if (sortField === "default") {
      return sorted.sort((a, b) => b.demandid - a.demandid);
    } else if (sortField === "priority") {
      const priorityOrder = { Urgent: 1, High: 2, Medium: 3, Low: 4 };
      return sorted.sort((a, b) => {
        const priorityA = priorityOrder[a.priority] || 5;
        const priorityB = priorityOrder[b.priority] || 5;
        return sortDirection === "asc" ? priorityA - priorityB : priorityB - priorityA;
      });
    } else if (sortField === "createddt") {
      return sorted.sort((a, b) =>
        sortDirection === "asc"
          ? new Date(a.createddt) - new Date(b.createddt)
          : new Date(b.createddt) - new Date(a.createddt)
      );
    } else if (sortField === "demandTitle") {
      return sorted.sort((a, b) =>
        sortDirection === "asc"
          ? a.demandTitle.localeCompare(b.demandTitle)
          : b.demandTitle.localeCompare(a.demandTitle)
      );
    } else if (sortField === "overallStatus") {
      const statusOrder = {
        "Open": 1,
        "InProgress": 2,
        "Hold": 3,
        "Rejected": 4,
        "Completed": 5,
        "Closed": 6
      };
      return sorted.sort((a, b) => {
        const statusA = statusOrder[a.overallStatus] || 7;
        const statusB = statusOrder[b.overallStatus] || 7;
        return sortDirection === "asc" ? statusA - statusB : statusB - statusA;
      });
    }
    return sorted;
  }, [searchedDemands, sortField, sortDirection]);

  // Paginate the sorted demands
  const paginatedDemands = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return sortedDemands.slice(startIndex, startIndex + itemsPerPage);
  }, [sortedDemands, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(sortedDemands.length / itemsPerPage);

  const handleItemsPerPageChange = (newItemsPerPage) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1);
  };

  // Status left-border color
  const getDemandBorderColor = (status) => {
    switch (status) {
      case "Open": return "border-l-blue-500";
      case "InProgress": return "border-l-amber-500";
      case "Completed": return "border-l-emerald-500";
      case "Rejected": return "border-l-red-500";
      case "Hold": return "border-l-orange-500";
      case "Closed": return "border-l-purple-500";
      default: return "border-l-gray-400";
    }
  };

  const getDemandStatusDot = (status) => {
    switch (status) {
      case "Open": return "bg-blue-500";
      case "InProgress": return "bg-amber-500";
      case "Completed": return "bg-emerald-500";
      case "Rejected": return "bg-red-500";
      case "Hold": return "bg-orange-500";
      case "Closed": return "bg-purple-500";
      default: return "bg-gray-400";
    }
  };

  // Render Demand Card - Premium redesign
  const renderDemandCard = (demand, index) => (
    <motion.div
      key={demand.demandid}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
    >
      <div
        className={`bg-white rounded-2xl border border-gray-100 border-l-4 ${getDemandBorderColor(demand.overallStatus)} shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer group overflow-hidden`}
        onClick={() => handleViewDemand(demand)}
      >
        <div className="p-4 md:p-5">
          {/* Top Row: Title + badges + ID */}
          <div className="flex justify-between items-start gap-3 mb-3">
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1.5">
                <h3 className="text-sm md:text-base font-bold text-gray-900 truncate group-hover:text-blue-700 transition-colors" title={demand.demandTitle}>
                  {demand.demandTitle}
                </h3>
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                {/* Status badge with dot */}
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${getStatusColor(demand.overallStatus)}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${getDemandStatusDot(demand.overallStatus)}`} />
                  {demand.overallStatus}
                </span>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${getPriorityColor(demand.priority)}`}>
                  {demand.priority}
                </span>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-orange-50 text-orange-600 border border-orange-200">
                  Demand
                </span>
                {demand.sharedResumes && demand.sharedResumes.length > 0 && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-50 text-indigo-600 border border-indigo-200">
                    <Users className="w-3 h-3" />
                    {demand.sharedResumes.length} Profile{demand.sharedResumes.length > 1 ? 's' : ''} Shared
                  </span>
                )}
              </div>
            </div>

            {/* Demand ID block */}
            <div className="text-right flex-shrink-0">
              <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">Demand ID</p>
              <p className="font-mono font-black text-blue-600 text-base leading-tight">DM-{demand.demandid}</p>
              <div className="text-[9px] text-gray-400 mt-1 space-y-0.5 text-right">
                <div>By: <span className="text-gray-600 font-semibold">{demand.requesterName}</span></div>
                <div>{formatDisplayDate(demand.createddt)}</div>
              </div>
            </div>
          </div>

          {/* Meta pills row */}
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-gray-50 rounded-lg border border-gray-100 text-[11px] text-gray-600 font-medium">
              <Users className="w-3 h-3 text-gray-400" />
              <strong className="text-gray-700">{demand.resourceRequestsCount}</strong> open
            </span>
            {demand.accountName && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-gray-50 rounded-lg border border-gray-100 text-[11px] text-gray-600 font-medium">
                <Target className="w-3 h-3 text-gray-400" />
                {demand.accountName}
              </span>
            )}
            {demand.projectName && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-gray-50 rounded-lg border border-gray-100 text-[11px] text-gray-600 font-medium">
                <Briefcase className="w-3 h-3 text-gray-400" />
                {demand.projectName}
              </span>
            )}
            {demand.departmentName && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-gray-50 rounded-lg border border-gray-100 text-[11px] text-gray-600 font-medium">
                <Building className="w-3 h-3 text-gray-400" />
                {demand.departmentName}
              </span>
            )}
            {demand.workLocPref && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-gray-50 rounded-lg border border-gray-100 text-[11px] text-gray-600 font-medium">
                <MapPin className="w-3 h-3 text-gray-400" />
                {demand.workLocPref}
              </span>
            )}
            {demand.locationType && (
              <span className="inline-flex items-center px-2.5 py-1 bg-gray-50 rounded-lg border border-gray-100 text-[10px] text-gray-500 font-bold uppercase tracking-wider">
                {demand.locationType}
              </span>
            )}
            {demand.workMode && (
              <span className="inline-flex items-center px-2.5 py-1 bg-gray-50 rounded-lg border border-gray-100 text-[10px] text-gray-500 font-bold uppercase tracking-wider">
                {demand.workMode}
              </span>
            )}
          </div>

          {/* Shared Profiles — overlapping avatar stack */}
          {demand.sharedResumes && demand.sharedResumes.length > 0 && (
            <div className="mb-3 p-3 bg-gradient-to-r from-indigo-50/50 to-blue-50/30 rounded-xl border border-indigo-100/70">
              <div className="flex items-center gap-2 mb-2.5">
                <div className="w-5 h-5 bg-indigo-100 rounded-md flex items-center justify-center">
                  <Users className="w-3 h-3 text-indigo-600" />
                </div>
                <span className="text-[11px] font-bold text-gray-700 uppercase tracking-wider">
                  Profiles Shared ({demand.sharedResumes.length})
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {demand.sharedResumes.map((resume, idx) => {
                  const initials = resume.resourceName
                    ? resume.resourceName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
                    : 'R';
                  const avatarStyle = getAvatarStyle(initials);
                  return (
                    <div
                      key={idx}
                      className="flex items-center gap-2 pl-1 pr-3 py-1.5 bg-white rounded-xl border border-gray-100 shadow-sm hover:border-indigo-300 hover:shadow-md transition-all duration-200 group/profile"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div
                        style={avatarStyle}
                        className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 ring-2 ring-white shadow-sm"
                      >
                        {initials}
                      </div>
                      <div className="min-w-0">
                        <p className="text-[11px] font-bold text-gray-800 truncate max-w-[120px]" title={resume.resourceName}>
                          {resume.resourceName}
                        </p>
                        <div className="flex items-center gap-0.5 text-[10px] text-gray-400">
                          <Mail className="w-2.5 h-2.5 shrink-0" />
                          <span className="truncate max-w-[140px]">{resume.resourceEmail}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Skill chips */}
          {demand.skillName && demand.skillName.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-3">
              {demand.skillName.slice(0, 6).map((skill, idx) => (
                <span key={idx} className="inline-flex items-center px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md text-[11px] font-medium border border-slate-200/80">
                  {skill}
                </span>
              ))}
              {demand.skillName.length > 6 && (
                <span className="inline-flex items-center px-2 py-0.5 bg-slate-100 text-slate-500 rounded-md text-[11px] font-medium border border-slate-200/80">
                  +{demand.skillName.length - 6} more
                </span>
              )}
            </div>
          )}

          {/* Premium Skill Matcher Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleSkillMatcher(demand);
            }}
            className="w-full mt-1 h-10 rounded-xl flex items-center justify-center gap-2 font-semibold text-sm text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-md shadow-blue-200 hover:shadow-blue-300 hover:shadow-lg transition-all duration-300 group/btn"
          >
            <Sparkles className="w-4 h-4 group-hover/btn:rotate-12 transition-transform duration-200" />
            Skill Matcher
          </button>
        </div>
      </div>
    </motion.div>
  );

  return (
    <div className="space-y-3">
      {/* Search and Sort Controls */}
      <div className="px-2 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-bold text-gray-800">Demands</h2>
        </div>

        <div className="py-1 flex flex-col lg:flex-row items-start lg:items-center gap-4 w-full lg:w-auto">
          {/* Search Input */}
          <SearchFilter
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search by ID or Title"
          />
        </div>
      </div>

      {/* Pagination */}
      {sortedDemands.length > 0 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          itemsPerPage={itemsPerPage}
          onItemsPerPageChange={handleItemsPerPageChange}
          totalItems={sortedDemands.length}
        />
      )}

      {/* Search Results Info */}
      {searchQuery && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <p className="text-sm text-blue-700">
            Showing {sortedDemands.length} result{sortedDemands.length !== 1 ? 's' : ''} for "{searchQuery}"
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

      {/* Demands List - Full width cards */}
      <div className="space-y-2">
        {paginatedDemands.length > 0 ? (
          paginatedDemands.map((demand, index) => renderDemandCard(demand, index))
        ) : (
          <Card className="bg-white/90 backdrop-blur-sm shadow-lg">
            <CardContent className="p-8 text-center">
              <FileCheck className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-600 mb-2">
                {searchQuery ? "No matching demands found" : "No Demands Found"}
              </h3>
              <p className="text-gray-500">
                {searchQuery
                  ? "Try adjusting your search terms"
                  : "There are currently no demands to display."
                }
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* View Modal */}
      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className="max-w-4xl w-[95vw] flex flex-col p-0 gap-0 bg-white rounded-2xl shadow-2xl border border-gray-100" style={{ maxHeight: '90vh' }}>
          {/* Sticky header */}
          <div className="flex-shrink-0 px-6 pt-5 pb-4 border-b border-gray-100">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-gray-800">{selectedDemand?.demandTitle}</DialogTitle>
              <DialogDescription className="sr-only">
                Demand details for {selectedDemand?.demandTitle}
              </DialogDescription>
            </DialogHeader>
          </div>
          {/* Scrollable body */}
          <div className="flex-1 overflow-y-auto px-6 py-4" style={{ scrollbarWidth: 'thin', scrollbarColor: '#cbd5e1 transparent' }}>
          {selectedDemand && (
            <div className="space-y-6">
              {/* Demand Details & Collapsible Button */}
              <div className="space-y-4">
                {/* Collapsible Demand Details Section */}
                <div>
                  <Button
                    variant="outline"
                    onClick={() => setIsDemandDetailsOpen(!isDemandDetailsOpen)}
                    className="w-full flex items-center justify-between px-4 py-3 border border-gray-200 rounded-xl text-gray-700 hover:bg-gray-50/50 hover:text-gray-900 transition-all font-semibold"
                  >
                    <span className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-blue-500" />
                      Demand Details
                    </span>
                    {isDemandDetailsOpen ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                  </Button>
                  
                  {isDemandDetailsOpen && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-3 border border-gray-100 rounded-xl p-4 bg-gray-50/50 space-y-4 shadow-inner"
                    >
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Project & Account</span>
                          <p className="text-sm font-medium text-gray-700 mt-0.5">{selectedDemand.projectName} - {selectedDemand.accountName}</p>
                        </div>
                        <div>
                          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Role</span>
                          <p className="text-sm font-medium text-gray-700 mt-0.5">{selectedDemand.departmentName}</p>
                        </div>
                        <div>
                          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Years of Experience</span>
                          <p className="text-sm font-medium text-gray-700 mt-0.5">{selectedDemand.yearsofexp}</p>
                        </div>
                        <div>
                          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Project Duration</span>
                          <p className="text-sm font-medium text-gray-700 mt-0.5">{selectedDemand.roleDuration}</p>
                        </div>
                      </div>
                      <div>
                        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Description</span>
                        <div className="mt-1.5 p-3 bg-white border border-gray-200 rounded-lg text-sm text-gray-600 h-36 overflow-y-auto whitespace-pre-wrap leading-relaxed shadow-sm">
                          {selectedDemand.description}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </div>
              </div>

              {selectedDemand.skillName && selectedDemand.skillName.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-3 text-gray-800">Required Skills</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedDemand.skillName.map((skill, idx) => (
                      <Badge key={idx} variant="secondary" className="px-3 py-1">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold mb-3 text-gray-800">Resource Status</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-700">Number of Openings:</span>
                      <span className="text-gray-600">{selectedDemand.resourceRequestsCount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-700">Submitted Profiles:</span>
                      <span className="text-gray-600">{selectedDemand.submittedProfilesCount || 0}</span>
                    </div>
                    {selectedDemand.stageCounts && (
                      <>
                        <div className="flex justify-between">
                          <span className="font-medium text-gray-700">Approval Pending:</span>
                          <span className="text-gray-600">{selectedDemand.stageCounts.approvalPending}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-medium text-gray-700">Interview Scheduled:</span>
                          <span className="text-gray-600">{selectedDemand.stageCounts.interviewScheduled}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-medium text-gray-700">Allocated:</span>
                          <span className="text-gray-600">{selectedDemand.stageCounts.allocated}</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold mb-3 text-gray-800">Timeline</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-700">Demand Open:</span>
                      <span className="text-gray-600">{formatDisplayDate(selectedDemand.demandOpenDt)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-700">Target Fulfillment:</span>
                      <span className="text-gray-600">{formatDisplayDate(selectedDemand.fulfilmentDt)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-700">Created:</span>
                      <span className="text-gray-600">
                        {formatDisplayDate(selectedDemand.createddt)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {selectedDemand?.sharedResumes && selectedDemand.sharedResumes.length > 0 && (() => {
                const totalResumes = selectedDemand.sharedResumes.length;
                const startIndex = (resumeCurrentPage - 1) * resumeItemsPerPage;
                const paginatedResumes = selectedDemand.sharedResumes.slice(startIndex, startIndex + resumeItemsPerPage);
                const totalResumePages = Math.ceil(totalResumes / resumeItemsPerPage);

                return (
                  <div className="mt-6">
                    <h3 className="text-base font-bold mb-3 text-gray-800 flex items-center gap-2">
                      Profile Shared
                      <span className="text-xs font-semibold bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">{totalResumes}</span>
                    </h3>

                    {/* Unified single Table with sticky header */}
                    <div className="border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                      <div className="overflow-x-auto overflow-y-auto" style={{ maxHeight: '350px', scrollbarWidth: 'thin', scrollbarColor: '#cbd5e1 #f8fafc' }}>
                        <table className="w-full bg-white table-auto" style={{ minWidth: '650px' }}>
                          <thead className="bg-gray-50 border-b border-gray-200 sticky top-0 z-10">
                            <tr>
                              <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wide">Resource Name</th>
                              <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wide">Email</th>
                              <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wide">Shared By</th>
                              <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wide">Shared At</th>
                              <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wide">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {paginatedResumes.map((resume, index) => (
                              <tr key={index} className={`transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'} hover:bg-blue-50/30`}>
                                <td className="px-4 py-3 text-sm text-gray-800 font-medium">{resume.resourceName}</td>
                                <td className="px-4 py-3 text-sm">
                                  <a href={`mailto:${resume.resourceEmail}`} className="text-blue-600 hover:text-blue-800 hover:underline transition-colors">
                                    {resume.resourceEmail}
                                  </a>
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-600">
                                  <div className="font-medium">{resume.sharedBy || 'N/A'}</div>
                                  {resume.sharedByEmail && <div className="text-xs text-gray-400 truncate max-w-[160px]" title={resume.sharedByEmail}>{resume.sharedByEmail}</div>}
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap">{formatDisplayDate(resume.sharedAt)}</td>
                                <td className="px-4 py-3 text-sm">
                                  <Badge className={`${
                                    resume.status?.toLowerCase().includes('clear') || resume.status?.toLowerCase().includes('pass') || resume.status?.toLowerCase().includes('selected') || resume.status?.toLowerCase().includes('onboard')
                                      ? 'bg-green-100 text-green-700 border-green-200'
                                      : resume.status?.toLowerCase().includes('reject') || resume.status?.toLowerCase().includes('drop') || resume.status?.toLowerCase().includes('fail')
                                      ? 'bg-red-100 text-red-700 border-red-200'
                                      : 'bg-blue-100 text-blue-700 border-blue-200'
                                  } border text-xs py-0.5 px-2 whitespace-nowrap`}>
                                    {resume.status || 'Shared'}
                                  </Badge>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                    {/* Pagination — always visible below table */}
                    {totalResumes > 0 && (
                      <div className="mt-2">
                        <Pagination
                          currentPage={resumeCurrentPage}
                          totalPages={totalResumePages}
                          onPageChange={setResumeCurrentPage}
                          itemsPerPage={resumeItemsPerPage}
                          onItemsPerPageChange={(val) => {
                            setResumeItemsPerPage(val);
                            setResumeCurrentPage(1);
                          }}
                          totalItems={totalResumes}
                          label="profiles"
                        />
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Edit Button */}
              <div className="flex justify-end pt-4 border-t border-gray-200">
                <Button
                  onClick={() => {
                    onEditDemand(selectedDemand);
                    setIsViewModalOpen(false);
                  }}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Demand
                </Button>
              </div>
            </div>
          )}
          </div>
          {/* END scrollable body */}
        </DialogContent>
      </Dialog>

      {/* Skill Matcher Modal */}
      <Dialog open={isSkillMatcherOpen} onOpenChange={setIsSkillMatcherOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-500" />
              Skill Matcher - {selectedDemand?.demandTitle}
            </DialogTitle>
            <DialogDescription>
              Demand ID: DM-{selectedDemand?.demandid} |
              Matched Employees: {skillMatches?.matchedEmployees || 0} / {skillMatches?.totalEmployees || 0}
            </DialogDescription>
          </DialogHeader>

          {isLoadingMatches ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <Loader className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-4" />
                <p className="text-gray-600">Analyzing skills and finding matches...</p>
              </div>
            </div>
          ) : skillMatches ? (
            <div className="space-y-6">
              {/* Summary Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-blue-50 rounded-lg">
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-600">{skillMatches.totalEmployees}</p>
                  <p className="text-sm text-blue-700">Total Employees</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">{skillMatches.matchedEmployees}</p>
                  <p className="text-sm text-green-700">Matched Employees</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-purple-600">
                    {skillMatches.totalEmployees > 0
                      ? Math.round((skillMatches.matchedEmployees / skillMatches.totalEmployees) * 100)
                      : 0}%
                  </p>
                  <p className="text-sm text-purple-700">Match Rate</p>
                </div>
              </div>

              {/* Matches List */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-800">Top Matches</h3>
                {skillMatches.matches && skillMatches.matches.length > 0 ? (
                  skillMatches.matches
                    .sort((a, b) => b.matchScore - a.matchScore)
                    .map((match, index) => (
                      <Card key={match.employeeId} className="hover:shadow-md transition-shadow">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <h4 className="font-semibold text-gray-800">
                                  {match.firstName} {match.lastName}
                                </h4>
                                <Badge className={getMatchScoreColor(match.matchScore)}>
                                  {match.matchScore}% Match
                                </Badge>
                                <Badge variant="outline" className="text-xs">
                                  {match.status}
                                </Badge>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600 mb-3">
                                <div className="flex items-center gap-1">
                                  <span className="font-medium">Email:</span>
                                  <span>{match.email}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <span className="font-medium">Experience:</span>
                                  <span>{match.experienceYears} years</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <span className="font-medium">Location:</span>
                                  <span>{match.location}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <span className="font-medium">Type:</span>
                                  <span>{match.employmentType}</span>
                                </div>
                              </div>

                              {match.matchingSkills && match.matchingSkills.length > 0 && (
                                <div className="mb-3">
                                  <p className="text-sm font-medium text-gray-700 mb-1">Matching Skills:</p>
                                  <div className="flex flex-wrap gap-1">
                                    {match.matchingSkills.map((skill, idx) => (
                                      <Badge key={idx} className="bg-blue-100 text-blue-700 text-xs">
                                        {skill}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                              )}

                              <div className="bg-gray-50 p-3 rounded-lg">
                                <p className="text-sm font-medium text-gray-700 mb-1"> Analysis:</p>
                                <p className="text-sm text-gray-600">{match.matchReasoning}</p>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-500">No matches found for this demand.</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">Failed to load skill matches.</p>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Match Details Modal */}
      <Dialog open={!!selectedMatch} onOpenChange={(open) => !open && setSelectedMatch(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              Employee Details - {selectedMatch?.firstName} {selectedMatch?.lastName}
            </DialogTitle>
          </DialogHeader>

          {selectedMatch && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="font-medium text-gray-700">Employee ID</p>
                  <p className="text-gray-600">{selectedMatch.employeeId}</p>
                </div>
                <div>
                  <p className="font-medium text-gray-700">Match Score</p>
                  <Badge className={getMatchScoreColor(selectedMatch.matchScore)}>
                    {selectedMatch.matchScore}%
                  </Badge>
                </div>
                <div>
                  <p className="font-medium text-gray-700">Email</p>
                  <p className="text-gray-600">{selectedMatch.email}</p>
                </div>
                <div>
                  <p className="font-medium text-gray-700">Location</p>
                  <p className="text-gray-600">{selectedMatch.location}</p>
                </div>
                <div>
                  <p className="font-medium text-gray-700">Experience</p>
                  <p className="text-gray-600">{selectedMatch.experienceYears} years</p>
                </div>
                <div>
                  <p className="font-medium text-gray-700">Status</p>
                  <p className="text-gray-600">{selectedMatch.status}</p>
                </div>
              </div>

              {selectedMatch.matchingSkills && selectedMatch.matchingSkills.length > 0 && (
                <div>
                  <p className="font-medium text-gray-700 mb-2">Matching Skills</p>
                  <div className="flex flex-wrap gap-1">
                    {selectedMatch.matchingSkills.map((skill, idx) => (
                      <Badge key={idx} className="bg-green-100 text-green-700">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <p className="font-medium text-gray-700 mb-2"> Analysis</p>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-sm text-gray-600">{selectedMatch.matchReasoning}</p>
                </div>
              </div>

              <div className="text-sm text-gray-500">
                <p>Scoring Source: {selectedMatch.scoringSource}</p>
                <p>Resume Available: {selectedMatch.hasResume ? 'Yes' : 'No'}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Main HRDashboard Component
export default function HRDashboard() {
  const [resourceRequests, setResourceRequests] = useState([]);
  const [opportunityRequests, setOpportunityRequests] = useState([]);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [approverUserId, setApproverUserId] = useState(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const initialMessages = [
    {
      id: "initial",
      from: "bot",
      message: "Hello! I'm your HR Assistant. How can I help you today?",
    },
  ];
  const [messages, setMessages] = useState(initialMessages);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const chatRef = useRef(null);
  const [companies, setCompanies] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [isAddDemandOpen, setIsAddDemandOpen] = useState(false);
  const [demandErrors, setDemandErrors] = useState({});
  const [demandForm, setDemandForm] = useState({
    demandTitle: "",
    projectName: "",
    role: "",
    demandOpenDt: null,
    fulfilmentDt: null,
    companyId: "",
    accountId: "",
    departmentId: "",
    yearsOfExp: "",
    roleDuration: "",
    workLocPref: "",
    priority: "Medium",
    locationType: "Hybrid",
    workMode: "FullTime",
    skillIds: "",
    resourceRequests: "",
    description: "",
    overallStatus: "", // NEW: Added status field with default "Open"
  });
  const [skills, setSkills] = useState([]);
  const [skillInput, setSkillInput] = useState("");
  const [filteredSkills, setFilteredSkills] = useState([]);
  const [selectedSkills, setSelectedSkills] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [accountInput, setAccountInput] = useState("");
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [isCreatingAccount, setIsCreatingAccount] = useState(false);
  const [departmentInput, setDepartmentInput] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState(null);
  const [isCreatingDepartment, setIsCreatingDepartment] = useState(false);
  const [demands, setDemands] = useState([]);
  const [activeTab, setActiveTab] = useState("demands");
  const [editingDemand, setEditingDemand] = useState(null);

  const fetchDemands = async () => {
    try {
      const response = await DemandService.fetchDemandList();
      if (response.data.success) {
        setDemands(response.data.result || []);
      }
    } catch (error) {
      console.error("Failed to fetch demands:", error);
      toast.error("Failed to fetch demands");
    }
  };

  // Helper: convert any API date string to yyyy-MM-dd for <input type="date">
  const toInputDate = (val) => {
    if (!val) return "";
    if (/^\d{4}-\d{2}-\d{2}/.test(val)) return val.slice(0, 10);
    const parts = val.split("-");
    if (parts.length === 3 && parts[0].length === 2) return `${parts[2]}-${parts[1]}-${parts[0]}`;
    const d = new Date(val);
    if (!isNaN(d)) return d.toISOString().slice(0, 10);
    return "";
  };

  const resetDemandForm = () => {
    setDemandErrors({});
    setDemandForm({
      demandTitle: "",
      projectName: "",
      role: "",
      demandOpenDt: "",
      fulfilmentDt: "",
      companyId: "",
      accountId: "",
      departmentId: "",
      yearsOfExp: "",
      roleDuration: "",
      workLocPref: "",
      priority: "Medium",
      locationType: "Hybrid",
      workMode: "FullTime",
      skillIds: "",
      resourceRequests: "",
      description: "",
      overallStatus: "",
    });
    setSelectedSkills([]);
    setSkillInput("");
    setFilteredSkills(skills.slice(0, 15).map(s => s.skillName));
    setDepartmentInput('');
    setSelectedDepartment(null);
    setSelectedAccount(null);
    setAccountInput("");
    setEditingDemand(null);
  };

  const handleCreateDemand = async () => {
    const newErrors = {};
    if (!demandForm.demandTitle) newErrors.demandTitle = "Demand Title is required";
    if (!demandForm.resourceRequests) newErrors.resourceRequests = "Number of Resources is required";
    if (!selectedAccount) newErrors.accountId = "Client is required";
    if (!selectedDepartment) newErrors.departmentId = "Role is required";
    if (!demandForm.companyId) newErrors.companyId = "Company is required";
    if (selectedSkills.length === 0) newErrors.skills = "At least one skill is required";
    
    setDemandErrors(newErrors);
    
    if (Object.keys(newErrors).length > 0) {
      toast.error("Please fill in all required fields");
      return;
    }

    const payload = {
      companyId: parseInt(demandForm.companyId),
      requesterUserId: approverUserId,
      accountId: selectedAccount.accountId,
      departmentId: selectedDepartment.departmentId,
      projectName: demandForm.projectName,
      demandTitle: demandForm.demandTitle,
      demandOpenDt: demandForm.demandOpenDt || format(new Date(), "yyyy-MM-dd"),
      fulfilmentDt: demandForm.fulfilmentDt || format(new Date(), "yyyy-MM-dd"),
      yearsofexp: demandForm.yearsOfExp,
      skillIds: selectedSkills.map(s => s.id),
      roleDuration: demandForm.roleDuration,
      workLocPref: demandForm.workLocPref,
      priority: demandForm.priority,
      locationType: demandForm.locationType,
      workMode: demandForm.workMode,
      resourceRequests: parseInt(demandForm.resourceRequests) || 1,
      description: demandForm.description,
      overallStatus: demandForm.overallStatus, // NEW: Include status in payload
    };

    // Validation done earlier

    try {
      const resp = await DemandService.create(payload);
      if (resp.data.success) {
        // Add the newly created demand to the demands state immediately
        const newDemand = resp.data.result; // Assuming the API returns the created demand
        if (newDemand) {
          setDemands(prev => [...prev, newDemand]);
        }

        toast.success("Demand created successfully!");
        setIsAddDemandOpen(false);
        resetDemandForm();
        fetchRequests(); // This fetches resource/opportunity requests
        // You can still call fetchDemands() if you want to ensure the list is fresh
        // but the new demand is already added to state above
        fetchDemands();
      } else {
        // Handle API returned success: false
        if (resp.data.errors && Array.isArray(resp.data.errors)) {
          const errorMessage = resp.data.errors.join(", ");
          toast.error(`Failed to create demand: ${errorMessage}`);
        } else if (resp.data.message) {
          toast.error(`Failed to create demand: ${resp.data.message}`);
        } else {
          toast.error("Failed to create demand");
        }
      }
    } catch (error) {
      console.error("Error creating demand:", error);

      // Handle axios error response
      if (error.response && error.response.data) {
        const errorData = error.response.data;

        if (errorData.errors && Array.isArray(errorData.errors)) {
          // Format: {success: false, errors: ["error1", "error2"]}
          const errorMessage = errorData.errors.join(", ");
          toast.error(`Error creating demand: ${errorMessage}`);
        } else if (errorData.message) {
          // Alternative format: {success: false, message: "error message"}
          toast.error(`Error creating demand: ${errorData.message}`);
        } else if (errorData.error) {
          // Another possible format: {error: "error message"}
          toast.error(`Error creating demand: ${errorData.error}`);
        } else {
          toast.error("An error occurred while creating demand");
        }
      } else if (error.request) {
        // Request was made but no response received
        toast.error("Network error: Unable to connect to server");
      }
    }
  };

  const handleEditDemand = async (demand) => {
    setEditingDemand(demand);

    // Load accounts first if modal is not open
    if (!isAddDemandOpen) {
      try {
        const response = await DemandService.fetchClientList();
        setAccounts(response);
      } catch (error) {
        toast.error("Failed to load accounts");
      }
    }

    // Populate form with demand data
    setDemandForm({
      demandTitle: demand.demandTitle || "",
      projectName: demand.projectName || "",
      role: demand.departmentName || "",
      demandOpenDt: toInputDate(demand.demandOpenDt),
      fulfilmentDt: toInputDate(demand.fulfilmentDt),
      companyId: demand.companyId || "",
      yearsOfExp: demand.yearsofexp || "",
      roleDuration: demand.roleDuration || "",
      workLocPref: demand.workLocPref || "",
      priority: demand.priority || "Medium",
      locationType: demand.locationType || "Hybrid",
      workMode: demand.workMode || "FullTime",
      skillIds: "",
      resourceRequests: demand.resourceRequestsCount?.toString(),
      description: demand.description || "",
      overallStatus: demand.overallStatus,
    });

    // Set selected skills if available
    if (demand.skillName && Array.isArray(demand.skillName)) {
      const skillObjects = demand.skillName.map(skillName => {
        const existingSkill = skills.find(s => s.skillName === skillName);
        return existingSkill ? { id: existingSkill.skillId, name: existingSkill.skillName } : { id: null, name: skillName };
      });
      setSelectedSkills(skillObjects);
    }

    // Set selected account - wait a bit for accounts to load if needed
    setTimeout(() => {
      if (demand.accountId) {
        const account = accounts.find(acc => acc.accountId === demand.accountId);
        if (account) {
          setSelectedAccount(account);
          setAccountInput(account.accountName);
        } else {
          // If account not found in current list, set the account name from demand data
          setAccountInput(demand.accountName || "");
        }
      }
    }, 100);

    // Set selected department
    if (demand.departmentId && departments.length > 0) {
      const department = departments.find(dept => dept.departmentId === demand.departmentId);
      if (department) {
        setSelectedDepartment(department);
        setDepartmentInput(department.departmentName);
      }
    }

    setIsAddDemandOpen(true);
  };

  const handleUpdateDemand = async () => {
    const newErrors = {};
    if (!demandForm.demandTitle) newErrors.demandTitle = "Demand Title is required";
    if (!demandForm.resourceRequests) newErrors.resourceRequests = "Number of Resources is required";
    if (!selectedAccount) newErrors.accountId = "Client is required";
    if (!selectedDepartment) newErrors.departmentId = "Role is required";
    if (!demandForm.companyId) newErrors.companyId = "Company is required";
    if (selectedSkills.length === 0) newErrors.skills = "At least one skill is required";
    
    setDemandErrors(newErrors);
    
    if (Object.keys(newErrors).length > 0) {
      toast.error("Please fill in all required fields");
      return;
    }

    const payload = {
      companyId: parseInt(demandForm.companyId),
      requesterUserId: approverUserId,
      accountId: selectedAccount.accountId,
      departmentId: selectedDepartment.departmentId,
      projectName: demandForm.projectName,
      demandTitle: demandForm.demandTitle,
      demandOpenDt: demandForm.demandOpenDt || format(new Date(), "yyyy-MM-dd"),
      fulfilmentDt: demandForm.fulfilmentDt || format(new Date(), "yyyy-MM-dd"),
      yearsofexp: demandForm.yearsOfExp,
      skillIds: selectedSkills.map(s => s.id),
      roleDuration: demandForm.roleDuration,
      workLocPref: demandForm.workLocPref,
      priority: demandForm.priority,
      locationType: demandForm.locationType,
      workMode: demandForm.workMode,
      resourceRequests: parseInt(demandForm.resourceRequests) || 1,
      description: demandForm.description,
      status: demandForm.overallStatus, // NEW: Include updated status
    };

    // Validation done earlier

    try {
      const resp = await DemandService.update(editingDemand.demandid, payload);
      if (resp.data.success) {
        toast.success("Demand updated successfully!");
        setIsAddDemandOpen(false);
        resetDemandForm();
        fetchRequests(); // Refresh requests as well
        fetchDemands();
      } else {
        // Handle API returned success: false
        if (resp.data.errors && Array.isArray(resp.data.errors)) {
          const errorMessage = resp.data.errors.join(", ");
          toast.error(`Failed to update demand: ${errorMessage}`);
        } else if (resp.data.message) {
          toast.error(`Failed to update demand: ${resp.data.message}`);
        } else {
          toast.error("Failed to update demand");
        }
      }
    } catch (error) {
      console.error("Error updating demand:", error);

      // Handle axios error response
      if (error.response && error.response.data) {
        const errorData = error.response.data;

        if (errorData.errors && Array.isArray(errorData.errors)) {
          // Format: {success: false, errors: ["error1", "error2"]}
          const errorMessage = errorData.errors.join(", ");
          toast.error(`Error updating demand: ${errorMessage}`);
        } else if (errorData.message) {
          // Alternative format: {success: false, message: "error message"}
          toast.error(`Error updating demand: ${errorData.message}`);
        } else if (errorData.error) {
          // Another possible format: {error: "error message"}
          toast.error(`Error updating demand: ${errorData.error}`);
        } else {
          toast.error("An error occurred while updating demand");
        }
      } else if (error.request) {
        // Request was made but no response received
        toast.error("Network error: Unable to connect to server");
      }
    }
  };

  const handleSkillInputChange = (e) => {
    const value = e.target.value;
    setSkillInput(value);

    if (value.trim()) {
      const filtered = skills
        .filter(s => s.skillName.toLowerCase().includes(value.toLowerCase()))
        .map(s => s.skillName);
      setFilteredSkills(filtered);
    } else {
      setFilteredSkills(skills.slice(0, 15).map(s => s.skillName));
    }
  };

  const handleSuggestedSkillClick = (skillName) => {
    addSkill(skillName);
  };

  const addSkill = async (skillName) => {
    if (!skillName.trim()) return;

    const trimmedName = skillName.trim();
    const lowerName = trimmedName.toLowerCase();

    // Check if skill already exists in master list
    const existingSkill = skills.find(s => s.skillName.toLowerCase() === lowerName);

    if (existingSkill) {
      // Use existing skill ID
      if (!selectedSkills.some(s => s.id === existingSkill.skillId)) {
        setSelectedSkills([...selectedSkills, { id: existingSkill.skillId, name: existingSkill.skillName }]);
      }
    } else {
      // Create new skill via API
      try {
        const response = await SkillService.createSkill(demandForm.companyId || 1, trimmedName);
        if (response.data.success) {
          const newSkill = response.data.result;
          setSkills([...skills, newSkill]);
          setFilteredSkills([...filteredSkills, newSkill.skillName]);
          setSelectedSkills([...selectedSkills, { id: newSkill.skillId, name: newSkill.skillName }]);
        }
      } catch (error) {
        console.error("Error creating skill:", error);
        toast.error("Failed to create new skill");
      }
    }

    setSkillInput("");
  };

  const removeSkill = (skillName) => {
    setSelectedSkills(selectedSkills.filter(s => s.name !== skillName));
  };

  useEffect(() => {
    const savedMessages = localStorage.getItem('hrChatHistory');
    if (savedMessages) {
      setMessages(JSON.parse(savedMessages));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('hrChatHistory', JSON.stringify(messages));
  }, [messages]);

  const clearChat = () => {
    setMessages(initialMessages);
  };

  useEffect(() => {
    const fetchDropdownData = async () => {
      try {
        const [compRes, accRes, deptRes] = await Promise.all([
          DemandService.fetchCompanies(),
          DemandService.fetchClientList(),
          DemandService.fetchDepartments(),
        ]);

        setCompanies(compRes.data.result || []);
        setAccounts(accRes || []);
        setDepartments(deptRes.data.result || []);
      } catch (error) {
        console.error("Failed to load dropdowns:", error);
        toast.error("Failed to load dropdown options");
      }
    };

    fetchDropdownData();
  }, []);

  useEffect(() => {
    const fetchSkills = async () => {
      try {
        const response = await SkillService.fetchSkillList();
        const fetchedSkills = response.data.result;
        setSkills(fetchedSkills.sort((a, b) => a.skillName.localeCompare(b.skillName)));
        setFilteredSkills(fetchedSkills.slice(0, 15).map(s => s.skillName));
      } catch (error) {
        console.error(error);
        toast.error("Failed to fetch skills");
      }
    };
    fetchSkills();
  }, []);

  useEffect(() => {
    if (isAddDemandOpen || editingDemand) {
      const loadAccounts = async () => {
        try {
          const response = await DemandService.fetchClientList();
          setAccounts(response);
        } catch (error) {
          toast.error("Failed to load accounts");
        }
      };
      loadAccounts();
    } else {
      setAccountInput("");
      setSelectedAccount(null);
      setAccounts([]);
    }
  }, [isAddDemandOpen, editingDemand]);

  // Account Handlers
  const handleAccountInputChange = (e) => {
    setAccountInput(e.target.value);
  };

  const handleAddAccount = async () => {
    const trimmed = accountInput.trim();
    if (!trimmed || selectedAccount) return;

    if (!demandForm.companyId) {
      toast.error("Please select a Company first");
      return;
    }

    setIsCreatingAccount(true);
    try {
      const payload = {
        companyId: demandForm.companyId,
        accountName: trimmed,
        relationshipStartDate: format(new Date(), "yyyy-MM-dd"),
      };

      const response = await DemandService.createAccount(payload);
      if (response.data.success) {
        const newAccount = response.data.result;
        setAccounts((prev) => [...prev, newAccount]);
        setSelectedAccount(newAccount);
        setAccountInput("");
        toast.success(`Account "${newAccount.accountName}" created and selected!`);

      } else {
        // Show backend error directly
        if (response.data.errors && Array.isArray(response.data.errors) && response.data.errors.length > 0) {
          toast.error(response.data.errors[0]);
        } else if (response.data.message) {
          toast.error(response.data.message);
        } else {
          toast.error("Failed to create account");
        }
      }
    } catch (error) {
      console.error("Error creating account:", error);

      // Show backend error directly
      if (error.response && error.response.data) {
        const errorData = error.response.data;

        if (errorData.errors && Array.isArray(errorData.errors) && errorData.errors.length > 0) {
          toast.error(errorData.errors[0]);
        } else if (errorData.message) {
          toast.error(errorData.message);
        } else if (errorData.error) {
          toast.error(errorData.error);
        } else if (typeof errorData === 'string') {
          toast.error(errorData);
        }
      }
    } finally {
      setIsCreatingAccount(false);
    }
  };

  const createAccountOption = async (name) => {
    const trimmed = name.trim().replace(/\s+/g, ' ');
    const existing = accounts.find((acc) => normalizeOptionName(acc.accountName) === normalizeOptionName(trimmed));
    if (existing) {
      handleSelectAccount(existing);
      return { value: String(existing.accountId), label: existing.accountName };
    }

    if (!demandForm.companyId) {
      toast.error("Please select a Company first");
      return null;
    }

    setIsCreatingAccount(true);
    try {
      const payload = {
        companyId: demandForm.companyId,
        accountName: trimmed,
        relationshipStartDate: format(new Date(), "yyyy-MM-dd"),
      };

      const response = await DemandService.createAccount(payload);
      if (!response.data.success) {
        const errorMsg = response.data.errors?.[0] || response.data.message || "Unable to create value";
        toast.error(errorMsg);
        return null;
      }

      const newAccount = response.data.result;
      setAccounts((prev) => [...prev, newAccount]);
      setSelectedAccount(newAccount);
      toast.success(`Client "${newAccount.accountName}" created and selected!`);
      return { value: String(newAccount.accountId), label: newAccount.accountName };
    } catch (error) {
      console.error("Error creating account:", error);
      const duplicate = accounts.find((acc) => normalizeOptionName(acc.accountName) === normalizeOptionName(trimmed));
      if (duplicate) {
        handleSelectAccount(duplicate);
        toast.info(`Client "${duplicate.accountName}" already exists.`);
        return { value: String(duplicate.accountId), label: duplicate.accountName };
      }
      toast.error("Unable to create value");
      return null;
    } finally {
      setIsCreatingAccount(false);
    }
  };

  const handleSelectAccount = (acc) => {
    setSelectedAccount(acc);
    setAccountInput("");
  };

  const removeAccount = () => {
    setSelectedAccount(null);
  };

  const filteredDepartments = departments.filter((dept) =>
    dept.departmentName.toLowerCase().includes(departmentInput.toLowerCase())
  );

  const filteredAccounts = accounts.filter((acc) =>
    acc.accountName.toLowerCase().includes(accountInput.toLowerCase())
  );

  const fetchRequests = async () => {
    try {
      const resourceResponse = await ResourceRequestService.fetchRequestList();
      const resourceData = resourceResponse.data.result;
      const mappedResources = resourceData.map((req) => ({
        numericId: req.requestId,
        requestTitle: req.demandTitle || req.groupTitle || req.projectName,
        DemandTitle: req.demandTitle,
        GroupTittle: req.groupTitle,
        id: `${req.groupId ? "OPP" : "REQ"}-${String(req.requestId).padStart(3, "0")}`,
        requestId: `REQ-${req.requestId}`,
        groupId: req.groupId || null,
        demandId: req.demandId || null,
        projectName: req.projectName?.trim() || "Unknown Project",
        clientName: req.accountName || "Unknown Client",
        numberOfResources: req.numberOfResources || 0,
        primarySkills: req.primarySkills || [],
        secondarySkills: req.secondarySkills || [],
        experienceRange: req.experienceRange ? `${req.experienceRange} years` : "Not Specified",
        projectStartDate: "",
        projectEndDate: "",
        projectDuration: "",
        priority: req.priority || "Medium",
        workMode: req.workMode === "FullTime" ? "Onsite" : req.workMode || "Not Specified",
        locationType: req.locationType || "Not Specified",
        estimatedCostTotal: req.estimatedCostTotal ? `$${req.estimatedCostTotal}` : "Not Allocated",
        status: req.status,
        submittedDate: req.submittedDate || new Date().toISOString().split("T")[0],
        description: req.description || "",
        location: req.location || "Not Specified",
        requestedBy: req.requesterName || "Unknown",
        hrComments: req.remarks || "",
        approvedDate: req.status === "Approved" ? req.submittedDate : "",
        rejectionReason: req.rejectionReason || "",
        interviewScheduled: false,
        interviewStatus: "Not_Scheduled",
      }));

      const opportunityResponse = await OpportunityService.fetchResourceRequestGroups();
      const opportunityData = opportunityResponse.data.result;
      const mappedOpportunities = opportunityData.map((group) => ({
        numericId: group.groupId,
        id: `GRP-${String(group.groupId).padStart(3, "0")}`,
        requestId: `GRP-${String(group.groupId).padStart(3, "0")}`,
        groupId: group.groupId,
        projectName: group.projectDetails.projectName?.trim() || "Unknown Project",
        clientName: group.companyName || "Unknown Client",
        numberOfResources: group.totalRequested || 0,
        primarySkills: [],
        secondarySkills: [],
        experienceRange: "Not Specified",
        projectStartDate: "",
        projectEndDate: "",
        projectDuration: "",
        priority: "Medium",
        workMode: group.workMode === "FullTime" ? "Onsite" : group.workMode || "Not Specified",
        locationType: "Not Specified",
        estimatedCostTotal: "Not Alloted",
        status: group.status,
        submittedDate: group.createdAt.split("T")[0] || new Date().toISOString().split("T")[0],
        description: group.title || "",
        location: group.location,
        requestedBy: group.createdByName || "Unknown",
        hrComments: "",
        approvedDate: group.status === "HRApproved" ? group.createdAt.split("T")[0] : "",
        rejectionReason: "",
        interviewScheduled: false,
        interviewStatus: "Not_Scheduled",
      }));

      setResourceRequests(mappedResources);
      setOpportunityRequests(mappedOpportunities);
    } catch (error) {
      console.error("Failed to fetch requests:", error);
      toast.error("Failed to fetch requests");
    }
  };

  useEffect(() => {
    async function init() {
      setIsInitialLoading(true);
      try {
        const userId = localStorage.getItem("userId");
        if (!userId) {
          toast.error("No user ID found. Please log in again.");
          return;
        }
        setApproverUserId(userId);
        await Promise.all([fetchRequests(), fetchDemands()]);
      } catch (error) {
        console.error("Failed to initialize dashboard:", error);
        toast.error("Failed to initialize dashboard");
      } finally {
        setIsInitialLoading(false);
      }
    }

    init();
  }, []);

  const handleChatSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = {
      id: Date.now().toString(),
      from: "user",
      message: input,
    };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }

    try {
      const response = await ChatService.ask(input);
      const botMessageContent = response.response || 'Sorry, I didn\'t get that.';
      const botMessage = {
        id: (Date.now() + 1).toString(),
        from: "bot",
        message: botMessageContent,
      };
      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      console.error("Chat error:", error);
      const errorMessage = {
        id: (Date.now() + 1).toString(),
        from: "bot",
        message: 'Sorry, Server is down. Please try again.',
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      if (chatRef.current) {
        chatRef.current.scrollTop = chatRef.current.scrollHeight;
      }
    }
  };

  // Department Handlers
  const handleDepartmentInputChange = (e) => setDepartmentInput(e.target.value);

  const handleSelectDepartment = (dept) => {
    setSelectedDepartment(dept);
    setDemandForm(prev => ({ ...prev, departmentId: dept.departmentId }));
    setDepartmentInput('');
  };

  const removeDepartment = () => {
    setSelectedDepartment(null);
    setDemandForm(prev => ({ ...prev, departmentId: null }));
  };

  const handleAddDepartment = async () => {
    if (!departmentInput.trim() || !demandForm.companyId) return;

    setIsCreatingDepartment(true);
    try {
      const payload = {
        companyId: demandForm.companyId,
        departmentName: departmentInput.trim(),
      };

      const response = await DemandService.createDepartment(payload);

      if (response.data.success) {
        const newDepartment = response.data.result;
        setDepartments((prev) => [...prev, newDepartment]);
        handleSelectDepartment(newDepartment);
        toast.success("New department created successfully!");
        setDepartmentInput('');
      } else {
        // Show backend error directly
        const errorMsg = response.data.errors?.[0] || response.data.message;
        if (errorMsg) toast.error(errorMsg);
      }
    } catch (error) {
      console.error("Failed to create department:", error);

      // Show backend error directly
      if (error.response?.data) {
        const errorData = error.response.data;
        const errorMsg = errorData.errors?.[0] || errorData.message || errorData.error ||
          (typeof errorData === 'string' ? errorData : null);
        if (errorMsg) toast.error(errorMsg);
      }
    } finally {
      setIsCreatingDepartment(false);
    }
  };

  const createDepartmentOption = async (name) => {
    const trimmed = name.trim().replace(/\s+/g, ' ');
    const existing = departments.find((dept) => normalizeOptionName(dept.departmentName) === normalizeOptionName(trimmed));
    if (existing) {
      handleSelectDepartment(existing);
      return { value: String(existing.departmentId), label: existing.departmentName };
    }

    if (!demandForm.companyId) {
      toast.error("Please select a Company first");
      return null;
    }

    setIsCreatingDepartment(true);
    try {
      const payload = {
        companyId: demandForm.companyId,
        departmentName: trimmed,
      };

      const response = await DemandService.createDepartment(payload);
      if (!response.data.success) {
        const errorMsg = response.data.errors?.[0] || response.data.message || "Unable to create value";
        toast.error(errorMsg);
        return null;
      }

      const newDepartment = response.data.result;
      setDepartments((prev) => [...prev, newDepartment]);
      handleSelectDepartment(newDepartment);
      toast.success(`Department "${newDepartment.departmentName}" created and selected!`);
      return { value: String(newDepartment.departmentId), label: newDepartment.departmentName };
    } catch (error) {
      console.error("Failed to create department:", error);
      const duplicate = departments.find((dept) => normalizeOptionName(dept.departmentName) === normalizeOptionName(trimmed));
      if (duplicate) {
        handleSelectDepartment(duplicate);
        toast.info(`Department "${duplicate.departmentName}" already exists.`);
        return { value: String(duplicate.departmentId), label: duplicate.departmentName };
      }
      toast.error("Unable to create value");
      return null;
    } finally {
      setIsCreatingDepartment(false);
    }
  };

  const renderMessageContent = (message) => {
    if (typeof message === 'string') {
      return <p className="whitespace-pre-wrap">{message}</p>;
    } else if (Array.isArray(message)) {
      if (message.length === 0) return <p>No data available.</p>;
      const headers = Object.keys(message[0]);
      return (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-200 rounded-lg shadow-sm">
            <thead className="bg-gray-50">
              <tr>
                {headers.map((header) => (
                  <th key={header} className="px-4 py-2 text-left text-sm font-medium text-gray-700 capitalize border-b">
                    {header.replace(/_/g, ' ')}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {message.map((item, index) => (
                <tr key={index} className="hover:bg-gray-50 transition-colors">
                  {headers.map((header) => (
                    <td key={header} className="px-4 py-2 text-sm text-gray-600 border-b">
                      {item[header] || '-'}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    } else {
      return <pre className="whitespace-pre-wrap text-sm">{JSON.stringify(message, null, 2)}</pre>;
    }
  };

  if (isInitialLoading || !approverUserId) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-xl text-gray-600">Loading HR Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-1 sm:p-2 space-y-3 relative w-full">
      {/* Chat Bot */}
      <AnimatePresence>
        {isChatOpen && (
          <motion.div
            initial={{ opacity: 0, y: 100, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 100, scale: 0.95 }}
            transition={{ duration: 0.3, type: "spring", stiffness: 200 }}
            className="fixed bottom-24 right-4 w-96 bg-white rounded-2xl shadow-2xl z-50 border border-gray-100 overflow-hidden"
          >
            <div className="flex justify-between items-center p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-2xl border-b border-gray-100">
              <div className="flex items-center gap-2">
                <MessageCircle className="w-5 h-5 text-blue-600" />
                <h3 className="text-lg font-semibold text-gray-800">HR AI Assistant</h3>
              </div>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  onClick={clearChat}
                  className="text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-full p-1 transition-colors"
                >
                  <RefreshCw className="w-5 h-5" />
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => setIsChatOpen(false)}
                  className="text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-full p-1 transition-colors"
                >
                  <XCircle className="w-5 h-5" />
                </Button>
              </div>
            </div>
            <div className="bg-white/95 backdrop-blur-sm">
              <div className="flex flex-col h-[400px]">
                <div ref={chatRef} className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex items-start gap-3 ${msg.from === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      {msg.from === 'bot' && (
                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                          <Bot className="w-5 h-5 text-blue-600" />
                        </div>
                      )}
                      <div
                        className={`max-w-[80%] p-4 rounded-2xl shadow-sm transition-all duration-200 ${msg.from === 'user'
                          ? 'bg-blue-500 text-white rounded-br-none'
                          : 'bg-gray-100 text-gray-800 rounded-bl-none'
                          }`}
                      >
                        {renderMessageContent(msg.message)}
                      </div>
                      {msg.from === 'user' && (
                        <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
                          <User className="w-5 h-5 text-indigo-600" />
                        </div>
                      )}
                    </div>
                  ))}
                  {isLoading && (
                    <div className="flex justify-start items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                        <Bot className="w-5 h-5 text-blue-600" />
                      </div>
                      <div className="max-w-[80%] p-4 rounded-2xl bg-gray-100 text-gray-800 rounded-bl-none shadow-sm flex items-center gap-2">
                        <Loader className="w-5 h-5 animate-spin text-blue-600" />
                        <span className="text-sm">Processing...</span>
                      </div>
                    </div>
                  )}
                </div>
                <form onSubmit={handleChatSubmit} className="p-3 border-t border-gray-100 bg-white flex gap-2">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    className="flex-1 p-3 border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm transition-all"
                    placeholder="Ask me anything..."
                    disabled={isLoading}
                  />
                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="bg-blue-600 hover:bg-blue-700 text-white rounded-full p-4 flex items-center justify-center transition-colors disabled:opacity-50"
                  >
                    <Send className="w-7 h-7" strokeWidth={3} />
                  </Button>
                </form>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Premium Dashboard Header ── */}
      <motion.div
        initial={{ opacity: 0, y: -24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease: "easeOut" }}
        className="relative overflow-hidden rounded-3xl mb-6"
      >
        {/* Animated mesh gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-900" />
        <div className="absolute inset-0 opacity-30" style={{ backgroundImage: 'radial-gradient(ellipse at 20% 50%, #6366f1 0%, transparent 50%), radial-gradient(ellipse at 80% 20%, #3b82f6 0%, transparent 50%), radial-gradient(ellipse at 60% 80%, #8b5cf6 0%, transparent 40%)' }} />
        {/* Subtle grid pattern */}
        <div className="absolute inset-0 opacity-5" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

        <div className="relative p-6 md:p-8">
          {/* Header text section */}
          <div className="text-center mb-6">
            <motion.div
              initial={{ scale: 0.7, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="mb-4"
            >
              {/* Glowing icon */}
              <div className="relative w-16 h-16 mx-auto mb-4">
                <div className="absolute inset-0 bg-blue-400/30 rounded-2xl blur-lg animate-pulse" />
                <div className="relative w-16 h-16 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-2xl flex items-center justify-center shadow-2xl shadow-blue-500/40">
                  <UserCheck className="w-8 h-8 text-white" />
                </div>
              </div>
              <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight mb-2">
                HR Manager Dashboard
              </h1>
              <p className="text-sm text-blue-200/80 max-w-md mx-auto leading-relaxed">
                Review and approve resource and opportunity requests from project managers
              </p>
            </motion.div>

            {/* CTA Buttons */}
            <div className="flex gap-3 justify-center flex-wrap">
              <motion.button
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => setIsChatOpen(!isChatOpen)}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-white/10 hover:bg-white/20 text-white border border-white/20 hover:border-white/30 backdrop-blur-sm transition-all duration-200 shadow-lg"
              >
                <Bot className="w-4 h-4" />
                AI Assistant
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => { setEditingDemand(null); setIsAddDemandOpen(true); }}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-emerald-400 to-green-500 hover:from-emerald-500 hover:to-green-600 text-white shadow-lg shadow-emerald-500/25 transition-all duration-200"
              >
                <Plus className="w-4 h-4" />
                Create Demand
              </motion.button>
            </div>
          </div>

          {/* Stats Cards inside header */}
          <StatisticsCards
            activeTab={activeTab}
            onTabChange={setActiveTab}
            resourceRequests={resourceRequests}
            opportunityRequests={opportunityRequests}
            demands={demands}
          />
        </div>
      </motion.div>

      {/* ── Premium Tab Switcher ── */}
      <Tabs defaultValue="demands" className="space-y-5" onValueChange={setActiveTab}>
        <div className="flex justify-center">
          <TabsList className="inline-flex bg-white border border-gray-200 shadow-sm rounded-2xl p-1 gap-1">
            <TabsTrigger
              value="demands"
              className="cursor-pointer px-6 py-2 rounded-xl text-sm font-semibold transition-all duration-200 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-md data-[state=active]:shadow-blue-200 data-[state=inactive]:text-gray-500 data-[state=inactive]:hover:text-gray-700"
            >
              Demands
            </TabsTrigger>
            <TabsTrigger
              value="opportunity"
              className="cursor-pointer px-6 py-2 rounded-xl text-sm font-semibold transition-all duration-200 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-md data-[state=active]:shadow-blue-200 data-[state=inactive]:text-gray-500 data-[state=inactive]:hover:text-gray-700"
            >
              Opportunities
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="opportunity">
          <RequestTab
            type="opportunity"
            service={OpportunityService}
            approverUserId={approverUserId}
            requests={opportunityRequests}
            refresh={fetchRequests}
          />
        </TabsContent>

        <TabsContent value="demands">
          <DemandsTab demands={demands} onEditDemand={handleEditDemand} />
        </TabsContent>
      </Tabs>

      {/* Create/Edit Demand Modal */}
      <Dialog open={isAddDemandOpen} onOpenChange={(open) => {
        setIsAddDemandOpen(open);
        if (!open) resetDemandForm();
      }}>
        <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0 bg-white shadow-2xl rounded-2xl overflow-hidden">
          <DialogHeader className="p-6 pb-4 border-b border-gray-200 bg-white z-10">
            <DialogTitle className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <Plus className="w-8 h-8 text-emerald-600 bg-emerald-100 p-1 rounded-full" />
              {editingDemand ? `Edit Demand - ${editingDemand.demandTitle}` : 'Create New Demand'}
              <Button
                variant="outline"
                size="lg"
                onClick={() => {
                  setIsAddDemandOpen(false);
                  resetDemandForm();
                }}
                className="ml-auto px-4 rounded-xl border-gray-300 hover:border-gray-400 -mr-2"
              >
                <XCircle />
              </Button>
            </DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto px-6 py-8 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
            <form onSubmit={(e) => {
              e.preventDefault();
              editingDemand ? handleUpdateDemand() : handleCreateDemand();
            }} className="space-y-8">
              {/* Basic Information */}
              <section className="space-y-6">
                <h3 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                  <Briefcase className="w-5 h-5 text-blue-600" />
                  Basic Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="demandTitle" className="flex items-center gap-1">
                      Demand Title <span className="text-red-500">*</span>
                    </Label>
                    <input
                      id="demandTitle"
                      type="text"
                      placeholder="Enter demand title"
                      value={demandForm.demandTitle}
                      onChange={(e) => {
                        setDemandForm({ ...demandForm, demandTitle: e.target.value });
                        if(demandErrors.demandTitle) setDemandErrors({...demandErrors, demandTitle: null});
                      }}
                      className={`w-full h-11 px-4 border rounded-xl focus:ring-2 focus:ring-emerald-500 transition-all ${demandErrors.demandTitle ? 'border-red-500' : 'border-gray-300'}`}
                      aria-invalid={!!demandErrors.demandTitle}
                    />
                    {demandErrors.demandTitle && <p className="text-red-500 text-xs mt-1">{demandErrors.demandTitle}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="projectName" className="flex items-center gap-1">
                      Project Name
                    </Label>
                    <input
                      id="projectName"
                      type="text"
                      placeholder="Enter project name"
                      value={demandForm.projectName}
                      onChange={(e) => setDemandForm({ ...demandForm, projectName: e.target.value })}
                      className="w-full h-11 px-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 transition-all"

                    />
                  </div>

                                    <div className="space-y-2">
                    <Label htmlFor="demandOpenDt">Demand Open Date</Label>
                    <input
                      id="demandOpenDt"
                      type="date"
                      value={demandForm.demandOpenDt}
                      onChange={(e) => setDemandForm({ ...demandForm, demandOpenDt: e.target.value })}
                      className="w-full h-11 px-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 transition-all"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="fulfilmentDt">Target Fulfilment Date</Label>
                    <input
                      id="fulfilmentDt"
                      type="date"
                      value={demandForm.fulfilmentDt}
                      onChange={(e) => setDemandForm({ ...demandForm, fulfilmentDt: e.target.value })}
                      className="w-full h-11 px-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 transition-all"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="priority" className="flex items-center gap-1">
                      Priority
                    </Label>
                    <SearchableSelect
                      value={demandForm.priority}
                      onValueChange={(value) => setDemandForm({ ...demandForm, priority: value })}
                      options={[
                        { value: "Low", label: "Low" },
                        { value: "Medium", label: "Medium" },
                        { value: "High", label: "High" },
                      ]}
                      placeholder="Select priority"
                      triggerClassName="h-11 px-4 border-gray-300 rounded-xl focus-within:ring-emerald-500"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="resourceRequests" className="flex items-center gap-1">
                      Number of Resources <span className="text-red-500">*</span>
                    </Label>
                    <input
                      id="resourceRequests"
                      type="number"
                      min="1"
                      placeholder="e.g., 3"
                      value={demandForm.resourceRequests}
                      onChange={(e) => {
                        setDemandForm({ ...demandForm, resourceRequests: e.target.value });
                        if(demandErrors.resourceRequests) setDemandErrors({...demandErrors, resourceRequests: null});
                      }}
                      className={`w-full h-11 px-4 border rounded-xl focus:ring-2 focus:ring-emerald-500 transition-all ${demandErrors.resourceRequests ? 'border-red-500' : 'border-gray-300'}`}
                      aria-invalid={!!demandErrors.resourceRequests}
                    />
                    {demandErrors.resourceRequests && <p className="text-red-500 text-xs mt-1">{demandErrors.resourceRequests}</p>}
                  </div>

                  {/* Status Field - Only show when editing */}
                  {editingDemand && (
                    <div className="space-y-2">
                      <Label htmlFor="overallStatus" className="flex items-center gap-1">
                        Status <span className="text-red-500">*</span>
                      </Label>
                      <SearchableSelect
                        value={demandForm.overallStatus}
                        onValueChange={(value) => setDemandForm({ ...demandForm, overallStatus: value })}
                        options={[
                          { value: "Closed", label: "Closed" },
                          { value: "Hold", label: "Hold" },
                          { value: "Open", label: "Open" },
                        ]}
                        placeholder="Select status"
                        triggerClassName="h-11 px-4 border-gray-300 rounded-xl focus-within:ring-emerald-500"
                      />
                    </div>
                  )}
                </div>
              </section>

              {/* Client & Role Details */}
              <section className="space-y-6">
                <h3 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                  <Users className="w-5 h-5 text-purple-600" />
                  Client & Role Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="companyId">Company <span className="text-red-500">*</span></Label>
                    <SearchableSelect
                      value={demandForm.companyId?.toString() || ""}
                      onValueChange={(value) => {
                        setDemandForm({ ...demandForm, companyId: value ? parseInt(value, 10) : null });
                        if(demandErrors.companyId) setDemandErrors({...demandErrors, companyId: null});
                      }}
                      options={companies.map((comp) => ({ value: comp.companyId, label: comp.companyName }))}
                      placeholder="Select company"
                      triggerClassName={`h-11 px-4 rounded-xl focus-within:ring-emerald-500 ${demandErrors.companyId ? 'border-red-500' : 'border-gray-300'}`}
                      clearable
                    />
                    {demandErrors.companyId && <p className="text-red-500 text-xs mt-1">{demandErrors.companyId}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="accountInput">Client <span className="text-red-500">*</span></Label>
                    <SearchableSelect
                      value={selectedAccount?.accountId?.toString() || ''}
                      onValueChange={(value) => {
                        if(demandErrors.accountId) setDemandErrors({...demandErrors, accountId: null});
                        if (!value) {
                          removeAccount();
                          return;
                        }
                        const account = accounts.find((acc) => acc.accountId?.toString() === value);
                        if (account) handleSelectAccount(account);
                      }}
                      options={accounts.map((acc) => ({ value: acc.accountId, label: acc.accountName }))}
                      placeholder="Search or create client"
                      triggerClassName={`h-11 px-4 rounded-xl focus-within:ring-emerald-500 ${demandErrors.accountId ? 'border-red-500' : 'border-gray-300'}`}
                      allowCreate
                      onCreate={createAccountOption}
                      creating={isCreatingAccount}
                      clearable
                    />
                    {demandErrors.accountId && <p className="text-red-500 text-xs mt-1">{demandErrors.accountId}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="departmentInput">Role<span className="text-red-500">*</span></Label>
                    <SearchableSelect
                      value={selectedDepartment?.departmentId?.toString() || ''}
                      onValueChange={(value) => {
                        if(demandErrors.departmentId) setDemandErrors({...demandErrors, departmentId: null});
                        if (!value) {
                          removeDepartment();
                          return;
                        }
                        const department = departments.find((dept) => dept.departmentId?.toString() === value);
                        if (department) handleSelectDepartment(department);
                      }}
                      options={departments.map((dept) => ({ value: dept.departmentId, label: dept.departmentName }))}
                      placeholder="Search or create role"
                      triggerClassName={`h-11 px-4 rounded-xl focus-within:ring-emerald-500 ${demandErrors.departmentId ? 'border-red-500' : 'border-gray-300'}`}
                      allowCreate
                      onCreate={createDepartmentOption}
                      creating={isCreatingDepartment}
                      clearable
                    />
                    {demandErrors.departmentId && <p className="text-red-500 text-xs mt-1">{demandErrors.departmentId}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="yearsOfExp">Years of Experience</Label>
                    <input id="yearsOfExp" type="text" placeholder="e.g., 3-5" value={demandForm.yearsOfExp}
                      onChange={(e) => setDemandForm({ ...demandForm, yearsOfExp: e.target.value })}
                      className="w-full h-11 px-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 transition-all" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="roleDuration">Role Duration(e.g.,6 months)</Label>
                    <input id="roleDuration" type="text" placeholder="e.g., 6 months" value={demandForm.roleDuration}
                      onChange={(e) => setDemandForm({ ...demandForm, roleDuration: e.target.value })}
                      className="w-full h-11 px-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 transition-all" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="workLocPref">Work Location Preference</Label>
                    <input id="workLocPref" type="text" placeholder="e.g., Chennai" value={demandForm.workLocPref}
                      onChange={(e) => setDemandForm({ ...demandForm, workLocPref: e.target.value })}
                      className="w-full h-11 px-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 transition-all" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="locationType">Location Type</Label>
                    <SearchableSelect
                      value={demandForm.locationType}
                      onValueChange={(value) => setDemandForm({ ...demandForm, locationType: value })}
                      options={[
                        { value: "Onsite", label: "Onsite" },
                        { value: "Remote", label: "Remote" },
                        { value: "Hybrid", label: "Hybrid" },
                      ]}
                      placeholder="Select location type"
                      triggerClassName="h-11 px-4 border-gray-300 rounded-xl focus-within:ring-emerald-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="workMode">Work Mode</Label>
                    <SearchableSelect
                      value={demandForm.workMode}
                      onValueChange={(value) => setDemandForm({ ...demandForm, workMode: value })}
                      options={[
                        { value: "FullTime", label: "FullTime" },
                        { value: "PartTime", label: "PartTime" },
                        { value: "Contract", label: "Contract" },
                      ]}
                      placeholder="Select work mode"
                      triggerClassName="h-11 px-4 border-gray-300 rounded-xl focus-within:ring-emerald-500"
                    />
                  </div>
                </div>
              </section>

              {/* Skills */}
              <section className="space-y-6">
                <h3 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                  <Target className="w-5 h-5 text-indigo-600" />
                  Skills
                </h3>

                <div className="space-y-2">
                  <Label htmlFor="skills">Add Skills (Required/Nice to have)</Label>
                  <div className="flex gap-2">
                    <Input
                      id="skills"
                      type="text"
                      placeholder="e.g., React, Python"
                      value={skillInput}
                      onChange={(e) => {
                        handleSkillInputChange(e);
                        if(demandErrors.skills) setDemandErrors({...demandErrors, skills: null});
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addSkill(skillInput);
                          if(demandErrors.skills) setDemandErrors({...demandErrors, skills: null});
                        }
                      }}
                      className={`w-full h-11 px-4 border rounded-xl focus:ring-2 focus:ring-emerald-500 transition-all ${demandErrors.skills ? 'border-red-500' : 'border-gray-300'}`}
                    />
                    <Button
                      type="button"
                      onClick={() => {
                        addSkill(skillInput);
                        if(demandErrors.skills) setDemandErrors({...demandErrors, skills: null});
                      }}
                      className="h-11 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600"
                    >
                      Add
                    </Button>
                  </div>
                  {demandErrors.skills && <p className="text-red-500 text-xs mt-1">{demandErrors.skills}</p>}
                  <div className="flex flex-wrap gap-2 mt-2">
                    {selectedSkills.map((skill, index) => (
                      <Badge
                        key={index}
                        className="bg-indigo-100 text-indigo-700 border border-indigo-200 px-2 py-1 rounded-full flex items-center gap-1"
                      >
                        {skill.name}
                        <button
                          onClick={() => removeSkill(skill.name)}
                          className="ml-1 text-indigo-700 hover:text-red-500"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                  <div className="text-xs text-gray-500 mt-2">Suggested skills:</div>
                  <div className="flex flex-wrap gap-1">
                    {filteredSkills.map((skill) => (
                      <Badge
                        key={skill}
                        variant="outline"
                        className="cursor-pointer hover:bg-gray-100"
                        onClick={() => handleSuggestedSkillClick(skill)}
                      >
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
                {/* Description Field */}
                <div className="col-span-full space-y-2">
                  <Label htmlFor="description" className="flex items-center gap-1">
                    Description
                  </Label>
                  <div className="relative">
                    <Textarea
                      id="description"
                      placeholder="Enter demand description, requirements, or additional notes..."
                      value={demandForm.description}
                      onChange={(e) => {
                        // Limit to 500 words
                        const words = e.target.value.split(/\s+/);
                        if (words.length <= 500 || e.target.value.length < demandForm.description.length) {
                          setDemandForm({ ...demandForm, description: e.target.value });
                        }
                      }}
                      className="min-h-[120px] resize-vertical focus:ring-2 focus:ring-emerald-500 transition-all pr-20"
                    />
                    <div className={`absolute bottom-3 right-3 text-xs ${demandForm.description.split(/\s+/).filter(word => word.length > 0).length >= 450
                      ? 'text-orange-500 font-medium'
                      : 'text-gray-400'
                      }`}>
                      {demandForm.description.split(/\s+/).filter(word => word.length > 0).length}/500 words
                    </div>
                  </div>
                </div>
              </section>
            </form>
          </div>

          <div className="flex gap-4 justify-end p-6 border-t border-gray-200 bg-gray-50/80 rounded-b-2xl">
            <Button
              variant="outline"
              size="lg"
              onClick={() => {
                setIsAddDemandOpen(false);
                resetDemandForm();
              }}
              className="px-8 rounded-xl border-gray-300 hover:border-gray-400"
            >
              Cancel
            </Button>
            <Button
              onClick={editingDemand ? handleUpdateDemand : handleCreateDemand}
              size="lg"
              className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 shadow-lg"
            >
              <Plus className="w-5 h-5 mr-2" />
              {editingDemand ? 'Update Demand' : 'Create Demand'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
