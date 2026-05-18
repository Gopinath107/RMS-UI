import React from 'react';
import { useNavigate } from 'react-router-dom';
import { getDashboardPath } from '../config/routes.js';
import { motion } from 'motion/react';

export default function NotFound() {
  const navigate = useNavigate();
  const userRole = localStorage.getItem('userRole') || '';
  const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';

  const handleGoHome = () => {
    if (isAuthenticated && userRole) {
      navigate(getDashboardPath(userRole));
    } else {
      navigate('/login');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center px-6 max-w-md"
      >
        {/* Large 404 */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mb-6"
        >
          <span className="text-[120px] font-black leading-none bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent select-none">
            404
          </span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-2xl font-bold text-white mb-3"
        >
          Page Not Found
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-slate-400 mb-8 text-sm leading-relaxed"
        >
          The page you're looking for doesn't exist or you don't have permission to view it.
        </motion.p>

        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.97 }}
          onClick={handleGoHome}
          className="px-8 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white font-semibold shadow-lg transition-all duration-200"
        >
          {isAuthenticated ? '← Back to Dashboard' : 'Go to Login'}
        </motion.button>
      </motion.div>
    </div>
  );
}
