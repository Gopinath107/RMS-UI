import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card.jsx';
import { Users, Building2, Database, Activity, Server, AlertTriangle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';

const SystemAdminDashboard = () => {
  const navigate = useNavigate();
  // Mock data for charts
  const userActivityData = [
    { month: 'Jan', active: 45, new: 12 },
    { month: 'Feb', active: 52, new: 15 },
    { month: 'Mar', active: 49, new: 8 },
    { month: 'Apr', active: 58, new: 18 },
    { month: 'May', active: 62, new: 21 },
    { month: 'Jun', active: 55, new: 14 },
  ];

  const systemHealthData = [
    { name: 'API Response', value: 98.5 },
    { name: 'Database', value: 99.2 },
    { name: 'Server Uptime', value: 99.8 },
    { name: 'Storage', value: 95.3 },
  ];

  const roleDistribution = [
    { name: 'Project Managers', value: 25, color: '#10B981' },
    { name: 'HR Managers', value: 8, color: '#3B82F6' },
    { name: 'Resources', value: 120, color: '#8B5CF6' },
    { name: 'PMO', value: 5, color: '#F59E0B' },
    { name: 'Portfolio', value: 3, color: '#EF4444' },
  ];

  const systemAlerts = [
    { id: 1, type: 'warning', message: 'Database connection pool at 85%', time: '5 min ago' },
    { id: 2, type: 'info', message: 'Scheduled backup completed successfully', time: '1 hour ago' },
    { id: 3, type: 'error', message: 'Failed login attempts detected', time: '2 hours ago' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-red-600">System Administration</h1>
          <p className="text-gray-600 mt-1">System health, user management, and configuration overview</p>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          <span className="text-gray-600">All systems operational</span>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/admin')}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">161</div>
            <p className="text-xs text-muted-foreground">+12 from last month</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/admin')}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Clients</CardTitle>
            <Building2 className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">24</div>
            <p className="text-xs text-muted-foreground">+3 new this month</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/admin')}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Resources</CardTitle>
            <Database className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">120</div>
            <p className="text-xs text-muted-foreground">85% utilization</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Health</CardTitle>
            <Activity className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">99.1%</div>
            <p className="text-xs text-muted-foreground">Average uptime</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Activity Chart */}
        <Card>
          <CardHeader>
            <CardTitle>User Activity Trends</CardTitle>
            <CardDescription>Monthly active users and new registrations</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={userActivityData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="active" fill="#dc2626" name="Active Users" />
                  <Bar dataKey="new" fill="#ef4444" name="New Users" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* System Health Metrics */}
        <Card>
          <CardHeader>
            <CardTitle>System Performance</CardTitle>
            <CardDescription>Real-time system health indicators</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {systemHealthData.map((metric, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-sm font-medium">{metric.name}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-2 bg-gray-200 rounded-full">
                      <div 
                        className="h-2 bg-red-500 rounded-full" 
                        style={{ width: `${metric.value}%` }}
                      ></div>
                    </div>
                    <span className="text-sm text-gray-600 w-12 text-right">{metric.value}%</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Role Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>User Role Distribution</CardTitle>
            <CardDescription>Current user distribution across roles</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={roleDistribution}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {roleDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* System Alerts */}
        <Card>
          <CardHeader>
            <CardTitle>System Alerts</CardTitle>
            <CardDescription>Recent system notifications and alerts</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {systemAlerts.map((alert) => (
                <div key={alert.id} className="flex items-start gap-3 p-3 rounded-lg border">
                  <div className={`w-2 h-2 rounded-full mt-2 ${
                    alert.type === 'error' ? 'bg-red-500' :
                    alert.type === 'warning' ? 'bg-yellow-500' : 'bg-blue-500'
                  }`}></div>
                  <div className="flex-1">
                    <p className="text-sm">{alert.message}</p>
                    <p className="text-xs text-gray-500 mt-1">{alert.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common administrative tasks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button 
              onClick={() => navigate('/admin')}
              className="p-4 border-2 border-dashed border-red-200 rounded-lg hover:border-red-400 hover:bg-red-50 transition-colors"
            >
              <Users className="w-6 h-6 text-red-600 mx-auto mb-2" />
              <p className="text-sm font-medium">User Management</p>
              <p className="text-xs text-gray-500 mt-1">Manage user accounts and roles</p>
            </button>

            <button 
              onClick={() => navigate('/admin/system-settings')}
              className="p-4 border-2 border-dashed border-red-200 rounded-lg hover:border-red-400 hover:bg-red-50 transition-colors"
            >
              <Server className="w-6 h-6 text-red-600 mx-auto mb-2" />
              <p className="text-sm font-medium">System Settings</p>
              <p className="text-xs text-gray-500 mt-1">Configure system parameters</p>
            </button>

            <button 
              onClick={() => navigate('/admin')}
              className="p-4 border-2 border-dashed border-red-200 rounded-lg hover:border-red-400 hover:bg-red-50 transition-colors"
            >
              <Building2 className="w-6 h-6 text-red-600 mx-auto mb-2" />
              <p className="text-sm font-medium">Client Management</p>
              <p className="text-xs text-gray-500 mt-1">Manage client accounts</p>
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SystemAdminDashboard;
