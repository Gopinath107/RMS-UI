// src/config/roleThemes.js
// Central role-to-theme mapping — consumed by AppShell
export const ROLE_THEMES = {
  'project-manager': {
    gradient: 'from-green-50/40 via-emerald-50/20 to-teal-100/30',
    mobileBg: 'border-green-200',
    mobileBtn: 'bg-green-500 hover:bg-green-600',
  },
  hr: {
    gradient: 'from-blue-50/40 via-indigo-50/20 to-cyan-100/30',
    mobileBg: 'border-blue-200',
    mobileBtn: 'bg-blue-500 hover:bg-blue-600',
  },
  pmo: {
    gradient: 'from-purple-50/40 via-violet-50/20 to-indigo-100/30',
    mobileBg: 'border-purple-200',
    mobileBtn: 'bg-purple-500 hover:bg-purple-600',
  },
  'system-admin': {
    gradient: 'from-red-50/40 via-pink-50/20 to-rose-100/30',
    mobileBg: 'border-red-200',
    mobileBtn: 'bg-red-500 hover:bg-red-600',
  },
  'portfolio-manager': {
    gradient: 'from-orange-50/40 via-amber-50/20 to-yellow-100/30',
    mobileBg: 'border-orange-200',
    mobileBtn: 'bg-orange-500 hover:bg-orange-600',
  },
  'sales-manager': {
    gradient: 'from-yellow-50/40 via-amber-50/20 to-orange-100/30',
    mobileBg: 'border-yellow-200',
    mobileBtn: 'bg-yellow-500 hover:bg-yellow-600',
  },
  'interview-panel': {
    gradient: 'from-indigo-50/40 via-purple-50/20 to-violet-100/30',
    mobileBg: 'border-indigo-200',
    mobileBtn: 'bg-indigo-500 hover:bg-indigo-600',
  },
};

export const DEFAULT_THEME = {
  gradient: 'from-sky-50/40 via-blue-50/20 to-indigo-100/30',
  mobileBg: 'border-sky-200',
  mobileBtn: 'bg-sky-500 hover:bg-sky-600',
};

export const ROLE_TITLES = {
  'project-manager': 'Project Manager',
  hr: 'HR Manager',
  pmo: 'PMO',
  'system-admin': 'System Admin',
  'portfolio-manager': 'Portfolio Manager',
  'sales-manager': 'Sales Manager',
  'interview-panel': 'Interview Panel',
};

/** Returns the theme for a given role, falling back to DEFAULT_THEME. */
export function getRoleTheme(role) {
  return ROLE_THEMES[role] || DEFAULT_THEME;
}

/** Returns the display title for a given role. */
export function getRoleTitle(role) {
  return ROLE_TITLES[role] || 'Dashboard';
}
