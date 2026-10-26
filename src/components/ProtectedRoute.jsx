import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { getDashboardPath } from '../config/routes.js';
import { useRmsAccess, permissionForPath } from '../utils/portalAccess.js';

/**
 * ProtectedRoute — wraps any authenticated route.
 *
 * Checks:
 *  1. Is the user authenticated? If not → redirect to /login (storing intended URL)
 *  2. Does the user's role match allowedRoles? If not → redirect to their own dashboard
 *
 * @param {string[]} allowedRoles  - roles permitted on this route
 * @param {JSX.Element} children   - the page component to render
 */
export default function ProtectedRoute({ allowedRoles = [], children }) {
  const location = useLocation();
  const access = useRmsAccess();
  const requiredPermission = permissionForPath(location.pathname);

  const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
  const userRole = localStorage.getItem('userRole') || '';

  // Not logged in → send to login, remember where they were going
  if (!isAuthenticated) {
    return (
      <Navigate
        to={`/login?redirect=${encodeURIComponent(location.pathname + location.search)}`}
        replace
      />
    );
  }

  // Wrong role → send to their own dashboard
  if (allowedRoles.length > 0 && !allowedRoles.includes(userRole)) {
    return <Navigate to={getDashboardPath(userRole)} replace />;
  }

  if (access.managed && requiredPermission && !access.permissions.includes(requiredPermission)) {
    return <section className="rounded-xl border bg-white p-6" role="alert"><h1 className="text-xl font-semibold">Access not assigned</h1><p>This RMS page requires permission from your RIS Portal administrator.</p></section>;
  }
  return children;
}
