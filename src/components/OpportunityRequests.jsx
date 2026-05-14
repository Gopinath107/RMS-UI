import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Badge } from "./ui/badge";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import {
  Search,
  Users,
  Briefcase,
  Calendar,
  X,
  Send,
  Plus,
  Eye,
} from "lucide-react";
import { toast } from "sonner";
import Swal from "sweetalert2";
import { ProjectService } from "../services/ProjectmanagementService";
import { OpportunityService } from "../services/OpportunityService.js";
import { SkillService } from "../services/SkillsService.js";
import { ClientService } from "../services/clientListService.js";   // <-- NEW
import ReusableDataView from "./common/ReusableDataView.jsx";

const staticSkillOptions = [
  "Veeva CRM","Veeva Vault","Salesforce Admin","Salesforce Developer",
  "Salesforce","Sales Cloud","Health Cloud","Service Cloud","Data Cloud",
  "SFMC","Mulesoft","Commerce Cloud","Java","React JS","React Native",
  "Python","SQL","PHP","Spring Boot","AIML","Node JS","TypeScript",
  "HTML/CSS","C++"
];

const getStatusColor = (status) => {
  switch (status) {
    case "Pending": case "Submitted": return "bg-yellow-100 text-yellow-700 border-yellow-200";
    case "Approved": return "bg-green-100 text-green-700 border-green-200";
    case "Rejected": return "bg-red-100 text-red-700 border-red-200";
    case "Draft": return "bg-gray-100 text-gray-700 border-gray-200";
    default: return "bg-gray-100 text-gray-700 border-gray-200";
  }
};

const OpportunityRequests = ({ setCurrentPage }) => {
  const [opportunityRequests, setOpportunityRequests] = useState([]);
  const [projects, setProjects] = useState([]);
  const [clients, setClients] = useState([]);               // <-- NEW
  const [skills, setSkills] = useState([]);
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [primarySkillInput, setPrimarySkillInput] = useState("");
  const [secondarySkillInput, setSecondarySkillInput] = useState("");
  const [filteredPrimary, setFilteredPrimary] = useState([]);
  const [filteredSecondary, setFilteredSecondary] = useState([]);
  const [refreshKey, setRefreshKey] = useState(0);
  const [errors, setErrors] = useState({});

  const [opportunityForm, setOpportunityForm] = useState({
    projectId: "",
    projectName: "",
    clientId: "",          // <-- NEW (for existing client)
    clientName: "",        // <-- NEW (custom client name)
    numberOfResources: "",
    primarySkills: [],
    secondarySkills: [],
    experienceRange: "",
    projectStartDate: "",
    projectEndDate: "",
    description: "",
    location: "",
    workPriority: "Medium",
    workArrangement: "Remote",
    locationType: "Office Based",
    estimatedBudget: "",
    isCustomProject: false,
  });

  const skillOptions = useMemo(() => skills.map(s => s.skillName), [skills]);

  useEffect(() => {
    setCurrentPage("opportunity-requests");
    fetchProjects();
    fetchClients();               // <-- NEW
    fetchSkills();
    loadOpportunityRequests();
  }, [setCurrentPage, refreshKey]);

  /* ------------------- FETCH DATA ------------------- */
  const fetchProjects = async () => {
    try {
      const res = await ProjectService.fetchProjectList();
      if (res.data.success && Array.isArray(res.data.result)) {
        setProjects(res.data.result);
      } else {
        setProjects([]);
        toast.error("No projects available.");
      }
    } catch (err) {
      console.error("Fetch projects error:", err);
      toast.error("Failed to fetch projects.");
    }
  };

  const fetchClients = async () => {
    try {
      const list = await ClientService.fetchClientList();
      setClients(Array.isArray(list) ? list : []);
    } catch (err) {
      console.error("Fetch clients error:", err);
      toast.error("Failed to fetch clients.");
    }
  };

  const fetchSkills = async () => {
    try {
      const response = await SkillService.fetchSkillList();
      const fetchedSkills = response.data.result;
      const fetchedNames = new Set(fetchedSkills.map(s => s.skillName.toLowerCase()));
      const uniqueStatic = staticSkillOptions
        .filter(name => !fetchedNames.has(name.toLowerCase()))
        .map((name, i) => ({ skillId: -(i + 1), skillName: name }));
      const combined = [...uniqueStatic, ...fetchedSkills]
        .sort((a, b) => a.skillName.localeCompare(b.skillName));
      setSkills(combined);
      setFilteredPrimary(combined.slice(0, 12).map(s => s.skillName));
      setFilteredSecondary(combined.slice(12, 24).map(s => s.skillName));
    } catch (error) {
      console.error(error);
      const staticSkills = staticSkillOptions
        .map((n, i) => ({ skillId: -(i + 1), skillName: n }))
        .sort((a, b) => a.skillName.localeCompare(b.skillName));
      setSkills(staticSkills);
      setFilteredPrimary(staticSkills.slice(0, 15).map(s => s.skillName));
      setFilteredSecondary(staticSkills.slice(15, 30).map(s => s.skillName));
      toast.error("Failed to fetch skills, using static list");
    }
  };

  /* ------------------- SKILL HELPERS ------------------- */
  const addSkill = (type, skill) => {
    const field = type === "primary" ? "primarySkills" : "secondarySkills";
    setOpportunityForm(prev => ({
      ...prev,
      [field]: [...new Set([...prev[field], skill])]
    }));
    if (type === "primary") setPrimarySkillInput("");
    else setSecondarySkillInput("");
    setErrors(prev => ({ ...prev, [field]: "" }));
    toast.success(`${type.charAt(0).toUpperCase() + type.slice(1)} skill added!`);
  };

  const removeSkill = (type, skill) => {
    const field = type === "primary" ? "primarySkills" : "secondarySkills";
    setOpportunityForm(prev => ({
      ...prev,
      [field]: prev[field].filter(s => s !== skill)
    }));
    toast.success(`${type.charAt(0).toUpperCase() + type.slice(1)} skill removed!`);
  };

  const addCustomSkill = async (type) => {
    const input = type === "primary" ? primarySkillInput : secondarySkillInput;
    if (!input.trim()) return toast.error(`Enter a valid ${type} skill name.`);
    const name = input.trim();
    const lower = name.toLowerCase();
    const exists = skills.find(s => s.skillName.toLowerCase() === lower);
    let skillToAdd = name;
    if (!exists || exists.skillId < 0) {
      try {
        const resp = await SkillService.createSkill(1, name);
        if (resp.data.success) {
          const newSkill = resp.data.result;
          setSkills(prev => {
            const filtered = prev.filter(s => s.skillName.toLowerCase() !== lower);
            return [...filtered, newSkill].sort((a, b) => a.skillName.localeCompare(b.skillName));
          });
          skillToAdd = newSkill.skillName;
          toast.success(`Custom ${type} skill created!`);
        } else {
          toast.error(`Failed to create ${type} skill.`);
          return;
        }
      } catch (e) {
        console.error(e);
        toast.error(`Failed to create ${type} skill.`);
        return;
      }
    } else skillToAdd = exists.skillName;
    addSkill(type, skillToAdd);
  };

  const selectSkillForInput = (type, skill) => {
    if (type === "primary") setPrimarySkillInput(skill);
    else setSecondarySkillInput(skill);
  };

  /* ------------------- VALIDATION ------------------- */
  const validateForm = () => {
    const newErrors = {};

    if (opportunityForm.isCustomProject) {
      if (!opportunityForm.projectName.trim()) newErrors.projectName = "Enter project name.";
      if (!opportunityForm.clientName.trim()) newErrors.clientName = "Enter client name.";
    } else {
      if (!opportunityForm.projectId) newErrors.projectId = "Select a project.";
    }

    const num = parseInt(opportunityForm.numberOfResources);
    if (isNaN(num) || num < 1) newErrors.numberOfResources = "Enter a valid number.";

    if (opportunityForm.primarySkills.length === 0) newErrors.primarySkills = "Select at least one primary skill.";
    if (!opportunityForm.experienceRange) newErrors.experienceRange = "Select experience range.";
    if (!opportunityForm.projectStartDate) newErrors.projectStartDate = "Select start date.";
    if (!opportunityForm.projectEndDate) newErrors.projectEndDate = "Select end date.";
    if (!opportunityForm.description.trim()) newErrors.description = "Enter description.";
    if (!opportunityForm.location.trim()) newErrors.location = "Enter location.";
    if (!opportunityForm.workPriority) newErrors.workPriority = "Select priority.";
    if (!opportunityForm.workArrangement) newErrors.workArrangement = "Select work arrangement.";

    const budget = parseFloat(opportunityForm.estimatedBudget);
    if (isNaN(budget) || budget < 0) newErrors.estimatedBudget = "Enter a valid budget.";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /* ------------------- LOAD REQUESTS ------------------- */
  const loadOpportunityRequests = async () => {
    try {
      const response = await OpportunityService.fetchResourceRequestGroups();
      if (response.data.success && Array.isArray(response.data.result)) {
        const userId = localStorage.getItem("userId");
        const groups = response.data.result
          .filter(g => g.createdBy == userId)
          .map(g => {
            const pd = g.projectDetails;
            const proj = projects.find(p => p.projectId === pd?.projectId);
            return {
              groupId: g.groupId,
              requestId: `OPP-${String(g.groupId).padStart(3, "0")}`,
              companyId: g.companyId,
              companyName: proj?.accountName || g.companyName || pd?.companyName || "Unknown",
              projectId: pd?.projectId,
              projectName: pd?.projectName || proj?.projectName || "N/A",
              createdBy: g.createdBy,
              createdByName: g.createdByName || "N/A",
              createdByEmail: g.createdByEmail || "N/A",
              groupTitle: g.title || "Unnamed Opportunity",
              totalRequested: g.totalRequested || 1,
              status: g.status || "Pending",
              createdAt: g.createdAt ? new Date(g.createdAt).toLocaleDateString() : "N/A",
            };
          });
        setOpportunityRequests(groups);
      } else {
        setOpportunityRequests([]);
        toast.error("No opportunity requests.");
      }
    } catch (e) {
      console.error(e);
      setOpportunityRequests([]);
      toast.error("Failed to load requests.");
    }
  };

  useEffect(() => { if (projects.length) loadOpportunityRequests(); }, [projects]);

  /* ------------------- MODAL HANDLERS ------------------- */
  const handleCreateOpportunity = () => {
    resetForm();
    setIsRequestModalOpen(true);
  };

  const resetForm = () => {
    setOpportunityForm({
      projectId: "", projectName: "", clientId: "", clientName: "",
      numberOfResources: "", primarySkills: [], secondarySkills: [],
      experienceRange: "", projectStartDate: "", projectEndDate: "",
      description: "", location: "", workPriority: "Medium",
      workArrangement: "Remote", locationType: "Office Based",
      estimatedBudget: "", isCustomProject: false,
    });
    setPrimarySkillInput("");
    setSecondarySkillInput("");
    setErrors({});
  };

  /* ------------------- SUBMIT (CREATE CLIENT → PROJECT → OPPORTUNITY) ------------------- */
  const submitOpportunity = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    Swal.fire({
      title: 'Creating opportunity request...',
      allowOutsideClick: false,
      allowEscapeKey: false,
      showConfirmButton: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    const userId = localStorage.getItem("userId");
    const companyId = localStorage.getItem("companyId") || 1; // adjust if you store it

    let finalProjectId = 1;
    let finalClientId = 1;

    try {
      /* ---------- 1. CLIENT ---------- */
      if (opportunityForm.isCustomProject) {
        // create new client
        const clientResp = await ClientService.createClient(
          companyId,
          opportunityForm.clientName,
          "General",               // industry – you can add a field later
          "",                      // personName – optional
          "",                      // email – optional
          new Date().toISOString().split("T")[0],
          "Active"
        );
        if (!clientResp.success) throw new Error("Client creation failed");
        finalClientId = clientResp.result.accountId;
      } else {
        const selProj = projects.find(p => p.projectId === parseInt(opportunityForm.projectId));
        finalProjectId = selProj.projectId;
        finalClientId = selProj.accountId; // existing client
      }

      /* ---------- 2. PROJECT ---------- */
      if (opportunityForm.isCustomProject) {
        const projResp = await ProjectService.createProject(
          companyId,
          finalClientId,
          userId,
          opportunityForm.projectName,
          opportunityForm.description,
          opportunityForm.projectStartDate,
          opportunityForm.projectEndDate,
          parseFloat(opportunityForm.estimatedBudget) || 0,
          0,                     // revenueAmount – not used
          opportunityForm.workPriority,
          "Planned",             // status
          []                     // skillIds – not needed here
        );
        if (!projResp.data.success) throw new Error("Project creation failed");
        finalProjectId = projResp.data.result.projectId;
      }

      /* ---------- 3. OPPORTUNITY ---------- */
      const primarySkillIds = opportunityForm.primarySkills
        .map(s => skills.find(sk => sk.skillName === s)?.skillId)
        .filter(id => id > 0);
      const secondarySkillIds = opportunityForm.secondarySkills
        .map(s => skills.find(sk => sk.skillName === s)?.skillId)
        .filter(id => id > 0);

      const payload = {
        projectId: finalProjectId,
        requesterUserId: userId,
        count: parseInt(opportunityForm.numberOfResources),
        experienceRange: opportunityForm.experienceRange,
        locationType: opportunityForm.locationType,
        workMode: opportunityForm.workArrangement,
        location: opportunityForm.location,
        priority: opportunityForm.workPriority,
        primarySkillIds,
        secondarySkillIds,
        groupTitle: `${opportunityForm.clientName}-${opportunityForm.isCustomProject ? opportunityForm.projectName : projects.find(p => p.projectId === finalProjectId)?.projectName}`,
        autoSubmit: true,
      };

      const oppResp = await OpportunityService.createBulkOpportunityRequests(
        payload.projectId,
        payload.requesterUserId,
        payload.count,
        payload.experienceRange,
        payload.locationType,
        payload.workMode,
        payload.location,
        payload.priority,
        payload.primarySkillIds,
        payload.secondarySkillIds,
        payload.groupTitle,
        payload.autoSubmit
      );

      if (oppResp.data?.success) {
        await loadOpportunityRequests();
        setRefreshKey(k => k + 1);
        Swal.close();
        Swal.fire({
          title: "Success!",
          text: `Opportunity request for ${payload.count} resource(s) created.`,
          icon: "success",
          confirmButtonColor: "#f59e0b",
        });
        setIsRequestModalOpen(false);
        resetForm();
      } else {
        throw new Error(oppResp.data?.message || "Opportunity creation failed");
      }
    } catch (err) {
      console.error(err);
      Swal.close();
      toast.error(err.message || "Failed to create opportunity.");
    }
  };

  /* ------------------- VIEW HANDLER ------------------- */
  const handleViewRequest = (req) => {
    setSelectedRequest(req);
    setIsViewModalOpen(true);
  };

  const filteredOpportunityRequests = opportunityRequests.filter(r => {
    const s = searchTerm.toLowerCase();
    const matchesSearch = (r.groupTitle || "").toLowerCase().includes(s) ||
                         (r.companyName || "").toLowerCase().includes(s) ||
                         (r.projectName || "").toLowerCase().includes(s);
    const matchesStatus = statusFilter === "All" || r.status === statusFilter;
    return matchesSearch && matchesStatus;
  });
  const opportunityColumns = [
    { key: "requestId", label: "Request ID", render: (req) => req.requestId },
    { key: "groupTitle", label: "Title", render: (req) => <span className="font-semibold">{req.groupTitle}</span> },
    { key: "companyName", label: "Client", render: (req) => req.companyName || "N/A" },
    { key: "projectName", label: "Project", render: (req) => req.projectName || "N/A" },
    { key: "totalRequested", label: "Resources", render: (req) => req.totalRequested },
    { key: "createdAt", label: "Created", render: (req) => req.createdAt },
    { key: "status", label: "Status", type: "status", render: (req) => <Badge className={`${getStatusColor(req.status)} border`}>{req.status}</Badge> },
    {
      key: "actions",
      label: "Actions",
      type: "actions",
      hideable: false,
      render: (req) => (
        <Button variant="outline" onClick={() => handleViewRequest(req)}>
          <Eye className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
          View Details
        </Button>
      ),
    },
  ];

  /* ------------------- RENDER ------------------- */
  return (
    <div className="p-4 sm:p-6 space-y-6">
      {/* Header Card */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <Card className="bg-gradient-to-br from-yellow-50 to-amber-50 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl sm:text-2xl">
              <Briefcase className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-500" />
              Opportunity Requests
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 text-sm sm:text-base">
              Manage and review opportunity requests for your projects.
            </p>
          </CardContent>
        </Card>
      </motion.div>

      {/* Search + Filter + Create */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5" />
            <Input
              className="pl-10 w-full rounded-sm"
              placeholder="Search by title, client, or project..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-48 rounded-sm">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All Statuses</SelectItem>
              <SelectItem value="Draft">Draft</SelectItem>
              <SelectItem value="Pending">Pending</SelectItem>
              <SelectItem value="Submitted">Submitted</SelectItem>
              <SelectItem value="Approved">Approved</SelectItem>
              <SelectItem value="Rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button
          onClick={handleCreateOpportunity}
          className="bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-600 hover:to-amber-600"
        >
          <Plus className="w-3 h-3 mr-1" />
          Create Opportunity
        </Button>
      </div>

      {/* Requests List */}
      <ReusableDataView
        tableKey="opportunity-requests-table"
        data={filteredOpportunityRequests}
        columns={opportunityColumns}
        rowKey="requestId"
        emptyMessage="No opportunity requests found."
        defaultViewMode="card"
      />

      {false && <section className="space-y-4">
        <AnimatePresence>
          {filteredOpportunityRequests.length === 0 ? (
            <motion.div className="text-center text-gray-500">No opportunity requests found.</motion.div>
          ) : (
            filteredOpportunityRequests.map((req, i) => (
              <motion.div
                key={req.requestId}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3, delay: i * 0.05 }}
              >
                <Card className="bg-white/90 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all cursor-pointer">
                  <CardContent className="p-4 sm:p-6">
                    <div className="flex flex-col sm:flex-row items-start mb-4 gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg sm:text-xl font-bold text-gray-800">
                            {`${req.requestId} (${req.groupTitle})`}
                          </h3>
                          <Badge className={`${getStatusColor(req.status)} border`}>{req.status}</Badge>
                        </div>
                        <div className="flex flex-wrap gap-4 text-xs sm:text-sm text-gray-500">
                          <span className="flex items-center gap-1"><Users className="w-4 h-4" />{req.totalRequested} resources</span>
                          <span className="flex items-center gap-1"><Briefcase className="w-4 h-4" />{req.projectName}</span>
                          <span className="flex items-center gap-1"><Calendar className="w-4 h-4" />Created: {req.createdAt}</span>
                        </div>
                      </div>
                      <Button variant="outline" onClick={() => handleViewRequest(req)}>
                        <Eye className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                        View Details
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </section>}

      {/* CREATE MODAL */}
      <Dialog open={isRequestModalOpen} onOpenChange={setIsRequestModalOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto p-8 bg-white rounded-2xl shadow-2xl border border-gray-200">
          <DialogHeader className="mb-6">
            <DialogTitle className="text-2xl font-bold text-gray-800">
              Create New Opportunity Request
            </DialogTitle>
            <DialogDescription className="text-gray-600 mt-2">
              Fill in the details to create a new opportunity request.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={submitOpportunity} className="space-y-6">

            {/* PROJECT & CLIENT */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* Project */}
              <div>
                <Label className="mb-1">Project *</Label>
                {!opportunityForm.isCustomProject ? (
                  <Select
                    value={opportunityForm.projectId}
                    onValueChange={(v) => {
                      if (v === "others") {
                        setOpportunityForm(prev => ({
                          ...prev,
                          projectId: "", projectName: "", clientId: "", clientName: "",
                          projectStartDate: "", projectEndDate: "", estimatedBudget: "",
                          isCustomProject: true,
                        }));
                      } else {
                        const proj = projects.find(p => p.projectId === parseInt(v));
                        setOpportunityForm(prev => ({
                          ...prev,
                          projectId: v,
                          projectName: proj?.projectName || "",
                          clientId: proj?.accountId || "",
                          clientName: proj?.accountName || "",
                          projectStartDate: proj?.startDate || "",
                          projectEndDate: proj?.endDate || "",
                          estimatedBudget: proj?.budget ? String(proj.budget) : "",
                          isCustomProject: false,
                        }));
                      }
                      setErrors(prev => ({ ...prev, projectId: "", projectName: "" }));
                    }}
                  >
                    <SelectTrigger><SelectValue placeholder="Select a project" /></SelectTrigger>
                    <SelectContent>
                      {projects.map(p => (
                        <SelectItem key={p.projectId} value={String(p.projectId)}>{p.projectName}</SelectItem>
                      ))}
                      <SelectItem value="others" className="font-semibold text-blue-600">+ Others (Custom Project)</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    value={opportunityForm.projectName}
                    onChange={e => {
                      setOpportunityForm(prev => ({ ...prev, projectName: e.target.value }));
                      setErrors(prev => ({ ...prev, projectName: "" }));
                    }}
                    placeholder="Enter project name"
                  />
                )}
                {errors?.projectId && !opportunityForm.isCustomProject && <p className="text-red-500 text-xs mt-1">{errors.projectId}</p>}
                {errors?.projectName && opportunityForm.isCustomProject && <p className="text-red-500 text-xs mt-1">{errors.projectName}</p>}
              </div>

              {/* Client */}
              <div>
                <Label className="mb-1">Client Name *</Label>
                <Input
                  value={opportunityForm.clientName}
                  onChange={e => {
                    setOpportunityForm(prev => ({ ...prev, clientName: e.target.value }));
                    setErrors(prev => ({ ...prev, clientName: "" }));
                  }}
                  placeholder="Enter client name"
                  disabled={!opportunityForm.isCustomProject && !!opportunityForm.projectId}
                  readOnly={!opportunityForm.isCustomProject && !!opportunityForm.projectId}
                />
                {errors?.clientName && <p className="text-red-500 text-xs mt-1">{errors.clientName}</p>}
              </div>

              {/* Resources */}
              <div>
                <Label className="mb-1">Number of Resources *</Label>
                <Input
                  type="number"
                  value={opportunityForm.numberOfResources}
                  onChange={e => {
                    setOpportunityForm(prev => ({ ...prev, numberOfResources: e.target.value }));
                    setErrors(prev => ({ ...prev, numberOfResources: "" }));
                  }}
                  placeholder="No. of Resources"
                  min="1"
                />
                {errors?.numberOfResources && <p className="text-red-500 text-xs mt-1">{errors.numberOfResources}</p>}
              </div>
            </div>

            {/* SKILLS */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Primary */}
              <div className="space-y-2">
                <Label>Primary Skills *</Label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {filteredPrimary.map(s => (
                    <Button key={s} type="button" variant="outline" size="sm"
                            onClick={() => selectSkillForInput("primary", s)}>{s}</Button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input value={primarySkillInput} onChange={e => setPrimarySkillInput(e.target.value)}
                         placeholder="Custom primary skill" />
                  <Button type="button" onClick={() => addCustomSkill("primary")}
                          className="bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-600 hover:to-amber-600">
                    <Plus className="w-4 h-4 mr-1" />Add
                  </Button>
                </div>
                {opportunityForm.primarySkills.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {opportunityForm.primarySkills.map((s, i) => (
                      <Badge key={`p-${s}-${i}`} variant="outline" className="flex items-center gap-1">
                        {s}
                        <button type="button" onClick={() => removeSkill("primary", s)}><X className="w-3 h-3" /></button>
                      </Badge>
                    ))}
                  </div>
                )}
                {errors?.primarySkills && <p className="text-red-500 text-xs mt-1">{errors.primarySkills}</p>}
              </div>

              {/* Secondary */}
              <div className="space-y-2">
                <Label>Secondary Skills</Label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {filteredSecondary.map(s => (
                    <Button key={s} type="button" variant="outline" size="sm"
                            onClick={() => selectSkillForInput("secondary", s)}>{s}</Button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input value={secondarySkillInput} onChange={e => setSecondarySkillInput(e.target.value)}
                         placeholder="Custom secondary skill" />
                  <Button type="button" onClick={() => addCustomSkill("secondary")}
                          className="bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-600 hover:to-amber-600">
                    <Plus className="w-4 h-4 mr-1" />Add
                  </Button>
                </div>
                {opportunityForm.secondarySkills.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {opportunityForm.secondarySkills.map((s, i) => (
                      <Badge key={`s-${s}-${i}`} variant="outline" className="flex items-center gap-1">
                        {s}
                        <button type="button" onClick={() => removeSkill("secondary", s)}><X className="w-3 h-3" /></button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* DATES & EXPERIENCE */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <Label className="mb-1">Start Date *</Label>
                <Input type="date" value={opportunityForm.projectStartDate}
                       onChange={e => {
                         setOpportunityForm(prev => ({ ...prev, projectStartDate: e.target.value }));
                         setErrors(prev => ({ ...prev, projectStartDate: "" }));
                       }}
                       disabled={!opportunityForm.isCustomProject && !!opportunityForm.projectId}
                />
                {errors?.projectStartDate && <p className="text-red-500 text-xs mt-1">{errors.projectStartDate}</p>}
              </div>
              <div>
                <Label className="mb-1">End Date *</Label>
                <Input type="date" value={opportunityForm.projectEndDate}
                       onChange={e => {
                         setOpportunityForm(prev => ({ ...prev, projectEndDate: e.target.value }));
                         setErrors(prev => ({ ...prev, projectEndDate: "" }));
                       }}
                       disabled={!opportunityForm.isCustomProject && !!opportunityForm.projectId}
                />
                {errors?.projectEndDate && <p className="text-red-500 text-xs mt-1">{errors.projectEndDate}</p>}
              </div>
              <div>
                <Label className="mb-1">Experience Range *</Label>
                <Select value={opportunityForm.experienceRange}
                        onValueChange={v => {
                          setOpportunityForm(prev => ({ ...prev, experienceRange: v }));
                          setErrors(prev => ({ ...prev, experienceRange: "" }));
                        }}>
                  <SelectTrigger><SelectValue placeholder="Select range" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0-2 years">0-2 years</SelectItem>
                    <SelectItem value="2-5 years">2-5 years</SelectItem>
                    <SelectItem value="5-8 years">5-8 years</SelectItem>
                    <SelectItem value="8+ years">8+ years</SelectItem>
                  </SelectContent>
                </Select>
                {errors?.experienceRange && <p className="text-red-500 text-xs mt-1">{errors.experienceRange}</p>}
              </div>
            </div>

            {/* ARRANGEMENT / LOCATION / PRIORITY */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <Label className="mb-1">Work Arrangement *</Label>
                <Select value={opportunityForm.workArrangement}
                        onValueChange={v => {
                          setOpportunityForm(prev => ({ ...prev, workArrangement: v }));
                          setErrors(prev => ({ ...prev, workArrangement: "" }));
                        }}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Remote">Remote</SelectItem>
                    <SelectItem value="Onsite">Onsite</SelectItem>
                    <SelectItem value="Hybrid">Hybrid</SelectItem>
                  </SelectContent>
                </Select>
                {errors?.workArrangement && <p className="text-red-500 text-xs mt-1">{errors.workArrangement}</p>}
              </div>
              <div>
                <Label className="mb-1">Work Location *</Label>
                <Input value={opportunityForm.location}
                       onChange={e => {
                         setOpportunityForm(prev => ({ ...prev, location: e.target.value }));
                         setErrors(prev => ({ ...prev, location: "" }));
                       }}
                       placeholder="City / Region" />
                {errors?.location && <p className="text-red-500 text-xs mt-1">{errors.location}</p>}
              </div>
              <div>
                <Label className="mb-1">Work Priority *</Label>
                <Select value={opportunityForm.workPriority}
                        onValueChange={v => {
                          setOpportunityForm(prev => ({ ...prev, workPriority: v }));
                          setErrors(prev => ({ ...prev, workPriority: "" }));
                        }}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Low">Low</SelectItem>
                    <SelectItem value="Medium">Medium</SelectItem>
                    <SelectItem value="High">High</SelectItem>
                  </SelectContent>
                </Select>
                {errors?.workPriority && <p className="text-red-500 text-xs mt-1">{errors.workPriority}</p>}
              </div>
            </div>

            {/* BUDGET */}
            <div>
              <Label className="mb-2">Estimated Budget ($)</Label>
              <Input type="number" value={opportunityForm.estimatedBudget}
                     onChange={e => {
                       setOpportunityForm(prev => ({ ...prev, estimatedBudget: e.target.value }));
                       setErrors(prev => ({ ...prev, estimatedBudget: "" }));
                     }}
                     placeholder="$"
                     min="0" step="0.01"
                     disabled={!opportunityForm.isCustomProject && !!opportunityForm.projectId}
              />
              {errors?.estimatedBudget && <p className="text-red-500 text-xs mt-1">{errors.estimatedBudget}</p>}
            </div>

            {/* DESCRIPTION */}
            <div>
              <Label className="mb-2">Project Description *</Label>
              <Textarea
                value={opportunityForm.description}
                onChange={e => {
                  setOpportunityForm(prev => ({ ...prev, description: e.target.value }));
                  setErrors(prev => ({ ...prev, description: "" }));
                }}
                placeholder="Describe requirements, goals, etc..."
                rows={3}
              />
              {errors?.description && <p className="text-red-500 text-xs mt-1">{errors.description}</p>}
            </div>

            {/* BUTTONS */}
            <div className="flex justify-end gap-4 pt-6">
              <Button type="button" variant="outline"
                      onClick={() => { setIsRequestModalOpen(false); resetForm(); }}>
                Cancel
              </Button>
              <Button type="submit"
                      className="bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-600 hover:to-amber-600">
                <Send className="w-4 h-4 mr-2" />
                Submit Opportunity
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* VIEW MODAL (unchanged) */}
      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto p-8 bg-white rounded-2xl shadow-2xl border border-gray-200">
          <DialogHeader className="mb-6">
            <DialogTitle className="text-2xl font-bold text-gray-800">
              Request Details - {selectedRequest?.requestId || "N/A"}
            </DialogTitle>
            <DialogDescription className="text-gray-600 mt-2">
              View all details of the selected opportunity request.
            </DialogDescription>
          </DialogHeader>
          {selectedRequest && (
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold text-gray-800 mb-2">Basic Information</h3>
                <div className="space-y-2 text-sm">
                  <p><strong>Project:</strong> {selectedRequest.projectName || "N/A"}</p>
                  <p><strong>Title:</strong> {selectedRequest.groupTitle || "N/A"}</p>
                  <p><strong>Resources:</strong> {selectedRequest.totalRequested || 1}</p>
                  <p><strong>Created By:</strong> {selectedRequest.createdByName || "N/A"} ({selectedRequest.createdByEmail || "N/A"})</p>
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-gray-800 mb-2">Timeline</h3>
                <div className="space-y-2 text-sm">
                  <p><strong>Created At:</strong> {selectedRequest.createdAt || "N/A"}</p>
                  <p><strong>Status:</strong> <Badge className={`ml-2 ${getStatusColor(selectedRequest.status)}`}>{selectedRequest.status || "Unknown"}</Badge></p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default OpportunityRequests;
