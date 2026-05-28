import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users,
  LogOut,
  Menu,
  MessageSquare,
  Calendar,
  ClipboardList
} from 'lucide-react';
import { Button } from './ui/button';
import { hasAssignedInterviews, getPendingInterviewsCount } from './utils/interviewUtils';

function InterviewPanelSidebar({ 
  onLogout, 
  isExpanded, 
  setIsExpanded,
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const [hasInterviews, setHasInterviews] = useState(false);
  const [pendingInterviewsCount, setPendingInterviewsCount] = useState(0);
  const userName = localStorage.getItem('userName') || '';

  // Check for interview assignments
  useEffect(() => {
    const updateInterviewStatus = () => {
      if (userName) {
        setHasInterviews(hasAssignedInterviews(userName));
        setPendingInterviewsCount(getPendingInterviewsCount(userName));
      }
    };

    updateInterviewStatus();
    
    // Update every 2 seconds
    const interval = setInterval(updateInterviewStatus, 2000);
    
    return () => clearInterval(interval);
  }, [userName]);

  const menuItems = [
    { id: 'dashboard',     label: 'Dashboard',     icon: LayoutDashboard, description: 'Overview & Statistics',    path: '/panel' },
    { id: 'interview-hub', label: 'Interview Hub', icon: MessageSquare,   description: 'My Assigned Interviews', path: '/panel/interview-hub', badge: pendingInterviewsCount > 0 ? pendingInterviewsCount : null },
  ];



  return (
    <motion.div
      initial={{ x: -250 }}
      animate={{ 
        x: 0,
        width: isExpanded ? 256 : 64
      }}
      transition={{ duration: 0.3 }}
      className={`fixed left-0 top-0 h-full ${
        isExpanded ? 'w-64 overflow-hidden' : 'w-16 overflow-visible'
      } bg-gradient-to-b from-indigo-900/98 via-purple-900/98 to-violet-900/98 backdrop-blur-md shadow-2xl border-r border-indigo-300/20 z-50 flex flex-col`}
    >
      {/* Header with Toggle Button */}
      <div className={`${isExpanded ? 'p-4' : 'p-3'} border-b border-indigo-300/20`}>
        <div className="flex items-center gap-3">
          <motion.button
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-12 h-12 bg-gradient-to-r from-indigo-400 to-purple-500 rounded-xl flex items-center justify-center hover:from-indigo-500 hover:to-purple-600 transition-all duration-200 shadow-lg flex-shrink-0"
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
                <Users className="w-8 h-8 text-indigo-600" />
              </div>
              <div className="flex flex-col justify-center min-w-0">
                <h1 className="text-white font-bold text-base leading-tight">
                  Interview Panel
                </h1>
                <h2 className="text-indigo-200 font-medium text-sm leading-tight">
                  Interview Management
                </h2>
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
                className="relative overflow-visible"
              >
                <motion.button
                  onClick={() => navigate(item.path)}
                  className={`w-full flex items-center ${
                    isExpanded ? 'space-x-3 px-3' : 'justify-center px-2'
                  } py-3 rounded-xl transition-all duration-200 relative group ${
                    isActive 
                      ? 'bg-gradient-to-r from-indigo-500/30 to-purple-500/30 text-white border border-indigo-400/30 shadow-lg'
                      : 'text-indigo-200 hover:bg-indigo-500/20 hover:text-white'
                  }`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-indigo-300' : ''}`} />
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
                      {item.badge && (
                        <span className="bg-red-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                          {item.badge}
                        </span>
                      )}
                    </span>
                  )}
                  {isExpanded && (
                    <motion.div 
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.2, delay: 0.1 }}
                      className="flex-1 text-left"
                    >
                      <div className="flex items-center justify-between">
                        <p className="font-medium truncate">{item.label}</p>
                        {item.badge && (
                          <span className="ml-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full min-w-[20px] text-center">
                            {item.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-indigo-300 truncate">{item.description}</p>
                    </motion.div>
                  )}
                  {!isExpanded && item.badge && (
                    <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs px-2 py-1 rounded-full min-w-[20px] text-center">
                      {item.badge}
                    </div>
                  )}
                  {isActive && !isExpanded && (
                    <motion.div
                      layoutId="activeIndicatorIP"
                      className="absolute right-1 w-1 h-8 bg-indigo-300 rounded-full"
                    />
                  )}
                </motion.button>
              </motion.div>
            );
          })}
          
          {/* No Interviews Message */}
          {!hasInterviews && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.5 }}
              className={`${
                isExpanded ? 'p-4' : 'p-2'
              } bg-indigo-500/10 rounded-lg border border-indigo-400/20 mt-4`}
            >
              {isExpanded ? (
                <div className="text-center">
                  <Calendar className="w-8 h-8 text-indigo-300 mx-auto mb-2" />
                  <p className="text-indigo-200 text-sm">No interviews assigned yet</p>
                  <p className="text-indigo-300 text-xs mt-1">
                    You'll see your interviews here when HR assigns them to you
                  </p>
                </div>
              ) : (
                <div className="text-center">
                  <Calendar className="w-6 h-6 text-indigo-300 mx-auto" />
                </div>
              )}
            </motion.div>
          )}
        </div>
      </nav>

      {/* User Info & Logout */}
      <div className={`mt-auto p-3 ${isExpanded ? 'px-3' : 'px-2'} border-t border-indigo-300/20 space-y-3`}>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="bg-indigo-500/10 rounded-lg p-3 border border-indigo-400/20"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-500 rounded-full flex items-center justify-center">
                <Users className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-medium text-sm truncate">
                  {localStorage.getItem('userName') || 'Interview Panel'}
                </p>
                <p className="text-indigo-300 text-xs truncate">Panel Member</p>
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
  );
}

export default InterviewPanelSidebar;