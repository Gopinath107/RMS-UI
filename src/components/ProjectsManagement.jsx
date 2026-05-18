import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
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
  Zap,
  Users,
  TrendingUp,
  ArrowRight,
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
        .map(skill =>
          typeof skill === "object"
            ? { id: skill.skillId, name: skill.skillName }
            : skillsList.find(s => s.skillId === skill || s.skillName === skill) || { id: null, name: skill }
        )
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

        {/* Project Cards Grid — Modern */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.length > 0 ? (
            filteredProjects.map((project) => {
              const statusMeta = {
                'In Progress': { bg: 'bg-emerald-100', text: 'text-emerald-700', dot: 'bg-emerald-500' },
                'Planned':     { bg: 'bg-blue-100',    text: 'text-blue-700',    dot: 'bg-blue-500' },
                'Completed':   { bg: 'bg-purple-100',  text: 'text-purple-700',  dot: 'bg-purple-500' },
                'On Hold':     { bg: 'bg-amber-100',   text: 'text-amber-700',   dot: 'bg-amber-500' },
                'Cancelled':   { bg: 'bg-red-100',     text: 'text-red-700',     dot: 'bg-red-500' },
                'New':         { bg: 'bg-sky-100',     text: 'text-sky-700',     dot: 'bg-sky-500' },
              }[project.status] || { bg: 'bg-gray-100', text: 'text-gray-700', dot: 'bg-gray-400' };
              const gradients = [
                'from-violet-500 to-purple-600',
                'from-sky-500 to-blue-600',
                'from-emerald-500 to-teal-600',
                'from-orange-500 to-amber-600',
                'from-rose-500 to-pink-600',
                'from-indigo-500 to-blue-700',
              ];
              const grad = gradients[project.projectId % gradients.length];
              const skillNames = (project.skills || []).map(s =>
                typeof s === 'object' ? s.name
                  : skillsList.find(sk => sk.skillId === s || sk.skillName === s)?.skillName || s
              );
              return (
                <div
                  key={project.projectId}
                  className="group relative bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 overflow-hidden cursor-pointer flex flex-col"
                  onClick={() => { setSelectedDetails(project); setIsDetailsOpen(true); }}
                >
                  {/* Gradient header band */}
                  <div className={`bg-gradient-to-r ${grad} px-5 pt-5 pb-8 relative overflow-hidden`}>
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
                    <div className="absolute bottom-0 left-0 w-20 h-20 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2" />
                    <div className="flex items-start justify-between gap-2 relative z-10">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-white font-bold text-base leading-snug truncate" title={project.projectName}>
                          {project.projectName}
                        </h3>
                        <p className="text-white/75 text-xs mt-0.5 truncate">{project.accountName || 'No client'}</p>
                      </div>
                      <div className="w-10 h-10 shrink-0 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center">
                        <Briefcase className="w-5 h-5 text-white" />
                      </div>
                    </div>
                  </div>

                  {/* Body — pulled up to overlap the header */}
                  <div className="flex-1 px-5 pb-4 -mt-4 relative z-10">
                    {/* Status badge */}
                    <div className="flex items-center justify-between mb-3">
                      <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${statusMeta.bg} ${statusMeta.text}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${statusMeta.dot}`} />
                        {project.status}
                      </span>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                        project.priority === 'High' ? 'bg-red-50 text-red-600' :
                        project.priority === 'Medium' ? 'bg-amber-50 text-amber-600' :
                        'bg-gray-50 text-gray-500'
                      }`}>{project.priority || 'Medium'}</span>
                    </div>

                    {/* Info rows */}
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <Calendar className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                        <span className="truncate">{project.startDate} → {project.endDate}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <DollarSign className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                        <span className="font-semibold text-gray-700">${project.budget?.toLocaleString() || 'N/A'}</span>
                      </div>
                    </div>

                    {/* Skill chips */}
                    {skillNames.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-4">
                        {skillNames.slice(0, 3).map(s => (
                          <span key={s} className="text-xs bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full font-medium">{s}</span>
                        ))}
                        {skillNames.length > 3 && (
                          <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">+{skillNames.length - 3}</span>
                        )}
                      </div>
                    )}

                    {/* Action buttons */}
                    <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
                      <button
                        onClick={(e) => { e.stopPropagation(); handleEditProject(project); }}
                        className="flex-1 flex items-center justify-center gap-1.5 text-xs font-semibold text-blue-600 hover:bg-blue-50 rounded-lg py-1.5 transition-colors"
                      >
                        <Edit className="w-3.5 h-3.5" /> Edit
                      </button>
                      <div className="w-px h-4 bg-gray-200" />
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDeleteProject(project.projectId); }}
                        className="flex-1 flex items-center justify-center gap-1.5 text-xs font-semibold text-red-500 hover:bg-red-50 rounded-lg py-1.5 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Delete
                      </button>
                      <div className="w-px h-4 bg-gray-200" />
                      <button
                        onClick={(e) => { e.stopPropagation(); setSelectedDetails(project); setIsDetailsOpen(true); }}
                        className="flex-1 flex items-center justify-center gap-1.5 text-xs font-semibold text-gray-500 hover:bg-gray-50 rounded-lg py-1.5 transition-colors"
                      >
                        <ArrowRight className="w-3.5 h-3.5" /> View
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="col-span-3 flex flex-col items-center justify-center py-20 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
                <Briefcase className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-gray-500 font-medium">{error || 'No projects found'}</p>
              <p className="text-gray-400 text-sm mt-1">Try adjusting your search or filters</p>
            </div>
          )}
        </div>
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

      {/* PROJECT DETAILS MODAL — Modern */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="w-[95vw] max-w-[860px] max-h-[90vh] overflow-hidden p-0 bg-white rounded-2xl shadow-2xl border-0">
          {/* Hero gradient banner */}
          {(() => {
            const gradients = ['from-violet-600 to-purple-700','from-sky-600 to-blue-700','from-emerald-600 to-teal-700','from-orange-600 to-amber-700','from-rose-600 to-pink-700','from-indigo-600 to-blue-800'];
            const grad = gradients[(selectedDetails?.projectId || 0) % gradients.length];
            const sM = { 'In Progress':{ bg:'bg-emerald-400/30',tx:'text-emerald-100' }, 'Planned':{ bg:'bg-blue-400/30',tx:'text-blue-100' }, 'Completed':{ bg:'bg-purple-400/30',tx:'text-purple-100' }, 'On Hold':{ bg:'bg-amber-400/30',tx:'text-amber-100' }, 'Cancelled':{ bg:'bg-red-400/30',tx:'text-red-100' }, 'New':{ bg:'bg-sky-400/30',tx:'text-sky-100' } }[selectedDetails?.status] || { bg:'bg-white/20',tx:'text-white' };
            return (
              <div className={`bg-gradient-to-br ${grad} px-8 pt-7 pb-10 relative overflow-hidden`}>
                <div className="absolute inset-0 opacity-10" style={{backgroundImage:'radial-gradient(circle at 70% 50%, white 0%, transparent 60%)'}} />
                <div className="flex items-start justify-between gap-4 relative z-10">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${sM.bg} ${sM.tx}`}>{selectedDetails?.status}</span>
                      {selectedDetails?.priority && (
                        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-white/20 text-white">{selectedDetails.priority} Priority</span>
                      )}
                    </div>
                    <h2 className="text-2xl font-bold text-white truncate">{selectedDetails?.projectName}</h2>
                    <p className="text-white/70 text-sm mt-1">{selectedDetails?.accountName || 'No client assigned'}</p>
                  </div>
                  <div className="w-14 h-14 shrink-0 bg-white/20 backdrop-blur rounded-2xl flex items-center justify-center">
                    <Briefcase className="w-7 h-7 text-white" />
                  </div>
                </div>
                {/* Stat pills */}
                <div className="flex flex-wrap gap-3 mt-5 relative z-10">
                  <div className="flex items-center gap-2 bg-white/15 backdrop-blur rounded-xl px-3 py-2">
                    <Calendar className="w-3.5 h-3.5 text-white/80" />
                    <span className="text-xs text-white/90 font-medium">{selectedDetails?.startDate} → {selectedDetails?.endDate}</span>
                  </div>
                  <div className="flex items-center gap-2 bg-white/15 backdrop-blur rounded-xl px-3 py-2">
                    <DollarSign className="w-3.5 h-3.5 text-white/80" />
                    <span className="text-xs text-white/90 font-medium">${selectedDetails?.budget?.toLocaleString() || 'N/A'}</span>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Scrollable body */}
          <div className="overflow-y-auto modal-scroll" style={{ maxHeight: 'calc(90vh - 200px)' }}>
            <div className="px-8 py-6 space-y-6">

              {/* Description */}
              <div className="bg-gray-50 rounded-2xl p-5">
                <h3 className="flex items-center gap-2 text-sm font-bold text-gray-700 uppercase tracking-wide mb-3">
                  <FileText className="w-4 h-4 text-indigo-500" /> Description
                </h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  {selectedDetails?.description || 'No description provided.'}
                </p>
              </div>

              {/* Skills */}
              <div className="bg-gray-50 rounded-2xl p-5">
                <h3 className="flex items-center gap-2 text-sm font-bold text-gray-700 uppercase tracking-wide mb-3">
                  <Zap className="w-4 h-4 text-indigo-500" /> Required Skills
                </h3>
                {selectedDetails?.skills && selectedDetails.skills.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {selectedDetails.skills.map((skill) => {
                      const sn = typeof skill === 'object' ? skill.name
                        : skillsList.find(s => s.skillId === skill || s.skillName === skill)?.skillName || skill;
                      return (
                        <span key={skill.id || skill} className="inline-flex items-center gap-1.5 text-sm font-medium bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full">
                          <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />{sn}
                        </span>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-gray-400 text-sm">No skills assigned to this project.</p>
                )}
              </div>

              {/* Action buttons */}
              <div className="flex gap-3 pb-2">
                <Button
                  onClick={() => { setIsDetailsOpen(false); handleEditProject(selectedDetails); }}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white"
                >
                  <Edit className="w-4 h-4 mr-2" /> Edit Project
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setIsDetailsOpen(false)}
                  className="flex-1 border-gray-200 text-gray-600 hover:bg-gray-50"
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProjectsManagement;