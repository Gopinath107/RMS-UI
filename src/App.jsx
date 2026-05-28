// src/App.jsx
// Root application — manages auth state, delegates layout to AppShell
// and routing to AppRoutes (via AppShell → AppRoutes).
import React, { useState, useEffect } from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useNavigate,
  useLocation,
} from 'react-router-dom';

import LoginPage from './components/LoginPage.jsx';
import ForgotPassword from './components/ForgotPassword.jsx';
import NotFound from './components/NotFound.jsx';
import AppShell from './layout/AppShell.jsx';

import { Toaster } from './components/ui/sonner.jsx';
import { getDashboardPath } from './config/routes.js';
import { useGlobalTableResizer } from './hooks/useGlobalTableResizer.js';
import { useActivityTracker } from './hooks/useActivityTracker.js';

/** Clear stale auth data if there is no token (session expired / first load). */
function getInitialAuthState() {
  const flagged = localStorage.getItem('isAuthenticated') === 'true';
  const hasToken = !!localStorage.getItem('token');
  if (flagged && !hasToken) {
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
  useGlobalTableResizer();
  const initial = getInitialAuthState();
  const [userRole, setUserRole] = useState(initial.userRole);
  const [isAuthenticated, setIsAuthenticated] = useState(initial.isAuthenticated);
  const navigate = useNavigate();
  const location = useLocation();

  useActivityTracker(isAuthenticated);

  // Sync auth state when localStorage changes in another tab
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
        <Route path="/404" element={<NotFound />} />

        {/* Authenticated shell — handles all role-prefixed routes via AppShell → AppRoutes */}
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