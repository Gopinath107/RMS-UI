import React, { useEffect, useState } from "react";
import { DndContext, closestCenter } from "@dnd-kit/core";
import { SortableContext, horizontalListSortingStrategy } from "@dnd-kit/sortable";
import { useDraggableColumns } from "./common/useDraggableColumns.js";
import { DraggableTableHead, ColumnOrderResetButton } from "./common/DraggableTableHead.jsx";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table.jsx";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "./ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "./ui/dialog";
import Swal from "sweetalert2";
import {
  Briefcase,
  Calendar,
  Target,
  DollarSign,
  FileText,
  Edit,
  Trash2,
  Plus,
  X,
  Activity,
  CheckCircle,
  Clock,
  Tag,
} from "lucide-react";
import { Label } from "./ui/label";
import { Badge } from "./ui/badge";
import { toast } from "sonner";

import { ProjectService } from "../services/ProjectmanagementService";
import { ClientService } from "../services/clientListService";
import { SkillService } from "../services/SkillsService";

const staticSkillOptions = [
  "React", "JavaScript", "Node.js", "TypeScript", "Python", "Java",
  "Google Cloud Platform", "AWS", "Azure", "Docker", "Kubernetes", "DevOps",
  "Veeva CRM", "Veeva Vault", "Salesforce Admin", "Salesforce Developer",
  "Salesforce - sales cloud health cloud service cloud data cloud",
  "SFMC", "Mulesoft", "Commerce cloud",
];

/* ── Thin scrollbar style injected once ── */
const SCROLLBAR_STYLE = `
  .modal-scroll::-webkit-scrollbar { width: 6px; }
  .modal-scroll::-webkit-scrollbar-track { background: transparent; }
  .modal-scroll::-webkit-scrollbar-thumb {
    background-color: #cbd5e1;
    border-radius: 10px;
  }
  .modal-scroll::-webkit-scrollbar-thumb:hover { background-color: #94a3b8; }

  .skills-scroll::-webkit-scrollbar { width: 5px; }
  .skills-scroll::-webkit-scrollbar-track { background: #f1f5f9; border-radius: 10px; }
  .skills-scroll::-webkit-scrollbar-thumb {
    background-color: #cbd5e1;
    border-radius: 10px;
    border: 1px solid #f1f5f9;
  }
  .skills-scroll::-webkit-scrollbar-thumb:hover { background-color: #94a3b8; }
`;

const PROJECT_DEFAULT_COLS = ['name', 'client', 'status', 'priority', 'budget', 'startDate', 'endDate', 'actions'];
const PROJECT_COL_LABELS = {
  name: 'Project Name', client: 'Client', status: 'Status', priority: 'Priority',
  budget: 'Budget', startDate: 'Start Date', endDate: 'End Date', actions: 'Actions',
};

const ProjectsManagement = () => {
  const [projects, setProjects] = useState([]);
  const [filteredProjects, setFilteredProjects] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [error, setError] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [selectedDetails, setSelectedDetails] = useState(null);
  const [clients, setClients] = useState([]);
  const [skillsList, setSkillsList] = useState([]);
  const [filteredSkills, setFilteredSkills] = useState([]);
  const [skillInput, setSkillInput] = useState("");
  const [viewMode, setViewMode] = useState('card'); // 'card' | 'table'

  // ── Column drag-to-reorder ──
  const { columnOrder: projColOrder, sensors: projSensors, handleDragEnd: handleProjColDragEnd, resetColumns: resetProjCols } =
    useDraggableColumns('projects', PROJECT_DEFAULT_COLS);


  const [newProject, setNewProject] = useState({
    name: "",
    accountName: "",
    accountId: null,
    startDate: "",
    endDate: "",
    status: "Planned",
    description: "",
    priority: "Medium",
    budget: "",
    companyId: 1,
    managerUserId: null,
    selectedSkills: [],
  });

  useEffect(() => {
    const loadData = async () => {
      await fetchClients();
      await fetchSkills();
      await fetchProjects();
    };
    loadData();
  }, []);

  const fetchClients = async () => {
    try {
      const res = await ClientService.fetchClientList();
      if (res && Array.isArray(res)) {
        setClients(res);
      } else {
        setClients([]);
        setError("No clients found.");
      }
    } catch (err) {
      console.error("Fetch clients error:", err);
      setError("Failed to fetch clients. Please check API connection.");
    }
  };

  const fetchSkills = async () => {
    try {
      const response = await SkillService.fetchSkillList();
      const fetchedSkills = response.data.result;
      const fetchedNames = new Set(fetchedSkills.map(s => s.skillName.toLowerCase()));
      const uniqueStatic = staticSkillOptions
        .filter(name => !fetchedNames.has(name.toLowerCase()))
        .map((name, index) => ({ skillId: -(index + 1), skillName: name }));
      const combinedSkills = [...uniqueStatic, ...fetchedSkills].sort((a, b) =>
        a.skillName.localeCompare(b.skillName)
      );
      setSkillsList(combinedSkills);
      setFilteredSkills(combinedSkills.slice(0, 30).map(s => s.skillName));
    } catch (error) {
      console.error("Error fetching skills:", error);
      const staticSkills = staticSkillOptions
        .map((name, index) => ({ skillId: -(index + 1), skillName: name }))
        .sort((a, b) => a.skillName.localeCompare(b.skillName));
      setSkillsList(staticSkills);
      setFilteredSkills(staticSkills.slice(0, 30).map(s => s.skillName));
      toast.error("Failed to fetch skills, using static skills");
    }
  };

  const fetchProjects = async () => {
    try {
      const res = await ProjectService.fetchProjectList();
      if (res && res.data.success === true) {
        const mappedProjects = res.data.result.map(project => ({
          ...project,
          skills: project.skills || [],
        }));
        setProjects(mappedProjects);
        setFilteredProjects(mappedProjects);
        setError("");
      } else {
        setProjects([]);
        setFilteredProjects([]);
        setError("No projects found.");
      }
    } catch (err) {
      setError("Failed to fetch projects. Please check API connection.");
      console.error("Fetch error:", err);
    }
  };

  const handleSearch = (e) => {
    const value = e.target.value.toLowerCase();
    setSearchTerm(value);
    filterProjects(value, statusFilter);
  };

  const handleStatusChange = (value) => {
    setStatusFilter(value);
    filterProjects(searchTerm, value);
  };

  const filterProjects = (searchValue, statusValue) => {
    let filtered = projects;
    if (searchValue) {
      filtered = filtered.filter(
        (p) =>
          p.projectName?.toLowerCase().includes(searchValue) ||
          p.accountName?.toLowerCase().includes(searchValue) ||
          p.description?.toLowerCase().includes(searchValue)
      );
    }
    if (statusValue !== "All") {
      filtered = filtered.filter((p) => p.status === statusValue);
    }
    setFilteredProjects(filtered);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewProject((prev) => ({ ...prev, [name]: value }));
  };

  const addCustomSkill = async (providedSkill) => {
    const isDirectCall = typeof providedSkill === "string";
    const skillName = isDirectCall ? providedSkill.trim() : skillInput.trim();
    if (!skillName) {
      toast.error("Please enter a valid skill name.");
      return;
    }
    const lower = skillName.toLowerCase();
    const existingSkill = skillsList.find(s => s.skillName.toLowerCase() === lower);
    if (existingSkill && existingSkill.skillId > 0) {
      if (!newProject.selectedSkills.some(s => s.id === existingSkill.skillId)) {
        setNewProject(prev => ({
          ...prev,
          selectedSkills: [...prev.selectedSkills, { id: existingSkill.skillId, name: existingSkill.skillName }],
        }));
        toast.success("Skill added!");
      } else if (isDirectCall) {
        toast.info("Skill is already added.");
      }
      if (!isDirectCall) setSkillInput("");
      return;
    }
    try {
      const response = await SkillService.createSkill(1, skillName);
      if (response.data.success) {
        const newSkill = response.data.result;
        setSkillsList(prev => {
          const filtered = prev.filter(s => s.skillName.toLowerCase() !== lower);
          return [...filtered, newSkill].sort((a, b) => a.skillName.localeCompare(b.skillName));
        });
        if (!newProject.selectedSkills.some(s => s.id === newSkill.skillId)) {
          setNewProject(prev => ({
            ...prev,
            selectedSkills: [...prev.selectedSkills, { id: newSkill.skillId, name: newSkill.skillName }],
          }));
        }
        if (!isDirectCall) setSkillInput("");
        toast.success("Custom skill added successfully!");
      } else {
        toast.error(`Failed to add skill: ${response.data.message || "Unknown error"}`);
      }
    } catch (error) {
      console.error("Error adding custom skill:", error.response?.data || error.message);
      toast.error("Failed to add custom skill. Check console for details.");
    }
  };

  const removeSkill = (skillName) => {
    setNewProject(prev => ({
      ...prev,
      selectedSkills: prev.selectedSkills.filter(s => s.name !== skillName),
    }));
  };

  const handleEditProject = (project) => {
    setSelectedProject(project);
    const client = clients.find((c) => c.accountId === project.accountId);
    setNewProject({
      name: project.projectName || "",
      accountName: client ? client.accountName : project.accountName || "",
      accountId: project.accountId || null,
      startDate: project.startDate || "",
      endDate: project.endDate || "",
      status: project.status || "Planned",
      description: project.description || "",
      priority: project.priority || "Medium",
      budget: project.budget ? project.budget.toString() : "",
      companyId: project.companyId || 1,
      managerUserId: project.managerUserId || null,
      selectedSkills: project.skills
        .map(skill => {
          if (typeof skill === "object") {
            const id = skill.skillId ?? skill.id;
            const name = skill.skillName ?? skill.name;
            return { id, name };
          }
          const found = skillsList.find(s => s.skillId === skill || s.skillName === skill);
          return found
            ? { id: found.skillId, name: found.skillName }
            : { id: null, name: String(skill) };
        })
        .filter(s => s.name && s.id),
    });
    setIsModalOpen(true);
  };

  const handleSubmitProject = async (e) => {
    e.preventDefault();
    try {
      const requiredFields = {
        name: "Project Name",
        accountId: "Client (Account)",
        startDate: "Start Date",
        endDate: "End Date",
      };
      for (const [key, label] of Object.entries(requiredFields)) {
        if (!newProject[key]) {
          Swal.fire({ icon: "warning", title: "Missing Input Field!", text: `${label} is required!`, timer: 1500, showConfirmButton: false });
          return;
        }
      }
      if (new Date(newProject.endDate) < new Date(newProject.startDate)) {
        Swal.fire({ icon: "warning", title: "Invalid Date Range!", text: "End date cannot be earlier than start date!", timer: 1500, showConfirmButton: false });
        return;
      }
      if (parseFloat(newProject.budget || 0) < 0) {
        Swal.fire({ icon: "warning", title: "Invalid Budget!", text: "Budget cannot be negative!", timer: 1500, showConfirmButton: false });
        return;
      }
      const payload = {
        companyId: newProject.companyId,
        accountId: newProject.accountId,
        projectName: newProject.name,
        description: newProject.description,
        startDate: newProject.startDate,
        endDate: newProject.endDate,
        budget: parseFloat(newProject.budget || 0),
        revenueAmount: 0,
        priority: newProject.priority,
        status: newProject.status,
        skillIds: newProject.selectedSkills.map(s => s.id).filter(id => id > 0),
        managerUserId: newProject.managerUserId,
      };
      let result;
      if (selectedProject && selectedProject.projectId) {
        result = await ProjectService.updateProject(
          selectedProject.projectId, payload.companyId, payload.accountId, payload.managerUserId,
          payload.projectName, payload.description, payload.startDate, payload.endDate,
          payload.budget, payload.revenueAmount, payload.priority, payload.status, payload.skillIds
        );
      } else {
        result = await ProjectService.createProject(
          payload.companyId, payload.accountId, payload.managerUserId,
          payload.projectName, payload.description, payload.startDate, payload.endDate,
          payload.budget, payload.revenueAmount, payload.priority, payload.status, payload.skillIds
        );
      }
      if (result && (result.data.success === true || result.status === 200)) {
        await fetchProjects();
        setIsModalOpen(false);
        setSelectedProject(null);
        setNewProject({ name: "", accountName: "", accountId: null, startDate: "", endDate: "", status: "Planned", description: "", priority: "Medium", budget: "", companyId: 1, managerUserId: null, selectedSkills: [] });
        setSkillInput("");
        Swal.fire({ icon: "success", title: selectedProject ? "Project Updated!" : "Project Created!", text: `The project has been successfully ${selectedProject ? "updated" : "added"}.`, timer: 1500, showConfirmButton: false });
      } else {
        Swal.fire({ icon: "error", title: "Error", text: result?.data?.message || "Failed to submit project." });
      }
    } catch (error) {
      console.error("Project submission error:", error.response?.data || error.message);
      Swal.fire({ icon: "error", title: "Network/Server Error", text: "Failed to submit project. Check console & API." });
    }
  };

  const handleDeleteProject = async (projectId) => {
    const result = await Swal.fire({
      title: "Are you sure?", text: "You won't be able to revert this!", icon: "warning",
      showCancelButton: true, confirmButtonColor: "#3085d6", cancelButtonColor: "#d33", confirmButtonText: "Yes, delete it!",
    });
    if (result.isConfirmed) {
      try {
        const res = await ProjectService.deleteProject(projectId);
        if (res.status === 200) {
          Swal.fire({ icon: "success", title: "Deleted!", text: "Project has been deleted.", timer: 1500, showConfirmButton: false });
          await fetchProjects();
        } else {
          Swal.fire({ icon: "error", title: "Error", text: "Failed to delete project." });
        }
      } catch (error) {
        console.error("Delete error:", error);
        Swal.fire({ icon: "error", title: "Error", text: "Failed to delete project." });
      }
    }
  };

  const totalProjects = projects.length;
  const inProgress = projects.filter(p => p.status === "In Progress").length;
  const completed = projects.filter(p => p.status === "Completed").length;
  const endingSoon = projects.filter(p => {
    const endDate = new Date(p.endDate);
    const today = new Date("2025-10-07T10:28:00Z");
    const oneWeekLater = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
    return endDate >= today && endDate <= oneWeekLater;
  }).length;

  const resetModal = () => {
    setIsModalOpen(false);
    setSelectedProject(null);
    setNewProject({ name: "", accountName: "", accountId: null, startDate: "", endDate: "", status: "Planned", description: "", priority: "Medium", budget: "", companyId: 1, managerUserId: null, selectedSkills: [] });
    setSkillInput("");
  };

  return (
    <div className="space-y-0">
      {/* Inject scrollbar styles once */}
      <style>{SCROLLBAR_STYLE}</style>

      {/* PAGE HEADER */}
      <div className="px-8 pt-6 pb-0 mb-0">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-1">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Project Management</h1>
            <p className="text-gray-900 mt-0.5 text-sm font-medium">
              Manage and oversee all your company projects
            </p>
          </div>
        </div>
      </div>

      {/* PAGE BODY */}
      <div className="space-y-6 px-6 pt-6 pb-6">

        {/* Search + Filter + Add Button */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
            <Input
              placeholder="Search by name, client, or description..."
              value={searchTerm}
              onChange={handleSearch}
              className="w-full md:w-80"
            />
            <Select value={statusFilter} onValueChange={handleStatusChange}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Statuses</SelectItem>
                <SelectItem value="New">New</SelectItem>
                <SelectItem value="Planned">Planned</SelectItem>
                <SelectItem value="In Progress">In Progress</SelectItem>
                <SelectItem value="On Hold">On Hold</SelectItem>
                <SelectItem value="Completed">Completed</SelectItem>
                <SelectItem value="Cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            {/* View mode toggle */}
            <div className="flex rounded-md border border-gray-200 overflow-hidden">
              <button
                type="button"
                onClick={() => setViewMode('card')}
                className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                  viewMode === 'card' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'
                }`}
                title="Card View"
              >
                ⊞ Cards
              </button>
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                  viewMode === 'table' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'
                }`}
                title="Table View"
              >
                ☰ Table
              </button>
            </div>
            <Button
              onClick={() => {
                setSelectedProject(null);
                setNewProject({ name: "", accountName: "", accountId: null, startDate: "", endDate: "", status: "Planned", description: "", priority: "Medium", budget: "", companyId: 1, managerUserId: null, selectedSkills: [] });
                setSkillInput("");
                setIsModalOpen(true);
              }}
              className="bg-green-600 hover:bg-green-700 text-white px-6"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Project
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-blue-50 border-blue-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-blue-800">Total Projects</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <Briefcase className="h-8 w-8 text-blue-600 mr-2" />
                <p className="text-2xl font-bold text-blue-800">{totalProjects}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-green-50 border-green-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-green-800">In Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <Activity className="h-8 w-8 text-green-600 mr-2" />
                <p className="text-2xl font-bold text-green-800">{inProgress}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-yellow-50 border-yellow-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-yellow-800">Completed</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <CheckCircle className="h-8 w-8 text-yellow-600 mr-2" />
                <p className="text-2xl font-bold text-yellow-800">{completed}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-red-50 border-red-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-red-800">Ending Soon</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <Clock className="h-8 w-8 text-red-600 mr-2" />
                <p className="text-2xl font-bold text-red-800">{endingSoon}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Project Cards Grid (Card Mode) */}
        {viewMode === 'card' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.length > 0 ? (
            filteredProjects.map((project) => (
              <Card
                key={project.projectId}
                className="shadow-md hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => {
                  setSelectedDetails(project);
                  setIsDetailsOpen(true);
                }}
              >
                <CardHeader className="rounded-lg bg-gray-50">
                  <CardTitle className="text-lg font-semibold flex items-center" style={{ overflowWrap: "anywhere" }}>
                    <Briefcase className="h-5 w-5 mr-2 text-blue-600" />
                    {project.projectName}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 pt-4">
                  <p className="flex items-center text-sm text-gray-600">
                    <Target className="h-4 w-4 mr-2" />
                    Client: {project.accountName}
                  </p>
                  <p className="flex items-center text-sm text-gray-600">
                    <Calendar className="h-4 w-4 mr-2" />
                    {project.startDate} - {project.endDate}
                  </p>
                  <p className="flex items-center text-sm text-gray-600">
                    <DollarSign className="h-4 w-4 mr-2" />
                    Budget: ${project.budget?.toLocaleString() || "N/A"}
                  </p>
                  <p className="flex items-center text-sm text-gray-600">
                    <FileText className="h-4 w-4 mr-2" />
                    Status: {project.status}
                  </p>
                 {project.skills && project.skills.length > 0 && (
                    <p className="flex items-start text-sm text-gray-600">
                      <Tag className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
                      Skills:{" "}
                      {project.skills
                        .map(s =>
                          typeof s === "object"
                            ? s.name
                            : skillsList.find(sk => sk.skillId === s || sk.skillName === s)?.skillName || s
                        )
                        .join(", ")}
                    </p>
                  )}
                  <div className="flex justify-end space-x-2 mt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => { e.stopPropagation(); handleEditProject(project); }}
                      className="text-blue-600 hover:text-blue-700"
                    >
                      <Edit className="h-4 w-4 mr-1" /> Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => { e.stopPropagation(); handleDeleteProject(project.projectId); }}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4 mr-1" /> Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <p className="text-gray-500 col-span-3">{error || "No projects found"}</p>
          )}
          </div>
        )}

        {/* Table View (Table Mode) */}
        {viewMode === 'table' && (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="flex justify-end px-4 py-2 border-b border-gray-100">
              <ColumnOrderResetButton onReset={resetProjCols} />
            </div>
            <DndContext sensors={projSensors} collisionDetection={closestCenter} onDragEnd={handleProjColDragEnd}>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <SortableContext items={projColOrder} strategy={horizontalListSortingStrategy}>
                        {projColOrder.map(colId => (
                          <DraggableTableHead key={colId} id={colId} label={PROJECT_COL_LABELS[colId]} />
                        ))}
                      </SortableContext>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredProjects.length > 0 ? filteredProjects.map((project) => (
                      <TableRow key={project.projectId} className="hover:bg-gray-50 cursor-pointer" onClick={() => { setSelectedDetails(project); setIsDetailsOpen(true); }}>
                        {projColOrder.map(colId => {
                          switch (colId) {
                            case 'name':
                              return <TableCell key={colId} className="font-medium">{project.projectName}</TableCell>;
                            case 'client':
                              return <TableCell key={colId}>{project.accountName}</TableCell>;
                            case 'status':
                              return (
                                <TableCell key={colId}>
                                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                                    project.status === 'In Progress' ? 'bg-blue-100 text-blue-800' :
                                    project.status === 'Completed' ? 'bg-green-100 text-green-800' :
                                    project.status === 'On Hold' ? 'bg-yellow-100 text-yellow-800' :
                                    project.status === 'Cancelled' ? 'bg-red-100 text-red-800' :
                                    'bg-gray-100 text-gray-800'
                                  }`}>{project.status}</span>
                                </TableCell>
                              );
                            case 'priority':
                              return (
                                <TableCell key={colId}>
                                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                                    project.priority === 'High' ? 'bg-red-100 text-red-800' :
                                    project.priority === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                                    'bg-green-100 text-green-800'
                                  }`}>{project.priority}</span>
                                </TableCell>
                              );
                            case 'budget':
                              return <TableCell key={colId}>${project.budget?.toLocaleString() || 'N/A'}</TableCell>;
                            case 'startDate':
                              return <TableCell key={colId}>{project.startDate || 'N/A'}</TableCell>;
                            case 'endDate':
                              return <TableCell key={colId}>{project.endDate || 'N/A'}</TableCell>;
                            case 'actions':
                              return (
                                <TableCell key={colId} onClick={e => e.stopPropagation()}>
                                  <div className="flex gap-2">
                                    <Button variant="outline" size="sm" onClick={() => handleEditProject(project)} className="text-blue-600 hover:text-blue-700"><Edit className="h-3 w-3" /></Button>
                                    <Button variant="outline" size="sm" onClick={() => handleDeleteProject(project.projectId)} className="text-red-600 hover:text-red-700"><Trash2 className="h-3 w-3" /></Button>
                                  </div>
                                </TableCell>
                              );
                            default: return <TableCell key={colId} />;
                          }
                        })}
                      </TableRow>
                    )) : (
                      <TableRow><TableCell colSpan={projColOrder.length} className="text-center py-8 text-gray-500">{error || "No projects found"}</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </DndContext>
          </div>
        )}
      </div>

      {/* CREATE / EDIT PROJECT MODAL */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent
          className="
            w-[95vw] max-w-[1100px]
            bg-white rounded-2xl shadow-2xl border border-gray-200
            p-0 gap-0
            flex flex-col
          "
          style={{ maxHeight: "90vh" }}
        >
          {/* ── Header (never scrolls) ── */}
          <div className="flex-shrink-0 px-6 pt-5 pb-3 border-b border-gray-100">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-gray-800">
                {selectedProject ? "Edit Project" : "Create New Project"}
              </DialogTitle>
              <DialogDescription className="text-gray-500 text-xs mt-0.5">
                {selectedProject
                  ? "Update the project details below."
                  : "Fill in the details to create a new project."}
              </DialogDescription>
            </DialogHeader>
          </div>

          {/* ── Scrollable form area ── */}
          <div
            className="modal-scroll flex-1 overflow-y-auto px-6 py-4"
            style={{ scrollbarWidth: "thin", scrollbarColor: "#cbd5e1 transparent" }}
          >
            <form id="project-form" onSubmit={handleSubmitProject} className="flex flex-col gap-4">

              {/* Row 1 — Project Name · Client · Status */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex flex-col gap-1">
                  <Label htmlFor="name" className="text-xs font-medium text-gray-700">Project Name *</Label>
                  <Input
                    id="name" name="name"
                    placeholder="Enter project name"
                    value={newProject.name}
                    onChange={handleInputChange}
                    className="h-8 px-3 py-1.5 text-xs border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    required
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <Label htmlFor="accountId" className="text-xs font-medium text-gray-700">Client *</Label>
                  <Select
                    name="accountId"
                    value={newProject.accountId ? newProject.accountId.toString() : ""}
                    onValueChange={(value) => {
                      const id = value ? parseInt(value) : null;
                      const client = clients.find((c) => c.accountId === id);
                      setNewProject((prev) => ({
                        ...prev,
                        accountId: id,
                        accountName: client ? client.accountName : prev.accountName,
                      }));
                    }}
                  >
                    <SelectTrigger className="h-8 px-3 py-1.5 text-xs border-gray-300 focus:border-blue-500 focus:ring-blue-500">
                      <SelectValue placeholder="Select Client" />
                    </SelectTrigger>
                    <SelectContent>
                      {clients.map((client) => (
                        <SelectItem key={client.accountId} value={client.accountId.toString()}>
                          {client.accountName}
                        </SelectItem>
                      ))}
                      {selectedProject && newProject.accountId &&
                        !clients.find((c) => c.accountId === newProject.accountId) && (
                          <SelectItem value={newProject.accountId.toString()}>
                            {newProject.accountName || "Unknown Client"}
                          </SelectItem>
                        )}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex flex-col gap-1">
                  <Label htmlFor="status" className="text-xs font-medium text-gray-700">Status</Label>
                  <Select
                    name="status"
                    value={newProject.status}
                    onValueChange={(value) => setNewProject((prev) => ({ ...prev, status: value }))}
                  >
                    <SelectTrigger className="h-8 px-3 py-1.5 text-xs border-gray-300 focus:border-blue-500 focus:ring-blue-500">
                      <SelectValue placeholder="Select Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="New">New</SelectItem>
                      <SelectItem value="Planned">Planned</SelectItem>
                      <SelectItem value="In Progress">In Progress</SelectItem>
                      <SelectItem value="On Hold">On Hold</SelectItem>
                      <SelectItem value="Completed">Completed</SelectItem>
                      <SelectItem value="Cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Row 2 — Start Date · End Date · Budget · Priority */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="flex flex-col gap-1">
                  <Label htmlFor="startDate" className="text-xs font-medium text-gray-700">Start Date *</Label>
                  <Input
                    id="startDate" name="startDate" type="date"
                    value={newProject.startDate}
                    onChange={handleInputChange}
                    className="h-8 px-3 py-1.5 text-xs border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    required
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <Label htmlFor="endDate" className="text-xs font-medium text-gray-700">End Date *</Label>
                  <Input
                    id="endDate" name="endDate" type="date"
                    min={newProject.startDate}
                    value={newProject.endDate}
                    onChange={handleInputChange}
                    className="h-8 px-3 py-1.5 text-xs border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    required
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <Label htmlFor="budget" className="text-xs font-medium text-gray-700">Budget *</Label>
                  <Input
                    id="budget" name="budget" type="number"
                    min="0"
                    onKeyDown={(e) => {
                      if (e.key === '-' || e.key === 'e') e.preventDefault();
                    }}
                    placeholder="Enter budget"
                    value={newProject.budget}
                    onChange={handleInputChange}
                    className="h-8 px-3 py-1.5 text-xs border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    required
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <Label htmlFor="priority" className="text-xs font-medium text-gray-700">Priority</Label>
                  <Select
                    name="priority"
                    value={newProject.priority}
                    onValueChange={(value) => setNewProject((prev) => ({ ...prev, priority: value }))}
                  >
                    <SelectTrigger className="h-8 px-3 py-1.5 text-xs border-gray-300 focus:border-blue-500 focus:ring-blue-500">
                      <SelectValue placeholder="Select Priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Low">Low</SelectItem>
                      <SelectItem value="Medium">Medium</SelectItem>
                      <SelectItem value="High">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Row 3 — Description */}
              <div className="flex flex-col gap-1">
                <Label htmlFor="description" className="text-xs font-medium text-gray-700">Description</Label>
                <textarea
                  id="description" name="description"
                  placeholder="Enter description"
                  value={newProject.description}
                  onChange={handleInputChange}
                  className="flex w-full rounded-md border border-gray-300 bg-transparent px-3 py-1.5 text-xs placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[50px] resize-none"
                />
              </div>

              {/* Row 4 — Skills */}
              <div className="flex flex-col gap-1">
                <Label className="text-xs font-medium text-gray-700">Skills</Label>

                {/* Skill chip picker */}
                <div
                  className="skills-scroll max-h-[60px] overflow-y-auto bg-gray-50 rounded-lg border border-gray-200 p-1.5"
                  style={{ scrollbarWidth: "thin", scrollbarColor: "#cbd5e1 #f1f5f9" }}
                >
                  <div className="flex flex-wrap gap-1">
                    {filteredSkills.map(skill => (
                      <Button
                        type="button"
                        key={skill}
                        variant="outline"
                        size="sm"
                        onClick={() => addCustomSkill(skill)}
                        className="text-xs h-6 px-2 py-0"
                      >
                        {skill}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Custom skill input */}
                <div className="flex gap-2 mt-1">
                  <Input
                    value={skillInput}
                    onChange={(e) => setSkillInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault(); // Prevents the form submission
                        addCustomSkill();   // Adds the skill instead
                      }
                    }}
                    placeholder="Type or select a skill above, then click Add"
                    className="flex-1 h-8 px-3 py-1.5 text-xs border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  />
                  <Button
                    type="button"
                    onClick={addCustomSkill}
                    className="h-8 py-1 px-4 bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-600 hover:to-amber-600 text-xs whitespace-nowrap"
                  >
                    <Plus className="w-3 h-3 mr-1" /> Add
                  </Button>
                </div>

                {/* Selected skills badges — fixed height box */}
                {newProject.selectedSkills.length > 0 && (
                  <div
                    className="skills-scroll bg-blue-50/30 border border-blue-100 rounded-lg p-1.5 mt-1"
                    style={{
                      height: "80px",
                      overflowY: "scroll",
                      scrollbarWidth: "thin",
                      scrollbarColor: "#cbd5e1 #f1f5f9",
                    }}
                  >
                    <div className="flex flex-wrap gap-1.5">
                      {newProject.selectedSkills.map((skill) => (
                        <Badge
                          key={skill.id}
                          variant="default"
                          className="flex items-center gap-1 bg-blue-100 text-blue-700"
                        >
                          {skill.name}
                          <button
                            type="button"
                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); removeSkill(skill.name); }}
                            className="ml-1 focus:outline-none"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>

            </form>
          </div>

          {/* ── Footer (never scrolls, always visible) ── */}
          <div className="flex-shrink-0 flex justify-end gap-4 px-6 py-3 border-t border-gray-100 bg-white rounded-b-2xl">
            <Button
              type="button"
              variant="outline"
              onClick={resetModal}
              className="h-8 text-xs border-gray-300 text-gray-700 hover:bg-gray-100"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              form="project-form"
              className="h-8 text-xs bg-blue-600 hover:bg-blue-700 text-white px-6"
            >
              {selectedProject ? "Update Project" : "Create Project"}
            </Button>
          </div>

        </DialogContent>
      </Dialog>

      {/* PROJECT DETAILS MODAL */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent
          className="
            w-[95vw] max-w-[1000px]
            max-h-[92vh] overflow-y-auto
            p-8 bg-white rounded-2xl shadow-2xl border border-gray-200
          "
        >
          <DialogHeader className="mb-6">
            <DialogTitle className="text-2xl font-bold text-gray-800">
              Project Details: {selectedDetails?.projectName}
            </DialogTitle>
            <DialogDescription className="text-gray-500 text-sm mt-1">
              View all details of the selected project.
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch auto-rows-fr">
            <Card className="border border-gray-300 h-full min-h-[160px]">
              <CardHeader className="pb-3 border-b border-gray-100">
                <CardTitle className="flex items-center gap-2 text-base font-semibold text-gray-800">
                  <Briefcase className="w-4 h-4 text-blue-500" /> Project Overview
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 grid grid-cols-2 gap-x-6 gap-y-3">
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Client</p>
                  <p className="text-gray-800 mt-0.5">{selectedDetails?.accountName || "N/A"}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Status</p>
                  <p className="text-gray-800 mt-0.5">{selectedDetails?.status || "N/A"}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Priority</p>
                  <p className="text-gray-800 mt-0.5">{selectedDetails?.priority || "N/A"}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Budget</p>
                  <p className="text-gray-800 mt-0.5">${selectedDetails?.budget?.toLocaleString() || "N/A"}</p>
                </div>
              </CardContent>
            </Card>

            <Card className="border border-gray-300 h-full min-h-[160px]">
              <CardHeader className="pb-3 border-b border-gray-100">
                <CardTitle className="flex items-center gap-2 text-base font-semibold text-gray-800">
                  <Calendar className="w-4 h-4 text-blue-500" /> Timeline
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 grid grid-cols-2 gap-x-6 gap-y-3">
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Start Date</p>
                  <p className="text-gray-800 mt-0.5">{selectedDetails?.startDate || "N/A"}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">End Date</p>
                  <p className="text-gray-800 mt-0.5">{selectedDetails?.endDate || "N/A"}</p>
                </div>
              </CardContent>
            </Card>

            <Card className="border border-gray-300 h-full min-h-[160px]">
              <CardHeader className="pb-3 border-b border-gray-100">
                <CardTitle className="flex items-center gap-2 text-base font-semibold text-gray-800">
                  <FileText className="w-4 h-4 text-blue-500" /> Description
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <p className="text-gray-700 text-sm leading-relaxed">
                  {selectedDetails?.description || "No description provided."}
                </p>
              </CardContent>
            </Card>

            <Card className="border border-gray-300 h-full min-h-[160px]">
              <CardHeader className="pb-3 border-b border-gray-100">
                <CardTitle className="flex items-center gap-2 text-base font-semibold text-gray-800">
                  <Activity className="w-4 h-4 text-blue-500" /> Required Skills
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 overflow-hidden">
                <div className="flex flex-wrap gap-2 overflow-y-auto max-h-[100px]">
                  {selectedDetails?.skills && selectedDetails.skills.length > 0 ? (
                    selectedDetails.skills.map((skill) => {
                      const skillName =
                        typeof skill === "object"
                          ? skill.name
                          : skillsList.find(s => s.skillId === skill || s.skillName === skill)?.skillName || skill;
                      return (
                        <Badge key={skill.id || skill} className="bg-blue-100 text-blue-700">
                          {skillName}
                        </Badge>
                      );
                    })
                  ) : (
                    <p className="text-gray-500 text-sm">No skills assigned</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProjectsManagement;