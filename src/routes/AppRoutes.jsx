// src/routes/AppRoutes.jsx
// Renders all protected routes declaratively from PROTECTED_ROUTES config.
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from '../components/ProtectedRoute.jsx';
import { PROTECTED_ROUTES } from '../config/routePermissions.jsx';
import { getDashboardPath } from '../config/routes.js';

export default function AppRoutes({ userRole }) {
  return (
    <Routes>
      {PROTECTED_ROUTES.map(({ path, component: Component, roles, wrapper: Wrapper }) => (
        <Route
          key={path}
          path={path}
          element={
            <ProtectedRoute allowedRoles={roles}>
              {Wrapper ? (
                <Wrapper>
                  <Component />
                </Wrapper>
              ) : (
                <Component />
              )}
            </ProtectedRoute>
          }
        />
      ))}
      {/* Fallback: redirect to the user's own dashboard */}
      <Route path="*" element={<Navigate to={getDashboardPath(userRole)} replace />} />
    </Routes>
  );
}
