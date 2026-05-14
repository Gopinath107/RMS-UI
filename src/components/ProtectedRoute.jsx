import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { getDashboardPath } from '../config/routes.js';
import { isAuthenticated as checkAuth } from '../utils/authUtils.js';

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

  const isAuthenticated = checkAuth();
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

  return children;
}
