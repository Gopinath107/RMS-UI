import React, { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "./ui/card";
import { Badge } from "./ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import {
  Users,
  Target,
  FileCheck,
  Building,
  MapPin,
  Search,
  Sparkles,
  Loader,
  Briefcase,
  Calendar,
  Clock,
  CheckCircle,
  Home,
  Monitor,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "./ui/tabs";
import { toast } from "sonner";
import { DemandService } from "../services/DemandService";
import { SkillService } from "../services/SkillsService";
import { ResourceRequestService } from "../services/RequestResourceService";
import { OpportunityService } from "../services/OpportunityService";

// Search Filter Component
const SearchFilter = ({ value, onChange, placeholder = "Search..." }) => (
  <div className="relative w-full max-w-md">
    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
    <Input
      type="text"
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
    />
  </div>
);

// Pagination Component
const Pagination = ({ currentPage, totalPages, onPageChange, itemsPerPage, onItemsPerPageChange, totalItems }) => {
  const itemsPerPageOptions = [5, 10, 20, 50];

  return (
    <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-6 p-4 bg-gray-50 rounded-lg">
      <div className="flex items-center gap-4">
        <span className="text-sm text-gray-600">
          Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems} items
        </span>
        
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Items per page:</span>
          <select
            value={itemsPerPage}
            onChange={(e) => onItemsPerPageChange(Number(e.target.value))}
            className="px-2 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {itemsPerPageOptions.map(option => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="flex items-center gap-1"
        >
          <ChevronLeft className="w-4 h-4" />
          Previous
        </Button>
        
        <div className="flex items-center gap-1">
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            let pageNum;
            if (totalPages <= 5) {
              pageNum = i + 1;
            } else if (currentPage <= 3) {
              pageNum = i + 1;
            } else if (currentPage >= totalPages - 2) {
              pageNum = totalPages - 4 + i;
            } else {
              pageNum = currentPage - 2 + i;
            }

            return (
              <Button
                key={pageNum}
                variant={currentPage === pageNum ? "default" : "outline"}
                size="sm"
                onClick={() => onPageChange(pageNum)}
                className={`w-8 h-8 p-0 ${currentPage === pageNum ? 'bg-blue-600 text-white' : ''}`}
              >
                {pageNum}
              </Button>
            );
          })}
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="flex items-center gap-1"
        >
          Next
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};

// Statistics Cards Component for Recruiter
const StatisticsCards = ({ activeTab, onTabChange, demands, resourceRequests, opportunityRequests }) => {
  const getTabSpecificCounts = () => {
    switch (activeTab) {
      case "resource":
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
            value: resourceRequests.filter(req => req.status === "Submitted").length,
            icon: Clock,
            color: "from-blue-400 to-blue-600",
            description: "Awaiting approval"
          },
          {
            title: "Approved",
            value: resourceRequests.filter(req => req.status === "Approved").length,
            icon: CheckCircle,
            color: "from-green-400 to-green-600",
            description: "Approved requests"
          },
          {
            title: "Rejected",
            value: resourceRequests.filter(req => req.status === "Rejected").length,
            icon: CheckCircle,
            color: "from-red-400 to-red-600",
            description: "Rejected requests"
          }
        ];
      
      case "opportunity":
        return [
          {
            title: "Opportunity Groups",
            value: opportunityRequests.length,
            icon: FileCheck,
            color: "from-purple-400 to-purple-600",
            description: "All opportunity groups"
          },
          {
            title: "Draft",
            value: opportunityRequests.filter(req => req.status === "Draft").length,
            icon: Clock,
            color: "from-blue-400 to-blue-600",
            description: "Draft groups"
          },
          {
            title: "HR Approved",
            value: opportunityRequests.filter(req => req.status === "HRApproved").length,
            icon: CheckCircle,
            color: "from-green-400 to-green-600",
            description: "HR Approved groups"
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
      default:
        const openDemands = demands.filter(demand => demand.overallStatus === "Open").length;
        const inProgressDemands = demands.filter(demand => demand.overallStatus === "InProgress").length;
        const completedDemands = demands.filter(demand => demand.overallStatus === "Completed").length;
        const rejectedDemands = demands.filter(demand => demand.overallStatus === "Rejected").length;
        const holdDemands = demands.filter(demand => demand.overallStatus === "Hold").length;
        const closedDemands = demands.filter(demand => demand.overallStatus === "Closed").length;
        
        return [
          {
            title: "Total Demands",
            value: demands.length,
            icon: FileCheck,
            color: "from-purple-400 to-purple-600",
            description: "All demands"
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
    }
  };

  const stats = getTabSpecificCounts();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
    >
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <Card
            key={index}
            className="bg-white/90 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer border-2 border-transparent hover:border-blue-200"
            onClick={() => onTabChange(activeTab)}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-gray-600 text-xs font-medium mb-1 truncate">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-800 mb-1">{stat.value}</p>
                  <p className="text-xs text-gray-500 truncate">{stat.description}</p>
                </div>
                <div
                  className={`w-12 h-12 rounded-xl bg-gradient-to-r ${stat.color} flex items-center justify-center shadow-lg flex-shrink-0 ml-2`}
                >
                  <Icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </motion.div>
  );
};

// Resource Group Card Component - View Only
const ResourceGroupCard = ({ 
  group, 
  type, // "demand" or "opportunity"
  isExpanded,
  onToggle,
  handleViewRequest,
  getStatusColor,
  getPriorityColor,
  getWorkModeIcon
}) => {
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
            <div 
              className="flex-1 cursor-pointer" 
              onClick={() => onToggle(group.groupKey)}
            >
              <div className="flex items-center gap-3 mb-2">
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
                Submitted: {group.submittedDate}
              </p>
            </div>
          </div>
          
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
                    <div 
                      className="cursor-pointer" 
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
                      
                      <div className="text-right mt-2">
                        <p className="text-sm font-medium text-blue-600">{request.requestId}</p>
                        <p className="text-xs text-gray-500">Request ID</p>
                      </div>
                    </div>
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

// RequestTab Component - View Only
const RequestTab = ({ type, requests }) => {
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [sortField, setSortField] = useState("default");
  const [sortDirection, setSortDirection] = useState("desc");
  const [requestFilter, setRequestFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [expandedGroups, setExpandedGroups] = useState([]);
  const [expandedAll, setExpandedAll] = useState(false);
  
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
      <Card className="bg-white/90 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer">
        <CardContent className="p-6" onClick={() => handleViewRequest(request)}>
          <div className="flex items-start mb-4">
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
              <p className="text-xs text-gray-500">Submitted: {request.submittedDate}</p>
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
              <span>Requested by: {request.requestedBy}</span>
            </div>
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
              <p className="text-xs text-gray-500">Submitted: {group.submittedDate}</p>
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
              <span>Requested by: {group.requestedBy}</span>
            </div>
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
            {type === "resource" ? "Active Requests" : "Active Opportunities"}
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
                      {paginatedItems
                        .filter(item => item.groupKey?.startsWith('demand-'))
                        .map((group, index) => (
                          <ResourceGroupCard
                            key={group.groupKey}
                            group={group}
                            type="demand"
                            isExpanded={expandedGroups.includes(group.groupKey)}
                            onToggle={toggleGroup}
                            handleViewRequest={handleViewRequest}
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
                            handleViewRequest={handleViewRequest}
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
                  <p><span className="font-medium">Submitted:</span> {selectedRequest?.submittedDate}</p>
                  <p><span className="font-medium">Requested By:</span> {selectedRequest?.requestedBy}</p>
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
    </div>
  );
};

// DemandsTab Component with Pagination - View All Demands
const DemandsTab = ({ demands }) => {
  const [selectedDemand, setSelectedDemand] = useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [sortField, setSortField] = useState("default");
  const [sortDirection, setSortDirection] = useState("desc");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

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

  // Status colors mapping
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

  // Render Demand Card
  const renderDemandCard = (demand, index) => (
    <motion.div
      key={demand.demandid}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
    >
      <Card className="bg-white/90 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer">
        <CardContent className="p-6">
          <div className="flex items-start mb-4" onClick={() => handleViewDemand(demand)}>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h3 className="text-xl font-bold text-gray-800">{demand.demandTitle}</h3>
                <Badge className={`${getStatusColor(demand.overallStatus)} border`}>
                  {demand.overallStatus}
                </Badge>
                <Badge className={getPriorityColor(demand.priority)}>
                  {demand.priority}
                </Badge>
                <Badge className="bg-orange-100 text-orange-700 border-orange-200">
                  Demand
                </Badge>
              </div>
              <p className="text-gray-600 mb-2">{demand.projectName}</p>
              <div className="flex items-center gap-4 text-sm text-gray-500">
                <span className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  {demand.resourceRequestsCount} resources
                </span>
                <span className="flex items-center gap-1">
                  <Target className="w-4 h-4" />
                  {demand.accountName}
                </span>
                <span className="flex items-center gap-1">
                  <Building className="w-4 h-4" />
                  {demand.departmentName}
                </span>
              </div>
            </div>

            <div className="text-right">
              <p className="text-sm text-gray-500">Demand ID</p>
              <p className="font-mono font-bold text-blue-600">DM-{demand.demandid}</p>
              
              <p className="text-xs text-gray-500 mt-1">
                Created: {new Date(demand.createddt).toLocaleDateString()}
              </p>
              <p className="text-xs text-gray-500">
                Pending: {demand.pendingDays} days
              </p>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm text-gray-500">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                <span>{demand.workLocPref}</span>
                <span>•</span>
                <span>{demand.locationType}</span>
                <span>•</span>
                <span>{demand.workMode}</span>
              </div>
              <span>Requested by: {demand.requesterName}</span>
            </div>
            
            {demand.skillName && demand.skillName.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {demand.skillName.slice(0, 3).map((skill, idx) => (
                  <Badge key={idx} variant="outline" className="text-xs">
                    {skill}
                  </Badge>
                ))}
                {demand.skillName.length > 3 && (
                  <Badge variant="outline" className="text-xs">
                    +{demand.skillName.length - 3} more
                  </Badge>
                )}
              </div>
            )}
            
            {/* Working Skill Matcher Button */}
            <Button
              onClick={() => handleSkillMatcher(demand)}
              className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white hover:from-blue-600 hover:to-indigo-600 w-full mt-2"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Skill Matcher
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );

  return (
    <div className="space-y-6">
      {/* Search and Sort Controls */}
      <div className="px-2 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-bold text-gray-800">Active Demands</h2>
          <Badge variant="outline" className="bg-purple-50 text-purple-700">
            {sortedDemands.length} Total
          </Badge>
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
      <div className="space-y-4">
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
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedDemand?.demandTitle}</DialogTitle>
            <DialogDescription>
              Demand ID: {selectedDemand?.demandid} | Status: <Badge className={getStatusColor(selectedDemand?.overallStatus)}>
                {selectedDemand?.overallStatus}
              </Badge>
            </DialogDescription>
          </DialogHeader>
          {selectedDemand && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold mb-3 text-gray-800">Demand Details</h3>
                  <div className="space-y-3">
                    <div>
                      <span className="font-medium text-gray-700">Project & Account</span>
                      <p className="text-gray-600">{selectedDemand.projectName} - {selectedDemand.accountName}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Role:</span>
                      <p className="text-gray-600">{selectedDemand.departmentName}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Description:</span>
                      <p className="text-gray-600">{selectedDemand.description}</p>
                    </div>
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold mb-3 text-gray-800">Requirements</h3>
                  <div className="space-y-3">
                    <div>
                      <span className="font-medium text-gray-700">Years of Experience:</span>
                      <p className="text-gray-600">{selectedDemand.yearsofexp}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Role Duration:</span>
                      <p className="text-gray-600">{selectedDemand.roleDuration}</p>
                    </div>
                    
                    {/* Request IDs Section */}
                    {selectedDemand.requestsSummary && selectedDemand.requestsSummary.length > 0 && (
                      <div>
                        <span className="font-medium text-gray-700">Request IDs:</span>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {selectedDemand.requestsSummary.map((req) => (
                            <Badge 
                              key={req.requestId} 
                              variant="outline" 
                              className="font-mono text-blue-600 border-blue-200 bg-blue-50"
                            >
                              REQ-{req.requestId}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
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
                  <h3 className="font-semibold mb-3 text-gray-800">Timeline</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-700">Demand Open:</span>
                      <span className="text-gray-600">{selectedDemand.demandOpenDt}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-700">Target Fulfillment:</span>
                      <span className="text-gray-600">{selectedDemand.fulfilmentDt || "Not specified"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-700">Created:</span>
                      <span className="text-gray-600">
                        {new Date(selectedDemand.createddt).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-700">Pending Days:</span>
                      <span className="text-gray-600">{selectedDemand.pendingDays} days</span>
                    </div>
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold mb-3 text-gray-800">Resource Status</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-700">Target Headcount:</span>
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
              </div>
            </div>
          )}
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

// Main RecruiterDashboard Component
export default function RecruiterDashboard() {
  const [demands, setDemands] = useState([]);
  const [resourceRequests, setResourceRequests] = useState([]);
  const [opportunityRequests, setOpportunityRequests] = useState([]);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("demands");

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
        projectName: req.projectName ?.trim() || "Unknown Project",
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

  if (isInitialLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-xl text-gray-600">Loading Recruiter Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 relative">
      {/* Header Section */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-8"
      >
        <div className="text-center bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-8 border border-blue-200 shadow-lg">
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.6 }}
            className="mb-6"
          >
            <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
              <Users className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-gray-800 mb-3">Recruiter Dashboard</h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              View resource requests, opportunities, and demands for recruitment planning
            </p>
          </motion.div>
        </div>
      </motion.div>

      {/* Statistics Cards */}
      <StatisticsCards 
        activeTab={activeTab}
        onTabChange={setActiveTab}
        demands={demands}
        resourceRequests={resourceRequests}
        opportunityRequests={opportunityRequests}
      />

      {/* Tabs Section */}
      <Tabs defaultValue="demands" className="space-y-6" onValueChange={setActiveTab}>
        <TabsList className="flex bg-gray-100 rounded-lg p-1 gap-1 w-full max-w-md mx-auto">
          <TabsTrigger
            value="resource"
            className="cursor-pointer flex-1 data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm data-[state=inactive]:bg-transparent data-[state=inactive]:text-gray-600 rounded-md px-4 py-2 font-medium transition-all duration-200 border border-transparent data-[state=active]:border-gray-200"
          >
            Resource Requests
          </TabsTrigger>
          <TabsTrigger
            value="demands"
            className="cursor-pointer flex-1 data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm data-[state=inactive]:bg-transparent data-[state=inactive]:text-gray-600 rounded-md px-4 py-2 font-medium transition-all duration-200 border border-transparent data-[state=active]:border-gray-200"
          >
          Demands
          </TabsTrigger>
          <TabsTrigger
            value="opportunity"
            className="cursor-pointer flex-1 data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm data-[state=inactive]:bg-transparent data-[state=inactive]:text-gray-600 rounded-md px-4 py-2 font-medium transition-all duration-200 border border-transparent data-[state=active]:border-gray-200"
          >
            Opportunities
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="resource">
          <RequestTab
            type="resource"
            requests={resourceRequests}
          />
        </TabsContent>
        
        <TabsContent value="opportunity">
          <RequestTab
            type="opportunity"
            requests={opportunityRequests}
          />
        </TabsContent>
        
        <TabsContent value="demands">
          <DemandsTab demands={demands} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
