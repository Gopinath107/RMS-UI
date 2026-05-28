// src/config/sidebarConfig.js
// Maps role key → the sidebar component to render.
// Import lazily to avoid circular deps — each sidebar imports nothing from here.
import ProjectManagerSidebar from '../components/ProjectManagerSidebar.jsx';
import HRSidebar from '../components/HRSidebar.jsx';
import SystemAdminSidebar from '../components/SystemAdminSidebar.jsx';
import PMOSidebar from '../components/PMOSidebar.jsx';
import PortfolioManagerSidebar from '../components/PortfolioManagerSidebar.jsx';
import SalesManagerSidebar from '../components/SalesManagerSidebar.jsx';
import InterviewPanelSidebar from '../components/InterviewPanelSidebar.jsx';
import Sidebar from '../components/Sidebar.jsx';

/**
 * Returns the Sidebar component for the given role.
 * Falls back to the generic Sidebar if role is unknown.
 */
export function getSidebarComponent(role) {
  const map = {
    'project-manager': ProjectManagerSidebar,
    hr: HRSidebar,
    'system-admin': SystemAdminSidebar,
    pmo: PMOSidebar,
    'portfolio-manager': PortfolioManagerSidebar,
    'sales-manager': SalesManagerSidebar,
    'interview-panel': InterviewPanelSidebar,
  };
  return map[role] || Sidebar;
}
