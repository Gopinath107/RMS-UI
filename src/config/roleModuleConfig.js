// src/config/roleModuleConfig.js
// Maps each role → the modules/nav items they can see.
// Used by sidebars for config-driven navigation (future refactor target).
export const ROLE_MODULE_CONFIG = {
  hr: [
    { key: 'dashboard',     label: 'Dashboard',        path: '/hr',                 icon: 'LayoutDashboard' },
    { key: 'resources',     label: 'Resources',        path: '/hr/resources',       icon: 'Users' },
    { key: 'interviews',    label: 'Interviews',       path: '/hr/interviews',      icon: 'Calendar' },
    { key: 'interview-hub', label: 'Interview Hub',    path: '/hr/interview-hub',   icon: 'MessageSquare' },
    { key: 'clients',       label: 'Clients',          path: '/hr/clients',         icon: 'Building2' },
    { key: 'projects',      label: 'Projects',         path: '/hr/projects',        icon: 'FolderKanban' },
    { key: 'notifications', label: 'Notifications',    path: '/hr/notifications',   icon: 'Bell' },
  ],
  'project-manager': [
    { key: 'dashboard',           label: 'Dashboard',           path: '/pm',                      icon: 'LayoutDashboard' },
    { key: 'projects',            label: 'Projects',            path: '/pm/projects',             icon: 'FolderKanban' },
    { key: 'resource-requests',   label: 'Resource Requests',   path: '/pm/resource-requests',    icon: 'ClipboardList' },
    { key: 'resource-allocation', label: 'Resource Allocation', path: '/pm/resource-allocation',  icon: 'GitMerge' },
    { key: 'interview-hub',       label: 'Interview Hub',       path: '/pm/interview-hub',        icon: 'MessageSquare' },
    { key: 'clients',             label: 'Clients',             path: '/pm/clients',              icon: 'Building2' },
  ],
  pmo: [
    { key: 'dashboard',         label: 'Dashboard',         path: '/pmo',                   icon: 'LayoutDashboard' },
    { key: 'resource-requests', label: 'Resource Requests', path: '/pmo/resource-requests', icon: 'ClipboardList' },
    { key: 'interview-hub',     label: 'Interview Hub',     path: '/pmo/interview-hub',     icon: 'MessageSquare' },
  ],
  'system-admin': [
    { key: 'user-management',  label: 'User Management',  path: '/admin',                icon: 'Users' },
    { key: 'resources',        label: 'Resources',        path: '/admin/resources',      icon: 'UserCheck' },
    { key: 'interview-hub',    label: 'Interview Hub',    path: '/admin/interview-hub',  icon: 'MessageSquare' },
    { key: 'user-activity',    label: 'User Activity',    path: '/admin/user-activity',  icon: 'Activity' },
    { key: 'system-settings',  label: 'System Settings',  path: '/admin/system-settings',icon: 'Settings' },
  ],
  'portfolio-manager': [
    { key: 'dashboard',           label: 'Dashboard',           path: '/portfolio',                    icon: 'LayoutDashboard' },
    { key: 'projects',            label: 'Projects',            path: '/portfolio/projects',           icon: 'FolderKanban' },
    { key: 'clients',             label: 'Clients',             path: '/portfolio/clients',            icon: 'Building2' },
    { key: 'reports',             label: 'Reports',             path: '/portfolio/reports',            icon: 'BarChart3' },
    { key: 'interview-hub',       label: 'Interview Hub',       path: '/portfolio/interview-hub',      icon: 'MessageSquare' },
    { key: 'strategic-planning',  label: 'Strategic Planning',  path: '/portfolio/strategic-planning', icon: 'Target' },
    { key: 'financial-overview',  label: 'Financial Overview',  path: '/portfolio/financial-overview', icon: 'DollarSign' },
    { key: 'resource-strategy',   label: 'Resource Strategy',   path: '/portfolio/resource-strategy',  icon: 'GitBranch' },
  ],
  'sales-manager': [
    { key: 'opportunities',  label: 'Opportunities',  path: '/sales',              icon: 'Briefcase' },
    { key: 'clients',        label: 'Clients',        path: '/sales/clients',      icon: 'Building2' },
    { key: 'interview-hub',  label: 'Interview Hub',  path: '/sales/interview-hub',icon: 'MessageSquare' },
    { key: 'pipeline',       label: 'Pipeline',       path: '/sales/pipeline',     icon: 'TrendingUp' },
  ],
  'interview-panel': [
    { key: 'dashboard',      label: 'Dashboard',     path: '/panel',               icon: 'LayoutDashboard' },
    { key: 'interview-hub',  label: 'Interview Hub', path: '/panel/interview-hub', icon: 'MessageSquare' },
  ],
};

/** Returns the module config array for a given role. */
export function getRoleModules(role) {
  return ROLE_MODULE_CONFIG[role] || [];
}
