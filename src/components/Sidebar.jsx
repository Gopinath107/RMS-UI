import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  Building2, 
  FolderOpen, 
  LogOut,
  Menu,
  UserCheck,
  FileText,
  Bell,
  Clock,
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import { Button } from './ui/button.jsx';

export default function Sidebar({ onLogout, isExpanded, setIsExpanded }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [expandedMenus, setExpandedMenus] = useState([]);

const menuItems = [
    { id: 'dashboard',           label: 'Dashboard',           icon: LayoutDashboard, path: '/hr' },
    { id: 'resource-management', label: 'Resource Management', icon: Users,            path: '/hr/resources' },
    { id: 'interviews-management', label: 'Interviews',        icon: UserCheck,        description: 'Interview Management', path: '/hr/interviews' },
    { id: 'client-list',         label: 'Clients',             icon: FileText,         path: '/hr/clients' },
    { id: 'projects',            label: 'Projects',            icon: FolderOpen,       path: '/hr/projects' },
];

  const handleNavigation = (item) => {
    if (item.hasSubMenu && isExpanded && !item.isStatic) {
      toggleSubMenu(item.id);
    } else {
      navigate(item.path);
    }
  };

  const handleSubNavigation = (item) => {
    navigate(item.path);
  };

  const toggleSubMenu = (menuId) => {
    setExpandedMenus(prev => 
      prev.includes(menuId) 
        ? prev.filter(id => id !== menuId)
        : [...prev, menuId]
    );
  };

  const getCurrentPage = () => {
    const mainItem = menuItems.find(item => location.pathname === item.path);
    if (mainItem) return mainItem.id;
    return 'dashboard';
  };

  return (
    <>
      {/* Mobile Overlay */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setIsExpanded(false)}
          />
        )}
      </AnimatePresence>
      
      <motion.div
        initial={{ x: -250 }}
        animate={{ 
          x: 0,
          width: isExpanded ? 256 : 64
        }}
        transition={{ duration: 0.3 }}
        className={`fixed left-0 top-0 h-full ${
        isExpanded ? 'w-64 overflow-hidden' : 'w-16 overflow-visible'
      } bg-gradient-to-b from-sky-900/98 via-blue-900/98 to-indigo-900/98 backdrop-blur-md shadow-2xl border-r border-sky-300/20 z-50 flex flex-col ${
        isExpanded ? 'lg:translate-x-0' : 'translate-x-0'
      }`}
      >
      {/* Header with Toggle Button */}
      <div className={`${isExpanded ? 'p-4' : 'p-3'} border-b border-blue-300/20`}>
        <div className="flex items-center gap-3">
          <motion.button
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-12 h-12 bg-gradient-to-r from-blue-400 to-indigo-500 rounded-xl flex items-center justify-center hover:from-blue-500 hover:to-indigo-600 transition-all duration-200 shadow-lg flex-shrink-0"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Menu className="w-6 h-6 text-white" />
          </motion.button>
          
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2, delay: 0.1 }}
              className="flex items-center gap-3 flex-1 min-w-0"
            >
              <div className="w-16 h-16 bg-white rounded-xl flex items-center justify-center shadow-lg flex-shrink-0">
                <UserCheck className="w-8 h-8 text-blue-600" />
              </div>
              <div className="flex flex-col justify-center min-w-0">
                <h1 className="text-white font-bold text-base leading-tight">
                  Recruiter HR
                </h1>
              </div>
            </motion.div>
          )}
        </div>
      </div>

        {/* Navigation Menu */}
        <nav 
          className={`mt-4 flex-1 min-h-0 hide-scrollbar ${isExpanded
          ? 'px-3 overflow-y-auto overflow-x-hidden'
          : 'px-2 overflow-visible'
          }`} 
          style={{
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
          }}
        >
          <style>{`
            nav::-webkit-scrollbar {
              display: none;
            }
          `}</style>
          <div className="space-y-1 pb-20">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = getCurrentPage() === item.id;
              const isExpanded_Menu = item.isStatic ? true : expandedMenus.includes(item.id);
              const hasActiveSubItem = item.subItems?.some(sub => getCurrentPage() === sub.id);
              
              return (
                <div key={item.id} className="relative overflow-visible">
                  {/* Main Menu Item */}
                  <motion.button
                    onClick={() => handleNavigation(item)}
                    className={`w-full flex items-center ${
                      isExpanded ? 'space-x-3 px-3' : 'justify-center px-2'
                    } py-3 rounded-xl transition-all duration-200 relative group ${
                      isActive || hasActiveSubItem
                        ? 'bg-gradient-to-r from-sky-500/30 to-blue-500/30 text-white border border-sky-400/30 shadow-lg' 
                        : 'text-sky-200 hover:bg-sky-500/20 hover:text-white'
                    }`}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Icon className={`w-5 h-5 flex-shrink-0 ${isActive || hasActiveSubItem ? 'text-sky-300' : ''}`} />
                    {/* ── COLLAPSED TOOLTIP (ChatGPT-style dark) ── */}
                    {!isExpanded && (
                      <span
                        className="pointer-events-none fixed left-16 ml-3 z-[9999] flex items-center gap-2 whitespace-nowrap px-3 py-2 rounded-lg text-sm font-medium opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200 ease-out"
                        style={{
                          backgroundColor: '#1f1f1f',
                          color: '#fff',
                          boxShadow: '0 4px 14px rgba(0,0,0,0.35)',
                        }}
                      >
                        {/* Left arrow */}
                        <span
                          className="absolute top-1/2 -translate-y-1/2"
                          style={{
                            left: '-6px',
                            width: 0,
                            height: 0,
                            borderTop: '6px solid transparent',
                            borderBottom: '6px solid transparent',
                            borderRight: '6px solid #1f1f1f',
                          }}
                        />
                        {item.label}
                      </span>
                    )}
                    {isExpanded && (
                      <>
                        <motion.span 
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.2, delay: 0.1 }}
                          className="font-medium flex-1 text-left truncate"
                        >
                          {item.label}
                        </motion.span>
                        {item.hasSubMenu && !item.isStatic && (
                          <motion.div
                            animate={{ rotate: isExpanded_Menu ? 90 : 0 }}
                            transition={{ duration: 0.2 }}
                            className="flex-shrink-0"
                          >
                            <ChevronRight className="w-4 h-4" />
                          </motion.div>
                        )}
                      </>
                    )}
                    {(isActive || hasActiveSubItem) && !isExpanded && (
                      <motion.div
                        layoutId="activeIndicatorCollapsed"
                        className="absolute right-1 w-1 h-8 bg-sky-300 rounded-full"
                      />
                    )}
                  </motion.button>

                  {/* Sub Menu Items for collapsed state */}
                  {item.hasSubMenu && !isExpanded && (
                    <div className="absolute left-16 top-0 bg-gradient-to-b from-sky-900/98 via-blue-900/98 to-indigo-900/98 backdrop-blur-md shadow-xl border border-sky-300/20 rounded-xl py-2 z-50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none group-hover:pointer-events-auto min-w-max">
                      {item.subItems?.map((subItem) => {
                        const SubIcon = subItem.icon;
                        const isSubActive = getCurrentPage() === subItem.id;
                        
                        return (
                          <button
                            key={subItem.id}
                            onClick={() => handleSubNavigation(subItem)}
                            className={`w-full flex items-center space-x-3 px-4 py-2 text-sm whitespace-nowrap ${
                              isSubActive
                                ? 'text-white bg-sky-500/30' 
                                : 'text-sky-300 hover:text-white hover:bg-sky-500/15'
                            }`}
                          >
                            <SubIcon className="w-4 h-4 flex-shrink-0" />
                            <span className="font-medium">{subItem.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {/* Sub Menu Items for expanded state */}
                  {item.hasSubMenu && isExpanded && (
                    <AnimatePresence>
                      {isExpanded_Menu && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden ml-4 mt-1 space-y-1"
                        >
                          {item.subItems?.map((subItem) => {
                            const SubIcon = subItem.icon;
                            const isSubActive = getCurrentPage() === subItem.id;
                            
                            return (
                              <motion.button
                                key={subItem.id}
                                onClick={() => handleSubNavigation(subItem)}
                                className={`w-full flex items-center space-x-3 px-3 py-2 rounded-xl transition-all duration-200 text-sm ${
                                  isSubActive
                                    ? 'bg-gradient-to-r from-sky-400/40 to-blue-400/40 text-white border border-sky-300/30 shadow-md' 
                                    : 'text-sky-300 hover:bg-sky-500/15 hover:text-white'
                                }`}
                                whileHover={{ scale: 1.02, x: 4 }}
                                whileTap={{ scale: 0.98 }}
                              >
                                <SubIcon className={`w-4 h-4 flex-shrink-0 ${isSubActive ? 'text-sky-200' : ''}`} />
                                <span className="font-medium flex-1 text-left truncate">
                                  {subItem.label}
                                </span>
                                {isSubActive && (
                                  <motion.div
                                    layoutId="activeSubIndicator"
                                    className="w-1.5 h-1.5 bg-sky-200 rounded-full flex-shrink-0"
                                  />
                                )}
                              </motion.button>
                            );
                          })}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  )}
                </div>
              );
            })}
          </div>
        </nav>

      <div className={`mt-auto p-3 ${isExpanded ? 'px-3' : 'px-2'} border-t border-blue-300/20 space-y-3`}>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="bg-blue-500/10 rounded-lg p-3 border border-blue-400/20"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                <Users className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-medium text-sm truncate">
                  {localStorage.getItem('userName') || 'HR Manager'}
                </p>
                <p className="text-blue-300 text-xs truncate">Recruiter HR</p>
              </div>
            </div>
          </motion.div>
        )}
        
        <div className="relative group overflow-visible">
          <Button
            onClick={onLogout}
            variant="outline"
            className={`w-full flex items-center ${
              isExpanded ? 'space-x-3 px-4' : 'justify-center px-2'
            } py-3 border-red-300/30 bg-red-500/10 text-red-200 hover:bg-red-500/20 hover:border-red-300/50 hover:text-white transition-all duration-200`}
          >
            <LogOut className="w-5 h-5" />
            {isExpanded && (
              <motion.span
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.2, delay: 0.1 }}
                className="truncate"
              >
                Logout
              </motion.span>
            )}
          </Button>

          {/* Collapsed Logout tooltip (same ChatGPT-style dark) */}
          {!isExpanded && (
            <span
              className="pointer-events-none fixed left-16 ml-3 z-[9999] flex items-center whitespace-nowrap px-3 py-2 rounded-lg text-sm font-medium opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200 ease-out"
              style={{
                backgroundColor: '#1f1f1f',
                color: '#fff',
                boxShadow: '0 4px 14px rgba(0,0,0,0.35)',
                bottom: '1rem',
              }}
            >
              <span
                className="absolute top-1/2 -translate-y-1/2"
                style={{
                  left: '-6px',
                  width: 0,
                  height: 0,
                  borderTop: '6px solid transparent',
                  borderBottom: '6px solid transparent',
                  borderRight: '6px solid #1f1f1f',
                }}
              />
              Logout
            </span>
          )}
        </div>
      </div>
      </motion.div>
    </>
  );
}
