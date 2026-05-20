import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Target,
  DollarSign,
  Users,
  Building2,
  LogOut,
  Menu,
  TrendingUp,
  PieChart,
  BarChart3,
  MessageSquare,
  FileText
} from 'lucide-react';
import { Button } from './ui/button.jsx';
import { hasAssignedInterviews, getPendingInterviewsCount } from './utils/interviewUtils.js';

export default function PortfolioManagerSidebar({
  onLogout,
  isExpanded,
  setIsExpanded,
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const [projectCount, setProjectCount] = useState(0);
  const [pendingInterviewsCount, setPendingInterviewsCount] = useState(0);
  const userName = localStorage.getItem('userName') || 'portfolio';

  // Get project count and interview assignments
  useEffect(() => {
    const updateCounts = () => {
      try {
        const stored = localStorage.getItem('projects');
        if (stored) {
          const projects = JSON.parse(stored);
          setProjectCount(projects.length);
        }
      } catch (error) {
        console.error('Error loading projects count:', error);
      }

      // Update interview assignments
      if (userName) {
        setPendingInterviewsCount(getPendingInterviewsCount(userName));
      }
    };

    updateCounts();

    // Update count every 3 seconds
    const interval = setInterval(updateCounts, 3000);

    return () => clearInterval(interval);
  }, [userName]);

  const menuItems = [
    {
      id: 'dashboard',
      label: 'Portfolio Dashboard',
      icon: LayoutDashboard,
      description: 'Strategic Overview',
      path: '/portfolio'
    },
    {
      id: 'client-portfolio',
      label: 'Client Portfolio',
      icon: Building2,
      description: 'Client Relations',
      path: '/portfolio/clients',
      badge: projectCount > 0 ? projectCount : null
    },
    {
      id: 'reports',
      label: 'Reports',
      icon: FileText,
      description: 'Demand & Resource Report',
      path: '/portfolio/reports'
    },
    {
      id: 'interview-hub',
      label: 'Interview Hub',
      icon: MessageSquare,
      description: 'My Assigned Interviews',
      path: '/portfolio/interview-hub',
      badge: pendingInterviewsCount > 0 ? pendingInterviewsCount : null
    }
  ];



  return (
    <motion.div
      initial={{ x: -250 }}
      animate={{
        x: 0,
        width: isExpanded ? 256 : 64
      }}
      transition={{ duration: 0.3 }}
      className={`fixed left-0 top-0 h-full ${isExpanded ? 'w-64' : 'w-16'
        } bg-gradient-to-b from-orange-900/98 via-amber-900/98 to-yellow-900/98 backdrop-blur-md shadow-2xl border-r border-orange-300/20 z-50 flex flex-col`}
    >
      {/* Header with Toggle Button */}
      <div className={`${isExpanded ? 'p-4' : 'p-3'} border-b border-orange-300/20`}>
        <div className="flex items-center gap-3">
          <motion.button
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-12 h-12 bg-gradient-to-r from-orange-400 to-amber-500 rounded-xl flex items-center justify-center hover:from-orange-500 hover:to-amber-600 transition-all duration-200 shadow-lg flex-shrink-0"
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
                <TrendingUp className="w-8 h-8 text-orange-600" />
              </div>
              <div className="flex flex-col justify-center min-w-0">
                <h1 className="text-white font-bold text-base leading-tight">
                  Portfolio Manager
                </h1>
                <h2 className="text-orange-200 font-medium text-sm leading-tight">
                  Strategic Leadership
                </h2>
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* Navigation Menu */}
      <nav
        className={`mt-4 ${isExpanded ? 'px-3' : 'px-2'} overflow-y-auto flex-1`}
        style={{
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
        }}
      >
        <style jsx>{`
          nav::-webkit-scrollbar {
            display: none;
          }
        `}</style>
        <div className="space-y-2 pb-20">
          {menuItems.map((item, index) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;

            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
              >
                <motion.button
                  onClick={() => navigate(item.path)}
                  className={`w-full flex items-center ${isExpanded ? 'space-x-3 px-3' : 'justify-center px-2'
                    } py-3 rounded-xl transition-all duration-200 relative group ${isActive
                      ? 'bg-gradient-to-r from-orange-500/30 to-amber-500/30 text-white border border-orange-400/30 shadow-lg'
                      : 'text-orange-200 hover:bg-orange-500/20 hover:text-white'
                    }`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-orange-300' : ''}`} />
                  {/* Collapsed: hover label pill */}
                  {!isExpanded && (
                    <span className="pointer-events-none absolute left-full ml-2 z-50 flex items-center gap-1 bg-orange-950 text-white text-xs font-semibold px-3 py-1.5 rounded-lg shadow-xl border border-orange-400/30 whitespace-nowrap opacity-0 translate-x-[-6px] group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200 ease-out">
                      {item.label}
                      {item.badge && <span className="ml-1 bg-blue-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">{item.badge}</span>}
                    </span>
                  )}
                  {isExpanded && (
                    <>
                      <motion.div
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.2, delay: 0.1 }}
                        className="flex-1 text-left"
                      >
                        <p className="font-medium truncate">{item.label}</p>
                        <p className="text-xs text-orange-300 truncate">{item.description}</p>
                      </motion.div>
                      {item.badge && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center text-xs font-bold text-white"
                        >
                          {item.badge}
                        </motion.div>
                      )}
                    </>
                  )}
                  {isActive && !isExpanded && (
                    <motion.div
                      layoutId="activeIndicatorPortfolio"
                      className="absolute right-1 w-1 h-8 bg-orange-300 rounded-full"
                    />
                  )}
                  {!isExpanded && item.badge && (
                    <motion.div
                      className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center text-xs font-bold text-white"
                    >
                      {item.badge}
                    </motion.div>
                  )}
                </motion.button>
              </motion.div>
            );
          })}
        </div>
      </nav>

      {/* User Info & Logout */}
      <div className={`mt-auto p-3 ${isExpanded ? 'px-3' : 'px-2'} border-t border-orange-300/20 space-y-3`}>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="bg-orange-500/10 rounded-lg p-3 border border-orange-400/20"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-medium text-sm truncate">
                  {localStorage.getItem('userName') || 'Portfolio Manager'}
                </p>
                <p className="text-orange-300 text-xs truncate">Strategic Leader</p>
              </div>
            </div>
          </motion.div>
        )}

        <Button
          onClick={onLogout}
          variant="outline"
          className={`w-full flex items-center ${isExpanded ? 'space-x-3 px-4' : 'justify-center px-2'
            } py-3 border-red-300/30 bg-red-500/10 text-red-200 hover:bg-red-500/20 hover:border-red-300/50 hover:text-white transition-all duration-200`}
          title={!isExpanded ? 'Logout' : undefined}
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
      </div>
    </motion.div>
  );
}
