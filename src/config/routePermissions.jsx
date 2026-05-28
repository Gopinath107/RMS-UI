// src/config/routePermissions.js
// Single source of truth for all protected routes.
// Each entry: { path, component, roles, wrapperClass? }
import React from 'react';

// Pages
import HRDashboard from '../components/HRDashboard.jsx';
import ResourceManagement from '../components/ResourceManagement.jsx';
import AddResourcePage from '../components/AddResourcePage.jsx';
import InterviewsManagement from '../components/InterviewsManagement.jsx';
import InterviewHub from '../components/InterviewHub.jsx';
import ClientList from '../components/ClientList.jsx';
import ProjectsManagement from '../components/ProjectsManagement.jsx';
import Notifications from '../components/Notifications.jsx';
import ProjectManagerDashboard from '../components/ProjectManagerDashboard.jsx';
import RequestResource from '../components/RequestResource.jsx';
import ProjectManagerResourceAllocation from '../components/ProjectManagerResourceAllocation.jsx';
import PMODashboard from '../components/PMODashboard.jsx';
import UserManagement from '../components/UserManagement.jsx';
import UserActivityTracking from '../components/UserActivityTracking.jsx';
import SystemAdminDashboard from '../components/SystemAdminDashboard.jsx';
import PortfolioManagerDashboard from '../components/PortfolioManagerDashboard.jsx';
import ProjectPortfolio from '../components/ProjectPortfolio.jsx';
import PortfolioReportsPage from '../components/PortfolioReportsPage.jsx';
import SalesManagerDashboard from '../components/SalesManagerDashboard.jsx';
import OpportunityRequests from '../components/OpportunityRequests.jsx';
import InterviewPanelDashboard from '../components/InterviewPanelDashboard.jsx';

const Placeholder = ({ title, color = 'text-gray-600' }) => (
  <div className="p-6">
    <h1 className={`text-2xl font-bold ${color}`}>{title}</h1>
    <p className="text-gray-500 mt-2">This section is under construction.</p>
  </div>
);

// Activity wrapper
const ActivityWrapper = ({ children }) => (
  <div className="min-h-screen bg-gray-50 -mx-2 sm:-mx-4 lg:-mx-6 -my-4 px-2 sm:px-4 lg:px-6 py-4">
    {children}
  </div>
);

/**
 * All protected application routes.
 * AppRoutes.jsx reads this array to generate <ProtectedRoute> wrappers.
 *
 * Fields:
 *  path        — exact React Router path
 *  component   — page component (JSX element rendered by AppRoutes)
 *  roles       — array of role keys that may access this route
 *  wrapper     — optional HOC/wrapper to apply around the component
 */
export const PROTECTED_ROUTES = [
  // ── HR ──────────────────────────────────────────────────────────
  { path: '/hr',                  component: HRDashboard,                     roles: ['hr'] },
  { path: '/hr/resources',        component: ResourceManagement,              roles: ['hr'] },
  { path: '/hr/resources/add',    component: AddResourcePage,                 roles: ['hr'] },
  { path: '/hr/interviews',       component: InterviewsManagement,            roles: ['hr'] },
  { path: '/hr/interview-hub',    component: InterviewHub,                    roles: ['hr'] },
  { path: '/hr/clients',          component: ClientList,                      roles: ['hr'] },
  { path: '/hr/projects',         component: ProjectsManagement,              roles: ['hr'] },
  { path: '/hr/notifications',    component: Notifications,                   roles: ['hr'] },

  // ── Project Manager ─────────────────────────────────────────────
  { path: '/pm',                      component: ProjectManagerDashboard,             roles: ['project-manager'] },
  { path: '/pm/projects',             component: ProjectsManagement,                  roles: ['project-manager'] },
  { path: '/pm/resource-requests',    component: RequestResource,                     roles: ['project-manager'] },
  { path: '/pm/interview-hub',        component: InterviewHub,                        roles: ['project-manager'] },
  { path: '/pm/clients',              component: ClientList,                          roles: ['project-manager'] },
  { path: '/pm/resource-allocation',  component: ProjectManagerResourceAllocation,    roles: ['project-manager'] },

  // ── PMO ─────────────────────────────────────────────────────────
  { path: '/pmo',                   component: PMODashboard,    roles: ['pmo'] },
  { path: '/pmo/resource-requests', component: RequestResource, roles: ['pmo'] },
  { path: '/pmo/interview-hub',     component: InterviewHub,    roles: ['pmo'] },

  // ── System Admin ────────────────────────────────────────────────
  { path: '/admin',                  component: UserManagement,    roles: ['system-admin'] },
  { path: '/admin/resources',        component: ResourceManagement, roles: ['system-admin'] },
  { path: '/admin/resources/add',    component: AddResourcePage,   roles: ['system-admin'] },
  { path: '/admin/interview-hub',    component: InterviewHub,      roles: ['system-admin'] },
  {
    path: '/admin/user-activity',
    component: UserActivityTracking,
    roles: ['system-admin'],
    wrapper: ActivityWrapper,
  },
  {
    path: '/admin/system-settings',
    component: () => <Placeholder title="System Settings" color="text-red-600" />,
    roles: ['system-admin'],
  },

  // ── Portfolio Manager ────────────────────────────────────────────
  { path: '/portfolio',                    component: PortfolioManagerDashboard, roles: ['portfolio-manager'] },
  { path: '/portfolio/projects',           component: ProjectPortfolio,          roles: ['portfolio-manager'] },
  { path: '/portfolio/clients',            component: ClientList,                roles: ['portfolio-manager'] },
  { path: '/portfolio/interview-hub',      component: InterviewHub,              roles: ['portfolio-manager'] },
  { path: '/portfolio/reports',            component: PortfolioReportsPage,      roles: ['portfolio-manager'] },
  { path: '/portfolio/strategic-planning', component: () => <Placeholder title="Strategic Planning" color="text-orange-600" />, roles: ['portfolio-manager'] },
  { path: '/portfolio/financial-overview', component: () => <Placeholder title="Financial Overview" color="text-orange-600" />, roles: ['portfolio-manager'] },
  { path: '/portfolio/resource-strategy',  component: () => <Placeholder title="Resource Strategy" color="text-orange-600" />,  roles: ['portfolio-manager'] },

  // ── Sales Manager ────────────────────────────────────────────────
  { path: '/sales',              component: OpportunityRequests, roles: ['sales-manager'] },
  { path: '/sales/clients',      component: ClientList,          roles: ['sales-manager'] },
  { path: '/sales/interview-hub', component: InterviewHub,       roles: ['sales-manager'] },
  { path: '/sales/pipeline',     component: () => <Placeholder title="Sales Pipeline" color="text-yellow-600" />, roles: ['sales-manager'] },

  // ── Interview Panel ──────────────────────────────────────────────
  { path: '/panel',               component: InterviewPanelDashboard, roles: ['interview-panel'] },
  { path: '/panel/interview-hub', component: InterviewHub,            roles: ['interview-panel'] },
];
