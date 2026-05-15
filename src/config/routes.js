/**
 * Central route configuration for RMS.
 * Single source of truth for paths, roles, and dashboard redirects.
 */

// Role â†’ their root dashboard path
export const ROLE_DASHBOARDS = {
  'hr': '/hr',
  'project-manager': '/pm',
  'pmo': '/pmo',
  'system-admin': '/admin',
  'portfolio-manager': '/portfolio',
  'sales-manager': '/sales',
  'interview-panel': '/panel',
};

/**
 * All application routes.
 * allowedRoles: which roles may access this route (empty = public)
 */
export const APP_ROUTES = [
  // â”€â”€ Public â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  { path: '/login',           public: true },
  { path: '/forgot-password', public: true },

  // â”€â”€ HR â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  { path: '/hr',                   allowedRoles: ['hr'] },
  { path: '/hr/resources',         allowedRoles: ['hr'] },
  { path: '/hr/interviews',        allowedRoles: ['hr'] },
  { path: '/hr/interview-hub',     allowedRoles: ['hr'] },
  { path: '/hr/clients',           allowedRoles: ['hr'] },
  { path: '/hr/projects',          allowedRoles: ['hr'] },
  { path: '/hr/projects/add',      allowedRoles: ['hr'] },
  { path: '/hr/notifications',     allowedRoles: ['hr'] },

  // â”€â”€ Project Manager â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  { path: '/pm',                     allowedRoles: ['project-manager'] },
  { path: '/pm/projects',            allowedRoles: ['project-manager'] },
  { path: '/pm/projects/add',        allowedRoles: ['project-manager'] },
  { path: '/pm/resource-requests',   allowedRoles: ['project-manager'] },
  { path: '/pm/interview-hub',       allowedRoles: ['project-manager'] },
  { path: '/pm/clients',             allowedRoles: ['project-manager'] },
  { path: '/pm/resource-allocation', allowedRoles: ['project-manager'] },

  // â”€â”€ PMO â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  { path: '/pmo',                    allowedRoles: ['pmo'] },
  { path: '/pmo/resource-requests',  allowedRoles: ['pmo'] },
  { path: '/pmo/interview-hub',      allowedRoles: ['pmo'] },

  // â”€â”€ System Admin â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  { path: '/admin',                  allowedRoles: ['system-admin'] },
  { path: '/admin/system-settings',  allowedRoles: ['system-admin'] },

  // â”€â”€ Portfolio Manager â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  { path: '/portfolio',                    allowedRoles: ['portfolio-manager'] },
  { path: '/portfolio/projects',           allowedRoles: ['portfolio-manager'] },
  { path: '/portfolio/clients',            allowedRoles: ['portfolio-manager'] },
  { path: '/portfolio/reports',            allowedRoles: ['portfolio-manager'] },
  { path: '/portfolio/strategic-planning', allowedRoles: ['portfolio-manager'] },
  { path: '/portfolio/financial-overview', allowedRoles: ['portfolio-manager'] },
  { path: '/portfolio/resource-strategy',  allowedRoles: ['portfolio-manager'] },

  // â”€â”€ Sales Manager â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  { path: '/sales',          allowedRoles: ['sales-manager'] },
  { path: '/sales/pipeline', allowedRoles: ['sales-manager'] },

  // â”€â”€ Interview Panel â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  { path: '/panel',              allowedRoles: ['interview-panel'] },
  { path: '/panel/interview-hub', allowedRoles: ['interview-panel'] },
];

/** Helper: given a role, return its dashboard path */
export function getDashboardPath(role) {
  return ROLE_DASHBOARDS[role] || '/login';
}
