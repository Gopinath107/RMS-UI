import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card.jsx";
import { Button } from "./ui/button.jsx";
import { Input } from "./ui/input.jsx";
import { Badge } from "./ui/badge.jsx";
import { Label } from "./ui/label.jsx";
import { Textarea } from "./ui/textarea.jsx";
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
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog.jsx";
import {
  Search,
  Users,
  MapPin,
  Calendar,
  Clock,
  CheckCircle,
  X,
  Send,
  Plus,
  Eye,
  Filter,
  AlertCircle,
  User,
  Building,
  Briefcase,
  Target,
  DollarSign,
} from "lucide-react";
import { toast } from "sonner";
import { ResourceRequestService } from "../services/RequestResourceService.js";
import { RoleService } from "../services/RoleService.js";

const RequestResource = ({ setCurrentPage }) => {
  const [requests, setRequests] = useState([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [editingRequest, setEditingRequest] = useState(null);
  const [positionOptions, setPositionOptions] = useState([]);

  // Form state (limited to specified fields)
  const [formData, setFormData] = useState({
    projectName: "",
    reqId: "",
    numberOfResources: "",
    locationType: "Client Location",
    workMode: "Hybrid",
    location: "",
    priority: "Medium",
    submittedDate: "",
    estimatedCost: "",
    skills: [],
  });

  // Available options
  const skillOptions = [
    "AIML", "React", "Angular", "Vue.js", "JavaScript", "TypeScript", "Node.js",
    "Python", "Java", "C#", ".NET", "PHP", "Ruby", "Go", "Swift", "Kotlin",
    "SQL", "MongoDB", "PostgreSQL", "MySQL", "AWS", "Azure", "Docker",
    "Kubernetes", "Jenkins", "Git", "Agile", "Scrum", "UI Design", "UX Research",
    "Figma", "Adobe Creative Suite", "Machine Learning", "Data Analysis",
    "Power BI", "Tableau", "Excel", "Communication", "Problem Solving",
    "Team Work", "Leadership", "Time Management"
  ];

  const priorities = ["Low", "Medium", "High", "Critical"];
  const workModes = ["Remote", "On-site", "Hybrid", "FullTime"];
  const locationTypes = ["Client Location", "Company Office", "Remote", "Flexible"];

  useEffect(() => {
    loadRequests();
    fetchPositions();
  }, []);

  const fetchPositions = async () => {
    try {
      const res = await RoleService.fetchRoleList();
      if (res?.data?.success === true) {
        const fetchedPositions = res.data.result.map(role => role.roleName);
        setPositionOptions(fetchedPositions);
      } else {
        setPositionOptions([]);
        toast.error("Failed to fetch positions");
      }
    } catch (err) {
      console.error('Error fetching positions:', err);
      setPositionOptions([]);
      toast.error("Failed to fetch positions");
    }
  };

  const loadRequests = async () => {
    try {
      console.log("Fetching resource requests...");
      const response = await ResourceRequestService.fetchRequestList();
      console.log("API Response:", response);
      if (response && response.data.success === true) {
        const mappedRequests = response.data.result.map(req => ({
          reqId: `REQ-${String(req.requestId).padStart(3, '0')}`,
          projectName: req.projectName || "N/A",
          numberOfResources: req.numberOfResources || 0,
          locationType: req.locationType || "N/A",
          workMode: req.workMode || "N/A",
          location: req.location || "N/A",
          priority: req.priority || "N/A",
          submittedDate: req.submittedDate || "N/A",
          estimatedCost: req.estimatedCostTotal || req.estimatedCostPerResourceMonth || "N/A",
          skills: req.skills || [],
          status: req.status || "N/A",
          requestedBy: req.requestedBy || "sales-manager",
          createdBy: req.createdBy || "sales-manager",
          createdAt: req.createdAt || new Date().toISOString()
        }));
        const userRequests = mappedRequests.filter(
          (req) => req.requestedBy === "sales-manager" || req.createdBy === "sales-manager"
        );
        setRequests(userRequests);
        console.log("Mapped Requests:", userRequests);
      } else {
        setRequests([]);
        console.log("No data or success false from API");
        toast.error("No resource requests found or API error");
      }
    } catch (error) {
      console.error("Error loading requests:", error);
      setRequests([]);
      toast.error("Failed to load resource requests");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!formData.projectName || !formData.location || !formData.numberOfResources) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (formData.skills.length === 0) {
      toast.error("Please add at least one skill");
      return;
    }

    const requestData = {
      ...formData,
      numberOfResources: parseInt(formData.numberOfResources, 10),
      estimatedCost: formData.estimatedCost || null,
      requestedBy: "sales-manager",
      createdBy: "sales-manager",
      status: "Submitted",
    };

    try {
      let response;
      if (editingRequest) {
        const requestId = parseInt(editingRequest.reqId.replace("REQ-", ""), 10);
        response = await ResourceRequestService.updateResourceRequest(requestId, requestData);
        toast.success("Resource request updated successfully!");
      } else {
        response = await ResourceRequestService.createResourceRequest(requestData);
        toast.success("Resource request created and submitted!");
      }

      if (response && response.data.success) {
        await loadRequests();
        resetForm();
        setIsDialogOpen(false);
        setEditingRequest(null);
      }
    } catch (error) {
      console.error("Error saving request:", error);
      toast.error("Failed to save resource request");
    }
  };

  const handleSubmitNew = async (e) => {
    e.preventDefault();

    // Validation
    if (!formData.projectName || !formData.location || !formData.numberOfResources) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (formData.skills.length === 0) {
      toast.error("Please add at least one skill");
      return;
    }

    const requestData = {
      ...formData,
      numberOfResources: parseInt(formData.numberOfResources, 10),
      estimatedCost: formData.estimatedCost || null,
      requestedBy: "sales-manager",
      createdBy: "sales-manager",
      status: "Submitted",
    };

    try {
      const response = await ResourceRequestService.createResourceRequest(requestData);
      if (response && response.data.success) {
        toast.success("Resource request submitted successfully!");
        await loadRequests();
        resetForm();
        setIsDialogOpen(false);
        setEditingRequest(null);
      }
    } catch (error) {
      console.error("Error submitting new request:", error);
      toast.error("Failed to submit resource request");
    }
  };

  const resetForm = () => {
    setFormData({
      projectName: "",
      reqId: "",
      numberOfResources: "",
      locationType: "Client Location",
      workMode: "Hybrid",
      location: "",
      priority: "Medium",
      submittedDate: "",
      estimatedCost: "",
      skills: [],
    });
  };

  const handleView = (request) => {
    setEditingRequest(request);
    setFormData({
      projectName: request.projectName,
      reqId: request.reqId,
      numberOfResources: request.numberOfResources,
      locationType: request.locationType,
      workMode: request.workMode,
      location: request.location,
      priority: request.priority,
      submittedDate: request.submittedDate,
      estimatedCost: request.estimatedCost,
      skills: request.skills,
    });
    setIsDialogOpen(true);
  };

  const handleSkillAdd = (skill) => {
    if (!formData.skills.includes(skill)) {
      setFormData({
        ...formData,
        skills: [...formData.skills, skill],
      });
    }
  };

  const handleSkillRemove = (skill) => {
    setFormData({
      ...formData,
      skills: formData.skills.filter((s) => s !== skill),
    });
  };

  const getStatusBadgeColor = (status) => {
    switch (status) {
      case "Submitted":
      case "Approved":
      case "Allocated":
        return "bg-green-100 text-green-800";
      case "Pending Approval":
      case "Under Review":
        return "bg-yellow-100 text-yellow-800";
      case "Interview Scheduled":
        return "bg-blue-100 text-blue-800";
      case "Rejected":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getPriorityBadgeColor = (priority) => {
    switch (priority) {
      case "Critical":
        return "bg-red-100 text-red-800";
      case "High":
        return "bg-orange-100 text-orange-800";
      case "Medium":
        return "bg-yellow-100 text-yellow-800";
      case "Low":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const filteredRequests = requests.filter((request) => {
    const matchesSearch =
      searchTerm === "" ||
      request.projectName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.location.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      filterStatus === "all" || request.status === filterStatus;

    return matchesSearch && matchesStatus;
  });

  const getStats = () => {
    const total = requests.length;
    const pending = requests.filter((r) => r.status === "Pending Approval").length;
    const submitted = requests.filter((r) => r.status === "Submitted").length;
    const totalBudget = requests.reduce(
      (sum, r) => sum + (parseFloat(r.estimatedCost) || 0),
      0
    );

    return { total, pending, submitted, totalBudget };
  };

  const stats = getStats();

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col gap-4"
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Resource Requests
            </h1>
            <p className="text-black mt-1">
              Create and manage resource requests for your projects
            </p>
          </div>
        </div>
      </motion.div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
            <p className="text-xs text-muted-foreground">All resource requests</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Approval</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
            <p className="text-xs text-muted-foreground">Awaiting approval</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Submitted</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.submitted}</div>
            <p className="text-xs text-muted-foreground">Submitted requests</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Budget</CardTitle>
            <DollarSign className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              ${stats.totalBudget.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">Estimated budget</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search resource requests..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="Submitted">Submitted</SelectItem>
                {/* <SelectItem value="Pending Approval">Pending Approval</SelectItem> */}
                {/* <SelectItem value="Under Review">Under Review</SelectItem> */}
                <SelectItem value="Approved">Approved</SelectItem>
                <SelectItem value="Allocated">Allocated</SelectItem>
                <SelectItem value="Interview Scheduled">Interview Scheduled</SelectItem>
                <SelectItem value="Rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Requests Grid */}
      <AnimatePresence>
        {filteredRequests.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredRequests.map((request) => (
              <motion.div
                key={request.reqId}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.2 }}
              >
                <Card className="h-full hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg mr-2" style={{ overflowWrap: 'anywhere' }}>
                        {request.projectName}
                      </CardTitle>
                      
                      <Badge className={getStatusBadgeColor(request.status)}>
                        {request.status}
                      </Badge>
                      
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="text-sm">
                      <div className="font-medium">Req ID: {request.reqId}</div>
                      <div className="font-medium">Resources: {request.numberOfResources}</div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-purple-600" />
                        <span>{request.locationType}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Briefcase className="h-4 w-4 text-green-600" />
                        <span>{request.workMode}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Building className="h-4 w-4 text-blue-600" />
                        <span>{request.location}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Target className="h-4 w-4 text-orange-600" />
                        <Badge className={getPriorityBadgeColor(request.priority)}>
                          {request.priority}
                        </Badge>
                      </div>
                    </div>

                    <div className="text-sm">
                      <div className="font-medium">Submitted: {request.submittedDate}</div>
                      <div className="font-medium">Estimated Cost: {request.estimatedCost}</div>
                    </div>

                    {request.skills && request.skills.length > 0 && (
                      <div>
                        <div className="text-xs font-medium text-gray-700 mb-1">Skills:</div>
                        <div className="flex flex-wrap gap-1">
                          {request.skills.slice(0, 3).map((skill) => (
                            <Badge key={skill} variant="outline" className="text-xs">
                              {skill}
                            </Badge>
                          ))}
                          {request.skills.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{request.skills.length - 3} more
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="flex gap-2 mt-4">
                    </div>

                    <div className="text-xs text-gray-500 border-t pt-2">
                      <div>Created: {new Date(request.createdAt).toLocaleDateString()}</div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Users className="h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No resource requests found
              </h3>
              <p className="text-gray-600 text-center mb-4">
                {searchTerm || filterStatus !== "all"
                  ? "No requests match your search criteria."
                  : "No resource requests available."}
              </p>
            </CardContent>
          </Card>
        )}
      </AnimatePresence>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-[500px] max-h-[90vh] overflow-y-auto p-4">
          <DialogHeader>
            <DialogTitle>
              {editingRequest ? "Edit Resource Request" : "Create Resource Request"}
            </DialogTitle>
            <DialogDescription>
              {editingRequest
                ? "Update the resource request details below."
                : "Fill in the details to request a new resource."}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="projectName">Project Name *</Label>
                <Input
                  id="projectName"
                  value={formData.projectName}
                  onChange={(e) =>
                    setFormData({ ...formData, projectName: e.target.value })
                  }
                  placeholder="Enter project name"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="reqId">Request ID *</Label>
                <Input
                  id="reqId"
                  value={formData.reqId}
                  onChange={(e) =>
                    setFormData({ ...formData, reqId: e.target.value })
                  }
                  placeholder="Enter request ID (e.g., REQ-001)"
                  required
                  disabled={!!editingRequest} // Disable editing if already set
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="numberOfResources">Number of Resources *</Label>
                <Input
                  id="numberOfResources"
                  type="number"
                  value={formData.numberOfResources}
                  onChange={(e) =>
                    setFormData({ ...formData, numberOfResources: e.target.value })
                  }
                  placeholder="Enter number of resources"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="locationType">Location Type *</Label>
                <Select
                  value={formData.locationType}
                  onValueChange={(value) =>
                    setFormData({ ...formData, locationType: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select location type" />
                  </SelectTrigger>
                  <SelectContent>
                    {locationTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="workMode">Work Mode *</Label>
                <Select
                  value={formData.workMode}
                  onValueChange={(value) =>
                    setFormData({ ...formData, workMode: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select work mode" />
                  </SelectTrigger>
                  <SelectContent>
                    {workModes.map((mode) => (
                      <SelectItem key={mode} value={mode}>
                        {mode}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="location">Location *</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) =>
                    setFormData({ ...formData, location: e.target.value })
                  }
                  placeholder="Enter location"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="priority">Priority *</Label>
                <Select
                  value={formData.priority}
                  onValueChange={(value) =>
                    setFormData({ ...formData, priority: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    {priorities.map((priority) => (
                      <SelectItem key={priority} value={priority}>
                        {priority}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="submittedDate">Submitted Date *</Label>
                <Input
                  id="submittedDate"
                  type="date"
                  value={formData.submittedDate}
                  onChange={(e) =>
                    setFormData({ ...formData, submittedDate: e.target.value })
                  }
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="estimatedCost">Estimated Cost *</Label>
                <Input
                  id="estimatedCost"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.estimatedCost}
                  onChange={(e) =>
                    setFormData({ ...formData, estimatedCost: e.target.value })
                  }
                  placeholder="Enter estimated cost"
                  required
                />
              </div>
            </div>

            {/* Skills Section */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Skills *</Label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {formData.skills.map((skill) => (
                    <Badge
                      key={skill}
                      variant="default"
                      className="flex items-center gap-1"
                    >
                      {skill}
                      <X
                        className="h-3 w-3 cursor-pointer"
                        onClick={() => handleSkillRemove(skill)}
                      />
                    </Badge>
                  ))}
                </div>
                <Select onValueChange={(value) => handleSkillAdd(value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Add skill" />
                  </SelectTrigger>
                  <SelectContent>
                    {skillOptions
                      .filter((skill) => !formData.skills.includes(skill))
                      .map((skill) => (
                        <SelectItem key={skill} value={skill}>
                          {skill}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsDialogOpen(false);
                  setEditingRequest(null);
                  resetForm();
                }}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-yellow-600 hover:bg-yellow-700"
              >
                <Send className="h-4 w-4 mr-2" />
                {editingRequest ? "Update Request" : "Submit Request"}
              </Button>
              <Button
                type="button"
                onClick={handleSubmitNew}
                className="bg-green-600 hover:bg-green-700"
              >
                <Send className="h-4 w-4 mr-2" />
                Submit
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RequestResource;
