import React, { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { toast } from "sonner";
import {
  ArrowLeft,
  Briefcase,
  Calendar,
  CheckCircle2,
  DollarSign,
  FileText,
  Plus,
  Target,
  X,
} from "lucide-react";

import { Button } from "./ui/button.jsx";
import { Input } from "./ui/input.jsx";
import { Label } from "./ui/label.jsx";
import { Textarea } from "./ui/textarea.jsx";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select.jsx";
import { Badge } from "./ui/badge.jsx";
import { ClientService } from "../services/clientListService.js";
import { ProjectService } from "../services/ProjectmanagementService.js";
import { SkillService } from "../services/SkillsService.js";
import {
  buildProjectPayload,
  getEmptyProjectForm,
  getProjectsBaseRoute,
  mapProjectToForm,
  PROJECT_FORM_SECTIONS,
  STATIC_PROJECT_SKILL_OPTIONS,
  validateProjectForm,
} from "./ProjectFormPage.helpers.js";

function FormField({ label, required, children, className = "" }) {
  return (
    <div className={`project-form-field ${className}`}>
      <Label className="project-form-label text-sm font-medium text-gray-700 mb-2 block">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </Label>
      {children}
    </div>
  );
}

function SectionHeader({ title }) {
  return (
    <div className="project-form-section-header mb-6">
      <h2 className="project-form-section-heading text-xl font-bold text-gray-950">
        {title}
      </h2>
      <div className="project-form-section-rule mt-3 h-[3px] w-14 rounded-full bg-blue-600" />
    </div>
  );
}

function SummaryRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-start gap-3 rounded-md border border-gray-100 bg-gray-50 px-3 py-3">
      <Icon className="mt-0.5 h-4 w-4 text-blue-600" />
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{label}</p>
        <p className="mt-0.5 break-words text-sm font-semibold text-gray-900">{value}</p>
      </div>
    </div>
  );
}

export default function ProjectFormPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const baseRoute = useMemo(() => getProjectsBaseRoute(location.pathname), [location.pathname]);
  const projectData = location.state?.projectData || null;
  const isEditMode = Boolean(location.state?.isEditMode || projectData);

  const [formData, setFormData] = useState(() => getEmptyProjectForm());
  const [clients, setClients] = useState([]);
  const [skillsList, setSkillsList] = useState([]);
  const [skillInput, setSkillInput] = useState("");
  const [activeSection, setActiveSection] = useState(PROJECT_FORM_SECTIONS[0].id);
  const sectionNodes = useRef({});

  useEffect(() => {
    const loadClients = async () => {
      try {
        const response = await ClientService.fetchClientList();
        setClients(Array.isArray(response) ? response : []);
      } catch (error) {
        console.error("Fetch clients error:", error);
        toast.error("Failed to fetch clients. Please check API connection.");
      }
    };

    const loadSkills = async () => {
      try {
        const response = await SkillService.fetchSkillList();
        const fetchedSkills = response.data.result || [];
        const fetchedNames = new Set(
          fetchedSkills.map((skill) => skill.skillName.toLowerCase()),
        );
        const uniqueStatic = STATIC_PROJECT_SKILL_OPTIONS
          .filter((name) => !fetchedNames.has(name.toLowerCase()))
          .map((name, index) => ({
            skillId: -(index + 1),
            skillName: name,
          }));
        setSkillsList(
          [...uniqueStatic, ...fetchedSkills].sort((a, b) =>
            a.skillName.localeCompare(b.skillName),
          ),
        );
      } catch (error) {
        console.error("Error fetching skills:", error);
        setSkillsList(
          STATIC_PROJECT_SKILL_OPTIONS
            .map((name, index) => ({
              skillId: -(index + 1),
              skillName: name,
            }))
            .sort((a, b) => a.skillName.localeCompare(b.skillName)),
        );
        toast.error("Failed to fetch skills, using static skills");
      }
    };

    loadClients();
    loadSkills();
  }, []);

  useEffect(() => {
    if (!isEditMode) return;
    if (!projectData) {
      toast.error("Project edit data was not found.");
      navigate(baseRoute, { replace: true });
      return;
    }
    setFormData(mapProjectToForm(projectData, skillsList));
  }, [baseRoute, isEditMode, navigate, projectData, skillsList]);

  useEffect(() => {
    const nodes = Object.values(sectionNodes.current).filter(Boolean);
    if (nodes.length === 0) return undefined;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        const sectionId = visible?.target?.dataset?.sectionId;
        if (sectionId) setActiveSection(sectionId);
      },
      { rootMargin: "-210px 0px -55% 0px", threshold: [0.15, 0.35, 0.6] },
    );

    nodes.forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, []);

  const modeLabel = isEditMode ? "Edit Project" : "Add Project";
  const displayName = formData.name.trim() || "New Project";
  const selectedClient = clients.find(
    (client) => String(client.accountId) === String(formData.accountId),
  );
  const clientName = selectedClient?.accountName || formData.accountName || "No client selected";
  const timelineText = formData.startDate && formData.endDate
    ? `${formData.startDate} - ${formData.endDate}`
    : "No dates selected";
  const budgetText = formData.budget ? `$${Number(formData.budget).toLocaleString()}` : "No budget set";

  const suggestedSkills = useMemo(() => {
    const search = skillInput.trim().toLowerCase();
    return skillsList
      .filter((skill) => !search || skill.skillName.toLowerCase().includes(search))
      .slice(0, 18)
      .map((skill) => skill.skillName);
  }, [skillInput, skillsList]);

  const setField = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const setSectionNode = (id, node) => {
    if (node) sectionNodes.current[id] = node;
  };

  const scrollToSection = (id) => {
    setActiveSection(id);
    sectionNodes.current[id]?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleClose = () => {
    navigate(baseRoute);
  };

  const addSkillToForm = (skill) => {
    setFormData((prev) => {
      const lower = skill.name.toLowerCase();
      const withoutDuplicate = prev.selectedSkills.filter(
        (selected) => selected.name.toLowerCase() !== lower,
      );
      return {
        ...prev,
        selectedSkills: [...withoutDuplicate, skill],
      };
    });
  };

  const addCustomSkill = async () => {
    const skillName = skillInput.trim();
    if (!skillName) {
      toast.error("Please enter a valid skill name.");
      return;
    }

    const lower = skillName.toLowerCase();
    const existingSkill = skillsList.find(
      (skill) => skill.skillName.toLowerCase() === lower,
    );

    if (existingSkill && existingSkill.skillId > 0) {
      addSkillToForm({ id: existingSkill.skillId, name: existingSkill.skillName });
      setSkillInput("");
      toast.success("Skill added!");
      return;
    }

    try {
      const response = await SkillService.createSkill(1, skillName);
      if (response.data.success) {
        const newSkill = response.data.result;
        setSkillsList((prev) => {
          const filtered = prev.filter(
            (skill) => skill.skillName.toLowerCase() !== lower,
          );
          return [...filtered, newSkill].sort((a, b) =>
            a.skillName.localeCompare(b.skillName),
          );
        });
        addSkillToForm({ id: newSkill.skillId, name: newSkill.skillName });
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

  const removeSkill = (skillName) => {
    setFormData((prev) => ({
      ...prev,
      selectedSkills: prev.selectedSkills.filter((skill) => skill.name !== skillName),
    }));
  };

  const handleSubmitProject = async (event) => {
    event.preventDefault();
    const validation = validateProjectForm(formData);
    if (!validation.valid) {
      Swal.fire({
        icon: "warning",
        title: validation.title,
        text: validation.message,
        timer: 1500,
        showConfirmButton: false,
      });
      return;
    }

    const payload = buildProjectPayload(formData);

    try {
      const result = isEditMode && projectData?.projectId
        ? await ProjectService.updateProject(
          projectData.projectId,
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
          payload.skillIds,
        )
        : await ProjectService.createProject(
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
          payload.skillIds,
        );

      if (result && (result.data.success === true || result.status === 200)) {
        Swal.fire({
          icon: "success",
          title: isEditMode ? "Project Updated!" : "Project Created!",
          text: `The project has been successfully ${isEditMode ? "updated" : "added"}.`,
          timer: 1500,
          showConfirmButton: false,
        });
        navigate(baseRoute);
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

  return (
    <div className="project-form-page-shell flex flex-col flex-1 min-h-screen -mx-2 sm:-mx-4 lg:-mx-6 -my-4 bg-gray-50 animate-in fade-in duration-300 relative z-20">
      <div className="project-form-top-region sticky top-0 z-20 shrink-0 border-b border-gray-200 bg-white shadow-sm">
        <div className="project-form-breadcrumb-row flex items-center justify-between gap-4 border-b border-gray-100 px-6 py-3 lg:px-8">
          <div className="flex min-w-0 items-center space-x-2 text-sm font-medium text-gray-500">
            <button type="button" onClick={handleClose} className="hover:text-gray-900">
              Dashboard
            </button>
            <span>/</span>
            <button type="button" onClick={handleClose} className="hover:text-gray-900">
              Projects
            </button>
            <span>/</span>
            <span className="truncate font-bold text-gray-900">{modeLabel}</span>
          </div>
          <Button variant="ghost" size="sm" onClick={handleClose} className="text-gray-600 hover:bg-gray-100">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        </div>

        <div className="project-form-summary-card flex flex-col gap-4 px-6 py-5 md:flex-row md:items-center md:justify-between lg:px-8">
          <div className="project-form-identity flex min-w-0 items-center gap-4">
            <div className="project-form-avatar flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-700">
              {formData.name.trim() ? (
                <span className="text-xl font-bold">{formData.name.trim().charAt(0).toUpperCase()}</span>
              ) : (
                <Briefcase className="h-6 w-6" />
              )}
            </div>
            <div className="project-form-identity-copy min-w-0">
              <h1 className="project-form-project-name truncate text-xl font-semibold text-gray-900">
                {displayName}
              </h1>
              <div className="project-form-meta-line mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-500">
                <span className="flex min-w-0 items-center gap-1.5">
                  <Briefcase className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">{clientName}</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5" />
                  {timelineText}
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  {formData.status}
                </span>
              </div>
            </div>
          </div>
          <Badge className="self-start bg-indigo-50 text-indigo-700 hover:bg-indigo-50 md:self-auto">
            {formData.priority} Priority
          </Badge>
        </div>

        <div className="project-form-tabs border-t border-gray-100 bg-white px-4 sm:px-6 lg:px-8">
          <div className="project-form-tabs-list hide-scrollbar flex w-full gap-2 overflow-x-auto py-2">
            {PROJECT_FORM_SECTIONS.map((section) => (
              <button
                key={section.id}
                type="button"
                onClick={() => scrollToSection(section.id)}
                className={`project-form-tab-button whitespace-nowrap rounded-md border px-4 py-2 text-sm font-medium transition-colors ${
                  activeSection === section.id
                    ? "border-blue-200 bg-blue-50 text-blue-700"
                    : "border-transparent text-gray-500 hover:bg-gray-50 hover:text-gray-800"
                }`}
              >
                {section.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <form noValidate onSubmit={handleSubmitProject} className="project-form-main-grid grid flex-1 grid-cols-1 gap-6 p-4 sm:p-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:p-8">
        <div className="project-form-panel min-w-0 rounded-md border border-gray-200 bg-white shadow-sm">
          <section
            id="overview"
            data-section-id="overview"
            ref={(node) => setSectionNode("overview", node)}
            className="scroll-mt-48 border-b border-gray-100 px-5 py-7 sm:px-7"
          >
            <SectionHeader title="Overview" />
            <div className="grid grid-cols-1 gap-x-6 gap-y-5 md:grid-cols-2">
              <FormField label="Project Name" required>
                <Input
                  value={formData.name}
                  onChange={(event) => setField("name", event.target.value)}
                  placeholder="Enter project name"
                  className="border-gray-200 bg-white shadow-sm focus:border-blue-500"
                />
              </FormField>
              <FormField label="Client" required>
                <Select
                  value={formData.accountId ? String(formData.accountId) : ""}
                  onValueChange={(value) => {
                    const id = value ? Number(value) : null;
                    const client = clients.find((item) => item.accountId === id);
                    setFormData((prev) => ({
                      ...prev,
                      accountId: id,
                      accountName: client?.accountName || prev.accountName,
                    }));
                  }}
                >
                  <SelectTrigger className="border-gray-200 bg-white shadow-sm focus:border-blue-500">
                    <SelectValue placeholder="Select Client" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map((client) => (
                      <SelectItem key={client.accountId} value={String(client.accountId)}>
                        {client.accountName}
                      </SelectItem>
                    ))}
                    {isEditMode && formData.accountId && !clients.find((client) => client.accountId === formData.accountId) && (
                      <SelectItem value={String(formData.accountId)}>
                        {formData.accountName || "Unknown Client"}
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </FormField>
              <FormField label="Description" className="md:col-span-2">
                <Textarea
                  value={formData.description}
                  onChange={(event) => setField("description", event.target.value)}
                  placeholder="Enter description"
                  className="min-h-28 border-gray-200 bg-white shadow-sm focus:border-blue-500"
                />
              </FormField>
            </div>
          </section>

          <section
            id="timeline"
            data-section-id="timeline"
            ref={(node) => setSectionNode("timeline", node)}
            className="scroll-mt-48 border-b border-gray-100 px-5 py-7 sm:px-7"
          >
            <SectionHeader title="Timeline" />
            <div className="grid grid-cols-1 gap-x-6 gap-y-5 md:grid-cols-2">
              <FormField label="Start Date" required>
                <Input
                  type="date"
                  value={formData.startDate}
                  onChange={(event) => setField("startDate", event.target.value)}
                  className="border-gray-200 bg-white shadow-sm focus:border-blue-500"
                />
              </FormField>
              <FormField label="End Date" required>
                <Input
                  type="date"
                  value={formData.endDate}
                  onChange={(event) => setField("endDate", event.target.value)}
                  className="border-gray-200 bg-white shadow-sm focus:border-blue-500"
                />
              </FormField>
            </div>
          </section>

          <section
            id="budget-status"
            data-section-id="budget-status"
            ref={(node) => setSectionNode("budget-status", node)}
            className="scroll-mt-48 border-b border-gray-100 px-5 py-7 sm:px-7"
          >
            <SectionHeader title="Budget & Status" />
            <div className="grid grid-cols-1 gap-x-6 gap-y-5 md:grid-cols-3">
              <FormField label="Budget" required>
                <Input
                  type="number"
                  value={formData.budget}
                  onChange={(event) => setField("budget", event.target.value)}
                  placeholder="Enter budget"
                  className="border-gray-200 bg-white shadow-sm focus:border-blue-500"
                />
              </FormField>
              <FormField label="Priority">
                <Select
                  value={formData.priority}
                  onValueChange={(value) => setField("priority", value)}
                >
                  <SelectTrigger className="border-gray-200 bg-white shadow-sm focus:border-blue-500">
                    <SelectValue placeholder="Select Priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Low">Low</SelectItem>
                    <SelectItem value="Medium">Medium</SelectItem>
                    <SelectItem value="High">High</SelectItem>
                  </SelectContent>
                </Select>
              </FormField>
              <FormField label="Status">
                <Select
                  value={formData.status}
                  onValueChange={(value) => setField("status", value)}
                >
                  <SelectTrigger className="border-gray-200 bg-white shadow-sm focus:border-blue-500">
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
              </FormField>
            </div>
          </section>

          <section
            id="skills"
            data-section-id="skills"
            ref={(node) => setSectionNode("skills", node)}
            className="scroll-mt-48 px-5 py-7 sm:px-7"
          >
            <SectionHeader title="Skills" />
            <div className="space-y-5">
              <div className="flex flex-wrap gap-2">
                {suggestedSkills.map((skill) => (
                  <Button
                    key={skill}
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setSkillInput(skill)}
                    className="border-gray-200 bg-white text-xs text-gray-700 hover:bg-blue-50 hover:text-blue-700"
                  >
                    {skill}
                  </Button>
                ))}
              </div>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Input
                  value={skillInput}
                  onChange={(event) => setSkillInput(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      addCustomSkill();
                    }
                  }}
                  placeholder="Enter custom skill"
                  className="border-gray-200 bg-white shadow-sm focus:border-blue-500"
                />
                <Button type="button" onClick={addCustomSkill} className="bg-indigo-600 text-white hover:bg-indigo-700">
                  <Plus className="h-4 w-4" />
                  Add
                </Button>
              </div>
              {formData.selectedSkills.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.selectedSkills.map((skill) => (
                    <Badge key={`${skill.id}-${skill.name}`} className="flex items-center gap-1 bg-blue-100 text-blue-700 hover:bg-blue-100">
                      {skill.name}
                      <button
                        type="button"
                        onClick={() => removeSkill(skill.name)}
                        className="ml-1 rounded-full hover:text-blue-950 focus:outline-none"
                        aria-label={`Remove ${skill.name}`}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </section>

          <div className="sticky bottom-0 z-10 border-t border-gray-200 bg-white/95 px-5 py-4 backdrop-blur sm:px-7">
            <div className="flex flex-col justify-end gap-3 sm:flex-row">
              <Button type="button" variant="outline" onClick={handleClose} className="w-full sm:w-auto">
                Cancel
              </Button>
              <Button type="submit" className="w-full bg-indigo-600 text-white hover:bg-indigo-700 sm:w-auto">
                {isEditMode ? "Update Project" : "Create Project"}
              </Button>
            </div>
          </div>
        </div>

        <aside className="project-form-preview-panel min-h-[420px] rounded-md border border-gray-200 bg-white shadow-sm lg:sticky lg:top-56 lg:self-start">
          <div className="border-b border-gray-100 p-4">
            <h3 className="font-bold text-gray-900">Project Summary</h3>
            <div className="mt-3 h-[3px] w-14 rounded-full bg-blue-600" />
          </div>
          <div className="space-y-3 p-4">
            <SummaryRow icon={Briefcase} label="Project" value={displayName} />
            <SummaryRow icon={FileText} label="Client" value={clientName} />
            <SummaryRow icon={Calendar} label="Timeline" value={timelineText} />
            <SummaryRow icon={DollarSign} label="Budget" value={budgetText} />
            <SummaryRow icon={Target} label="Priority" value={formData.priority} />
            <SummaryRow icon={CheckCircle2} label="Status" value={formData.status} />
            <div className="rounded-md border border-gray-100 bg-gray-50 px-3 py-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Skills</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {formData.selectedSkills.length > 0 ? (
                  formData.selectedSkills.map((skill) => (
                    <Badge key={`summary-${skill.id}-${skill.name}`} className="bg-white text-gray-700 hover:bg-white">
                      {skill.name}
                    </Badge>
                  ))
                ) : (
                  <span className="text-sm font-semibold text-gray-900">No skills selected</span>
                )}
              </div>
            </div>
          </div>
        </aside>
      </form>
    </div>
  );
}
