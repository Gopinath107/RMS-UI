import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Calendar,
  MessageSquare,
  Users,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  TrendingUp,
  Award,
  Target,
  RefreshCw
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card.jsx';
import { Button } from './ui/button.jsx';
import { Badge } from './ui/badge.jsx';
import { Skeleton } from './ui/skeleton.jsx'; // Assuming shadcn/ui has Skeleton; add if needed
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip.jsx'; // For tooltips
import { InterviewService } from '../services/InterviewManagementService.js'; // Adjust path as needed
import { PieChart, Pie, Cell, Tooltip as RechartsTooltip, Legend, ResponsiveContainer } from 'recharts';

export default function InterviewPanelDashboard({ setCurrentPage }) {
  const [interviews, setInterviews] = useState([]);
  const [dashboardStats, setDashboardStats] = useState({
    totalAssigned: 0,
    pendingReview: 0,
    completed: 0,
    todayScheduled: 0
  });
  const [currentUser, setCurrentUser] = useState('panel');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Set current user based on role
    const userRole = localStorage.getItem('userRole');
    const userName = localStorage.getItem('userName');
    if (userRole && userName) {
      setCurrentUser(userName);
    } else {
      const defaultUsers = {
        'project-manager': 'pm',
        'hr': 'hr',
        'pmo': 'pmo',
        'portfolio-manager': 'portfolio',
        'sales-manager': 'sales',
        'interview-panel': 'panel'
      };
      setCurrentUser(defaultUsers[userRole] || 'panel');
    }
  }, []);

  const fetchData = async () => {
    if (!currentUser) return;
    setLoading(true);
    setError(null);
    try {
      const response = await InterviewService.fetchInterviewList();
      const allInterviews = response.data.result || []; // Adjusted to .result based on sample response
      
      // Transform data to match expected structure
      const transformedInterviews = allInterviews.map(interview => {
        const scheduledAtParts = interview.scheduledAt ? interview.scheduledAt.split(' ') : [];
        const dateStr = scheduledAtParts[0] || '';
        const timeStr = scheduledAtParts[1] || '';
        const dateParts = dateStr.split('-');
        const date = dateParts.length === 3 ? `${dateParts[2]}-${dateParts[1]}-${dateParts[0]}` : ''; // YYYY-MM-DD
        const time = timeStr.replace('-', ':');

        // Determine clearanceStatus
        let clearanceStatus = 'Pending';
        if (interview.levelProgress) {
          const allCleared = interview.levelProgress.every(level => 
            level.status === 'Completed' && level.feedback?.startsWith('Cleared')
          );
          const anyNotCleared = interview.levelProgress.some(level => 
            level.feedback?.startsWith('Not Cleared')
          );
          if (allCleared) clearanceStatus = 'Cleared';
          else if (anyNotCleared) clearanceStatus = 'Not Cleared';
        }

        return {
          ...interview,
          candidateName: interview.employeeName || interview.candidateName || 'Unknown',
          position: interview.interviewType || interview.projectName?.trim() || 'Unknown',
          companyName: interview.companyName || 'Unknown',
          date,
          time,
          status: interview.status || 'Unknown',
          clearanceStatus,
          interviewer: interview.interviewerName // For filtering
        };
      });

      // Filter interviews assigned to current user
      let assignedInterviews;
      if (currentUser === 'panel') {
        // For 'panel', show all (or adjust if needed to exclude managers)
        assignedInterviews = transformedInterviews;
      } else {
        assignedInterviews = transformedInterviews.filter(interview => 
          interview.interviewerName === currentUser
        );
      }

      setInterviews(assignedInterviews);

      // Calculate stats
      const today = new Date().toISOString().split('T')[0];
      const stats = {
        totalAssigned: assignedInterviews.length,
        pendingReview: assignedInterviews.filter(i => 
          i.status === 'Scheduled' || i.status === 'Pending Feedback'
        ).length,
        completed: assignedInterviews.filter(i => i.status === 'Completed').length,
        todayScheduled: assignedInterviews.filter(i => 
          i.date === today && i.status === 'Scheduled'
        ).length
      };

      setDashboardStats(stats);
    } catch (err) {
      console.error('Error fetching interviews:', err);
      setError('Failed to load interviews. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [currentUser]);

  const handleNavigateToHub = () => {
    if (setCurrentPage) {
      setCurrentPage('interview-hub');
    }
  };

  const getUpcomingInterviews = () => {
    const today = new Date();
    return interviews
      .filter(interview => {
        const interviewDate = new Date(interview.date);
        return interviewDate >= today && interview.status === 'Scheduled';
      })
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .slice(0, 5);
  };

  const getRecentResults = () => {
    return interviews
      .filter(interview => interview.status === 'Completed' && interview.clearanceStatus)
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 5);
  };

  const upcomingInterviews = getUpcomingInterviews();
  const recentResults = getRecentResults();

  // Chart data for stats
  const chartData = [
    { name: 'Assigned', value: dashboardStats.totalAssigned },
    { name: 'Pending', value: dashboardStats.pendingReview },
    { name: 'Completed', value: dashboardStats.completed },
  ];
  const COLORS = ['#3B82F6', '#EAB308', '#22C55E'];

  if (loading) {
    return (
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        <Skeleton className="h-10 w-1/3" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-32" />)}
        </div>
        <Skeleton className="h-48" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <Card className="border-red-500">
          <CardHeader>
            <CardTitle className="text-red-600">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p>{error}</p>
            <Button onClick={fetchData} className="mt-4">Retry</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 bg-gradient-to-b from-gray-50 to-white">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col gap-4"
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Interview Panel Dashboard</h1>
            <p className="text-grey-600 mt-1">
              Welcome {currentUser}, manage your interview assignments and provide feedback
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Badge className="bg-indigo-100 text-indigo-800">
              <Award className="h-4 w-4 mr-1" />
              Interview Panel
            </Badge>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <Button variant="outline" size="icon" onClick={fetchData}>
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Refresh Data</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      </motion.div>

      {/* Quick Stats with hover effects */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { title: 'Total Assigned', icon: Users, color: 'blue', value: dashboardStats.totalAssigned, desc: 'Interview assignments' },
          { title: 'Pending Review', icon: AlertCircle, color: 'yellow', value: dashboardStats.pendingReview, desc: 'Awaiting your feedback' },
          { title: 'Completed', icon: CheckCircle, color: 'green', value: dashboardStats.completed, desc: 'Interviews completed' },
          { title: 'Today\'s Schedule', icon: Calendar, color: 'orange', value: dashboardStats.todayScheduled, desc: 'Interviews scheduled today' },
        ].map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 * (index + 1) }}
            whileHover={{ scale: 1.05 }}
          >
            <Card className={`border-l-4 border-l-${stat.color}-500 shadow-md hover:shadow-lg transition-shadow`}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <stat.icon className={`h-4 w-4 text-${stat.color}-600`} />
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold text-${stat.color}-600`}>{stat.value}</div>
                <p className="text-xs text-muted-foreground">{stat.desc}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Quick Actions with improved layout */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>
              Access your interview tools and resources
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button 
                onClick={handleNavigateToHub}
                className="h-auto p-4 flex flex-col items-center gap-2 bg-indigo-600 hover:bg-indigo-700 transition-colors"
              >
                <MessageSquare className="h-6 w-6" />
                <span className="font-medium">Interview Hub</span>
                <span className="text-xs opacity-90">Manage assignments & results</span>
              </Button>

              <Button 
                variant="outline" 
                className="h-auto p-4 flex flex-col items-center gap-2 hover:bg-gray-50 transition-colors"
                onClick={handleNavigateToHub}
              >
                <Clock className="h-6 w-6" />
                <span className="font-medium">Today's Schedule</span>
                <span className="text-xs text-gray-500">{dashboardStats.todayScheduled} interviews</span>
              </Button>

              <Button 
                variant="outline" 
                className="h-auto p-4 flex flex-col items-center gap-2 hover:bg-gray-50 transition-colors"
                onClick={handleNavigateToHub}
              >
                <TrendingUp className="h-6 w-6" />
                <span className="font-medium">Performance</span>
                <span className="text-xs text-gray-500">View your results</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Interviews with urgency badges */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Card className="h-full shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-blue-600" />
                Upcoming Interviews
              </CardTitle>
              <CardDescription>
                Your scheduled interview assignments
              </CardDescription>
            </CardHeader>
            <CardContent>
              {upcomingInterviews.length > 0 ? (
                <div className="space-y-4">
                  {upcomingInterviews.map((interview) => {
                    const isToday = interview.date === new Date().toISOString().split('T')[0];
                    return (
                      <motion.div 
                        key={interview.interviewId} 
                        className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors"
                        whileHover={{ scale: 1.02 }}
                      >
                        <div className="flex-1">
                          <div className="font-medium">{interview.candidateName}</div>
                          <div className="text-sm text-gray-500">{interview.position}</div>
                          <div className="text-sm text-gray-500">{interview.companyName}</div>
                          <div className="flex items-center gap-2 text-xs text-gray-400 mt-1">
                            <Calendar className="h-3 w-3" />
                            {interview.date}
                            <Clock className="h-3 w-3 ml-2" />
                            {interview.time}
                            {isToday && <Badge variant="destructive" className="ml-2">Today</Badge>}
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge className="mb-2">
                            {interview.requestId}
                          </Badge>
                          <div className="text-xs text-gray-500">
                            Levels: {interview.interviewLevels?.join(', ') || 'L1'}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                  {upcomingInterviews.length >= 5 && (
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={handleNavigateToHub}
                    >
                      View All Scheduled
                    </Button>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Calendar className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No upcoming interviews</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    You don't have any interviews scheduled at the moment.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Recent Results */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.7 }}
        >
          <Card className="h-full shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5 text-green-600" />
                Recent Results
              </CardTitle>
              <CardDescription>
                Your latest interview outcomes
              </CardDescription>
            </CardHeader>
            <CardContent>
              {recentResults.length > 0 ? (
                <div className="space-y-4">
                  {recentResults.map((interview) => (
                    <motion.div 
                      key={interview.interviewId} 
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors"
                      whileHover={{ scale: 1.02 }}
                    >
                      <div className="flex-1">
                        <div className="font-medium">{interview.candidateName}</div>
                        <div className="text-sm text-gray-500">{interview.position}</div>
                        <div className="text-sm text-gray-500">{interview.companyName}</div>
                        <div className="text-xs text-gray-400 mt-1">{interview.date}</div>
                      </div>
                      <div className="text-right">
                        <Badge 
                          className={
                            interview.clearanceStatus === 'Cleared' 
                              ? 'bg-green-100 text-green-800'
                              : interview.clearanceStatus === 'Not Cleared'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-gray-100 text-gray-800'
                          }
                        >
                          {interview.clearanceStatus || 'Pending'}
                        </Badge>
                        <div className="text-xs text-gray-500 mt-1">
                          {interview.requestId}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                  {recentResults.length >= 5 && (
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={handleNavigateToHub}
                    >
                      View All Results
                    </Button>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Award className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No results yet</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Complete interviews to see results here.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Performance Summary with pie chart */}
      {dashboardStats.completed > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
        >
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-blue-600" />
                Performance Overview
              </CardTitle>
              <CardDescription>
                Your interview statistics and performance metrics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{dashboardStats.totalAssigned}</div>
                  <div className="text-sm text-gray-600">Total Assigned</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{dashboardStats.completed}</div>
                  <div className="text-sm text-gray-600">Completed</div>
                </div>
                <div className="text-center p-4 bg-yellow-50 rounded-lg">
                  <div className="text-2xl font-bold text-yellow-600">{dashboardStats.pendingReview}</div>
                  <div className="text-sm text-gray-600">Pending Review</div>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}
