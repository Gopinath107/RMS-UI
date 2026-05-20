import React, { useState, useEffect } from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useNavigate,
  useLocation,
} from 'react-router-dom';

// Pages
import LoginPage from './components/LoginPage.jsx';
import ForgotPassword from './components/ForgotPassword.jsx';
import NotFound from './components/NotFound.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';

// Dashboards / Pages
import ProjectManagerDashboard from './components/ProjectManagerDashboard.jsx';
import HRDashboard from './components/HRDashboard.jsx';
import PMODashboard from './components/PMODashboard.jsx';
import SystemAdminDashboard from './components/SystemAdminDashboard.jsx';
import PortfolioManagerDashboard from './components/PortfolioManagerDashboard.jsx';
import SalesManagerDashboard from './components/SalesManagerDashboard.jsx';
import InterviewPanelDashboard from './components/InterviewPanelDashboard.jsx';
import Dashboard from './components/Dashboard.jsx';

import ResourceManagement from './components/ResourceManagement.jsx';
import AddResourcePage from './components/AddResourcePage.jsx';
import ResourceAllocation from './components/ResourceAllocation.jsx';
import ProjectManagerResourceAllocation from './components/ProjectManagerResourceAllocation.jsx';
import ClientsManagement from './components/ClientsManagement.jsx';
import ClientList from './components/ClientList.jsx';
import ProjectsManagement from './components/ProjectsManagement.jsx';
import ProjectPortfolio from './components/ProjectPortfolio.jsx';
import PortfolioReportsPage from './components/PortfolioReportsPage.jsx';
import Notifications from './components/Notifications.jsx';
import Timesheets from './components/Timesheets.jsx';
import UserManagement from './components/UserManagement.jsx';
import InterviewsManagement from './components/InterviewsManagement.jsx';
import InterviewHub from './components/InterviewHub.jsx';
import OpportunityRequests from './components/OpportunityRequests.jsx';
import RequestResource from './components/RequestResource.jsx';

// Sidebars
import ProjectManagerSidebar from './components/ProjectManagerSidebar.jsx';
import HRSidebar from './components/HRSidebar.jsx';
import SystemAdminSidebar from './components/SystemAdminSidebar.jsx';
import PMOSidebar from './components/PMOSidebar.jsx';
import PortfolioManagerSidebar from './components/PortfolioManagerSidebar.jsx';
import SalesManagerSidebar from './components/SalesManagerSidebar.jsx';
import InterviewPanelSidebar from './components/InterviewPanelSidebar.jsx';
import Sidebar from './components/Sidebar.jsx';

import { Toaster } from './components/ui/sonner.jsx';
import { getDashboardPath } from './config/routes.js';

// ─── Role-specific theme colours ────────────────────────────────────────────
const ROLE_THEMES = {
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

const DEFAULT_THEME = {
  gradient: 'from-sky-50/40 via-blue-50/20 to-indigo-100/30',
  mobileBg: 'border-sky-200',
  mobileBtn: 'bg-sky-500 hover:bg-sky-600',
};

const ROLE_TITLES = {
  'project-manager': 'Project Manager',
  hr: 'HR Manager',
  pmo: 'PMO',
  'system-admin': 'System Admin',
  'portfolio-manager': 'Portfolio Manager',
  'sales-manager': 'Sales Manager',
  'interview-panel': 'Interview Panel',
};

// ─── Placeholder for stub pages ─────────────────────────────────────────────
const Placeholder = ({ title, color = 'text-gray-600' }) => (
  <div className="p-6">
    <h1 className={`text-2xl font-bold ${color}`}>{title}</h1>
    <p className="text-gray-500 mt-2">This section is under construction.</p>
  </div>
);

// ─── Authenticated App Shell ─────────────────────────────────────────────────
function AppShell({ userRole, onLogout }) {
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(true);
  const theme = ROLE_THEMES[userRole] || DEFAULT_THEME;
  const roleTitle = ROLE_TITLES[userRole] || 'Dashboard';

  const sidebarProps = {
    onLogout,
    isExpanded: isSidebarExpanded,
    setIsExpanded: setIsSidebarExpanded,
  };

  const renderSidebar = () => {
    switch (userRole) {
      case 'project-manager': return <ProjectManagerSidebar {...sidebarProps} />;
      case 'hr':              return <HRSidebar {...sidebarProps} />;
      case 'system-admin':    return <SystemAdminSidebar {...sidebarProps} />;
      case 'pmo':             return <PMOSidebar {...sidebarProps} />;
      case 'portfolio-manager': return <PortfolioManagerSidebar {...sidebarProps} />;
      case 'sales-manager':   return <SalesManagerSidebar {...sidebarProps} />;
      case 'interview-panel': return <InterviewPanelSidebar {...sidebarProps} />;
      default:                return <Sidebar {...sidebarProps} />;
    }
  };

  return (
    <div className="min-h-screen relative overflow-clip">
      {/* Background */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `url('https://images.unsplash.com/photo-1675518806026-53201020ef09?q=80&w=1632&auto=format&fit=crop')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      />
      <div className={`absolute inset-0 bg-gradient-to-br ${theme.gradient}`} />

      <div className="relative z-10">
        <div className="flex min-h-screen">
          {renderSidebar()}

          <main
            className={`flex-1 transition-all duration-300 min-w-0 ${
              isSidebarExpanded ? 'lg:ml-64 ml-16' : 'ml-16'
            }`}
          >
            {/* Mobile header */}
            <div
              className={`lg:hidden bg-white/90 backdrop-blur-md border-b ${theme.mobileBg} p-4 flex items-center justify-between sticky top-0 z-30`}
            >
              <h1 className="text-xl font-bold text-gray-800 truncate">{roleTitle}</h1>
              <button
                onClick={() => setIsSidebarExpanded(!isSidebarExpanded)}
                className={`p-2 rounded-lg text-white transition-colors flex-shrink-0 ${theme.mobileBtn}`}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>

            {/* Page content rendered by nested Routes */}
            <div className="px-2 sm:px-4 lg:px-6 py-4 w-full overflow-x-clip">
              <Routes>
                {/* ── HR ── */}
                <Route path="/hr" element={<ProtectedRoute allowedRoles={['hr']}><HRDashboard /></ProtectedRoute>} />
                <Route path="/hr/resources" element={<ProtectedRoute allowedRoles={['hr']}><ResourceManagement /></ProtectedRoute>} />
                <Route path="/hr/resources/add" element={<ProtectedRoute allowedRoles={['hr']}><AddResourcePage /></ProtectedRoute>} />
                <Route path="/hr/interviews" element={<ProtectedRoute allowedRoles={['hr']}><InterviewsManagement /></ProtectedRoute>} />
                <Route path="/hr/interview-hub" element={<ProtectedRoute allowedRoles={['hr']}><InterviewHub /></ProtectedRoute>} />
                <Route path="/hr/clients" element={<ProtectedRoute allowedRoles={['hr']}><ClientList /></ProtectedRoute>} />
                <Route path="/hr/projects" element={<ProtectedRoute allowedRoles={['hr']}><ProjectsManagement /></ProtectedRoute>} />
                <Route path="/hr/notifications" element={<ProtectedRoute allowedRoles={['hr']}><Notifications /></ProtectedRoute>} />

                {/* ── Project Manager ── */}
                <Route path="/pm" element={<ProtectedRoute allowedRoles={['project-manager']}><ProjectManagerDashboard /></ProtectedRoute>} />
                <Route path="/pm/projects" element={<ProtectedRoute allowedRoles={['project-manager']}><ProjectsManagement /></ProtectedRoute>} />
                <Route path="/pm/resource-requests" element={<ProtectedRoute allowedRoles={['project-manager']}><RequestResource /></ProtectedRoute>} />
                <Route path="/pm/interview-hub" element={<ProtectedRoute allowedRoles={['project-manager']}><InterviewHub /></ProtectedRoute>} />
                <Route path="/pm/clients" element={<ProtectedRoute allowedRoles={['project-manager']}><ClientList /></ProtectedRoute>} />
                <Route path="/pm/resource-allocation" element={<ProtectedRoute allowedRoles={['project-manager']}><ProjectManagerResourceAllocation /></ProtectedRoute>} />

                {/* ── PMO ── */}
                <Route path="/pmo" element={<ProtectedRoute allowedRoles={['pmo']}><PMODashboard /></ProtectedRoute>} />
                <Route path="/pmo/resource-requests" element={<ProtectedRoute allowedRoles={['pmo']}><RequestResource /></ProtectedRoute>} />
                <Route path="/pmo/interview-hub" element={<ProtectedRoute allowedRoles={['pmo']}><InterviewHub /></ProtectedRoute>} />

                {/* ── System Admin ── */}
                <Route path="/admin" element={<ProtectedRoute allowedRoles={['system-admin']}><UserManagement /></ProtectedRoute>} />
                <Route path="/admin/resources" element={<ProtectedRoute allowedRoles={['system-admin']}><ResourceManagement /></ProtectedRoute>} />
                <Route path="/admin/resources/add" element={<ProtectedRoute allowedRoles={['system-admin']}><AddResourcePage /></ProtectedRoute>} />
                <Route path="/admin/interview-hub" element={<ProtectedRoute allowedRoles={['system-admin']}><InterviewHub /></ProtectedRoute>} />
                <Route path="/admin/system-settings" element={<ProtectedRoute allowedRoles={['system-admin']}><Placeholder title="System Settings" color="text-red-600" /></ProtectedRoute>} />

                {/* ── Portfolio Manager ── */}
                <Route path="/portfolio" element={<ProtectedRoute allowedRoles={['portfolio-manager']}><PortfolioManagerDashboard /></ProtectedRoute>} />
                <Route path="/portfolio/projects" element={<ProtectedRoute allowedRoles={['portfolio-manager']}><ProjectPortfolio /></ProtectedRoute>} />
                <Route path="/portfolio/clients" element={<ProtectedRoute allowedRoles={['portfolio-manager']}><ClientList /></ProtectedRoute>} />
                <Route path="/portfolio/reports" element={<ProtectedRoute allowedRoles={['portfolio-manager']}><PortfolioReportsPage /></ProtectedRoute>} />
                <Route path="/portfolio/strategic-planning" element={<ProtectedRoute allowedRoles={['portfolio-manager']}><Placeholder title="Strategic Planning" color="text-orange-600" /></ProtectedRoute>} />
                <Route path="/portfolio/financial-overview" element={<ProtectedRoute allowedRoles={['portfolio-manager']}><Placeholder title="Financial Overview" color="text-orange-600" /></ProtectedRoute>} />
                <Route path="/portfolio/resource-strategy" element={<ProtectedRoute allowedRoles={['portfolio-manager']}><Placeholder title="Resource Strategy" color="text-orange-600" /></ProtectedRoute>} />

                {/* ── Sales Manager ── */}
                <Route path="/sales" element={<ProtectedRoute allowedRoles={['sales-manager']}><OpportunityRequests /></ProtectedRoute>} />
                <Route path="/sales/clients" element={<ProtectedRoute allowedRoles={['sales-manager']}><ClientList /></ProtectedRoute>} />
                <Route path="/sales/interview-hub" element={<ProtectedRoute allowedRoles={['sales-manager']}><InterviewHub /></ProtectedRoute>} />
                <Route path="/sales/pipeline" element={<ProtectedRoute allowedRoles={['sales-manager']}><Placeholder title="Sales Pipeline" color="text-yellow-600" /></ProtectedRoute>} />
                
                {/* ── Interview Panel ── */}
                <Route path="/panel" element={<ProtectedRoute allowedRoles={['interview-panel']}><InterviewPanelDashboard /></ProtectedRoute>} />
                <Route path="/panel/interview-hub" element={<ProtectedRoute allowedRoles={['interview-panel']}><InterviewHub /></ProtectedRoute>} />

                {/* ── Fallback inside shell → redirect to role dashboard ── */}
                <Route path="*" element={<Navigate to={getDashboardPath(userRole)} replace />} />
              </Routes>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}

// ─── Root App ────────────────────────────────────────────────────────────────

/** Clear stale auth data if there is no token (session expired / first load). */
function getInitialAuthState() {
  const flagged = localStorage.getItem('isAuthenticated') === 'true';
  const hasToken = !!localStorage.getItem('token');
  if (flagged && !hasToken) {
    // No valid token — wipe stale flags so the user sees the login page
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userName');
    localStorage.removeItem('userId');
    return { isAuthenticated: false, userRole: '' };
  }
  return {
    isAuthenticated: flagged,
    userRole: localStorage.getItem('userRole') || '',
  };
}

function AppContent() {
  const initial = getInitialAuthState();
  const [userRole, setUserRole] = useState(initial.userRole);
  const [isAuthenticated, setIsAuthenticated] = useState(initial.isAuthenticated);
  const navigate = useNavigate();
  const location = useLocation();

  // Keep state in sync if localStorage is modified externally (e.g. another tab)
  useEffect(() => {
    const sync = () => {
      const s = getInitialAuthState();
      setIsAuthenticated(s.isAuthenticated);
      setUserRole(s.userRole);
    };
    window.addEventListener('storage', sync);
    return () => window.removeEventListener('storage', sync);
  }, []);

  const handleLogin = (role) => {
    setIsAuthenticated(true);
    setUserRole(role);
    localStorage.setItem('isAuthenticated', 'true');
    localStorage.setItem('userRole', role);

    // If the user was originally trying to visit a specific page, go there
    const params = new URLSearchParams(location.search);
    const redirect = params.get('redirect');
    if (redirect && redirect.startsWith('/') && !redirect.startsWith('/login')) {
      navigate(redirect, { replace: true });
    } else {
      navigate(getDashboardPath(role), { replace: true });
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setUserRole('');
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userName');
    localStorage.removeItem('userId');
    localStorage.removeItem('token');
    navigate('/login', { replace: true });
  };

  return (
    <>
      <Routes>
        {/* Root redirect */}
        <Route path="/" element={<Navigate to="/login" replace />} />

        {/* Public routes */}
        <Route
          path="/login"
          element={
            isAuthenticated
              ? <Navigate to={getDashboardPath(userRole)} replace />
              : <LoginPage onLogin={handleLogin} />
          }
        />
        <Route path="/forgot-password" element={<ForgotPassword />} />

        {/* 404 */}
        <Route path="/404" element={<NotFound />} />

        {/* Authenticated shell — handles all role-prefixed routes */}
        <Route
          path="/*"
          element={
            isAuthenticated
              ? <AppShell userRole={userRole} onLogout={handleLogout} />
              : <Navigate to={`/login?redirect=${encodeURIComponent(location.pathname + location.search)}`} replace />
          }
        />
      </Routes>
      <Toaster />
    </>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;
