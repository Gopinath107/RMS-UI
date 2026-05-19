import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, FolderOpen, Building2, Users, BarChart3,
  LogOut, Menu, DollarSign, MessageSquare
} from 'lucide-react';
import { Button } from './ui/button.jsx';
import { getPendingInterviewsCount } from './utils/interviewUtils.js';

export default function PMOSidebar({ onLogout, isExpanded, setIsExpanded }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [approvedCount, setApprovedCount] = useState(0);
  const [pendingInterviewsCount, setPendingInterviewsCount] = useState(0);
  const userName = localStorage.getItem('userName') || 'pmo';

  useEffect(() => {
    const update = () => {
      try {
        const stored = localStorage.getItem('resourceRequests');
        if (stored) {
          const requests = JSON.parse(stored);
          setApprovedCount(requests.filter(r => r.status === 'Approved').length);
        }
      } catch {}
      if (userName) setPendingInterviewsCount(getPendingInterviewsCount(userName));
    };
    update();
    const interval = setInterval(update, 3000);
    return () => clearInterval(interval);
  }, [userName]);

  const menuItems = [
    { id: 'dashboard',         label: 'PMO Dashboard',      icon: LayoutDashboard, description: 'Budget & Allocation',     path: '/pmo',                   badge: approvedCount > 0 ? approvedCount : null },
    { id: 'resource-requests', label: 'Resource Requests',  icon: Users,           description: 'Budget Approval',         path: '/pmo/resource-requests' },
    { id: 'interview-hub',     label: 'Interview Hub',      icon: MessageSquare,   description: 'My Assigned Interviews',  path: '/pmo/interview-hub',     badge: pendingInterviewsCount > 0 ? pendingInterviewsCount : null },
  ];

  return (
    <motion.div
      initial={{ x: -250 }}
      animate={{ x: 0, width: isExpanded ? 256 : 64 }}
      transition={{ duration: 0.3 }}
      className={`fixed left-0 top-0 h-full ${isExpanded ? 'w-64' : 'w-16'} bg-gradient-to-b from-purple-900/98 via-violet-900/98 to-indigo-900/98 backdrop-blur-md shadow-2xl border-r border-purple-300/20 z-50 flex flex-col`}
    >
      <div className={`${isExpanded ? 'p-4' : 'p-3'} border-b border-purple-300/20`}>
        <div className="flex items-center gap-3">
          <motion.button onClick={() => setIsExpanded(!isExpanded)} className="w-12 h-12 bg-gradient-to-r from-purple-400 to-violet-500 rounded-xl flex items-center justify-center hover:from-purple-500 hover:to-violet-600 transition-all duration-200 shadow-lg flex-shrink-0" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Menu className="w-6 h-6 text-white" />
          </motion.button>
          {isExpanded && (
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.2, delay: 0.1 }} className="flex items-center gap-3 flex-1 min-w-0">
              <div className="w-16 h-16 bg-white rounded-xl flex items-center justify-center shadow-lg flex-shrink-0"><BarChart3 className="w-8 h-8 text-purple-600" /></div>
              <div className="flex flex-col justify-center min-w-0">
                <h1 className="text-white font-bold text-base leading-tight">PMO</h1>
                <h2 className="text-purple-200 font-medium text-sm leading-tight">Project Management Office</h2>
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* Navigation Menu */}
      <nav
        className={`mt-4 flex-1 hide-scrollbar ${isExpanded
          ? 'px-3 overflow-y-auto overflow-x-hidden'
          : 'px-2 overflow-visible'
          }`}
      >
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
                  className={`w-full flex items-center ${isExpanded ? 'space-x-3 px-3' : 'justify-center px-2'} py-3 rounded-xl transition-all duration-200 relative group ${isActive ? 'bg-gradient-to-r from-purple-500/30 to-violet-500/30 text-white border border-purple-400/30 shadow-lg' : 'text-purple-200 hover:bg-purple-500/20 hover:text-white'}`}
                  whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                >
                  <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-purple-300' : ''}`} />
                  
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

                  {/* EXPANDED: label + description inline */}
                  {isExpanded && (
                    <>
                      <motion.div
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.2, delay: 0.1 }}
                        className="flex-1 text-left"
                      >
                        <p className="font-medium truncate">{item.label}</p>
                        <p className="text-xs text-purple-300 truncate">{item.description}</p>
                      </motion.div>
                      {item.badge && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center text-xs font-bold text-white"
                        >
                          {item.badge}
                        </motion.div>
                      )}
                    </>
                  )}

                  {/* Active indicator bar (collapsed only) */}
                  {isActive && !isExpanded && (
                    <motion.div
                      layoutId="activeIndicatorPMO"
                      className="absolute right-1 w-1 h-8 bg-purple-300 rounded-full"
                    />
                  )}
                </motion.button>
              </motion.div>
            );
          })}
        </div>
      </nav>

      <div className={`mt-auto p-3 ${isExpanded ? 'px-3' : 'px-2'} border-t border-purple-300/20 space-y-3`}>
        {isExpanded && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="bg-purple-500/10 rounded-lg p-3 border border-purple-400/20">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center"><DollarSign className="w-5 h-5 text-white" /></div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-medium text-sm truncate">{localStorage.getItem('userName') || 'PMO Manager'}</p>
                <p className="text-purple-300 text-xs truncate">Project Management Office</p>
              </div>
            </div>
          </motion.div>
        )}
        <Button onClick={onLogout} variant="outline" className={`w-full flex items-center ${isExpanded ? 'space-x-3 px-4' : 'justify-center px-2'} py-3 border-red-300/30 bg-red-500/10 text-red-200 hover:bg-red-500/20 hover:border-red-300/50 hover:text-white transition-all duration-200`} title={!isExpanded ? 'Logout' : undefined}>
          <LogOut className="w-5 h-5" />
          {isExpanded && <motion.span initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.2, delay: 0.1 }} className="truncate">Logout</motion.span>}
        </Button>
      </div>
    </motion.div>
  );
}
