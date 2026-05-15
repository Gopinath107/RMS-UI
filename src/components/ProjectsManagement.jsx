import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
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
} from "lucide-react";
import { Badge } from "./ui/badge";
import { toast } from "sonner";

import { ProjectService } from "../services/ProjectmanagementService";
import { SkillService } from "../services/SkillsService";
import ReusableDataView, { DataViewToolbar } from "./common/ReusableDataView.jsx";
import { useDataViewControls } from "./common/useDataViewControls.js";
import {
  getProjectsBaseRoute,
  STATIC_PROJECT_SKILL_OPTIONS,
} from "./ProjectFormPage.helpers.js";

const ProjectsManagement = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const baseRoute = useMemo(() => getProjectsBaseRoute(location.pathname), [location.pathname]);
  const [projects, setProjects] = useState([]);
  const [filteredProjects, setFilteredProjects] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [error, setError] = useState("");
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [selectedDetails, setSelectedDetails] = useState(null);
  const [skillsList, setSkillsList] = useState([]);

  useEffect(() => {
    const loadData = async () => {
      await fetchSkills();
      await fetchProjects();
    };
    loadData();
  }, []);

  const fetchSkills = async () => {
    try {
      const response = await SkillService.fetchSkillList();
      const fetchedSkills = response.data.result;
      const fetchedNames = new Set(fetchedSkills.map(s => s.skillName.toLowerCase()));
      const uniqueStatic = STATIC_PROJECT_SKILL_OPTIONS
        .filter(name => !fetchedNames.has(name.toLowerCase()))
        .map((name, index) => ({
          skillId: - (index + 1),
          skillName: name
        }));
      const combinedSkills = [...uniqueStatic, ...fetchedSkills].sort((a, b) => a.skillName.localeCompare(b.skillName));
      setSkillsList(combinedSkills);
    } catch (error) {
      console.error("Error fetching skills:", error);
      const staticSkills = STATIC_PROJECT_SKILL_OPTIONS.map((name, index) => ({
        skillId: - (index + 1),
        skillName: name
      })).sort((a, b) => a.skillName.localeCompare(b.skillName));
      setSkillsList(staticSkills);
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

  const openAddProject = useCallback(() => {
    navigate(`${baseRoute}/add`);
  }, [baseRoute, navigate]);

  const handleEditProject = useCallback((project) => {
    navigate(`${baseRoute}/add`, {
      state: {
        isEditMode: true,
        projectData: project,
      },
    });
  }, [baseRoute, navigate]);

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
  ], [handleEditProject, skillsList]);

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
            onClick={openAddProject}
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
