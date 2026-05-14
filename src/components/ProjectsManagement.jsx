import React, { useEffect, useMemo, useState } from "react";
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
} from "lucide-react";
import { Label } from "./ui/label";
import { Badge } from "./ui/badge";
import { toast } from "sonner";

import { ProjectService } from "../services/ProjectmanagementService";
import { ClientService } from "../services/clientListService";
import { SkillService } from "../services/SkillsService";
import ReusableDataView, { DataViewToolbar } from "./common/ReusableDataView.jsx";
import { useDataViewControls } from "./common/useDataViewControls.js";

const staticSkillOptions = [
  "React","JavaScript","Node.js","TypeScript","Python","Java","Google Cloud Platform","AWS","Azure","Docker","Kubernetes","DevOps",
  "Veeva CRM",
  "Veeva Vault",
  "Salesforce Admin",
  "Salesforce Developer",
  "Salesforce - sales cloud health cloud service cloud data cloud",
  "SFMC",
  "Mulesoft",
  "Commerce cloud",
];

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
        .map((name, index) => ({
          skillId: - (index + 1),
          skillName: name
        }));
      const combinedSkills = [...uniqueStatic, ...fetchedSkills].sort((a, b) => a.skillName.localeCompare(b.skillName));
      setSkillsList(combinedSkills);
      setFilteredSkills(combinedSkills.slice(0, 30).map(s => s.skillName));
    } catch (error) {
      console.error("Error fetching skills:", error);
      const staticSkills = staticSkillOptions.map((name, index) => ({
        skillId: - (index + 1),
        skillName: name
      })).sort((a, b) => a.skillName.localeCompare(b.skillName));
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
          skills: project.skills || []
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

  const addCustomSkill = async () => {
    const skillName = skillInput.trim();
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
          selectedSkills: [...prev.selectedSkills, { id: existingSkill.skillId, name: existingSkill.skillName }]
        }));
      }
      setSkillInput("");
      toast.success("Skill added!");
      return;
    }

    try {
      const response = await SkillService.createSkill(1, skillName);
      console.log("Create Skill Response:", response.data);
      if (response.data.success) {
        const newSkill = response.data.result;
        setSkillsList(prev => {
          const filtered = prev.filter(s => s.skillName.toLowerCase() !== lower);
          return [...filtered, newSkill].sort((a, b) => a.skillName.localeCompare(b.skillName));
        });
        if (!newProject.selectedSkills.some(s => s.id === newSkill.skillId)) {
          setNewProject(prev => ({
            ...prev,
            selectedSkills: [...prev.selectedSkills, { id: newSkill.skillId, name: newSkill.skillName }]
          }));
        }
        setSkillInput("");
        toast.success("Custom skill added successfully!");
      } else {
        toast.error(`Failed to add skill: ${response.data.message || "Unknown error"}`);
      }
    } catch (error) {
      console.error("Error adding custom skill:", error.response?.data || error.message);
      toast.error("Failed to add custom skill. Check console for details.");
    }
  };

    // const handleSkillRemove = (skillId) => {
    //   setNewProject(prev => ({
    //     ...prev,
    //     setSelectedSkills: selectedSkills.filter(s => s.name !== skillName)
    //     // setSelectedSkills(selectedSkills.filter(s => s.name !== skillName));
    //   }));
    // };

const removeSkill = (skillName) => {
  console.log('Removing skill:', skillName);
  setNewProject(prev => ({
    ...prev,
    selectedSkills: prev.selectedSkills.filter(s => s.name !== skillName)
  }));
};


  const selectSkillForInput = (skill) => {
    setSkillInput(skill);
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
      selectedSkills: project.skills.map(skill =>
        typeof skill === 'object' ? { id: skill.skillId, name: skill.skillName } :
          skillsList.find(s => s.skillId === skill || s.skillName === skill) || { id: null, name: skill }
      ).filter(s => s.name && s.id),
    });
    setIsModalOpen(true);
  };

  const handleSubmitProject = async (e) => {
    e.preventDefault();
    console.log("Form submitted");
    try {
      const requiredFields = {
        name: "Project Name",
        accountId: "Client (Account)",
        startDate: "Start Date",
        endDate: "End Date",
      };

      for (const [key, label] of Object.entries(requiredFields)) {
        if (!newProject[key]) {
          Swal.fire({
            icon: "warning",
            title: "Missing Input Field!",
            text: `${label} is required!`,
            timer: 1500,
            showConfirmButton: false,
          });
          return;
        }
      }

      if (new Date(newProject.endDate) < new Date(newProject.startDate)) {
        Swal.fire({
          icon: "warning",
          title: "Invalid Date Range!",
          text: "End date cannot be earlier than start date!",
          timer: 1500,
          showConfirmButton: false,
        });
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

      console.log("Payload:", payload);

      let result;
      if (selectedProject && selectedProject.projectId) {
        result = await ProjectService.updateProject(
          selectedProject.projectId,
          payload.companyId,
          payload.accountId,
          payload.managerUserId,
          payload.projectName,
          payload.description,
          payload.startDate,
          payload.endDate,
          payload.budget,
          payload.revenueAmount,
          payload.priority,
          payload.status,
          payload.skillIds
        );
      } else {
        result = await ProjectService.createProject(
          payload.companyId,
          payload.accountId,
          payload.managerUserId,
          payload.projectName,
          payload.description,
          payload.startDate,
          payload.endDate,
          payload.budget,
          payload.revenueAmount,
          payload.priority,
          payload.status,
          payload.skillIds
        );
      }

      if (result && (result.data.success === true || result.status === 200)) {
        await fetchProjects();
        setIsModalOpen(false);
        setSelectedProject(null);
        setNewProject({
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
        setSkillInput("");
        Swal.fire({
          icon: "success",
          title: selectedProject ? "Project Updated!" : "Project Created!",
          text: `The project has been successfully ${selectedProject ? "updated" : "added"}.`,
          timer: 1500,
          showConfirmButton: false,
        });
      } else {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: result?.data?.message || "Failed to submit project. Check console for details.",
        });
      }
    } catch (error) {
      console.error("Project submission error:", error.response?.data || error.message);
      Swal.fire({
        icon: "error",
        title: "Network/Server Error",
        text: "Failed to submit project. Check console & API.",
      });
    }
  };

  const handleDeleteProject = async (projectId) => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: "You won't be able to revert this!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, delete it!",
    });

    if (result.isConfirmed) {
      try {
        const res = await ProjectService.deleteProject(projectId);
        if (res.status === 200) {
          Swal.fire({
            icon: "success",
            title: "Deleted!",
            text: "Project has been deleted.",
            timer: 1500,
            showConfirmButton: false,
          });
          await fetchProjects();
        } else {
          Swal.fire({
            icon: "error",
            title: "Error",
            text: "Failed to delete project.",
          });
        }
      } catch (error) {
        console.error("Delete error:", error);
        Swal.fire({
          icon: "error",
          title: "Error",
          text: "Failed to delete project.",
        });
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
  const projectColumns = useMemo(() => [
    {
      key: "projectName",
      label: "Project",
      render: (project) => (
        <div className="flex items-center gap-2 font-semibold">
          <Briefcase className="h-5 w-5 text-blue-600" />
          <span style={{ overflowWrap: 'anywhere' }}>{project.projectName}</span>
        </div>
      ),
    },
    { key: "accountName", label: "Client", render: (project) => project.accountName || "N/A" },
    { key: "dates", label: "Timeline", render: (project) => `${project.startDate || "N/A"} - ${project.endDate || "N/A"}` },
    { key: "budget", label: "Budget", render: (project) => `$${project.budget?.toLocaleString() || "N/A"}` },
    { key: "status", label: "Status", type: "status", render: (project) => project.status || "N/A" },
    {
      key: "skills",
      label: "Skills",
      render: (project) => project.skills && project.skills.length > 0
        ? project.skills.map(s => typeof s === 'object' ? s.name : skillsList.find(sk => sk.skillId === s || sk.skillName === s)?.skillName || s).join(", ")
        : "N/A",
    },
    {
      key: "actions",
      label: "Actions",
      type: "actions",
      hideable: false,
      render: (project) => (
        <div className="flex justify-end space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              handleEditProject(project);
            }}
            className="text-blue-600 hover:text-blue-700"
          >
            <Edit className="h-4 w-4 mr-1" />
            Edit
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              handleDeleteProject(project.projectId);
            }}
            className="text-red-600 hover:text-red-700"
          >
            <Trash2 className="h-4 w-4 mr-1" />
            Delete
          </Button>
        </div>
      ),
    },
  ], [skillsList]);

  const dvControls = useDataViewControls("projects", projectColumns, "card");

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        {/* Left: search + status filter */}
        <div className="flex flex-wrap items-center gap-2">
          <Input
            placeholder="Search by name, client, or description..."
            value={searchTerm}
            onChange={handleSearch}
            className="w-52 h-8 text-sm"
          />
          <Select value={statusFilter} onValueChange={handleStatusChange}>
            <SelectTrigger className="w-36 h-8 text-sm">
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
        {/* Right: view controls + add button */}
        <div className="flex items-center gap-2 flex-wrap">
          <DataViewToolbar controls={dvControls} />
          <Button
            onClick={() => {
              setSelectedProject(null);
              setNewProject({
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
              setSkillInput("");
              setIsModalOpen(true);
            }}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 text-sm"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Project
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6 ">
        <Card className="shadow-md bg-blue-50">
          <CardHeader className="bg-gray-50 rounded-lg">
            <CardTitle className="text-md font-semibold">Total Projects</CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <p className="text-2xl font-bold">{totalProjects}</p>
          </CardContent>
        </Card>
        <Card className="shadow-md bg-green-50">
          <CardHeader className="bg-gray-50 rounded-lg">
            <CardTitle className="text-md font-semibold">In Progress</CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <p className="text-2xl font-bold">{inProgress}</p>
          </CardContent>
        </Card>
        <Card className="shadow-md bg-yellow-50">
          <CardHeader className="bg-gray-50 rounded-lg">
            <CardTitle className="text-md font-semibold">Completed</CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <p className="text-2xl font-bold">{completed}</p>
          </CardContent>
        </Card>
        <Card className="shadow-md bg-red-50">
          <CardHeader className="bg-gray-50 rounded-lg">
            <CardTitle className="text-md font-semibold">Ending Soon</CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <p className="text-2xl font-bold">{endingSoon}</p>
          </CardContent>
        </Card>
      </div>

      <ReusableDataView
        tableKey="projects"
        controls={dvControls}
        data={filteredProjects}
        columns={projectColumns}
        rowKey="projectId"
        emptyMessage={error || "No projects found"}
        defaultViewMode="card"
        primaryField="projectName"
        secondaryField="accountName"
        badgeField="status"
        cardFields={["dates", "budget", "skills"]}
        onRowClick={(project) => {
          setSelectedDetails(project);
          setIsDetailsOpen(true);
        }}
      />

      {false && <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
                <CardTitle className="text-lg font-semibold flex items-center" style={{ overflowWrap: 'anywhere' }}>
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
                  <p className="flex items-center text-sm text-gray-600">
                    <FileText className="h-4 w-4 mr-2" />
                    Skills: {project.skills.map(s =>
                      typeof s === 'object' ? s.name : skillsList.find(sk => sk.skillId === s || sk.skillName === s)?.skillName || s
                    ).join(", ")}
                  </p>
                )}
                <div className="flex justify-end space-x-2 mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEditProject(project);
                    }}
                    className="text-blue-600 hover:text-blue-700"
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteProject(project.projectId);
                    }}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <p className="text-gray-500 col-span-3">{error || "No projects found"}</p>
        )}
      </div>}

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-lg sm:max-w-4xl max-h-[90vh] overflow-y-auto p-8 bg-white rounded-2xl shadow-2xl border border-gray-200">
          <DialogHeader className="mb-6">
            <DialogTitle className="text-2xl font-bold text-gray-800">
              {selectedProject ? "Edit Project" : "Create New Project"}
            </DialogTitle>
            <DialogDescription className="text-gray-600 mt-2">
              {selectedProject ? "Update the project details below." : "Fill in the details to create a new project."}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmitProject} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-medium text-gray-700">Project Name *</Label>
                <Input
                  id="name"
                  name="name"
                  placeholder="Enter project name"
                  value={newProject.name}
                  onChange={handleInputChange}
                  className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="accountId" className="text-sm font-medium text-gray-700">Client *</Label>
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
                  <SelectTrigger className="border-gray-300 focus:border-blue-500 focus:ring-blue-500">
                    <SelectValue placeholder="Select Client" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map((client) => (
                      <SelectItem key={client.accountId} value={client.accountId.toString()}>
                        {client.accountName}
                      </SelectItem>
                    ))}
                    {selectedProject && newProject.accountId && !clients.find((c) => c.accountId === newProject.accountId) && (
                      <SelectItem value={newProject.accountId.toString()}>
                        {newProject.accountName || "Unknown Client"}
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="startDate" className="text-sm font-medium text-gray-700">Start Date *</Label>
                <Input
                  id="startDate"
                  name="startDate"
                  type="date"
                  value={newProject.startDate}
                  onChange={handleInputChange}
                  className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate" className="text-sm font-medium text-gray-700">End Date *</Label>
                <Input
                  id="endDate"
                  name="endDate"
                  type="date"
                  value={newProject.endDate}
                  onChange={handleInputChange}
                  className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="budget" className="text-sm font-medium text-gray-700">Budget *</Label>
                <Input
                  id="budget"
                  name="budget"
                  type="number"
                  placeholder="Enter budget"
                  value={newProject.budget}
                  onChange={handleInputChange}
                  className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="priority" className="text-sm font-medium text-gray-700">Priority</Label>
                <Select
                  name="priority"
                  value={newProject.priority}
                  onValueChange={(value) =>
                    setNewProject((prev) => ({ ...prev, priority: value }))
                  }
                >
                  <SelectTrigger className="border-gray-300 focus:border-blue-500 focus:ring-blue-500">
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

            <div className="space-y-2">
              <Label htmlFor="description" className="text-sm font-medium text-gray-700">Description</Label>
              <Input
                id="description"
                name="description"
                placeholder="Enter description"
                value={newProject.description}
                onChange={handleInputChange}
                className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">Skills *</Label>
              <div className="flex flex-wrap gap-2 mb-2">
                {filteredSkills.map(skill => (
                  <Button
                    type="button" // Add this to prevent form submission
                    key={skill}
                    variant="outline"
                    size="sm"
                    onClick={() => selectSkillForInput(skill)}
                    className="text-xs"
                  >
                    {skill}
                  </Button>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  value={skillInput}
                  onChange={(e) => setSkillInput(e.target.value)}
                  placeholder="Enter custom skill"
                  className="flex-1 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                />
                <Button
                  type="button" // Add this to prevent form submission
                  onClick={addCustomSkill}
                  className="bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-600 hover:to-amber-600 text-sm"
                >
                  <Plus className="w-4 h-4 mr-1" /> Add
                </Button>
              </div>
{newProject.selectedSkills.length > 0 && (
  <div className="flex flex-wrap gap-2">
    {newProject.selectedSkills.map((skill) => (
<Badge
  key={skill.id}
  variant="default"
  className="flex items-center gap-1 bg-blue-100 text-blue-700"
>
  {skill.name}
  <button
    type="button"
    onClick={(e) => {
      e.preventDefault();
      e.stopPropagation();
      removeSkill(skill.name);
    }}
    className="ml-1 focus:outline-none"
  >
    <X className="h-3 w-3" />
  </button>
</Badge>
    ))}
  </div>
)}
            </div>

            <div className="space-y-2">
              <Label htmlFor="status" className="text-sm font-medium text-gray-700">Status</Label>
              <Select
                name="status"
                value={newProject.status}
                onValueChange={(value) =>
                  setNewProject((prev) => ({ ...prev, status: value }))
                }
              >
                <SelectTrigger className="border-gray-300 focus:border-blue-500 focus:ring-blue-500">
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

            <div className="flex justify-end gap-4 pt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsModalOpen(false);
                  setSelectedProject(null);
                  setNewProject({
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
                  setSkillInput("");
                }}
                className="border-gray-300 text-gray-700 hover:bg-gray-100"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {selectedProject ? "Update Project" : "Create Project"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto p-8 bg-white rounded-2xl shadow-2xl border border-gray-200">
          <DialogHeader className="mb-6">
            <DialogTitle className="text-2xl font-bold text-gray-800">
              Project Details: {selectedDetails?.projectName}
            </DialogTitle>
            <DialogDescription className="text-gray-600 mt-2">
              View all details of the selected project.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Briefcase className="w-4 h-4" />
                  Project Overview
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm font-medium text-gray-600">Client</p>
                  <p className="text-gray-800">{selectedDetails?.accountName || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Status</p>
                  <p className="text-gray-800">{selectedDetails?.status || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Priority</p>
                  <p className="text-gray-800">{selectedDetails?.priority || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Budget</p>
                  <p className="text-gray-800">${selectedDetails?.budget?.toLocaleString() || 'N/A'}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Timeline
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm font-medium text-gray-600">Start Date</p>
                  <p className="text-gray-800">{selectedDetails?.startDate || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">End Date</p>
                  <p className="text-gray-800">{selectedDetails?.endDate || 'N/A'}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Description
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-800">{selectedDetails?.description || 'No description provided'}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Skills</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-2">Required Skills</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedDetails?.skills && selectedDetails.skills.length > 0 ? (
                      selectedDetails.skills.map((skill) => {
                        const skillName = typeof skill === 'object' ? skill.name :
                          skillsList.find(s => s.skillId === skill || s.skillName === skill)?.skillName || skill;
                        return (
                          <Badge key={skill.id || skill} className="bg-blue-100 text-blue-700">
                            {skillName}
                          </Badge>
                        );
                      })
                    ) : (
                      <p className="text-gray-500">No skills assigned</p>
                    )}
                  </div>
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
