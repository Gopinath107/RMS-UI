import React, { useState, useEffect, useMemo, memo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card.jsx";
import { Input } from "./ui/input.jsx";
import { Badge } from "./ui/badge.jsx";
import { Label } from "./ui/label.jsx"; // Re-added Label import
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select.jsx";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog.jsx";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "./ui/tabs.jsx";
import {
  Search,
  Users,
  Calendar,
  Clock,
  Eye,
  Target,
  FileText,
  BarChart3,
} from "lucide-react";
import { toast } from "sonner";
import { ResourceRequestService } from "../services/RequestResourceService.js";
import { OpportunityService } from "../services/OpportunityService.js";

// Memoized RequestCard component to prevent unnecessary re-renders
const RequestCard = memo(({ request, handleViewRequest, getStatusColor, getPriorityColor }) => (
  <div>
    <Card className="bg-white/90 backdrop-blur-sm shadow-lg hover:shadow-xl transition-shadow duration-300 cursor-pointer">
      <CardContent className="p-6" onClick={() => handleViewRequest(request)}>
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="text-xl font-bold text-gray-800">{request.groupTitle || request.projectName || 'Unnamed Project'}</h3>
              <Badge className={`${getStatusColor(request.status)} border`}>
                {request.status?.replace('_', ' ') || 'Unknown'}
              </Badge>
              <Badge className={getPriorityColor(request.priority || 'Medium')}>
                {request.priority || 'Medium'}
              </Badge>
            </div>
            <div className="flex items-center gap-4 text-sm text-gray-500">
              <span className="flex items-center gap-1">
                <Users className="w-4 h-4" />
                {request.numberOfResources || 1} resources
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                {request.submittedDate || 'N/A'}
              </span>
              <span className="flex items-center gap-1">
                <Target className="w-4 h-4" />
                {request.clientName || 'N/A'}
              </span>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500">{request.requesterUserId === 4 ? 'Group ID' : 'Request ID'}</p>
            <p className="font-mono font-bold text-purple-600">{request.requesterUserId === 4 ? request.groupId : request.requestId || 'N/A'}</p>
            <p className="text-xs text-gray-500">Submitted: {request.submittedDate || 'N/A'}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  </div>
));

export default function PMODashboard({ setCurrentPage }) {
  const [requests, setRequests] = useState([]);
  const [opportunityRequests, setOpportunityRequests] = useState([]);
  const [filteredRequests, setFilteredRequests] = useState([]);
  const [filteredOpportunityRequests, setFilteredOpportunityRequests] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [priorityFilter, setPriorityFilter] = useState("All");
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const userName = localStorage.getItem('userName') || 'PMO Manager';
  // const approverUserId = localStorage.getItem('userID') || 41; // Fixed PMO Manager has userId 41

  useEffect(() => {
    setCurrentPage("dashboard");
  }, [setCurrentPage]);

  const fetchRequests = async () => {
    try {
      console.log("Fetching resource requests...");
      const response = await ResourceRequestService. fetchRequestList();
      console.log("Resource requests response:", response.data);
      const data = response.data.result || [];
      const mapped = data.map((req) => ({
        id: `REQ-${String(req.requestId).padStart(3, '0')}`,
        requestId: `REQ-${String(req.requestId).padStart(3, '0')}`,
        projectName: req.projectName?.trim() || 'Unnamed Project',
        clientName: req.accountName || 'N/A',
        numberOfResources: req.numberOfResources || 1,
        priority: req.priority || 'Medium',
        status: req.status === "Submitted" ? "Waiting_For_HR_Approval" : req.status || 'Pending',
        submittedDate: req.submittedDate || 'N/A',
        requestedBy: req.requesterName || 'N/A',
        requesterUserId: req.requesterId || 1, // Default to 1 for resource requests
      }));
      setRequests(mapped.filter(req => req.requesterUserId !== 4));
      console.log("Mapped resource requests:", mapped);
    } catch (error) {
      console.error('Error fetching requests:', error);
      toast.error("Failed to fetch requests");
      setRequests([]);
    } finally {
      setIsInitialLoading(false);
    }
  };

  const fetchOpportunityRequests = async () => {
    try {
      console.log("Fetching opportunity requests...");
      const response = await OpportunityService.fetchResourceRequestGroups();
      console.log("Opportunity requests response:", response.data);
      const groupRequests = (response.data.result || [])
        .filter(group => group.createdBy === 4)
        .map(group => ({
          id: `OPP-${group.groupId}`,
          groupId: group.groupId,
          projectName: group.projectName || 'Unnamed Opportunity',
          clientName: group.companyName || 'N/A',
          numberOfResources: group.totalRequested || 1,
          groupTitle: group.title || 'Unnamed Opportunity',
          status: group.status || 'Draft',
          submittedDate: group.createdAt ? new Date(group.createdAt).toLocaleDateString() : 'N/A',
          requestedBy: group.createdByName || 'N/A',
          createdByEmail: group.createdByEmail || 'N/A',
          priority: "Medium", // Default since not in API response
          requesterUserId: 4,
        }));
      setOpportunityRequests(groupRequests);
      console.log("Mapped opportunity requests:", groupRequests);
    } catch (error) {
      console.error('Error fetching opportunity requests:', error);
      toast.error('Failed to load opportunity requests');
      setOpportunityRequests([]);
    }
  };

  useEffect(() => {
    fetchRequests();
    fetchOpportunityRequests();
  }, []);

  useEffect(() => {
    const interval = setInterval(fetchRequests, 5000);
    return () => clearInterval(interval);
  }, []);

  const filterRequests = (reqs) => {
    let filtered = reqs;
    if (searchTerm) {
      filtered = filtered.filter(
        (request) =>
          (request.groupTitle || request.projectName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
          (request.clientName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
          (request.id || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
          (request.requestedBy || '').toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    if (statusFilter !== "All") {
      filtered = filtered.filter((request) => (request.status || '') === statusFilter);
    }
    if (priorityFilter !== "All") {
      filtered = filtered.filter((request) => (request.priority || 'Medium') === priorityFilter);
    }
    return filtered;
  };

  const filteredRequestsMemo = useMemo(() => filterRequests(requests), [requests, searchTerm, statusFilter, priorityFilter]);
  const filteredOpportunityRequestsMemo = useMemo(() => filterRequests(opportunityRequests), [opportunityRequests, searchTerm, statusFilter, priorityFilter]);

  const getStatusColor = (status) => {
    switch (status) {
      case "Waiting_For_HR_Approval":
      case "Submitted":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "In Review":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "Approved":
        return "bg-green-100 text-green-800 border-green-200";
      case "Rejected":
        return "bg-red-100 text-red-800 border-red-200";
      case "Partially Fulfilled":
        return "bg-purple-100 text-purple-800 border-purple-200";
      case "Draft":
        return "bg-gray-100 text-gray-800 border-gray-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "Urgent":
        return "bg-red-100 text-red-800 border-red-200";
      case "High":
        return "bg-orange-100 text-orange-800 border-orange-200";
      case "Medium":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "Low":
        return "bg-green-100 text-green-800 border-green-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const handleViewRequest = (request) => {
    setSelectedRequest(request);
    setIsViewModalOpen(true);
  };

  if (isInitialLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        Loading...
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="text-center bg-gradient-to-br from-purple-50 to-indigo-50 rounded-2xl p-8 border border-purple-200 shadow-lg">
        <div className="w-20 h-20 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
          <BarChart3 className="w-10 h-10 text-white" />
        </div>
        <h1 className="text-4xl font-bold text-gray-800 mb-3">
          PMO Dashboard
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          View resource and opportunity requests
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <Card className="bg-white/90 backdrop-blur-sm shadow-lg hover:shadow-xl transition-shadow duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium mb-1">Total Requests</p>
                <p className="text-3xl font-bold text-gray-800">{requests.length + opportunityRequests.length}</p>
              </div>
              <div className="w-14 h-14 rounded-xl bg-gradient-to-r from-purple-400 to-purple-600 flex items-center justify-center shadow-lg">
                <FileText className="w-7 h-7 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white/90 backdrop-blur-sm shadow-lg hover:shadow-xl transition-shadow duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium mb-1">Pending</p>
                <p className="text-3xl font-bold text-gray-800">
                  {[...requests, ...opportunityRequests].filter(req => req.status === "Waiting_For_HR_Approval" || req.status === "Draft").length}
                </p>
              </div>
              <div className="w-14 h-14 rounded-xl bg-gradient-to-r from-yellow-400 to-yellow-600 flex items-center justify-center shadow-lg">
                <Clock className="w-7 h-7 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-lg transition-opacity duration-300">
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1">
            <Label htmlFor="search" className="sr-only">Search</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <Input
                id="search"
                placeholder="Search by project, client, or ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <div className="flex-1">
            <Label htmlFor="statusFilter">Status</Label>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger id="statusFilter">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All</SelectItem>
                <SelectItem value="Waiting_For_HR_Approval">Pending HR</SelectItem>
                <SelectItem value="Approved">Approved by HR</SelectItem>
                <SelectItem value="Rejected">Rejected</SelectItem>
                <SelectItem value="Draft">Draft</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex-1">
            <Label htmlFor="priorityFilter">Priority</Label>
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger id="priorityFilter">
                <SelectValue placeholder="Filter by priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All</SelectItem>
                <SelectItem value="Low">Low</SelectItem>
                <SelectItem value="Medium">Medium</SelectItem>
                <SelectItem value="High">High</SelectItem>
                <SelectItem value="Urgent">Urgent</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <Tabs defaultValue="resource" className="space-y-4">
          <TabsList>
            <TabsTrigger value="resource">Resource Requests</TabsTrigger>
            <TabsTrigger value="opportunity">Opportunity Requests</TabsTrigger>
          </TabsList>
          <TabsContent value="resource" className="space-y-4">
            {filteredRequestsMemo.length === 0 ? (
              <Card className="bg-white/90 backdrop-blur-sm shadow-lg text-center py-12">
                <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-600 mb-2">No Requests Found</h3>
                <p className="text-gray-500">Try adjusting your filters or search term.</p>
              </Card>
            ) : (
              filteredRequestsMemo.map((request) => (
                <RequestCard
                  key={request.id}
                  request={request}
                  handleViewRequest={handleViewRequest}
                  getStatusColor={getStatusColor}
                  getPriorityColor={getPriorityColor}
                />
              ))
            )}
          </TabsContent>
          <TabsContent value="opportunity" className="space-y-4">
            {filteredOpportunityRequestsMemo.length === 0 ? (
              <Card className="bg-white/90 backdrop-blur-sm shadow-lg text-center py-12">
                <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-600 mb-2">No Opportunity Requests Found</h3>
                <p className="text-gray-500">Try adjusting your filters or search term.</p>
              </Card>
            ) : (
              filteredOpportunityRequestsMemo.map((request) => (
                <RequestCard
                  key={request.id}
                  request={request}
                  handleViewRequest={handleViewRequest}
                  getStatusColor={getStatusColor}
                  getPriorityColor={getPriorityColor}
                />
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>
      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3 text-xl">
              <Eye className="w-5 h-5 text-purple-500" />
              Request Details - {selectedRequest?.id}
            </DialogTitle>
          </DialogHeader>
          {selectedRequest && (
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl p-6 border border-purple-200">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-2xl font-bold text-gray-800">{selectedRequest.groupTitle || selectedRequest.projectName}</h3>
                    <p className="text-gray-600">{selectedRequest.clientName}</p>
                  </div>
                  <div className="text-right">
                    <Badge className={`${getStatusColor(selectedRequest.status)} border text-sm px-3 py-1 mb-2`}>
                      {selectedRequest.status.replace('_', ' ')}
                    </Badge>
                    <Badge className={`${getPriorityColor(selectedRequest.priority)} text-sm px-3 py-1`}>
                      {selectedRequest.priority} Priority
                    </Badge>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-purple-500" />
                    <span>{selectedRequest.numberOfResources} Resources</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-purple-500" />
                    <span>{selectedRequest.submittedDate || 'N/A'}</span>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      Request Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Project Name</p>
                      <p className="text-gray-800">{selectedRequest.projectName || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">Title</p>
                      <p className="text-gray-800">{selectedRequest.groupTitle || 'N/A'}</p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      Requester Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Requested By</p>
                      <p className="font-semibold text-gray-800">{selectedRequest.requestedBy || 'N/A'}</p>
                    </div>
                    {selectedRequest.createdByEmail && (
                      <div>
                        <p className="text-sm font-medium text-gray-600">Email</p>
                        <p className="text-gray-800">{selectedRequest.createdByEmail || 'N/A'}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
