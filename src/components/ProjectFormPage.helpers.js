export const STATIC_PROJECT_SKILL_OPTIONS = [
  "React",
  "JavaScript",
  "Node.js",
  "TypeScript",
  "Python",
  "Java",
  "Google Cloud Platform",
  "AWS",
  "Azure",
  "Docker",
  "Kubernetes",
  "DevOps",
  "Veeva CRM",
  "Veeva Vault",
  "Salesforce Admin",
  "Salesforce Developer",
  "Salesforce - sales cloud health cloud service cloud data cloud",
  "SFMC",
  "Mulesoft",
  "Commerce cloud",
];

export const PROJECT_FORM_SECTIONS = [
  { id: "overview", label: "Overview" },
  { id: "timeline", label: "Timeline" },
  { id: "budget-status", label: "Budget & Status" },
  { id: "skills", label: "Skills" },
];

export function getEmptyProjectForm() {
  return {
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
  };
}

export function getProjectsBaseRoute(pathname = "") {
  const normalized = String(pathname || "").toLowerCase();
  if (normalized.startsWith("/pm/projects")) return "/pm/projects";
  return "/hr/projects";
}

function normalizeSkill(skill, skillsList = []) {
  if (!skill) return null;

  if (typeof skill === "object") {
    const id = skill.skillId ?? skill.id ?? null;
    const name = skill.skillName ?? skill.name ?? "";
    return name ? { id, name } : null;
  }

  const found = skillsList.find(
    (option) => option.skillId === skill || option.skillName === skill,
  );

  if (found) {
    return { id: found.skillId, name: found.skillName };
  }

  return { id: null, name: String(skill) };
}

export function mapProjectToForm(project = {}, skillsList = []) {
  const empty = getEmptyProjectForm();
  const selectedSkills = Array.isArray(project.skills)
    ? project.skills.map((skill) => normalizeSkill(skill, skillsList)).filter(Boolean)
    : [];

  return {
    ...empty,
    name: project.projectName || "",
    accountName: project.accountName || "",
    accountId: project.accountId || null,
    startDate: project.startDate || "",
    endDate: project.endDate || "",
    status: project.status || empty.status,
    description: project.description || "",
    priority: project.priority || empty.priority,
    budget: project.budget !== undefined && project.budget !== null
      ? String(project.budget)
      : "",
    companyId: project.companyId || empty.companyId,
    managerUserId: project.managerUserId || null,
    selectedSkills,
  };
}

export function validateProjectForm(form) {
  const requiredFields = [
    ["name", "Project Name"],
    ["accountId", "Client"],
    ["startDate", "Start Date"],
    ["endDate", "End Date"],
    ["budget", "Budget"],
  ];

  for (const [key, label] of requiredFields) {
    const value = form[key];
    if (value === null || value === undefined || String(value).trim() === "") {
      return {
        valid: false,
        title: "Missing Input Field!",
        message: `${label} is required!`,
        field: key,
      };
    }
  }

  if (new Date(form.endDate) < new Date(form.startDate)) {
    return {
      valid: false,
      title: "Invalid Date Range!",
      message: "End date cannot be earlier than start date!",
      field: "endDate",
    };
  }

  return { valid: true };
}

export function buildProjectPayload(form) {
  return {
    companyId: form.companyId,
    accountId: form.accountId,
    managerUserId: form.managerUserId,
    projectName: String(form.name || "").trim(),
    description: String(form.description || "").trim(),
    startDate: form.startDate,
    endDate: form.endDate,
    budget: parseFloat(form.budget || 0),
    revenueAmount: 0,
    priority: form.priority,
    status: form.status,
    skillIds: (form.selectedSkills || [])
      .map((skill) => skill.id)
      .filter((id) => Number.isFinite(Number(id)) && Number(id) > 0)
      .map((id) => Number(id)),
  };
}
