import test from "node:test";
import assert from "node:assert/strict";

import {
  buildProjectPayload,
  getEmptyProjectForm,
  getProjectsBaseRoute,
  mapProjectToForm,
  validateProjectForm,
} from "./ProjectFormPage.helpers.js";

test("builds the empty project form defaults used by add mode", () => {
  assert.deepEqual(getEmptyProjectForm(), {
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
});

test("maps edit project state into form fields and selected skills", () => {
  const form = mapProjectToForm(
    {
      projectName: "RMS Modernization",
      accountName: "RIS",
      accountId: 42,
      startDate: "2026-05-01",
      endDate: "2026-08-31",
      status: "In Progress",
      description: "Upgrade project workflows",
      priority: "High",
      budget: 125000,
      companyId: 7,
      managerUserId: 11,
      skills: [
        { skillId: 3, skillName: "React" },
        "Java",
        "Unmapped Skill",
      ],
    },
    [
      { skillId: 4, skillName: "Java" },
      { skillId: 5, skillName: "Node.js" },
    ],
  );

  assert.equal(form.name, "RMS Modernization");
  assert.equal(form.accountId, 42);
  assert.equal(form.budget, "125000");
  assert.deepEqual(form.selectedSkills, [
    { id: 3, name: "React" },
    { id: 4, name: "Java" },
    { id: null, name: "Unmapped Skill" },
  ]);
});

test("validates required fields and invalid date ranges", () => {
  const emptyResult = validateProjectForm(getEmptyProjectForm());
  assert.equal(emptyResult.valid, false);
  assert.equal(emptyResult.field, "name");

  const invalidDateResult = validateProjectForm({
    ...getEmptyProjectForm(),
    name: "RMS",
    accountId: 1,
    startDate: "2026-06-15",
    endDate: "2026-06-01",
    budget: "5000",
  });

  assert.equal(invalidDateResult.valid, false);
  assert.equal(invalidDateResult.field, "endDate");
});

test("builds the project API payload and filters non-persisted skill ids", () => {
  const payload = buildProjectPayload({
    ...getEmptyProjectForm(),
    name: "  Launch Portal  ",
    accountId: 9,
    managerUserId: 2,
    startDate: "2026-05-20",
    endDate: "2026-07-20",
    budget: "90000",
    description: "  Portal delivery  ",
    selectedSkills: [
      { id: 8, name: "React" },
      { id: -1, name: "Static Skill" },
      { id: null, name: "Missing" },
    ],
  });

  assert.deepEqual(payload, {
    companyId: 1,
    accountId: 9,
    managerUserId: 2,
    projectName: "Launch Portal",
    description: "Portal delivery",
    startDate: "2026-05-20",
    endDate: "2026-07-20",
    budget: 90000,
    revenueAmount: 0,
    priority: "Medium",
    status: "Planned",
    skillIds: [8],
  });
});

test("detects HR and project manager project base routes", () => {
  assert.equal(getProjectsBaseRoute("/hr/projects/add"), "/hr/projects");
  assert.equal(getProjectsBaseRoute("/pm/projects/add"), "/pm/projects");
  assert.equal(getProjectsBaseRoute("/pm/projects"), "/pm/projects");
  assert.equal(getProjectsBaseRoute("/unknown"), "/hr/projects");
});
