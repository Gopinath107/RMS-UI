// src/layout/AppShell.jsx
// Authenticated application shell — sidebar + mobile header + content area.
import React, { useState } from 'react';
import { getRoleTheme, getRoleTitle } from '../config/roleThemes.js';
import { getSidebarComponent } from '../config/sidebarConfig.js';
import AppRoutes from '../routes/AppRoutes.jsx';

export default function AppShell({ userRole, onLogout }) {
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);
  const theme = getRoleTheme(userRole);
  const roleTitle = getRoleTitle(userRole);

  const sidebarProps = {
    onLogout,
    isExpanded: isSidebarExpanded,
    setIsExpanded: setIsSidebarExpanded,
  };

  const SidebarComponent = getSidebarComponent(userRole);

  return (
    <div className="min-h-screen relative overflow-clip">
      {/* Background image */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `url('https://images.unsplash.com/photo-1675518806026-53201020ef09?q=80&w=1632&auto=format&fit=crop')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      />
      {/* Role-tinted gradient overlay */}
      <div className={`absolute inset-0 bg-gradient-to-br ${theme.gradient}`} />

      <div className="relative z-10">
        <div className="flex min-h-screen">
          <SidebarComponent {...sidebarProps} />

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

            {/* Page content — driven by AppRoutes */}
            <div className="px-2 sm:px-4 lg:px-6 py-4 w-full overflow-x-clip">
              <AppRoutes userRole={userRole} />
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
