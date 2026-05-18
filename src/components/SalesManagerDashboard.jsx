import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card.jsx';
import { Badge } from './ui/badge.jsx';
import { Button } from './ui/button.jsx';
import { Progress } from './ui/progress.jsx';
import ResourceRequestService from './utils/resourceRequestService.js';
import {
  Target,
  TrendingUp,
  Users,
  Calendar,
  DollarSign,
  CheckCircle,
  Clock,
  AlertTriangle,
  Plus,
  Filter,
  Search,
  Eye,
  BarChart3,
  PieChart
} from 'lucide-react';

export default function SalesManagerDashboard() {
  const navigate = useNavigate();
  const [opportunityRequests, setOpportunityRequests] = useState([]);
  const [resourceRequests, setResourceRequests] = useState([]);
  const [dashboardStats, setDashboardStats] = useState({
    totalOpportunities: 0,
    activeOpportunities: 0,
    totalResourcesRequested: 0,
    approvedResources: 0,
    pendingApproval: 0,
    estimatedValue: 0
  });

  useEffect(() => {
    loadDashboardData();
    
    // Refresh data every 30 seconds
    const interval = setInterval(loadDashboardData, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadDashboardData = () => {
    try {
      // Load opportunity requests
      const storedOpportunities = localStorage.getItem('opportunityRequests');
      let opportunities = [];
      if (storedOpportunities) {
        opportunities = JSON.parse(storedOpportunities);
        setOpportunityRequests(opportunities);
      }

      // Load resource requests
      const requests = ResourceRequestService.getAllRequests();
      const salesManagerRequests = requests.filter(req => 
        req.requestedBy === 'sales-manager' || req.createdBy === 'sales-manager'
      );
      setResourceRequests(salesManagerRequests);

      // Calculate stats
      const totalOpportunities = opportunities.length;
      const activeOpportunities = opportunities.filter(opp => 
        opp.status === 'Active' || opp.status === 'In Progress'
      ).length;
      
      const totalResourcesRequested = salesManagerRequests.length;
      const approvedResources = salesManagerRequests.filter(req => 
        req.status === 'Approved' || req.status === 'Allocated'
      ).length;
      const pendingApproval = salesManagerRequests.filter(req => 
        req.status === 'Pending Approval' || req.status === 'Under Review'
      ).length;

      const estimatedValue = opportunities.reduce((total, opp) => 
        total + (parseFloat(opp.estimatedBudget) || 0), 0
      );

      setDashboardStats({
        totalOpportunities,
        activeOpportunities,
        totalResourcesRequested,
        approvedResources,
        pendingApproval,
        estimatedValue
      });

    } catch (error) {
      console.error('Error loading dashboard data:', error);
    }
  };

  const getStatusBadgeColor = (status) => {
    switch (status) {
      case 'Active':
      case 'Approved':
      case 'Allocated':
        return 'bg-green-100 text-green-800';
      case 'In Progress':
      case 'Under Review':
        return 'bg-blue-100 text-blue-800';
      case 'Pending Approval':
        return 'bg-yellow-100 text-yellow-800';
      case 'On Hold':
        return 'bg-orange-100 text-orange-800';
      case 'Closed':
      case 'Rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const navigateToOpportunities = () => navigate('/sales');
  const navigateToResourceRequests = () => navigate('/sales');

  const recentOpportunities = opportunityRequests
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 5);

  const recentResourceRequests = resourceRequests
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 5);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col gap-4"
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Sales Manager Dashboard</h1>
            <p className="text-gray-600 mt-1">
              Track opportunities, manage resource requests, and drive sales growth
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge className="bg-yellow-100 text-yellow-800">
              <Target className="h-4 w-4 mr-1" />
              Sales Manager
            </Badge>
          </div>
        </div>
      </motion.div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="border-l-4 border-l-yellow-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Opportunities</CardTitle>
              <Target className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{dashboardStats.totalOpportunities}</div>
              <p className="text-xs text-muted-foreground">Opportunity requests created</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="border-l-4 border-l-green-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Opportunities</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{dashboardStats.activeOpportunities}</div>
              <p className="text-xs text-muted-foreground">Currently in progress</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="border-l-4 border-l-blue-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Resource Requests</CardTitle>
              <Users className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{dashboardStats.totalResourcesRequested}</div>
              <p className="text-xs text-muted-foreground">Total resources requested</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="border-l-4 border-l-purple-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Estimated Value</CardTitle>
              <DollarSign className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">
                ${dashboardStats.estimatedValue.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">Total opportunity value</p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Button 
                onClick={navigateToOpportunities}
                className="h-auto p-4 flex flex-col items-center gap-2 bg-yellow-600 hover:bg-yellow-700"
              >
                <Plus className="h-6 w-6" />
                <span className="font-medium">Create Opportunity</span>
                <span className="text-xs opacity-90">New business opportunity</span>
              </Button>

              <Button 
                variant="outline" 
                className="h-auto p-4 flex flex-col items-center gap-2"
                onClick={navigateToResourceRequests}
              >
                <Users className="h-6 w-6" />
                <span className="font-medium">Request Resources</span>
                <span className="text-xs text-gray-500">For ongoing projects</span>
              </Button>

              <Button 
                variant="outline" 
                className="h-auto p-4 flex flex-col items-center gap-2"
                onClick={navigateToOpportunities}
              >
                <Target className="h-6 w-6" />
                <span className="font-medium">View Opportunities</span>
                <span className="text-xs text-gray-500">{dashboardStats.totalOpportunities} total</span>
              </Button>

              <Button 
                variant="outline" 
                className="h-auto p-4 flex flex-col items-center gap-2"
                onClick={() => navigate('/sales')}
              >
                <TrendingUp className="h-6 w-6" />
                <span className="font-medium">Sales Pipeline</span>
                <span className="text-xs text-gray-500">Track progress</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Progress Overview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        <Card>
          <CardHeader>
            <CardTitle>Resource Request Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Approved Resources</span>
                <span className="text-sm text-gray-600">
                  {dashboardStats.approvedResources} of {dashboardStats.totalResourcesRequested}
                </span>
              </div>
              <Progress 
                value={dashboardStats.totalResourcesRequested > 0 
                  ? (dashboardStats.approvedResources / dashboardStats.totalResourcesRequested) * 100 
                  : 0} 
                className="h-2"
              />
              
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <div className="text-xl font-bold text-green-600">{dashboardStats.approvedResources}</div>
                  <div className="text-sm text-green-600">Approved</div>
                </div>
                <div className="text-center p-3 bg-yellow-50 rounded-lg">
                  <div className="text-xl font-bold text-yellow-600">{dashboardStats.pendingApproval}</div>
                  <div className="text-sm text-yellow-600">Pending</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Opportunities */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.7 }}
        >
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-yellow-600" />
                Recent Opportunities
              </CardTitle>
            </CardHeader>
            <CardContent>
              {recentOpportunities.length > 0 ? (
                <div className="space-y-4">
                  {recentOpportunities.map((opportunity) => (
                    <div key={opportunity.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <div className="font-medium">{opportunity.clientName}</div>
                        <div className="text-sm text-gray-500">{opportunity.projectType}</div>
                        <div className="text-sm text-gray-500">
                          {opportunity.resourcesNeeded} resources needed
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge className={getStatusBadgeColor(opportunity.status)}>
                          {opportunity.status}
                        </Badge>
                        <div className="text-sm text-gray-500 mt-1">
                          ${parseFloat(opportunity.estimatedBudget || 0).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  ))}
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={navigateToOpportunities}
                  >
                    View All Opportunities
                  </Button>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Target className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No opportunities yet</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Create your first opportunity to get started.
                  </p>
                  <Button 
                    className="mt-4"
                    onClick={navigateToOpportunities}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Create Opportunity
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Recent Resource Requests */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.8 }}
        >
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-600" />
                Recent Resource Requests
              </CardTitle>
            </CardHeader>
            <CardContent>
              {recentResourceRequests.length > 0 ? (
                <div className="space-y-4">
                  {recentResourceRequests.map((request) => (
                    <div key={request.requestId} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <div className="font-medium">{request.position}</div>
                        <div className="text-sm text-gray-500">{request.clientName}</div>
                        <div className="text-sm text-gray-500">{request.projectName}</div>
                      </div>
                      <div className="text-right">
                        <Badge className={getStatusBadgeColor(request.status)}>
                          {request.status}
                        </Badge>
                        <div className="text-sm text-gray-500 mt-1">
                          {request.requestId}
                        </div>
                      </div>
                    </div>
                  ))}
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={navigateToResourceRequests}
                  >
                    View All Requests
                  </Button>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Users className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No resource requests</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Request resources for your opportunities.
                  </p>
                  <Button 
                    className="mt-4"
                    onClick={navigateToResourceRequests}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Request Resources
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
